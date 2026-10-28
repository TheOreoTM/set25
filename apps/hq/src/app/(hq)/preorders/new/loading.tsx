import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Commerce / Preorders / New"
      title="New preorder"
      description="Use the shared order and payment foundation without touching physical stock early."
    />
  );
}
