import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const origin = process.env.HUNDO_NAVIGATION_PREVIEW_ORIGIN || "http://127.0.0.1:5191";
const preview = `${origin}/e2e/fixtures/desktop-navigation.html`;
async function open(page, role = "") {
  await page.goto(`${preview}${role ? `?${role}=1` : ""}`);
  await expect(page.getByRole("heading", { name: "Own Goal Hatty", exact: true })).toBeVisible();
}
async function openMenu(page) {
  if (page.viewportSize().width < 1024) await page.getByRole("button", { name: "Menu", exact: true }).click();
}
async function submit(page, text) {
  await openMenu(page);
  await page.getByRole("button", { name: "Submit a quote", exact: true }).click();
  await page.getByRole("textbox", { name: "Quote", exact: true }).fill(text);
  await page.getByRole("textbox", { name: "Attributed to (optional)" }).fill("Sample manager");
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(page.getByRole("status")).toContainText("Quote submitted for review");
  await page.getByRole("button", { name: "Close quotes" }).click();
}
async function reviewPanel(page) {
  await openMenu(page);
  await page.getByRole("button", { name: "Review quotes", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Review quotes" })).toBeVisible();
}
async function switchLeague(page) {
  await openMenu(page);
  if (page.viewportSize().width >= 1024) {
    await page.getByRole("button", { name: "Switch league", exact: true }).click();
    await page.getByRole("link", { name: /Pacific Hockey League/ }).click();
  } else {
    // The mobile league directory is outside this fixture; use its real route.
    await page.keyboard.press("Escape");
    await page.evaluate(() => { window.location.hash = `/leagues/${window.navigationFixture.leagues[1].id}`; });
  }
  await expect(page.getByRole("heading", { name: "Pacific Hockey League", exact: true })).toBeVisible();
}

test("members submit via the small footer; failed drafts survive and pending quotes never reach the ticker", async ({ page }) => {
  await open(page);
  await openMenu(page);
  await expect(page.getByRole("button", { name: "Review quotes" })).toHaveCount(0);
  const trigger = page.getByRole("button", { name: "Submit a quote", exact: true });
  expect(await trigger.evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeLessThan(12);
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Submit a quote" });
  await expect(dialog.getByText("Share a quote for Hundo Leago!", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Quote", exact: true }).fill("A patient team wins the long game.");
  await page.evaluate(() => { window.navigationFixture.failQuoteSubmit = true; });
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(dialog.getByRole("alert")).toContainText("draft is still here");
  await expect(page.getByRole("textbox", { name: "Quote", exact: true })).toHaveValue("A patient team wins the long game.");
  const violations = (await new AxeBuilder({ page }).include(".hl-quote-dialog").analyze()).violations;
  expect(violations.map(({ id }) => id)).toEqual([]);
  await page.evaluate(() => { window.navigationFixture.failQuoteSubmit = false; });
  await page.getByRole("button", { name: "Submit for approval" }).click();
  await expect(dialog.getByRole("status")).toContainText("submitted for review");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".hl-quote-ticker")).not.toContainText("A patient team wins the long game.");
  expect(await page.evaluate(() => window.navigationFixture.requests.some(({ path }) => path.includes("quote-submissions")))).toBe(false);
});

test("commissioner approval updates the ticker immediately and stays in its league", async ({ page }) => {
  await open(page, "commissioner");
  await submit(page, "Our league plays until the final whistle.");
  await reviewPanel(page);
  await expect(page.getByRole("button", { name: "Approve for all leagues" })).toHaveCount(0);
  await page.evaluate(() => { window.navigationFixture.failQuoteReview = true; });
  await page.getByRole("button", { name: "Approve for this league" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("could not be saved");
  await expect(page.locator(".hl-quote-ticker")).not.toContainText("Our league plays until the final whistle.");
  await page.evaluate(() => { window.navigationFixture.failQuoteReview = false; });
  await page.getByRole("button", { name: "Approve for this league" }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText("Quote approved for Hundo Hockey League");
  await expect(page.getByText("No quotes awaiting your review.")).toBeVisible();
  await page.getByRole("button", { name: "Close quotes" }).click();
  await expect(page.locator(".hl-quote-ticker")).toContainText("Our league plays until the final whistle.");
  await switchLeague(page);
  await expect(page.locator(".hl-quote-ticker")).not.toContainText("Our league plays until the final whistle.");
});

test("administrator approval enters both leagues and declined quotes stay out", async ({ page }) => {
  await open(page, "administrator");
  await submit(page, "Every rink has a story worth sharing.");
  await reviewPanel(page);
  await expect(page.getByRole("button", { name: "Approve for this league" })).toHaveCount(0);
  await page.getByRole("button", { name: "Approve for all leagues" }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText("approved for all leagues");
  await page.getByRole("button", { name: "Close quotes" }).click();
  await expect(page.locator(".hl-quote-ticker")).toContainText("Every rink has a story worth sharing.");
  await switchLeague(page);
  await expect(page.locator(".hl-quote-ticker")).toContainText("Every rink has a story worth sharing.");
  await submit(page, "This quote will be declined.");
  await reviewPanel(page);
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText("declined for the global rotation");
  await page.getByRole("button", { name: "Close quotes" }).click();
  await expect(page.locator(".hl-quote-ticker")).not.toContainText("This quote will be declined.");
});
