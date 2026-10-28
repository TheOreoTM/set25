import { PageHeader } from "@/components/page-header";
import { TeamForm } from "@/components/commerce/contact-form";
import { createTeamAction } from "@/lib/commerce/actions";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const metadata = { title: "New team" };

export default async function NewTeamPage() {
  await requireOperationalPageAccess("/teams?forbidden=write");
  return (
    <main className="page-wrap page-wrap--editor">
      <PageHeader
        eyebrow="Commerce / Teams / New"
        title="New team"
        description="Create an organisation record without replacing the individual customer contact."
      />
      <TeamForm
        action={createTeamAction}
        cancelHref="/teams"
        submitLabel="Create team"
      />
    </main>
  );
}
