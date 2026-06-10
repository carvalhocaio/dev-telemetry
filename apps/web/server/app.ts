import "server-only";
import { Elysia } from "elysia";
import { auth } from "@/lib/auth";
import { reportsRoutes } from "./reports";
import { secretsRoutes } from "./secrets";
import { syncRoutes } from "./sync";

export const app = new Elysia({ prefix: "/api" })
  .get("/me", async ({ request, status }) => {
    const s = await auth.api.getSession({ headers: request.headers });
    if (!s) return status(401);
    return {
      id: s.user.id,
      name: s.user.name,
      email: s.user.email,
      image: s.user.image ?? null,
    };
  })
  .use(secretsRoutes)
  .use(reportsRoutes)
  .use(syncRoutes);

export type App = typeof app;
