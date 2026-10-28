import { PageHeader } from "@/components/page-header";
import { SampleForm } from "@/components/supply/sample-forms";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { createSampleAction } from "@/lib/supply/actions";
import { getActiveSuppliers, getSupplyProducts } from "@/lib/supply/data";
import { toSampleProductDto, toSupplierOptionDto } from "@/lib/supply/dto";

export const metadata = { title: "New sample" };
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
        title="New sample"
        description="Record the sample source and context before gathering evaluations."
      />
      <SampleForm
        action={createSampleAction}
        suppliers={suppliers.map(toSupplierOptionDto)}
        products={products.map(toSampleProductDto)}
      />
    </main>
  );
}
