// Client-safe Store product image rules. The server re-checks everything.

export const PRODUCT_MEDIA_MAX_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const PRODUCT_MEDIA_ACCEPT = ".jpg,.jpeg,.png,.webp";

/** Canonical image MIME type, or null when the image is not allowed. */
export function resolveProductImageMime(name: string, declaredType: string) {
  const extension = /\.([a-z0-9]{1,5})$/i.exec(name)?.[1]?.toLowerCase();
  const mime = extension ? IMAGE_TYPES[extension] : undefined;
  if (!mime) return null;
  const declared = declaredType.toLowerCase().split(";")[0].trim();
  return !declared || declared === mime ? mime : null;
}
