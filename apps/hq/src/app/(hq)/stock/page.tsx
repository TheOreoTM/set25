import { Suspense } from "react";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import {
  formatMVR,
  getEffectivePrice,
  getStockStatus,
  stockStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { StockAdjustment } from "@/components/catalog/stock-adjustment";
import { getStock } from "@/lib/catalog/data";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Stock" };

export default function StockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Commerce / Stock"
        title="Stock"
        description="Available inventory across every active SET25 product variant."
      />
      <Suspense fallback={<StockSkeleton />}>
        <StockList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function StockList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? params[key] : "";
  const filters = { search: value("search"), status: value("status") };
  const [variants, staff] = await Promise.all([
    getStock(filters),
    requireStaff(),
  ]);
  const adjustmentVariants = variants
    .filter((variant) => variant.active)
    .map((variant) => ({
      id: variant.id,
      label: `${variant.product.name} · ${[variant.color, variant.size].filter(Boolean).join(" / ") || "Standard"}`,
      sku: variant.sku,
      stockOnHand: variant.stockOnHand,
    }));
  return (
    <>
      {params.adjusted === "1" ? (
        <div className="success-banner" role="status">
          Stock updated and movement recorded.
        </div>
      ) : null}
      <div className="resource-toolbar">
        <form className="filter-bar">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search stock</span>
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="Search product, variant, or SKU"
            />
          </label>
          <label>
            <span className="sr-only">Filter by stock status</span>
            <select name="status" defaultValue={filters.status}>
              <option value="ALL">All stock statuses</option>
              <option value="HEALTHY">Healthy</option>
              <option value="LOW">Low</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </label>
          <button
            className="button button--secondary filter-submit"
            type="submit"
          >
            <SlidersHorizontal aria-hidden="true" /> Apply
          </button>
        </form>
        {staff.role !== "STAFF" ? (
          <StockAdjustment
            variants={adjustmentVariants}
            returnTo="/stock"
            submissionKey={randomUUID()}
          />
        ) : null}
      </div>
      <section className="resource-panel" aria-labelledby="stock-list-title">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Inventory</p>
            <h2 id="stock-list-title">
              {variants.length} {variants.length === 1 ? "variant" : "variants"}
            </h2>
          </div>
          <p>Incoming stock is added when received</p>
        </div>
        {variants.length ? (
          <div className="stock-table">
            <div className="stock-row stock-row--head">
              <span>Product / Variant</span>
              <span>SKU</span>
              <span>Available</span>
              <span>Incoming</span>
              <span>Cost Each</span>
              <span>Sell Price</span>
              <span>Stock Value</span>
              <span>Reorder At</span>
              <span>Status</span>
              <span />
            </div>
            {variants.map((variant) => {
              const status = getStockStatus(
                variant.stockOnHand,
                variant.reorderAt,
              );
              const stockValue = variant.cost
                ? variant.cost.mul(variant.stockOnHand)
                : null;
              return (
                <div className="stock-row" key={variant.id}>
                  <span className="catalog-product">
                    <strong>{variant.product.name}</strong>
                    <small>
                      {[variant.color, variant.size]
                        .filter(Boolean)
                        .join(" / ") || "Standard"}
                    </small>
                  </span>
                  <span data-label="SKU">
                    <strong>{variant.sku}</strong>
                  </span>
                  <span data-label="Available" className="stock-number">
                    {variant.stockOnHand}
                  </span>
                  <span data-label="Incoming" className="muted-value">
                    {variant.incoming}
                  </span>
                  <span data-label="Cost Each">
                    {variant.cost ? formatMVR(variant.cost) : "—"}
                  </span>
                  <span data-label="Sell Price">
                    {formatMVR(
                      getEffectivePrice(
                        variant.product.retailPrice,
                        variant.sellPriceOverride,
                      ),
                    )}
                  </span>
                  <span data-label="Stock Value">
                    {stockValue ? formatMVR(stockValue) : "—"}
                  </span>
                  <span data-label="Reorder At">{variant.reorderAt}</span>
                  <span data-label="Status">
                    <span
                      className={`stock-status stock-status--${status.toLowerCase()}`}
                    >
                      {stockStatusLabels[status]}
                    </span>
                  </span>
                  <span>
                    <Link
                      className="row-link"
                      href={`/products/${variant.productId}`}
                      aria-label={`Open ${variant.product.name}`}
                    >
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No stock records match these filters.</p>
            <Link href="/products">
              Review products <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

function StockSkeleton() {
  return (
    <div className="resource-panel">
      <div className="skeleton skeleton--copy" />
      <div className="skeleton skeleton--catalog" />
    </div>
  );
}
