import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { db, type StaffRole } from "@set25/database";
import { auth } from "@/auth";
import type { StaffIdentity } from "./types";

export class AuthorizationError extends Error {
  constructor() {
    super("You do not have permission to perform this action.");
    this.name = "AuthorizationError";
  }
}

export const getCurrentStaff = cache(
  async (): Promise<StaffIdentity | null> => {
    const session = await auth();
    if (!session?.user?.id) return null;

    const staff = await db.staffUser.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
    if (!staff?.active) return null;
    return staff;
  },
);

export async function requireStaff() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/sign-in");
  return staff;
}

export async function requireRole(...allowedRoles: StaffRole[]) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/sign-in");
  if (!allowedRoles.includes(staff.role)) throw new AuthorizationError();
  return staff;
}

export function requireOperationalAccess() {
  return requireRole("OWNER", "MANAGER");
}

export async function requireOperationalPageAccess() {
  const staff = await requireStaff();
  if (staff.role === "STAFF") redirect("/products?forbidden=write");
  return staff;
}

export function requireOwner() {
  return requireRole("OWNER");
}
