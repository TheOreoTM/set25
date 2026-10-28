import {
  productCategoryLabels,
  type ProductCategoryValue,
  type WaitlistStatusValue,
} from "@set25/shared";

// Client-safe helpers. Customer contact stays on Instagram, so HQ prepares the
// message and opens the conversation; it never sends anything itself.

export function instagramProfileUrl(handle: string) {
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}

/** Opens the DM thread in the Instagram app when installed. */
export function instagramDmUrl(handle: string) {
  return `https://ig.me/m/${encodeURIComponent(handle)}`;
}

export function waitlistDisplayName(entry: {
  instagramHandle: string | null;
  name: string | null;
}) {
  return entry.instagramHandle ? `@${entry.instagramHandle}` : entry.name!;
}

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

/** A ready-to-paste Instagram DM that fits where the person is in the pipeline. */
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
