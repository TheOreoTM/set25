import Link from "next/link";
import { Select } from "@/components/ui/select";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  CONTENT_PLATFORMS,
  contentPlatformLabels,
  contentStatusLabels,
  contentTypeLabels,
  type ContentStatusValue,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getContentFormOptions, getContentPlanner } from "@/lib/content/data";
import { formatPublishAt, publishTile } from "@/lib/content/presentation";

export const instant = false;

export const metadata = { title: "Content" };

type SearchParams = {
  status?: string;
  platform?: string;
  owner?: string;
  product?: string;
  search?: string;
  forbidden?: string;
};

const views: [string, string][] = [
  ["", "All"],
  ["IDEA", "Idea"],
  ["CREATING", "Creating"],
  ["READY", "Ready"],
  ["SCHEDULED", "Scheduled"],
  ["POSTED", "Posted"],
  ["CANCELLED", "Cancelled"],
];

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [staff, query] = await Promise.all([requireStaff(), searchParams]);
  const [planner, options] = await Promise.all([
    getContentPlanner(query),
    getContentFormOptions(),
  ]);
  const canWrite = staff.role !== "STAFF";
  const viewHref = (status: string) => {
    const params = new URLSearchParams();
    for (const key of ["platform", "owner", "product", "search"] as const)
      if (query[key]) params.set(key, query[key]!);
    if (status) params.set("status", status);
    const value = params.toString();
    return value ? `/content?${value}` : "/content";
  };

  return (
    <main className="page-wrap tasks-page">
      <PageHeader
        eyebrow="Company / Content"
        title="Content"
        description="SET25's production queue for Instagram and TikTok. Planning only; nothing posts automatically."
      />
      <div className="detail-actions detail-actions--end">
        {canWrite ? (
          <div>
            <Link className="button button--dark" href="/content/new">
              <Plus aria-hidden="true" /> New content
            </Link>
          </div>
        ) : null}
      </div>
      {query.forbidden === "write" ? (
        <div className="form-message form-message--error" role="alert">
          Staff access to Content is read-only.
        </div>
      ) : null}

      <section className="detail-section task-list-panel">
        <nav className="task-view-tabs" aria-label="Content status">
          {views.map(([value, label]) => {
            const count = value
              ? planner.statusCounts[value as ContentStatusValue]
              : undefined;
            return (
              <Link
                className={(query.status ?? "") === value ? "is-active" : ""}
                href={viewHref(value)}
                key={value || "all"}
              >
                {label}
                {count ? ` · ${count}` : ""}
              </Link>
            );
          })}
        </nav>
        <form action="/content" className="task-filter-bar">
          {query.status ? (
            <input type="hidden" name="status" value={query.status} />
          ) : null}
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search content</span>
            <input
              name="search"
              defaultValue={query.search ?? ""}
              placeholder="Search title, hook, or caption"
            />
          </label>
          <label className="field">
            <span className="sr-only">Platform</span>
            <Select name="platform" defaultValue={query.platform ?? ""}>
              <option value="">All platforms</option>
              {CONTENT_PLATFORMS.map((platform) => (
                <option value={platform} key={platform}>
                  {contentPlatformLabels[platform]}
                </option>
              ))}
            </Select>
          </label>
          <label className="field">
            <span className="sr-only">Owner</span>
            <Select name="owner" defaultValue={query.owner ?? ""}>
              <option value="">All owners</option>
              {options.staff.map((person) => (
                <option value={person.id} key={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="field">
            <span className="sr-only">Product</span>
            <Select name="product" defaultValue={query.product ?? ""}>
              <option value="">All products</option>
              {options.products.map((product) => (
                <option value={product.id} key={product.id}>
                  {product.label}
                </option>
              ))}
            </Select>
          </label>
          <button className="button button--secondary" type="submit">
            <SlidersHorizontal aria-hidden="true" /> Apply
          </button>
        </form>

        {planner.groups.length ? (
          planner.groups.map((group) => (
            <section
              className={`content-group${group.name === "Overdue" ? " content-group--overdue" : ""}`}
              key={group.name}
              aria-label={group.name}
            >
              <h2 className="content-group-title">
                {group.name}
                <span>{group.items.length}</span>
              </h2>
              <div className="content-list">
                {group.items.map((item) => {
                  const tile = publishTile(item.publishAt ?? item.postedAt);
                  return (
                    <Link
                      className={`content-row content-row--${item.status.toLowerCase()}${item.overdue ? " is-overdue" : ""}`}
                      href={`/content/${item.id}`}
                      key={item.id}
                    >
                      <span className="task-date">
                        <strong>{tile.day}</strong>
                        <small>{tile.month}</small>
                      </span>
                      <span className="commerce-primary">
                        <strong>{item.title}</strong>
                        <small>
                          {contentPlatformLabels[item.platform]} ·{" "}
                          {contentTypeLabels[item.type]}
                          {item.status === "POSTED" && item.postedAt
                            ? ` · Posted ${formatPublishAt(item.postedAt)}`
                            : item.publishAt
                              ? ` · ${formatPublishAt(item.publishAt)}`
                              : ""}
                        </small>
                      </span>
                      <span data-label="Product">
                        {item.product ?? item.ambassador ?? "—"}
                      </span>
                      <span data-label="Owner">{item.owner ?? "No owner"}</span>
                      <span data-label="Status">
                        <span
                          className={`status status--${item.status.toLowerCase()}`}
                        >
                          {item.overdue
                            ? "Overdue"
                            : contentStatusLabels[item.status]}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className="compact-empty">
            <div>
              <strong>No content in this view.</strong>
              <p>Change the filters or plan the next piece of content.</p>
            </div>
            {canWrite ? (
              <Link className="button button--dark" href="/content/new">
                New content
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
