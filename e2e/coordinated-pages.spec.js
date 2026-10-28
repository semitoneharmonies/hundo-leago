import { test, expect } from "@playwright/test";

const cases = [
  { pageName: "matchups", loading: "Loading matchups…", content: (page) => page.getByRole("region", { name: "Northern Lights vs Pacific Royals" }), secondary: (page) => page.getByRole("button", { name: "Refresh", exact: true }) },
  { pageName: "trades", loading: "Loading trades…", content: (page) => page.getByRole("heading", { name: "Trade block", exact: true }), secondary: (page) => page.getByRole("heading", { name: "New trade proposal", exact: true }) },
  { pageName: "players", loading: "Loading players…", content: (page) => page.getByRole("region", { name: "Player filters" }), secondary: (page) => page.getByRole("link", { name: "Sample Skater", exact: true }) },
];

for (const scenario of cases) {
  test(`${scenario.pageName} reveals initial content together and keeps it during refresh`, async ({ page }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
    await page.goto(`/e2e/fixtures/coordinated-pages.html?page=${scenario.pageName}`);
    await expect.poll(() => page.evaluate(() => window.pageFixture?.events.some((event) => event.held && !event.completed))).toBe(true);
    await expect(page.getByText(scenario.loading, { exact: true })).toBeVisible();
    await expect(scenario.content(page)).toHaveCount(0);
    await expect(scenario.secondary(page)).toHaveCount(0);
    await page.evaluate(() => window.pageFixture.release());
    await expect(scenario.content(page)).toBeVisible();
    await expect(scenario.secondary(page)).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText(scenario.loading, { exact: true })).toHaveCount(0);
    await page.evaluate(() => window.pageFixture.refresh());
    await expect.poll(() => page.evaluate(() => window.pageFixture.events.some((event) => event.held && !event.completed))).toBe(true);
    await expect(scenario.content(page)).toBeVisible();
    await expect(scenario.secondary(page)).toBeVisible();
    await expect(page.getByText(scenario.loading, { exact: true })).toHaveCount(0);
    await page.evaluate(() => window.pageFixture.release());
    await expect.poll(() => page.evaluate(() => window.pageFixture.events.every((event) => event.completed))).toBe(true);
    expect(errors).toEqual([]);
    const layout = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
    await testInfo.attach("layout", { body: JSON.stringify(layout), contentType: "application/json" });
    await page.screenshot({ path: testInfo.outputPath(`${scenario.pageName}-ready.png`), fullPage: true });
  });
}
