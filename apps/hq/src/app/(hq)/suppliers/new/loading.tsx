import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Supply / Suppliers / New"
      title="New supplier"
      description="Add the source first; product terms and purchase orders follow."
    />
  );
}
