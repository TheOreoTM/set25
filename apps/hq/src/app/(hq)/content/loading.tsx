import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Pre-launch / Content"
      title="Content"
      description="SET25's production queue for Instagram and TikTok. Planning only; nothing posts automatically."
    />
  );
}
