import {
  FULFILMENT_STATUSES,
  ORDER_SOURCES,
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  PREORDER_STATUSES,
  TEAM_TYPES,
  type FulfilmentStatusValue,
  type OrderSourceValue,
  type PaymentMethodValue,
  type PaymentTypeValue,
  type PreorderStatusValue,
  type TeamTypeValue,
} from "@set25/shared";

export type FormErrors = Record<string, string[]>;
export type CommerceFormState = {
  status: "idle" | "error";
  message: string;
  errors?: FormErrors;
};

export const initialCommerceFormState: CommerceFormState = {
  status: "idle",
  message: "",
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function allText(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""));
}

function addError(errors: FormErrors, key: string, message: string) {
  errors[key] = [...(errors[key] ?? []), message];
}

function optional(value: string) {
  return value || null;
}

function validEmail(value: string) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function money(value: string) {
  return /^\d{1,9}(\.\d{1,2})?$/.test(value) ? value : null;
}

export function validateCustomer(formData: FormData) {
  const errors: FormErrors = {};
  const name = text(formData, "name");
  const phone = text(formData, "phone");
  const email = text(formData, "email").toLowerCase();
  const instagramHandle = text(formData, "instagramHandle").replace(/^@/, "");
  const notes = text(formData, "notes");
  if (name.length < 2 || name.length > 100)
    addError(errors, "name", "Enter a name between 2 and 100 characters.");
  if (phone.length < 5 || phone.length > 30)
    addError(
      errors,
      "phone",
      "Enter a phone number between 5 and 30 characters.",
    );
  if (!validEmail(email) || email.length > 254)
    addError(errors, "email", "Enter a valid email address or leave it blank.");
  if (instagramHandle.length > 60)
    addError(
      errors,
      "instagramHandle",
      "Keep the Instagram handle under 60 characters.",
    );
  if (notes.length > 2000)
    addError(errors, "notes", "Keep notes under 2,000 characters.");
  if (Object.keys(errors).length) return { success: false as const, errors };
  return {
    success: true as const,
    data: {
      name,
      phone,
      email: optional(email),
      instagramHandle: optional(instagramHandle),
      notes: optional(notes),
    },
  };
}

export function validateTeam(formData: FormData) {
  const errors: FormErrors = {};
  const name = text(formData, "name");
  const type = text(formData, "type") as TeamTypeValue;
  const contactName = text(formData, "contactName");
  const phone = text(formData, "phone");
  const email = text(formData, "email").toLowerCase();
  const notes = text(formData, "notes");
  if (name.length < 2 || name.length > 120)
    addError(errors, "name", "Enter a team name between 2 and 120 characters.");
  if (!TEAM_TYPES.includes(type))
    addError(errors, "type", "Choose a valid team type.");
  if (contactName.length > 100)
    addError(
      errors,
      "contactName",
      "Keep the contact name under 100 characters.",
    );
  if (phone.length > 30)
    addError(errors, "phone", "Keep the phone number under 30 characters.");
  if (!validEmail(email) || email.length > 254)
    addError(errors, "email", "Enter a valid email address or leave it blank.");
  if (notes.length > 2000)
    addError(errors, "notes", "Keep notes under 2,000 characters.");
  if (Object.keys(errors).length) return { success: false as const, errors };
  return {
    success: true as const,
    data: {
      name,
      type,
      contactName: optional(contactName),
      phone: optional(phone),
      email: optional(email),
      notes: optional(notes),
    },
  };
}

export type OrderInput = {
  customerId: string | null;
  teamId: string | null;
  source: OrderSourceValue;
  notes: string | null;
  discountAmount: string;
  deliveryFee: string;
  idempotencyKey: string;
  lines: Array<{ variantId: string; quantity: number; unitPrice: string }>;
  preorder: null | {
    depositRequired: string;
    estimatedArrival: Date | null;
    notes: string | null;
  };
};

export function validateOrder(formData: FormData, preorder: boolean) {
  const errors: FormErrors = {};
  const customerId = text(formData, "customerId");
  const teamId = text(formData, "teamId");
  const source = text(formData, "source") as OrderSourceValue;
  const notes = text(formData, "notes");
  const discountAmount = money(text(formData, "discountAmount"));
  const deliveryFee = money(text(formData, "deliveryFee"));
  const idempotencyKey = text(formData, "idempotencyKey");
  const variantIds = allText(formData, "variantId");
  const quantities = allText(formData, "quantity");
  const unitPrices = allText(formData, "unitPrice");

  if (!ORDER_SOURCES.includes(source))
    addError(errors, "source", "Choose a valid order source.");
  if (preorder && !customerId)
    addError(errors, "customerId", "Choose a customer for this preorder.");
  if (source === "TEAM" && !teamId)
    addError(errors, "teamId", "Choose a team when the order source is Team.");
  if (notes.length > 2000)
    addError(errors, "notes", "Keep notes under 2,000 characters.");
  if (discountAmount == null)
    addError(
      errors,
      "discountAmount",
      "Enter a valid discount with up to 2 decimal places.",
    );
  if (deliveryFee == null)
    addError(
      errors,
      "deliveryFee",
      "Enter a valid delivery fee with up to 2 decimal places.",
    );
  if (!/^[a-zA-Z0-9-]{16,100}$/.test(idempotencyKey))
    addError(
      errors,
      "idempotencyKey",
      "This order session expired. Reload and try again.",
    );
  if (!variantIds.length || variantIds.length > 50)
    addError(errors, "lines", "Add between 1 and 50 order lines.");
  if (new Set(variantIds).size !== variantIds.length)
    addError(
      errors,
      "lines",
      "Each variant can only appear once. Adjust its quantity instead.",
    );

  const lines = variantIds.map((variantId, index) => {
    const quantityRaw = quantities[index] ?? "";
    const quantity = Number(quantityRaw);
    const unitPrice = money(unitPrices[index] ?? "");
    if (!variantId)
      addError(errors, "lines", `Choose a variant for line ${index + 1}.`);
    if (
      !/^\d+$/.test(quantityRaw) ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 10000
    )
      addError(
        errors,
        "lines",
        `Line ${index + 1} needs a whole quantity from 1 to 10,000.`,
      );
    if (unitPrice == null)
      addError(
        errors,
        "lines",
        `Line ${index + 1} needs a valid selling price.`,
      );
    return { variantId, quantity, unitPrice: unitPrice ?? "0" };
  });

  let preorderData: OrderInput["preorder"] = null;
  if (preorder) {
    const depositRequired = money(text(formData, "depositRequired"));
    const estimatedArrivalRaw = text(formData, "estimatedArrival");
    const preorderNotes = text(formData, "preorderNotes");
    const estimatedArrival = estimatedArrivalRaw
      ? new Date(`${estimatedArrivalRaw}T00:00:00.000Z`)
      : null;
    if (depositRequired == null)
      addError(errors, "depositRequired", "Enter a valid required deposit.");
    if (estimatedArrivalRaw && Number.isNaN(estimatedArrival?.getTime()))
      addError(
        errors,
        "estimatedArrival",
        "Enter a valid estimated arrival date.",
      );
    if (preorderNotes.length > 2000)
      addError(
        errors,
        "preorderNotes",
        "Keep preorder notes under 2,000 characters.",
      );
    preorderData = {
      depositRequired: depositRequired ?? "0",
      estimatedArrival,
      notes: optional(preorderNotes),
    };
  }

  if (Object.keys(errors).length) return { success: false as const, errors };
  return {
    success: true as const,
    data: {
      customerId: optional(customerId),
      teamId: optional(teamId),
      source,
      notes: optional(notes),
      discountAmount: discountAmount!,
      deliveryFee: deliveryFee!,
      idempotencyKey,
      lines,
      preorder: preorderData,
    } satisfies OrderInput,
  };
}

export function validatePayment(formData: FormData) {
  const errors: FormErrors = {};
  const type = text(formData, "type") as PaymentTypeValue;
  const amount = money(text(formData, "amount"));
  const method = text(formData, "method") as PaymentMethodValue;
  const reference = text(formData, "reference");
  const notes = text(formData, "notes");
  const idempotencyKey = text(formData, "idempotencyKey");
  if (!PAYMENT_TYPES.includes(type))
    addError(errors, "type", "Choose payment or refund.");
  if (!amount || Number(amount) <= 0)
    addError(errors, "amount", "Enter an amount greater than zero.");
  if (!PAYMENT_METHODS.includes(method))
    addError(errors, "method", "Choose a valid payment method.");
  if (reference.length > 100)
    addError(errors, "reference", "Keep the reference under 100 characters.");
  if (notes.length > 500)
    addError(errors, "notes", "Keep notes under 500 characters.");
  if (!/^[a-zA-Z0-9-]{16,100}$/.test(idempotencyKey))
    addError(
      errors,
      "idempotencyKey",
      "This payment session expired. Reload and try again.",
    );
  if (Object.keys(errors).length) return { success: false as const, errors };
  return {
    success: true as const,
    data: {
      type,
      amount: amount!,
      method,
      reference: optional(reference),
      notes: optional(notes),
      idempotencyKey,
    },
  };
}

export function validateFulfilmentStatus(formData: FormData) {
  const status = text(formData, "status") as FulfilmentStatusValue;
  return FULFILMENT_STATUSES.includes(status) ? status : null;
}

export function validatePreorderStatus(formData: FormData) {
  const status = text(formData, "status") as PreorderStatusValue;
  return PREORDER_STATUSES.includes(status) ? status : null;
}
