import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  await page.route("https://fonts.gstatic.com/**", route => route.abort());
});

for (const width of [320, 390, 844, 1280]) {
  for (const rapid of [false, true]) {
    test(`${rapid ? "rapid" : "regular"} auctions preserve compact actions and deadlines at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/e2e/fixtures/compact-auctions.html${rapid ? "?rapid" : ""}`);
      const first = page.getByRole("article", { name: "Alex Player" });
      const own = page.getByRole("article", { name: "Brandon Long-Playername" });
      await expect(first.getByRole("link", { name: "Place bid" })).toBeVisible();
      await expect(own.getByRole("link", { name: "Rebid", exact: true })).toBeVisible();
      await expect(own).toContainText("$3.00 AAV · 2 years · $6.00 total");
      await expect(page.getByRole("button", { name: "Edit limit reached" })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Rebid later" })).toBeDisabled();
      await expect(page.getByText(/^Auctions below close /)).toHaveCount(1);
      await expect(page.getByText(/^Closes /)).toHaveCount(0);
      await expect(page.getByRole("link", { name: "View auction details" })).toHaveCount(0);
      await expect(page.getByText("2 bids placed.", { exact: true })).toHaveCount(4);
      const metrics = await first.evaluate(card => {
        const name = card.querySelector("h2");
        const position = name.nextElementSibling;
        const action = [...card.querySelectorAll("a")].find(el => el.textContent === "Place bid");
        return {
          positionTopDifference: Math.abs(name.getBoundingClientRect().top - position.getBoundingClientRect().top),
          buttonHeight: action.getBoundingClientRect().height,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      });
      expect(metrics.positionTopDifference).toBeLessThan(8);
      expect(metrics.buttonHeight).toBeGreaterThanOrEqual(44);
      expect(metrics.overflow).toBe(false);
      if (width === 390 || width === 1280) await page.screenshot({ path: testInfo.outputPath(`auctions-${rapid ? "rapid" : "regular"}-${width}.png`), fullPage: true });
      await first.getByRole("link", { name: "Place bid" }).click();
      await expect(page.getByRole("heading", { name: "Review your auction bid" })).toBeVisible();
      expect(await page.evaluate(() => window.mobileAuctionRequests.every(request => request.method === "GET"))).toBe(true);
    });
  }
}

test("different deadlines remain visible when moving between mobile and desktop", async ({ page }) => {
  await page.goto("/e2e/fixtures/compact-auctions.html?mixed&rapid");
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByText(/^Closes /)).toHaveCount(4);
    await expect(page.getByText(/^Auctions below close /)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Place bid" })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(await page.evaluate(() => window.mobileAuctionRequests.every(request => request.method === "GET"))).toBe(true);
});
