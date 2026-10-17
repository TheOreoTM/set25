import "server-only";

import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { DEFAULT_MAX_UPLOAD_BYTES } from "./policy";

// Small private object-storage adapter. Business code talks to these functions
// only, so the S3-compatible provider (Cloudflare R2 by default) can change
// without touching file workflows. Credentials never leave the server.

const UPLOAD_URL_SECONDS = 10 * 60;
const DOWNLOAD_URL_SECONDS = 60;

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Private file storage is not configured. Add the R2_* environment variables to enable uploads.",
    );
  }
}

function storageConfig() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  if (!accessKeyId || !secretAccessKey || !bucket || !endpoint) return null;
  return { accessKeyId, secretAccessKey, bucket, endpoint };
}

export function isStorageConfigured() {
  return storageConfig() !== null;
}

export function maxUploadBytes() {
  const configured = Number(process.env.FILE_MAX_UPLOAD_BYTES);
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_UPLOAD_BYTES;
}

let cached: { client: S3Client; bucket: string } | null = null;

function storage() {
  if (cached) return cached;
  const config = storageConfig();
  if (!config) throw new StorageNotConfiguredError();
  cached = {
    bucket: config.bucket,
    client: new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      // <endpoint>/<bucket>/<key>: works with any S3-compatible endpoint and
      // never derives a bucket subdomain from the endpoint host.
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // Newer SDK defaults add checksum headers to presigned PUTs, which a
      // plain browser upload cannot satisfy.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    }),
  };
  return cached;
}

/** Generated object key. User filenames never become part of the key. */
export function buildStorageKey(fileId: string) {
  const prefix =
    process.env.R2_KEY_PREFIX ||
    `set25/${process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development"}`;
  return `${prefix}/${fileId}/${randomUUID()}`;
}

export async function createUploadUrl(key: string, contentType: string) {
  const { client, bucket } = storage();
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: UPLOAD_URL_SECONDS },
  );
}

/** Returns object size/type, or null when the object does not exist. */
export async function inspectObject(key: string) {
  const { client, bucket } = storage();
  try {
    const result = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    return {
      sizeBytes: result.ContentLength ?? 0,
      contentType: result.ContentType ?? "",
    };
  } catch (error) {
    if (
      error instanceof NotFound ||
      (error instanceof S3ServiceException &&
        error.$metadata.httpStatusCode === 404)
    )
      return null;
    throw error;
  }
}

export async function createDownloadUrl(input: {
  key: string;
  fileName: string;
  contentType: string;
  inline: boolean;
}) {
  const { client, bucket } = storage();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: input.key,
      ResponseContentType: input.contentType,
      ResponseContentDisposition: contentDisposition(
        input.inline ? "inline" : "attachment",
        input.fileName,
      ),
    }),
    { expiresIn: DOWNLOAD_URL_SECONDS },
  );
}

/** Idempotent: deleting a missing object succeeds. */
export async function deleteObject(key: string) {
  const { client, bucket } = storage();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

function contentDisposition(type: "inline" | "attachment", fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
