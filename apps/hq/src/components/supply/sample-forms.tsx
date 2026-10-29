"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Link2, Plus, RotateCcw, Save, XCircle } from "lucide-react";
import { SAMPLE_STATUSES, sampleStatusLabels } from "@set25/shared";
import { initialSupplyFormState, type SupplyFormState } from "@/lib/supply/validation";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { useFormAction } from "@/components/ui/use-form-action";
import { FieldError, FormResult } from "./supplier-forms";

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
    const { formRef, state, pending, onSubmit, error } = useFormAction(action, initialSupplyFormState);
    const variants = products.flatMap((product) =>
        product.variants.map((variant) => ({
            ...variant,
            productName: product.name,
        })),
    );
    return (
        <form ref={formRef} onSubmit={onSubmit} className="editor-form">
            <section className="form-section">
                <div className="form-section-title">
                    <p className="kicker">Sample</p>
                    <h2>Product and supplier</h2>
                    <p>A sample is evaluated independently and never changes product publication or stock.</p>
                </div>
                <div className="form-grid">
                    <label className="field">
                        <span>Sample name</span>
                        <input name="name" required aria-invalid={Boolean(error("name"))} />
                        <FieldError message={error("name")} />
                    </label>
                    <label className="field">
                        <span>Supplier</span>
                        <Select
                            name="supplierId"
                            required
                            defaultValue=""
                            aria-invalid={Boolean(error("supplierId"))}
                        >
                            <option value="" disabled>
                                Choose a supplier
                            </option>
                            {suppliers.map((supplier) => (
                                <option value={supplier.id} key={supplier.id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </Select>
                        <FieldError message={error("supplierId")} />
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
                        <input
                            name="sampleCost"
                            inputMode="decimal"
                            aria-invalid={Boolean(error("sampleCost"))}
                        />
                        <FieldError message={error("sampleCost")} />
                    </label>
                    <label className="field">
                        <span>Currency</span>
                        <input
                            name="currency"
                            maxLength={3}
                            defaultValue="USD"
                            aria-invalid={Boolean(error("currency"))}
                        />
                        <FieldError message={error("currency")} />
                    </label>
                    <label className="field">
                        <span>Ordered date</span>
                        <DatePicker name="orderedAt" invalid={Boolean(error("dates"))} />
                    </label>
                    <label className="field">
                        <span>Received date</span>
                        <DatePicker name="receivedAt" invalid={Boolean(error("dates"))} />
                        <FieldError message={error("dates")} />
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
            {open ? <EvaluationDialog action={action} onClose={() => setOpen(false)} /> : null}
        </>
    );
}

function EvaluationDialog({ action, onClose }: { action: Action; onClose: () => void }) {
    const { formRef, state, pending, onSubmit, error } = useFormAction(action, initialSupplyFormState);
    const scores = ["quality", "comfort", "fit", "protection", "durability", "branding", "value"];
    return (
        <ModalDialog
            titleId="evaluation-title"
            kicker="Sample test"
            title="Add evaluation"
            onClose={onClose}
            busy={pending}
            className="supply-editor-dialog"
        >
            <form ref={formRef} onSubmit={onSubmit}>
                <div className="dialog-body">
                    <label className="field">
                        <span>Tester name</span>
                        <input name="testerName" required aria-invalid={Boolean(error("testerName"))} />
                        <FieldError message={error("testerName")} />
                    </label>
                    <div className="sample-score-grid">
                        {scores.map((score) => (
                            <label className="field" key={score}>
                                <span>{score[0].toUpperCase() + score.slice(1)}</span>
                                <Select name={score} defaultValue="5" aria-invalid={Boolean(error(score))}>
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <option value={value} key={value}>
                                            {value}
                                        </option>
                                    ))}
                                </Select>
                                <FieldError message={error(score)} />
                            </label>
                        ))}
                    </div>
                    <label className="field">
                        <span>Evaluation notes</span>
                        <textarea name="notes" rows={3} maxLength={2000} aria-invalid={Boolean(error("notes"))} />
                        <FieldError message={error("notes")} />
                    </label>
                    <FormResult state={state} />
                </div>
                <div className="dialog-actions">
                    <button className="button button--secondary" type="button" onClick={onClose} disabled={pending}>
                        Cancel
                    </button>
                    <button className="button button--dark" type="submit" disabled={pending}>
                        <Save aria-hidden="true" /> {pending ? "Saving…" : "Add evaluation"}
                    </button>
                </div>
            </form>
        </ModalDialog>
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
    const { state, pending, onSubmit } = useFormAction(action, initialSupplyFormState);
    const Icon = icon === "approve" ? Check : icon === "retest" ? RotateCcw : XCircle;
    return (
        <form onSubmit={onSubmit}>
            <input type="hidden" name="status" value={status} />
            <button
                className={icon === "reject" ? "button button--danger" : "button button--secondary"}
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
    const { state, pending, onSubmit } = useFormAction(action, initialSupplyFormState);
    return (
        <form onSubmit={onSubmit} className="compact-action-form">
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
                <Link2 aria-hidden="true" /> {pending ? "Saving…" : "Save supply link"}
            </button>
            {state.message ? <p className="field-error">{state.message}</p> : null}
        </form>
    );
}
