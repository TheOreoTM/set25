import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Commerce / Orders"
      title="Orders"
      description="Sales, payment position, and fulfilment in one operational queue."
    />
  );
}
