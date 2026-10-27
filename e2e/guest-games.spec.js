import { test, expect } from "@playwright/test";

const frameDocument = `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#101b30;color:white;display:grid;place-content:center;min-height:95vh;font-family:Arial}button{padding:16px;margin:8px}</style><h1>Synthetic game frame</h1><button id="start">Start sample run</button><button id="complete" disabled>Complete sample level</button><script>
let run; const protocol='tipjar-league-v1';
const send=message=>parent.postMessage({protocol,...message},location.origin);
addEventListener('message',event=>{if(event.data.protocol===protocol&&event.data.type==='start'){run=event.data.run;document.querySelector('#complete').disabled=false;}});
document.querySelector('#start').onclick=()=>send({type:'start',requestId:'44444444-4444-4444-8444-444444444444'});
document.querySelector('#complete').onclick=()=>send({type:'checkpoint',runId:run.runId,shots:[{time:1,x:0,height:1,power:50}]});
setTimeout(()=>send({type:'ready'}),0);
</script></html>`;

async function open(page, member = false) {
  await page.route("**/games/tip-jar/campaign-v1/index.html?*", (route) => route.fulfill({ contentType: "text/html", body: frameDocument }));
  await page.goto(`/e2e/fixtures/guest-games.html${member ? "?member=1" : ""}`);
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}
async function menu(page) {
  if (page.viewportSize().width < 1024) await page.getByRole("button", { name: "Menu", exact: true }).click();
}

test("sign-in page opens guest play and a qualifying guest can name a public score", async ({ page }, testInfo) => {
  await open(page);
  const entry = page.getByRole("link", { name: "Play Tip Jar", exact: true });
  await expect(entry).toBeVisible();
  await expect(entry).toHaveAttribute("href", "#/games/tip-jar");
  await entry.click();
  await expect(page.getByRole("heading", { name: "Tip Jar", exact: true })).toBeVisible();
  const board = page.getByRole("region", { name: "Hundo Leago leaderboard" });
  await expect(board.getByText("Snowbird", { exact: false })).toContainText("(Guest)");
  await expect(page.locator(".hl-tipjar-leaderboard")).toHaveCount(1);
  expect(await page.evaluate(() => window.guestGamesFixture.requests.every((item) => item.path === "/api/v1/games/tip-jar/leaderboard" && item.method === "GET" && !item.authenticated))).toBe(true);
  const frame = page.frameLocator("iframe[title='Tip Jar hockey game']");
  await frame.getByRole("button", { name: "Start sample run" }).click();
  await frame.getByRole("button", { name: "Complete sample level" }).click();
  await expect(page.getByRole("heading", { name: "You made the Hundo Leago leaderboard!" })).toBeVisible();
  await page.getByRole("textbox", { name: "Leaderboard name" }).fill("Ice Otter");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(board.getByText("Ice Otter", { exact: false })).toContainText("(Guest)");
  expect(await page.evaluate(() => window.guestGamesFixture.requests.every((item) => item.path.startsWith("/api/v1/games/tip-jar/") && !item.authenticated))).toBe(true);
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("guest-leaderboard.png"), fullPage: true });
});

test("league play shows both boards and the title switches authorized leagues with keyboard focus", async ({ page }, testInfo) => {
  await open(page, true);
  const leagueBoard = page.getByRole("region", { name: "Hundo Hockey League leaderboard" });
  const globalBoard = page.getByRole("region", { name: "Hundo Leago leaderboard" });
  await expect(leagueBoard.getByText("League Manager", { exact: false })).toBeVisible();
  await expect(globalBoard.getByText("Site Manager", { exact: false })).toBeVisible();
  const left = await leagueBoard.boundingBox();
  const right = await globalBoard.boundingBox();
  if (testInfo.project.name === "desktop") {
    expect(Math.abs(left.y - right.y)).toBeLessThan(2);
    expect(right.x).toBeGreaterThan(left.x + left.width - 2);
  } else expect(right.y).toBeGreaterThanOrEqual(left.y + left.height - 2);
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("two-leaderboards.png"), fullPage: true });
  await menu(page);
  const title = page.getByRole("button", { name: "Hundo Hockey League", exact: true });
  await expect(page.getByRole("button", { name: "Switch league", exact: true })).toHaveCount(0);
  await title.click();
  const choices = page.getByRole("region", { name: "Your leagues" });
  await expect(choices.getByRole("link", { name: /Hundo Hockey League/ })).toHaveAttribute("aria-current", "true");
  await expect(choices.getByRole("link", { name: /Pacific Hockey League/ })).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("league-title-picker.png"), fullPage: false });
  await page.keyboard.press("Escape");
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await choices.getByRole("link", { name: /Pacific Hockey League/ }).click();
  await expect(page.getByRole("heading", { name: "Pacific Hockey League", exact: true })).toBeVisible();
  await expect(choices).toHaveCount(0);
  await menu(page);
  await page.getByRole("link", { name: "Play Tip Jar", exact: true }).click();
  await expect(page.getByRole("region", { name: "Pacific Hockey League leaderboard" }).getByText("Pacific Manager", { exact: false })).toBeVisible();
  await expect(globalBoard).toBeVisible();
  expect(await page.evaluate(() => window.guestGamesFixture.requests.every((item) => item.method === "GET"))).toBe(true);
  await noOverflow(page);
});

test("public leaderboard failure remains visible and its refresh recovers", async ({ page }) => {
  await open(page);
  await page.getByRole("link", { name: "Play Tip Jar", exact: true }).click();
  const board = page.getByRole("region", { name: "Hundo Leago leaderboard" });
  await expect(board.getByText("Site Manager", { exact: false })).toBeVisible();
  await page.evaluate(async () => {
    window.guestGamesFixture.failPublic = true;
    await window.guestGamesQueryClient.invalidateQueries({ queryKey: ["games", "tip-jar", "public"] });
  });
  await expect(board.getByRole("alert")).toBeVisible();
  await page.evaluate(() => { window.guestGamesFixture.failPublic = false; });
  await board.getByRole("button", { name: "Refresh Hundo Leago leaderboard", exact: true }).click();
  await expect(board.getByRole("alert")).toHaveCount(0);
  await expect(board.getByText("Site Manager", { exact: false })).toBeVisible();
});
