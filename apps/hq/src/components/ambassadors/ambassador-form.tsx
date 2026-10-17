"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Gift, Save, X } from "lucide-react";
import {
  AMBASSADOR_STATUSES,
  ambassadorStatusLabels,
  type AmbassadorStatusValue,
} from "@set25/shared";
import {
  initialAmbassadorFormState,
  type AmbassadorFormState,
} from "@/lib/ambassadors/validation";

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
  const [state, formAction, pending] = useActionState(
    action,
    initialAmbassadorFormState,
  );
  const error = (key: string) => state.errors?.[key]?.[0];
  const input = (
    name: keyof Defaults,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
    hint?: string,
  ) => (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        defaultValue={defaults?.[name] ?? ""}
        aria-invalid={Boolean(error(name))}
        {...props}
      />
      {error(name) ? (
        <small className="field-error">{error(name)}</small>
      ) : hint ? (
        <small>{hint}</small>
      ) : null}
    </label>
  );

  return (
    <form action={formAction} className="editor-form">
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
            <Select name="status" defaultValue={defaults?.status ?? "PROSPECT"}>
              {AMBASSADOR_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {ambassadorStatusLabels[status]}
                </option>
              ))}
            </Select>
          </label>
          {input("team", "Team / club", { maxLength: 120 })}
          {input("position", "Position", {
            maxLength: 60,
            placeholder: "e.g. Setter",
          })}
          {input("instagramHandle", "Instagram", {
            maxLength: 31,
            placeholder: "@handle",
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
          {input(
            "discountCode",
            "Discount code",
            { maxLength: 30, placeholder: "e.g. AHMED10" },
            "Saved in capitals and must be unique.",
          )}
          {input("discountPercent", "Discount %", {
            inputMode: "decimal",
            placeholder: "10",
          })}
          {input("commissionPercent", "Commission %", {
            inputMode: "decimal",
            placeholder: "5",
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
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Context</p>
          <h2>Notes</h2>
        </div>
        <label className="field">
          <span>Relationship notes</span>
          <textarea
            name="notes"
            rows={5}
            maxLength={2000}
            defaultValue={defaults?.notes ?? ""}
          />
          {error("notes") ? (
            <small className="field-error">{error("notes")}</small>
          ) : null}
        </label>
      </section>
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
  const [state, formAction, pending] = useActionState(
    action,
    initialAmbassadorFormState,
  );
  const error = (key: string) => state.errors?.[key]?.[0];
  const groups = variants.reduce(
    (map, variant) =>
      map.set(variant.group, [...(map.get(variant.group) ?? []), variant]),
    new Map<string, GiveableVariant[]>(),
  );
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
        <div className="dialog-backdrop" role="presentation">
          <section
            className="dialog-panel supply-editor-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="give-product-title"
          >
            <div className="dialog-head">
              <div>
                <p className="kicker">Giveaway · Inventory</p>
                <h2 id="give-product-title">Give product</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            {variants.length ? (
              <form action={formAction} className="dialog-body">
                <input
                  type="hidden"
                  name="idempotencyKey"
                  value={submissionKey}
                />
                <label className="field">
                  <span>Product</span>
                  <Select name="variantId" required defaultValue="">
                    <option value="" disabled>
                      Choose a variant in stock
                    </option>
                    {[...groups.entries()].map(([group, options]) => (
                      <optgroup label={group} key={group}>
                        {options.map((variant) => (
                          <option value={variant.id} key={variant.id}>
                            {variant.label} · {variant.sku} ·{" "}
                            {variant.stockOnHand} in stock
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                  {error("variantId") ? (
                    <small className="field-error">{error("variantId")}</small>
                  ) : null}
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
                    />
                    {error("quantity") ? (
                      <small className="field-error">{error("quantity")}</small>
                    ) : null}
                  </label>
                  <label className="field">
                    <span>Given on</span>
                    <DatePicker name="givenAt" defaultValue={today} required />
                  </label>
                </div>
                <label className="field">
                  <span>Notes</span>
                  <input
                    name="notes"
                    maxLength={500}
                    placeholder="Optional, e.g. launch kit"
                  />
                </label>
                <small className="dialog-note">
                  Stock is deducted once and recorded as a Giveaway movement.
                </small>
                {state.message ? (
                  <div
                    className="form-message form-message--error"
                    role="alert"
                  >
                    {state.message}
                  </div>
                ) : null}
                <div className="dialog-actions">
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => setOpen(false)}
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
          </section>
        </div>
      ) : null}
    </>
  );
}
