import {
  INVENTORY_MOVEMENT_TYPES,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  slugify,
  type InventoryMovementTypeValue,
  type ProductCategoryValue,
  type ProductStatusValue,
} from "@set25/shared";

export type FormErrors = Record<string, string[]>;
export type FormState = {
  status: "idle" | "error";
  message: string;
  errors?: FormErrors;
};

export const initialFormState: FormState = { status: "idle", message: "" };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function addError(errors: FormErrors, key: string, message: string) {
  errors[key] = [...(errors[key] ?? []), message];
}

function money(value: string, required: boolean) {
  if (!value && !required) return null;
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(value)) return undefined;
  return value;
}

export type ProductInput = {
  name: string;
  code: string;
  slug: string;
  category: ProductCategoryValue;
  shortDescription: string | null;
  description: string | null;
  retailPrice: string;
  status: ProductStatusValue;
  isPublished: boolean;
  brandLine: string | null;
};

export function validateProduct(
  formData: FormData,
):
  | { success: true; data: ProductInput }
  | { success: false; errors: FormErrors } {
  const errors: FormErrors = {};
  const name = text(formData, "name");
  const code = text(formData, "code").toUpperCase();
  const rawSlug = text(formData, "slug");
  const normalizedSlug = slugify(rawSlug || name);
  const category = text(formData, "category") as ProductCategoryValue;
  const status = text(formData, "status") as ProductStatusValue;
  const retailPrice = money(text(formData, "retailPrice"), true);
  const shortDescription = text(formData, "shortDescription");
  const description = text(formData, "description");
  const brandLine = text(formData, "brandLine");

  if (name.length < 2 || name.length > 100)
    addError(
      errors,
      "name",
      "Enter a product name between 2 and 100 characters.",
    );
  if (!/^[A-Z0-9-]{2,24}$/.test(code))
    addError(
      errors,
      "code",
      "Use 2–24 uppercase letters, numbers, or hyphens.",
    );
  if (!normalizedSlug || normalizedSlug.length > 100)
    addError(errors, "slug", "Enter a valid URL slug up to 100 characters.");
  if (!PRODUCT_CATEGORIES.includes(category))
    addError(errors, "category", "Choose a valid category.");
  if (!PRODUCT_STATUSES.includes(status))
    addError(errors, "status", "Choose a valid status.");
  if (retailPrice === undefined)
    addError(
      errors,
      "retailPrice",
      "Enter a valid MVR price with up to 2 decimal places.",
    );
  if (shortDescription.length > 180)
    addError(
      errors,
      "shortDescription",
      "Keep the short description under 180 characters.",
    );
  if (description.length > 5000)
    addError(
      errors,
      "description",
      "Keep the description under 5,000 characters.",
    );
  if (brandLine.length > 60)
    addError(errors, "brandLine", "Keep the brand line under 60 characters.");

  if (Object.keys(errors).length || retailPrice == null)
    return { success: false, errors };
  return {
    success: true,
    data: {
      name,
      code,
      slug: normalizedSlug,
      category,
      shortDescription: shortDescription || null,
      description: description || null,
      retailPrice,
      status,
      isPublished: formData.get("isPublished") === "on",
      brandLine: brandLine || null,
    },
  };
}

export type VariantInput = {
  sku: string;
  size: string | null;
  color: string | null;
  cost: string | null;
  sellPriceOverride: string | null;
  reorderAt: number;
  active: boolean;
};

export function validateVariant(
  formData: FormData,
):
  | { success: true; data: VariantInput }
  | { success: false; errors: FormErrors } {
  const errors: FormErrors = {};
  const sku = text(formData, "sku").toUpperCase();
  const size = text(formData, "size");
  const color = text(formData, "color");
  const cost = money(text(formData, "cost"), false);
  const sellPriceOverride = money(text(formData, "sellPriceOverride"), false);
  const reorderRaw = text(formData, "reorderAt");
  const reorderAt = Number(reorderRaw);

  if (!/^[A-Z0-9-]{2,40}$/.test(sku))
    addError(errors, "sku", "Use 2–40 uppercase letters, numbers, or hyphens.");
  if (!size && !color)
    addError(
      errors,
      "size",
      "Enter a size, a colour, or both so staff can identify the variant.",
    );
  if (size.length > 40)
    addError(errors, "size", "Keep the size under 40 characters.");
  if (color.length > 40)
    addError(errors, "color", "Keep the colour under 40 characters.");
  if (cost === undefined)
    addError(
      errors,
      "cost",
      "Enter a valid MVR cost with up to 2 decimal places.",
    );
  if (sellPriceOverride === undefined)
    addError(
      errors,
      "sellPriceOverride",
      "Enter a valid MVR price or leave it blank.",
    );
  if (
    !/^\d+$/.test(reorderRaw) ||
    !Number.isSafeInteger(reorderAt) ||
    reorderAt < 0 ||
    reorderAt > 1_000_000
  )
    addError(
      errors,
      "reorderAt",
      "Enter a whole reorder level from 0 to 1,000,000.",
    );

  if (Object.keys(errors).length) return { success: false, errors };
  return {
    success: true,
    data: {
      sku,
      size: size || null,
      color: color || null,
      cost: cost ?? null,
      sellPriceOverride: sellPriceOverride ?? null,
      reorderAt,
      active: formData.get("active") === "on",
    },
  };
}

export type StockDirection = "ADD" | "REMOVE";
export type StockAdjustmentInput = {
  variantId: string;
  direction: StockDirection;
  type: InventoryMovementTypeValue;
  quantity: number;
  quantityChange: number;
  notes: string;
  reference: string | null;
  idempotencyKey: string;
  returnTo: string;
};

const directionByType: Partial<
  Record<InventoryMovementTypeValue, StockDirection>
> = {
  OPENING_STOCK: "ADD",
  PURCHASE_RECEIVED: "ADD",
  RETURN: "ADD",
  SALE: "REMOVE",
  DAMAGED: "REMOVE",
  SAMPLE: "REMOVE",
  GIVEAWAY: "REMOVE",
};

export function validateStockAdjustment(
  formData: FormData,
):
  | { success: true; data: StockAdjustmentInput }
  | { success: false; errors: FormErrors } {
  const errors: FormErrors = {};
  const variantId = text(formData, "variantId");
  const direction = text(formData, "direction") as StockDirection;
  const type = text(formData, "type") as InventoryMovementTypeValue;
  const quantityRaw = text(formData, "quantity");
  const quantity = Number(quantityRaw);
  const notes = text(formData, "notes");
  const reference = text(formData, "reference");
  const idempotencyKey = text(formData, "idempotencyKey");
  const returnToRaw = text(formData, "returnTo");

  if (!variantId) addError(errors, "variantId", "Choose a variant.");
  if (direction !== "ADD" && direction !== "REMOVE")
    addError(
      errors,
      "direction",
      "Choose whether stock is being added or removed.",
    );
  if (!INVENTORY_MOVEMENT_TYPES.includes(type))
    addError(errors, "type", "Choose a valid adjustment type.");
  if (
    !/^\d+$/.test(quantityRaw) ||
    !Number.isSafeInteger(quantity) ||
    quantity <= 0 ||
    quantity > 1_000_000
  )
    addError(errors, "quantity", "Enter a whole quantity from 1 to 1,000,000.");
  if (notes.length < 3 || notes.length > 500)
    addError(
      errors,
      "notes",
      "Explain why stock changed using 3–500 characters.",
    );
  if (reference.length > 80)
    addError(errors, "reference", "Keep the reference under 80 characters.");
  if (!/^[a-zA-Z0-9-]{16,80}$/.test(idempotencyKey))
    addError(
      errors,
      "idempotencyKey",
      "This adjustment session expired. Reload and try again.",
    );
  if (directionByType[type] && directionByType[type] !== direction)
    addError(
      errors,
      "type",
      `${type.replaceAll("_", " ")} must ${directionByType[type] === "ADD" ? "add to" : "remove from"} stock.`,
    );

  if (Object.keys(errors).length) return { success: false, errors };
  return {
    success: true,
    data: {
      variantId,
      direction,
      type,
      quantity,
      quantityChange: direction === "ADD" ? quantity : -quantity,
      notes,
      reference: reference || null,
      idempotencyKey,
      returnTo:
        returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")
          ? returnToRaw
          : "/stock",
    },
  };
}

export function applyStockDelta(current: number, quantityChange: number) {
  if (!Number.isSafeInteger(quantityChange) || quantityChange === 0)
    throw new Error("Stock movement must be a non-zero whole number.");
  const next = current + quantityChange;
  if (next < 0)
    throw new Error("This adjustment would make available stock negative.");
  return next;
}
