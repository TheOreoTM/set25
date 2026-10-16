"use client";

import { useActionState, useRef } from "react";
import { Check, CircleDollarSign, PackageCheck, X } from "lucide-react";
import {
  FULFILMENT_STATUSES,
  PAYMENT_METHODS,
  PREORDER_STATUSES,
  fulfilmentStatusLabels,
  formatMVR,
  paymentMethodLabels,
  preorderStatusLabels,
  type FulfilmentStatusValue,
  type PreorderStatusValue,
} from "@set25/shared";
import {
  cancelOrderAction,
  completeOrderAction,
  recordPaymentAction,
  updateFulfilmentAction,
  updatePreorderStatusAction,
} from "@/lib/commerce/actions";
import { initialCommerceFormState } from "@/lib/commerce/validation";

export function PaymentControl({
  orderId,
  balance,
  refundable,
  submissionKey,
  returnTo,
}: {
  orderId: string;
  balance: string;
  refundable: string;
  submissionKey: string;
  returnTo: "order" | "preorder";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(
    recordPaymentAction.bind(null, orderId),
    initialCommerceFormState,
  );
  return (
    <>
      <button
        className="button button--dark"
        type="button"
        onClick={() => dialog.current?.showModal()}
      >
        <CircleDollarSign aria-hidden="true" /> Record payment
      </button>
      <dialog className="commerce-dialog" ref={dialog}>
        <form action={action}>
          <input type="hidden" name="idempotencyKey" value={submissionKey} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="dialog-head">
            <div>
              <p className="kicker">Payment ledger</p>
              <h2>Record transaction</h2>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close payment form"
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <div className="dialog-body">
            <div className="payment-capacity">
              <div>
                <span>Balance left</span>
                <strong>{formatMVR(balance)}</strong>
              </div>
              <div>
                <span>Refundable</span>
                <strong>{formatMVR(refundable)}</strong>
              </div>
            </div>
            <div className="form-grid form-grid--dialog">
              <label className="field">
                <span>Transaction</span>
                <select name="type" defaultValue="PAYMENT">
                  <option value="PAYMENT">Payment</option>
                  <option value="REFUND">Refund</option>
                </select>
              </label>
              <label className="field">
                <span>Amount</span>
                <div className="input-with-prefix">
                  <span>MVR</span>
                  <input
                    name="amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    required
                  />
                </div>
                {state.errors?.amount ? (
                  <small className="field-error">
                    {state.errors.amount[0]}
                  </small>
                ) : null}
              </label>
              <label className="field">
                <span>Method</span>
                <select name="method" defaultValue="BANK_TRANSFER">
                  {PAYMENT_METHODS.map((method) => (
                    <option value={method} key={method}>
                      {paymentMethodLabels[method]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Reference (optional)</span>
                <input
                  name="reference"
                  maxLength={100}
                  placeholder="Transfer or receipt reference"
                />
              </label>
            </div>
            <label className="field">
              <span>Notes (optional)</span>
              <textarea name="notes" rows={3} maxLength={500} />
            </label>
            {state.message ? (
              <div className="form-message form-message--error" role="alert">
                {state.message}
              </div>
            ) : null}
          </div>
          <div className="dialog-actions">
            <button
              className="button button--secondary"
              type="button"
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
            <button
              className="button button--dark"
              type="submit"
              disabled={pending}
            >
              {pending ? "Recording once…" : "Record transaction"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function FulfilmentControl({
  orderId,
  current,
  returnTo,
}: {
  orderId: string;
  current: FulfilmentStatusValue;
  returnTo: "order" | "preorder";
}) {
  const [state, action, pending] = useActionState(
    updateFulfilmentAction.bind(null, orderId),
    initialCommerceFormState,
  );
  const rank = FULFILMENT_STATUSES.indexOf(current);
  const options = FULFILMENT_STATUSES.filter(
    (status) =>
      !["COMPLETED", "CANCELLED"].includes(status) &&
      FULFILMENT_STATUSES.indexOf(status) >= rank,
  );
  if (!options.length || ["COMPLETED", "CANCELLED"].includes(current))
    return null;
  return (
    <form action={action} className="workflow-inline">
      <input type="hidden" name="returnTo" value={returnTo} />
      <label className="field">
        <span>Fulfilment</span>
        <select name="status" defaultValue={current}>
          {options.map((status) => (
            <option value={status} key={status}>
              {fulfilmentStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <button
        className="button button--secondary"
        type="submit"
        disabled={pending}
      >
        <PackageCheck aria-hidden="true" /> {pending ? "Updating…" : "Update"}
      </button>
      {state.message ? (
        <p className="field-error" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function PreorderStatusControl({
  orderId,
  current,
}: {
  orderId: string;
  current: PreorderStatusValue;
}) {
  const [state, action, pending] = useActionState(
    updatePreorderStatusAction.bind(null, orderId),
    initialCommerceFormState,
  );
  if (["COMPLETED", "CANCELLED"].includes(current)) return null;
  return (
    <form action={action} className="workflow-inline">
      <label className="field">
        <span>Preorder status</span>
        <select name="status" defaultValue={current}>
          {PREORDER_STATUSES.filter(
            (status) => !["COMPLETED", "CANCELLED"].includes(status),
          ).map((status) => (
            <option value={status} key={status}>
              {preorderStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <button
        className="button button--secondary"
        type="submit"
        disabled={pending}
      >
        {pending ? "Updating…" : "Update"}
      </button>
      {state.message ? (
        <p className="field-error" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function TerminalOrderControls({
  orderId,
  status,
  returnTo,
}: {
  orderId: string;
  status: FulfilmentStatusValue;
  returnTo: "order" | "preorder";
}) {
  const completeDialog = useRef<HTMLDialogElement>(null);
  const cancelDialog = useRef<HTMLDialogElement>(null);
  const [completeState, completeAction, completing] = useActionState(
    completeOrderAction.bind(null, orderId),
    initialCommerceFormState,
  );
  const [cancelState, cancelAction, cancelling] = useActionState(
    cancelOrderAction.bind(null, orderId),
    initialCommerceFormState,
  );
  if (["COMPLETED", "CANCELLED"].includes(status)) return null;
  return (
    <>
      <button
        className="button button--dark"
        type="button"
        onClick={() => completeDialog.current?.showModal()}
      >
        <Check aria-hidden="true" /> Complete order
      </button>
      <button
        className="button button--secondary button--danger"
        type="button"
        onClick={() => cancelDialog.current?.showModal()}
      >
        Cancel order
      </button>
      <ConfirmDialog
        dialogRef={completeDialog}
        title="Complete this order?"
        description="All item quantities will be checked and deducted together. This cannot be casually reversed."
        action={completeAction}
        pending={completing}
        error={completeState.message}
        confirmLabel="Complete and deduct stock"
        returnTo={returnTo}
      />
      <ConfirmDialog
        dialogRef={cancelDialog}
        title="Cancel this order?"
        description="No stock will change. A cancelled order cannot continue through fulfilment."
        action={cancelAction}
        pending={cancelling}
        error={cancelState.message}
        confirmLabel="Cancel order"
        danger
        returnTo={returnTo}
      />
    </>
  );
}

function ConfirmDialog({
  dialogRef,
  title,
  description,
  action,
  pending,
  error,
  confirmLabel,
  danger = false,
  returnTo,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  description: string;
  action: (formData: FormData) => void;
  pending: boolean;
  error: string;
  confirmLabel: string;
  danger?: boolean;
  returnTo: "order" | "preorder";
}) {
  return (
    <dialog
      className="commerce-dialog commerce-dialog--confirm"
      ref={dialogRef}
    >
      <form action={action}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <div className="dialog-head">
          <div>
            <p className="kicker">Confirm action</p>
            <h2>{title}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close confirmation"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="dialog-body">
          <p>{description}</p>
          {error ? (
            <div className="form-message form-message--error" role="alert">
              {error}
            </div>
          ) : null}
        </div>
        <div className="dialog-actions">
          <button
            className="button button--secondary"
            type="button"
            onClick={() => dialogRef.current?.close()}
          >
            Back
          </button>
          <button
            className={`button ${danger ? "button--danger-solid" : "button--dark"}`}
            type="submit"
            disabled={pending}
          >
            {pending ? "Applying once…" : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
