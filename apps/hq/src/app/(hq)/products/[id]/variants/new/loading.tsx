import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Commerce / Products"
      title="Add variant"
      description="Create a sellable size or colour. Opening stock is recorded separately."
    />
  );
}
