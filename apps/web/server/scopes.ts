import "server-only";
import { and, eq, ne, sql } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@dev-telemetry/db/client";
import { repository, user, userSecret } from "@dev-telemetry/db/schema";
import { auth } from "@/lib/auth";
import { appCrypto } from "@/lib/app-crypto";

async function fetchGitHubOrgs(pat: string): Promise<string[]> {
  const resp = await fetch("https://api.github.com/user/orgs?per_page=100", {
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "dev-telemetry/1.0",
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!resp.ok) return [];
  const data = (await resp.json()) as { login: string }[];
  return data.map((o) => o.login).filter(Boolean);
}

/**
 * Elysia plugin: sync scope routes under /me.
 *
 * GET /api/me/sync-scopes  — returns current scope config + available orgs from GitHub
 * PUT /api/me/sync-scopes  — saves scope selection to user_secret.syncScopes
 * GET /api/me/orgs         — returns distinct org logins from already-ingested repos
 */
export const scopesRoutes = new Elysia({ prefix: "/me" })
  .get("/sync-scopes", async ({ request, status }) => {
    const s = await auth.api.getSession({ headers: request.headers });
    if (!s) return status(401);

    const [row] = await db
      .select({ syncScopes: userSecret.syncScopes, githubPatEnc: userSecret.githubPatEnc })
      .from(userSecret)
      .where(eq(userSecret.userId, s.user.id))
      .limit(1);

    if (!row?.githubPatEnc) {
      return { selectedScopes: row?.syncScopes ?? null, availableOrgs: [] };
    }

    const pat = appCrypto.decrypt(row.githubPatEnc);

    // Try GitHub API first; fall back to orgs already ingested in the DB.
    let orgLogins: string[] = [];
    try {
      orgLogins = await fetchGitHubOrgs(pat);
    } catch { /* non-fatal */ }

    if (orgLogins.length === 0) {
      const [u] = await db
        .select({ githubLogin: user.githubLogin })
        .from(user)
        .where(eq(user.id, s.user.id))
        .limit(1);
      if (u?.githubLogin) {
        const rows = await db
          .selectDistinct({ owner: sql<string>`split_part(${repository.fullName}, '/', 1)` })
          .from(repository)
          .where(and(
            eq(repository.userId, s.user.id),
            ne(sql`split_part(${repository.fullName}, '/', 1)`, u.githubLogin),
          ));
        orgLogins = rows.map((r) => r.owner);
      }
    }

    return {
      selectedScopes: row.syncScopes ?? null,
      availableOrgs: orgLogins.map((login) => ({ login })),
    };
  })

  .put(
    "/sync-scopes",
    async ({ body, request, status }) => {
      const s = await auth.api.getSession({ headers: request.headers });
      if (!s) return status(401);

      await db
        .insert(userSecret)
        .values({ userId: s.user.id, syncScopes: body.scopes, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: userSecret.userId,
          set: { syncScopes: body.scopes, updatedAt: new Date() },
        });

      return { ok: true };
    },
    {
      body: t.Object({
        // Each token is "personal" or a GitHub org login (alphanumeric + hyphens).
        scopes: t.Array(t.String({ minLength: 1, maxLength: 100 })),
      }),
    },
  )

  .get("/orgs", async ({ request, status }) => {
    const s = await auth.api.getSession({ headers: request.headers });
    if (!s) return status(401);

    const [u] = await db
      .select({ githubLogin: user.githubLogin })
      .from(user)
      .where(eq(user.id, s.user.id))
      .limit(1);

    if (!u?.githubLogin) return { orgs: [] };

    const rows = await db
      .selectDistinct({ owner: sql<string>`split_part(${repository.fullName}, '/', 1)` })
      .from(repository)
      .where(
        and(
          eq(repository.userId, s.user.id),
          ne(sql`split_part(${repository.fullName}, '/', 1)`, u.githubLogin),
        ),
      );

    return { orgs: rows.map((r) => r.owner) };
  });
