import "server-only";

import { db, Prisma } from "@set25/database";
import { AMBASSADOR_STATUSES, type AmbassadorStatusValue } from "@set25/shared";
import { maldivesDateKey } from "@/lib/planning/date-range";

export type AmbassadorFilters = { search?: string; status?: string };

export async function getAmbassadors(filters: AmbassadorFilters = {}) {
  const search = filters.search?.trim();
  const status = AMBASSADOR_STATUSES.includes(
    filters.status as AmbassadorStatusValue,
  )
    ? (filters.status as AmbassadorStatusValue)
    : undefined;
  const ambassadors = await db.ambassador.findMany({
    where: {
      status,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { team: { contains: search, mode: "insensitive" } },
              { instagramHandle: { contains: search, mode: "insensitive" } },
              { discountCode: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      team: true,
      position: true,
      instagramHandle: true,
      status: true,
      discountCode: true,
    },
    take: 300,
  });
  const order: Record<AmbassadorStatusValue, number> = {
    ACTIVE: 0,
    PROSPECT: 1,
    PAUSED: 2,
    ENDED: 3,
  };
  return ambassadors.sort(
    (a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name),
  );
}

export async function getAmbassador(id: string) {
  return db.ambassador.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      grants: {
        include: { createdBy: { select: { name: true } } },
        orderBy: [{ givenAt: "desc" }, { createdAt: "desc" }],
      },
      contentItems: {
        select: {
          id: true,
          title: true,
          platform: true,
          type: true,
          status: true,
          publishAt: true,
          postedAt: true,
        },
        orderBy: [{ publishAt: "desc" }, { createdAt: "desc" }],
        take: 20,
      },
    },
  });
}

/** Explicit client-safe defaults for the edit form (Decimal → string). */
export function toAmbassadorFormDto(
  ambassador: Prisma.AmbassadorGetPayload<object>,
) {
  return {
    name: ambassador.name,
    team: ambassador.team ?? "",
    position: ambassador.position ?? "",
    instagramHandle: ambassador.instagramHandle ?? "",
    phone: ambassador.phone ?? "",
    email: ambassador.email ?? "",
    status: ambassador.status,
    discountCode: ambassador.discountCode ?? "",
    discountPercent: ambassador.discountPercent?.toString() ?? "",
    commissionPercent: ambassador.commissionPercent?.toString() ?? "",
    startedAt: ambassador.startedAt
      ? maldivesDateKey(ambassador.startedAt)
      : "",
    endedAt: ambassador.endedAt ? maldivesDateKey(ambassador.endedAt) : "",
    notes: ambassador.notes ?? "",
  };
}

/** Active variants with stock, for the Give Product dialog. */
export async function getGiveableVariants() {
  const variants = await db.productVariant.findMany({
    where: { active: true, stockOnHand: { gt: 0 } },
    select: {
      id: true,
      sku: true,
      size: true,
      color: true,
      stockOnHand: true,
      product: { select: { name: true, code: true } },
    },
    orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
  });
  return variants.map((variant) => ({
    id: variant.id,
    group: `${variant.product.code} · ${variant.product.name}`,
    label:
      [variant.color, variant.size].filter(Boolean).join(" / ") || "Standard",
    sku: variant.sku,
    stockOnHand: variant.stockOnHand,
  }));
}
