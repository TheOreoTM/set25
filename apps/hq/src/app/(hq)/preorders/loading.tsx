import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Commerce / Preorders"
      title="Preorders"
      description="Deposits, balances, arrival expectations, and customer readiness."
    />
  );
}
