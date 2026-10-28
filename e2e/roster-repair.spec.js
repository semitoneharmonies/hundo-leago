import { expect, test } from '@playwright/test';

test('illegal flag previews a fix and applies it only after explicit review', async ({ page }) => {
  await page.goto('/e2e/fixtures/roster-repair.html');
  const flag = page.locator('.hl-roster-illegal');
  await expect(flag).toContainText('Healthy player on IR: Mark Stone');
  expect(await page.evaluate(() => window.repairFixture.requests.filter(request => request.method === 'POST'))).toEqual([]);
  await flag.getByRole('button', { name: 'Suggest a fix' }).click();
  const review = page.getByRole('region', { name: 'Roster fix review' });
  await expect(review.getByText('Week 2', { exact: true })).toBeVisible();
  await expect(review.getByText('Your locked lineup stays unchanged.')).toBeVisible();
  await expect(review.getByText('Scheduled games are not guaranteed appearances or fantasy points.')).not.toBeVisible();
  await review.getByText('Details', { exact: true }).click();
  await expect(review.getByText('Scheduled games are not guaranteed appearances or fantasy points.')).toBeVisible();
  await review.getByText('Details', { exact: true }).click();
  for (const name of ['Mark Stone', 'Nick Suzuki', 'Nikita Kucherov']) await expect(review.getByText(name, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.repairFixture.requests.filter(request => request.path.endsWith('/repair')))).toEqual([]);
  await review.screenshot({ path: `../roster-repair-simple-${test.info().project.name}.png` });
  await page.evaluate(() => { window.repairFixture.failApply = true; });
  await review.getByRole('button', { name: 'Apply these moves' }).click();
  await expect(review.getByRole('alert')).toContainText('could not be confirmed');
  await expect(flag).toContainText('Healthy player on IR: Mark Stone');
  await page.evaluate(() => { window.repairFixture.failApply = false; });
  await review.screenshot({ path: `../roster-repair-${test.info().project.name}.png` });
  await review.getByRole('button', { name: 'Apply these moves' }).click();
  await expect(flag).toHaveCount(0);
  const writes = await page.evaluate(() => window.repairFixture.requests.filter(request => request.method === 'POST'));
  expect(writes.every(request => /\/roster\/repair(-preview)?$/.test(request.path))).toBe(true);
  expect(writes.filter(request => request.path.endsWith('/repair')).every(request => request.body.confirmed === true)).toBe(true);
  expect(await page.evaluate(() => window.repairFixture.players[5].rosterCategory)).toBe('Active');
  expect(await page.evaluate(() => window.repairFixture.players[1].rosterCategory)).toBe('Injured Reserve');
});

test('impossible roster explains manual decisions and offers no automatic apply', async ({ page }) => {
  await page.goto('/e2e/fixtures/roster-repair.html?blocked');
  await page.getByRole('button', { name: 'Suggest a fix' }).click();
  const review = page.getByRole('region', { name: 'Roster fix review' });
  await expect(review.getByText('Roster moves alone can’t fix this team.')).toBeVisible();
  await review.getByText('How to fix it', { exact: true }).click();
  await expect(review.getByText(/No legal arrangement is possible using roster moves alone/)).toBeVisible();
  await expect(review.getByRole('button', { name: 'Apply these moves' })).toHaveCount(0);
  expect(await page.evaluate(() => window.repairFixture.requests.filter(request => request.path.endsWith('/repair')))).toEqual([]);
});

test('other managers can see the illegal flag without repair authority', async ({ page }) => {
  await page.goto('/e2e/fixtures/roster-repair.html?viewer');
  await expect(page.locator('.hl-roster-illegal')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Suggest a fix' })).toHaveCount(0);
  expect(await page.evaluate(() => window.repairFixture.requests.filter(request => request.method === 'POST'))).toEqual([]);
});
