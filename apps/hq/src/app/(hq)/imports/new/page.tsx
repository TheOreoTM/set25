import { randomUUID } from "node:crypto";
import { PageHeader } from "@/components/page-header";
import { ImportForm } from "@/components/supply/import-form";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { createImportAction } from "@/lib/supply/actions";
import { getEligiblePurchaseOrderLines } from "@/lib/supply/data";

export const instant = false;

export const metadata = { title: "New Import" };
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
        title="Create import"
        description="Consolidate available lines from one or more placed purchase orders."
      />
      {options.length ? (
        <ImportForm
          action={createImportAction}
          poLines={options}
          idempotencyKey={randomUUID()}
        />
      ) : (
        <section className="empty-state">
          <p className="kicker">Nothing ready</p>
          <h2>No placed PO quantities are available</h2>
          <p>
            Place a purchase order, or finish/cancel an existing import
            allocation first.
          </p>
        </section>
      )}
    </main>
  );
}
