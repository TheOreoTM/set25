import { db } from "@set25/database";
import { NextResponse, type NextRequest } from "next/server";
import { requireStaff } from "@/lib/auth/session";
import {
  accessibleLevels,
  canPreviewInline,
  isRetentionExpired,
} from "@/lib/files/policy";
import { createDownloadUrl, isStorageConfigured } from "@/lib/files/storage";

// Every open/download re-checks the session, the current DB role, file status,
// and retention before signing a 60-second URL. Permanent object URLs are
// never exposed.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ id }, staff] = await Promise.all([params, requireStaff()]);
  const file = await db.fileAsset.findFirst({
    where: { id, accessLevel: { in: accessibleLevels(staff.role) } },
    select: {
      id: true,
      status: true,
      storageKey: true,
      originalName: true,
      mimeType: true,
      retentionUntil: true,
    },
  });
  // Files the viewer cannot access are indistinguishable from missing ones.
  if (!file || file.status === "PENDING")
    return new NextResponse("File not found.", { status: 404 });

  const blocked =
    file.status === "DELETED"
      ? "deleted"
      : isRetentionExpired(file.retentionUntil)
        ? "expired"
        : !isStorageConfigured()
          ? "storage"
          : null;
  if (blocked)
    return NextResponse.redirect(
      new URL(`/files/${file.id}?blocked=${blocked}`, request.url),
      303,
    );

  const inline =
    request.nextUrl.searchParams.get("inline") === "1" &&
    canPreviewInline(file.mimeType);
  const url = await createDownloadUrl({
    key: file.storageKey,
    fileName: file.originalName,
    contentType: file.mimeType,
    inline,
  });
  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
