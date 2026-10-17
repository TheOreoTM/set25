"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, CalendarClock, Check, Save } from "lucide-react";
import {
  CONTENT_PLATFORMS,
  CONTENT_STATUSES,
  CONTENT_TYPES,
  contentPlatformLabels,
  contentStatusLabels,
  contentTypeLabels,
  type ContentPlatformValue,
  type ContentStatusValue,
  type ContentTypeValue,
} from "@set25/shared";
import {
  initialContentFormState,
  type ContentFormState,
} from "@/lib/content/validation";

type Action = (
  state: ContentFormState,
  formData: FormData,
) => Promise<ContentFormState>;

type Option = { id: string; label?: string; name?: string };

type Defaults = {
  title: string;
  platform: ContentPlatformValue;
  type: ContentTypeValue;
  status: ContentStatusValue;
  hook: string;
  caption: string;
  notes: string;
  publishAt: string;
  externalUrl: string;
  productId: string;
  ambassadorId: string;
  ownerId: string;
};

export function ContentForm({
  action,
  defaults,
  staff,
  products,
  ambassadors,
  cancelHref,
  submitLabel,
}: {
  action: Action;
  defaults?: Partial<Defaults>;
  staff: Option[];
  products: Option[];
  ambassadors: Option[];
  cancelHref: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialContentFormState,
  );
  const [status, setStatus] = useState<ContentStatusValue>(
    defaults?.status ?? "IDEA",
  );
  const error = (key: string) => state.errors?.[key]?.[0];
  const fieldError = (key: string) =>
    error(key) ? <small className="field-error">{error(key)}</small> : null;

  return (
    <form action={formAction} className="editor-form">
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Content</p>
          <h2>What and where</h2>
          <p>Plan the piece, who owns it, and when it should go out.</p>
        </div>
        <div className="form-grid">
          <label className="field field--wide">
            <span>Title</span>
            <input
              name="title"
              required
              maxLength={160}
              defaultValue={defaults?.title ?? ""}
              placeholder="e.g. Serve receive reel"
              aria-invalid={Boolean(error("title"))}
            />
            {fieldError("title")}
          </label>
          <label className="field">
            <span>Platform</span>
            <Select
              name="platform"
              defaultValue={defaults?.platform ?? "INSTAGRAM"}
            >
              {CONTENT_PLATFORMS.map((platform) => (
                <option value={platform} key={platform}>
                  {contentPlatformLabels[platform]}
                </option>
              ))}
            </Select>
          </label>
          <label className="field">
            <span>Type</span>
            <Select name="type" defaultValue={defaults?.type ?? "REEL"}>
              {CONTENT_TYPES.map((type) => (
                <option value={type} key={type}>
                  {contentTypeLabels[type]}
                </option>
              ))}
            </Select>
          </label>
          <label className="field">
            <span>Status</span>
            <Select
              name="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ContentStatusValue)
              }
            >
              {CONTENT_STATUSES.map((value) => (
                <option value={value} key={value}>
                  {contentStatusLabels[value]}
                </option>
              ))}
            </Select>
          </label>
          <label className="field">
            <span>Publish date and time</span>
            <DatePicker
              name="publishAt"
              defaultValue={defaults?.publishAt ?? ""}
              required={status === "SCHEDULED"}
              invalid={Boolean(error("publishAt"))}
              withTime
            />
            {error("publishAt") ? (
              fieldError("publishAt")
            ) : (
              <small>
                Maldives time.{" "}
                {status === "SCHEDULED" ? "Required when scheduled." : ""}
              </small>
            )}
          </label>
          <label className="field">
            <span>Owner</span>
            <Select name="ownerId" defaultValue={defaults?.ownerId ?? ""}>
              <option value="">No owner yet</option>
              {staff.map((person) => (
                <option value={person.id} key={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
            {fieldError("ownerId")}
          </label>
          <label className="field">
            <span>Product</span>
            <Select name="productId" defaultValue={defaults?.productId ?? ""}>
              <option value="">No product</option>
              {products.map((product) => (
                <option value={product.id} key={product.id}>
                  {product.label}
                </option>
              ))}
            </Select>
            {fieldError("productId")}
          </label>
          <label className="field">
            <span>Ambassador</span>
            <Select
              name="ambassadorId"
              defaultValue={defaults?.ambassadorId ?? ""}
            >
              <option value="">No ambassador</option>
              {ambassadors.map((ambassador) => (
                <option value={ambassador.id} key={ambassador.id}>
                  {ambassador.name}
                </option>
              ))}
            </Select>
            {fieldError("ambassadorId")}
          </label>
        </div>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Copy</p>
          <h2>Hook and caption</h2>
        </div>
        <label className="field">
          <span>Hook</span>
          <textarea
            name="hook"
            rows={2}
            maxLength={500}
            defaultValue={defaults?.hook ?? ""}
            placeholder="The first line or first seconds that stop the scroll"
          />
          {fieldError("hook")}
        </label>
        <label className="field">
          <span>Caption</span>
          <textarea
            name="caption"
            rows={5}
            maxLength={2200}
            defaultValue={defaults?.caption ?? ""}
          />
          {fieldError("caption")}
        </label>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Context</p>
          <h2>Notes and final link</h2>
          <p>Working assets go in Files. The link is the final public post.</p>
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea
            name="notes"
            rows={4}
            maxLength={2000}
            defaultValue={defaults?.notes ?? ""}
          />
          {fieldError("notes")}
        </label>
        <label className="field">
          <span>Post link</span>
          <input
            type="url"
            name="externalUrl"
            defaultValue={defaults?.externalUrl ?? ""}
            placeholder="https://www.instagram.com/p/…"
            aria-invalid={Boolean(error("externalUrl"))}
          />
          {fieldError("externalUrl")}
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

/**
 * Contextual status moves. Only transitions that change the status are
 * offered; Schedule asks for a time when the item has none.
 */
export function ContentStatusActions({
  action,
  current,
  hasPublishAt,
}: {
  action: Action;
  current: ContentStatusValue;
  hasPublishAt: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialContentFormState,
  );
  const [scheduling, setScheduling] = useState(false);
  const moves: { status: ContentStatusValue; label: string }[] = [];
  if (current === "IDEA")
    moves.push({ status: "CREATING", label: "Start creating" });
  if (current === "IDEA" || current === "CREATING")
    moves.push({ status: "READY", label: "Mark ready" });
  if (current === "SCHEDULED")
    moves.push({ status: "READY", label: "Unschedule" });
  if (current === "CANCELLED") moves.push({ status: "IDEA", label: "Restore" });
  const canSchedule = !["SCHEDULED", "POSTED", "CANCELLED"].includes(current);
  const canPost = current !== "POSTED" && current !== "CANCELLED";

  if (scheduling)
    return (
      <form action={formAction} className="content-schedule-form">
        <input type="hidden" name="status" value="SCHEDULED" />
        <label className="field">
          <span>Publish at (Maldives time)</span>
          <DatePicker name="publishAt" required withTime />
        </label>
        <button
          className="button button--dark"
          type="submit"
          disabled={pending}
        >
          <CalendarClock aria-hidden="true" />{" "}
          {pending ? "Saving…" : "Schedule"}
        </button>
        <button
          className="text-link"
          type="button"
          onClick={() => setScheduling(false)}
        >
          Cancel
        </button>
        {state.message ? (
          <small className="field-error" role="alert">
            {state.message}
          </small>
        ) : null}
      </form>
    );

  return (
    <div className="content-status-actions">
      {moves.map((move) => (
        <form action={formAction} key={move.status}>
          <input type="hidden" name="status" value={move.status} />
          <button
            className="button button--secondary"
            type="submit"
            disabled={pending}
          >
            {move.label}
          </button>
        </form>
      ))}
      {canSchedule ? (
        hasPublishAt ? (
          <form action={formAction}>
            <input type="hidden" name="status" value="SCHEDULED" />
            <button
              className="button button--secondary"
              type="submit"
              disabled={pending}
            >
              <CalendarClock aria-hidden="true" /> Schedule
            </button>
          </form>
        ) : (
          <button
            className="button button--secondary"
            type="button"
            onClick={() => setScheduling(true)}
          >
            <CalendarClock aria-hidden="true" /> Schedule
          </button>
        )
      ) : null}
      {canPost ? (
        <form action={formAction}>
          <input type="hidden" name="status" value="POSTED" />
          <button
            className="button button--dark"
            type="submit"
            disabled={pending}
          >
            <Check aria-hidden="true" /> Mark posted
          </button>
        </form>
      ) : null}
      {canPost ? (
        <form action={formAction}>
          <input type="hidden" name="status" value="CANCELLED" />
          <button className="text-link" type="submit" disabled={pending}>
            Cancel content
          </button>
        </form>
      ) : null}
      {state.message ? (
        <small className="field-error" role="alert">
          {state.message}
        </small>
      ) : null}
    </div>
  );
}
