import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Supply / Purchase Orders / New"
      title="New purchase order"
      description="Create a draft first. Placing it makes remaining quantities count as Incoming."
    />
  );
}
