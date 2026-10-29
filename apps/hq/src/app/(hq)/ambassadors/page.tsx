import Link from "next/link";
import { Select } from "@/components/ui/select";
import { ArrowRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import { AMBASSADOR_STATUSES, ambassadorStatusLabels } from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { getAmbassadors } from "@/lib/ambassadors/data";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Ambassadors" };

export default async function AmbassadorsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    forbidden?: string;
  }>;
}) {
  const [staff, query] = await Promise.all([requireStaff(), searchParams]);
  const ambassadors = await getAmbassadors(query);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="People / Ambassadors"
        title="Ambassadors"
        description="Players who represent SET25, their terms, and what they have been given."
      />
      {query.forbidden === "write" ? (
        <div className="form-message form-message--error" role="alert">
          Staff access to Ambassadors is read-only.
        </div>
      ) : null}
      <div className="resource-toolbar">
        <form className="filter-bar filter-bar--single" action="/ambassadors">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search ambassadors</span>
            <input
              name="search"
              defaultValue={query.search ?? ""}
              placeholder="Name, team, Instagram, or code"
            />
          </label>
          <label>
            <span className="sr-only">Status</span>
            <Select name="status" defaultValue={query.status ?? ""}>
              <option value="">All statuses</option>
              {AMBASSADOR_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {ambassadorStatusLabels[status]}
                </option>
              ))}
            </Select>
          </label>
          <button
            className="button button--secondary filter-submit"
            type="submit"
          >
            <SlidersHorizontal aria-hidden="true" /> Apply
          </button>
        </form>
        {staff.role !== "STAFF" ? (
          <Link className="button button--dark" href="/ambassadors/new">
            <Plus aria-hidden="true" /> New ambassador
          </Link>
        ) : null}
      </div>
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Representatives</p>
            <h2>
              {ambassadors.length}{" "}
              {ambassadors.length === 1 ? "ambassador" : "ambassadors"}
            </h2>
          </div>
          <p>Active first</p>
        </div>
        {ambassadors.length ? (
          <div className="supply-list">
            <div className="supply-row supply-row--ambassador supply-row--head">
              <span>Ambassador</span>
              <span>Team</span>
              <span>Instagram</span>
              <span>Discount Code</span>
              <span>Status</span>
              <span />
            </div>
            {ambassadors.map((ambassador) => (
              <Link
                className="supply-row supply-row--ambassador"
                href={`/ambassadors/${ambassador.id}`}
                key={ambassador.id}
              >
                <span className="commerce-primary">
                  <strong>{ambassador.name}</strong>
                  <small>
                    {ambassador.position ?? "Position not recorded"}
                  </small>
                </span>
                <span
                  data-label="Team"
                  className={ambassador.team ? undefined : "is-empty"}
                >
                  {ambassador.team ?? "—"}
                </span>
                <span
                  data-label="Instagram"
                  className={
                    ambassador.instagramHandle ? undefined : "is-empty"
                  }
                >
                  {ambassador.instagramHandle
                    ? `@${ambassador.instagramHandle}`
                    : "—"}
                </span>
                <span
                  data-label="Discount Code"
                  className={ambassador.discountCode ? undefined : "is-empty"}
                >
                  {ambassador.discountCode ?? "—"}
                </span>
                <span data-label="Status" className="row-status">
                  <span
                    className={`status status--${ambassador.status.toLowerCase()}`}
                  >
                    {ambassadorStatusLabels[ambassador.status]}
                  </span>
                </span>
                <span className="catalog-arrow">
                  <ArrowRight aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            {query.search || query.status ? (
              <>
                <p>
                  {query.search
                    ? `No ambassadors match "${query.search}".`
                    : "No ambassadors match these filters."}
                </p>
                <Link href="/ambassadors">
                  {query.status ? "Clear filters" : "Clear search"}{" "}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p>No ambassadors yet.</p>
                {staff.role !== "STAFF" ? (
                  <Link href="/ambassadors/new">
                    Add the first ambassador <ArrowRight aria-hidden="true" />
                  </Link>
                ) : null}
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
