import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  DocumentUploadValidationError,
  buildDocumentDownloadFilename,
  ensureAllowedDocument,
  isStoredDocumentPath,
  persistVehicleDocument,
  removeStoredDocument,
} from "@/lib/documents";

const testDirectories: string[] = [];
const originalUploadDir = process.env.UPLOAD_DIR;
const originalMaxUploadSizeMb = process.env.MAX_UPLOAD_SIZE_MB;
const originalAppDataDir = process.env.APP_DATA_DIR;

function createTestDirectory() {
  const directory = mkdtempSync(path.join(tmpdir(), "kiroku-documents-"));
  testDirectories.push(directory);
  return directory;
}

afterEach(() => {
  process.env.UPLOAD_DIR = originalUploadDir;
  process.env.MAX_UPLOAD_SIZE_MB = originalMaxUploadSizeMb;
  process.env.APP_DATA_DIR = originalAppDataDir;

  for (const directory of testDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("document upload helpers", () => {
  it("validates MIME types and runtime size limits", () => {
    process.env.MAX_UPLOAD_SIZE_MB = "1";

    expect(() =>
      ensureAllowedDocument(new File([Buffer.alloc(1024 * 1024 + 1)], "receipt.png", { type: "image/png" })),
    ).toThrowError(DocumentUploadValidationError);

    expect(() =>
      ensureAllowedDocument(new File([Buffer.from("hello")], "receipt.txt", { type: "text/plain" })),
    ).toThrow("Only PDF, JPEG, PNG, and WebP files are supported.");
  });

  it("stores uploaded documents beneath the configured upload directory with generated filenames", async () => {
    const uploadDir = createTestDirectory();
    process.env.UPLOAD_DIR = uploadDir;

    const stored = await persistVehicleDocument(
      "vehicle-123",
      new File([Buffer.from("pdf-data")], "../../unsafe name.pdf", { type: "application/pdf" }),
    );

    expect(isStoredDocumentPath(stored.diskPath)).toBe(true);
    expect(stored.diskPath).toContain(path.join(uploadDir, "documents", "vehicle-123"));
    expect(path.basename(stored.diskPath)).toMatch(/^[0-9a-f-]+\.pdf$/);
    expect(path.basename(stored.diskPath)).not.toContain("unsafe");
    expect(readdirSync(path.dirname(stored.diskPath))).toEqual([path.basename(stored.diskPath)]);
  });

  it("removes stored files but never deletes paths outside the documents directory", async () => {
    const uploadDir = createTestDirectory();
    const outsideDir = createTestDirectory();
    process.env.UPLOAD_DIR = uploadDir;

    const stored = await persistVehicleDocument(
      "vehicle-456",
      new File([Buffer.from("image-data")], "photo.webp", { type: "image/webp" }),
    );
    const outsideFile = path.join(outsideDir, "outside.txt");
    writeFileSync(outsideFile, "keep");

    await removeStoredDocument(stored.diskPath);
    await removeStoredDocument(outsideFile);

    expect(existsSync(stored.diskPath)).toBe(false);
    expect(existsSync(outsideFile)).toBe(true);
  });

  it("builds safe download filenames from the document title and MIME type", () => {
    expect(buildDocumentDownloadFilename("Registration / 2026", "application/pdf")).toBe("Registration-2026.pdf");
    expect(buildDocumentDownloadFilename("", "image/jpeg")).toBe("document.jpg");
  });
});
