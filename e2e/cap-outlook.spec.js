import { test, expect } from "@playwright/test";

test("cap outlook stays usable on desktop and mobile and refreshes after active/bench moves", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/e2e/fixtures/cap-outlook.html", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Cap outlook" }).click();
  const table = page.getByRole("region", { name: "Cap outlook by season" });
  const capSpace = table.getByRole("row", { name: /^Cap space/ });
  await expect(capSpace).toContainText("$51.37$53.87$58.62");
  await expect(table.getByRole("columnheader", { name: /2028–29/ })).toBeAttached();
  expect(await page.evaluate(() => window.capFixture.requests.every((request) => !request.method))).toBe(true);
  await table.getByRole("button", { name: "Move Connor McDavid to bench" }).click();
  await expect(capSpace).toContainText("$72.37$74.87$79.62");
  await table.getByRole("button", { name: "Move Connor McDavid to active" }).click();
  await expect(capSpace).toContainText("$51.37$53.87$58.62");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  if (page.viewportSize().width < 600) {
    expect(await table.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    await table.getByRole("button", { name: "Move Connor McDavid to bench" }).scrollIntoViewIfNeeded();
    await table.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
    await expect(table.getByRole("button", { name: "Move Connor McDavid to bench" })).toBeInViewport();
    await table.evaluate((element) => { element.scrollLeft = 0; });
  }
  await page.getByRole("heading", { name: "Cap outlook", exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.hundo.local/cap-outlook-preview-${page.viewportSize().width}.png`, fullPage: true });
  expect(errors).toEqual([]);
});
