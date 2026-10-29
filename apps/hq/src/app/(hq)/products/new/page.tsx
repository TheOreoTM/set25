import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/catalog/product-form";
import { createProductAction } from "@/lib/catalog/actions";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireOperationalPageAccess();
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Products / New"
        title="New product"
        description="Start with the shared product identity. Add variants and opening stock next."
      />
      <ProductForm
        action={createProductAction}
        cancelHref="/products"
        submitLabel="Create product"
      />
    </main>
  );
}
