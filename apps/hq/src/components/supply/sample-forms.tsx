"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, Check, Plus, RotateCcw, Save, X, XCircle } from "lucide-react";
import { SAMPLE_STATUSES, sampleStatusLabels } from "@set25/shared";
import { initialSupplyFormState, type SupplyFormState } from "@/lib/supply/validation";
import { FormResult } from "./supplier-forms";

type Action = (state: SupplyFormState, formData: FormData) => Promise<SupplyFormState>;

export function SampleForm({
    action,
    suppliers,
    products,
}: {
    action: Action;
    suppliers: { id: string; name: string }[];
    products: {
        id: string;
        name: string;
        code: string;
        variants: {
            id: string;
            sku: string;
            size: string | null;
            color: string | null;
        }[];
    }[];
}) {
    const [state, formAction, pending] = useActionState(action, initialSupplyFormState);
    const variants = products.flatMap((product) =>
        product.variants.map((variant) => ({
            ...variant,
            productName: product.name,
        })),
    );
    return (
        <form action={formAction} className="editor-form">
            <section className="form-section">
                <div className="form-section-title">
                    <p className="kicker">Sample</p>
                    <h2>Product and supplier</h2>
                    <p>A sample is evaluated independently and never changes product publication or stock.</p>
                </div>
                <div className="form-grid">
                    <label className="field">
                        <span>Sample name</span>
                        <input name="name" required />
                    </label>
                    <label className="field">
                        <span>Supplier</span>
                        <Select name="supplierId" required defaultValue="">
                            <option value="" disabled>
                                Choose a supplier
                            </option>
                            {suppliers.map((supplier) => (
                                <option value={supplier.id} key={supplier.id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </Select>
                    </label>
                    <label className="field">
                        <span>Related product</span>
                        <Select name="productId" defaultValue="">
                            <option value="">Not linked</option>
                            {products.map((product) => (
                                <option value={product.id} key={product.id}>
                                    {product.code} · {product.name}
                                </option>
                            ))}
                        </Select>
                    </label>
                    <label className="field">
                        <span>Related variant</span>
                        <Select name="variantId" defaultValue="">
                            <option value="">Not linked</option>
                            {variants.map((variant) => (
                                <option value={variant.id} key={variant.id}>
                                    {variant.productName} ·{" "}
                                    {[variant.color, variant.size].filter(Boolean).join(" / ") || variant.sku}
                                </option>
                            ))}
                        </Select>
                    </label>
                    <label className="field">
                        <span>Sample cost</span>
                        <input name="sampleCost" inputMode="decimal" />
                    </label>
                    <label className="field">
                        <span>Currency</span>
                        <input name="currency" maxLength={3} defaultValue="USD" />
                    </label>
                    <label className="field">
                        <span>Ordered date</span>
                        <DatePicker name="orderedAt" />
                    </label>
                    <label className="field">
                        <span>Received date</span>
                        <DatePicker name="receivedAt" />
                    </label>
                </div>
            </section>
            <section className="form-section">
                <div className="form-section-title">
                    <p className="kicker">Context</p>
                    <h2>Notes</h2>
                </div>
                <label className="field">
                    <span>Sample notes</span>
                    <textarea name="notes" rows={5} maxLength={2000} />
                </label>
            </section>
            <FormResult state={state} />
            <div className="form-actions">
                <Link className="button button--secondary" href="/samples">
                    <ArrowLeft aria-hidden="true" /> Cancel
                </Link>
                <button className="button button--dark" type="submit" disabled={pending}>
                    <Save aria-hidden="true" /> {pending ? "Creating…" : "Create sample"}
                </button>
            </div>
        </form>
    );
}

export function EvaluationEditor({ action }: { action: Action }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button className="button button--dark" type="button" onClick={() => setOpen(true)}>
                <Plus aria-hidden="true" /> Add evaluation
            </button>
            {open ? (
                <div className="dialog-backdrop" role="presentation">
                    <section
                        className="dialog-panel supply-editor-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="evaluation-title"
                    >
                        <div className="dialog-head">
                            <div>
                                <p className="kicker">Sample test</p>
                                <h2 id="evaluation-title">Add evaluation</h2>
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
                            <EvaluationForm action={action} />
                        </div>
                    </section>
                </div>
            ) : null}
        </>
    );
}

function EvaluationForm({ action }: { action: Action }) {
    const [state, formAction, pending] = useActionState(action, initialSupplyFormState);
    const scores = ["quality", "comfort", "fit", "protection", "durability", "branding", "value"];
    return (
        <form action={formAction} className="supply-inline-form">
            <label className="field">
                <span>Tester name</span>
                <input name="testerName" required />
            </label>
            <div className="sample-score-grid">
                {scores.map((score) => (
                    <label className="field" key={score}>
                        <span>{score[0].toUpperCase() + score.slice(1)}</span>
                        <Select name={score} defaultValue="5">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <option value={value} key={value}>
                                    {value}
                                </option>
                            ))}
                        </Select>
                    </label>
                ))}
            </div>
            <label className="field">
                <span>Evaluation notes</span>
                <textarea name="notes" rows={3} maxLength={2000} />
            </label>
            <FormResult state={state} />
            <button className="button button--dark" type="submit" disabled={pending}>
                <Save aria-hidden="true" /> {pending ? "Saving…" : "Add evaluation"}
            </button>
        </form>
    );
}

export function SampleDecisionActions({ action, current }: { action: Action; current: string }) {
    return (
        <div
            className="sample-decision-actions"
            aria-label={`Current sample status: ${sampleStatusLabels[current as keyof typeof sampleStatusLabels] ?? current}`}
        >
            {current !== "APPROVED" ? (
                <DecisionButton action={action} status="APPROVED" label="Approve" icon="approve" />
            ) : null}
            {current !== "RETEST" ? (
                <DecisionButton action={action} status="RETEST" label="Retest" icon="retest" />
            ) : null}
            {current !== "REJECTED" ? (
                <DecisionButton action={action} status="REJECTED" label="Reject" icon="reject" />
            ) : null}
        </div>
    );
}

function DecisionButton({
    action,
    status,
    label,
    icon,
}: {
    action: Action;
    status: (typeof SAMPLE_STATUSES)[number];
    label: string;
    icon: "approve" | "retest" | "reject";
}) {
    const [state, formAction, pending] = useActionState(action, initialSupplyFormState);
    const Icon = icon === "approve" ? Check : icon === "retest" ? RotateCcw : XCircle;
    return (
        <form action={formAction}>
            <input type="hidden" name="status" value={status} />
            <button
                className={
                    icon === "reject"
                        ? "button button--danger-solid"
                        : icon === "approve"
                          ? "button button--dark"
                          : "button button--secondary"
                }
                type="submit"
                disabled={pending}
            >
                <Icon aria-hidden="true" /> {pending ? "Saving…" : label}
            </button>
            {state.message ? (
                <span className="field-error" role="alert">
                    {state.message}
                </span>
            ) : null}
        </form>
    );
}

export function PreorderSupplyForm({
    action,
    purchaseOrders,
    current,
}: {
    action: Action;
    purchaseOrders: { id: string; label: string }[];
    current?: string | null;
}) {
    const [state, formAction, pending] = useActionState(action, initialSupplyFormState);
    return (
        <form action={formAction} className="compact-action-form">
            <label className="field">
                <span>Purchase order</span>
                <Select name="purchaseOrderId" defaultValue={current ?? ""}>
                    <option value="">Not linked</option>
                    {purchaseOrders.map((po) => (
                        <option value={po.id} key={po.id}>
                            {po.label}
                        </option>
                    ))}
                </Select>
            </label>
            <button className="button button--secondary" type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save supply link"}
            </button>
            {state.message ? <p className="field-error">{state.message}</p> : null}
        </form>
    );
}
