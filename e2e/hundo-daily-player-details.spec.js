import { expect, test } from '@playwright/test';

async function installFixture(page) {
  const now = Date.now(), at = minutes => new Date(now + minutes * 60_000).toISOString();
  const writes = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const player = { id:'pool-player', name:'Example Injured Skater', position:'D', team:'MIN', opponent:'VAN',
    injury:{status:'injured',source:'admin',observedAtMs:now,needsReview:false,stale:false,details:{timeline:'Week to Week',designation:'IR',reason:'Lower Body'}},
    seasonStatistics:{gamesPlayed:18,goals:8,assists:14,fantasyPointsHundredths:5575} };
  const own = {...player,id:'own-player',name:'Example Roster Skater',price:10,points:2};
  const viewer = {id:'manager-1',name:'Harbour Lights',spent:10,points:2,remainingCap:90,availableCap:90,reserved:0,roster:[own]};
  const slate = {date:at(0).slice(0,10),auctionStartsAt:at(-10),firstGameAt:at(20),day:'today',status:'open'};
  const room = {...slate,id:'details-room',name:'Player details fixture',phase:'auction',auctionEndsAt:at(20),joined:true,mode:'scheduled',capacity:8,memberCount:2,
    commissionerId:viewer.id,commissionerName:viewer.name,canClose:false,winners:[],members:[viewer,{...viewer,id:'manager-2',name:'North Shore',roster:[{...own,id:'other-player',name:'Example Opponent Skater'}]}],
    availablePlayers:[player,{...player,id:'healthy',name:'Example Healthy Skater',injury:{...player.injury,status:'healthy',details:undefined}},
      {...player,id:'missing',name:'Example Missing Details',injury:{...player.injury,details:undefined},seasonStatistics:null}],
    bidLimits:{D:{maxAmount:84,reason:null},F:{maxAmount:84,reason:null}},
    auctions:[{...player,id:'auction-player',name:'Example Auction Skater',position:'C',ownBid:null,bidCount:1,endsAt:at(10)}],rules:{minBid:1,cap:100,lotSeconds:120}};
  const session = {csrfToken:'D'.repeat(43),user:{id:viewer.id,displayName:viewer.name,status:'active',version:1},session:{id:'session-1',userId:viewer.id,status:'active',version:1,createdAtMs:now,lastUsedAtMs:now,idleExpiresAtMs:now+3600_000,absoluteExpiresAtMs:now+86400_000}};
  await page.route('**/api/v1/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    if (request.method() !== 'GET') {
      writes.push({path,method:request.method()});
      return route.fulfill({status:405,json:{error:{code:'READ_ONLY_FIXTURE',message:'This fixture cannot write.',requestId:'local'}}});
    }
    const data = {
      '/api/v1/session':session, '/api/v1/notifications':{code:'NOTIFICATIONS_FOUND',notifications:[],page:{nextCursor:null}},
      '/api/v1/leagues':{code:'LEAGUES_FOUND',leagues:[]}, '/api/v1/daily/reminders':{reminders:[]},
      '/api/v1/daily/rooms':{rooms:[room],slate,slateOptions:[slate],practiceSlate:{...slate,status:'available'},slateUnavailable:false},
      '/api/v1/daily/rooms/details-room':{room}, '/api/v1/daily/rooms/locked-room':{room:{...room,id:'locked-room',phase:'locked'}},
    }[path];
    return route.fulfill({status:data ? 200 : 404,json:data ? {data,meta:{requestId:'details-fixture',serverNowMs:Date.now()}} : {error:{code:'NOT_FOUND',message:'Unknown fixture path.',requestId:'local'}}});
  });
  return {writes,errors};
}

async function showDetails(page, name, isMobile) {
  const trigger = page.getByRole('button',{name:name+' — injured',exact:true});
  await trigger.scrollIntoViewIfNeeded();
  if (isMobile) await trigger.tap(); else await trigger.hover();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  const box = await tooltip.boundingBox(), viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  return tooltip;
}

test('Daily injury details preserve auction input and handle absent recovery data',async({page,isMobile},testInfo)=>{
  const state = await installFixture(page);
  await page.goto('/daily/rooms/details-room');
  const injured = page.getByRole('button',{name:'Example Injured Skater — injured',exact:true});
  await expect(injured).toHaveCSS('color','rgb(238, 153, 158)');
  await expect(page.getByRole('button',{name:'Example Healthy Skater',exact:true})).not.toHaveClass(/hl-injured-player-name/);
  let tip = await showDetails(page,'Example Injured Skater',isMobile);
  await expect(tip).toContainText('55.75'); await expect(tip).toContainText('Timeline: Week to Week');
  await page.screenshot({path:testInfo.outputPath('daily-player-tooltip.png'),animations:'disabled'});
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Bid on Example Injured Skater',exact:true}).click();
  const dialog = page.getByRole('dialog'), amount = dialog.getByRole('spinbutton');
  await expect(amount).toBeFocused(); await expect(page.getByRole('tooltip')).toHaveCount(0);
  await amount.fill('12');
  const dialogName = dialog.getByRole('button',{name:'Example Injured Skater — injured',exact:true});
  if (isMobile) await dialogName.tap(); else await dialogName.hover();
  await expect(dialog.getByRole('tooltip')).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('daily-bid-tooltip.png'),animations:'disabled'});
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible(); await expect(amount).toHaveValue('12');
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  tip = await showDetails(page,'Example Missing Details',isMobile);
  await expect(tip).toContainText('Season statistics unavailable.');
  await expect(tip).toContainText('Recovery timeline not provided.');
  await page.keyboard.press('Escape');
  if (isMobile) await page.getByRole('link',{name:'Auctions',exact:true}).click();
  await expect(page.getByRole('button',{name:'Example Auction Skater — injured',exact:true})).toHaveCSS('color','rgb(238, 153, 158)');
  if (isMobile) await page.getByRole('link',{name:'Roster',exact:true}).click();
  await expect(page.getByRole('button',{name:'Example Roster Skater — injured',exact:true})).toHaveCSS('color','rgb(238, 153, 158)');
  expect(state.writes).toEqual([]); expect(state.errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Daily injury details appear in own and expanded opponent score rosters',async({page,isMobile},testInfo)=>{
  const state = await installFixture(page);
  await page.goto('/daily/rooms/locked-room');
  await expect(page.getByRole('table',{name:'Your roster slots',exact:true}).getByRole('button',{name:'Example Roster Skater — injured',exact:true})).toHaveCSS('color','rgb(238, 153, 158)');
  await page.getByRole('button',{name:'North Shore',exact:true}).click();
  const tip = await showDetails(page,'Example Opponent Skater',isMobile);
  await expect(tip).toContainText('Reason: Lower Body');
  await page.screenshot({path:testInfo.outputPath('daily-opponent-tooltip.png'),animations:'disabled'});
  expect(state.writes).toEqual([]); expect(state.errors).toEqual([]);
});
