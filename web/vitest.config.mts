import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
  },
  resolve: {
    alias: {
      // Make the `server-only` import a no-op in tests.
      "server-only": resolve(__dirname, "test/stubs/server-only.ts"),
      "@": __dirname,
    },
  },
});
