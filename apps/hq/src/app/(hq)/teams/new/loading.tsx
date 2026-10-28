import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="form"
      eyebrow="Commerce / Teams / New"
      title="New team"
      description="Create an organisation record without replacing the individual customer contact."
    />
  );
}
