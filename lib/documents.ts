import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const documentMimeExtensions: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const uploadConfigSchema = z.object({
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(10),
  UPLOAD_DIR: z.string().min(1),
});

export class DocumentUploadValidationError extends Error {
  constructor(
    message: string,
    readonly code: "INVALID_FILE_TYPE" | "FILE_TOO_LARGE",
  ) {
    super(message);
    this.name = "DocumentUploadValidationError";
  }
}

function getDefaultUploadDir() {
  const appDataDir = process.env.APP_DATA_DIR || path.resolve(process.cwd(), "data");
  return path.join(appDataDir, "uploads");
}

function assertPathWithin(baseDir: string, candidatePath: string) {
  const relativePath = path.relative(baseDir, candidatePath);

  if (relativePath === ".." || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    throw new Error("Invalid upload path.");
  }
}

function normalizeStoredPath(filePath: string) {
  return path.resolve(filePath);
}

export function getUploadConfig() {
  return uploadConfigSchema.parse({
    MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB || "10",
    UPLOAD_DIR: process.env.UPLOAD_DIR || getDefaultUploadDir(),
  });
}

export function ensureAllowedDocument(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new DocumentUploadValidationError(
      "Only PDF, JPEG, PNG, and WebP files are supported.",
      "INVALID_FILE_TYPE",
    );
  }

  const { MAX_UPLOAD_SIZE_MB } = getUploadConfig();
  const maxBytes = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new DocumentUploadValidationError(
      `Files must be ${MAX_UPLOAD_SIZE_MB} MB or smaller.`,
      "FILE_TOO_LARGE",
    );
  }
}

export function resolveUploadDir() {
  return path.resolve(getUploadConfig().UPLOAD_DIR);
}

export function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export function buildDocumentDownloadFilename(title: string, contentType: string) {
  const normalizedTitle = sanitizeFilename(title.trim()).replace(/^-+|-+$/g, "");
  const extension = documentMimeExtensions[contentType] || "";

  if (!normalizedTitle) {
    return `document${extension}`;
  }

  return normalizedTitle.endsWith(extension) ? normalizedTitle : `${normalizedTitle}${extension}`;
}

export function getDocumentsRootDir() {
  const documentsDir = path.resolve(resolveUploadDir(), "documents");
  assertPathWithin(resolveUploadDir(), documentsDir);
  return documentsDir;
}

export function getVehicleDocumentsDir(vehicleId: string) {
  const vehicleDocumentsDir = path.resolve(getDocumentsRootDir(), vehicleId);
  assertPathWithin(getDocumentsRootDir(), vehicleDocumentsDir);
  return vehicleDocumentsDir;
}

export function isStoredDocumentPath(filePath: string) {
  const documentsRoot = getDocumentsRootDir();
  const normalizedPath = normalizeStoredPath(filePath);
  const relativePath = path.relative(documentsRoot, normalizedPath);
  return relativePath.length > 0 && relativePath !== ".." && !relativePath.startsWith(`..${path.sep}`);
}

export async function persistVehicleDocument(vehicleId: string, file: File) {
  ensureAllowedDocument(file);

  const vehicleDir = getVehicleDocumentsDir(vehicleId);
  await mkdir(vehicleDir, { recursive: true });

  const storedName = `${randomUUID()}${documentMimeExtensions[file.type] || ""}`;
  const diskPath = path.resolve(vehicleDir, storedName);
  assertPathWithin(vehicleDir, diskPath);
  const arrayBuffer = await file.arrayBuffer();

  await writeFile(diskPath, Buffer.from(arrayBuffer));

  return {
    diskPath,
    storedName,
  };
}

export async function removeStoredDocument(filePath: string) {
  if (!isStoredDocumentPath(filePath)) {
    return;
  }

  await unlink(normalizeStoredPath(filePath)).catch(() => null);
}
