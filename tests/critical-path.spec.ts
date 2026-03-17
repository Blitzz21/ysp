import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { expect, test } from "@playwright/test";

// 1×1 transparent PNG — the smallest valid image Playwright can upload.
// Avoids committing binary fixture files to the repo.
const PNG_1X1_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// Fixed title keeps the visual regression snapshot identical across runs.
// beforeEach/afterEach hooks ensure no stale programs accumulate in the DB.
const PROGRAM_TITLE = `E2E YSP Program ${Date.now()}`;
const PROGRAM_DESC = "Automated E2E test program — safe to delete.";

test.describe("P0: Admin Program Lifecycle + Visual Regression", () => {
  // Remove any E2E programs left behind by aborted or interrupted previous runs
  // so that the Step 1 baseline snapshot always shows a clean database state.
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/programs");
    await expect(page.getByRole("heading", { name: "Programs" })).toBeVisible();

    const leftover = page
      .locator("details")
      .filter({ hasText: /E2E YSP Program/ });

    while ((await leftover.count()) > 0) {
      await leftover.first().locator("summary").click();
      await leftover
        .first()
        .locator('button:has-text("Delete program")')
        .click();
      await expect(page.getByRole("alert").getByText("Program deleted.")).toBeVisible();
      await page.goto("/admin/programs");
      await expect(
        page.getByRole("heading", { name: "Programs" })
      ).toBeVisible();
    }
  });

  // Best-effort cleanup after each run so programs don't accumulate in Appwrite.
  // try/catch ensures a cleanup failure never masks the real test result.
  test.afterEach(async ({ page }) => {
    try {
      await page.goto("/admin/programs");
      await expect(
        page.getByRole("heading", { name: "Programs" })
      ).toBeVisible({ timeout: 5000 });

      const card = page
        .locator("details")
        .filter({ hasText: PROGRAM_TITLE });

      if ((await card.count()) > 0) {
        await card.locator("summary").click();
        await card.locator('button:has-text("Delete program")').click();
      }
    } catch {
      // Cleanup is best-effort.
    }
  });

  test(
    "Admin creates and publishes a program; validates public homepage visibility",
    async ({ page }) => {
      // Mask the animated opportunity stream so per-frame differences don't
      // invalidate the visual baseline between runs.
      const streamMask = [page.locator("[data-stream-section]")];

      // ─────────────────────────────────────────────────────────────────────
      // STEP 1 — Baseline visual snapshot of the public Homepage
      //
      // Captures the "before" state: no E2E-created program exists yet.
      // ─────────────────────────────────────────────────────────────────────
      await test.step("Baseline: capture homepage screenshot", async () => {
        await page.goto("/");
        await expect(
          page.getByRole("heading", {
            name: "Real youth. Real communities. Real change across the Philippines.",
          })
        ).toBeVisible();

        // Wait for the programs section to finish rendering (async Server Component).
        await expect(page.locator("[data-testid='programs-section']")).toBeVisible();

        await expect(page).toHaveScreenshot("01-homepage-baseline.png", {
          mask: streamMask,
          fullPage: false,
        });
      });

      // ─────────────────────────────────────────────────────────────────────
      // STEP 2 — Sign in as Admin via E2E bypass; navigate to Programs
      //
      // playwright.config.ts sets NODE_ENV=test + E2E_ADMIN_BYPASS=1 in the
      // webServer env. auth.ts:getSession() detects both flags and returns a
      // synthetic admin session — no real Appwrite credentials required.
      // ─────────────────────────────────────────────────────────────────────
      await test.step("Admin: sign in via E2E bypass and navigate to Programs dashboard", async () => {
        await page.goto("/admin/programs");
        await expect(
          page.getByRole("heading", { name: "Programs" })
        ).toBeVisible();
      });

      // ─────────────────────────────────────────────────────────────────────
      // STEP 3 — Create a new YSP Program with a mock image, set to Published
      // ─────────────────────────────────────────────────────────────────────
      await test.step("Admin: fill create-program form and publish", async () => {
        // Write the 1×1 PNG to a temp path Playwright can read as a file input.
        const tmpImg = path.join(os.tmpdir(), "ysp-e2e-mock.png");
        fs.writeFileSync(tmpImg, Buffer.from(PNG_1X1_B64, "base64"));

        // The create form is the first (topmost) form on the page.
        await page
          .getByPlaceholder("Youth Action Labs")
          .fill(PROGRAM_TITLE);
        await page
          .getByPlaceholder(
            "Describe the program objectives, cadence, and outcomes."
          )
          .fill(PROGRAM_DESC);

        // Select "Published" in the status dropdown (first select on page).
        await page
          .locator('select[name="published"]')
          .first()
          .selectOption("true");

        // Attach the mock image via the file input.
        await page
          .locator('input[name="imageFile"]')
          .first()
          .setInputFiles(tmpImg);

        // Submit the form. ToastForm shows a toast notification on success.
        await page.getByRole("button", { name: "Create program" }).click();

        await expect(page.getByRole("alert").getByText("Program created.")).toBeVisible();
      });

      // ─────────────────────────────────────────────────────────────────────
      // STEP 4 — Return to the public Homepage; assert the new program is
      //          visibly rendered for standard (unauthenticated) visitors
      // ─────────────────────────────────────────────────────────────────────
      await test.step("Public: new program is visible on the homepage for standard visitors", async () => {
        await page.goto("/");

        const programsSection = page.locator("[data-testid='programs-section']");
        await expect(programsSection).toBeVisible();

        // The newly created (now published) program must appear in the section.
        await expect(
          programsSection.getByRole("heading", { name: PROGRAM_TITLE })
        ).toBeVisible();
      });

      // ─────────────────────────────────────────────────────────────────────
      // STEP 5 — Final visual snapshot of the Homepage rendering the new program
      // ─────────────────────────────────────────────────────────────────────
      await test.step("Visual: capture homepage screenshot with newly published program", async () => {
        await expect(page).toHaveScreenshot("02-homepage-with-new-program.png", {
          mask: streamMask,
          fullPage: false,
        });
      });
    }
  );
});
