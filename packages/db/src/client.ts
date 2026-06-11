import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>;

function resolveDatabaseUrl(url?: string): string {
  const databaseUrl = url ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return databaseUrl;
}

/**
 * Builds a Drizzle client backed by the postgres-js driver.
 * Prefer the shared {@link db} singleton; use this only for tests or scripts
 * that need an isolated connection (and remember to close it).
 */
export function createDatabase(url?: string) {
  const client = postgres(resolveDatabaseUrl(url), { prepare: false });
  return drizzle(client, { schema });
}

declare global {
  // eslint-disable-next-line no-var
  var __devTelemetryDb: Database | undefined;
}

/**
 * Process-wide singleton. Reused across hot reloads in dev to avoid
 * exhausting the connection pool.
 */
export const db: Database =
  globalThis.__devTelemetryDb ?? (globalThis.__devTelemetryDb = createDatabase());

export { schema };
