import { randomUUID } from "node:crypto";
import { PageHeader } from "@/components/page-header";
import { MoneyEntryForm } from "@/components/money/money-entry-form";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { createMoneyEntryAction } from "@/lib/money/actions";
import { getMoneyFormOptions } from "@/lib/money/data";
import { maldivesDateKey } from "@/lib/planning/date-range";

export const metadata = { title: "Record Money" };

export default async function NewMoneyEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string }>;
}) {
  await requireOperationalPageAccess("/money?forbidden=write");
  const [{ direction }, relatedOptions] = await Promise.all([
    searchParams,
    getMoneyFormOptions(),
  ]);
  const selectedDirection = direction === "IN" ? "IN" : "OUT";
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Company / Money / Record"
        title={
          selectedDirection === "IN" ? "Record Money In" : "Record Money Out"
        }
        description="Record an actual cash movement without changing its related operational cost facts."
      />
      <MoneyEntryForm
        action={createMoneyEntryAction}
        direction={selectedDirection}
        idempotencyKey={randomUUID()}
        occurredAt={maldivesDateKey()}
        relatedOptions={relatedOptions}
      />
    </main>
  );
}
