import {test,expect} from '@playwright/test';
test.use({baseURL:process.env.HL_COMMUNICATION_PREVIEW_ORIGIN||'http://127.0.0.1:5189'});
test('recovery hub and health remain readonly until an explicit reviewed confirmation',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/e2e/fixtures/league-recovery.html');expect(await page.evaluate(()=>window.recoveryRequests)).toEqual([]);
 await page.getByText('Recovery and supported retries',{exact:true}).click();await page.getByRole('button',{name:'Check site health'}).click();await expect(page.getByText('Account email queue')).toBeVisible();
 expect(await page.evaluate(()=>window.recoveryRequests.every(r=>r.method==='GET'))).toBe(true);
 await page.getByText('Rebuild eligible derived standings',{exact:true}).click();await page.getByRole('button',{name:'Preview standings rebuild'}).click();await expect(page.getByRole('cell',{name:'Ice Owls'})).toBeVisible();await expect(page.getByRole('button',{name:'Confirm standings rebuild'})).toBeDisabled();
 await page.getByLabel('Rebuild reason').fill('Review the derived standings snapshot');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('recovery-preview.png'),fullPage:true});
 await page.getByRole('button',{name:'Confirm standings rebuild'}).click();await expect(page.getByText('Derived standings rebuilt. Recorded results and historical snapshots are retained.')).toBeVisible();expect(await page.evaluate(()=>window.recoveryRequests.filter(r=>r.body?.confirmed===true).length)).toBe(1);expect(errors).toEqual([]);
});
