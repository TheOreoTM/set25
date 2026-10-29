import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Company / Money"
      title="Money"
      description="Recorded cash movement and operational profitability—not a bank balance or formal accounting statement."
    />
  );
}
