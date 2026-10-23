import {test,expect} from '@playwright/test';
test.use({baseURL:process.env.HL_COMMUNICATION_PREVIEW_ORIGIN||'http://127.0.0.1:5189'});
test('season preview shows contract and pick impact using reads only',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/e2e/fixtures/season-preview.html');expect(await page.evaluate(()=>window.seasonRequests)).toEqual([]);
 await page.getByText('Preview next season',{exact:true}).click();await page.getByText('Contract changes (2)').click();await page.getByText('Retention and buyout obligations (1)').click();await page.getByText('Next-season draft picks (1)').click();
 await expect(page.getByText('Casey Skater')).toBeVisible();await expect(page.getByText('Prepare and schedule the next entry draft.')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('season-preview.png'),fullPage:true});
 await page.getByRole('button',{name:'Refresh season preview'}).click();expect(await page.evaluate(()=>window.seasonRequests.every(r=>r.method==='GET'))).toBe(true);expect(errors).toEqual([]);
});
