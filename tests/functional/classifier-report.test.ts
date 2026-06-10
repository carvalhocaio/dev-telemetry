import { describe, expect, it } from "vitest";
import { toLevel, LEVEL_CUTS_BY_LEVEL } from "@dev-telemetry/core";

/**
 * Functional tests — verify user-facing features end-to-end using real domain
 * logic. Exercises toLevel() and level transitions as the system would in
 * production.
 */

describe("percentile classifier — level assignment", () => {
  it("assigns abaixo for composite below 0.20", () => {
    expect(toLevel(0.0)).toBe("abaixo");
    expect(toLevel(0.19)).toBe("abaixo");
  });

  it("assigns atendendo for composite 0.20–0.70", () => {
    expect(toLevel(0.20)).toBe("atendendo");
    expect(toLevel(0.50)).toBe("atendendo");
    expect(toLevel(0.699)).toBe("atendendo");
  });

  it("assigns acima for composite 0.70–0.90", () => {
    expect(toLevel(0.70)).toBe("acima");
    expect(toLevel(0.85)).toBe("acima");
    expect(toLevel(0.899)).toBe("acima");
  });

  it("assigns muito_acima for composite >= 0.90", () => {
    expect(toLevel(0.90)).toBe("muito_acima");
    expect(toLevel(1.0)).toBe("muito_acima");
  });

  it("boundary values are consistent with LEVEL_CUTS_BY_LEVEL config", () => {
    // LEVEL_CUTS_BY_LEVEL maps level name → its UPPER bound (exclusive).
    // At the cut value itself the classifier transitions to the next level.
    // e.g. atendendo cut = 0.7 → toLevel(0.7) = "acima" (first level above atendendo)
    expect(toLevel(LEVEL_CUTS_BY_LEVEL.atendendo! - 0.001)).toBe("atendendo");
    expect(toLevel(LEVEL_CUTS_BY_LEVEL.acima! - 0.001)).toBe("acima");
  });
});

describe("level progression semantics", () => {
  it("higher composite always yields equal or higher level", () => {
    const levels = ["abaixo", "atendendo", "acima", "muito_acima"];
    const scores = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
    let prevIdx = -1;
    for (const score of scores) {
      const level = toLevel(score);
      const idx = levels.indexOf(level);
      expect(idx).toBeGreaterThanOrEqual(prevIdx);
      prevIdx = idx;
    }
  });
});
