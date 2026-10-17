"use server";

import { db } from "@set25/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOperationalAccess } from "@/lib/auth/session";
import {
  validateContent,
  validateContentStatusChange,
  type ContentFormState,
} from "./validation";

function failure(
  message: string,
  errors?: Record<string, string[]>,
): ContentFormState {
  return { status: "error", message, errors };
}

/** Linked records must exist; the owner must be active staff. */
async function relationErrors(data: {
  productId: string | null;
  ambassadorId: string | null;
  ownerId: string | null;
}) {
  const [product, ambassador, owner] = await Promise.all([
    data.productId
      ? db.product.findUnique({
          where: { id: data.productId },
          select: { id: true },
        })
      : true,
    data.ambassadorId
      ? db.ambassador.findUnique({
          where: { id: data.ambassadorId },
          select: { id: true },
        })
      : true,
    data.ownerId
      ? db.staffUser.findFirst({
          where: { id: data.ownerId, active: true },
          select: { id: true },
        })
      : true,
  ]);
  const errors: Record<string, string[]> = {};
  if (!product) errors.productId = ["Choose an available product."];
  if (!ambassador) errors.ambassadorId = ["Choose an available ambassador."];
  if (!owner) errors.ownerId = ["Choose an active staff member."];
  return Object.keys(errors).length ? errors : null;
}

/**
 * When content becomes Posted, record when it went out: its planned publish
 * time if that has passed, otherwise now. An existing postedAt is kept.
 */
function postedAtFor(publishAt: Date | null, existing: Date | null = null) {
  if (existing) return existing;
  const now = new Date();
  return publishAt && publishAt <= now ? publishAt : now;
}

function revalidateContent(id?: string) {
  revalidatePath("/content");
  revalidatePath("/");
  if (id) revalidatePath(`/content/${id}`);
}

export async function createContentAction(
  _state: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  const staff = await requireOperationalAccess();
  const result = validateContent(formData);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  const errors = await relationErrors(result.data);
  if (errors) return failure("Check the highlighted details.", errors);
  let id: string;
  try {
    ({ id } = await db.contentItem.create({
      data: {
        ...result.data,
        postedAt:
          result.data.status === "POSTED"
            ? postedAtFor(result.data.publishAt)
            : null,
        createdById: staff.id,
      },
      select: { id: true },
    }));
  } catch (error) {
    console.error(error);
    return failure("SET25 HQ could not create this content item. Try again.");
  }
  revalidateContent();
  if (result.data.ambassadorId)
    revalidatePath(`/ambassadors/${result.data.ambassadorId}`);
  redirect(`/content/${id}?created=1`);
}

export async function updateContentAction(
  id: string,
  _state: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  await requireOperationalAccess();
  const result = validateContent(formData);
  if (!result.success)
    return failure("Check the highlighted details.", result.errors);
  const [existing, errors] = await Promise.all([
    db.contentItem.findUnique({
      where: { id },
      select: { postedAt: true, ambassadorId: true },
    }),
    relationErrors(result.data),
  ]);
  if (!existing) return failure("This content item no longer exists.");
  if (errors) return failure("Check the highlighted details.", errors);
  try {
    await db.contentItem.update({
      where: { id },
      data: {
        ...result.data,
        postedAt:
          result.data.status === "POSTED"
            ? postedAtFor(result.data.publishAt, existing.postedAt)
            : null,
      },
    });
  } catch (error) {
    console.error(error);
    return failure("SET25 HQ could not save this content item. Try again.");
  }
  revalidateContent(id);
  for (const ambassadorId of [existing.ambassadorId, result.data.ambassadorId])
    if (ambassadorId) revalidatePath(`/ambassadors/${ambassadorId}`);
  redirect(`/content/${id}?saved=1`);
}

/** Contextual status moves from the detail page (Mark Ready, Schedule, …). */
export async function changeContentStatusAction(
  id: string,
  _state: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  await requireOperationalAccess();
  const change = validateContentStatusChange(formData);
  if (!change) return failure("Choose a valid status.");
  if (change.publishAtInvalid)
    return failure("Enter a valid publish date and time.", {
      publishAt: ["Enter a valid publish date and time."],
    });
  const item = await db.contentItem.findUnique({
    where: { id },
    select: {
      status: true,
      publishAt: true,
      postedAt: true,
      ambassadorId: true,
    },
  });
  if (!item) return failure("This content item no longer exists.");
  if (item.status === change.status)
    return failure("The content already has this status.");
  const publishAt = change.publishAt ?? item.publishAt;
  if (change.status === "SCHEDULED" && !publishAt)
    return failure("Scheduled content needs a publish date and time.", {
      publishAt: ["Choose when this will be published."],
    });
  await db.contentItem.update({
    where: { id },
    data: {
      status: change.status,
      publishAt,
      postedAt:
        change.status === "POSTED"
          ? postedAtFor(publishAt, item.postedAt)
          : null,
    },
  });
  revalidateContent(id);
  if (item.ambassadorId) revalidatePath(`/ambassadors/${item.ambassadorId}`);
  return { status: "idle", message: "" };
}
