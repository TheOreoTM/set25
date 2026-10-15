export type MoneyValue = number | string | { toString(): string };

export function formatMVR(value: MoneyValue) {
  const raw = typeof value === "number" ? value.toFixed(2) : value.toString();
  const [whole = "0", fraction = ""] = raw.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `MVR ${grouped}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type ProductStatusValue = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_CATEGORIES = [
  "KNEE_PADS",
  "ARM_SLEEVES",
  "ATHLETIC_TAPE",
  "GRIP_SOCKS",
  "OTHER",
] as const;
export type ProductCategoryValue = (typeof PRODUCT_CATEGORIES)[number];

export const INVENTORY_MOVEMENT_TYPES = [
  "OPENING_STOCK",
  "PURCHASE_RECEIVED",
  "SALE",
  "RETURN",
  "MANUAL_ADJUSTMENT",
  "DAMAGED",
  "SAMPLE",
  "GIVEAWAY",
] as const;
export type InventoryMovementTypeValue =
  (typeof INVENTORY_MOVEMENT_TYPES)[number];

export const productStatusLabels: Record<ProductStatusValue, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

export const productCategoryLabels: Record<ProductCategoryValue, string> = {
  KNEE_PADS: "Knee Pads",
  ARM_SLEEVES: "Arm Sleeves",
  ATHLETIC_TAPE: "Athletic Tape",
  GRIP_SOCKS: "Grip Socks",
  OTHER: "Other",
};

export const inventoryMovementLabels: Record<
  InventoryMovementTypeValue,
  string
> = {
  OPENING_STOCK: "Opening Stock",
  PURCHASE_RECEIVED: "Purchase Received",
  SALE: "Sale",
  RETURN: "Return",
  MANUAL_ADJUSTMENT: "Manual Adjustment",
  DAMAGED: "Damaged",
  SAMPLE: "Sample",
  GIVEAWAY: "Giveaway",
};

export type StockStatus = "HEALTHY" | "LOW" | "OUT_OF_STOCK";

export function getStockStatus(
  stockOnHand: number,
  reorderAt: number,
): StockStatus {
  if (stockOnHand <= 0) return "OUT_OF_STOCK";
  if (stockOnHand <= reorderAt) return "LOW";
  return "HEALTHY";
}

export const stockStatusLabels: Record<StockStatus, string> = {
  HEALTHY: "Healthy",
  LOW: "Low",
  OUT_OF_STOCK: "Out of Stock",
};

export function getEffectivePrice(
  retailPrice: MoneyValue,
  sellPriceOverride: MoneyValue | null | undefined,
) {
  return sellPriceOverride == null
    ? retailPrice.toString()
    : sellPriceOverride.toString();
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
