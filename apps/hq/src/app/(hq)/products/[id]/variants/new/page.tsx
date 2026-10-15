import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { VariantForm } from "@/components/catalog/variant-form";
import { createVariantAction } from "@/lib/catalog/actions";
import { getProduct } from "@/lib/catalog/data";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export default function NewVariantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="page-wrap">
      <Suspense fallback={<div className="skeleton skeleton--detail" />}>
        <NewVariant params={params} />
      </Suspense>
    </main>
  );
}
async function NewVariant({ params }: { params: Promise<{ id: string }> }) {
  await requireOperationalPageAccess();
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  return (
    <>
      <PageHeader
        eyebrow={`Products / ${product.code} / Variants`}
        title="Add variant"
        description="Create a sellable size or colour. Opening stock is recorded separately."
      />
      <VariantForm
        action={createVariantAction.bind(null, product.id)}
        cancelHref={`/products/${product.id}`}
        basePrice={product.retailPrice.toString()}
      />
    </>
  );
}
