import { describe, expect, it } from "vitest";

import {
  classify,
  percentileRank,
  toLevel,
  WEIGHTS,
} from "./classifier.js";
import type { PeriodMetrics } from "./types.js";

function metrics(overrides: Partial<PeriodMetrics> & { period: string }): PeriodMetrics {
  return {
    commitCount: 0,
    additions: 0,
    deletions: 0,
    activeDays: 0,
    prCount: 0,
    prMerged: 0,
    ...overrides,
  };
}

describe("percentileRank", () => {
  it("returns neutral 0.5 for an empty or singleton population", () => {
    expect(percentileRank(5, [])).toBe(0.5);
    expect(percentileRank(5, [5])).toBe(0.5);
    expect(percentileRank(99, [1])).toBe(0.5);
  });

  it("counts equals at half weight: (below + 0.5*equal)/n", () => {
    // population [1,2,2,3], value 2 → below=1, equal=2 → (1 + 1)/4 = 0.5
    expect(percentileRank(2, [1, 2, 2, 3])).toBeCloseTo(0.5, 10);
  });

  it("ranks the minimum and maximum correctly", () => {
    // value below all → below=0,equal=0 → 0
    expect(percentileRank(0, [1, 2, 3, 4])).toBe(0);
    // value above all → below=4 → 1
    expect(percentileRank(5, [1, 2, 3, 4])).toBe(1);
  });

  it("handles a single tie", () => {
    // [10,20], value 10 → below=0,equal=1 → 0.5/2 = 0.25
    expect(percentileRank(10, [10, 20])).toBeCloseTo(0.25, 10);
  });
});

describe("WEIGHTS", () => {
  it("are throughput .45 / active_days .35 / churn .20 and sum to 1", () => {
    expect(WEIGHTS.throughput).toBe(0.45);
    expect(WEIGHTS.active_days).toBe(0.35);
    expect(WEIGHTS.churn).toBe(0.2);
    expect(WEIGHTS.throughput + WEIGHTS.active_days + WEIGHTS.churn).toBeCloseTo(
      1,
      10,
    );
  });
});

describe("toLevel cut boundaries", () => {
  it("maps composites to levels at the exact cuts (<.20/.70/.90)", () => {
    expect(toLevel(0)).toBe("abaixo");
    expect(toLevel(0.19)).toBe("abaixo");
    // boundary is exclusive lower bound: 0.20 is NOT < 0.20 → atendendo
    expect(toLevel(0.2)).toBe("atendendo");
    expect(toLevel(0.69)).toBe("atendendo");
    expect(toLevel(0.7)).toBe("acima");
    expect(toLevel(0.89)).toBe("acima");
    expect(toLevel(0.9)).toBe("muito_acima");
    expect(toLevel(1)).toBe("muito_acima");
  });
});

describe("classify", () => {
  it("returns an empty array for no periods", () => {
    expect(classify([])).toEqual([]);
  });

  it("gives a single period a neutral composite (0.5) and 'atendendo'", () => {
    const result = classify([metrics({ period: "2025-01-06", commitCount: 5 })]);
    expect(result).toHaveLength(1);
    expect(result[0]!.composite).toBeCloseTo(0.5, 10);
    expect(result[0]!.level).toBe("atendendo");
    expect(result[0]!.components).toEqual({
      throughput: 0.5,
      active_days: 0.5,
      churn: 0.5,
    });
  });

  it("ranks each period against the full population", () => {
    const population: PeriodMetrics[] = [
      metrics({ period: "2025-01-06", commitCount: 1, activeDays: 1, additions: 10 }),
      metrics({ period: "2025-01-13", commitCount: 5, activeDays: 3, additions: 50 }),
      metrics({ period: "2025-01-20", commitCount: 9, activeDays: 5, additions: 90 }),
    ];
    const result = classify(population);

    // Top period: throughput max (below=2 of 3), active max, churn max.
    const top = result[2]!;
    // each component rank = (2 + 0.5*1)/3 = 2.5/3
    const expectedComponent = 2.5 / 3;
    expect(top.components.throughput).toBeCloseTo(expectedComponent, 10);
    expect(top.components.active_days).toBeCloseTo(expectedComponent, 10);
    expect(top.components.churn).toBeCloseTo(expectedComponent, 10);
    const expectedComposite =
      WEIGHTS.throughput * expectedComponent +
      WEIGHTS.active_days * expectedComponent +
      WEIGHTS.churn * expectedComponent;
    expect(top.composite).toBeCloseTo(expectedComposite, 10);

    // Bottom period ranks lowest (below=0).
    const bottom = result[0]!;
    expect(bottom.components.throughput).toBeCloseTo(0.5 / 3, 10);
  });

  it("uses throughput = commits + prs and churn = additions + deletions", () => {
    const population: PeriodMetrics[] = [
      metrics({ period: "a", commitCount: 1, prCount: 0, additions: 1, deletions: 0 }),
      // throughput 2+1=3 ties with the next via commits/prs split
      metrics({ period: "b", commitCount: 2, prCount: 1, additions: 2, deletions: 1 }),
      metrics({ period: "c", commitCount: 0, prCount: 3, additions: 1, deletions: 2 }),
    ];
    const result = classify(population);
    // b and c both have throughput 3 → tie at the top
    expect(result[1]!.components.throughput).toBeCloseTo(result[2]!.components.throughput, 10);
    // b and c both have churn 3 → tie
    expect(result[1]!.components.churn).toBeCloseTo(result[2]!.components.churn, 10);
  });
});
