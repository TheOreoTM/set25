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

export const TEAM_TYPES = [
  "SCHOOL",
  "CLUB",
  "ISLAND",
  "RESORT",
  "TOURNAMENT",
  "OTHER",
] as const;
export type TeamTypeValue = (typeof TEAM_TYPES)[number];
export const teamTypeLabels: Record<TeamTypeValue, string> = {
  SCHOOL: "School",
  CLUB: "Club",
  ISLAND: "Island Team",
  RESORT: "Resort",
  TOURNAMENT: "Tournament Team",
  OTHER: "Other",
};

export const ORDER_SOURCES = [
  "ONLINE",
  "INSTAGRAM",
  "WHATSAPP",
  "MANUAL",
  "TEAM",
] as const;
export type OrderSourceValue = (typeof ORDER_SOURCES)[number];
export const orderSourceLabels: Record<OrderSourceValue, string> = {
  ONLINE: "Online",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  MANUAL: "Manual",
  TEAM: "Team",
};

export const FULFILMENT_STATUSES = [
  "NEW",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;
export type FulfilmentStatusValue = (typeof FULFILMENT_STATUSES)[number];
export const fulfilmentStatusLabels: Record<FulfilmentStatusValue, string> = {
  NEW: "New",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for Delivery",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "ONLINE",
  "OTHER",
] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];
export const paymentMethodLabels: Record<PaymentMethodValue, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  ONLINE: "Online",
  OTHER: "Other",
};

export const PAYMENT_TYPES = ["PAYMENT", "REFUND"] as const;
export type PaymentTypeValue = (typeof PAYMENT_TYPES)[number];
export const paymentTypeLabels: Record<PaymentTypeValue, string> = {
  PAYMENT: "Payment",
  REFUND: "Refund",
};

export const PREORDER_STATUSES = [
  "OPEN",
  "DEPOSIT_PAID",
  "ORDERED",
  "IN_TRANSIT",
  "ARRIVED",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;
export type PreorderStatusValue = (typeof PREORDER_STATUSES)[number];
export const preorderStatusLabels: Record<PreorderStatusValue, string> = {
  OPEN: "Open",
  DEPOSIT_PAID: "Deposit Paid",
  ORDERED: "Ordered",
  IN_TRANSIT: "In Transit",
  ARRIVED: "Arrived",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export type PaymentStatus = "UNPAID" | "PART_PAID" | "PAID" | "REFUNDED";
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PART_PAID: "Part Paid",
  PAID: "Paid",
  REFUNDED: "Refunded",
};

export function getPaymentStatus(
  total: MoneyValue,
  paid: MoneyValue,
): PaymentStatus {
  const totalValue = Number(total.toString());
  const paidValue = Number(paid.toString());
  if (paidValue < 0) return "REFUNDED";
  if (paidValue <= 0) return "UNPAID";
  if (paidValue < totalValue) return "PART_PAID";
  return "PAID";
}

export function formatOrderNumber(value: number) {
  return `S25-${String(value).padStart(6, "0")}`;
}

export function formatPurchaseOrderNumber(value: number) {
  return `PO-${String(value).padStart(6, "0")}`;
}

export function formatImportNumber(value: number) {
  return `IMP-${String(value).padStart(6, "0")}`;
}

export function formatSampleNumber(value: number) {
  return `SMP-${String(value).padStart(6, "0")}`;
}

export const PURCHASE_ORDER_STATUSES = [
  "DRAFT",
  "PLACED",
  "CLOSED",
  "CANCELLED",
] as const;
export type PurchaseOrderStatusValue = (typeof PURCHASE_ORDER_STATUSES)[number];
export const purchaseOrderStatusLabels: Record<
  PurchaseOrderStatusValue,
  string
> = {
  DRAFT: "Draft",
  PLACED: "Placed",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

export const IMPORT_SHIPMENT_STATUSES = [
  "PLANNING",
  "SUPPLIER_SHIPPING",
  "CHINA_WAREHOUSE",
  "READY_TO_SHIP",
  "IN_TRANSIT",
  "MALDIVES_CUSTOMS",
  "READY_FOR_COLLECTION",
  "RECEIVED",
  "CANCELLED",
] as const;
export type ImportShipmentStatusValue =
  (typeof IMPORT_SHIPMENT_STATUSES)[number];
export const importShipmentStatusLabels: Record<
  ImportShipmentStatusValue,
  string
> = {
  PLANNING: "Planning",
  SUPPLIER_SHIPPING: "Supplier Shipping",
  CHINA_WAREHOUSE: "China Warehouse",
  READY_TO_SHIP: "Ready to Ship",
  IN_TRANSIT: "In Transit",
  MALDIVES_CUSTOMS: "Maldives Customs",
  READY_FOR_COLLECTION: "Ready for Collection",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export const COST_ALLOCATION_METHODS = [
  "BY_QUANTITY",
  "BY_PRODUCT_VALUE",
] as const;
export type CostAllocationMethodValue =
  (typeof COST_ALLOCATION_METHODS)[number];
export const costAllocationMethodLabels: Record<
  CostAllocationMethodValue,
  string
> = {
  BY_QUANTITY: "By Quantity",
  BY_PRODUCT_VALUE: "By Product Value",
};

export const SAMPLE_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "RETEST",
] as const;
export type SampleStatusValue = (typeof SAMPLE_STATUSES)[number];
export const sampleStatusLabels: Record<SampleStatusValue, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RETEST: "Retest",
};
