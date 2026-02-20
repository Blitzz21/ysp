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

async function expectMemberPageOrLoginRedirect(page: Page, headingMatcher: RegExp | string) {
  const loginHeading = page.getByRole("heading", { name: "Welcome back" });
  const targetHeading = page.getByRole("heading", { name: headingMatcher });

  if ((await loginHeading.count()) > 0) {
    await expect(page).toHaveURL(/\/login/);
    return;
  }

  await expect(targetHeading).toBeVisible();
}

test("login page renders", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Remember me" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
});

test("signup page renders", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Join Youth Service Philippines" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});

test("login page shows generic OAuth error when redirected back with ?error=oauth", async ({ page }) => {
  await page.goto("/login?error=oauth");
  const authError = page.getByTestId("auth-error");
  await expect(authError).toBeVisible();
  await expect(authError).toHaveAttribute("role", "alert");
  await expect(authError).toContainText("OAuth login failed. Please try again.");
});

test("login page shows specific error for token_exchange reason", async ({ page }) => {
  await page.goto("/login?error=oauth&reason=token_exchange");
  const authError = page.getByTestId("auth-error");
  await expect(authError).toBeVisible();
  await expect(authError).toContainText("Google sign-in failed. Please try again.");
});

test("signup page shows generic OAuth error when redirected back with ?error=oauth", async ({ page }) => {
  await page.goto("/signup?error=oauth");
  const authError = page.getByTestId("auth-error");
  await expect(authError).toBeVisible();
  await expect(authError).toHaveAttribute("role", "alert");
  await expect(authError).toContainText("OAuth signup failed. Please try again.");
});

test("forgot password page renders and can submit request", async ({ page }) => {
  await page.route("**/api/auth/recovery/start", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await page.getByLabel("Email").fill("member@example.com");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByText("If your account exists, we sent a reset link to your email.")
  ).toBeVisible();
});

test("reset password page requires valid token params", async ({ page }) => {
  await page.goto("/reset-password");
  await expect(
    page.getByText("Invalid or expired reset link. Request a new one from Forgot password.")
  ).toBeVisible();
});

test("verify email page can resend verification", async ({ page }) => {
  await page.route("**/api/auth/verify/start", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto("/verify-email");
  await expect(page.getByRole("heading", { name: "Verify your account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resend verification email" })).toBeVisible();
  await page.getByRole("button", { name: "Resend verification email" }).click();
  await expect(page.getByText("Verification email sent. Check your inbox.")).toBeVisible();
});

test("verify email page auto-updates after external verification without refresh", async ({ page }) => {
  let statusChecks = 0;
  await page.route("**/api/auth/verify/status", async (route) => {
    statusChecks += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        emailVerified: statusChecks >= 2,
      }),
    });
  });

  await page.goto("/verify-email");
  await expect(page.getByText("Your email is already verified. You can continue to your dashboard.")).toBeVisible({
    timeout: 8000,
  });
  await expect(page.getByRole("link", { name: "Continue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resend verification email" })).toHaveCount(0);
});

test("verify email page stops status polling after unauthorized", async ({ page }) => {
  let statusChecks = 0;
  await page.route("**/api/auth/verify/status", async (route) => {
    statusChecks += 1;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        code: "unauthorized",
        error: "Authentication required",
      }),
    });
  });

  await page.goto("/verify-email");
  await page.waitForTimeout(3500);
  expect(statusChecks).toBe(1);
});

test("verify email page shows invalid-or-expired message for invalid link", async ({ page }) => {
  await page.route("**/api/auth/verify/complete", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        code: "not_found",
        error: "The requested resource was not found.",
      }),
    });
  });

  await page.goto("/verify-email?userId=missing-user&secret=invalid-secret");
  await expect(page.getByText("Verification link is invalid or expired.")).toBeVisible();
  await expect(page.getByText("Invalid email or password.")).not.toBeVisible();
});

test("verify email page treats already-verified link as success", async ({ page }) => {
  await page.route("**/api/auth/verify/complete", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        code: "conflict",
        error: "Email is already verified.",
      }),
    });
  });

  await page.goto("/verify-email?userId=verified-user&secret=consumed-secret");
  await expect(page.getByText("Your email is already verified. You can continue to your dashboard.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resend verification email" })).toHaveCount(0);
});

test("verify email page reflects already-verified session", async ({ page }) => {
  await page.route("**/api/auth/verify/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        emailVerified: true,
      }),
    });
  });

  await page.goto("/verify-email");
  await expect(page.getByText("Your email is already verified. You can continue to your dashboard.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Resend verification email" })).toHaveCount(0);
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

test("login redirects unverified users to verify email", async ({ page }) => {
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        emailVerified: false,
      }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("member@example.com");
  await page.getByPlaceholder("Enter your password").fill("valid-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/verify-email\?next=/);
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
  await page.getByLabel("First name").fill("Jane");
  await page.getByLabel("Last name").fill("Doe");
  await page.getByLabel("Email").fill("jane@example.com");
  await page.getByPlaceholder("Create a password").fill("valid-password-123");
  await page.getByPlaceholder("Confirm your password").fill("valid-password-123");
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

test("admin chapters route is usable", async ({ page }) => {
  await page.goto("/admin/chapters");
  await expectAdminPageOrLoginRedirect(page, "Chapters", "Create chapter");
});

test("admin settings route is usable", async ({ page }) => {
  await page.goto("/admin/settings");
  await expectAdminPageOrLoginRedirect(page, "Settings");
  if (!/\/login/.test(page.url())) {
    await expect(page.getByRole("button", { name: "Save contact settings" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save counters" })).toBeVisible();
  }
});

test("admin dashboard uses sidebar navigation", async ({ page }) => {
  await page.goto("/admin");
  const loginHeading = page.getByRole("heading", { name: "Welcome back" });
  if ((await loginHeading.count()) > 0) {
    await expect(page).toHaveURL(/\/login/);
    return;
  }

  await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Programs" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Chapters" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Opportunities" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
});

test("member dashboard route is usable", async ({ page }) => {
  await page.goto("/dashboard");
  await expectMemberPageOrLoginRedirect(page, /Welcome/);
});

test("member dashboard uses sidebar navigation", async ({ page }) => {
  await page.goto("/dashboard/member");
  const loginHeading = page.getByRole("heading", { name: "Welcome back" });
  if ((await loginHeading.count()) > 0) {
    await expect(page).toHaveURL(/\/login/);
    return;
  }

  await expect(page.getByRole("link", { name: "Member dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Opportunities" })).toBeVisible();
});

test("sidebar mobile drawer is keyboard accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard/member");
  const loginHeading = page.getByRole("heading", { name: "Welcome back" });
  if ((await loginHeading.count()) > 0) {
    await expect(page).toHaveURL(/\/login/);
    return;
  }

  const openButton = page.getByRole("button", { name: "Open sidebar" });
  await expect(openButton).toBeVisible();
  await openButton.focus();
  await page.keyboard.press("Enter");
  await expect(openButton).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "Close sidebar" }).click();
  await expect(openButton).toHaveAttribute("aria-expanded", "false");
});

test("sidebar active state matches current route", async ({ page }) => {
  await page.goto("/dashboard/member");
  const loginHeading = page.getByRole("heading", { name: "Welcome back" });
  if ((await loginHeading.count()) > 0) {
    await expect(page).toHaveURL(/\/login/);
    return;
  }

  await expect(page.getByRole("link", { name: "Member dashboard" })).toHaveClass(/bg-orange-50/);
  await page.goto("/admin/settings");
  await expect(page.getByRole("link", { name: "Settings" })).toHaveClass(/bg-orange-50/);
});

test("member settings route is usable", async ({ page }) => {
  await page.goto("/settings");
  await expectMemberPageOrLoginRedirect(page, "Account and profile");
});

test("chapter dashboard uses sidebar navigation", async ({ page }) => {
  await page.goto("/chapter");
  const loginHeading = page.getByRole("heading", { name: "Welcome back" });
  if ((await loginHeading.count()) > 0) {
    await expect(page).toHaveURL(/\/login/);
    return;
  }

  await expect(page.getByRole("link", { name: "Chapter dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Chapter opportunities" })).toBeVisible();
  await expect(page.getByText("Chapter assignment required")).toBeVisible();
});
