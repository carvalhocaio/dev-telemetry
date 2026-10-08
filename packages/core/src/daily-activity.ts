/**
 * Daily activity aggregation — groups commits and PRs by day, calculates
 * activity metrics (commitsCount, prsCreated, prsMerged, churn, repositories),
 * sorts newest day first, and computes overall totals.
 */

import { commit, pullRequest, repository } from "@dev-telemetry/db/schema";
import { and, eq, ne, sql, type SQL } from "drizzle-orm";

import { toLocalISODate } from "./bucket";
import type {
  DailyActivityDay,
  DailyActivityReport,
  DailyCommitItem,
  DailyPrItem,
  GetDailyActivityInput,
} from "./types";

/**
 * Optional repository-scope filter on the joined `repository` row.
 * Matches the logic in `metrics.ts`.
 */
function scopePredicate(
  scope: string | undefined,
  githubLogin: string | undefined,
): SQL | undefined {
  if (!scope || scope === "all") return undefined;
  const owner = sql`split_part(${repository.fullName}, '/', 1)`;
  if (scope === "personal") return githubLogin ? eq(owner, githubLogin) : undefined;
  if (scope === "org") return githubLogin ? ne(owner, githubLogin) : undefined;
  if (scope.startsWith("org:")) {
    const orgLogin = scope.slice(4);
    return eq(owner, orgLogin);
  }
  return undefined;
}

function extractRows<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && "rows" in raw && Array.isArray((raw as any).rows)) {
    return (raw as any).rows as T[];
  }
  if (raw && typeof (raw as any)[Symbol.iterator] === "function") {
    return Array.from(raw as Iterable<T>);
  }
  return [];
}

/** Formats a Date or ISO date string into a local YYYY-MM-DD string. */
export function toLocalDateStr(value: string | Date): string {
  if (value instanceof Date) {
    return toLocalISODate(value);
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return toLocalISODate(d);
    }
    return value.slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function isWithinWindow(date: string, start?: string, end?: string): boolean {
  if (start !== undefined && date < start) return false;
  if (end !== undefined && date > end) return false;
  return true;
}

interface RawCommitRow {
  sha?: unknown;
  message?: unknown;
  repoName?: unknown;
  repo_name?: unknown;
  additions?: unknown;
  deletions?: unknown;
  authoredAt?: unknown;
  authored_at?: unknown;
  htmlUrl?: unknown;
  html_url?: unknown;
}

interface RawPrRow {
  number?: unknown;
  title?: unknown;
  repoName?: unknown;
  repo_name?: unknown;
  state?: unknown;
  htmlUrl?: unknown;
  html_url?: unknown;
  ghCreatedAt?: unknown;
  gh_created_at?: unknown;
  ghMergedAt?: unknown;
  gh_merged_at?: unknown;
}

function mapCommitRow(r: RawCommitRow): DailyCommitItem {
  const authoredAtVal = r.authoredAt ?? r.authored_at;
  const authoredAt =
    authoredAtVal instanceof Date
      ? authoredAtVal.toISOString()
      : String(authoredAtVal ?? "");

  return {
    sha: String(r.sha ?? ""),
    message: String(r.message ?? ""),
    repoName: String(r.repoName ?? r.repo_name ?? ""),
    additions: Number(r.additions ?? 0),
    deletions: Number(r.deletions ?? 0),
    authoredAt,
    htmlUrl: String(r.htmlUrl ?? r.html_url ?? ""),
  };
}

function mapPrRow(r: RawPrRow): DailyPrItem {
  const ghCreatedAtVal = r.ghCreatedAt ?? r.gh_created_at;
  const ghCreatedAt =
    ghCreatedAtVal instanceof Date
      ? ghCreatedAtVal.toISOString()
      : String(ghCreatedAtVal ?? "");

  const ghMergedAtVal = r.ghMergedAt ?? r.gh_merged_at;
  let ghMergedAt: string | null = null;
  if (ghMergedAtVal !== null && ghMergedAtVal !== undefined) {
    ghMergedAt =
      ghMergedAtVal instanceof Date
        ? ghMergedAtVal.toISOString()
        : String(ghMergedAtVal);
  }

  return {
    number: Number(r.number ?? 0),
    title: String(r.title ?? ""),
    repoName: String(r.repoName ?? r.repo_name ?? ""),
    state: String(r.state ?? "open"),
    htmlUrl: String(r.htmlUrl ?? r.html_url ?? ""),
    ghCreatedAt,
    ghMergedAt,
  };
}

export interface AggregateActivityInput {
  commits: DailyCommitItem[];
  prs: DailyPrItem[];
  start?: string;
  end?: string;
}

export function aggregateDailyActivity(input: AggregateActivityInput): DailyActivityReport {
  const { commits, prs, start, end } = input;

  const daysMap = new Map<string, { commits: DailyCommitItem[]; prs: Map<string, DailyPrItem> }>();

  function getDayBucket(date: string) {
    let bucket = daysMap.get(date);
    if (!bucket) {
      bucket = { commits: [], prs: new Map() };
      daysMap.set(date, bucket);
    }
    return bucket;
  }

  // 1. Group commits by authored local date
  for (const commitItem of commits) {
    const commitDate = toLocalDateStr(commitItem.authoredAt);
    if (!isWithinWindow(commitDate, start, end)) {
      continue;
    }
    getDayBucket(commitDate).commits.push(commitItem);
  }

  // 2. Group PRs by ghCreatedAt date and/or ghMergedAt date
  for (const prItem of prs) {
    const createdDate = toLocalDateStr(prItem.ghCreatedAt);
    const mergedDate = prItem.ghMergedAt ? toLocalDateStr(prItem.ghMergedAt) : null;
    const prKey = prItem.htmlUrl || `${prItem.repoName}#${prItem.number}`;

    if (isWithinWindow(createdDate, start, end)) {
      getDayBucket(createdDate).prs.set(prKey, prItem);
    }
    if (mergedDate && isWithinWindow(mergedDate, start, end)) {
      getDayBucket(mergedDate).prs.set(prKey, prItem);
    }
  }

  // 3. Build DailyActivityDay objects
  const days: DailyActivityDay[] = [];

  for (const [date, bucket] of daysMap.entries()) {
    const dayCommits = bucket.commits;
    const dayPrs = Array.from(bucket.prs.values());

    if (dayCommits.length === 0 && dayPrs.length === 0) {
      continue;
    }

    // Sort commits newest first
    dayCommits.sort((a, b) => b.authoredAt.localeCompare(a.authoredAt));

    // Sort PRs newest first
    dayPrs.sort((a, b) => {
      const aDate = a.ghMergedAt ?? a.ghCreatedAt;
      const bDate = b.ghMergedAt ?? b.ghCreatedAt;
      return bDate.localeCompare(aDate);
    });

    const commitsCount = dayCommits.length;
    const churn = dayCommits.reduce((sum, c) => sum + c.additions + c.deletions, 0);

    const prsCreated = dayPrs.filter(
      (p) => toLocalDateStr(p.ghCreatedAt) === date,
    ).length;

    const prsMerged = dayPrs.filter(
      (p) => p.ghMergedAt !== null && toLocalDateStr(p.ghMergedAt) === date,
    ).length;

    const repoSet = new Set<string>();
    for (const c of dayCommits) {
      if (c.repoName) repoSet.add(c.repoName);
    }
    for (const p of dayPrs) {
      if (p.repoName) repoSet.add(p.repoName);
    }
    const repositories = Array.from(repoSet).sort();

    days.push({
      date,
      commitsCount,
      prsCreated,
      prsMerged,
      churn,
      repositories,
      commits: dayCommits,
      prs: dayPrs,
    });
  }

  // 4. Sort days: newest day first
  days.sort((a, b) => b.date.localeCompare(a.date));

  // 5. Calculate totals
  const allRepos = new Set<string>();
  let totalCommits = 0;
  let totalPrsCreated = 0;
  let totalPrsMerged = 0;
  let totalChurn = 0;

  for (const day of days) {
    totalCommits += day.commitsCount;
    totalPrsCreated += day.prsCreated;
    totalPrsMerged += day.prsMerged;
    totalChurn += day.churn;
    for (const repo of day.repositories) {
      allRepos.add(repo);
    }
  }

  return {
    days,
    totals: {
      daysCount: days.length,
      commitsCount: totalCommits,
      prsCreated: totalPrsCreated,
      prsMerged: totalPrsMerged,
      churn: totalChurn,
      repositories: Array.from(allRepos).sort(),
    },
  };
}

export async function getDailyActivity(
  input: GetDailyActivityInput,
): Promise<DailyActivityReport> {
  const { db, userId, start, end, scope = "all", githubLogin } = input;
  const scopeFilter = scopePredicate(scope, githubLogin);

  const commitWhere = and(
    eq(commit.userId, userId),
    scopeFilter,
    sql`${commit.message} not like 'Merge pull request%'`,
    sql`${commit.message} not like 'Merge branch%'`,
    start ? sql`${commit.authoredAt}::date >= ${start}::date` : undefined,
    end ? sql`${commit.authoredAt}::date <= ${end}::date` : undefined,
  );

  const dateFilter =
    start && end
      ? sql`(${pullRequest.ghCreatedAt}::date >= ${start}::date and ${pullRequest.ghCreatedAt}::date <= ${end}::date) or (${pullRequest.ghMergedAt} is not null and ${pullRequest.ghMergedAt}::date >= ${start}::date and ${pullRequest.ghMergedAt}::date <= ${end}::date)`
      : start
        ? sql`${pullRequest.ghCreatedAt}::date >= ${start}::date or (${pullRequest.ghMergedAt} is not null and ${pullRequest.ghMergedAt}::date >= ${start}::date)`
        : end
          ? sql`${pullRequest.ghCreatedAt}::date <= ${end}::date or (${pullRequest.ghMergedAt} is not null and ${pullRequest.ghMergedAt}::date <= ${end}::date)`
          : undefined;

  const prWhere = and(
    eq(pullRequest.userId, userId),
    scopeFilter,
    dateFilter,
  );

  const [rawCommits, rawPrs] = await Promise.all([
    db.execute(
      sql`
        select
          ${commit.sha} as "sha",
          ${commit.message} as "message",
          ${repository.name} as "repoName",
          ${commit.additions} as "additions",
          ${commit.deletions} as "deletions",
          ${commit.authoredAt} as "authoredAt",
          ${commit.htmlUrl} as "htmlUrl"
        from ${commit}
        join ${repository} on ${eq(commit.repoId, repository.id)}
        where ${commitWhere}
        order by ${commit.authoredAt} desc
      `,
    ),
    db.execute(
      sql`
        select
          ${pullRequest.number} as "number",
          ${pullRequest.title} as "title",
          ${repository.name} as "repoName",
          ${pullRequest.state} as "state",
          ${pullRequest.htmlUrl} as "htmlUrl",
          ${pullRequest.ghCreatedAt} as "ghCreatedAt",
          ${pullRequest.ghMergedAt} as "ghMergedAt"
        from ${pullRequest}
        join ${repository} on ${eq(pullRequest.repoId, repository.id)}
        where ${prWhere}
        order by ${pullRequest.ghCreatedAt} desc
      `,
    ),
  ]);

  const commits = extractRows<RawCommitRow>(rawCommits).map(mapCommitRow);
  const prs = extractRows<RawPrRow>(rawPrs).map(mapPrRow);

  return aggregateDailyActivity({ commits, prs, start, end });
}
