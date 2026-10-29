"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Save, Trash2 } from "lucide-react";
import {
  COST_ALLOCATION_METHODS,
  costAllocationMethodLabels,
  formatPurchaseOrderNumber,
  type CostAllocationMethodValue,
} from "@set25/shared";
import {
  initialSupplyFormState,
  type SupplyFormState,
} from "@/lib/supply/validation";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { useFormAction } from "@/components/ui/use-form-action";
import { FieldError, FormResult } from "./supplier-forms";

type PoLineOption = {
  id: string;
  purchaseOrderNumber: number;
  supplierName: string;
  label: string;
  sku: string;
  remaining: number;
};
type Line = {
  key: string;
  purchaseOrderLineId: string;
  quantityShipped: number;
};

export function ImportForm({
  action,
  poLines,
  idempotencyKey,
}: {
  action: (
    state: SupplyFormState,
    formData: FormData,
  ) => Promise<SupplyFormState>;
  poLines: PoLineOption[];
  idempotencyKey: string;
}) {
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialSupplyFormState,
  );
  const [lines, setLines] = useState<Line[]>([
    { key: crypto.randomUUID(), purchaseOrderLineId: "", quantityShipped: 1 },
  ]);
  const update = (key: string, values: Partial<Line>) =>
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...values } : line)),
    );
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="editor-form supply-editor"
    >
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Import</p>
          <h2>Logistics setup</h2>
          <p>
            A single import can consolidate lines from several suppliers and
            purchase orders.
          </p>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Freight forwarder</span>
            <input
              name="freightForwarder"
              required
              defaultValue="ICL"
              aria-invalid={Boolean(error("freightForwarder"))}
            />
            <FieldError message={error("freightForwarder")} />
          </label>
          <label className="field">
            <span>Tracking reference</span>
            <input name="trackingReference" />
          </label>
          <label className="field">
            <span>Estimated departure</span>
            <DatePicker
              name="estimatedDeparture"
              invalid={Boolean(error("dates"))}
            />
          </label>
          <label className="field">
            <span>Estimated arrival</span>
            <DatePicker
              name="estimatedArrival"
              invalid={Boolean(error("dates"))}
            />
            <FieldError message={error("dates")} />
          </label>
          <label className="field">
            <span>Cost allocation</span>
            <Select
              name="costAllocationMethod"
              defaultValue="BY_QUANTITY"
              aria-invalid={Boolean(error("costAllocationMethod"))}
            >
              {COST_ALLOCATION_METHODS.map((method) => (
                <option key={method} value={method}>
                  {costAllocationMethodLabels[method]}
                </option>
              ))}
            </Select>
            <FieldError message={error("costAllocationMethod")} />
          </label>
        </div>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Supply</p>
          <h2>Purchase order lines</h2>
          <p>
            Only unassigned quantities from placed purchase orders are
            available.
          </p>
        </div>
        <div className="supply-line-list">
          {lines.map((line, index) => {
            const selected = poLines.find(
              (item) => item.id === line.purchaseOrderLineId,
            );
            return (
              <div className="import-line-editor" key={line.key}>
                <span className="order-line-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <label className="field order-line-variant">
                  <span>Purchase order item</span>
                  <Select
                    name="purchaseOrderLineId"
                    value={line.purchaseOrderLineId}
                    required
                    onChange={(event) =>
                      update(line.key, {
                        purchaseOrderLineId: event.target.value,
                        quantityShipped: 1,
                      })
                    }
                  >
                    <option value="">Choose an item</option>
                    {poLines.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label} · {item.remaining} left ·{" "}
                        {formatPurchaseOrderNumber(item.purchaseOrderNumber)} ·{" "}
                        {item.supplierName}
                      </option>
                    ))}
                  </Select>
                  {selected ? (
                    <small>
                      {formatPurchaseOrderNumber(selected.purchaseOrderNumber)}{" "}
                      · {selected.sku} · maximum {selected.remaining}{" "}
                      {selected.remaining === 1 ? "unit" : "units"}
                    </small>
                  ) : null}
                </label>
                <label className="field">
                  <span>Units in shipment</span>
                  <input
                    name="quantityShipped"
                    type="number"
                    min={1}
                    max={selected?.remaining}
                    step={1}
                    required
                    value={line.quantityShipped}
                    onChange={(event) =>
                      update(line.key, {
                        quantityShipped: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={`Remove line ${index + 1}`}
                  disabled={lines.length === 1}
                  onClick={() =>
                    setLines((current) =>
                      current.filter((item) => item.key !== line.key),
                    )
                  }
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            );
          })}
          <FieldError message={error("lines")} />
          <button
            className="button button--secondary order-add-line"
            type="button"
            onClick={() =>
              setLines((current) => [
                ...current,
                {
                  key: crypto.randomUUID(),
                  purchaseOrderLineId: "",
                  quantityShipped: 1,
                },
              ])
            }
          >
            <Plus aria-hidden="true" /> Add PO item
          </button>
        </div>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Context</p>
          <h2>Notes</h2>
        </div>
        <label className="field">
          <span>Shipment notes</span>
          <textarea name="notes" rows={4} maxLength={2000} />
        </label>
      </section>
      <FormResult state={state} />
      <div className="form-actions">
        <Link className="button button--secondary" href="/imports">
          <ArrowLeft aria-hidden="true" /> Cancel
        </Link>
        <button
          className="button button--dark"
          type="submit"
          disabled={pending}
        >
          <Save aria-hidden="true" /> {pending ? "Creating…" : "Create import"}
        </button>
      </div>
    </form>
  );
}

type ShipmentCostDefaults = Record<
  | "chinaShippingMvr"
  | "internationalShippingMvr"
  | "taxFeesMvr"
  | "otherFeesMvr",
  string
> & { costAllocationMethod: CostAllocationMethodValue };

export function ShipmentCostEditor({
  action,
  defaults,
}: {
  action: (
    state: SupplyFormState,
    formData: FormData,
  ) => Promise<SupplyFormState>;
  defaults: ShipmentCostDefaults;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="button button--secondary cost-edit-action"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Pencil aria-hidden="true" /> Edit costs
      </button>
      {open ? (
        <ShipmentCostForm
          action={action}
          defaults={defaults}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function ShipmentCostForm({
  action,
  defaults,
  onClose,
}: {
  action: (
    state: SupplyFormState,
    formData: FormData,
  ) => Promise<SupplyFormState>;
  defaults: ShipmentCostDefaults;
  onClose: () => void;
}) {
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialSupplyFormState,
  );
  return (
    <ModalDialog
      titleId="shipment-cost-title"
      kicker="Actual Cost to SET25"
      title="Edit shipment costs"
      onClose={onClose}
      busy={pending}
      className="supply-editor-dialog"
    >
      <form ref={formRef} onSubmit={onSubmit}>
        <div className="dialog-body">
          <div className="form-grid">
            <MoneyField
              name="chinaShippingMvr"
              label="China Shipping"
              value={defaults.chinaShippingMvr}
              error={error("chinaShippingMvr")}
            />
            <MoneyField
              name="internationalShippingMvr"
              label="International Shipping / ICL"
              value={defaults.internationalShippingMvr}
              error={error("internationalShippingMvr")}
            />
            <MoneyField
              name="taxFeesMvr"
              label="Tax / Fees"
              value={defaults.taxFeesMvr}
              error={error("taxFeesMvr")}
            />
            <MoneyField
              name="otherFeesMvr"
              label="Other Fees"
              value={defaults.otherFeesMvr}
              error={error("otherFeesMvr")}
            />
            <label className="field">
              <span>Allocation method</span>
              <Select
                name="costAllocationMethod"
                defaultValue={defaults.costAllocationMethod}
                aria-invalid={Boolean(error("costAllocationMethod"))}
              >
                {COST_ALLOCATION_METHODS.map((method) => (
                  <option value={method} key={method}>
                    {costAllocationMethodLabels[method]}
                  </option>
                ))}
              </Select>
              <FieldError message={error("costAllocationMethod")} />
            </label>
          </div>
          <FormResult state={state} />
        </div>
        <div className="dialog-actions">
          <button
            className="button button--secondary"
            type="button"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            className="button button--dark"
            type="submit"
            disabled={pending}
          >
            <Save aria-hidden="true" /> {pending ? "Saving…" : "Save costs"}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}

function MoneyField({
  name,
  label,
  value,
  error,
}: {
  name: string;
  label: string;
  value: string;
  error?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-with-prefix">
        <span>MVR</span>
        <input
          name={name}
          inputMode="decimal"
          required
          defaultValue={value}
          aria-invalid={Boolean(error)}
        />
      </div>
      <FieldError message={error} />
    </label>
  );
}
