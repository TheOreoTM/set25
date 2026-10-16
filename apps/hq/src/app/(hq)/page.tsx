import {
  ArrowRight,
  Box,
  Check,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import {
  fulfilmentStatusLabels,
  formatMVR,
  formatOrderNumber,
  paymentStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { getCommerceDashboard } from "@/lib/commerce/data";
import { paymentSummary } from "@/lib/commerce/money";

const tasks = [
  {
    day: "16",
    month: "OCT",
    title: "Approve CORE reorder",
    meta: "Demo · Stock",
  },
  {
    day: "17",
    month: "OCT",
    title: "Check import documents",
    meta: "Demo · Supply",
  },
  { day: "19", month: "OCT", title: "Team fitting", meta: "Demo · Teams" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const [query, commerce] = await Promise.all([
    searchParams,
    getCommerceDashboard(),
  ]);
  const openOrders = commerce.monthOrders.filter(
    (order) => !["COMPLETED", "CANCELLED"].includes(order.fulfilmentStatus),
  ).length;
  const attentionCount = commerce.attention.length + commerce.lowStock.length;
  const monthName = new Intl.DateTimeFormat("en", {
    month: "long",
    timeZone: "Indian/Maldives",
  }).format(new Date());
  const metrics = [
    {
      label: "Sales this month",
      value: formatMVR(commerce.sales),
      detail: "Completed orders",
      live: true,
    },
    {
      label: "Profit this month",
      value: "Deferred",
      detail: "Defined in the Money milestone",
      live: false,
    },
    {
      label: "Orders this month",
      value: String(commerce.monthOrders.length),
      detail: `${openOrders} need fulfilment`,
      live: true,
    },
    {
      label: "Stock value",
      value: formatMVR(commerce.stockValue),
      detail: "At current product cost",
      live: true,
    },
  ];

  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Overview / Dashboard"
        title="Good morning, team."
        description="Here’s what needs your attention today."
      />
      {query.forbidden === "staff-role" ? (
        <div
          className="form-message form-message--error staff-page-message"
          role="alert"
        >
          Your Staff role currently has read-only access to Dashboard, Products,
          Stock, and Commerce records.
        </div>
      ) : null}
      <div className="demo-notice" role="note">
        <span>Live commerce</span> Orders, payments, sales, and stock are live.
        Profit, incoming supply, and tasks remain marked as deferred or demo.
      </div>

      <section aria-labelledby="month-summary-title">
        <div className="section-heading section-heading--quiet">
          <h2 id="month-summary-title">{monthName} at a glance</h2>
          <p>From current HQ records</p>
        </div>
        <div className="metric-grid">
          {metrics.map((metric) => (
            <article className="metric" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>
                {metric.live ? (
                  <Check aria-hidden="true" />
                ) : (
                  <Clock3 aria-hidden="true" />
                )}
                {metric.detail}
              </span>
            </article>
          ))}
        </div>
      </section>

      <div className="dashboard-grid dashboard-grid--lead">
        <section
          className="panel panel--attention"
          aria-labelledby="attention-title"
        >
          <div className="section-heading">
            <div>
              <p className="kicker">Action queue</p>
              <h2 id="attention-title">Needs attention</h2>
            </div>
            <span className="count-badge">
              {String(attentionCount).padStart(2, "0")}
            </span>
          </div>
          <div className="attention-list">
            {commerce.attention.map(({ order, summary }) => (
              <Link
                className="attention-item attention-item--attention"
                href={`/${order.type === "PREORDER" ? "preorders" : "orders"}/${order.id}`}
                key={order.id}
              >
                <span className="attention-icon">
                  <CircleDollarSign aria-hidden="true" />
                </span>
                <span className="attention-copy">
                  <span>{paymentStatusLabels[summary.status]}</span>
                  <strong>
                    {formatOrderNumber(order.orderNumber)} ·{" "}
                    {order.customer?.name ??
                      order.team?.name ??
                      "Customer not recorded"}
                  </strong>
                  <small>{formatMVR(summary.balance)} balance left</small>
                </span>
                <ArrowRight className="row-arrow" aria-hidden="true" />
              </Link>
            ))}
            {commerce.lowStock.map((variant) => (
              <Link
                className="attention-item attention-item--critical"
                href={`/products/${variant.productId}`}
                key={variant.id}
              >
                <span className="attention-icon">
                  <Box aria-hidden="true" />
                </span>
                <span className="attention-copy">
                  <span>Low stock</span>
                  <strong>
                    {variant.product.name} ·{" "}
                    {[variant.color, variant.size].filter(Boolean).join(" / ")}
                  </strong>
                  <small>
                    {variant.stockOnHand} available · Reorder at{" "}
                    {variant.reorderAt}
                  </small>
                </span>
                <ArrowRight className="row-arrow" aria-hidden="true" />
              </Link>
            ))}
            {!attentionCount ? (
              <div className="inline-empty inline-empty--panel">
                <p>No urgent commerce or stock issues right now.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel incoming" aria-labelledby="incoming-title">
          <div className="section-heading">
            <div>
              <p className="kicker">Supply · Demo</p>
              <h2 id="incoming-title">Incoming</h2>
            </div>
            <Truck aria-hidden="true" />
          </div>
          <div className="incoming-hero">
            <div>
              <p>Milestone 5</p>
              <h3>Supply operations deferred</h3>
            </div>
            <span className="status">Planned</span>
          </div>
          <p className="detail-copy">
            Imports, shipment tracking, and incoming quantities will become live
            in the next supply milestone.
          </p>
          <div className="shipment-track" aria-label="Supply workflow planned">
            <span>
              <Check aria-hidden="true" /> Products
            </span>
            <span>
              <PackageCheck aria-hidden="true" /> Purchase
            </span>
            <span>
              <Truck aria-hidden="true" /> In transit
            </span>
            <span>
              <Box aria-hidden="true" /> Received
            </span>
          </div>
          <Link className="text-link" href="/imports">
            View planned area <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </div>

      <section className="panel orders-panel" aria-labelledby="orders-title">
        <div className="section-heading">
          <div>
            <p className="kicker">Commerce · Live</p>
            <h2 id="orders-title">Recent orders</h2>
          </div>
          <Link className="text-link" href="/orders">
            View all <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        {commerce.recentOrders.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Fulfilment</th>
                  <th>
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {commerce.recentOrders.map((order) => {
                  const payment = paymentSummary(order.total, order.payments);
                  return (
                    <tr key={order.id}>
                      <td data-label="Order">
                        <strong>{formatOrderNumber(order.orderNumber)}</strong>
                      </td>
                      <td data-label="Customer">
                        {order.customer?.name ??
                          order.team?.name ??
                          "Not recorded"}
                      </td>
                      <td data-label="Items">{order._count.lines}</td>
                      <td data-label="Amount" className="numeric">
                        {formatMVR(order.total)}
                      </td>
                      <td data-label="Payment">
                        <span
                          className={`status status--${payment.status.toLowerCase()}`}
                        >
                          {paymentStatusLabels[payment.status]}
                        </span>
                      </td>
                      <td data-label="Fulfilment">
                        <span
                          className={`status status--${order.fulfilmentStatus.toLowerCase()}`}
                        >
                          {fulfilmentStatusLabels[order.fulfilmentStatus]}
                        </span>
                      </td>
                      <td>
                        <Link
                          className="row-link"
                          href={`/${order.type === "PREORDER" ? "preorders" : "orders"}/${order.id}`}
                          aria-label={`Open ${formatOrderNumber(order.orderNumber)}`}
                        >
                          <ArrowRight aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="inline-empty inline-empty--panel">
            <p>No orders have been created yet.</p>
            <Link href="/orders/new">
              Create an order <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <div className="dashboard-grid dashboard-grid--footer">
        <section className="panel" aria-labelledby="tasks-title">
          <div className="section-heading">
            <div>
              <p className="kicker">Plan · Demo</p>
              <h2 id="tasks-title">Upcoming tasks</h2>
            </div>
            <Link className="text-link" href="/tasks">
              Planned area <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className="task-list">
            {tasks.map((task) => (
              <Link className="task-item" href="/tasks" key={task.title}>
                <span className="task-date">
                  <strong>{task.day}</strong>
                  <small>{task.month}</small>
                </span>
                <span>
                  <strong>{task.title}</strong>
                  <small>{task.meta}</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
        <section className="panel" aria-labelledby="activity-title">
          <div className="section-heading">
            <div>
              <p className="kicker">Commerce · Live</p>
              <h2 id="activity-title">Recent activity</h2>
            </div>
          </div>
          {commerce.recentOrders.length ? (
            <ol className="activity-list">
              {commerce.recentOrders.slice(0, 3).map((order) => (
                <li key={order.id}>
                  <span className="activity-mark">
                    <ShoppingBag aria-hidden="true" />
                  </span>
                  <div>
                    <strong>
                      {formatOrderNumber(order.orderNumber)} ·{" "}
                      {fulfilmentStatusLabels[order.fulfilmentStatus]}
                    </strong>
                    <p>
                      {order.customer?.name ??
                        order.team?.name ??
                        "Customer not recorded"}{" "}
                      · {formatDate(order.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="inline-empty inline-empty--panel">
              <p>Commerce activity will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Maldives",
  }).format(value);
}
