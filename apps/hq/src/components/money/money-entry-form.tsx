"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import {
  DEFAULT_USD_TO_MVR_RATE,
  MONEY_ENTRY_CURRENCIES,
  MONEY_IN_CATEGORIES,
  MONEY_OUT_CATEGORIES,
  formatMVR,
  moneyCategoryLabels,
  type MoneyDirectionValue,
  type MoneyEntryCurrencyValue,
} from "@set25/shared";
import {
  initialMoneyFormState,
  type MoneyFormState,
} from "@/lib/money/validation";
import { useFormAction } from "@/components/ui/use-form-action";

type Action = (
  state: MoneyFormState,
  formData: FormData,
) => Promise<MoneyFormState>;

export function MoneyEntryForm({
  action,
  direction,
  idempotencyKey,
  occurredAt,
  relatedOptions,
}: {
  action: Action;
  direction: MoneyDirectionValue;
  idempotencyKey: string;
  occurredAt: string;
  relatedOptions: { value: string; group: string; label: string }[];
}) {
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialMoneyFormState,
  );
  const [currency, setCurrency] = useState<MoneyEntryCurrencyValue>("MVR");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState(DEFAULT_USD_TO_MVR_RATE);
  const foreign = currency !== "MVR";
  // Preview only; the server recalculates the stored MVR amount with Decimals.
  const mvrPreview = (Number(amount) || 0) * (Number(rate) || 0);
  const categories =
    direction === "IN" ? MONEY_IN_CATEGORIES : MONEY_OUT_CATEGORIES;
  const groups = relatedOptions.reduce(
    (map, option) =>
      map.set(option.group, [...(map.get(option.group) ?? []), option]),
    new Map<string, typeof relatedOptions>(),
  );

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="editor-form money-entry-form"
    >
      <input type="hidden" name="direction" value={direction} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">
            {direction === "IN" ? "Money In" : "Money Out"}
          </p>
          <h2>Actual cash movement</h2>
          <p>
            {direction === "IN"
              ? "Use this only for non-order income. Customer payments stay in the Order payment workflow."
              : "Record when money actually leaves SET25. Supply cost records do not automatically mean payment."}
          </p>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Currency</span>
            <Select
              name="currency"
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value as MoneyEntryCurrencyValue)
              }
              aria-invalid={Boolean(error("currency"))}
            >
              {MONEY_ENTRY_CURRENCIES.map((value) => (
                <option value={value} key={value}>
                  {value === "MVR" ? "MVR" : "USD (converted to MVR)"}
                </option>
              ))}
            </Select>
            {error("currency") ? (
              <small className="field-error">{error("currency")}</small>
            ) : null}
          </label>
          <label className="field">
            <span>Amount</span>
            <div className="input-with-prefix">
              <span>{currency}</span>
              <input
                name="amount"
                inputMode="decimal"
                placeholder="0.00"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={Boolean(error("amount"))}
              />
            </div>
            {error("amount") ? (
              <small className="field-error">{error("amount")}</small>
            ) : foreign ? (
              <small>Recorded as {formatMVR(mvrPreview)}</small>
            ) : null}
          </label>
          {foreign ? (
            <label className="field">
              <span>Exchange rate to MVR</span>
              <input
                name="exchangeRateToMvr"
                inputMode="decimal"
                required
                value={rate}
                onChange={(event) => setRate(event.target.value)}
                aria-invalid={Boolean(error("exchangeRateToMvr"))}
              />
              {error("exchangeRateToMvr") ? (
                <small className="field-error">
                  {error("exchangeRateToMvr")}
                </small>
              ) : (
                <small>1 {currency} × rate = MVR</small>
              )}
            </label>
          ) : null}
          <label className="field">
            <span>Category</span>
            <Select
              name="category"
              required
              defaultValue=""
              aria-invalid={Boolean(error("category"))}
            >
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((category) => (
                <option value={category} key={category}>
                  {moneyCategoryLabels[category]}
                </option>
              ))}
            </Select>
            {error("category") ? (
              <small className="field-error">{error("category")}</small>
            ) : null}
          </label>
          <label className="field">
            <span>Date</span>
            <DatePicker
              name="occurredAt"
              required
              defaultValue={occurredAt}
              invalid={Boolean(error("occurredAt"))}
            />
            {error("occurredAt") ? (
              <small className="field-error">{error("occurredAt")}</small>
            ) : null}
          </label>
          <label className="field">
            <span>Related to</span>
            <Select
              name="related"
              defaultValue=""
              aria-invalid={Boolean(error("related"))}
            >
              <option value="">No related record</option>
              {[...groups.entries()].map(([group, options]) => (
                <optgroup label={group} key={group}>
                  {options.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            {error("related") ? (
              <small className="field-error">{error("related")}</small>
            ) : null}
          </label>
          <label className="field">
            <span>Reference</span>
            <input
              name="reference"
              maxLength={100}
              placeholder="Receipt or transfer ref."
              aria-invalid={Boolean(error("reference"))}
            />
            {error("reference") ? (
              <small className="field-error">{error("reference")}</small>
            ) : null}
          </label>
          <label className="field field--wide">
            <span>Description</span>
            <input
              name="description"
              maxLength={160}
              required
              placeholder={
                direction === "IN"
                  ? "e.g. Owner funding"
                  : "e.g. ICL freight payment"
              }
              aria-invalid={Boolean(error("description"))}
            />
            {error("description") ? (
              <small className="field-error">{error("description")}</small>
            ) : null}
          </label>
        </div>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Context</p>
          <h2>Notes</h2>
        </div>
        <label className="field">
          <span>Internal notes</span>
          <textarea
            name="notes"
            rows={4}
            maxLength={2000}
            aria-invalid={Boolean(error("notes"))}
          />
          {error("notes") ? (
            <small className="field-error">{error("notes")}</small>
          ) : null}
        </label>
      </section>
      {state.message ? (
        <div className="form-message form-message--error" role="alert">
          {state.message}
          {error("idempotencyKey") ? ` ${error("idempotencyKey")}` : null}
        </div>
      ) : null}
      <div className="form-actions">
        <Link className="button button--secondary" href="/money">
          <ArrowLeft aria-hidden="true" /> Cancel
        </Link>
        <button
          className="button button--dark"
          type="submit"
          disabled={pending}
        >
          <Save aria-hidden="true" />
          {pending
            ? "Recording…"
            : direction === "IN"
              ? "Record Money In"
              : "Record Money Out"}
        </button>
      </div>
    </form>
  );
}
