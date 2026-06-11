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

// Lazily initialized singleton — deferred until first use so that importing
// this module at build time (e.g. during Next.js static analysis) does not
// throw when DATABASE_URL is absent from the build environment.
let _instance: Database | undefined;

function getInstance(): Database {
  if (_instance) return _instance;
  _instance = globalThis.__devTelemetryDb ?? createDatabase();
  globalThis.__devTelemetryDb = _instance;
  return _instance;
}

export const db: Database = new Proxy({} as Database, {
  get(_, prop) {
    return getInstance()[prop as keyof Database];
  },
});

export { schema };
