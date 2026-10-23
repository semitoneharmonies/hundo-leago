import {test,expect} from '@playwright/test';
test.use({baseURL:process.env.HL_COMMUNICATION_PREVIEW_ORIGIN||'http://127.0.0.1:5189'});
test('commissioner reviews the exact missing pick and owner before confirming',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/e2e/fixtures/league-pick-repair.html');
  expect(await page.evaluate(()=>window.pickRepairRequests)).toEqual([]);await page.getByText('Repair missing draft picks').click();
  await page.getByRole('button',{name:'Review 2026–27 picks'}).click();await page.getByLabel('Owner of North Stars round 4 pick').selectOption('south');
  await page.getByLabel('Reason for pick repair').fill('Restore the omitted fourth-round pick');await page.getByRole('button',{name:'Preview pick repair'}).click();
  await expect(page.getByText(/owned by South Stars/)).toBeVisible();expect(await page.evaluate(()=>window.pickRepairRequests.some(r=>r.url.endsWith('/apply')))).toBe(false);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('pick-repair-preview.png'),fullPage:true});await page.getByRole('button',{name:'Confirm missing-pick repair'}).click();
  await expect(page.getByRole('status')).toContainText('Missing picks added.');
  expect(await page.evaluate(()=>window.pickRepairRequests.filter(r=>r.url.endsWith('/apply')).length)).toBe(1);expect(errors).toEqual([]);
});
