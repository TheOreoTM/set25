import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Commerce / Stock"
      title="Stock"
      description="Available inventory across every active SET25 product variant."
    />
  );
}
