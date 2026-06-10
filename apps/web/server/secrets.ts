import "server-only";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@dev-telemetry/db/client";
import { userSecret, userUsage } from "@dev-telemetry/db/schema";
import { auth } from "@/lib/auth";
import { appCrypto } from "@/lib/app-crypto";

const LLM_PROVIDERS = ["gemini", "openai", "anthropic"] as const;

/**
 * Elysia plugin: secrets routes under /me.
 *
 * GET  /api/me/secrets/status  — returns flags only (hasPat, hasLlmKey, provider, model).
 *                                PAT and API key are NEVER returned by any endpoint.
 * PUT  /api/me/secrets         — saves/updates PAT and/or LLM config (encrypted at rest).
 */
export const secretsRoutes = new Elysia({ prefix: "/me" })
  .get("/secrets/status", async ({ request, status }) => {
    const s = await auth.api.getSession({ headers: request.headers });
    if (!s) return status(401);

    const [[row], [usage]] = await Promise.all([
      db.select().from(userSecret).where(eq(userSecret.userId, s.user.id)).limit(1),
      db.select().from(userUsage).where(eq(userUsage.userId, s.user.id)).limit(1),
    ]);

    return {
      hasPat: row?.githubPatEnc != null,
      hasLlmKey: row?.llmApiKeyEnc != null,
      llmProvider: row?.llmProvider ?? null,
      llmModel: row?.llmModel ?? null,
      bytesUsed: usage?.bytesUsed ?? 0,
    };
  })
  .put(
    "/secrets",
    async ({ request, body, status }) => {
      const s = await auth.api.getSession({ headers: request.headers });
      if (!s) return status(401);

      const updates: Partial<typeof userSecret.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (body.pat !== undefined) {
        updates.githubPatEnc = appCrypto.encrypt(body.pat);
      }
      if (body.llmProvider !== undefined) {
        updates.llmProvider = body.llmProvider;
      }
      if (body.llmApiKey !== undefined) {
        updates.llmApiKeyEnc = appCrypto.encrypt(body.llmApiKey);
      }
      if (body.llmModel !== undefined) {
        updates.llmModel = body.llmModel;
      }

      await db
        .insert(userSecret)
        .values({ userId: s.user.id, ...updates })
        .onConflictDoUpdate({
          target: userSecret.userId,
          set: updates,
        });

      return { ok: true };
    },
    {
      body: t.Object({
        // maxLength guards against oversized payload storage abuse.
        // GitHub PATs are ~40 chars; LLM API keys are ~100 chars — 500 is generous.
        pat: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
        llmProvider: t.Optional(
          t.Union(LLM_PROVIDERS.map((p) => t.Literal(p))),
        ),
        llmApiKey: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
        llmModel: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
      }),
    },
  );
