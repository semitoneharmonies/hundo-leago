import { expect, test } from "@playwright/test";
import { SCORING_CATEGORIES } from "../src/shared/scoringCategories.js";

const viewer = {id:"stripe-manager",displayName:"Harbour Lights",status:"active",version:1};
const appearance = {patternTemplate:"even-three",primaryColour:"#ffffff",secondaryColour:"#ffff00",tertiaryColour:"#00ff00"};

async function installProfile(page,options={}) {
  const state = {appearance:options.saved ?? null,readFails:options.readFails ?? false,writes:[],reads:[]};
  let releaseSave;
  const gate = new Promise(resolve=>{releaseSave=resolve;});
  const now = Date.now();
  const firstGameAt = new Date(now - 3600_000).toISOString();
  const stats = Object.fromEntries(SCORING_CATEGORIES.map(({key})=>[key,0]));
  const room = () => ({id:"stripe-room",name:"Stripe preview room",date:firstGameAt.slice(0,10),phase:"locked",mode:"scheduled",firstGameAt,
    auctionStartsAt:new Date(now-5400_000).toISOString(),auctionEndsAt:firstGameAt,commissionerId:viewer.id,commissionerName:viewer.displayName,
    memberCount:2,capacity:8,joined:true,canClose:false,winners:[],rules:{cap:100,minBid:1},availablePlayers:[],auctions:[],
    members:[{id:viewer.id,name:viewer.displayName,dailyAppearance:state.appearance,spent:24,remainingCap:76,points:19.25,roster:[],scoringStats:stats,statsStatus:"collected"},
      {id:"plain-manager",name:"Plain Manager",dailyAppearance:null,spent:0,remainingCap:100,points:0,roster:[],scoringStats:stats,statsStatus:"pending"}]});
  await page.route("**/api/v1/**",async route=>{
    const request=route.request();
    const path=new URL(request.url()).pathname.replace("/api/v1","");
    const answer=data=>route.fulfill({json:{data,meta:{requestId:"daily-profile",serverNowMs:now}}});
    const reject=(status,message)=>route.fulfill({status,json:{error:{code:"DAILY_PROFILE_INVALID",message,requestId:"daily-profile"}}});
    if (request.method()==="GET") {
      state.reads.push(path);
      if (path==="/session") return answer({csrfToken:"D".repeat(43),user:viewer,session:{id:"stripe-session",userId:viewer.id,status:"active",version:1,createdAtMs:now,lastUsedAtMs:now,idleExpiresAtMs:now+3600_000,absoluteExpiresAtMs:now+86400_000}});
      if (path==="/notifications") return answer({code:"NOTIFICATIONS_FOUND",notifications:[],page:{nextCursor:null}});
      if (path==="/daily/reminders") return answer({reminders:[]});
      if (path==="/daily/rooms") return answer({rooms:[room()],slate:null,slateOptions:[],practiceSlate:null});
      if (path==="/daily/rooms/stripe-room") return answer({room:room()});
      if (path==="/daily/profile") return state.readFails ? reject(503,"Your Daily profile is temporarily unavailable.") : answer({profile:{appearance:state.appearance}});
    }
    if (request.method()==="POST" && path==="/daily/profile") {
      state.writes.push(request.postDataJSON());
      if (options.rejectFirstSave && state.writes.length===1) return reject(422,"Choose valid colours for this template.");
      if (options.holdSave) await gate;
      state.appearance=structuredClone(request.postDataJSON().appearance);
      return answer({profile:{appearance:state.appearance}});
    }
    return reject(404,"Unknown profile fixture request.");
  });
  return {...state,state,releaseSave};
}

test("an unset Daily profile loads read-only with None and a plain preview",async({page},testInfo)=>{
  const {state}=await installProfile(page);
  await page.goto("/daily/profile");
  await expect(page.getByRole("heading",{name:"Your Daily stripes"})).toBeVisible();
  await expect(page.getByLabel("Stripe template")).toHaveValue("");
  await expect(page.locator('input[type="color"]')).toHaveCount(0);
  await expect(page.locator(".hd-user-stripes")).toHaveCount(0);
  await expect(page.locator(".hdp-preview-bar")).toHaveText(viewer.displayName);
  await expect(page.getByRole("button",{name:"Save stripes"})).toBeDisabled();
  await expect(page.getByRole("button",{name:"Clear stripes"})).toBeDisabled();
  expect(state.writes).toEqual([]);
  expect(state.reads).toContain("/daily/profile");
  expect(state.reads.some(path=>path.startsWith("/leagues"))).toBe(false);
  await page.screenshot({path:testInfo.outputPath("daily-stripes-none.png"),fullPage:true,animations:"disabled"});
});

test("choosing colours previews a draft, then save persists and clear removes it",async({page},testInfo)=>{
  const fixture=await installProfile(page,{holdSave:true});
  await page.goto("/daily/profile");
  await page.getByLabel("Stripe template").selectOption("even-three");
  await expect(page.locator('input[type="color"]')).toHaveCount(3);
  await page.getByLabel("Colour 1",{exact:true}).fill("#ffffff");
  await page.getByLabel("Colour 2",{exact:true}).fill("#ffff00");
  await page.getByLabel("Colour 3",{exact:true}).fill("#00ff00");
  await expect(page.locator(".hd-user-stripes")).toHaveCount(1);
  expect(fixture.state.appearance).toBeNull();
  expect(fixture.state.writes).toEqual([]);
  await page.getByRole("button",{name:"Save stripes"}).click();
  try {
    await expect(page.getByRole("button",{name:"Saving…"})).toBeDisabled();
    await expect(page.getByLabel("Stripe template")).toBeDisabled();
  } finally {fixture.releaseSave();}
  await expect(page.getByText("Stripes saved.")).toBeVisible();
  expect(fixture.state.writes).toEqual([{appearance}]);
  await page.reload();
  await expect(page.getByLabel("Stripe template")).toHaveValue("even-three");
  await expect(page.getByLabel("Colour 3",{exact:true})).toHaveValue("#00ff00");
  await page.screenshot({path:testInfo.outputPath("daily-stripes-saved.png"),fullPage:true,animations:"disabled"});
  await page.getByRole("button",{name:"Clear stripes"}).click();
  await expect(page.getByText("Stripes cleared.")).toBeVisible();
  await expect(page.locator(".hd-user-stripes")).toHaveCount(0);
  expect(fixture.state.writes.at(-1)).toEqual({appearance:null});
  await page.reload();
  await expect(page.getByLabel("Stripe template")).toHaveValue("");
});

test("None can be saved and cancelled drafts do not change the server",async({page})=>{
  const {state}=await installProfile(page,{saved:appearance});
  await page.goto("/daily/profile");
  await page.getByLabel("Stripe template").selectOption("even-two");
  await expect(page.locator('input[type="color"]')).toHaveCount(2);
  await page.getByRole("button",{name:"Cancel changes"}).click();
  await expect(page.getByLabel("Stripe template")).toHaveValue("even-three");
  expect(state.writes).toEqual([]);
  await page.getByLabel("Stripe template").selectOption("even-two");
  await page.getByRole("link",{name:"All rooms",exact:true}).click();
  await expect(page).toHaveURL(/\/daily$/);
  await expect(page.getByRole("heading",{name:"Rooms",exact:true})).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/daily\/profile$/);
  await expect(page.getByLabel("Stripe template")).toHaveValue("even-three");
  expect(state.writes).toEqual([]);
  await page.getByLabel("Stripe template").selectOption("");
  await expect(page.locator(".hd-user-stripes")).toHaveCount(0);
  await page.getByRole("button",{name:"Save stripes"}).click();
  await expect(page.getByText("Stripes cleared.")).toBeVisible();
  expect(state.writes).toEqual([{appearance:null}]);
});

test("server validation keeps the draft and offers a successful retry",async({page})=>{
  const {state}=await installProfile(page,{rejectFirstSave:true});
  await page.goto("/daily/profile");
  await page.getByLabel("Stripe template").selectOption("wide-centre-stripe");
  await page.getByLabel("Colour 1",{exact:true}).fill("#123456");
  await page.getByRole("button",{name:"Save stripes"}).click();
  await expect(page.getByRole("alert").filter({hasText:"Choose valid colours"})).toBeVisible();
  await expect(page.getByLabel("Stripe template")).toHaveValue("wide-centre-stripe");
  await expect(page.getByLabel("Colour 1",{exact:true})).toHaveValue("#123456");
  expect(state.appearance).toBeNull();
  await page.getByRole("button",{name:"Save stripes"}).click();
  await expect(page.getByText("Stripes saved.")).toBeVisible();
  expect(state.appearance.tertiaryColour).toBeNull();
});

test("a failed profile read can retry without saving an appearance",async({page})=>{
  const {state}=await installProfile(page,{readFails:true});
  await page.goto("/daily/profile");
  await expect(page.getByRole("alert").filter({hasText:"Your Daily profile is temporarily unavailable."})).toBeVisible({timeout:15000});
  await expect(page.locator(".hd-user-stripes")).toHaveCount(0);
  expect(state.writes).toEqual([]);
  state.readFails=false;
  await page.getByRole("button",{name:"Try again",exact:true}).click();
  await expect(page.getByLabel("Stripe template")).toHaveValue("");
  await expect(page.getByRole("button",{name:"Save stripes"})).toBeDisabled();
  expect(state.writes).toEqual([]);
});

for (const [width,height] of [[568,320],[932,430]]) {
  test(`landscape ${width} stripes fade behind the manager without obscuring stats`,async({page},testInfo)=>{
    test.skip(!testInfo.project.use.isMobile,"Uses the mobile landscape layout.");
    const {state}=await installProfile(page,{saved:appearance});
    await page.setViewportSize({width,height});
    await page.goto("/daily/rooms/stripe-room");
    const ranks=page.getByRole("table",{name:"Manager rankings"});
    const coloured=ranks.getByRole("row",{name:/Harbour Lights/});
    const plain=ranks.getByRole("row",{name:/Plain Manager/});
    const stripes=coloured.locator(".hd-user-stripes");
    await expect(stripes).toHaveCount(1);
    await expect(stripes).toHaveAttribute("aria-hidden","true");
    await expect(stripes).toHaveCSS("mask-image",/linear-gradient/);
    await expect(stripes).toHaveCSS("pointer-events","none");
    await expect(plain.locator(".hd-user-stripes")).toHaveCount(0);
    await page.evaluate(()=>document.fonts.ready);
    expect(await ranks.evaluate(table=>{
      const region=table.closest(".hds-table-scroll");
      const manager=table.querySelector(".hd-user-stripe-cell");
      const stripe=manager.querySelector(".hd-user-stripes");
      const cellBounds=manager.getBoundingClientRect();
      const stripeBounds=stripe.getBoundingClientRect();
      return region.scrollWidth<=region.clientWidth+1 && stripeBounds.left>=cellBounds.left && stripeBounds.right<=cellBounds.right;
    })).toBe(true);
    for (const {abbreviation} of SCORING_CATEGORIES) await expect(ranks.getByRole("columnheader",{name:abbreviation,exact:true})).toBeVisible();
    await expect(coloured.locator(".hds-fp")).toHaveCSS("color","rgb(210, 155, 196)");
    await expect(coloured.locator(".hds-fp")).toHaveCSS("font-weight","700");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(state.writes).toEqual([]);
    await page.screenshot({path:testInfo.outputPath(`daily-stripes-landscape-${width}.png`),fullPage:true,animations:"disabled"});
  });
}
