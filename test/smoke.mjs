import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

const html = readFileSync('game.html', 'utf8');
const dom = new JSDOM(html, { runScripts:'dangerously', pretendToBeVisual:true, url:'https://pvz.local/' });
const { window } = dom;
const doc = window.document;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const q = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
function click(el){
  if (!el) throw new Error('element not found');
  const opt = { bubbles:true, cancelable:true, clientX:10, clientY:10 };
  el.dispatchEvent(new window.MouseEvent('pointerdown', opt));
  el.dispatchEvent(new window.MouseEvent('pointerup', opt));
}
const clickAct = (act, extra='') => {
  const el = q(`[data-act="${act}"]${extra}`);
  if (!el) throw new Error(`no [data-act=${act}]${extra}`);
  click(el);
};

let fails = 0;
const check = (name, cond, info='') => {
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (info ? ' — ' + info : ''));
  if (!cond) fails++;
};

await sleep(200);
console.log('1. Онбординг');
check('стартовый экран отрисован', !!q('.start'));
check('3 бренда', qa('[data-act="pickBrand"]').length === 3);
clickAct('pickBrand', '[data-id="gorod"]');
clickAct('pickPremise', '[data-id="spal"]');
clickAct('startGame');
await sleep(200);

console.log('2. Планирование');
check('экран планирования', !!q('.day-brief'));
check('прогноз отрисован', qa('.fbar').length === 12);
const moneyBefore = q('.m-val').textContent;

// покупки
clickAct('tab','[data-id="shop"]');
await sleep(150);
for (const id of ['counter','banner','light','shelfStd']){
  const b = q(`[data-act="buy"][data-id="${id}"]`);
  if (b && !b.disabled) click(b);
  await sleep(120);
}
check('куплена стойка', !q('[data-act="buy"][data-id="counter"]'));
check('куплен стеллаж', !!q('[data-act="buy"][data-id="shelfStd"]'), 'кнопка повторной покупки есть');
clickAct('tab','[data-id="staff"]');
await sleep(120);
const cands = qa('[data-act="hire"]');
check('есть кандидаты', cands.length > 0, cands.length + ' шт.');

console.log('2b. Планировка');
clickAct('tab','[data-id="layout"]');
await sleep(200);
check('сетка зала отрисована', qa('.rcell').length === 63, qa('.rcell').length + ' клеток');
const pal = qa('[data-act="pickItem"]');
check('есть нерасставленные предметы', pal.length > 0, pal.length + ' шт.');
// расставляем вручную: стойка в 0,0
if (pal.length){ click(pal[0]); await sleep(120); const c0 = q('.rcell[data-x="0"][data-y="0"]'); if (c0) click(c0); await sleep(150); }
check('предмет поставлен', qa('.rfix').length > 0, qa('.rfix').length + ' в зале');
clickAct('autoLayout');
await sleep(200);
check('авторасстановка убрала остаток', qa('[data-act="pickItem"]').length === 0);
// перенос мебели
const st = () => window.__pvz.state();
const before = st().fixtures[0].x + ',' + st().fixtures[0].y;
click(q('.rfix')); await sleep(120);
click(q('.rcell[data-x="6"][data-y="5"]')); await sleep(200);
const after = st().fixtures[0].x + ',' + st().fixtures[0].y;
check('мебель можно передвинуть', before !== after, before + ' → ' + after);

console.log('3. День');
clickAct('startDay');
await sleep(250);
check('экран дня', !!q('.day-grid'));
check('стеллаж отрисован', qa('.cell').length >= 16, qa('.cell').length + ' ячеек');
check('у стеллажа показано время ходьбы', /мин/.test(q('.shelf-head')?.textContent || ''));
check('мини-карта зала есть', !!q('.mm-room'), qa('.mm-fix').length + ' предметов на карте');
check('человечек на карте', !!q('.mm-token'));

// ускорение до 3x и ожидание поставки
clickAct('speed','[data-v="3"]');
await sleep(2500);
const truck = q('[data-act="acceptAll"]');
check('машина приехала', !!truck);
if (truck){
  click(truck);
  await sleep(200);
  const pk = qa('[data-act="pickBox"]');
  check('посылки в приёмке', pk.length > 0, pk.length + ' шт.');
  const pa = q('[data-act="placeAll"]');
  if (pa) click(pa);
  await sleep(250);
  check('посылки разложены', qa('.cell.full').length > 0, qa('.cell.full').length + ' занято');
}

// ждём клиента: выбрать → узнать адрес → взять → выдать
let served = false, addrSeen = false;
for (let i=0;i<80 && !served;i++){
  await sleep(200);
  const ev = q('[data-act="eventOpt"]');
  if (ev){ click(ev); await sleep(150); continue; }
  const cl = q('[data-act="pickClient"]');
  if (cl && !q('[data-act="give"]')){
    click(cl);
    await sleep(160);
    const addr = q('.cl-addr');
    if (addr && /Стеллаж/.test(addr.textContent)) addrSeen = true;
    const f = q('[data-act="fetch"]');
    if (f) click(f);
  }
  const g = q('[data-act="give"]');
  if (g){ click(g); await sleep(300); served = true; }
}
check('система подсказывает адрес ячейки', addrSeen);
const seenTarget = q('.mm-target') !== null || q('.mm-token') !== null;
check('на карте видно, где игрок', seenTarget);
check('клиент обслужен через «взять → выдать»', served);

// скорость 3x, проверяем что время идёт
const clockBefore = q('.hud-clock')?.textContent;
await sleep(1200);
const clockAfter = q('.hud-clock')?.textContent;
check('время идёт', clockBefore !== clockAfter, `${clockBefore} → ${clockAfter}`);

// главное: интерфейс не пересобирается целиком (иначе мерцает и сбрасывается скролл)
const st0 = window.__pvz.stats();
await sleep(1200);
const st1 = window.__pvz.stats();
check('нет полных перерисовок в течение дня', st1.full === st0.full, 'полных: ' + (st1.full - st0.full) + ', точечных: ' + (st1.patch - st0.patch));


console.log('4. Завершение дня');
const endBtn = q('[data-act="endDayNow"]');
if (endBtn){ click(endBtn); await sleep(300); }
check('отчёт дня', !!q('.pnl'), q('.pnl') ? 'есть P&L' : 'нет');
const nextBtn = q('[data-act="nextDay"]');
check('кнопка следующего дня', !!nextBtn);
if (nextBtn){ click(nextBtn); await sleep(300); }
check('вернулись в планирование', !!q('.day-brief'));

console.log('5. Сохранение');
const saved = window.localStorage.getItem('pvz_save_v1');
check('сейв записан', !!saved && saved.length > 100, (saved||'').length + ' байт');

console.log(fails === 0 ? '\n✅ Все проверки пройдены' : `\n❌ Провалено проверок: ${fails}`);
process.exit(fails ? 1 : 0);
