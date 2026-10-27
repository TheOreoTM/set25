export type MoneyValue = number | string | { toString(): string };

export function formatMoney(value: MoneyValue, currency: string) {
  const raw = typeof value === "number" ? value.toFixed(2) : value.toString();
  const [whole = "0", fraction = ""] = raw.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${currency} ${grouped}.${fraction.padEnd(2, "0").slice(0, 2)}`;
}

export function formatMVR(value: MoneyValue) {
  return formatMoney(value, "MVR");
}

/** Currencies a manual Money entry can be entered in; totals stay MVR. */
export const MONEY_ENTRY_CURRENCIES = ["MVR", "USD"] as const;
export type MoneyEntryCurrencyValue = (typeof MONEY_ENTRY_CURRENCIES)[number];
export const DEFAULT_USD_TO_MVR_RATE = "15.42";

/** Staff sign-in names: 3–32 lowercase letters, digits, dots, underscores, or
 * hyphens, starting with a letter or digit. Mirrors the database check. */
export const STAFF_USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export function normalizeStaffUsername(value: string) {
  return value.trim().toLowerCase();
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
  OUT_OF_STOCK: "Out of stock",
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

export const MONEY_DIRECTIONS = ["IN", "OUT"] as const;
export type MoneyDirectionValue = (typeof MONEY_DIRECTIONS)[number];
export const moneyDirectionLabels: Record<MoneyDirectionValue, string> = {
  IN: "Money In",
  OUT: "Money Out",
};

export const MONEY_IN_CATEGORIES = [
  "OWNER_FUNDING",
  "OTHER_INCOME",
  "REFUND_RECEIVED",
] as const;
export const MONEY_OUT_CATEGORIES = [
  "SUPPLIER_PAYMENT",
  "CHINA_SHIPPING",
  "INTERNATIONAL_SHIPPING",
  "TAX_FEES",
  "PACKAGING",
  "MARKETING",
  "DELIVERY",
  "SOFTWARE",
  "EQUIPMENT",
  "OTHER",
] as const;
export const MONEY_CATEGORIES = [
  ...MONEY_IN_CATEGORIES,
  ...MONEY_OUT_CATEGORIES,
] as const;
export type MoneyCategoryValue = (typeof MONEY_CATEGORIES)[number];
export const moneyCategoryLabels: Record<MoneyCategoryValue, string> = {
  OWNER_FUNDING: "Owner Funding",
  OTHER_INCOME: "Other Income",
  REFUND_RECEIVED: "Refund Received",
  SUPPLIER_PAYMENT: "Supplier Payment",
  CHINA_SHIPPING: "China Shipping",
  INTERNATIONAL_SHIPPING: "International Shipping / ICL",
  TAX_FEES: "Tax / Customs",
  PACKAGING: "Packaging",
  MARKETING: "Marketing",
  DELIVERY: "Delivery",
  SOFTWARE: "Software",
  EQUIPMENT: "Equipment",
  OTHER: "Other",
};

export const OPERATING_EXPENSE_CATEGORIES = [
  "PACKAGING",
  "MARKETING",
  "DELIVERY",
  "SOFTWARE",
  "OTHER",
] as const satisfies readonly MoneyCategoryValue[];

export const TASK_STATUSES = ["TODO", "DOING", "WAITING", "DONE"] as const;
export type TaskStatusValue = (typeof TASK_STATUSES)[number];
export const taskStatusLabels: Record<TaskStatusValue, string> = {
  TODO: "To Do",
  DOING: "Doing",
  WAITING: "Waiting",
  DONE: "Done",
};

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskPriorityValue = (typeof TASK_PRIORITIES)[number];
export const taskPriorityLabels: Record<TaskPriorityValue, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const TASK_RELATED_TYPES = [
  "ORDER",
  "PURCHASE_ORDER",
  "IMPORT",
  "SUPPLIER",
  "SAMPLE",
  "CUSTOMER",
  "TEAM",
] as const;
export type TaskRelatedTypeValue = (typeof TASK_RELATED_TYPES)[number];
export const taskRelatedTypeLabels: Record<TaskRelatedTypeValue, string> = {
  ORDER: "Order / Preorder",
  PURCHASE_ORDER: "Purchase Order",
  IMPORT: "Import",
  SUPPLIER: "Supplier",
  SAMPLE: "Sample",
  CUSTOMER: "Customer",
  TEAM: "Team",
};

export const AMBASSADOR_STATUSES = [
  "PROSPECT",
  "ACTIVE",
  "PAUSED",
  "ENDED",
] as const;
export type AmbassadorStatusValue = (typeof AMBASSADOR_STATUSES)[number];
export const ambassadorStatusLabels: Record<AmbassadorStatusValue, string> = {
  PROSPECT: "Prospect",
  ACTIVE: "Active",
  PAUSED: "Paused",
  ENDED: "Ended",
};

export const CONTENT_PLATFORMS = ["INSTAGRAM", "TIKTOK", "BOTH"] as const;
export type ContentPlatformValue = (typeof CONTENT_PLATFORMS)[number];
export const contentPlatformLabels: Record<ContentPlatformValue, string> = {
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  BOTH: "Instagram + TikTok",
};

export const CONTENT_TYPES = [
  "REEL",
  "POST",
  "CAROUSEL",
  "STORY",
  "PHOTO",
  "OTHER",
] as const;
export type ContentTypeValue = (typeof CONTENT_TYPES)[number];
export const contentTypeLabels: Record<ContentTypeValue, string> = {
  REEL: "Reel",
  POST: "Post",
  CAROUSEL: "Carousel",
  STORY: "Story",
  PHOTO: "Photo",
  OTHER: "Other",
};

export const CONTENT_STATUSES = [
  "IDEA",
  "CREATING",
  "READY",
  "SCHEDULED",
  "POSTED",
  "CANCELLED",
] as const;
export type ContentStatusValue = (typeof CONTENT_STATUSES)[number];
export const contentStatusLabels: Record<ContentStatusValue, string> = {
  IDEA: "Idea",
  CREATING: "Creating",
  READY: "Ready",
  SCHEDULED: "Scheduled",
  POSTED: "Posted",
  CANCELLED: "Cancelled",
};

export const FILE_ACCESS_LEVELS = [
  "ALL_STAFF",
  "MANAGER_AND_OWNER",
  "OWNER_ONLY",
] as const;
export type FileAccessLevelValue = (typeof FILE_ACCESS_LEVELS)[number];
export const fileAccessLevelLabels: Record<FileAccessLevelValue, string> = {
  ALL_STAFF: "All Staff",
  MANAGER_AND_OWNER: "Managers & Owner",
  OWNER_ONLY: "Owner Only",
};

export const FILE_RETENTION_POLICIES = ["PERMANENT", "UNTIL_DATE"] as const;
export type FileRetentionPolicyValue = (typeof FILE_RETENTION_POLICIES)[number];
export const fileRetentionPolicyLabels: Record<
  FileRetentionPolicyValue,
  string
> = {
  PERMANENT: "Permanent",
  UNTIL_DATE: "Until date",
};

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Deterministic phone matching key: digits only, without a leading 00 or the
 * Maldives 960 country code. Must match the backfill in the store_checkout
 * migration.
 */
export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^00/, "");
  return digits.length === 10 && digits.startsWith("960")
    ? digits.slice(3)
    : digits;
}

export const CHECKOUT_PAYMENT_METHODS = [
  "BANK_TRANSFER",
  "CASH_ON_DELIVERY",
] as const;
export type CheckoutPaymentMethodValue =
  (typeof CHECKOUT_PAYMENT_METHODS)[number];
export const checkoutPaymentMethodLabels: Record<
  CheckoutPaymentMethodValue,
  string
> = {
  BANK_TRANSFER: "Bank Transfer",
  CASH_ON_DELIVERY: "Cash on Delivery",
};

export const STOCK_RESERVATION_STATUSES = [
  "ACTIVE",
  "RELEASED",
  "CONSUMED",
] as const;
export type StockReservationStatusValue =
  (typeof STOCK_RESERVATION_STATUSES)[number];
export const stockReservationStatusLabels: Record<
  StockReservationStatusValue,
  string
> = {
  ACTIVE: "Reserved",
  RELEASED: "Released",
  CONSUMED: "Consumed",
};

export type DiscountSourceValue = "MANUAL" | "AMBASSADOR_CODE";
export const discountSourceLabels: Record<DiscountSourceValue, string> = {
  MANUAL: "Manual",
  AMBASSADOR_CODE: "Ambassador code",
};

/** Customer-facing availability. Exact quantities are never published. */
export type PublicAvailability = "IN_STOCK" | "LOW_STOCK" | "SOLD_OUT";
export const LOW_STOCK_THRESHOLD = 3;
export function getPublicAvailability(available: number): PublicAvailability {
  if (available <= 0) return "SOLD_OUT";
  if (available <= LOW_STOCK_THRESHOLD) return "LOW_STOCK";
  return "IN_STOCK";
}
export const publicAvailabilityLabels: Record<PublicAvailability, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  SOLD_OUT: "Sold Out",
};
