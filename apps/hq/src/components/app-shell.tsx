import { Suspense, type ReactNode } from "react";
import Image from "next/image";
import wordmark from "@set25/brand/assets/SET25_Primary_Wordmark_White.svg";
import { Navigation } from "./navigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Suspense fallback={<NavigationFallback />}>
        <Navigation />
      </Suspense>
      <div className="app-main">{children}</div>
    </div>
  );
}

function NavigationFallback() {
  return (
    <>
      <aside className="sidebar navigation-fallback" aria-hidden="true">
        <div className="sidebar-brand">
          <Image src={wordmark} alt="" width={132} height={44} priority />
          <span>HQ / OPERATIONS</span>
        </div>
      </aside>
      <header className="mobile-bar navigation-fallback" aria-hidden="true">
        <Image src={wordmark} alt="" width={102} height={34} priority />
      </header>
    </>
  );
}
