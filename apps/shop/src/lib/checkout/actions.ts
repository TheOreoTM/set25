"use server";

import { redirect } from "next/navigation";
import { db, Prisma } from "@set25/database";
import { formatOrderNumber } from "@set25/shared";
import { discountAmount, findAmbassadorDiscount } from "../discount";
import { sendOrderConfirmation } from "../messaging";
import { normalizeCartItems, priceCart, type LineProblem } from "../pricing";
import { rateLimit } from "../rate-limit";
import { CheckoutError, placeStoreOrder } from "./service";
import { validateCheckout, type CheckoutFormState } from "./validation";

export type QuoteLine = {
  variantId: string;
  name: string;
  slug: string;
  variantLabel: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  problem: LineProblem | null;
};

export type CartQuote = {
  ok: true;
  lines: QuoteLine[];
  subtotal: string;
  deliveryFee: string | null;
  discount:
    | { status: "none" }
    | { status: "invalid" }
    | { status: "applied"; code: string; percent: string; amount: string };
  total: string;
};

type QuoteFailure = { ok: false; message: string };

/**
 * Authoritative, uncached cart pricing for the cart and checkout summaries.
 * The checkout transaction recalculates everything again.
 */
export async function quoteCartAction(input: {
  items: unknown;
  deliveryOptionId?: string;
  discountCode?: string;
}): Promise<CartQuote | QuoteFailure> {
  if (!(await rateLimit("quote", 120, 10 * 60 * 1000)))
    return { ok: false, message: "Too many requests. Wait a moment." };
  const items = normalizeCartItems(input.items);
  if (!items) return { ok: false, message: "Your bag could not be read." };

  const { lines, subtotal } = await priceCart(db, items);
  let deliveryFee: Prisma.Decimal | null = null;
  if (input.deliveryOptionId) {
    const option = await db.deliveryOption.findFirst({
      where: { id: input.deliveryOptionId, active: true },
      select: { price: true },
    });
    deliveryFee = option?.price ?? null;
  }

  let discount: CartQuote["discount"] = { status: "none" };
  let discountValue = new Prisma.Decimal(0);
  const code = input.discountCode?.trim();
  if (code) {
    // Discount checks are rate-limited separately so codes cannot be
    // enumerated quickly.
    const allowed = await rateLimit("discount", 20, 10 * 60 * 1000);
    const applied = allowed ? await findAmbassadorDiscount(db, code) : null;
    if (applied) {
      discountValue = discountAmount(subtotal, applied.percent);
      discount = {
        status: "applied",
        code: applied.code,
        percent: applied.percent.toString(),
        amount: discountValue.toFixed(2),
      };
    } else discount = { status: "invalid" };
  }

  return {
    ok: true,
    lines: lines.map((line) => ({
      variantId: line.variantId,
      name: line.productName,
      slug: line.slug,
      variantLabel:
        [line.color, line.size].filter(Boolean).join(" / ") || "Standard",
      quantity: line.quantity,
      unitPrice: line.unitPrice.toFixed(2),
      lineTotal: line.lineTotal.toFixed(2),
      problem: line.problem,
    })),
    subtotal: subtotal.toFixed(2),
    deliveryFee: deliveryFee?.toFixed(2) ?? null,
    discount,
    total: subtotal
      .minus(discountValue)
      .plus(deliveryFee ?? 0)
      .toFixed(2),
  };
}

function failure(
  message: string,
  errors?: Record<string, string[]>,
): CheckoutFormState {
  return { status: "error", message, errors };
}

export async function placeOrderAction(
  _state: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  if (!(await rateLimit("checkout", 10, 10 * 60 * 1000)))
    return failure(
      "Too many checkout attempts. Please wait a few minutes and try again.",
    );
  const result = validateCheckout(formData);
  if (!result.success)
    return Object.keys(result.errors).length
      ? failure("Check the highlighted details.", result.errors)
      : failure("Your checkout session expired. Refresh the page and try again.");
  const items = normalizeCartItems(result.data.cart);
  if (!items?.length)
    return failure("Your bag is empty or could not be read. Review your bag.");

  let placed: Awaited<ReturnType<typeof placeStoreOrder>>;
  try {
    placed = await placeStoreOrder(result.data, items);
  } catch (error) {
    if (error instanceof CheckoutError) {
      if (error.code === "CLOSED")
        return failure("Online ordering is temporarily unavailable.");
      if (error.code === "DELIVERY")
        return failure("Choose an available delivery option.", {
          deliveryOptionId: ["This delivery option is no longer available."],
        });
      if (error.code === "EMPTY") return failure("Your bag is empty.");
      if (error.code === "UNAVAILABLE")
        return failure(
          "An item in your bag is no longer available. Review your bag and try again.",
        );
      if (error.code === "STOCK")
        return failure(
          `${error.detail ?? "An item"} no longer has enough stock for your quantity. Review your bag and try again.`,
        );
      if (error.code === "DISCOUNT")
        return failure("That discount code is not valid.", {
          discountCode: ["This code is not valid. Remove it to continue."],
        });
    }
    console.error(error);
    return failure(
      "We could not place your order. Nothing was charged. Please try again.",
    );
  }

  if (!placed.duplicate)
    await sendOrderConfirmation({
      orderNumber: formatOrderNumber(placed.orderNumber),
      recipientName: result.data.name,
      phone: result.data.phone,
      email: result.data.email,
      total: placed.total,
      orderUrlPath: `/order/${placed.token}`,
    }).catch((error) => console.error(error));

  redirect(`/order/${placed.token}?placed=1`);
}
