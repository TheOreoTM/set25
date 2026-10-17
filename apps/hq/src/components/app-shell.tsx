import type { ReactNode } from "react";
import type { StaffIdentity } from "@/lib/auth/types";
import { Navigation } from "./navigation";

export function AppShell({
  children,
  staff,
}: {
  children: ReactNode;
  staff: StaffIdentity;
}) {
  return (
    <div className="app-shell">
      <Navigation staff={staff} />
      <div className="app-main">{children}</div>
    </div>
  );
}
