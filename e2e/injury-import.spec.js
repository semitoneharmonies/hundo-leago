import { createRequire } from 'node:module';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

const require = createRequire(import.meta.url);
const policy = process.env.HUNDO_IR_BACKEND_ROOT ? require(join(process.env.HUNDO_IR_BACKEND_ROOT, 'src/domain/players/injuryListPolicy.js')) : null;
test.skip(!policy, 'Set HUNDO_IR_BACKEND_ROOT to the paired local backend candidate.');
const players = [
  { id: 'jordan', full_name: 'Jordan Staal' },
  { id: 'liam', full_name: "Liam O'Brien" },
  { id: 'robert', full_name: 'Robert Thomas' },
];
const row = name => `${name}\nDay to Day\nOUT\tLower Body`;

async function open(page) {
  const requests = [];
  await page.route('**/__ir-fixture/*', async route => {
    const input = route.request().postDataJSON();
    const action = route.request().url().split('/').at(-1);
    requests.push({ action, ...input });
    const result = policy.matchInjuryList(policy.parseInjuryList(input.text), players, input.resolutions);
    const counts = { add: result.matches.length, update: 0, clear: 0, unchanged: 0 };
    await route.fulfill({ json: action === 'apply'
      ? { eligible: result.matches.length, counts, skipped: result.skipped.map(item => item.name) }
      : { revision: 'a'.repeat(64), canApply: result.matches.length > 0 && result.unresolved.length === 0,
        total: result.matches.length + result.skipped.length + result.unresolved.length, matched: result.matches.length,
        ...result, counts, changes: result.matches.map(item => ({ ...item, kind: 'add' })), unchanged: [], warnings: [] } });
  });
  await page.goto('/e2e/fixtures/injury-import.html');
  return requests;
}

test('clearly different first names skip and recognized players can continue', async ({ page }) => {
  const requests = await open(page);
  await page.getByLabel('Complete injury list').fill([row('Staal, Jordan'), row("O'Brien, Jake"), row('Thomas, Patrick')].join('\n'));
  await page.getByRole('button', { name: 'Preview changes' }).click();
  await expect(page.getByText('3 names · 1 matched · 2 skipped')).toBeVisible();
  await expect(page.getByText("Will not be imported: Jake O'Brien, Patrick Thomas.")).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveCount(0);
  const apply = page.getByRole('button', { name: 'Apply to all leagues' });
  await expect(apply).toBeDisabled();
  await page.getByRole('checkbox').check();
  await expect(apply).toBeEnabled();
  expect(requests.map(item => item.action)).toEqual(['preview']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `../ir-import-${test.info().project.name}.png`, fullPage: true });
  await apply.click();
  await expect(page.getByRole('status')).toContainText("Not imported: Jake O'Brien, Patrick Thomas.");
  expect(requests.map(item => item.action)).toEqual(['preview', 'apply']);
});

test('similar first name still requires resolution and another preview', async ({ page }) => {
  const requests = await open(page);
  await page.getByLabel('Complete injury list').fill([row('Staal, Jordyn'), row("O'Brien, Jake")].join('\n'));
  await page.getByRole('button', { name: 'Preview changes' }).click();
  await expect(page.getByText('2 names · 0 matched · 1 skipped · 1 need review')).toBeVisible();
  const apply = page.getByRole('button', { name: 'Apply to all leagues' });
  await expect(apply).toBeDisabled();
  await page.getByLabel('Jordyn Staal', { exact: true }).selectOption('jordan');
  await expect(apply).toBeDisabled();
  await page.getByRole('button', { name: 'Preview changes' }).click();
  await expect(page.getByText('2 names · 1 matched · 1 skipped')).toBeVisible();
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  expect(requests.every(item => item.action === 'preview')).toBe(true);
});
