import "server-only";

/** Public URL for a deliberately public product image, or null. */
export function publicMediaUrl(storageKey: string) {
  const base = (process.env.PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}/${storageKey}` : null;
}
