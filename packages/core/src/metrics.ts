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

import { commit, pullRequest, repository } from "@dev-telemetry/db/schema";
import { and, eq, ne, sql, type SQL } from "drizzle-orm";

import type { Granularity, PeriodMetrics, Scope } from "./types";

/** Anything Drizzle-shaped that can run a `.execute()` query. */
interface Executor {
  execute(query: unknown): Promise<unknown>;
}

const TRUNC_UNIT: Record<Granularity, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
};

/**
 * Optional repository-scope filter on the joined `repository` row.
 *
 * Compares the owner segment of `repository.fullName` (everything before the
 * first `/`) against `githubLogin`. Returns `undefined` when no scoping applies
 * (scope `all`, or scope set but `githubLogin` missing), so callers can omit
 * the join/predicate entirely.
 */
function scopePredicate(
  scope: Scope,
  githubLogin: string | undefined,
): SQL | undefined {
  if (scope === "all") return undefined;
  const owner = sql`split_part(${repository.fullName}, '/', 1)`;
  if (scope === "personal") return githubLogin ? eq(owner, githubLogin) : undefined;
  if (scope === "org") return githubLogin ? ne(owner, githubLogin) : undefined;
  // org:<login> — specific org, no githubLogin needed
  const orgLogin = scope.slice(4);
  return eq(owner, orgLogin);
}

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
  scopeFilter: SQL | undefined,
): Promise<Map<string, CommitAggregate>> {
  // Unit must be inlined as a SQL literal — if parameterized ($1 vs $3 in SELECT
  // and GROUP BY), Postgres treats them as different bindings and rejects the query
  // with "must appear in GROUP BY". Unit is always from TRUNC_UNIT (day/week/month).
  const unitLit = sql.raw(`'${unit}'`);
  const bucket = sql<string>`date_trunc(${unitLit}, ${commit.authoredAt})::date`;
  const join = scopeFilter
    ? sql`join ${repository} on ${eq(commit.repoId, repository.id)}`
    : sql``;
  const where = and(eq(commit.userId, userId), scopeFilter);
  const rows = (await db.execute(
    sql`
      select
        ${bucket} as "bucket",
        count(*) as "commit_count",
        coalesce(sum(${commit.additions}), 0) as "additions",
        coalesce(sum(${commit.deletions}), 0) as "deletions",
        count(distinct ${commit.authoredAt}::date) as "active_days"
      from ${commit}
      ${join}
      where ${where}
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
  scopeFilter: SQL | undefined,
): Promise<Map<string, PrAggregate>> {
  const unitLit = sql.raw(`'${unit}'`);
  const bucket = sql<string>`date_trunc(${unitLit}, ${pullRequest.ghCreatedAt})::date`;
  const join = scopeFilter
    ? sql`join ${repository} on ${eq(pullRequest.repoId, repository.id)}`
    : sql``;
  const where = and(eq(pullRequest.userId, userId), scopeFilter);
  const rows = (await db.execute(
    sql`
      select
        ${bucket} as "bucket",
        count(*) as "pr_count",
        count(*) filter (where ${eq(pullRequest.state, "merged")}) as "pr_merged"
      from ${pullRequest}
      ${join}
      where ${where}
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
 *
 * When `scope` is `org` or `personal` and `githubLogin` is provided, activity
 * is restricted to repositories whose `fullName` owner matches (personal) or
 * differs from (org) `githubLogin`.
 */
export async function computeMetrics(
  db: Executor,
  userId: string,
  granularity: Granularity,
  scope: Scope = "all",
  githubLogin?: string,
): Promise<PeriodMetrics[]> {
  const unit = TRUNC_UNIT[granularity];
  const scopeFilter = scopePredicate(scope, githubLogin);
  const [commits, pulls] = await Promise.all([
    commitAggregates(db, userId, unit, scopeFilter),
    prAggregates(db, userId, unit, scopeFilter),
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
