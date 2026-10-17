"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";

// SET25 select. A drop-in for <select>: it reads ordinary <option> /
// <optgroup> children, submits through a named input (native `required`
// validation included), and calls onChange with `{ target: { value } }` so
// existing handlers keep working. The menu renders in the browser top layer
// (Popover API), so dialogs cannot clip it, and looks the same everywhere.

type Option = {
  value: string;
  label: string;
  disabled: boolean;
  group?: string;
};

type ChangeEvent = { target: { value: string } };

const SEARCH_THRESHOLD = 12;

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean")
    return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return textOf(node.props.children);
  return "";
}

function collectOptions(
  children: ReactNode,
  group?: string,
  out: Option[] = [],
): Option[] {
  Children.forEach(children, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return;
    const props = child.props;
    if (child.type === Fragment) {
      collectOptions(props.children as ReactNode, group, out);
    } else if (child.type === "optgroup") {
      collectOptions(
        props.children as ReactNode,
        String(props.label ?? ""),
        out,
      );
    } else if (child.type === "option") {
      const label = textOf(props.children as ReactNode);
      out.push({
        value: props.value === undefined ? label : String(props.value),
        label,
        disabled: Boolean(props.disabled),
        group,
      });
    }
  });
  return out;
}

export function Select({
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  required = false,
  disabled = false,
  children,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent) => void;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
  "aria-label"?: string;
  "aria-invalid"?: boolean | "true" | "false";
}) {
  const options = useMemo(() => collectOptions(children), [children]);
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: "", at: 0 });
  const [innerValue, setInnerValue] = useState(
    defaultValue ?? options[0]?.value ?? "",
  );
  const value = controlledValue ?? innerValue;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const searchable = options.length > SEARCH_THRESHOLD;
  const selected = options.find((option) => option.value === value);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term
      ? options.filter(
          (option) =>
            option.label.toLowerCase().includes(term) ||
            option.group?.toLowerCase().includes(term),
        )
      : options;
  }, [options, query]);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    const rect = trigger.getBoundingClientRect();
    popover.style.minWidth = `${Math.max(rect.width, 180)}px`;
    const height = popover.offsetHeight;
    const width = popover.offsetWidth;
    const below = rect.bottom + 4;
    const top =
      below + height > window.innerHeight - 8 && rect.top - height - 4 > 8
        ? rect.top - height - 4
        : below;
    popover.style.top = `${top}px`;
    popover.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
  }, []);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!popover) return;
    const onToggle = (event: Event) => {
      const isOpen = (event as ToggleEvent).newState === "open";
      setOpen(isOpen);
      if (!isOpen) {
        setQuery("");
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    popover.addEventListener("toggle", onToggle);
    return () => popover.removeEventListener("toggle", onToggle);
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    (searchRef.current ?? listRef.current)?.focus({ preventScroll: true });
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function show() {
    if (disabled) return;
    setQuery("");
    setActive(
      Math.max(
        0,
        options.findIndex((option) => option.value === value),
      ),
    );
    popoverRef.current?.showPopover();
  }

  function hide() {
    popoverRef.current?.hidePopover();
  }

  function choose(option: Option) {
    if (option.disabled) return;
    if (controlledValue === undefined) setInnerValue(option.value);
    if (option.value !== value) onChange?.({ target: { value: option.value } });
    hide();
  }

  function move(from: number, step: 1 | -1) {
    for (let i = from + step; i >= 0 && i < visible.length; i += step)
      if (!visible[i].disabled) return i;
    return from;
  }

  function onListKey(event: React.KeyboardEvent) {
    const last = visible.length - 1;
    if (event.key === "ArrowDown") setActive((i) => move(i, 1));
    else if (event.key === "ArrowUp") setActive((i) => move(i, -1));
    else if (event.key === "Home") setActive(move(-1, 1));
    else if (event.key === "End") setActive(move(last + 1, -1));
    else if (event.key === "Enter") {
      if (visible[active]) choose(visible[active]);
    } else if (event.key === "Tab") hide();
    else if (!searchable && event.key.length === 1) {
      // Type-ahead when there is no search box.
      const now = event.timeStamp;
      const state = typeahead.current;
      state.text =
        (now - state.at < 600 ? state.text : "") + event.key.toLowerCase();
      state.at = now;
      const index = visible.findIndex(
        (option) =>
          !option.disabled && option.label.toLowerCase().startsWith(state.text),
      );
      if (index >= 0) setActive(index);
      return;
    } else return;
    event.preventDefault();
  }

  function onTriggerKey(event: React.KeyboardEvent) {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      show();
    }
  }

  return (
    <span className="select">
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid || undefined}
        disabled={disabled}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onTriggerKey}
      >
        <span
          className={
            selected && !selected.disabled
              ? "select-label"
              : "select-label is-placeholder"
          }
        >
          {selected?.label ?? ""}
        </span>
        <ChevronDown className="select-chevron" aria-hidden="true" />
      </button>
      {/* Carries the value and native `required` validation for the form. */}
      <input
        className="select-value"
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={() => undefined}
        onFocus={() => triggerRef.current?.focus()}
      />
      <div
        ref={popoverRef}
        popover="auto"
        className="select-popover"
        onKeyDown={onListKey}
      >
        {searchable ? (
          <label className="select-search">
            <Search aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              placeholder="Search…"
              aria-label="Search options"
              aria-controls={listboxId}
              aria-activedescendant={
                active >= 0 ? `${listboxId}-${active}` : undefined
              }
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
            />
          </label>
        ) : null}
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={
            !searchable && active >= 0 ? `${listboxId}-${active}` : undefined
          }
          className="select-list"
        >
          {visible.map((option, index) => {
            const heading =
              option.group && option.group !== visible[index - 1]?.group
                ? option.group
                : null;
            const isSelected = option.value === value;
            return (
              <Fragment key={`${option.group ?? ""}:${option.value}:${index}`}>
                {heading ? (
                  <div className="select-group" role="presentation">
                    {heading}
                  </div>
                ) : null}
                <div
                  id={`${listboxId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  className={[
                    "select-option",
                    index === active ? "is-active" : "",
                    isSelected ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onPointerMove={() => !option.disabled && setActive(index)}
                  onClick={() => choose(option)}
                >
                  <span>{option.label}</span>
                  {isSelected ? <Check aria-hidden="true" /> : null}
                </div>
              </Fragment>
            );
          })}
          {!visible.length ? (
            <div className="select-empty">No matches</div>
          ) : null}
        </div>
      </div>
    </span>
  );
}
