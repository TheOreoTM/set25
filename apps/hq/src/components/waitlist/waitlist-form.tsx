"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronDown, Plus, Save } from "lucide-react";
import {
  PRODUCT_CATEGORIES,
  WAITLIST_SIZES,
  WAITLIST_SOURCES,
  WAITLIST_STATUSES,
  productCategoryLabels,
  waitlistSourceLabels,
  waitlistStatusLabels,
  type ProductCategoryValue,
  type WaitlistSourceValue,
  type WaitlistStatusValue,
} from "@set25/shared";
import {
  initialWaitlistFormState,
  type WaitlistFormState,
} from "@/lib/waitlist/validation";
import { useFormAction } from "@/components/ui/use-form-action";
import { CopyDmButton, OpenDmLink } from "./waitlist-controls";

type Action = (
  state: WaitlistFormState,
  formData: FormData,
) => Promise<WaitlistFormState>;

type Defaults = {
  instagramHandle: string;
  tiktokHandle: string;
  name: string;
  phone: string;
  source: WaitlistSourceValue;
  status: WaitlistStatusValue;
  interestedCategories: ProductCategoryValue[];
  sizes: string[];
  earlyBird: boolean;
  earlyBirdCode: string;
  notes: string;
};

function ChipGroup({
  legend,
  name,
  type,
  options,
  checked,
  error,
}: {
  legend: string;
  name: string;
  type: "checkbox" | "radio";
  options: readonly { value: string; label: string }[];
  checked: (value: string) => boolean;
  error?: string;
}) {
  return (
    <fieldset className="chip-group">
      <legend>{legend}</legend>
      <div className="chips">
        {options.map((option) => (
          <label className="chip" key={option.value}>
            <input
              type={type}
              name={name}
              value={option.value}
              defaultChecked={checked(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? <small className="field-error">{error}</small> : null}
    </fieldset>
  );
}

const sourceOptions = WAITLIST_SOURCES.map((value) => ({
  value,
  label: waitlistSourceLabels[value],
}));
const productOptions = PRODUCT_CATEGORIES.map((value) => ({
  value,
  label: productCategoryLabels[value],
}));
const sizeOptions = WAITLIST_SIZES.map((value) => ({ value, label: value }));
const statusOptions = WAITLIST_STATUSES.map((value) => ({
  value,
  label: waitlistStatusLabels[value],
}));

function TextField({
  name,
  label,
  defaultValue,
  error,
  hint,
  ...props
}: {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? (
        <small className="field-error">{error}</small>
      ) : hint ? (
        <small>{hint}</small>
      ) : null}
    </label>
  );
}

const handleInputProps = {
  autoCapitalize: "none",
  autoCorrect: "off",
  autoComplete: "off",
  spellCheck: false,
  maxLength: 80,
  placeholder: "@handle",
} as const;

/** Fast, one-thumb capture: handle, a few taps, add. Everything else optional. */
export function WaitlistQuickAdd({ action }: { action: Action }) {
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialWaitlistFormState,
    { resetOnSuccess: true },
  );
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <section className="waitlist-quick-add" aria-labelledby="quick-add-title">
      <div className="waitlist-quick-add-head">
        <p className="kicker">Quick add</p>
        <h2 id="quick-add-title">Add to waitlist</h2>
      </div>
      <form ref={formRef} onSubmit={onSubmit} noValidate>
        <TextField
          name="handle"
          label="Handle"
          error={
            error("handle") ??
            error("instagramHandle") ??
            error("tiktokHandle")
          }
          hint="Instagram, or TikTok when the source is TikTok."
          enterKeyHint="done"
          {...handleInputProps}
        />
        <ChipGroup
          legend="Source"
          name="source"
          type="radio"
          options={sourceOptions}
          checked={(value) => value === "INSTAGRAM_DM"}
          error={error("source")}
        />
        <button
          className="waitlist-more-toggle"
          type="button"
          aria-expanded={moreOpen}
          aria-controls="quick-add-interest quick-add-more"
          onClick={() => setMoreOpen(!moreOpen)}
        >
          <ChevronDown aria-hidden="true" />
          {moreOpen ? (
            "Fewer details"
          ) : (
            <>
              <span className="waitlist-more-label--wide">
                Name, phone, code, notes
              </span>
              <span className="waitlist-more-label--phone">More details</span>
            </>
          )}
        </button>
        {/* Interest stays visible on wider screens; phones keep it behind
            the details toggle so the list starts within the first screen. */}
        <div
          className="waitlist-interest"
          id="quick-add-interest"
          data-open={moreOpen || undefined}
        >
          <ChipGroup
            legend="Interested in"
            name="interestedCategories"
            type="checkbox"
            options={productOptions}
            checked={() => false}
            error={error("interestedCategories")}
          />
          <ChipGroup
            legend="Sizes"
            name="sizes"
            type="checkbox"
            options={sizeOptions}
            checked={() => false}
            error={error("sizes")}
          />
          <fieldset className="chip-group">
            <legend>Early Bird</legend>
            <label className="chip chip--toggle">
              <input type="checkbox" name="earlyBird" />
              <span>Early Bird</span>
            </label>
          </fieldset>
        </div>
        <div className="waitlist-more" id="quick-add-more" hidden={!moreOpen}>
          <TextField
            name="name"
            label="Name"
            maxLength={120}
            autoComplete="off"
            error={error("name")}
            hint="Needed only if there is no handle."
          />
          <TextField
            name="phone"
            label="Phone (optional)"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            error={error("phone")}
          />
          <TextField
            name="earlyBirdCode"
            label="Early Bird code"
            maxLength={30}
            autoCapitalize="characters"
            autoComplete="off"
            error={error("earlyBirdCode")}
            hint="Saved in capitals. A code marks them as Early Bird."
          />
          <label className="field waitlist-more-notes">
            <span>Notes</span>
            <textarea name="notes" rows={3} maxLength={2000} />
            {error("notes") ? (
              <small className="field-error">{error("notes")}</small>
            ) : null}
          </label>
        </div>
        {state.status === "error" ? (
          <div className="form-message form-message--error" role="alert">
            {state.message}
            {state.existingId ? (
              <>
                {" "}
                <Link href={`/waitlist/${state.existingId}`}>Open entry</Link>
              </>
            ) : null}
          </div>
        ) : null}
        {state.status === "success" && state.added ? (
          <div
            className="form-message form-message--success waitlist-added"
            role="status"
          >
            <span>
              {state.message}{" "}
              <Link href={`/waitlist/${state.added.id}`}>View</Link>
            </span>
            <span className="waitlist-actions">
              <CopyDmButton message={state.added.message} />
              {state.added.contact ? (
                <OpenDmLink
                  contact={state.added.contact}
                  message={state.added.message}
                />
              ) : null}
            </span>
          </div>
        ) : null}
        <button
          className="button button--dark waitlist-submit"
          type="submit"
          disabled={pending}
        >
          <Plus aria-hidden="true" /> {pending ? "Adding…" : "Add to waitlist"}
        </button>
      </form>
    </section>
  );
}

export function WaitlistForm({
  action,
  defaults,
  cancelHref,
}: {
  action: Action;
  defaults: Defaults;
  cancelHref: string;
}) {
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialWaitlistFormState,
  );
  return (
    <form ref={formRef} onSubmit={onSubmit} className="editor-form" noValidate>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Person</p>
          <h2>Who and where from</h2>
          <p>
            Contact stays in Instagram or TikTok DMs. A phone number is
            optional.
          </p>
        </div>
        <div className="form-stack">
          <div className="form-grid">
            <TextField
              name="instagramHandle"
              label="Instagram handle"
              defaultValue={defaults.instagramHandle}
              error={error("instagramHandle")}
              {...handleInputProps}
            />
            <TextField
              name="tiktokHandle"
              label="TikTok handle"
              defaultValue={defaults.tiktokHandle}
              error={error("tiktokHandle")}
              {...handleInputProps}
            />
            <TextField
              name="name"
              label="Name"
              defaultValue={defaults.name}
              maxLength={120}
              error={error("name")}
            />
            <TextField
              name="phone"
              label="Phone (optional)"
              type="tel"
              inputMode="tel"
              defaultValue={defaults.phone}
              error={error("phone")}
            />
          </div>
          <ChipGroup
            legend="Source"
            name="source"
            type="radio"
            options={sourceOptions}
            checked={(value) => value === defaults.source}
            error={error("source")}
          />
        </div>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Interest</p>
          <h2>Products and sizes</h2>
        </div>
        <div className="form-stack">
          <ChipGroup
            legend="Interested in"
            name="interestedCategories"
            type="checkbox"
            options={productOptions}
            checked={(value) =>
              defaults.interestedCategories.includes(
                value as ProductCategoryValue,
              )
            }
            error={error("interestedCategories")}
          />
          <ChipGroup
            legend="Sizes"
            name="sizes"
            type="checkbox"
            options={sizeOptions}
            checked={(value) => defaults.sizes.includes(value)}
            error={error("sizes")}
          />
        </div>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Pipeline</p>
          <h2>Status and Early Bird</h2>
        </div>
        <div className="form-stack">
          <ChipGroup
            legend="Status"
            name="status"
            type="radio"
            options={statusOptions}
            checked={(value) => value === defaults.status}
            error={error("status")}
          />
          <div className="form-grid">
            <fieldset className="chip-group">
              <legend>Early Bird</legend>
              <label className="chip chip--toggle">
                <input
                  type="checkbox"
                  name="earlyBird"
                  defaultChecked={defaults.earlyBird}
                />
                <span>Early Bird</span>
              </label>
            </fieldset>
            <TextField
              name="earlyBirdCode"
              label="Early Bird code"
              defaultValue={defaults.earlyBirdCode}
              maxLength={30}
              autoCapitalize="characters"
              error={error("earlyBirdCode")}
              hint="Saved in capitals and must be unique."
            />
          </div>
          <label className="field">
            <span>Notes</span>
            <textarea
              name="notes"
              rows={4}
              maxLength={2000}
              defaultValue={defaults.notes}
            />
            {error("notes") ? (
              <small className="field-error">{error("notes")}</small>
            ) : null}
          </label>
        </div>
      </section>
      {state.status === "error" ? (
        <div className="form-message form-message--error" role="alert">
          {state.message}
          {state.existingId ? (
            <>
              {" "}
              <Link href={`/waitlist/${state.existingId}`}>Open entry</Link>
            </>
          ) : null}
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
          <Save aria-hidden="true" /> {pending ? "Saving…" : "Save entry"}
        </button>
      </div>
    </form>
  );
}
