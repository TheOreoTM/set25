"use client";

import { Select } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { TEAM_TYPES, teamTypeLabels, type TeamTypeValue } from "@set25/shared";
import {
  initialCommerceFormState,
  type CommerceFormState,
} from "@/lib/commerce/validation";
import { useFormAction } from "@/components/ui/use-form-action";
import { Field, NotesSection } from "@/components/ui/form-fields";

type CustomerDefaults = {
  name?: string;
  phone?: string;
  email?: string | null;
  instagramHandle?: string | null;
  notes?: string | null;
};

type TeamDefaults = {
  name?: string;
  type?: TeamTypeValue;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
};

export function CustomerForm({
  action,
  defaults = {},
  cancelHref,
  submitLabel,
}: {
  action: (
    state: CommerceFormState,
    formData: FormData,
  ) => Promise<CommerceFormState>;
  defaults?: CustomerDefaults;
  cancelHref: string;
  submitLabel: string;
}) {
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialCommerceFormState,
  );
  return (
    <form ref={formRef} onSubmit={onSubmit} className="editor-form">
      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Customer</p>
          <h2>Contact details</h2>
          <p>
            Phone is the primary contact point; everything else can be added
            when known.
          </p>
        </div>
        <div className="form-grid">
          <Field
            label="Name"
            name="name"
            required
            defaultValue={defaults.name}
            error={error("name")}
          />
          <Field
            label="Phone"
            name="phone"
            required
            defaultValue={defaults.phone}
            error={error("phone")}
            inputMode="tel"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={defaults.email ?? ""}
            error={error("email")}
          />
          <Field
            label="Instagram"
            name="instagramHandle"
            defaultValue={defaults.instagramHandle ?? ""}
            error={error("instagramHandle")}
            placeholder="username"
            prefix="@"
          />
        </div>
      </div>
      <NotesSection defaultValue={defaults.notes} error={error("notes")} />
      <FormFooter
        state={state}
        pending={pending}
        cancelHref={cancelHref}
        submitLabel={submitLabel}
      />
    </form>
  );
}

export function TeamForm({
  action,
  defaults = {},
  cancelHref,
  submitLabel,
}: {
  action: (
    state: CommerceFormState,
    formData: FormData,
  ) => Promise<CommerceFormState>;
  defaults?: TeamDefaults;
  cancelHref: string;
  submitLabel: string;
}) {
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialCommerceFormState,
  );
  return (
    <form ref={formRef} onSubmit={onSubmit} className="editor-form">
      <div className="form-section">
        <div className="form-section-title">
          <p className="kicker">Team</p>
          <h2>Organisation details</h2>
          <p>
            A team can be attached to an order alongside the individual customer
            contact.
          </p>
        </div>
        <div className="form-grid">
          <Field
            label="Team name"
            name="name"
            required
            defaultValue={defaults.name}
            error={error("name")}
          />
          <label className="field">
            <span>Team type</span>
            <Select
              name="type"
              defaultValue={defaults.type ?? "OTHER"}
              aria-invalid={Boolean(error("type"))}
            >
              {TEAM_TYPES.map((type) => (
                <option value={type} key={type}>
                  {teamTypeLabels[type]}
                </option>
              ))}
            </Select>
            {error("type") ? (
              <small className="field-error">{error("type")}</small>
            ) : null}
          </label>
          <Field
            label="Contact name"
            name="contactName"
            defaultValue={defaults.contactName ?? ""}
            error={error("contactName")}
          />
          <Field
            label="Phone"
            name="phone"
            defaultValue={defaults.phone ?? ""}
            error={error("phone")}
            inputMode="tel"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={defaults.email ?? ""}
            error={error("email")}
          />
        </div>
      </div>
      <NotesSection defaultValue={defaults.notes} error={error("notes")} />
      <FormFooter
        state={state}
        pending={pending}
        cancelHref={cancelHref}
        submitLabel={submitLabel}
      />
    </form>
  );
}

function FormFooter({
  state,
  pending,
  cancelHref,
  submitLabel,
}: {
  state: CommerceFormState;
  pending: boolean;
  cancelHref: string;
  submitLabel: string;
}) {
  return (
    <>
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
    </>
  );
}
