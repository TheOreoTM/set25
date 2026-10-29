import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="detail"
      eyebrow="Launch / Store"
      title="Store settings"
      description="Online ordering, customer contact, and delivery pricing for the public SET25 Store."
    />
  );
}
