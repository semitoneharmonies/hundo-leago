import {test,expect} from '@playwright/test';
test.use({baseURL:process.env.HL_COMMUNICATION_PREVIEW_ORIGIN||'http://127.0.0.1:5189'});
test('commissioner reviews category values and matchup impact without changing league data',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/e2e/fixtures/league-scoring.html');
 await page.getByRole('button',{name:'Edit scoring values'}).click();
 await page.getByLabel('Hits forward').fill('0.05');await page.getByLabel('Hits defence').fill('0.10');
 await page.getByLabel('Reason for scoring change').fill('Reduce hits after league vote');
 await page.getByRole('button',{name:'Review scoring change'}).click();
 const panel=page.getByRole('region',{name:'Scoring change preview'});
 await expect(panel).toContainText('Hits (F): 0.20 → 0.05 FP');await expect(panel).toContainText('185.00–195.00 FP');
 await expect(panel).toContainText('does not change completed results');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:testInfo.outputPath('scoring-preview.png'),fullPage:true});
 await page.getByRole('button',{name:'Keep current scoring values'}).click();
 expect(await page.evaluate(()=>window.scoringRequests.map(r=>r.method))).toEqual(['GET','POST']);expect(errors).toEqual([]);
});
