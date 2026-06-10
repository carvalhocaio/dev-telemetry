import { app } from "@/server/app";

// Mount the Elysia app as a Next.js route handler.
// More-specific routes (e.g. app/api/auth/[...all]) take precedence in
// Next.js App Router, so Better-Auth paths are handled before this catch-all.
export const GET = app.fetch;
export const POST = app.fetch;
export const PUT = app.fetch;
export const PATCH = app.fetch;
export const DELETE = app.fetch;
