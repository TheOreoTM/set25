import type { StaffRole } from "@set25/database";

export const staffRoleLabels: Record<StaffRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
};

export type StaffIdentity = {
  id: string;
  name: string;
  username: string;
  role: StaffRole;
};

export function staffInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
