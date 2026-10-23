import {test,expect} from '@playwright/test';
test.use({baseURL:process.env.HL_COMMUNICATION_PREVIEW_ORIGIN||'http://127.0.0.1:5195'});
async function open(page){await page.goto('/e2e/fixtures/league-calendar.html');await expect(page.getByText('Edit your season',{exact:true})).toBeVisible();}
async function drag(page,from,to){
 const source=page.locator('[data-day="'+from+'"]'),target=page.locator('[data-day="'+to+'"]');
 await source.evaluate(el=>el.scrollIntoView({block:'center'}));const s=await source.boundingBox(),t=await target.boundingBox();
 await page.mouse.move(s.x+s.width/2,s.y+s.height/2);await page.mouse.down();await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:12});await page.mouse.up();
}
test('shared Sunday opens an event picker near the click, with no write',async({page})=>{
 await open(page);const day=page.locator('[data-day="2026-10-11"]');await day.click();
 const menu=page.getByRole('dialog',{name:'Choose an event'});await expect(menu.getByRole('button',{name:/Week 1 ends/})).toBeVisible();await expect(menu.getByRole('button',{name:/Weekly auctions close/})).toBeVisible();
 const box=await menu.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize().width);
 expect(await page.evaluate(()=>window.calendarRequests.filter(x=>x.method!=='GET'))).toEqual([]);
});
test('drag a matchup start, choose its time, and move the previous end automatically',async({page},info)=>{
 await open(page);await drag(page,'2026-10-12','2026-10-11');
 await expect(page.getByRole('dialog',{name:'Adjust Week 1 ends / Week 2 starts'})).toBeVisible();
 await expect(page.getByLabel('Date',{exact:true})).toHaveValue('2026-10-11');await page.getByLabel('Start time').fill('09:30');
 await expect(page.getByRole('dialog').getByRole('status')).toContainText('Roster lock moves automatically');
 await expect(page.getByRole('dialog').getByRole('status')).toContainText('9:30 PM');
 await page.getByRole('button',{name:'Add to changes'}).click();
 const pending=page.getByRole('region',{name:'Unsaved calendar changes'});await expect(pending).toContainText('Week 1 ends');await expect(pending).toContainText('Week 2 starts');await expect(pending).toContainText('9:30');
 await expect(pending.getByRole('row',{name:/Week 2 roster lock/})).toContainText('Oct 11, 2026, 9:30 PM');
 expect(await page.evaluate(()=>window.calendarRequests.filter(x=>x.method!=='GET'))).toEqual([]);
 await page.locator('[data-day="2026-10-11"]').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('calendar-drag-week.png'),fullPage:false});
});
test('a shared boundary is one choice and separate dates create a persistent unsaved break',async({page})=>{
 await open(page);await page.getByRole('button',{name:'Matchup weeks',exact:true}).click();
 const choice=page.getByRole('dialog').getByRole('button',{name:/Week 1 ends \/ Week 2 starts/});await expect(choice).toHaveCount(1);await choice.click();
 await expect(page.getByLabel('Week boundary',{exact:true})).toHaveValue('together');await page.getByLabel('Week boundary',{exact:true}).selectOption('break');
 const viewport=page.viewportSize();await page.setViewportSize({width:390,height:844});
 const popup=await page.getByRole('dialog').boundingBox();expect(popup.x).toBeGreaterThanOrEqual(8);expect(popup.y).toBeGreaterThanOrEqual(8);expect(popup.x+popup.width).toBeLessThanOrEqual(382);expect(popup.y+popup.height).toBeLessThanOrEqual(836);await page.setViewportSize(viewport);
 await page.getByLabel('Date',{exact:true}).fill('2026-10-14');await page.getByLabel('Week 1 last day').fill('2026-10-10');await page.getByRole('button',{name:'Add to changes'}).click();
 await expect(page.locator('[data-day="2026-10-12"]')).toContainText('Matchup break');await expect(page.locator('[data-day="2026-10-12"]')).not.toHaveAttribute('data-week',/./);
 await page.getByRole('button',{name:'Matchup weeks',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:/Week 2 starts/}).click();
 await expect(page.getByLabel('Week boundary',{exact:true})).toHaveValue('break');await page.getByLabel('Date',{exact:true}).fill('2026-10-15');await page.getByRole('button',{name:'Add to changes'}).click();
 await expect(page.locator('[data-day="2026-10-14"]')).toContainText('Matchup break');
 expect(await page.evaluate(()=>window.calendarRequests.filter(x=>x.method!=='GET'))).toEqual([]);
 await page.getByRole('button',{name:'Discard changes'}).click();await expect(page.locator('[data-day="2026-10-12"]')).toHaveAttribute('data-week','2');
});
test('weekday headings stay aligned and visible during calendar and page scrolling',async({page},info)=>{
 await open(page);const heading=page.locator('[data-calendar-weekdays]'),scroller=page.locator('[data-calendar-scroll]');
 await heading.scrollIntoViewIfNeeded();const before=await heading.boundingBox();
 await scroller.evaluate(el=>{el.scrollTop+=450;});
 await expect.poll(async()=>(await heading.boundingBox()).y).toBe(before.y);
 await heading.evaluate(el=>window.scrollBy(0,el.getBoundingClientRect().top+100));
 await expect.poll(async()=>Math.abs((await heading.boundingBox()).y)).toBeLessThan(2);
 const mon=await heading.locator('span').first().boundingBox(),cell=await page.locator('[data-day="2026-10-05"]').boundingBox();
 expect(Math.abs((mon.x+mon.width/2)-(cell.x+cell.width/2))).toBeLessThan(3);
 await expect(heading).toContainText('MonTueWedThuFriSatSun');await page.screenshot({path:info.outputPath('calendar-sticky-weekdays.png'),fullPage:false});
});
test('drag a weekly auction and keep it with a trade edit until shared save review',async({page})=>{
 await open(page);await drag(page,'2026-10-11','2026-10-10');
 await page.getByRole('dialog').getByRole('button',{name:/Weekly auctions close/}).click();
 await expect(page.getByLabel('Date',{exact:true})).toHaveValue('2026-10-10');await page.getByLabel('Time',{exact:true}).fill('18:30');await page.getByRole('button',{name:'Add to changes'}).click();
 await expect(page.locator('[data-day="2026-10-10"]')).toHaveAttribute('data-auction-close','true');
 await page.getByRole('button',{name:'Trade deadline',exact:true}).click();await page.getByLabel('Date',{exact:true}).fill('2027-02-13');await page.getByRole('button',{name:'Add to changes'}).click();
 expect(await page.evaluate(()=>window.calendarRequests.filter(x=>x.method!=='GET'))).toEqual([]);
 await page.getByLabel('Reason for changes').fill('Managers chose these dates');await page.getByRole('button',{name:'Save changes',exact:true}).click();
 await expect(page.getByRole('region',{name:'Review schedule warnings'})).toContainText('shorter than seven days');
 const posts=await page.evaluate(()=>window.calendarRequests.filter(x=>x.method==='POST'));expect(posts).toHaveLength(1);expect(posts[0].body.operations.map(o=>o.kind)).toEqual(['trade','schedule']);
});
test('larger connected months label NHL breaks and FAD dates on desktop and mobile',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await open(page);
 await expect(page.getByRole('region',{name:'Interactive season calendar'}).locator('h4')).toHaveCount(12);
 await expect(page.locator('[data-day="2026-12-23"]')).toContainText('Christmas break');await expect(page.locator('[data-day="2027-02-04"]')).toContainText('All-Star break');
 await page.getByRole('button',{name:'Free Agent Draft',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:/Candidate Card deadline/}).click();await expect(page.getByLabel('Date',{exact:true})).toHaveValue('2026-09-30');
 await page.getByRole('button',{name:'Close event editor'}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('[data-day="2026-12-23"]').scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath('calendar-break-labels.png'),fullPage:false});expect(errors).toEqual([]);
});
test('pick a new day across a month boundary without dragging or saving',async({page})=>{
 await open(page);
 await page.getByRole('button',{name:'Free Agent Draft',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:/Candidate Card deadline/}).click();
 await page.getByRole('button',{name:'Choose new day on calendar →'}).click();
 await expect(page.getByRole('status')).toContainText('Click its new day below');
 const sep=page.locator('[data-day="2026-09-30"]'),oct=page.locator('[data-day="2026-10-01"]');
 await sep.scrollIntoViewIfNeeded();const a=await sep.boundingBox(),b=await oct.boundingBox();
 expect(Math.abs(a.y-b.y)).toBeLessThan(2);expect(b.x).toBeGreaterThan(a.x);
 await oct.click();await expect(page.getByLabel('Date',{exact:true})).toHaveValue('2026-10-01');
 await page.getByLabel('Time',{exact:true}).fill('17:30');await page.getByRole('button',{name:'Add to changes'}).click();
 await expect(page.getByRole('region',{name:'Unsaved calendar changes'})).toContainText('Oct 1, 2026');
 expect(await page.evaluate(()=>window.calendarRequests.filter(x=>x.method!=='GET'))).toEqual([]);
 await page.getByLabel('Layout',{exact:true}).selectOption('months');await expect(page.locator('[data-calendar-layout="months"]')).toBeVisible();
 await page.getByLabel('Layout',{exact:true}).selectOption('connected');await expect(page.locator('[data-calendar-layout="connected"]')).toBeVisible();
});
test('dragging across September and October opens the destination time prompt',async({page})=>{
 await open(page);await drag(page,'2026-09-30','2026-10-01');
 const picker=page.getByRole('dialog',{name:'Choose an event'});
 if(await picker.count())await picker.getByRole('button',{name:/Candidate Card deadline/}).click();
 await expect(page.getByLabel('Date',{exact:true})).toHaveValue('2026-10-01');
 expect(await page.evaluate(()=>window.calendarRequests.filter(x=>x.method!=='GET'))).toEqual([]);
});
