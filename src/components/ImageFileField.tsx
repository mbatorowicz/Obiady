"use client";

import { useEffect, useId, useState } from "react";
import { ThumbPlaceholder, ZoomableImage } from "@/components/ZoomableImage";
import { normalizeImageSrc } from "@/lib/image-url";

export function ImageFileField({
  name,
  label = "Zdjęcie",
  existingSrc,
  existingAlt,
  existingCaption,
  removeName,
  size = 56,
}: {
  name: string;
  label?: string;
  existingSrc?: string | null;
  existingAlt: string;
  existingCaption?: string;
  removeName?: string;
  size?: number;
}) {
  const inputId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const normalizedExisting = normalizeImageSrc(existingSrc ?? null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className="image-file-field">
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
            id={inputId}
            name={name}
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (preview) URL.revokeObjectURL(preview);
              setPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          {preview ? (
            <p className="text-[11px] text-ink-soft mt-1">
              Podgląd nowego pliku — zapisze się po „Zapisz menu”.
            </p>
          ) : normalizedExisting ? (
            <p className="text-[11px] text-ink-soft mt-1">
              Obecne zdjęcie — kliknij miniaturę, aby powiększyć.
            </p>
          ) : (
            <p className="text-[11px] text-ink-soft mt-1">Brak zdjęcia.</p>
          )}
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
