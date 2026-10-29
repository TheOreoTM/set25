import Link from "next/link";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import {
  formatMVR,
  formatOrderNumber,
  fulfilmentStatusLabels,
  paymentStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { getCustomer } from "@/lib/commerce/data";
import { requireStaff } from "@/lib/auth/session";
import { paymentSummary } from "@/lib/commerce/money";
import { FileAttachmentsPanel } from "@/components/files/file-attachments-panel";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
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
    <main className="page-wrap supply-detail-page">
      <PageHeader
        eyebrow="People / Customers"
        title={customer.name}
        description={[
          customer.instagramHandle
            ? `@${customer.instagramHandle.replace(/^@/, "")}`
            : null,
          customer.phone,
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      <div className="detail-actions">
        <Link className="text-link back-link" href="/customers">
          <ArrowLeft aria-hidden="true" /> All customers
        </Link>
        {staff.role !== "STAFF" ? (
          <div>
            <Link
              className="button button--secondary"
              href={`/customers/${id}/edit`}
            >
              <Pencil aria-hidden="true" /> Edit customer
            </Link>
          </div>
        ) : null}
      </div>
      {query.created || query.saved ? (
        <div className="form-message form-message--success" role="status">
          Customer {query.created ? "created" : "saved"}.
        </div>
      ) : null}
      <section className="supply-summary-strip" aria-label="Customer summary">
        <div>
          <span>Total Orders</span>
          <strong>{customer.orders.length}</strong>
        </div>
        <div>
          <span>Value Ordered</span>
          <strong>{formatMVR(total)}</strong>
        </div>
        <div>
          <span>Preorders</span>
          <strong>{preorders.length}</strong>
        </div>
        <div>
          <span>Phone</span>
          <strong>
            <a href={`tel:${customer.phone.replace(/\s/g, "")}`}>
              {customer.phone}
            </a>
          </strong>
        </div>
        <div>
          <span>Email</span>
          <strong>
            {customer.email ? (
              <a href={`mailto:${customer.email}`}>{customer.email}</a>
            ) : (
              "—"
            )}
          </strong>
        </div>
      </section>
      {customer.notes ? (
        <section className="detail-section">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Context</p>
              <h2>Notes</h2>
            </div>
          </div>
          <p className="detail-copy">{customer.notes}</p>
        </section>
      ) : null}
      <OrderHistory orders={customer.orders} />
      <FileAttachmentsPanel
        staff={staff}
        target={{ type: "CUSTOMER", id: id }}
        targetLabel={customer.name}
      />
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
          <div className="commerce-row commerce-row--head">
            <span>Order</span>
            <span>Total</span>
            <span>Payment</span>
            <span>Fulfilment</span>
            <span />
          </div>
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
                <span data-label="Payment">
                  <span
                    className={`status status--${payment.status.toLowerCase()}`}
                  >
                    {paymentStatusLabels[payment.status]}
                  </span>
                </span>
                <span data-label="Fulfilment" className="row-status">
                  <span
                    className={`status status--${order.fulfilmentStatus.toLowerCase()}`}
                  >
                    {fulfilmentStatusLabels[order.fulfilmentStatus]}
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
        <div className="inline-empty inline-empty--compact">
          <p>No orders recorded for this customer.</p>
        </div>
      )}
    </section>
  );
}
