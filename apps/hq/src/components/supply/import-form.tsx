"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Pencil, Plus, Save, Trash2, X } from "lucide-react";
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
import { FormResult } from "./supplier-forms";

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
  const [state, formAction, pending] = useActionState(
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
    <form action={formAction} className="editor-form supply-editor">
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
            <input name="freightForwarder" required defaultValue="ICL" />
          </label>
          <label className="field">
            <span>Tracking reference</span>
            <input name="trackingReference" />
          </label>
          <label className="field">
            <span>Estimated departure</span>
            <input name="estimatedDeparture" type="date" />
          </label>
          <label className="field">
            <span>Estimated arrival</span>
            <input name="estimatedArrival" type="date" />
          </label>
          <label className="field">
            <span>Cost allocation</span>
            <select name="costAllocationMethod" defaultValue="BY_QUANTITY">
              {COST_ALLOCATION_METHODS.map((method) => (
                <option key={method} value={method}>
                  {costAllocationMethodLabels[method]}
                </option>
              ))}
            </select>
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
                <label className="field">
                  <span>Purchase order item</span>
                  <select
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
                        {formatPurchaseOrderNumber(item.purchaseOrderNumber)} ·{" "}
                        {item.supplierName} · {item.label} · {item.remaining}{" "}
                        left
                      </option>
                    ))}
                  </select>
                  {selected ? (
                    <small>
                      {selected.sku} · maximum {selected.remaining}{" "}
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
        </div>
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
        className="button button--secondary"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Pencil aria-hidden="true" /> Edit costs
      </button>
      {open ? (
        <div className="dialog-backdrop" role="presentation">
          <section
            className="dialog-panel supply-editor-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shipment-cost-title"
          >
            <div className="dialog-head">
              <div>
                <p className="kicker">Actual Cost to SET25</p>
                <h2 id="shipment-cost-title">Edit shipment costs</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="dialog-body">
              <ShipmentCostForm action={action} defaults={defaults} />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ShipmentCostForm({
  action,
  defaults,
}: {
  action: (
    state: SupplyFormState,
    formData: FormData,
  ) => Promise<SupplyFormState>;
  defaults: ShipmentCostDefaults;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialSupplyFormState,
  );
  return (
    <form action={formAction} className="supply-inline-form">
      <div className="form-grid">
        <MoneyField
          name="chinaShippingMvr"
          label="China Shipping"
          value={defaults.chinaShippingMvr}
        />
        <MoneyField
          name="internationalShippingMvr"
          label="International Shipping / ICL"
          value={defaults.internationalShippingMvr}
        />
        <MoneyField
          name="taxFeesMvr"
          label="Tax / Fees"
          value={defaults.taxFeesMvr}
        />
        <MoneyField
          name="otherFeesMvr"
          label="Other Fees"
          value={defaults.otherFeesMvr}
        />
        <label className="field">
          <span>Allocation method</span>
          <select
            name="costAllocationMethod"
            defaultValue={defaults.costAllocationMethod}
          >
            {COST_ALLOCATION_METHODS.map((method) => (
              <option value={method} key={method}>
                {costAllocationMethodLabels[method]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <FormResult state={state} />
      <button className="button button--dark" type="submit" disabled={pending}>
        <Save aria-hidden="true" /> {pending ? "Saving…" : "Save costs"}
      </button>
    </form>
  );
}

function MoneyField({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-with-prefix">
        <span>MVR</span>
        <input name={name} inputMode="decimal" required defaultValue={value} />
      </div>
    </label>
  );
}
