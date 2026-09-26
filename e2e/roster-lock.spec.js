import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("Teams shows the opening lock above the roster on desktop and mobile", async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date("2026-09-28T20:00:00Z") });
  await page.goto("/e2e/fixtures/roster-lock.html");
  const notice = page.getByRole("region", { name: "Roster lock", exact: true });
  await expect(notice).toContainText("Tuesday, September 29, 2026 at 4:00 PM Pacific Daylight Time");
  await expect(page.getByText(/locks on the first day of each matchup week/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/baseline/i);
  const bounds = await notice.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
  expect(bounds.y).toBeLessThan((await page.getByRole("heading", { name: "Salary cap", exact: true }).boundingBox()).y);
  expect((await new AxeBuilder({ page }).include('[aria-label="Roster lock"]').analyze()).violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("next-roster-lock.png"), fullPage: false });
  expect(await page.evaluate(() => window.rosterLockRequests.every(({ method }) => method === "GET"))).toBe(true);
});

test("the Christmas return uses Saturday and the authoritative saved hour", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-12-25T20:00:00Z") });
  await page.goto("/e2e/fixtures/roster-lock.html?week=christmas");
  await expect(page.getByRole("region", { name: "Roster lock", exact: true })).toContainText("Saturday, December 26, 2026 at 5:00 PM Pacific Time");
});
