import type { StaffRole } from "@set25/database";
import { normalizeStaffUsername, STAFF_USERNAME_PATTERN } from "@set25/shared";

export type StaffFormState = {
  status: "idle" | "error";
  message: string;
  errors?: Record<string, string[]>;
};

export const initialStaffFormState: StaffFormState = {
  status: "idle",
  message: "",
};

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

function rawValue(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

export function validateNewStaff(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const name = value(formData, "name");
  const username = normalizeStaffUsername(value(formData, "username"));
  const password = rawValue(formData, "password");
  const role = value(formData, "role") as StaffRole;

  if (name.length < 2 || name.length > 80)
    errors.name = ["Enter a name between 2 and 80 characters."];
  if (!STAFF_USERNAME_PATTERN.test(username))
    errors.username = [
      "Use 3–32 letters, digits, dots, underscores, or hyphens, starting with a letter or digit.",
    ];
  if (password.length < 12 || password.length > 128)
    errors.password = [
      "Use an initial password between 12 and 128 characters.",
    ];
  if (role !== "MANAGER" && role !== "STAFF")
    errors.role = ["Choose Manager or Staff."];

  if (Object.keys(errors).length) return { success: false as const, errors };
  return { success: true as const, data: { name, username, password, role } };
}
