import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Supply / Imports"
      title="Imports"
      description="Consolidated shipments, live logistics status, and stock receiving."
    />
  );
}
