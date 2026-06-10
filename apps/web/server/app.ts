import "server-only";
import { Elysia } from "elysia";
import { auth } from "@/lib/auth";
import { secretsRoutes } from "./secrets";

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
  .use(secretsRoutes);

export type App = typeof app;
