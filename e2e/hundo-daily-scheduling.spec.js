import {expect,test} from "@playwright/test";

const now=Date.parse("2026-11-19T19:00:00Z"); // Noon, Daily's Pacific calendar.
const today={date:"2026-11-19",day:"today",status:"open",firstGameAt:Date.parse("2026-11-20T00:00:00Z"),
  auctionStartsAt:"2026-11-19T23:30:00Z",auctionStartOptions:["2026-11-19T19:15:00Z","2026-11-19T19:30:00Z","2026-11-19T23:30:00Z"]};
const tomorrow={date:"2026-11-20",day:"tomorrow",status:"open",firstGameAt:Date.parse("2026-11-21T00:00:00Z"),
  auctionStartsAt:"2026-11-20T23:30:00Z",auctionStartOptions:["2026-11-20T19:30:00Z","2026-11-20T23:30:00Z"]};

async function fixture(page,locked=false) {
  const writes=[];
  await page.route("**/api/v1/**",async route=>{
    const request=route.request();
    const path=new URL(request.url()).pathname.replace("/api/v1","");
    const answer=data=>route.fulfill({json:{data,meta:{requestId:"schedule",serverNowMs:now}}});
    if(request.method()==="POST") {
      writes.push({path,body:request.postDataJSON()});
      return route.fulfill({status:503,json:{error:{code:"TEST_STOP",message:"Fixture stopped after recording creation.",requestId:"schedule"}}});
    }
    if(path==="/session") return answer({csrfToken:"D".repeat(43),user:{id:"grae",displayName:"Grae",status:"active",version:1},session:{id:"session",userId:"grae",status:"active",version:1,createdAtMs:1,lastUsedAtMs:2,idleExpiresAtMs:3,absoluteExpiresAtMs:4}});
    if(path==="/daily/reminders") return answer({reminders:[]});
    if(path==="/daily/rooms") return answer({rooms:[],slate:locked?tomorrow:today,
      slateOptions:[locked?{...today,status:"locked",auctionStartOptions:[]}:today,tomorrow],practiceSlate:{...today,status:"available"}});
    return route.fulfill({status:404,json:{error:{code:"NOT_FOUND",message:"Fixture missing",requestId:"schedule"}}});
  });
  return writes;
}

test("requires a chosen quarter hour, previews the earlier lock, and submits it",async({page})=>{
  const writes=await fixture(page);
  await page.goto("/daily/create");
  await page.getByLabel("Room name").fill("Lunch auction");
  const create=page.getByRole("button",{name:"Create room",exact:true});
  await expect(create).toBeDisabled();
  const start=page.getByLabel("Auction start time",{exact:true});
  await expect(start).toHaveValue("");
  await expect(start.getByRole("option")).toHaveCount(4);
  await start.selectOption(today.auctionStartOptions[1]);
  const preview=page.getByRole("complementary",{name:"Room preview"});
  await expect(preview).toContainText("12:30 p.m. PT");
  await expect(preview).toContainText("1:00 p.m. PT");
  await expect(preview).toContainText("5:00 p.m. PT");
  await expect(preview).toContainText("Reminder at 12:20 p.m. PT");
  await create.click();
  await expect(page.getByRole("alert")).toContainText("Fixture stopped");
  expect(writes).toEqual([{path:"/daily/rooms",body:{name:"Lunch auction",capacity:8,slateDate:today.date,auctionStartsAt:today.auctionStartOptions[1]}}]);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("tomorrow remains available after games start and requires confirmation",async({page},testInfo)=>{
  const writes=await fixture(page,true);
  await page.goto("/daily/create");
  const day=page.getByLabel("Game day",{exact:true});
  await expect(day).toHaveValue(tomorrow.date);
  await page.getByLabel("Room name").fill("Tomorrow lunch");
  await page.getByLabel("Auction start time",{exact:true}).selectOption(tomorrow.auctionStartOptions[0]);
  await page.getByRole("button",{name:"Create room",exact:true}).click();
  const dialog=page.getByRole("dialog",{name:"Create a room for tomorrow?"});
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("tomorrow’s slate of games");
  await expect(dialog).toContainText("Fri, Nov 20");
  await expect(dialog.getByRole("button",{name:"Go back"})).toBeFocused();
  expect(writes).toHaveLength(0);
  await page.screenshot({path:testInfo.outputPath("tomorrow-confirmation.png"),fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(writes).toHaveLength(0);
  await page.getByRole("button",{name:"Create room",exact:true}).click();
  await dialog.getByRole("button",{name:"Create tomorrow’s room"}).click();
  await expect(page.getByRole("alert")).toContainText("Fixture stopped");
  expect(writes[0].body).toMatchObject({slateDate:tomorrow.date,auctionStartsAt:tomorrow.auctionStartOptions[0]});
});

test("changing the game day clears the selected start; practice still opens immediately",async({page})=>{
  await fixture(page);
  await page.goto("/daily/create");
  await page.getByLabel("Room name").fill("New day");
  const start=page.getByLabel("Auction start time",{exact:true});
  await start.selectOption(today.auctionStartOptions[0]);
  await page.getByLabel("Game day",{exact:true}).selectOption(tomorrow.date);
  await expect(start).toHaveValue("");
  await expect(page.getByRole("button",{name:"Create room",exact:true})).toBeDisabled();
  await page.goto("/daily/practice");
  await expect(start).toHaveCount(0);
  await page.getByLabel("Room name").fill("Practice");
  await expect(page.getByRole("button",{name:"Start practice room"})).toBeEnabled();
  await expect(page.getByRole("complementary",{name:"Room preview"})).toContainText("Immediately");
});
