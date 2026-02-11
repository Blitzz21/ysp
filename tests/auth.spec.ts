import { test, expect, type Page } from "@playwright/test";

async function expectAdminPageOrLoginRedirect(
  page: Page,
  headingName: string,
  ctaName?: string
) {
  const loginHeading = page.getByRole("heading", { name: "Welcome back" });
  const targetHeading = page.getByRole("heading", { name: headingName });

  if ((await loginHeading.count()) > 0) {
    await expect(page).toHaveURL(/\/login/);
    return;
  }

  await expect(targetHeading).toBeVisible();
  if (ctaName) {
    await expect(page.getByRole("button", { name: ctaName })).toBeVisible();
  }
}

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});

test("signup page renders", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Request admin access" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
});

test("admin overview route is usable", async ({ page }) => {
  await page.goto("/admin");
  await expectAdminPageOrLoginRedirect(page, "Overview");
});

test("admin opportunities route is usable", async ({ page }) => {
  await page.goto("/admin/opportunities");
  await expectAdminPageOrLoginRedirect(page, "Opportunities", "Create opportunity");
});

test("admin settings route is usable", async ({ page }) => {
  await page.goto("/admin/settings");
  await expectAdminPageOrLoginRedirect(page, "Settings");
  if (!/\/login/.test(page.url())) {
    await expect(page.getByRole("button", { name: "Save contact settings" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save counters" })).toBeVisible();
  }
});
