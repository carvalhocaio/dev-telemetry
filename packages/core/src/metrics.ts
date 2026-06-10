/**
 * Period metrics aggregation — TS/Drizzle port of
 * `api/app/analysis/metrics.py` (`MetricsService`).
 *
 * Two grouped queries (commits, PRs) bucketed by `date_trunc(<unit>, ...)`,
 * scoped by `userId`, merged into one sorted `PeriodMetrics[]`.
 *
 * The bucket key is emitted as a `date` (`date_trunc(...)::date`) and read as a
 * "YYYY-MM-DD" string, matching the Python `r[0].date()` behavior and keeping
 * the rest of the domain free of `Date` objects.
 */

import { commit, pullRequest } from "@dev-telemetry/db/schema";
import { eq, sql } from "drizzle-orm";

import type { Granularity, PeriodMetrics } from "./types.js";

/** Anything Drizzle-shaped that can run a `.execute()` query. */
interface Executor {
  execute(query: unknown): Promise<unknown>;
}

const TRUNC_UNIT: Record<Granularity, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

type CommitAggregate = {
  commitCount: number;
  additions: number;
  deletions: number;
  activeDays: number;
};

type PrAggregate = {
  prCount: number;
  prMerged: number;
};

const EMPTY_COMMIT: CommitAggregate = {
  commitCount: 0,
  additions: 0,
  deletions: 0,
  activeDays: 0,
};

const EMPTY_PR: PrAggregate = { prCount: 0, prMerged: 0 };

interface CommitRow {
  bucket: string;
  commit_count: number | string;
  additions: number | string;
  deletions: number | string;
  active_days: number | string;
}

interface PrRow {
  bucket: string;
  pr_count: number | string;
  pr_merged: number | string;
}

async function commitAggregates(
  db: Executor,
  userId: string,
  unit: string,
): Promise<Map<string, CommitAggregate>> {
  const bucket = sql<string>`date_trunc(${unit}, ${commit.authoredAt})::date`;
  const rows = (await db.execute(
    sql`
      select
        ${bucket} as "bucket",
        count(*) as "commit_count",
        coalesce(sum(${commit.additions}), 0) as "additions",
        coalesce(sum(${commit.deletions}), 0) as "deletions",
        count(distinct ${commit.authoredAt}::date) as "active_days"
      from ${commit}
      where ${eq(commit.userId, userId)}
      group by ${bucket}
    `,
  )) as unknown as Iterable<CommitRow>;

  const result = new Map<string, CommitAggregate>();
  for (const r of rows) {
    result.set(String(r.bucket), {
      commitCount: Number(r.commit_count),
      additions: Number(r.additions),
      deletions: Number(r.deletions),
      activeDays: Number(r.active_days),
    });
  }
  return result;
}

async function prAggregates(
  db: Executor,
  userId: string,
  unit: string,
): Promise<Map<string, PrAggregate>> {
  const bucket = sql<string>`date_trunc(${unit}, ${pullRequest.ghCreatedAt})::date`;
  const rows = (await db.execute(
    sql`
      select
        ${bucket} as "bucket",
        count(*) as "pr_count",
        count(*) filter (where ${eq(pullRequest.state, "merged")}) as "pr_merged"
      from ${pullRequest}
      where ${eq(pullRequest.userId, userId)}
      group by ${bucket}
    `,
  )) as unknown as Iterable<PrRow>;

  const result = new Map<string, PrAggregate>();
  for (const r of rows) {
    result.set(String(r.bucket), {
      prCount: Number(r.pr_count),
      prMerged: Number(r.pr_merged),
    });
  }
  return result;
}

/**
 * Computes per-period metrics for `userId` at the given granularity, sorted by
 * period ascending. Each row aggregates commit + PR activity for one bucket.
 */
export async function computeMetrics(
  db: Executor,
  userId: string,
  granularity: Granularity,
): Promise<PeriodMetrics[]> {
  const unit = TRUNC_UNIT[granularity];
  const [commits, pulls] = await Promise.all([
    commitAggregates(db, userId, unit),
    prAggregates(db, userId, unit),
  ]);

  const periods = [
    ...new Set<string>([...commits.keys(), ...pulls.keys()]),
  ].sort();

  return periods.map((period) => {
    const c = commits.get(period) ?? EMPTY_COMMIT;
    const p = pulls.get(period) ?? EMPTY_PR;
    return {
      period,
      commitCount: c.commitCount,
      additions: c.additions,
      deletions: c.deletions,
      activeDays: c.activeDays,
      prCount: p.prCount,
      prMerged: p.prMerged,
    };
  });
}
