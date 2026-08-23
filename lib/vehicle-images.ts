import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { resolveUploadDir, sanitizeFilename } from "@/lib/documents";

const allowedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ensureAllowedVehicleImage(file: File) {
  if (!allowedImageMimeTypes.has(file.type)) {
    throw new Error("Only JPEG, PNG, and WebP images are supported.");
  }

  const maxBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error(`Images must be ${env.MAX_UPLOAD_SIZE_MB} MB or smaller.`);
  }
}

export async function persistVehicleImage(vehicleId: string, file: File) {
  ensureAllowedVehicleImage(file);

  const uploadsRoot = resolveUploadDir();
  const vehicleDir = path.join(uploadsRoot, "vehicle-images", vehicleId);
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

export async function removeStoredVehicleImage(filePath: string | null | undefined) {
  if (!filePath) {
    return;
  }

  await unlink(filePath).catch(() => null);
}
