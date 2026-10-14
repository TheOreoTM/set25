export type StaffRole = "owner" | "operator" | "viewer";

export type StaffIdentity = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
};

/** Provider-neutral contract for the future server-side authentication boundary. */
export type StaffSession = {
  staff: StaffIdentity;
  expiresAt: Date;
};
