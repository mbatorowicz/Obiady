export function isRemoteImageUrl(src: string | null | undefined): boolean {
  return !!src && /^https?:\/\//i.test(src);
}

/** Returns a renderable src, or null when the path can't work in this environment. */
export function normalizeImageSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  if (isRemoteImageUrl(src)) return src;
  if (src.startsWith("/uploads/menu/")) {
    // Local public files are unavailable on Vercel serverless FS.
    if (process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV) return null;
    return src;
  }
  return null;
}
