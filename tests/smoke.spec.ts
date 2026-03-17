import { test, expect } from "@playwright/test";

test("home page renders", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Real youth. Real communities. Real change across the Philippines.",
    })
  ).toBeVisible();
});

test("opportunity stream respects reduced motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const streamSection = page.locator("[data-stream-section]");
  const firstStreamRow = page.locator("[data-stream-row]").first();

  await expect(streamSection).toHaveAttribute("data-motion-mode", "reduced");
  await expect(firstStreamRow).toBeVisible();

  const beforeScrollTransform = await firstStreamRow.evaluate(
    (element) => getComputedStyle(element).transform
  );

  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(120);

  const afterScrollTransform = await firstStreamRow.evaluate(
    (element) => getComputedStyle(element).transform
  );

  expect(afterScrollTransform).toBe(beforeScrollTransform);
});

test("mobile home nav opens and routes to programs", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const openMenuButton = page.getByRole("button", {
    name: "Open navigation menu",
  });
  await expect(openMenuButton).toBeVisible();
  await openMenuButton.click({ force: true });

  const mobileNav = page.locator("#mobile-primary-nav");
  await expect(
    mobileNav.getByRole("navigation", { name: "Primary mobile links" })
  ).toBeVisible();

  const programsLink = mobileNav.getByRole("link", { name: "Programs" });
  await expect(programsLink).toBeVisible();
  await programsLink.focus();
  await programsLink.press("Enter");
  await expect(page).toHaveURL(/\/programs$/);
  await expect(
    page.getByRole("heading", { name: "Programs built to scale youth action." })
  ).toBeVisible();
});

test("programs list page renders", async ({ page }) => {
  await page.goto("/programs");
  await expect(
    page.getByRole("heading", { name: "Programs built to scale youth action." })
  ).toBeVisible();
});

test("home opportunities CTA routes to public opportunities page", async ({ page }) => {
  await page.goto("/");
  const cta = page.getByRole("link", { name: "See all opportunities" });
  await expect(cta).toHaveAttribute("href", "/volunteer-opportunities");
});

test("home opportunities copy has no encoding artifacts", async ({ page }) => {
  await page.goto("/");
  const opportunitiesSection = page.locator("#opportunities");
  await expect(opportunitiesSection).toBeVisible();
  await expect(opportunitiesSection).not.toContainText("Â·");
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

test("home contact methods are actionable links", async ({ page }) => {
  await page.goto("/");
  const contactSection = page.locator("#contact");
  await expect(contactSection).toBeVisible();

  await expect(
    contactSection.getByRole("link", { name: "phyouthservice@gmail.com" })
  ).toHaveAttribute("href", "mailto:phyouthservice@gmail.com");
  await expect(
    contactSection.getByRole("link", { name: "/YOUTHSERVICEPHILIPPINES" })
  ).toHaveAttribute(
    "href",
    "https://www.facebook.com/YOUTHSERVICEPHILIPPINES"
  );
  await expect(
    contactSection.getByRole("link", { name: "0917 779 8413" })
  ).toHaveAttribute("href", "tel:+639177798413");
});

test("volunteer opportunities page renders", async ({ page }) => {
  await page.goto("/volunteer-opportunities");
  await expect(
    page.getByRole("heading", { name: "Volunteer opportunities you can join" })
  ).toBeVisible();

  const emptyState = page.getByText("No opportunities match your current filters.");
  const loadError = page.getByText(
    "Opportunities are temporarily unavailable. Please try again in a few minutes."
  );
  const cardCount = await page.locator("article").count();
  const variantCounts = await Promise.all([emptyState.count(), loadError.count()]);
  expect(cardCount > 0 || variantCounts.some((count) => count > 0)).toBeTruthy();
});

test("volunteer opportunities status filter syncs to URL", async ({ page }) => {
  await page.goto("/volunteer-opportunities");
  await page.selectOption('select[name=\"status\"]', "upcoming");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/status=upcoming/);
  await expect(
    page.getByRole("heading", { name: "Volunteer opportunities you can join" })
  ).toBeVisible();
});
