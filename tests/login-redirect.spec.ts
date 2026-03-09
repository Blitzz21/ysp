import { test, expect } from "@playwright/test";

/**
 * Login redirect E2E tests.
 *
 * These tests verify that logging in with different account roles
 * redirects to the correct dashboard pages.
 *
 * Run against the dev server:
 *   npx playwright test tests/login-redirect.spec.ts --project chromium
 *
 * Credentials are real test accounts in the Appwrite backend.
 */

// NOSONAR: Test fixture credentials — not real user passwords.
const ACCOUNTS = {
    admin: {
        email: "admin@ysp.com.ph",
        password: "admintest123", // NOSONAR
        expectedUrl: /\/admin/,
        expectedTitle: "YSP Admin",
    },
    chapterHead: {
        email: "chapterheadtest@ysp.com.ph",
        password: "chapterheadtest123", // NOSONAR
        expectedUrl: /\/dashboard\/chapter-head/,
        expectedTitle: "Chapter Head",
    },
    member: {
        email: "testuser1@youthservice.ph",
        password: "testuser123", // NOSONAR
        // Member with incomplete profile redirects to onboarding;
        // with a complete profile it would go to /dashboard/member
        expectedUrl: /\/(dashboard\/member|onboarding)/,
        expectedTitle: /Member|Complete your profile/,
    },
} as const;

async function loginAs(
    page: import("@playwright/test").Page,
    email: string,
    password: string
) {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    await page.getByPlaceholder("you@domain.com").fill(email);
    await page.getByPlaceholder("Enter your password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for navigation to complete — the login API call + redirect
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
}

async function logout(page: import("@playwright/test").Page) {
    // If we can see a Log out button, click it
    const logoutButton = page.getByRole("button", { name: "Log out" });
    if ((await logoutButton.count()) > 0) {
        await logoutButton.click();
        await page.waitForURL(/\/login/, { timeout: 10000 });
    } else {
        // Navigate to login directly (session may have been cleared already)
        await page.goto("/login");
    }
}

test.describe("login redirects by role", () => {
    test("admin login redirects to admin dashboard", async ({ page }) => {
        const account = ACCOUNTS.admin;
        await loginAs(page, account.email, account.password);

        // Verify we're on the admin dashboard
        await expect(page).toHaveURL(account.expectedUrl);

        // Verify the sidebar shows "YSP Admin"
        const sidebar = page.locator("#dashboard-sidebar");
        await expect(sidebar.getByText(account.expectedTitle)).toBeVisible();

        // Verify admin-specific nav items are present in the sidebar
        await expect(sidebar.getByRole("link", { name: "Programs", exact: true })).toBeVisible();
        await expect(sidebar.getByRole("link", { name: "Chapters", exact: true })).toBeVisible();
        await expect(sidebar.getByRole("link", { name: "Settings", exact: true })).toBeVisible();

        await logout(page);
    });

    test("chapter head login redirects to chapter head dashboard", async ({ page }) => {
        const account = ACCOUNTS.chapterHead;
        await loginAs(page, account.email, account.password);

        // Verify we're on the chapter head dashboard
        await expect(page).toHaveURL(account.expectedUrl);

        await logout(page);
    });

    test("member login redirects to member dashboard or onboarding", async ({ page }) => {
        const account = ACCOUNTS.member;
        await loginAs(page, account.email, account.password);

        // Verify we're on the member dashboard or onboarding page
        await expect(page).toHaveURL(account.expectedUrl);

        await logout(page);
    });

    test("sidebar logo stays in current dashboard (does not navigate to landing page)", async ({ page }) => {
        const account = ACCOUNTS.admin;
        await loginAs(page, account.email, account.password);

        // Click the sidebar logo
        const sidebar = page.locator("#dashboard-sidebar");
        await sidebar.getByRole("link", { name: "Youth Service Philippines logo" }).click();

        // Wait a moment for navigation
        await page.waitForTimeout(1000);

        // Should still be on the admin dashboard, NOT the public homepage
        await expect(page).toHaveURL(/\/admin/);
        await expect(page).not.toHaveURL(/^http:\/\/[^/]+\/$/);

        await logout(page);
    });
});
