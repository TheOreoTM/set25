import Link from "next/link";
import { CalendarDays, User, Users } from "lucide-react";
import {
  fulfilmentStatusLabels,
  formatMVR,
  formatOrderNumber,
  orderSourceLabels,
  paymentMethodLabels,
  paymentStatusLabels,
  paymentTypeLabels,
  preorderStatusLabels,
  formatPurchaseOrderNumber,
  formatImportNumber,
  importShipmentStatusLabels,
  checkoutPaymentMethodLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { getOrder } from "@/lib/commerce/data";
import { paymentSummary } from "@/lib/commerce/money";
import type { StaffIdentity } from "@/lib/auth/types";
import {
  FulfilmentControl,
  PaymentControl,
  PreorderStatusControl,
  TerminalOrderControls,
} from "./order-controls";
import { PreorderSupplyForm } from "@/components/supply/sample-forms";
import { linkPreorderPurchaseOrderAction } from "@/lib/supply/actions";

export type OrderDetailRecord = NonNullable<
  Awaited<ReturnType<typeof getOrder>>
>;

export function OrderDetail({
  order,
  staff,
  paymentKey,
  preorder = false,
  saved,
  purchaseOrders = [],
  files,
}: {
  order: OrderDetailRecord;
  staff: StaffIdentity;
  paymentKey: string;
  preorder?: boolean;
  saved?: string;
  purchaseOrders?: { id: string; label: string }[];
  files?: React.ReactNode;
}) {
  const number = formatOrderNumber(order.orderNumber);
  const payment = paymentSummary(order.total, order.payments);
  const canWrite = staff.role !== "STAFF";
  return (
    <main className="page-wrap order-detail-page">
      <PageHeader
        eyebrow={`Commerce / ${preorder ? "Preorders" : "Orders"}`}
        title={number}
        description={`${preorder ? "Preorder" : "Order"} created ${formatDate(order.createdAt)} ${order.createdBy ? `by ${order.createdBy.name}` : "through Store checkout"}.`}
      />
      {saved ? (
        <div className="form-message form-message--success" role="status">
          {successMessage(saved)}
        </div>
      ) : null}
      <section className="order-command-bar">
        <div className="order-command-statuses">
          <span>
            <small>Fulfilment</small>
            <strong
              className={`status status--${order.fulfilmentStatus.toLowerCase()}`}
            >
              {fulfilmentStatusLabels[order.fulfilmentStatus]}
            </strong>
          </span>
          <span>
            <small>Payment</small>
            <strong
              className={`status status--${payment.status.toLowerCase()}`}
            >
              {paymentStatusLabels[payment.status]}
            </strong>
          </span>
          {preorder && order.preorder ? (
            <span>
              <small>Preorder</small>
              <strong
                className={`status status--${order.preorder.status.toLowerCase()}`}
              >
                {preorderStatusLabels[order.preorder.status]}
              </strong>
            </span>
          ) : null}
        </div>
        {canWrite ? (
          <div className="order-command-actions">
            <PaymentControl
              orderId={order.id}
              balance={payment.balance.toString()}
              refundable={payment.paid.toString()}
              submissionKey={paymentKey}
              returnTo={preorder ? "preorder" : "order"}
            />
            <TerminalOrderControls
              orderId={order.id}
              status={order.fulfilmentStatus}
              returnTo={preorder ? "preorder" : "order"}
            />
          </div>
        ) : null}
      </section>

      <div className="order-detail-grid">
        <section className="order-main-column">
          <div className="detail-section order-items-panel">
            <div className="section-heading">
              <div>
                <p className="kicker">Items</p>
                <h2>
                  {order.lines.length}{" "}
                  {order.lines.length === 1 ? "line" : "lines"}
                </h2>
              </div>
              <p>Immutable sale snapshot</p>
            </div>
            <div className="order-items">
              {order.lines.map((line) => (
                <div className="order-item" key={line.id}>
                  <div>
                    <strong>{line.productName}</strong>
                    <small>
                      {[line.color, line.size].filter(Boolean).join(" / ") ||
                        "Standard"}{" "}
                      · {line.sku}
                    </small>
                  </div>
                  <span>
                    {line.quantity} × {formatMVR(line.unitPrice)}
                  </span>
                  <strong>{formatMVR(line.lineTotal)}</strong>
                </div>
              ))}
            </div>
            <dl className="order-totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatMVR(order.subtotal)}</dd>
              </div>
              <div>
                <dt>
                  Discount
                  {order.discountCode ? ` · ${order.discountCode}` : ""}
                </dt>
                <dd>− {formatMVR(order.discountAmount)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{formatMVR(order.deliveryFee)}</dd>
              </div>
              <div className="order-totals__grand">
                <dt>Total</dt>
                <dd>{formatMVR(order.total)}</dd>
              </div>
              <div>
                <dt>Amount Paid</dt>
                <dd>{formatMVR(payment.paid)}</dd>
              </div>
              <div className="order-totals__balance">
                <dt>Balance Left</dt>
                <dd>{formatMVR(payment.balance)}</dd>
              </div>
            </dl>
          </div>

          <div className="detail-section">
            <div className="section-heading">
              <div>
                <p className="kicker">Payments</p>
                <h2>Transaction history</h2>
              </div>
              <p>Append-only ledger</p>
            </div>
            {order.payments.length ? (
              <div className="payment-ledger">
                {order.payments.map((entry) => (
                  <div className="payment-entry" key={entry.id}>
                    <span
                      className={
                        entry.type === "REFUND"
                          ? "payment-mark payment-mark--refund"
                          : "payment-mark"
                      }
                    >
                      {entry.type === "REFUND" ? "−" : "+"}
                    </span>
                    <div>
                      <strong>
                        {paymentTypeLabels[entry.type]} ·{" "}
                        {paymentMethodLabels[entry.method]}
                      </strong>
                      <small>
                        {formatDateTime(entry.createdAt)} ·{" "}
                        {entry.recordedBy.name}
                        {entry.reference ? ` · ${entry.reference}` : ""}
                      </small>
                      {entry.notes ? <p>{entry.notes}</p> : null}
                    </div>
                    <strong>
                      {entry.type === "REFUND" ? "− " : ""}
                      {formatMVR(entry.amount)}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="inline-empty">
                <p>No payments recorded yet.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="order-side-column">
          <section className="detail-section order-contact-panel">
            <div className="section-heading">
              <div>
                <p className="kicker">Sale</p>
                <h2>Order context</h2>
              </div>
            </div>
            <dl className="order-context">
              <div>
                <dt>Customer</dt>
                <dd>
                  {order.customer ? (
                    <Link href={`/customers/${order.customer.id}`}>
                      <User aria-hidden="true" /> {order.customer.name}
                    </Link>
                  ) : (
                    "Walk-in / not recorded"
                  )}
                </dd>
              </div>
              <div>
                <dt>Team</dt>
                <dd>
                  {order.team ? (
                    <Link href={`/teams/${order.team.id}`}>
                      <Users aria-hidden="true" /> {order.team.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{orderSourceLabels[order.source]}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>
                  <CalendarDays aria-hidden="true" />{" "}
                  {formatDate(order.createdAt)}
                </dd>
              </div>
            </dl>
            {order.notes ? (
              <div className="order-notes">
                <span>Internal notes</span>
                <p>{order.notes}</p>
              </div>
            ) : null}
          </section>

          {order.delivery || order.intendedPaymentMethod ? (
            <StoreCheckoutPanel order={order} />
          ) : null}

          {preorder && order.preorder ? (
            <section className="detail-section preorder-panel">
              <div className="section-heading">
                <div>
                  <p className="kicker">Preorder</p>
                  <h2>Arrival details</h2>
                </div>
              </div>
              <dl className="order-context">
                <div>
                  <dt>Deposit Required</dt>
                  <dd>{formatMVR(order.preorder.depositRequired)}</dd>
                </div>
                <div>
                  <dt>Estimated Arrival</dt>
                  <dd>
                    {order.preorder.estimatedArrival
                      ? formatDate(order.preorder.estimatedArrival)
                      : "Not set"}
                  </dd>
                </div>
                <div>
                  <dt>Supplier Ordered</dt>
                  <dd>{order.preorder.supplierOrdered ? "Yes" : "Not yet"}</dd>
                </div>
                <div>
                  <dt>Purchase Order</dt>
                  <dd>
                    {order.preorder.purchaseOrder ? (
                      <Link
                        href={`/purchase-orders/${order.preorder.purchaseOrder.id}`}
                      >
                        {formatPurchaseOrderNumber(
                          order.preorder.purchaseOrder.purchaseOrderNumber,
                        )}
                      </Link>
                    ) : (
                      "Not linked"
                    )}
                  </dd>
                </div>
                {(() => {
                  const imports =
                    order.preorder.purchaseOrder?.lines.flatMap((line) =>
                      line.shipmentLines.map(
                        (shipmentLine) => shipmentLine.importShipment,
                      ),
                    ) ?? [];
                  const shipment =
                    imports.find((item) => item.status !== "CANCELLED") ??
                    imports[0];
                  return shipment ? (
                    <>
                      <div>
                        <dt>Import</dt>
                        <dd>
                          <Link href={`/imports/${shipment.id}`}>
                            {formatImportNumber(shipment.importNumber)}
                          </Link>
                        </dd>
                      </div>
                      <div>
                        <dt>Shipment Status</dt>
                        <dd>{importShipmentStatusLabels[shipment.status]}</dd>
                      </div>
                    </>
                  ) : null;
                })()}
              </dl>
              {order.preorder.notes ? (
                <div className="order-notes">
                  <span>Preorder notes</span>
                  <p>{order.preorder.notes}</p>
                </div>
              ) : null}
              {canWrite ? (
                <div className="embedded-editor">
                  <PreorderSupplyForm
                    action={linkPreorderPurchaseOrderAction.bind(
                      null,
                      order.preorder.id,
                    )}
                    purchaseOrders={purchaseOrders}
                    current={order.preorder.purchaseOrderId}
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          {canWrite &&
          !["COMPLETED", "CANCELLED"].includes(order.fulfilmentStatus) ? (
            <section className="detail-section workflow-panel">
              <div className="section-heading">
                <div>
                  <p className="kicker">Operations</p>
                  <h2>Move forward</h2>
                </div>
              </div>
              <FulfilmentControl
                orderId={order.id}
                current={order.fulfilmentStatus}
                returnTo={preorder ? "preorder" : "order"}
              />
              {preorder && order.preorder ? (
                <PreorderStatusControl
                  orderId={order.id}
                  current={order.preorder.status}
                />
              ) : null}
            </section>
          ) : null}
        </aside>
      </div>
      {files}
    </main>
  );
}

function successMessage(saved: string) {
  if (saved === "payment") return "Payment transaction recorded.";
  if (saved === "fulfilment") return "Fulfilment status updated.";
  if (saved === "completed") return "Order completed and stock deducted once.";
  if (saved === "cancelled")
    return "Order cancelled. Stock on hand was not changed; any Store reservation was released.";
  if (saved === "status") return "Preorder status updated.";
  return "Change saved.";
}

function StoreCheckoutPanel({ order }: { order: OrderDetailRecord }) {
  const now = new Date();
  const active = order.reservations.filter(
    (reservation) => reservation.status === "ACTIVE",
  );
  const holding = active.filter(
    (reservation) => !reservation.expiresAt || reservation.expiresAt > now,
  );
  const reservedUnits = order.reservations.reduce(
    (sum, reservation) => sum + reservation.quantity,
    0,
  );
  const expiry = holding
    .map((reservation) => reservation.expiresAt)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => a.getTime() - b.getTime())[0];
  let reservation = "No reservation";
  if (order.reservations.length) {
    if (holding.length)
      reservation = expiry
        ? `${reservedUnits} reserved until ${formatDateTime(expiry)}`
        : `${reservedUnits} reserved until completed or cancelled`;
    else if (active.length) reservation = "Expired · units no longer held";
    else if (order.reservations.every((item) => item.status === "CONSUMED"))
      reservation = "Consumed at completion";
    else reservation = "Released";
  }
  return (
    <section className="detail-section order-contact-panel">
      <div className="section-heading">
        <div>
          <p className="kicker">Store checkout</p>
          <h2>Delivery & payment</h2>
        </div>
      </div>
      <dl className="order-context">
        {order.delivery ? (
          <>
            <div>
              <dt>Recipient</dt>
              <dd>{order.delivery.recipientName}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${order.delivery.phone.replace(/\s/g, "")}`}>
                  {order.delivery.phone}
                </a>
              </dd>
            </div>
            {order.delivery.email ? (
              <div>
                <dt>Email</dt>
                <dd>{order.delivery.email}</dd>
              </div>
            ) : null}
            {order.delivery.instagramHandle ? (
              <div>
                <dt>Instagram</dt>
                <dd>@{order.delivery.instagramHandle}</dd>
              </div>
            ) : null}
            <div>
              <dt>Delivery</dt>
              <dd>
                {order.delivery.methodName} · {formatMVR(order.deliveryFee)}
              </dd>
            </div>
            <div>
              <dt>Island / Area</dt>
              <dd>{order.delivery.area}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{order.delivery.address}</dd>
            </div>
          </>
        ) : null}
        <div>
          <dt>Intended payment</dt>
          <dd>
            {order.intendedPaymentMethod
              ? checkoutPaymentMethodLabels[order.intendedPaymentMethod]
              : "—"}
          </dd>
        </div>
        {order.discountSource === "AMBASSADOR_CODE" ? (
          <div>
            <dt>Discount code</dt>
            <dd>
              {order.discountCode} · {order.discountPercent?.toString()}%
              {order.ambassador ? (
                <>
                  {" · "}
                  <Link href={`/ambassadors/${order.ambassador.id}`}>
                    {order.ambassador.name}
                  </Link>
                </>
              ) : null}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Stock hold</dt>
          <dd>{reservation}</dd>
        </div>
      </dl>
      {order.delivery?.notes ? (
        <div className="order-notes">
          <span>Customer delivery notes</span>
          <p>{order.delivery.notes}</p>
        </div>
      ) : null}
    </section>
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

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Maldives",
  }).format(value);
}
