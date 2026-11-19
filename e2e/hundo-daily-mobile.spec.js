import { expect, test } from "@playwright/test";

test.skip(({ isMobile }) => !isMobile, "Exercises the phone viewport and touch controls.");

async function installPractice(page, { rejectFirstBid = false } = {}) {
  const now = Date.now();
  const viewer = { id: "mobile-manager", displayName: "Harbour Lights", version: 1, status: "active" };
  const at = minutes => new Date(now + minutes * 60_000).toISOString();
  const skaters = [
    ["Nick Suzuki", "MTL", "C"], ["Evan Bouchard", "EDM", "D"], ["Connor McDavid", "EDM", "C"],
    ["Elias Pettersson", "VAN", "C"], ["Cole Caufield", "MTL", "RW"], ["Miro Heiskanen", "DAL", "D"],
    ["Cale Makar", "COL", "D"], ["Jason Robertson", "DAL", "LW"],
  ].map(([name, team, position], index) => ({ id: "live-" + index, name, team, position, opponent: "NYI",
    ownBid: null, bidCount: 1, endsAt: at(2) }));
  const room = {
    id: "mobile-room", name: "Pacific Ice", phase: "auction", mode: "practice",
    date: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver" }).format(now),
    firstGameAt: at(-60), auctionStartsAt: at(-2), auctionEndsAt: at(28),
    joined: true, memberCount: 2, capacity: 8, commissionerId: viewer.id, canClose: true, winners: [],
    members: [
      { id: viewer.id, name: viewer.displayName, roster: [], reserved: 0, remainingCap: 100, availableCap: 100, points: 0 },
      { id: "other-manager", name: "North Shore", roster: [], remainingCap: 100, availableCap: null, reserved: null, points: 0 },
    ],
    availablePlayers: Array.from({ length: 18 }, (_, index) => ({ id: "pool-" + index, name: "Available Skater " + (index + 1),
      position: index % 2 ? "D" : "C", team: "VAN", opponent: "EDM", lineupStatus: "projected" })),
    auctions: skaters,
    rules: { cap: 100, minBid: 1, lotSeconds: 120 },
    bidLimits: { F: { maxAmount: 94, reason: null }, D: { maxAmount: 94, reason: null } },
  };
  const writes = [];
  const reads = [];
  await page.route("**/api/v1/**", async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    const answer = data => route.fulfill({ json: { data, meta: { requestId: "mobile-practice", serverNowMs: Date.now() } } });
    if (request.method() === "GET") {
      reads.push(path);
      if (path === "/session") return answer({ csrfToken: "D".repeat(43), user: viewer,
        session: { id: "mobile-session", userId: viewer.id, status: "active", version: 1,
          createdAtMs: now, lastUsedAtMs: now, idleExpiresAtMs: now + 3_600_000, absoluteExpiresAtMs: now + 86_400_000 } });
      if (path === "/notifications") return answer({ code: "NOTIFICATIONS_FOUND", notifications: [], page: { nextCursor: null } });
      if (path === "/daily/reminders") return answer({ reminders: [] });
      if (path === "/daily/rooms") return answer({ rooms: [room], slate: null, slateOptions: [], practiceSlate: null });
      if (path === "/daily/rooms/mobile-room") return answer({ room });
    }
    if (request.method() === "POST" && path === "/daily/rooms/mobile-room/bids") {
      const body = request.postDataJSON();
      writes.push(body);
      if (rejectFirstBid && writes.length === 1) return route.fulfill({ status: 409,
        json: { error: { code: "DAILY_BID_RETRY", message: "The room changed. Review your amount and try again.", requestId: "mobile-retry" } } });
      let player = room.auctions.find(item => item.id === body.playerId);
      if (!player) {
        player = { ...room.availablePlayers.find(item => item.id === body.playerId), ownBid: null, bidCount: 0, endsAt: at(2) };
        room.availablePlayers = room.availablePlayers.filter(item => item.id !== body.playerId);
        room.auctions.push(player);
      }
      player.ownBid = body.amount;
      player.bidCount += 1;
      room.members[0].reserved += body.amount;
      room.members[0].availableCap -= body.amount;
      return answer({ room });
    }
    return route.fulfill({ status: 404, json: { error: { code: "NOT_FOUND", message: "Unknown mobile fixture.", requestId: "mobile" } } });
  });
  return { room, writes, reads };
}

async function swipeLeft(page) {
  const box = await page.locator(".hda-board").boundingBox();
  const start = box.x + box.width * .82;
  const end = box.x + box.width * .2;
  const y = box.y + 180;
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start, y }] });
  for (let step = 1; step <= 10; step += 1) {
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start + (end - start) * step / 10, y }] });
    await page.waitForTimeout(25);
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

async function expectPanelAtStart(page, panel) {
  await expect.poll(async () => {
    const [board, selected] = await Promise.all([page.locator(".hda-board").boundingBox(), panel.boundingBox()]);
    return Math.abs(board.x - selected.x);
  }).toBeLessThan(2);
}

test("portrait touch swipes snap one complete panel at a time and links return to the pool", async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== "chromium", "Native touch swipe verification uses Chromium's input protocol.");
  await page.setViewportSize({ width: 390, height: 844 });
  await installPractice(page);
  await page.goto("/daily/rooms/mobile-room");
  const pool = page.getByRole("region", { name: "Player pool" });
  const live = page.getByRole("region", { name: "Live auctions" });
  const roster = page.getByRole("region", { name: "Roster", exact: true });
  await expectPanelAtStart(page, pool);
  const board = await page.locator(".hda-board").boundingBox();
  expect((await pool.boundingBox()).width).toBeCloseTo(board.width, 0);
  await expect(page.locator(".hda-board")).toHaveCSS("scroll-snap-type", "x mandatory");
  await swipeLeft(page);
  await expectPanelAtStart(page, live);
  await expect(page.getByRole("link", { name: "Auctions", exact: true })).toHaveAttribute("aria-current", "true");
  await page.screenshot({ path: testInfo.outputPath("portrait-live.png"), fullPage: true, animations: "disabled" });
  await swipeLeft(page);
  await expectPanelAtStart(page, roster);
  await expect(page.getByRole("link", { name: "Roster", exact: true })).toHaveAttribute("aria-current", "true");
  await page.getByRole("navigation", { name: "Auction panels" }).getByRole("link", { name: "Player pool" }).tap();
  await expectPanelAtStart(page, pool);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("a scrolled live auction opens a blank bid sheet that survives polling and rejects invalid amounts", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { room, writes } = await installPractice(page);
  await page.goto("/daily/rooms/mobile-room");
  const poolBid = await page.getByRole("button", { name: "Bid on Available Skater 1", exact: true }).boundingBox();
  expect(poolBid.height).toBeGreaterThanOrEqual(40);
  expect(poolBid.width).toBeGreaterThanOrEqual(44);
  await page.getByRole("link", { name: "Auctions", exact: true }).tap();
  const live = page.getByRole("region", { name: "Live auctions" });
  await live.locator(".hda-lots").evaluate(list => { list.scrollTop = list.scrollHeight; });
  const liveBid = live.getByRole("button", { name: "Bid on Cale Makar" });
  const target = await liveBid.boundingBox();
  expect(target.height).toBeGreaterThanOrEqual(40);
  expect(target.width).toBeGreaterThanOrEqual(44);
  await liveBid.tap();
  const dialog = page.getByRole("dialog", { name: "Bid on Cale Makar" });
  const amount = dialog.getByLabel("Sealed bid for Cale Makar");
  const submit = dialog.getByRole("button", { name: "Place bid", exact: true });
  await expect(dialog).toBeVisible();
  await expect(amount).toHaveValue("");
  await expect(amount).toBeFocused();
  await expect(submit).toBeDisabled();
  for (const invalid of ["0", "1.5", "95"]) {
    await amount.fill(invalid);
    await expect(submit).toBeDisabled();
  }
  expect(writes).toEqual([]);
  await amount.fill("12");
  room.auctions[6].bidCount = 4;
  await expect(page.locator(".hda-live .hda-lot").filter({ hasText: "Cale Makar" })).toContainText("4 bids", { timeout: 8000 });
  await expect(amount).toHaveValue("12");
  await expect(submit).toBeEnabled();
  await expect(submit).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath("portrait-bid-sheet.png"), fullPage: true, animations: "disabled" });
  await submit.tap();
  await expect(dialog).toHaveCount(0);
  await expect(live.getByText("Your bid $12")).toBeVisible();
  expect(writes).toEqual([{ playerId: "live-6", amount: 12 }]);
  await live.getByRole("button", { name: "Bid on Jason Robertson" }).tap();
  await expect(page.getByLabel("Sealed bid for Jason Robertson")).toHaveValue("");
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).tap();
  await expect(live.getByRole("button", { name: "Bid on Jason Robertson" })).toBeFocused();
});

test("bid errors stay in the sheet and a player moving from pool to live keeps the entered amount", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { room, writes } = await installPractice(page, { rejectFirstBid: true });
  await page.goto("/daily/rooms/mobile-room");
  await page.getByRole("button", { name: "Bid on Available Skater 1", exact: true }).tap();
  const dialog = page.getByRole("dialog", { name: "Bid on Available Skater 1" });
  const amount = dialog.getByLabel("Sealed bid for Available Skater 1");
  await amount.fill("7");
  const moved = room.availablePlayers.shift();
  room.auctions.push({ ...moved, ownBid: null, bidCount: 1, endsAt: new Date(Date.now() + 120_000).toISOString() });
  await expect(page.locator(".hda-pool-name").filter({ hasText: /^Available Skater 1$/ })).toHaveCount(0, { timeout: 8000 });
  await expect(amount).toHaveValue("7");
  await dialog.getByRole("button", { name: "Place bid" }).tap();
  await expect(dialog.getByRole("alert")).toHaveText("The room changed. Review your amount and try again.");
  await expect(amount).toHaveValue("7");
  await dialog.getByRole("button", { name: "Place bid" }).tap();
  await expect(dialog).toHaveCount(0);
  expect(writes).toEqual([{ playerId: "pool-0", amount: 7 }, { playerId: "pool-0", amount: 7 }]);
});

test("the bid sheet stays within a short visual viewport and its actions remain reachable", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installPractice(page);
  await page.goto("/daily/rooms/mobile-room");
  await page.getByRole("button", { name: "Bid on Available Skater 1", exact: true }).tap();
  const dialog = page.getByRole("dialog", { name: "Bid on Available Skater 1" });
  await dialog.getByLabel("Sealed bid for Available Skater 1").fill("5");
  // Model the visible area left by an installed-app keyboard without changing the layout viewport.
  await page.evaluate(() => {
    Object.defineProperties(window.visualViewport, {
      height: { configurable: true, value: 260 }, offsetTop: { configurable: true, value: 60 },
    });
    window.visualViewport.dispatchEvent(new Event("resize"));
  });
  await expect(dialog).toHaveCSS("max-height", "248px");
  const box = await dialog.boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(60);
  expect(box.y + box.height).toBeLessThanOrEqual(320);
  const submit = dialog.getByRole("button", { name: "Place bid", exact: true });
  await submit.scrollIntoViewIfNeeded();
  const action = await submit.boundingBox();
  expect(action.y).toBeGreaterThanOrEqual(60);
  expect(action.y + action.height).toBeLessThanOrEqual(320);
  await page.screenshot({ path: testInfo.outputPath("short-visual-viewport.png"), fullPage: true, animations: "disabled" });
  await submit.tap();
  await expect(dialog).toHaveCount(0);
});

for (const viewport of [{ width: 844, height: 390 }, { width: 667, height: 375 }]) {
  test("landscape " + viewport.width + " shows the room overview with scrolling inside every panel", async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await installPractice(page);
    await page.goto("/daily/rooms/mobile-room");
    const room = page.getByRole("article", { name: "Pacific Ice" });
    const panels = ["Player pool", "Live auctions", "Roster"].map(name => room.getByRole("region", { name, exact: true }));
    const boxes = await Promise.all(panels.map(panel => panel.boundingBox()));
    expect(boxes[0].y).toBe(boxes[1].y);
    expect(boxes[1].y).toBe(boxes[2].y);
    expect(boxes[2].x + boxes[2].width).toBeLessThanOrEqual(viewport.width);
    for (const box of boxes) expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    expect((await room.boundingBox()).y + (await room.boundingBox()).height).toBeLessThanOrEqual(viewport.height);
    await expect(room.getByRole("button", { name: "Close room", exact: true })).toBeInViewport();
    const live = panels[1];
    const list = await live.locator(".hda-lots").boundingBox();
    const firstBid = await live.getByRole("button", { name: "Bid on Nick Suzuki" }).boundingBox();
    expect(firstBid.y).toBeGreaterThanOrEqual(list.y);
    expect(firstBid.y + firstBid.height).toBeLessThanOrEqual(list.y + list.height);
    expect(firstBid.x).toBeGreaterThanOrEqual(list.x);
    expect(firstBid.x + firstBid.width).toBeLessThanOrEqual(list.x + list.width);
    const poolList = await panels[0].locator(".hda-pool-list").boundingBox();
    const firstPlayer = panels[0].locator(".hda-pool-list > li").first();
    for (const target of [firstPlayer, firstPlayer.getByRole("button", { name: "Bid on Available Skater 1", exact: true })]) {
      const bounds = await target.boundingBox();
      expect(bounds.y).toBeGreaterThanOrEqual(poolList.y);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(poolList.y + poolList.height);
      expect(bounds.x).toBeGreaterThanOrEqual(poolList.x);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(poolList.x + poolList.width);
    }
    await page.screenshot({ path: testInfo.outputPath("landscape-" + viewport.width + ".png"), fullPage: true, animations: "disabled" });
    await live.locator(".hda-lots").evaluate(list => { list.scrollTop = list.scrollHeight; });
    await live.getByRole("button", { name: "Bid on Cale Makar" }).tap();
    const dialog = page.getByRole("dialog", { name: "Bid on Cale Makar" });
    await dialog.getByLabel("Sealed bid for Cale Makar").fill("4");
    await expect(dialog.getByRole("button", { name: "Place bid", exact: true })).toBeInViewport();
    await dialog.getByRole("button", { name: "Cancel" }).tap();
  });
}
