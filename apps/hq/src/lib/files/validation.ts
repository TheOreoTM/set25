import {
  FILE_ACCESS_LEVELS,
  FILE_RETENTION_POLICIES,
  type FileAccessLevelValue,
  type FileRetentionPolicyValue,
} from "@set25/shared";
import { parseMaldivesDate } from "@/lib/planning/date-range";
import {
  accessibleLevels,
  parseAttachmentTarget,
  resolveAllowedMime,
  type AttachmentTarget,
  type StaffRoleValue,
} from "./policy";

export type FileFormState = {
  status: "idle" | "error" | "success";
  message: string;
  errors?: Record<string, string[]>;
};

export const initialFileFormState: FileFormState = {
  status: "idle",
  message: "",
};

export type UploadRequest = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  accessLevel: string;
  retentionPolicy: string;
  retentionUntil: string;
  description: string;
  target: string;
};

type Errors = Record<string, string[]>;

/** Strips paths and control characters; the name is display-only. */
export function safeDisplayName(name: string) {
  return name
    .split(/[\\/]/)
    .pop()!
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 200);
}

export function validateAccessAndRetention(
  role: StaffRoleValue,
  input: {
    accessLevel: string;
    retentionPolicy: string;
    retentionUntil: string;
    description: string;
  },
  errors: Errors,
) {
  const accessLevel = input.accessLevel as FileAccessLevelValue;
  const retentionPolicy = input.retentionPolicy as FileRetentionPolicyValue;
  if (
    !FILE_ACCESS_LEVELS.includes(accessLevel) ||
    !accessibleLevels(role).includes(accessLevel)
  )
    errors.accessLevel = ["Choose an access level you are allowed to use."];
  let retentionUntil: Date | null = null;
  if (!FILE_RETENTION_POLICIES.includes(retentionPolicy))
    errors.retentionPolicy = ["Choose a retention policy."];
  else if (retentionPolicy === "UNTIL_DATE") {
    retentionUntil = parseMaldivesDate(input.retentionUntil);
    if (!retentionUntil)
      errors.retentionUntil = ["Choose the date this file expires."];
    else if (retentionUntil <= new Date())
      errors.retentionUntil = ["The expiry date must be in the future."];
  }
  const description = input.description.trim();
  if (description.length > 500)
    errors.description = ["Keep the note under 500 characters."];
  return {
    accessLevel,
    retentionPolicy,
    retentionUntil,
    description: description || null,
  };
}

export function validateUploadRequest(
  role: StaffRoleValue,
  input: UploadRequest,
  maxBytes: number,
) {
  const errors: Errors = {};
  const originalName = safeDisplayName(String(input.fileName ?? ""));
  const mimeType = resolveAllowedMime(
    originalName,
    String(input.mimeType ?? ""),
  );
  const sizeBytes = Number(input.sizeBytes);
  if (!originalName) errors.file = ["Choose a file to upload."];
  else if (!mimeType)
    errors.file = ["This file type is not allowed in SET25 HQ."];
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0)
    errors.file = [...(errors.file ?? []), "The file is empty."];
  else if (sizeBytes > maxBytes)
    errors.file = [
      ...(errors.file ?? []),
      `The file is larger than the ${Math.round(maxBytes / (1024 * 1024))} MB limit.`,
    ];
  const meta = validateAccessAndRetention(role, input, errors);
  let target: AttachmentTarget | null = null;
  if (input.target) {
    target = parseAttachmentTarget(String(input.target));
    if (!target) errors.target = ["Choose a valid record to attach to."];
  }
  if (Object.keys(errors).length) return { success: false as const, errors };
  return {
    success: true as const,
    data: { originalName, mimeType: mimeType!, sizeBytes, target, ...meta },
  };
}
