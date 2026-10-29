import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="detail"
      eyebrow="System / Staff access"
      title="Staff access"
      description="Owner access is required to manage SET25 staff."
    />
  );
}
