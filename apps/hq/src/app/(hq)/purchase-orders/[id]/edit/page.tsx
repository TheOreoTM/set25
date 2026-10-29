import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PurchaseOrderForm } from "@/components/supply/purchase-order-form";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { updatePurchaseOrderAction } from "@/lib/supply/actions";
import {
  getActiveSuppliers,
  getPurchaseOrder,
  getSupplyProducts,
} from "@/lib/supply/data";
import { dateInput } from "@/lib/supply/presentation";
import { toSupplierOptionDto } from "@/lib/supply/dto";

export const metadata = { title: "Edit purchase order" };
export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [, po, suppliers, products] = await Promise.all([
    requireOperationalPageAccess("/purchase-orders?forbidden=write"),
    getPurchaseOrder(id),
    getActiveSuppliers(),
    getSupplyProducts(),
  ]);
  if (!po || po.status !== "DRAFT") notFound();
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
        eyebrow="Supply / Purchase Orders / Edit"
        title="Edit draft purchase order"
        description="Once placed, quantities and agreed prices become historical facts."
      />
      <PurchaseOrderForm
        mode="edit"
        action={updatePurchaseOrderAction.bind(null, id)}
        suppliers={suppliers.map(toSupplierOptionDto)}
        variants={variants}
        idempotencyKey={po.idempotencyKey}
        defaults={{
          supplierId: po.supplierId,
          supplierReference: po.supplierReference,
          currency: po.currency,
          exchangeRateToMvr: po.exchangeRateToMvr.toString(),
          expectedAt: dateInput(po.expectedAt),
          notes: po.notes,
          lines: po.lines.map((line) => ({
            variantId: line.variantId ?? "",
            quantity: line.quantityOrdered,
            unitCost: line.unitCost.toString(),
          })),
        }}
        cancelHref={`/purchase-orders/${id}`}
      />
    </main>
  );
}
