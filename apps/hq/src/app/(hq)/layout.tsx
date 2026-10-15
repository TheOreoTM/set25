import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireStaff } from "@/lib/auth/session";

// Authenticated HQ routes intentionally resolve staff access before rendering.
export const instant = false;

export default async function HqLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();
  return <AppShell staff={staff}>{children}</AppShell>;
}
