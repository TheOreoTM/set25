import "server-only";

import { db, Prisma } from "@set25/database";
import {
  getPaymentStatus,
  type CheckoutPaymentMethodValue,
  type FulfilmentStatusValue,
} from "@set25/shared";

// Public order projection, reachable only with the unguessable token. It never
// includes staff, cost, supplier, internal notes, or payment references.

export const ORDER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type PublicOrder = {
  orderNumber: number;
  placedAt: string;
  fulfilmentStatus: FulfilmentStatusValue;
  paid: boolean;
  firstName: string;
  paymentMethod: CheckoutPaymentMethodValue | null;
  /** Stock hold for an unpaid order: until a time, open-ended, or expired. */
  hold:
    | { state: "until"; until: string }
    | { state: "held" }
    | { state: "expired" }
    | { state: "none" };
  lines: Array<{
    name: string;
    variantLabel: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  subtotal: string;
  discountAmount: string;
  discountCode: string | null;
  deliveryFee: string;
  total: string;
  delivery: {
    methodName: string;
    area: string;
    address: string;
    notes: string | null;
  } | null;
};

export async function getPublicOrder(token: string): Promise<PublicOrder | null> {
  if (!ORDER_TOKEN_PATTERN.test(token)) return null;
  const order = await db.order.findUnique({
    where: { publicToken: token },
    select: {
      orderNumber: true,
      createdAt: true,
      fulfilmentStatus: true,
      intendedPaymentMethod: true,
      subtotal: true,
      discountAmount: true,
      discountCode: true,
      deliveryFee: true,
      total: true,
      lines: {
        orderBy: { createdAt: "asc" },
        select: {
          productName: true,
          size: true,
          color: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
      },
      delivery: {
        select: {
          recipientName: true,
          methodName: true,
          area: true,
          address: true,
          notes: true,
        },
      },
      payments: { select: { type: true, amount: true } },
      reservations: {
        where: { status: "ACTIVE" },
        select: { expiresAt: true },
      },
    },
  });
  if (!order) return null;
  const paid = order.payments.reduce(
    (sum, payment) =>
      payment.type === "PAYMENT"
        ? sum.plus(payment.amount)
        : sum.minus(payment.amount),
    new Prisma.Decimal(0),
  );
  const now = new Date();
  const expiries = order.reservations
    .map((reservation) => reservation.expiresAt)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => a.getTime() - b.getTime());
  let hold: PublicOrder["hold"] = { state: "none" };
  if (order.reservations.length) {
    if (expiries.length < order.reservations.length) hold = { state: "held" };
    else if (expiries[0] > now)
      hold = { state: "until", until: expiries[0].toISOString() };
    else hold = { state: "expired" };
  }
  return {
    orderNumber: order.orderNumber,
    placedAt: order.createdAt.toISOString(),
    fulfilmentStatus: order.fulfilmentStatus,
    paid: getPaymentStatus(order.total, paid) === "PAID",
    firstName: order.delivery?.recipientName.split(/\s+/)[0] ?? "there",
    paymentMethod: order.intendedPaymentMethod,
    hold,
    lines: order.lines.map((line) => ({
      name: line.productName,
      variantLabel:
        [line.color, line.size].filter(Boolean).join(" / ") || "Standard",
      quantity: line.quantity,
      unitPrice: line.unitPrice.toFixed(2),
      lineTotal: line.lineTotal.toFixed(2),
    })),
    subtotal: order.subtotal.toFixed(2),
    discountAmount: order.discountAmount.toFixed(2),
    discountCode: order.discountCode,
    deliveryFee: order.deliveryFee.toFixed(2),
    total: order.total.toFixed(2),
    delivery: order.delivery
      ? {
          methodName: order.delivery.methodName,
          area: order.delivery.area,
          address: order.delivery.address,
          notes: order.delivery.notes,
        }
      : null,
  };
}
