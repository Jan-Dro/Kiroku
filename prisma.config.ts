import "dotenv/config";
import { defineConfig } from "prisma/config";

const developmentDatabase = "file:../data/kiroku.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL ?? developmentDatabase,
  },
});
