import { describe, expect, it } from "vitest";

import { summarizeWindow } from "./reporting";
import type { PeriodMetrics } from "./types";

function metrics(overrides: Partial<PeriodMetrics> & { period: string }): PeriodMetrics {
  return {
    commitCount: 0,
    additions: 0,
    deletions: 0,
    activeDays: 0,
    prCount: 0,
    prMerged: 0,
    prOpen: 0,
    ...overrides,
  };
}

describe("summarizeWindow aggregation", () => {
  const baseline: PeriodMetrics[] = [
    metrics({
      period: "2025-01-06",
      commitCount: 2,
      prCount: 1,
      prMerged: 1,
      additions: 20,
      deletions: 5,
      activeDays: 2,
    }),
    metrics({
      period: "2025-01-13",
      commitCount: 6,
      prCount: 2,
      prMerged: 1,
      additions: 60,
      deletions: 10,
      activeDays: 4,
    }),
    metrics({
      period: "2025-01-20",
      commitCount: 10,
      prCount: 3,
      prMerged: 3,
      additions: 100,
      deletions: 30,
      activeDays: 5,
    }),
  ];

  it("sums totals across the in-window periods", () => {
    const today = new Date(2025, 5, 1); // outside the window
    const summary = summarizeWindow("weekly", baseline, "2025-01-06", "2025-01-20", today);

    expect(summary.commitCount).toBe(18);
    expect(summary.prCount).toBe(6);
    expect(summary.prMerged).toBe(5);
    expect(summary.additions).toBe(180);
    expect(summary.deletions).toBe(45);
    expect(summary.activeDays).toBe(11);
    expect(summary.start).toBe("2025-01-06");
    expect(summary.end).toBe("2025-01-20");
  });

  it("falls back to min/max period when start/end are omitted", () => {
    const today = new Date(2025, 5, 1);
    const summary = summarizeWindow("weekly", baseline, undefined, undefined, today);
    expect(summary.start).toBe("2025-01-06");
    expect(summary.end).toBe("2025-01-20");
  });

  it("keeps explicit start/end even with no in-window periods", () => {
    const today = new Date(2025, 5, 1);
    const summary = summarizeWindow("weekly", [], "2025-02-01", "2025-02-28", today);
    expect(summary.start).toBe("2025-02-01");
    expect(summary.end).toBe("2025-02-28");
    expect(summary.commitCount).toBe(0);
    expect(summary.partialCurrent).toBe(false);
  });
});

describe("summarizeWindow partialCurrent", () => {
  const baseline: PeriodMetrics[] = [
    metrics({ period: "2025-06-02", commitCount: 5, activeDays: 3 }),
    metrics({ period: "2025-06-09", commitCount: 7, activeDays: 4 }),
  ];

  it("is true when the window contains the current weekly bucket", () => {
    // 2025-06-10 is a Tuesday → its week bucket is Monday 2025-06-09 (in window)
    const today = new Date(2025, 5, 10);
    const summary = summarizeWindow("weekly", baseline, "2025-06-02", "2025-06-09", today);
    expect(summary.partialCurrent).toBe(true);
  });

  it("is false when the current bucket is not among the periods", () => {
    const today = new Date(2025, 5, 10); // current bucket 2025-06-09, not in window
    const summary = summarizeWindow("weekly", [baseline[0]!], "2025-06-02", "2025-06-02", today);
    expect(summary.partialCurrent).toBe(false);
  });

  it("respects granularity when computing the current bucket (monthly)", () => {
    const monthly: PeriodMetrics[] = [
      metrics({ period: "2025-05-01", commitCount: 5 }),
      metrics({ period: "2025-06-01", commitCount: 7 }),
    ];
    const today = new Date(2025, 5, 10); // June → bucket 2025-06-01
    const summary = summarizeWindow("monthly", monthly, "2025-05-01", "2025-06-01", today);
    expect(summary.partialCurrent).toBe(true);
  });
});
