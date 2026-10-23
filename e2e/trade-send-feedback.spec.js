import { test, expect } from "@playwright/test";

test("ordinary proposal previews and then visibly sends once", async ({ page }) => {
  await page.goto("/e2e/fixtures/counter-proposal.html?new=1", { waitUntil: "domcontentloaded" });
  await page.getByRole("combobox", { name: "Receiving team", exact: true }).selectOption("00000000-0000-4000-8000-000000000003");
  await page.getByLabel("Proposing team sends asset 1", { exact: true }).selectOption("contract:00000000-0000-4000-8000-000000000007");
  await page.getByLabel("Receiving team sends asset 1 type", { exact: true }).selectOption("draft_pick");
  await page.getByLabel("Receiving team sends asset 1", { exact: true }).selectOption("00000000-0000-4000-8000-000000000009");
  await page.getByRole("button", { name: "Preview trade", exact: true }).click();
  await page.evaluate(() => { window.counterFixture.beforeSend = () => new Promise(resolve => { window.finishTradeSend = resolve; }); });
  await page.getByRole("button", { name: "Submit trade", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sending…", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => window.counterFixture.requests.filter(r => r.method === "POST" && !r.pathname.endsWith("/trades/preview")).length)).toBe(1);
  await page.evaluate(() => window.finishTradeSend());
  await expect(page).toHaveURL(/\/trades\/00000000-0000-4000-8000-000000000006$/);
  await expect(page.getByRole("heading", { name: "Trade proposal", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit trade", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("trade-sent.png"), fullPage: true });
});
