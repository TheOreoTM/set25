"use client";

import { Select } from "@/components/ui/select";
import { useRef, useState } from "react";
import { Minus, PackagePlus, Plus, X } from "lucide-react";
import {
  inventoryMovementLabels,
  INVENTORY_MOVEMENT_TYPES,
} from "@set25/shared";
import { adjustStockAction } from "@/lib/catalog/actions";
import {
  initialFormState,
  validateStockAdjustment,
  type FormErrors,
} from "@/lib/catalog/validation";
import { useFormAction } from "@/components/ui/use-form-action";

export type AdjustmentVariant = {
  id: string;
  label: string;
  sku: string;
  stockOnHand: number;
};

type ReviewData = {
  direction: "Add" | "Remove";
  quantity: number;
  type: keyof typeof inventoryMovementLabels;
  notes: string;
  reference: string | null;
  variant: AdjustmentVariant | null;
};

export function StockAdjustment({
  variants,
  returnTo,
  defaultVariantId,
  submissionKey,
  compact = false,
}: {
  variants: AdjustmentVariant[];
  returnTo: string;
  defaultVariantId?: string;
  submissionKey: string;
  compact?: boolean;
}) {
  const {
    formRef: form,
    state,
    pending,
    onSubmit,
  } = useFormAction(adjustStockAction, initialFormState);
  const [reviewing, setReviewing] = useState<ReviewData | null>(null);
  const [clientErrors, setClientErrors] = useState<FormErrors>({});
  const dialog = useRef<HTMLDialogElement>(null);
  const errors = { ...state.errors, ...clientErrors };

  function review() {
    if (!form.current) return;
    const data = new FormData(form.current);
    const result = validateStockAdjustment(data);

    if (!result.success) {
      setClientErrors(result.errors);
      const firstField = Object.keys(result.errors)[0];
      if (firstField) {
        requestAnimationFrame(() => {
          form.current
            ?.querySelector<HTMLElement>(`[name="${firstField}"]`)
            ?.focus();
        });
      }
      return;
    }

    setClientErrors({});
    setReviewing({
      direction: result.data.direction === "REMOVE" ? "Remove" : "Add",
      quantity: result.data.quantity,
      type: result.data.type,
      notes: result.data.notes,
      reference: result.data.reference,
      variant:
        variants.find((variant) => variant.id === result.data.variantId) ??
        null,
    });
  }

  return (
    <>
      <button
        className={`${compact ? "button button--secondary" : "button button--dark"} cursor-pointer`}
        type="button"
        onClick={() => {
          setReviewing(null);
          setClientErrors({});
          dialog.current?.showModal();
        }}
        disabled={!variants.length}
      >
        <PackagePlus aria-hidden="true" /> Adjust stock
      </button>
      <dialog
        className="adjustment-dialog"
        ref={dialog}
        onClose={() => setReviewing(null)}
      >
        <form
          ref={form}
          // Only the confirm step submits; anything else goes to review.
          onSubmit={(event) => {
            if (reviewing) return onSubmit(event);
            event.preventDefault();
            review();
          }}
          onChange={() => {
            setReviewing(null);
            setClientErrors({});
          }}
        >
          <input type="hidden" name="idempotencyKey" value={submissionKey} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="dialog-head">
            <div>
              <p className="kicker">Inventory movement</p>
              <h2>{reviewing ? "Confirm stock change" : "Adjust stock"}</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => dialog.current?.close()}
              aria-label="Close stock adjustment"
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <div className="dialog-body" hidden={Boolean(reviewing)}>
            <label className="field">
              <span>Variant</span>
              <Select
                name="variantId"
                defaultValue={defaultVariantId ?? variants[0]?.id}
                required
                aria-invalid={Boolean(errors.variantId)}
              >
                {variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.sku} · {variant.stockOnHand} on hand ·{" "}
                    {variant.label}
                  </option>
                ))}
              </Select>
              {errors.variantId ? (
                <small className="field-error">{errors.variantId[0]}</small>
              ) : null}
            </label>
            <fieldset className="direction-field">
              <legend>Direction</legend>
              <div>
                <label className="direction-option direction-option--add">
                  <input
                    type="radio"
                    name="direction"
                    value="ADD"
                    defaultChecked
                  />
                  <Plus aria-hidden="true" />
                  <span>
                    <strong>Add stock</strong>
                    <small>Quantity goes up</small>
                  </span>
                </label>
                <label className="direction-option direction-option--remove">
                  <input type="radio" name="direction" value="REMOVE" />
                  <Minus aria-hidden="true" />
                  <span>
                    <strong>Remove stock</strong>
                    <small>Quantity goes down</small>
                  </span>
                </label>
              </div>
              {errors.direction ? (
                <small className="field-error">{errors.direction[0]}</small>
              ) : null}
            </fieldset>
            <div className="form-grid form-grid--dialog">
              <label className="field">
                <span>Adjustment type</span>
                <Select
                  name="type"
                  defaultValue="OPENING_STOCK"
                  required
                  aria-invalid={Boolean(errors.type)}
                >
                  {INVENTORY_MOVEMENT_TYPES.map((type) => (
                    <option value={type} key={type}>
                      {inventoryMovementLabels[type]}
                    </option>
                  ))}
                </Select>
                {errors.type ? (
                  <small className="field-error">{errors.type[0]}</small>
                ) : null}
              </label>
              <label className="field">
                <span>Quantity</span>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  step={1}
                  required
                  placeholder="20"
                  aria-invalid={Boolean(errors.quantity)}
                />
                {errors.quantity ? (
                  <small className="field-error">{errors.quantity[0]}</small>
                ) : null}
              </label>
            </div>
            <label className="field">
              <span>Reason</span>
              <textarea
                name="notes"
                rows={3}
                required
                minLength={3}
                maxLength={500}
                placeholder="Explain why the stock changed."
                aria-invalid={Boolean(errors.notes)}
              />
              {errors.notes ? (
                <small className="field-error">{errors.notes[0]}</small>
              ) : (
                <small>Required for the inventory audit trail.</small>
              )}
            </label>
            <label className="field">
              <span>Reference</span>
              <input
                name="reference"
                maxLength={80}
                placeholder="Optional document or note reference"
                aria-invalid={Boolean(errors.reference)}
              />
              {errors.reference ? (
                <small className="field-error">{errors.reference[0]}</small>
              ) : null}
            </label>
            {state.message ? (
              <div className="form-message form-message--error" role="alert">
                {state.message}
              </div>
            ) : null}
          </div>
          {reviewing ? <AdjustmentReview data={reviewing} /> : null}
          <div className="dialog-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() =>
                reviewing ? setReviewing(null) : dialog.current?.close()
              }
            >
              {reviewing ? "Back" : "Cancel"}
            </button>
            {/* Distinct keys: reusing one DOM button would turn it into the
                submit button mid-click and apply the change unreviewed. */}
            {reviewing ? (
              <button
                key="confirm"
                className="button button--dark"
                type="submit"
                disabled={pending}
              >
                {pending ? "Applying once…" : "Confirm adjustment"}
              </button>
            ) : (
              <button
                key="review"
                className="button button--dark"
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  review();
                }}
              >
                Review adjustment
              </button>
            )}
          </div>
        </form>
      </dialog>
    </>
  );
}

function AdjustmentReview({ data }: { data: ReviewData }) {
  return (
    <div className="dialog-body confirmation">
      <div
        className={
          data.direction === "Add"
            ? "confirmation-sign confirmation-sign--add"
            : "confirmation-sign confirmation-sign--remove"
        }
      >
        {data.direction === "Add" ? (
          <Plus aria-hidden="true" />
        ) : (
          <Minus aria-hidden="true" />
        )}
      </div>
      <p>You are about to</p>
      <strong>
        {data.direction} {data.quantity}{" "}
        {data.quantity === 1 ? "unit" : "units"}
      </strong>
      <dl>
        {data.variant ? (
          <>
            <div>
              <dt>Variant</dt>
              <dd>
                {data.variant.label} · {data.variant.sku}
              </dd>
            </div>
            <div>
              <dt>On hand</dt>
              <dd>
                {data.variant.stockOnHand} →{" "}
                {data.variant.stockOnHand +
                  (data.direction === "Add" ? data.quantity : -data.quantity)}
              </dd>
            </div>
          </>
        ) : null}
        <div>
          <dt>Type</dt>
          <dd>{inventoryMovementLabels[data.type]}</dd>
        </div>
        <div>
          <dt>Reason</dt>
          <dd>{data.notes}</dd>
        </div>
        {data.reference ? (
          <div>
            <dt>Reference</dt>
            <dd>{data.reference}</dd>
          </div>
        ) : null}
      </dl>
      <small>
        This creates a permanent movement record and updates available stock
        once.
      </small>
    </div>
  );
}
