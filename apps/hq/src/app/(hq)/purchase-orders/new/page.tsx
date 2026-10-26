import { randomUUID } from "node:crypto";
import { PageHeader } from "@/components/page-header";
import { PurchaseOrderForm } from "@/components/supply/purchase-order-form";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { createPurchaseOrderAction } from "@/lib/supply/actions";
import { getActiveSuppliers, getSupplyProducts } from "@/lib/supply/data";
import { toSupplierOptionDto } from "@/lib/supply/dto";

export const instant = false;

export const metadata = { title: "New purchase order" };
export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string }>;
}) {
  await requireOperationalPageAccess("/purchase-orders?forbidden=write");
  const [suppliers, products, query] = await Promise.all([
    getActiveSuppliers(),
    getSupplyProducts(),
    searchParams,
  ]);
  const variants = products.flatMap((product) =>
    product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      label: `${product.code} · ${[variant.color, variant.size].filter(Boolean).join(" / ") || "Default"}`,
    })),
  );
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Purchase Orders / New"
        title="New purchase order"
        description="Create a draft first. Placing it makes remaining quantities count as Incoming."
      />
      <PurchaseOrderForm
        action={createPurchaseOrderAction}
        suppliers={suppliers.map(toSupplierOptionDto)}
        variants={variants}
        idempotencyKey={randomUUID()}
        defaults={
          query.supplier
            ? {
                supplierId: query.supplier,
                supplierReference: null,
                currency: "USD",
                exchangeRateToMvr: "15.42",
                expectedAt: "",
                notes: null,
                lines: [{ variantId: "", quantity: 1, unitCost: "0.00" }],
              }
            : undefined
        }
        cancelHref="/purchase-orders"
      />
    </main>
  );
}
