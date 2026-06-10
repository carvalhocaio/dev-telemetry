import "server-only";
import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@dev-telemetry/db/client";
import { syncJob, user, userSecret } from "@dev-telemetry/db/schema";
import {
  createOctokit,
  runBackfillBatch,
  startSyncJob,
} from "@dev-telemetry/github";
import { auth } from "@/lib/auth";
import { appCrypto } from "@/lib/app-crypto";

/** Fetches the authenticated user's login from GitHub using the given PAT. */
async function fetchGitHubUser(
  pat: string,
): Promise<{ id: number; login: string }> {
  const resp = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${pat}`,
      "User-Agent": "dev-telemetry/1.0",
    },
  });
  if (!resp.ok) {
    throw new Error(`GitHub returned ${resp.status} — check your PAT.`);
  }
  const data = (await resp.json()) as { id: number; login: string };
  return { id: data.id, login: data.login };
}

/**
 * Elysia plugin: sync job routes.
 *
 * POST /api/sync/start          body: { mode }  → create job + run first batch
 * GET  /api/sync/current                        → latest sync job for user
 * POST /api/sync/batch/:jobId                   → run one batch (client-driven)
 */
export const syncRoutes = new Elysia({ prefix: "/sync" })
  // ---------------------------------------------------------------------------
  // POST /api/sync/start
  // ---------------------------------------------------------------------------
  .post(
    "/start",
    async ({ body, request, status }) => {
      const s = await auth.api.getSession({ headers: request.headers });
      if (!s) return status(401);

      const userId = s.user.id;

      // Require PAT
      const [secret] = await db
        .select()
        .from(userSecret)
        .where(eq(userSecret.userId, userId))
        .limit(1);

      if (!secret?.githubPatEnc) {
        return status(409, {
          error:
            "GitHub PAT not configured. Add your token in Settings first.",
        });
      }

      const pat = appCrypto.decrypt(secret.githubPatEnc);

      // Validate PAT + get GitHub login
      const ghUser = await fetchGitHubUser(pat);

      // Persist githubId/githubLogin on the user record if not set
      const [currentUser] = await db
        .select({ githubLogin: user.githubLogin })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!currentUser?.githubLogin) {
        await db
          .update(user)
          .set({ githubId: ghUser.id, githubLogin: ghUser.login })
          .where(eq(user.id, userId));
      }

      const jobId = await startSyncJob(db, userId, body.mode);
      const octokit = createOctokit(pat);

      // Run the first batch synchronously so the client gets immediate progress.
      const { done } = await runBackfillBatch(
        db,
        octokit,
        jobId,
        ghUser.login,
      );

      return { jobId, done };
    },
    {
      body: t.Object({
        mode: t.Union([t.Literal("full"), t.Literal("incremental")]),
      }),
    },
  )

  // ---------------------------------------------------------------------------
  // GET /api/sync/current
  // ---------------------------------------------------------------------------
  .get("/current", async ({ request, status }) => {
    const s = await auth.api.getSession({ headers: request.headers });
    if (!s) return status(401);

    const [job] = await db
      .select()
      .from(syncJob)
      .where(eq(syncJob.userId, s.user.id))
      .orderBy(desc(syncJob.startedAt))
      .limit(1);

    if (!job) return null;

    // Never expose the cursor (internal state) to the client.
    const { cursor: _cursor, ...safe } = job;
    return safe;
  })

  // ---------------------------------------------------------------------------
  // POST /api/sync/batch/:jobId  (client-driven chaining)
  // ---------------------------------------------------------------------------
  .post(
    "/batch/:jobId",
    async ({ params, request, status }) => {
      const s = await auth.api.getSession({ headers: request.headers });
      if (!s) return status(401);

      const [job] = await db
        .select({ userId: syncJob.userId })
        .from(syncJob)
        .where(eq(syncJob.id, params.jobId))
        .limit(1);

      // Ensure the job belongs to the requesting user (strict isolation)
      if (!job || job.userId !== s.user.id) return status(404);

      const [secret] = await db
        .select({ githubPatEnc: userSecret.githubPatEnc })
        .from(userSecret)
        .where(eq(userSecret.userId, s.user.id))
        .limit(1);

      if (!secret?.githubPatEnc) return status(409, { error: "PAT not set" });

      const pat = appCrypto.decrypt(secret.githubPatEnc);

      const [u] = await db
        .select({ githubLogin: user.githubLogin })
        .from(user)
        .where(eq(user.id, s.user.id))
        .limit(1);

      if (!u?.githubLogin) return status(409, { error: "GitHub login not set" });

      const octokit = createOctokit(pat);
      const { done } = await runBackfillBatch(
        db,
        octokit,
        params.jobId,
        u.githubLogin,
      );

      return { done };
    },
    {
      params: t.Object({ jobId: t.String() }),
    },
  );
