import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PurchaseOrderStatusButtons } from "@/components/supply/operational-controls";
import { requireStaff } from "@/lib/auth/session";
import { changePurchaseOrderStatusAction } from "@/lib/supply/actions";
import { decimalTotal, getPurchaseOrder } from "@/lib/supply/data";
import { getRecordedMoneyOut } from "@/lib/money/data";
import { formatDate } from "@/lib/supply/presentation";
import {
  formatImportNumber,
  formatMVR,
  formatPurchaseOrderNumber,
  importShipmentStatusLabels,
  purchaseOrderStatusLabels,
} from "@set25/shared";
import { FileAttachmentsPanel } from "@/components/files/file-attachments-panel";

export default async function PurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [staff, po, recordedPayments] = await Promise.all([
    requireStaff(),
    getPurchaseOrder(id),
    getRecordedMoneyOut({ purchaseOrderId: id }),
  ]);
  if (!po) notFound();

  const canWrite = staff.role !== "STAFF";
  const supplierTotal = decimalTotal(po.lines);
  const productCostMvr = supplierTotal.mul(po.exchangeRateToMvr);
  const unrecordedAgainstCost = productCostMvr.greaterThan(recordedPayments)
    ? productCostMvr.minus(recordedPayments)
    : productCostMvr.sub(productCostMvr);
  const ordered = po.lines.reduce((sum, line) => sum + line.quantityOrdered, 0);
  const received = po.lines.reduce(
    (sum, line) => sum + line.quantityReceived,
    0,
  );
  const incoming = ordered - received;
  const shipments = new Map(
    po.lines.flatMap((line) =>
      line.shipmentLines.map((shipmentLine) => [
        shipmentLine.importShipment.id,
        shipmentLine.importShipment,
      ]),
    ),
  );

  return (
    <main className="page-wrap supply-detail-page">
      <PageHeader
        eyebrow="Supply / Purchase Orders"
        title={formatPurchaseOrderNumber(po.purchaseOrderNumber)}
        titleMeta={
          <span className={`status status--${po.status.toLowerCase()}`}>
            {purchaseOrderStatusLabels[po.status]}
          </span>
        }
        description={`${po.supplier.name} · created by ${po.createdBy.name}`}
      />
      <div className="detail-actions">
        <Link className="text-link back-link" href="/purchase-orders">
          <ArrowLeft aria-hidden="true" /> All purchase orders
        </Link>
        {canWrite ? (
          <div>
            {po.status === "DRAFT" ? (
              <Link
                className="button button--secondary"
                href={`/purchase-orders/${id}/edit`}
              >
                <Pencil aria-hidden="true" /> Edit draft
              </Link>
            ) : null}
            {po.status === "PLACED" && incoming > 0 ? (
              <Link className="button button--dark" href="/imports/new">
                <Plus aria-hidden="true" /> Create import
              </Link>
            ) : null}
            {["DRAFT", "PLACED"].includes(po.status) ? (
              <PurchaseOrderStatusButtons
                placeAction={
                  po.status === "DRAFT"
                    ? changePurchaseOrderStatusAction.bind(null, id, "PLACED")
                    : undefined
                }
                cancelAction={changePurchaseOrderStatusAction.bind(
                  null,
                  id,
                  "CANCELLED",
                )}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <section
        className="supply-summary-strip supply-summary-strip--six"
        aria-label="Purchase order summary"
      >
        <div>
          <span>Supplier</span>
          <strong>
            <Link href={`/suppliers/${po.supplierId}`}>{po.supplier.name}</Link>
          </strong>
        </div>
        <SummaryFact
          label="Supplier Reference"
          value={po.supplierReference ?? "Not recorded"}
        />
        <SummaryFact label="Currency" value={po.currency} />
        <SummaryFact
          label="Exchange Rate"
          value={`${po.exchangeRateToMvr.toString()} → MVR`}
        />
        <SummaryFact label="Placed" value={formatDate(po.placedAt)} />
        <SummaryFact label="ETA" value={formatDate(po.expectedAt)} />
      </section>

      <div className="supply-detail-grid">
        <section className="detail-section supply-main-panel">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Ordered Items</p>
              <h2>Products and variants</h2>
            </div>
            <span>{incoming} incoming</span>
          </div>
          <div className="supply-table supply-table--po">
            <div className="supply-table-row supply-table-head">
              <span>Product / Variant</span>
              <span>SKU</span>
              <span>Ordered</span>
              <span>Received</span>
              <span>Remaining</span>
              <span>Unit Cost</span>
              <span>MVR Cost</span>
            </div>
            {po.lines.map((line) => (
              <div className="supply-table-row" key={line.id}>
                <span>
                  <strong>
                    {line.productCode} ·{" "}
                    {[line.color, line.size].filter(Boolean).join(" / ") ||
                      "Default"}
                  </strong>
                  <small>{line.productName}</small>
                </span>
                <span data-label="SKU">{line.sku}</span>
                <span data-label="Ordered">{line.quantityOrdered}</span>
                <span data-label="Received">{line.quantityReceived}</span>
                <span data-label="Remaining">
                  <strong>
                    {line.quantityOrdered - line.quantityReceived}
                  </strong>
                </span>
                <span data-label="Unit Cost">
                  {po.currency} {line.unitCost.toFixed(4)}
                </span>
                <span data-label="MVR Cost">
                  {formatMVR(
                    line.unitCost
                      .mul(po.exchangeRateToMvr)
                      .mul(line.quantityOrdered),
                  )}
                </span>
              </div>
            ))}
          </div>
          {po.notes || po.supplierReference ? (
            <div className="supply-notes">
              <span>Supplier reference / notes</span>
              <p>
                {[po.supplierReference, po.notes].filter(Boolean).join(" · ")}
              </p>
            </div>
          ) : null}
        </section>

        <aside className="supply-side-rail">
          <section className="detail-section supply-summary-card">
            <div className="detail-section-head">
              <div>
                <p className="kicker">Purchase Summary</p>
                <h2>Committed supply</h2>
              </div>
            </div>
            <dl className="rail-money-list">
              <div>
                <dt>Supplier Total</dt>
                <dd>
                  {po.currency} {supplierTotal.toFixed(2)}
                </dd>
              </div>
              <div>
                <dt>Product Cost</dt>
                <dd>{formatMVR(productCostMvr)}</dd>
              </div>
              <div>
                <dt>Recorded Payments</dt>
                <dd>{formatMVR(recordedPayments)}</dd>
              </div>
              <div>
                <dt>Unrecorded Against Cost</dt>
                <dd>{formatMVR(unrecordedAgainstCost)}</dd>
              </div>
            </dl>
            <dl className="rail-stat-list rail-stat-list--compact">
              <RailStat label="Units Ordered" value={ordered} />
              <RailStat label="Units Received" value={received} />
              <RailStat label="Incoming" value={incoming} />
            </dl>
          </section>
        </aside>
      </div>

      <section className="detail-section compact-detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Related Imports</p>
            <h2>Shipment context</h2>
          </div>
        </div>
        {shipments.size ? (
          <div className="activity-list compact-activity-list">
            {[...shipments.values()].map((shipment) => (
              <Link href={`/imports/${shipment.id}`} key={shipment.id}>
                <span>
                  <strong>{formatImportNumber(shipment.importNumber)}</strong>
                  <small>
                    {shipment.freightForwarder} · ETA{" "}
                    {formatDate(shipment.estimatedArrival)}
                  </small>
                </span>
                <span
                  className={`status status--${shipment.status.toLowerCase()}`}
                >
                  {importShipmentStatusLabels[shipment.status]}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="compact-empty">
            <div>
              <strong>Not assigned to an import yet.</strong>
              <p>
                Create an import when this stock enters the logistics workflow.
              </p>
            </div>
          </div>
        )}
      </section>
      <FileAttachmentsPanel
        staff={staff}
        target={{ type: "PURCHASE_ORDER", id: id }}
        targetLabel={formatPurchaseOrderNumber(po.purchaseOrderNumber)}
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

function RailStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
