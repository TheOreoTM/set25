import "server-only";

import { Prisma } from "@set25/database";

export type AppliedDiscount = {
  ambassadorId: string;
  code: string;
  percent: Prisma.Decimal;
};

/** Same rule as HQ ambassador codes: trimmed and uppercase. */
export function normalizeDiscountCode(value: string) {
  return value.trim().toUpperCase();
}

/**
 * Resolves a customer-entered code to an ACTIVE ambassador with a valid
 * percentage. Returns null for unknown, inactive, or unusable codes without
 * saying which.
 */
export async function findAmbassadorDiscount(
  client: Prisma.TransactionClient,
  input: string,
): Promise<AppliedDiscount | null> {
  const code = normalizeDiscountCode(input);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return null;
  const ambassador = await client.ambassador.findUnique({
    where: { discountCode: code },
    select: { id: true, status: true, discountPercent: true },
  });
  if (
    !ambassador ||
    ambassador.status !== "ACTIVE" ||
    !ambassador.discountPercent ||
    ambassador.discountPercent.lessThanOrEqualTo(0) ||
    ambassador.discountPercent.greaterThan(100)
  )
    return null;
  return {
    ambassadorId: ambassador.id,
    code,
    percent: ambassador.discountPercent,
  };
}

/** Discount on the items subtotal, rounded half-up to two places. */
export function discountAmount(
  subtotal: Prisma.Decimal,
  percent: Prisma.Decimal,
) {
  const amount = subtotal
    .mul(percent)
    .div(100)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  return amount.greaterThan(subtotal) ? subtotal : amount;
}
