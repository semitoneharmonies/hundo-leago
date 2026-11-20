import { expect, test } from "@playwright/test";
import { SCORING_CATEGORIES } from "../src/shared/scoringCategories.js";

const viewer = { id: "grae", displayName: "Grae", status: "active", version: 1 };
const date = "2026-11-17";
const opens = "2026-11-17T23:30:00Z";
const puck = "2026-11-18T00:00:00Z";
const tomorrow = { date, day: "tomorrow", status: "open", auctionStartsAt: opens, firstGameAt: puck };
const summary = { id: "pacific", name: "Pacific Ice", mode: "scheduled", date, phase: "waiting",
  commissionerId: viewer.id, commissionerName: "Grae", joined: true, canClose: false, memberCount: 3, capacity: 8,
  auctionStartsAt: opens, firstGameAt: puck, auctionEndsAt: puck, winners: [] };
const stats = (values = {}) => Object.fromEntries(SCORING_CATEGORIES.map(({ key }) => [key, values[key] ?? 0]));
const player = (id, name, position, points, values, statsStatus = "collected") => ({ id, name, position, price: 8, points,
  scoringStats: values ? stats(values) : null, statsStatus, gamesCollected: statsStatus === "collected" ? 1 : 0, gamesExpected: 1 });
const members = [
  { id: viewer.id, name: "Grae", roster: [player("wn","William Nylander","RW",12.75,{evenStrengthGoals:2,primaryAssists:3}), player("mr","Morgan Rielly","D",6.5,{evenStrengthGoals:1,hits:10}), player("cm","Cale Makar","D",0,null,"pending")], points: 19.25, spent:24, remainingCap: 76 },
  { id: "taylor", name: "Taylor", roster: [player("cmc","Connor McDavid","C",22.50,{primaryAssists:10}), player("zero","Zero Point Skater","F",0,{})], points: 22.5, spent:16, remainingCap: 84 },
  { id: "morgan", name: "Morgan", roster: [player("ns","Nick Suzuki","C",14,{evenStrengthGoals:4,shotsOnGoal:10})], points: 14, spent:8, remainingCap: 92 },
];
async function installRooms(page, phase = "waiting", tie = false, options = {}) {
  const detail = { ...summary, phase, members: structuredClone(members), availablePlayers: [], auctions: [], rules: { cap: 100, minBid: 1 } };
  if (options.salaryEvidence) {
    detail.members[0].spent = 31;
    delete detail.members[1].spent;
    detail.members[2].spent = -1;
  }
  if (options.incompleteStats) {
    Object.assign(detail.members[0].roster[0], { statsStatus:"partial", gamesCollected:1, gamesExpected:2 });
    Object.assign(detail.members[0].roster[1], { statsStatus:"unavailable", scoringStats:null, gamesCollected:0 });
  }
  if (phase === "finished") {
    detail.canClose = true;
    detail.members[0].roster[2].points = 10;
    Object.assign(detail.members[0].roster[2], { scoringStats: stats({evenStrengthGoals:1,hits:20}), statsStatus:"collected", gamesCollected:1 });
    detail.members[0].points = 29.25;
    detail.members[1].points = tie ? 29.25 : 27.50;
    detail.members[1].roster[0].points = detail.members[1].points;
    detail.members[1].roster[0].scoringStats = stats(tie ? {evenStrengthGoals:9,primaryAssists:1} : {evenStrengthGoals:8,secondaryAssists:2});
    detail.members[2].points = 23;
    detail.members[2].roster[0].points = 23;
    detail.members[2].roster[0].scoringStats = stats({evenStrengthGoals:7,shotsOnGoal:10});
    detail.winners = detail.members.filter(m => m.points === 29.25).map(({ id,name,points }) => ({ id,name,points }));
  }
  for (const member of detail.members) {
    member.scoringStats = stats();
    member.statsCollection = {collected:0,partial:0,pending:0,unavailable:0,total:member.roster.length};
    for (const item of member.roster) {
      member.statsCollection[item.statsStatus]++;
      for (const { key } of SCORING_CATEGORIES) member.scoringStats[key] += item.scoringStats?.[key] ?? 0;
    }
    member.statsStatus = member.statsCollection.collected === member.statsCollection.total ? "collected" : "partial";
  }
  detail.scoringCategories = SCORING_CATEGORIES.map(({ key, abbreviation, label }) => ({ key, abbreviation, label }));
  if (options.legacy) for (const member of detail.members) {
    delete member.scoringStats; delete member.statsStatus; delete member.statsCollection;
    for (const item of member.roster) { delete item.scoringStats; delete item.statsStatus; }
  }
  const actor = options.spectator ? {...viewer,id:"admin-spectator"} : viewer;
  const otherNames = [["north","North Shore","Taylor",4,8],["blue","The Blue Line","Morgan",1,6],["last","Last Shift","Jamie",6,6]];
  const rooms = [{ ...summary, phase, winners: detail.winners }, ...otherNames.map(([id,name,commissionerName,memberCount,capacity]) => ({
    ...summary, id, name, joined: false, commissionerId: id, commissionerName, memberCount, capacity,
  }))];
  const reads = [];
  await page.route("**/api/v1/**", async route => {
    const { pathname } = new URL(route.request().url());
    expect(route.request().method()).toBe("GET");
    reads.push(pathname);
    if (pathname === "/api/v1/daily/rooms/pacific") options.onRoomRead?.(detail);
    const values = {
      "/api/v1/session": { csrfToken: "D".repeat(43), user: actor, session: { id: "session-1", userId: actor.id,
        status: "active", version: 1, createdAtMs: 1, lastUsedAtMs: 2, idleExpiresAtMs: 3, absoluteExpiresAtMs: 4 } },
      "/api/v1/daily/reminders": { reminders: [] },
      "/api/v1/daily/rooms": { rooms, slate: tomorrow, slateOptions: [tomorrow], practiceSlate: { date: "2026-11-16", firstGameAt: "2026-11-16T23:00:00Z", status: "available" } },
      "/api/v1/daily/rooms/pacific": { room: detail },
    };
    if (!(pathname in values)) return route.fulfill({status:404, json:{error:{code:"NOT_FOUND",message:"Unknown fixture",requestId:"screen"}}});
    return route.fulfill({json:{data:values[pathname],meta:{requestId:"screen",serverNowMs:Date.parse("2026-11-17T03:00:00Z")}}});
  });
  return reads;
}

test('live room stats correct, reconcile and retain all categories without an early winner', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-11-17T03:00:00Z') });
  let feed = 'live';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await installRooms(page, 'locked', false, { onRoomRead(room) {
    const official = feed === 'official';
    room.live = official ? undefined : { status: feed === 'stale' ? 'stale' : 'fresh', updatedAtMs: Date.parse('2026-11-17T02:59:00Z'), provisionalGameCount: 1 };
    const manager = room.members[0];
    manager.live = official ? undefined : { provisional: true, officialPoints: 0 };
    const total = feed === 'corrected' ? 0.6 : official ? 0.8 : 1;
    manager.points = total;
    manager.scoringStats = stats({ shotsOnGoal: total * 5 });
    manager.statsStatus = official ? 'collected' : 'pending';
    manager.roster = [{ id: 'live-player', name: 'Live Skater', team: 'BOS', position: 'F', price: 8, points: total, scoringStats: stats({ shotsOnGoal: total * 5 }),
      statsStatus: official ? 'collected' : 'pending', gamesCollected: official ? 1 : 0, gamesExpected: 1,
      live: official ? undefined : { provisional: true, officialPoints: 0, gameIds: ['2026020344'] } }];
  } });
  await page.goto('/daily/rooms/pacific');
  const notice = page.locator('.hds-live-scoring');
  const row = page.getByRole('table', { name: 'Manager rankings' }).getByRole('row').filter({ has: page.getByRole('button', { name: 'Grae (you)' }) });
  await expect(notice).toContainText('Provisional scores');
  await expect(row.locator('.hds-fp')).toHaveText('1.00');
  await expect(row.getByRole('img', { name: /^Provisional stats/ })).toHaveAttribute('data-status', 'provisional');
  await page.getByRole('button', { name: 'Grae (you)' }).click();
  const roster = page.getByRole('table', { name: 'Roster for Grae' });
  await expect(roster.getByRole('columnheader')).toHaveCount(18);
  await expect(roster.getByRole('row').filter({ hasText: 'Live Skater' })).toContainText('5');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('live-daily-scores.png'), fullPage: false });
  feed = 'corrected';
  await page.clock.fastForward(30_001);
  await expect(row.locator('.hds-fp')).toHaveText('0.60');
  feed = 'stale';
  await page.clock.fastForward(30_001);
  await expect(notice).toContainText('Live updates delayed');
  feed = 'official';
  await page.clock.fastForward(30_001);
  await expect(row.locator('.hds-fp')).toHaveText('0.80');
  await expect(notice).toHaveCount(0);
  await expect(row.getByRole('img', { name: /^Stats collected/ })).toHaveAttribute('data-status', 'collected');
  await expect(page.getByText('Room winner', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('official-daily-scores.png'), fullPage: false });
  expect(errors).toEqual([]);
});

test("lobby separates membership and available seats, and previews a scheduled room", async ({ page }, testInfo) => {
  const reads = await installRooms(page);
  await page.goto("/daily");
  const joined = page.getByRole("region", { name: "Your rooms" });
  const other = page.getByRole("region", { name: "Other rooms" });
  await expect(joined.getByRole("link", {name:"View room"})).toHaveAttribute("href","/daily/rooms/pacific");
  await expect(other.getByRole("button", {name:"Join North Shore"})).toBeEnabled();
  await expect(other.getByRole("button", {name:"Full"})).toBeDisabled();
  await expect(other.getByText("Jamie")).toBeVisible();
  expect(reads.filter(path => path.startsWith("/api/v1/daily/rooms/"))).toEqual([]);
  await page.screenshot({path:testInfo.outputPath("02-room-lobby.png"),fullPage:true,animations:"disabled"});
  await page.getByRole("link",{name:"Open a room"}).click();
  await page.getByLabel("Room name").fill("Pacific Ice");
  await page.getByRole("button",{name:"Increase maximum managers"}).click();
  await expect(page.getByLabel("Maximum managers",{exact:true})).toHaveValue("9");
  await page.getByRole("button",{name:"Decrease maximum managers"}).click();
  await page.getByLabel("Auction start time",{exact:true}).selectOption(opens);
  const preview = page.getByRole("complementary",{name:"Room preview"});
  await expect(preview.getByRole("heading",{name:"Pacific Ice"})).toBeVisible();
  await expect(preview.getByText("1/8")).toBeVisible();
  await expect(preview.getByText("Reminder at 4:20 p.m. PT")).toBeVisible();
  await page.screenshot({path:testInfo.outputPath("03-create-room.png"),fullPage:true,animations:"disabled"});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button",{name:"Cancel"}).click();
  await expect(joined).toBeVisible();
});

for(const phase of ["locked","finished"]) {
  test("shows " + phase + " stat totals with expandable teams and a fixed own roster", async ({ page }, testInfo) => {
    await installRooms(page,phase);
    await page.goto("/daily/rooms/pacific");
    const roster = page.getByRole("region",{name:"Your roster",exact:true});
    const ranks = page.getByRole("table",{name:"Manager rankings"});
    const headers = ranks.locator(":scope > thead > tr > th");
    await expect(headers).toHaveCount(SCORING_CATEGORIES.length + 5);
    expect((await headers.allTextContents()).slice(0,3)).toEqual(["Rank","Stats","Manager"]);
    expect((await headers.allTextContents()).slice(-2)).toEqual(["Salary","Total FP"]);
    const legend = page.getByRole("group",{name:"Stats collection legend"});
    await expect(legend.getByText("Collected",{exact:true})).toBeVisible();
    await expect(legend.getByText("Pending",{exact:true})).toBeVisible();
    const ownRank = ranks.getByRole("row",{name:/Grae \(you\)/});
    await expect(ownRank.locator(":scope > .hds-salary-total")).toHaveText("$24");
    const managerStatus = ownRank.locator(":scope > .hds-status-column").getByRole("img");
    await expect(managerStatus).toHaveAttribute("aria-label", phase === "locked" ? "Stats pending: partially collected" : "Stats collected");
    await expect(managerStatus).toHaveCSS("background-color",phase === "locked" ? "rgb(240, 204, 99)" : "rgb(133, 214, 175)");
    await expect(ownRank.getByRole("rowheader")).not.toContainText("Stats");
    if (testInfo.project.name === "mobile") await expect(ranks.getByRole("columnheader",{name:"Total FP",exact:true})).toBeInViewport();
    await expect(roster.getByRole("combobox")).toHaveCount(0);
    await expect(roster.locator("tbody tr")).toHaveCount(7);
    const playerRow = roster.getByRole("row",{name:/Cale Makar/});
    await expect(playerRow).toContainText(phase === "locked" ? "0.00" : "10.00");
    const playerStatus = playerRow.getByRole("img",{name:phase === "locked" ? /^Stats pending/ : /^Stats collected/});
    await expect(playerStatus).toBeVisible();
    await expect(playerStatus).toHaveAttribute("data-status",phase === "locked" ? "pending" : "collected");
    await expect(playerStatus).toHaveCSS("background-color",phase === "locked" ? "rgb(240, 204, 99)" : "rgb(133, 214, 175)");
    await expect(playerStatus).toHaveCSS("border-radius","50%");
    const ownTotal = roster.locator("tfoot .hds-team-total");
    await expect(roster.locator("tfoot .hds-salary-total")).toHaveText("$24");
    expect((await roster.locator("thead th").allTextContents()).slice(-3)).toEqual(["Stats","Salary","FP"]);
    await expect(ownTotal).toHaveText(phase === "locked" ? "19.25 FP" : "29.25 FP");
    await expect(ownTotal).toHaveCSS("color","rgb(185, 235, 212)");
    await expect(ownTotal).toHaveCSS("font-weight","700");
    await page.evaluate(() => document.fonts.ready);
    expect(await roster.getByRole("region",{name:"Your roster details"}).evaluate(region => {
      const visible = region.getBoundingClientRect();
      return [...region.querySelectorAll(".hds-fp,.hds-team-total,.hds-salary-total")].every(cell => {
        const text = document.createRange();
        text.selectNodeContents(cell);
        const bounds = text.getBoundingClientRect();
        return bounds.left >= visible.left && bounds.right <= visible.right;
      });
    }), "Own-roster salary and FP totals fit without horizontal scrolling").toBe(true);
    await expect(roster.getByText("Empty slots earn no points.",{exact:false})).toHaveCount(0);
    await expect(page.getByText(phase === "locked" ? "3.25 FP behind Taylor" : "Won by 1.75 FP")).toBeVisible();
    if (phase === "locked") await expect(page.getByRole("button",{name:"Close room"})).toHaveCount(0);
    else await expect(page.getByRole("button",{name:"Close room"})).toBeVisible();
    await page.screenshot({path:testInfo.outputPath(phase === "locked" ? "04-room-standings.png" : "05-final-result.png"),fullPage:true,animations:"disabled"});
    await ranks.getByRole("button",{name:"Taylor"}).click();
    const expanded = page.getByRole("table",{name:"Roster for Taylor",exact:true});
    await expect(ranks.locator(".hds-expanded-roster").filter({has:expanded}).locator(":scope > td")).toHaveAttribute("colspan",String(SCORING_CATEGORIES.length + 5));
    await expect(expanded.locator("tfoot .hds-salary-total")).toHaveText("$16");
    expect((await expanded.locator("thead th").allTextContents()).slice(-3)).toEqual(["Stats","Salary","FP"]);
    await expect(expanded.getByText("Connor McDavid")).toBeVisible();
    await expect(expanded.getByRole("row",{name:/Zero Point Skater/})).toContainText("0.00");
    await expect(expanded.getByRole("row",{name:/Zero Point Skater/}).getByRole("img",{name:/^Stats collected/})).toBeVisible();
    await expect(roster.getByText("William Nylander")).toBeVisible();
    await expect(roster.getByText("Connor McDavid")).toHaveCount(0);
    await page.screenshot({path:testInfo.outputPath("expanded-"+phase+".png"),fullPage:true,animations:"disabled"});
    await expect(playerRow).toContainText("$8");
    expect(await playerRow.locator(".hds-fp").evaluate(node => Number(getComputedStyle(node).fontWeight))).toBeGreaterThanOrEqual(700);
    await expect(playerRow.locator(".hds-fp")).toHaveCSS("font-family",/Sora/);
    await expect(playerRow.locator(".hds-fp")).toHaveCSS("color","rgb(210, 155, 196)");
    await expect(ownRank.locator(":scope > .hds-fp")).toHaveCSS("font-weight","700");
    await expect(ownRank.locator(":scope > .hds-fp")).toHaveCSS("font-family",/Sora/);
    await expect(ownRank.locator(":scope > .hds-fp")).toHaveCSS("color","rgb(210, 155, 196)");
    expect(await ownTotal.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThan(await playerRow.locator(".hds-fp").evaluate(node => parseFloat(getComputedStyle(node).fontSize)));
    await expect(ranks.getByRole("button",{name:"Taylor"})).toHaveAttribute("aria-expanded","true");
    await ranks.getByRole("button",{name:"Taylor"}).click();
    await expect(expanded).toHaveCount(0);
    const tableHead = ranks.locator("thead").first();
    for (const { abbreviation } of SCORING_CATEGORIES) await expect(tableHead).toContainText(abbreviation);
    const rankingsBox = await page.getByRole("region",{name:phase === "locked" ? "Room standings" : "Final standings",exact:true}).boundingBox();
    const rosterBox = await roster.boundingBox();
    if (testInfo.project.name === "mobile") expect(rosterBox.y).toBeGreaterThan(rankingsBox.y + rankingsBox.height);
    else expect(rankingsBox.width).toBeGreaterThan(rosterBox.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("legacy scores stay visible without inventing collected stats or another user's own roster", async ({page}) => {
  await installRooms(page,"locked",false,{legacy:true,spectator:true});
  await page.goto("/daily/rooms/pacific");
  const own = page.getByRole("region",{name:"Your roster",exact:true});
  await expect(own.getByText("William Nylander")).toHaveCount(0);
  await page.getByRole("button",{name:"Taylor",exact:true}).click();
  const expanded = page.getByRole("table",{name:"Roster for Taylor",exact:true});
  await expect(expanded.getByRole("row",{name:/Connor McDavid/})).toContainText("22.50");
  await expect(expanded.getByRole("row",{name:/Connor McDavid/})).toContainText("—");
  await expect(expanded.getByRole("row",{name:/Connor McDavid/}).getByRole("img")).toHaveAttribute("aria-label",/^Stats pending: details unavailable/);
  await expect(expanded.locator('[data-status="collected"]')).toHaveCount(0);
});

test("partial and unavailable player details use pending dots", async ({page}) => {
  await installRooms(page,"locked",false,{incompleteStats:true});
  await page.goto("/daily/rooms/pacific");
  const roster = page.getByRole("region",{name:"Your roster",exact:true});
  const partial = roster.getByRole("row",{name:/William Nylander/}).getByRole("img");
  const unavailable = roster.getByRole("row",{name:/Morgan Rielly/}).getByRole("img");
  await expect(partial).toHaveAttribute("aria-label","Stats pending: partially collected (1 of 2 games)");
  await expect(unavailable).toHaveAttribute("aria-label","Stats pending: details unavailable (0 of 1 games)");
  for (const status of [partial,unavailable]) {
    await expect(status).toHaveAttribute("data-status","pending");
    await expect(status).toHaveCSS("background-color","rgb(240, 204, 99)");
    await expect(status).toHaveAttribute("title",await status.getAttribute("aria-label"));
  }
});

test("preserves a joint final winner and competition ranks",async({page})=>{
  await installRooms(page,"finished",true);
  await page.goto("/daily/rooms/pacific");
  const result=page.getByRole("status").filter({hasText:"Joint winners"});
  await expect(result).toContainText("Grae & Taylor");
  await expect(page.getByText("Tied for first")).toBeVisible();
  const rows=page.getByRole("table",{name:"Manager rankings"}).getByRole("row");
  await expect(rows.filter({hasText:"Grae"}).getByRole("cell").first()).toHaveText("1");
  await expect(rows.filter({hasText:"Taylor"}).getByRole("cell").first()).toHaveText("1");
  await expect(rows.filter({hasText:"Morgan"}).getByRole("cell").first()).toHaveText("3");
});

test("salary totals use reported spend and do not invent unavailable totals", async ({page}) => {
  await installRooms(page,"locked",false,{salaryEvidence:true});
  await page.goto("/daily/rooms/pacific");
  const ranks = page.getByRole("table",{name:"Manager rankings"});
  await expect(ranks.getByRole("row",{name:/Grae \(you\)/}).locator(".hds-salary-total")).toHaveText("$31");
  for (const name of ["Taylor","Morgan"]) await expect(ranks.getByRole("row",{name:new RegExp(name)}).locator(".hds-salary-total")).toHaveText("—");
  await expect(page.getByRole("region",{name:"Your roster",exact:true}).locator("tfoot .hds-salary-total")).toHaveText("$31");
  await ranks.getByRole("button",{name:"Taylor",exact:true}).click();
  await expect(page.getByRole("table",{name:"Roster for Taylor",exact:true}).locator("tfoot .hds-salary-total")).toHaveText("—");
});

for (const [width,height] of [[568,320],[667,375],[844,390],[932,430]]) {
  test(`landscape ${width}x${height} fits every standings and player stat column`, async ({page},testInfo) => {
    test.skip(!testInfo.project.use.isMobile,"Landscape coverage uses the mobile browser context.");
    await page.setViewportSize({width,height});
    await installRooms(page,"locked");
    await page.goto("/daily/rooms/pacific");
    const ranks = page.getByRole("table",{name:"Manager rankings"});
    await expect(ranks).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    async function expectTableFits(table,label) {
      expect(await table.evaluate((table,statHeaders) => {
        const region = table.closest(".hds-table-scroll");
        const visible = region.getBoundingClientRect();
        const tableBounds = table.getBoundingClientRect();
        const problems = [];
        if (region.scrollWidth > region.clientWidth + 1) problems.push("region scrolls horizontally");
        if (tableBounds.left < visible.left - 1 || tableBounds.right > visible.right + 1) problems.push("table exceeds visible region");
        const cells = table.querySelectorAll(":scope > thead > tr > th, :scope > tbody > tr:not(.hds-expanded-roster) > :is(th,td), :scope > tfoot > tr > :is(th,td)");
        for (const cell of cells) {
          const cellBounds = cell.getBoundingClientRect();
          const style = getComputedStyle(cell);
          const text = cell.textContent.trim();
          if (!cellBounds.width || !cellBounds.height || style.visibility === "hidden") problems.push(`hidden cell: ${text}`);
          const nodes = document.createTreeWalker(cell,NodeFilter.SHOW_TEXT);
          while (nodes.nextNode()) {
            if (!nodes.currentNode.textContent.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(nodes.currentNode);
            if (cell.parentElement.parentElement.tagName === "THEAD" && statHeaders.includes(text) && range.getClientRects().length !== 1) problems.push(`wrapped stat heading: ${text}`);
            for (const bounds of range.getClientRects()) {
              if (bounds.left < visible.left - 1 || bounds.right > visible.right + 1 || bounds.left < cellBounds.left - 1 || bounds.right > cellBounds.right + 1) problems.push(`clipped text: ${text}`);
            }
          }
          for (const dot of cell.querySelectorAll(".hds-stats-status")) {
            const bounds = dot.getBoundingClientRect();
            if (!bounds.width || bounds.left < cellBounds.left - 1 || bounds.right > cellBounds.right + 1) problems.push("clipped status dot");
          }
        }
        return problems;
      },SCORING_CATEGORIES.map(({abbreviation})=>abbreviation)),label).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),"No document horizontal overflow").toBe(true);
    }

    await expect(ranks.locator(":scope > thead > tr > th")).toHaveCount(SCORING_CATEGORIES.length + 5);
    for (const {abbreviation} of SCORING_CATEGORIES) await expect(ranks.getByRole("columnheader",{name:abbreviation,exact:true})).toBeVisible();
    await expect(ranks.getByRole("columnheader",{name:"Total FP",exact:true})).toBeVisible();
    await expect(ranks.getByRole("columnheader",{name:"Stats",exact:true})).toBeVisible();
    await expect(ranks.getByRole("columnheader",{name:"Salary",exact:true})).toBeVisible();
    await page.screenshot({path:testInfo.outputPath(`landscape-${width}x${height}-standings.png`),fullPage:true,animations:"disabled"});
    await expectTableFits(ranks,"All standings columns and text fit in landscape");

    await ranks.getByRole("button",{name:"Taylor",exact:true}).click();
    const expanded = page.getByRole("table",{name:"Roster for Taylor",exact:true});
    await expect(expanded.locator(":scope > thead > tr > th")).toHaveCount(SCORING_CATEGORIES.length + 5);
    for (const name of [...SCORING_CATEGORIES.map(({abbreviation})=>abbreviation),"Salary","Stats","FP"]) await expect(expanded.getByRole("columnheader",{name,exact:true})).toBeVisible();
    const playerRow = expanded.getByRole("row",{name:/Connor McDavid/});
    await expect(playerRow).toContainText("$8");
    await expect(playerRow).toContainText("22.50");
    await expect(playerRow.getByRole("img",{name:/^Stats collected/})).toBeVisible();
    await page.evaluate(() => window.scrollTo({top:0,behavior:"instant"}));
    await page.screenshot({path:testInfo.outputPath(`landscape-${width}x${height}-expanded.png`),fullPage:true,animations:"disabled"});
    await expectTableFits(ranks,"Expanded standings remain within the landscape viewport");
    await expectTableFits(expanded,"All expanded player columns and text fit in landscape");
  });
}
