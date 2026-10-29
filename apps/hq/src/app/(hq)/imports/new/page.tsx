import { randomUUID } from "node:crypto";
import { PackageOpen } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ImportForm } from "@/components/supply/import-form";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { createImportAction } from "@/lib/supply/actions";
import { getEligiblePurchaseOrderLines } from "@/lib/supply/data";

export const metadata = { title: "New import" };
export default async function NewImportPage() {
  await requireOperationalPageAccess("/imports?forbidden=write");
  const lines = await getEligiblePurchaseOrderLines();
  const options = lines.map((line) => ({
    id: line.id,
    purchaseOrderNumber: line.purchaseOrder.purchaseOrderNumber,
    supplierName: line.purchaseOrder.supplier.name,
    label: `${line.productCode} · ${[line.color, line.size].filter(Boolean).join(" / ") || "Default"}`,
    sku: line.sku,
    remaining: line.remainingToShip,
  }));
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Imports / New"
        title="New import"
        description="Consolidate available lines from one or more placed purchase orders."
      />
      {options.length ? (
        <ImportForm
          action={createImportAction}
          poLines={options}
          idempotencyKey={randomUUID()}
        />
      ) : (
        <EmptyState
          kicker="Nothing ready"
          title="No placed PO quantities are available."
          description="Place a purchase order, or finish or cancel an existing import allocation first."
          icon={PackageOpen}
          action={{ href: "/purchase-orders", label: "View purchase orders" }}
        />
      )}
    </main>
  );
}
