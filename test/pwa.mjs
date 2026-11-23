/* PWA-проверка: манифест, иконки, service worker, запуск без сети.
   Нужен локальный http-сервер: python3 -m http.server 8123 &
   Затем: node test/pwa.mjs  (BASE_URL можно переопределить) */
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8123/index.html';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

const ok = (name, cond, extra = '') => console.log(`${cond ? '  ✓' : '  ✗'} ${name}${extra ? ' — ' + extra : ''}`) || cond;
let failed = 0;
const check = (name, cond, extra) => { const r = ok(name, cond, extra); if (!r) failed++; };

await page.goto(BASE);
await page.waitForTimeout(600);

console.log('1. Манифест');
const man = await page.evaluate(() => fetch('manifest.webmanifest').then(r => r.json()));
check('name и short_name', !!man.name && !!man.short_name, man.short_name);
check('start_url и scope', man.start_url === './' && man.scope === './');
check('display standalone', man.display === 'standalone');
check('иконки 192/512/maskable', man.icons.length >= 3 && man.icons.some(i => i.purpose === 'maskable'));
const iconStatus = await page.evaluate(async urls => {
  const out = {};
  for (const u of urls) out[u] = (await fetch(u)).status;
  return out;
}, ['icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'apple-touch-icon.png', 'favicon.svg', 'screenshot-day.png', 'screenshot-plan.png']);
check('все файлы иконок отдаются', Object.values(iconStatus).every(s => s === 200), JSON.stringify(iconStatus));

console.log('2. Service worker');
const sw = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return { supported: false };
  const reg = await navigator.serviceWorker.ready;
  return { supported: true, scope: reg.scope, active: !!reg.active, state: reg.active && reg.active.state };
});
check('SW зарегистрирован и активен', sw.supported && sw.active && sw.state === 'activated', sw.state);

const cached = await page.evaluate(async () => {
  const names = await caches.keys();
  if (!names.length) return { names, count: 0, hasIndex: false };
  const c = await caches.open(names[0]);
  const keys = await c.keys();
  return { names, count: keys.length, hasIndex: !!(await c.match('./index.html')) };
});
check('оболочка в кеше', cached.count >= 5 && cached.hasIndex, `${cached.names.join(',')} · ${cached.count} файлов`);

console.log('3. Экран запуска');
check('стартовый экран отрисован', !!(await page.$('.logo')),
);
const feats = await page.evaluate(() => document.querySelectorAll('.start-feats .feat').length);
check('стартовые фишки на месте', feats >= 3, feats + ' шт.');

console.log('4. Меню и статус установки');
const tap = async sel => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return false;
  el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
  el.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
  return true;
}, sel);
await tap('[data-act="pickBrand"][data-id="gorod"]');
await tap('[data-act="pickPremise"][data-id="spal"]');
await tap('[data-act="startGame"]');
await page.waitForTimeout(350);
check('игра началась', !!(await page.$('[data-act="startDay"], [data-act="tab"]')));
await tap('[data-act="openMenu"]');
await page.waitForTimeout(250);
const menu = await page.evaluate(() => ({
  open: !!document.querySelector('.menu-state'),
  chips: [...document.querySelectorAll('.menu-state .chip')].map(c => c.textContent.trim()),
  install: !!document.querySelector('[data-act="installApp"], [data-act="installHelp"]'),
}));
check('меню открылось', menu.open);
check('статус «браузер/офлайн/кеш» показан', menu.chips.length >= 3, menu.chips.join(' · '));
check('пункт установки есть', menu.install);

console.log('5. Офлайн-запуск');
await ctx.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(900);
const offline = await page.evaluate(() => ({
  booted: !!document.querySelector('.logo') || !!document.querySelector('.hud'),
  online: navigator.onLine,
}));
check('страница открылась без сети', offline.booted);
check('navigator.onLine = false', offline.online === false);

await ctx.setOffline(false);
await page.waitForTimeout(300);

console.log('ошибки:', errors.length ? errors.slice(0, 4) : 'нет');
if (errors.length) failed++;
await browser.close();
console.log(failed ? `\n❌ провалено: ${failed}` : '\n✅ PWA в порядке');
process.exit(failed ? 1 : 0);
