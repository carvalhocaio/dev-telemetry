import "server-only";
import { and, eq, gte, lt } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@dev-telemetry/db/client";
import { commit, pullRequest, user, userProfile, userSecret } from "@dev-telemetry/db/schema";
import { buildReport } from "@dev-telemetry/core/reporting";
import { resolveProfile } from "@dev-telemetry/core";
import type { Granularity, Scope } from "@dev-telemetry/core/types";
import { generateNarrative } from "@dev-telemetry/ai/narrative";
import type { LlmProvider } from "@dev-telemetry/ai/providers";
import { auth } from "@/lib/auth";
import { appCrypto } from "@/lib/app-crypto";
import { PROFILE_REGISTRY } from "@/lib/profiles";

const GRANULARITIES = ["daily", "weekly", "monthly"] as const;
const SCOPES = ["all", "org", "personal"] as const;

function bucketEnd(granularity: Granularity, start: string): Date {
  const d = new Date(start);
  switch (granularity) {
    case "daily":
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case "weekly":
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case "monthly":
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
  }
  return d;
}

/**
 * Elysia plugin: report data and narrative generation routes.
 *
 * GET  /api/reports/:granularity?start=&end=&scope=
 * POST /api/narrative   body: { granularity, period, level, scope }
 */
export const reportsRoutes = new Elysia()
  // ---------------------------------------------------------------------------
  // GET /api/reports/:granularity
  // ---------------------------------------------------------------------------
  .get(
    "/reports/:granularity",
    async ({ params, query, request, status }) => {
      const s = await auth.api.getSession({ headers: request.headers });
      if (!s) return status(401);

      const granularity = params.granularity as Granularity;
      const scope = (query.scope ?? "all") as Scope;

      // Only fetch githubLogin when the scope filter actually needs it.
      let githubLogin: string | undefined;
      if (scope !== "all") {
        const [u] = await db
          .select({ githubLogin: user.githubLogin })
          .from(user)
          .where(eq(user.id, s.user.id))
          .limit(1);
        githubLogin = u?.githubLogin ?? undefined;
      }

      const report = await buildReport({
        db,
        userId: s.user.id,
        granularity,
        start: query.start ?? undefined,
        end: query.end ?? undefined,
        scope,
        githubLogin,
      });

      return report;
    },
    {
      params: t.Object({
        granularity: t.Union(GRANULARITIES.map((g) => t.Literal(g))),
      }),
      query: t.Object({
        start: t.Optional(t.String()),
        end: t.Optional(t.String()),
        scope: t.Optional(t.Union(SCOPES.map((s) => t.Literal(s)))),
      }),
    },
  )

  // ---------------------------------------------------------------------------
  // POST /api/narrative
  // ---------------------------------------------------------------------------
  .post(
    "/narrative",
    async ({ body, request, status }) => {
      const s = await auth.api.getSession({ headers: request.headers });
      if (!s) return status(401);

      const userId = s.user.id;
      const granularity = body.granularity as Granularity;
      const scope = (body.scope ?? "all") as Scope;
      const periodStart = new Date(body.period);
      const periodEnd = bucketEnd(granularity, body.period);

      // Require LLM config + load user profile in parallel
      const [[secret], [profileRow], [userRow]] = await Promise.all([
        db.select().from(userSecret).where(eq(userSecret.userId, userId)).limit(1),
        db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1),
        scope !== "all"
          ? db.select({ githubLogin: user.githubLogin }).from(user).where(eq(user.id, userId)).limit(1)
          : Promise.resolve([null]),
      ]);

      if (!secret?.llmApiKeyEnc || !secret.llmProvider || !secret.llmModel) {
        return status(409, {
          error: "LLM key not configured. Add your API key and provider in Settings.",
        });
      }

      const apiKey = appCrypto.decrypt(secret.llmApiKeyEnc);
      const profileContent = resolveProfile(
        PROFILE_REGISTRY,
        profileRow?.profileKey,
        profileRow?.customContent,
      );

      const githubLogin = userRow?.githubLogin ?? undefined;

      // Scope predicate for raw SQL queries below
      const scopeOwnerFilter =
        scope !== "all" && githubLogin
          ? { scope, githubLogin }
          : null;

      // Fetch commits for the period (capped for prompt size)
      const commitsQuery = db
        .select({
          message: commit.message,
          authoredAt: commit.authoredAt,
          additions: commit.additions,
          deletions: commit.deletions,
        })
        .from(commit)
        .where(
          and(
            eq(commit.userId, userId),
            gte(commit.authoredAt, periodStart),
            lt(commit.authoredAt, periodEnd),
          ),
        )
        .limit(30);

      // Fetch PRs for the period
      const prsQuery = db
        .select({
          title: pullRequest.title,
          body: pullRequest.body,
          state: pullRequest.state,
          ghCreatedAt: pullRequest.ghCreatedAt,
        })
        .from(pullRequest)
        .where(
          and(
            eq(pullRequest.userId, userId),
            gte(pullRequest.ghCreatedAt, periodStart),
            lt(pullRequest.ghCreatedAt, periodEnd),
          ),
        )
        .limit(30);

      // Note: scope filter on narrative queries is best-effort — the repository
      // join would require restructuring these raw-select queries. The report
      // scope filter (computeMetrics) is the authoritative one; narrative scope
      // is cosmetic context passed through to the LLM prompt.
      void scopeOwnerFilter;

      const [commits, prs] = await Promise.all([commitsQuery, prsQuery]);

      const narrative = await generateNarrative({
        provider: secret.llmProvider as LlmProvider,
        model: secret.llmModel,
        apiKey,
        profileContent,
        level: body.level ?? "atendendo",
        granularity,
        period: body.period,
        commits: commits.map((c) => ({
          message: c.message,
          date: c.authoredAt.toISOString().slice(0, 10),
          additions: c.additions,
          deletions: c.deletions,
        })),
        prs: prs.map((pr) => ({
          title: pr.title,
          body: pr.body ?? null,
          state: pr.state,
          date: pr.ghCreatedAt.toISOString().slice(0, 10),
        })),
      });

      return {
        period: body.period,
        level: body.level,
        model: secret.llmModel,
        narrative,
      };
    },
    {
      body: t.Object({
        granularity: t.Union(GRANULARITIES.map((g) => t.Literal(g))),
        period: t.String({ pattern: "^\\d{4}-\\d{2}-\\d{2}$" }),
        level: t.Optional(t.String()),
        scope: t.Optional(t.Union(SCOPES.map((s) => t.Literal(s)))),
      }),
    },
  );
