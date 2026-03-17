import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  // Auto-create snapshot baselines when they don't exist yet (e.g. after a UI
  // redesign deletes stale PNGs). Existing baselines are still compared normally.
  updateSnapshots: "missing",
  retries: process.env.CI ? 1 : 0,
  expect: {
    toHaveScreenshot: {
      // Tolerate cross-OS font rendering differences (Windows ↔ Linux).
      // ~3 % of pixels typically differ due to sub-pixel anti-aliasing.
      maxDiffPixelRatio: 0.04,
      // Per-pixel colour difference tolerance (0–1 scale).
      threshold: 0.2,
      // Freeze CSS animations for deterministic snapshots.
      animations: "disabled",
    },
  },
  // Keep snapshots co-located with their spec file.
  snapshotPathTemplate: "{testDir}/__snapshots__/{testFilePath}/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run build && npm run start -- --hostname 127.0.0.1 --port 3001",
    url: "http://127.0.0.1:3001",
    env: {
      ...process.env,
      E2E_ADMIN_BYPASS: "1",
      // Forward NEXT_PUBLIC_* vars as their server-side equivalents so
      // appwriteClient.ts can read them at runtime in the production bundle.
      ...(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT && !process.env.APPWRITE_ENDPOINT
        ? { APPWRITE_ENDPOINT: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT }
        : {}),
      ...(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID && !process.env.APPWRITE_PROJECT_ID
        ? { APPWRITE_PROJECT_ID: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID }
        : {}),
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
