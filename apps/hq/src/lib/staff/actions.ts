"use server";

import { db, Prisma, type StaffRole } from "@set25/database";
import { hashPassword } from "@set25/database/password";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeStaffUsername, STAFF_USERNAME_PATTERN } from "@set25/shared";
import { requireOwner } from "@/lib/auth/session";
import {
  initialStaffFormState,
  validateNewStaff,
  type StaffFormState,
} from "./validation";

const roles: StaffRole[] = ["OWNER", "MANAGER", "STAFF"];

export async function createStaffAction(
  previous: StaffFormState = initialStaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  void previous;
  await requireOwner();
  const result = validateNewStaff(formData);
  if (!result.success)
    return {
      status: "error",
      message: "Check the highlighted fields.",
      errors: result.errors,
    };

  try {
    await db.staffUser.create({
      data: {
        name: result.data.name,
        username: result.data.username,
        passwordHash: await hashPassword(result.data.password),
        role: result.data.role,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        status: "error",
        message: "A staff account already uses that username.",
        errors: { username: ["Choose a different username."] },
      };
    }
    console.error(error);
    return {
      status: "error",
      message: "SET25 HQ could not create this account. Please try again.",
    };
  }

  revalidatePath("/settings/staff");
  redirect("/settings/staff?created=1");
}

export async function changeStaffRoleAction(formData: FormData) {
  await requireOwner();
  const staffId = String(formData.get("staffId") ?? "");
  const role = String(formData.get("role") ?? "") as StaffRole;
  if (!staffId || !roles.includes(role)) redirect("/settings/staff?error=role");

  try {
    await db.$transaction(
      async (transaction) => {
        await transaction.$queryRaw`SELECT pg_advisory_xact_lock(2525)::text`;
        const target = await transaction.staffUser.findUnique({
          where: { id: staffId },
          select: { role: true, active: true },
        });
        if (!target) throw new StaffRuleError("missing");
        if (target.role === "OWNER" && role !== "OWNER" && target.active) {
          const activeOwners = await transaction.staffUser.count({
            where: { role: "OWNER", active: true },
          });
          if (activeOwners <= 1) throw new StaffRuleError("last-owner");
        }
        await transaction.staffUser.update({
          where: { id: staffId },
          data: { role },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof StaffRuleError)
      redirect(`/settings/staff?error=${error.code}`);
    console.error(error);
    redirect("/settings/staff?error=save");
  }

  revalidatePath("/settings/staff");
  redirect("/settings/staff?updated=role");
}

// Sessions identify staff by ID, so a rename never signs anyone out; the new
// username applies from their next sign-in.
export async function changeStaffUsernameAction(formData: FormData) {
  await requireOwner();
  const staffId = String(formData.get("staffId") ?? "");
  const username = normalizeStaffUsername(
    String(formData.get("username") ?? ""),
  );
  if (!staffId) redirect("/settings/staff?error=missing");
  if (!STAFF_USERNAME_PATTERN.test(username))
    redirect("/settings/staff?error=username");

  try {
    await db.staffUser.update({
      where: { id: staffId },
      data: { username },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        redirect("/settings/staff?error=username-taken");
      if (error.code === "P2025") redirect("/settings/staff?error=missing");
    }
    console.error(error);
    redirect("/settings/staff?error=save");
  }

  revalidatePath("/settings/staff");
  redirect("/settings/staff?updated=username");
}

export async function toggleStaffStatusAction(formData: FormData) {
  await requireOwner();
  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) redirect("/settings/staff?error=missing");

  try {
    await db.$transaction(
      async (transaction) => {
        await transaction.$queryRaw`SELECT pg_advisory_xact_lock(2525)::text`;
        const target = await transaction.staffUser.findUnique({
          where: { id: staffId },
          select: { role: true, active: true },
        });
        if (!target) throw new StaffRuleError("missing");
        if (target.active && target.role === "OWNER") {
          const activeOwners = await transaction.staffUser.count({
            where: { role: "OWNER", active: true },
          });
          if (activeOwners <= 1) throw new StaffRuleError("last-owner");
        }
        await transaction.staffUser.update({
          where: { id: staffId },
          data: { active: !target.active },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof StaffRuleError)
      redirect(`/settings/staff?error=${error.code}`);
    console.error(error);
    redirect("/settings/staff?error=save");
  }

  revalidatePath("/settings/staff");
  redirect("/settings/staff?updated=status");
}

class StaffRuleError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}
