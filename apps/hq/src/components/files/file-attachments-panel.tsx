import type { StaffIdentity } from "@/lib/auth/types";
import { getRecordFiles } from "@/lib/files/data";
import {
  accessibleLevels,
  canUploadFiles,
  type AttachmentTarget,
} from "@/lib/files/policy";
import { maxUploadBytes } from "@/lib/files/storage";
import { FileRow } from "./file-row";
import { FileUploadDialog } from "./file-upload-dialog";

/**
 * Reusable compact "Files" section for any attachable SET25 record. Loads only
 * files the viewer's current role may see.
 */
export async function FileAttachmentsPanel({
  staff,
  target,
  targetLabel,
}: {
  staff: StaffIdentity;
  target: AttachmentTarget;
  targetLabel: string;
}) {
  const files = await getRecordFiles(target, staff.role);
  const canUpload = canUploadFiles(staff.role);
  return (
    <section className="detail-section file-panel" aria-label="Files">
      <div className="detail-section-head">
        <div>
          <p className="kicker">Files</p>
          <h2>
            {files.length
              ? `${files.length} ${files.length === 1 ? "file" : "files"}`
              : "Attachments"}
          </h2>
        </div>
        {canUpload ? (
          <FileUploadDialog
            compact
            target={`${target.type}:${target.id}`}
            targetLabel={targetLabel}
            accessLevels={accessibleLevels(staff.role)}
            maxBytes={maxUploadBytes()}
          />
        ) : null}
      </div>
      {files.length ? (
        <div className="file-list">
          {files.map((file) => (
            <FileRow file={file} key={file.id} />
          ))}
        </div>
      ) : (
        <p className="file-panel-empty">
          No files attached{canUpload ? " yet" : " that you can access"}.
        </p>
      )}
    </section>
  );
}
