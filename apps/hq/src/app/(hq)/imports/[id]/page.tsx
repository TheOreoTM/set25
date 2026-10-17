import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ShipmentCostForm } from "@/components/supply/import-form";
import {
  ReceiveShipment,
  ShipmentStatusForm,
} from "@/components/supply/operational-controls";
import { requireStaff } from "@/lib/auth/session";
import {
  changeShipmentStatusAction,
  receiveShipmentAction,
  updateShipmentCostsAction,
} from "@/lib/supply/actions";
import { getImport } from "@/lib/supply/data";
import { formatDate, formatDateTime } from "@/lib/supply/presentation";
import {
  COST_ALLOCATION_METHODS,
  formatImportNumber,
  formatMVR,
  formatPurchaseOrderNumber,
  importShipmentStatusLabels,
  costAllocationMethodLabels,
} from "@set25/shared";

const journey = [
  "SUPPLIER_SHIPPING",
  "CHINA_WAREHOUSE",
  "READY_TO_SHIP",
  "IN_TRANSIT",
  "MALDIVES_CUSTOMS",
  "READY_FOR_COLLECTION",
  "RECEIVED",
] as const;

export default async function ImportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [staff, shipment] = await Promise.all([requireStaff(), getImport(id)]);
  if (!shipment) notFound();
  const canWrite = staff.role !== "STAFF";
  const locked = ["RECEIVED", "CANCELLED"].includes(shipment.status);
  const currentIndex = journey.indexOf(
    shipment.status as (typeof journey)[number],
  );
  const costs = new Map(shipment.preview.lines.map((line) => [line.id, line]));
  const supplyGroups = new Map<number, { id: string; supplier: string }>();
  for (const line of shipment.lines)
    supplyGroups.set(line.purchaseOrderLine.purchaseOrder.purchaseOrderNumber, {
      id: line.purchaseOrderLine.purchaseOrder.id,
      supplier: line.purchaseOrderLine.purchaseOrder.supplier.name,
    });
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Imports"
        title={formatImportNumber(shipment.importNumber)}
        description={`${shipment.freightForwarder} · created by ${shipment.createdBy.name}`}
      />
      <div className="detail-actions">
        <Link className="text-link back-link" href="/imports">
          <ArrowLeft aria-hidden="true" /> All imports
        </Link>
        <div>
          {canWrite && !locked ? (
            <ReceiveShipment
              action={receiveShipmentAction.bind(null, id)}
              shipment={shipment}
              lines={shipment.lines.map((line) => ({
                id: line.id,
                label: `${line.purchaseOrderLine.productCode} · ${[line.purchaseOrderLine.color, line.purchaseOrderLine.size].filter(Boolean).join(" / ") || "Default"}`,
                sku: line.purchaseOrderLine.sku,
                quantity: line.quantityShipped,
                actualUnitCost: costs
                  .get(line.id)!
                  .actualUnitCostMvr.toString(),
              }))}
            />
          ) : null}
        </div>
      </div>
      <div className="import-hero">
        <section className="detail-section">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Status</p>
              <h2>{importShipmentStatusLabels[shipment.status]}</h2>
            </div>
            <span className={`status status--${shipment.status.toLowerCase()}`}>
              {importShipmentStatusLabels[shipment.status]}
            </span>
          </div>
          <dl className="detail-definition-grid">
            <div>
              <dt>Freight Forwarder</dt>
              <dd>{shipment.freightForwarder}</dd>
            </div>
            <div>
              <dt>Tracking Reference</dt>
              <dd>{shipment.trackingReference ?? "Not recorded"}</dd>
            </div>
            <div>
              <dt>Estimated Departure</dt>
              <dd>{formatDate(shipment.estimatedDeparture)}</dd>
            </div>
            <div>
              <dt>ETA</dt>
              <dd>{formatDate(shipment.estimatedArrival)}</dd>
            </div>
            <div>
              <dt>Received</dt>
              <dd>{formatDate(shipment.receivedAt)}</dd>
            </div>
            <div>
              <dt>Allocation</dt>
              <dd>
                {costAllocationMethodLabels[shipment.costAllocationMethod]}
              </dd>
            </div>
          </dl>
          {shipment.notes ? (
            <p className="detail-copy">{shipment.notes}</p>
          ) : null}
        </section>
        <section className="detail-section">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Logistics</p>
              <h2>Shipment journey</h2>
            </div>
          </div>
          <ol className="shipment-timeline">
            {journey.map((status, index) => {
              const complete =
                shipment.status === "RECEIVED" ||
                (currentIndex >= 0 && index < currentIndex);
              const active = status === shipment.status;
              return (
                <li
                  className={
                    complete ? "is-complete" : active ? "is-active" : ""
                  }
                  key={status}
                >
                  <span>{complete ? "✓" : active ? "●" : ""}</span>
                  <strong>{importShipmentStatusLabels[status]}</strong>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
      <section className="detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Supply</p>
            <h2>Purchase orders and items</h2>
          </div>
          <span>
            {shipment.lines.reduce(
              (sum, line) => sum + line.quantityShipped,
              0,
            )}{" "}
            units
          </span>
        </div>
        <div className="supply-context">
          {[...supplyGroups.entries()].map(([number, po]) => (
            <Link href={`/purchase-orders/${po.id}`} key={number}>
              <strong>{formatPurchaseOrderNumber(number)}</strong>
              <span>{po.supplier}</span>
            </Link>
          ))}
        </div>
        <div className="supply-table supply-table--import">
          <div className="supply-table-row supply-table-head">
            <span>Product / Variant</span>
            <span>SKU</span>
            <span>Shipped</span>
            <span>Received</span>
            <span>Product Cost</span>
            <span>Allocated Fees</span>
            <span>Actual Cost Each</span>
          </div>
          {shipment.lines.map((line) => {
            const cost = costs.get(line.id)!;
            return (
              <div className="supply-table-row" key={line.id}>
                <span>
                  <strong>
                    {line.purchaseOrderLine.productCode} ·{" "}
                    {[line.purchaseOrderLine.color, line.purchaseOrderLine.size]
                      .filter(Boolean)
                      .join(" / ") || "Default"}
                  </strong>
                  <small>
                    {line.purchaseOrderLine.purchaseOrder.supplier.name}
                  </small>
                </span>
                <span data-label="SKU">{line.purchaseOrderLine.sku}</span>
                <span data-label="Shipped">{line.quantityShipped}</span>
                <span data-label="Received">{line.quantityReceived}</span>
                <span data-label="Product Cost">
                  {formatMVR(cost.productCostMvr)}
                </span>
                <span data-label="Allocated Fees">
                  {formatMVR(
                    line.allocatedSharedCostMvr ?? cost.allocatedSharedCostMvr,
                  )}
                </span>
                <span data-label="Actual Cost Each">
                  <strong>
                    {formatMVR(
                      line.actualUnitCostMvr ?? cost.actualUnitCostMvr,
                    )}
                  </strong>
                </span>
              </div>
            );
          })}
        </div>
      </section>
      <section className="detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Actual Cost to SET25</p>
            <h2>Cost breakdown</h2>
          </div>
          <span>
            {costAllocationMethodLabels[shipment.costAllocationMethod]}
          </span>
        </div>
        <dl className="cost-breakdown">
          <div>
            <dt>Product Cost</dt>
            <dd>{formatMVR(shipment.preview.productCostMvr)}</dd>
          </div>
          <div>
            <dt>China Shipping</dt>
            <dd>{formatMVR(shipment.chinaShippingMvr)}</dd>
          </div>
          <div>
            <dt>International Shipping / ICL</dt>
            <dd>{formatMVR(shipment.internationalShippingMvr)}</dd>
          </div>
          <div>
            <dt>Tax / Fees</dt>
            <dd>{formatMVR(shipment.taxFeesMvr)}</dd>
          </div>
          <div>
            <dt>Other</dt>
            <dd>{formatMVR(shipment.otherFeesMvr)}</dd>
          </div>
          <div className="cost-total">
            <dt>Total Import Cost</dt>
            <dd>{formatMVR(shipment.preview.totalCostMvr)}</dd>
          </div>
        </dl>
        {canWrite && !locked ? (
          <div className="embedded-editor">
            <h3>Update shared costs</h3>
            <ShipmentCostForm
              action={updateShipmentCostsAction.bind(null, id)}
              defaults={{
                chinaShippingMvr: shipment.chinaShippingMvr.toString(),
                internationalShippingMvr:
                  shipment.internationalShippingMvr.toString(),
                taxFeesMvr: shipment.taxFeesMvr.toString(),
                otherFeesMvr: shipment.otherFeesMvr.toString(),
                costAllocationMethod: COST_ALLOCATION_METHODS.includes(
                  shipment.costAllocationMethod,
                )
                  ? shipment.costAllocationMethod
                  : "BY_QUANTITY",
              }}
            />
          </div>
        ) : null}
      </section>
      <div className="detail-columns">
        <section className="detail-section">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Status History</p>
              <h2>Shipment events</h2>
            </div>
          </div>
          <div className="activity-list">
            {shipment.events.map((event) => (
              <div key={event.id}>
                <span>
                  <strong>{importShipmentStatusLabels[event.status]}</strong>
                  <small>{event.notes ?? "Status updated"}</small>
                </span>
                <span>
                  {formatDateTime(event.createdAt)}
                  <small>{event.createdBy.name}</small>
                </span>
              </div>
            ))}
          </div>
        </section>
        {canWrite && !locked ? (
          <section className="detail-section">
            <div className="detail-section-head">
              <div>
                <p className="kicker">Update</p>
                <h2>Move shipment</h2>
              </div>
            </div>
            <ShipmentStatusForm
              action={changeShipmentStatusAction.bind(null, id)}
              current={shipment.status}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}
