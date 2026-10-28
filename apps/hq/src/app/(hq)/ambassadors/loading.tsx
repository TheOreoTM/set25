import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Company / Ambassadors"
      title="Ambassadors"
      description="Players who represent SET25, their terms, and what they have been given."
    />
  );
}
