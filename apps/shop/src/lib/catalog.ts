import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { db, Prisma } from "@set25/database";
import {
  availableToSell,
  getReservedQuantities,
} from "@set25/database/inventory";
import {
  getEffectivePrice,
  getPublicAvailability,
  productCategoryLabels,
  type ProductCategoryValue,
  type PublicAvailability,
} from "@set25/shared";
import { publicMediaUrl } from "./media";

// Public catalogue projection. Every query below selects explicit,
// customer-safe fields only: no cost, supplier, stock quantities, internal
// codes, staff, or files. Money leaves this module as strings.

export type PublicImage = { url: string; alt: string };

export type PublicVariant = {
  id: string;
  size: string | null;
  color: string | null;
  price: string;
};

export type PublicProduct = {
  slug: string;
  name: string;
  brandLine: string | null;
  shortDescription: string | null;
  description: string | null;
  category: ProductCategoryValue;
  categoryLabel: string;
  priceFrom: string;
  priceVaries: boolean;
  images: PublicImage[];
  variants: PublicVariant[];
};

/** Catalogue copy changes rarely and is safe to serve from cache briefly. */
const catalogueLife = { stale: 60, revalidate: 60, expire: 3600 };

const publicProductSelect = {
  slug: true,
  name: true,
  brandLine: true,
  shortDescription: true,
  description: true,
  category: true,
  retailPrice: true,
  variants: {
    where: { active: true },
    orderBy: [{ color: "asc" }, { createdAt: "asc" }],
    select: { id: true, size: true, color: true, sellPriceOverride: true },
  },
  media: {
    where: { status: "AVAILABLE" },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    select: { storageKey: true, altText: true },
  },
} satisfies Prisma.ProductSelect;

const publishedWhere = {
  isPublished: true,
  status: "ACTIVE",
  variants: { some: { active: true } },
} satisfies Prisma.ProductWhereInput;

type ProductRow = Prisma.ProductGetPayload<{
  select: typeof publicProductSelect;
}>;

function toPublicProduct(product: ProductRow): PublicProduct {
  const variants = product.variants.map((variant) => ({
    id: variant.id,
    size: variant.size,
    color: variant.color,
    price: getEffectivePrice(product.retailPrice, variant.sellPriceOverride),
  }));
  const prices = variants.map((variant) => variant.price);
  const lowest = prices.reduce<Prisma.Decimal | null>(
    (min, price) =>
      min === null || new Prisma.Decimal(price).lessThan(min)
        ? new Prisma.Decimal(price)
        : min,
    null,
  );
  return {
    slug: product.slug,
    name: product.name,
    brandLine: product.brandLine,
    shortDescription: product.shortDescription,
    description: product.description,
    category: product.category,
    categoryLabel: productCategoryLabels[product.category],
    priceFrom: (lowest ?? product.retailPrice).toFixed(2),
    priceVaries: new Set(prices).size > 1,
    images: product.media.flatMap((item) => {
      const url = publicMediaUrl(item.storageKey);
      return url ? [{ url, alt: item.altText }] : [];
    }),
    variants,
  };
}

export async function getPublishedProducts(): Promise<PublicProduct[]> {
  "use cache";
  cacheLife(catalogueLife);
  cacheTag("catalogue");
  const products = await db.product.findMany({
    where: publishedWhere,
    select: publicProductSelect,
    orderBy: [{ createdAt: "asc" }, { name: "asc" }],
  });
  return products.map(toPublicProduct);
}

export async function getPublishedProduct(
  slug: string,
): Promise<PublicProduct | null> {
  "use cache";
  cacheLife(catalogueLife);
  cacheTag("catalogue", `product:${slug}`);
  const product = await db.product.findFirst({
    where: { slug, ...publishedWhere },
    select: publicProductSelect,
  });
  return product ? toPublicProduct(product) : null;
}

/**
 * Fresh, uncached availability by variant. Uses the canonical
 * available-to-sell helper and returns only a coarse public label.
 */
export async function getPublicAvailabilityByVariant(
  variantIds: string[],
): Promise<Record<string, PublicAvailability>> {
  if (!variantIds.length) return {};
  const [variants, reserved] = await Promise.all([
    db.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, stockOnHand: true },
    }),
    getReservedQuantities(db, variantIds),
  ]);
  return Object.fromEntries(
    variants.map((variant) => [
      variant.id,
      getPublicAvailability(
        availableToSell(variant.stockOnHand, reserved.get(variant.id) ?? 0),
      ),
    ]),
  );
}

/** Product-level label: best availability across its variants. */
export function productAvailability(
  product: PublicProduct,
  availability: Record<string, PublicAvailability>,
): PublicAvailability {
  const states = product.variants.map(
    (variant) => availability[variant.id] ?? "SOLD_OUT",
  );
  if (states.includes("IN_STOCK")) return "IN_STOCK";
  if (states.includes("LOW_STOCK")) return "LOW_STOCK";
  return "SOLD_OUT";
}
