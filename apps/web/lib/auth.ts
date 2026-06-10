import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@dev-telemetry/db/client";
import * as schema from "@dev-telemetry/db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET!,

  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: false,
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  // githubId and githubLogin are populated during PAT setup (onboarding flow).
  // They are declared here so Better-Auth includes them in the User type and
  // allows server-side updates via auth.api.updateUser.
  user: {
    additionalFields: {
      githubId: {
        type: "number",
        required: false,
        input: false,
        fieldName: "githubId",
      },
      githubLogin: {
        type: "string",
        required: false,
        input: false,
        fieldName: "githubLogin",
      },
    },
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5-minute cache to reduce DB reads on every request
    },
  },
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
