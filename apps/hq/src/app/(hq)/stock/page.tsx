import { Suspense } from "react";
import { Select } from "@/components/ui/select";
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
        eyebrow="Launch / Stock"
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
  const filtered = Boolean(filters.search || filters.status);
  // The adjust dialog offers every active variant, whatever the list shows.
  const [variants, allVariants, staff] = await Promise.all([
    getStock(filters),
    filtered ? getStock({ search: "", status: "" }) : null,
    requireStaff(),
  ]);
  const adjustmentVariants = (allVariants ?? variants)
    .filter((variant) => variant.active)
    .map((variant) => ({
      id: variant.id,
      label: `${variant.product.name} · ${[variant.color, variant.size].filter(Boolean).join(" / ") || "Standard"}`,
      sku: variant.sku,
      stockOnHand: variant.stockOnHand,
    }));
  return (
    <>
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
            <Select name="status" defaultValue={filters.status}>
              <option value="">All stock statuses</option>
              <option value="HEALTHY">Healthy</option>
              <option value="LOW">Low</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
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
          <StockAdjustment
            variants={adjustmentVariants}
            returnTo="/stock"
            submissionKey={randomUUID()}
          />
        ) : null}
      </div>
      {params.adjusted === "1" ? (
        <div className="form-message form-message--success" role="status">
          Stock updated and movement recorded.
        </div>
      ) : null}
      <section className="resource-panel" aria-labelledby="stock-list-title">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Inventory</p>
            <h2 id="stock-list-title">
              {variants.length} {variants.length === 1 ? "variant" : "variants"}
            </h2>
          </div>
          <p>Available = On Hand − Store reservations</p>
        </div>
        {variants.length ? (
          <div className="stock-table">
            <div className="stock-row stock-row--head">
              <span>Product / Variant</span>
              <span>SKU</span>
              <span className="num">On hand</span>
              <span className="num col-desktop">Reserved</span>
              <span className="num">Available</span>
              <span className="num col-wide">Incoming</span>
              <span className="num col-wide">Cost each</span>
              <span className="num col-desktop">Sell price</span>
              <span className="num col-wide">Stock value</span>
              <span className="num">Reorder at</span>
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
                <Link
                  className="stock-row"
                  href={`/products/${variant.productId}`}
                  key={variant.id}
                >
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
                  <span data-label="On hand" className="stock-number num">
                    {variant.stockOnHand}
                  </span>
                  <span
                    data-label="Reserved"
                    className="muted-value num col-desktop"
                  >
                    {variant.reserved}
                  </span>
                  <span data-label="Available" className="stock-number num">
                    {variant.available}
                  </span>
                  <span
                    data-label="Incoming"
                    className="muted-value num col-wide"
                  >
                    {variant.incoming}
                  </span>
                  <span data-label="Cost each" className="num col-wide">
                    {variant.cost ? formatMVR(variant.cost) : "—"}
                  </span>
                  <span data-label="Sell price" className="num col-desktop">
                    {formatMVR(
                      getEffectivePrice(
                        variant.product.retailPrice,
                        variant.sellPriceOverride,
                      ),
                    )}
                  </span>
                  <span data-label="Stock value" className="num col-wide">
                    {stockValue ? formatMVR(stockValue) : "—"}
                  </span>
                  <span data-label="Reorder at" className="num">
                    {variant.reorderAt}
                  </span>
                  <span data-label="Status" className="row-status">
                    <span className={`status status--${status.toLowerCase()}`}>
                      {stockStatusLabels[status]}
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
            {filtered ? (
              <>
                <p>No stock records match these filters.</p>
                <span>Try a different search or filter.</span>
                <Link href="/stock">
                  Clear filters <ArrowRight aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p>No active variants yet.</p>
                <Link href="/products">
                  Review products <ArrowRight aria-hidden="true" />
                </Link>
              </>
            )}
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
