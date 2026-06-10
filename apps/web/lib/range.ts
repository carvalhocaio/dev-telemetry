/**
 * Pure mapping from a UI mode to the API request parameters
 * (`{ resolution, start?, end? }`). Kept free of side effects and of any
 * `Date.now()` dependency — `today` is always injected so the logic stays
 * deterministic and unit-testable. Date math is done in *local* time so the
 * window matches the calendar day the user sees, not UTC.
 */

import type { Coverage, Granularity, Mode } from "@/types/report";

/** Custom-mode parameters chosen by the user in the date filter. */
export interface CustomRange {
  res: Granularity;
  start: string;
  end: string;
}

export interface ResolvedRange {
  resolution: Granularity;
  start?: string;
  end?: string;
}

/** Span (in days) at or below which "todo" uses weekly bars instead of monthly. */
const WEEKLY_SPAN_DAYS = 180;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Local-time "YYYY-MM-DD" for a Date (avoids the UTC shift of toISOString). */
export function toLocalISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses "YYYY-MM-DD" into a local-midnight Date. */
function parseLocalISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Returns `iso` shifted by `days` (negative = earlier), preserving local time. */
function shiftDays(iso: string, days: number): string {
  const date = parseLocalISODate(iso);
  date.setDate(date.getDate() + days);
  return toLocalISODate(date);
}

/**
 * Picks the "todo" resolution from the coverage span: weekly when the data
 * fits in ~180 days, monthly for longer histories. Defaults to monthly while
 * coverage is unknown (first fetch), then narrows on the follow-up.
 */
export function resolutionForSpan(coverage: Coverage | null): Granularity {
  if (!coverage || !coverage.first || !coverage.last) {
    return "monthly";
  }
  const first = parseLocalISODate(coverage.first).getTime();
  const last = parseLocalISODate(coverage.last).getTime();
  const spanDays = Math.round((last - first) / MS_PER_DAY);
  return spanDays <= WEEKLY_SPAN_DAYS ? "weekly" : "monthly";
}

/**
 * Maps a mode to the API parameters. `today` is injected (defaults to now) so
 * tests can pin it. `coverage` is only consulted for the "todo" mode.
 */
export function resolveRange(
  mode: Mode,
  custom?: CustomRange,
  today: Date = new Date(),
  coverage: Coverage | null = null,
): ResolvedRange {
  const todayISO = toLocalISODate(today);

  switch (mode) {
    case "semanal":
      return { resolution: "daily", start: shiftDays(todayISO, -6), end: todayISO };
    case "mensal":
      return { resolution: "daily", start: shiftDays(todayISO, -29), end: todayISO };
    case "todo":
      return { resolution: resolutionForSpan(coverage) };
    case "custom":
      if (!custom) {
        // Defensive: an incomplete custom URL falls back to the default mode.
        return resolveRange("semanal", undefined, today, coverage);
      }
      return { resolution: custom.res, start: custom.start, end: custom.end };
  }
}

/** Falls back to "semanal" for missing or unrecognized mode values. */
export function resolveMode(value: string | null): Mode {
  if (value === "mensal" || value === "todo" || value === "custom") {
    return value;
  }
  return "semanal";
}
