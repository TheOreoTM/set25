import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SupplierProductForm } from "@/components/supply/supplier-forms";
import { requireStaff } from "@/lib/auth/session";
import { addSupplierProductAction } from "@/lib/supply/actions";
import { getSupplier, getSupplyProducts } from "@/lib/supply/data";
import {
  formatPurchaseOrderNumber,
  formatSampleNumber,
  purchaseOrderStatusLabels,
  sampleStatusLabels,
} from "@set25/shared";
import { formatDate } from "@/lib/supply/presentation";

export default async function SupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [staff, supplier, products] = await Promise.all([
    requireStaff(),
    getSupplier(id),
    getSupplyProducts(),
  ]);
  if (!supplier) notFound();
  const canWrite = staff.role !== "STAFF";
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Suppliers"
        title={supplier.name}
        description={
          [supplier.country, supplier.contactName]
            .filter(Boolean)
            .join(" · ") || "Supplier record"
        }
      />
      <div className="detail-actions">
        <Link className="text-link back-link" href="/suppliers">
          <ArrowLeft aria-hidden="true" /> All suppliers
        </Link>
        <div>
          {supplier.alibabaUrl ? (
            <a
              className="button button--secondary"
              href={supplier.alibabaUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink aria-hidden="true" /> Alibaba
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
      <section className="detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Supplier</p>
            <h2>Contact information</h2>
          </div>
          <span
            className={`status status--${supplier.active ? "active" : "archived"}`}
          >
            {supplier.active ? "Active" : "Inactive"}
          </span>
        </div>
        <dl className="detail-definition-grid">
          <div>
            <dt>Contact</dt>
            <dd>{supplier.contactName ?? "Not recorded"}</dd>
          </div>
          <div>
            <dt>Phone / WhatsApp</dt>
            <dd>{supplier.phone ?? "Not recorded"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{supplier.email ?? "Not recorded"}</dd>
          </div>
          <div>
            <dt>Website</dt>
            <dd>{supplier.website ?? "Not recorded"}</dd>
          </div>
        </dl>
        {supplier.notes ? (
          <p className="detail-copy">{supplier.notes}</p>
        ) : null}
      </section>
      <section className="detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Products / Terms</p>
            <h2>Supplier product references</h2>
          </div>
          <span>{supplier.products.length} linked</span>
        </div>
        {supplier.products.length ? (
          <div className="supply-table">
            <div className="supply-table-row supply-table-head">
              <span>Product</span>
              <span>Supplier SKU</span>
              <span>MOQ</span>
              <span>Sample Cost</span>
              <span>Bulk Unit Price</span>
            </div>
            {supplier.products.map((item) => (
              <div className="supply-table-row" key={item.id}>
                <span>
                  <strong>{item.product.code}</strong>
                  <small>{item.product.name}</small>
                </span>
                <span data-label="Supplier SKU">{item.supplierSku ?? "—"}</span>
                <span data-label="MOQ">{item.moq ?? "—"}</span>
                <span data-label="Sample Cost">
                  {item.sampleCost
                    ? `${item.currency} ${item.sampleCost.toFixed(2)}`
                    : "—"}
                </span>
                <span data-label="Bulk Unit Price">
                  {item.bulkUnitPrice
                    ? `${item.currency} ${item.bulkUnitPrice.toFixed(2)}`
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No product terms recorded yet.</p>
          </div>
        )}
        {canWrite ? (
          <div className="embedded-editor">
            <h3>Add or update product terms</h3>
            <SupplierProductForm
              action={addSupplierProductAction.bind(null, id)}
              products={products}
            />
          </div>
        ) : null}
      </section>
      <div className="detail-columns">
        <section className="detail-section">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Purchase Orders</p>
              <h2>Recent POs</h2>
            </div>
          </div>
          {supplier.purchaseOrders.length ? (
            <div className="activity-list">
              {supplier.purchaseOrders.map((po) => (
                <Link href={`/purchase-orders/${po.id}`} key={po.id}>
                  <span>
                    <strong>
                      {formatPurchaseOrderNumber(po.purchaseOrderNumber)}
                    </strong>
                    <small>
                      {po._count.lines} items · {formatDate(po.createdAt)}
                    </small>
                  </span>
                  <span className={`status status--${po.status.toLowerCase()}`}>
                    {purchaseOrderStatusLabels[po.status]}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="inline-empty">
              <p>No purchase orders yet.</p>
            </div>
          )}
        </section>
        <section className="detail-section">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Samples</p>
              <h2>Recent samples</h2>
            </div>
          </div>
          {supplier.samples.length ? (
            <div className="activity-list">
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
            <div className="inline-empty">
              <p>No samples yet.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
