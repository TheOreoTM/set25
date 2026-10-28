import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SupplierForm } from "@/components/supply/supplier-forms";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { updateSupplierAction } from "@/lib/supply/actions";
import { getSupplier } from "@/lib/supply/data";
import { toSupplierFormDto } from "@/lib/supply/dto";

export const metadata = { title: "Edit supplier" };
export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [, supplier] = await Promise.all([
    requireOperationalPageAccess("/suppliers?forbidden=write"),
    getSupplier(id),
  ]);
  if (!supplier) notFound();
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Suppliers / Edit"
        title={`Edit ${supplier.name}`}
        description="Historical purchase and sample records remain unchanged."
      />
      <SupplierForm
        action={updateSupplierAction.bind(null, id)}
        defaults={toSupplierFormDto(supplier)}
        cancelHref={`/suppliers/${id}`}
        submitLabel="Save supplier"
      />
    </main>
  );
}
