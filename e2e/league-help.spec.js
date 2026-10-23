import {test,expect} from '@playwright/test';
test.use({baseURL:process.env.HL_COMMUNICATION_PREVIEW_ORIGIN||'http://127.0.0.1:5189'});
test('commissioner reviews a request without fetching private bids and resolves it explicitly',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/e2e/fixtures/league-help.html');expect(await page.evaluate(()=>window.helpRequests)).toEqual([]);
 await page.getByText('Help',{exact:true}).click();await page.getByRole('button',{name:'Please cancel accidental auction'}).click();await expect(page.getByRole('link',{name:'Open Casey Skater auction'})).toBeVisible();
 expect(await page.evaluate(()=>window.helpRequests.every(r=>r.url.includes('/help')&&r.method==='GET'))).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByLabel('Request action').selectOption('resolve');await page.getByLabel('Reply or resolution note').fill('Cancelled the accidental auction using commissioner controls.');
 await page.screenshot({path:testInfo.outputPath('private-help-review.png'),fullPage:true});await page.getByRole('button',{name:'Save reply or action'}).click();await expect(page.getByRole('status')).toContainText('Help request updated.');await expect(page.getByRole('button',{name:'Reopen request'})).toBeVisible();
 expect(await page.evaluate(()=>window.helpRequests.filter(r=>r.method==='POST').length)).toBe(1);expect(errors).toEqual([]);
});
