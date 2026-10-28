import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Commerce / Orders / New"
      title="New order"
      description="Record a sale with server-calculated totals and immutable item snapshots."
    />
  );
}
