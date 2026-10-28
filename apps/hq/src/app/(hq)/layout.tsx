import { Suspense, type ReactNode } from "react";
import { Navigation, NavigationFallback } from "@/components/navigation";
import { requireStaff } from "@/lib/auth/session";

// The shell is static so it prerenders and every route can prefetch its
// loading skeleton. Only the navigation, which depends on the staff role,
// waits on the session. This is chrome, not authorization: every page and
// action in this group still calls the session helpers itself.
export default function HqLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Suspense fallback={<NavigationFallback />}>
        <StaffNavigation />
      </Suspense>
      <div className="app-main">{children}</div>
    </div>
  );
}

async function StaffNavigation() {
  const staff = await requireStaff();
  return <Navigation staff={staff} />;
}
