import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="detail"
      eyebrow="HQ / Account"
      title="Account"
      description="Your current SET25 staff identity and access level."
    />
  );
}
