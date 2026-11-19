import { expect, test } from "@playwright/test";

async function fixture(page, saved) {
  await page.addInitScript(saved => {
    if (saved) localStorage.setItem("hundo-daily-sound:audio-me",saved);
    window.audioContexts = []; window.audioTones = [];
    const Native = window.AudioContext || window.webkitAudioContext;
    if (!Native) return;
    window.AudioContext = class extends Native {
      constructor(...args) { super(...args); window.audioContexts.push(this); }
      createOscillator() {
        const node = super.createOscillator();
        let frequency = 0;
        const set = node.frequency.setValueAtTime.bind(node.frequency);
        node.frequency.setValueAtTime = (value,time) => { frequency = value; return set(value,time); };
        const start = node.start.bind(node);
        node.start = time => { window.audioTones.push(frequency); return start(time); };
        return node;
      }
    };
  },saved);
  const now = Date.now(), at = offset => new Date(now+offset).toISOString();
  const player = {id:"new",name:"Test Skater",position:"F",team:"TOR",opponent:"MTL"};
  const room = { id:"audio-room",name:"Sound check",date:at(0).slice(0,10),phase:"auction",joined:true,
    commissionerId:"audio-me",commissionerName:"Audio Manager",canClose:false,capacity:4,memberCount:2,
    auctionStartsAt:at(-60000),auctionEndsAt:at(600000),firstGameAt:at(600000),winners:[],
    members:[{id:"audio-me",name:"Audio Manager",roster:[],remainingCap:100,availableCap:93,reserved:7,points:0},
      {id:"other",name:"Opponent",roster:[],remainingCap:100,availableCap:null,reserved:null,points:0}],
    availablePlayers:[player],auctions:[{...player,id:"old",name:"Earlier Bid",ownBid:7,bidCount:2,endsAt:at(120000)}],
    rules:{minBid:1,cap:100,lotSeconds:120},bidLimits:{F:{maxAmount:90,reason:null},D:{maxAmount:90,reason:null}} };
  let failBid = true;
  const controls = { closed: false, clock: true };
  const writes = [];
  await page.route("**/api/v1/**",async route => {
    const request = route.request(), path = new URL(request.url()).pathname.replace("/api/v1","");
    const answer = data => route.fulfill({json:{data,meta:{requestId:"audio-fixture",...(controls.clock ? {serverNowMs:Date.now()} : {})}}});
    if (path === "/session") return answer({csrfToken:"A".repeat(43),user:{id:"audio-me",displayName:"Audio Manager",status:"active",version:1},
      session:{id:"audio-session",userId:"audio-me",status:"active",version:1,createdAtMs:1,lastUsedAtMs:2,idleExpiresAtMs:3,absoluteExpiresAtMs:4}});
    if (path === "/notifications") return answer({notifications:[],page:{nextCursor:null}});
    if (path === "/daily/reminders") return answer({reminders:[]});
    if (path === "/daily/rooms") return answer({rooms:[room],slate:{date:room.date,firstGameAt:room.firstGameAt,auctionStartsAt:room.auctionStartsAt},slateOptions:[],practiceSlate:null});
    if (path === "/daily/rooms/audio-room") return controls.closed
      ? route.fulfill({status:410,json:{error:{code:"ROOM_CLOSED",message:"This room was closed.",requestId:"audio-fixture"}}})
      : answer({room});
    if (path === "/daily/rooms/audio-room/bids") {
      writes.push(request.postDataJSON());
      if (failBid) { failBid=false; return route.fulfill({status:409,json:{error:{code:"BID_REJECTED",message:"That bid could not be accepted.",requestId:"audio-fixture"}}}); }
      room.availablePlayers=[]; room.auctions.push({...player,ownBid:12,bidCount:1,endsAt:at(120000)});
      room.members[0].reserved=19; room.members[0].availableCap=81;
      return answer({room});
    }
    return route.fulfill({status:404,json:{error:{code:"NOT_FOUND",message:"Not in fixture",requestId:"audio-fixture"}}});
  });
  return {room,player,writes,at,controls};
}
const tones = page => page.evaluate(() => window.audioTones);
const clearTones = page => page.evaluate(() => { window.audioTones.length=0; });

test("auction sounds unlock on a first tap and follow confirmed bids, slots, awards and early closure",async ({page}) => {
  const {room,player,writes,at} = await fixture(page);
  await page.goto("/daily/rooms/audio-room");
  test.skip(!await page.evaluate(()=>Boolean(window.AudioContext || window.webkitAudioContext)),"This automated browser build has no Web Audio implementation.");
  await expect(page.getByRole("button",{name:"Sounds on",exact:true})).toHaveAttribute("aria-pressed","true");
  await expect(page.getByRole("heading",{name:"Sound check",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.audioContexts.length)).toBe(0);
  await page.getByRole("heading",{name:"Sound check",exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.audioContexts[0]?.state)).toBe("running");
  expect(await tones(page)).toEqual([]);

  await page.getByRole("button",{name:"Bid on Test Skater",exact:true}).click();
  await page.getByLabel("Sealed bid for Test Skater").fill("12");
  await page.getByRole("button",{name:"Place bid",exact:true}).click();
  await expect(page.getByRole("alert").filter({hasText:"That bid could not be accepted."}).first()).toBeVisible();
  expect(await tones(page)).toEqual([]);
  await page.getByRole("button",{name:"Place bid",exact:true}).click();
  await expect.poll(()=>tones(page)).toContain(740);
  expect(writes).toHaveLength(2);

  await clearTones(page);
  room.auctions.push({...player,id:"remote",name:"Remote Nomination",ownBid:null,bidCount:1,endsAt:at(120000)});
  await expect.poll(()=>tones(page),{timeout:7000}).toContain(620);
  await clearTones(page);
  room.auctions=room.auctions.filter(lot=>lot.id === "remote");
  room.members[0].roster=[{...player,price:12,points:0}];
  room.members[1].roster=[{...player,id:"old",name:"Earlier Bid",price:9,points:0}];
  await expect.poll(()=>tones(page),{timeout:7000}).toEqual([880,1320,392,330]);
  await clearTones(page);
  room.phase="locked"; room.auctions=[];
  await expect.poll(()=>tones(page),{timeout:7000}).toEqual([196,294]);
  await expect(page.getByRole("heading",{name:"Room standings",exact:true})).toBeVisible();
});

test("sound toggle stays outside rooms, saves mute and does not replay events",async ({page}) => {
  const {room,player,at} = await fixture(page,"off");
  await page.goto("/daily/rooms/audio-room");
  test.skip(!await page.evaluate(()=>Boolean(window.AudioContext || window.webkitAudioContext)),"This automated browser build has no Web Audio implementation.");
  const toggle=page.getByRole("button",{name:"Sounds off",exact:true});
  await expect(toggle).toHaveAttribute("aria-pressed","false");
  expect(await toggle.evaluate(el=>Boolean(el.closest(".hd-room-box")))).toBe(false);
  await page.getByRole("heading",{name:"Sound check",exact:true}).click();
  expect(await page.evaluate(()=>window.audioContexts.length)).toBe(0);
  room.auctions.push({...player,id:"while-muted",name:"While muted",ownBid:null,bidCount:1,endsAt:at(120000)});
  await expect(page.getByText("While muted",{exact:true})).toBeAttached({timeout:7000});
  await toggle.click();
  await expect(page.getByRole("button",{name:"Sounds on",exact:true})).toHaveAttribute("aria-pressed","true");
  await expect.poll(()=>page.evaluate(()=>window.audioContexts[0]?.state)).toBe("running");
  expect(await tones(page)).toEqual([]);
  await page.getByRole("button",{name:"Sounds on",exact:true}).click();
  expect(await page.evaluate(()=>localStorage.getItem("hundo-daily-sound:audio-me"))).toBe("off");
  await page.reload();
  await expect(page.getByRole("button",{name:"Sounds off",exact:true})).toHaveAttribute("aria-pressed","false");
  expect(await page.evaluate(()=>window.audioContexts.length)).toBe(0);
});

test("unsupported audio leaves the controls and bidding usable",async ({page}) => {
  const {writes} = await fixture(page);
  await page.addInitScript(()=>{ window.AudioContext=undefined; window.webkitAudioContext=undefined; });
  const errors=[]; page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/daily/rooms/audio-room");
  await expect(page.getByRole("button",{name:"Sound unavailable",exact:true})).toBeDisabled();
  await page.getByRole("button",{name:"Bid on Test Skater",exact:true}).click();
  await page.getByLabel("Sealed bid for Test Skater").fill("12");
  await page.getByRole("button",{name:"Place bid",exact:true}).click();
  await expect(page.getByRole("alert").filter({hasText:"That bid could not be accepted."}).first()).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(errors).toEqual([]);
});

test("a remotely closed room stops its stale auction countdown",async ({page}) => {
  const {room,controls} = await fixture(page);
  await page.goto("/daily/rooms/audio-room");
  test.skip(!await page.evaluate(()=>Boolean(window.AudioContext || window.webkitAudioContext)),"This automated browser build has no Web Audio implementation.");
  await page.getByRole("heading",{name:"Sound check",exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.audioContexts[0]?.state)).toBe("running");
  controls.closed=true; controls.clock=false;
  await expect(page.getByRole("alert").filter({hasText:"This room was closed."})).toBeVisible({timeout:15000});
  await clearTones(page);
  await page.clock.install();
  const time = await page.evaluate(async()=> (await import("/src/features/daily/dailyApi.js")).dailyNow());
  await page.clock.fastForward(Math.max(0,Date.parse(room.auctionEndsAt)-time-5000));
  await page.clock.runFor(6000);
  expect(await tones(page)).toEqual([]);
});
