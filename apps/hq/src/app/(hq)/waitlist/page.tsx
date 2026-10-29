import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import {
  WAITLIST_STATUSES,
  waitlistSourceLabels,
  waitlistStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import {
  CopyDmButton,
  NextStatusButton,
  OpenDmLink,
} from "@/components/waitlist/waitlist-controls";
import { WaitlistQuickAdd } from "@/components/waitlist/waitlist-form";
import { requireStaff } from "@/lib/auth/session";
import { formatDate } from "@/lib/supply/presentation";
import {
  createWaitlistEntryAction,
  setWaitlistStatusAction,
} from "@/lib/waitlist/actions";
import { getWaitlist } from "@/lib/waitlist/data";
import {
  waitlistContact,
  waitlistDisplayName,
  waitlistDmMessage,
  waitlistInterest,
} from "@/lib/waitlist/presentation";

export const metadata = { title: "Waitlist" };

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const [staff, query] = await Promise.all([requireStaff(), searchParams]);
  const canWrite = staff.role !== "STAFF";
  const { entries, counts, status } = await getWaitlist(query);
  const total = WAITLIST_STATUSES.reduce(
    (sum, value) => sum + counts[value],
    0,
  );
  const search = query.search?.trim() ?? "";
  const tabHref = (value?: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (value) params.set("status", value);
    const string = params.toString();
    return string ? `/waitlist?${string}` : "/waitlist";
  };

  return (
    <main className="page-wrap waitlist-page">
      <PageHeader
        eyebrow="Pre-launch / Waitlist"
        title="Waitlist"
        description="People waiting for the first drop. Contact stays in Instagram and TikTok DMs."
      />
      <div className="resource-toolbar">
        <form
          className="filter-bar filter-bar--search-only"
          action="/waitlist"
          role="search"
        >
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search the waitlist</span>
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Handle, name, phone, or code"
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="search"
            />
          </label>
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <button
            className="button button--secondary filter-submit"
            type="submit"
          >
            <SlidersHorizontal aria-hidden="true" /> Apply
          </button>
        </form>
      </div>
      <nav className="status-tabs" aria-label="Filter by status">
        <Link
          href={tabHref()}
          aria-current={!status ? "page" : undefined}
          className={!status ? "is-active" : undefined}
        >
          All <span>{total}</span>
        </Link>
        {WAITLIST_STATUSES.map((value) => (
          <Link
            href={tabHref(value)}
            key={value}
            aria-current={status === value ? "page" : undefined}
            className={status === value ? "is-active" : undefined}
          >
            {waitlistStatusLabels[value]} <span>{counts[value]}</span>
          </Link>
        ))}
      </nav>

      {canWrite ? (
        <WaitlistQuickAdd action={createWaitlistEntryAction} />
      ) : null}

      <section className="resource-panel" aria-labelledby="waitlist-title">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">
              {status ? waitlistStatusLabels[status] : "Everyone"}
            </p>
            <h2 id="waitlist-title">
              {entries.length} {entries.length === 1 ? "person" : "people"}
            </h2>
          </div>
          {entries.length ? <p>Newest first</p> : null}
        </div>
        {entries.length ? (
          <ul
            className={`waitlist-list${canWrite ? "" : " waitlist-list--read-only"}`}
          >
            {entries.map((entry) => {
              const message = waitlistDmMessage(entry);
              const contact = waitlistContact(entry);
              const interest = waitlistInterest(entry);
              return (
                <li className="waitlist-row" key={entry.id}>
                  <Link
                    className="waitlist-row-main"
                    href={`/waitlist/${entry.id}`}
                  >
                    <strong>{waitlistDisplayName(entry)}</strong>
                    <small>
                      {[
                        contact ? entry.name : null,
                        waitlistSourceLabels[entry.source],
                        formatDate(entry.createdAt),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                    <span>{interest || "Products not noted yet"}</span>
                  </Link>
                  <span className="waitlist-row-status">
                    <span
                      className={`status status--${entry.status.toLowerCase()}`}
                    >
                      {waitlistStatusLabels[entry.status]}
                    </span>
                    {entry.earlyBird ? (
                      <span className="status status--volt">
                        {entry.earlyBirdCode ?? "Early Bird"}
                      </span>
                    ) : null}
                  </span>
                  <span className="waitlist-actions">
                    {contact ? (
                      <OpenDmLink
                        contact={contact}
                        message={message}
                        compact
                      />
                    ) : null}
                    <CopyDmButton message={message} compact />
                    {canWrite ? (
                      <NextStatusButton
                        action={setWaitlistStatusAction.bind(null, entry.id)}
                        status={entry.status}
                      />
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="inline-empty">
            <p>
              {search || status
                ? "Nobody matches these filters."
                : "Nobody is on the waitlist yet."}
            </p>
            {search || status ? (
              <Link href="/waitlist">
                Show everyone <ArrowRight aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
