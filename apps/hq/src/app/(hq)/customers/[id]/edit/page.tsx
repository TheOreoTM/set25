import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "@/components/commerce/contact-form";
import { updateCustomerAction } from "@/lib/commerce/actions";
import { getCustomer } from "@/lib/commerce/data";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const metadata = { title: "Edit customer" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOperationalPageAccess("/customers?forbidden=write");
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  return (
    <main className="page-wrap page-wrap--editor">
      <PageHeader
        eyebrow="People / Customers / Edit"
        title={`Edit ${customer.name}`}
        description="Update contact details without changing order history."
      />
      <CustomerForm
        action={updateCustomerAction.bind(null, id)}
        defaults={customer}
        cancelHref={`/customers/${id}`}
        submitLabel="Save customer"
      />
    </main>
  );
}
