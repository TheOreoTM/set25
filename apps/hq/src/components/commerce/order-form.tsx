"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import {
  ORDER_SOURCES,
  formatMVR,
  orderSourceLabels,
  type OrderSourceValue,
} from "@set25/shared";
import { createOrderAction } from "@/lib/commerce/actions";
import { initialCommerceFormState } from "@/lib/commerce/validation";

type Option = { id: string; name: string };
type VariantOption = {
  id: string;
  productName: string;
  label: string;
  sku: string;
  stockOnHand: number;
  sellPrice: string;
};
type Line = {
  key: string;
  variantId: string;
  quantity: number;
  unitPrice: string;
};

export function OrderForm({
  customers,
  teams,
  variants,
  submissionKey,
  preorder = false,
}: {
  customers: Option[];
  teams: Option[];
  variants: VariantOption[];
  submissionKey: string;
  preorder?: boolean;
}) {
  const action = createOrderAction.bind(null, preorder);
  const [state, formAction, pending] = useActionState(
    action,
    initialCommerceFormState,
  );
  const first = variants[0];
  const [lines, setLines] = useState<Line[]>([
    {
      key: crypto.randomUUID(),
      variantId: first?.id ?? "",
      quantity: 1,
      unitPrice: first?.sellPrice ?? "0.00",
    },
  ]);
  const [discount, setDiscount] = useState("0.00");
  const [delivery, setDelivery] = useState("0.00");
  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum + (Number(line.unitPrice) || 0) * (Number(line.quantity) || 0),
        0,
      ),
    [lines],
  );
  const total = Math.max(
    0,
    subtotal - (Number(discount) || 0) + (Number(delivery) || 0),
  );
  const lineError = state.errors?.lines?.[0];

  function updateLine(key: string, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  return (
    <form action={formAction} className="editor-form order-editor">
      <input type="hidden" name="idempotencyKey" value={submissionKey} />
      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">{preorder ? "Preorder" : "Order"}</p>
          <h2>Customer and source</h2>
          <p>
            {preorder
              ? "Preorders use the same order and payment ledger without reducing stock early."
              : "Connect the sale to a customer, a team, or both."}
          </p>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Customer {preorder ? "" : "(optional)"}</span>
            <Select name="customerId" defaultValue="" required={preorder}>
              <option value="">
                {customers.length ? "Select customer" : "No customers yet"}
              </option>
              {customers.map((customer) => (
                <option value={customer.id} key={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
            {state.errors?.customerId ? (
              <small className="field-error">
                {state.errors.customerId[0]}
              </small>
            ) : null}
          </label>
          <label className="field">
            <span>Team (optional)</span>
            <Select name="teamId" defaultValue="">
              <option value="">No team</option>
              {teams.map((team) => (
                <option value={team.id} key={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
            {state.errors?.teamId ? (
              <small className="field-error">{state.errors.teamId[0]}</small>
            ) : null}
          </label>
          <label className="field">
            <span>Order source</span>
            <Select
              name="source"
              defaultValue={preorder ? "INSTAGRAM" : "MANUAL"}
            >
              {ORDER_SOURCES.map((source: OrderSourceValue) => (
                <option value={source} key={source}>
                  {orderSourceLabels[source]}
                </option>
              ))}
            </Select>
            {state.errors?.source ? (
              <small className="field-error">{state.errors.source[0]}</small>
            ) : null}
          </label>
        </div>
      </div>

      <div className="form-section order-lines-section">
        <div className="form-section-title">
          <p className="kicker">Items</p>
          <h2>Products and variants</h2>
          <p>
            Prices are snapshotted on this order. A custom sale price never
            changes the catalogue.
          </p>
        </div>
        <div className="order-line-list">
          {lines.map((line, index) => {
            const variant = variants.find((item) => item.id === line.variantId);
            return (
              <div className="order-line-editor" key={line.key}>
                <span className="order-line-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <label className="field order-line-variant">
                  <span>Variant</span>
                  <Select
                    name="variantId"
                    value={line.variantId}
                    required
                    onChange={(event) => {
                      const selected = variants.find(
                        (item) => item.id === event.target.value,
                      );
                      updateLine(line.key, {
                        variantId: event.target.value,
                        unitPrice: selected?.sellPrice ?? "0.00",
                      });
                    }}
                  >
                    <option value="">Choose a variant</option>
                    {variants.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.productName} · {item.label} · {item.sku} ·{" "}
                        {item.stockOnHand} available
                      </option>
                    ))}
                  </Select>
                  {variant ? (
                    <small>
                      {variant.stockOnHand} currently available · catalogue{" "}
                      {formatMVR(variant.sellPrice)}
                    </small>
                  ) : null}
                </label>
                <label className="field">
                  <span>Quantity</span>
                  <input
                    name="quantity"
                    type="number"
                    min={1}
                    max={10000}
                    step={1}
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.key, {
                        quantity: Number(event.target.value),
                      })
                    }
                    required
                  />
                </label>
                <label className="field">
                  <span>Sell price</span>
                  <div className="input-with-prefix">
                    <span>MVR</span>
                    <input
                      name="unitPrice"
                      inputMode="decimal"
                      value={line.unitPrice}
                      onChange={(event) =>
                        updateLine(line.key, { unitPrice: event.target.value })
                      }
                      required
                    />
                  </div>
                </label>
                <div className="order-line-total">
                  <span>Line total</span>
                  <strong>
                    {formatMVR(
                      (Number(line.unitPrice) || 0) *
                        (Number(line.quantity) || 0),
                    )}
                  </strong>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Remove line ${index + 1}`}
                  disabled={lines.length === 1}
                  onClick={() =>
                    setLines((current) =>
                      current.filter((item) => item.key !== line.key),
                    )
                  }
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            );
          })}
          {lineError ? <p className="field-error">{lineError}</p> : null}
          <button
            className="button button--secondary order-add-line"
            type="button"
            disabled={!variants.length || lines.length >= 50}
            onClick={() =>
              setLines((current) => [
                ...current,
                {
                  key: crypto.randomUUID(),
                  variantId: "",
                  quantity: 1,
                  unitPrice: "0.00",
                },
              ])
            }
          >
            <Plus aria-hidden="true" /> Add another item
          </button>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Totals</p>
          <h2>Discount and delivery</h2>
          <p>
            The server recalculates every line and the final total before
            saving.
          </p>
        </div>
        <div className="order-totals-editor">
          <div className="form-grid">
            <label className="field">
              <span>Discount</span>
              <div className="input-with-prefix">
                <span>MVR</span>
                <input
                  name="discountAmount"
                  inputMode="decimal"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  required
                />
              </div>
              {state.errors?.discountAmount ? (
                <small className="field-error">
                  {state.errors.discountAmount[0]}
                </small>
              ) : null}
            </label>
            <label className="field">
              <span>Delivery fee</span>
              <div className="input-with-prefix">
                <span>MVR</span>
                <input
                  name="deliveryFee"
                  inputMode="decimal"
                  value={delivery}
                  onChange={(event) => setDelivery(event.target.value)}
                  required
                />
              </div>
              {state.errors?.deliveryFee ? (
                <small className="field-error">
                  {state.errors.deliveryFee[0]}
                </small>
              ) : null}
            </label>
          </div>
          <dl className="order-total-preview">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatMVR(subtotal)}</dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd>− {formatMVR(Number(discount) || 0)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{formatMVR(Number(delivery) || 0)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatMVR(total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {preorder ? (
        <div className="form-section">
          <div className="form-section-title">
            <p className="kicker">Preorder</p>
            <h2>Deposit and arrival</h2>
            <p>Incoming supply linking will be added in Milestone 5.</p>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Deposit required</span>
              <div className="input-with-prefix">
                <span>MVR</span>
                <input
                  name="depositRequired"
                  defaultValue="0.00"
                  inputMode="decimal"
                  required
                />
              </div>
              {state.errors?.depositRequired ? (
                <small className="field-error">
                  {state.errors.depositRequired[0]}
                </small>
              ) : null}
            </label>
            <label className="field">
              <span>Estimated arrival (optional)</span>
              <DatePicker name="estimatedArrival" />
              {state.errors?.estimatedArrival ? (
                <small className="field-error">
                  {state.errors.estimatedArrival[0]}
                </small>
              ) : null}
            </label>
          </div>
          <label className="field">
            <span>Preorder notes</span>
            <textarea name="preorderNotes" rows={3} maxLength={2000} />
          </label>
        </div>
      ) : null}

      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Context</p>
          <h2>Order notes</h2>
          <p>Optional internal information for staff handling this sale.</p>
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea name="notes" rows={4} maxLength={2000} />
        </label>
      </div>
      {state.message ? (
        <div className="form-message form-message--error" role="alert">
          {state.message}
        </div>
      ) : null}
      <div className="form-actions">
        <Link
          className="button button--secondary"
          href={preorder ? "/preorders" : "/orders"}
        >
          <ArrowLeft aria-hidden="true" /> Cancel
        </Link>
        <button
          className="button button--dark"
          type="submit"
          disabled={pending || !variants.length}
        >
          <Save aria-hidden="true" />{" "}
          {pending
            ? "Creating once…"
            : preorder
              ? "Create preorder"
              : "Create order"}
        </button>
      </div>
    </form>
  );
}
