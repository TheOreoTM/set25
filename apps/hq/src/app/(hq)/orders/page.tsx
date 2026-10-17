import Link from "next/link";
import { Select } from "@/components/ui/select";
import { ArrowRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  FULFILMENT_STATUSES,
  ORDER_SOURCES,
  fulfilmentStatusLabels,
  formatMVR,
  formatOrderNumber,
  orderSourceLabels,
  paymentStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { getOrders } from "@/lib/commerce/data";
import { paymentSummary } from "@/lib/commerce/money";
import { requireStaff } from "@/lib/auth/session";

export const instant = false;

export const metadata = { title: "Orders" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? params[key] : "";
  const filters = {
    search: value("search"),
    fulfilment: value("fulfilment"),
    payment: value("payment"),
    source: value("source"),
    type: "STANDARD" as const,
  };
  const [orders, staff] = await Promise.all([
    getOrders(filters),
    requireStaff(),
  ]);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Commerce / Orders"
        title="Orders"
        description="Sales, payment position, and fulfilment in one operational queue."
      />
      <div className="resource-toolbar">
        <form className="filter-bar commerce-filter-bar">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search orders</span>
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="Order, customer, phone, team, or SKU"
            />
          </label>
          <label>
            <span className="sr-only">Fulfilment</span>
            <Select name="fulfilment" defaultValue={filters.fulfilment}>
              <option value="">All fulfilment</option>
              {FULFILMENT_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {fulfilmentStatusLabels[status]}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">Payment</span>
            <Select name="payment" defaultValue={filters.payment}>
              <option value="">All payments</option>
              {Object.entries(paymentStatusLabels).map(([status, label]) => (
                <option value={status} key={status}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">Source</span>
            <Select name="source" defaultValue={filters.source}>
              <option value="">All sources</option>
              {ORDER_SOURCES.map((source) => (
                <option value={source} key={source}>
                  {orderSourceLabels[source]}
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
          <Link className="button button--dark" href="/orders/new">
            <Plus aria-hidden="true" /> New order
          </Link>
        ) : null}
      </div>
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Sales queue</p>
            <h2>
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </h2>
          </div>
          <p>Newest first</p>
        </div>
        {orders.length ? (
          <div className="commerce-list commerce-list--orders">
            <div className="commerce-row commerce-row--head">
              <span>Order</span>
              <span>Customer</span>
              <span>Source</span>
              <span>Total</span>
              <span>Payment</span>
              <span>Fulfilment</span>
              <span>Date</span>
              <span />
            </div>
            {orders.map((order) => {
              const payment = paymentSummary(order.total, order.payments);
              return (
                <Link
                  className={`commerce-row ${["UNPAID", "PART_PAID"].includes(payment.status) ? "commerce-row--attention" : ""}`}
                  href={`/orders/${order.id}`}
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
                  <span data-label="Source">
                    {orderSourceLabels[order.source]}
                  </span>
                  <span data-label="Total" className="numeric">
                    <strong>{formatMVR(order.total)}</strong>
                  </span>
                  <span data-label="Payment">
                    <span
                      className={`status status--${payment.status.toLowerCase()}`}
                    >
                      {paymentStatusLabels[payment.status]}
                    </span>
                  </span>
                  <span data-label="Fulfilment">
                    <span
                      className={`status status--${order.fulfilmentStatus.toLowerCase()}`}
                    >
                      {fulfilmentStatusLabels[order.fulfilmentStatus]}
                    </span>
                  </span>
                  <span data-label="Date">{formatDate(order.createdAt)}</span>
                  <span className="catalog-arrow">
                    <ArrowRight aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No orders match these filters.</p>
            {staff.role !== "STAFF" ? (
              <Link href="/orders/new">
                Create the first order <ArrowRight aria-hidden="true" />
              </Link>
            ) : null}
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
