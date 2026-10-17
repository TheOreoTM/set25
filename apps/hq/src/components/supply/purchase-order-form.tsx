"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { formatMVR } from "@set25/shared";
import {
  initialSupplyFormState,
  type SupplyFormState,
} from "@/lib/supply/validation";
import { FormResult } from "./supplier-forms";

type VariantOption = {
  id: string;
  label: string;
  sku: string;
};

type Line = {
  key: string;
  variantId: string;
  quantity: number;
  unitCost: string;
};

export function PurchaseOrderForm({
  action,
  suppliers,
  variants,
  idempotencyKey,
  defaults,
  cancelHref,
}: {
  action: (
    state: SupplyFormState,
    formData: FormData,
  ) => Promise<SupplyFormState>;
  suppliers: { id: string; name: string }[];
  variants: VariantOption[];
  idempotencyKey: string;
  defaults?: {
    supplierId: string;
    supplierReference: string | null;
    currency: string;
    exchangeRateToMvr: string;
    expectedAt: string;
    notes: string | null;
    lines: Omit<Line, "key">[];
  };
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialSupplyFormState,
  );
  const [lines, setLines] = useState<Line[]>(
    defaults?.lines.map((line) => ({ ...line, key: crypto.randomUUID() })) ?? [
      {
        key: crypto.randomUUID(),
        variantId: "",
        quantity: 1,
        unitCost: "0.00",
      },
    ],
  );
  const [currency, setCurrency] = useState(defaults?.currency ?? "USD");
  const [rate, setRate] = useState(defaults?.exchangeRateToMvr ?? "15.42");
  const supplierTotal = lines.reduce(
    (sum, line) =>
      sum + (Number(line.unitCost) || 0) * (Number(line.quantity) || 0),
    0,
  );
  const update = (key: string, value: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...value } : line)),
    );
  return (
    <form action={formAction} className="editor-form supply-editor">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Purchase order</p>
          <h2>Supplier agreement</h2>
          <p>The currency and exchange rate are snapshotted on this PO.</p>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Supplier</span>
            <select
              name="supplierId"
              required
              defaultValue={defaults?.supplierId ?? ""}
            >
              <option value="" disabled>
                Choose a supplier
              </option>
              {suppliers.map((supplier) => (
                <option value={supplier.id} key={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Supplier reference</span>
            <input
              name="supplierReference"
              defaultValue={defaults?.supplierReference ?? ""}
            />
          </label>
          <label className="field">
            <span>Currency</span>
            <input
              name="currency"
              required
              maxLength={3}
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value.toUpperCase())
              }
            />
          </label>
          <label className="field">
            <span>Exchange rate to MVR</span>
            <input
              name="exchangeRateToMvr"
              required
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
            />
            <small>1 {currency || "unit"} × rate = MVR</small>
          </label>
          <label className="field">
            <span>ETA</span>
            <input
              name="expectedAt"
              type="date"
              defaultValue={defaults?.expectedAt ?? ""}
            />
          </label>
        </div>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Items</p>
          <h2>Variants and agreed costs</h2>
          <p>
            These names and prices become historical snapshots when the PO is
            saved.
          </p>
        </div>
        <div className="supply-line-list">
          {lines.map((line, index) => (
            <div className="supply-line-editor" key={line.key}>
              <span className="order-line-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <label className="field">
                <span>Variant</span>
                <select
                  name="variantId"
                  required
                  value={line.variantId}
                  onChange={(event) =>
                    update(line.key, { variantId: event.target.value })
                  }
                >
                  <option value="">Choose a variant</option>
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.label} · {variant.sku}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Ordered</span>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={line.quantity}
                  onChange={(event) =>
                    update(line.key, { quantity: Number(event.target.value) })
                  }
                />
              </label>
              <label className="field">
                <span>Cost each ({currency})</span>
                <input
                  name="unitCost"
                  inputMode="decimal"
                  required
                  value={line.unitCost}
                  onChange={(event) =>
                    update(line.key, { unitCost: event.target.value })
                  }
                />
              </label>
              <div className="order-line-total">
                <span>Line total</span>
                <strong>
                  {currency}{" "}
                  {(
                    (Number(line.unitCost) || 0) * (Number(line.quantity) || 0)
                  ).toFixed(2)}
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
          ))}
        </div>
        <button
          className="button button--secondary order-add-line"
          type="button"
          onClick={() =>
            setLines((current) => [
              ...current,
              {
                key: crypto.randomUUID(),
                variantId: "",
                quantity: 1,
                unitCost: "0.00",
              },
            ])
          }
        >
          <Plus aria-hidden="true" /> Add item
        </button>
      </section>
      <section className="form-section supply-total-strip">
        <div>
          <span>Supplier total</span>
          <strong>
            {currency} {supplierTotal.toFixed(2)}
          </strong>
        </div>
        <div>
          <span>Product cost in MVR</span>
          <strong>{formatMVR(supplierTotal * (Number(rate) || 0))}</strong>
        </div>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Context</p>
          <h2>Notes</h2>
        </div>
        <label className="field">
          <span>Purchase order notes</span>
          <textarea
            name="notes"
            rows={4}
            maxLength={2000}
            defaultValue={defaults?.notes ?? ""}
          />
        </label>
      </section>
      <FormResult state={state} />
      <div className="form-actions">
        <Link className="button button--secondary" href={cancelHref}>
          <ArrowLeft aria-hidden="true" /> Cancel
        </Link>
        <button
          className="button button--dark"
          type="submit"
          disabled={pending}
        >
          <Save aria-hidden="true" />{" "}
          {pending ? "Saving…" : defaults ? "Save draft" : "Create draft PO"}
        </button>
      </div>
    </form>
  );
}
