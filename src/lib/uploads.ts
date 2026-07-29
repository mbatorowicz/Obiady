import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "menu");

export async function saveMenuImage(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("EMPTY_FILE");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("NOT_IMAGE");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("TOO_LARGE");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${safeExt}`;
  const fullPath = path.join(UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);
  return `/uploads/menu/${filename}`;
}

export async function deleteMenuImage(imagePath: string | null | undefined) {
  if (!imagePath || !imagePath.startsWith("/uploads/menu/")) return;
  const fullPath = path.join(process.cwd(), "public", imagePath);
  try {
    await unlink(fullPath);
  } catch {
    // ignore missing file
  }
}
