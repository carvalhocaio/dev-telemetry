/**
 * Pure date/bucketing helpers — the TS port of Python's `bucket_start`
 * (`api/app/analysis/metrics.py`), mirroring Postgres `date_trunc`:
 *
 *   - daily   → the calendar day itself
 *   - weekly  → the Monday of that week (ISO weekday 1)
 *   - monthly → the 1st of that month
 *
 * All math is done in *local* time so buckets match the calendar day the user
 * sees, not UTC — same convention as `apps/web/lib/calendar.ts`.
 */

import type { Granularity } from "./types";

/** Parses "YYYY-MM-DD" into a local-midnight Date. */
export function parseLocalISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
}

/** Local-time "YYYY-MM-DD" for a Date (avoids the UTC shift of toISOString). */
export function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the period start for `date` (a local-midnight Date) for the given
 * granularity. Pure mirror of `date_trunc` / Python `bucket_start`.
 */
export function bucketStartDate(granularity: Granularity, date: Date): Date {
  const snapped = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (granularity === "weekly") {
    // getDay(): 0=Sun..6=Sat. Shift back to Monday.
    const offset = (snapped.getDay() + 6) % 7;
    snapped.setDate(snapped.getDate() - offset);
  } else if (granularity === "monthly") {
    snapped.setDate(1);
  }
  return snapped;
}

/**
 * Returns the period start for `day` (an ISO "YYYY-MM-DD" string) as an ISO
 * string. This is the string-domain equivalent of Python `bucket_start`.
 */
export function bucketStart(granularity: Granularity, day: string): string {
  return toLocalISODate(bucketStartDate(granularity, parseLocalISODate(day)));
}
