import { test, expect } from "@playwright/test";

test("ordinary proposal visibly sends once and confirms the receiving team", async ({ page }) => {
  await page.goto("/e2e/fixtures/counter-proposal.html?ordinary", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Proposing team sends asset 1 type", { exact: true }).selectOption("draft_pick");
  await page.getByLabel("Proposing team sends asset 1", { exact: true }).selectOption("00000000-0000-4000-8000-000000000009");
  await page.getByRole("button", { name: "Send proposal", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sending…", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => window.counterFixture.requests.filter(r => r.method === "POST").length)).toBe(1);
  await page.evaluate(() => window.finishTradeSend());
  await expect(page.getByRole("status")).toHaveText("Trade proposal to Wolfy's sent.");
  await expect(page.getByRole("link", { name: "View proposal", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send proposal", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("trade-sent.png"), fullPage: true });
});
