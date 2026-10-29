import { Suspense } from "react";
import { Select } from "@/components/ui/select";
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
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Products" };

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Products"
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
  const [products, staff] = await Promise.all([
    getProducts(filters),
    requireStaff(),
  ]);
  return (
    <>
      {params.forbidden === "write" ? (
        <div
          className="form-message form-message--error staff-page-message"
          role="alert"
        >
          Your Staff role has read-only access to Products and Stock.
        </div>
      ) : null}
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
            <Select name="status" defaultValue={filters.status}>
              <option value="">All statuses</option>
              {PRODUCT_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {productStatusLabels[status]}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <Select name="category" defaultValue={filters.category}>
              <option value="">All categories</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option value={category} key={category}>
                  {productCategoryLabels[category]}
                </option>
              ))}
            </Select>
          </label>
          <button
            className="button button--secondary filter-submit"
            type="submit"
          >
            <SlidersHorizontal aria-hidden="true" /> Apply
          </button>
        </form>
        {staff.role !== "STAFF" ? (
          <Link className="button button--dark" href="/products/new">
            <Plus aria-hidden="true" /> New product
          </Link>
        ) : null}
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
              <span className="num">Price</span>
              <span className="num col-desktop">Variants</span>
              <span className="num">Stock</span>
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
                  <span data-label="Price" className="numeric num">
                    {formatMVR(product.retailPrice)}
                  </span>
                  <span data-label="Variants" className="num col-desktop">
                    {product._count.variants}
                  </span>
                  <span data-label="Stock" className="stock-number num">
                    {stock}
                  </span>
                  <span data-label="Status" className="row-status">
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
            {filters.search || filters.status || filters.category ? (
              <>
                <p>No products match these filters.</p>
                <span>Try a different search or filter.</span>
                <Link href="/products">
                  Clear filters <ArrowRight aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p>No products yet.</p>
                {staff.role !== "STAFF" ? (
                  <Link href="/products/new">
                    Create the first product <ArrowRight aria-hidden="true" />
                  </Link>
                ) : (
                  <span>Ask a Manager or Owner to create a product.</span>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </>
  );
}
