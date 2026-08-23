import { PrismaClient } from "@prisma/client";

declare global {
  var __kirokuPrisma__: PrismaClient | undefined;
}

export const db =
  global.__kirokuPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__kirokuPrisma__ = db;
}
