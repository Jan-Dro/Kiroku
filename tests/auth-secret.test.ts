import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AUTH_SECRET_FILENAME, resolveAuthSecret } from "@/lib/auth-secret";

const testDirectories: string[] = [];

function createTestDirectory() {
  const directory = mkdtempSync(path.join(tmpdir(), "kiroku-auth-secret-"));
  testDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of testDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("resolveAuthSecret", () => {
  it("uses an explicitly configured secret without persisting it", () => {
    const dataDir = createTestDirectory();
    const configuredSecret = "configured-secret-that-is-at-least-32-characters";

    expect(resolveAuthSecret(dataDir, configuredSecret)).toBe(configuredSecret);
    expect(existsSync(path.join(dataDir, AUTH_SECRET_FILENAME))).toBe(false);
  });

  it("generates and reuses a persisted 256-bit secret", () => {
    const dataDir = createTestDirectory();
    const secretPath = path.join(dataDir, AUTH_SECRET_FILENAME);
    const firstSecret = resolveAuthSecret(dataDir);

    expect(firstSecret).toMatch(/^[a-f0-9]{64}$/);
    expect(readFileSync(secretPath, "utf8")).toBe(firstSecret);
    expect(resolveAuthSecret(dataDir)).toBe(firstSecret);
  });

  it("never replaces an existing persisted secret", () => {
    const dataDir = createTestDirectory();
    const secretPath = path.join(dataDir, AUTH_SECRET_FILENAME);
    const persistedSecret = "persisted-secret-that-is-at-least-32-characters";
    writeFileSync(secretPath, persistedSecret, "utf8");

    expect(resolveAuthSecret(dataDir)).toBe(persistedSecret);
    expect(readFileSync(secretPath, "utf8")).toBe(persistedSecret);
  });

  it("fails instead of replacing an invalid existing secret", () => {
    const dataDir = createTestDirectory();
    const secretPath = path.join(dataDir, AUTH_SECRET_FILENAME);
    writeFileSync(secretPath, "short", "utf8");

    expect(() => resolveAuthSecret(dataDir)).toThrow("persisted auth secret");
    expect(readFileSync(secretPath, "utf8")).toBe("short");
  });
});
