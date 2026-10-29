import Link from "next/link";
import { Select } from "@/components/ui/select";
import { ArrowRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  PREORDER_STATUSES,
  formatMVR,
  formatOrderNumber,
  paymentStatusLabels,
  preorderStatusLabels,
  type PreorderStatusValue,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { getOrders } from "@/lib/commerce/data";
import { paymentSummary } from "@/lib/commerce/money";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Preorders" };

export default async function PreordersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const requestedStatus =
    typeof params.status === "string" ? params.status : "";
  const paymentFilter =
    typeof params.payment === "string" ? params.payment : "";
  const [allOrders, staff] = await Promise.all([
    getOrders({ search, payment: paymentFilter, type: "PREORDER" }),
    requireStaff(),
  ]);
  const orders = PREORDER_STATUSES.includes(
    requestedStatus as PreorderStatusValue,
  )
    ? allOrders.filter((order) => order.preorder?.status === requestedStatus)
    : allOrders;
  const filtered = Boolean(search || requestedStatus || paymentFilter);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Launch / Preorders"
        title="Preorders"
        description="Deposits, balances, arrival expectations, and customer readiness."
      />
      <div className="resource-toolbar">
        <form className="filter-bar commerce-filter-bar preorder-filter-bar">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search preorders</span>
            <input
              name="search"
              defaultValue={search}
              placeholder="Order, customer or SKU"
            />
          </label>
          <label>
            <span className="sr-only">Preorder status</span>
            <Select name="status" defaultValue={requestedStatus}>
              <option value="">All statuses</option>
              {PREORDER_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {preorderStatusLabels[status]}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">Payment status</span>
            <Select name="payment" defaultValue={paymentFilter}>
              <option value="">All payments</option>
              {Object.entries(paymentStatusLabels).map(([status, label]) => (
                <option value={status} key={status}>
                  {label}
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
          <Link className="button button--dark" href="/preorders/new">
            <Plus aria-hidden="true" /> New preorder
          </Link>
        ) : null}
      </div>
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Preorder queue</p>
            <h2>
              {orders.length} {orders.length === 1 ? "preorder" : "preorders"}
            </h2>
          </div>
          <p>Does not count as available stock</p>
        </div>
        {orders.length ? (
          <div className="commerce-list commerce-list--preorders">
            <div className="commerce-row commerce-row--head">
              <span>Preorder</span>
              <span>Customer</span>
              <span className="num col-wide">Total</span>
              <span className="num col-wide">Amount Paid</span>
              <span className="num">Balance Left</span>
              <span>Payment</span>
              <span>ETA</span>
              <span>Status</span>
              <span />
            </div>
            {orders.map((order) => {
              const payment = paymentSummary(order.total, order.payments);
              return (
                <Link
                  className={`commerce-row ${["UNPAID", "PART_PAID"].includes(payment.status) ? "commerce-row--attention" : ""}`}
                  href={`/preorders/${order.id}`}
                  key={order.id}
                >
                  <span className="commerce-primary">
                    <strong>{formatOrderNumber(order.orderNumber)}</strong>
                    <small>
                      {order._count.lines}{" "}
                      {order._count.lines === 1 ? "item" : "items"}
                    </small>
                  </span>
                  <span data-label="Customer">
                    {order.customer?.name ?? order.team?.name ?? "Not recorded"}
                  </span>
                  <span data-label="Total" className="numeric num col-wide">
                    {formatMVR(order.total)}
                  </span>
                  <span
                    data-label="Amount Paid"
                    className="numeric num col-wide"
                  >
                    {formatMVR(payment.paid)}
                  </span>
                  <span data-label="Balance Left" className="numeric num">
                    <strong>{formatMVR(payment.balance)}</strong>
                  </span>
                  <span data-label="Payment">
                    <span
                      className={`status status--${payment.status.toLowerCase()}`}
                    >
                      {paymentStatusLabels[payment.status]}
                    </span>
                  </span>
                  <span data-label="ETA">
                    {order.preorder?.estimatedArrival
                      ? formatDate(order.preorder.estimatedArrival)
                      : "Not set"}
                  </span>
                  <span data-label="Status" className="row-status">
                    <span
                      className={`status status--${order.preorder?.status.toLowerCase()}`}
                    >
                      {order.preorder
                        ? preorderStatusLabels[order.preorder.status]
                        : "Missing"}
                    </span>
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
              <>
                <p>No preorders match these filters.</p>
                <span>Try a different search or filter.</span>
                <Link href="/preorders">
                  Clear filters <ArrowRight aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p>No preorders yet.</p>
                {staff.role !== "STAFF" ? (
                  <Link href="/preorders/new">
                    Create the first preorder <ArrowRight aria-hidden="true" />
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Indian/Maldives",
  }).format(value);
}
