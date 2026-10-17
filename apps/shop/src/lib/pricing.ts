import "server-only";

import { Prisma } from "@set25/database";
import {
  availableToSell,
  getReservedQuantities,
} from "@set25/database/inventory";
import { getEffectivePrice } from "@set25/shared";

// Server-authoritative cart pricing. The browser only ever supplies variant
// IDs and quantities; every name, price, and availability fact is re-read
// here.

export const MAX_LINE_QUANTITY = 10;
export const MAX_CART_LINES = 20;

export type CartRequestItem = { variantId: string; quantity: number };

export type LineProblem = "UNAVAILABLE" | "SOLD_OUT" | "INSUFFICIENT";

export type PricedLine = {
  variantId: string;
  productName: string;
  productCode: string;
  slug: string;
  sku: string;
  size: string | null;
  color: string | null;
  quantity: number;
  unitPrice: Prisma.Decimal;
  unitCost: Prisma.Decimal | null;
  lineTotal: Prisma.Decimal;
  problem: LineProblem | null;
};

/** Merges duplicate variants and drops malformed entries. */
export function normalizeCartItems(input: unknown): CartRequestItem[] | null {
  if (!Array.isArray(input) || input.length > MAX_CART_LINES * 2) return null;
  const merged = new Map<string, number>();
  for (const entry of input) {
    if (!entry || typeof entry !== "object") return null;
    const { variantId, quantity } = entry as Record<string, unknown>;
    if (
      typeof variantId !== "string" ||
      !/^[a-z0-9]{10,40}$/i.test(variantId) ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > MAX_LINE_QUANTITY
    )
      return null;
    merged.set(
      variantId,
      Math.min(MAX_LINE_QUANTITY, (merged.get(variantId) ?? 0) + quantity),
    );
  }
  if (merged.size > MAX_CART_LINES) return null;
  return [...merged].map(([variantId, quantity]) => ({ variantId, quantity }));
}

export async function priceCart(
  client: Prisma.TransactionClient,
  items: CartRequestItem[],
  now = new Date(),
) {
  const ids = items.map((item) => item.variantId);
  const [variants, reserved] = await Promise.all([
    client.productVariant.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        sku: true,
        size: true,
        color: true,
        active: true,
        cost: true,
        stockOnHand: true,
        sellPriceOverride: true,
        product: {
          select: {
            name: true,
            code: true,
            slug: true,
            status: true,
            isPublished: true,
            retailPrice: true,
          },
        },
      },
    }),
    getReservedQuantities(client, ids, now),
  ]);
  const byId = new Map(variants.map((variant) => [variant.id, variant]));
  const lines: PricedLine[] = [];
  for (const item of items) {
    const variant = byId.get(item.variantId);
    if (
      !variant ||
      !variant.active ||
      !variant.product.isPublished ||
      variant.product.status !== "ACTIVE"
    ) {
      lines.push({
        variantId: item.variantId,
        productName: variant?.product.name ?? "",
        productCode: "",
        slug: variant?.product.slug ?? "",
        sku: "",
        size: null,
        color: null,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(0),
        unitCost: null,
        lineTotal: new Prisma.Decimal(0),
        problem: "UNAVAILABLE",
      });
      continue;
    }
    const available = availableToSell(
      variant.stockOnHand,
      reserved.get(variant.id) ?? 0,
    );
    const unitPrice = new Prisma.Decimal(
      getEffectivePrice(variant.product.retailPrice, variant.sellPriceOverride),
    );
    lines.push({
      variantId: variant.id,
      productName: variant.product.name,
      productCode: variant.product.code,
      slug: variant.product.slug,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      quantity: item.quantity,
      unitPrice,
      unitCost: variant.cost,
      lineTotal: unitPrice.mul(item.quantity),
      problem:
        available <= 0
          ? "SOLD_OUT"
          : available < item.quantity
            ? "INSUFFICIENT"
            : null,
    });
  }
  const subtotal = lines
    .filter((line) => !line.problem)
    .reduce((sum, line) => sum.plus(line.lineTotal), new Prisma.Decimal(0));
  return { lines, subtotal };
}
