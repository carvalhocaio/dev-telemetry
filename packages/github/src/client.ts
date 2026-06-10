import { Octokit } from "@octokit/rest";

/**
 * Creates an Octokit REST client authenticated with the user's PAT.
 * The PAT is decrypted by the caller immediately before use and never stored.
 */
export function createOctokit(pat: string): Octokit {
  return new Octokit({
    auth: pat,
    userAgent: "dev-telemetry/1.0",
  });
}

export type { Octokit };
