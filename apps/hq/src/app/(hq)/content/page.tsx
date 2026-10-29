import Link from "next/link";
import { Select } from "@/components/ui/select";
import { ArrowRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import {
  CONTENT_PLATFORMS,
  CONTENT_STATUSES,
  contentPlatformLabels,
  contentStatusLabels,
  contentTypeLabels,
  type ContentStatusValue,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getContentFormOptions, getContentPlanner } from "@/lib/content/data";
import { formatPublishAt, publishTile } from "@/lib/content/presentation";

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
  const filterKeys = ["platform", "owner", "product", "search"] as const;
  const viewHref = (status: string) => {
    const params = new URLSearchParams();
    for (const key of filterKeys) if (query[key]) params.set(key, query[key]!);
    if (status) params.set("status", status);
    const value = params.toString();
    return value ? `/content?${value}` : "/content";
  };
  // Clearing keeps the status tab; the tabs are views, not filters.
  const filtered = filterKeys.some((key) => query[key]);
  const shown = planner.groups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );
  const activeStatusLabel = CONTENT_STATUSES.includes(
    query.status as ContentStatusValue,
  )
    ? contentStatusLabels[query.status as ContentStatusValue]
    : undefined;
  const statusCount = (status: ContentStatusValue) =>
    planner.statusCounts[status] ?? 0;
  // "All" leaves cancelled pieces out, so its count does too.
  const allCount = CONTENT_STATUSES.filter(
    (status) => status !== "CANCELLED",
  ).reduce((sum, status) => sum + statusCount(status), 0);

  return (
    <main className="page-wrap tasks-page">
      <PageHeader
        eyebrow="Pre-launch / Content"
        title="Content"
        description="SET25's production queue for Instagram and TikTok. Planning only; nothing posts automatically."
      />
      {query.forbidden === "write" ? (
        <div className="form-message form-message--error" role="alert">
          Staff access to Content is read-only.
        </div>
      ) : null}
      <div className="resource-toolbar">
        <form action="/content" className="filter-bar commerce-filter-bar">
          {query.status ? (
            <input type="hidden" name="status" value={query.status} />
          ) : null}
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search content</span>
            <input
              name="search"
              defaultValue={query.search ?? ""}
              placeholder="Title, hook or caption"
            />
          </label>
          <label>
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
          <label>
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
          <label>
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
          <button
            className="button button--secondary filter-submit"
            type="submit"
          >
            <SlidersHorizontal aria-hidden="true" /> Apply
          </button>
        </form>
        {canWrite ? (
          <Link className="button button--dark" href="/content/new">
            <Plus aria-hidden="true" /> New content
          </Link>
        ) : null}
      </div>

      <section
        className="resource-panel queue-panel"
        aria-labelledby="content-title"
      >
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Production queue</p>
            <h2 id="content-title">
              {activeStatusLabel ?? "All content"} · {shown}
            </h2>
          </div>
          {filtered ? (
            <Link className="text-link" href={viewHref(query.status ?? "")}>
              Clear filters
            </Link>
          ) : null}
        </div>
        <nav className="task-view-tabs" aria-label="Content status">
          {views.map(([value, label]) => (
            <Link
              className={(query.status ?? "") === value ? "is-active" : ""}
              aria-current={(query.status ?? "") === value ? "page" : undefined}
              href={viewHref(value)}
              key={value || "all"}
            >
              {label}{" "}
              <span>
                {value ? statusCount(value as ContentStatusValue) : allCount}
              </span>
            </Link>
          ))}
        </nav>

        {planner.groups.length ? (
          <>
            <div className="content-row content-row--head" aria-hidden="true">
              <span>Date</span>
              <span>Content</span>
              <span>Product</span>
              <span>Owner</span>
              <span>Status</span>
            </div>
            {planner.groups.map((group) => (
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
                          {/* Product and owner fold in here when their
                            columns drop out (below 1100px). */}
                          <small className="content-row-extra">
                            {item.product ?? item.ambassador ?? "No product"} ·{" "}
                            {item.owner ?? "No owner"}
                          </small>
                        </span>
                        <span data-label="Product">
                          {item.product ?? item.ambassador ?? "—"}
                        </span>
                        <span data-label="Owner">
                          {item.owner ?? "No owner"}
                        </span>
                        <span data-label="Status">
                          <span
                            className={`status status--${item.status.toLowerCase()}`}
                          >
                            {contentStatusLabels[item.status]}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        ) : (
          <div className="inline-empty">
            <p>
              {filtered
                ? "No content matches these filters."
                : "No content in this view."}
            </p>
            {filtered ? (
              <Link href={viewHref(query.status ?? "")}>
                Clear filters <ArrowRight aria-hidden="true" />
              </Link>
            ) : canWrite ? (
              <Link href="/content/new">
                Plan the next piece of content <ArrowRight aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
