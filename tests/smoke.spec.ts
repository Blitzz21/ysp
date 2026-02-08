import { test, expect } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Fueling youth-led service, one chapter at a time.",
    })
  ).toBeVisible();
});
