import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { expect, test, type Page } from "@playwright/test";

// 1×1 transparent PNG — the smallest valid image Playwright can upload.
// Avoids committing binary fixture files to the repo.
const PNG_1X1_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// Unique per test-file-load so parallel workers never collide.
const PROGRAM_TITLE = `E2E YSP Program ${Date.now()}`;
const PROGRAM_DESC = "Automated E2E test program — safe to delete.";

test.describe("P0: Admin Program Lifecycle + Visual Regression", () => {
  // ── Shared navigation helper ─────────────────────────────────────────────
  // Navigates to /admin/programs and waits for the Server Component
  // (which fetches from Appwrite) to finish rendering before returning.
  async function gotoAdminPrograms(page: Page) {
    await page.goto("/admin/programs", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { name: "Programs" })
    ).toBeVisible({ timeout: 30_000 });
  }

  // ── beforeEach: clean up any E2E programs from aborted previous runs ─────
  test.beforeEach(async ({ page }) => {
    // .reveal elements start at opacity:0; reduced-motion makes them immediately
    // visible via RevealObserver.tsx showAll() — no IntersectionObserver needed.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoAdminPrograms(page);

    const leftover = page
      .locator("details")
      .filter({ hasText: /E2E YSP Program/ });

    // Cap at 20 iterations — guards against an infinite loop if a delete
    // action silently fails and the card never disappears.
    for (let i = 0; i < 20 && (await leftover.count()) > 0; i++) {
      await leftover.first().locator("summary").click();
      await leftover
        .first()
        .locator('button:has-text("Delete program")')
        .click();
      await expect(
        page.getByRole("alert").getByText("Program deleted.")
      ).toBeVisible({ timeout: 15_000 });
      await gotoAdminPrograms(page);
    }
  });

  // ── afterEach: best-effort cleanup so programs don't accumulate ──────────
  test.afterEach(async ({ page }) => {
    try {
      await gotoAdminPrograms(page);

      const card = page
        .locator("details")
        .filter({ hasText: PROGRAM_TITLE });

      if ((await card.count()) > 0) {
        await card.locator("summary").click();
        await card.locator('button:has-text("Delete program")').click();
      }
    } catch {
      // Cleanup is best-effort — never mask the real test result.
    }
  });

  test(
    "Admin creates and publishes a program; validates public homepage visibility",
    async ({ page }) => {
      // ─────────────────────────────────────────────────────────────────────
      // STEP 1 — Confirm clean baseline: the E2E program does not yet exist
      //          on the public Homepage before we create it.
      // ─────────────────────────────────────────────────────────────────────
      await test.step("Baseline: E2E program is not yet visible on homepage", async () => {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");

        // The h1 contains a <br> so the accessible name has a newline — regex.
        await expect(
          page.getByRole("heading", {
            name: /Real youth\.\s+Real communities\.\s+Real change across the Philippines\./,
          })
        ).toBeVisible({ timeout: 20_000 });

        const programsSection = page.locator("[data-testid='programs-section']");
        await expect(programsSection).toBeVisible({ timeout: 20_000 });

        // The E2E program must NOT exist yet — confirms clean state.
        await expect(
          programsSection.getByRole("heading", { name: PROGRAM_TITLE })
        ).not.toBeVisible();
      });

      // ─────────────────────────────────────────────────────────────────────
      // STEP 2 — Navigate to Programs dashboard (E2E bypass provides admin)
      //
      // playwright.config.ts sets E2E_ADMIN_BYPASS=1 in the webServer env.
      // auth.ts:getSession() detects this flag and returns a synthetic admin
      // session — no real Appwrite credentials required.
      // ─────────────────────────────────────────────────────────────────────
      await test.step("Admin: navigate to Programs dashboard", async () => {
        await gotoAdminPrograms(page);
      });

      // ─────────────────────────────────────────────────────────────────────
      // STEP 3 — Create a new YSP Program with a mock image, set to Published
      // ─────────────────────────────────────────────────────────────────────
      await test.step("Admin: fill create-program modal and publish", async () => {
        const tmpImg = path.join(os.tmpdir(), "ysp-e2e-mock.png");
        fs.writeFileSync(tmpImg, Buffer.from(PNG_1X1_B64, "base64"));

        await page.getByRole("button", { name: "+ Add program" }).click();

        // Scope all interactions to the modal dialog — avoids matching
        // collapsed program-card fields that share the same input names.
        const modal = page.getByRole("dialog", { name: "New program" });
        await expect(modal).toBeVisible({ timeout: 10_000 });

        await modal.getByPlaceholder("Youth Action Labs").fill(PROGRAM_TITLE);
        await modal
          .getByPlaceholder(
            "Describe the program objectives, cadence, and outcomes."
          )
          .fill(PROGRAM_DESC);

        await modal.locator('select[name="published"]').selectOption("true");
        await modal.locator('input[name="imageFile"]').setInputFiles(tmpImg);
        await modal.getByRole("button", { name: "Create program" }).click();

        // Server Action + Appwrite write may take a few seconds.
        await expect(
          page.getByRole("alert").getByText("Program created.")
        ).toBeVisible({ timeout: 15_000 });
      });

      // ─────────────────────────────────────────────────────────────────────
      // STEP 4 — Return to the public Homepage; assert the new program is
      //          visibly rendered for standard (unauthenticated) visitors.
      //          revalidatePath("/") was called by the server action so the
      //          next request gets fresh data from Appwrite.
      // ─────────────────────────────────────────────────────────────────────
      await test.step("Public: new program is visible on the homepage", async () => {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");

        const programsSection = page.locator("[data-testid='programs-section']");
        await expect(programsSection).toBeVisible({ timeout: 20_000 });

        await expect(
          programsSection.getByRole("heading", { name: PROGRAM_TITLE })
        ).toBeVisible({ timeout: 20_000 });

        // Assert visual regression, masking the dynamic program title to prevent flaky failures
        await expect(page).toHaveScreenshot("01-homepage-baseline.png", {
          mask: [programsSection.getByRole("heading", { name: PROGRAM_TITLE })],
          fullPage: true,
        });
      });
    }
  );
});
