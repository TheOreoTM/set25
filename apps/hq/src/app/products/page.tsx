import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  formatMVR,
  productCategoryLabels,
  productStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { ProductListSkeleton } from "@/components/catalog/product-list-skeleton";
import { getProducts } from "@/lib/catalog/data";

export const metadata = { title: "Products" };

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Commerce / Products"
        title="Products"
        description="The shared catalogue for SET25 HQ and the future Store."
      />
      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ProductList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? params[key] : "";
  const filters = {
    search: value("search"),
    status: value("status"),
    category: value("category"),
  };
  const products = await getProducts(filters);
  return (
    <>
      <div className="resource-toolbar">
        <form className="filter-bar">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search products</span>
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="Search name, code, or SKU"
            />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select name="status" defaultValue={filters.status}>
              <option value="">All statuses</option>
              {PRODUCT_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {productStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select name="category" defaultValue={filters.category}>
              <option value="">All categories</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option value={category} key={category}>
                  {productCategoryLabels[category]}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button button--secondary filter-submit"
            type="submit"
          >
            <SlidersHorizontal aria-hidden="true" /> Apply
          </button>
        </form>
        <Link className="button button--dark" href="/products/new">
          <Plus aria-hidden="true" /> New product
        </Link>
      </div>
      <section className="resource-panel" aria-labelledby="product-list-title">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Catalogue</p>
            <h2 id="product-list-title">
              {products.length} {products.length === 1 ? "product" : "products"}
            </h2>
          </div>
          <p>One source of truth</p>
        </div>
        {products.length ? (
          <div className="catalog-table">
            <div className="catalog-row catalog-row--head">
              <span>Product</span>
              <span>Code</span>
              <span>Category</span>
              <span>Price</span>
              <span>Variants</span>
              <span>Stock</span>
              <span>Status</span>
              <span />
            </div>
            {products.map((product) => {
              const stock = product.variants.reduce(
                (sum, variant) => sum + variant.stockOnHand,
                0,
              );
              return (
                <Link
                  className="catalog-row"
                  href={`/products/${product.id}`}
                  key={product.id}
                >
                  <span className="catalog-product">
                    <strong>{product.name}</strong>
                    <small>
                      {product.shortDescription || "No short description"}
                    </small>
                  </span>
                  <span data-label="Code">
                    <strong>{product.code}</strong>
                  </span>
                  <span data-label="Category">
                    {productCategoryLabels[product.category]}
                  </span>
                  <span data-label="Price" className="numeric">
                    {formatMVR(product.retailPrice)}
                  </span>
                  <span data-label="Variants">{product._count.variants}</span>
                  <span data-label="Stock">
                    <strong>{stock}</strong>
                  </span>
                  <span data-label="Status">
                    <span
                      className={`status status--${product.status.toLowerCase()}`}
                    >
                      {productStatusLabels[product.status]}
                    </span>
                  </span>
                  <span className="catalog-arrow">
                    <ArrowRight aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No products match these filters.</p>
            <Link href="/products/new">
              Create the first product <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
