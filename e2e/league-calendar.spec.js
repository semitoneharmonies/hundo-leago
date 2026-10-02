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
test('commissioner reviews coordinated calendar dates without private reads or a write',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/e2e/fixtures/league-calendar.html');
 await page.getByRole('button',{name:'Edit league calendar'}).click();
 await page.getByText('Advanced dates and times',{exact:true}).click();
 await page.getByText('Week 2 · scheduled',{exact:true}).click();
 await page.getByLabel('Roster lock — week 2').fill('2026-10-19T13:00');
 await page.getByLabel('Playoffs end',{exact:true}).fill('2027-04-11T00:00');
 await page.getByLabel('Reason for calendar changes').fill('League agreed to revised dates');
 await page.getByRole('button',{name:'Review calendar changes'}).click();
 await expect(page.getByRole('region',{name:'Calendar change preview'})).toContainText('1 pending operations');
 await expect(page.getByRole('button',{name:'Confirm calendar changes'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('calendar-preview.png'),fullPage:true});
 await page.getByRole('button',{name:'Keep current calendar'}).click();
 expect(await page.evaluate(()=>window.calendarRequests.map(r=>r.method))).toEqual(['GET','POST']);
 expect(await page.evaluate(()=>window.calendarRequests.every(r=>r.url.endsWith('/calendar/season')||r.url.endsWith('/calendar/season/preview')))).toBe(true);
 expect(errors).toEqual([]);
});

test('full-year calendar highlights events and lets a commissioner select a matchup range',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/e2e/fixtures/league-calendar.html');
 const calendar=page.getByRole('region',{name:'Interactive season calendar'});
 await expect(calendar.locator('h4')).toHaveCount(12);
 await page.getByLabel('Calendar action').selectOption('week:11111111-1111-4111-8111-111111111112');
 await page.getByRole('button',{name:/^November 1, 2026/}).click();await page.getByRole('button',{name:/^November 7, 2026/}).click();
 await expect(page.getByLabel('First matchup day')).toHaveValue('2026-11-01');await expect(page.getByLabel('Last matchup day')).toHaveValue('2026-11-07');
 expect(await page.evaluate(()=>window.calendarRequests.map(r=>r.method))).toEqual(['GET']);
 await page.getByLabel('Reason for calendar changes').fill('A later matchup week');await page.getByRole('button',{name:'Review calendar changes'}).click();
 await expect(page.getByRole('region',{name:'Calendar change preview'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('interactive-calendar.png'),fullPage:true});expect(errors).toEqual([]);
});

test('calendar exposes editing tools, visible auction markers and three playoff colours',async({page},testInfo)=>{
 await page.goto('/e2e/fixtures/league-calendar.html');
 for(const name of ['Matchup weeks','Auction dates','Trade deadline','Playoffs'])await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
 await expect(page.locator('[data-day="2026-10-04"]')).toHaveAttribute('data-auction-close','true');await expect(page.locator('[data-day="2026-10-02"]')).toHaveAttribute('data-auction-cutoff','true');
 const colours=await page.locator('[data-playoff-round]').evaluateAll(nodes=>[...new Set(nodes.map(n=>getComputedStyle(n).backgroundColor))]);expect(colours).toHaveLength(3);
 await page.getByRole('button',{name:'Auction dates',exact:true}).click();await page.getByRole('button',{name:'Edit auction schedule',exact:true}).waitFor();
 await page.locator('[data-day="2026-10-03"]').click();await expect(page.getByLabel('Closing day',{exact:true})).toHaveValue('5');
 await expect(page.getByRole('link',{name:'Edit an existing auction'})).toHaveAttribute('href','/leagues/11111111-1111-4111-8111-111111111111/auctions');
 expect(await page.evaluate(()=>window.calendarRequests.some(r=>r.method==='POST'))).toBe(false);
 await page.getByLabel('Reason for auction schedule change').fill('Calendar closing-day preview');await page.getByRole('button',{name:'Review auction schedule',exact:true}).click();await expect(page.getByRole('region',{name:'Auction schedule preview'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:testInfo.outputPath('calendar-auction-editor.png'),fullPage:true});
});
