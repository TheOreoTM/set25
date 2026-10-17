"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Plus, Save } from "lucide-react";
import {
  initialSupplyFormState,
  type SupplyFormState,
} from "@/lib/supply/validation";

type SupplierDefaults = {
  name?: string;
  country?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  alibabaUrl?: string | null;
  notes?: string | null;
  active?: boolean;
};

export function SupplierForm({
  action,
  defaults = {},
  cancelHref,
  submitLabel,
}: {
  action: (
    state: SupplyFormState,
    formData: FormData,
  ) => Promise<SupplyFormState>;
  defaults?: SupplierDefaults;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialSupplyFormState,
  );
  const error = (name: string) => state.errors?.[name]?.[0];
  return (
    <form action={formAction} className="editor-form">
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Supplier</p>
          <h2>Contact and sourcing details</h2>
          <p>
            Keep the practical details SET25 needs to place and follow up an
            order.
          </p>
        </div>
        <div className="form-grid">
          <Field
            name="name"
            label="Supplier name"
            required
            defaultValue={defaults.name}
            error={error("name")}
          />
          <Field
            name="country"
            label="Country"
            defaultValue={defaults.country ?? ""}
          />
          <Field
            name="contactName"
            label="Contact name"
            defaultValue={defaults.contactName ?? ""}
          />
          <Field
            name="phone"
            label="Phone / WhatsApp"
            defaultValue={defaults.phone ?? ""}
          />
          <Field
            name="email"
            label="Email"
            type="email"
            defaultValue={defaults.email ?? ""}
            error={error("email")}
          />
          <Field
            name="website"
            label="Website"
            type="url"
            defaultValue={defaults.website ?? ""}
          />
          <Field
            name="alibabaUrl"
            label="Alibaba supplier link"
            type="url"
            defaultValue={defaults.alibabaUrl ?? ""}
          />
          <label className="field">
            <span>Status</span>
            <select
              name="active"
              defaultValue={defaults.active === false ? "false" : "true"}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
        </div>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Context</p>
          <h2>Notes</h2>
        </div>
        <label className="field">
          <span>Supplier notes</span>
          <textarea
            name="notes"
            rows={5}
            maxLength={2000}
            defaultValue={defaults.notes ?? ""}
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
          <Save aria-hidden="true" /> {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function SupplierProductForm({
  action,
  products,
}: {
  action: (
    state: SupplyFormState,
    formData: FormData,
  ) => Promise<SupplyFormState>;
  products: { id: string; name: string; code: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialSupplyFormState,
  );
  return (
    <form action={formAction} className="supply-inline-form">
      <div className="form-grid">
        <label className="field">
          <span>SET25 product</span>
          <select name="productId" required defaultValue="">
            <option value="" disabled>
              Choose a product
            </option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.code} · {product.name}
              </option>
            ))}
          </select>
        </label>
        <Field name="productUrl" label="Alibaba / product link" type="url" />
        <Field name="supplierSku" label="Supplier SKU" />
        <Field name="moq" label="MOQ" type="number" min={1} step={1} />
        <Field name="sampleCost" label="Sample cost" inputMode="decimal" />
        <Field
          name="bulkUnitPrice"
          label="Bulk unit price"
          inputMode="decimal"
        />
        <Field
          name="currency"
          label="Currency"
          defaultValue="USD"
          maxLength={3}
          required
        />
        <Field name="notes" label="Terms notes" />
      </div>
      <FormResult state={state} />
      <button className="button button--dark" type="submit" disabled={pending}>
        <Plus aria-hidden="true" /> {pending ? "Saving…" : "Save product terms"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  ...props
}: {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <input aria-invalid={Boolean(error)} {...props} />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

export function FormResult({ state }: { state: SupplyFormState }) {
  return state.message ? (
    <div className="form-message form-message--error" role="alert">
      {state.message}
    </div>
  ) : null;
}
