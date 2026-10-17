import Link from "next/link";
import { ArrowRight, Plus, Search } from "lucide-react";
import { teamTypeLabels } from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { getTeams } from "@/lib/commerce/data";
import { requireStaff } from "@/lib/auth/session";

export const instant = false;

export const metadata = { title: "Teams" };

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const [teams, staff] = await Promise.all([getTeams(search), requireStaff()]);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Commerce / Teams"
        title="Teams"
        description="Schools, clubs, islands, resorts, and tournament organisations."
      />
      <div className="resource-toolbar">
        <form className="filter-bar filter-bar--search-only">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search teams</span>
            <input
              name="search"
              defaultValue={search}
              placeholder="Search team, contact, or phone"
            />
          </label>
          <button className="button button--secondary" type="submit">
            Search
          </button>
        </form>
        {staff.role !== "STAFF" ? (
          <Link className="button button--dark" href="/teams/new">
            <Plus aria-hidden="true" /> New team
          </Link>
        ) : null}
      </div>
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Organisations</p>
            <h2>
              {teams.length} {teams.length === 1 ? "team" : "teams"}
            </h2>
          </div>
          <p>Flexible order relationships</p>
        </div>
        {teams.length ? (
          <div className="commerce-list commerce-list--teams">
            <div className="commerce-row commerce-row--head">
              <span>Team</span>
              <span>Type</span>
              <span>Contact</span>
              <span>Orders</span>
              <span />
            </div>
            {teams.map((team) => (
              <Link
                className="commerce-row"
                href={`/teams/${team.id}`}
                key={team.id}
              >
                <span className="commerce-primary">
                  <strong>{team.name}</strong>
                  <small>{team.phone ?? "No phone recorded"}</small>
                </span>
                <span data-label="Type">{teamTypeLabels[team.type]}</span>
                <span data-label="Contact">{team.contactName ?? "—"}</span>
                <span data-label="Orders">
                  <strong>{team._count.orders}</strong>
                </span>
                <span className="catalog-arrow">
                  <ArrowRight aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No teams found.</p>
            {staff.role !== "STAFF" ? (
              <Link href="/teams/new">
                Create the first team <ArrowRight aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
