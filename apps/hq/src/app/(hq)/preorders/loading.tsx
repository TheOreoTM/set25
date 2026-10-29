import { PageSkeleton } from "@/components/page-skeleton";

export default function Loading() {
  return (
    <PageSkeleton
      kind="list"
      eyebrow="Launch / Preorders"
      title="Preorders"
      description="Deposits, balances, arrival expectations, and customer readiness."
    />
  );
}
