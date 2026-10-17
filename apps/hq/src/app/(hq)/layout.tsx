import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireStaff } from "@/lib/auth/session";

// Every route in this group is private and reads live operational data.
// Resolve staff access before rendering instead of caching session data or
// forcing low-value streaming boundaries into each page.
// This only covers navigations into the group: Next.js still validates
// navigations between sibling pages, so every page.tsx here must also export
// `instant = false`.
export const instant = false;

export default async function HqLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();
  return <AppShell staff={staff}>{children}</AppShell>;
}
