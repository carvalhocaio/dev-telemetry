import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
