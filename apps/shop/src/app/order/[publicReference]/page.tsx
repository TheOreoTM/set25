import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CheckCircle2 } from "lucide-react";
import {
  checkoutPaymentMethodLabels,
  formatMVR,
  formatOrderNumber,
  fulfilmentStatusLabels,
} from "@set25/shared";
import { getPublicOrder } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";
import { getStoreSettings, instagramUrl, whatsAppUrl } from "@/lib/settings";
import { ClearCartAfterOrder } from "@/components/clear-cart";
import { OrderSummaryRows } from "@/components/order-summary";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = {
  params: Promise<{ publicReference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function OrderPage(props: Props) {
  return (
    <main className="page page--narrow">
      <Suspense fallback={<div className="skeleton skeleton--block" aria-hidden="true" />}>
        <OrderContent {...props} />
      </Suspense>
    </main>
  );
}

const fulfilmentCopy = {
  NEW: "Received. We will confirm your order shortly.",
  PREPARING: "We are preparing your order.",
  READY: "Your order is packed and ready.",
  OUT_FOR_DELIVERY: "Your order is on its way.",
  COMPLETED: "Delivered. Thank you for playing with SET25.",
  CANCELLED: "This order was cancelled.",
} as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Maldives",
  }).format(new Date(value));
}

async function OrderContent({ params, searchParams }: Props) {
  // Always fresh: status and payment must reflect HQ right now.
  await connection();
  const [{ publicReference }, query] = await Promise.all([params, searchParams]);
  if (!(await rateLimit("order-lookup", 60, 10 * 60 * 1000))) notFound();
  const [order, settings] = await Promise.all([
    getPublicOrder(publicReference),
    getStoreSettings(),
  ]);
  if (!order) notFound();
  const number = formatOrderNumber(order.orderNumber);
  const whatsapp = whatsAppUrl(
    settings.supportWhatsApp,
    `Hi SET25, this is about order ${number}.`,
  );
  const instagram = instagramUrl(settings.instagramHandle);
  const cancelled = order.fulfilmentStatus === "CANCELLED";
  const awaitingTransfer =
    !order.paid && !cancelled && order.paymentMethod === "BANK_TRANSFER";

  return (
    <>
      {query.placed === "1" ? (
        <ClearCartAfterOrder path={`/order/${publicReference}`} />
      ) : null}
      <header className="order-head">
        <CheckCircle2 aria-hidden="true" className="order-head__icon" />
        <p className="eyebrow eyebrow--slash">Order {number}</p>
        <h1 className="page-title">
          {cancelled ? "Order cancelled." : `Thank you, ${order.firstName}.`}
        </h1>
        <p className="page-lede">{fulfilmentCopy[order.fulfilmentStatus]}</p>
        <p className="order-head__meta">
          Placed {formatDateTime(order.placedAt)} · Keep this page’s link to
          check your order.
        </p>
      </header>

      <section className="order-status" aria-label="Order status">
        <div>
          <span>Status</span>
          <strong>{fulfilmentStatusLabels[order.fulfilmentStatus]}</strong>
        </div>
        <div>
          <span>Payment</span>
          <strong>{order.paid ? "Paid" : cancelled ? "—" : "Awaiting payment"}</strong>
        </div>
        <div>
          <span>Method</span>
          <strong>
            {order.paymentMethod
              ? checkoutPaymentMethodLabels[order.paymentMethod]
              : "—"}
          </strong>
        </div>
      </section>

      {awaitingTransfer ? (
        <section className="order-panel order-panel--accent" aria-labelledby="pay-title">
          <h2 id="pay-title" className="eyebrow">
            How to pay
          </h2>
          <p>
            Transfer <strong>{formatMVR(order.total)}</strong> and use{" "}
            <strong>{number}</strong> as the reference.
          </p>
          {settings.bankTransferInstructions ? (
            <pre className="bank-details">{settings.bankTransferInstructions}</pre>
          ) : (
            <p>We will send you our bank details by phone or WhatsApp.</p>
          )}
          <p>
            Then send your transfer slip with your order number
            {whatsapp ? (
              <>
                {" "}on{" "}
                <a href={whatsapp} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </>
            ) : null}
            {instagram ? (
              <>
                {whatsapp ? " or " : " on "}
                <a href={instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </>
            ) : null}
            . We mark your order paid once we confirm the transfer.
          </p>
          {order.hold.state === "until" ? (
            <p className="order-panel__hold">
              Your items are held until {formatDateTime(order.hold.until)}.
            </p>
          ) : order.hold.state === "expired" ? (
            <p className="order-panel__hold">
              The hold on your items has expired. Contact us to confirm
              availability before paying.
            </p>
          ) : null}
        </section>
      ) : null}

      {!order.paid && !cancelled && order.paymentMethod === "CASH_ON_DELIVERY" ? (
        <section className="order-panel" aria-labelledby="cod-title">
          <h2 id="cod-title" className="eyebrow">
            Cash on delivery
          </h2>
          <p>
            Please have <strong>{formatMVR(order.total)}</strong> ready when
            your order arrives. We will contact you to arrange delivery.
          </p>
        </section>
      ) : null}

      <section className="order-panel" aria-labelledby="items-title">
        <h2 id="items-title" className="eyebrow">
          Items
        </h2>
        <ul className="summary-lines">
          {order.lines.map((line, index) => (
            <li key={index}>
              <span>
                {line.name}
                <small>
                  {line.variantLabel} × {line.quantity}
                </small>
              </span>
              <span>{formatMVR(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <OrderSummaryRows
          subtotal={order.subtotal}
          delivery={order.deliveryFee}
          discount={
            order.discountCode
              ? { label: `Discount (${order.discountCode})`, amount: order.discountAmount }
              : null
          }
          total={order.total}
        />
      </section>

      {order.delivery ? (
        <section className="order-panel" aria-labelledby="delivery-title">
          <h2 id="delivery-title" className="eyebrow">
            Delivery
          </h2>
          <dl className="detail-list">
            <div>
              <dt>Method</dt>
              <dd>{order.delivery.methodName}</dd>
            </div>
            <div>
              <dt>Island / Area</dt>
              <dd>{order.delivery.area}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{order.delivery.address}</dd>
            </div>
            {order.delivery.notes ? (
              <div>
                <dt>Notes</dt>
                <dd>{order.delivery.notes}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <div className="order-actions">
        <Link className="button button--dark" href="/shop">
          Continue shopping
        </Link>
        {whatsapp ? (
          <a className="button button--outline" href={whatsapp} target="_blank" rel="noreferrer">
            Message us
          </a>
        ) : null}
      </div>
    </>
  );
}
