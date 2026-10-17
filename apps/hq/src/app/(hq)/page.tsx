import {
  ArrowRight,
  Box,
  Check,
  ClipboardList,
  CircleDollarSign,
  FileArchive,
  PackageCheck,
  Sparkles,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import {
  fulfilmentStatusLabels,
  formatMVR,
  formatImportNumber,
  formatOrderNumber,
  contentPlatformLabels,
  contentStatusLabels,
  contentTypeLabels,
  importShipmentStatusLabels,
  paymentStatusLabels,
  taskPriorityLabels,
  taskStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getDashboardContent } from "@/lib/content/data";
import { formatPublishAt, publishTile } from "@/lib/content/presentation";
import { getExpiredFileCount } from "@/lib/files/data";
import { getCommerceDashboard } from "@/lib/commerce/data";
import { paymentSummary } from "@/lib/commerce/money";
import { getProfitSummary } from "@/lib/money/data";
import { getDateRange, getTodayRange } from "@/lib/planning/date-range";
import { getSupplyDashboard } from "@/lib/supply/data";
import { formatDate as formatSupplyDate } from "@/lib/supply/presentation";
import { getDashboardTasks } from "@/lib/tasks/data";

export const instant = false;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const monthRange = getDateRange({ preset: "this-month" });
  const staff = await requireStaff();
  const [query, commerce, supply, tasks, profit, content, expiredFiles] =
    await Promise.all([
      searchParams,
      getCommerceDashboard(),
      getSupplyDashboard(),
      getDashboardTasks(),
      getProfitSummary(monthRange.start, monthRange.end),
      getDashboardContent(),
      getExpiredFileCount(staff.role),
    ]);
  const { start: today, end: tomorrow } = getTodayRange();
  const taskAttention = tasks.filter(
    (task) =>
      task.priority === "HIGH" ||
      (task.dueAt !== null && new Date(task.dueAt) < today),
  );
  const openOrders = commerce.monthOrders.filter(
    (order) => !["COMPLETED", "CANCELLED"].includes(order.fulfilmentStatus),
  ).length;
  const attentionCount =
    commerce.attention.length +
    commerce.lowStock.length +
    supply.attention.length +
    supply.unassignedPurchaseOrders.length +
    taskAttention.length +
    content.overdue.length +
    (expiredFiles ? 1 : 0);
  const monthName = new Intl.DateTimeFormat("en", {
    month: "long",
    timeZone: "Indian/Maldives",
  }).format(new Date());
  const metrics = [
    {
      label: "Sales this month",
      value: formatMVR(profit.salesRevenue),
      detail: "Completed orders",
    },
    {
      label: "Sales Profit this month",
      value: profit.salesProfit ? formatMVR(profit.salesProfit) : "Incomplete",
      detail: profit.missingCostLines
        ? `${profit.missingCostLines} sold ${profit.missingCostLines === 1 ? "line is" : "lines are"} missing cost`
        : "Revenue less Cost of Items Sold",
    },
    {
      label: "Orders this month",
      value: String(commerce.monthOrders.length),
      detail: `${openOrders} need fulfilment`,
    },
    {
      label: "Stock value",
      value: formatMVR(commerce.stockValue),
      detail: commerce.unknownCostUnits
        ? `${commerce.unknownCostUnits} ${commerce.unknownCostUnits === 1 ? "unit is" : "units are"} missing Cost Each`
        : "At current product cost",
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
        <span>Live operations</span> Commerce, supply, Sales Profit, stock, and
        tasks now use current HQ records.
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
                <Check aria-hidden="true" />
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
            {supply.attention.map((shipment) => (
              <Link
                className="attention-item attention-item--attention"
                href={`/imports/${shipment.id}`}
                key={shipment.id}
              >
                <span className="attention-icon">
                  <Truck aria-hidden="true" />
                </span>
                <span className="attention-copy">
                  <span>Shipment needs action</span>
                  <strong>
                    {formatImportNumber(shipment.importNumber)} ·{" "}
                    {importShipmentStatusLabels[shipment.status]}
                  </strong>
                  <small>
                    {shipment.estimatedArrival &&
                    shipment.estimatedArrival < new Date()
                      ? "ETA overdue"
                      : `ETA ${formatSupplyDate(shipment.estimatedArrival)}`}
                  </small>
                </span>
                <ArrowRight className="row-arrow" aria-hidden="true" />
              </Link>
            ))}
            {supply.unassignedPurchaseOrders.map((po) => (
              <Link
                className="attention-item"
                href={`/purchase-orders/${po.id}`}
                key={po.id}
              >
                <span className="attention-icon">
                  <PackageCheck aria-hidden="true" />
                </span>
                <span className="attention-copy">
                  <span>Not assigned to an import</span>
                  <strong>{po.supplier.name}</strong>
                  <small>Placed purchase order</small>
                </span>
                <ArrowRight className="row-arrow" aria-hidden="true" />
              </Link>
            ))}
            {taskAttention.slice(0, 4).map((task) => (
              <Link
                className="attention-item attention-item--attention"
                href="/tasks?view=attention"
                key={task.id}
              >
                <span className="attention-icon">
                  <ClipboardList aria-hidden="true" />
                </span>
                <span className="attention-copy">
                  <span>
                    {task.dueAt && new Date(task.dueAt) < today
                      ? "Overdue task"
                      : `${taskPriorityLabels[task.priority]} priority`}
                  </span>
                  <strong>{task.title}</strong>
                  <small>
                    {task.assignedTo?.name ?? "Unassigned"}
                    {task.dueAt
                      ? ` · Due ${formatSupplyDate(new Date(task.dueAt))}`
                      : " · No due date"}
                  </small>
                </span>
                <ArrowRight className="row-arrow" aria-hidden="true" />
              </Link>
            ))}
            {content.overdue.slice(0, 4).map((item) => (
              <Link
                className="attention-item attention-item--attention"
                href={`/content/${item.id}`}
                key={item.id}
              >
                <span className="attention-icon">
                  <Sparkles aria-hidden="true" />
                </span>
                <span className="attention-copy">
                  <span>Content not posted</span>
                  <strong>{item.title}</strong>
                  <small>
                    Planned {formatPublishAt(item.publishAt!)} ·{" "}
                    {item.owner ?? "No owner"}
                  </small>
                </span>
                <ArrowRight className="row-arrow" aria-hidden="true" />
              </Link>
            ))}
            {expiredFiles ? (
              <Link className="attention-item" href="/files?retention=expired">
                <span className="attention-icon">
                  <FileArchive aria-hidden="true" />
                </span>
                <span className="attention-copy">
                  <span>File retention ended</span>
                  <strong>
                    {expiredFiles} {expiredFiles === 1 ? "file" : "files"} to
                    review
                  </strong>
                  <small>Blocked from download until removed</small>
                </span>
                <ArrowRight className="row-arrow" aria-hidden="true" />
              </Link>
            ) : null}
            {!attentionCount ? (
              <div className="inline-empty inline-empty--panel">
                <p>Nothing needs attention right now.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel incoming" aria-labelledby="incoming-title">
          <div className="section-heading">
            <div>
              <p className="kicker">Supply · Live</p>
              <h2 id="incoming-title">Incoming</h2>
            </div>
            <Truck aria-hidden="true" />
          </div>
          {supply.shipments.length ? (
            <div className="dashboard-incoming-list">
              {supply.shipments.map((shipment) => (
                <Link
                  className="incoming-hero"
                  href={`/imports/${shipment.id}`}
                  key={shipment.id}
                >
                  <div>
                    <p>{formatImportNumber(shipment.importNumber)}</p>
                    <h3>
                      {shipment.lines.reduce(
                        (sum, line) => sum + line.quantityShipped,
                        0,
                      )}{" "}
                      units · ETA {formatSupplyDate(shipment.estimatedArrival)}
                    </h3>
                  </div>
                  <span
                    className={`status status--${shipment.status.toLowerCase()}`}
                  >
                    {importShipmentStatusLabels[shipment.status]}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="inline-empty inline-empty--panel">
              <p>No active imports right now.</p>
            </div>
          )}
          <Link className="text-link" href="/imports">
            View all imports <ArrowRight aria-hidden="true" />
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
              <p className="kicker">Planning · Live</p>
              <h2 id="tasks-title">Upcoming</h2>
            </div>
            <Link className="text-link" href="/tasks">
              View tasks <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className="task-list">
            {tasks.map((task) => {
              const date = dashboardTaskDate(task.dueAt);
              return (
                <Link className="task-item" href="/tasks" key={task.id}>
                  <span className="task-date">
                    <strong>{date.day}</strong>
                    <small>{date.month}</small>
                  </span>
                  <span>
                    <strong>{task.title}</strong>
                    <small>
                      {taskDueState(task.dueAt, today, tomorrow)} ·{" "}
                      {taskPriorityLabels[task.priority]} ·{" "}
                      {taskStatusLabels[task.status]}
                      {task.assignedTo
                        ? ` · ${task.assignedTo.name}`
                        : " · Unassigned"}
                    </small>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              );
            })}
            {!tasks.length ? (
              <div className="inline-empty inline-empty--panel">
                <p>No open tasks right now.</p>
              </div>
            ) : null}
          </div>
          {content.upcoming.length ? (
            <>
              <p className="dashboard-subhead">Content · next 7 days</p>
              <div className="task-list">
                {content.upcoming.map((item) => {
                  const tile = publishTile(item.publishAt);
                  return (
                    <Link
                      className="task-item"
                      href={`/content/${item.id}`}
                      key={item.id}
                    >
                      <span className="task-date">
                        <strong>{tile.day}</strong>
                        <small>{tile.month}</small>
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>
                          {contentPlatformLabels[item.platform]} ·{" "}
                          {contentTypeLabels[item.type]} ·{" "}
                          {contentStatusLabels[item.status]}
                          {item.owner ? ` · ${item.owner}` : ""}
                        </small>
                      </span>
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </>
          ) : null}
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

function taskDueState(value: string | null, today: Date, tomorrow: Date) {
  if (!value) return "No due date";
  const due = new Date(value);
  if (due < today) return "Overdue";
  if (due < tomorrow) return "Due today";
  return "Upcoming";
}

function dashboardTaskDate(value: string | null) {
  if (!value) return { day: "—", month: "OPEN" };
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Indian/Maldives",
  }).formatToParts(new Date(value));
  return {
    day: parts.find((part) => part.type === "day")?.value ?? "—",
    month:
      parts.find((part) => part.type === "month")?.value.toUpperCase() ?? "—",
  };
}
