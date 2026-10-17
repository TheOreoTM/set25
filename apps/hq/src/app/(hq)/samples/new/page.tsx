import { PageHeader } from "@/components/page-header";
import { SampleForm } from "@/components/supply/sample-forms";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { createSampleAction } from "@/lib/supply/actions";
import { getActiveSuppliers, getSupplyProducts } from "@/lib/supply/data";

export const metadata = { title: "New Sample" };
export default async function NewSamplePage() {
  await requireOperationalPageAccess("/samples?forbidden=write");
  const [suppliers, products] = await Promise.all([
    getActiveSuppliers(),
    getSupplyProducts(),
  ]);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Samples / New"
        title="Create sample"
        description="Record the sample source and context before gathering evaluations."
      />
      <SampleForm
        action={createSampleAction}
        suppliers={suppliers}
        products={products}
      />
    </main>
  );
}
