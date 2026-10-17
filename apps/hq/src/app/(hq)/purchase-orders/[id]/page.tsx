import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PurchaseOrderStatusButtons } from "@/components/supply/operational-controls";
import { requireStaff } from "@/lib/auth/session";
import { changePurchaseOrderStatusAction } from "@/lib/supply/actions";
import { decimalTotal, getPurchaseOrder } from "@/lib/supply/data";
import { formatDate } from "@/lib/supply/presentation";
import {
  formatImportNumber,
  formatMVR,
  formatPurchaseOrderNumber,
  importShipmentStatusLabels,
  purchaseOrderStatusLabels,
} from "@set25/shared";

export default async function PurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [staff, po] = await Promise.all([requireStaff(), getPurchaseOrder(id)]);
  if (!po) notFound();
  const canWrite = staff.role !== "STAFF";
  const supplierTotal = decimalTotal(po.lines);
  const productCostMvr = supplierTotal.mul(po.exchangeRateToMvr);
  const ordered = po.lines.reduce((sum, line) => sum + line.quantityOrdered, 0);
  const received = po.lines.reduce(
    (sum, line) => sum + line.quantityReceived,
    0,
  );
  const shipments = new Map(
    po.lines.flatMap((line) =>
      line.shipmentLines.map((shipmentLine) => [
        shipmentLine.importShipment.id,
        shipmentLine.importShipment,
      ]),
    ),
  );
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Purchase Orders"
        title={formatPurchaseOrderNumber(po.purchaseOrderNumber)}
        description={`${po.supplier.name} · created by ${po.createdBy.name}`}
      />
      {canWrite ? (
        <div className="detail-actions">
          <Link className="text-link back-link" href="/purchase-orders">
            <ArrowLeft aria-hidden="true" /> All purchase orders
          </Link>
          <div>
            {po.status === "DRAFT" ? (
              <Link
                className="button button--secondary"
                href={`/purchase-orders/${id}/edit`}
              >
                <Pencil aria-hidden="true" /> Edit draft
              </Link>
            ) : null}
            {po.status === "PLACED" && received < ordered ? (
              <Link className="button button--secondary" href="/imports/new">
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
        </div>
      ) : (
        <div className="detail-actions">
          <Link className="text-link back-link" href="/purchase-orders">
            <ArrowLeft aria-hidden="true" /> All purchase orders
          </Link>
        </div>
      )}
      <section className="detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Purchase Order</p>
            <h2>Agreement snapshot</h2>
          </div>
          <span className={`status status--${po.status.toLowerCase()}`}>
            {purchaseOrderStatusLabels[po.status]}
          </span>
        </div>
        <dl className="detail-definition-grid">
          <div>
            <dt>Supplier</dt>
            <dd>
              <Link href={`/suppliers/${po.supplierId}`}>
                {po.supplier.name}
              </Link>
            </dd>
          </div>
          <div>
            <dt>Currency</dt>
            <dd>{po.currency}</dd>
          </div>
          <div>
            <dt>Exchange Rate to MVR</dt>
            <dd>{po.exchangeRateToMvr.toString()}</dd>
          </div>
          <div>
            <dt>Placed</dt>
            <dd>{formatDate(po.placedAt)}</dd>
          </div>
          <div>
            <dt>ETA</dt>
            <dd>{formatDate(po.expectedAt)}</dd>
          </div>
          <div>
            <dt>Supplier reference</dt>
            <dd>{po.supplierReference ?? "Not recorded"}</dd>
          </div>
        </dl>
        {po.notes ? <p className="detail-copy">{po.notes}</p> : null}
      </section>
      <section className="detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Items</p>
            <h2>Ordered stock</h2>
          </div>
          <span>{ordered - received} incoming</span>
        </div>
        <div className="supply-table supply-table--po">
          <div className="supply-table-row supply-table-head">
            <span>Product / Variant</span>
            <span>SKU</span>
            <span>Ordered</span>
            <span>Received</span>
            <span>Remaining</span>
            <span>Unit Cost</span>
            <span>MVR Equivalent</span>
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
                <strong>{line.quantityOrdered - line.quantityReceived}</strong>
              </span>
              <span data-label="Unit Cost">
                {po.currency} {line.unitCost.toFixed(4)}
              </span>
              <span data-label="MVR Equivalent">
                {formatMVR(line.unitCost.mul(po.exchangeRateToMvr))}
              </span>
            </div>
          ))}
        </div>
        <div className="supply-total-strip">
          <div>
            <span>Supplier Total</span>
            <strong>
              {po.currency} {supplierTotal.toFixed(2)}
            </strong>
          </div>
          <div>
            <span>Product Cost in MVR</span>
            <strong>{formatMVR(productCostMvr)}</strong>
          </div>
        </div>
      </section>
      <section className="detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Imports</p>
            <h2>Shipment context</h2>
          </div>
        </div>
        {shipments.size ? (
          <div className="activity-list">
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
          <div className="inline-empty">
            <p>No import shipment has been assigned yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}
