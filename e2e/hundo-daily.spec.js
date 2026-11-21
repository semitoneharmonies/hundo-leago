import { expect, test } from "@playwright/test";

const csrfToken = "D".repeat(43);
const viewer = { id: "manager-1", name: "Harbour Lights", remainingCap: 100, availableCap: 100, reserved: 0, roster: [] };
const player = { id: "p-1", name: "Quinn Hughes", position: "D", team: "MIN", opponent: "VAN", lineupStatus: "projected" };

async function mockDaily(page, phase = "auction", tomorrowStatus = "open", todayStatus = "open", serverNowMs, includeClock = true) {
  const now = serverNowMs ?? Date.now();
  const at = (minutes) => new Date(now + minutes * 60_000).toISOString();
  const slate = { date: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver" }).format(now),
    auctionStartsAt: at(-10), firstGameAt: at(20) };
  const tomorrowNoon = Date.parse(slate.date + "T12:00:00Z") + 86_400_000;
  const tomorrow = { day: "tomorrow", status: tomorrowStatus, date: new Date(tomorrowNoon).toISOString().slice(0, 10),
    auctionStartsAt: tomorrowStatus === "open" ? new Date(tomorrowNoon + 9 * 3_600_000).toISOString() : null,
    firstGameAt: tomorrowStatus === "open" ? new Date(tomorrowNoon + 9.5 * 3_600_000).toISOString() : null };
  const room = {
    ...slate, id: "room-1", name: "Pacific Ice", phase, capacity: 8, memberCount: 2, joined: false,
    commissionerId: "manager-1", canClose: false, winners: [],
    members: [structuredClone(viewer), { ...viewer, id: "manager-2", name: "North Shore", remainingCap: 86,
      availableCap: null, reserved: null, points: 8.5, roster: [{ ...player, id: "p-3", name: "Brock Boeser", price: 14 }] }],
    availablePlayers: [player], bidLimits: { D: { maxAmount: 94, reason: null }, F: { maxAmount: 0, reason: "Forward and flex spots are committed." } },
    auctions: [{ ...player, id: "p-2", name: "Marco Rossi", position: "C",
      ownBid: null, bidCount: 1, endsAt: at(2) }], rules: { minBid: 1, cap: 100, lotSeconds: 120 },
  };
  if (phase === "finished") Object.assign(room, { joined: true, canClose: true, winners: [{ id: "manager-2", name: "North Shore", points: 8.5 }] });
  const writes = [];
  const reads = [];
  let closed = false;
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace("/api/v1", "");
    async function answer(data) {
      const meta = { requestId: "local-fixture" };
      if (path.startsWith("/daily/") && serverNowMs != null && includeClock) meta.serverNowMs = serverNowMs;
      return route.fulfill({ json: { data, meta } });
    }
    if (request.method() === "GET") {
      reads.push(path);
      if (path === "/session") return answer({ csrfToken,
        user: { id: viewer.id, displayName: viewer.name, status: "active", version: 1 },
        session: { id: "session-1", userId: viewer.id, status: "active", version: 1, createdAtMs: 1, lastUsedAtMs: 2, idleExpiresAtMs: 3, absoluteExpiresAtMs: 4 },
      });
      if (path === "/daily/reminders") return answer({ reminders: phase === "waiting" ? [{
        id: "reminder-1", roomId: room.id, roomName: room.name, auctionStartsAt: at(10),
      }] : [] });
      if (path === "/daily/rooms") return answer({ rooms: closed ? [] : [room],
        slate: todayStatus === "open" ? slate : tomorrow.status === "open" ? tomorrow : null, slateUnavailable: false,
        practiceSlate: { ...slate, status: todayStatus === "no_games" ? "no_games" : "available" },
        slateOptions: [{ ...slate, day: "today", status: todayStatus }, tomorrow] });
      if (path === "/daily/rooms/room-1") return answer({ room });
    }
    if (request.method() === "POST" && path.startsWith("/daily/")) {
      const headers = request.headers();
      writes.push({ path, body: request.postDataJSON(), csrf: headers["x-csrf-token"], key: headers["idempotency-key"] });
      if (path.endsWith("/join")) room.joined = true;
      if (path.endsWith("/bids")) {
        const { amount } = request.postDataJSON();
        room.availablePlayers = [];
        room.auctions.push({ ...player, ownBid: amount, bidCount: 1, endsAt: at(2) });
        Object.assign(room.members[0], { reserved: amount, availableCap: 100 - amount });
      }
      if (path === "/daily/rooms") {
        const input = request.postDataJSON();
        room.name = input.name; room.joined = true;
        if (input.mode === "practice") Object.assign(room, {
          mode: "practice", phase: "auction", firstGameAt: at(-90), auctionStartsAt: at(0), auctionEndsAt: at(30),
        });
      }
      if (path.endsWith("/close")) closed = true;
      return answer({ room });
    }
    return route.fulfill({ status: 404, json: { error: { code: "NOT_FOUND", message: "Fixture route missing.", requestId: "local-fixture" } } });
  });
  return { reads, writes, slate, tomorrow, room };
}

test("joins, bids, and switches rosters without a season league request", async ({ page }, testInfo) => {
  const { reads, writes } = await mockDaily(page);
  await page.goto("/daily");
  await expect(page.getByLabel("2 of 8 managers")).toBeVisible();
  await page.getByRole("button", { name: "Join Pacific Ice" }).click();
  await expect(page.getByRole("heading", { name: "Pacific Ice" })).toBeVisible();
  const pool = page.getByRole("region", { name: "Player pool" });
  const live = page.getByRole("region", { name: "Live auctions" });
  const roster = page.getByRole("region", { name: "Roster", exact: true });
  const bounds = await Promise.all([pool, live, roster].map((panel) => panel.boundingBox()));
  expect(bounds[0].y).toBe(bounds[1].y);
  expect(bounds[1].y).toBe(bounds[2].y);
  expect(bounds[0].x).toBeLessThan(bounds[1].x);
  expect(bounds[1].x).toBeLessThan(bounds[2].x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("daily-auction.png"), fullPage: true, animations: "disabled" });
  await expect(live.getByRole("button", { name: "Bid on Marco Rossi" })).toBeDisabled();
  await expect(live.getByRole("button", { name: "Bid on Marco Rossi" })).toHaveAccessibleDescription(/Forward and flex spots are committed/);
  await expect(roster.getByLabel("Manager")).toHaveValue(viewer.id);
  await pool.getByRole("button", { name: "Bid on Quinn Hughes" }).click();
  await expect(page.getByLabel("Sealed bid for Quinn Hughes")).toHaveAttribute("max", "94");
  await expect(page.getByLabel("Sealed bid for Quinn Hughes")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Place bid" })).toBeDisabled();
  await page.getByLabel("Sealed bid for Quinn Hughes").fill("95");
  await expect(page.getByRole("button", { name: "Place bid" })).toBeDisabled();
  expect(writes).toHaveLength(1);
  await page.getByLabel("Sealed bid for Quinn Hughes").fill("12");
  await page.getByRole("button", { name: "Place bid" }).click();
  await expect(live.getByText("Your bid $12")).toBeVisible();
  await expect(roster.getByText("$88")).toBeAttached();
  await roster.getByLabel("Manager").selectOption("manager-2");
  await expect(roster.getByText("Brock Boeser")).toBeVisible();
  await expect(roster.getByText("$14")).toBeVisible();
  expect(writes.map((w) => [w.path, w.csrf])).toEqual([["/daily/rooms/room-1/join", csrfToken], ["/daily/rooms/room-1/bids", csrfToken]]);
  expect(writes[1].body).toEqual({ playerId: "p-1", amount: 12 });
  expect(reads.some((path) => path.startsWith("/leagues"))).toBe(false);
});

test("creates a named room with capacity and displays a due reminder", async ({ page }) => {
  const { writes, slate, tomorrow } = await mockDaily(page, "waiting", "open", "open", Date.parse("2026-11-16T21:00:00Z"));
  await page.goto("/daily");
  await expect(page.getByRole("complementary", { name: "Hundo Daily reminders" })).toBeVisible();
  await page.getByRole("link", { name: "Open a room" }).click();
  await page.getByLabel("Room name").fill("Late Shift");
  await page.getByRole("spinbutton", { name: "Maximum managers", exact: true }).fill("6");
  const gameDay = page.getByRole("combobox", { name: "Game day", exact: true });
  await expect(gameDay).toHaveValue(slate.date);
  await expect(gameDay.getByRole("option", { name: /^Tomorrow · / })).toHaveAttribute("value", tomorrow.date);
  await gameDay.selectOption(tomorrow.date);
  await page.getByLabel("Auction start time", {exact:true}).selectOption(tomorrow.auctionStartsAt);
  await expect(gameDay).toHaveAccessibleDescription(
    "Auction opens 2:00 p.m. PT · Rosters lock 2:30 p.m. PT");
  await page.getByRole("button", { name: "Create room" }).click();
  await page.getByRole("button", { name: "Create tomorrow’s room" }).click();
  await expect(page.getByRole("heading", { name: "Late Shift" })).toBeVisible();
  expect(writes[0].body).toEqual({ name: "Late Shift", capacity: 6, slateDate: tomorrow.date, auctionStartsAt:tomorrow.auctionStartsAt });
  expect(writes[0].key).toBeTruthy();
  await expect(page.getByRole("button", { name: "Bid on Quinn Hughes" })).toHaveCount(0);
});

test("filters the ranked pool, shows six full lots, and keeps all seven signed roster slots", async ({ page }, testInfo) => {
  const { room } = await mockDaily(page);
  room.joined = true;
  room.availablePlayers = [
    ["Auston Matthews", "TOR", "C"], ["Evan Bouchard", "EDM", "D"], ["Artturi Lehkonen", "COL", "L"],
    ["Jake DeBrusk", "VAN", "LW"], ["Jason Robertson", "DAL", "L"], ["Josh Anderson", "MTL", "R"],
    ["Devon Toews", "COL", "D"], ["Mattias Ekholm", "EDM", "D"], ["Mikko Rantanen", "DAL", "R"],
  ].map(([name, team, position], i) => ({ id: "available-" + i, name, team, position, opponent: "NYI" }));
  room.auctions = [
    ["Nick Suzuki", "MTL", "C", "TOR", 14], ["Cale Makar", "COL", "D", "DAL"], ["Connor McDavid", "EDM", "C", "VAN"],
    ["Elias Pettersson", "VAN", "C", "EDM"], ["Cole Caufield", "MTL", "RW", "TOR", 9],
    ["Miro Heiskanen", "DAL", "D", "COL"], ["Victor Hedman", "TBL", "D", "CAR"],
  ].map(([name, team, position, opponent, ownBid], i) => ({ id: "lot-" + i, name, team, position, opponent,
    ownBid: ownBid ?? null, bidCount: i + 1, endsAt: room.auctions[0].endsAt }));
  Object.assign(room.members[0], { reserved: 23, availableCap: 47, remainingCap: 70,
    roster: [{ ...player, name: "William Nylander", position: "R", price: 18 }, { ...player, id: "d1", name: "Morgan Rielly", price: 12 }] });
  room.bidLimits.F = { maxAmount: 45, reason: null };
  await page.goto("/daily/rooms/room-1");
  const pool = page.getByRole("region", { name: "Player pool", exact: true });
  const auctions = page.getByRole("region", { name: "Live auctions", exact: true });
  const roster = page.getByRole("region", { name: "Roster", exact: true });
  const players = pool.getByRole("listitem");
  await expect(players.first()).toContainText("Auston Matthews");
  await expect(players).toHaveCount(9);
  await expect(pool).not.toContainText(/\bFP\b/);
  await pool.getByRole("button", { name: "Defence", exact: true }).click();
  await expect(players).toHaveCount(3);
  await pool.getByRole("combobox", { name: "NHL team" }).selectOption("EDM");
  await expect(players).toHaveCount(2);
  await pool.getByRole("searchbox").fill("ekho");
  await expect(players).toHaveCount(1);
  await expect(players.first()).toContainText("Mattias Ekholm");
  await pool.getByRole("searchbox").fill("");
  await pool.getByRole("button", { name: "All positions" }).click();
  await pool.getByRole("combobox", { name: "NHL team" }).selectOption("all");
  const cards = auctions.getByRole("listitem");
  await expect(cards).toHaveCount(7);
  await expect(cards.first()).toContainText("MTL · F vs TOR");
  await expect(cards.first().getByText("Your bid $14")).toBeAttached();
  await expect(cards.first().getByRole("button", { name: "Bid on Nick Suzuki" })).toHaveCount(0);
  await expect(cards.nth(1).getByRole("button", { name: "Bid on Cale Makar" })).toBeAttached();
  const rows = roster.locator("tbody tr");
  await expect(rows).toHaveCount(7);
  await expect(rows.nth(0)).toContainText("William Nylander");
  await expect(rows.nth(1).locator("td").first()).toBeEmpty();
  await expect(rows.nth(3)).toContainText("Morgan Rielly");
  await expect(rows.nth(5)).toContainText("Flex 1");
  if (testInfo.project.name === "desktop") {
    const viewport = await auctions.locator("ul").boundingBox();
    const sixth = await cards.nth(5).boundingBox();
    const seventh = await cards.nth(6).boundingBox();
    expect(sixth.y + sixth.height).toBeLessThanOrEqual(viewport.y + viewport.height + 1);
    expect(seventh.y).toBeGreaterThanOrEqual(viewport.y + viewport.height);
    const list = await pool.locator("ul").boundingBox();
    const eighth = await players.nth(7).boundingBox();
    expect(eighth.y + eighth.height).toBeLessThanOrEqual(list.y + list.height + 1);
  }
  await page.screenshot({ path: testInfo.outputPath("approved-auction-board.png"), fullPage: true, animations: "disabled" });
  if (testInfo.project.name === "mobile") {
    const viewportWidth = page.viewportSize().width;
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewportWidth);
    expect(await page.evaluate(() => innerWidth)).toBe(viewportWidth);
    await page.getByRole("navigation", { name: "Auction panels" }).getByRole("link", { name: "Auctions" }).click();
    await expect(auctions.getByRole("heading")).toBeInViewport();
  }
  await cards.last().scrollIntoViewIfNeeded();
  await expect(cards.last()).toBeInViewport();
});

test("a two-minute lot ticks on server time with the device one hour ahead", async ({ page }) => {
  const serverNowMs = Date.parse("2026-11-17T00:00:00Z");
  const siteClockRequests = [];
  page.on("request", request => {
    if (request.method() === "HEAD" && request.url().endsWith("/manifest.webmanifest")) siteClockRequests.push(request);
  });
  await page.clock.install({ time: serverNowMs + 3_600_000 });
  await mockDaily(page, "auction", "open", "open", serverNowMs);
  await page.goto("/daily/rooms/room-1");
  const lot = page.getByRole("region", { name: "Live auctions" }).locator("time");
  await expect(lot).toHaveText(/^(02:00|01:59)$/);
  await page.clock.runFor(3500);
  await expect(lot).toHaveText(/^01:5[56]$/);
  expect(siteClockRequests).toHaveLength(0);
});

test("older Daily responses share one same-origin clock check with the device one hour ahead", async ({ page }) => {
  const serverNowMs = Date.parse("2026-11-17T00:00:00Z");
  await page.clock.install({ time: serverNowMs + 3_600_000 });
  await mockDaily(page, "auction", "open", "open", serverNowMs, false);
  const siteClockRequests = [];
  await page.route("**/manifest.webmanifest", route => {
    if (route.request().method() !== "HEAD") return route.continue();
    siteClockRequests.push(route.request().url());
    return route.fulfill({ status: 200, headers: { date: new Date(serverNowMs).toUTCString() } });
  });
  await page.goto("/daily/rooms/room-1");
  const lot = page.getByRole("region", { name: "Live auctions" }).locator("time");
  await expect(lot).toHaveText(/^(02:00|01:59)$/);
  await page.clock.runFor(3500);
  await expect(lot).toHaveText(/^01:5[56]$/);
  expect(siteClockRequests).toEqual([new URL("/manifest.webmanifest", page.url()).href]);
});

test("a due reminder remains visible until server auction time with the device one hour ahead", async ({ page }) => {
  const serverNowMs = Date.parse("2026-11-16T23:30:00Z");
  await page.clock.install({ time: serverNowMs + 3_600_000 });
  await mockDaily(page, "waiting", "open", "open", serverNowMs);
  await page.goto("/daily");
  const reminder = page.getByRole("complementary", { name: "Hundo Daily reminders" });
  await expect(reminder).toContainText("4:40 p.m. PT");
  await page.clock.fastForward(9 * 60_000);
  await expect(reminder).toBeVisible();
  await page.clock.fastForward(61_000);
  await expect(reminder).toHaveCount(0);
});

test("a tomorrow slate with no games cannot create a room for another day", async ({ page }) => {
  const { writes, slate, tomorrow } = await mockDaily(page, "waiting", "no_games", "open", Date.parse("2026-11-19T19:00:00Z"));
  slate.auctionStartsAt = "2026-11-19T19:15:00Z";
  slate.firstGameAt = "2026-11-19T19:45:00Z";
  await page.goto("/daily");
  await page.getByRole("link", { name: "Open a room" }).click();
  await page.getByLabel("Room name").fill("Tomorrow only");
  const day = page.getByRole("combobox", { name: "Game day", exact: true });
  await day.selectOption(tomorrow.date);
  await expect(day).toHaveAccessibleDescription("No NHL games are scheduled for this day.");
  await expect(page.getByRole("button", { name: "Create room" })).toBeDisabled();
  expect(writes).toHaveLength(0);
  await day.selectOption(slate.date);
  await expect(page.getByRole("button", { name: "Create room" })).toBeDisabled();
  await page.getByLabel("Auction start time",{exact:true}).selectOption(slate.auctionStartsAt);
  await expect(page.getByRole("button", { name: "Create room" })).toBeEnabled();
});

test("starts practice with today's games after the scheduled room deadline", async ({ page }) => {
  const { writes, slate } = await mockDaily(page, "locked", "open", "locked");
  await page.goto("/daily");
  await page.getByRole("link", { name: "Practice now" }).click();
  await page.getByLabel("Room name").fill("Monday practice");
  await expect(page.getByText(/Bidding starts immediately and lasts 30 minutes/)).toBeVisible();
  await page.getByRole("button", { name: "Start practice room" }).click();
  await expect(page.getByRole("heading", { name: "Monday practice" })).toBeVisible();
  await expect(page.getByText("Practice roster lock", { exact: true })).toBeVisible();
  await expect(page.getByText(/Practice scoring includes stats from the full day/)).toBeVisible();
  expect(writes[0].body).toEqual({ name: "Monday practice", capacity: 8, mode: "practice", slateDate: slate.date });
});

test("days without games offer neither scheduled nor practice room creation", async ({ page }) => {
  await mockDaily(page, "locked", "no_games", "no_games");
  await page.goto("/daily");
  await expect(page.getByText(/^Tomorrow · .*No NHL games/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Practice now" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open a room" })).toHaveCount(0);
});

test("displays the locked winner until the commissioner confirms closure", async ({ page }) => {
  const { writes } = await mockDaily(page, "finished");
  await page.goto("/daily/rooms/room-1");
  const winner = page.getByRole("status").filter({ hasText: "Room winner" });
  await expect(winner).toContainText("North Shore");
  await expect(winner).toContainText("8.50 FP");
  await expect(page.getByRole("button", { name: /^Bid on/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Close room" }).click();
  await page.getByRole("button", { name: "Confirm close" }).click();
  await expect(page.getByRole("heading", { name: "Rooms", exact: true })).toBeVisible();
  expect(writes.map((w) => w.path)).toEqual(["/daily/rooms/room-1/close"]);
});

test("switches a full room to locked scoring before puck drop without announcing a winner", async ({ page }) => {
  const { room, writes } = await mockDaily(page);
  room.joined = true;
  await page.goto("/daily/rooms/room-1");
  await expect(page.getByRole("region", { name: "Player pool" })).toBeVisible();
  room.members = room.members.map(member => ({ ...member, points: 0, reserved: 0,
    roster: ["F", "F", "F", "D", "D", "F", "F"].map((position, index) => ({
      ...player, id: member.id + index, name: "Signed skater " + index, position, price: 1, points: 0,
    })),
  }));
  Object.assign(room, { phase: "locked", auctionEndsAt: new Date().toISOString(), auctions: [], availablePlayers: [] });
  expect(Date.parse(room.firstGameAt)).toBeGreaterThan(Date.now());
  await expect(page.getByText("Rosters locked", { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "Room standings" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Player pool" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Bid on/ })).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: "Room winner" })).toHaveCount(0);
  await expect(page.getByRole("table", { name: /Your roster slots/ }).locator("tbody tr")).toHaveCount(7);
  expect(writes).toEqual([]);
});

test("removes the open auction board when an administrator closes it elsewhere", async ({ page }) => {
  await mockDaily(page);
  await page.goto("/daily");
  await page.getByRole("button", { name: "Join Pacific Ice" }).click();
  await expect(page.getByRole("heading", { name: "Pacific Ice" })).toBeVisible();
  await page.route("**/api/v1/daily/rooms/room-1", (route) => route.fulfill({ status: 410,
    json: { error: { code: "DAILY_ROOM_CLOSED", message: "This room has been closed.", requestId: "closed-fixture" } },
  }));
  await expect(page.getByRole("alert")).toContainText("This room has been closed.", { timeout: 10_000 });
  await expect(page.getByRole("region", { name: "Player pool" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "All rooms" })).toHaveAttribute("href", "/daily");
});

test("joined rooms stack independently and preserve the server's player order through filters", async ({ page }) => {
  const { room } = await mockDaily(page);
  room.joined = true;
  room.availablePlayers = [
    { ...player, id: "z", name: "Zach Werenski", team: "CBJ" },
    { ...player, id: "a", name: "Adam Fox", team: "NYR" },
    { ...player, id: "f", name: "Jason Robertson", position: "LW", team: "DAL" },
  ];
  const other = { ...room, id: "room-2", name: "Late Skate" };
  const meta = { requestId: "multiroom-fixture", serverNowMs: Date.now() };
  await page.route("**/api/v1/daily/rooms", route => route.fulfill({ json: { data: { rooms: [other, room] }, meta } }));
  await page.route("**/api/v1/daily/rooms/room-2", route => route.fulfill({ json: { data: { room: other }, meta } }));
  await page.goto("/daily/rooms/room-1");
  const first = page.getByRole("article", { name: "Pacific Ice" });
  const second = page.getByRole("article", { name: "Late Skate" });
  const secondBox = await second.boundingBox();
  const firstBox = await first.boundingBox();
  expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height + 15);
  const pool = first.getByRole("region", { name: "Player pool" });
  await expect(pool.locator(".hda-pool-name")).toHaveText(["Zach Werenski", "Adam Fox", "Jason Robertson"]);
  await pool.getByRole("button", { name: "Defence" }).click();
  await expect(pool.locator(".hda-pool-name")).toHaveText(["Zach Werenski", "Adam Fox"]);
  await pool.getByLabel("NHL team").selectOption("NYR");
  await expect(pool.locator(".hda-pool-name")).toHaveText(["Adam Fox"]);
  await expect(second.locator(".hda-pool-name")).toHaveCount(3);
  await expect(first.getByRole("table", { name: /Roster slots/ }).locator("tbody tr")).toHaveCount(7);
  expect(await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll("[id]"), node => node.id);
    return ids.length === new Set(ids).size;
  })).toBe(true);
});
