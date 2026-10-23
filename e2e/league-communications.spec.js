import { test, expect } from "@playwright/test";

test('commissioner reviews active auction counts with protected round dates disabled',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/e2e/fixtures/league-communications.html?rapid');
  await page.getByRole('button',{name:'Edit round dates'}).click();
  await expect(page.getByLabel('Candidate Card target',{exact:true})).toBeDisabled();
  await expect(page.getByLabel(/Round 1 closes/)).toBeDisabled();
  await page.getByLabel('Round 2 closes').fill('2026-10-03T12:00');
  await page.getByLabel('Reason for changing dates').fill('Use the agreed final round time');
  await page.getByRole('button',{name:'Review date changes'}).click();
  const preview=page.getByRole('region',{name:'Draft timing preview'});
  await expect(preview.getByText(/Cards remain locked/)).toBeVisible();
  await expect(preview.getByText(/2 open auctions will use the new closing times/)).toBeVisible();
  expect(await page.evaluate(()=>window.communicationRequests.some(r=>r.url.endsWith('/apply')))).toBe(false);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('region',{name:'Edit draft timing'}).screenshot({path:testInfo.outputPath('rapid-timing-preview.png')});
  await preview.getByRole('button',{name:'Confirm date changes'}).click();
  await expect(page.getByRole('region',{name:'Edit draft timing'}).getByRole('status')).toContainText('Rounds and affected auctions will follow the new dates.');
  const requests=await page.evaluate(()=>window.communicationRequests);
  expect(requests.filter(r=>r.url.endsWith('/apply'))).toHaveLength(1);
  expect(requests.some(r=>r.url.includes('candidate-cards')||r.url.includes('/bids'))).toBe(false);
  expect(errors).toEqual([]);
});

test('commissioner changes an auction closing time without loading sealed bids',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/e2e/fixtures/league-communications.html');
  expect(await page.evaluate(()=>window.communicationRequests.some(r=>r.url.includes('/auctions/')))).toBe(false);
  await page.getByRole('button',{name:'Manage closing time'}).click();
  await page.getByRole('button',{name:'Edit closing time'}).click();
  await page.getByLabel('New closing time (America/Vancouver)').fill('2026-10-01T12:00');
  await page.getByLabel('Reason for changing the closing time').fill('Use the agreed closing time');
  await page.getByRole('button',{name:'Review closing time'}).click();
  const preview=page.getByRole('region',{name:'Auction closing time preview'});
  await expect(preview.getByText(/Managers will have less time/)).toBeVisible();
  expect(await page.evaluate(()=>window.communicationRequests.some(r=>r.url.endsWith('/apply')))).toBe(false);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('region',{name:'Auction closing time controls'}).screenshot({path:testInfo.outputPath('auction-timing-preview.png')});
  await preview.getByRole('button',{name:'Confirm closing time'}).click();
  await expect(page.getByRole('region',{name:'Auction closing time controls'}).getByRole('status')).toContainText('Auction closing time updated.');
  const requests=await page.evaluate(()=>window.communicationRequests);
  expect(requests.filter(r=>r.url.endsWith('/apply'))).toHaveLength(1);
  expect(requests.filter(r=>r.url.includes('/auctions/')).every(r=>r.url.endsWith('/timing')||r.url.endsWith('/timing/preview')||r.url.endsWith('/timing/apply'))).toBe(true);
  expect(requests.find(r=>r.url.endsWith('/timing/preview')).body.closesAtMs).toBe(Date.parse('2026-10-01T19:00:00Z'));
  expect(errors).toEqual([]);
});

test('commissioner reviews a trade deadline in league time without exposing proposal contents', async ({ page }, testInfo) => {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/e2e/fixtures/league-communications.html');
  await page.getByRole('button',{name:'Edit trade deadline'}).click();
  await page.getByLabel('New trade deadline (America/Vancouver)').fill('2026-10-01T12:00');
  await page.getByLabel('Reason for changing the trade deadline').fill('Reopen trading for the league');
  await page.getByRole('button',{name:'Review trade deadline'}).click();
  const preview=page.getByRole('region',{name:'Trade deadline preview'});
  await expect(preview.getByText(/The old deadline has passed/)).toBeVisible();
  await expect(preview.getByText(/2 proposals awaiting expiry/)).toBeVisible();
  expect(await page.evaluate(()=>window.communicationRequests.some(r=>r.url.endsWith('/apply')))).toBe(false);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await preview.scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('trade-deadline-preview.png'),fullPage:true});
  await preview.getByRole('button',{name:'Confirm trade deadline'}).click();
  await expect(page.getByRole('region',{name:'Trade deadline controls'}).getByRole('status')).toContainText('Trade deadline updated.');
  const requests=await page.evaluate(()=>window.communicationRequests);
  expect(requests.filter(r=>r.url.endsWith('/apply'))).toHaveLength(1);
  expect(requests.some(r=>r.url.includes('/trades/')||r.url.includes('/bids'))).toBe(false);
  expect(requests.find(r=>r.url.endsWith('/trade-deadline/preview')).body.tradeDeadlineAtMs).toBe(Date.parse('2026-10-01T19:00:00Z'));
  expect(errors).toEqual([]);
});

test('commissioner reviews cutoff changes and retained rounds without revealing offers', async ({ page }, testInfo) => {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/e2e/fixtures/league-communications.html');
  await page.getByRole('button',{name:'Edit cutoff gap'}).click();
  await page.getByLabel('Minutes before auction closing').fill('30');
  await page.getByLabel('Reason for changing the cutoff').fill('More time to nominate players');
  await page.getByRole('button',{name:'Review cutoff changes'}).click();
  const preview=page.getByRole('region',{name:'Auction cutoff preview'});
  await expect(preview.getByRole('listitem')).toHaveCount(2);
  await expect(preview.getByText(/Existing auction or queued nomination/)).toBeVisible();
  expect(await page.evaluate(()=>window.communicationRequests.some(r=>r.url.endsWith('/apply')))).toBe(false);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await preview.scrollIntoViewIfNeeded();
  await page.screenshot({path:testInfo.outputPath('cutoff-preview.png'),fullPage:true});
  await preview.getByRole('button',{name:'Confirm cutoff changes'}).click();
  await expect(page.getByRole('region',{name:'Edit auction cutoff'}).getByRole('status')).toContainText('Auction cutoff gap updated.');
  const requests=await page.evaluate(()=>window.communicationRequests);
  expect(requests.filter(r=>r.url.endsWith('/apply'))).toHaveLength(1);
  expect(requests.some(r=>r.url.includes('candidate-cards')||r.url.includes('/bids'))).toBe(false);
  expect(errors).toEqual([]);
});

test('commissioner reviews new draft dates before saving, without private requests', async ({ page }, testInfo) => {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/e2e/fixtures/league-communications.html');
  await page.getByRole('button',{name:'Edit target and round dates'}).click();
  await page.getByLabel('Candidate Card target',{exact:true}).fill('2026-09-30T12:00');
  await page.getByLabel('Reason for changing dates').fill('Give every manager time to finish');
  await page.getByRole('button',{name:'Review date changes'}).click();
  const preview=page.getByRole('region',{name:'Draft timing preview'});
  await expect(preview.getByRole('listitem')).toHaveCount(2);
  expect(await page.evaluate(()=>window.communicationRequests.some(r=>r.url.endsWith('/apply')))).toBe(false);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('timing-preview.png'),fullPage:true});
  await preview.getByRole('button',{name:'Confirm date changes'}).click();
  await expect(page.getByRole('region',{name:'Edit draft timing'}).getByRole('status')).toContainText('Draft schedule updated.');
  const requests=await page.evaluate(()=>window.communicationRequests);
  expect(requests.filter(r=>r.url.endsWith('/apply'))).toHaveLength(1);
  expect(requests.some(r=>r.url.includes('candidate-cards')||r.url.includes('/bids'))).toBe(false);
  expect(errors).toEqual([]);
});

test.use({ baseURL: process.env.HL_COMMUNICATION_PREVIEW_ORIGIN || "http://127.0.0.1:5173" });

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    return ["127.0.0.1", "localhost"].includes(url.hostname) ? route.continue() : route.abort();
  });
});

test("commissioner reviews card status and sends only to previewed sample recipients", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/e2e/fixtures/league-communications.html");
  await page.getByText("Manage announcements and reminders").click();
  await expect(page.getByText("4 of 6 complete")).toBeVisible();
  await page.getByRole("combobox", { name: "Message type", exact: true }).selectOption("reminder");
  await page.getByRole("combobox", { name: "Recipients", exact: true }).selectOption("unfinished_cards");
  await page.getByLabel("Title", { exact: true }).fill("Please finish your Candidate Card");
  await page.getByLabel("Message", { exact: true }).fill("The target deadline is Monday. Save your card when ready.");
  await page.getByRole("button", { name: "Preview message" }).click();
  const preview = page.getByRole("region", { name: "Message preview" });
  await expect(preview.getByRole("listitem")).toHaveText(["Jordan", "Charlie"]);
  expect(await page.evaluate(() => window.communicationRequests.filter(r => r.method === "POST" && !r.url.endsWith("/preview")))).toEqual([]);
  await expect(preview.getByRole("button", { name: "Confirm reminder" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("commissioner-preview.png"), fullPage: true });
  await preview.getByRole("button", { name: "Confirm reminder" }).click();
  await expect(page.getByRole("status")).toHaveText("Reminder delivered to 2 people.");
  const requests = await page.evaluate(() => window.communicationRequests);
  expect(requests.filter(r => r.method === "POST" && !r.url.endsWith("/preview"))).toHaveLength(1);
  expect(requests.every(r => !r.url.includes("/bids") && !r.url.includes("/candidate-cards"))).toBe(true);
  expect(errors).toEqual([]);
});

test("manager sees announcements without private controls or card requests", async ({ page }, testInfo) => {
  await page.goto("/e2e/fixtures/league-communications.html?manager");
  await expect(page.getByRole("heading", { name: "Draft week is approaching" })).toBeVisible();
  await expect(page.getByText("Manage announcements and reminders")).toHaveCount(0);
  await expect(page.getByText("Candidate Card progress")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Candidate Card deadline controls" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Draft timing" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Auction nomination cutoff" })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Trade deadline controls' })).toHaveCount(0);
  expect(await page.evaluate(() => window.communicationRequests.every(r => r.method === "GET" && !r.url.includes("history") && !r.url.includes("card-progress")))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("manager-announcement.png"), fullPage: true });
});

test("commissioner reviews a held deadline without revealing cards", async ({ page }, testInfo) => {
  await page.goto("/e2e/fixtures/league-communications.html");
  const controls = page.getByRole("region", { name: "Candidate Card deadline controls" });
  await expect(controls.getByText("Processing is on hold")).toBeVisible();
  await controls.getByRole("textbox", { name: "Reason for proceeding" }).fill("The league agreed to process saved cards");
  await controls.getByRole("button", { name: "Review processing" }).click();
  const preview = page.getByRole("region", { name: "Deadline processing preview" });
  await expect(preview.getByRole("listitem")).toHaveText(["Team Jordan — Incomplete", "Team Charlie — Empty"]);
  expect(await page.evaluate(() => window.communicationRequests.some(r => r.url.endsWith("/proceed")))).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("deadline-preview.png"), fullPage: true });
  await preview.getByRole("button", { name: "Confirm processing" }).click();
  await expect(controls.getByRole("status")).toContainText("Processing authorized.");
  const requests = await page.evaluate(() => window.communicationRequests);
  expect(requests.filter(r => r.url.endsWith("/proceed"))).toHaveLength(1);
  expect(requests.some(r => r.url.includes("candidate-cards") || r.url.includes("/bids"))).toBe(false);
});
