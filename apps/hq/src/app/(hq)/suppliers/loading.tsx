import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Supply / Suppliers"
      title="Suppliers"
      description="Contacts, product links, and practical buying terms."
    />
  );
}
