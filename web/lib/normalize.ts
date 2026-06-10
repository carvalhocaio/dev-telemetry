/**
 * Pure normalizers translating the API's snake_case wire shapes into the
 * camelCase domain types. Kept free of `server-only` so they remain unit
 * testable in isolation.
 */

import type {
  Level,
  PeriodReport,
  RefreshResult,
  Report,
  WindowSummary,
} from "@/types/report";

export interface PeriodReportWire {
  period: string;
  level: Level;
  composite: number;
  components: { throughput: number; active_days: number; churn: number };
  commit_count: number;
  pr_count: number;
  pr_merged: number;
  additions: number;
  deletions: number;
  active_days: number;
  merge_rate: number | null;
}

export interface WindowSummaryWire {
  start: string | null;
  end: string | null;
  level: Level;
  composite: number;
  commit_count: number;
  pr_count: number;
  pr_merged: number;
  additions: number;
  deletions: number;
  active_days: number;
  partial_current: boolean;
}

export interface ReportWire {
  meta: {
    granularity: string;
    sample_size: number;
    weights: Record<string, number>;
    level_cuts: Record<string, number>;
    small_sample: boolean;
    coverage: { first: string | null; last: string | null };
  };
  window: WindowSummaryWire;
  periods: PeriodReportWire[];
}

export interface RefreshResultWire {
  repositories: number;
  commits: number;
  pull_requests: number;
}

export function normalizePeriod(wire: PeriodReportWire): PeriodReport {
  return {
    period: wire.period,
    level: wire.level,
    composite: wire.composite,
    components: {
      throughput: wire.components.throughput,
      active_days: wire.components.active_days,
      churn: wire.components.churn,
    },
    commitCount: wire.commit_count,
    prCount: wire.pr_count,
    prMerged: wire.pr_merged,
    additions: wire.additions,
    deletions: wire.deletions,
    activeDays: wire.active_days,
    mergeRate: wire.merge_rate,
  };
}

export function normalizeWindow(wire: WindowSummaryWire): WindowSummary {
  return {
    start: wire.start,
    end: wire.end,
    level: wire.level,
    composite: wire.composite,
    commitCount: wire.commit_count,
    prCount: wire.pr_count,
    prMerged: wire.pr_merged,
    additions: wire.additions,
    deletions: wire.deletions,
    activeDays: wire.active_days,
    partialCurrent: wire.partial_current,
  };
}

export function normalizeReport(wire: ReportWire): Report {
  return {
    meta: {
      granularity: wire.meta.granularity,
      sampleSize: wire.meta.sample_size,
      weights: wire.meta.weights,
      levelCuts: wire.meta.level_cuts,
      smallSample: wire.meta.small_sample,
      coverage: {
        first: wire.meta.coverage.first,
        last: wire.meta.coverage.last,
      },
    },
    window: normalizeWindow(wire.window),
    periods: wire.periods.map(normalizePeriod),
  };
}

export function normalizeRefresh(wire: RefreshResultWire): RefreshResult {
  return {
    repositories: wire.repositories,
    commits: wire.commits,
    pullRequests: wire.pull_requests,
  };
}

/** "YYYY-MM-DD". Used to validate route params before hitting the upstream. */
const PERIOD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidPeriod(value: string): boolean {
  return PERIOD_PATTERN.test(value);
}
