import { test, expect } from "@playwright/test";

test("third team sees prior acceptance and can confirm", async ({ page }) => {
  await page.goto("/e2e/fixtures/three-team-trade.html?accepted=1", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("list", { name: "Team responses" })).toContainText("Benning Did Nothing Wrong: Accepted");
  await expect(page.getByRole("button", { name: "Confirm", exact: true })).toBeEnabled();
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
  expect(await page.evaluate(() => window.threeTeamFixture.requests.filter(r => r.method === "POST").length)).toBe(0);
  await page.screenshot({ path: test.info().outputPath("three-team-counter-editor.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.evaluate(() => { window.threeTeamFixture.failNext = true; });
  await page.getByRole("button", { name: "Send counter proposal", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("could not be completed");
  await expect(page.getByLabel("Wolfy's sends asset 2 destination", { exact: true })).toHaveValue("00000000-0000-4000-8000-000000000003");
  await page.getByRole("button", { name: "Send counter proposal", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Three-team counter proposal" })).toHaveCount(0);
  expect(await page.evaluate(() => window.threeTeamFixture.counter.participants.map(p => p.decision))).toEqual(["accepted", "pending", "pending"]);
  await page.goto("/e2e/fixtures/three-team-trade.html?status=declined", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "OK", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Trades", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Wolfy's ↔ Benning/ })).toHaveCount(0);
  await page.getByLabel("Status", { exact: true }).selectOption("all");
  await expect(page.getByRole("link", { name: /Wolfy's ↔ Benning/ })).toBeVisible();
});
