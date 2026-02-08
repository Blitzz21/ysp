import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "server-only": resolve(__dirname, "src/test/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
    environmentMatchGlobs: [["src/**/*.test.tsx", "happy-dom"]],
    clearMocks: true,
    restoreMocks: true,
  },
});
