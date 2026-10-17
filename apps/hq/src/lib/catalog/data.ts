import "server-only";

import { db } from "@set25/database";
import {
  availableToSell,
  getReservedQuantities,
} from "@set25/database/inventory";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  type ProductCategoryValue,
  type ProductStatusValue,
} from "@set25/shared";
import { getIncomingByVariant } from "@/lib/supply/data";

export type ProductFilters = {
  search?: string;
  status?: string;
  category?: string;
};

export async function getProducts(filters: ProductFilters = {}) {
  const search = filters.search?.trim();
  const status = PRODUCT_STATUSES.includes(filters.status as ProductStatusValue)
    ? (filters.status as ProductStatusValue)
    : undefined;
  const category = PRODUCT_CATEGORIES.includes(
    filters.category as ProductCategoryValue,
  )
    ? (filters.category as ProductCategoryValue)
    : undefined;

  return db.product.findMany({
    where: {
      status,
      category,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
              {
                variants: {
                  some: { sku: { contains: search, mode: "insensitive" } },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      variants: { select: { stockOnHand: true } },
      _count: { select: { variants: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function getProduct(id: string) {
  return db.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: [{ active: "desc" }, { sku: "asc" }] },
    },
  });
}

export async function getProductWithMovements(id: string) {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      media: {
        where: { status: "AVAILABLE" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, storageKey: true, altText: true, isPrimary: true },
      },
      variants: {
        orderBy: [{ active: "desc" }, { sku: "asc" }],
        include: {
          inventoryMovements: {
            orderBy: { createdAt: "desc" },
            take: 8,
            include: {
              createdBy: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!product) return null;
  const incoming = await getIncomingByVariant(
    product.variants.map((variant) => variant.id),
  );
  return {
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      incoming: incoming.get(variant.id) ?? 0,
    })),
  };
}

export async function getVariant(productId: string, variantId: string) {
  return db.productVariant.findFirst({
    where: { id: variantId, productId },
    include: { product: true },
  });
}

export type StockFilters = { search?: string; status?: string };

export async function getStock(filters: StockFilters = {}) {
  const search = filters.search?.trim();
  const variants = await db.productVariant.findMany({
    where: search
      ? {
          OR: [
            { sku: { contains: search, mode: "insensitive" } },
            { color: { contains: search, mode: "insensitive" } },
            { size: { contains: search, mode: "insensitive" } },
            { product: { name: { contains: search, mode: "insensitive" } } },
            { product: { code: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: { product: true },
    orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
  });

  const ids = variants.map((variant) => variant.id);
  const [incoming, reserved] = await Promise.all([
    getIncomingByVariant(ids),
    getReservedQuantities(db, ids),
  ]);
  const withIncoming = variants.map((variant) => {
    const held = reserved.get(variant.id) ?? 0;
    return {
      ...variant,
      incoming: incoming.get(variant.id) ?? 0,
      reserved: held,
      available: availableToSell(variant.stockOnHand, held),
    };
  });

  if (!filters.status || filters.status === "ALL") return withIncoming;
  return withIncoming.filter((variant) => {
    if (filters.status === "OUT_OF_STOCK") return variant.stockOnHand <= 0;
    if (filters.status === "LOW")
      return (
        variant.stockOnHand > 0 && variant.stockOnHand <= variant.reorderAt
      );
    if (filters.status === "HEALTHY")
      return variant.stockOnHand > variant.reorderAt;
    return true;
  });
}
