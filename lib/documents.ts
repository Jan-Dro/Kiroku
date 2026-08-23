import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export function ensureAllowedDocument(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("Only PDF, JPEG, PNG, and WebP files are supported.");
  }

  const maxBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error(`Files must be ${env.MAX_UPLOAD_SIZE_MB} MB or smaller.`);
  }
}

export function resolveUploadDir() {
  return path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(process.cwd(), env.UPLOAD_DIR);
}

export function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function persistVehicleDocument(vehicleId: string, file: File) {
  ensureAllowedDocument(file);

  const uploadsRoot = resolveUploadDir();
  const vehicleDir = path.join(uploadsRoot, "documents", vehicleId);
  await mkdir(vehicleDir, { recursive: true });

  const safeName = sanitizeFilename(file.name);
  const storedName = `${Date.now()}-${safeName}`;
  const diskPath = path.join(vehicleDir, storedName);
  const arrayBuffer = await file.arrayBuffer();

  await writeFile(diskPath, Buffer.from(arrayBuffer));

  return {
    diskPath,
    storedName,
  };
}

export async function removeStoredDocument(filePath: string) {
  await unlink(filePath).catch(() => null);
}
