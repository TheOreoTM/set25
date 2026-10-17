"use client";

import { useActionState, useState } from "react";
import { Check, PackageCheck, X } from "lucide-react";
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
import { FormResult } from "./supplier-forms";

type Action = (
  state: SupplyFormState,
  formData: FormData,
) => Promise<SupplyFormState>;

export function PurchaseOrderStatusButtons({
  placeAction,
  cancelAction,
}: {
  placeAction?: Action;
  cancelAction: Action;
}) {
  return (
    <div className="supply-action-group">
      {placeAction ? (
        <SimpleAction
          action={placeAction}
          label="Place purchase order"
          className="button button--dark"
        />
      ) : null}
      <SimpleAction
        action={cancelAction}
        label="Cancel PO"
        className="button button--danger"
      />
    </div>
  );
}

function SimpleAction({
  action,
  label,
  className,
}: {
  action: Action;
  label: string;
  className: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialSupplyFormState,
  );
  return (
    <form action={formAction}>
      <button className={className} type="submit" disabled={pending}>
        {pending ? "Working…" : label}
      </button>
      {state.message ? (
        <span className="sr-only" role="alert">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

export function ShipmentStatusForm({
  action,
  current,
}: {
  action: Action;
  current: ImportShipmentStatusValue;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialSupplyFormState,
  );
  const currentIndex = IMPORT_SHIPMENT_STATUSES.indexOf(current);
  const options = IMPORT_SHIPMENT_STATUSES.filter(
    (status, index) =>
      status !== "RECEIVED" && (status === "CANCELLED" || index > currentIndex),
  );
  return (
    <form action={formAction} className="supply-inline-form">
      <div className="form-grid">
        <label className="field">
          <span>New status</span>
          <select name="status" defaultValue={options[0]}>
            {options.map((status) => (
              <option value={status} key={status}>
                {importShipmentStatusLabels[status]}
              </option>
            ))}
          </select>
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
  const [state, formAction, pending] = useActionState(
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
        <div className="dialog-backdrop" role="presentation">
          <section
            className="dialog-panel supply-receive-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receive-title"
          >
            <div className="dialog-head">
              <div>
                <p className="kicker">Critical inventory action</p>
                <h2 id="receive-title">
                  Receive {formatImportNumber(receive.importNumber)}?
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <form action={formAction}>
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
          </section>
        </div>
      ) : null}
    </>
  );
}
