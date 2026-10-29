"use server";

import { db, Prisma } from "@set25/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOperationalAccess } from "@/lib/auth/session";
import { waitlistDisplayName, waitlistDmMessage } from "./presentation";
import {
  validateWaitlistEntry,
  validateWaitlistStatus,
  type WaitlistFormState,
} from "./validation";

function failure(
  message: string,
  errors?: Record<string, string[]>,
  existingId?: string,
): WaitlistFormState {
  return { status: "error", message, errors, existingId };
}

/** Explains which unique field clashed and links to the existing entry. */
async function duplicateFailure(
  data: { instagramHandle: string | null; earlyBirdCode: string | null },
  exceptId?: string,
) {
  if (data.instagramHandle) {
    const existing = await db.waitlistEntry.findUnique({
      where: { instagramHandle: data.instagramHandle },
      select: { id: true },
    });
    if (existing && existing.id !== exceptId)
      return failure(
        `@${data.instagramHandle} is already on the waitlist.`,
        { instagramHandle: ["This handle is already on the waitlist."] },
        existing.id,
      );
  }
  if (data.earlyBirdCode) {
    const existing = await db.waitlistEntry.findUnique({
      where: { earlyBirdCode: data.earlyBirdCode },
      select: { id: true },
    });
    if (existing && existing.id !== exceptId)
      return failure("Check the highlighted details.", {
        earlyBirdCode: ["Another person already has this Early Bird code."],
      });
  }
  return null;
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function revalidateWaitlist(id?: string) {
  revalidatePath("/waitlist");
  if (id) revalidatePath(`/waitlist/${id}`);
  revalidatePath("/");
}

/**
 * Quick-add. Returns instead of redirecting so the form clears and stays put
 * for the next person, with the new entry's follow-up DM on offer.
 */
export async function createWaitlistEntryAction(
  _state: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  const staff = await requireOperationalAccess();
  const result = validateWaitlistEntry(formData);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  const duplicate = await duplicateFailure(result.data);
  if (duplicate) return duplicate;
  let id: string;
  try {
    ({ id } = await db.waitlistEntry.create({
      data: { ...result.data, createdById: staff.id },
      select: { id: true },
    }));
  } catch (error) {
    if (isUniqueViolation(error))
      return (
        (await duplicateFailure(result.data)) ??
        failure("This person is already on the waitlist.")
      );
    console.error(error);
    return failure("SET25 HQ could not add this person. Try again.");
  }
  revalidateWaitlist();
  return {
    status: "success",
    message: `Added ${waitlistDisplayName(result.data)}.`,
    added: {
      id,
      handle: result.data.instagramHandle,
      message: waitlistDmMessage(result.data),
    },
  };
}

export async function updateWaitlistEntryAction(
  id: string,
  _state: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  await requireOperationalAccess();
  const result = validateWaitlistEntry(formData);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  const duplicate = await duplicateFailure(result.data, id);
  if (duplicate) return duplicate;
  try {
    const current = await db.waitlistEntry.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) return failure("This waitlist entry no longer exists.");
    await db.waitlistEntry.update({
      where: { id },
      data: {
        ...result.data,
        ...(current.status !== result.data.status
          ? { statusChangedAt: new Date() }
          : {}),
      },
    });
  } catch (error) {
    if (isUniqueViolation(error))
      return (
        (await duplicateFailure(result.data, id)) ??
        failure("Another entry already uses these details.")
      );
    console.error(error);
    return failure("SET25 HQ could not save this entry. Try again.");
  }
  revalidateWaitlist(id);
  redirect(`/waitlist/${id}?saved=1`);
}

export async function setWaitlistStatusAction(
  id: string,
  _state: WaitlistFormState,
  formData: FormData,
): Promise<WaitlistFormState> {
  await requireOperationalAccess();
  const status = validateWaitlistStatus(formData);
  if (!status) return failure("Choose a status.");
  const updated = await db.waitlistEntry.updateMany({
    where: { id, status: { not: status } },
    data: { status, statusChangedAt: new Date() },
  });
  if (!updated.count) {
    const exists = await db.waitlistEntry.count({ where: { id } });
    if (!exists) return failure("This waitlist entry no longer exists.");
  }
  revalidateWaitlist(id);
  return { status: "success", message: "Status updated." };
}
