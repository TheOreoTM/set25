import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Pre-launch / Tasks"
      title="Tasks"
      description="Operational work that needs a clear owner, priority, and next state."
    />
  );
}
