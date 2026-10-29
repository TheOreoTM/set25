import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Supply / Purchase Orders / Edit"
      title="Edit draft purchase order"
      description="Once placed, quantities and agreed prices become historical facts."
    />
  );
}
