import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/catalog/product-form";
import { createProductAction } from "@/lib/catalog/actions";

export const metadata = { title: "New Product" };

export default function NewProductPage() {
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Products / New"
        title="Create product"
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
