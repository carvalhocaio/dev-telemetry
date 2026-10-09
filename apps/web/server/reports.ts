import "server-only";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@dev-telemetry/db/client";
import { user, userSecret } from "@dev-telemetry/db/schema";
import { getDailyActivity } from "@dev-telemetry/core";
import { generateExecutiveReport, type LlmProvider } from "@dev-telemetry/ai";
import { auth } from "@/lib/auth";
import { appCrypto } from "@/lib/app-crypto";

/**
 * Elysia plugin: daily activity and executive report generation routes.
 *
 * GET  /api/activity/daily?start=&end=&scope=
 * POST /api/reports/generate   body: { startDate, endDate, scope }
 */
export const reportsRoutes = new Elysia()
  // ---------------------------------------------------------------------------
  // GET /activity/daily
  // ---------------------------------------------------------------------------
  .get(
    "/activity/daily",
    async ({ query, request, status }) => {
      const s = await auth.api.getSession({ headers: request.headers });
      if (!s) return status(401);

      const scope = query.scope ?? "all";

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

      try {
        const report = await getDailyActivity({
          db,
          userId: s.user.id,
          start: query.start,
          end: query.end,
          scope,
          githubLogin,
        });
        return report;
      } catch (err) {
        console.error("[reports] getDailyActivity error:", err);
        return status(500, { error: err instanceof Error ? err.message : String(err) });
      }
    },
    {
      query: t.Object({
        start: t.Optional(t.String()),
        end: t.Optional(t.String()),
        scope: t.Optional(t.String()),
      }),
    },
  )

  // ---------------------------------------------------------------------------
  // POST /reports/generate
  // ---------------------------------------------------------------------------
  .post(
    "/reports/generate",
    async ({ body, request, status }) => {
      const s = await auth.api.getSession({ headers: request.headers });
      if (!s) return status(401);

      const [secret] = await db
        .select()
        .from(userSecret)
        .where(eq(userSecret.userId, s.user.id))
        .limit(1);

      if (!secret?.llmApiKeyEnc || !secret.llmProvider || !secret.llmModel) {
        return status(400, {
          error: "LLM não configurado. Acesse as configurações para adicionar sua chave de API.",
        });
      }

      let apiKey: string;
      try {
        apiKey = appCrypto.decrypt(secret.llmApiKeyEnc);
      } catch (err) {
        console.error("[reports] Failed to decrypt llmApiKeyEnc:", err);
        return status(400, {
          error:
            "Não foi possível descriptografar a chave de API de LLM (a chave de criptografia do servidor foi alterada). Acesse Configurações para salvar sua chave novamente.",
        });
      }

      const scope = body.scope ?? "all";
      let githubLogin: string | undefined;
      if (scope !== "all") {
        const [u] = await db
          .select({ githubLogin: user.githubLogin })
          .from(user)
          .where(eq(user.id, s.user.id))
          .limit(1);
        githubLogin = u?.githubLogin ?? undefined;
      }

      try {
        const activity = await getDailyActivity({
          db,
          userId: s.user.id,
          start: body.startDate,
          end: body.endDate,
          scope,
          githubLogin,
        });

        const commits = activity.days.flatMap((day) =>
          day.commits.map((c) => ({
            message: c.message,
            repo: c.repoName,
            additions: c.additions,
            deletions: c.deletions,
            date: c.authoredAt,
          })),
        );

        const prs = activity.days.flatMap((day) =>
          day.prs.map((p) => ({
            title: p.title,
            repo: p.repoName,
            state: p.state,
            date: p.ghCreatedAt,
          })),
        );

        const report = await generateExecutiveReport({
          provider: secret.llmProvider as LlmProvider,
          model: secret.llmModel,
          apiKey,
          startDate: body.startDate,
          endDate: body.endDate,
          commits,
          prs,
        });

        return report;
      } catch (err) {
        console.error("[reports] generateExecutiveReport error:", err);
        return status(500, { error: err instanceof Error ? err.message : String(err) });
      }
    },
    {
      body: t.Object({
        startDate: t.String(),
        endDate: t.String(),
        scope: t.Optional(t.String()),
      }),
    },
  );
