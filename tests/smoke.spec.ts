import { test, expect } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Fueling youth-led service, one chapter at a time.",
    })
  ).toBeVisible();
});

test("programs list page renders", async ({ page }) => {
  await page.goto("/programs");
  await expect(
    page.getByRole("heading", { name: "Programs built to scale youth action." })
  ).toBeVisible();
});

test("chapters page renders", async ({ page }) => {
  await page.goto("/chapters");
  await expect(
    page.getByRole("heading", {
      name: "Chapters across the Philippines",
    })
  ).toBeVisible();
});

test("membership page renders with settings-driven content", async ({ page }) => {
  await page.goto("/membership");
  await expect(page.getByRole("heading", { name: "Join the YSP network" })).toBeVisible();

  const emptyState = page.getByText("Membership form is not configured yet.");
  const loadError = page.getByText(
    "Membership settings are temporarily unavailable. Please try again in a few minutes."
  );
  const embeddedForm = page.getByTitle("YSP membership form");
  const openFormLink = page.getByRole("link", { name: "Open membership form" });

  const variantCounts = await Promise.all([
    emptyState.count(),
    loadError.count(),
    embeddedForm.count(),
    openFormLink.count(),
  ]);

  expect(variantCounts.some((count) => count > 0)).toBeTruthy();
});

test("contact page renders", async ({ page }) => {
  await page.goto("/contact");
  await expect(page.getByRole("heading", { name: "Reach the YSP team" })).toBeVisible();
});
