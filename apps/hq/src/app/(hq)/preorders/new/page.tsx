import { randomUUID } from "node:crypto";
import { getEffectivePrice } from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "@/components/commerce/order-form";
import { getOrderFormOptions } from "@/lib/commerce/data";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const instant = false;

export const metadata = { title: "New Preorder" };

export default async function NewPreorderPage() {
  await requireOperationalPageAccess("/preorders?forbidden=write");
  const { customers, teams, variants } = await getOrderFormOptions();
  return (
    <main className="page-wrap page-wrap--editor">
      <PageHeader
        eyebrow="Commerce / Preorders / New"
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
          sellPrice: getEffectivePrice(
            variant.product.retailPrice,
            variant.sellPriceOverride,
          ),
        }))}
        submissionKey={randomUUID()}
      />
    </main>
  );
}
