import { PageHeader } from "@/components/page-header";
import { CustomerForm } from "@/components/commerce/contact-form";
import { createCustomerAction } from "@/lib/commerce/actions";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const instant = false;

export const metadata = { title: "New customer" };

export default async function NewCustomerPage() {
  await requireOperationalPageAccess("/customers?forbidden=write");
  return (
    <main className="page-wrap page-wrap--editor">
      <PageHeader
        eyebrow="Commerce / Customers / New"
        title="New customer"
        description="Create a practical contact record for sales and preorders."
      />
      <CustomerForm
        action={createCustomerAction}
        cancelHref="/customers"
        submitLabel="Create customer"
      />
    </main>
  );
}
