import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Supply / Imports / New"
      title="New import"
      description="Consolidate available lines from one or more placed purchase orders."
    />
  );
}
