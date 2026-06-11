import { describe, expect, it } from "vitest";

import {
  resolutionForSpan,
  resolveMode,
  resolveRange,
} from "@/lib/range";
import type { Coverage } from "@/types/report";

const TODAY = new Date(2026, 5, 9); // 2026-06-09 local

describe("resolveMode", () => {
  it("defaults to semanal for missing or unknown values", () => {
    expect(resolveMode(null)).toBe("semanal");
    expect(resolveMode("weekly")).toBe("semanal");
  });

  it.each(["mensal", "todo", "custom"] as const)("keeps %s", (mode) => {
    expect(resolveMode(mode)).toBe(mode);
  });
});

describe("resolveRange", () => {
  it("semanal is the last 7 days at daily resolution", () => {
    expect(resolveRange("semanal", undefined, TODAY)).toEqual({
      resolution: "daily",
      start: "2026-06-03",
      end: "2026-06-09",
    });
  });

  it("mensal is the last 30 days at daily resolution", () => {
    expect(resolveRange("mensal", undefined, TODAY)).toEqual({
      resolution: "daily",
      start: "2026-05-11",
      end: "2026-06-09",
    });
  });

  it("todo always returns monthly resolution regardless of coverage span", () => {
    expect(resolveRange("todo")).toEqual({ resolution: "monthly" });

    const shortHistory: Coverage = { first: "2026-04-01", last: "2026-06-09" };
    expect(resolveRange("todo", undefined, TODAY, shortHistory)).toEqual({
      resolution: "monthly",
    });

    const longHistory: Coverage = { first: "2024-01-01", last: "2026-06-09" };
    expect(resolveRange("todo", undefined, TODAY, longHistory)).toEqual({
      resolution: "monthly",
    });
  });

  it("custom uses the user-chosen resolution and bounds", () => {
    const custom = { res: "weekly" as const, start: "2026-01-01", end: "2026-03-01" };
    expect(resolveRange("custom", custom, TODAY)).toEqual({
      resolution: "weekly",
      start: "2026-01-01",
      end: "2026-03-01",
    });
  });

  it("custom without params falls back to the default mode", () => {
    expect(resolveRange("custom", undefined, TODAY)).toEqual(
      resolveRange("semanal", undefined, TODAY),
    );
  });
});

describe("resolutionForSpan", () => {
  it("defaults to monthly when coverage is unknown", () => {
    expect(resolutionForSpan(null)).toBe("monthly");
    expect(resolutionForSpan({ first: null, last: null })).toBe("monthly");
  });

  it("uses weekly at or below the 180-day threshold, monthly above it", () => {
    expect(resolutionForSpan({ first: "2026-01-01", last: "2026-06-01" })).toBe(
      "weekly",
    );
    expect(resolutionForSpan({ first: "2025-01-01", last: "2026-06-01" })).toBe(
      "monthly",
    );
  });
});
