const MALDIVES_OFFSET_MS = 5 * 60 * 60 * 1000;

/** "19 Oct 2026 · 18:00" in Maldives time. */
export function formatPublishAt(value: Date | string, withTime = true) {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Indian/Maldives",
  }).format(date);
  if (!withTime) return day;
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Maldives",
  }).format(date);
  return `${day} · ${time}`;
}

/** Day/month tile parts ("19", "OCT") in Maldives time. */
export function publishTile(value: Date | string | null) {
  if (!value) return { day: "—", month: "OPEN" };
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Indian/Maldives",
  }).formatToParts(new Date(value));
  return {
    day: parts.find((part) => part.type === "day")?.value ?? "—",
    month:
      parts.find((part) => part.type === "month")?.value.toUpperCase() ?? "—",
  };
}

/** Value for a datetime-local input, in Maldives time. */
export function maldivesDateTimeKey(value: Date) {
  return new Date(value.getTime() + MALDIVES_OFFSET_MS)
    .toISOString()
    .slice(0, 16);
}

/** Parses a datetime-local value entered in Maldives time. */
export function parseMaldivesDateTime(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d, h, min] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, h, min) - MALDIVES_OFFSET_MS);
  return maldivesDateTimeKey(date) === value ? date : null;
}
