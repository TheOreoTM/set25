import "server-only";

import { db, Prisma } from "@set25/database";
import {
  CONTENT_PLATFORMS,
  CONTENT_STATUSES,
  type ContentPlatformValue,
  type ContentStatusValue,
} from "@set25/shared";
import { getTodayRange } from "@/lib/planning/date-range";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ContentFilters = {
  status?: string;
  platform?: string;
  owner?: string;
  product?: string;
  search?: string;
};

const listSelect = {
  id: true,
  title: true,
  platform: true,
  type: true,
  status: true,
  publishAt: true,
  postedAt: true,
  product: { select: { name: true, code: true } },
  ambassador: { select: { name: true } },
  owner: { select: { name: true } },
} satisfies Prisma.ContentItemSelect;

type ContentRecord = Prisma.ContentItemGetPayload<{
  select: typeof listSelect;
}>;

export type ContentRow = ReturnType<typeof toRow>;

function isOpen(status: ContentStatusValue) {
  return status !== "POSTED" && status !== "CANCELLED";
}

function toRow(item: ContentRecord, now: Date) {
  return {
    id: item.id,
    title: item.title,
    platform: item.platform,
    type: item.type,
    status: item.status,
    publishAt: item.publishAt?.toISOString() ?? null,
    postedAt: item.postedAt?.toISOString() ?? null,
    product: item.product?.name ?? null,
    ambassador: item.ambassador?.name ?? null,
    owner: item.owner?.name ?? null,
    // Planned for a time that has passed and still not posted.
    overdue:
      isOpen(item.status) && item.publishAt !== null && item.publishAt < now,
  };
}

export const CONTENT_GROUPS = [
  "Overdue",
  "Today",
  "This Week",
  "Upcoming",
  "Unscheduled",
  "Posted",
  "Cancelled",
] as const;
export type ContentGroup = (typeof CONTENT_GROUPS)[number];

/** Content for the planner, grouped around when it goes out. */
export async function getContentPlanner(filters: ContentFilters = {}) {
  const now = new Date();
  const { start: today, end: tomorrow } = getTodayRange();
  const weekEnd = new Date(today.getTime() + 7 * DAY_MS);
  const status = CONTENT_STATUSES.includes(filters.status as ContentStatusValue)
    ? (filters.status as ContentStatusValue)
    : undefined;
  const platform = CONTENT_PLATFORMS.includes(
    filters.platform as ContentPlatformValue,
  )
    ? (filters.platform as ContentPlatformValue)
    : undefined;
  const search = filters.search?.trim();

  const items = await db.contentItem.findMany({
    where: {
      status: status ?? { not: "CANCELLED" },
      // Instagram/TikTok filters include items planned for both platforms.
      ...(platform
        ? {
            platform: platform === "BOTH" ? "BOTH" : { in: [platform, "BOTH"] },
          }
        : {}),
      ownerId: filters.owner || undefined,
      productId: filters.product || undefined,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { hook: { contains: search, mode: "insensitive" } },
              { caption: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: listSelect,
    orderBy: [{ publishAt: "asc" }, { createdAt: "desc" }],
    take: 400,
  });

  const groups = new Map<ContentGroup, ContentRow[]>(
    CONTENT_GROUPS.map((group) => [group, []]),
  );
  for (const item of items) {
    const row = toRow(item, now);
    const group: ContentGroup =
      item.status === "CANCELLED"
        ? "Cancelled"
        : item.status === "POSTED"
          ? "Posted"
          : !item.publishAt
            ? "Unscheduled"
            : row.overdue
              ? "Overdue"
              : item.publishAt < tomorrow
                ? "Today"
                : item.publishAt < weekEnd
                  ? "This Week"
                  : "Upcoming";
    groups.get(group)!.push(row);
  }
  // Most recently posted first; keep the archive from swamping the planner.
  const posted = groups.get("Posted")!;
  posted.sort((a, b) => (b.postedAt ?? "").localeCompare(a.postedAt ?? ""));
  if (!status) groups.set("Posted", posted.slice(0, 20));

  const counts = await db.contentItem.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  return {
    groups: CONTENT_GROUPS.map((name) => ({
      name,
      items: groups.get(name)!,
    })).filter((group) => group.items.length),
    total: items.length,
    statusCounts: Object.fromEntries(
      counts.map((count) => [count.status, count._count._all]),
    ) as Partial<Record<ContentStatusValue, number>>,
  };
}

export function getContentItem(id: string) {
  return db.contentItem.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, code: true } },
      ambassador: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
    },
  });
}

export async function getContentFormOptions(
  includeAmbassadorId?: string | null,
) {
  const [staff, products, ambassadors] = await Promise.all([
    db.staffUser.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.product.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    db.ambassador.findMany({
      where: {
        OR: [
          { status: { not: "ENDED" } },
          ...(includeAmbassadorId ? [{ id: includeAmbassadorId }] : []),
        ],
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return {
    staff,
    products: products.map((p) => ({
      id: p.id,
      label: `${p.code} · ${p.name}`,
    })),
    ambassadors,
  };
}

/** Dashboard: overdue and soon-to-publish open content. */
export async function getDashboardContent() {
  const now = new Date();
  const { start: today } = getTodayRange();
  const soon = new Date(today.getTime() + 7 * DAY_MS);
  const items = await db.contentItem.findMany({
    where: {
      status: { notIn: ["POSTED", "CANCELLED"] },
      publishAt: { not: null, lt: soon },
    },
    select: listSelect,
    orderBy: { publishAt: "asc" },
    take: 20,
  });
  const rows = items.map((item) => toRow(item, now));
  return {
    overdue: rows.filter((row) => row.overdue),
    upcoming: rows.filter((row) => !row.overdue).slice(0, 5),
  };
}
