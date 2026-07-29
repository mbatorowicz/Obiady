"use client";

export function PrintButton({ label = "Drukuj listę" }: { label?: string }) {
  return (
    <button
      type="button"
      className="btn btn-secondary btn-xs"
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
