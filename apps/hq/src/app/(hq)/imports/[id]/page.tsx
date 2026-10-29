import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ShipmentCostEditor } from "@/components/supply/import-form";
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
import { toReceiveShipmentDto } from "@/lib/supply/dto";
import { getRecordedMoneyOut } from "@/lib/money/data";
import { formatDate, formatDateTime } from "@/lib/supply/presentation";
import {
  COST_ALLOCATION_METHODS,
  costAllocationMethodLabels,
  formatImportNumber,
  formatMVR,
  formatPurchaseOrderNumber,
  importShipmentStatusLabels,
} from "@set25/shared";
import { FileAttachmentsPanel } from "@/components/files/file-attachments-panel";

const journey = [
  "PLANNING",
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
  const [staff, shipment, recordedMoneyOut] = await Promise.all([
    requireStaff(),
    getImport(id),
    getRecordedMoneyOut({ importShipmentId: id }),
  ]);
  if (!shipment) notFound();

  const canWrite = staff.role !== "STAFF";
  const locked = ["RECEIVED", "CANCELLED"].includes(shipment.status);
  const readyToReceive = shipment.status === "READY_FOR_COLLECTION";
  const units = shipment.lines.reduce(
    (sum, line) => sum + line.quantityShipped,
    0,
  );
  const currentIndex = journey.indexOf(
    shipment.status as (typeof journey)[number],
  );
  const costs = new Map(shipment.preview.lines.map((line) => [line.id, line]));
  const supplyGroups = new Map<number, { id: string; supplier: string }>();
  for (const line of shipment.lines) {
    supplyGroups.set(line.purchaseOrderLine.purchaseOrder.purchaseOrderNumber, {
      id: line.purchaseOrderLine.purchaseOrder.id,
      supplier: line.purchaseOrderLine.purchaseOrder.supplier.name,
    });
  }
  const receiveDto = toReceiveShipmentDto(shipment);

  return (
    <main className="page-wrap supply-detail-page import-detail-page">
      <PageHeader
        eyebrow="Supply / Imports"
        title={formatImportNumber(shipment.importNumber)}
        titleMeta={
          <span className={`status status--${shipment.status.toLowerCase()}`}>
            {importShipmentStatusLabels[shipment.status]}
          </span>
        }
        description={`${shipment.freightForwarder}${shipment.trackingReference ? ` · ${shipment.trackingReference}` : ""}`}
      />
      <div className="detail-actions">
        <Link className="text-link back-link" href="/imports">
          <ArrowLeft aria-hidden="true" /> All imports
        </Link>
      </div>

      <section className="supply-summary-strip" aria-label="Import summary">
        <SummaryFact label="Forwarder" value={shipment.freightForwarder} />
        <SummaryFact label="Units" value={String(units)} />
        <SummaryFact
          label="ETA"
          value={formatDate(shipment.estimatedArrival)}
        />
        <SummaryFact
          label="Tracking / Departure"
          value={
            shipment.trackingReference ??
            formatDate(shipment.estimatedDeparture)
          }
        />
        <SummaryFact
          label="Total Import Cost"
          value={formatMVR(shipment.preview.totalCostMvr)}
        />
      </section>

      <div className="supply-detail-grid import-workflow-grid">
        <section className="detail-section supply-main-panel journey-panel">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Shipment Journey</p>
              <h2>{importShipmentStatusLabels[shipment.status]}</h2>
            </div>
          </div>
          <ol className="shipment-timeline shipment-timeline--horizontal">
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
                  <span>{complete ? "✓" : active ? "●" : "○"}</span>
                  <strong>{importShipmentStatusLabels[status]}</strong>
                </li>
              );
            })}
          </ol>
          {canWrite && !locked ? (
            <div className="workflow-control">
              <div>
                <p className="kicker">Next Movement</p>
                <h3>Update shipment status</h3>
              </div>
              <ShipmentStatusForm
                action={changeShipmentStatusAction.bind(null, id)}
                current={shipment.status}
              />
            </div>
          ) : null}
        </section>

        <aside className="supply-side-rail">
          <section className="detail-section cost-rail-card">
            <div className="detail-section-head">
              <div>
                <p className="kicker">Actual Cost to SET25</p>
                <h2>Cost breakdown</h2>
              </div>
            </div>
            <dl className="cost-breakdown cost-breakdown--compact">
              <CostRow
                label="Product Cost"
                value={formatMVR(shipment.preview.productCostMvr)}
              />
              <CostRow
                label="China Shipping"
                value={formatMVR(shipment.chinaShippingMvr)}
              />
              <CostRow
                label="International / ICL"
                value={formatMVR(shipment.internationalShippingMvr)}
              />
              <CostRow
                label="Tax / Fees"
                value={formatMVR(shipment.taxFeesMvr)}
              />
              <CostRow label="Other" value={formatMVR(shipment.otherFeesMvr)} />
              <div className="cost-total">
                <dt>Total</dt>
                <dd>{formatMVR(shipment.preview.totalCostMvr)}</dd>
              </div>
              <CostRow
                label="Recorded related Money Out"
                value={formatMVR(recordedMoneyOut)}
              />
            </dl>
            <div className="cost-allocation-note">
              <span>Allocation</span>
              <strong>
                {costAllocationMethodLabels[shipment.costAllocationMethod]}
              </strong>
            </div>
            {canWrite && !locked ? (
              <ShipmentCostEditor
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
            ) : null}
          </section>
          {canWrite && readyToReceive ? (
            <section className="receive-callout">
              <p className="kicker">Ready to Receive</p>
              <strong>
                {units} {units === 1 ? "unit" : "units"}
              </strong>
              <span>
                {formatMVR(shipment.preview.totalCostMvr)} actual import cost
              </span>
              <ReceiveShipment
                action={receiveShipmentAction.bind(null, id)}
                receive={receiveDto}
              />
            </section>
          ) : null}
        </aside>
      </div>

      <section className="detail-section compact-detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Shipment Contents</p>
            <h2>Products and purchase orders</h2>
          </div>
          <span>
            {units} {units === 1 ? "unit" : "units"}
          </span>
        </div>
        {shipment.lines.length ? (
          <>
            <div className="supply-context">
              {[...supplyGroups.entries()].map(([number, po]) => (
                <Link href={`/purchase-orders/${po.id}`} key={number}>
                  <strong>{formatPurchaseOrderNumber(number)}</strong>
                  <span>{po.supplier}</span>
                </Link>
              ))}
            </div>
            <div className="supply-table supply-table--import-detail">
              <div className="supply-table-row supply-table-head">
                <span>Product / Variant</span>
                <span>Source</span>
                <span>Shipped</span>
                <span>Received</span>
                <span>Product Cost</span>
                <span>Allocated Fees</span>
                <span>Actual Cost / Unit</span>
              </div>
              {shipment.lines.map((line) => {
                const cost = costs.get(line.id)!;
                return (
                  <div className="supply-table-row" key={line.id}>
                    <span>
                      <strong>{line.purchaseOrderLine.productName}</strong>
                      <small>
                        {[
                          line.purchaseOrderLine.color,
                          line.purchaseOrderLine.size,
                        ]
                          .filter(Boolean)
                          .join(" / ") || "Default"}
                      </small>
                      <small>{line.purchaseOrderLine.sku}</small>
                    </span>
                    <span data-label="Source">
                      <strong>
                        <Link
                          href={`/purchase-orders/${line.purchaseOrderLine.purchaseOrder.id}`}
                        >
                          {formatPurchaseOrderNumber(
                            line.purchaseOrderLine.purchaseOrder
                              .purchaseOrderNumber,
                          )}
                        </Link>
                      </strong>
                      <small>
                        {line.purchaseOrderLine.purchaseOrder.supplier.name}
                      </small>
                    </span>
                    <span data-label="Shipped">{line.quantityShipped}</span>
                    <span data-label="Received">{line.quantityReceived}</span>
                    <span data-label="Product Cost">
                      {formatMVR(cost.productCostMvr)}
                    </span>
                    <span data-label="Allocated Fees">
                      {formatMVR(
                        line.allocatedSharedCostMvr ??
                          cost.allocatedSharedCostMvr,
                      )}
                    </span>
                    <span data-label="Actual Cost / Unit">
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
          </>
        ) : (
          <div className="inline-empty inline-empty--compact">
            <p>No items in this shipment yet.</p>
            <span>Add purchase order lines when creating the import.</span>
          </div>
        )}
      </section>

      <section className="detail-section compact-detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Shipment Events</p>
            <h2>Status history</h2>
          </div>
        </div>
        {shipment.events.length ? (
          <div className="shipment-event-list">
            {[...shipment.events].reverse().map((event) => (
              <article key={event.id}>
                <time dateTime={event.createdAt.toISOString()}>
                  {formatDateTime(event.createdAt)}
                </time>
                <span className="event-marker" />
                <div>
                  <strong>{importShipmentStatusLabels[event.status]}</strong>
                  <p>{event.notes ?? "Status updated"}</p>
                  <small>{event.createdBy.name}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="inline-empty inline-empty--compact">
            <p>No status changes yet.</p>
          </div>
        )}
      </section>
      <FileAttachmentsPanel
        staff={staff}
        target={{ type: "IMPORT", id: id }}
        targetLabel={formatImportNumber(shipment.importNumber)}
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

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
