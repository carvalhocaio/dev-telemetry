/**
 * Domain types for dev-telemetry — the single source of truth.
 *
 * These mirror `apps/web/types/report.ts` (camelCase) so the web app can later
 * import them from `@dev-telemetry/core` instead of redeclaring them. Ported
 * from the Python schemas (`api/app/schemas/reports.py`) and analysis modules.
 */

/** Performance level, lowest to highest. */
export type Level = "abaixo" | "atendendo" | "acima" | "muito_acima";

/** Bucketing resolution sent to the API as `granularity`. */
export type Granularity = "daily" | "weekly" | "monthly";

/**
 * Repository scope filter. Derived by comparing the owner segment of
 * `repository.fullName` (everything before the first `/`) against the user's
 * `githubLogin`:
 *   - `personal`:    owner === githubLogin,
 *   - `org`:         owner !== githubLogin (all orgs aggregated),
 *   - `org:<login>`: owner === <login> (specific org),
 *   - `all`:         no filter (default).
 */
export type Scope = "all" | "org" | "personal" | `org:${string}`;

/** Component scores that make up the composite (each roughly 0..1). */
export interface Components {
  throughput: number;
  active_days: number;
  churn: number;
}

/**
 * Raw aggregates for a single period (bucket), before classification.
 *
 * `period` is a local "YYYY-MM-DD" ISO date identifying the bucket start, to
 * stay consistent with the rest of the domain (no `Date` objects on the wire).
 */
export interface PeriodMetrics {
  period: string;
  commitCount: number;
  additions: number;
  deletions: number;
  activeDays: number;
  prCount: number;
  prMerged: number;
}

/** throughput = commitCount + prCount. */
export function throughput(m: PeriodMetrics): number {
  return m.commitCount + m.prCount;
}

/** churn = additions + deletions. */
export function churn(m: PeriodMetrics): number {
  return m.additions + m.deletions;
}

/** merge rate, or null when there are no PRs in the period. */
export function mergeRate(m: PeriodMetrics): number | null {
  if (m.prCount === 0) {
    return null;
  }
  return m.prMerged / m.prCount;
}

/** Per-period classification result (composite + level + component ranks). */
export interface PeriodClassification {
  period: string;
  level: Level;
  composite: number;
  components: Components;
}

/** First/last dates with data, used to pick an adaptive resolution for "todo". */
export interface Coverage {
  first: string | null;
  last: string | null;
}

export interface ReportMeta {
  granularity: string;
  sampleSize: number;
  weights: Record<string, number>;
  levelCuts: Record<string, number>;
  smallSample: boolean;
  coverage: Coverage;
}

/** Aggregated totals + representative level for the currently filtered window. */
export interface WindowSummary {
  start: string | null;
  end: string | null;
  level: Level;
  composite: number;
  commitCount: number;
  prCount: number;
  prMerged: number;
  additions: number;
  deletions: number;
  activeDays: number;
  /** True when the window includes the in-progress current period. */
  partialCurrent: boolean;
}

export interface PeriodReport {
  /** ISO date "YYYY-MM-DD" identifying the period (start). */
  period: string;
  level: Level;
  /** Composite score, 0..1. */
  composite: number;
  components: Components;
  commitCount: number;
  prCount: number;
  prMerged: number;
  additions: number;
  deletions: number;
  activeDays: number;
  mergeRate: number | null;
}

export interface Report {
  meta: ReportMeta;
  /** Aggregated summary for the filtered window (drives the summary card). */
  window: WindowSummary;
  /** Newest-first, exactly as the Python API returned. */
  periods: PeriodReport[];
}
