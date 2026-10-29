import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="People / Customers / New"
      title="New customer"
      description="Create a practical contact record for sales and preorders."
    />
  );
}
