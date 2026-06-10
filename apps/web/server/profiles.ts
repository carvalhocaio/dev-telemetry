import "server-only";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "@dev-telemetry/db/client";
import { userProfile } from "@dev-telemetry/db/schema";
import { auth } from "@/lib/auth";
import {
  BUILT_IN_KEYS,
  PROFILE_METADATA,
  PROFILE_REGISTRY,
} from "@/lib/profiles";

const DEFAULT_KEY = "data_engineer_pleno";

function labelFor(key: string): { label: string; group: string } {
  const meta = PROFILE_METADATA.find((p) => p.key === key);
  return meta
    ? { label: meta.label, group: meta.group }
    : { label: key, group: "" };
}

/**
 * Elysia plugin: user profile routes under /me.
 *
 * GET /api/me/profile  — current profile key + label + content preview (200 chars)
 *                        For custom profiles, also returns full customContent (owner's own data).
 * PUT /api/me/profile  — save built-in profileKey or custom content (≤32 KB)
 */
export const profilesRoutes = new Elysia({ prefix: "/me" })
  .get("/profile", async ({ request, status }) => {
    const s = await auth.api.getSession({ headers: request.headers });
    if (!s) return status(401);

    const [row] = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, s.user.id))
      .limit(1);

    const key = row?.profileKey ?? DEFAULT_KEY;
    const content =
      key === "custom" && row?.customContent
        ? row.customContent
        : (PROFILE_REGISTRY[key] ?? PROFILE_REGISTRY[DEFAULT_KEY] ?? "");

    return {
      profileKey: key,
      ...labelFor(key),
      contentPreview: content.slice(0, 200),
      // Full custom content returned to the owner so the textarea can be pre-filled correctly.
      customContent: key === "custom" ? (row?.customContent ?? null) : null,
    };
  })

  .put(
    "/profile",
    async ({ body, request, status }) => {
      const s = await auth.api.getSession({ headers: request.headers });
      if (!s) return status(401);

      const { profileKey, customContent } = body;

      // Validate: profileKey must be a known built-in or "custom"
      if (profileKey && profileKey !== "custom" && !BUILT_IN_KEYS.includes(profileKey as never)) {
        return status(422, { error: "profileKey inválido." });
      }

      // "custom" requires content
      if (profileKey === "custom" && !customContent?.trim()) {
        return status(422, {
          error: 'customContent é obrigatório quando profileKey é "custom".',
        });
      }

      const updates = {
        profileKey: profileKey ?? DEFAULT_KEY,
        customContent: profileKey === "custom" ? (customContent ?? null) : null,
        updatedAt: new Date(),
      };

      await db
        .insert(userProfile)
        .values({ userId: s.user.id, ...updates })
        .onConflictDoUpdate({
          target: userProfile.userId,
          set: updates,
        });

      return { ok: true };
    },
    {
      body: t.Object({
        profileKey: t.Optional(t.String()),
        customContent: t.Optional(t.String({ maxLength: 32768 })),
      }),
    },
  );
