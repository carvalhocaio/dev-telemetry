import { describe, expect, it } from "vitest";

import {
  isValidPeriod,
  normalizePeriod,
  normalizeRefresh,
  normalizeReport,
  normalizeWindow,
  type PeriodReportWire,
  type RefreshResultWire,
  type ReportWire,
  type WindowSummaryWire,
} from "@/lib/normalize";

const periodWire: PeriodReportWire = {
  period: "2026-06-01",
  level: "acima",
  composite: 0.72,
  components: { throughput: 0.8, active_days: 0.6, churn: 0.7 },
  commit_count: 42,
  pr_count: 5,
  pr_merged: 4,
  additions: 1200,
  deletions: 300,
  active_days: 4,
  merge_rate: 0.8,
};

describe("normalizePeriod", () => {
  it("maps snake_case wire fields to the camelCase domain shape", () => {
    const result = normalizePeriod(periodWire);

    expect(result).toEqual({
      period: "2026-06-01",
      level: "acima",
      composite: 0.72,
      components: { throughput: 0.8, active_days: 0.6, churn: 0.7 },
      commitCount: 42,
      prCount: 5,
      prMerged: 4,
      additions: 1200,
      deletions: 300,
      activeDays: 4,
      mergeRate: 0.8,
    });
  });

  it("preserves a null merge_rate as null", () => {
    const result = normalizePeriod({ ...periodWire, merge_rate: null });
    expect(result.mergeRate).toBeNull();
  });
});

const windowWire: WindowSummaryWire = {
  start: "2026-05-25",
  end: "2026-06-01",
  level: "acima",
  composite: 0.72,
  commit_count: 84,
  pr_count: 10,
  pr_merged: 8,
  additions: 2400,
  deletions: 600,
  active_days: 8,
  partial_current: true,
};

describe("normalizeWindow", () => {
  it("maps the window summary snake_case fields to camelCase", () => {
    expect(normalizeWindow(windowWire)).toEqual({
      start: "2026-05-25",
      end: "2026-06-01",
      level: "acima",
      composite: 0.72,
      commitCount: 84,
      prCount: 10,
      prMerged: 8,
      additions: 2400,
      deletions: 600,
      activeDays: 8,
      partialCurrent: true,
    });
  });
});

describe("normalizeReport", () => {
  it("normalizes meta, window and every period", () => {
    const wire: ReportWire = {
      meta: {
        granularity: "weekly",
        sample_size: 3,
        weights: { throughput: 0.5, active_days: 0.3, churn: 0.2 },
        level_cuts: { abaixo: 0.25, atendendo: 0.5, acima: 0.75 },
        small_sample: true,
        coverage: { first: "2026-05-01", last: "2026-06-01" },
      },
      window: windowWire,
      periods: [periodWire, { ...periodWire, period: "2026-05-25" }],
    };

    const result = normalizeReport(wire);

    expect(result.meta).toEqual({
      granularity: "weekly",
      sampleSize: 3,
      weights: { throughput: 0.5, active_days: 0.3, churn: 0.2 },
      levelCuts: { abaixo: 0.25, atendendo: 0.5, acima: 0.75 },
      smallSample: true,
      coverage: { first: "2026-05-01", last: "2026-06-01" },
    });
    expect(result.window.commitCount).toBe(84);
    expect(result.window.partialCurrent).toBe(true);
    expect(result.periods).toHaveLength(2);
    expect(result.periods[0].commitCount).toBe(42);
    expect(result.periods[1].period).toBe("2026-05-25");
  });

  it("returns an empty periods array when there is no data", () => {
    const wire: ReportWire = {
      meta: {
        granularity: "monthly",
        sample_size: 0,
        weights: {},
        level_cuts: {},
        small_sample: true,
        coverage: { first: null, last: null },
      },
      window: { ...windowWire, start: null, end: null, partial_current: false },
      periods: [],
    };

    expect(normalizeReport(wire).periods).toEqual([]);
  });
});

describe("normalizeRefresh", () => {
  it("maps pull_requests to pullRequests", () => {
    const wire: RefreshResultWire = {
      repositories: 2,
      commits: 30,
      pull_requests: 7,
    };

    expect(normalizeRefresh(wire)).toEqual({
      repositories: 2,
      commits: 30,
      pullRequests: 7,
    });
  });
});

describe("isValidPeriod", () => {
  it("accepts YYYY-MM-DD", () => {
    expect(isValidPeriod("2026-06-09")).toBe(true);
  });

  it.each(["2026-6-9", "20260609", "june", "2026/06/09", "", "2026-06-09T00:00"])(
    "rejects malformed period %s",
    (value) => {
      expect(isValidPeriod(value)).toBe(false);
    },
  );
});
