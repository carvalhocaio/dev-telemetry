/**
 * Pure calendar gap-fill. Given the requested window and resolution, it emits
 * one chart slot per calendar bucket in `[start, end]` (oldest → newest),
 * substituting a `{ noData: true }` placeholder wherever the API returned no
 * period. This is what makes weekends and empty days render as muted "sem
 * dados" bars.
 *
 * Bucket starts mirror the backend's `date_trunc`:
 *   - daily   → each calendar day
 *   - weekly  → the Monday of each week
 *   - monthly → the 1st of each month
 *
 * When `start`/`end` are absent (the "todo" mode requests the whole history
 * with no window), there is nothing to synthesize: the periods are simply
 * returned sorted oldest → newest.
 */

import type { ChartItem, PeriodReport, Resolution } from "@/types/report";

function parseLocalISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Snaps a date back to the start of its bucket for the given resolution. */
function bucketStart(date: Date, resolution: Resolution): Date {
  const snapped = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (resolution === "weekly") {
    // getDay(): 0=Sun..6=Sat. Shift back to Monday (date_trunc('week')).
    const offset = (snapped.getDay() + 6) % 7;
    snapped.setDate(snapped.getDate() - offset);
  } else if (resolution === "monthly") {
    snapped.setDate(1);
  }
  return snapped;
}

/** Advances a bucket start to the next bucket start for the resolution. */
function nextBucket(date: Date, resolution: Resolution): Date {
  const next = new Date(date);
  if (resolution === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (resolution === "monthly") {
    next.setMonth(next.getMonth() + 1);
  } else {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function sortChronological(periods: PeriodReport[]): PeriodReport[] {
  return [...periods].sort((a, b) => a.period.localeCompare(b.period));
}

export function fillPeriods(
  periods: PeriodReport[],
  resolution: Resolution,
  start?: string,
  end?: string,
): ChartItem[] {
  // No window (e.g. "todo"): just present what the API returned, oldest first.
  if (!start || !end) {
    return sortChronological(periods);
  }

  const byPeriod = new Map(periods.map((p) => [p.period, p]));
  const items: ChartItem[] = [];

  const last = bucketStart(parseLocalISODate(end), resolution);
  let cursor = bucketStart(parseLocalISODate(start), resolution);

  while (cursor.getTime() <= last.getTime()) {
    const key = toLocalISODate(cursor);
    const match = byPeriod.get(key);
    items.push(match ?? { period: key, noData: true });
    cursor = nextBucket(cursor, resolution);
  }

  return items;
}
