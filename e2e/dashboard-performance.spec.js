import { test, expect } from "@playwright/test";

for (const kind of ["activity", "roster", "matchup"]) {
  test(`dashboard reveals its panels together after a slow ${kind} response`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/dashboard-performance.html?hold=${kind}`);
    await page.evaluate(() => window.dashboardFixture.releaseDetails());
    const matcher = kind === "roster" ? "/roster" : kind === "matchup" ? "/matchups/" : "/activity?";
    await expect.poll(() => page.evaluate((part) => window.dashboardFixture.events.some((event) =>
      event.path.includes(part) && event.completedAt === null), matcher)).toBe(true);
    await expect(page.locator(".hl-dashboard")).toHaveCount(0);
    await expect(page.getByRole("status")).toContainText("Loading Hundo Hockey League dashboard");
    await page.evaluate(() => window.dashboardFixture.releasePanel());
    await expect(page.getByRole("heading", { name: "League history log" })).toBeVisible();
    await expect(page.locator(".hl-dashboard-matchups > li")).toHaveCount(3);
    await expect(page.locator(".hl-dashboard [role=status]")).toHaveCount(0);
    await expect(page.locator(".hl-dashboard [role=alert]")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    // Joined observers must not double the requests during the initial display.
    const paths = await page.evaluate(() => window.dashboardFixture.events.map((event) => event.path));
    expect(paths.length).toBe(new Set(paths).size);
  });
}

test("dashboard reveals healthy panels when one summary fails and keeps content during refresh", async ({ page }) => {
  await page.goto("/e2e/fixtures/dashboard-performance.html?hold=activity&fail=1");
  await page.evaluate(() => { window.dashboardFixture.releaseDetails(); window.dashboardFixture.releasePanel(); });
  await expect(page.getByRole("heading", { name: "League history log" })).toBeVisible();
  await expect(page.locator(".hl-dashboard [role=alert]")).toHaveCount(1);
  await expect(page.locator(".hl-dashboard-matchups > li")).toHaveCount(3);
  await page.evaluate(() => window.dashboardFixture.refreshPanel("activity"));
  await expect.poll(() => page.evaluate(() => window.dashboardFixture.events.some((event) =>
    event.path.includes("/activity?") && event.completedAt === null))).toBe(true);
  await expect(page.getByRole("heading", { name: "League history log" })).toBeVisible();
  await expect(page.locator(".hl-dashboard-matchups > li")).toHaveCount(3);
  await page.evaluate(() => window.dashboardFixture.releasePanel());
  await expect(page.getByText("No activity yet", { exact: true })).toBeVisible();
  await expect(page.locator(".hl-dashboard [role=alert]")).toHaveCount(0);
});

for (const kind of ["roster", "matchup"]) {
  test(`dashboard settles a failed ${kind} without a second loading cycle`, async ({ page }) => {
    await page.goto(`/e2e/fixtures/dashboard-performance.html?hold=${kind}&fail=1`);
    await page.evaluate(() => { window.dashboardFixture.releaseDetails(); window.dashboardFixture.releasePanel(); });
    await expect(page.getByRole("heading", { name: "League history log" })).toBeVisible();
    await expect(page.locator(".hl-dashboard [role=alert]").first()).toBeVisible();
    await expect(page.locator(".hl-dashboard [role=status]")).toHaveCount(0);
    const paths = await page.evaluate(() => window.dashboardFixture.events.map((event) => event.path));
    expect(paths.length).toBe(new Set(paths).size);
  });
}

test("dashboard loads summaries before parent details and keeps league caches separate", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await page.goto("/e2e/fixtures/dashboard-performance.html");
  await expect.poll(() => page.evaluate(() => window.dashboardFixture?.events.filter((event) =>
    /\/(standings|trades|activity|auctions|matchup-weeks\/current)(\?|$)/.test(event.path)
  ).length)).toBe(5);
  const held = await page.evaluate(() => {
    const fixture = window.dashboardFixture;
    return { events: fixture.events, leagueId: fixture.leagues[0].id };
  });
  expect(held.events.find((event) => event.path === `/api/v1/leagues/${held.leagueId}`).completedAt).toBeNull();
  expect(held.events.find((event) => event.path.endsWith("/teams")).completedAt).toBeNull();
  expect(held.events.some((event) => event.path.endsWith("/activity?limit=5&category=all"))).toBe(true);
  await page.evaluate(() => window.dashboardFixture.releaseDetails());
  await expect(page.getByRole("heading", { name: "League history log" })).toBeVisible();
  await expect(page.getByText("No activity yet", { exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(await page.evaluate(() => window.dashboardFixture.events.filter((event) => event.path.includes("/activity?")).length)).toBe(1);

  await page.getByRole("navigation", { name: "Fixture leagues" }).getByRole("link", { name: "Pacific Hockey League" }).click();
  await expect(page.getByRole("heading", { name: "League history log" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.dashboardFixture.events.filter((event) => event.path.includes("/activity?")).length)).toBe(2);
  const activityPaths = await page.evaluate(() => window.dashboardFixture.events.filter((event) => event.path.includes("/activity?")).map((event) => event.path));
  expect(new Set(activityPaths).size).toBe(2);
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("an inaccessible dashboard starts no league-specific reads", async ({ page }) => {
  const denied = "99999999-9999-4999-8999-999999999999";
  await page.goto(`/e2e/fixtures/dashboard-performance.html#/leagues/${denied}`);
  await expect(page.getByRole("heading", { name: "League access unavailable" })).toBeVisible();
  expect(await page.evaluate((leagueId) => window.dashboardFixture.events.some((event) => event.path.includes(leagueId)), denied)).toBe(false);
});
