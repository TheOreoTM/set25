import Link from "next/link";
import { Select } from "@/components/ui/select";
import { ArrowRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getImports } from "@/lib/supply/data";
import { formatDate } from "@/lib/supply/presentation";
import {
  IMPORT_SHIPMENT_STATUSES,
  formatImportNumber,
  formatPurchaseOrderNumber,
  importShipmentStatusLabels,
} from "@set25/shared";

export const metadata = { title: "Imports" };
export default async function ImportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filters = {
    search: typeof query.search === "string" ? query.search : "",
    status: typeof query.status === "string" ? query.status : "",
  };
  const filtered = Boolean(filters.search.trim() || filters.status);
  const [staff, imports] = await Promise.all([
    requireStaff(),
    getImports(filters),
  ]);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Imports"
        title="Imports"
        description="Consolidated shipments, live logistics status, and stock receiving."
      />
      <div className="resource-toolbar">
        <form className="filter-bar filter-bar--single" action="/imports">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search imports</span>
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="Import, tracking, or forwarder"
            />
          </label>
          <label>
            <span className="sr-only">Status</span>
            <Select name="status" defaultValue={filters.status}>
              <option value="">All statuses</option>
              {IMPORT_SHIPMENT_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {importShipmentStatusLabels[status]}
                </option>
              ))}
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
          <Link className="button button--dark" href="/imports/new">
            <Plus aria-hidden="true" /> New import
          </Link>
        ) : null}
      </div>
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
              <span className="num">Units</span>
              <span>ETA</span>
              <span className="col-desktop">Freight Forwarder</span>
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
                  <span data-label="Status" className="row-status">
                    <span
                      className={`status status--${shipment.status.toLowerCase()}`}
                    >
                      {importShipmentStatusLabels[shipment.status]}
                    </span>
                  </span>
                  <span data-label="Supply" className="supply-lines">
                    {pos.length ? (
                      <>
                        <strong>{pos.join(", ")}</strong>
                        <small>{suppliers.join(", ")}</small>
                      </>
                    ) : (
                      <small>No lines yet</small>
                    )}
                  </span>
                  <span data-label="Units" className="num">
                    {units}
                  </span>
                  <span data-label="ETA">
                    {formatDate(shipment.estimatedArrival)}
                  </span>
                  <span data-label="Freight Forwarder" className="col-desktop">
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
            {filtered ? (
              <p>No imports match these filters.</p>
            ) : (
              <>
                <p>No imports yet.</p>
                <span>Place a purchase order before creating a shipment.</span>
                {staff.role !== "STAFF" ? (
                  <Link href="/imports/new">
                    Create the first import <ArrowRight aria-hidden="true" />
                  </Link>
                ) : null}
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
