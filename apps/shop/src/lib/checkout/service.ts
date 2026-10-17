import "server-only";

import { randomBytes } from "node:crypto";
import { db, Prisma } from "@set25/database";
import { releaseExpiredReservations } from "@set25/database/inventory";
import { discountAmount, findAmbassadorDiscount } from "../discount";
import { priceCart, type CartRequestItem } from "../pricing";
import type { CheckoutDetails } from "./validation";

// The one server-authoritative Store checkout transaction. Nothing the browser
// sends is trusted except variant IDs, quantities, and the customer's own
// contact details.

export class CheckoutError extends Error {
  constructor(
    public code:
      | "CLOSED"
      | "DELIVERY"
      | "EMPTY"
      | "UNAVAILABLE"
      | "STOCK"
      | "DISCOUNT",
    public detail?: string,
  ) {
    super(code);
  }
}

export type PlacedOrder = {
  token: string;
  orderNumber: number;
  total: string;
  duplicate: boolean;
};

const TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

function storeKey(checkoutKey: string) {
  return `store:${checkoutKey}`;
}

async function existingOrder(checkoutKey: string) {
  const order = await db.order.findUnique({
    where: { idempotencyKey: storeKey(checkoutKey) },
    select: { publicToken: true, orderNumber: true, total: true },
  });
  return order?.publicToken
    ? {
        token: order.publicToken,
        orderNumber: order.orderNumber,
        total: order.total.toString(),
        duplicate: true,
      }
    : null;
}

export async function placeStoreOrder(
  details: CheckoutDetails,
  items: CartRequestItem[],
): Promise<PlacedOrder> {
  // A retried submission returns the order it already created.
  const previous = await existingOrder(details.checkoutKey);
  if (previous) return previous;
  if (!items.length) throw new CheckoutError("EMPTY");

  const publicToken = randomBytes(32).toString("base64url");
  try {
    return await db.$transaction(async (transaction) => {
      const now = new Date();
      const settings = await transaction.storeSettings.findUnique({
        where: { id: "store" },
        select: { storeOpen: true, reservationHours: true },
      });
      if (!settings?.storeOpen) throw new CheckoutError("CLOSED");
      const delivery = await transaction.deliveryOption.findFirst({
        where: { id: details.deliveryOptionId, active: true },
        select: { id: true, name: true, price: true },
      });
      if (!delivery) throw new CheckoutError("DELIVERY");

      // Lock the variant rows (in a stable order to avoid deadlocks) so
      // concurrent checkouts and HQ stock changes for the same variants run
      // one at a time. Reservation totals read after this are current.
      const variantIds = [...new Set(items.map((item) => item.variantId))].sort();
      await transaction.$queryRaw`
        SELECT "id" FROM "ProductVariant"
        WHERE "id" IN (${Prisma.join(variantIds)})
        ORDER BY "id"
        FOR UPDATE`;
      // An identical submission may have committed while this one waited for
      // the lock; return that order rather than re-checking its own stock.
      const winner = await transaction.order.findUnique({
        where: { idempotencyKey: storeKey(details.checkoutKey) },
        select: { publicToken: true, orderNumber: true, total: true },
      });
      if (winner?.publicToken)
        return {
          token: winner.publicToken,
          orderNumber: winner.orderNumber,
          total: winner.total.toString(),
          duplicate: true,
        };
      await releaseExpiredReservations(transaction, variantIds, now);

      const { lines, subtotal } = await priceCart(transaction, items, now);
      const unavailable = lines.find(
        (line) => line.problem === "UNAVAILABLE",
      );
      if (unavailable) throw new CheckoutError("UNAVAILABLE");
      const short = lines.find((line) => line.problem);
      if (short) throw new CheckoutError("STOCK", short.productName);

      const discount = details.discountCode
        ? await findAmbassadorDiscount(transaction, details.discountCode)
        : null;
      if (details.discountCode && !discount)
        throw new CheckoutError("DISCOUNT");
      const discountValue = discount
        ? discountAmount(subtotal, discount.percent)
        : new Prisma.Decimal(0);
      const total = subtotal.minus(discountValue).plus(delivery.price);

      // Reuse the oldest Customer with the same normalised phone. The
      // advisory lock stops two simultaneous first orders from the same
      // phone creating two Customers. Existing Customer details are never
      // overwritten from the public form; the order keeps its own snapshot.
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtext(${`customer-phone:${details.phoneKey}`}))`;
      const customer =
        (await transaction.customer.findFirst({
          where: { phoneKey: details.phoneKey },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        })) ??
        (await transaction.customer.create({
          data: {
            name: details.name,
            phone: details.phone,
            phoneKey: details.phoneKey,
            email: details.email,
            instagramHandle: details.instagramHandle,
          },
          select: { id: true },
        }));

      const order = await transaction.order.create({
        data: {
          type: "STANDARD",
          source: "ONLINE",
          customerId: customer.id,
          subtotal,
          discountAmount: discountValue,
          deliveryFee: delivery.price,
          total,
          idempotencyKey: storeKey(details.checkoutKey),
          publicToken,
          intendedPaymentMethod: details.paymentMethod,
          ...(discount
            ? {
                discountSource: "AMBASSADOR_CODE" as const,
                discountCode: discount.code,
                discountPercent: discount.percent,
                ambassadorId: discount.ambassadorId,
              }
            : {}),
          lines: {
            create: lines.map((line) => ({
              variantId: line.variantId,
              productName: line.productName,
              productCode: line.productCode,
              sku: line.sku,
              size: line.size,
              color: line.color,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              unitCost: line.unitCost,
              lineTotal: line.lineTotal,
            })),
          },
          delivery: {
            create: {
              recipientName: details.name,
              phone: details.phone,
              email: details.email,
              instagramHandle: details.instagramHandle,
              address: details.address,
              area: details.area,
              notes: details.notes,
              deliveryOptionId: delivery.id,
              methodName: delivery.name,
            },
          },
        },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          lines: { select: { id: true, variantId: true, quantity: true } },
        },
      });

      // Hold the ordered units. stockOnHand is not changed here; HQ
      // completion deducts it once and consumes these reservations.
      const expiresAt = new Date(
        now.getTime() + settings.reservationHours * 60 * 60 * 1000,
      );
      await transaction.stockReservation.createMany({
        data: order.lines.map((line) => ({
          orderId: order.id,
          orderLineId: line.id,
          variantId: line.variantId!,
          quantity: line.quantity,
          expiresAt,
        })),
      });

      return {
        token: publicToken,
        orderNumber: order.orderNumber,
        total: order.total.toString(),
        duplicate: false,
      };
    }, TRANSACTION_OPTIONS);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // A concurrent identical submission won; return its order.
      const winner = await existingOrder(details.checkoutKey);
      if (winner) return winner;
    }
    throw error;
  }
}
