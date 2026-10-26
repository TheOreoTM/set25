import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/catalog/product-form";
import { updateProductAction } from "@/lib/catalog/actions";
import { getProduct } from "@/lib/catalog/data";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const instant = false;

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="page-wrap">
      <Suspense fallback={<div className="skeleton skeleton--detail" />}>
        <EditProduct params={params} />
      </Suspense>
    </main>
  );
}

async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireOperationalPageAccess();
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const action = updateProductAction.bind(null, product.id);
  return (
    <>
      <PageHeader
        eyebrow={`Commerce / Products / ${product.code} / Edit`}
        title={`Edit ${product.name}`}
        description="Update shared catalogue details without changing stock."
      />
      <ProductForm
        action={action}
        cancelHref={`/products/${product.id}`}
        submitLabel="Save product"
        defaults={{
          name: product.name,
          code: product.code,
          slug: product.slug,
          category: product.category,
          shortDescription: product.shortDescription,
          description: product.description,
          retailPrice: product.retailPrice.toString(),
          status: product.status,
          isPublished: product.isPublished,
          brandLine: product.brandLine,
        }}
      />
    </>
  );
}
