"use server";

import { db } from "@set25/database";
import { revalidatePath } from "next/cache";
import { requireOperationalAccess } from "@/lib/auth/session";
import {
  buildPublicMediaKey,
  createPublicMediaUploadUrl,
  deletePublicMediaObject,
  inspectPublicMediaObject,
  isPublicMediaConfigured,
} from "@/lib/files/storage";
import {
  PRODUCT_MEDIA_MAX_BYTES,
  resolveProductImageMime,
} from "./media-policy";

// Public Store imagery. Same lifecycle as private files (PENDING → browser
// PUT → verified AVAILABLE), but objects go to the separate public media
// bucket and are only ever product images chosen deliberately by staff.

const PENDING_WINDOW_MS = 60 * 60 * 1000;

type Result = { ok: true } | { ok: false; message: string };

export async function prepareProductMediaUploadAction(input: {
  productId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
}): Promise<
  | { ok: true; mediaId: string; uploadUrl: string; contentType: string }
  | { ok: false; message: string }
> {
  const staff = await requireOperationalAccess();
  if (!isPublicMediaConfigured())
    return {
      ok: false,
      message:
        "Public Store media storage is not configured. Add R2_PUBLIC_BUCKET_NAME and PUBLIC_MEDIA_BASE_URL.",
    };
  const mimeType = resolveProductImageMime(input.fileName, input.mimeType);
  if (!mimeType)
    return { ok: false, message: "Use a JPG, PNG, or WEBP image." };
  if (
    !Number.isInteger(input.sizeBytes) ||
    input.sizeBytes <= 0 ||
    input.sizeBytes > PRODUCT_MEDIA_MAX_BYTES
  )
    return { ok: false, message: "Images must be 10 MB or smaller." };
  const altText = input.altText.trim();
  if (altText.length < 3 || altText.length > 160)
    return {
      ok: false,
      message: "Describe the image for customers in 3 to 160 characters.",
    };
  const product = await db.product.findUnique({
    where: { id: input.productId },
    select: { id: true, media: { select: { sortOrder: true } } },
  });
  if (!product) return { ok: false, message: "This product no longer exists." };

  const storageKey = buildPublicMediaKey(product.id);
  try {
    const media = await db.productMedia.create({
      data: {
        productId: product.id,
        storageKey,
        mimeType,
        sizeBytes: input.sizeBytes,
        altText,
        sortOrder:
          Math.max(-1, ...product.media.map((item) => item.sortOrder)) + 1,
        createdById: staff.id,
      },
      select: { id: true },
    });
    const uploadUrl = await createPublicMediaUploadUrl(storageKey, mimeType);
    return { ok: true, mediaId: media.id, uploadUrl, contentType: mimeType };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "SET25 HQ could not start this upload." };
  }
}

export async function finalizeProductMediaAction(
  mediaId: string,
): Promise<Result> {
  const staff = await requireOperationalAccess();
  const media = await db.productMedia.findFirst({
    where: { id: mediaId, createdById: staff.id },
  });
  if (!media) return { ok: false, message: "This upload was not found." };
  if (media.status === "AVAILABLE") return { ok: true };
  if (
    media.status !== "PENDING" ||
    Date.now() - media.createdAt.getTime() > PENDING_WINDOW_MS
  )
    return { ok: false, message: "This upload expired. Upload it again." };
  try {
    const object = await inspectPublicMediaObject(media.storageKey);
    if (!object)
      return { ok: false, message: "The image did not reach storage." };
    if (
      object.sizeBytes !== media.sizeBytes ||
      object.contentType !== media.mimeType
    ) {
      await deletePublicMediaObject(media.storageKey);
      await db.productMedia.deleteMany({
        where: { id: media.id, status: "PENDING" },
      });
      return {
        ok: false,
        message: "The uploaded image did not match the request and was removed.",
      };
    }
    await db.$transaction(async (transaction) => {
      const primary = await transaction.productMedia.count({
        where: {
          productId: media.productId,
          status: "AVAILABLE",
          isPrimary: true,
        },
      });
      await transaction.productMedia.updateMany({
        where: { id: media.id, status: "PENDING" },
        data: {
          status: "AVAILABLE",
          finalizedAt: new Date(),
          isPrimary: primary === 0,
        },
      });
    });
  } catch (error) {
    console.error(error);
    return { ok: false, message: "SET25 HQ could not confirm this upload." };
  }
  revalidatePath(`/products/${media.productId}`);
  return { ok: true };
}

export async function abandonProductMediaAction(mediaId: string) {
  const staff = await requireOperationalAccess();
  const media = await db.productMedia.findFirst({
    where: { id: mediaId, createdById: staff.id, status: "PENDING" },
  });
  if (!media) return;
  try {
    await deletePublicMediaObject(media.storageKey);
    await db.productMedia.deleteMany({
      where: { id: media.id, status: "PENDING" },
    });
  } catch (error) {
    // Pending media is never shown in the Store, so leaving it is harmless.
    console.error(error);
  }
}

async function availableMedia(mediaId: string) {
  await requireOperationalAccess();
  return db.productMedia.findFirst({
    where: { id: mediaId, status: "AVAILABLE" },
  });
}

export async function setPrimaryProductMediaAction(
  mediaId: string,
): Promise<Result> {
  const media = await availableMedia(mediaId);
  if (!media) return { ok: false, message: "This image no longer exists." };
  await db.$transaction([
    db.productMedia.updateMany({
      where: { productId: media.productId, isPrimary: true },
      data: { isPrimary: false },
    }),
    db.productMedia.update({
      where: { id: media.id },
      data: { isPrimary: true },
    }),
  ]);
  revalidatePath(`/products/${media.productId}`);
  return { ok: true };
}

export async function moveProductMediaAction(
  mediaId: string,
  direction: "up" | "down",
): Promise<Result> {
  const media = await availableMedia(mediaId);
  if (!media) return { ok: false, message: "This image no longer exists." };
  const siblings = await db.productMedia.findMany({
    where: { productId: media.productId, status: "AVAILABLE" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const ids = siblings.map((item) => item.id);
  const from = ids.indexOf(media.id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= ids.length) return { ok: true };
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await db.$transaction(
    ids.map((id, index) =>
      db.productMedia.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  revalidatePath(`/products/${media.productId}`);
  return { ok: true };
}

export async function deleteProductMediaAction(
  mediaId: string,
): Promise<Result> {
  const media = await availableMedia(mediaId);
  if (!media) return { ok: false, message: "This image no longer exists." };
  try {
    // Storage first: a failed object delete leaves the image visible rather
    // than leaving an orphaned public object with no record.
    await deletePublicMediaObject(media.storageKey);
    await db.$transaction(async (transaction) => {
      await transaction.productMedia.delete({ where: { id: media.id } });
      if (media.isPrimary) {
        const next = await transaction.productMedia.findFirst({
          where: { productId: media.productId, status: "AVAILABLE" },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true },
        });
        if (next)
          await transaction.productMedia.update({
            where: { id: next.id },
            data: { isPrimary: true },
          });
      }
    });
  } catch (error) {
    console.error(error);
    return { ok: false, message: "SET25 HQ could not remove this image." };
  }
  revalidatePath(`/products/${media.productId}`);
  return { ok: true };
}
