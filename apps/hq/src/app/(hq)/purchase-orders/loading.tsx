import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Supply / Purchase Orders"
      title="Purchase Orders"
      description="Agreed supplier quantities, prices, and incoming stock."
    />
  );
}
