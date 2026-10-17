import { randomUUID } from "node:crypto";
import { getEffectivePrice } from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { OrderForm } from "@/components/commerce/order-form";
import { getOrderFormOptions } from "@/lib/commerce/data";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const instant = false;

export const metadata = { title: "New Order" };

export default async function NewOrderPage() {
  await requireOperationalPageAccess("/orders?forbidden=write");
  const { customers, teams, variants } = await getOrderFormOptions();
  return (
    <main className="page-wrap page-wrap--editor">
      <PageHeader
        eyebrow="Commerce / Orders / New"
        title="New order"
        description="Record a sale with server-calculated totals and immutable item snapshots."
      />
      <OrderForm
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
