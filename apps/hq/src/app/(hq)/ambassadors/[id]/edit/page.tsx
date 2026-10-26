import { notFound } from "next/navigation";
import { AmbassadorForm } from "@/components/ambassadors/ambassador-form";
import { PageHeader } from "@/components/page-header";
import { updateAmbassadorAction } from "@/lib/ambassadors/actions";
import { getAmbassador, toAmbassadorFormDto } from "@/lib/ambassadors/data";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const instant = false;

export const metadata = { title: "Edit ambassador" };

export default async function EditAmbassadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [, ambassador] = await Promise.all([
    requireOperationalPageAccess("/ambassadors?forbidden=write"),
    getAmbassador(id),
  ]);
  if (!ambassador) notFound();
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Company / Ambassadors / Edit"
        title={`Edit ${ambassador.name}`}
        description="Update contact details, status, and reference terms."
      />
      <AmbassadorForm
        action={updateAmbassadorAction.bind(null, id)}
        defaults={toAmbassadorFormDto(ambassador)}
        cancelHref={`/ambassadors/${id}`}
        submitLabel="Save ambassador"
      />
    </main>
  );
}
