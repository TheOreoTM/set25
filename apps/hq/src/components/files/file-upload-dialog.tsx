"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Upload } from "lucide-react";
import {
  fileAccessLevelLabels,
  formatFileSize,
  type FileAccessLevelValue,
} from "@set25/shared";
import {
  abandonFileUploadAction,
  finalizeFileUploadAction,
  prepareFileUploadAction,
} from "@/lib/files/actions";
import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_TYPES_LABEL,
  resolveAllowedMime,
} from "@/lib/files/policy";

type Phase =
  | { name: "idle" }
  | { name: "uploading"; progress: number }
  | { name: "finalizing" }
  | { name: "error"; message: string };

export type AttachmentOption = { group: string; value: string; label: string };

export function FileUploadDialog({
  target,
  targetLabel,
  targetOptions,
  accessLevels,
  maxBytes,
  compact = false,
}: {
  /** Fixed attachment target ("TYPE:id") when opened from a record page. */
  target?: string;
  targetLabel?: string;
  /** Optional target choices when opened from /files. */
  targetOptions?: AttachmentOption[];
  accessLevels: FileAccessLevelValue[];
  maxBytes: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [retention, setRetention] = useState("PERMANENT");
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [dragging, setDragging] = useState(false);
  const titleId = useId();
  const busy = phase.name === "uploading" || phase.name === "finalizing";
  const groups = (targetOptions ?? []).reduce(
    (map, option) =>
      map.set(option.group, [...(map.get(option.group) ?? []), option]),
    new Map<string, AttachmentOption[]>(),
  );

  function close() {
    if (busy) return;
    setOpen(false);
    setFile(null);
    setRetention("PERMANENT");
    setPhase({ name: "idle" });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || busy) return;
    if (!resolveAllowedMime(file.name, file.type))
      return setPhase({
        name: "error",
        message: `This file type is not supported. Use ${ALLOWED_TYPES_LABEL}.`,
      });
    if (file.size > maxBytes)
      return setPhase({
        name: "error",
        message: `This file is ${formatFileSize(file.size)}. The limit is ${formatFileSize(maxBytes)}.`,
      });

    const data = new FormData(event.currentTarget);
    setPhase({ name: "uploading", progress: 0 });
    const prepared = await prepareFileUploadAction({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      accessLevel: String(data.get("accessLevel") ?? ""),
      retentionPolicy: String(data.get("retentionPolicy") ?? ""),
      retentionUntil: String(data.get("retentionUntil") ?? ""),
      description: String(data.get("description") ?? ""),
      target: target ?? String(data.get("target") ?? ""),
    });
    if (!prepared.ok)
      return setPhase({ name: "error", message: prepared.message });

    const uploaded = await putFile(
      prepared.uploadUrl,
      prepared.contentType,
      file,
      (progress) => setPhase({ name: "uploading", progress }),
    );
    if (!uploaded) {
      await abandonFileUploadAction(prepared.fileId);
      return setPhase({
        name: "error",
        message:
          "The upload did not complete. Check your connection and try again.",
      });
    }

    setPhase({ name: "finalizing" });
    const finalized = await finalizeFileUploadAction(prepared.fileId);
    if (!finalized.ok)
      return setPhase({ name: "error", message: finalized.message });
    setPhase({ name: "idle" });
    setOpen(false);
    setFile(null);
    form.current?.reset();
    router.refresh();
  }

  return (
    <>
      <button
        className={compact ? "button button--secondary" : "button button--dark"}
        type="button"
        onClick={() => setOpen(true)}
      >
        <Upload aria-hidden="true" /> Upload file
      </button>
      {open ? (
        <ModalDialog
          titleId={titleId}
          kicker="Private file"
          title="Upload file"
          onClose={close}
          busy={busy}
          className="supply-editor-dialog file-upload-dialog"
        >
          <form className="dialog-body" ref={form} onSubmit={submit}>
            <div className="field">
              <span>File</span>
              <div
                className={`file-drop${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!busy) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  const dropped = event.dataTransfer.files?.[0];
                  if (!busy && dropped) {
                    setFile(dropped);
                    setPhase({ name: "idle" });
                  }
                }}
              >
                <input
                  id={`${titleId}-file`}
                  className="file-drop-input"
                  type="file"
                  name="file"
                  accept={ACCEPT_ATTRIBUTE}
                  disabled={busy}
                  onChange={(event) => {
                    setFile(event.currentTarget.files?.[0] ?? null);
                    setPhase({ name: "idle" });
                  }}
                />
                <label className="file-drop-zone" htmlFor={`${titleId}-file`}>
                  <FileUp aria-hidden="true" />
                  {file ? (
                    <span>
                      <strong>{file.name}</strong>
                      <small>
                        {formatFileSize(file.size)} · Choose a different file
                      </small>
                    </span>
                  ) : (
                    <span>
                      <strong>Choose a file or drag it here</strong>
                      <small>
                        {ALLOWED_TYPES_LABEL} · up to {formatFileSize(maxBytes)}
                      </small>
                    </span>
                  )}
                </label>
              </div>
            </div>
            {target ? (
              <div className="file-upload-target">
                <span>Attach to</span>
                <strong>{targetLabel ?? "This record"}</strong>
              </div>
            ) : targetOptions ? (
              <label className="field">
                <span>Attach to</span>
                <Select name="target" defaultValue="" disabled={busy}>
                  <option value="">Not attached (general document)</option>
                  {[...groups.entries()].map(([group, options]) => (
                    <optgroup label={group} key={group}>
                      {options.map((option) => (
                        <option value={option.value} key={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </label>
            ) : null}
            <div className="form-grid form-grid--dialog">
              <label className="field">
                <span>Access</span>
                <Select
                  name="accessLevel"
                  defaultValue={
                    accessLevels.includes("MANAGER_AND_OWNER")
                      ? "MANAGER_AND_OWNER"
                      : accessLevels[0]
                  }
                  disabled={busy}
                >
                  {accessLevels.map((level) => (
                    <option value={level} key={level}>
                      {fileAccessLevelLabels[level]}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="field">
                <span>Retention</span>
                <Select
                  name="retentionPolicy"
                  value={retention}
                  onChange={(event) => setRetention(event.target.value)}
                  disabled={busy}
                >
                  <option value="PERMANENT">Permanent</option>
                  <option value="UNTIL_DATE">Until date</option>
                </Select>
              </label>
              {retention === "UNTIL_DATE" ? (
                <label className="field">
                  <span>Expires on</span>
                  <DatePicker name="retentionUntil" required disabled={busy} />
                </label>
              ) : null}
            </div>
            <label className="field">
              <span>Note</span>
              <input
                name="description"
                maxLength={500}
                placeholder="Optional, e.g. signed agreement or customs invoice"
                disabled={busy}
              />
            </label>
            {phase.name === "uploading" || phase.name === "finalizing" ? (
              <div className="file-upload-progress" role="status">
                <div>
                  <span
                    style={{
                      width: `${phase.name === "finalizing" ? 100 : phase.progress}%`,
                    }}
                  />
                </div>
                <small>
                  {phase.name === "finalizing"
                    ? "Confirming upload…"
                    : `Uploading… ${phase.progress}%`}
                </small>
              </div>
            ) : null}
            {phase.name === "error" ? (
              <div className="form-message form-message--error" role="alert">
                {phase.message}
              </div>
            ) : null}
            <div className="dialog-actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={close}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="button button--dark"
                type="submit"
                disabled={!file || busy}
              >
                <Upload aria-hidden="true" />
                {busy ? "Uploading…" : "Upload"}
              </button>
            </div>
          </form>
        </ModalDialog>
      ) : null}
    </>
  );
}

/** Direct browser → private storage upload with progress. */
function putFile(
  url: string,
  contentType: string,
  file: File,
  onProgress: (percent: number) => void,
) {
  return new Promise<boolean>((resolve) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", contentType);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () =>
      resolve(request.status >= 200 && request.status < 300);
    request.onerror = () => resolve(false);
    request.onabort = () => resolve(false);
    request.send(file);
  });
}
