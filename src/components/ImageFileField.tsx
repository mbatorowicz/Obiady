"use client";

import { useEffect, useId, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { ThumbPlaceholder, ZoomableImage } from "@/components/ZoomableImage";
import { compressImage } from "@/lib/compress-image";
import { normalizeImageSrc } from "@/lib/image-url";

export function ImageFileField({
  name,
  urlName,
  label = "Zdjęcie",
  existingSrc,
  existingAlt,
  existingCaption,
  removeName,
  size = 56,
}: {
  name: string;
  urlName: string;
  label?: string;
  existingSrc?: string | null;
  existingAlt: string;
  existingCaption?: string;
  removeName?: string;
  size?: number;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "ready">("idle");
  const [localFallback, setLocalFallback] = useState(false);
  const normalizedExisting = normalizeImageSrc(existingSrc ?? null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function onFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setUploadedUrl(null);
    setLocalFallback(false);
    setStatus("idle");

    if (!file) return;

    setStatus("uploading");
    const compressed = await compressImage(file);
    setPreview(URL.createObjectURL(compressed));

    try {
      const blob = await upload(`menu/${compressed.name}`, compressed, {
        access: "public",
        handleUploadUrl: "/api/menu-upload",
      });
      setUploadedUrl(blob.url);
      setLocalFallback(false);
      if (fileRef.current) fileRef.current.value = "";
      setStatus("ready");
    } catch {
      // No Blob token (local): submit compressed file via Server Action
      const dt = new DataTransfer();
      dt.items.add(compressed);
      if (fileRef.current) fileRef.current.files = dt.files;
      setLocalFallback(true);
      setStatus("ready");
    }
  }

  return (
    <div className="image-file-field">
      <input type="hidden" name={urlName} value={uploadedUrl ?? ""} />
      <div className="image-file-preview">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Podgląd nowego zdjęcia"
            width={size}
            height={size}
            className="thumb"
            style={{ width: size, height: size }}
          />
        ) : normalizedExisting ? (
          <ZoomableImage
            src={normalizedExisting}
            alt={existingAlt}
            caption={existingCaption}
            size={size}
          />
        ) : (
          <ThumbPlaceholder label={existingAlt} size={size} />
        )}
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor={inputId}>
            {label}
          </label>
          <input
            ref={fileRef}
            id={inputId}
            name={localFallback ? name : undefined}
            type="file"
            accept="image/*"
            className="input"
            disabled={status === "uploading"}
            onChange={(e) => void onFileChange(e.target.files)}
          />
          {status === "uploading" ? (
            <p className="text-[11px] text-ink-soft mt-1">Wysyłanie zdjęcia…</p>
          ) : null}
          {status === "ready" && uploadedUrl ? (
            <p className="text-[11px] text-ok mt-1">
              Zdjęcie gotowe — zapisze się po „Zapisz menu”.
            </p>
          ) : null}
          {status === "ready" && localFallback ? (
            <p className="text-[11px] text-ink-soft mt-1">
              Podgląd gotowy — kliknij „Zapisz menu”.
            </p>
          ) : null}
          {status === "idle" && normalizedExisting ? (
            <p className="text-[11px] text-ink-soft mt-1">
              Obecne zdjęcie — kliknij miniaturę, aby powiększyć.
            </p>
          ) : null}
          {status === "idle" && !normalizedExisting ? (
            <p className="text-[11px] text-ink-soft mt-1">Brak zdjęcia.</p>
          ) : null}
        </div>
      </div>
      {removeName && normalizedExisting && !preview ? (
        <label className="flex items-center gap-2 text-xs mt-1.5">
          <input type="checkbox" name={removeName} />
          Usuń zdjęcie tej pozycji
        </label>
      ) : null}
    </div>
  );
}
