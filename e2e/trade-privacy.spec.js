import { test, expect } from '@playwright/test';
test('trade fog of war hides offers and reveals executed details', async ({ page }) => {
  for (const query of ['two=1', '', 'commissioner=1']) {
    await page.goto(`/e2e/fixtures/trade-privacy.html?${query}`);
    await expect(page.getByRole('heading', { name: 'Trade details are private until execution' })).toBeVisible();
    await expect(page.getByText('Mitch Marner', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Wolfy's ↔ Benning/ })).toBeVisible();
    expect(await page.evaluate(() => window.tradePrivacyFixture.requests.filter(r => r.pathname.endsWith('/roster') || r.pathname.endsWith('/acceptance-preview') || r.method === 'POST').length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await page.screenshot({ path: test.info().outputPath('private-trade.png'), fullPage: true });
  await page.goto('/e2e/fixtures/trade-privacy.html?completed=1');
  await expect(page.getByRole('group', { name: 'Three-team trade breakdown' })).toBeVisible();
  await expect(page.getByText('Mitch Marner', { exact: true }).first()).toBeVisible();
  await page.goto('/e2e/fixtures/trade-privacy.html?commissioner=1&review=1');
  await expect(page.getByRole('button', { name: 'Preview commissioner approval' })).toBeVisible();
  await expect(page.getByText('Mitch Marner', { exact: true }).first()).toBeVisible();
});
