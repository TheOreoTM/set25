import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Pre-launch / Tasks / Edit"
      title="Edit task"
    />
  );
}
