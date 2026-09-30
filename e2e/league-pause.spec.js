import {test,expect} from '@playwright/test';
test.use({baseURL:process.env.HL_COMMUNICATION_PREVIEW_ORIGIN||'http://127.0.0.1:5189'});
test('commissioner sees overdue work and explicitly acknowledges unchanged deadlines before resume',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/e2e/fixtures/league-pause.html');
 expect(await page.evaluate(()=>window.pauseRequests)).toEqual([]);await page.getByText('Pause or resume league competition').click();
 await page.getByLabel('Reason for resuming').fill('Schedule and due auctions reviewed');await page.getByRole('button',{name:'Review resume'}).click();
 await expect(page.getByText(/Due operations may run immediately/)).toBeVisible();await expect(page.getByRole('button',{name:'Confirm league resume'})).toBeDisabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('pause-resume-preview.png'),fullPage:true});
 expect(await page.evaluate(()=>window.pauseRequests.some(r=>r.url.endsWith('/apply')))).toBe(false);
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Confirm league resume'}).click();await expect(page.getByRole('status')).toContainText('League resumed.');
 expect(await page.evaluate(()=>window.pauseRequests.filter(r=>r.url.endsWith('/apply')).length)).toBe(1);expect(errors).toEqual([]);
});
