import { randomBytes } from "node:crypto";
import { linkSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

export const AUTH_SECRET_FILENAME = "auth-secret";

function readPersistedSecret(secretPath: string) {
  const secret = readFileSync(secretPath, "utf8").trim();

  if (secret.length < 32) {
    throw new Error(`The persisted auth secret at ${secretPath} is invalid.`);
  }

  return secret;
}

export function resolveAuthSecret(dataDir: string, configuredSecret?: string) {
  if (configuredSecret) {
    return configuredSecret;
  }

  mkdirSync(dataDir, { recursive: true });
  const secretPath = path.join(dataDir, AUTH_SECRET_FILENAME);

  try {
    return readPersistedSecret(secretPath);
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }
  }

  const generatedSecret = randomBytes(32).toString("hex");
  const temporaryPath = path.join(
    dataDir,
    `.${AUTH_SECRET_FILENAME}-${process.pid}-${randomBytes(8).toString("hex")}`,
  );

  try {
    writeFileSync(temporaryPath, generatedSecret, { encoding: "utf8", flag: "wx", mode: 0o600 });
    linkSync(temporaryPath, secretPath);
    return generatedSecret;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "EEXIST") {
      return readPersistedSecret(secretPath);
    }

    throw error;
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}
