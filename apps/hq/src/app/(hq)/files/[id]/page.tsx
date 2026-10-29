import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Eye } from "lucide-react";
import { fileAccessLevelLabels, formatFileSize } from "@set25/shared";
import {
  FileDeleteButton,
  FileDetailsEditor,
} from "@/components/files/file-actions";
import { retentionText } from "@/components/files/file-row";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { deleteFileAction, updateFileAction } from "@/lib/files/actions";
import { getFile } from "@/lib/files/data";
import { accessibleLevels } from "@/lib/files/policy";
import { maldivesDateKey } from "@/lib/planning/date-range";
import { formatDateTime } from "@/lib/supply/presentation";

export const metadata = { title: "File" };

const blockedMessages: Record<string, string> = {
  deleted: "This file was deleted and can no longer be opened.",
  expired:
    "This file's retention period has ended, so it can no longer be opened.",
  storage: "Private file storage is not configured, so files cannot be opened.",
};

export default async function FilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ blocked?: string }>;
}) {
  const [{ id }, { blocked }, staff] = await Promise.all([
    params,
    searchParams,
    requireStaff(),
  ]);
  const file = await getFile(id, staff.role);
  if (!file) notFound();
  const deleted = file.status === "DELETED";
  const statusLabel = deleted
    ? "Deleted"
    : file.expired
      ? "Retention expired"
      : "Available";

  return (
    <main className="page-wrap supply-detail-page">
      <PageHeader
        eyebrow="Company / Files"
        title={file.originalName}
        titleMeta={
          <span
            className={`status status--${deleted ? "cancelled" : file.expired ? "open" : "active"}`}
          >
            {statusLabel}
          </span>
        }
        description={`${file.category} · ${formatFileSize(file.sizeBytes)}`}
      />
      <div className="detail-actions">
        <Link className="text-link back-link" href="/files">
          <ArrowLeft aria-hidden="true" /> All files
        </Link>
        <div>
          {file.canDownload && file.canPreview ? (
            <a
              className="button button--secondary"
              href={`/files/${file.id}/download?inline=1`}
              target="_blank"
              rel="noreferrer"
            >
              <Eye aria-hidden="true" /> View
            </a>
          ) : null}
          {file.canDownload ? (
            <a
              className="button button--dark"
              href={`/files/${file.id}/download`}
            >
              <Download aria-hidden="true" /> Download
            </a>
          ) : null}
        </div>
      </div>
      {blocked && blockedMessages[blocked] ? (
        <div className="form-message form-message--error" role="alert">
          {blockedMessages[blocked]}
        </div>
      ) : file.expired && !deleted ? (
        <div className="form-message form-message--error" role="alert">
          Retention for this file has ended. It is kept only so the Owner can
          remove it permanently.
        </div>
      ) : null}

      <section
        className="supply-summary-strip supply-summary-strip--four"
        aria-label="File summary"
      >
        <SummaryFact
          label="Attached To"
          value={
            file.attachedTo ? (
              <Link href={file.attachedTo.href}>
                {file.attachedTo.type} · {file.attachedTo.label}
              </Link>
            ) : (
              "General document"
            )
          }
        />
        <SummaryFact
          label="Access"
          value={fileAccessLevelLabels[file.accessLevel]}
        />
        <SummaryFact label="Retention" value={retentionText(file)} />
        <SummaryFact
          label="Uploaded"
          value={`${file.createdBy} · ${formatDateTime(new Date(file.createdAt))}`}
        />
      </section>

      <div className="supply-detail-grid">
        <section className="detail-section supply-main-panel compact-detail-section">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Details</p>
              <h2>{file.canManage ? "Access and retention" : "File record"}</h2>
            </div>
          </div>
          {file.canManage ? (
            <FileDetailsEditor
              action={updateFileAction.bind(null, file.id)}
              accessLevels={accessibleLevels(staff.role)}
              defaults={{
                accessLevel: file.accessLevel,
                retentionPolicy: file.retentionPolicy,
                retentionUntil: file.retentionUntil
                  ? maldivesDateKey(new Date(file.retentionUntil))
                  : "",
                description: file.description ?? "",
              }}
            />
          ) : (
            <dl className="rail-stat-list rail-stat-list--text">
              <TextStat label="Note" value={file.description ?? "—"} />
              <TextStat label="Type" value={file.mimeType} />
              {deleted ? (
                <TextStat
                  label="Deleted"
                  value={`${file.deletedBy ?? "Former staff"} · ${formatDateTime(new Date(file.deletedAt!))}`}
                />
              ) : null}
            </dl>
          )}
        </section>
        {file.canManage ? (
          <aside className="supply-side-rail">
            <section className="detail-section supply-summary-card">
              <div className="detail-section-head">
                <div>
                  <p className="kicker">Remove</p>
                  <h2>Delete file</h2>
                </div>
              </div>
              <p className="file-delete-copy">
                Removes the file from private storage. The record stays for
                audit, marked deleted.
              </p>
              <FileDeleteButton
                action={deleteFileAction.bind(null, file.id)}
                fileName={file.originalName}
                returnTo="/files"
                variant="button"
              />
            </section>
          </aside>
        ) : null}
      </div>
    </main>
  );
}

function SummaryFact({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TextStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
