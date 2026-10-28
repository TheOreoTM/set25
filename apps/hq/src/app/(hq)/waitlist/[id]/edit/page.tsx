import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { updateWaitlistEntryAction } from "@/lib/waitlist/actions";
import { getWaitlistEntry, toWaitlistFormDto } from "@/lib/waitlist/data";
import { waitlistDisplayName } from "@/lib/waitlist/presentation";

export const metadata = { title: "Edit waitlist entry" };

export default async function EditWaitlistEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireOperationalPageAccess(`/waitlist/${id}`);
  const entry = await getWaitlistEntry(id);
  if (!entry) notFound();
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Pre-launch / Waitlist / Edit"
        title={`Edit ${waitlistDisplayName(entry)}`}
        description="Update contact details, interest, status, or Early Bird."
      />
      <WaitlistForm
        action={updateWaitlistEntryAction.bind(null, id)}
        defaults={toWaitlistFormDto(entry)}
        cancelHref={`/waitlist/${id}`}
      />
    </main>
  );
}
