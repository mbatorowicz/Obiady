import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { del, put } from "@vercel/blob";
import { isRemoteImageUrl } from "@/lib/image-url";

export { isRemoteImageUrl, normalizeImageSrc } from "@/lib/image-url";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "menu");

function assertImage(file: File) {
  if (!file || file.size === 0) throw new Error("EMPTY_FILE");
  if (!file.type.startsWith("image/")) throw new Error("NOT_IMAGE");
  if (file.size > 5 * 1024 * 1024) throw new Error("TOO_LARGE");
}

function safeExt(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
}

async function saveLocal(file: File): Promise<string> {
  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${safeExt(file)}`;
  const fullPath = path.join(LOCAL_UPLOAD_DIR, filename);
  await writeFile(fullPath, Buffer.from(await file.arrayBuffer()));
  return `/uploads/menu/${filename}`;
}

export async function saveMenuImage(file: File): Promise<string> {
  assertImage(file);

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const blob = await put(
      `menu/${Date.now()}-${randomBytes(6).toString("hex")}.${safeExt(file)}`,
      file,
      { access: "public", token },
    );
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "BLOB_REQUIRED: Na produkcji wymagany jest Vercel Blob (BLOB_READ_WRITE_TOKEN).",
    );
  }

  return saveLocal(file);
}

export async function deleteMenuImage(imagePath: string | null | undefined) {
  if (!imagePath) return;

  if (isRemoteImageUrl(imagePath)) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return;
    try {
      await del(imagePath, { token: process.env.BLOB_READ_WRITE_TOKEN });
    } catch {
      // ignore missing remote file
    }
    return;
  }

  if (!imagePath.startsWith("/uploads/menu/")) return;
  if (process.env.VERCEL) return;
  const fullPath = path.join(process.cwd(), "public", imagePath);
  try {
    await unlink(fullPath);
  } catch {
    // ignore missing file
  }
}
