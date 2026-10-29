"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Editor dialog rendered at the end of <body>, so it never inherits the
// styles of the panel or list its trigger sits in. Escape closes it (unless a
// Select or DatePicker menu is open, which Escape closes first), focus moves
// into the dialog on open and back to the trigger on close.

function popoverOpen() {
  try {
    return Boolean(document.querySelector(":popover-open"));
  } catch {
    return false;
  }
}

export function ModalDialog({
  titleId,
  kicker,
  title,
  onClose,
  busy = false,
  className,
  children,
}: {
  titleId: string;
  kicker: string;
  title: ReactNode;
  onClose: () => void;
  /** Blocks closing while a submission is in flight. */
  busy?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => previous?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || busy) return;
      if (popoverOpen()) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="dialog-backdrop" role="presentation">
      <section
        ref={panel}
        className={`dialog-panel${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="dialog-head">
          <div>
            <p className="kicker">{kicker}</p>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={busy}
          >
            <X aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}
