import {
  CONTENT_PLATFORMS,
  CONTENT_STATUSES,
  CONTENT_TYPES,
  type ContentPlatformValue,
  type ContentStatusValue,
  type ContentTypeValue,
} from "@set25/shared";
import { parseMaldivesDateTime } from "./presentation";

export type ContentFormState = {
  status: "idle" | "error";
  message: string;
  errors?: Record<string, string[]>;
};

export const initialContentFormState: ContentFormState = {
  status: "idle",
  message: "",
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function validateContent(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const title = text(formData, "title");
  const platform = text(formData, "platform") as ContentPlatformValue;
  const type = text(formData, "type") as ContentTypeValue;
  const status = text(formData, "status") as ContentStatusValue;
  const hook = text(formData, "hook");
  const caption = text(formData, "caption");
  const notes = text(formData, "notes");
  const publishAtRaw = text(formData, "publishAt");
  const publishAt = publishAtRaw ? parseMaldivesDateTime(publishAtRaw) : null;
  const externalUrl = text(formData, "externalUrl");

  if (title.length < 2 || title.length > 160)
    errors.title = ["Enter a title between 2 and 160 characters."];
  if (!CONTENT_PLATFORMS.includes(platform))
    errors.platform = ["Choose a platform."];
  if (!CONTENT_TYPES.includes(type)) errors.type = ["Choose a content type."];
  if (!CONTENT_STATUSES.includes(status)) errors.status = ["Choose a status."];
  if (publishAtRaw && !publishAt)
    errors.publishAt = ["Enter a valid publish date and time."];
  if (status === "SCHEDULED" && !publishAt)
    errors.publishAt = ["Scheduled content needs a publish date and time."];
  if (hook.length > 500) errors.hook = ["Keep the hook under 500 characters."];
  if (caption.length > 2200)
    errors.caption = ["Keep the caption under 2,200 characters."];
  if (notes.length > 2000)
    errors.notes = ["Keep notes under 2,000 characters."];
  if (externalUrl && !validUrl(externalUrl))
    errors.externalUrl = ["Enter a full link starting with https://."];

  if (Object.keys(errors).length) return { success: false as const, errors };
  return {
    success: true as const,
    data: {
      title,
      platform,
      type,
      status,
      hook: hook || null,
      caption: caption || null,
      notes: notes || null,
      publishAt,
      externalUrl: externalUrl || null,
      productId: text(formData, "productId") || null,
      ambassadorId: text(formData, "ambassadorId") || null,
      ownerId: text(formData, "ownerId") || null,
    },
  };
}

export function validateContentStatusChange(formData: FormData) {
  const status = text(formData, "status") as ContentStatusValue;
  const publishAtRaw = text(formData, "publishAt");
  if (!CONTENT_STATUSES.includes(status)) return null;
  return {
    status,
    publishAt: publishAtRaw ? parseMaldivesDateTime(publishAtRaw) : null,
    publishAtInvalid:
      Boolean(publishAtRaw) && !parseMaldivesDateTime(publishAtRaw),
  };
}
