import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";

let cached: PostgresJsDatabase | undefined;

// Supabase's direct address (db.<project>.supabase.co) is IPv6-only, and
// Netlify Functions can only reach IPv4 addresses. If DATABASE_URL uses the
// direct address, switch to Supabase's free shared pooler for the same
// project: same password, user becomes "postgres.<project>", port 6543.
// SUPABASE_POOLER_HOST overrides the pooler address if the project ever moves.
const DEFAULT_POOLER_HOST = "aws-1-us-east-1.pooler.supabase.com";

export function toReachableUrl(url: string): string {
  const m = url.match(/@db\.([a-z0-9]+)\.supabase\.co(?::\d+)?(?=\/|$)/i);
  if (!m) return url;
  const ref = m[1];
  const host = process.env.SUPABASE_POOLER_HOST || DEFAULT_POOLER_HOST;
  return url
    .replace(m[0], `@${host}:6543`)
    .replace(/^(postgres(?:ql)?:\/\/)postgres:/i, `$1postgres.${ref}:`);
}

type Sql = ReturnType<typeof postgres>;
let client: Sql | undefined;
let lastUsed = 0;

const serverless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);

// A Netlify Function is frozen between requests. A connection that sat through
// a freeze can be dead without the driver knowing, and a query sent down it
// never returns. So on Netlify a connection that has not been used for a few
// seconds is thrown away and a new one is opened (cheap through the pooler).
const STALE_AFTER_MS = 8000;

/** Drops the current connections. The next query opens fresh ones. */
export function resetDb(): void {
  const old = client;
  client = undefined;
  cached = undefined;
  if (old) old.end({ timeout: 0 }).catch(() => {});
}

// One shared connection pool per running copy of the server.
export function getDb(): PostgresJsDatabase {
  const now = Date.now();
  if (cached && serverless && now - lastUsed > STALE_AFTER_MS) resetDb();
  lastUsed = now;
  if (cached) return cached;
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }
  const url = toReachableUrl(raw);
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  client = postgres(url, {
    prepare: false, // required by Supabase's transaction pooler
    // A few connections, so queries a route runs side by side each get their
    // own instead of being stacked on one.
    max: serverless ? 3 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: isLocal ? false : "require",
  });
  cached = drizzle(client);
  return cached;
}
