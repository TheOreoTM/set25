"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useActionState, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import {
  fileAccessLevelLabels,
  type FileAccessLevelValue,
  type FileRetentionPolicyValue,
} from "@set25/shared";
import {
  initialFileFormState,
  type FileFormState,
} from "@/lib/files/validation";

type Action = (
  state: FileFormState,
  formData: FormData,
) => Promise<FileFormState>;

/** Two-step delete so a stray click cannot remove a file. */
export function FileDeleteButton({
  action,
  returnTo,
  label = "Delete",
}: {
  action: Action;
  returnTo?: string;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(
    action,
    initialFileFormState,
  );
  if (!confirming)
    return (
      <button
        className="text-link file-delete-link"
        type="button"
        onClick={() => setConfirming(true)}
      >
        <Trash2 aria-hidden="true" /> {label}
      </button>
    );
  return (
    <form action={formAction} className="file-delete-confirm">
      {returnTo ? (
        <input type="hidden" name="returnTo" value={returnTo} />
      ) : null}
      <button className="button button--dark" type="submit" disabled={pending}>
        {pending ? "Deleting…" : "Confirm delete"}
      </button>
      <button
        className="text-link"
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
      >
        Keep
      </button>
      {state.status === "error" ? (
        <small className="field-error" role="alert">
          {state.message}
        </small>
      ) : null}
    </form>
  );
}

export function FileDetailsEditor({
  action,
  accessLevels,
  defaults,
}: {
  action: Action;
  accessLevels: FileAccessLevelValue[];
  defaults: {
    accessLevel: FileAccessLevelValue;
    retentionPolicy: FileRetentionPolicyValue;
    retentionUntil: string;
    description: string;
  };
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialFileFormState,
  );
  const [retention, setRetention] = useState(defaults.retentionPolicy);
  const error = (key: string) => state.errors?.[key]?.[0];
  return (
    <form action={formAction} className="file-details-form">
      <div className="form-grid form-grid--dialog">
        <label className="field">
          <span>Access</span>
          <Select name="accessLevel" defaultValue={defaults.accessLevel}>
            {accessLevels.map((level) => (
              <option value={level} key={level}>
                {fileAccessLevelLabels[level]}
              </option>
            ))}
          </Select>
          {error("accessLevel") ? (
            <small className="field-error">{error("accessLevel")}</small>
          ) : null}
        </label>
        <label className="field">
          <span>Retention</span>
          <Select
            name="retentionPolicy"
            value={retention}
            onChange={(event) =>
              setRetention(event.target.value as FileRetentionPolicyValue)
            }
          >
            <option value="PERMANENT">Permanent</option>
            <option value="UNTIL_DATE">Until date</option>
          </Select>
        </label>
        {retention === "UNTIL_DATE" ? (
          <label className="field">
            <span>Expires on</span>
            <DatePicker
              name="retentionUntil"
              defaultValue={defaults.retentionUntil}
              required
            />
            {error("retentionUntil") ? (
              <small className="field-error">{error("retentionUntil")}</small>
            ) : null}
          </label>
        ) : null}
      </div>
      <label className="field">
        <span>Note</span>
        <input
          name="description"
          maxLength={500}
          defaultValue={defaults.description}
        />
        {error("description") ? (
          <small className="field-error">{error("description")}</small>
        ) : null}
      </label>
      {state.message ? (
        <div
          className={`form-message form-message--${state.status === "success" ? "success" : "error"}`}
          role={state.status === "success" ? "status" : "alert"}
        >
          {state.message}
        </div>
      ) : null}
      <button className="button button--dark" type="submit" disabled={pending}>
        <Save aria-hidden="true" /> {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}
