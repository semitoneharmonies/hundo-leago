import {test,expect} from '@playwright/test';
test.use({baseURL:process.env.HL_COMMUNICATION_PREVIEW_ORIGIN||'http://127.0.0.1:5189'});

test('commissioner reviews the Week 1 shift with typed confirmation and keeps the existing schedule',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/e2e/fixtures/league-calendar.html?shift');
 await page.getByText('Move Week 1 before Candidate Cards open',{exact:true}).click();
 await page.getByLabel('New Week 1 start (America/Vancouver)').fill('2026-10-12T00:00');
 await page.getByRole('button',{name:'Review Week 1 shift'}).click();
 await expect(page.getByRole('region',{name:'Week 1 shift preview'})).toContainText('1 week will move');
 await expect(page.getByRole('button',{name:'Confirm Week 1 shift'})).toBeDisabled();
 await page.getByLabel('Type CHANGE WEEK 1 START to confirm').fill('CHANGE WEEK 1 START');
 await expect(page.getByRole('button',{name:'Confirm Week 1 shift'})).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('week-one-shift-preview.png'),fullPage:true});
 await page.getByRole('button',{name:'Keep current Week 1'}).click();
 expect(await page.evaluate(()=>window.calendarRequests.filter(r=>r.body?.action==='shift_week_one'))).toEqual([]);
 expect(errors).toEqual([]);
});
test('commissioner reviews recurring auction clocks and the accepted auctions that retain their times',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/e2e/fixtures/league-calendar.html?auctions');
 await page.getByRole('button',{name:'Edit auction schedule'}).click();
 await page.getByLabel('Closing day').selectOption('5');
 await page.getByLabel('Closing time (America/Vancouver)').fill('18:45');
 await page.getByLabel('Minutes before closing to stop new auctions').fill('90');
 await page.getByLabel('Reason for auction schedule change').fill('Managers chose Saturday evenings');
 await page.getByRole('button',{name:'Review auction schedule'}).click();
 const panel=page.getByRole('region',{name:'Auction schedule preview'});
 await expect(panel).toContainText('Saturday at 18:45');
 await expect(panel).toContainText('2 existing auctions keep their saved times and bids');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('auction-schedule-preview.png'),fullPage:true});
 await page.getByRole('button',{name:'Keep current auction schedule'}).click();
 expect(await page.evaluate(()=>window.calendarRequests.map(r=>r.method))).toEqual(['GET','POST']);
 expect(errors).toEqual([]);
});
