import { expect, test } from "@playwright/test";

async function fixture(page) {
  const user = {id:"history-user",displayName:"Grae",status:"active",version:1};
  const summary = {mode:"scheduled",commissionerId:user.id,commissionerName:"Grae",joined:true,canClose:false,memberCount:1,capacity:8,
    auctionStartsAt:"2026-11-18T23:30:00Z",firstGameAt:"2026-11-19T00:00:00Z",auctionEndsAt:"2026-11-19T00:00:00Z",winners:[]};
  const rooms = [
    {...summary,id:"today",name:"Today's action",date:"2026-11-18",phase:"locked"},
    {...summary,id:"yesterday",name:"Yesterday's final",date:"2026-11-17",phase:"finished",winners:[{id:user.id,name:"Grae",points:12}]},
    {...summary,id:"pending",name:"Still collecting stats",date:"2026-11-17",phase:"locked"},
    {...summary,id:"today-final",name:"Today's final",date:"2026-11-18",phase:"finished"},
    {...summary,id:"stranger",name:"Someone else's past room",date:"2026-11-17",phase:"finished",joined:false},
    {...summary,id:"managed",name:"Past admin room",date:"2026-11-17",phase:"finished",joined:false,canClose:true},
  ];
  const reads = [];
  await page.route("**/api/v1/**",async route => {
    const path = new URL(route.request().url()).pathname;
    expect(route.request().method()).toBe("GET");
    reads.push(path);
    let data;
    if (path === "/api/v1/session") data = {csrfToken:"D".repeat(43),user,session:{id:"history-session",userId:user.id,status:"active",version:1,createdAtMs:1,lastUsedAtMs:2,idleExpiresAtMs:3,absoluteExpiresAtMs:4}};
    else if (path === "/api/v1/daily/rooms") data = {rooms,slate:null,slateOptions:[{day:"today",date:"2026-11-18",status:"no_games"}],practiceSlate:{date:"2026-11-18",status:"unavailable"}};
    else if (path === "/api/v1/daily/reminders") data = {reminders:[]};
    else if (path === "/api/v1/notifications") data = {notifications:[],page:{nextCursor:null}};
    else if (path.startsWith("/api/v1/daily/rooms/")) {
      const room = rooms.find(room => path.endsWith("/"+room.id));
      if (room) data = {room:{...room,members:[{id:user.id,name:"Grae",roster:[],points:12,spent:0,remainingCap:100}],auctions:[],availablePlayers:[],rules:{cap:100,minBid:1}}};
    }
    if (!data) return route.fulfill({status:404,json:{error:{code:"NOT_FOUND",message:"Unknown fixture",requestId:"history"}}});
    return route.fulfill({json:{data,meta:{requestId:"history",serverNowMs:Date.parse("2026-11-18T07:00:01Z")}}});
  });
  return reads;
}

test("old finals stay in history while today's rooms and unfinished scoring stay visible",async ({page}) => {
  const reads = await fixture(page);
  await page.goto("/daily");
  await expect(page.getByRole("heading",{name:"Today's action",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Today's final",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Still collecting stats",exact:true})).toBeVisible();
  await expect(page.getByText("Yesterday's final",{exact:true})).toHaveCount(0);
  await expect(page.getByText("Someone else's past room",{exact:true})).toHaveCount(0);
  expect(reads.filter(path=>path.startsWith("/api/v1/daily/rooms/"))).toEqual([]);
  await page.getByRole("link",{name:"View your Hundo Daily history"}).click();
  await expect(page).toHaveURL(/\/daily\/history$/);
  const history = page.getByRole("region",{name:"Hundo Daily history",exact:true});
  await expect(history.getByRole("heading",{name:"Yesterday's final",exact:true})).toBeVisible();
  await expect(history.getByText("Winner · Grae",{exact:true})).toBeVisible();
  await expect(history.getByRole("heading",{name:"Past admin room",exact:true})).toBeVisible();
  await expect(history.getByText("Someone else's past room",{exact:true})).toHaveCount(0);
  await history.locator("li").filter({hasText:"Yesterday's final"}).getByRole("link",{name:"View room"}).click();
  await expect(page.getByRole("heading",{name:"Yesterday's final",exact:true})).toBeVisible();
  await expect(page.locator(".hd-room-box")).toHaveCount(1);
  await expect(page.getByRole("heading",{name:"Today's action",exact:true})).toHaveCount(0);
});

test("active room stacks exclude historical finals and history deep links survive reload",async ({page}) => {
  const reads = await fixture(page);
  await page.goto("/daily/rooms/today");
  await expect(page.locator(".hd-room-box")).toHaveCount(3);
  await expect(page.getByRole("heading",{name:"Still collecting stats",exact:true})).toBeVisible();
  expect(reads).not.toContain("/api/v1/daily/rooms/yesterday");
  await page.goto("/daily/history");
  await page.reload();
  await expect(page.getByRole("heading",{name:"Your Hundo Daily history",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
