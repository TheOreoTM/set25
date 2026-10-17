import Link from "next/link";
import { ArrowRight, AtSign, Edit3, Mail, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import {
  formatMVR,
  formatOrderNumber,
  fulfilmentStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { getCustomer } from "@/lib/commerce/data";
import { requireStaff } from "@/lib/auth/session";
import { paymentSummary } from "@/lib/commerce/money";

export const instant = false;

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, staff] = await Promise.all([
    getCustomer(id),
    requireStaff(),
  ]);
  if (!customer) notFound();
  const activeOrders = customer.orders.filter(
    (order) => order.fulfilmentStatus !== "CANCELLED",
  );
  const total = activeOrders.reduce(
    (sum, order) => sum + Number(order.total.toString()),
    0,
  );
  const preorders = customer.orders.filter(
    (order) => order.type === "PREORDER",
  );
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Commerce / Customers"
        title={customer.name}
        description="Contact, order history, and preorder context in one place."
      />
      <div className="detail-actions">
        {staff.role !== "STAFF" ? (
          <Link className="button button--dark" href={`/customers/${id}/edit`}>
            <Edit3 aria-hidden="true" /> Edit customer
          </Link>
        ) : null}
      </div>
      <section className="identity-grid">
        <div className="identity-lead">
          <p className="kicker">Customer</p>
          <h2>{customer.name}</h2>
          <div className="contact-links">
            <a href={`tel:${customer.phone}`}>
              <Phone aria-hidden="true" /> {customer.phone}
            </a>
            {customer.email ? (
              <a href={`mailto:${customer.email}`}>
                <Mail aria-hidden="true" /> {customer.email}
              </a>
            ) : null}
            {customer.instagramHandle ? (
              <span>
                <AtSign aria-hidden="true" /> {customer.instagramHandle}
              </span>
            ) : null}
          </div>
        </div>
        <dl className="identity-stats">
          <div>
            <dt>Total orders</dt>
            <dd>{customer.orders.length}</dd>
          </div>
          <div>
            <dt>Value ordered</dt>
            <dd>{formatMVR(total)}</dd>
          </div>
          <div>
            <dt>Preorders</dt>
            <dd>{preorders.length}</dd>
          </div>
        </dl>
      </section>
      {customer.notes ? (
        <section className="detail-section compact-section">
          <div className="section-heading">
            <div>
              <p className="kicker">Context</p>
              <h2>Notes</h2>
            </div>
          </div>
          <p className="detail-copy">{customer.notes}</p>
        </section>
      ) : null}
      <OrderHistory orders={customer.orders} />
    </main>
  );
}

function OrderHistory({
  orders,
}: {
  orders: NonNullable<Awaited<ReturnType<typeof getCustomer>>>["orders"];
}) {
  return (
    <section className="resource-panel">
      <div className="resource-panel-head">
        <div>
          <p className="kicker">Commerce</p>
          <h2>Recent orders</h2>
        </div>
        <p>{orders.length} total</p>
      </div>
      {orders.length ? (
        <div className="commerce-list commerce-list--orders-mini">
          {orders.map((order) => {
            const payment = paymentSummary(order.total, order.payments);
            return (
              <Link
                className="commerce-row"
                href={`/${order.type === "PREORDER" ? "preorders" : "orders"}/${order.id}`}
                key={order.id}
              >
                <span className="commerce-primary">
                  <strong>{formatOrderNumber(order.orderNumber)}</strong>
                  <small>
                    {order._count.lines}{" "}
                    {order._count.lines === 1 ? "item" : "items"}
                  </small>
                </span>
                <span data-label="Total">{formatMVR(order.total)}</span>
                <span
                  data-label="Payment"
                  className={`status status--${payment.status.toLowerCase()}`}
                >
                  {payment.status === "PART_PAID"
                    ? "Part Paid"
                    : payment.status === "UNPAID"
                      ? "Unpaid"
                      : payment.status === "REFUNDED"
                        ? "Refunded"
                        : "Paid"}
                </span>
                <span
                  data-label="Fulfilment"
                  className={`status status--${order.fulfilmentStatus.toLowerCase()}`}
                >
                  {fulfilmentStatusLabels[order.fulfilmentStatus]}
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
          <p>No orders recorded for this customer.</p>
        </div>
      )}
    </section>
  );
}
