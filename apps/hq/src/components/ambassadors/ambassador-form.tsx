"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Gift, Save } from "lucide-react";
import {
  AMBASSADOR_STATUSES,
  ambassadorStatusLabels,
  type AmbassadorStatusValue,
} from "@set25/shared";
import {
  initialAmbassadorFormState,
  type AmbassadorFormState,
} from "@/lib/ambassadors/validation";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { useFormAction } from "@/components/ui/use-form-action";
import {
  Field,
  NotesSection,
  type FieldProps,
} from "@/components/ui/form-fields";

type Action = (
  state: AmbassadorFormState,
  formData: FormData,
) => Promise<AmbassadorFormState>;

type Defaults = {
  name: string;
  team: string;
  position: string;
  instagramHandle: string;
  phone: string;
  email: string;
  status: AmbassadorStatusValue;
  discountCode: string;
  discountPercent: string;
  commissionPercent: string;
  startedAt: string;
  endedAt: string;
  notes: string;
};

export function AmbassadorForm({
  action,
  defaults,
  cancelHref,
  submitLabel,
}: {
  action: Action;
  defaults?: Defaults;
  cancelHref: string;
  submitLabel: string;
}) {
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialAmbassadorFormState,
  );
  const input = (
    name: keyof Defaults,
    label: string,
    props: Omit<FieldProps, "label" | "name"> = {},
  ) => (
    <Field
      label={label}
      name={name}
      defaultValue={defaults?.[name] ?? ""}
      error={error(name)}
      {...props}
    />
  );

  return (
    <form ref={formRef} onSubmit={onSubmit} className="editor-form">
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Ambassador</p>
          <h2>Player and contact</h2>
          <p>Who represents SET25, where they play, and how to reach them.</p>
        </div>
        <div className="form-grid">
          {input("name", "Name", { required: true, maxLength: 120 })}
          <label className="field">
            <span>Status</span>
            <Select
              name="status"
              defaultValue={defaults?.status ?? "PROSPECT"}
              aria-invalid={Boolean(error("status"))}
            >
              {AMBASSADOR_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {ambassadorStatusLabels[status]}
                </option>
              ))}
            </Select>
            {error("status") ? (
              <small className="field-error">{error("status")}</small>
            ) : null}
          </label>
          {input("team", "Team / club", { maxLength: 120 })}
          {input("position", "Position", {
            maxLength: 60,
            placeholder: "e.g. Setter",
          })}
          {input("instagramHandle", "Instagram", {
            maxLength: 31,
            placeholder: "username",
            prefix: "@",
          })}
          {input("phone", "Phone", { maxLength: 40 })}
          {input("email", "Email", { type: "email" })}
        </div>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Terms</p>
          <h2>Discount and commission</h2>
          <p>
            Reference terms only. Store redemption and commission payouts are
            not automated yet.
          </p>
        </div>
        <div className="form-grid">
          {input("discountCode", "Discount code", {
            maxLength: 30,
            placeholder: "e.g. AHMED10",
            hint: "Saved in capitals and must be unique.",
            wide: true,
          })}
          {input("discountPercent", "Discount %", {
            inputMode: "decimal",
            placeholder: "e.g. 10",
          })}
          {input("commissionPercent", "Commission %", {
            inputMode: "decimal",
            placeholder: "e.g. 5",
          })}
          {(["startedAt", "endedAt"] as const).map((name) => (
            <label className="field" key={name}>
              <span>{name === "startedAt" ? "Started" : "Ended"}</span>
              <DatePicker
                name={name}
                defaultValue={defaults?.[name] ?? ""}
                invalid={Boolean(error(name))}
              />
              {error(name) ? (
                <small className="field-error">{error(name)}</small>
              ) : null}
            </label>
          ))}
        </div>
      </section>
      <NotesSection defaultValue={defaults?.notes} error={error("notes")} />
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

export type GiveableVariant = {
  id: string;
  group: string;
  label: string;
  sku: string;
  stockOnHand: number;
};

export function GiveProductDialog({
  action,
  variants,
  submissionKey,
  today,
}: {
  action: Action;
  variants: GiveableVariant[];
  submissionKey: string;
  today: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="button button--dark"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Gift aria-hidden="true" /> Give product
      </button>
      {open ? (
        <GiveProductForm
          action={action}
          variants={variants}
          submissionKey={submissionKey}
          today={today}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function GiveProductForm({
  action,
  variants,
  submissionKey,
  today,
  onClose,
}: {
  action: Action;
  variants: GiveableVariant[];
  submissionKey: string;
  today: string;
  onClose: () => void;
}) {
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialAmbassadorFormState,
  );
  const groups = variants.reduce(
    (map, variant) =>
      map.set(variant.group, [...(map.get(variant.group) ?? []), variant]),
    new Map<string, GiveableVariant[]>(),
  );
  const fieldError = (key: string) =>
    error(key) ? <small className="field-error">{error(key)}</small> : null;
  return (
    <ModalDialog
      titleId="give-product-title"
      kicker="Giveaway · Inventory"
      title="Give product"
      onClose={onClose}
      busy={pending}
      className="supply-editor-dialog"
    >
      {variants.length ? (
        <form ref={formRef} onSubmit={onSubmit}>
          <input type="hidden" name="idempotencyKey" value={submissionKey} />
          <div className="dialog-body">
            <label className="field">
              <span>Product</span>
              <Select
                name="variantId"
                required
                defaultValue=""
                aria-invalid={Boolean(error("variantId"))}
              >
                <option value="" disabled>
                  Choose a variant in stock
                </option>
                {[...groups.entries()].map(([group, options]) => (
                  <optgroup label={group} key={group}>
                    {options.map((variant) => (
                      <option value={variant.id} key={variant.id}>
                        {variant.label} · {variant.sku} · {variant.stockOnHand}{" "}
                        in stock
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              {fieldError("variantId")}
            </label>
            <div className="form-grid form-grid--dialog">
              <label className="field">
                <span>Quantity</span>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={1}
                  required
                  aria-invalid={Boolean(error("quantity"))}
                />
                {fieldError("quantity")}
              </label>
              <label className="field">
                <span>Given on</span>
                <DatePicker
                  name="givenAt"
                  defaultValue={today}
                  required
                  invalid={Boolean(error("givenAt"))}
                />
                {fieldError("givenAt")}
              </label>
            </div>
            <label className="field">
              <span>Notes</span>
              <input
                name="notes"
                maxLength={500}
                placeholder="Optional, e.g. launch kit"
                aria-invalid={Boolean(error("notes"))}
              />
              {fieldError("notes")}
            </label>
            <small className="dialog-note">
              Stock is deducted once and recorded as a Giveaway movement.
            </small>
            {state.message ? (
              <div className="form-message form-message--error" role="alert">
                {state.message}
              </div>
            ) : null}
          </div>
          <div className="dialog-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              className="button button--dark"
              type="submit"
              disabled={pending}
            >
              {pending ? "Recording once…" : "Give product"}
            </button>
          </div>
        </form>
      ) : (
        <div className="dialog-body">
          <p>No active product variants are in stock right now.</p>
        </div>
      )}
    </ModalDialog>
  );
}
