"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FileText, Save, Trash2 } from "lucide-react";
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

/**
 * Two-step delete: the trigger opens a small confirmation anchored to it (top
 * layer, so the surrounding row or panel never changes layout).
 */
export function FileDeleteButton({
  action,
  fileName,
  returnTo,
  variant = "icon",
}: {
  action: Action;
  fileName: string;
  returnTo?: string;
  /** "icon" for compact file rows, "button" for the file detail page. */
  variant?: "icon" | "button";
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    action,
    initialFileFormState,
  );

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    const rect = trigger.getBoundingClientRect();
    const width = popover.offsetWidth;
    const height = popover.offsetHeight;
    const below = rect.bottom + 6;
    const top =
      below + height > window.innerHeight - 8 && rect.top - height - 6 > 8
        ? rect.top - height - 6
        : below;
    // Right-align to the trigger, kept on screen.
    const left = Math.max(
      8,
      Math.min(rect.right - width, window.innerWidth - width - 8),
    );
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }, []);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    const onToggle = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === "open";
      setOpen(isOpen);
      if (!isOpen) triggerRef.current?.focus({ preventScroll: true });
    };
    popover.addEventListener("toggle", onToggle);
    return () => popover.removeEventListener("toggle", onToggle);
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  const toggle = () =>
    open
      ? popoverRef.current?.hidePopover()
      : popoverRef.current?.showPopover();

  return (
    <>
      {variant === "icon" ? (
        <button
          ref={triggerRef}
          className="icon-button file-delete-trigger"
          type="button"
          aria-label={`Delete ${fileName}`}
          aria-expanded={open}
          title="Delete"
          onClick={toggle}
        >
          <Trash2 aria-hidden="true" />
        </button>
      ) : (
        <button
          ref={triggerRef}
          className="button button--danger file-delete-trigger--button"
          type="button"
          aria-expanded={open}
          onClick={toggle}
        >
          <Trash2 aria-hidden="true" /> Delete file
        </button>
      )}
      <div
        ref={popoverRef}
        popover="auto"
        role="dialog"
        aria-label={`Delete ${fileName}`}
        className="file-delete-popover"
      >
        <form action={formAction}>
          {returnTo ? (
            <input type="hidden" name="returnTo" value={returnTo} />
          ) : null}
          <div className="file-delete-body">
            <p className="kicker">Private file</p>
            <h3>Delete file</h3>
            <div className="file-delete-target">
              <FileText aria-hidden="true" />
              <span>{fileName}</span>
            </div>
            <p className="file-delete-copy">
              Removed from private storage. The record stays for audit.
            </p>
            {state.status === "error" ? (
              <small className="field-error" role="alert">
                {state.message}
              </small>
            ) : null}
          </div>
          <div className="file-delete-actions">
            <button
              className="button button--secondary"
              type="button"
              onClick={() => popoverRef.current?.hidePopover()}
              disabled={pending}
            >
              Keep
            </button>
            <button
              className="button button--danger-solid"
              type="submit"
              disabled={pending}
            >
              <Trash2 aria-hidden="true" />
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </form>
      </div>
    </>
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
