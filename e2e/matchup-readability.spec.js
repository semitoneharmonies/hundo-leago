import { test, expect } from '@playwright/test';

test('player identities, outer position bars and inward FP remain readable', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/e2e/fixtures/matchup-readability.html');
  const home = page.locator('.hl-matchup-player--home').first();
  const away = page.locator('.hl-matchup-player--away').first();
  await expect(home.locator('.hl-matchup-player__identity')).toHaveText('BOSF');
  await expect(home.locator('.hl-matchup-player__position')).toHaveText('F');
  await expect(page.locator('.hl-matchup-player.is-defence').first().locator('.hl-matchup-player__position')).toHaveText('D');
  for (const [row, side] of [[home, 'home'], [away, 'away']]) {
    const fp = await row.locator('.hl-matchup-player-fp').boundingBox();
    const name = await row.locator('.hl-matchup-player__heading').boundingBox();
    const stats = await row.locator('.hl-matchup-player__stats').boundingBox();
    if (side === 'home') expect(fp.x).toBeGreaterThanOrEqual(stats.x + stats.width);
    else expect(fp.x + fp.width).toBeLessThanOrEqual(Math.min(name.x, stats.x));
    expect(await row.locator('.hl-matchup-player-fp').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    expect(await row.evaluate(el => getComputedStyle(el, '::before').width)).toBe('6px');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const overflow = await page.locator('.hl-matchup-player').evaluateAll(rows => rows.some(row => row.scrollWidth > row.clientWidth));
  expect(overflow).toBe(false);
  await page.screenshot({ path: testInfo.outputPath('matchup-rows.png'), fullPage: true });
  expect(errors).toEqual([]);
});

test('desktop stat headers remain aligned below the sticky matchup banner', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Mobile retains labels beside each counting stat.');
  await page.goto('/e2e/fixtures/matchup-readability.html');
  const header = page.locator('.hl-matchup-stat-headings');
  await expect(header).toBeVisible();
  for (const width of [1440, 1100, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => scrollTo(0, 650));
    await expect.poll(async () => {
      const stat = await header.boundingBox();
      const banner = await page.locator('.hl-matchup-score').boundingBox();
      return Math.abs(stat.y - (banner.y + banner.height));
    }).toBeLessThan(2);
    const headingCells = await header.locator('> div:first-child > span').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2));
    const rowCells = await page.locator('.hl-matchup-player--home').first().locator('.hl-matchup-stat').evaluateAll(elements => elements.map(el => el.getBoundingClientRect().x + el.getBoundingClientRect().width / 2));
    headingCells.forEach((x, index) => expect(Math.abs(x - rowCells[index])).toBeLessThan(1));
    expect(await header.locator('span').evaluateAll(elements => elements.every(el => el.scrollWidth <= el.clientWidth))).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`sticky-${width}.png`) });
  }
});
