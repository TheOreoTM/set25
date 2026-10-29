import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Phone } from "lucide-react";
import {
  productCategoryLabels,
  waitlistSourceLabels,
  waitlistStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import {
  CopyDmButton,
  OpenDmLink,
  ProfileLink,
  StatusPicker,
} from "@/components/waitlist/waitlist-controls";
import { requireStaff } from "@/lib/auth/session";
import { formatDate } from "@/lib/supply/presentation";
import { setWaitlistStatusAction } from "@/lib/waitlist/actions";
import { getWaitlistEntry } from "@/lib/waitlist/data";
import {
  waitlistContact,
  waitlistDisplayName,
  waitlistPlatformLabels,
  waitlistDmMessage,
  waitlistInterest,
} from "@/lib/waitlist/presentation";

export const metadata = { title: "Waitlist entry" };

export default async function WaitlistEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, query, staff] = await Promise.all([
    params,
    searchParams,
    requireStaff(),
  ]);
  const canWrite = staff.role !== "STAFF";
  const entry = await getWaitlistEntry(id);
  if (!entry) notFound();
  const message = waitlistDmMessage(entry);
  const contact = waitlistContact(entry);

  return (
    <main className="page-wrap supply-detail-page waitlist-page">
      <PageHeader
        eyebrow="Pre-launch / Waitlist"
        title={waitlistDisplayName(entry)}
        titleMeta={
          <span className={`status status--${entry.status.toLowerCase()}`}>
            {waitlistStatusLabels[entry.status]}
          </span>
        }
        description={waitlistInterest(entry) || "Products not noted yet"}
      />
      <div className="detail-actions">
        <Link className="text-link back-link" href="/waitlist">
          <ArrowLeft aria-hidden="true" /> Waitlist
        </Link>
        {canWrite ? (
          <div>
            <Link
              className="button button--secondary"
              href={`/waitlist/${id}/edit`}
            >
              <Pencil aria-hidden="true" /> Edit
            </Link>
          </div>
        ) : null}
      </div>
      {query.saved ? (
        <div className="form-message form-message--success" role="status">
          Entry saved.
        </div>
      ) : null}

      <section className="detail-section waitlist-contact">
        <div className="detail-section-head">
          <div>
            <p className="kicker">
              {contact ? waitlistPlatformLabels[contact.platform] : "Contact"}
            </p>
            <h2>Message</h2>
          </div>
        </div>
        <blockquote className="waitlist-dm-preview">{message}</blockquote>
        <div className="waitlist-actions">
          {contact ? <OpenDmLink contact={contact} message={message} /> : null}
          <CopyDmButton message={message} />
          {contact ? <ProfileLink contact={contact} /> : null}
          {entry.instagramHandle && entry.tiktokHandle ? (
            <ProfileLink
              contact={{ platform: "tiktok", handle: entry.tiktokHandle }}
            />
          ) : null}
          {entry.phone ? (
            <a
              className="button button--secondary waitlist-action"
              href={`tel:${entry.phone.replace(/\s+/g, "")}`}
            >
              <Phone aria-hidden="true" /> Call
            </a>
          ) : null}
        </div>
      </section>

      {canWrite ? (
        <section className="detail-section">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Pipeline</p>
              <h2>Status</h2>
            </div>
            <span>Since {formatDate(entry.statusChangedAt)}</span>
          </div>
          <StatusPicker
            action={setWaitlistStatusAction.bind(null, entry.id)}
            status={entry.status}
          />
        </section>
      ) : null}

      <section className="detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Record</p>
            <h2>Details</h2>
          </div>
        </div>
        <dl className="waitlist-facts">
          <Fact label="Name" value={entry.name ?? "—"} />
          <Fact
            label="Instagram"
            value={entry.instagramHandle ? `@${entry.instagramHandle}` : "—"}
          />
          <Fact
            label="TikTok"
            value={entry.tiktokHandle ? `@${entry.tiktokHandle}` : "—"}
          />
          <Fact label="Phone" value={entry.phone ?? "—"} />
          <Fact label="Source" value={waitlistSourceLabels[entry.source]} />
          <Fact
            label="Products"
            value={
              entry.interestedCategories
                .map((category) => productCategoryLabels[category])
                .join(", ") || "—"
            }
          />
          <Fact label="Sizes" value={entry.sizes.join(", ") || "—"} />
          <Fact
            label="Early Bird"
            value={
              entry.earlyBird ? (entry.earlyBirdCode ?? "Yes, no code") : "No"
            }
          />
          <Fact
            label="Added"
            value={`${formatDate(entry.createdAt)} · ${entry.createdBy.name}`}
          />
        </dl>
        {entry.notes ? (
          <p className="waitlist-notes">{entry.notes}</p>
        ) : null}
      </section>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
