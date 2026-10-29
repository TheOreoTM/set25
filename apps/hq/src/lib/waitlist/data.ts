import "server-only";

import { db, type Prisma } from "@set25/database";
import {
  WAITLIST_STATUSES,
  type WaitlistStatusValue,
} from "@set25/shared";
import { getTodayRange } from "@/lib/planning/date-range";
import {
  normalizeInstagramHandle,
  normalizeTikTokHandle,
} from "./validation";

const DAY_MS = 24 * 60 * 60 * 1000;

export type WaitlistFilters = { search?: string; status?: string };

const listSelect = {
  id: true,
  instagramHandle: true,
  tiktokHandle: true,
  name: true,
  phone: true,
  source: true,
  interestedCategories: true,
  sizes: true,
  status: true,
  earlyBird: true,
  earlyBirdCode: true,
  createdAt: true,
} satisfies Prisma.WaitlistEntrySelect;

export async function getWaitlist(filters: WaitlistFilters = {}) {
  const search = filters.search?.trim();
  const handle = search ? normalizeInstagramHandle(search) : "";
  const tiktokHandle = search ? normalizeTikTokHandle(search) : "";
  const status = WAITLIST_STATUSES.includes(
    filters.status as WaitlistStatusValue,
  )
    ? (filters.status as WaitlistStatusValue)
    : undefined;
  const where: Prisma.WaitlistEntryWhereInput = search
    ? {
        OR: [
          ...(handle
            ? [{ instagramHandle: { contains: handle } }]
            : []),
          ...(tiktokHandle
            ? [{ tiktokHandle: { contains: tiktokHandle } }]
            : []),
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { earlyBirdCode: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};
  const [entries, grouped] = await Promise.all([
    db.waitlistEntry.findMany({
      where: { ...where, status },
      select: listSelect,
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    // Counts follow the search but not the status, so the status tabs show
    // what each tab would contain.
    db.waitlistEntry.groupBy({ by: ["status"], where, _count: true }),
  ]);
  const counts = Object.fromEntries(
    WAITLIST_STATUSES.map((value) => [
      value,
      grouped.find((group) => group.status === value)?._count ?? 0,
    ]),
  ) as Record<WaitlistStatusValue, number>;
  return { entries, counts, status };
}

export function getWaitlistEntry(id: string) {
  return db.waitlistEntry.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true } } },
  });
}

/** Explicit client-safe defaults for the edit form. */
export function toWaitlistFormDto(
  entry: Prisma.WaitlistEntryGetPayload<object>,
) {
  return {
    instagramHandle: entry.instagramHandle ?? "",
    tiktokHandle: entry.tiktokHandle ?? "",
    name: entry.name ?? "",
    phone: entry.phone ?? "",
    source: entry.source,
    status: entry.status,
    interestedCategories: entry.interestedCategories,
    sizes: entry.sizes,
    earlyBird: entry.earlyBird,
    earlyBirdCode: entry.earlyBirdCode ?? "",
    notes: entry.notes ?? "",
  };
}

/**
 * Dashboard: waitlist size, pipeline, and sign-ups per week for the last
 * eight Maldives-time weeks (the newest week ends today).
 */
export async function getWaitlistSummary() {
  const { end: tomorrow } = getTodayRange();
  const weeks = 8;
  const since = new Date(tomorrow.getTime() - weeks * 7 * DAY_MS);
  const [grouped, earlyBird, recent] = await Promise.all([
    db.waitlistEntry.groupBy({ by: ["status"], _count: true }),
    db.waitlistEntry.count({
      where: { earlyBird: true, status: { not: "DROPPED" } },
    }),
    db.waitlistEntry.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);
  const byStatus = Object.fromEntries(
    WAITLIST_STATUSES.map((value) => [
      value,
      grouped.find((group) => group.status === value)?._count ?? 0,
    ]),
  ) as Record<WaitlistStatusValue, number>;
  const weekly = Array.from({ length: weeks }, () => 0);
  for (const { createdAt } of recent) {
    const weeksAgo = Math.floor(
      (tomorrow.getTime() - 1 - createdAt.getTime()) / (7 * DAY_MS),
    );
    if (weeksAgo >= 0 && weeksAgo < weeks) weekly[weeks - 1 - weeksAgo] += 1;
  }
  const total = WAITLIST_STATUSES.reduce(
    (sum, value) => sum + byStatus[value],
    0,
  );
  return {
    /** Everyone still in play: dropped people are excluded. */
    active: total - byStatus.DROPPED,
    byStatus,
    earlyBird,
    weekly,
    thisWeek: weekly[weeks - 1],
    lastWeek: weekly[weeks - 2],
  };
}
