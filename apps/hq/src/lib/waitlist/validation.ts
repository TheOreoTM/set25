import {
  PRODUCT_CATEGORIES,
  WAITLIST_SIZES,
  WAITLIST_SOURCES,
  WAITLIST_STATUSES,
  type ProductCategoryValue,
  type WaitlistSizeValue,
  type WaitlistSourceValue,
  type WaitlistStatusValue,
} from "@set25/shared";

export type WaitlistFormState = {
  status: "idle" | "error" | "success";
  message: string;
  errors?: Record<string, string[]>;
  /** Set after a quick-add so the form can offer the follow-up DM. */
  added?: { id: string; contact: WaitlistContact | null; message: string };
  /** Set when the handle already exists, to link to that entry. */
  existingId?: string;
};

/** Where a person can be messaged: Instagram first, then TikTok. */
export type WaitlistContact = {
  platform: "instagram" | "tiktok";
  handle: string;
};

export const initialWaitlistFormState: WaitlistFormState = {
  status: "idle",
  message: "",
};

type Errors = Record<string, string[]>;

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function list(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string");
}

/**
 * Accepts "@Handle", "handle", or a pasted profile link and returns the bare
 * lowercase handle Instagram uses in URLs.
 */
export function normalizeInstagramHandle(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "")
    .toLowerCase();
}

/** Same idea for TikTok: "@Handle", "handle", or a tiktok.com/@handle link. */
export function normalizeTikTokHandle(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.|m\.)?tiktok\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "")
    .toLowerCase();
}

export function normalizeEarlyBirdCode(value: string) {
  return value.trim().toUpperCase();
}

export function validateWaitlistEntry(formData: FormData) {
  const errors: Errors = {};
  const source = text(formData, "source") as WaitlistSourceValue;
  // Quick add has one "handle" field; the source says which platform it is.
  const quickHandle = formData.has("handle") ? text(formData, "handle") : null;
  const tiktokSource = source === "TIKTOK";
  const instagramHandle = normalizeInstagramHandle(
    quickHandle === null
      ? text(formData, "instagramHandle")
      : tiktokSource
        ? ""
        : quickHandle,
  );
  const tiktokHandle = normalizeTikTokHandle(
    quickHandle === null
      ? text(formData, "tiktokHandle")
      : tiktokSource
        ? quickHandle
        : "",
  );
  const name = text(formData, "name");
  const phone = text(formData, "phone");
  const status = (text(formData, "status") || "NEW") as WaitlistStatusValue;
  const interestedCategories = [
    ...new Set(list(formData, "interestedCategories")),
  ] as ProductCategoryValue[];
  const sizes = [...new Set(list(formData, "sizes"))] as WaitlistSizeValue[];
  const earlyBirdCode = normalizeEarlyBirdCode(text(formData, "earlyBirdCode"));
  // A code implies Early Bird, so nobody has to tick both.
  const earlyBird = formData.get("earlyBird") === "on" || Boolean(earlyBirdCode);
  const notes = text(formData, "notes");

  if (instagramHandle && !/^[a-z0-9._]{1,30}$/.test(instagramHandle))
    errors.instagramHandle = [
      "Use the handle only: letters, numbers, dots, and underscores.",
    ];
  if (tiktokHandle && !/^[a-z0-9._]{2,24}$/.test(tiktokHandle))
    errors.tiktokHandle = [
      "Use the handle only: letters, numbers, dots, and underscores.",
    ];
  if (!instagramHandle && !tiktokHandle && !name) {
    errors.instagramHandle = ["Enter a handle or a name."];
    errors.tiktokHandle = ["Enter a handle or a name."];
    errors.name = ["Enter a handle or a name."];
  }
  if (name.length > 120) errors.name = ["Keep the name under 120 characters."];
  if (phone && !/^\+?[\d\s-]{7,20}$/.test(phone))
    errors.phone = ["Enter a phone number, e.g. 7771234."];
  if (!WAITLIST_SOURCES.includes(source))
    errors.source = ["Choose where they came from."];
  if (!WAITLIST_STATUSES.includes(status))
    errors.status = ["Choose a status."];
  if (
    interestedCategories.some(
      (category) => !PRODUCT_CATEGORIES.includes(category),
    )
  )
    errors.interestedCategories = ["Choose products from the list."];
  if (sizes.some((size) => !WAITLIST_SIZES.includes(size)))
    errors.sizes = ["Choose sizes from the list."];
  if (earlyBirdCode && !/^[A-Z0-9_-]{3,30}$/.test(earlyBirdCode))
    errors.earlyBirdCode = [
      "Use 3–30 letters, numbers, dashes, or underscores.",
    ];
  if (notes.length > 2000)
    errors.notes = ["Keep notes under 2,000 characters."];

  if (quickHandle !== null) {
    const handleErrors =
      errors[tiktokSource ? "tiktokHandle" : "instagramHandle"];
    if (handleErrors) errors.handle = handleErrors;
  }

  if (Object.keys(errors).length) return { success: false as const, errors };
  return {
    success: true as const,
    data: {
      instagramHandle: instagramHandle || null,
      tiktokHandle: tiktokHandle || null,
      name: name || null,
      phone: phone || null,
      source,
      status,
      // Keep the catalogue's order rather than tap order.
      interestedCategories: PRODUCT_CATEGORIES.filter((category) =>
        interestedCategories.includes(category),
      ),
      sizes: WAITLIST_SIZES.filter((size) => sizes.includes(size)),
      earlyBird,
      earlyBirdCode: earlyBirdCode || null,
      notes: notes || null,
    },
  };
}

export function validateWaitlistStatus(formData: FormData) {
  const status = text(formData, "status") as WaitlistStatusValue;
  return WAITLIST_STATUSES.includes(status) ? status : null;
}
