"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import {
  CHECKOUT_PAYMENT_METHODS,
  checkoutPaymentMethodLabels,
  formatMVR,
  type CheckoutPaymentMethodValue,
} from "@set25/shared";
import { placeOrderAction } from "@/lib/checkout/actions";
import { initialCheckoutFormState } from "@/lib/checkout/validation";
import { CHECKOUT_KEY_STORAGE, type CartItem } from "@/lib/cart";
import type { PublicDeliveryOption } from "@/lib/settings";
import { useCart } from "./cart-provider";
import { OrderSummaryRows } from "./order-summary";
import { useCartQuote } from "./use-cart-quote";

const paymentDescriptions: Record<CheckoutPaymentMethodValue, string> = {
  BANK_TRANSFER:
    "Transfer after ordering. Bank details are shown on your order confirmation.",
  CASH_ON_DELIVERY: "Pay in cash when your order is delivered.",
};

/**
 * One idempotency key per cart. A retry of the same cart (double click,
 * network failure, refresh) reuses the key so the server returns the order it
 * already created instead of creating another.
 */
function checkoutKeyFor(items: CartItem[]) {
  const signature = items
    .map((item) => `${item.variantId}:${item.quantity}`)
    .sort()
    .join(",");
  try {
    const stored = JSON.parse(
      window.sessionStorage.getItem(CHECKOUT_KEY_STORAGE) ?? "null",
    ) as { key: string; signature: string } | null;
    if (stored?.key && stored.signature === signature) return stored.key;
    const key = crypto.randomUUID();
    window.sessionStorage.setItem(
      CHECKOUT_KEY_STORAGE,
      JSON.stringify({ key, signature }),
    );
    return key;
  } catch {
    return crypto.randomUUID();
  }
}

export function CheckoutForm({
  deliveryOptions,
  deliveryInstructions,
}: {
  deliveryOptions: PublicDeliveryOption[];
  deliveryInstructions: string | null;
}) {
  const { items, ready } = useCart();
  const [state, formAction, pending] = useActionState(
    placeOrderAction,
    initialCheckoutFormState,
  );
  const [deliveryOptionId, setDeliveryOptionId] = useState(
    deliveryOptions.length === 1 ? deliveryOptions[0].id : "",
  );
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const quote = useCartQuote(items, {
    deliveryOptionId: deliveryOptionId || undefined,
    discountCode: appliedCode || undefined,
  });
  const error = (name: string) => state.errors?.[name]?.[0];

  if (!ready) return <div className="skeleton skeleton--block" aria-hidden="true" />;
  if (!items.length)
    return (
      <section className="empty-cart">
        <h2>Your cart is empty.</h2>
        <Link className="button button--dark" href="/shop">
          Shop Drop 001 <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    );

  const current = quote.quote;
  const problem = current?.lines.some((line) => line.problem) ?? false;
  const discount =
    current?.discount.status === "applied" ? current.discount : null;
  const codeInvalid = appliedCode && current?.discount.status === "invalid";

  function submit(formData: FormData) {
    formData.set(
      "cart",
      JSON.stringify(
        items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      ),
    );
    formData.set("checkoutKey", checkoutKeyFor(items));
    formData.set("discountCode", discount ? discount.code : "");
    formAction(formData);
  }

  return (
    <form action={submit} className="checkout">
      <div className="checkout__main">
        <fieldset className="checkout-section">
          <legend>
            <span className="checkout-section__index">01</span> Your details
          </legend>
          <div className="form-grid">
            <Field
              label="Full name"
              name="name"
              autoComplete="name"
              required
              maxLength={100}
              error={error("name")}
            />
            <Field
              label="Phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              required
              maxLength={30}
              hint="We will call or message this number about your order."
              error={error("phone")}
            />
            <Field
              label="Email (optional)"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              error={error("email")}
            />
            <Field
              label="Instagram (optional)"
              name="instagramHandle"
              autoComplete="off"
              maxLength={31}
              placeholder="@username"
              error={error("instagramHandle")}
            />
          </div>
        </fieldset>

        <fieldset className="checkout-section">
          <legend>
            <span className="checkout-section__index">02</span> Delivery
          </legend>
          <div className="choice-list">
            {deliveryOptions.map((option) => (
              <label className="choice" key={option.id}>
                <input
                  type="radio"
                  name="deliveryOptionId"
                  value={option.id}
                  checked={deliveryOptionId === option.id}
                  onChange={() => setDeliveryOptionId(option.id)}
                  required
                />
                <span className="choice__body">
                  <strong>{option.name}</strong>
                  {option.description ? <small>{option.description}</small> : null}
                </span>
                <span className="choice__price">
                  {/^0+(\.0+)?$/.test(option.price) ? "Free" : formatMVR(option.price)}
                </span>
              </label>
            ))}
          </div>
          {error("deliveryOptionId") ? (
            <p className="field-error">{error("deliveryOptionId")}</p>
          ) : null}
          <div className="form-grid">
            <Field
              label="Island / Area"
              name="area"
              autoComplete="address-level2"
              required
              maxLength={100}
              placeholder="e.g. Malé, Henveiru"
              error={error("area")}
            />
            <Field
              label="Delivery address"
              name="address"
              autoComplete="street-address"
              required
              maxLength={300}
              placeholder="House name, floor, street"
              error={error("address")}
            />
          </div>
          <label className="field">
            <span>Delivery notes (optional)</span>
            <textarea
              name="notes"
              rows={3}
              maxLength={500}
              aria-invalid={Boolean(error("notes"))}
              placeholder="Landmarks, preferred time, or ferry details"
            />
            {error("notes") ? <small className="field-error">{error("notes")}</small> : null}
          </label>
          {deliveryInstructions ? (
            <p className="checkout-note">{deliveryInstructions}</p>
          ) : null}
        </fieldset>

        <fieldset className="checkout-section">
          <legend>
            <span className="checkout-section__index">03</span> Payment
          </legend>
          <div className="choice-list">
            {CHECKOUT_PAYMENT_METHODS.map((method) => (
              <label className="choice" key={method}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  defaultChecked={method === "BANK_TRANSFER"}
                  required
                />
                <span className="choice__body">
                  <strong>{checkoutPaymentMethodLabels[method]}</strong>
                  <small>{paymentDescriptions[method]}</small>
                </span>
              </label>
            ))}
          </div>
          {error("paymentMethod") ? (
            <p className="field-error">{error("paymentMethod")}</p>
          ) : null}
          <p className="checkout-note">
            No card payment is taken online. Your order is confirmed once we
            receive payment or deliver it.
          </p>
        </fieldset>
      </div>

      <aside className="summary-panel checkout__summary" aria-labelledby="checkout-summary">
        <h2 id="checkout-summary" className="eyebrow">
          Order summary
        </h2>
        <ul className="summary-lines">
          {items.map((item) => {
            const line = current?.lines.find(
              (entry) => entry.variantId === item.variantId,
            );
            return (
              <li key={item.variantId}>
                <span>
                  {item.name}
                  <small>
                    {item.variantLabel} × {item.quantity}
                  </small>
                  {line?.problem ? (
                    <small className="field-error">Needs attention in your cart</small>
                  ) : null}
                </span>
                <span>
                  {line && !line.problem && line.quantity === item.quantity
                    ? formatMVR(line.lineTotal)
                    : "—"}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="discount-field">
          <label className="field">
            <span>Discount code</span>
            <div className="discount-field__row">
              <input
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={30}
                aria-invalid={Boolean(codeInvalid || error("discountCode"))}
              />
              {discount ? (
                <button
                  type="button"
                  className="button button--outline"
                  onClick={() => {
                    setAppliedCode("");
                    setCodeInput("");
                  }}
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  className="button button--outline"
                  disabled={!codeInput.trim()}
                  onClick={() => setAppliedCode(codeInput.trim())}
                >
                  Apply
                </button>
              )}
            </div>
            {codeInvalid ? (
              <small className="field-error">This code is not valid.</small>
            ) : discount ? (
              <small>
                {discount.code} applied · {discount.percent}% off items
              </small>
            ) : error("discountCode") ? (
              <small className="field-error">{error("discountCode")}</small>
            ) : null}
          </label>
        </div>

        {current ? (
          <OrderSummaryRows
            subtotal={current.subtotal}
            delivery={current.deliveryFee}
            discount={
              discount
                ? { label: `Discount (${discount.code})`, amount: discount.amount }
                : null
            }
            total={current.total}
            totalLabel={current.deliveryFee === null ? "Total before delivery" : "Total"}
          />
        ) : (
          <div className="skeleton skeleton--block" aria-hidden="true" />
        )}

        {state.message ? (
          <p className="form-error" role="alert">
            {state.message}
          </p>
        ) : null}
        {problem ? (
          <p className="notice">
            Some items need attention. <Link href="/cart">Review your cart</Link>.
          </p>
        ) : null}
        <button
          className="button button--dark button--block"
          type="submit"
          disabled={pending || problem || !current}
        >
          <LockKeyhole aria-hidden="true" />
          {pending ? "Placing order…" : "Place order"}
        </button>
        <p className="summary-panel__note">
          Totals are calculated on our server. Your stock is held for a limited
          time while you complete payment.
        </p>
      </aside>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  ...props
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      {error ? (
        <small className="field-error" id={`${name}-error`}>
          {error}
        </small>
      ) : hint ? (
        <small id={`${name}-hint`}>{hint}</small>
      ) : null}
    </label>
  );
}
