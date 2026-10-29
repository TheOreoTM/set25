import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Supply / Products"
      title="Edit variant"
      description="Update variant details. Stock remains protected by movement records."
    />
  );
}
