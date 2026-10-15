import { Suspense } from "react";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3, Plus } from "lucide-react";
import {
  formatMVR,
  getEffectivePrice,
  getStockStatus,
  inventoryMovementLabels,
  productCategoryLabels,
  productStatusLabels,
  stockStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { StockAdjustment } from "@/components/catalog/stock-adjustment";
import { getProductWithMovements } from "@/lib/catalog/data";
import { requireStaff } from "@/lib/auth/session";

export default function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="page-wrap">
      <Suspense fallback={<DetailSkeleton />}>
        <ProductDetail params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ProductDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [product, staff] = await Promise.all([
    getProductWithMovements(id),
    requireStaff(),
  ]);
  if (!product) notFound();
  const movements = product.variants
    .flatMap((variant) =>
      variant.inventoryMovements.map((movement) => ({ ...movement, variant })),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);
  const totalStock = product.variants.reduce(
    (sum, variant) => sum + variant.stockOnHand,
    0,
  );
  const adjustmentVariants = product.variants
    .filter((variant) => variant.active)
    .map((variant) => ({
      id: variant.id,
      label:
        [variant.color, variant.size].filter(Boolean).join(" / ") || "Standard",
      sku: variant.sku,
      stockOnHand: variant.stockOnHand,
    }));
  return (
    <>
      <PageHeader
        eyebrow={`Products / ${product.code}`}
        title={product.name}
        description={product.shortDescription || "Shared SET25 product record."}
      />
      {query.adjusted === "1" ? (
        <div className="success-banner" role="status">
          Stock updated and movement recorded.
        </div>
      ) : null}
      {query.saved ? (
        <div className="success-banner" role="status">
          {query.saved === "variant" ? "Variant saved." : "Product saved."}
        </div>
      ) : null}
      <div className="detail-actions">
        <Link className="text-link back-link" href="/products">
          <ArrowLeft aria-hidden="true" /> All products
        </Link>
        <div>
          {staff.role !== "STAFF" ? (
            <>
              <StockAdjustment
                variants={adjustmentVariants}
                returnTo={`/products/${product.id}`}
                submissionKey={randomUUID()}
                compact
              />
              <Link
                className="button button--secondary"
                href={`/products/${product.id}/edit`}
              >
                <Edit3 aria-hidden="true" /> Edit product
              </Link>
              <Link
                className="button button--dark"
                href={`/products/${product.id}/variants/new`}
              >
                <Plus aria-hidden="true" /> Add variant
              </Link>
            </>
          ) : null}
        </div>
      </div>
      <section className="product-identity">
        <div className="identity-lead">
          <p className="kicker">Product identity</p>
          <div className="product-code-mark">{product.code.slice(0, 4)}</div>
          <h2>{product.name}</h2>
          <p>
            {product.description ||
              product.shortDescription ||
              "No product description yet."}
          </p>
        </div>
        <dl className="identity-facts">
          <div>
            <dt>Status</dt>
            <dd>
              <span
                className={`status status--${product.status.toLowerCase()}`}
              >
                {productStatusLabels[product.status]}
              </span>
            </dd>
          </div>
          <div>
            <dt>Base price</dt>
            <dd>{formatMVR(product.retailPrice)}</dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>{productCategoryLabels[product.category]}</dd>
          </div>
          <div>
            <dt>Publish status</dt>
            <dd>{product.isPublished ? "Published" : "Not published"}</dd>
          </div>
          <div>
            <dt>Total stock</dt>
            <dd>{totalStock}</dd>
          </div>
          <div>
            <dt>Variants</dt>
            <dd>{product.variants.length}</dd>
          </div>
        </dl>
      </section>
      <section
        className="resource-panel detail-section"
        aria-labelledby="variants-title"
      >
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Stock keeping units</p>
            <h2 id="variants-title">Variants</h2>
          </div>
          <p>Sell price inherits the base unless overridden</p>
        </div>
        {product.variants.length ? (
          <div className="variant-table">
            <div className="variant-row variant-row--head">
              <span>SKU / Variant</span>
              <span>Available</span>
              <span>Cost Each</span>
              <span>Sell Price</span>
              <span>Reorder At</span>
              <span>Stock Status</span>
              <span />
            </div>
            {product.variants.map((variant) => {
              const status = getStockStatus(
                variant.stockOnHand,
                variant.reorderAt,
              );
              return (
                <div className="variant-row" key={variant.id}>
                  <span className="catalog-product">
                    <strong>{variant.sku}</strong>
                    <small>
                      {[variant.color, variant.size]
                        .filter(Boolean)
                        .join(" / ") || "Standard"}
                      {variant.active ? "" : " · Inactive"}
                    </small>
                  </span>
                  <span data-label="Available" className="stock-number">
                    {variant.stockOnHand}
                  </span>
                  <span data-label="Cost Each">
                    {variant.cost ? formatMVR(variant.cost) : "—"}
                  </span>
                  <span data-label="Sell Price">
                    {formatMVR(
                      getEffectivePrice(
                        product.retailPrice,
                        variant.sellPriceOverride,
                      ),
                    )}
                    {variant.sellPriceOverride ? (
                      <small className="price-note">Override</small>
                    ) : null}
                  </span>
                  <span data-label="Reorder At">{variant.reorderAt}</span>
                  <span data-label="Stock Status">
                    <span
                      className={`stock-status stock-status--${status.toLowerCase()}`}
                    >
                      {stockStatusLabels[status]}
                    </span>
                  </span>
                  <span>
                    {staff.role !== "STAFF" ? (
                      <Link
                        className="row-link"
                        href={`/products/${product.id}/variants/${variant.id}/edit`}
                        aria-label={`Edit ${variant.sku}`}
                      >
                        <Edit3 aria-hidden="true" />
                      </Link>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="inline-empty">
            <p>This product has no variants yet.</p>
            <Link href={`/products/${product.id}/variants/new`}>
              Add the first variant <Plus aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>
      <section
        className="resource-panel detail-section"
        aria-labelledby="movements-title"
      >
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Audit trail</p>
            <h2 id="movements-title">Recent inventory movements</h2>
          </div>
          <p>Latest 10 across this product</p>
        </div>
        {movements.length ? (
          <div className="movement-list">
            {movements.map((movement) => (
              <div className="movement-row" key={movement.id}>
                <span
                  className={
                    movement.quantityChange > 0
                      ? "movement-quantity movement-quantity--add"
                      : "movement-quantity movement-quantity--remove"
                  }
                >
                  {movement.quantityChange > 0 ? "+" : ""}
                  {movement.quantityChange}
                </span>
                <span>
                  <strong>{inventoryMovementLabels[movement.type]}</strong>
                  <small>
                    {movement.variant.sku} · {movement.notes} · Adjusted by{" "}
                    {movement.createdBy?.name || "Earlier SET25 record"}
                  </small>
                </span>
                <span>{movement.reference || "No reference"}</span>
                <time dateTime={movement.createdAt.toISOString()}>
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(movement.createdAt)}
                </time>
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No inventory movements recorded yet.</p>
            <span>Use Adjust stock to add opening stock.</span>
          </div>
        )}
      </section>
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--detail" />
    </>
  );
}
