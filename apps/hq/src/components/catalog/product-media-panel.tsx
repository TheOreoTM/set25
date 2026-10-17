"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from "lucide-react";
import {
  abandonProductMediaAction,
  deleteProductMediaAction,
  finalizeProductMediaAction,
  moveProductMediaAction,
  prepareProductMediaUploadAction,
  setPrimaryProductMediaAction,
} from "@/lib/catalog/media-actions";
import {
  PRODUCT_MEDIA_ACCEPT,
  PRODUCT_MEDIA_MAX_BYTES,
  resolveProductImageMime,
} from "@/lib/catalog/media-policy";

export type ProductMediaItem = {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
};

export function ProductMediaPanel({
  productId,
  media,
  canWrite,
  configured,
}: {
  productId: string;
  media: ProductMediaItem[];
  canWrite: boolean;
  configured: boolean;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const busy = uploading || pending;

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get("image");
    const altText = String(data.get("altText") ?? "");
    if (!(file instanceof File) || !file.size)
      return setMessage("Choose an image to upload.");
    if (!resolveProductImageMime(file.name, file.type))
      return setMessage("Use a JPG, PNG, or WEBP image.");
    if (file.size > PRODUCT_MEDIA_MAX_BYTES)
      return setMessage("Images must be 10 MB or smaller.");
    setUploading(true);
    setMessage("");
    try {
      const prepared = await prepareProductMediaUploadAction({
        productId,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        altText,
      });
      if (!prepared.ok) return setMessage(prepared.message);
      const response = await fetch(prepared.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": prepared.contentType },
        body: file,
      }).catch(() => null);
      if (!response?.ok) {
        await abandonProductMediaAction(prepared.mediaId);
        return setMessage("The upload did not complete. Try again.");
      }
      const finalized = await finalizeProductMediaAction(prepared.mediaId);
      if (!finalized.ok) return setMessage(finalized.message);
      form.current?.reset();
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? "" : (result.message ?? "Try again."));
      router.refresh();
    });
  }

  return (
    <section
      className="resource-panel detail-section"
      aria-labelledby="store-media-title"
    >
      <div className="resource-panel-head">
        <div>
          <p className="kicker">Public Store</p>
          <h2 id="store-media-title">Store images</h2>
        </div>
        <p>Public images only · first is the cover</p>
      </div>
      {media.length ? (
        <ul className="product-media-grid">
          {media.map((item, index) => (
            <li key={item.id}>
              <div className="product-media-thumb">
                <Image
                  src={item.url}
                  alt={item.altText}
                  fill
                  sizes="180px"
                  unoptimized
                />
                {item.isPrimary ? (
                  <span className="product-media-badge">Cover</span>
                ) : null}
              </div>
              <p>{item.altText}</p>
              {canWrite ? (
                <div className="product-media-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Move image ${index + 1} earlier`}
                    disabled={busy || index === 0}
                    onClick={() =>
                      run(() => moveProductMediaAction(item.id, "up"))
                    }
                  >
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Move image ${index + 1} later`}
                    disabled={busy || index === media.length - 1}
                    onClick={() =>
                      run(() => moveProductMediaAction(item.id, "down"))
                    }
                  >
                    <ArrowDown aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Use image ${index + 1} as cover`}
                    aria-pressed={item.isPrimary}
                    disabled={busy || item.isPrimary}
                    onClick={() =>
                      run(() => setPrimaryProductMediaAction(item.id))
                    }
                  >
                    <Star aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remove image ${index + 1}`}
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this image from the public Store? This deletes the public file.",
                        )
                      )
                        run(() => deleteProductMediaAction(item.id));
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="inline-empty">
          <p>No Store images yet.</p>
          <span>The Store shows a branded placeholder until one is added.</span>
        </div>
      )}
      {canWrite ? (
        configured ? (
          <form className="embedded-editor" ref={form} onSubmit={upload}>
            <div className="form-grid">
              <label className="field">
                <span>Image</span>
                <input
                  type="file"
                  name="image"
                  accept={PRODUCT_MEDIA_ACCEPT}
                  required
                  disabled={busy}
                />
                <small>JPG, PNG, or WEBP · up to 10 MB · publicly visible</small>
              </label>
              <label className="field">
                <span>Alt text</span>
                <input
                  name="altText"
                  required
                  minLength={3}
                  maxLength={160}
                  placeholder="Black SET25 knee pads, side view"
                  disabled={busy}
                />
                <small>Describe the image for customers using screen readers.</small>
              </label>
            </div>
            {message ? (
              <div className="form-message form-message--error" role="alert">
                {message}
              </div>
            ) : null}
            <div className="form-actions">
              <button
                className="button button--dark"
                type="submit"
                disabled={busy}
              >
                <ImagePlus aria-hidden="true" />
                {uploading ? "Uploading…" : "Add Store image"}
              </button>
            </div>
          </form>
        ) : (
          <div className="inline-empty">
            <p>Public Store media storage is not configured.</p>
            <span>
              Add R2_PUBLIC_BUCKET_NAME and PUBLIC_MEDIA_BASE_URL to enable
              uploads.
            </span>
          </div>
        )
      ) : message ? (
        <div className="form-message form-message--error" role="alert">
          {message}
        </div>
      ) : null}
    </section>
  );
}
