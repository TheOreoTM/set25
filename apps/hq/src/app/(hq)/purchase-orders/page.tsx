import Link from "next/link";
import { Select } from "@/components/ui/select";
import { ArrowRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getPurchaseOrders } from "@/lib/supply/data";
import {
  PURCHASE_ORDER_STATUSES,
  formatPurchaseOrderNumber,
  purchaseOrderStatusLabels,
} from "@set25/shared";
import { formatDate } from "@/lib/supply/presentation";

export const instant = false;

export const metadata = { title: "Purchase Orders" };
export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filters = {
    search: typeof query.search === "string" ? query.search : "",
    status: typeof query.status === "string" ? query.status : "",
  };
  const [staff, orders] = await Promise.all([
    requireStaff(),
    getPurchaseOrders(filters),
  ]);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Purchase Orders"
        title="Purchase Orders"
        description="Agreed supplier quantities, prices, and incoming stock."
      />
      <div className="resource-toolbar">
        <form className="filter-bar" action="/purchase-orders">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search purchase orders</span>
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="PO, supplier, or reference"
            />
          </label>
          <label>
            <span className="sr-only">Status</span>
            <Select name="status" defaultValue={filters.status}>
              <option value="">All statuses</option>
              {PURCHASE_ORDER_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {purchaseOrderStatusLabels[status]}
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
          <Link className="button button--dark" href="/purchase-orders/new">
            <Plus aria-hidden="true" /> New PO
          </Link>
        ) : null}
      </div>
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Buying</p>
            <h2>
              {orders.length} purchase{" "}
              {orders.length === 1 ? "order" : "orders"}
            </h2>
          </div>
          <p>Newest first</p>
        </div>
        {orders.length ? (
          <div className="supply-list">
            <div className="supply-row supply-row--po supply-row--head">
              <span>Purchase Order</span>
              <span>Supplier</span>
              <span>Status</span>
              <span>Items</span>
              <span>Ordered</span>
              <span>Received</span>
              <span>ETA</span>
              <span />
            </div>
            {orders.map((po) => {
              const ordered = po.lines.reduce(
                (sum, line) => sum + line.quantityOrdered,
                0,
              );
              const received = po.lines.reduce(
                (sum, line) => sum + line.quantityReceived,
                0,
              );
              return (
                <Link
                  className="supply-row supply-row--po"
                  href={`/purchase-orders/${po.id}`}
                  key={po.id}
                >
                  <span className="commerce-primary">
                    <strong>
                      {formatPurchaseOrderNumber(po.purchaseOrderNumber)}
                    </strong>
                    <small>
                      {po.supplierReference ?? "No supplier reference"}
                    </small>
                  </span>
                  <span data-label="Supplier">{po.supplier.name}</span>
                  <span data-label="Status">
                    <span
                      className={`status status--${po.status.toLowerCase()}`}
                    >
                      {purchaseOrderStatusLabels[po.status]}
                    </span>
                  </span>
                  <span data-label="Items">{po.lines.length}</span>
                  <span data-label="Ordered">{ordered}</span>
                  <span data-label="Received">{received}</span>
                  <span data-label="ETA">{formatDate(po.expectedAt)}</span>
                  <span className="catalog-arrow">
                    <ArrowRight aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No purchase orders match these filters.</p>
            {staff.role !== "STAFF" ? (
              <Link href="/purchase-orders/new">
                Create the first purchase order <ArrowRight aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
