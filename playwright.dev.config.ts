import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for running login-redirect tests against the dev server.
 *
 * Usage:
 *   npx playwright test tests/login-redirect.spec.ts --config=playwright.dev.config.ts
 */
export default defineConfig({
    testDir: "tests",
    timeout: 30_000,
    use: {
        baseURL: "http://localhost:3000",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
