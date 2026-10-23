import { test, expect } from '@playwright/test';

test('selects dated scores and future zeroes, with seven weekday columns for each week', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/e2e/fixtures/matchup-game-progress.html?fortnight');
  const picker = page.getByRole('group', { name: 'Matchup day', exact: true });
  await expect(page.getByRole('switch', { name: 'Daily statistics' })).toBeVisible();
  await expect(picker).toHaveCount(0);
  await page.getByRole('switch', { name: 'Daily statistics' }).click();
  await expect(picker.getByRole('button')).toHaveCount(14);
  await expect(picker.getByRole('button', { name: 'Sunday, Oct 11', exact: true })).toHaveAttribute('aria-pressed', 'true');
  for (const width of testInfo.project.name.includes('mobile') ? [320, 390, 844] : [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await picker.getByRole('button', { name: 'Monday, Oct 5', exact: true }).click();
    await expect(page.locator('.hl-matchup-score__team b').first()).toHaveText('0.80');
    await expect(page.getByRole('article')).toHaveCount(2);
    await expect(page.getByText(/Monday · Oct 5/)).toBeVisible();
    await picker.getByRole('button', { name: 'Monday, Oct 12', exact: true }).click();
    await expect(page.locator('.hl-matchup-score__team b').first()).toHaveText('0.00');
    await expect(page.getByRole('switch', { name: 'Full statistics' })).toHaveAttribute('aria-checked', 'false');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('day-selector.png'), fullPage: true });
  await page.getByRole('switch', { name: 'Daily statistics' }).click();
  await expect(picker).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(36);
  expect(errors.filter(message => message !== 'ResizeObserver loop completed with undelivered notifications.')).toEqual([]);
});

test('mobile removes season and selected-week panels while desktop keeps its existing sidebar layout', async ({ page }, testInfo) => {
  await page.goto('/e2e/fixtures/desktop-navigation.html');
  const leagueId = await page.evaluate(() => window.navigationFixture.leagues[0].id);
  await page.goto(`/e2e/fixtures/desktop-navigation.html#/leagues/${leagueId}/matchups`);
  await expect(page.getByRole('heading', { name: 'Matchups', exact: true })).toBeVisible();
  const controls = page.locator('.hl-matchup-page-controls');
  const selected = page.locator('.hl-matchup-workspace > .hl-matchup-selector');
  await expect(controls).toHaveCount(1);
  await expect(selected).toHaveCount(1);
  for (const width of [390, 844, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(controls).toBeHidden(); await expect(selected).toBeHidden();
    if (width >= 1024) await expect(page.locator('.hl-desktop-sidebar')).toBeVisible();
  }
  if (testInfo.project.name.includes('mobile')) await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath('matchup-page-controls.png'), fullPage: true });
});
