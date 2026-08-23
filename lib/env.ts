import { z } from "zod";
import path from "node:path";
import { resolveAuthSecret } from "@/lib/auth-secret";

const developmentDatabase = "file:../data/kiroku.db";
const applicationDataDir = process.env.APP_DATA_DIR || path.resolve(process.cwd(), "data");
const sessionSecret = resolveAuthSecret(
  applicationDataDir,
  process.env.AUTH_SECRET || process.env.SESSION_SECRET,
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default(developmentDatabase),
  APP_DATA_DIR: z.string().min(1).default(applicationDataDir),
  APP_NAME: z.string().min(1).default("Kiroku"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SESSION_SECRET: z.string().min(32),
  REGISTRATION_ENABLED: z.enum(["true", "false"]).default("true"),
  UPLOAD_DIR: z.string().min(1).default(path.resolve(process.cwd(), "data", "uploads")),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(10),
  DEFAULT_CURRENCY: z.string().length(3).default("USD"),
  DEFAULT_DISTANCE_UNIT: z.enum(["MI", "KM"]).default("MI"),
  DEFAULT_VOLUME_UNIT: z.enum(["GAL", "L"]).default("GAL"),
  DEFAULT_ECONOMY_UNIT: z.enum(["MPG", "L_PER_100KM"]).default("MPG"),
});

export const env = envSchema.parse({
  ...process.env,
  SESSION_SECRET: sessionSecret,
});
