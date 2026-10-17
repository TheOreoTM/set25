import Link from "next/link";
import { Download, Eye } from "lucide-react";
import { fileAccessLevelLabels, formatFileSize } from "@set25/shared";
import { deleteFileAction } from "@/lib/files/actions";
import type { FileDto } from "@/lib/files/data";
import { formatDate } from "@/lib/supply/presentation";
import { FileDeleteButton } from "./file-actions";

export function retentionText(
  file: Pick<FileDto, "retentionUntil" | "expired">,
) {
  if (!file.retentionUntil) return "Permanent";
  const date = formatDate(new Date(file.retentionUntil));
  return file.expired ? `Expired ${date}` : `Until ${date}`;
}

/** One compact file row, shared by record panels and the Files library. */
export function FileRow({
  file,
  showAttachment = false,
}: {
  file: FileDto;
  showAttachment?: boolean;
}) {
  return (
    <article className={`file-row${file.expired ? " is-expired" : ""}`}>
      <span className="commerce-primary">
        <Link className="file-name" href={`/files/${file.id}`}>
          {file.originalName}
        </Link>
        <small>
          {showAttachment
            ? file.attachedTo
              ? `${file.attachedTo.type} · ${file.attachedTo.label}`
              : "General document"
            : (file.description ?? file.category)}
        </small>
      </span>
      <span data-label="Type">{file.category}</span>
      <span data-label="Size">{formatFileSize(file.sizeBytes)}</span>
      <span data-label="Uploaded">
        {file.createdBy}
        <small>{formatDate(new Date(file.createdAt))}</small>
      </span>
      <span data-label="Access">{fileAccessLevelLabels[file.accessLevel]}</span>
      <span
        data-label="Retention"
        className={file.expired ? "file-retention-expired" : undefined}
      >
        {retentionText(file)}
      </span>
      <span className="file-row-actions">
        {file.canDownload ? (
          <>
            {file.canPreview ? (
              <a
                className="icon-button"
                href={`/files/${file.id}/download?inline=1`}
                target="_blank"
                rel="noreferrer"
                aria-label={`View ${file.originalName}`}
                title="View"
              >
                <Eye aria-hidden="true" />
              </a>
            ) : null}
            <a
              className="icon-button"
              href={`/files/${file.id}/download`}
              aria-label={`Download ${file.originalName}`}
              title="Download"
            >
              <Download aria-hidden="true" />
            </a>
          </>
        ) : null}
        {file.canManage ? (
          <FileDeleteButton
            action={deleteFileAction.bind(null, file.id)}
            fileName={file.originalName}
          />
        ) : null}
      </span>
    </article>
  );
}
