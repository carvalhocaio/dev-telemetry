import { treaty } from "@elysiajs/eden";
import type { App } from "@/server/app";

// Same-origin Treaty client — "/" means calls go to the current Next.js origin,
// so no CORS configuration is needed.
export const api = treaty<App>("/");
