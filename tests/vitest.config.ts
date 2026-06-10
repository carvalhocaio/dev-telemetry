import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "/home/carvalhocaio/www/dev-telemetry/tests",
    include: [
      "smoke/**/*.test.ts",
      "integration/**/*.test.ts",
      "functional/**/*.test.ts",
      "system/**/*.test.ts",
      "regression/**/*.test.ts",
      "security/**/*.test.ts",
    ],
    benchmark: {
      include: ["performance/**/*.bench.ts"],
    },
  },
});
