"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { initialFormState, type FormState } from "@/lib/catalog/validation";

type VariantDefaults = {
  sku?: string;
  size?: string | null;
  color?: string | null;
  cost?: string | null;
  sellPriceOverride?: string | null;
  reorderAt?: number;
  active?: boolean;
};

export function VariantForm({
  action,
  defaults = {},
  cancelHref,
  basePrice,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults?: VariantDefaults;
  cancelHref: string;
  basePrice: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const error = (field: string) => state.errors?.[field]?.[0];
  return (
    <form action={formAction} className="editor-form editor-form--compact">
      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Identity</p>
          <h2>Variant details</h2>
          <p>
            Stock is adjusted separately so every quantity change has a reason.
          </p>
        </div>
        <div className="form-grid">
          <Field
            label="SKU"
            name="sku"
            required
            defaultValue={defaults.sku}
            placeholder="CORE-BLK-M"
            error={error("sku")}
          />
          <Field
            label="Size"
            name="size"
            defaultValue={defaults.size ?? ""}
            placeholder="M"
            error={error("size")}
          />
          <Field
            label="Colour"
            name="color"
            defaultValue={defaults.color ?? ""}
            placeholder="Black"
            error={error("color")}
          />
          <Field
            label="Cost Each"
            name="cost"
            inputMode="decimal"
            defaultValue={defaults.cost ?? ""}
            placeholder="150.00"
            prefix="MVR"
            error={error("cost")}
          />
          <Field
            label="Sell Price Override"
            name="sellPriceOverride"
            inputMode="decimal"
            defaultValue={defaults.sellPriceOverride ?? ""}
            placeholder={basePrice}
            prefix="MVR"
            hint={`Leave blank to use the product price of MVR ${basePrice}.`}
            error={error("sellPriceOverride")}
          />
          <Field
            label="Reorder At"
            name="reorderAt"
            inputMode="numeric"
            required
            defaultValue={defaults.reorderAt ?? 0}
            min={0}
            step={1}
            error={error("reorderAt")}
          />
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Availability</p>
          <h2>Variant state</h2>
          <p>
            Inactive variants remain in movement history but cannot be adjusted.
          </p>
        </div>
        <label className="check-field">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaults.active ?? true}
          />
          <span>
            <strong>Active variant</strong>
            <small>
              Available for stock operations and future Store availability.
            </small>
          </span>
        </label>
      </div>
      {state.message ? (
        <div className="form-message form-message--error" role="alert">
          {state.message}
        </div>
      ) : null}
      <div className="form-actions">
        <Link className="button button--secondary" href={cancelHref}>
          <ArrowLeft aria-hidden="true" /> Cancel
        </Link>
        <button
          className="button button--dark"
          type="submit"
          disabled={pending}
        >
          <Save aria-hidden="true" /> {pending ? "Saving…" : "Save variant"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  prefix,
  ...props
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  prefix?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className={prefix ? "input-with-prefix" : undefined}>
        {prefix ? <span>{prefix}</span> : null}
        <input name={name} aria-invalid={Boolean(error)} {...props} />
      </div>
      {error ? (
        <small className="field-error">{error}</small>
      ) : hint ? (
        <small>{hint}</small>
      ) : null}
    </label>
  );
}
