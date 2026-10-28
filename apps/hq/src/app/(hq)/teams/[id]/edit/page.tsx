import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TeamForm } from "@/components/commerce/contact-form";
import { updateTeamAction } from "@/lib/commerce/actions";
import { getTeam } from "@/lib/commerce/data";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const metadata = { title: "Edit team" };

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOperationalPageAccess("/teams?forbidden=write");
  const { id } = await params;
  const team = await getTeam(id);
  if (!team) notFound();
  return (
    <main className="page-wrap page-wrap--editor">
      <PageHeader
        eyebrow="Commerce / Teams / Edit"
        title={`Edit ${team.name}`}
        description="Update organisation details without changing order history."
      />
      <TeamForm
        action={updateTeamAction.bind(null, id)}
        defaults={team}
        cancelHref={`/teams/${id}`}
        submitLabel="Save team"
      />
    </main>
  );
}
