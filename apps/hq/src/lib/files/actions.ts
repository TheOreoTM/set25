"use server";

import { randomUUID } from "node:crypto";
import { db } from "@set25/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/session";
import { attachmentTargetExists } from "./data";
import {
  ATTACHMENT_TARGETS,
  accessibleLevels,
  canManageFile,
  canUploadFiles,
} from "./policy";
import {
  buildStorageKey,
  createUploadUrl,
  deleteObject,
  inspectObject,
  isStorageConfigured,
  maxUploadBytes,
} from "./storage";
import {
  validateAccessAndRetention,
  validateUploadRequest,
  type FileFormState,
  type UploadRequest,
} from "./validation";

// Storage and the database cannot share a transaction, so uploads go
// PENDING → (browser PUT) → finalize-verified AVAILABLE, and deletes remove the
// object first and only then mark the record DELETED.

const PENDING_UPLOAD_WINDOW_MS = 60 * 60 * 1000;

type UploadResult =
  | { ok: true; fileId: string; uploadUrl: string; contentType: string }
  | { ok: false; message: string; errors?: Record<string, string[]> };

export async function prepareFileUploadAction(
  input: UploadRequest,
): Promise<UploadResult> {
  const staff = await requireStaff();
  if (!canUploadFiles(staff.role))
    return { ok: false, message: "Your role cannot upload files." };
  if (!isStorageConfigured())
    return {
      ok: false,
      message:
        "Private file storage is not configured yet. Ask the Owner to add the R2 settings.",
    };
  const result = validateUploadRequest(staff.role, input, maxUploadBytes());
  if (!result.success)
    return {
      ok: false,
      message: Object.values(result.errors)[0]?.[0] ?? "Check the upload.",
      errors: result.errors,
    };
  const { target, ...data } = result.data;
  if (target && !(await attachmentTargetExists(target)))
    return { ok: false, message: "The record to attach to no longer exists." };

  const id = randomUUID();
  const storageKey = buildStorageKey(id);
  try {
    await db.fileAsset.create({
      data: {
        id,
        storageKey,
        originalName: data.originalName,
        description: data.description,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        accessLevel: data.accessLevel,
        retentionPolicy: data.retentionPolicy,
        retentionUntil: data.retentionUntil,
        createdById: staff.id,
        ...(target
          ? { [ATTACHMENT_TARGETS[target.type].field]: target.id }
          : {}),
      },
    });
    const uploadUrl = await createUploadUrl(storageKey, data.mimeType);
    return { ok: true, fileId: id, uploadUrl, contentType: data.mimeType };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "SET25 HQ could not start this upload." };
  }
}

export async function finalizeFileUploadAction(
  fileId: string,
): Promise<{ ok: boolean; message: string }> {
  const staff = await requireStaff();
  const file = await db.fileAsset.findFirst({
    where: { id: fileId, createdById: staff.id },
  });
  if (!file) return { ok: false, message: "This upload was not found." };
  if (file.status === "AVAILABLE") return { ok: true, message: "" };
  if (file.status !== "PENDING")
    return { ok: false, message: "This upload was cancelled." };
  if (Date.now() - file.createdAt.getTime() > PENDING_UPLOAD_WINDOW_MS)
    return { ok: false, message: "This upload expired. Upload it again." };

  try {
    const object = await inspectObject(file.storageKey);
    if (!object)
      return {
        ok: false,
        message: "The file did not reach storage. Try the upload again.",
      };
    // Only an object matching what was authorised becomes a real HQ file.
    if (
      object.sizeBytes !== file.sizeBytes ||
      object.contentType !== file.mimeType
    ) {
      await deleteObject(file.storageKey);
      await db.fileAsset.updateMany({
        where: { id: file.id, status: "PENDING" },
        data: {
          status: "DELETED",
          deletedAt: new Date(),
          deletedById: staff.id,
        },
      });
      return {
        ok: false,
        message: "The uploaded file did not match the request and was removed.",
      };
    }
    await db.fileAsset.updateMany({
      where: { id: file.id, status: "PENDING" },
      data: { status: "AVAILABLE", finalizedAt: new Date() },
    });
  } catch (error) {
    console.error(error);
    return { ok: false, message: "SET25 HQ could not confirm this upload." };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "" };
}

/** Called when the browser upload fails; keeps the record out of every list. */
export async function abandonFileUploadAction(fileId: string) {
  const staff = await requireStaff();
  const file = await db.fileAsset.findFirst({
    where: { id: fileId, createdById: staff.id, status: "PENDING" },
  });
  if (!file) return;
  try {
    await deleteObject(file.storageKey);
  } catch (error) {
    // Pending records are never listed or downloadable, so leaving one is safe.
    console.error(error);
    return;
  }
  await db.fileAsset.updateMany({
    where: { id: file.id, status: "PENDING" },
    data: { status: "DELETED", deletedAt: new Date(), deletedById: staff.id },
  });
}

async function manageableFile(fileId: string) {
  const staff = await requireStaff();
  const file = await db.fileAsset.findFirst({
    where: {
      id: fileId,
      status: "AVAILABLE",
      accessLevel: { in: accessibleLevels(staff.role) },
    },
  });
  if (!file || !canManageFile(staff.role, file)) return { staff, file: null };
  return { staff, file };
}

export async function updateFileAction(
  fileId: string,
  _state: FileFormState,
  formData: FormData,
): Promise<FileFormState> {
  const { staff, file } = await manageableFile(fileId);
  if (!file)
    return { status: "error", message: "You cannot change this file." };
  const errors: Record<string, string[]> = {};
  const text = (key: string) => String(formData.get(key) ?? "");
  const data = validateAccessAndRetention(
    staff.role,
    {
      accessLevel: text("accessLevel"),
      retentionPolicy: text("retentionPolicy"),
      retentionUntil: text("retentionUntil"),
      description: text("description"),
    },
    errors,
  );
  if (Object.keys(errors).length)
    return {
      status: "error",
      message: "Check the highlighted details.",
      errors,
    };
  await db.fileAsset.update({ where: { id: file.id }, data });
  revalidatePath("/", "layout");
  return { status: "success", message: "File details saved." };
}

export async function deleteFileAction(
  fileId: string,
  _state: FileFormState,
  formData: FormData,
): Promise<FileFormState> {
  const { staff, file } = await manageableFile(fileId);
  if (!file)
    return { status: "error", message: "You cannot delete this file." };
  try {
    await deleteObject(file.storageKey);
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message:
        "The file could not be removed from storage, so it was not deleted. Try again.",
    };
  }
  await db.fileAsset.updateMany({
    where: { id: file.id, status: "AVAILABLE" },
    data: { status: "DELETED", deletedAt: new Date(), deletedById: staff.id },
  });
  revalidatePath("/", "layout");
  const returnTo = String(formData.get("returnTo") ?? "");
  if (returnTo.startsWith("/") && !returnTo.startsWith("//"))
    redirect(returnTo);
  return { status: "success", message: "File deleted." };
}
