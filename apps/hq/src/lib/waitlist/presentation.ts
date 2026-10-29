import {
  productCategoryLabels,
  type ProductCategoryValue,
  type WaitlistStatusValue,
} from "@set25/shared";
import type { WaitlistContact } from "./validation";

// Client-safe helpers. Customer contact stays in Instagram or TikTok DMs, so
// HQ prepares the message and opens the conversation; it never sends anything
// itself.

export function instagramProfileUrl(handle: string) {
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}

/** Opens the DM thread in the Instagram app when installed. */
export function instagramDmUrl(handle: string) {
  return `https://ig.me/m/${encodeURIComponent(handle)}`;
}

/** TikTok has no DM link, so this opens the profile with its Message button. */
export function tiktokProfileUrl(handle: string) {
  return `https://www.tiktok.com/@${encodeURIComponent(handle)}`;
}

export function waitlistDisplayName(entry: {
  instagramHandle: string | null;
  tiktokHandle: string | null;
  name: string | null;
}) {
  const handle = entry.instagramHandle ?? entry.tiktokHandle;
  return handle ? `@${handle}` : entry.name!;
}

/** Where to message someone: Instagram when known, otherwise TikTok. */
export function waitlistContact(entry: {
  instagramHandle: string | null;
  tiktokHandle: string | null;
}): WaitlistContact | null {
  if (entry.instagramHandle)
    return { platform: "instagram", handle: entry.instagramHandle };
  if (entry.tiktokHandle)
    return { platform: "tiktok", handle: entry.tiktokHandle };
  return null;
}

export const waitlistPlatformLabels: Record<
  WaitlistContact["platform"],
  string
> = { instagram: "Instagram", tiktok: "TikTok" };

/** "Knee Pads + Arm Sleeves · M, L" */
export function waitlistInterest(entry: {
  interestedCategories: ProductCategoryValue[];
  sizes: string[];
}) {
  const products = entry.interestedCategories
    .map((category) => productCategoryLabels[category])
    .join(" + ");
  return [products, entry.sizes.join(", ")].filter(Boolean).join(" · ");
}

/** The next forward step in the pipeline, if any. */
export const nextWaitlistStatus: Partial<
  Record<WaitlistStatusValue, WaitlistStatusValue>
> = {
  NEW: "CONTACTED",
  CONTACTED: "CONFIRMED",
  CONFIRMED: "ORDERED",
  DROPPED: "CONTACTED",
};

export const waitlistStatusActionLabels: Record<WaitlistStatusValue, string> = {
  NEW: "Back to New",
  CONTACTED: "Mark contacted",
  CONFIRMED: "Mark confirmed",
  ORDERED: "Mark ordered",
  DROPPED: "Drop",
};

/** A ready-to-paste DM that fits where the person is in the pipeline. */
export function waitlistDmMessage(entry: {
  name: string | null;
  status: WaitlistStatusValue;
  interestedCategories: ProductCategoryValue[];
  sizes: string[];
  earlyBird: boolean;
  earlyBirdCode: string | null;
}) {
  const firstName = entry.name?.split(/\s+/)[0];
  const greeting = firstName ? `Hey ${firstName}!` : "Hey!";
  const products = entry.interestedCategories
    .map((category) => productCategoryLabels[category].toLowerCase())
    .join(" and ");
  const sizes = entry.sizes.length ? ` in ${entry.sizes.join("/")}` : "";
  const interest = products ? `${products}${sizes}` : "the first SET25 drop";
  const earlyBird = entry.earlyBirdCode
    ? ` Your Early Bird code is ${entry.earlyBirdCode}. Use it when you order.`
    : entry.earlyBird
      ? " You're on our Early Bird list, so you'll get first access."
      : "";

  switch (entry.status) {
    case "CONFIRMED":
      return `${greeting} You're confirmed for ${interest}. We'll message you here as soon as ordering opens, before anyone else.${earlyBird}`;
    case "ORDERED":
      return `${greeting} Thanks for ordering with SET25. We'll keep you updated here on delivery. Tag us when you train in it!`;
    case "DROPPED":
      return `${greeting} Checking in from SET25. Still keen on ${interest}? Reply here and we'll hold a spot for you.`;
    default:
      return `${greeting} Thanks for joining the SET25 waitlist. We've got you down for ${interest}. You'll hear from us here first when it drops.${earlyBird} Any questions, just reply.`;
  }
}
