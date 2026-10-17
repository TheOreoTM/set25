import "server-only";

import { headers } from "next/headers";

// Pragmatic fixed-window limiter for public endpoints (checkout, discount
// checks, order lookups). It is per server instance and in memory, so it
// slows abuse rather than guaranteeing a global limit. Swap the store for a
// shared one (e.g. Redis) if the Store ever needs strict limits.

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();
const MAX_KEYS = 10_000;

export async function clientIdentifier() {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || list.get("x-real-ip") || "unknown";
}

export async function rateLimit(
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const key = `${bucket}:${await clientIdentifier()}`;
  const now = Date.now();
  if (windows.size > MAX_KEYS)
    for (const [stored, window] of windows)
      if (window.resetAt <= now) windows.delete(stored);
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}
