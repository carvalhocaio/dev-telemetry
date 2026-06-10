import { describe, expect, it } from "vitest";

import { fillPeriods } from "@/lib/calendar";
import { isNoData, type PeriodReport } from "@/types/report";

function period(date: string): PeriodReport {
  return {
    period: date,
    level: "atendendo",
    composite: 0.5,
    components: { throughput: 0.5, active_days: 0.5, churn: 0.5 },
    commitCount: 1,
    prCount: 0,
    prMerged: 0,
    additions: 10,
    deletions: 2,
    activeDays: 1,
    mergeRate: null,
  };
}

describe("fillPeriods (daily)", () => {
  it("emits one slot per calendar day, filling gaps (weekends) as no-data", () => {
    // 2026-06-05 (Fri) and 2026-06-08 (Mon) have data; 06/06–06/07 weekend empty.
    const items = fillPeriods(
      [period("2026-06-05"), period("2026-06-08")],
      "daily",
      "2026-06-05",
      "2026-06-08",
    );

    expect(items.map((i) => i.period)).toEqual([
      "2026-06-05",
      "2026-06-06",
      "2026-06-07",
      "2026-06-08",
    ]);
    expect(isNoData(items[0])).toBe(false);
    expect(isNoData(items[1])).toBe(true); // Saturday
    expect(isNoData(items[2])).toBe(true); // Sunday
    expect(isNoData(items[3])).toBe(false);
  });
});

describe("fillPeriods (weekly)", () => {
  it("snaps slots to Mondays matching the backend buckets", () => {
    const items = fillPeriods(
      [period("2026-06-01")], // Monday
      "weekly",
      "2026-06-01",
      "2026-06-14",
    );

    expect(items.map((i) => i.period)).toEqual(["2026-06-01", "2026-06-08"]);
    expect(isNoData(items[1])).toBe(true);
  });
});

describe("fillPeriods (no window)", () => {
  it("returns the periods sorted oldest to newest without synthesizing slots", () => {
    const items = fillPeriods(
      [period("2026-06-01"), period("2026-03-01"), period("2026-05-01")],
      "monthly",
    );

    expect(items.map((i) => i.period)).toEqual([
      "2026-03-01",
      "2026-05-01",
      "2026-06-01",
    ]);
  });
});
