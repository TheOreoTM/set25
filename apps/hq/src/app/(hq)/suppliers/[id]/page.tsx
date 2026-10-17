import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SupplierProductEditor } from "@/components/supply/supplier-forms";
import { requireStaff } from "@/lib/auth/session";
import { addSupplierProductAction } from "@/lib/supply/actions";
import { getSupplier, getSupplyProducts } from "@/lib/supply/data";
import {
  toSupplierProductOptionDto,
  toSupplierTermsDto,
} from "@/lib/supply/dto";
import { formatDate } from "@/lib/supply/presentation";
import {
  formatPurchaseOrderNumber,
  formatSampleNumber,
  purchaseOrderStatusLabels,
  sampleStatusLabels,
} from "@set25/shared";
import { FileAttachmentsPanel } from "@/components/files/file-attachments-panel";

export const instant = false;

export default async function SupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [staff, supplier, productRecords] = await Promise.all([
    requireStaff(),
    getSupplier(id),
    getSupplyProducts(),
  ]);
  if (!supplier) notFound();

  const canWrite = staff.role !== "STAFF";
  const products = productRecords.map(toSupplierProductOptionDto);
  const openPurchaseOrders = supplier.purchaseOrders.filter((po) =>
    ["DRAFT", "PLACED"].includes(po.status),
  );
  const incomingUnits = supplier.purchaseOrders
    .filter((po) => po.status === "PLACED")
    .flatMap((po) => po.lines)
    .reduce(
      (total, line) => total + line.quantityOrdered - line.quantityReceived,
      0,
    );
  const recentPo = supplier.purchaseOrders[0];

  return (
    <main className="page-wrap supply-detail-page">
      <PageHeader
        eyebrow="Supply / Suppliers"
        title={supplier.name}
        titleMeta={
          <span
            className={`status status--${supplier.active ? "active" : "archived"}`}
          >
            {supplier.active ? "Active" : "Inactive"}
          </span>
        }
        description={supplier.country ?? "Supplier record"}
      />
      <div className="detail-actions">
        <Link className="text-link back-link" href="/suppliers">
          <ArrowLeft aria-hidden="true" /> All suppliers
        </Link>
        <div>
          {supplier.alibabaUrl ? (
            <a
              className="button button--quiet"
              href={supplier.alibabaUrl}
              target="_blank"
              rel="noreferrer"
            >
              Alibaba <ExternalLink aria-hidden="true" />
            </a>
          ) : null}
          {canWrite ? (
            <>
              <Link
                className="button button--secondary"
                href={`/suppliers/${id}/edit`}
              >
                <Pencil aria-hidden="true" /> Edit supplier
              </Link>
              <Link
                className="button button--dark"
                href={`/purchase-orders/new?supplier=${id}`}
              >
                <Plus aria-hidden="true" /> New PO
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <section
        className="supply-summary-strip supply-summary-strip--four"
        aria-label="Supplier summary"
      >
        <SummaryFact
          label="Contact"
          value={supplier.contactName ?? "Not recorded"}
        />
        <SummaryFact
          label="Phone / WhatsApp"
          value={supplier.phone ?? "Not recorded"}
        />
        <SummaryFact label="Email" value={supplier.email ?? "Not recorded"} />
        <div>
          <span>Website</span>
          <strong>
            {supplier.website ? (
              <a href={supplier.website} target="_blank" rel="noreferrer">
                Open website <ExternalLink aria-hidden="true" />
              </a>
            ) : (
              "Not recorded"
            )}
          </strong>
        </div>
      </section>

      <div className="supply-detail-grid">
        <section className="detail-section supply-main-panel">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Products / Terms</p>
              <h2>Supplier product references</h2>
            </div>
            {canWrite && supplier.products.length ? (
              <SupplierProductEditor
                action={addSupplierProductAction.bind(null, id)}
                products={products}
              />
            ) : supplier.products.length ? (
              <span>{supplier.products.length} linked</span>
            ) : null}
          </div>
          {supplier.products.length ? (
            <div className="terms-list">
              {supplier.products.map((item) => (
                <article className="terms-row" key={item.id}>
                  <div className="terms-product">
                    <strong>{item.product.name}</strong>
                    <small>
                      {item.product.code}
                      {item.supplierSku ? ` · ${item.supplierSku}` : ""}
                    </small>
                  </div>
                  <TermFact label="MOQ" value={String(item.moq ?? "—")} />
                  <TermFact
                    label="Bulk Price"
                    value={
                      item.bulkUnitPrice
                        ? `${item.currency} ${item.bulkUnitPrice.toFixed(2)}`
                        : "—"
                    }
                  />
                  <TermFact
                    label="Sample"
                    value={
                      item.sampleCost
                        ? `${item.currency} ${item.sampleCost.toFixed(2)}`
                        : "—"
                    }
                  />
                  <div className="terms-actions">
                    {item.productUrl ? (
                      <a
                        className="text-link"
                        href={item.productUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Alibaba <ExternalLink aria-hidden="true" />
                      </a>
                    ) : null}
                    {canWrite ? (
                      <SupplierProductEditor
                        action={addSupplierProductAction.bind(null, id)}
                        products={products}
                        defaults={toSupplierTermsDto(item)}
                        label="Edit"
                        compact
                      />
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="compact-empty">
              <div>
                <strong>No product terms yet.</strong>
                <p>
                  Add MOQ, bulk price, and sample pricing for this supplier.
                </p>
              </div>
              {canWrite ? (
                <SupplierProductEditor
                  action={addSupplierProductAction.bind(null, id)}
                  products={products}
                />
              ) : null}
            </div>
          )}
          {supplier.notes ? (
            <div className="supply-notes">
              <span>Supplier notes</span>
              <p>{supplier.notes}</p>
            </div>
          ) : null}
        </section>

        <aside className="supply-side-rail">
          <section className="detail-section supply-summary-card">
            <div className="detail-section-head">
              <div>
                <p className="kicker">Supply Summary</p>
                <h2>At a glance</h2>
              </div>
            </div>
            <dl className="rail-stat-list">
              <RailStat
                label="Purchase Orders"
                value={supplier.purchaseOrders.length}
              />
              <RailStat label="Open POs" value={openPurchaseOrders.length} />
              <RailStat label="Incoming Units" value={incomingUnits} />
              <RailStat label="Samples" value={supplier.samples.length} />
              <div>
                <dt>Recent PO</dt>
                <dd>
                  {recentPo ? (
                    <Link href={`/purchase-orders/${recentPo.id}`}>
                      {formatPurchaseOrderNumber(recentPo.purchaseOrderNumber)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <div className="detail-columns supply-secondary-grid">
        <section className="detail-section compact-detail-section">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Purchase Orders</p>
              <h2>Recent POs</h2>
            </div>
          </div>
          {supplier.purchaseOrders.length ? (
            <div className="activity-list compact-activity-list">
              {supplier.purchaseOrders.map((po) => (
                <Link href={`/purchase-orders/${po.id}`} key={po.id}>
                  <span>
                    <strong>
                      {formatPurchaseOrderNumber(po.purchaseOrderNumber)}
                    </strong>
                    <small>
                      {po._count.lines}{" "}
                      {po._count.lines === 1 ? "item" : "items"} ·{" "}
                      {formatDate(po.createdAt)}
                    </small>
                  </span>
                  <span className={`status status--${po.status.toLowerCase()}`}>
                    {purchaseOrderStatusLabels[po.status]}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="compact-empty">
              <p>No purchase orders yet.</p>
            </div>
          )}
        </section>
        <section className="detail-section compact-detail-section">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Samples</p>
              <h2>Recent samples</h2>
            </div>
          </div>
          {supplier.samples.length ? (
            <div className="activity-list compact-activity-list">
              {supplier.samples.map((sample) => (
                <Link href={`/samples/${sample.id}`} key={sample.id}>
                  <span>
                    <strong>
                      {formatSampleNumber(sample.sampleNumber)} · {sample.name}
                    </strong>
                    <small>
                      {sample.sampleCost
                        ? `${sample.currency} ${sample.sampleCost.toFixed(2)}`
                        : "Cost not recorded"}
                    </small>
                  </span>
                  <span
                    className={`status status--${sample.status.toLowerCase()}`}
                  >
                    {sampleStatusLabels[sample.status]}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="compact-empty">
              <p>No samples yet.</p>
            </div>
          )}
        </section>
      </div>
      <FileAttachmentsPanel
        staff={staff}
        target={{ type: "SUPPLIER", id: id }}
        targetLabel={supplier.name}
      />
    </main>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TermFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RailStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
