import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import {
  PRODUCT_CATEGORIES,
  productCategoryLabels,
  type ProductCategoryValue,
} from "@set25/shared";
import {
  getPublicAvailabilityByVariant,
  getPublishedProducts,
  productAvailability,
} from "@/lib/catalog";
import { getStoreSettings, instagramUrl } from "@/lib/settings";
import { ProductCard, ProductGridSkeleton } from "@/components/product-card";
import { EmptyDrop } from "@/components/empty-drop";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Shop SET25 Drop 001: volleyball performance gear built for the next point.",
  alternates: { canonical: "/shop" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow eyebrow--slash">Drop 001</p>
        <h1 className="page-title">Shop</h1>
        <p className="page-lede">
          Performance gear for every rally. Prices in MVR, delivered across
          the Maldives.
        </p>
      </header>
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <Catalogue searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Catalogue({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const [query, products] = await Promise.all([
    searchParams,
    getPublishedProducts(),
  ]);
  if (!products.length) {
    const settings = await getStoreSettings();
    return <EmptyDrop instagram={instagramUrl(settings.instagramHandle)} />;
  }
  const category = PRODUCT_CATEGORIES.includes(
    query.category as ProductCategoryValue,
  )
    ? (query.category as ProductCategoryValue)
    : null;
  const inStockOnly = query.availability === "in-stock";
  const availability = await getPublicAvailabilityByVariant(
    products.flatMap((product) => product.variants.map((variant) => variant.id)),
  );
  const categories = PRODUCT_CATEGORIES.filter((value) =>
    products.some((product) => product.category === value),
  );
  const visible = products
    .map((product) => ({
      product,
      availability: productAvailability(product, availability),
    }))
    .filter(
      (entry) =>
        (!category || entry.product.category === category) &&
        (!inStockOnly || entry.availability !== "SOLD_OUT"),
    );
  const href = (next: { category?: string | null; inStock?: boolean }) => {
    const params = new URLSearchParams();
    const nextCategory = next.category === undefined ? category : next.category;
    const nextInStock = next.inStock === undefined ? inStockOnly : next.inStock;
    if (nextCategory) params.set("category", nextCategory);
    if (nextInStock) params.set("availability", "in-stock");
    const value = params.toString();
    return value ? `/shop?${value}` : "/shop";
  };

  return (
    <>
      <nav className="filters" aria-label="Filter products">
        <ul className="filters__group">
          <li>
            <Link
              href={href({ category: null })}
              className="chip"
              aria-current={!category ? "page" : undefined}
            >
              All
            </Link>
          </li>
          {categories.map((value) => (
            <li key={value}>
              <Link
                href={href({ category: value })}
                className="chip"
                aria-current={category === value ? "page" : undefined}
              >
                {productCategoryLabels[value]}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={href({ inStock: !inStockOnly })}
          className="chip chip--toggle"
          aria-current={inStockOnly ? "true" : undefined}
        >
          <span className="chip__box" aria-hidden="true" />
          In stock only
          <span className="sr-only">{inStockOnly ? " (on)" : " (off)"}</span>
        </Link>
      </nav>
      <p className="result-count" role="status">
        {visible.length} {visible.length === 1 ? "product" : "products"}
      </p>
      {visible.length ? (
        <div className="product-grid">
          {visible.map((entry, index) => (
            <ProductCard
              key={entry.product.slug}
              product={entry.product}
              availability={entry.availability}
              priority={index < 2}
            />
          ))}
        </div>
      ) : (
        <div className="inline-empty">
          <p>Nothing matches these filters right now.</p>
          <Link className="text-link" href="/shop">
            Clear filters
          </Link>
        </div>
      )}
    </>
  );
}
