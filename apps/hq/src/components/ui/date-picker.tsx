"use client";

import { Select } from "./select";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

// SET25 date / date-time picker. Submits the same values as native inputs
// (YYYY-MM-DD, or YYYY-MM-DDTHH:mm with `withTime`) through a named input, so
// server validation is unchanged. The calendar opens in the browser top layer
// (Popover API) so scrolling dialogs cannot clip it.

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MALDIVES_OFFSET_MS = 5 * 60 * 60 * 1000;
const DEFAULT_TIME = "12:00";

type Day = { year: number; month: number; day: number };

const pad = (value: number) => String(value).padStart(2, "0");
const toKey = (d: Day) => `${d.year}-${pad(d.month + 1)}-${pad(d.day)}`;

function parseKey(key: string): Day | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(key);
  if (!match) return null;
  return { year: +match[1], month: +match[2] - 1, day: +match[3] };
}

function todayInMaldives(): Day {
  const now = new Date(Date.now() + MALDIVES_OFFSET_MS);
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
    day: now.getUTCDate(),
  };
}

function addDays(d: Day, amount: number): Day {
  const date = new Date(Date.UTC(d.year, d.month, d.day + amount));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth(),
    day: date.getUTCDate(),
  };
}

function addMonths(d: Day, amount: number): Day {
  const target = new Date(Date.UTC(d.year, d.month + amount, 1));
  const last = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return {
    year: target.getUTCFullYear(),
    month: target.getUTCMonth(),
    day: Math.min(d.day, last),
  };
}

/** 6×7 grid of days for a month, Monday first. */
function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) =>
    addDays({ year, month, day: 1 }, index - offset),
  );
}

function formatDisplay(value: string, withTime: boolean) {
  const day = parseKey(value);
  if (!day) return "";
  const date = `${pad(day.day)} ${MONTHS[day.month].slice(0, 3)} ${day.year}`;
  const time = withTime ? value.slice(11, 16) : "";
  return time ? `${date} · ${time}` : date;
}

export function DatePicker({
  name,
  defaultValue = "",
  withTime = false,
  required = false,
  disabled = false,
  placeholder,
  compact = false,
  invalid = false,
  label,
  onChange,
}: {
  name: string;
  defaultValue?: string;
  withTime?: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
  invalid?: boolean;
  /** Accessible name when the picker is not inside a <label>. */
  label?: string;
  onChange?: (value: string) => void;
}) {
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const selected = parseKey(value);
  const [focused, setFocused] = useState<Day>(selected ?? todayInMaldives());
  const time = withTime ? value.slice(11, 16) || DEFAULT_TIME : "";
  const today = todayInMaldives();

  const commit = useCallback(
    (next: string) => {
      setValue(next);
      onChange?.(next);
    },
    [onChange],
  );

  // `scrollToFit` is set only when the picker opens: on touch layouts the
  // page then scrolls so the calendar fits below its trigger. Later scroll
  // and resize events only reposition it, so they never fight the user.
  const place = useCallback((scrollToFit = false) => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    const shown = (selector: string) => {
      const bar = document.querySelector<HTMLElement>(selector);
      return bar && getComputedStyle(bar).display !== "none"
        ? bar.offsetHeight
        : 0;
    };
    // Keep the popover clear of the fixed mobile top bar and tab bar.
    const topBarHeight = shown(".mobile-bar");
    const tabBarHeight = shown(".tab-bar");
    const touch = topBarHeight > 0 || tabBarHeight > 0;
    const topLimit = topBarHeight + 8;
    const bottomLimit = window.innerHeight - 8 - tabBarHeight;
    const height = popover.offsetHeight;
    const width = popover.offsetWidth;
    let rect = trigger.getBoundingClientRect();
    const fitsBelow = () => rect.bottom + 6 + height <= bottomLimit;
    const fitsAbove = rect.top - height - 6 >= (touch ? topLimit : 0);
    if (touch && scrollToFit && !fitsBelow() && !fitsAbove) {
      const overflow = rect.bottom + 6 + height - bottomLimit;
      if (rect.top - overflow >= topLimit) {
        window.scrollBy({ top: overflow, behavior: "instant" });
        rect = trigger.getBoundingClientRect();
      }
    }
    popover.style.right = "";
    popover.style.bottom = "";
    popover.style.width = "";
    let top: number;
    if (fitsBelow()) top = rect.bottom + 6;
    else if (rect.top - height - 6 >= (touch ? topLimit : 0))
      top = rect.top - height - 6;
    else if (touch) {
      // Last resort on phones: a sheet pinned above the tab bar.
      popover.style.top = "auto";
      popover.style.left = "16px";
      popover.style.right = "16px";
      popover.style.bottom = `${tabBarHeight + 8}px`;
      popover.style.width = "auto";
      return;
    } else top = Math.max(8, Math.min(rect.bottom + 6, bottomLimit - height));
    const left = Math.max(
      8,
      Math.min(rect.left, window.innerWidth - width - 8),
    );
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }, []);

  // Keep the open state in sync with light-dismiss (outside click / Escape).
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
    place(true);
    const reposition = () => place();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, place]);

  // Move keyboard focus to the active day whenever the grid changes.
  useEffect(() => {
    if (!open) return;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-day="${toKey(focused)}"]`)
      ?.focus({ preventScroll: true });
  }, [open, focused]);

  function show() {
    if (disabled) return;
    setFocused(parseKey(value) ?? todayInMaldives());
    popoverRef.current?.showPopover();
  }

  function hide() {
    popoverRef.current?.hidePopover();
  }

  function pickDay(day: Day) {
    commit(withTime ? `${toKey(day)}T${time}` : toKey(day));
    setFocused(day);
    if (!withTime) hide();
  }

  function setTime(next: string) {
    commit(`${toKey(selected ?? focused)}T${next}`);
  }

  function onGridKey(event: React.KeyboardEvent) {
    const moves: Record<string, () => Day> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setFocused(move());
  }

  const days = monthGrid(focused.year, focused.month);
  const [hour, minute] = (time || DEFAULT_TIME).split(":");
  const minuteOptions = Array.from({ length: 12 }, (_, i) => pad(i * 5));
  if (!minuteOptions.includes(minute)) minuteOptions.push(minute);
  minuteOptions.sort();

  return (
    <span
      className={`date-picker${compact ? " date-picker--compact" : ""}`}
      data-invalid={invalid || undefined}
    >
      <button
        ref={triggerRef}
        type="button"
        className="date-picker-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={label}
        data-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? hide() : show())}
      >
        <CalendarDays aria-hidden="true" />
        <span className={value ? undefined : "date-picker-placeholder"}>
          {value
            ? formatDisplay(value, withTime)
            : (placeholder ??
              (withTime ? "Choose date and time" : "Choose date"))}
        </span>
      </button>
      {/* Carries the value and native `required` validation for the form. */}
      <input
        className="date-picker-value"
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={() => undefined}
        onFocus={() => triggerRef.current?.focus()}
      />
      {value && !required && !disabled ? (
        <button
          type="button"
          className="date-picker-clear"
          aria-label="Clear date"
          onClick={() => commit("")}
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
      <div
        ref={popoverRef}
        id={popoverId}
        popover="auto"
        role="dialog"
        aria-label={withTime ? "Choose date and time" : "Choose date"}
        className="date-picker-popover"
      >
        <div className="date-picker-head">
          <button
            type="button"
            className="date-picker-nav"
            aria-label="Previous month"
            onClick={() => setFocused(addMonths(focused, -1))}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <strong aria-live="polite">
            {MONTHS[focused.month]} {focused.year}
          </strong>
          <button
            type="button"
            className="date-picker-nav"
            aria-label="Next month"
            onClick={() => setFocused(addMonths(focused, 1))}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
        <div className="date-picker-weekdays" aria-hidden="true">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div
          ref={gridRef}
          className="date-picker-grid"
          role="grid"
          onKeyDown={onGridKey}
        >
          {days.map((day) => {
            const key = toKey(day);
            const isSelected = selected !== null && key === toKey(selected);
            const isFocused = key === toKey(focused);
            return (
              <button
                type="button"
                key={key}
                data-day={key}
                tabIndex={isFocused ? 0 : -1}
                aria-pressed={isSelected}
                aria-label={`${day.day} ${MONTHS[day.month]} ${day.year}`}
                className={[
                  "date-picker-day",
                  day.month !== focused.month ? "is-outside" : "",
                  key === toKey(today) ? "is-today" : "",
                  isSelected ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => pickDay(day)}
              >
                {day.day}
              </button>
            );
          })}
        </div>
        {withTime ? (
          <div className="date-picker-time">
            <span>Time</span>
            <Select
              aria-label="Hour"
              value={hour}
              onChange={(event) => setTime(`${event.target.value}:${minute}`)}
            >
              {Array.from({ length: 24 }, (_, i) => pad(i)).map((h) => (
                <option value={h} key={h}>
                  {h}
                </option>
              ))}
            </Select>
            <span aria-hidden="true">:</span>
            <Select
              aria-label="Minute"
              value={minute}
              onChange={(event) => setTime(`${hour}:${event.target.value}`)}
            >
              {minuteOptions.map((m) => (
                <option value={m} key={m}>
                  {m}
                </option>
              ))}
            </Select>
            <small>Maldives time</small>
          </div>
        ) : null}
        <div className="date-picker-foot">
          <button
            type="button"
            className="date-picker-link"
            onClick={() => pickDay(today)}
          >
            Today
          </button>
          {!required ? (
            <button
              type="button"
              className="date-picker-link"
              onClick={() => {
                commit("");
                hide();
              }}
            >
              Clear
            </button>
          ) : null}
          {withTime ? (
            <button
              type="button"
              className="button button--dark date-picker-done"
              onClick={hide}
            >
              Done
            </button>
          ) : null}
        </div>
      </div>
    </span>
  );
}
