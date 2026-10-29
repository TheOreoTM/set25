"use client";

import { useActionState, useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";
import {
  WAITLIST_STATUSES,
  waitlistStatusLabels,
  type WaitlistStatusValue,
} from "@set25/shared";
import {
  instagramDmUrl,
  instagramProfileUrl,
  nextWaitlistStatus,
  tiktokProfileUrl,
  waitlistPlatformLabels,
  waitlistStatusActionLabels,
} from "@/lib/waitlist/presentation";
import {
  initialWaitlistFormState,
  type WaitlistContact,
  type WaitlistFormState,
} from "@/lib/waitlist/validation";

type StatusAction = (
  state: WaitlistFormState,
  formData: FormData,
) => Promise<WaitlistFormState>;

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Clipboard access can be blocked (older in-app browsers, insecure
    // origins). A prompt still lets the person long-press and copy.
    window.prompt("Copy this message", value);
    return false;
  }
}

function useCopied() {
  const [copied, setCopied] = useState(false);
  const copy = async (message: string) => {
    if (await copyText(message)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };
  return [copied, copy] as const;
}

export function CopyDmButton({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  const [copied, copy] = useCopied();
  return (
    <button
      className="button button--secondary waitlist-action"
      type="button"
      onClick={() => copy(message)}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span className={compact ? "sr-only" : undefined}>
        {copied ? "Copied" : "Copy DM"}
      </span>
      <span className="sr-only" role="status">
        {copied ? "Message copied" : ""}
      </span>
    </button>
  );
}

/**
 * Copies the message, then opens the conversation so it can be pasted straight
 * in: one tap from the waitlist to a ready reply. Instagram opens the DM
 * thread; TikTok has no DM link, so it opens the profile and its Message
 * button.
 */
export function OpenDmLink({
  contact,
  message,
  compact = false,
}: {
  contact: WaitlistContact;
  message: string;
  compact?: boolean;
}) {
  const tiktok = contact.platform === "tiktok";
  return (
    <a
      className="button button--dark waitlist-action"
      href={
        tiktok
          ? tiktokProfileUrl(contact.handle)
          : instagramDmUrl(contact.handle)
      }
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => void copyText(message)}
    >
      <MessageCircle aria-hidden="true" />
      <span className={compact ? "sr-only" : undefined}>
        {tiktok ? "Copy & open TikTok" : "Copy & open DM"}
      </span>
      {compact ? (
        <span className="sr-only">
          with @{contact.handle} on {waitlistPlatformLabels[contact.platform]}{" "}
          (copies the message)
        </span>
      ) : null}
    </a>
  );
}

export function ProfileLink({ contact }: { contact: WaitlistContact }) {
  return (
    <a
      className="button button--secondary waitlist-action"
      href={
        contact.platform === "tiktok"
          ? tiktokProfileUrl(contact.handle)
          : instagramProfileUrl(contact.handle)
      }
      target="_blank"
      rel="noopener noreferrer"
    >
      <ExternalLink aria-hidden="true" />{" "}
      {waitlistPlatformLabels[contact.platform]} profile
    </a>
  );
}

/** One-tap move to the next pipeline step. */
export function NextStatusButton({
  action,
  status,
}: {
  action: StatusAction;
  status: WaitlistStatusValue;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialWaitlistFormState,
  );
  const next = nextWaitlistStatus[status];
  if (!next) return null;
  return (
    <form action={formAction} className="waitlist-next">
      <input type="hidden" name="status" value={next} />
      <button
        className="button button--secondary waitlist-action"
        type="submit"
        disabled={pending}
      >
        <Check aria-hidden="true" />
        {pending ? "Saving…" : waitlistStatusActionLabels[next]}
      </button>
      {state.status === "error" ? (
        <small className="field-error" role="alert">
          {state.message}
        </small>
      ) : null}
    </form>
  );
}

/** Every status as a large segmented control, for the entry page. */
export function StatusPicker({
  action,
  status,
}: {
  action: StatusAction;
  status: WaitlistStatusValue;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialWaitlistFormState,
  );
  return (
    <form action={formAction} className="waitlist-status-picker">
      <fieldset disabled={pending}>
        <legend className="sr-only">Status</legend>
        {WAITLIST_STATUSES.map((value) => (
          <button
            className={value === status ? "is-current" : undefined}
            type="submit"
            name="status"
            value={value}
            key={value}
            aria-pressed={value === status}
          >
            {waitlistStatusLabels[value]}
          </button>
        ))}
      </fieldset>
      {state.status === "error" ? (
        <small className="field-error" role="alert">
          {state.message}
        </small>
      ) : null}
    </form>
  );
}
