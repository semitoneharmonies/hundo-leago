import { test, expect } from "@playwright/test";

test("third team sees prior acceptance and can confirm", async ({ page }) => {
  await page.goto("/e2e/fixtures/three-team-trade.html?accepted=1", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("list", { name: "Team responses" })).toContainText("Benning Did Nothing Wrong: Accepted");
  await expect(page.getByRole("button", { name: "Confirm", exact: true })).toBeEnabled();
  const comparison = page.getByRole("group", { name: "Three-team trade breakdown" });
  await expect(comparison.getByRole("region")).toHaveCount(6);
  const teams = ["Wolfy's", "Benning Did Nothing Wrong", "Charlie"];
  const boxes = [];
  for (const team of teams) {
    const sends = await comparison.getByRole("region", { name: `${team} sends`, exact: true }).boundingBox();
    const receives = await comparison.getByRole("region", { name: `${team} receives`, exact: true }).boundingBox();
    if (page.viewportSize().width > 760) {
      expect(sends.x).toBeLessThan(receives.x);
      expect(sends.y).toBeCloseTo(receives.y, 0);
    } else {
      expect(sends.x).toBeCloseTo(receives.x, 0);
      expect(sends.y + sends.height).toBeLessThanOrEqual(receives.y);
    }
    if (boxes.length) expect(sends.y).toBeGreaterThan(boxes.at(-1).receives.y);
    boxes.push({ sends, receives });
  }
  await expect(comparison.getByRole("region", { name: "Charlie receives", exact: true })).toContainText("From Wolfy's");
  await page.screenshot({ path: test.info().outputPath("three-team-responses.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByRole("button", { name: "Confirm", exact: true })).toHaveCount(0);
});

test("third team counters a declined trade or clears it with OK", async ({ page }) => {
  await page.goto("/e2e/fixtures/three-team-trade.html?status=declined", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "OK", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm", exact: true })).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath("three-team-rejected.png"), fullPage: true });
  await page.getByRole("button", { name: "Counter Proposal", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Three-team counter proposal" })).toBeVisible();
  await expect(page.getByLabel("Proposing team", { exact: true })).toHaveValue("11111111-1111-4111-8111-000000000001");
  await expect(page.getByLabel("Wolfy's sends asset 1 retained AAV dollars", { exact: true })).toHaveValue("1.25");
  await page.getByLabel("Wolfy's sends asset 2 destination", { exact: true }).selectOption("00000000-0000-4000-8000-000000000003");
  await expect(page.getByRole("region", { name: "Draft impact preview" })).toBeVisible();
  await expect(page.getByText("Projected cap", { exact: true })).toHaveCount(3);
  expect(await page.evaluate(() => window.threeTeamFixture.requests.filter(r => r.method === "POST" && !r.pathname.endsWith('/trades/preview')).length)).toBe(0);
  await page.screenshot({ path: test.info().outputPath("three-team-counter-editor.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.evaluate(() => { window.threeTeamFixture.failNext = true; });
  await page.getByRole("button", { name: "Preview trade", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Review trade", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit counter proposal", exact: true })).toBeEnabled();
  const review = page.getByRole("group", { name: "Trade breakdown" });
  await expect(review.getByRole("region")).toHaveCount(6);
  await expect(page.getByText("Projected cap", { exact: true })).toHaveCount(3);
  expect(await page.evaluate(() => window.threeTeamFixture.requests.filter(r => r.method === "POST" && !r.pathname.endsWith("/trades/preview")).length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("three-team-review.png"), fullPage: true });
  await page.getByRole("button", { name: "Submit counter proposal", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("could not be completed");
  await expect(review.getByRole("region", { name: "Benning Did Nothing Wrong receives", exact: true })).toContainText("Drafted Prospect");
  await page.getByRole("button", { name: "Submit counter proposal", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Review trade", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.threeTeamFixture.counter.participants.map(p => p.decision))).toEqual(["accepted", "pending", "pending"]);
  await page.goto("/e2e/fixtures/three-team-trade.html?status=declined", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Trades", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Wolfy's ↔ Benning/ })).toHaveCount(0);
  await page.getByLabel("Status", { exact: true }).selectOption("all");
  await expect(page.getByRole("link", { name: /Wolfy's ↔ Benning/ })).toBeVisible();
});

test("proposer sees all three teams' authoritative cap impact after sending", async ({ page }) => {
  await page.goto("/e2e/fixtures/three-team-trade.html?role=sender", { waitUntil: "domcontentloaded" });
  const impact = page.getByRole("region", { name: "Salary cap impact" });
  await expect(impact.getByText("$6.25", { exact: true })).toHaveCount(3);
  await expect(impact.getByText("+$1.25", { exact: true })).toHaveCount(3);
  await expect(impact.getByText("Unavailable", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cancel proposal", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.threeTeamFixture.requests.filter(r => r.method === "POST" && !r.pathname.endsWith("/trades/preview")).length)).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("three-team-proposer-impact.png"), fullPage: true });
});

test("one manager responds independently for two invited teams", async ({ page }) => {
  await page.goto("/e2e/fixtures/three-team-trade.html?shared=1", { waitUntil: "domcontentloaded" });
  const selector = page.getByRole("combobox", { name: "Respond as" });
  await expect(selector).toBeVisible();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText(/You accepted. Waiting for the remaining team/)).toBeVisible();
  expect(await page.evaluate(() => window.threeTeamFixture.original.storageStatus)).toBe("proposed");
  await selector.selectOption("11111111-1111-4111-8111-000000000001");
  await page.screenshot({ path: test.info().outputPath("shared-manager-response.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.threeTeamFixture.original.storageStatus)).toBe("completed");
});
