import {
  COST_ALLOCATION_METHODS,
  IMPORT_SHIPMENT_STATUSES,
  SAMPLE_STATUSES,
  type CostAllocationMethodValue,
  type ImportShipmentStatusValue,
  type SampleStatusValue,
} from "@set25/shared";

export type SupplyFormState = {
  status: "idle" | "error";
  message: string;
  errors?: Record<string, string[]>;
};

export const initialSupplyFormState: SupplyFormState = {
  status: "idle",
  message: "",
};

export function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function optional(value: string) {
  return value || null;
}

export function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00+05:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function validMoney(value: string, scale = 2) {
  const pattern = new RegExp(`^\\d{1,10}(?:\\.\\d{1,${scale}})?$`);
  return pattern.test(value);
}

export function validCurrency(value: string) {
  return /^[A-Z]{3}$/.test(value);
}

export function validateSupplier(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const name = field(formData, "name");
  const email = field(formData, "email");
  if (name.length < 2 || name.length > 120)
    errors.name = ["Enter a supplier name between 2 and 120 characters."];
  if (email && !/^\S+@\S+\.\S+$/.test(email))
    errors.email = ["Enter a valid email address."];
  return Object.keys(errors).length
    ? { success: false as const, errors }
    : {
        success: true as const,
        data: {
          name,
          country: optional(field(formData, "country")),
          contactName: optional(field(formData, "contactName")),
          phone: optional(field(formData, "phone")),
          email: optional(email.toLowerCase()),
          website: optional(field(formData, "website")),
          alibabaUrl: optional(field(formData, "alibabaUrl")),
          notes: optional(field(formData, "notes")),
          active: field(formData, "active") !== "false",
        },
      };
}

export function validateSupplierProduct(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const productId = field(formData, "productId");
  const currency = field(formData, "currency").toUpperCase();
  const moqRaw = field(formData, "moq");
  const sampleCost = field(formData, "sampleCost");
  const bulkUnitPrice = field(formData, "bulkUnitPrice");
  const moq = moqRaw ? Number(moqRaw) : null;
  if (!productId) errors.productId = ["Choose a SET25 product."];
  if (!validCurrency(currency))
    errors.currency = ["Use a 3-letter currency code."];
  if (moq !== null && (!Number.isInteger(moq) || moq < 1))
    errors.moq = ["MOQ must be a positive whole number."];
  if (sampleCost && !validMoney(sampleCost))
    errors.sampleCost = ["Enter a valid non-negative amount."];
  if (bulkUnitPrice && !validMoney(bulkUnitPrice, 4))
    errors.bulkUnitPrice = ["Enter a valid non-negative amount."];
  return Object.keys(errors).length
    ? { success: false as const, errors }
    : {
        success: true as const,
        data: {
          productId,
          productUrl: optional(field(formData, "productUrl")),
          supplierSku: optional(field(formData, "supplierSku")),
          moq,
          sampleCost: optional(sampleCost),
          bulkUnitPrice: optional(bulkUnitPrice),
          currency,
          notes: optional(field(formData, "notes")),
          active: true,
        },
      };
}

export function validatePurchaseOrder(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const supplierId = field(formData, "supplierId");
  const currency = field(formData, "currency").toUpperCase();
  const rate = field(formData, "exchangeRateToMvr");
  const expectedAt = parseDate(field(formData, "expectedAt"));
  const variantIds = formData.getAll("variantId").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const costs = formData.getAll("unitCost").map(String);
  if (!supplierId) errors.supplierId = ["Choose a supplier."];
  if (!validCurrency(currency))
    errors.currency = ["Use a 3-letter currency code."];
  if (!validMoney(rate, 6) || Number(rate) <= 0)
    errors.exchangeRateToMvr = ["Enter an exchange rate greater than zero."];
  if (expectedAt === undefined) errors.expectedAt = ["Enter a valid ETA."];
  if (
    !variantIds.length ||
    variantIds.length !== quantities.length ||
    variantIds.length !== costs.length
  )
    errors.lines = ["Add at least one complete purchase order line."];
  const seen = new Set<string>();
  const lines = variantIds.map((variantId, index) => {
    const quantity = Number(quantities[index]);
    const unitCost = costs[index] ?? "";
    if (!variantId || seen.has(variantId))
      errors.lines = ["Choose each variant once."];
    seen.add(variantId);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000)
      errors.lines = ["Each quantity must be a positive whole number."];
    if (!validMoney(unitCost, 4))
      errors.lines = ["Each unit cost must be valid."];
    return { variantId, quantity, unitCost };
  });
  return Object.keys(errors).length
    ? { success: false as const, errors }
    : {
        success: true as const,
        data: {
          supplierId,
          currency,
          exchangeRateToMvr: rate,
          supplierReference: optional(field(formData, "supplierReference")),
          expectedAt,
          notes: optional(field(formData, "notes")),
          idempotencyKey: field(formData, "idempotencyKey"),
          lines,
        },
      };
}

export function validateImport(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const freightForwarder = field(formData, "freightForwarder");
  const method = field(
    formData,
    "costAllocationMethod",
  ) as CostAllocationMethodValue;
  const lineIds = formData.getAll("purchaseOrderLineId").map(String);
  const quantities = formData.getAll("quantityShipped").map(String);
  if (!freightForwarder || freightForwarder.length > 120)
    errors.freightForwarder = ["Enter a freight forwarder."];
  if (!COST_ALLOCATION_METHODS.includes(method))
    errors.costAllocationMethod = ["Choose a valid allocation method."];
  if (!lineIds.length || lineIds.length !== quantities.length)
    errors.lines = ["Add at least one complete shipment line."];
  const seen = new Set<string>();
  const lines = lineIds.map((purchaseOrderLineId, index) => {
    const quantityShipped = Number(quantities[index]);
    if (!purchaseOrderLineId || seen.has(purchaseOrderLineId))
      errors.lines = ["Choose each purchase order line once."];
    seen.add(purchaseOrderLineId);
    if (!Number.isInteger(quantityShipped) || quantityShipped < 1)
      errors.lines = [
        "Every shipped quantity must be a positive whole number.",
      ];
    return { purchaseOrderLineId, quantityShipped };
  });
  const dates = {
    estimatedDeparture: parseDate(field(formData, "estimatedDeparture")),
    estimatedArrival: parseDate(field(formData, "estimatedArrival")),
  };
  if (Object.values(dates).some((date) => date === undefined))
    errors.dates = ["Enter valid shipment dates."];
  return Object.keys(errors).length
    ? { success: false as const, errors }
    : {
        success: true as const,
        data: {
          freightForwarder,
          trackingReference: optional(field(formData, "trackingReference")),
          estimatedDeparture: dates.estimatedDeparture as Date | null,
          estimatedArrival: dates.estimatedArrival as Date | null,
          costAllocationMethod: method,
          notes: optional(field(formData, "notes")),
          idempotencyKey: field(formData, "idempotencyKey"),
          lines,
        },
      };
}

export function validateShipmentCosts(formData: FormData) {
  const keys = [
    "chinaShippingMvr",
    "internationalShippingMvr",
    "taxFeesMvr",
    "otherFeesMvr",
  ] as const;
  const errors: Record<string, string[]> = {};
  const values = Object.fromEntries(
    keys.map((key) => [key, field(formData, key) || "0"]),
  ) as Record<(typeof keys)[number], string>;
  for (const key of keys)
    if (!validMoney(values[key]))
      errors[key] = ["Enter a valid non-negative MVR amount."];
  const method = field(
    formData,
    "costAllocationMethod",
  ) as CostAllocationMethodValue;
  if (!COST_ALLOCATION_METHODS.includes(method))
    errors.costAllocationMethod = ["Choose a valid allocation method."];
  return Object.keys(errors).length
    ? { success: false as const, errors }
    : {
        success: true as const,
        data: { ...values, costAllocationMethod: method },
      };
}

export function validateShipmentStatus(formData: FormData) {
  const status = field(formData, "status") as ImportShipmentStatusValue;
  return IMPORT_SHIPMENT_STATUSES.includes(status)
    ? {
        success: true as const,
        data: { status, notes: optional(field(formData, "notes")) },
      }
    : {
        success: false as const,
        errors: { status: ["Choose a valid shipment status."] },
      };
}

export function validateSample(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const supplierId = field(formData, "supplierId");
  const name = field(formData, "name");
  const sampleCost = field(formData, "sampleCost");
  const currency = field(formData, "currency").toUpperCase();
  const orderedAt = parseDate(field(formData, "orderedAt"));
  const receivedAt = parseDate(field(formData, "receivedAt"));
  if (!supplierId) errors.supplierId = ["Choose a supplier."];
  if (name.length < 2 || name.length > 160)
    errors.name = ["Enter a sample name."];
  if (sampleCost && !validMoney(sampleCost))
    errors.sampleCost = ["Enter a valid sample cost."];
  if (sampleCost && !validCurrency(currency))
    errors.currency = ["Use a 3-letter currency code."];
  if (orderedAt === undefined || receivedAt === undefined)
    errors.dates = ["Enter valid dates."];
  return Object.keys(errors).length
    ? { success: false as const, errors }
    : {
        success: true as const,
        data: {
          supplierId,
          productId: optional(field(formData, "productId")),
          variantId: optional(field(formData, "variantId")),
          name,
          sampleCost: optional(sampleCost),
          currency: sampleCost ? currency : null,
          orderedAt: orderedAt as Date | null,
          receivedAt: receivedAt as Date | null,
          notes: optional(field(formData, "notes")),
        },
      };
}

export function validateEvaluation(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const testerName = field(formData, "testerName");
  const scoreKeys = [
    "quality",
    "comfort",
    "fit",
    "protection",
    "durability",
    "branding",
    "value",
  ] as const;
  if (testerName.length < 2 || testerName.length > 120)
    errors.testerName = ["Enter the tester name."];
  const scores = Object.fromEntries(
    scoreKeys.map((key) => [key, Number(field(formData, key))]),
  ) as Record<(typeof scoreKeys)[number], number>;
  for (const key of scoreKeys)
    if (!Number.isInteger(scores[key]) || scores[key] < 1 || scores[key] > 5)
      errors[key] = ["Choose a score from 1 to 5."];
  return Object.keys(errors).length
    ? { success: false as const, errors }
    : {
        success: true as const,
        data: {
          testerName,
          ...scores,
          notes: optional(field(formData, "notes")),
        },
      };
}

export function validateSampleStatus(formData: FormData) {
  const status = field(formData, "status") as SampleStatusValue;
  return SAMPLE_STATUSES.includes(status)
    ? { success: true as const, data: status }
    : { success: false as const };
}
