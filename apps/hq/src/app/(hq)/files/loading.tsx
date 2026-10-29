import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Company / Files"
      title="Files"
      description="Private SET25 documents and assets. Access is checked on every open."
    />
  );
}
