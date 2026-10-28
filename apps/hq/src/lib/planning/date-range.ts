const MALDIVES_OFFSET_MS = 5 * 60 * 60 * 1000;

export type DatePreset = "this-month" | "last-month" | "this-year" | "custom";

function maldivesParts(date = new Date()) {
  const shifted = new Date(date.getTime() + MALDIVES_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

function fromMaldivesDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day) - MALDIVES_OFFSET_MS);
}

export function maldivesDateKey(date = new Date()) {
  const { year, month, day } = maldivesParts(date);
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseMaldivesDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = fromMaldivesDate(year, month, day);
  const parts = maldivesParts(date);
  return parts.year === year && parts.month === month && parts.day === day
    ? date
    : null;
}

export function getDateRange(input: {
  preset?: string;
  from?: string;
  to?: string;
}) {
  const preset: DatePreset = [
    "this-month",
    "last-month",
    "this-year",
    "custom",
  ].includes(input.preset ?? "")
    ? (input.preset as DatePreset)
    : "this-month";
  const now = maldivesParts();
  let start: Date;
  let end: Date;

  if (preset === "last-month") {
    start = fromMaldivesDate(now.year, now.month - 1, 1);
    end = fromMaldivesDate(now.year, now.month, 1);
  } else if (preset === "this-year") {
    start = fromMaldivesDate(now.year, 0, 1);
    end = fromMaldivesDate(now.year + 1, 0, 1);
  } else if (preset === "custom") {
    const customStart = parseMaldivesDate(input.from ?? "");
    const customEnd = parseMaldivesDate(input.to ?? "");
    if (customStart && customEnd && customStart <= customEnd) {
      start = customStart;
      end = new Date(customEnd.getTime() + 24 * 60 * 60 * 1000);
    } else {
      start = fromMaldivesDate(now.year, now.month, 1);
      end = fromMaldivesDate(now.year, now.month + 1, 1);
    }
  } else {
    start = fromMaldivesDate(now.year, now.month, 1);
    end = fromMaldivesDate(now.year, now.month + 1, 1);
  }

  const endInclusive = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  return {
    preset,
    start,
    end,
    from: maldivesDateKey(start),
    to: maldivesDateKey(endInclusive),
  };
}

export function getTodayRange() {
  const key = maldivesDateKey();
  const start = parseMaldivesDate(key)!;
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

/** The current Monday-to-Sunday week in Maldives time. */
export function getWeekRange() {
  const { start: today } = getTodayRange();
  const weekday = new Date(today.getTime() + MALDIVES_OFFSET_MS).getUTCDay();
  const day = 24 * 60 * 60 * 1000;
  const start = new Date(today.getTime() - ((weekday + 6) % 7) * day);
  return { start, end: new Date(start.getTime() + 7 * day) };
}
