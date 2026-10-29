"use client";

import { Select } from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Save } from "lucide-react";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { useFormAction } from "@/components/ui/use-form-action";
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
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialSupplyFormState,
  );
  return (
    <form ref={formRef} onSubmit={onSubmit} className="editor-form">
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
            <Select
              name="active"
              defaultValue={defaults.active === false ? "false" : "true"}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
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

type SupplierTermsDefaults = {
  productId: string;
  productUrl: string | null;
  supplierSku: string | null;
  moq: number | null;
  sampleCost: string | null;
  bulkUnitPrice: string | null;
  currency: string;
  notes: string | null;
};

export function SupplierProductEditor({
  action,
  products,
  defaults,
  label = "Add product terms",
  compact = false,
}: {
  action: (
    state: SupplyFormState,
    formData: FormData,
  ) => Promise<SupplyFormState>;
  products: { id: string; name: string; code: string }[];
  defaults?: SupplierTermsDefaults;
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={
          compact ? "text-link supply-edit-link" : "button button--dark"
        }
        type="button"
        onClick={() => setOpen(true)}
      >
        {compact ? <Pencil aria-hidden="true" /> : <Plus aria-hidden="true" />}
        {label}
      </button>
      {open ? (
        <ModalDialog
          titleId="supplier-terms-title"
          kicker="Supplier product"
          title={defaults ? "Edit product terms" : "Add product terms"}
          onClose={() => setOpen(false)}
          className="supply-editor-dialog"
        >
          <SupplierProductForm
            action={action}
            products={products}
            defaults={defaults}
            onCancel={() => setOpen(false)}
          />
        </ModalDialog>
      ) : null}
    </>
  );
}

function SupplierProductForm({
  action,
  products,
  defaults,
  onCancel,
}: {
  action: (
    state: SupplyFormState,
    formData: FormData,
  ) => Promise<SupplyFormState>;
  products: { id: string; name: string; code: string }[];
  defaults?: SupplierTermsDefaults;
  onCancel: () => void;
}) {
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialSupplyFormState,
  );
  return (
    <form ref={formRef} onSubmit={onSubmit}>
      <div className="dialog-body">
        <div className="form-grid">
          <label className="field">
            <span>SET25 product</span>
            <Select
              name="productId"
              required
              defaultValue={defaults?.productId ?? ""}
              aria-invalid={Boolean(error("productId"))}
            >
              <option value="" disabled>
                Choose a product
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.code} · {product.name}
                </option>
              ))}
            </Select>
            <FieldError message={error("productId")} />
          </label>
          <Field
            name="productUrl"
            label="Alibaba / product link"
            type="url"
            defaultValue={defaults?.productUrl ?? ""}
          />
          <Field
            name="supplierSku"
            label="Supplier SKU"
            defaultValue={defaults?.supplierSku ?? ""}
          />
          <Field
            name="moq"
            label="MOQ"
            type="number"
            min={1}
            step={1}
            defaultValue={defaults?.moq ?? ""}
            error={error("moq")}
          />
          <Field
            name="sampleCost"
            label="Sample cost"
            inputMode="decimal"
            defaultValue={defaults?.sampleCost ?? ""}
            error={error("sampleCost")}
          />
          <Field
            name="bulkUnitPrice"
            label="Bulk unit price"
            inputMode="decimal"
            defaultValue={defaults?.bulkUnitPrice ?? ""}
            error={error("bulkUnitPrice")}
          />
          <Field
            name="currency"
            label="Currency"
            defaultValue={defaults?.currency ?? "USD"}
            maxLength={3}
            required
            error={error("currency")}
          />
          <label className="field field--wide">
            <span>Terms notes</span>
            <textarea
              name="notes"
              rows={3}
              maxLength={2000}
              defaultValue={defaults?.notes ?? ""}
              aria-invalid={Boolean(error("notes"))}
            />
            <FieldError message={error("notes")} />
          </label>
        </div>
        <FormResult state={state} />
      </div>
      <div className="dialog-actions">
        <button
          className="button button--secondary"
          type="button"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </button>
        <button
          className="button button--dark"
          type="submit"
          disabled={pending}
        >
          <Save aria-hidden="true" />{" "}
          {pending ? "Saving…" : "Save product terms"}
        </button>
      </div>
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
      <FieldError message={error} />
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <small className="field-error">{message}</small> : null;
}

export function FormResult({ state }: { state: SupplyFormState }) {
  return state.message ? (
    <div className="form-message form-message--error" role="alert">
      {state.message}
    </div>
  ) : null;
}
