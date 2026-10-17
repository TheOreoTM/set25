"use client";

import { useActionState } from "react";
import { Plus, Save } from "lucide-react";
import {
  initialStoreFormState,
  type StoreFormState,
} from "@/lib/store/validation";

type Action = (
  state: StoreFormState,
  formData: FormData,
) => Promise<StoreFormState>;

export type StoreSettingsDefaults = {
  storeOpen: boolean;
  announcement: string;
  reservationHours: number;
  supportPhone: string;
  supportWhatsApp: string;
  instagramHandle: string;
  bankTransferInstructions: string;
  deliveryInstructions: string;
};

export type DeliveryOptionDefaults = {
  name: string;
  description: string;
  /** Decimal as a string; never a float. */
  price: string;
  sortOrder: number;
  active: boolean;
};

export function StoreSettingsForm({
  action,
  defaults,
}: {
  action: Action;
  defaults: StoreSettingsDefaults;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialStoreFormState,
  );
  const error = (name: string) => state.errors?.[name]?.[0];
  return (
    <form action={formAction} className="editor-form">
      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Availability</p>
          <h2>Online ordering</h2>
          <p>
            When ordering is off, customers can still browse the Store but
            checkout is disabled.
          </p>
        </div>
        <div className="form-grid">
          <label className="check-field">
            <input
              type="checkbox"
              name="storeOpen"
              defaultChecked={defaults.storeOpen}
            />
            <span>
              <strong>Store open for orders</strong>
              <small>
                Turn off to pause checkout. Existing orders are unaffected.
              </small>
            </span>
          </label>
          <Field
            label="Reservation hours"
            name="reservationHours"
            inputMode="numeric"
            required
            defaultValue={String(defaults.reservationHours)}
            error={error("reservationHours")}
            hint="How long an unpaid Store order holds its stock (1–168)."
          />
          <Field
            label="Announcement"
            name="announcement"
            maxLength={160}
            defaultValue={defaults.announcement}
            error={error("announcement")}
            hint="Optional one-line message shown at the top of the Store."
          />
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Customer contact</p>
          <h2>Support channels</h2>
          <p>Shown in the Store footer and on order confirmations.</p>
        </div>
        <div className="form-grid">
          <Field
            label="Support phone"
            name="supportPhone"
            inputMode="tel"
            defaultValue={defaults.supportPhone}
            error={error("supportPhone")}
          />
          <Field
            label="WhatsApp number"
            name="supportWhatsApp"
            inputMode="tel"
            defaultValue={defaults.supportWhatsApp}
            error={error("supportWhatsApp")}
            hint="Include the country code, for example 9607771234."
          />
          <Field
            label="Instagram"
            name="instagramHandle"
            defaultValue={defaults.instagramHandle}
            error={error("instagramHandle")}
            placeholder="set25.mv"
          />
        </div>
      </div>
      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Instructions</p>
          <h2>Payment and delivery</h2>
          <p>
            Public text. Bank details entered here are shown to customers who
            choose Bank Transfer.
          </p>
        </div>
        <div className="form-grid">
          <TextArea
            label="Bank transfer instructions"
            name="bankTransferInstructions"
            defaultValue={defaults.bankTransferInstructions}
            error={error("bankTransferInstructions")}
            placeholder={"Bank: …\nAccount name: …\nAccount number: …"}
          />
          <TextArea
            label="Delivery instructions"
            name="deliveryInstructions"
            defaultValue={defaults.deliveryInstructions}
            error={error("deliveryInstructions")}
            placeholder="When and how customers can expect delivery."
          />
        </div>
      </div>
      <Footer state={state} pending={pending} label="Save Store settings" />
    </form>
  );
}

export function DeliveryOptionForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action;
  defaults?: DeliveryOptionDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialStoreFormState,
  );
  const error = (name: string) => state.errors?.[name]?.[0];
  return (
    <form action={formAction} className="embedded-editor">
      <div className="form-grid">
        <Field
          label="Name"
          name="name"
          required
          maxLength={60}
          defaultValue={defaults?.name}
          error={error("name")}
          placeholder="Malé"
        />
        <Field
          label="Price (MVR)"
          name="price"
          inputMode="decimal"
          required
          defaultValue={defaults?.price}
          error={error("price")}
          placeholder="0.00"
        />
        <Field
          label="Description"
          name="description"
          maxLength={200}
          defaultValue={defaults?.description}
          error={error("description")}
        />
        <Field
          label="Position"
          name="sortOrder"
          inputMode="numeric"
          defaultValue={String(defaults?.sortOrder ?? 0)}
          error={error("sortOrder")}
        />
        <label className="check-field">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaults?.active ?? true}
          />
          <span>
            <strong>Offered at checkout</strong>
            <small>Inactive options stay on historical orders.</small>
          </span>
        </label>
      </div>
      <Footer
        state={state}
        pending={pending}
        label={submitLabel}
        icon={defaults ? "save" : "plus"}
      />
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
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} aria-invalid={Boolean(error)} {...props} />
      {error ? (
        <small className="field-error">{error}</small>
      ) : hint ? (
        <small>{hint}</small>
      ) : null}
    </label>
  );
}

function TextArea({
  label,
  name,
  error,
  ...props
}: {
  label: string;
  name: string;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        name={name}
        rows={4}
        maxLength={1000}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}

function Footer({
  state,
  pending,
  label,
  icon = "save",
}: {
  state: StoreFormState;
  pending: boolean;
  label: string;
  icon?: "save" | "plus";
}) {
  return (
    <>
      {state.message ? (
        <div className="form-message form-message--error" role="alert">
          {state.message}
        </div>
      ) : null}
      <div className="form-actions">
        <button
          className="button button--dark"
          type="submit"
          disabled={pending}
        >
          {icon === "plus" ? (
            <Plus aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {pending ? "Saving…" : label}
        </button>
      </div>
    </>
  );
}
