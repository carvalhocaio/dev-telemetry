import type { NextConfig } from "next";
import path from "path";

// Turbopack needs to know where node_modules lives. In a Bun monorepo,
// packages are hoisted to the repo root, not apps/web — so we point Turbopack
// there explicitly to resolve next/package.json correctly.
const repoRoot = path.resolve(__dirname, "../..");

const nextConfig: NextConfig = {
  turbopack: {
    root: repoRoot,
  },
  transpilePackages: [
    "@dev-telemetry/ai",
    "@dev-telemetry/core",
    "@dev-telemetry/crypto",
    "@dev-telemetry/db",
    "@dev-telemetry/github",
  ],
  serverExternalPackages: ["elysia", "@elysiajs/eden"],
};

export default nextConfig;
