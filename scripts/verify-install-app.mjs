import { chromium, webkit, firefox, devices } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createDesktopNavigationFixture } from '../src/test/desktopNavigationFixture.js';

// Run against a production build configured ONLY for this loopback origin.
const origin = 'http://127.0.0.1:5198';
const output = new URL('../test-results/install-app/', import.meta.url);
await mkdir(output, { recursive: true });
const reports = [];
for (const [name, engine, viewport] of [
  ['desktop-chromium', chromium, { viewport: { width: 1440, height: 1050 } }],
  ['mobile-chromium', chromium, devices['Pixel 5']],
  ['mobile-webkit', webkit, devices['iPhone 13']],
  ...(process.argv.includes('--firefox') ? [['desktop-firefox', firefox, { viewport: { width: 1440, height: 1050 } }]] : []),
]) {
  const browser = await engine.launch({ headless: true });
  try {
    const context = await browser.newContext(viewport);
    const page = await context.newPage();
    const fixture = createDesktopNavigationFixture();
    let preferences = Object.fromEntries(['trade_received','trade_accepted','trade_closed','auction_bid','auction_result','auction_closing','roster_illegal','roster_lock','schedule_changed','announcement','fad_action','commissioner_action'].map(k => [k,true]));
    const errors = [], unexpected = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', async route => {
      const req = route.request(), url = new URL(req.url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname.startsWith('/socket.io')) return route.abort();
      if (!url.pathname.startsWith('/api/')) return route.continue();
      if (req.method() !== 'GET') writes.push({ path: url.pathname, method: req.method() });
      let data;
      if (url.pathname === '/api/v1/session') data = { csrfToken:'D'.repeat(43), user:{...fixture.session.user,status:'active',version:1},session:{id:'00000000-0000-4000-8000-000000000009',userId:fixture.session.user.id,status:'active',createdAtMs:1,lastUsedAtMs:2,idleExpiresAtMs:2000000000000,absoluteExpiresAtMs:2000000000000,version:1} };
      else if (url.pathname === '/api/v1/push/settings') {
        if (req.method() === 'POST') preferences = req.postDataJSON().preferences;
        data = { available:false,publicKey:null,preferences };
      } else try { data = (await fixture.request(url.pathname + url.search)).data; }
      catch { unexpected.push(url.pathname); return route.fulfill({status:404,json:{error:{code:'NOT_FOUND',message:'Synthetic fixture unavailable'}}}); }
      return route.fulfill({ json:{data,meta:{requestId:'local-install-proof'}} });
    });
    await page.goto(origin + '/install');
    await page.getByRole('heading',{name:'Install Hundo Leago',exact:true}).waitFor();
    await page.getByText('Phone notifications aren’t available yet.',{exact:false}).waitFor();
    assert.equal(await page.getByRole('checkbox').count(),12);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
    await page.getByRole('checkbox',{name:'New competing bidders',exact:true}).uncheck();
    await page.getByText('Preferences saved.',{exact:true}).waitFor();
    assert.equal(preferences.auction_bid,false);
    assert.deepEqual(writes,[{path:'/api/v1/push/settings',method:'POST'}]);
    await page.evaluate(() => { window.scrollTo(0,0); document.querySelectorAll('*').forEach(el=>{if(el.scrollTop)el.scrollTop=0;}); });
    await page.getByRole('heading',{name:'Install Hundo Leago',exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:new URL(name+'.png',output).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:false});
    if (name.startsWith('mobile')) await page.getByRole('button',{name:/open.*menu|menu/i}).first().click();
    await page.getByRole('link',{name:'Install Hundo Leago',exact:true}).first().waitFor({state:'visible'});
    const report={name,pageErrors:errors,unexpectedRequests:unexpected,shortSettings:12,sidebarLink:true};
    assert.deepEqual(errors,[]); assert.deepEqual(unexpected,[]);
    if (name === 'desktop-chromium') {
      const client = await context.newCDPSession(page);
      const manifest = await client.send('Page.getAppManifest');
      assert.deepEqual(manifest.errors,[]); assert.equal(JSON.parse(manifest.data).display,'standalone');
      report.manifestValid=true;
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload();
      assert.equal(await page.evaluate(() => !!navigator.serviceWorker.controller),true);
      const cached = await page.evaluate(async()=> { const keys=await caches.keys(); return (await Promise.all(keys.map(async k=>(await (await caches.open(k)).keys()).map(r=>new URL(r.url).pathname)))).flat().sort(); });
      assert.deepEqual(cached,['/icons/app-192.png','/offline.css','/offline.html']); report.cached=cached;
      // Remove network interception so offline proof uses the real service worker.
      await context.unroute('**/*'); await context.setOffline(true);
      await page.goto(origin+'/leagues/offline-test');
      await page.getByRole('heading',{name:'You’re offline'}).waitFor({timeout:5000});
      assert.equal(await page.getByText('Preview Manager',{exact:true}).count(),0);
      report.offline=true;
    }
    reports.push(report); console.log(JSON.stringify(report));
    await writeFile(new URL('verification.json',output),JSON.stringify(reports,null,2));
  } finally { await browser.close(); }
}
await writeFile(new URL('verification.json',output),JSON.stringify(reports,null,2));
