import { chromium } from 'playwright-core';
import { pathToFileURL } from 'url';

const url = pathToFileURL('/home/user/game.html').href;
const browser = await chromium.launch();

async function shoot(name, width, height, isMobile){
  const ctx = await browser.newContext({ viewport:{ width, height }, deviceScaleFactor: isMobile?2:1, isMobile:!!isMobile, hasTouch:!!isMobile });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  page.on('console', m => { if (m.type()==='error') console.log('CONSOLE ERROR:', m.text()); });
  await page.goto(url);
  await page.waitForTimeout(400);
  await page.screenshot({ path:`shots/${name}-0splash.png` });

  const tap = async (sel) => { await page.evaluate(s => { const el = document.querySelector(s); if (el) el.dispatchEvent(new MouseEvent('pointerdown',{bubbles:true})); if (el) el.dispatchEvent(new MouseEvent('pointerup',{bubbles:true})); }, sel); };
  await page.waitForSelector('[data-act="welcomeNew"]', { timeout: 8000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path:`shots/${name}-1start.png` });
  await tap('[data-act="welcomeNew"]');
  await page.waitForTimeout(250);
  await tap('[data-act="pickBrand"][data-id="gorod"]');
  await tap('[data-act="pickPremise"][data-id="spal"]');
  await tap('[data-act="startGame"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path:`shots/${name}-2plan.png`, fullPage:true });

  // покупки
  for (const id of ['counter','banner','light','shelfStd','shelfStd']){
    await tap(`[data-act="buy"][data-id="${id}"]`);
    await page.waitForTimeout(150);
  }
  await tap('[data-act="tab"][data-id="layout"]');
  await page.waitForTimeout(250);
  await tap('[data-act="preset"][data-id="fast"]');
  await page.waitForTimeout(250);
  await page.screenshot({ path:`shots/${name}-3layout.png`, fullPage:true });

  await tap('[data-act="tab"][data-id="staff"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path:`shots/${name}-3staff.png`, fullPage:true });

  await page.waitForTimeout(150);
  await tap('[data-act="startDay"]');
  await page.waitForTimeout(200);
  await tap('[data-act="speed"][data-v="3"]');
  await page.waitForTimeout(1800);
  await tap('[data-act="acceptAll"]');
  await page.waitForTimeout(200);
  await tap('[data-act="placeAll"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path:`shots/${name}-4day.png`, fullPage:true });

  // команда на карте (в тесте денег на найм нет — подставляем людей прямо в состояние)
  await page.evaluate(() => {
    const S = window.__pvz.state();
    S.staff.push({ id:'shot1', role:'seller', name:'Пётр', sp:5, ac:5, sv:6, trait:'work', mood:70, fatigue:0, onShift:true, salary:1700, prepay:0,
      task:{ kind:'serve', shelfId:S.shelves[0].id, cellIdx:2, t:3, total:6 } });
    S.staff.push({ id:'shot2', role:'loader', name:'Гарик', sp:6, ac:5, sv:3, trait:'work', mood:70, fatigue:0, onShift:true, salary:1300, prepay:0 });
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path:`shots/${name}-4bteam.png`, fullPage:true });

  // обслужить клиента
  await tap('[data-act="pickClient"]');
  await page.waitForTimeout(250);
  await page.screenshot({ path:`shots/${name}-5pick.png`, fullPage:true });
  await tap('[data-act="fetch"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path:`shots/${name}-6carry.png`, fullPage:true });
  await tap('[data-act="give"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path:`shots/${name}-7served.png`, fullPage:true });
  if (await page.$('.modal-bg')) await page.screenshot({ path:`shots/${name}-7event.png` });

  await tap('[data-act="endDayNow"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path:`shots/${name}-8report.png`, fullPage:true });
  await ctx.close();
}

await shoot('desk', 1180, 900, false);
await shoot('mob', 390, 844, true);
await browser.close();
console.log('screenshots done');
