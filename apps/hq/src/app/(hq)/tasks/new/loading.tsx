import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Company / Tasks / New"
      title="New task"
      description="Plan one clear piece of operational work and connect it to the relevant SET25 record."
    />
  );
}
