import assert from "node:assert/strict";
import test from "node:test";
import { getEffectivePrice, getStockStatus } from "@set25/shared";
import {
  applyStockDelta,
  validateProduct,
  validateStockAdjustment,
  validateVariant,
} from "./validation";

function productForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  Object.entries({
    name: "SET25 CORE",
    code: "CORE",
    slug: "set25-core",
    category: "KNEE_PADS",
    shortDescription: "Performance Knee Pads",
    description: "Built for volleyball.",
    retailPrice: "599.00",
    status: "ACTIVE",
    ...overrides,
  }).forEach(([key, value]) => form.set(key, value));
  return form;
}

function variantForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  Object.entries({
    sku: "CORE-BLK-M",
    size: "M",
    color: "Black",
    cost: "240.00",
    sellPriceOverride: "",
    reorderAt: "8",
    active: "on",
    ...overrides,
  }).forEach(([key, value]) => form.set(key, value));
  return form;
}

function stockForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  Object.entries({
    variantId: "variant-1",
    direction: "ADD",
    type: "OPENING_STOCK",
    quantity: "20",
    notes: "Demo opening stock",
    reference: "TEST",
    idempotencyKey: "stock-adjustment-test-key-0001",
    returnTo: "/stock",
    ...overrides,
  }).forEach(([key, value]) => form.set(key, value));
  return form;
}

test("validates creating and editing a product without requiring variants", () => {
  const created = validateProduct(productForm());
  assert.equal(created.success, true);
  if (created.success) {
    assert.equal(created.data.slug, "set25-core");
    assert.equal(created.data.retailPrice, "599.00");
  }
  const edited = validateProduct(
    productForm({ name: "SET25 CORE 2", retailPrice: "649" }),
  );
  assert.equal(edited.success, true);
});

test("validates variants and supports multiple SKUs", () => {
  assert.equal(validateVariant(variantForm()).success, true);
  assert.equal(
    validateVariant(variantForm({ sku: "CORE-BLK-L", size: "L" })).success,
    true,
  );
  assert.equal(validateVariant(variantForm({ sku: "bad sku" })).success, false);
});

test("uses a variant override only when present", () => {
  assert.equal(getEffectivePrice("599.00", null), "599.00");
  assert.equal(getEffectivePrice("599.00", "649.00"), "649.00");
});

test("reports healthy, low, and out-of-stock thresholds", () => {
  assert.equal(getStockStatus(12, 8), "HEALTHY");
  assert.equal(getStockStatus(8, 8), "LOW");
  assert.equal(getStockStatus(0, 8), "OUT_OF_STOCK");
});

test("validates opening stock and damaged removal", () => {
  const opening = validateStockAdjustment(stockForm());
  assert.equal(opening.success, true);
  if (opening.success) assert.equal(opening.data.quantityChange, 20);
  const damaged = validateStockAdjustment(
    stockForm({
      direction: "REMOVE",
      type: "DAMAGED",
      quantity: "2",
      notes: "Damaged during handling",
    }),
  );
  assert.equal(damaged.success, true);
  if (damaged.success) assert.equal(damaged.data.quantityChange, -2);
});

test("rejects invalid adjustments and negative stock", () => {
  assert.equal(
    validateStockAdjustment(stockForm({ quantity: "0" })).success,
    false,
  );
  assert.equal(
    validateStockAdjustment(stockForm({ direction: "ADD", type: "DAMAGED" }))
      .success,
    false,
  );
  assert.throws(() => applyStockDelta(1, -2), /negative/);
});

test("an idempotency key applies an adjustment only once", () => {
  const keys = new Set<string>();
  let stock = 4;
  const result = validateStockAdjustment(stockForm({ quantity: "3" }));
  assert.equal(result.success, true);
  if (!result.success) return;
  for (let submission = 0; submission < 2; submission += 1) {
    if (keys.has(result.data.idempotencyKey)) continue;
    stock = applyStockDelta(stock, result.data.quantityChange);
    keys.add(result.data.idempotencyKey);
  }
  assert.equal(stock, 7);
  assert.equal(keys.size, 1);
});
