import { Prisma } from "../generated/prisma/client";

/**
 * Canonical available-to-sell definition shared by HQ and the Store:
 *
 *   availableToSell = stockOnHand − ACTIVE, unexpired reserved quantity
 *
 * An ACTIVE reservation whose expiresAt has passed no longer holds stock. It
 * is released lazily (see releaseExpiredReservations) rather than by a job.
 * Incoming stock never counts.
 */

/** Accepts the shared `db` client or an interactive transaction client. */
type Client = Prisma.TransactionClient;

export function holdingReservationWhere(
  now: Date,
): Prisma.StockReservationWhereInput {
  return {
    status: "ACTIVE",
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

/** Units currently held by Store reservations, keyed by variant. */
export async function getReservedQuantities(
  client: Client,
  variantIds: string[],
  now = new Date(),
) {
  const reserved = new Map<string, number>();
  if (!variantIds.length) return reserved;
  const rows = await client.stockReservation.groupBy({
    by: ["variantId"],
    where: { variantId: { in: variantIds }, ...holdingReservationWhere(now) },
    _sum: { quantity: true },
  });
  for (const row of rows) reserved.set(row.variantId, row._sum.quantity ?? 0);
  return reserved;
}

export function availableToSell(stockOnHand: number, reserved: number) {
  return Math.max(0, stockOnHand - reserved);
}

/** Marks expired ACTIVE reservations RELEASED so they stop showing as held. */
export function releaseExpiredReservations(
  client: Client,
  variantIds?: string[],
  now = new Date(),
) {
  return client.stockReservation.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: now },
      ...(variantIds ? { variantId: { in: variantIds } } : {}),
    },
    data: { status: "RELEASED", releasedAt: now },
  });
}
