"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  productCategoryLabels,
  productStatusLabels,
  type ProductCategoryValue,
  type ProductStatusValue,
} from "@set25/shared";
import { ArrowLeft, Save } from "lucide-react";
import { initialFormState, type FormState } from "@/lib/catalog/validation";

type ProductDefaults = {
  name?: string;
  code?: string;
  slug?: string;
  category?: ProductCategoryValue;
  shortDescription?: string | null;
  description?: string | null;
  retailPrice?: string;
  status?: ProductStatusValue;
  isPublished?: boolean;
  brandLine?: string | null;
};

export function ProductForm({
  action,
  defaults = {},
  cancelHref,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults?: ProductDefaults;
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const error = (field: string) => state.errors?.[field]?.[0];

  return (
    <form action={formAction} className="editor-form">
      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Identity</p>
          <h2>Product details</h2>
          <p>The shared identity used by HQ and, when published, the Store.</p>
        </div>
        <div className="form-grid">
          <Field
            label="Product name"
            name="name"
            error={error("name")}
            required
            defaultValue={defaults.name}
            placeholder="SET25 CORE"
          />
          <Field
            label="Product code"
            name="code"
            error={error("code")}
            required
            defaultValue={defaults.code}
            placeholder="CORE"
            hint="Uppercase internal code"
          />
          <Field
            label="URL slug"
            name="slug"
            error={error("slug")}
            defaultValue={defaults.slug}
            placeholder="set25-core"
            hint="Generated from the name if left blank"
          />
          <label className="field">
            <span>Category</span>
            <select
              name="category"
              defaultValue={defaults.category ?? "OTHER"}
              aria-invalid={Boolean(error("category"))}
            >
              {PRODUCT_CATEGORIES.map((category) => (
                <option value={category} key={category}>
                  {productCategoryLabels[category]}
                </option>
              ))}
            </select>
            {error("category") ? (
              <small className="field-error">{error("category")}</small>
            ) : null}
          </label>
          <Field
            label="Brand line"
            name="brandLine"
            error={error("brandLine")}
            defaultValue={defaults.brandLine ?? ""}
            placeholder="Performance"
            hint="Optional collection or line"
          />
          <Field
            label="Retail price"
            name="retailPrice"
            error={error("retailPrice")}
            required
            defaultValue={defaults.retailPrice}
            placeholder="299.00"
            prefix="MVR"
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Description</p>
          <h2>Customer-facing copy</h2>
          <p>Keep the short description compact enough for product lists.</p>
        </div>
        <div className="form-stack">
          <label className="field">
            <span>Short description</span>
            <input
              name="shortDescription"
              defaultValue={defaults.shortDescription ?? ""}
              maxLength={180}
              placeholder="Performance Knee Pads"
              aria-invalid={Boolean(error("shortDescription"))}
            />
            {error("shortDescription") ? (
              <small className="field-error">{error("shortDescription")}</small>
            ) : (
              <small>Maximum 180 characters</small>
            )}
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              name="description"
              defaultValue={defaults.description ?? ""}
              rows={6}
              maxLength={5000}
              placeholder="Describe fit, performance, and intended use."
              aria-invalid={Boolean(error("description"))}
            />
            {error("description") ? (
              <small className="field-error">{error("description")}</small>
            ) : null}
          </label>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Availability</p>
          <h2>Status and publishing</h2>
          <p>
            Publishing prepares customer-safe visibility; Store pages are not
            part of this milestone.
          </p>
        </div>
        <div className="form-stack">
          <label className="field">
            <span>Product status</span>
            <select
              name="status"
              defaultValue={defaults.status ?? "DRAFT"}
              aria-invalid={Boolean(error("status"))}
            >
              {PRODUCT_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {productStatusLabels[status]}
                </option>
              ))}
            </select>
            {error("status") ? (
              <small className="field-error">{error("status")}</small>
            ) : null}
          </label>
          <label className="check-field">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={defaults.isPublished}
            />
            <span>
              <strong>Published</strong>
              <small>
                Allow this product to become visible to customer-safe Store
                queries later.
              </small>
            </span>
          </label>
        </div>
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
          <Save aria-hidden="true" /> {pending ? "Saving…" : submitLabel}
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
