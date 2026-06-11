/**
 * Domain types for the dev-telemetry dashboard.
 *
 * The FastAPI backend responds in snake_case. The raw wire shapes are typed
 * separately (see `*Wire` types) and normalized to the camelCase domain types
 * below at the API boundary (`lib/api.ts`). Components only ever see domain types.
 */

export type Level = "abaixo" | "atendendo" | "acima" | "muito_acima";

/**
 * Bar resolution: how each chart column is bucketed. This is the value sent to
 * the API as `granularity`. Distinct from `Mode`, which is the UI-level intent
 * (e.g. "semanal") that maps to a resolution plus an optional date window.
 */
export type Granularity = "daily" | "weekly" | "monthly";

/** Alias used where the value is read as the chart's bar resolution. */
export type Resolution = Granularity;

/** UI intent driving the time window; mapped to params in `lib/range.ts`. */
export type Mode = "semanal" | "mensal" | "todo" | "custom";

/** Repository scope filter applied to the report query. */
export type Scope = "all" | "org" | "personal" | `org:${string}`;

export function isScope(s: string | null): s is Scope {
  if (!s) return false;
  return s === "all" || s === "org" || s === "personal" || s.startsWith("org:");
}

export const GRANULARITIES: readonly Granularity[] = [
  "daily",
  "weekly",
  "monthly",
];

export function isGranularity(value: string): value is Granularity {
  return (GRANULARITIES as readonly string[]).includes(value);
}

/** Falls back to "weekly" for missing or unrecognized granularity values. */
export function resolveGranularity(value: string | null): Granularity {
  return value && isGranularity(value) ? value : "weekly";
}

/** Component scores that make up the composite (each roughly 0..1). */
export interface Components {
  throughput: number;
  active_days: number;
  churn: number;
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
  /** Newest-first, exactly as returned by the API. */
  periods: PeriodReport[];
}

/**
 * A chart slot: either a real period or a synthesized "no data" placeholder
 * for a calendar gap (weekends, empty days). Produced by `lib/calendar.ts`.
 */
export type ChartItem =
  | (PeriodReport & { noData?: false })
  | { period: string; noData: true };

export function isNoData(
  item: ChartItem,
): item is { period: string; noData: true } {
  return item.noData === true;
}

export interface Narrative {
  summary: string;
  themes: string[];
  strengths: string[];
  watchouts: string[];
}

export interface NarrativeResponse {
  period: string;
  level: string;
  model: string;
  narrative: Narrative;
}

export interface RefreshResult {
  repositories: number;
  commits: number;
  pullRequests: number;
}

/** UI metadata per performance level (label + CSS variable for its color). */
export const LEVEL_META: Record<Level, { label: string; colorVar: string }> = {
  muito_acima: { label: "Muito acima", colorVar: "var(--color-level-muito-acima)" },
  acima: { label: "Acima", colorVar: "var(--color-level-acima)" },
  atendendo: { label: "Atendendo", colorVar: "var(--color-level-atendendo)" },
  abaixo: { label: "Abaixo", colorVar: "var(--color-level-abaixo)" },
};
