import { expect, test } from "@playwright/test";

const leagueId = "11111111-1111-4111-8111-000000000001";
const notice = "Remember to set your lineup";

test("commissioner X removes just its announcement, preserves history and keeps failed removals visible", async ({ page }) => {
  await page.goto(`/e2e/fixtures/desktop-navigation.html?announcements&commissioner#/leagues/${leagueId}`);
  const main = page.getByRole("main");
  const message = main.locator("article").filter({ hasText: notice }).first();
  const remove = message.getByRole("button", { name: /Remove announcement/ });
  await expect(remove).toBeVisible();
  const cardBox = await message.boundingBox();
  const buttonBox = await remove.boundingBox();
  expect(buttonBox.x + buttonBox.width).toBeGreaterThan(cardBox.x + cardBox.width - 3);
  expect(buttonBox.y).toBeLessThan(cardBox.y + 3);
  await page.screenshot({ path: `../announcement-x-${test.info().project.name}.png` });
  await page.evaluate(() => { window.navigationFixture.failArchive = true; });
  await remove.click();
  await expect(message.getByRole("alert")).toContainText("Could not remove");
  await expect(message).toContainText(notice);
  await page.evaluate(() => { window.navigationFixture.failArchive = false; });
  await remove.click();
  await expect(main.getByText("No current announcements.")).toBeVisible();
  if (page.viewportSize().width >= 1024) await expect(page.getByRole("complementary", { name: "League sidebar" }).getByText("No announcements yet.")).toBeVisible();
  await main.getByText("Manage announcements and reminders", { exact: true }).click();
  await main.getByText("Recent message history", { exact: true }).click();
  await expect(main.getByText(/Archived/, { exact: false })).toBeVisible();
  await expect(main.getByText(new RegExp(notice))).toBeVisible();
  const saved = await page.evaluate(() => window.navigationFixture.announcements.map(item => ({ leagueId: item.leagueId, archived: Boolean(item.archivedAtMs) })));
  expect(saved).toEqual([{ leagueId, archived: true }, { leagueId: "11111111-1111-4111-8111-000000000101", archived: false }]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("manager sees the notice without a removal button", async ({ page }) => {
  await page.goto(`/e2e/fixtures/desktop-navigation.html?announcements#/leagues/${leagueId}`);
  await expect(page.getByRole("main").getByText(new RegExp(notice))).toBeVisible();
  await expect(page.getByRole("button", { name: /Remove announcement/ })).toHaveCount(0);
  expect(await page.evaluate(() => window.navigationFixture.requests.filter(item => item.method !== "GET"))).toEqual([]);
});
