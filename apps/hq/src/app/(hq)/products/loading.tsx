import { ProductListSkeleton } from "@/components/catalog/product-list-skeleton";
import { PageHeader } from "@/components/page-header";

export default function LoadingProducts() {
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Commerce / Products"
        title="Products"
        description="The shared catalogue for SET25 HQ and the future Store."
      />
      <ProductListSkeleton />
    </main>
  );
}
