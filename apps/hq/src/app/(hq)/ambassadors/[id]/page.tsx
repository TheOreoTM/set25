import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import {
  ambassadorStatusLabels,
  contentPlatformLabels,
  contentStatusLabels,
  contentTypeLabels,
} from "@set25/shared";
import { GiveProductDialog } from "@/components/ambassadors/ambassador-form";
import { FileAttachmentsPanel } from "@/components/files/file-attachments-panel";
import { PageHeader } from "@/components/page-header";
import { giveProductAction } from "@/lib/ambassadors/actions";
import { getAmbassador, getGiveableVariants } from "@/lib/ambassadors/data";
import { requireStaff } from "@/lib/auth/session";
import { formatPublishAt } from "@/lib/content/presentation";
import { maldivesDateKey } from "@/lib/planning/date-range";
import { formatDate } from "@/lib/supply/presentation";

export const instant = false;

export const metadata = { title: "Ambassador" };

export default async function AmbassadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string; given?: string }>;
}) {
  const [{ id }, query, staff] = await Promise.all([
    params,
    searchParams,
    requireStaff(),
  ]);
  const canWrite = staff.role !== "STAFF";
  const [ambassador, variants] = await Promise.all([
    getAmbassador(id),
    canWrite ? getGiveableVariants() : Promise.resolve([]),
  ]);
  if (!ambassador) notFound();

  const unitsGiven = ambassador.grants.reduce(
    (sum, grant) => sum + grant.quantity,
    0,
  );
  const subtitle = [
    [ambassador.team, ambassador.position].filter(Boolean).join(" · "),
    ambassador.instagramHandle ? `@${ambassador.instagramHandle}` : "",
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <main className="page-wrap supply-detail-page">
      <PageHeader
        eyebrow="Company / Ambassadors"
        title={ambassador.name}
        titleMeta={
          <span className={`status status--${ambassador.status.toLowerCase()}`}>
            {ambassadorStatusLabels[ambassador.status]}
          </span>
        }
        description={subtitle || "Ambassador"}
      />
      <div className="detail-actions">
        <Link className="text-link back-link" href="/ambassadors">
          <ArrowLeft aria-hidden="true" /> All ambassadors
        </Link>
        {canWrite ? (
          <div>
            <Link
              className="button button--secondary"
              href={`/ambassadors/${id}/edit`}
            >
              <Pencil aria-hidden="true" /> Edit ambassador
            </Link>
            {ambassador.status !== "ENDED" ? (
              <GiveProductDialog
                action={giveProductAction.bind(null, id)}
                variants={variants}
                submissionKey={randomUUID()}
                today={maldivesDateKey()}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      {query.created || query.saved || query.given ? (
        <div className="form-message form-message--success" role="status">
          {query.given
            ? "Product given. Stock was deducted and a Giveaway movement recorded."
            : `Ambassador ${query.created ? "created" : "saved"}.`}
        </div>
      ) : null}

      <section className="supply-summary-strip" aria-label="Ambassador summary">
        <SummaryFact
          label="Discount Code"
          value={ambassador.discountCode ?? "None"}
        />
        <SummaryFact
          label="Discount"
          value={
            ambassador.discountPercent
              ? `${ambassador.discountPercent.toString()}%`
              : "—"
          }
        />
        <SummaryFact
          label="Commission"
          value={
            ambassador.commissionPercent
              ? `${ambassador.commissionPercent.toString()}%`
              : "—"
          }
        />
        <SummaryFact
          label="Started"
          value={ambassador.startedAt ? formatDate(ambassador.startedAt) : "—"}
        />
        <SummaryFact
          label="Products Given"
          value={`${unitsGiven} ${unitsGiven === 1 ? "unit" : "units"}`}
        />
      </section>

      <div className="supply-detail-grid">
        <div className="ambassador-main">
          <section className="detail-section compact-detail-section">
            <div className="detail-section-head">
              <div>
                <p className="kicker">Inventory</p>
                <h2>Products given</h2>
              </div>
            </div>
            {ambassador.grants.length ? (
              <div className="grant-list">
                {ambassador.grants.map((grant) => (
                  <article className="grant-row" key={grant.id}>
                    <time>{formatDate(grant.givenAt)}</time>
                    <span className="commerce-primary">
                      <strong>{grant.productName}</strong>
                      <small>
                        {[grant.color, grant.size]
                          .filter(Boolean)
                          .join(" / ") || "Standard"}{" "}
                        · {grant.sku}
                        {grant.notes ? ` · ${grant.notes}` : ""}
                      </small>
                    </span>
                    <span className="grant-quantity">
                      {grant.quantity} {grant.quantity === 1 ? "unit" : "units"}
                    </span>
                    <small>Given by {grant.createdBy.name}</small>
                  </article>
                ))}
              </div>
            ) : (
              <p className="file-panel-empty">No products given yet.</p>
            )}
          </section>

          <section className="detail-section compact-detail-section">
            <div className="detail-section-head">
              <div>
                <p className="kicker">Content</p>
                <h2>Featuring {ambassador.name.split(" ")[0]}</h2>
              </div>
              {canWrite ? (
                <Link
                  className="text-link"
                  href={`/content/new?ambassador=${id}`}
                >
                  Plan content
                </Link>
              ) : null}
            </div>
            {ambassador.contentItems.length ? (
              <div className="grant-list">
                {ambassador.contentItems.map((item) => (
                  <Link
                    className="grant-row grant-row--link"
                    href={`/content/${item.id}`}
                    key={item.id}
                  >
                    <time>
                      {item.publishAt
                        ? formatPublishAt(item.publishAt, false)
                        : "Unscheduled"}
                    </time>
                    <span className="commerce-primary">
                      <strong>{item.title}</strong>
                      <small>
                        {contentPlatformLabels[item.platform]} ·{" "}
                        {contentTypeLabels[item.type]}
                      </small>
                    </span>
                    <span
                      className={`status status--${item.status.toLowerCase()}`}
                    >
                      {contentStatusLabels[item.status]}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="file-panel-empty">
                No content features this ambassador yet.
              </p>
            )}
          </section>
        </div>

        <aside className="supply-side-rail">
          <section className="detail-section supply-summary-card">
            <div className="detail-section-head">
              <div>
                <p className="kicker">Contact</p>
                <h2>Relationship</h2>
              </div>
            </div>
            <dl className="rail-stat-list rail-stat-list--text">
              <TextStat label="Phone" value={ambassador.phone ?? "—"} />
              <TextStat label="Email" value={ambassador.email ?? "—"} />
              <TextStat
                label="Ended"
                value={
                  ambassador.endedAt ? formatDate(ambassador.endedAt) : "—"
                }
              />
              <TextStat label="Added By" value={ambassador.createdBy.name} />
            </dl>
            {ambassador.notes ? (
              <div className="supply-notes">
                <span>Notes</span>
                <p>{ambassador.notes}</p>
              </div>
            ) : null}
          </section>
        </aside>
      </div>

      <FileAttachmentsPanel
        staff={staff}
        target={{ type: "AMBASSADOR", id }}
        targetLabel={ambassador.name}
      />
    </main>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TextStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
