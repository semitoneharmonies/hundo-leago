import { test, expect } from "@playwright/test";

test("schedule view preserves roster navigation, scrolls game strips on mobile and only reads data", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/e2e/fixtures/roster-schedule.html", { waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => window.scheduleFixture.scheduleRequests.length)).toBe(0);
  const selector = page.getByRole("group", { name: "Roster view" });
  await expect(selector.getByRole("button")).toHaveText(["Table", "Cap outlook", "Schedule"]);
  await selector.getByRole("button", { name: "Schedule" }).click();
  const row = page.getByRole("article", { name: "Connor McDavid schedule" });
  await expect(row.getByLabel("4 games this week")).toBeVisible();
  await expect(row.getByText("vs VAN")).toBeVisible();
  await expect(selector.getByRole("button", { name: "Schedule" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  const games = row.getByRole("list", { name: "Connor McDavid games" });
  if (page.viewportSize().width < 600) {
    expect(await games.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    await games.focus();
    await games.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    await expect(row.getByText("@ CGY")).toBeInViewport();
    await games.evaluate((element) => { element.scrollLeft = 0; });
  }
  await page.getByRole("region", { name: "Roster schedule", exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.hundo.local/design-mockups/roster-schedule/implemented-${test.info().project.name}.png`, fullPage: true });
  if (test.info().project.name === "desktop-chromium") {
    await selector.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const top = document.querySelector('[aria-label="Roster view"]').getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - 20);
    });
    await page.screenshot({ path: ".hundo.local/design-mockups/roster-schedule/schedule-corrected-preview.png" });
  }
  await page.getByRole("button", { name: "Next matchup week" }).click();
  await expect(row.getByText("vs TOR")).toBeVisible();
  await expect(row.getByLabel("1 game this week")).toBeVisible();
  await selector.getByRole("button", { name: "Table", exact: true }).click();
  await expect(page.getByRole("region", { name: "Roster schedule", exact: true })).toHaveCount(0);
  await selector.getByRole("button", { name: "Cap outlook" }).click();
  await expect(page.getByRole("region", { name: "Cap outlook by season" })).toBeAttached();
  expect(await page.evaluate(() => window.scheduleFixture.requests.every((request) => !request.method))).toBe(true);
  expect(errors).toEqual([]);
});
