import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Commerce / Customers"
      title="Customers"
      description="People behind direct, social, preorder, and team sales."
    />
  );
}
