/**
 * Percentile-rank classifier — exact TS port of
 * `api/app/analysis/classifier.py`.
 *
 * Each period is ranked against the *full* population on three components,
 * combined into a weighted composite, then mapped to a level by fixed cuts.
 */

import {
  type Components,
  churn,
  type Level,
  type PeriodClassification,
  type PeriodMetrics,
  throughput,
} from "./types";

export const WEIGHTS: Record<keyof Components, number> = {
  throughput: 0.45,
  active_days: 0.35,
  churn: 0.2,
};

/** Upper-bound cuts, in order. A composite below a cut yields its level. */
const LEVEL_CUTS: ReadonlyArray<readonly [number, Level]> = [
  [0.2, "abaixo"],
  [0.7, "atendendo"],
  [0.9, "acima"],
];

/** Exposed for `meta.levelCuts` ({ level: cut }), matching the Python report. */
export const LEVEL_CUTS_BY_LEVEL: Record<string, number> = Object.fromEntries(
  LEVEL_CUTS.map(([cut, level]) => [level, cut]),
);

const NEUTRAL_RANK = 0.5;

/**
 * Fraction of the population at or below `value`, counting equals at half
 * weight: (below + 0.5 * equal) / n. Neutral 0.5 when the population has <= 1
 * element (a single period can't be ranked against itself).
 */
export function percentileRank(value: number, population: number[]): number {
  const n = population.length;
  if (n <= 1) {
    return NEUTRAL_RANK;
  }
  let below = 0;
  let equal = 0;
  for (const x of population) {
    if (x < value) {
      below += 1;
    } else if (x === value) {
      equal += 1;
    }
  }
  return (below + 0.5 * equal) / n;
}

/** Maps a composite score to a level using the fixed cuts. */
export function toLevel(composite: number): Level {
  for (const [upper, level] of LEVEL_CUTS) {
    if (composite < upper) {
      return level;
    }
  }
  return "muito_acima";
}

/**
 * Classifies every period against the full population. Returns one
 * classification per input period, in input order.
 */
export function classify(periods: PeriodMetrics[]): PeriodClassification[] {
  if (periods.length === 0) {
    return [];
  }

  const throughputPop = periods.map(throughput);
  const activePop = periods.map((p) => p.activeDays);
  const churnPop = periods.map(churn);

  return periods.map((p) => {
    const components: Components = {
      throughput: percentileRank(throughput(p), throughputPop),
      active_days: percentileRank(p.activeDays, activePop),
      churn: percentileRank(churn(p), churnPop),
    };
    const composite =
      WEIGHTS.throughput * components.throughput +
      WEIGHTS.active_days * components.active_days +
      WEIGHTS.churn * components.churn;
    return {
      period: p.period,
      level: toLevel(composite),
      composite,
      components,
    };
  });
}
