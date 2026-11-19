import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations/drizzle",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  schemaFilter: ["connect"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
