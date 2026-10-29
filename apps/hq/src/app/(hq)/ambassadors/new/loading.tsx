import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="People / Ambassadors / New"
      title="New ambassador"
      description="Record the player, their terms, and how SET25 works with them."
    />
  );
}
