import {test,expect} from '@playwright/test';
test.use({baseURL:process.env.HL_COMMUNICATION_PREVIEW_ORIGIN||'http://127.0.0.1:5187'});
async function openMenu(page){if(page.viewportSize().width<1024)await page.getByRole('button',{name:'Menu',exact:true}).click();}
test('commissioner submenu opens a focused page and Help stays in the menu',async({page},testInfo)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/e2e/fixtures/commissioner-navigation.html');
 await expect(page.getByRole('heading',{name:'Commissioner tools',exact:true})).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('commissioner-overview.png'),fullPage:true});
 await openMenu(page);
 await page.getByRole('button',{name:/Commissioner tools/}).click();
 const menu=page.locator(page.viewportSize().width>=1024?'#desktop-submenu-commissioner-tools':'#commissioner-menu-panel');
 await expect(menu.getByRole('link',{name:'League calendar'})).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('commissioner-menu.png'),fullPage:true});
 await menu.getByRole('link',{name:'League readiness'}).click();
 await expect(page.getByRole('heading',{name:'League readiness',level:1,exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Edit scoring values'})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await openMenu(page);
 await page.getByRole('button',{name:'Help',exact:true}).click();
 await expect(page.getByLabel('Subject',{exact:true})).toBeVisible();
 await page.getByLabel('Subject',{exact:true}).fill('Test help form');
 await page.screenshot({path:testInfo.outputPath('help-menu.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:/^Close help$/i}).click();
 await expect(page.getByLabel('Subject',{exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>window.navigationRequests.every(r=>r.method==='GET'))).toBe(true);
 expect(errors).toEqual([]);
});
test('manager has Help without commissioner controls',async({page})=>{
 await page.goto('/e2e/fixtures/commissioner-navigation.html?manager');
 await openMenu(page);
 await expect(page.getByRole('button',{name:/Commissioner tools/})).toHaveCount(0);
 await page.getByRole('button',{name:'Help',exact:true}).click();
 await expect(page.getByLabel('Your team')).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.locator('#league-help-menu')).toHaveCount(0);
});
