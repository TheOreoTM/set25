import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import {
  contentPlatformLabels,
  contentStatusLabels,
  contentTypeLabels,
} from "@set25/shared";
import { ContentStatusActions } from "@/components/content/content-form";
import { FileAttachmentsPanel } from "@/components/files/file-attachments-panel";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { changeContentStatusAction } from "@/lib/content/actions";
import { getContentItem } from "@/lib/content/data";
import { formatPublishAt } from "@/lib/content/presentation";

export const instant = false;

export const metadata = { title: "Content" };

export default async function ContentItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string }>;
}) {
  const [{ id }, query, staff] = await Promise.all([
    params,
    searchParams,
    requireStaff(),
  ]);
  const item = await getContentItem(id);
  if (!item) notFound();
  const canWrite = staff.role !== "STAFF";
  const overdue =
    item.status !== "POSTED" &&
    item.status !== "CANCELLED" &&
    item.publishAt !== null &&
    item.publishAt < new Date();

  return (
    <main className="page-wrap supply-detail-page">
      <PageHeader
        eyebrow="Company / Content"
        title={item.title}
        titleMeta={
          <span className={`status status--${item.status.toLowerCase()}`}>
            {contentStatusLabels[item.status]}
          </span>
        }
        description={`${contentPlatformLabels[item.platform]} · ${contentTypeLabels[item.type]}`}
      />
      <div className="detail-actions">
        <Link className="text-link back-link" href="/content">
          <ArrowLeft aria-hidden="true" /> All content
        </Link>
        {canWrite ? (
          <div>
            <Link
              className="button button--secondary"
              href={`/content/${id}/edit`}
            >
              <Pencil aria-hidden="true" /> Edit
            </Link>
          </div>
        ) : null}
      </div>
      {query.created || query.saved ? (
        <div className="form-message form-message--success" role="status">
          Content {query.created ? "created" : "saved"}.
        </div>
      ) : null}
      {overdue ? (
        <div className="form-message form-message--error" role="alert">
          This was planned for {formatPublishAt(item.publishAt!)} and has not
          been marked posted.
        </div>
      ) : null}
      {canWrite ? (
        <ContentStatusActions
          action={changeContentStatusAction.bind(null, id)}
          current={item.status}
          hasPublishAt={item.publishAt !== null}
        />
      ) : null}

      <section
        className={`supply-summary-strip${item.postedAt ? " supply-summary-strip--six" : ""}`}
        aria-label="Content summary"
      >
        <SummaryFact
          label="Publish"
          value={
            item.publishAt ? formatPublishAt(item.publishAt) : "Not scheduled"
          }
        />
        {item.postedAt ? (
          <SummaryFact label="Posted" value={formatPublishAt(item.postedAt)} />
        ) : null}
        <SummaryFact label="Owner" value={item.owner?.name ?? "No owner"} />
        <SummaryFact
          label="Product"
          value={
            item.product ? (
              <Link href={`/products/${item.product.id}`}>
                {item.product.name}
              </Link>
            ) : (
              "—"
            )
          }
        />
        <SummaryFact
          label="Ambassador"
          value={
            item.ambassador ? (
              <Link href={`/ambassadors/${item.ambassador.id}`}>
                {item.ambassador.name}
              </Link>
            ) : (
              "—"
            )
          }
        />
        <SummaryFact
          label="Post Link"
          value={
            item.externalUrl ? (
              <a href={item.externalUrl} target="_blank" rel="noreferrer">
                Open post <ExternalLink aria-hidden="true" />
              </a>
            ) : (
              "—"
            )
          }
        />
      </section>

      <div className="supply-detail-grid">
        <div className="ambassador-main">
          <CopyBlock
            kicker="Hook"
            text={item.hook}
            empty="No hook written yet."
          />
          <CopyBlock
            kicker="Caption"
            text={item.caption}
            empty="No caption written yet."
          />
        </div>
        <aside className="supply-side-rail">
          <section className="detail-section supply-summary-card">
            <div className="detail-section-head">
              <div>
                <p className="kicker">Notes</p>
                <h2>Production</h2>
              </div>
            </div>
            {item.notes ? (
              <p className="content-copy">{item.notes}</p>
            ) : (
              <p className="file-panel-empty">No notes.</p>
            )}
            <dl className="rail-stat-list rail-stat-list--text">
              <div>
                <dt>Created By</dt>
                <dd>{item.createdBy.name}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <FileAttachmentsPanel
        staff={staff}
        target={{ type: "CONTENT", id }}
        targetLabel={item.title}
      />
    </main>
  );
}

function SummaryFact({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CopyBlock({
  kicker,
  text,
  empty,
}: {
  kicker: string;
  text: string | null;
  empty: string;
}) {
  return (
    <section className="detail-section compact-detail-section">
      <div className="detail-section-head">
        <div>
          <p className="kicker">{kicker}</p>
        </div>
      </div>
      {text ? (
        <p className="content-copy">{text}</p>
      ) : (
        <p className="file-panel-empty">{empty}</p>
      )}
    </section>
  );
}
