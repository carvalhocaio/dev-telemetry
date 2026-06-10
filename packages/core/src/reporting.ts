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

import { bucketStart, toLocalISODate } from "./bucket.js";
import {
  classify,
  LEVEL_CUTS_BY_LEVEL,
  toLevel,
  WEIGHTS,
} from "./classifier.js";
import { computeMetrics } from "./metrics.js";
import {
  type Coverage,
  type Granularity,
  type PeriodClassification,
  type PeriodMetrics,
  type PeriodReport,
  type Report,
  mergeRate,
  type WindowSummary,
} from "./types.js";

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

function toPeriodReport(
  m: PeriodMetrics,
  c: PeriodClassification,
): PeriodReport {
  const rate = mergeRate(m);
  return {
    period: m.period,
    level: c.level,
    composite: round4(c.composite),
    components: {
      throughput: round4(c.components.throughput),
      active_days: round4(c.components.active_days),
      churn: round4(c.components.churn),
    },
    commitCount: m.commitCount,
    prCount: m.prCount,
    prMerged: m.prMerged,
    additions: m.additions,
    deletions: m.deletions,
    activeDays: m.activeDays,
    mergeRate: rate === null ? null : round4(rate),
  };
}

/**
 * Pure window summary — aggregates the in-window periods and derives the
 * representative level. Factored out of `buildReport` so it can be unit-tested
 * with hand-built data and no DB. `today` is injected for determinism.
 *
 * Mirrors `_build_window` in the Python reporting module exactly.
 */
export function summarizeWindow(
  granularity: Granularity,
  inWindow: Array<{ metrics: PeriodMetrics; classification: PeriodClassification }>,
  start: string | undefined,
  end: string | undefined,
  today: Date,
): WindowSummary {
  const metrics = inWindow.map((x) => x.metrics);
  const composite =
    inWindow.length > 0
      ? inWindow.reduce((acc, x) => acc + x.classification.composite, 0) /
        inWindow.length
      : 0;
  const periods = metrics.map((m) => m.period);
  const currentBucket = bucketStart(granularity, toLocalISODate(today));

  const sum = (pick: (m: PeriodMetrics) => number): number =>
    metrics.reduce((acc, m) => acc + pick(m), 0);

  const minPeriod = periods.length > 0 ? periods.reduce((a, b) => (a < b ? a : b)) : null;
  const maxPeriod = periods.length > 0 ? periods.reduce((a, b) => (a > b ? a : b)) : null;

  return {
    start: start !== undefined ? start : minPeriod,
    end: end !== undefined ? end : maxPeriod,
    level: toLevel(composite),
    composite: round4(composite),
    commitCount: sum((m) => m.commitCount),
    prCount: sum((m) => m.prCount),
    prMerged: sum((m) => m.prMerged),
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
  const { db, userId, granularity, start, end } = input;

  const metrics = await computeMetrics(db, userId, granularity);
  const classifications = classify(metrics);
  const byPeriod = new Map(metrics.map((m) => [m.period, m]));

  const inWindow = classifications
    .filter((c) => within(c.period, start, end))
    .map((c) => ({ metrics: byPeriod.get(c.period)!, classification: c }));

  const periods = inWindow
    .map((x) => toPeriodReport(x.metrics, x.classification))
    .reverse();

  const window = summarizeWindow(granularity, inWindow, start, end, today);

  return {
    meta: {
      granularity,
      sampleSize: metrics.length,
      weights: { ...WEIGHTS },
      levelCuts: { ...LEVEL_CUTS_BY_LEVEL },
      smallSample: metrics.length < SMALL_SAMPLE_THRESHOLD,
      coverage: coverageOf(metrics),
    },
    window,
    periods,
  };
}
