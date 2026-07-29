"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export function ThumbPlaceholder({
  label,
  size = 44,
  className = "thumb",
}: {
  label: string;
  size?: number;
  className?: string;
}) {
  const initial = (label.trim().charAt(0) || "?").toUpperCase();
  return (
    <span
      className={`${className} thumb-placeholder`}
      style={{ width: size, height: size }}
      aria-hidden
      title={label}
    >
      {initial}
    </span>
  );
}

export function ZoomableImage({
  src,
  alt,
  caption,
  className = "thumb",
  size = 44,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const sizeStyle = { width: size, height: size };

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (broken) {
    return <ThumbPlaceholder label={alt} size={size} className={className} />;
  }

  return (
    <>
      <button
        type="button"
        className="zoom-trigger"
        onClick={() => setOpen(true)}
        aria-label={`Powiększ: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className={className}
          style={sizeStyle}
          onError={() => setBroken(true)}
        />
      </button>

      {open ? (
        <div
          className="lightbox-backdrop"
          role="presentation"
          onClick={close}
        >
          <div
            className="lightbox-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div id={titleId}>
                <p className="font-semibold text-sm">{alt}</p>
                {caption ? (
                  <p className="text-xs text-ink-soft mt-0.5">{caption}</p>
                ) : null}
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={close}
              >
                Zamknij
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} onError={() => setBroken(true)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
