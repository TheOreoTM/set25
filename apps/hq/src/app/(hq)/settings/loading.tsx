import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="detail"
      eyebrow="System / Settings"
      title="Settings"
      description="Configuration for the SET25 Store and HQ access."
    />
  );
}
