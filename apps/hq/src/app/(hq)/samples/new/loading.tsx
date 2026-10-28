import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Supply / Samples / New"
      title="New sample"
      description="Record the sample source and context before gathering evaluations."
    />
  );
}
