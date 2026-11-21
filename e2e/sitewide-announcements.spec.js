import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => ["127.0.0.1", "localhost"].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});

async function message(page) {
  await page.getByLabel("Title", { exact: true }).fill("Schedule reminder for both leagues");
  await page.getByLabel("Message", { exact: true }).fill("Please review your roster before the next matchup starts.");
  await page.getByRole("button", { name: "Preview message" }).click();
  return page.getByRole("region", { name: "Message preview" });
}
const writes = page => page.evaluate(() => window.announcementRequests.filter(request => request.method === "POST" && !request.url.endsWith("/preview")));

test("administrator reaches All leagues from sidebar and confirms one publication", async ({ page }, testInfo) => {
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/e2e/fixtures/sitewide-announcements.html");
  await expect(page.getByLabel("Announcement audience")).toHaveValue("league");
  await page.getByRole("link", { name: "Announce to all leagues" }).click();
  await expect(page).toHaveURL(/\/commissioner\/communications\?audience=all_leagues$/);
  await expect(page.getByLabel("Announcement audience")).toHaveValue("all_leagues");
  expect(await writes(page)).toEqual([]);
  const preview = await message(page);
  await expect(preview.getByText("Visible in all 2 leagues. 4 in-app notifications for 3 people.")).toBeVisible();
  await expect(preview.getByRole("list", { name: "Announcement leagues" }).getByRole("listitem")).toHaveText(["Amigo Leago · 2 notifications", "Goon Spoons · 2 notifications"]);
  await expect(preview.getByRole("list", { name: "Notification recipients" }).getByRole("listitem")).toHaveCount(3);
  expect(await writes(page)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("sitewide-preview.png"), fullPage: true });
  await preview.scrollIntoViewIfNeeded();
  await preview.screenshot({ path: testInfo.outputPath("sitewide-preview-detail.png"), animations: "disabled" });
  await preview.getByRole("button", { name: "Confirm announcement" }).click();
  await expect(page.getByRole("status")).toHaveText("Announcement published to 2 leagues. 4 in-app notifications for 3 people.");
  const requests = await writes(page);
  expect(requests).toHaveLength(1);
  expect(requests[0].url).toBe("/api/v1/admin/announcements");
  expect(errors).toEqual([]);
});

test("commissioner keeps only the original league announcement flow", async ({ page }, testInfo) => {
  await page.goto("/e2e/fixtures/sitewide-announcements.html?role=commissioner&audience=all_leagues");
  await expect(page.getByRole("link", { name: "Announce to all leagues" })).toHaveCount(0);
  await expect(page.getByLabel("Announcement audience")).toHaveCount(0);
  const preview = await message(page);
  await expect(preview.getByText("Visible to league members. 2 in-app notifications.")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("commissioner-preview.png"), fullPage: true });
  await preview.getByRole("button", { name: "Confirm announcement" }).click();
  const requests = await writes(page);
  expect(requests).toHaveLength(1);
  expect(requests[0].url).toContain("/leagues/00000000-0000-4000-8000-000000000001/communications");
  expect(await page.evaluate(() => window.announcementRequests.every(request => !request.url.startsWith("/api/v1/admin/")))).toBe(true);
});

test("administrator scope changes require a new preview and uncertain sends reuse one key", async ({ page }) => {
  await page.goto("/e2e/fixtures/sitewide-announcements.html?uncertain");
  await page.getByLabel("Announcement audience").selectOption("all_leagues");
  await message(page);
  await page.getByLabel("Announcement audience").selectOption("league");
  await expect(page.getByRole("region", { name: "Message preview" })).toHaveCount(0);
  await page.getByLabel("Announcement audience").selectOption("all_leagues");
  await page.getByRole("button", { name: "Preview message" }).click();
  await page.getByRole("button", { name: "Confirm announcement" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("button", { name: "Confirm announcement" }).click();
  await expect(page.getByRole("status")).toHaveText("Announcement published to 2 leagues. 4 in-app notifications for 3 people.");
  const requests = await writes(page);
  expect(requests).toHaveLength(2);
  expect(requests[1].key).toBe(requests[0].key);
  expect(requests[1].body).toEqual(requests[0].body);
});
