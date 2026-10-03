import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const origin = process.env.HUNDO_NAVIGATION_PREVIEW_ORIGIN || "http://127.0.0.1:5173";
const preview = `${origin}/e2e/fixtures/desktop-navigation.html`;

async function openPreview(page, suffix = "") {
  await page.addInitScript(() => {
    window.navigationAnimations = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      window.navigationAnimations.push({ className: this.className, frames, options });
      return animate.call(this, frames, options);
    };
  });
  await page.goto(`${preview}${suffix}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Own Goal Hatty", exact: true })).toBeVisible();
}

async function expectNoOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test("matchup submenu browses weeks and seasons while mobile keeps its page controls", async ({ page }) => {
  await openPreview(page);
  if (page.viewportSize().width < 1024) {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.getByRole("link", { name: "Matchups", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Week", exact: true })).toBeVisible();
    await page.getByRole("combobox", { name: "Week", exact: true }).selectOption({ index: 1 });
    await expect(page.locator(".hl-matchup-selector h2")).toContainText("Week 2");
  } else {
    const toggle = page.getByRole("button", { name: "Matchups", exact: true });
    await toggle.click();
    const menu = page.getByRole("dialog", { name: "Matchups", exact: true });
    const previous = menu.getByRole("button", { name: "Previous week" });
    const next = menu.getByRole("button", { name: "Next week" });
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();
    await next.click();
    await expect(menu.locator(".hl-sidebar-week")).toHaveText("Week 2");
    await expect(previous).toBeEnabled();
    await next.click();
    await expect(menu.locator(".hl-sidebar-week")).toHaveText("Week 3");
    await expect(next).toBeDisabled();
    await previous.click();
    await expect(menu.locator(".hl-sidebar-week")).toHaveText("Week 2");
    await menu.getByRole("link", { name: "Own Goal Hatty vs Coastal Wolves" }).click();
    await expect(page.locator(".hl-matchup-selector")).toBeHidden();
    await expect(page.locator(".hl-matchup-page-controls")).toBeHidden();
    await page.reload();
    await toggle.click();
    await expect(menu.locator(".hl-sidebar-week")).toHaveText("Week 2");
    await menu.getByRole("combobox", { name: "Season" }).selectOption({ label: "2025–26" });
    await expect(menu.getByText("No matchup schedule has been generated yet.")).toBeVisible();
    await menu.getByRole("combobox", { name: "Season" }).selectOption({ label: "2026–27" });
    await expect(menu.locator(".hl-sidebar-week")).toHaveText("Week 1");
    await page.keyboard.press("Escape");
  }
  await expect(page.locator(".hl-matchup-score__team b").first()).toHaveText("7.25");
  await expect(page.locator(".hl-matchup-score__team small").first()).toHaveText("fantasy points");
  expect(await page.evaluate(() => window.navigationFixture.requests.every((item) => item.method === "GET"))).toBe(true);
  await expectNoOverflow(page);
});

test("dashboard fills the available width with aligned panels and equal team tiles", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openPreview(page, "?dashboard");
  await page.evaluate(() => { window.location.hash = `/leagues/${window.navigationFixture.leagues[0].id}`; });
  await expect(page.locator(".hl-dashboard-roster tbody tr").first()).toBeVisible();
  await expect(page.locator(".hl-trade-block tbody tr").first()).toBeAttached();
  await expect(page.locator(".hl-dashboard [role=alert]")).toHaveCount(0);
  await expect(page.locator(".hl-dashboard").getByRole("heading", { name: "League announcements" })).toHaveCount(0);
  await expect(page.getByText("League workspace", { exact: true })).toHaveCount(0);
  await expect(page.locator(".hl-dashboard-matchup-score b").first()).toHaveText("7.25");
  const widths = page.viewportSize().width >= 1024 ? [1024, 1440, 1920, 2560] : [page.viewportSize().width];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    await expectNoOverflow(page);
    const dashboard = await page.locator(".hl-dashboard").boundingBox();
    const matchup = await page.locator(".hl-dashboard__hero > .hl-dashboard-matchup").boundingBox();
    const roster = await page.locator(".hl-dashboard-roster").boundingBox();
    if (width >= 1024) {
      const sidebar = await page.locator(".hl-desktop-sidebar").boundingBox();
      expect(Math.abs(dashboard.x - (sidebar.x + sidebar.width + 18))).toBeLessThan(2);
      expect(Math.abs(dashboard.x + dashboard.width - (width - 18))).toBeLessThan(2);
      expect(Math.abs(matchup.y - roster.y)).toBeLessThan(2);
      expect(roster.x).toBeGreaterThan(matchup.x + matchup.width);
    } else expect(roster.y).toBeGreaterThan(matchup.y);
    const heights = await page.locator(".hl-dashboard__summary .hl-team-grid > a").evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height));
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1);
    const badge = await page.locator(".hl-dashboard__summary .hl-status-badge").boundingBox();
    const ownTile = await page.locator(".hl-dashboard__summary .hl-team-grid > a").filter({ hasText: "Your team" }).boundingBox();
    expect(Math.abs((badge.y + badge.height / 2) - (ownTile.y + ownTile.height / 2))).toBeLessThan(2);
    expect((await page.locator(".hl-trade-block__heading").boundingBox()).height).toBe(72);
    await page.screenshot({ path: `.hundo.local/layout-review/dashboard-${width}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.navigationFixture.requests.every((item) => item.method === "GET"))).toBe(true);
});

test("desktop sidebar promotes team cards, keeps headers below the bar, and isolates leagues", async ({ page }) => {
  test.skip(page.viewportSize().width < 1024, "Desktop layout only");
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openPreview(page);
  const sidebar = page.getByRole("complementary", { name: "League sidebar" });
  const nav = sidebar.getByRole("navigation", { name: "Main navigation" });
  await expect(page.getByRole("button", { name: "Menu", exact: true })).toBeHidden();
  await expect(nav.getByRole("button", { name: "Teams", exact: true })).toHaveAttribute("aria-expanded", "false");
  await nav.getByRole("button", { name: "Teams", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Teams", exact: true })).toBeVisible();
  await expect(sidebar.locator(".hl-sidebar-cards a").first()).toHaveAccessibleName("Your Team: Own Goal Hatty");
  await expect(sidebar.locator(".hl-sidebar-team img").first()).toBeVisible();
  await expect(sidebar.getByText(/Remember to set your lineup/)).toBeVisible();
  await expect(sidebar.getByRole("button", { name: "Write", exact: true })).toHaveCount(0);
  await nav.getByRole("link", { name: "Northern Lights", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Northern Lights", exact: true })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Teams", exact: true })).toHaveCount(0);
  await expect(page.locator(".hl-roster-hero")).not.toHaveAttribute("data-navigation-animating", "true");
  await expect(page.locator(".hl-navigation-details")).not.toHaveAttribute("data-navigation-revealing", "true");
  const motion = await page.evaluate(() => window.navigationAnimations);
  expect(motion.some((item) => item.className.includes("hl-roster-hero") && item.options.duration === 720 && item.frames[0].transform.includes("scale("))).toBe(true);
  expect(motion.some((item) => item.className === "hl-navigation-details" && item.options.duration === 1300 && item.options.delay === 720 && item.frames[0].clipPath)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 850));
  const header = await page.locator(".hl-roster-hero").boundingBox();
  const topbar = await page.locator(".hl-app-header").boundingBox();
  expect(Math.abs(header.y - (topbar.y + topbar.height))).toBeLessThan(2);
  expect(header.height).toBeLessThan(200);
  await expectNoOverflow(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `.hundo.local/desktop-sidebar-20261002/roster-${page.viewportSize().width}.png`, fullPage: false });
  await nav.getByRole("button", { name: "Switch league", exact: true }).click();
  await nav.getByRole("link", { name: /Pacific Hockey League/ }).click();
  await expect(page.getByRole("heading", { name: "Pacific Hockey League", exact: true })).toBeVisible();
  await expect(sidebar.getByText("Welcome to the Pacific league.")).toBeVisible();
  await expect(sidebar.getByText(/Remember to set your lineup/)).toHaveCount(0);
  await nav.getByRole("button", { name: "Teams", exact: true }).click();
  await expect(nav.getByRole("link", { name: "Your Team: Pacific 3" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Northern Lights", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.navigationFixture.requests.every((item) => item.method === "GET"))).toBe(true);
  expect(errors).toEqual([]);
});

test("desktop weekly matchups promote to sticky scores and survive browser history", async ({ page }) => {
  test.skip(page.viewportSize().width < 1024, "Desktop layout only");
  await openPreview(page);
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("button", { name: "Matchups", exact: true }).click();
  await expect(nav.locator(".hl-sidebar-matchup")).toHaveCount(3);
  await nav.getByRole("link", { name: "Own Goal Hatty vs Coastal Wolves" }).click();
  await expect(page.getByRole("heading", { name: "Own Goal Hatty vs Coastal Wolves" })).toBeAttached();
  await expect(page.getByRole("dialog", { name: "Matchups", exact: true })).toHaveCount(0);
  await expect(page.locator(".hl-matchup-score")).not.toHaveAttribute("data-navigation-animating", "true");
  await expect(page.locator(".hl-navigation-details")).not.toHaveAttribute("data-navigation-revealing", "true");
  await expect(page.getByRole("list", { name: "Own Goal Hatty versus Coastal Wolves player scoring" })).toBeVisible();
  expect(await page.evaluate(() => window.navigationAnimations.some((item) => item.className === "hl-matchup-score"))).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 550));
  const score = await page.locator(".hl-matchup-score").boundingBox();
  const topbar = await page.locator(".hl-app-header").boundingBox();
  expect(Math.abs(score.y - (topbar.y + topbar.height))).toBeLessThan(2);
  await nav.getByRole("button", { name: "Matchups", exact: true }).click();
  await nav.getByRole("link", { name: "Northern Lights vs Pacific Royals" }).click();
  await expect(page.getByRole("heading", { name: "Northern Lights vs Pacific Royals" })).toBeAttached();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Own Goal Hatty vs Coastal Wolves" })).toBeAttached();
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Own Goal Hatty vs Coastal Wolves" })).toBeAttached();
  await expectNoOverflow(page);
  await page.screenshot({ path: `.hundo.local/desktop-sidebar-20261002/matchup-${page.viewportSize().width}.png`, fullPage: false });
});

test("commissioner announcements retain failed drafts, publish to the current league, and menus support Escape", async ({ page }) => {
  test.skip(page.viewportSize().width < 1024, "Desktop layout only");
  await openPreview(page, "?commissioner=1");
  const sidebar = page.getByRole("complementary", { name: "League sidebar" });
  await expect(sidebar.getByRole("button", { name: "Commissioner tools", exact: true })).toBeVisible();
  await sidebar.getByRole("button", { name: "Write", exact: true }).click();
  const draft = sidebar.getByRole("textbox", { name: "Announcement", exact: true });
  await draft.fill("League meeting Thursday.\nPlease bring your questions.");
  await page.evaluate(() => { window.navigationFixture.failPost = true; });
  await sidebar.getByRole("button", { name: "Post announcement" }).click();
  await expect(sidebar.getByRole("alert")).toContainText("Your draft is still here");
  await expect(draft).toHaveValue("League meeting Thursday.\nPlease bring your questions.");
  await page.evaluate(() => { window.navigationFixture.failPost = false; });
  await sidebar.getByRole("button", { name: "Post announcement" }).click();
  await expect(sidebar.getByRole("status")).toHaveText("Announcement posted.");
  await expect(sidebar.getByText(/League meeting Thursday/)).toBeVisible();
  await sidebar.getByRole("button", { name: "Switch league", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(sidebar.getByRole("button", { name: "Switch league", exact: true })).toBeFocused();
  await expect(sidebar.getByRole("button", { name: "Switch league", exact: true })).toHaveAttribute("aria-expanded", "false");
  await expectNoOverflow(page);
});

test("reduced motion switches teams immediately and sidebar failures can be retried", async ({ page }) => {
  test.skip(page.viewportSize().width < 1024, "Desktop layout only");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPreview(page);
  const sidebar = page.getByRole("complementary", { name: "League sidebar" });
  await sidebar.getByRole("button", { name: "Teams", exact: true }).click();
  await sidebar.getByRole("link", { name: "Northern Lights", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Northern Lights", exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.navigationAnimations.length)).toBe(0);
  await page.evaluate(async () => {
    window.navigationFixture.failAnnouncements = true;
    await window.navigationQueryClient.invalidateQueries({ queryKey: ["league", window.navigationFixture.leagues[0].id, "announcements"] });
  });
  await expect(sidebar.getByRole("alert")).toContainText("Announcements could not be loaded");
  await page.evaluate(() => { window.navigationFixture.failAnnouncements = false; });
  await sidebar.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(sidebar.getByText(/Remember to set your lineup/)).toBeVisible();
});

test("mobile retains the dropdown and roster views without a desktop sidebar", async ({ page }) => {
  test.skip(page.viewportSize().width >= 1024, "Mobile layout only");
  await openPreview(page);
  await expect(page.getByRole("complementary", { name: "League sidebar" })).toHaveCount(0);
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  const menu = page.getByRole("navigation", { name: "Main navigation" });
  await expect(menu.getByRole("link", { name: "Teams", exact: true })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Matchups", exact: true })).toBeAttached();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await page.getByRole("button", { name: "Table", exact: true }).click();
  await expect(page.getByRole("button", { name: "Table", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Cap outlook", exact: true }).click();
  await expect(page.getByRole("region", { name: "Cap outlook by season" })).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: `.hundo.local/desktop-sidebar-20261002/mobile-${page.viewportSize().width}.png`, fullPage: false });
});

test("desktop sidebar stays usable at 1024, 1440 and 1920 pixels and exposes accessible controls", async ({ page }) => {
  test.skip(page.viewportSize().width < 1024, "Desktop layout only");
  await openPreview(page);
  const teams = page.getByRole("button", { name: "Teams", exact: true });
  const matchups = page.getByRole("button", { name: "Matchups", exact: true });
  const matchupsBefore = await matchups.boundingBox();
  await teams.click();
  await expect(page.getByRole("button", { name: "Close Teams", exact: true })).toBeFocused();
  expect((await matchups.boundingBox()).y).toBe(matchupsBefore.y);
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await expectNoOverflow(page);
    const sidebar = await page.locator(".hl-desktop-sidebar").boundingBox();
    const roster = await page.locator(".hl-roster-hero").boundingBox();
    expect(roster.x).toBeGreaterThan(sidebar.x + sidebar.width);
    expect(roster.x + roster.width).toBeLessThanOrEqual(width);
    const flyout = await page.getByRole("dialog", { name: "Teams", exact: true }).boundingBox();
    expect(flyout.x).toBeGreaterThanOrEqual(sidebar.x + sidebar.width);
    expect(flyout.x + flyout.width).toBeLessThanOrEqual(width);
    expect(flyout.y + flyout.height).toBeLessThanOrEqual(900);
    await page.screenshot({ path: `.hundo.local/desktop-sidebar-20261002/desktop-${width}.png`, fullPage: false });
  }
  const violations = (await new AxeBuilder({ page }).include(".hl-desktop-sidebar").analyze()).violations;
  expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(teams).toBeFocused();
  await expect(page.getByRole("dialog", { name: "Teams", exact: true })).toHaveCount(0);
  await teams.click();
  await matchups.click();
  await expect(page.getByRole("dialog", { name: "Teams", exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "Matchups", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close Matchups", exact: true }).click();
  await expect(matchups).toBeFocused();
  await expect(page.getByRole("dialog", { name: "Matchups", exact: true })).toHaveCount(0);
  await teams.click();
  const rules = page.getByRole("button", { name: "League Rules", exact: true });
  await rules.click();
  await expect(page.getByRole("dialog", { name: "Teams", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Close League Rules" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(rules).toBeFocused();
  await expect(page.getByRole("dialog", { name: "League rules" })).toHaveCount(0);
});
