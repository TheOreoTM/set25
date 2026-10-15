import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

const metrics = [
  {
    label: "Sales this month",
    value: "MVR 84,250",
    detail: "+12.4% from last month",
    direction: "up",
  },
  {
    label: "Profit this month",
    value: "MVR 31,480",
    detail: "37.4% margin",
    direction: "up",
  },
  {
    label: "Orders this month",
    value: "46",
    detail: "8 need fulfilment",
    direction: "down",
  },
  {
    label: "Stock value",
    value: "MVR 218,600",
    detail: "At current product cost",
    direction: "neutral",
  },
] as const;

const attention = [
  {
    icon: Box,
    eyebrow: "Low stock",
    title: "CORE Knee Pads · Black / M",
    meta: "4 left · Reorder level 8",
    tone: "critical",
  },
  {
    icon: CircleDollarSign,
    eyebrow: "Balance left",
    title: "Team preorder · Eagles VC",
    meta: "MVR 6,400 due 18 Oct",
    tone: "attention",
  },
  {
    icon: Truck,
    eyebrow: "Shipment needs action",
    title: "IMP-001 documents",
    meta: "Commercial invoice is missing",
    tone: "attention",
  },
  {
    icon: Clock3,
    eyebrow: "Overdue task",
    title: "Confirm FLEX size breakdown",
    meta: "Due yesterday · Assigned to Aishath",
    tone: "critical",
  },
];

const orders = [
  {
    id: "ORD-1048",
    customer: "Aminath Shifa",
    items: "2 items",
    amount: "MVR 1,190",
    status: "Ready",
  },
  {
    id: "ORD-1047",
    customer: "Huraa Volleyball Club",
    items: "18 items",
    amount: "MVR 9,720",
    status: "Paid",
  },
  {
    id: "ORD-1046",
    customer: "Ibrahim Zayan",
    items: "1 item",
    amount: "MVR 650",
    status: "Packing",
  },
  {
    id: "ORD-1045",
    customer: "Fuvahmulah VC",
    items: "12 items",
    amount: "MVR 6,480",
    status: "Balance left",
  },
];

const tasks = [
  {
    day: "16",
    month: "OCT",
    title: "Approve CORE reorder",
    meta: "Stock · High priority",
  },
  {
    day: "17",
    month: "OCT",
    title: "Check IMP-001 documents",
    meta: "Imports · Before 12:00",
  },
  {
    day: "19",
    month: "OCT",
    title: "Team fitting · Eagles VC",
    meta: "Teams · 16:30",
  },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
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
          Your Staff role currently includes Dashboard, Products, and Stock
          access.
        </div>
      ) : null}
      <div className="demo-notice" role="note">
        <span>Demo data</span> Dashboard values are illustrative until
        operational workflows are connected.
      </div>

      <section aria-labelledby="month-summary-title">
        <div className="section-heading section-heading--quiet">
          <h2 id="month-summary-title">October at a glance</h2>
          <p>Updated just now</p>
        </div>
        <div className="metric-grid">
          {metrics.map((metric) => (
            <article className="metric" key={metric.label}>
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
              <span>
                {metric.direction === "up" ? (
                  <ArrowUpRight aria-hidden="true" />
                ) : null}
                {metric.direction === "down" ? (
                  <ArrowDownRight aria-hidden="true" />
                ) : null}
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
            <span className="count-badge">04</span>
          </div>
          <div className="attention-list">
            {attention.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  className={`attention-item attention-item--${item.tone}`}
                  href="#"
                  key={item.title}
                >
                  <span className="attention-icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="attention-copy">
                    <span>{item.eyebrow}</span>
                    <strong>{item.title}</strong>
                    <small>{item.meta}</small>
                  </span>
                  <ArrowRight className="row-arrow" aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </section>

        <section className="panel incoming" aria-labelledby="incoming-title">
          <div className="section-heading">
            <div>
              <p className="kicker">Supply</p>
              <h2 id="incoming-title">Incoming</h2>
            </div>
            <Truck aria-hidden="true" />
          </div>
          <div className="incoming-hero">
            <div>
              <p>IMP-001</p>
              <h3>80 units incoming</h3>
            </div>
            <span className="status status--volt">At China warehouse</span>
          </div>
          <dl className="incoming-details">
            <div>
              <dt>CORE</dt>
              <dd>50</dd>
            </div>
            <div>
              <dt>FLEX</dt>
              <dd>30</dd>
            </div>
            <div>
              <dt>Est. dispatch</dt>
              <dd>21 Oct</dd>
            </div>
          </dl>
          <div
            className="shipment-track"
            aria-label="Shipment progress: 2 of 4 stages complete"
          >
            <span className="is-complete">
              <Check aria-hidden="true" /> Ordered
            </span>
            <span className="is-current">
              <PackageCheck aria-hidden="true" /> Warehouse
            </span>
            <span>
              <Truck aria-hidden="true" /> In transit
            </span>
            <span>
              <Box aria-hidden="true" /> Received
            </span>
          </div>
          <Link className="text-link" href="/imports">
            View import <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </div>

      <section className="panel orders-panel" aria-labelledby="orders-title">
        <div className="section-heading">
          <div>
            <p className="kicker">Commerce</p>
            <h2 id="orders-title">Recent orders</h2>
          </div>
          <Link className="text-link" href="/orders">
            View all <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td data-label="Order">
                    <strong>{order.id}</strong>
                  </td>
                  <td data-label="Customer">{order.customer}</td>
                  <td data-label="Items">{order.items}</td>
                  <td data-label="Amount" className="numeric">
                    {order.amount}
                  </td>
                  <td data-label="Status">
                    <span className="status">{order.status}</span>
                  </td>
                  <td>
                    <Link
                      className="row-link"
                      href="/orders"
                      aria-label={`Open ${order.id}`}
                    >
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="dashboard-grid dashboard-grid--footer">
        <section className="panel" aria-labelledby="tasks-title">
          <div className="section-heading">
            <div>
              <p className="kicker">Plan</p>
              <h2 id="tasks-title">Upcoming tasks</h2>
            </div>
            <Link className="text-link" href="/tasks">
              All tasks <ArrowRight aria-hidden="true" />
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
              <p className="kicker">Today</p>
              <h2 id="activity-title">Recent activity</h2>
            </div>
          </div>
          <ol className="activity-list">
            <li>
              <span className="activity-mark">
                <ShoppingBag aria-hidden="true" />
              </span>
              <div>
                <strong>Order ORD-1048 marked ready</strong>
                <p>Fathimath · 12 min ago</p>
              </div>
            </li>
            <li>
              <span className="activity-mark">
                <Box aria-hidden="true" />
              </span>
              <div>
                <strong>Stock count updated for CORE</strong>
                <p>Ahmed · 43 min ago</p>
              </div>
            </li>
            <li>
              <span className="activity-mark">
                <AlertTriangle aria-hidden="true" />
              </span>
              <div>
                <strong>Low stock threshold reached</strong>
                <p>System · 1 hr ago</p>
              </div>
            </li>
          </ol>
        </section>
      </div>
    </main>
  );
}
