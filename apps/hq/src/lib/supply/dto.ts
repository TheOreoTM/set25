import "server-only";

import type { getImport } from "./data";

type SupplierOptionSource = { id: string; name: string };
type SupplierDefaultsSource = SupplierOptionSource & {
  country: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  alibabaUrl: string | null;
  notes: string | null;
  active: boolean;
};
type ProductOptionSource = { id: string; name: string; code: string };
type SampleProductSource = ProductOptionSource & {
  variants: {
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
  }[];
};

export function toSupplierOptionDto(supplier: SupplierOptionSource) {
  return { id: supplier.id, name: supplier.name };
}

export function toSupplierFormDto(supplier: SupplierDefaultsSource) {
  return {
    name: supplier.name,
    country: supplier.country,
    contactName: supplier.contactName,
    phone: supplier.phone,
    email: supplier.email,
    website: supplier.website,
    alibabaUrl: supplier.alibabaUrl,
    notes: supplier.notes,
    active: supplier.active,
  };
}

export function toSupplierProductOptionDto(product: ProductOptionSource) {
  return { id: product.id, name: product.name, code: product.code };
}

export function toSampleProductDto(product: SampleProductSource) {
  return {
    id: product.id,
    name: product.name,
    code: product.code,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
    })),
  };
}

export function toReceiveShipmentDto(
  shipment: NonNullable<Awaited<ReturnType<typeof getImport>>>,
) {
  const costs = new Map(shipment.preview.lines.map((line) => [line.id, line]));
  return {
    importNumber: shipment.importNumber,
    lines: shipment.lines.map((line) => {
      const cost = costs.get(line.id)!;
      return {
        id: line.id,
        productName: line.purchaseOrderLine.productName,
        variantLabel:
          [line.purchaseOrderLine.color, line.purchaseOrderLine.size]
            .filter(Boolean)
            .join(" / ") || "Default",
        sku: line.purchaseOrderLine.sku,
        quantityShipped: line.quantityShipped,
        quantityReceived: line.quantityReceived,
        productCostMvr: cost.productCostMvr.toString(),
        allocatedSharedCostMvr: (
          line.allocatedSharedCostMvr ?? cost.allocatedSharedCostMvr
        ).toString(),
        actualUnitCostMvr: (
          line.actualUnitCostMvr ?? cost.actualUnitCostMvr
        ).toString(),
      };
    }),
  };
}

export function toSupplierTermsDto(terms: {
  productId: string;
  productUrl: string | null;
  supplierSku: string | null;
  moq: number | null;
  sampleCost: { toString(): string } | null;
  bulkUnitPrice: { toString(): string } | null;
  currency: string;
  notes: string | null;
}) {
  return {
    productId: terms.productId,
    productUrl: terms.productUrl,
    supplierSku: terms.supplierSku,
    moq: terms.moq,
    sampleCost: terms.sampleCost?.toString() ?? null,
    bulkUnitPrice: terms.bulkUnitPrice?.toString() ?? null,
    currency: terms.currency,
    notes: terms.notes,
  };
}
