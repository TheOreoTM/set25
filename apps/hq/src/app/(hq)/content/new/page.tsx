import { ContentForm } from "@/components/content/content-form";
import { PageHeader } from "@/components/page-header";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { createContentAction } from "@/lib/content/actions";
import { getContentFormOptions } from "@/lib/content/data";

export const metadata = { title: "New content" };

export default async function NewContentPage({
  searchParams,
}: {
  searchParams: Promise<{ ambassador?: string; product?: string }>;
}) {
  const [staff, query] = await Promise.all([
    requireOperationalPageAccess("/content?forbidden=write"),
    searchParams,
  ]);
  const options = await getContentFormOptions();
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Company / Content / New"
        title="New content"
        description="Capture the idea now; scheduling and posting details can follow."
      />
      <ContentForm
        action={createContentAction}
        staff={options.staff}
        products={options.products}
        ambassadors={options.ambassadors}
        defaults={{
          ownerId: staff.id,
          ambassadorId: options.ambassadors.some(
            (a) => a.id === query.ambassador,
          )
            ? query.ambassador
            : "",
          productId: options.products.some((p) => p.id === query.product)
            ? query.product
            : "",
        }}
        cancelHref="/content"
        submitLabel="Create content"
      />
    </main>
  );
}
