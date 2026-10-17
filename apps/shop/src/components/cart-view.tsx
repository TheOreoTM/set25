"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Minus, Plus, X } from "lucide-react";
import { formatMVR } from "@set25/shared";
import { MAX_QUANTITY } from "@/lib/cart";
import { useCart } from "./cart-provider";
import { OrderSummaryRows } from "./order-summary";
import { useCartQuote } from "./use-cart-quote";

const problemText = {
  UNAVAILABLE: "No longer available. Remove it to continue.",
  SOLD_OUT: "Sold out. Remove it to continue.",
  INSUFFICIENT: "Not enough stock for this quantity. Reduce the quantity.",
} as const;

export function CartView({ storeOpen }: { storeOpen: boolean }) {
  const { items, ready, setQuantity, remove } = useCart();
  const quote = useCartQuote(items);

  if (!ready) return <div className="skeleton skeleton--block" aria-hidden="true" />;
  if (!items.length)
    return (
      <section className="empty-cart">
        <h2>Your cart is empty.</h2>
        <p>Built for the next point. Start with Drop 001.</p>
        <Link className="button button--dark" href="/shop">
          Shop Drop 001 <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    );

  const linesById = new Map(
    (quote.quote?.lines ?? []).map((line) => [line.variantId, line]),
  );
  const hasProblem = quote.quote?.lines.some((line) => line.problem) ?? false;
  const quoteReady = quote.status === "ready";

  return (
    <div className="cart-layout">
      <ul className="cart-lines" aria-label="Items in your cart">
        {items.map((item) => {
          const quoted = linesById.get(item.variantId);
          // Ignore a quote for an older quantity while a new one loads.
          const line =
            quoted && quoted.quantity === item.quantity ? quoted : undefined;
          const unitPrice = line && !line.problem ? line.unitPrice : item.unitPrice;
          return (
            <li className="cart-line" key={item.variantId}>
              <Link
                className="cart-line__image"
                href={`/products/${item.slug}`}
                tabIndex={-1}
                aria-hidden="true"
              >
                {item.image ? (
                  <Image src={item.image.url} alt="" fill sizes="96px" />
                ) : null}
              </Link>
              <div className="cart-line__info">
                <h3>
                  <Link href={`/products/${item.slug}`}>
                    {line?.name || item.name}
                  </Link>
                </h3>
                <p className="cart-line__variant">
                  {line?.variantLabel ?? item.variantLabel}
                </p>
                <p className="cart-line__unit">{formatMVR(unitPrice)} each</p>
                {line?.problem ? (
                  <p className="cart-line__problem" role="alert">
                    {problemText[line.problem]}
                  </p>
                ) : null}
              </div>
              <div className="cart-line__controls">
                <div
                  className="stepper stepper--small"
                  role="group"
                  aria-label={`Quantity for ${item.name}`}
                >
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={item.quantity <= 1}
                    onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                  >
                    <Minus aria-hidden="true" />
                  </button>
                  <output aria-live="polite">{item.quantity}</output>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={item.quantity >= MAX_QUANTITY}
                    onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                  >
                    <Plus aria-hidden="true" />
                  </button>
                </div>
                <p className="cart-line__total">
                  {line && !line.problem ? (
                    formatMVR(line.lineTotal)
                  ) : line?.problem ? (
                    "—"
                  ) : (
                    <span className="skeleton skeleton--inline" aria-label="Updating" />
                  )}
                </p>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove ${item.name} (${item.variantLabel})`}
                  onClick={() => remove(item.variantId)}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <aside className="summary-panel" aria-labelledby="summary-title">
        <h2 id="summary-title" className="eyebrow">
          Order summary
        </h2>
        {quote.quote ? (
          <OrderSummaryRows
            subtotal={quote.quote.subtotal}
            delivery={null}
            total={quote.quote.subtotal}
            totalLabel="Total before delivery"
          />
        ) : (
          <div className="skeleton skeleton--block" aria-hidden="true" />
        )}
        {quote.status === "error" ? (
          <p className="form-error" role="alert">
            {quote.message}
          </p>
        ) : null}
        {!storeOpen ? (
          <p className="notice">Online ordering is temporarily unavailable.</p>
        ) : hasProblem ? (
          <p className="notice">Update the highlighted items to continue.</p>
        ) : null}
        {storeOpen && quoteReady && !hasProblem ? (
          <Link className="button button--dark button--block" href="/checkout">
            Checkout <ArrowRight aria-hidden="true" />
          </Link>
        ) : (
          <button className="button button--dark button--block" type="button" disabled>
            Checkout
          </button>
        )}
        <p className="summary-panel__note">
          Prices are confirmed on our server at checkout. Pay by bank transfer
          or cash on delivery.
        </p>
      </aside>
    </div>
  );
}
