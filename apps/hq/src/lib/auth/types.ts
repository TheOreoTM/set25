import type { StaffRole } from "@set25/database";

export const staffRoleLabels: Record<StaffRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
};

export type StaffIdentity = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
};
