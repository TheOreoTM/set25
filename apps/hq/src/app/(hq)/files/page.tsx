import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { Select } from "@/components/ui/select";
import { fileAccessLevelLabels } from "@set25/shared";
import { FileRow } from "@/components/files/file-row";
import { FileUploadDialog } from "@/components/files/file-upload-dialog";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getAttachmentTargetOptions, getFiles } from "@/lib/files/data";
import {
  FILE_CATEGORIES,
  accessibleLevels,
  canUploadFiles,
} from "@/lib/files/policy";
import { isStorageConfigured, maxUploadBytes } from "@/lib/files/storage";

export const metadata = { title: "Files" };

type SearchParams = {
  search?: string;
  access?: string;
  category?: string;
  retention?: string;
};

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [staff, query] = await Promise.all([requireStaff(), searchParams]);
  const canUpload = canUploadFiles(staff.role);
  const [files, targetOptions] = await Promise.all([
    getFiles(staff.role, query),
    canUpload ? getAttachmentTargetOptions() : Promise.resolve([]),
  ]);
  const levels = accessibleLevels(staff.role);
  const filtered = Boolean(
    query.search || query.access || query.category || query.retention,
  );

  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Company / Files"
        title="Files"
        description="Private SET25 documents and assets. Access is checked on every open."
      />
      {canUpload && !isStorageConfigured() ? (
        <div className="form-message form-message--error" role="alert">
          Private file storage is not configured yet, so uploads and downloads
          are unavailable. Add the R2 environment variables to enable them.
        </div>
      ) : null}
      <div className="resource-toolbar">
        <form
          className="filter-bar commerce-filter-bar files-filter-bar"
          action="/files"
        >
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search files</span>
            <input
              name="search"
              defaultValue={query.search ?? ""}
              placeholder="Search filename or note"
            />
          </label>
          <label>
            <span className="sr-only">Access</span>
            <Select name="access" defaultValue={query.access ?? ""}>
              <option value="">All access</option>
              {levels.map((level) => (
                <option value={level} key={level}>
                  {fileAccessLevelLabels[level]}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">Type</span>
            <Select name="category" defaultValue={query.category ?? ""}>
              <option value="">All types</option>
              {FILE_CATEGORIES.map((category) => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">Retention</span>
            <Select name="retention" defaultValue={query.retention ?? ""}>
              <option value="">Any retention</option>
              <option value="active">Current</option>
              <option value="dated">Has expiry date</option>
              <option value="expired">Retention expired</option>
            </Select>
          </label>
          <button
            className="button button--secondary filter-submit"
            type="submit"
          >
            <SlidersHorizontal aria-hidden="true" /> Apply
          </button>
        </form>
        {canUpload ? (
          <FileUploadDialog
            targetOptions={targetOptions}
            accessLevels={levels}
            maxBytes={maxUploadBytes()}
          />
        ) : null}
      </div>
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Library</p>
            <h2>
              {files.length} {files.length === 1 ? "file" : "files"}
            </h2>
          </div>
          <p>Newest first</p>
        </div>
        {files.length ? (
          <div className="file-list">
            <div className="file-row file-row--head">
              <span>File / Attached to</span>
              <span>Type</span>
              <span>Size</span>
              <span>Uploaded</span>
              <span>Access</span>
              <span>Retention</span>
              <span />
            </div>
            {files.map((file) => (
              <FileRow file={file} showAttachment key={file.id} />
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            {filtered ? (
              <>
                <p>No files match these filters.</p>
                <span>Try a different search or filter.</span>
                <Link href="/files">
                  Clear filters <ArrowRight aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p>No files yet.</p>
                {canUpload ? (
                  <span>Use Upload file to add the first document.</span>
                ) : null}
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
