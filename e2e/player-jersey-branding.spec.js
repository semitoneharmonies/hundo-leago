import { test, expect } from '@playwright/test';
import { NHL_CARD_PATTERN_SELECTIONS, NHL_TEAM_CARD_SELECTION } from '../src/features/players/nhlTeamPatterns.js';

test('all team numeral assets load and every digit has visible geometry', async ({ page }, testInfo) => {
  const failures = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.url().includes('/nhl-numbers/') && ![200, 304].includes(response.status())) failures.push(response.url()); });
  await page.goto('/e2e/fixtures/player-jersey-branding.html');
  await expect(page.locator('[data-team-preview]')).toHaveCount(32);
  const expectedPatterns = Object.fromEntries(Object.entries(NHL_TEAM_CARD_SELECTION)
    .map(([team, selection]) => [team, NHL_CARD_PATTERN_SELECTIONS[selection].pattern]));
  const readPatterns = () => page.locator('[data-team-preview]').evaluateAll(nodes => Object.fromEntries(
    nodes.map(node => [node.dataset.teamPreview, node.querySelector('[role="img"]').dataset.pattern])));
  expect(await readPatterns()).toEqual(expectedPatterns);
  const distribution = Object.keys(NHL_CARD_PATTERN_SELECTIONS).map(selection =>
    Object.values(NHL_TEAM_CARD_SELECTION).filter(value => value === selection).length);
  expect(distribution.sort()).toEqual([5, 5, 5, 5, 6, 6]);
  await page.reload();
  await expect(page.locator('[data-team-preview]')).toHaveCount(32);
  expect(await readPatterns()).toEqual(expectedPatterns);
  await expect.poll(() => page.locator('[aria-label$="all numeral shapes"] use').evaluateAll(nodes =>
    nodes.filter(node => { const box = node.getBBox(); return box.width > 0 && box.height > 0; }).length)).toBe(320);
  expect(failures).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const utah = page.locator('[data-team-preview="UTA"] [role="img"]');
  await expect(utah).toHaveAttribute('data-numeral-team', 'BOS');
  // Team colours now belong to the original diagonal band, rather than a flat backdrop.
  expect(await utah.evaluate(node => getComputedStyle(node, '::before').backgroundColor)).toBe('rgb(1, 1, 1)');
  expect(await page.locator('[data-team-preview="MTL"] [role="img"]').evaluate(node =>
    getComputedStyle(node, '::before').backgroundColor)).toBe('rgb(175, 30, 45)');
  expect(await utah.evaluate(node => {
    const band = getComputedStyle(node, '::before');
    return { transform: band.transform, stripe: band.borderTopColor, height: band.height };
  })).toEqual({ transform: 'matrix(0.939693, -0.34202, 0.34202, 0.939693, 0, 0)', stripe: 'rgb(108, 172, 228)', height: '42px' });
  await page.screenshot({ path: testInfo.outputPath('all-teams.png'), fullPage: true });
});

test('single and double digits fit the card and preserve keyboard dismissal', async ({ page }, testInfo) => {
  await page.goto('/e2e/fixtures/player-jersey-branding.html');
  for (const [team, number] of [['VAN', 1], ['NSH', 88], ['WPG', 10], ['UTA', 97]]) {
    await page.getByRole('spinbutton').fill(String(number));
    const link = page.getByRole('link', { name: `${team} · open sample card` });
    await link.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const image = dialog.getByRole('img', { name: `${team} jersey number ${number}` });
    await expect(image).toBeVisible();
    await expect.poll(() => image.locator('svg use').first().evaluate(node => node.getBBox().height)).toBeGreaterThan(0);
    const box = await dialog.boundingBox(), viewport = page.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    const svgBox = await image.locator('svg').boundingBox(), imageBox = await image.boundingBox();
    expect(svgBox.x).toBeGreaterThanOrEqual(imageBox.x);
    expect(svgBox.x + svgBox.width).toBeLessThanOrEqual(imageBox.x + imageBox.width);
    if (team === 'UTA') await dialog.screenshot({ path: testInfo.outputPath('utah-card.png') });
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(link).toBeFocused();
  }
});
