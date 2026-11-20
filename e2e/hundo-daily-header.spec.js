import { expect, test } from "@playwright/test";

const csrfToken = "D".repeat(43);
const viewer = { id: "daily-header-user", displayName: "Harbour Lights", status: "active", version: 1 };
const tickerName = "Hockey quote ticker. Hover or focus to pause.";

async function expectScreenWipe(page, screenshot) {
  await expect.poll(() => page.evaluate(() => document.getAnimations().some(a => a.animationName === "hl-screen-reveal"))).toBe(true);
  const timing = await page.evaluate(() => {
    const animations = document.getAnimations().filter(a => a.animationName?.startsWith("hl-screen-"));
    animations.forEach(a => { a.pause(); a.currentTime = 650; });
    return animations.map(a => ({ name: a.animationName, duration: a.effect.getTiming().duration }));
  });
  expect(timing).toEqual([{ name: "hl-screen-reveal", duration: 1300 }]);
  await expect(page.locator(".hl-screen-wave, .hl-screen-wave__glow, .hl-screen-wave__core, #hundo-wave-blur")).toHaveCount(0);
  if (screenshot) await page.screenshot({path:screenshot});
  await page.evaluate(() => document.getAnimations().filter(a => a.animationName === "hl-screen-reveal").forEach(a => a.play()));
  await expect(page.locator("html")).not.toHaveAttribute("data-hundo-wave");
  await expect(page.locator(".hl-screen-wave")).toHaveCount(0);
}

test("product pill keeps its geometry and wipes the whole screen in both directions", async ({ page }, testInfo) => {
  await installHeaderFixture(page, { authenticated: false });
  for (const width of testInfo.project.name === "desktop" ? [1440, 2560, 900] : [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/daily/create");
    const brand = page.locator(".hl-wordmark");
    await expect(brand).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const dailyBox = await brand.boundingBox();
    const dailyToggle = await page.locator(".hl-mode-toggle").boundingBox();
    await expect(page.locator(".hl-mode-toggle")).toHaveText("HLHD");
    const dailyWidth = (await page.locator(".hd-content").boundingBox()).width;
    expect(dailyWidth).toBeGreaterThan(width - 60);
    await page.getByRole("link", { name: "Switch to Hundo Leago" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expectScreenWipe(page, testInfo.outputPath(`wipe-to-leago-${width}.png`));
    const leagoBox = await brand.boundingBox();
    const leagoToggle = await page.locator(".hl-mode-toggle").boundingBox();
    expect(Math.abs(leagoToggle.x - dailyToggle.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(leagoToggle.width - dailyToggle.width)).toBeLessThanOrEqual(2);
    expect(Math.abs(leagoBox.x - dailyBox.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(leagoBox.width - dailyBox.width)).toBeLessThanOrEqual(2);
    await page.getByRole("link", { name: "Switch to Hundo Daily" }).click();
    await expect(page).toHaveURL(/\/daily$/);
    await expectScreenWipe(page, testInfo.outputPath(`wipe-to-daily-${width}.png`));
    const active = await page.locator(".hl-mode-badge--daily").boundingBox();
    const inactive = await page.locator(".hl-mode-badge--leago").boundingBox();
    expect(active.width).toBeGreaterThan(inactive.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({ path: testInfo.outputPath(`pill-${width}.png`), fullPage: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".hl-wordmark__label--daily")).toHaveCSS("animation-name", "none");
    await page.getByRole("link", { name: "Hundo Daily", exact: true }).click();
    await expect(page).toHaveURL(/\/daily$/);
  }
});

test("screen switch respects reduced motion and remains usable without native view transitions", async ({page}) => {
  await installHeaderFixture(page,{authenticated:false});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/daily");
  await page.getByRole("link",{name:"Switch to Hundo Leago"}).press("Enter");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".hl-screen-wave, .hl-screen-wave__glow, .hl-screen-wave__core, #hundo-wave-blur")).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().filter(a => a.animationName?.startsWith("hl-screen-")).length)).toBe(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-hundo-wave");
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.evaluate(() => Object.defineProperty(document,"startViewTransition",{value:undefined,configurable:true}));
  await page.getByRole("link",{name:"Switch to Hundo Daily"}).click();
  await expect(page).toHaveURL(/\/daily$/);
  await expect(page.locator(".hl-screen-wave, .hl-screen-wave__glow, .hl-screen-wave__core, #hundo-wave-blur")).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().filter(a => a.animationName?.startsWith("hl-screen-")).length)).toBe(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-hundo-wave");
  await expect(page.getByRole("link",{name:"Sign in",exact:true})).toBeVisible();
});

test("rapid toggles and back navigation leave no screen overlay behind", async ({page}) => {
  await installHeaderFixture(page,{authenticated:false});
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto("/daily/create");
  await page.getByRole("link",{name:"Switch to Hundo Leago"}).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => document.getAnimations().some(a => a.animationName === "hl-screen-reveal"))).toBe(true);
  await page.evaluate(() => document.getAnimations().filter(a => a.animationName === "hl-screen-reveal").forEach(a => a.pause()));
  await expect(page.locator(".hl-screen-wave")).toHaveCount(0);
  // Fire during the paused reveal; a normal Playwright click may wait for its end.
  await page.getByRole("link",{name:"Switch to Hundo Daily"}).dispatchEvent("click", {button:0});
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/daily\/create$/);
  await expect(page.locator(".hl-screen-wave")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-hundo-wave");
});

async function installHeaderFixture(page, { authenticated = true, logoutFails = false } = {}) {
  const allowSeasonSignIn = !authenticated;
  const requests = [];
  const writes = [];
  const unexpected = [];
  const now = Date.now();
  const slate = {
    date: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver" }).format(now),
    firstGameAt: new Date(now + 60 * 60_000).toISOString(),
    auctionStartsAt: new Date(now + 30 * 60_000).toISOString(),
    day: "today",
    status: "open",
  };
  const session = {
    csrfToken, user: viewer,
    session: { id: "daily-header-session", userId: viewer.id, status: "active", version: 1,
      createdAtMs: now, lastUsedAtMs: now, idleExpiresAtMs: now + 3_600_000, absoluteExpiresAtMs: now + 86_400_000 },
  };
  const notification = {
    id: "header-notification", type: "league_invitation_created", readAtMs: null, createdAtMs: now,
    messageData: { invitationId: "11111111-1111-4111-8111-111111111111", leagueId: "22222222-2222-4222-8222-222222222222",
      leagueName: "Header fixture league", workflow: "create_team", teamId: null },
  };
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = request.method();
    requests.push({ path, method, page: new URL(page.url()).pathname, query: url.search });
    const answer = (data) => route.fulfill({ json: { data, meta: { requestId: "daily-header", serverNowMs: now } } });
    const error = (status, code, message) => route.fulfill({ status, json: { error: { code, message, requestId: "daily-header" } } });

    if (path === "/session") {
      if (method === "GET") return authenticated ? answer(session) : error(401, "SESSION_REQUIRED", "Sign in required.");
      if (method === "POST") {
        authenticated = true;
        writes.push({ path, method, body: request.postDataJSON() });
        return answer(session);
      }
      if (method === "DELETE") {
        writes.push({ path, method, csrf: request.headers()["x-csrf-token"] });
        if (logoutFails) return error(503, "SERVICE_UNAVAILABLE", "Server sign-out unavailable.");
        authenticated = false;
        return answer({ code: "SESSION_DELETED" });
      }
    }
    if (method === "GET" && path === "/notifications") return answer({
      code: "NOTIFICATIONS_FOUND", notifications: [notification, { ...notification, id: "header-notification-2" }],
      page: { nextCursor: null },
    });
    if (method === "GET" && path === "/daily/rooms") return answer({
      rooms: [], slate, slateOptions: [slate], practiceSlate: { ...slate, status: "available" }, slateUnavailable: false,
    });
    if (method === "GET" && path === "/daily/reminders") return answer({ reminders: [] });
    // AccountHome briefly mounts the season header while adopting a new session.
    if (method === "GET" && path === "/leagues" && allowSeasonSignIn && writes.some(({ method: writeMethod }) => writeMethod === "POST")) {
      return answer({ code: "LEAGUES_FOUND", leagues: [] });
    }
    unexpected.push({ path, method });
    return error(404, "NOT_FOUND", "Unexpected header fixture request.");
  });
  return { requests, writes, unexpected };
}

async function expectContainedHeader(page) {
  const header = page.getByRole("banner");
  await expect(header).toBeVisible();
  const box = await header.boundingBox();
  const width = page.viewportSize().width;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  await expect(header.getByRole("link", { name: "Switch to Hundo Leago" })).toBeInViewport();
  await expect(header.getByRole("region", { name: tickerName })).toBeInViewport();
}

test("Daily header exposes account links and dismisses the menu with Escape or outside input", async ({ page }, testInfo) => {
  const { requests, unexpected } = await installHeaderFixture(page);
  await page.goto("/daily");
  const header = page.getByRole("banner");
  const account = header.getByRole("button", { name: "Account menu", exact: true });
  await expect(header.getByRole("link", { name: "Switch to Hundo Leago" })).toHaveAttribute("href", "/leagues");
  await expect(header.getByRole("link", { name: "Notifications, 2 unread" })).toHaveAttribute("href", "/notifications");
  await expect(account).toHaveAttribute("aria-expanded", "false");
  await expectContainedHeader(page);
  await account.click();
  await expect(account).toHaveAttribute("aria-expanded", "true");
  const settings = header.getByRole("link", { name: "Account and team settings" });
  await expect(settings).toBeVisible();
  await expect(settings).toHaveAttribute("href", "/account");
  await expect(header.getByText(viewer.displayName, { exact: true }).last()).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("daily-header-account.png"), fullPage: true, animations: "disabled" });
  await page.keyboard.press("Escape");
  await expect(account).toHaveAttribute("aria-expanded", "false");
  await expect(account).toBeFocused();
  await expect(settings).toHaveCount(0);
  await account.click();
  await page.getByRole("main").click({ position: { x: 10, y: 10 } });
  await expect(account).toHaveAttribute("aria-expanded", "false");
  // WebKit mouse clicks do not focus buttons; establish a distinct focus target.
  await account.focus();
  await account.press("Enter");
  await expect(account).toHaveAttribute("aria-expanded", "true");
  await header.getByRole("region", { name: tickerName }).focus();
  await expect(account).toHaveAttribute("aria-expanded", "false");
  await expect(settings).toHaveCount(0);
  if (testInfo.project.name === "desktop") {
    await page.setViewportSize({ width: 1024, height: 900 });
    await expectContainedHeader(page);
    await page.screenshot({ path: testInfo.outputPath("daily-header-medium.png"), fullPage: true, animations: "disabled" });
  }
  expect(requests.some(({ path }) => path.startsWith("/leagues"))).toBe(false);
  expect(requests.find(({ path }) => path === "/notifications").query).toContain("readStatus=unread");
  expect(unexpected).toEqual([]);
});

test("Daily header signs out through the session API and displays anonymous controls", async ({ page }) => {
  const { requests, writes, unexpected } = await installHeaderFixture(page);
  await page.goto("/daily");
  const header = page.getByRole("banner");
  await header.getByRole("button", { name: "Account menu" }).click();
  await header.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(header.getByRole("button", { name: "Account menu" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  await expect(header.getByRole("link", { name: "Switch to Hundo Leago" })).toHaveAttribute("href", "/");
  await expect(header.getByRole("link", { name: /^Notifications/ })).toHaveCount(0);
  expect(writes).toEqual([{ path: "/session", method: "DELETE", csrf: csrfToken }]);
  expect(requests.some(({ path }) => path.startsWith("/leagues"))).toBe(false);
  expect(unexpected).toEqual([]);
});

test("Daily header retains the sign-out failure after the local session clears", async ({ page }) => {
  const { writes, unexpected } = await installHeaderFixture(page, { logoutFails: true });
  await page.goto("/daily");
  const header = page.getByRole("banner");
  await header.getByRole("button", { name: "Account menu" }).click();
  await header.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(header.getByRole("button", { name: "Account menu" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(/sign.out|server/i);
  expect(writes).toEqual([{ path: "/session", method: "DELETE", csrf: csrfToken }]);
  expect(unexpected).toEqual([]);
});

test("anonymous Daily header preserves the requested Daily path through sign-in", async ({ page }, testInfo) => {
  const { requests, writes, unexpected } = await installHeaderFixture(page, { authenticated: false });
  await page.goto("/daily/create");
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Switch to Hundo Leago" })).toHaveAttribute("href", "/");
  await expectContainedHeader(page);
  await page.screenshot({ path: testInfo.outputPath("daily-header-anonymous.png"), fullPage: true, animations: "disabled" });
  await header.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/#account-access$/);
  expect(await page.evaluate(() => history.state.usr.dailyReturnTo)).toBe("/daily/create");
  const form = page.getByRole("form", { name: "Sign in", exact: true });
  await form.getByLabel("Email address").fill("header-fixture@example.test");
  await form.getByLabel("Password", { exact: true }).fill("local-header-fixture-password");
  await form.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/daily\/create$/);
  await expect(page.getByLabel("Room name")).toBeVisible();
  const dailyCheckpoint = requests.length;
  await page.clock.install();
  await page.clock.runFor(31_000);
  expect(writes).toEqual([{ path: "/session", method: "POST",
    body: { email: "header-fixture@example.test", password: "local-header-fixture-password" } }]);
  expect(requests.slice(dailyCheckpoint).some(({ path }) => path.startsWith("/leagues"))).toBe(false);
  expect(unexpected).toEqual([]);
});

test("Daily quote ticker pauses on hover and focus and respects reduced motion", async ({ page }, testInfo) => {
  const { requests, unexpected } = await installHeaderFixture(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/daily");
  const ticker = page.getByRole("region", { name: tickerName });
  const track = ticker.locator(".hl-quote-ticker__track");
  await expect(track).toHaveCSS("animation-name", "hl-quote-ticker-scroll");
  await ticker.focus();
  await expect(track).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("button", { name: "Account menu" }).focus();
  await expect(track).toHaveCSS("animation-play-state", "running");
  if (testInfo.project.name === "desktop") {
    await ticker.hover();
    await expect(track).toHaveCSS("animation-play-state", "paused");
    await page.getByRole("button", { name: "Account menu" }).hover();
    await expect(track).toHaveCSS("animation-play-state", "running");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(track).toHaveCSS("animation-name", "none");
  await expect(track).toHaveCSS("transform", "none");
  await expectContainedHeader(page);
  expect(requests.some(({ path }) => path.startsWith("/leagues") || path.startsWith("/quotes"))).toBe(false);
  expect(unexpected).toEqual([]);
});
