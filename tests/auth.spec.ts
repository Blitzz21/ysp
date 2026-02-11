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

test("login announces auth errors through live region", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        code: "unauthorized",
        error: "Authentication required",
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("invalid@example.com");
  await page.getByPlaceholder("Enter your password").fill("invalid-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  const authError = page.getByTestId("auth-error");
  await expect(authError).toBeVisible();
  await expect(authError).toHaveAttribute("role", "alert");
  await expect(authError).toContainText("Invalid email or password.");
});

test("signup announces auth errors through live region", async ({ page }) => {
  await page.route("**/api/auth/signup", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        code: "conflict",
        error: "A user with the same email already exists",
      }),
    });
  });

  await page.goto("/signup");
  await page.getByLabel("Full name").fill("Jane Doe");
  await page.getByLabel("Email").fill("jane@example.com");
  await page.getByPlaceholder("Create a password").fill("valid-password-123");
  await page.getByRole("button", { name: "Create account" }).click();

  const authError = page.getByTestId("auth-error");
  await expect(authError).toBeVisible();
  await expect(authError).toHaveAttribute("role", "alert");
  await expect(authError).toContainText("This account already exists. Try signing in instead.");
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
