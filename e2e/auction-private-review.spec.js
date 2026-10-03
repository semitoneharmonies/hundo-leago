import {test,expect} from '@playwright/test';
test.use({baseURL:process.env.HL_COMMUNICATION_PREVIEW_ORIGIN||'http://127.0.0.1:5189'});

test('administrator checks site health without requesting private records or starting a worker',async({page},testInfo)=>{
  await page.goto('/e2e/fixtures/auction-private-review.html');
  expect(await page.evaluate(()=>window.privateReviewRequests)).toEqual([]);
  await page.getByRole('button',{name:'Check site health'}).click();
  const panel=page.getByRole('region',{name:'Site health'});
  await expect(panel.getByRole('status')).toContainText('2 waiting · 0 publishing · 1 failed');
  expect(await page.evaluate(()=>window.privateReviewRequests.map(r=>r.url))).toEqual(['/api/v1/operations/health']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await panel.screenshot({path:testInfo.outputPath('site-health.png')});
});

test('commissioner can cancel privately and reveals only the requested bid details',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/e2e/fixtures/auction-private-review.html');
  await expect(page.getByRole('button',{name:'Cancel auction',exact:true})).toBeVisible();
  await expect(page.getByText('Private Competitor',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Cancel auction',exact:true}).click();
  await expect(page.getByText('Confirm auction cancellation')).toBeVisible();
  expect(await page.evaluate(()=>window.privateReviewRequests)).toEqual([]);
  await page.getByLabel('Reason for private bid review').fill('Correct the offer requested by the manager');
  await page.getByRole('button',{name:'Reveal bidding teams for an edit'}).click();
  await expect(page.getByRole('heading',{name:'Private Competitor',exact:true})).toBeVisible();
  await expect(page.getByText(/Revealed contract:/)).toHaveCount(0);
  await page.getByRole('button',{name:'Reveal this bid’s value and term'}).click();
  await expect(page.getByText('Revealed contract: $6.00 total over 2 years.')).toBeVisible();
  expect(await page.evaluate(()=>window.privateReviewRequests.map(r=>r.body.bidId))).toEqual([null,'00000000-0000-4000-8000-000000000006']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath('private-review.png'),fullPage:true});
  await page.getByRole('button',{name:'Hide private bids'}).click();
  await expect(page.getByRole('heading',{name:'Private Competitor',exact:true})).toHaveCount(0);
  await expect(page.getByText(/Revealed contract:/)).toHaveCount(0);
  expect(errors).toEqual([]);
});
