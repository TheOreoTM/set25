import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Company / Content / New"
      title="New content"
      description="Capture the idea now; scheduling and posting details can follow."
    />
  );
}
