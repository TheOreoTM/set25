import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Commerce / Products / New"
      title="New product"
      description="Start with the shared product identity. Add variants and opening stock next."
    />
  );
}
