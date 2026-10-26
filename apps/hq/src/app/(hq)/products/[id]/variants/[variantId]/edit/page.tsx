import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { VariantForm } from "@/components/catalog/variant-form";
import { updateVariantAction } from "@/lib/catalog/actions";
import { getVariant } from "@/lib/catalog/data";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const instant = false;

export default function EditVariantPage({
  params,
}: {
  params: Promise<{ id: string; variantId: string }>;
}) {
  return (
    <main className="page-wrap">
      <Suspense fallback={<div className="skeleton skeleton--detail" />}>
        <EditVariant params={params} />
      </Suspense>
    </main>
  );
}
async function EditVariant({
  params,
}: {
  params: Promise<{ id: string; variantId: string }>;
}) {
  await requireOperationalPageAccess();
  const { id, variantId } = await params;
  const variant = await getVariant(id, variantId);
  if (!variant) notFound();
  return (
    <>
      <PageHeader
        eyebrow={`Commerce / Products / ${variant.product.code} / ${variant.sku}`}
        title="Edit variant"
        description="Update variant details. Stock remains protected by movement records."
      />
      <VariantForm
        action={updateVariantAction.bind(null, id, variantId)}
        cancelHref={`/products/${id}`}
        basePrice={variant.product.retailPrice.toString()}
        defaults={{
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          cost: variant.cost?.toString(),
          sellPriceOverride: variant.sellPriceOverride?.toString(),
          reorderAt: variant.reorderAt,
          active: variant.active,
        }}
      />
    </>
  );
}
