import {test,expect} from '@playwright/test';
test.use({baseURL:process.env.HL_COMMUNICATION_PREVIEW_ORIGIN||'http://127.0.0.1:5189'});
test('catalogue previews global impact and requires confirmation',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/e2e/fixtures/player-catalogue.html');expect(await page.evaluate(()=>window.catalogueRequests)).toEqual([]);
 await page.getByText('Player catalogue',{exact:true}).click();await page.getByLabel('Saved player name or NHL ID').fill('Casey');await page.getByRole('button',{name:'Search catalogue'}).click();await page.getByRole('button',{name:'Review Casey Skater'}).click();await expect(page.getByRole('heading',{name:'Refresh Casey Skater'})).toBeVisible();await expect(page.getByRole('button',{name:'Confirm catalogue change'})).toBeDisabled();
 await page.getByLabel('Reason',{exact:true}).fill('Correct NHL team');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('catalogue.png'),fullPage:true});await page.getByRole('button',{name:'Confirm catalogue change'}).click();await expect(page.getByText(/Player catalogue saved/)).toBeVisible();expect(await page.evaluate(()=>window.catalogueRequests.filter(r=>r.url.endsWith('/apply')).length)).toBe(1);expect(errors).toEqual([]);
});
