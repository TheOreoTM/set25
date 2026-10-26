import Link from "next/link";
import { LogOut, UserRound, Users } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { requireStaff } from "@/lib/auth/session";
import { staffInitials, staffRoleLabels } from "@/lib/auth/types";

export async function AccountMenu() {
  const staff = await requireStaff();
  const initials = staffInitials(staff.name);

  return (
    <details className="account-menu">
      <summary className="account-trigger" aria-label="Open staff account menu">
        <span className="avatar">{initials}</span>
        <span className="account-copy">
          <strong>{staff.name}</strong>
          <small>{staffRoleLabels[staff.role]}</small>
        </span>
      </summary>
      <div className="account-popover">
        <div className="account-identity">
          <strong>{staff.name}</strong>
          <span>{staff.email}</span>
        </div>
        <Link href="/account">
          <UserRound aria-hidden="true" /> Account
        </Link>
        {staff.role === "OWNER" ? (
          <Link href="/settings/staff">
            <Users aria-hidden="true" /> Staff access
          </Link>
        ) : null}
        <form action={signOutAction}>
          <button type="submit">
            <LogOut aria-hidden="true" /> Sign out
          </button>
        </form>
      </div>
    </details>
  );
}
