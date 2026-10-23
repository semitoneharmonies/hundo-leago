import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const preview = "/e2e/fixtures/desktop-navigation.html";
const reminder = page => page.getByRole("complementary", { name:"League kitty payment reminder" });
const savedWindow = page => page.evaluate(() => JSON.parse(localStorage.getItem(`hundo:kitty-payment:display-v2:${window.navigationFixture.session.user.id}`)));
async function settleQueries(page) {
  // React Query batches updates with timers, so a paused test clock must flush them.
  await expect.poll(async () => {
    await page.clock.runFor(50);
    return page.locator(".hl-roster-hero").count();
  }).toBe(1);
}
async function advanceToLastMillisecond(page) {
  const remaining = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem(`hundo:kitty-payment:display-v2:${window.navigationFixture.session.user.id}`));
    return saved.expiresAtMs - Date.now();
  });
  expect(remaining).toBeGreaterThan(1);
  await page.clock.runFor(remaining - 1);
}
async function pauseClock(page) {
  await page.clock.install({ time:new Date("2026-10-22T10:00:00-07:00") });
  await page.clock.pauseAt(new Date("2026-10-22T10:00:01-07:00"));
  await page.emulateMedia({ reducedMotion:"reduce" });
}

test("flag lasts 15 seconds across navigation, Back, clicks and refresh without restarting", async ({ page }, testInfo) => {
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await pauseClock(page);
  await page.goto(preview,{waitUntil:"domcontentloaded"});
  await settleQueries(page);
  await expect(reminder(page)).toBeVisible();
  const first=await reminder(page).innerText();
  const firstWindow=await savedWindow(page);
  const box=await reminder(page).boundingBox();
  const header=await page.locator(".hl-app-header").boundingBox();
  expect(Math.abs(box.y-header.y-header.height)).toBeLessThan(3);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize().width);
  if(page.viewportSize().width<1024) {
    const hero=await page.locator(".hl-roster-hero").boundingBox();
    expect(hero.y).toBeGreaterThanOrEqual(box.y+box.height);
  }
  await page.screenshot({path:`../evidence/kitty-timer-${testInfo.project.name}.png`});
  await expect(page.getByRole("button",{name:/Dismiss payment/})).toHaveCount(0);
  await page.clock.runFor(5_000);
  await page.getByRole("button",{name:"Account menu",exact:true}).click();
  await expect(reminder(page)).toHaveText(first);
  await page.keyboard.press("Escape");
  await page.getByRole("link",{name:"Hundo Leago",exact:true}).click();
  await expect(reminder(page)).toHaveText(first);
  await page.clock.runFor(5_000);
  await page.goBack();
  await expect(reminder(page)).toHaveText(first);
  await page.reload({waitUntil:"domcontentloaded"});
  await settleQueries(page);
  await expect(reminder(page)).toHaveText(first);
  expect(await savedWindow(page)).toEqual(firstWindow);
  await advanceToLastMillisecond(page);
  await expect(reminder(page)).toBeVisible();
  await page.clock.runFor(1);
  await expect(reminder(page)).toHaveCount(0);
  await page.reload({waitUntil:"domcontentloaded"});
  await settleQueries(page);
  await expect(page.getByRole("button",{name:"Account menu",exact:true})).toBeVisible();
  await expect(reminder(page)).toHaveCount(0);
  await page.clock.setSystemTime(new Date("2026-10-23T10:00:00-07:00"));
  await page.evaluate(()=>window.dispatchEvent(new Event("focus")));
  await expect(reminder(page)).toBeVisible();
  expect(await reminder(page).innerText()).not.toBe(first);
  await page.clock.runFor(15_000);
  await expect(reminder(page)).toHaveCount(0);
  expect(await page.evaluate(()=>window.navigationFixture.requests.every(({method})=>method==="GET"))).toBe(true);
  expect(errors).toEqual([]);
});

test("flag accessibility with the real browser clock", async ({ page }) => {
  await page.goto(preview);
  await expect(reminder(page)).toBeVisible();
  expect((await new AxeBuilder({page}).include(".hl-kitty-flag").analyze()).violations).toEqual([]);
});

test("first sign-in redirect cannot consume the daily flag", async ({ page }) => {
  await pauseClock(page);
  await page.goto("/e2e/fixtures/kitty-login.html",{waitUntil:"domcontentloaded"});
  await expect(reminder(page)).toHaveCount(0);
  await page.getByRole("button",{name:"Sign in as preview manager"}).click();
  await expect(page.getByRole("heading",{name:"Signed-in dashboard"})).toBeVisible();
  await expect(reminder(page)).toBeVisible();
  await page.clock.runFor(14_999);
  await page.getByRole("link",{name:"Open players"}).click();
  await expect(reminder(page)).toBeVisible();
  expect(await reminder(page).evaluate(element=>getComputedStyle(element).animationName)).toBe("none");
  await page.clock.runFor(1);
  await expect(reminder(page)).toHaveCount(0);
});

test("all ten messages fit at 320px without hiding the heading", async ({ page }, testInfo) => {
  await page.setViewportSize({width:320,height:740});
  await pauseClock(page);
  const messages=new Set();
  for(let day=22;day<32;day+=1) {
    await page.clock.setSystemTime(new Date(2026,9,day,12));
    await page.goto(preview,{waitUntil:"domcontentloaded"});
    await settleQueries(page);
    await expect(reminder(page)).toBeVisible();
    await expect(page.getByRole("heading",{name:"Own Goal Hatty",exact:true})).toBeVisible();
    const box=await reminder(page).boundingBox();
    const hero=await page.locator(".hl-roster-hero").boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(320);
    expect(hero.y).toBeGreaterThanOrEqual(box.y+box.height);
    messages.add(await reminder(page).innerText());
    if(day===23)await page.screenshot({path:`../evidence/kitty-timer-narrow-${testInfo.project.name}.png`});
  }
  expect(messages.size).toBe(10);
});
