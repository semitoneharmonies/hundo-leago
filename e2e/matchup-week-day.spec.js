import { test, expect } from '@playwright/test';

test('Week / Day and Compact / Full stay centered together on desktop and narrow screens', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/e2e/fixtures/matchup-game-progress.html');
  await expect(page.getByLabel('Games played: 12', { exact: true })).toBeVisible();
  const day = page.getByRole('switch', { name: 'Daily statistics' });
  const full = page.getByRole('switch', { name: 'Full statistics' });
  for (const width of testInfo.project.name.includes('mobile') ? [390, 320] : [1440, 1280, 1024, 900]) {
    await page.setViewportSize({ width, height: 900 });
    const controls = await page.getByRole('group', { name: 'Matchup display' }).boundingBox();
    const summary = await page.locator('.hl-scoring-stat-guide > summary').boundingBox();
    const dayBox = await day.boundingBox(), fullBox = await full.boundingBox();
    expect(Math.abs(controls.x + controls.width / 2 - (summary.x + summary.width / 2))).toBeLessThan(1);
    expect(Math.abs(dayBox.y - fullBox.y)).toBeLessThan(1);
    expect(dayBox.x + dayBox.width).toBeLessThan(fullBox.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await day.click();
    await expect(day).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('article')).toHaveCount(12);
    await expect(page.getByRole('article', { name: 'North Stars: Alex Mercer' }).locator('.hl-matchup-player-fp')).toHaveText('0.40 FP');
    await full.click();
    await expect(page.getByRole('article')).toHaveCount(12);
    await expect(page.locator('.hl-scoring-stat-guide')).not.toHaveAttribute('open');
    await day.click();
    await expect(page.getByRole('article')).toHaveCount(36);
    await full.click();
  }
  await day.click();
  await expect(day).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => day.evaluate(el => {
    const transform = getComputedStyle(el, '::before').transform;
    return transform === 'none' ? 0 : new DOMMatrix(transform).m41;
  })).toBeGreaterThan(40);
  await page.screenshot({ path: testInfo.outputPath('day-centered-toggles.png'), fullPage: true });
  await testInfo.attach('browser-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
  if (errors.length) console.log(`${testInfo.project.name} browser warnings: ${JSON.stringify(errors)}`);
  expect(errors.filter(message => message !== 'ResizeObserver loop completed with undelivered notifications.')).toEqual([]);
});

test('failed daily data shows an unavailable state and never weekly points in Day', async ({ page }) => {
  await page.goto('/e2e/fixtures/matchup-game-progress.html?unavailable');
  await page.getByRole('switch', { name: 'Daily statistics' }).click();
  await expect(page.getByText('Today’s players and stats are temporarily unavailable for North Stars.')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.locator('.hl-matchup-score__team b').first()).toHaveText('—');
});
