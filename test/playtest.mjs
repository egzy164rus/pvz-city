import { chromium } from 'playwright-core';
import { pathToFileURL } from 'url';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport:{ width:430, height:900 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(pathToFileURL('/home/user/game.html').href + '?seed=11');
await page.waitForTimeout(400);

const tap = async sel => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return false;
  el.dispatchEvent(new MouseEvent('pointerdown', { bubbles:true }));
  el.dispatchEvent(new MouseEvent('pointerup', { bubbles:true }));
  return true;
}, sel);

await tap('[data-act="pickBrand"][data-id="plus"]');
await tap('[data-act="pickPremise"][data-id="spal"]');
await tap('[data-act="startGame"]');
await page.waitForTimeout(300);
for (const id of ['counter','banner','light','shelfStd','shelfStd']){
  await tap(`[data-act="buy"][data-id="${id}"]`);
  await page.waitForTimeout(120);
}
await tap('[data-act="tab"][data-id="staff"]');
await page.waitForTimeout(200);

// расстановка зала
await tap('[data-act="tab"][data-id="layout"]');
await page.waitForTimeout(200);
await tap('[data-act="autoLayout"]');
await page.waitForTimeout(300);

await tap('[data-act="startDay"]');
await page.waitForTimeout(200);
await tap('[data-act="speed"][data-v="3"]');
await page.waitForTimeout(250);
const perf = await page.evaluate(async () => {
  const a = window.__pvz.stats();
  window.scrollTo(0, 260);
  const y0 = window.scrollY;
  await new Promise(r => setTimeout(r, 1500));
  const b = window.__pvz.stats();
  return { full: b.full - a.full, patch: b.patch - a.patch, y0, y1: window.scrollY };
});
console.log('перерисовок за 1,5 с: полных', perf.full, '| точечных', perf.patch, '| скролл', perf.y0, '→', perf.y1);
if (perf.full > 0) errors.push(`мерцание: ${perf.full} полных пересборок за 1,5 с`);
await page.evaluate(() => window.scrollTo(0, 0));

let eventSeen = 0;
for (let step = 0; step < 900; step++){
  await page.waitForTimeout(120);
  const state = await page.evaluate(() => ({
    report: !!document.querySelector('[data-act="nextDay"]'),
    event: document.querySelectorAll('[data-act="eventOpt"]').length,
    accept: !!document.querySelector('[data-act="acceptAll"]'),
    place: !!document.querySelector('[data-act="placeAll"]'),
    client: !!document.querySelector('[data-act="pickClient"]'),
    consult: !!document.querySelector('[data-act="consult"]'),
    fetch: !!document.querySelector('[data-act="fetch"]'),
    give: !!document.querySelector('[data-act="give"]'),
  }));
  if (state.event){
    eventSeen++;
    const idx = await page.evaluate(() => {
      const opts = window.__pvz.state().event?.options || [];
      let best = 0, bestScore = -1e9;
      opts.forEach((o, i) => {
        const sc = (o.money || 0) - (o.fine || 0) + ((o.traffic || 1) - 1) * 100000 - (o.skip ? 2000 : 0);
        if (sc > bestScore){ bestScore = sc; best = i; }
      });
      return best;
    });
    await tap(`[data-act="eventOpt"][data-i="${idx}"]`);
    await page.waitForTimeout(150);
    continue;
  }
  if (await page.$('[data-act="startDay"]:not([disabled])')){}
  if (state.report) break;
  if (state.give) { await tap('[data-act="give"]'); }
  else if (state.fetch) { await tap('[data-act="fetch"]'); }
  else if (state.client) { await tap('[data-act="pickClient"]'); }
  else if (state.consult) { await tap('[data-act="consult"]'); }
  else if (state.place) { await tap('[data-act="placeAll"]'); }
  else if (state.accept) { await tap('[data-act="acceptAll"]'); }
}

const reportText = await page.evaluate(() => document.querySelector('.report-grid')?.innerText.replace(/\n/g,' | '));
const money = await page.evaluate(() => window.__pvz.state().money);
const sum = await page.evaluate(() => document.querySelector('.pnl-row.total')?.innerText.replace(/\n/g,' '));

console.log('событий в дне:', eventSeen);
console.log('отчёт:', reportText);
console.log('итог дня:', sum);
console.log('касса:', money, '₽  |  на старте было 7 000 ₽');
console.log('ошибки:', errors.length ? errors : 'нет');

// второй день
await tap('[data-act="nextDay"]');
await page.waitForTimeout(400);
const plan = await page.evaluate(() => !!document.querySelector('.day-brief'));
console.log('переход в день 2:', plan);
await page.screenshot({ path:'shots/playtest-day2.png', fullPage:false });
await browser.close();
process.exit(errors.length ? 1 : 0);
