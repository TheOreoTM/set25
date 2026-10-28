import { AmbassadorForm } from "@/components/ambassadors/ambassador-form";
import { PageHeader } from "@/components/page-header";
import { createAmbassadorAction } from "@/lib/ambassadors/actions";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const metadata = { title: "New ambassador" };

export default async function NewAmbassadorPage() {
  await requireOperationalPageAccess("/ambassadors?forbidden=write");
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Company / Ambassadors / New"
        title="New ambassador"
        description="Record the player, their terms, and how SET25 works with them."
      />
      <AmbassadorForm
        action={createAmbassadorAction}
        cancelHref="/ambassadors"
        submitLabel="Create ambassador"
      />
    </main>
  );
}
