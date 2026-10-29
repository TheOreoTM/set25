import { randomUUID } from "node:crypto";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "@/components/commerce/order-form";
import { getOrderFormOptions } from "@/lib/commerce/data";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const metadata = { title: "New preorder" };

export default async function NewPreorderPage() {
  await requireOperationalPageAccess("/preorders?forbidden=write");
  const { customers, teams, variants } = await getOrderFormOptions();
  return (
    <main className="page-wrap page-wrap--editor">
      <PageHeader
        eyebrow="Launch / Preorders / New"
        title="New preorder"
        description="Use the shared order and payment foundation without touching physical stock early."
      />
      <OrderForm
        preorder
        customers={customers.map(({ id, name }) => ({ id, name }))}
        teams={teams.map(({ id, name }) => ({ id, name }))}
        variants={variants.map((variant) => ({
          id: variant.id,
          productName: variant.product.name,
          label:
            [variant.color, variant.size].filter(Boolean).join(" / ") ||
            "Standard",
          sku: variant.sku,
          stockOnHand: variant.stockOnHand,
          // The effective price, with cents, as the editable line default.
          sellPrice: (
            variant.sellPriceOverride ?? variant.product.retailPrice
          ).toFixed(2),
        }))}
        submissionKey={randomUUID()}
      />
    </main>
  );
}
