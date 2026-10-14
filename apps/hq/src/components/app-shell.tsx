import type { ReactNode } from "react";
import { Navigation } from "./navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Navigation />
      <div className="app-main">{children}</div>
    </div>
  );
}
