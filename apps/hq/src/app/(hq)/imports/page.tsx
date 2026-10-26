import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getImports } from "@/lib/supply/data";
import { formatDate } from "@/lib/supply/presentation";
import {
  formatImportNumber,
  formatPurchaseOrderNumber,
  importShipmentStatusLabels,
} from "@set25/shared";

export const instant = false;

export const metadata = { title: "Imports" };
export default async function ImportsPage() {
  const [staff, imports] = await Promise.all([requireStaff(), getImports()]);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Imports"
        title="Imports"
        description="Consolidated shipments, live logistics status, and stock receiving."
      />
      {staff.role !== "STAFF" ? (
        <div className="detail-actions detail-actions--end">
          <Link className="button button--dark" href="/imports/new">
            <Plus aria-hidden="true" /> New import
          </Link>
        </div>
      ) : null}
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Logistics</p>
            <h2>
              {imports.length} {imports.length === 1 ? "import" : "imports"}
            </h2>
          </div>
          <p>Newest first</p>
        </div>
        {imports.length ? (
          <div className="supply-list">
            <div className="supply-row supply-row--import supply-row--head">
              <span>Import</span>
              <span>Status</span>
              <span>Supply</span>
              <span>Units</span>
              <span>ETA</span>
              <span>Freight Forwarder</span>
              <span />
            </div>
            {imports.map((shipment) => {
              const units = shipment.lines.reduce(
                (sum, line) => sum + line.quantityShipped,
                0,
              );
              const pos = [
                ...new Set(
                  shipment.lines.map((line) =>
                    formatPurchaseOrderNumber(
                      line.purchaseOrderLine.purchaseOrder.purchaseOrderNumber,
                    ),
                  ),
                ),
              ];
              const suppliers = [
                ...new Set(
                  shipment.lines.map(
                    (line) =>
                      line.purchaseOrderLine.purchaseOrder.supplier.name,
                  ),
                ),
              ];
              return (
                <Link
                  className="supply-row supply-row--import"
                  href={`/imports/${shipment.id}`}
                  key={shipment.id}
                >
                  <span className="commerce-primary">
                    <strong>{formatImportNumber(shipment.importNumber)}</strong>
                    <small>
                      {shipment.trackingReference ?? "No tracking reference"}
                    </small>
                  </span>
                  <span data-label="Status">
                    <span
                      className={`status status--${shipment.status.toLowerCase()}`}
                    >
                      {importShipmentStatusLabels[shipment.status]}
                    </span>
                  </span>
                  <span data-label="Supply">
                    <strong>{pos.join(", ")}</strong>
                    <small> / {suppliers.join(", ")}</small>
                  </span>
                  <span data-label="Units">{units}</span>
                  <span data-label="ETA">
                    {formatDate(shipment.estimatedArrival)}
                  </span>
                  <span data-label="Freight Forwarder">
                    {shipment.freightForwarder}
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
            <p>No imports yet.</p>
            <span>Place a purchase order before creating a shipment.</span>
            {staff.role !== "STAFF" ? (
              <Link href="/imports/new">
                Create the first import <ArrowRight aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
