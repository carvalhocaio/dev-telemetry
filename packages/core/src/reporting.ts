/**
 * Report builder — TS port of `api/app/analysis/reporting.py`
 * (`ReportService`).
 *
 * Flow (identical to Python):
 *   1. classify over the FULL baseline (stable population),
 *   2. filter periods to the requested [start, end] window,
 *   3. build a WindowSummary (aggregate totals + mean-of-in-window composites
 *      → level via the same cuts; `partialCurrent` via bucketStart(today)),
 *   4. compute coverage (first/last baseline period),
 *   5. emit periods newest-first.
 */

import { bucketStart, toLocalISODate } from "./bucket";
import { computeMetrics } from "./metrics";
import {
  type Coverage,
  type Granularity,
  type PeriodMetrics,
  type PeriodReport,
  type Report,
  type Scope,
  mergeRate,
  type WindowSummary,
} from "./types";

export const SMALL_SAMPLE_THRESHOLD = 8;

/** Anything with an `.execute()` — satisfied by the Drizzle client. */
interface Executor {
  execute(query: unknown): Promise<unknown>;
}

export interface BuildReportInput {
  db: Executor;
  userId: string;
  granularity: Granularity;
  /** Inclusive window start, "YYYY-MM-DD". Omit for no lower bound. */
  start?: string;
  /** Inclusive window end, "YYYY-MM-DD". Omit for no upper bound. */
  end?: string;
  /** Repository scope filter. Defaults to `all` (no filter). */
  scope?: Scope;
  /** User's GitHub login — required when `scope` is `org` or `personal`. */
  githubLogin?: string;
}

const round4 = (value: number): number => Math.round(value * 1e4) / 1e4;

function within(period: string, start?: string, end?: string): boolean {
  if (start !== undefined && period < start) {
    return false;
  }
  if (end !== undefined && period > end) {
    return false;
  }
  return true;
}

function coverageOf(metrics: PeriodMetrics[]): Coverage {
  if (metrics.length === 0) {
    return { first: null, last: null };
  }
  return {
    first: metrics[0]!.period,
    last: metrics[metrics.length - 1]!.period,
  };
}

function toPeriodReport(m: PeriodMetrics): PeriodReport {
  const rate = mergeRate(m);
  return {
    period: m.period,
    commitCount: m.commitCount,
    prCount: m.prCount,
    prMerged: m.prMerged,
    prOpen: m.prOpen,
    additions: m.additions,
    deletions: m.deletions,
    activeDays: m.activeDays,
    mergeRate: rate === null ? null : round4(rate),
  };
}

/**
 * Pure window summary — aggregates the in-window periods.
 * Factored out of `buildReport` so it can be unit-tested
 * with hand-built data and no DB. `today` is injected for determinism.
 */
export function summarizeWindow(
  granularity: Granularity,
  metrics: PeriodMetrics[],
  start: string | undefined,
  end: string | undefined,
  today: Date = new Date(),
): WindowSummary {
  const periods = metrics.map((m) => m.period);
  const currentBucket = bucketStart(granularity, toLocalISODate(today));

  const sum = (pick: (m: PeriodMetrics) => number): number =>
    metrics.reduce((acc, m) => acc + pick(m), 0);

  const minPeriod = periods.length > 0 ? periods.reduce((a, b) => (a < b ? a : b)) : null;
  const maxPeriod = periods.length > 0 ? periods.reduce((a, b) => (a > b ? a : b)) : null;

  return {
    start: start !== undefined ? start : minPeriod,
    end: end !== undefined ? end : maxPeriod,
    commitCount: sum((m) => m.commitCount),
    prCount: sum((m) => m.prCount),
    prMerged: sum((m) => m.prMerged),
    prOpen: sum((m) => m.prOpen),
    additions: sum((m) => m.additions),
    deletions: sum((m) => m.deletions),
    activeDays: sum((m) => m.activeDays),
    partialCurrent: periods.includes(currentBucket),
  };
}

/**
 * Builds the full report for `userId`. The only DB-touching call is
 * `computeMetrics`; all derivation below it is pure (and shared with
 * `summarizeWindow`). `today` is injectable for tests.
 */
export async function buildReport(
  input: BuildReportInput,
  today: Date = new Date(),
): Promise<Report> {
  const { db, userId, granularity, start, end, scope, githubLogin } = input;

  const metrics = await computeMetrics(
    db,
    userId,
    granularity,
    scope ?? "all",
    githubLogin,
  );

  const inWindow = metrics.filter((m) => within(m.period, start, end));
  const periods = inWindow.map((m) => toPeriodReport(m)).reverse();
  const window = summarizeWindow(granularity, inWindow, start, end, today);

  return {
    meta: {
      granularity,
      sampleSize: metrics.length,
      smallSample: metrics.length < SMALL_SAMPLE_THRESHOLD,
      coverage: coverageOf(metrics),
    },
    window,
    periods,
  };
}
