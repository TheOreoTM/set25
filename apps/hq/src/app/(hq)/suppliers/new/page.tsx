import { PageHeader } from "@/components/page-header";
import { SupplierForm } from "@/components/supply/supplier-forms";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { createSupplierAction } from "@/lib/supply/actions";

export const metadata = { title: "New supplier" };
export default async function NewSupplierPage() {
  await requireOperationalPageAccess("/suppliers?forbidden=write");
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Suppliers / New"
        title="New supplier"
        description="Add the source first; product terms and purchase orders follow."
      />
      <SupplierForm
        action={createSupplierAction}
        cancelHref="/suppliers"
        submitLabel="Create supplier"
      />
    </main>
  );
}
