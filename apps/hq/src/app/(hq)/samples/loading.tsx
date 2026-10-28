import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Supply / Samples"
      title="Samples"
      description="Supplier samples, tester feedback, and product decisions."
    />
  );
}
