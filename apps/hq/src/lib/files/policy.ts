// Client-safe file rules shared by the upload dialog and the server. The server
// re-checks everything; the client copy only gives earlier feedback.
import type { FileAccessLevelValue } from "@set25/shared";

export type StaffRoleValue = "OWNER" | "MANAGER" | "STAFF";

export const DEFAULT_MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

// Canonical MIME type per allowed extension. A file is accepted only when its
// extension is listed here and the browser-declared type matches it (or a
// known alias for it). The canonical type is what storage and downloads use.
const ALLOWED_TYPES: Record<string, { mime: string; aliases?: string[] }> = {
  pdf: { mime: "application/pdf" },
  jpg: { mime: "image/jpeg" },
  jpeg: { mime: "image/jpeg" },
  png: { mime: "image/png" },
  webp: { mime: "image/webp" },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  pptx: {
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  },
  csv: {
    mime: "text/csv",
    // Windows browsers often declare CSV as an Excel type.
    aliases: ["application/vnd.ms-excel", "application/csv"],
  },
  txt: { mime: "text/plain" },
  mp4: { mime: "video/mp4" },
  mov: { mime: "video/quicktime" },
};

export const ACCEPT_ATTRIBUTE = Object.keys(ALLOWED_TYPES)
  .map((extension) => `.${extension}`)
  .join(",");

export const ALLOWED_TYPES_LABEL =
  "PDF, JPG, PNG, WEBP, DOCX, XLSX, PPTX, CSV, TXT, MP4, MOV";

export function fileExtension(name: string) {
  const match = /\.([a-z0-9]{1,8})$/i.exec(name);
  return match ? match[1].toLowerCase() : "";
}

/** Returns the canonical MIME type, or null when the file is not allowed. */
export function resolveAllowedMime(name: string, declaredType: string) {
  const rule = ALLOWED_TYPES[fileExtension(name)];
  if (!rule) return null;
  const declared = declaredType.toLowerCase().split(";")[0].trim();
  // Some platforms send no type for valid files; the extension still has to match.
  if (!declared) return rule.mime;
  return declared === rule.mime || rule.aliases?.includes(declared)
    ? rule.mime
    : null;
}

export function fileCategory(mimeType: string) {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("spreadsheetml") || mimeType === "text/csv")
    return "Spreadsheet";
  if (mimeType.includes("presentationml")) return "Presentation";
  return "Document";
}

export const FILE_CATEGORIES = [
  "Image",
  "Video",
  "PDF",
  "Spreadsheet",
  "Presentation",
  "Document",
] as const;

/** Types the browser may display inline; everything else downloads. */
export function canPreviewInline(mimeType: string) {
  return (
    mimeType.startsWith("image/") ||
    mimeType.startsWith("video/") ||
    mimeType === "application/pdf"
  );
}

export function accessibleLevels(role: StaffRoleValue): FileAccessLevelValue[] {
  if (role === "OWNER") return ["ALL_STAFF", "MANAGER_AND_OWNER", "OWNER_ONLY"];
  if (role === "MANAGER") return ["ALL_STAFF", "MANAGER_AND_OWNER"];
  return ["ALL_STAFF"];
}

export function canUploadFiles(role: StaffRoleValue) {
  return role === "OWNER" || role === "MANAGER";
}

export function isRetentionExpired(
  retentionUntil: Date | string | null,
  now = new Date(),
) {
  return retentionUntil !== null && new Date(retentionUntil) <= now;
}

/**
 * Who may change metadata or delete a file. The Owner may manage anything,
 * including retention-expired files. A Manager may manage files they can see
 * until their retention ends.
 */
export function canManageFile(
  role: StaffRoleValue,
  file: {
    accessLevel: FileAccessLevelValue;
    retentionUntil: Date | string | null;
  },
) {
  if (role === "OWNER") return true;
  if (role !== "MANAGER") return false;
  return (
    accessibleLevels(role).includes(file.accessLevel) &&
    !isRetentionExpired(file.retentionUntil)
  );
}

export const ATTACHMENT_TARGETS = {
  PRODUCT: { field: "productId", label: "Product" },
  CUSTOMER: { field: "customerId", label: "Customer" },
  TEAM: { field: "teamId", label: "Team" },
  ORDER: { field: "orderId", label: "Order / Preorder" },
  SUPPLIER: { field: "supplierId", label: "Supplier" },
  PURCHASE_ORDER: { field: "purchaseOrderId", label: "Purchase Order" },
  IMPORT: { field: "importShipmentId", label: "Import" },
  SAMPLE: { field: "sampleId", label: "Sample" },
  AMBASSADOR: { field: "ambassadorId", label: "Ambassador" },
  CONTENT: { field: "contentItemId", label: "Content" },
} as const;

export type AttachmentTargetType = keyof typeof ATTACHMENT_TARGETS;
export type AttachmentTarget = { type: AttachmentTargetType; id: string };

export function parseAttachmentTarget(value: string): AttachmentTarget | null {
  const [type, id, extra] = value.split(":");
  if (extra !== undefined || !id || !(type in ATTACHMENT_TARGETS)) return null;
  return { type: type as AttachmentTargetType, id };
}
