import { AMBASSADOR_STATUSES, type AmbassadorStatusValue } from "@set25/shared";
import { parseMaldivesDate } from "@/lib/planning/date-range";

export type AmbassadorFormState = {
  status: "idle" | "error";
  message: string;
  errors?: Record<string, string[]>;
};

export const initialAmbassadorFormState: AmbassadorFormState = {
  status: "idle",
  message: "",
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

type Errors = Record<string, string[]>;

/** Percent as a validated decimal string (0–100, two decimals), or null. */
function percent(value: string, key: string, label: string, errors: Errors) {
  if (!value) return null;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(value) || Number(value) > 100) {
    errors[key] = [`${label} must be between 0 and 100.`];
    return null;
  }
  return value;
}

function optionalDate(value: string, key: string, errors: Errors) {
  if (!value) return null;
  const date = parseMaldivesDate(value);
  if (!date) errors[key] = ["Enter a valid date."];
  return date;
}

export function normalizeDiscountCode(value: string) {
  return value.trim().toUpperCase();
}

export function validateAmbassador(formData: FormData) {
  const errors: Errors = {};
  const name = text(formData, "name");
  const team = text(formData, "team");
  const position = text(formData, "position");
  const instagramHandle = text(formData, "instagramHandle").replace(/^@+/, "");
  const phone = text(formData, "phone");
  const email = text(formData, "email").toLowerCase();
  const status = text(formData, "status") as AmbassadorStatusValue;
  const discountCode = normalizeDiscountCode(text(formData, "discountCode"));
  const notes = text(formData, "notes");

  if (name.length < 2 || name.length > 120)
    errors.name = ["Enter a name between 2 and 120 characters."];
  if (team.length > 120) errors.team = ["Keep the team under 120 characters."];
  if (position.length > 60)
    errors.position = ["Keep the position under 60 characters."];
  if (instagramHandle && !/^[A-Za-z0-9._]{1,30}$/.test(instagramHandle))
    errors.instagramHandle = ["Enter a valid Instagram handle."];
  if (phone.length > 40) errors.phone = ["Keep the phone under 40 characters."];
  if (email && !/^\S+@\S+\.\S+$/.test(email))
    errors.email = ["Enter a valid email address."];
  if (!AMBASSADOR_STATUSES.includes(status))
    errors.status = ["Choose a status."];
  if (discountCode && !/^[A-Z0-9_-]{3,30}$/.test(discountCode))
    errors.discountCode = [
      "Use 3–30 letters, numbers, dashes, or underscores.",
    ];
  const discountPercent = percent(
    text(formData, "discountPercent"),
    "discountPercent",
    "Discount",
    errors,
  );
  const commissionPercent = percent(
    text(formData, "commissionPercent"),
    "commissionPercent",
    "Commission",
    errors,
  );
  const startedAt = optionalDate(
    text(formData, "startedAt"),
    "startedAt",
    errors,
  );
  const endedAt = optionalDate(text(formData, "endedAt"), "endedAt", errors);
  if (startedAt && endedAt && endedAt < startedAt)
    errors.endedAt = ["The end date cannot be before the start date."];
  if (notes.length > 2000)
    errors.notes = ["Keep notes under 2,000 characters."];

  if (Object.keys(errors).length) return { success: false as const, errors };
  return {
    success: true as const,
    data: {
      name,
      team: team || null,
      position: position || null,
      instagramHandle: instagramHandle || null,
      phone: phone || null,
      email: email || null,
      status,
      discountCode: discountCode || null,
      discountPercent,
      commissionPercent,
      startedAt,
      endedAt,
      notes: notes || null,
    },
  };
}

export function validateProductGrant(formData: FormData) {
  const errors: Errors = {};
  const variantId = text(formData, "variantId");
  const quantityRaw = text(formData, "quantity");
  const quantity = Number(quantityRaw);
  const givenAtRaw = text(formData, "givenAt");
  const givenAt = parseMaldivesDate(givenAtRaw);
  const notes = text(formData, "notes");
  const idempotencyKey = text(formData, "idempotencyKey");
  if (!variantId) errors.variantId = ["Choose a product variant."];
  if (!/^\d+$/.test(quantityRaw) || quantity < 1 || quantity > 10000)
    errors.quantity = ["Enter a whole quantity of at least 1."];
  if (!givenAt) errors.givenAt = ["Enter the date the product was given."];
  if (notes.length > 500) errors.notes = ["Keep notes under 500 characters."];
  if (!/^[a-zA-Z0-9-]{16,100}$/.test(idempotencyKey))
    errors.form = ["This form expired. Reload the page and try again."];
  if (Object.keys(errors).length) return { success: false as const, errors };
  return {
    success: true as const,
    data: {
      variantId,
      quantity,
      givenAt: givenAt!,
      notes: notes || null,
      idempotencyKey,
    },
  };
}
