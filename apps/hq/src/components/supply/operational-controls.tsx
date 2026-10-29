"use client";

import { Select } from "@/components/ui/select";
import { useActionState, useRef, useState, type ReactNode } from "react";
import { Ban, Check, PackageCheck, Send, X } from "lucide-react";
import {
  IMPORT_SHIPMENT_STATUSES,
  importShipmentStatusLabels,
  formatMVR,
  formatImportNumber,
  type ImportShipmentStatusValue,
} from "@set25/shared";
import {
  initialSupplyFormState,
  type SupplyFormState,
} from "@/lib/supply/validation";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { useFormAction } from "@/components/ui/use-form-action";
import { FormResult } from "./supplier-forms";

type Action = (
  state: SupplyFormState,
  formData: FormData,
) => Promise<SupplyFormState>;

export function PurchaseOrderStatusButtons({
  purchaseOrderNumber,
  placeAction,
  cancelAction,
}: {
  purchaseOrderNumber: string;
  placeAction?: Action;
  cancelAction: Action;
}) {
  // Danger before the Onyx primary, so Place sits last like other records.
  return (
    <div className="supply-action-group">
      <ConfirmedAction
        action={cancelAction}
        label="Cancel PO"
        icon={<Ban aria-hidden="true" />}
        title="Cancel this purchase order?"
        description="It can no longer be placed, shipped or received. This can't be undone."
        confirmLabel="Cancel purchase order"
        danger
      />
      {placeAction ? (
        <ConfirmedAction
          action={placeAction}
          label="Place purchase order"
          icon={<Send aria-hidden="true" />}
          title={`Place ${purchaseOrderNumber}?`}
          description="Its remaining quantities will count as Incoming stock, and the draft can no longer be edited."
          confirmLabel="Place purchase order"
        />
      ) : null}
    </div>
  );
}

function ConfirmedAction({
  action,
  label,
  icon,
  title,
  description,
  confirmLabel,
  danger = false,
}: {
  action: Action;
  label: string;
  icon: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(
    action,
    initialSupplyFormState,
  );
  return (
    <>
      <button
        className={`button ${danger ? "button--danger" : "button--dark"}`}
        type="button"
        onClick={() => dialog.current?.showModal()}
      >
        {icon} {label}
      </button>
      <dialog className="commerce-dialog commerce-dialog--confirm" ref={dialog}>
        <form action={formAction}>
          <div className="dialog-head">
            <div>
              <p className="kicker">Confirm action</p>
              <h2>{title}</h2>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close confirmation"
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <div className="dialog-body">
            <p>{description}</p>
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
    </>
  );
}

export function ShipmentStatusForm({
  action,
  current,
}: {
  action: Action;
  current: ImportShipmentStatusValue;
}) {
  const { formRef, state, pending, onSubmit } = useFormAction(
    action,
    initialSupplyFormState,
  );
  const currentIndex = IMPORT_SHIPMENT_STATUSES.indexOf(current);
  const options = IMPORT_SHIPMENT_STATUSES.filter(
    (status, index) =>
      status !== "RECEIVED" && (status === "CANCELLED" || index > currentIndex),
  );
  return (
    <form ref={formRef} onSubmit={onSubmit} className="supply-inline-form">
      <div className="form-grid">
        <label className="field">
          <span>New status</span>
          <Select name="status" defaultValue={options[0]}>
            {options.map((status) => (
              <option value={status} key={status}>
                {importShipmentStatusLabels[status]}
              </option>
            ))}
          </Select>
        </label>
        <label className="field">
          <span>Status note</span>
          <input name="notes" placeholder="Optional operational context" />
        </label>
      </div>
      <FormResult state={state} />
      <button className="button button--dark" type="submit" disabled={pending}>
        <Check aria-hidden="true" /> {pending ? "Updating…" : "Update status"}
      </button>
    </form>
  );
}

export function ReceiveShipment({
  action,
  receive,
}: {
  action: Action;
  receive: {
    importNumber: number;
    lines: {
      id: string;
      productName: string;
      variantLabel: string;
      sku: string;
      quantityShipped: number;
      quantityReceived: number;
      productCostMvr: string;
      allocatedSharedCostMvr: string;
      actualUnitCostMvr: string;
    }[];
  };
}) {
  const [open, setOpen] = useState(false);
  const { formRef, state, pending, onSubmit } = useFormAction(
    action,
    initialSupplyFormState,
  );
  return (
    <>
      <button
        className="button button--accent"
        type="button"
        onClick={() => setOpen(true)}
      >
        <PackageCheck aria-hidden="true" /> Receive shipment
      </button>
      {open ? (
        <ModalDialog
          titleId="receive-title"
          kicker="Critical inventory action"
          title={`Receive ${formatImportNumber(receive.importNumber)}?`}
          onClose={() => setOpen(false)}
          busy={pending}
          className="supply-receive-dialog"
        >
          <form ref={formRef} onSubmit={onSubmit}>
            <div className="dialog-body">
              <p>
                Confirm the actual quantities. All stock, movement, PO, and
                final-cost changes will commit together.
              </p>
              <div className="receive-line-list">
                {receive.lines.map((line) => (
                  <label className="receive-line" key={line.id}>
                    <span>
                      <strong>
                        {line.productName} · {line.variantLabel}
                      </strong>
                      <small>
                        {line.sku} · expected {line.quantityShipped} ·{" "}
                        {formatMVR(line.actualUnitCostMvr)} each
                      </small>
                      <small>
                        Product {formatMVR(line.productCostMvr)} · allocated
                        fees {formatMVR(line.allocatedSharedCostMvr)}
                      </small>
                    </span>
                    <input
                      aria-label={`Actual quantity for ${line.sku}`}
                      name={`received:${line.id}`}
                      type="number"
                      min={1}
                      max={line.quantityShipped}
                      step={1}
                      defaultValue={line.quantityShipped}
                      required
                    />
                  </label>
                ))}
              </div>
              <FormResult state={state} />
            </div>
            <div className="dialog-actions">
              <button
                className="button button--secondary"
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Back
              </button>
              <button
                className="button button--dark"
                type="submit"
                disabled={pending}
              >
                {pending ? "Receiving…" : "Confirm and add stock"}
              </button>
            </div>
          </form>
        </ModalDialog>
      ) : null}
    </>
  );
}
