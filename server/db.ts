import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";

let cached: PostgresJsDatabase | undefined;

// One shared connection pool per running copy of the server. On Netlify each
// function instance keeps a single connection to Supabase's transaction pooler.
export function getDb(): PostgresJsDatabase {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const serverless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const client = postgres(url, {
    prepare: false, // required by Supabase's transaction pooler
    max: serverless ? 1 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: isLocal ? false : "require",
  });
  cached = drizzle(client);
  return cached;
}
