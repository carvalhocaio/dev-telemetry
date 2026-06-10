import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@dev-telemetry/db/client";
import {
  commit,
  pullRequest,
  repository,
  syncJob,
  userUsage,
} from "@dev-telemetry/db/schema";
import type { Octokit } from "./client.js";
import {
  QUOTA_BYTES,
  capCommitMessage,
  capPrBody,
  estimateCommitBytes,
  estimatePrBytes,
  isWithinQuota,
} from "./cap.js";

// ---------------------------------------------------------------------------
// Cursor
// ---------------------------------------------------------------------------

export type SyncMode = "full" | "incremental";
export type SyncPhase = "repos" | "commits" | "prs" | "done";

export interface SyncCursor {
  phase: SyncPhase;
  /** DB IDs of repos discovered in the repos phase. */
  repoIds: string[];
  /** Index into repoIds being processed. */
  repoIndex: number;
  /** 1-based GitHub API page number for the current repo. */
  page: number;
  /** ISO date string — only used in incremental mode. */
  since?: string;
}

// How many API pages to process per batch invocation.
const PAGES_PER_BATCH = 3;

// ---------------------------------------------------------------------------
// Job helpers
// ---------------------------------------------------------------------------

export async function startSyncJob(
  db: Database,
  userId: string,
  mode: SyncMode,
): Promise<string> {
  const [job] = await db
    .insert(syncJob)
    .values({ userId, mode, status: "queued" })
    .returning({ id: syncJob.id });
  if (!job) throw new Error("Failed to create sync_job");
  return job.id;
}

async function markJobRunning(
  db: Database,
  jobId: string,
  phase: SyncPhase,
  cursor: SyncCursor,
  counters?: Partial<{ reposTotal: number }>,
) {
  await db
    .update(syncJob)
    .set({
      status: "running",
      phase,
      cursor,
      updatedAt: new Date(),
      ...(counters ?? {}),
    })
    .where(eq(syncJob.id, jobId));
}

async function updateJobCursor(
  db: Database,
  jobId: string,
  cursor: SyncCursor,
  counters?: Partial<{ reposDone: number; commits: number; prs: number }>,
) {
  await db
    .update(syncJob)
    .set({ cursor, updatedAt: new Date(), phase: cursor.phase, ...(counters ?? {}) })
    .where(eq(syncJob.id, jobId));
}

async function finishJob(db: Database, jobId: string, status: "done" | "error" | "limit_reached", error?: string) {
  await db
    .update(syncJob)
    .set({ status, phase: "done", updatedAt: new Date(), error: error ?? null })
    .where(eq(syncJob.id, jobId));
}

// ---------------------------------------------------------------------------
// Quota
// ---------------------------------------------------------------------------

async function getUsage(db: Database, userId: string): Promise<number> {
  const [row] = await db
    .select({ bytesUsed: userUsage.bytesUsed })
    .from(userUsage)
    .where(eq(userUsage.userId, userId))
    .limit(1);
  return row?.bytesUsed ?? 0;
}

async function addUsage(db: Database, userId: string, deltaBytes: number) {
  await db
    .insert(userUsage)
    .values({ userId, bytesUsed: deltaBytes })
    .onConflictDoUpdate({
      target: userUsage.userId,
      set: {
        bytesUsed: sql`${userUsage.bytesUsed} + ${deltaBytes}`,
        updatedAt: new Date(),
      },
    });
}

// ---------------------------------------------------------------------------
// Phase 1: discover repos
// ---------------------------------------------------------------------------

async function discoverRepos(
  db: Database,
  octokit: Octokit,
  userId: string,
): Promise<string[]> {
  const rawRepos = await octokit.paginate(
    octokit.rest.repos.listForAuthenticatedUser,
    {
      affiliation: "owner,collaborator,organization_member",
      visibility: "all",
      per_page: 100,
    },
  );

  if (rawRepos.length === 0) return [];

  // Upsert all repos and return their DB IDs.
  const rows = rawRepos.map((r) => ({
    userId,
    githubId: r.id,
    name: r.name,
    fullName: r.full_name,
  }));

  await db
    .insert(repository)
    .values(rows)
    .onConflictDoUpdate({
      target: [repository.userId, repository.githubId],
      set: {
        name: sql`excluded.name`,
        fullName: sql`excluded."fullName"`,
        updatedAt: new Date(),
      },
    });

  const saved = await db
    .select({ id: repository.id, githubId: repository.githubId })
    .from(repository)
    .where(eq(repository.userId, userId));

  return saved.map((r) => r.id);
}

// ---------------------------------------------------------------------------
// Phase 2: ingest commits (one page)
// ---------------------------------------------------------------------------

async function ingestCommitsPage(
  db: Database,
  octokit: Octokit,
  userId: string,
  repoId: string,
  owner: string,
  repoName: string,
  userLogin: string,
  page: number,
  since?: string,
): Promise<{ count: number; hasMore: boolean; deltaBytes: number }> {
  const resp = await octokit.rest.repos.listCommits({
    owner,
    repo: repoName,
    author: userLogin,
    per_page: 100,
    page,
    ...(since ? { since } : {}),
  });

  const hasMore = resp.headers.link?.includes('rel="next"') ?? false;

  const rows = resp.data
    .filter((c) => c.author?.login === userLogin && c.commit.author?.date)
    .map((c) => {
      const message = capCommitMessage(c.commit.message);
      return {
        userId,
        repoId,
        sha: c.sha,
        message,
        authoredAt: new Date(c.commit.author!.date!),
        additions: c.stats?.additions ?? 0,
        deletions: c.stats?.deletions ?? 0,
        changedFiles: c.files?.length ?? 0,
        htmlUrl: c.html_url,
      };
    });

  if (rows.length > 0) {
    await db
      .insert(commit)
      .values(rows)
      .onConflictDoNothing({ target: [commit.userId, commit.sha] });
  }

  const deltaBytes = rows.reduce((sum, r) => sum + estimateCommitBytes(r.message), 0);
  return { count: rows.length, hasMore, deltaBytes };
}

// ---------------------------------------------------------------------------
// Phase 3: ingest PRs (one page)
// ---------------------------------------------------------------------------

async function ingestPrsPage(
  db: Database,
  octokit: Octokit,
  userId: string,
  repoId: string,
  owner: string,
  repoName: string,
  userLogin: string,
  page: number,
  since?: string,
): Promise<{ count: number; hasMore: boolean; deltaBytes: number }> {
  const resp = await octokit.rest.pulls.list({
    owner,
    repo: repoName,
    state: "all",
    per_page: 100,
    page,
    sort: "created",
    direction: "asc",
  });

  const hasMore = resp.headers.link?.includes('rel="next"') ?? false;

  const userPrs = resp.data.filter(
    (pr) =>
      pr.user?.login === userLogin &&
      (!since || new Date(pr.created_at) >= new Date(since)),
  );

  const rows = userPrs.map((pr) => {
    const body = pr.body ? capPrBody(pr.body) : null;
    return {
      userId,
      repoId,
      number: pr.number,
      title: pr.title,
      body,
      state: pr.state,
      ghCreatedAt: new Date(pr.created_at),
      ghMergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      // stats not available from the list endpoint — default to 0
      additions: 0,
      deletions: 0,
      changedFiles: 0,
      htmlUrl: pr.html_url,
    };
  });

  if (rows.length > 0) {
    await db
      .insert(pullRequest)
      .values(rows)
      .onConflictDoNothing({
        target: [pullRequest.userId, pullRequest.repoId, pullRequest.number],
      });
  }

  const deltaBytes = rows.reduce(
    (sum, r) => sum + estimatePrBytes(r.title, r.body),
    0,
  );
  return { count: rows.length, hasMore, deltaBytes };
}

// ---------------------------------------------------------------------------
// Repo metadata helper (owner/name from DB)
// ---------------------------------------------------------------------------

async function getRepoMeta(
  db: Database,
  repoId: string,
): Promise<{ owner: string; name: string } | null> {
  const [row] = await db
    .select({ fullName: repository.fullName, name: repository.name })
    .from(repository)
    .where(eq(repository.id, repoId))
    .limit(1);
  if (!row) return null;
  const [owner] = row.fullName.split("/");
  return owner ? { owner, name: row.name } : null;
}

// ---------------------------------------------------------------------------
// Main batch executor
// ---------------------------------------------------------------------------

/**
 * Processes one batch of the backfill job.
 *
 * Reads the cursor from the `sync_job` row, executes up to `PAGES_PER_BATCH`
 * API pages, writes data to the DB, updates the cursor, and returns whether
 * the job is complete.
 *
 * The caller (API route + `waitUntil`) should re-invoke until `done === true`.
 */
export async function runBackfillBatch(
  db: Database,
  octokit: Octokit,
  jobId: string,
  userLogin: string,
): Promise<{ done: boolean }> {
  const [job] = await db
    .select()
    .from(syncJob)
    .where(eq(syncJob.id, jobId))
    .limit(1);

  if (!job) throw new Error(`sync_job ${jobId} not found`);
  if (job.status === "done" || job.status === "error" || job.status === "limit_reached") {
    return { done: true };
  }

  const userId = job.userId;
  let cursor: SyncCursor = (job.cursor as SyncCursor | null) ?? {
    phase: "repos",
    repoIds: [],
    repoIndex: 0,
    page: 1,
    since: job.mode === "incremental" ? await getLastSyncDate(db, userId) : undefined,
  };

  try {
    // --- Phase 1: repos ---
    if (cursor.phase === "repos") {
      const repoIds = await discoverRepos(db, octokit, userId);
      cursor = { ...cursor, phase: "commits", repoIds, repoIndex: 0, page: 1 };
      await markJobRunning(db, jobId, "commits", cursor, { reposTotal: repoIds.length });
      // Fall through to start commits in the same batch.
    }

    // --- Phase 2 or 3: paginate repos ---
    let pagesProcessed = 0;
    let totalCommits = job.commits;
    let totalPrs = job.prs;
    let reposDone = job.reposDone;

    while (
      pagesProcessed < PAGES_PER_BATCH &&
      cursor.repoIndex < cursor.repoIds.length &&
      (cursor.phase === "commits" || cursor.phase === "prs")
    ) {
      // Quota check before each page.
      const bytesUsed = await getUsage(db, userId);
      if (!isWithinQuota(bytesUsed, QUOTA_BYTES)) {
        await finishJob(db, jobId, "limit_reached");
        return { done: true };
      }

      const repoId = cursor.repoIds[cursor.repoIndex]!;
      const meta = await getRepoMeta(db, repoId);
      if (!meta) {
        cursor = { ...cursor, repoIndex: cursor.repoIndex + 1, page: 1 };
        continue;
      }

      if (cursor.phase === "commits") {
        const { count, hasMore, deltaBytes } = await ingestCommitsPage(
          db, octokit, userId, repoId,
          meta.owner, meta.name, userLogin,
          cursor.page, cursor.since,
        );
        totalCommits += count;
        if (deltaBytes > 0) await addUsage(db, userId, deltaBytes);

        if (hasMore) {
          cursor = { ...cursor, page: cursor.page + 1 };
        } else {
          reposDone += 1;
          cursor = { ...cursor, repoIndex: cursor.repoIndex + 1, page: 1 };
        }
      } else {
        const { count, hasMore, deltaBytes } = await ingestPrsPage(
          db, octokit, userId, repoId,
          meta.owner, meta.name, userLogin,
          cursor.page, cursor.since,
        );
        totalPrs += count;
        if (deltaBytes > 0) await addUsage(db, userId, deltaBytes);

        if (hasMore) {
          cursor = { ...cursor, page: cursor.page + 1 };
        } else {
          cursor = { ...cursor, repoIndex: cursor.repoIndex + 1, page: 1 };
        }
      }

      pagesProcessed++;
      await updateJobCursor(db, jobId, cursor, { reposDone, commits: totalCommits, prs: totalPrs });
    }

    // Transition commits → prs when all repos have been processed.
    if (cursor.phase === "commits" && cursor.repoIndex >= cursor.repoIds.length) {
      cursor = { ...cursor, phase: "prs", repoIndex: 0, page: 1 };
      await updateJobCursor(db, jobId, cursor, { reposDone: 0 });
      return { done: false }; // Let the next batch start the prs phase.
    }

    // All repos processed in prs phase → done.
    if (cursor.phase === "prs" && cursor.repoIndex >= cursor.repoIds.length) {
      await finishJob(db, jobId, "done");
      return { done: true };
    }

    return { done: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finishJob(db, jobId, "error", message);
    throw err;
  }
}

async function getLastSyncDate(db: Database, userId: string): Promise<string | undefined> {
  const [last] = await db
    .select({ startedAt: syncJob.startedAt })
    .from(syncJob)
    .where(and(eq(syncJob.userId, userId), eq(syncJob.status, "done")))
    .orderBy(sql`${syncJob.startedAt} DESC`)
    .limit(1);
  return last?.startedAt.toISOString();
}
