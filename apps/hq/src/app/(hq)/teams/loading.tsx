import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Commerce / Teams"
      title="Teams"
      description="Schools, clubs, islands, resorts, and tournament organisations."
    />
  );
}
