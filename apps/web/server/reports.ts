import "server-only";
import { and, eq, gte, lt } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@dev-telemetry/db/client";
import { commit, pullRequest, userSecret } from "@dev-telemetry/db/schema";
import { buildReport } from "@dev-telemetry/core/reporting";
import type { Granularity } from "@dev-telemetry/core/types";
import { generateNarrative } from "@dev-telemetry/ai/narrative";
import type { LlmProvider } from "@dev-telemetry/ai/providers";
import { auth } from "@/lib/auth";
import { appCrypto } from "@/lib/app-crypto";
import { DEFAULT_PROFILE } from "@/lib/default-profile";

const GRANULARITIES = ["daily", "weekly", "monthly"] as const;

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
 * GET  /api/reports/:granularity?start=&end=
 * POST /api/narrative   body: { granularity, period, level }
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
      const report = await buildReport({
        db,
        userId: s.user.id,
        granularity,
        start: query.start ?? undefined,
        end: query.end ?? undefined,
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
      const periodStart = new Date(body.period);
      const periodEnd = bucketEnd(granularity, body.period);

      // Require LLM config
      const [secret] = await db
        .select()
        .from(userSecret)
        .where(eq(userSecret.userId, userId))
        .limit(1);

      if (!secret?.llmApiKeyEnc || !secret.llmProvider || !secret.llmModel) {
        return status(409, {
          error:
            "LLM key not configured. Add your API key and provider in Settings.",
        });
      }

      const apiKey = appCrypto.decrypt(secret.llmApiKeyEnc);

      // Fetch commits for the period (capped for prompt size)
      const commits = await db
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
        .limit(30); // matches generateNarrative internal cap

      // Fetch PRs for the period
      const prs = await db
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

      const narrative = await generateNarrative({
        provider: secret.llmProvider as LlmProvider,
        model: secret.llmModel,
        apiKey,
        profileContent: DEFAULT_PROFILE,
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
      }),
    },
  );
