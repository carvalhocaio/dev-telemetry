import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { Auth } from "./auth";

export const authClient = createAuthClient({
  // Same-origin — no baseURL needed for absolute-URL requests,
  // but we provide it so Better-Auth can construct redirect URLs correctly.
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  plugins: [inferAdditionalFields<Auth>()],
});

export const { signIn, signOut, useSession } = authClient;
