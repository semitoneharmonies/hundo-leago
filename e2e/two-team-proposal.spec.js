import { test, expect } from "@playwright/test";

test("two-team send keeps failed drafts, shows sending, then opens the created offer", async ({ page }) => {
  await page.goto("/e2e/fixtures/counter-proposal.html?new=1", { waitUntil: "domcontentloaded" });
  await page.getByRole("combobox", { name: "Receiving team", exact: true }).selectOption("00000000-0000-4000-8000-000000000003");
  await page.getByLabel("Proposing team sends asset 1", { exact: true }).selectOption("contract:00000000-0000-4000-8000-000000000007");
  await page.getByLabel("Receiving team sends asset 1 type", { exact: true }).selectOption("draft_pick");
  await page.getByLabel("Receiving team sends asset 1", { exact: true }).selectOption("00000000-0000-4000-8000-000000000009");
  await page.evaluate(() => { window.counterFixture.failNext = true; });
  await page.getByRole("button", { name: "Send proposal", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("The trade request could not be completed.");
  await expect(page).toHaveURL(/\/trades$/);
  await expect(page.getByLabel("Proposing team sends asset 1", { exact: true })).toHaveValue("contract:00000000-0000-4000-8000-000000000007");
  await page.evaluate(() => {
    window.counterFixture.beforeSend = () => new Promise(resolve => { window.releaseProposal = resolve; });
  });
  await page.getByRole("button", { name: "Send proposal", exact: true }).click();
  const sending = page.getByRole("button", { name: "Sending…", exact: true });
  await expect(sending).toBeDisabled();
  await sending.evaluate(button => { button.form.requestSubmit(); button.form.requestSubmit(); });
  await expect.poll(() => page.evaluate(() => window.counterFixture.requests.filter(r => r.method === "POST").length)).toBe(2);
  await page.screenshot({ path: test.info().outputPath("two-team-sending.png"), fullPage: true });
  await page.evaluate(() => { window.releaseProposal(); });
  await expect(page).toHaveURL(/\/trades\/00000000-0000-4000-8000-000000000006$/);
  await expect(page.getByRole("heading", { name: "Trade proposal", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel proposal", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "New trade proposal", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => window.counterFixture.original.storageStatus)).toBe("proposed");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("two-team-created.png"), fullPage: true });
});
