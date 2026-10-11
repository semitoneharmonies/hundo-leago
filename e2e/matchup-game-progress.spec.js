import { test, expect } from '@playwright/test';

test('GP and GR pills align beneath their team scores without overflow', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/e2e/fixtures/matchup-game-progress.html');
  const totals = page.getByLabel('Matchup player-game totals');
  await expect(totals.getByLabel('Games played: 12', { exact: true })).toHaveText('GP 12');
  await expect(totals.getByLabel('Games remaining: 38', { exact: true })).toHaveText('GR 38');
  await expect(totals.getByLabel('Games played: 15', { exact: true })).toHaveText('GP 15');
  await expect(totals.getByLabel('Games remaining: 34', { exact: true })).toHaveText('GR 34');
  await expect(totals).not.toContainText(/North Stars|Harbour Wolves|tallied|remaining/);
  const summary = page.locator('.hl-scoring-stat-guide > summary');
  expect(await summary.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await summary.boundingBox();
  expect(box.height).toBeLessThan(box.width <= 680 ? 70 : 30);
  for (const width of testInfo.project.name.includes('mobile') ? [390, 320] : [1280, 1024, 900]) {
    await page.setViewportSize({ width, height: 850 });
    for (let i = 0; i < 2; i++) {
      const score = await page.locator('.hl-matchup-score__team').nth(i).boundingBox();
      const pills = page.locator('.hl-matchup-game-progress__team').nth(i).locator('.hl-matchup-game-progress__pill');
      const first = await pills.first().boundingBox(), last = await pills.last().boundingBox();
      expect(Math.abs((first.x + last.x + last.width) / 2 - (score.x + score.width / 2))).toBeLessThan(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const control = await page.getByRole('switch', { name: 'Full statistics' }).boundingBox();
    const bar = await summary.boundingBox();
    const label = await page.getByText('Scoring stat key', { exact: true }).boundingBox();
    expect(Math.abs(control.x + control.width / 2 - (bar.x + bar.width / 2))).toBeLessThan(1);
    expect(Math.abs(control.y + control.height / 2 - (label.y + label.height / 2))).toBeLessThan(1);
    expect(label.x + label.width).toBeLessThanOrEqual(control.x);
  }
  await page.getByText('Scoring stat key', { exact: true }).click();
  await expect(page.locator('.hl-scoring-stat-guide')).toHaveAttribute('open', '');
  await page.getByText('Scoring stat key', { exact: true }).click();
  await expect(page.locator('.hl-scoring-stat-guide')).not.toHaveAttribute('open');
  await page.setViewportSize({ width: testInfo.project.name.includes('mobile') ? 390 : 1280, height: 850 });
  await page.screenshot({ path: testInfo.outputPath('matchup-games.png') });
  expect(errors).toEqual([]);
});

test('unavailable counts do not turn into zero games', async ({ page }) => {
  await page.goto('/e2e/fixtures/matchup-game-progress.html?unavailable');
  await expect(page.getByLabel('Games played: unavailable', { exact: true })).toHaveCount(2);
  await expect(page.getByLabel('Games remaining: unavailable', { exact: true })).toHaveCount(2);
  await expect(page.getByLabel('Matchup player-game totals')).not.toContainText('GR 0');
});

test('GR shows only per-player counts and opponents without toggling the scoring key', async ({ page }, testInfo) => {
  await page.goto('/e2e/fixtures/matchup-game-progress.html');
  const home = page.getByRole('button', { name: 'Games remaining: 38', exact: true });
  await home.focus();
  await page.keyboard.press('Enter');
  const panel = page.getByRole('region', { name: 'North Stars remaining games' });
  await expect(panel).toBeVisible();
  await expect(home).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.hl-scoring-stat-guide')).not.toHaveAttribute('open');
  await expect(panel.locator('tbody tr')).toHaveCount(18);
  expect(await panel.locator('tbody tr td:nth-child(2)').evaluateAll(cells => cells.reduce((sum, cell) => sum + Number(cell.textContent), 0))).toBe(38);
  await expect(panel).not.toContainText(/player-games|upcoming|awaiting|Today|Games remaining/);
  await expect(panel.locator('tbody tr').first()).toContainText('Alex Mercer');
  await expect(panel.locator('tbody tr').first().locator('td').last()).toContainText('SEA');
  await page.screenshot({ path: testInfo.outputPath('remaining-breakdown.png') });
  await page.getByRole('button', { name: 'Games remaining: 34', exact: true }).click();
  await expect(panel).not.toBeVisible();
  expect(await page.getByRole('region', { name: 'Harbour Wolves remaining games' }).locator('tbody tr td:nth-child(2)').evaluateAll(cells => cells.reduce((sum, cell) => sum + Number(cell.textContent), 0))).toBe(34);
  await page.getByRole('button', { name: 'Close remaining games' }).focus();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Games remaining: 34', exact: true })).toBeFocused();
  await expect(page.getByRole('region', { name: 'Harbour Wolves remaining games' })).not.toBeVisible();
});

test('compact and full statistics preserve points and today markers reveal game details', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/e2e/fixtures/matchup-game-progress.html');
  const row = page.locator('.hl-matchup-player--home').first();
  const points = await row.locator('.hl-matchup-player-fp').innerText();
  const viewSwitch = page.getByRole('switch', { name: 'Full statistics' });
  await expect(viewSwitch).toHaveAttribute('aria-checked', 'false');
  await expect(row.locator('.hl-matchup-stat')).toHaveCount(1);
  await expect(page.locator('.hl-matchup-player--home').nth(12).getByLabel('Games played in this matchup: 0')).toBeVisible();
  await expect(page.getByText(/Playing today · tap/)).not.toBeVisible();
  for (const [name, text] of [['Alex Mercer', 'Stats collected'], ['Jordan Campbell', 'Stats pending'], ['Noah Sullivan', 'Live'], ['Ethan Tremblay', '7:00']]) {
    const dot = page.getByRole('button', { name: `Today's game for ${name}`, exact: true });
    await dot.scrollIntoViewIfNeeded();
    const before = await dot.locator('xpath=ancestor::article').boundingBox();
    await dot.click();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toContainText(text);
    const after = await dot.locator('xpath=ancestor::article').boundingBox();
    expect(after.height).toBe(before.height);
    const bounds = await tooltip.boundingBox();
    expect(bounds.width).toBeLessThanOrEqual(220);
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(page.viewportSize().height);
    if (name === 'Alex Mercer') await page.screenshot({ path: testInfo.outputPath('collected-popup.png') });
    await page.keyboard.press('Escape');
    await expect(tooltip).not.toBeVisible();
    await expect(dot).toBeFocused();
  }
  await viewSwitch.click();
  await expect(viewSwitch).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.hl-scoring-stat-guide')).not.toHaveAttribute('open');
  await expect(row.locator('.hl-matchup-stat')).toHaveCount(14);
  await expect(row.locator('.hl-matchup-player-fp')).toHaveText(points);
  await expect(page.getByRole('button', { name: "Today's game for Alex Mercer", exact: true })).toBeVisible();
  await viewSwitch.click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('compact-and-today.png') });
  expect(errors).toEqual([]);
});
