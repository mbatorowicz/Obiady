"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

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
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = useCallback(() => setOpen(false), []);

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
            <img src={src} alt={alt} />
          </div>
        </div>
      ) : null}
    </>
  );
}
