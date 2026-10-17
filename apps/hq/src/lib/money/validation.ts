import {
  MONEY_IN_CATEGORIES,
  MONEY_OUT_CATEGORIES,
  type MoneyCategoryValue,
  type MoneyDirectionValue,
} from "@set25/shared";
import { parseMaldivesDate } from "@/lib/planning/date-range";

export type MoneyFormState = {
  status: "idle" | "error";
  message: string;
  errors?: Record<string, string[]>;
};

export const initialMoneyFormState: MoneyFormState = {
  status: "idle",
  message: "",
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function addError(
  errors: Record<string, string[]>,
  field: string,
  message: string,
) {
  errors[field] = [...(errors[field] ?? []), message];
}

export function validateMoneyEntry(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const direction = text(formData, "direction") as MoneyDirectionValue;
  const category = text(formData, "category") as MoneyCategoryValue;
  const amount = text(formData, "amount");
  const occurredAtRaw = text(formData, "occurredAt");
  const occurredAt = parseMaldivesDate(occurredAtRaw);
  const description = text(formData, "description");
  const reference = text(formData, "reference");
  const notes = text(formData, "notes");
  const related = text(formData, "related");
  const idempotencyKey = text(formData, "idempotencyKey");

  if (!(["IN", "OUT"] as const).includes(direction))
    addError(errors, "direction", "Choose Money In or Money Out.");
  const allowed =
    direction === "IN" ? MONEY_IN_CATEGORIES : MONEY_OUT_CATEGORIES;
  if (!allowed.includes(category as never))
    addError(errors, "category", "Choose a valid category for this entry.");
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0)
    addError(errors, "amount", "Enter an amount greater than zero.");
  if (!occurredAt)
    addError(errors, "occurredAt", "Enter a valid transaction date.");
  if (description.length < 2 || description.length > 160)
    addError(
      errors,
      "description",
      "Enter a description between 2 and 160 characters.",
    );
  if (reference.length > 100)
    addError(errors, "reference", "Keep the reference under 100 characters.");
  if (notes.length > 2000)
    addError(errors, "notes", "Keep notes under 2,000 characters.");
  if (
    related &&
    !/^(SUPPLIER|PURCHASE_ORDER|IMPORT|ORDER):[^:]+$/.test(related)
  )
    addError(errors, "related", "Choose a valid related record.");
  if (!/^[a-zA-Z0-9-]{16,100}$/.test(idempotencyKey))
    addError(
      errors,
      "idempotencyKey",
      "This form session expired. Reload and try again.",
    );

  if (Object.keys(errors).length) return { success: false as const, errors };
  const [relatedType, relatedId] = related
    ? (related.split(":", 2) as [
        "SUPPLIER" | "PURCHASE_ORDER" | "IMPORT" | "ORDER",
        string,
      ])
    : [null, null];
  return {
    success: true as const,
    data: {
      direction,
      category,
      amount,
      occurredAt: occurredAt!,
      description,
      reference: reference || null,
      notes: notes || null,
      relatedType,
      relatedId,
      idempotencyKey,
    },
  };
}
