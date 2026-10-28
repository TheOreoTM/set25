import { notFound } from "next/navigation";
import { ContentForm } from "@/components/content/content-form";
import { PageHeader } from "@/components/page-header";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { updateContentAction } from "@/lib/content/actions";
import { getContentFormOptions, getContentItem } from "@/lib/content/data";
import { maldivesDateTimeKey } from "@/lib/content/presentation";

export const metadata = { title: "Edit content" };

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [, item] = await Promise.all([
    requireOperationalPageAccess("/content?forbidden=write"),
    getContentItem(id),
  ]);
  if (!item) notFound();
  const options = await getContentFormOptions(item.ambassadorId);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Company / Content / Edit"
        title={`Edit ${item.title}`}
        description="Update the plan, copy, owner, or final post link."
      />
      <ContentForm
        action={updateContentAction.bind(null, id)}
        staff={options.staff}
        products={options.products}
        ambassadors={options.ambassadors}
        defaults={{
          title: item.title,
          platform: item.platform,
          type: item.type,
          status: item.status,
          hook: item.hook ?? "",
          caption: item.caption ?? "",
          notes: item.notes ?? "",
          publishAt: item.publishAt ? maldivesDateTimeKey(item.publishAt) : "",
          externalUrl: item.externalUrl ?? "",
          productId: item.productId ?? "",
          ambassadorId: item.ambassadorId ?? "",
          ownerId: item.ownerId ?? "",
        }}
        cancelHref={`/content/${id}`}
        submitLabel="Save content"
      />
    </main>
  );
}
