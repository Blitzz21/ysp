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
