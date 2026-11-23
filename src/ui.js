/* ============================================================
   ПВЗ-Сити — интерфейс
   ============================================================ */
import * as E from './engine.js';
import { icon, itemIcon, roleIcon } from './icons.js';

const U = {
  screen: 'start',
  tab: 'shop',
  sel: { brand: 'plus', premise: 'spal' },
  selClient: null,
  selBox: null,
  selItem: null,
  moveId: null,
  toast: null,
  toastUntil: 0,
  lastRender: 0,
  installEvt: null,      // beforeinstallprompt
  installed: false,      // запущено как установленное приложение
  installHelp: false,    // модалка «как установить»
  online: true,
  swReady: null,         // регистрация service worker (если есть)
};

let S = null;
let rafId = null;
let lastTs = 0;
let acc = 0;

const $app = () => document.getElementById('app');
const fmt = E.fmt;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------------- утилиты UI ---------------- */
function toast(msg, kind = 'info'){
  U.toast = { msg, kind };
  U.toastUntil = performance.now() + 2600;
}
function pct(a, b){ return Math.max(0, Math.min(100, b ? a / b * 100 : 0)); }

function applyAccent(){
  const b = S ? E.brandOf(S) : { color:'#3b82f6', color2:'#1d4ed8' };
  document.documentElement.style.setProperty('--accent', b.color);
  document.documentElement.style.setProperty('--accent2', b.color2 || b.color);
}

/* ---------------- звук ---------------- */
let AC = null, soundOn = true;
function beep(freq = 440, dur = 0.06, type = 'sine', vol = 0.04){
  if (!soundOn) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(AC.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
    o.stop(AC.currentTime + dur);
  } catch(e){}
}

/* ---------------- старт ---------------- */
function safeGet(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
function safeDel(k){ try { localStorage.removeItem(k); } catch(e){} }

export function boot(){
  let saved = null;
  try { saved = localStorage.getItem('pvz_save_v1'); } catch(e){ saved = null; }   // iframe без same-origin
  if (saved){
    const s = E.deserialize(saved);
    if (s){ S = s; U.screen = s.phase === 'report' ? 'report' : s.phase === 'day' ? 'day' : 'plan'; }
  }
  applyAccent();
  initPwa();
  loop(performance.now());
}

/* ---------------- PWA: установка и офлайн ---------------- */
function isStandalone(){
  try {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.matchMedia('(display-mode: fullscreen)').matches
      || window.navigator.standalone === true;
  } catch(e){ return false; }
}

function initPwa(){
  U.installed = isStandalone();
  U.online = navigator.onLine !== false;

  window.addEventListener('online', () => {
    U.online = true;
    toast('Снова в сети — прогресс синхронизирован', 'good');
    render();
  });
  window.addEventListener('offline', () => {
    U.online = false;
    toast('Офлайн: игра продолжается, прогресс сохраняется', 'info');
    render();
  });
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    U.installEvt = e;
    render();
  });
  window.addEventListener('appinstalled', () => {
    U.installEvt = null;
    U.installed = true;
    toast('Приложение установлено', 'good');
    render();
  });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
    navigator.serviceWorker.register('./sw.js').then(reg => {
      U.swReady = reg;
      render();
    }).catch(() => {});
  }
}

function installHints(){
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const chromium = /Chrome|Edg|SamsungBrowser/.test(ua);
  if (ios) return [
    'Откройте сайт в Safari.',
    'Нажмите «Поделиться» в нижней панели.',
    'Выберите «На экран „Домой“» — иконка появится на телефоне.',
  ];
  if (android && chromium) return [
    'Нажмите «Установить приложение» ниже.',
    'Или меню ⋮ → «Установить приложение» / «Добавить на главный экран».',
  ];
  if (chromium) return [
    'В адресной строке нажмите иконку установки (монитор со стрелкой).',
    'Или меню ⋮ → «Установить ПВЗ-Сити».',
  ];
  return [
    'На Android — Chrome: меню ⋮ → «Установить приложение».',
    'На iPhone — Safari: «Поделиться» → «На экран „Домой“».',
    'На компьютере игра работает и во вкладке браузера.',
  ];
}

function newGame(){
  const qs = new URLSearchParams(location.search);
  const seed = qs.get('seed');
  S = E.createGame({ brandId: U.sel.brand, premiseId: U.sel.premise, ...(seed ? { seed: +seed } : {}) });
  U.screen = 'plan';
  U.tab = 'shop';
  save();
  applyAccent();
  beep(520, 0.08, 'triangle');
}

function save(){
  if (!S) return;
  try { localStorage.setItem('pvz_save_v1', E.serialize(S)); } catch(e){}
}

/* ---------------- главный цикл ---------------- */
function loop(ts){
  rafId = requestAnimationFrame(loop);
  const dt = Math.min(0.1, (ts - lastTs) / 1000 || 0);
  lastTs = ts;

  if (S && S.phase === 'day' && S.speed > 0 && !S.event && !S.over){
    acc += dt * E.CFG.MIN_PER_SEC * S.speed;
    let guard = 0;
    while (acc >= 1 && guard++ < 60){
      E.stepMinute(S);
      acc -= 1;
      if (S.phase !== 'day') { acc = 0; U.screen = 'report'; save(); break; }
      if (S.event) { acc = 0; break; }
    }
  }

  if (ts - U.lastRender > 110){
    U.lastRender = ts;
    render();
  }
}

/* ---------------- рендер ---------------- */
/* доступ к состоянию для отладки и автотестов */
window.__pvz = { state: () => S, ui: U, E, act: (t, d) => act(t, d), stats: () => ({ full: paintCount, patch: patchCount, by: { ...patchByKey } }) };

function render(){
  if (U.toast && performance.now() > U.toastUntil) U.toast = null;
  if (S && U.selClient && !S.clients.some(c => c.id === U.selClient)) U.selClient = null;
  if (S && U.selBox && !S.receiving.some(p => p.id === U.selBox)) U.selBox = null;
  const app = $app();
  if (!app) return;

  const shell = !S || U.screen === 'start' ? 'start'
    : U.screen === 'report' ? 'report'
    : U.screen === 'plan' ? 'plan'
    : 'day';
  const body = shell === 'start' ? viewStart()
    : shell === 'report' ? viewReport()
    : shell === 'plan' ? viewPlan()
    : viewDay();
  const overlays = (U.toast ? `<div class="toast ${U.toast.kind}">${esc(U.toast.msg)}</div>` : '')
    + (S && S.event ? viewEvent() : '')
    + (U.menu ? viewMenu() : '')
    + (U.help ? viewHelp() : '')
    + (U.installHelp ? viewInstall() : '');

  paint(`<div class="shell" data-shell="${shell}">${body}<div id="ovl">${overlays}</div></div>`);
  liveUpdate();
}

/* Перерисовка только изменившихся участков: без мигания и без сброса скролла */
let paintCount = 0, patchCount = 0;
const patchByKey = {};
/* сравнение регионов без «быстрых» значений: их обновляет liveUpdate */
function regionHtml(el){
  const c = el.cloneNode(true);
  for (const n of c.querySelectorAll('[data-live]')){
    n.textContent = '';
    n.removeAttribute('style');
  }
  return c.outerHTML;
}

function syncChrome(){
  const root = document.documentElement;
  const hud = document.querySelector('.hud');
  document.body.classList.toggle('has-hud', !!hud);
  if (hud){
    const h = Math.round(hud.getBoundingClientRect().height);
    if (h > 0) root.style.setProperty('--hud-h', h + 'px');
  }
  // тост поднимается ровно над нижними панелями (панель дела + кнопка «завершить день»)
  const ab = document.querySelector('.actionbar');
  const cta = document.querySelector('.sticky-cta');
  const lift = (ab ? ab.getBoundingClientRect().height + 10 : 0) + (cta ? cta.getBoundingClientRect().height : 0) + 12;
  root.style.setProperty('--toast-bottom', Math.round(lift) + 'px');
}

function paint(html){
  const app = $app();
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const fresh = tpl.content.firstElementChild;
  const cur = app.firstElementChild;
  const curShell = cur ? cur.getAttribute('data-shell') : null;
  const newShell = fresh ? fresh.getAttribute('data-shell') : null;

  if (!cur || curShell !== newShell || !fresh.querySelector('[data-r]')){
    app.innerHTML = html;
    paintCount++;
    syncChrome();
    return;
  }

  const regions = [...fresh.querySelectorAll('[data-r]')];
  for (const el of regions){
    const key = el.getAttribute('data-r');
    const old = app.querySelector(`[data-r="${key}"]`);
    if (!old){ app.innerHTML = html; paintCount++; syncChrome(); return; }
    if (regionHtml(old) !== regionHtml(el)){
      old.replaceWith(el);
      patchCount++;
      patchByKey[key] = (patchByKey[key] || 0) + 1;
    }
  }
  const ovlNew = fresh.querySelector('#ovl');
  const ovlOld = app.querySelector('#ovl');
  if (ovlNew && ovlOld && ovlOld.innerHTML !== ovlNew.innerHTML) ovlOld.innerHTML = ovlNew.innerHTML;
  syncChrome();
}

/* Быстрые обновления: цифры и полоски, которые меняются каждую минуту */
function liveUpdate(){
  const app = $app();
  if (!app || !S) return;
  const set = (sel, val) => { const el = app.querySelector(sel); if (el && el.textContent !== val) el.textContent = val; };
  const width = (sel, val) => { const el = app.querySelector(sel); if (el) el.style.width = val + '%'; };

  if (S.phase === 'day') set('[data-live="clock"]', E.dayLabel(S));
  set('[data-live="money"]', fmt(S.money) + ' ₽');
  width('[data-live="xp"]', pct(S.xp, E.xpNeed(S)));
  if (S.phase === 'day'){
    width('[data-live="fatigue"]', Math.round(S.fatigue));
    set('[data-live="fatigue-t"]', 'усталость ' + Math.round(S.fatigue) + '%');
    const tr = S.trucks.find(t => t.arrived && t.left > 0);
    if (tr){
      set('[data-live="truck-t"]', `осталось ${Math.max(0, tr.waitLeft)} мин`);
      width('[data-live="truck-bar"]', pct(tr.waitLeft, tr.waitTotal || 300));
    }
    for (const c of S.clients){
      width(`[data-live="pat:${c.id}"]`, pct(c.patience, c.maxPatience));
    }
    const b = S.player.busy;
    if (b){
      set('[data-live="clt:' + b.clientId + '"]', String(Math.max(0, Math.ceil(b.t))));
      set('[data-live="busy-t"]', Math.max(0, Math.ceil(b.t)) + ' мин');
      set('[data-live="ab-t"]', Math.max(0, Math.ceil(b.t)) + ' мин');
      width('[data-live="ab-bar"]', pct(b.total - b.t, b.total));
      width('[data-live="busy-bar"]', pct(b.total - b.t, b.total));
    }
    const cap = app.querySelector('[data-live="map-cap"]');
    if (cap){
      const txt = mapCaption();
      if (cap.textContent !== txt) cap.textContent = txt;
    }
    const [px, py] = E.playerCell(S);
    const tok = app.querySelector('[data-live="tok"]');
    if (tok){
      const col = String(px + 1), row = String(py + 1);
      if (tok.style.gridColumn !== col) tok.style.gridColumn = col;
      if (tok.style.gridRow !== row) tok.style.gridRow = row;
      const isCarry = S.hands && !(S.player.busy && S.player.busy.kind === 'handover');
      const want = isCarry ? 'box' : 'user';
      if (tok.dataset.ico !== want){ tok.dataset.ico = want; tok.innerHTML = icon(want); }
    }
    (S.staff || []).forEach((st, i) => {
      if (!st.onShift) return;
      const el = app.querySelector(`[data-live="st:${i}"]`);
      if (!el) return;
      const [sx, sy] = E.staffCell(S, st);
      const col = String(sx + 1), row = String(sy + 1);
      if (el.style.gridColumn !== col) el.style.gridColumn = col;
      if (el.style.gridRow !== row) el.style.gridRow = row;
    });
  }
}

/* ---------------- онбординг ---------------- */
function viewStart(){
  const brands = E.BRANDS.map(b => `
    <button class="card brand ${U.sel.brand === b.id ? 'sel' : ''}" data-act="pickBrand" data-id="${b.id}" style="--b:${b.color}">
      <div class="brand-tile" style="--b:${b.color};--b2:${b.color2}">${b.name[0]}</div>
      <div class="card-title">${b.name}</div>
      <div class="card-sub">${b.tag}</div>
      <div class="chips">
        <span class="chip">поток ×${b.traffic}</span>
        <span class="chip">выплата ×${b.payout.toFixed(2)}</span>
      </div>
      <div class="muted small">Брендбук: ${b.req.length} требования</div>
    </button>`).join('');

  const prems = E.PREMISES.map(p => `
    <button class="card ${U.sel.premise === p.id ? 'sel' : ''}" data-act="pickPremise" data-id="${p.id}" ${p.lvl > 1 ? 'disabled' : ''}>
      <div class="card-title ico-lead">${icon('store')} ${p.name} ${p.lvl > 1 ? '<span class="lock">с ур. '+p.lvl+'</span>' : ''}</div>
      <div class="card-sub">${p.desc}</div>
      <div class="chips">
        <span class="chip">аренда ${fmt(p.rent)} ₽/день</span>
        <span class="chip">депозит ${p.deposit ? fmt(p.deposit)+' ₽' : '—'}</span>
        <span class="chip">поток ×${p.traffic}</span>
        <span class="chip">${p.gw}×${p.gh} клеток зала</span>
      </div>
    </button>`).join('');

  return `
  <div class="start">
    <div class="logo">
      <div class="logo-mark">${icon('box')}</div>
      <div>
        <h1>ПВЗ-Сити</h1>
        <div class="muted">Симулятор управления пунктом выдачи заказов</div>
      </div>
    </div>
    <p class="lead">Вы открываете свой пункт. Денег мало, команды нет, а клиенты уже идут.
      Держите рейтинг, не срывайте сроки, считайте каждую копейку — и однажды вы будете управлять сетью.</p>
    <div class="start-feats">
      <span class="feat">${icon('users')} Работаете сами, потом нанимаете</span>
      <span class="feat">${icon('truck')} Поставки дважды в день</span>
      <span class="feat">${icon('layout')} Планировка зала руками</span>
      <span class="feat">${icon('award')} Контракт и аудит каждую неделю</span>
    </div>

    <h2 class="sec">1. Франшиза</h2>
    <div class="grid3">${brands}</div>

    <h2 class="sec">2. Помещение</h2>
    <div class="grid3">${prems}</div>

    <div class="start-foot">
      <div class="muted small">Стартовый капитал 60 000 ₽ минус депозит помещения.</div>
      <button class="btn primary big" data-act="startGame">Открыть ПВЗ ${icon('chevron')}</button>
    </div>
  </div>`;
}

/* ---------------- HUD ---------------- */
function viewHud(){
  const brand = E.brandOf(S);
  const cont = E.contractOf(S);
  const xpNeed = E.xpNeed(S);
  return `
  <header class="hud" data-r="hud">
    <div class="hud-left">
      <div class="hud-day">День ${S.day}</div>
      <div class="hud-clock" data-live="clock">${S.phase === 'day' ? E.dayLabel(S) : S.phase === 'plan' ? 'утро · планирование' : 'итоги дня'}</div>
    </div>
    <div class="hud-mid">
      <div class="metric"><span class="m-label">${icon('wallet')}Касса</span><span class="m-val" data-live="money">${fmt(S.money)} ₽</span></div>
      <div class="metric"><span class="m-label">${icon('star')}NPS</span><span class="m-val ${S.nps < 4 ? 'warn' : 'good'}">${S.nps.toFixed(2)}</span></div>
      <div class="metric"><span class="m-label">${icon('award')}Контракт</span><span class="m-val" style="color:${cont.color}">${cont.name}</span></div>
    </div>
    <div class="hud-right">
      <div class="lvl">
        <span>ур. ${S.lvl}</span>
        <div class="bar thin"><i data-live="xp" style="width:${pct(S.xp, xpNeed)}%"></i></div>
        ${S.phase === 'day' ? `<span class="tiny" data-live="fatigue-t">усталость ${Math.round(S.fatigue)}%</span>
        <div class="bar thin"><i class="${S.fatigue > 70 ? 'danger' : S.fatigue > 45 ? 'warn' : ''}" data-live="fatigue" style="width:${S.fatigue}%"></i></div>` : ''}
      </div>
      ${S.phase === 'day' ? speedButtons() : ''}
      <button class="btn ghost small iconbtn" data-act="openMenu" title="Меню">${icon('settings')}</button>
    </div>
  </header>`;
}

function speedButtons(){
  const b = (v, label) => `<button class="spd ${S.speed === v ? 'on' : ''}" data-act="speed" data-v="${v}">${label}</button>`;
  return `<div class="speeds">${b(0, icon('pause'))}${b(1,'1×')}${b(2,'2×')}${b(3,'3×')}</div>`;
}

/* ---------------- фаза планирования ---------------- */
function viewPlan(){
  const p = E.premOf(S), b = E.brandOf(S);
  const cap = E.capacity(S);
  const payroll = E.payrollNow(S);
  const forecast = E.forecastFor(S);
  const maxExp = Math.max(...forecast.map(f => f.exp), 1);
  const expected = Math.round(E.dayDemand(S));

  const bars = forecast.map(f => `
    <div class="fbar" title="${f.hour}:00 — ${f.exp.toFixed(1)}">
      <i style="height:${Math.max(4, f.exp / maxExp * 100)}%"></i>
      <span>${f.hour}</span>
    </div>`).join('');

  const cs = E.contractStatus(S);
  const cont = E.contractOf(S);

  return `
  ${viewHud()}
  <main class="wrap">
    <section class="card pad day-brief" data-r="brief">
      <div class="brief-top">
        <div>
          <div class="kicker">Утро · планирование</div>
          <h2>День ${S.day}</h2>
          <div class="muted small">${b.name} · ${p.name} · ${new Date().getDay() ? '' : ''}${['пн','вт','ср','чт','пт','сб','вс'][(S.day-1)%7]}</div>
        </div>
        <div class="brief-nums">
          <div class="bn"><b>${expected}</b><span>прогноз клиентов</span></div>
          <div class="bn"><b>${Math.round(expected*0.95)}</b><span>посылок привезут</span></div>
          <div class="bn"><b>${cap.free}</b><span>свободно ячеек</span></div>
        </div>
      </div>
      <div class="forecast">${bars}</div>
      <div class="forecast-legend muted small">Почасовой прогноз потока (погрешность ±15%)</div>
    </section>

    <section class="grid2" data-r="kpi">
      <div class="card pad">
        <h3>${icon('award')} Контракт «${cont.name}»</h3>
        <div class="kpi">
          ${kpiRow('Скорость выдачи', cs.avgSla ? cs.avgSla + ' мин' : '—', '≤ ' + cont.sla, cs.slaOk)}
          ${kpiRow('Упущенные', (cs.missed * 100).toFixed(1) + '%', '≤ ' + (cont.missed * 100).toFixed(1) + '%', cs.missedOk)}
          ${kpiRow('NPS', S.nps.toFixed(2), '≥ ' + cont.nps, cs.npsOk)}
          ${kpiRow('Брендбук', Math.round(cs.compliance * 100) + '%', '≥ ' + Math.round(cont.brand * 100) + '%', cs.brandOk)}
        </div>
        <div class="muted small">Аудит — каждые 7 дней. Провал — понижение контракта.</div>
      </div>

      <div class="card pad">
        <h3>${icon('chart')} Экономика</h3>
        <div class="kpi">
          ${moneyRow('Аренда', -p.rent)}
          ${moneyRow('ФОТ', -payroll)}
          ${moneyRow('Коммуналка', -E.CFG.UTIL_PER_DAY)}
          ${S.debt ? moneyRow('Кредит', -Math.round(S.debt * E.CFG.LOAN_RATE)) : ''}
        </div>
        ${S.staff.some(st => (st.prepay||0) > 0) ? `<div class="muted small">Аванс покрывает ${S.staff.filter(st=>(st.prepay||0)>0).length} чел. — зарплата за них пока не списывается.</div>` : ''}
        <div class="row-between">
          <span class="muted small">Долг: ${fmt(S.debt)} ₽</span>
          <button class="btn small" data-act="loan" ${S.debt >= E.loanLimit(S) ? 'disabled' : ''}>Взять кредит 20 000 ₽</button>
        </div>
      </div>
    </section>

    <nav class="tabs" data-r="tabs">
      ${tabBtn('layout','Планировка','layout', S.unplaced.length)}
      ${tabBtn('shop','Магазин','bag')}
      ${tabBtn('staff','Команда','users')}
      ${tabBtn('policy','Склад','archive')}
    </nav>
    <section class="card pad tab-body" data-r="tabbody">
      ${U.tab === 'layout' ? layoutView() : U.tab === 'shop' ? shopView() : U.tab === 'staff' ? staffView() : policyView()}
    </section>

    <div class="sticky-cta" data-r="cta">
      <div class="muted small">${hintText()}</div>
      <button class="btn primary big" data-act="startDay" ${E.layoutProblems(S).length ? 'disabled' : ''}>Начать день ${icon('chevron')}</button>
    </div>
  </main>`;
}

function tabBtn(id, label, ico, badge){
  return `<button class="tab ${U.tab === id ? 'on' : ''}" data-act="tab" data-id="${id}">${ico ? icon(ico) : ''}<span class="tab-lbl">${label}</span>${badge ? `<b class="tab-badge">${badge}</b>` : ''}</button>`;
}
function kpiRow(label, val, target, ok){
  return `<div class="kpi-row"><span>${label}</span><b class="${ok ? 'good' : 'warn'}">${val}</b><span class="muted small">${target}</span></div>`;
}
function moneyRow(label, val){
  const txt = val === 0 ? '0 ₽' : (val > 0 ? '+' : '') + fmt(val) + ' ₽';
  return `<div class="kpi-row"><span>${label}</span><b class="${val < 0 ? 'bad' : val > 0 ? 'good' : 'muted'}">${txt}</b><span></span></div>`;
}

/* компактная карта зала: где вы, куда идти */
function miniMap(){
  const g = S.grid;
  if (!S.fixtures.length) return '';

  const fixes = S.fixtures.map(f => {
    const it = E.ITEMS[f.itemId];
    let used = 0;
    if (f.shelfId){
      const sh = S.shelves.find(x => x.id === f.shelfId);
      used = sh ? sh.cells.filter(Boolean).length : 0;
    }
    const cls = f.itemId === 'counter' ? 'counter' : f.shelfId ? 'shelf' : f.itemId === 'fitting' ? 'fitting' : 'plain';
    const fill = f.shelfId && used
      ? `<span class="mm-fill" style="height:${Math.round(used / (E.ITEMS[f.itemId].cap || 16) * 100)}%"></span>` : '';
    return `<div class="mm-fix ${cls}" title="${it.name}"
      style="grid-column:${f.x + 1}/span ${f.w};grid-row:${f.y + 1}/span ${f.h}">${fill}</div>`;
  }).join('');

  // цель: куда идти (взятый заказ / выбранный клиент)
  let target = null;
  const b = S.player.busy;
  if (b && b.kind === 'fetch'){
    const fx = S.fixtures.find(f => f.shelfId === b.shelfId);
    if (fx) target = [fx.x + (b.cellIdx % fx.w), fx.y + Math.floor(b.cellIdx / fx.w)];
  } else if (S.hands){
    target = S.player.stand || null;
  } else if (U.selClient){
    const loc = E.clientLocation(S, U.selClient);
    const fx = loc ? S.fixtures.find(f => f.shelfId === loc.shelfId) : null;
    if (fx && loc) target = [fx.x + (loc.cellIdx % fx.w), fx.y + Math.floor(loc.cellIdx / fx.w)];
  }

  const [px, py] = E.playerCell(S);
  const carry = S.hands && !(b && b.kind === 'handover');
  const onShift = (S.staff || []).filter(st => st.onShift);
  const occupied = new Map([[px + ':' + py, 1]]);
  const SHIFTS = ['translate(55%,-55%)', 'translate(-55%,55%)', 'translate(55%,55%)', 'translate(-55%,-55%)'];
  const staffTokens = (S.staff || []).map((st, idx) => ({ ...st, idx })).filter(st => st.onShift).map(st => {
    const [sx, sy] = E.staffCell(S, st);
    const k = sx + ':' + sy;
    const dup = occupied.get(k) || 0;
    occupied.set(k, dup + 1);
    const shift = dup ? SHIFTS[(dup - 1) % SHIFTS.length] : '';
    const ico = roleIcon(st.role);
    const what = st.role === 'loader' ? (st.task ? 'разгружает' : 'у двери')
      : st.role === 'manager' ? 'в зале' : (st.task ? 'обслуживает' : 'свободен');
    return `<div class="mm-token staff" title="${esc(st.name || '')} · ${what}" data-live="st:${st.idx}"
      style="grid-column:${sx + 1};grid-row:${sy + 1}${shift ? ';transform:' + shift : ''}">${ico}</div>`;
  }).join('');
  const token = `<div class="mm-token ${carry ? 'carry' : ''}" data-live="tok" data-ico="${carry ? 'box' : 'user'}" style="grid-column:${px + 1};grid-row:${py + 1}">${icon(carry ? 'box' : 'user')}</div>`;
  const tgt = target ? `<div class="mm-target" style="grid-column:${target[0] + 1};grid-row:${target[1] + 1}"></div>` : '';

  const caption = mapCaption();

  return `
  <div class="card pad minimap" data-r="map">
    <div class="row-between">
      <h3>${icon('map')} Зал <span class="mm-legend">${icon(carry ? 'box' : 'user')} вы${onShift.map(st => roleIcon(st.role)).join('')}</span></h3>
      <span class="muted small" data-live="map-cap">${caption}</span>
    </div>
    <div class="mm-room" style="aspect-ratio:${g.w}/${g.h};grid-template-columns:repeat(${g.w},1fr);grid-template-rows:repeat(${g.h},1fr)">
      ${fixes}${tgt}${staffTokens}${token}
    </div>
  </div>`;
}

function mapCaption(){
  const b = S.player.busy;
  if (b && b.kind === 'fetch') return `Идёте к полке · осталось ${Math.max(0, Math.ceil(b.t))} мин`;
  if (b && b.kind === 'handover') return `Несёте заказ клиенту · ${Math.max(0, Math.ceil(b.t))} мин`;
  if (S.hands) return 'У полки с посылкой — вернитесь к клиенту';
  if (U.selClient) return 'Цель подсвечена — жмите «Взять»';
  return 'Вы у стойки';
}

function layoutView(){
  const g = S.grid;
  let bg = '';
  for (let y = 0; y < g.h; y++){
    for (let x = 0; x < g.w; x++){
      bg += `<button class="rcell" data-act="roomCell" data-x="${x}" data-y="${y}"></button>`;
    }
  }
  const fx = S.fixtures.map(f => {
    const it = E.ITEMS[f.itemId];
    const dist = f.shelfId ? E.shelfDistance(S, f.shelfId) : null;
    return `<div class="rfix ${f.shelfId ? 'is-shelf' : ''} ${f.itemId === 'counter' ? 'is-counter' : ''} ${f.w * f.h <= 1 ? 'sm' : ''} ${U.moveId === f.id ? 'moving' : ''}"
      data-act="fixTap" data-id="${f.id}"
      style="grid-column:${f.x + 1}/span ${f.w};grid-row:${f.y + 1}/span ${f.h}">
      <span class="rfix-ico">${itemIcon(f.itemId)}</span>
      <span class="rfix-name">${f.shelfId ? E.shelfName(S, f.shelfId).replace('Стеллаж ','Ст. ') : (it.short || it.name)}</span>
      ${dist != null ? `<span class="rfix-dist">${dist >= 99 ? '!' : dist + ' кл.'}</span>` : ''}
      <button class="rfix-x" data-act="removeFix" data-id="${f.id}" title="Убрать">${icon('x')}</button>
    </div>`;
  }).join('');

  const palette = S.unplaced.length
    ? S.unplaced.map((id, i) => {
        const it = E.ITEMS[id];
        return `<button class="pal ${U.selItem === i ? 'sel' : ''}" data-act="pickItem" data-i="${i}">
          <span class="pal-ico">${itemIcon(id)}</span>
          <span class="pal-name">${it.name}</span>
          <em>${it.size.w}×${it.size.h}</em>
        </button>`;
      }).join('')
    : '<span class="muted small">Всё купленное расставлено.</span>';

  return `
  <div class="row-between">
    <h3>${icon('layout')} Планировка зала</h3>
    <span class="muted small">свободно ${E.freeArea(S)} кл.</span>
  </div>
  <div class="muted small" style="margin-bottom:8px">
    Выберите предмет снизу и тапните по клетке. «кл.» у стеллажа — расстояние от стойки: от него зависит, сколько вы идёте за заказом.
  </div>
  <div class="room" style="--cols:${g.w};--rows:${g.h}">
    <div class="room-bg">${bg}</div>
    <div class="room-fix">${fx}</div>
  </div>
  <div class="row-between" style="margin-top:10px">
    <div class="muted small">${U.moveId ? 'Тапните клетку — предмет переедет'
      : U.selItem != null ? 'Тапните по клетке, чтобы поставить'
      : 'Выберите предмет или тапните по мебели, чтобы передвинуть'}</div>
    <button class="btn ghost small" data-act="autoLayout">Расставить автоматически</button>
  </div>
  <div class="palette">${palette}</div>`;
}

function shopView(){
  const ids = Object.keys(E.ITEMS);
  const slotsUsed = E.slotsUsed(S), slotsMax = E.premOf(S).slots;
  return `
  <div class="row-between">
    <h3>${icon('bag')} Оборудование и мебель</h3>
    <span class="muted small">Занято ${slotsUsed}/${slotsMax} слотов</span>
  </div>
  <div class="shop">
    ${ids.map(id => {
      const it = E.ITEMS[id];
      const owned = S.owned[id] || 0;
      const locked = it.lvl > S.lvl;
      const noMoney = S.money < it.cost;
      const noSpace = E.slotsUsed(S) + it.slots > slotsMax;
      const can = !locked && !(it.once && owned) && !noMoney && !noSpace;
      let btn;
      const inPalette = (S.unplaced || []).includes(id);
      if (locked) btn = `<span class="muted small">с ур. ${it.lvl}</span>`;
      else if (it.once && owned) btn = `<span class="ok small">${icon('check')} куплено</span>`;
      else btn = `<button class="btn small ${can ? '' : 'dis'}" data-act="buy" data-id="${id}" ${can ? '' : 'disabled'}>${inPalette ? 'ещё' : ''} ${fmt(it.cost)} ₽</button>`;
      return `
      <div class="item ${locked ? 'locked' : ''}">
        <div class="item-icon">${itemIcon(id)}</div>
        <div class="item-main">
          <div class="item-name">${it.name} ${owned > 1 ? `<span class="chip">×${owned}</span>` : ''}</div>
          <div class="muted small">${it.desc}${it.physical ? ` · ${it.size.w}×${it.size.h} кл.` : ''}</div>
        </div>
        ${btn}
      </div>`;
    }).join('')}
  </div>`;
}

function staffView(){
  const payroll = S.staff.reduce((a, st) => a + st.salary, 0);
  const roles = Object.keys(E.ROLES);
  return `
  <div class="row-between">
    <h3>${icon('users')} Команда</h3>
    <span class="muted small">ФОТ ${fmt(payroll)} ₽/день</span>
  </div>
  ${S.staff.length ? `<div class="staff-list">${S.staff.map(st => `
    <div class="staff-item">
      <div class="avatar">${st.name[0]}</div>
      <div class="item-main">
        <div class="item-name">${st.name} <span class="muted small">${E.ROLES[st.role].name}</span></div>
        <div class="muted small">${st.traitName} · скорость ${st.sp}/10 · аккуратность ${st.ac} · сервис ${st.sv}</div>
        <div class="bar"><i style="width:${st.mood}%" class="${st.mood < 35 ? 'danger' : st.mood < 60 ? 'warn' : ''}"></i></div>
      </div>
      <div class="staff-right">
        <div class="small">${(st.prepay||0) > 0 ? `аванс: ${st.prepay} дн.` : fmt(st.salary) + ' ₽/день'}</div>
        <button class="btn ghost small" data-act="fire" data-id="${st.id}">уволить</button>
      </div>
    </div>`).join('')}</div>` : `<div class="empty">Пока вы работаете один. Наймите грузчика — он разгружает поставки, или продавца — он выдаёт заказы.</div>`}

  <h3 class="sec">Кандидаты</h3>
  <div class="staff-list">
    ${S.candidates.map(c => {
      const r = E.ROLES[c.role];
      const can = E.canHire(S, c.role);
      const bd = E.hireBreakdown(S, c.role);
      return `
      <div class="staff-item cand">
        <div class="avatar alt">${c.name[0]}<span class="av-role">${roleIcon(c.role)}</span></div>
        <div class="item-main">
          <div class="item-name">${c.name} <span class="muted small">${r.name}</span></div>
          <div class="muted small">${c.traitName}: ${c.traitDesc}</div>
          <div class="muted small">скорость ${c.sp} · аккуратность ${c.ac} · сервис ${c.sv}</div>
        </div>
        <div class="staff-right">
          <div class="small">${fmt(c.salary)} ₽/день</div>
          <button class="btn small ${can.ok ? 'primary' : 'dis'}" data-act="hire" data-role="${c.role}" ${can.ok ? '' : 'disabled'}
            title="Оформление ${fmt(bd.onboard)} ₽ + аванс ${fmt(bd.advance)} ₽ (${bd.days} дн.)">
            Нанять · ${fmt(bd.total)} ₽</button>
          <div class="muted tiny">оформл. ${fmt(bd.onboard)} + аванс ${bd.days} дн.</div>
        </div>
      </div>`;
    }).join('')}
  </div>
  <div class="muted small">${E.ROLES.manager.lvl > S.lvl ? `Управляющий откроется на уровне ${E.ROLES.manager.lvl}.` : ''}</div>`;
}

function policyView(){
  return `
  <h3>${icon('archive')} Склад</h3>
  <div class="muted small">Ячейки: ${E.capacity(S).used}/${E.capacity(S).total} занято. Хрупкое и КГТ лучше держать в своих зонах: в общей они бьются.</div>
  <div class="policy-group">
    <div class="policy-title">Правило размещения</div>
    <div class="seg">
      <button class="seg-b ${S.policies.placement === 'sla' ? 'on' : ''}" data-act="policy" data-k="placement" data-v="sla">По сроку хранения (SLA)</button>
      <button class="seg-b ${S.policies.placement === 'code' ? 'on' : ''}" data-act="policy" data-k="placement" data-v="code">По коду</button>
    </div>
    <div class="muted small">Влияет на скорость поиска. «По сроку» — горящие заказы ближе к выдаче.</div>
  </div>
  <div class="policy-group">
    <div class="policy-title">Правило переполнения</div>
    <div class="seg">
      <button class="seg-b ${S.policies.overflow === 'block' ? 'on' : ''}" data-act="policy" data-k="overflow" data-v="block">Не принимать лишнее</button>
      <button class="seg-b ${S.policies.overflow === 'reserve' ? 'on' : ''}" data-act="policy" data-k="overflow" data-v="reserve">Складывать в приёмку</button>
    </div>
  </div>
  <div class="policy-group">
    <div class="policy-title">Просроченные</div>
    <div class="seg">
      <button class="seg-b ${S.policies.autoReturn ? 'on' : ''}" data-act="policy" data-k="autoReturn" data-v="1">Автовозврат</button>
      <button class="seg-b ${!S.policies.autoReturn ? 'on' : ''}" data-act="policy" data-k="autoReturn" data-v="0">Не возвращать</button>
    </div>
  </div>`;
}

/* ---------------- день ---------------- */
function viewDay(){
  const truck = S.trucks.find(t => t.arrived && t.left > 0);
  const cap = E.capacity(S);
  const busy = S.player.busy;
  const busyClient = busy ? S.clients.find(c => c.id === busy.clientId) : null;

  const ab = actionBar();
  return `
  ${viewHud()}
  <main class="wrap day${ab ? ' with-bar' : ''}">
    <div data-r="alerts">
    ${S.fatigue > 60 ? `<div class="alert warnline">Усталость ${Math.round(S.fatigue)}% — ошибки вероятнее, обслуживание медленнее.</div>` : ''}
    ${busy ? `<div class="alert busyline">
        ${icon(busy.kind === 'fetch' ? 'pin' : 'check')} ${busy.kind === 'fetch' ? 'Иду за посылкой' : 'Отдаю заказ'} <b>${busyClient ? esc(busyClient.code) : ''}</b>
        <div class="bar thin"><i data-live="busy-bar" style="width:${pct(busy.total - busy.t, busy.total)}%"></i></div>
        <span class="small" data-live="busy-t">${busy.t} мин</span>
      </div>` : ''}
    ${(!busy && S.hands) ? `<div class="alert handsline">
        ${icon('box')} В руках: <b>${esc(S.hands.code)}</b> — несите клиенту
        <button class="btn ghost small" data-act="returnHands">вернуть на полку</button>
      </div>` : ''}
    </div>

    <div class="day-grid">
      <section class="col sec-a">
        <div data-r="machine">${truck ? `
        <div class="card pad truck">
          <div class="row-between">
            <div><b class="ico-lead">${icon('truck')} Машина</b> <span class="muted small">${truck.left} посылок · <span data-live="truck-t">уедет через ${Math.max(0, truck.waitLeft)} мин</span></span></div>
            <div class="row">
              <button class="btn small primary" data-act="accept">Принять</button>
              <button class="btn small" data-act="acceptAll">Всё</button>
            </div>
          </div>
          <div class="bar thin"><i class="${truck.waitLeft < 60 ? 'danger' : 'warn'}" data-live="truck-bar" style="width:${pct(truck.waitLeft, 300)}%"></i></div>
        </div>` : ''}</div>

        <div class="card pad" data-r="receiving">
          <div class="row-between">
            <h3>${icon('inbox')} Зона приёмки <span class="muted small">${S.receiving.length}/${E.CFG.RECV_MAX}</span></h3>
            ${S.receiving.length ? `<button class="btn ghost small" data-act="placeAll">Разложить всё</button>` : ''}
          </div>
          ${S.receiving.length ? `<div class="chips wrap">${S.receiving.map(p => `
            <button class="pk ${U.selBox === p.id ? 'sel' : ''} ${p.fragile ? 'frag' : ''}" data-act="pickBox" data-id="${p.id}">
              ${p.code}<span class="sz">${p.size}</span>
            </button>`).join('')}</div>`
          : emptyBox('Пусто. Примите посылки из машины.')}
          ${U.selBox ? `<div class="muted small">Выберите свободную ячейку (подсвечены). Хрупкое и КГТ — только в свою зону.</div>` : ''}
        </div>
      </section>

      <section class="col sec-b">
        <div class="card pad" data-r="queue">
          <div class="row-between">
            <h3>${icon('users')} Очередь <span class="muted small">${S.clients.length}</span></h3>
            <span class="muted small">продавцов: ${S.staff.filter(s => s.role === 'seller').length}</span>
          </div>
          ${S.clients.length ? `<div class="queue">${S.clients.slice(0, 8).map(c => clientCard(c)).join('')}</div>` : `<div class="empty small">Пока никого. Передохните.</div>`}
          ${S.clients.length > 8 ? `<div class="muted small">и ещё ${S.clients.length - 8}…</div>` : ''}
        </div>

        <div class="card pad logcard" data-r="log">
          <h3>${icon('activity')} Лента</h3>
          <div class="log">${S.log.slice(0, 7).map(l => `<div class="logline ${l.type}"><span class="lt">${l.t ? String(Math.floor(l.t/60)+9).padStart(2,'0')+':'+String(l.t%60).padStart(2,'0') : ''}</span>${esc(l.text)}</div>`).join('')}</div>
        </div>

        ${miniMap()}
      </section>

      <section class="col sec-c">
        <div class="card pad" data-r="shelves">
          <h3>${icon('shelf')} Стеллажи <span class="muted small">${cap.used}/${cap.total}</span></h3>
          ${S.shelves.length ? S.shelves.map(sh => shelfView(sh)).join('') : `<div class="empty">Стеллажей нет. Купите в магазине (в фазе планирования).</div>`}
        </div>
      </section>
    </div>

    ${ab}

    <div class="sticky-cta" data-r="cta">
      <div class="muted small">${hintText()}</div>
      <div class="row">
        ${speedButtons()}
        <button class="btn ghost" data-act="endDayNow">Завершить день</button>
      </div>
    </div>
  </main>`;
}

/* панель текущего дела: всегда под рукой, не надо искать клиента на экране */
function actionBar(){
  const b = S.player.busy;
  const sel = U.selClient ? S.clients.find(c => c.id === U.selClient) : null;
  const loc = sel ? E.clientLocation(S, sel.id) : null;

  let body = '';
  if (b){
    const who = S.clients.find(c => c.id === b.clientId);
    const label = b.kind === 'fetch' ? icon('pin') + ' Иду за посылкой' : icon('check') + ' Несу заказ клиенту';
    body = `<div class="ab-main">
        <div class="ab-title">${label}${who ? ' · ' + esc(who.code) : ''}</div>
        <div class="bar thin"><i data-live="ab-bar" style="width:${pct(b.total - b.t, b.total)}%"></i></div>
      </div>
      <div class="ab-time" data-live="ab-t">${Math.max(0, Math.ceil(b.t))} мин</div>`;
  } else if (S.hands){
    const c = S.clients.find(x => x.code === S.hands.code);
    body = `<div class="ab-main">
        <div class="ab-title">${icon('box')} В руках ${esc(S.hands.code)}</div>
        <div class="small muted">${c ? 'Несите клиенту' : 'Клиент ушёл — верните на полку'}</div>
      </div>
      ${c ? `<button class="btn primary" data-act="give" data-id="${c.id}">Выдать</button>`
          : `<button class="btn ghost" data-act="returnHands">На полку</button>`}`;
  } else if (sel && loc){
    body = `<div class="ab-main">
        <div class="ab-title">${icon('pin')} ${esc(loc.address)}</div>
        <div class="small muted">Клиент ${esc(sel.code)}</div>
      </div>
      <button class="btn primary" data-act="fetch" data-id="${sel.id}">Взять</button>`;
  } else if (sel){
    body = `<div class="ab-main">
        <div class="ab-title">${icon('alert')} Посылки нет на полке</div>
        <div class="small muted">Клиент ${esc(sel.code)} ждёт</div>
      </div>`;
  } else {
    return '';
  }
  return `<div class="actionbar" data-r="actionbar">${body}</div>`;
}

function emptyBox(t){ return `<div class="empty small">${t}</div>`; }

function shelfView(sh){
  const used = sh.cells.filter(c => c).length;
  const label = E.ZONES[sh.kind] || '';
  const selC = U.selClient ? S.clients.find(c => c.id === U.selClient) : null;
  const loc = selC ? E.clientLocation(S, selC.id) : null;

  return `
  <div class="shelf">
    <div class="shelf-head">
      <span class="zone-tag z-${sh.kind}">${E.shelfName(S, sh.id).replace('Стеллаж ','Стеллаж ')} · ${label}</span>
      <span class="muted small">${used}/${sh.cap} · <span class="ico-inline">${icon('pin')}${E.fetchMinutes(S, sh.id)} мин</span></span>
    </div>
    <div class="cells">
      ${sh.cells.map((cell, i) => {
        const isLoc = loc && loc.shelfId === sh.id && loc.cellIdx === i;
        return `<button class="cell ${cell ? 'full' : 'empty'} ${isLoc ? 'located' : ''}" data-act="cell" data-shelf="${sh.id}" data-idx="${i}"
          title="${cell ? cell.code + ' · ' + cell.size : 'пусто'}">${i + 1}</button>`;
      }).join('')}
    </div>
  </div>`;
}

function clientCard(c){
  const busy = S.player.busy;
  const sel = U.selClient === c.id;
  const loc = sel ? E.clientLocation(S, c.id) : null;
  const handsForMe = S.hands && c.code === S.hands.code;
  const patiencePct = pct(c.patience, c.maxPatience);
  const myTask = busy && busy.clientId === c.id;

  if (c.consult){
    return `<div class="client consult" data-act="consult" data-id="${c.id}">
      <div class="cl-tap static">
        <div class="cl-code">Вопрос</div>
        <div class="muted small">Клиент с вопросом</div>
      </div>
      <button class="btn small" data-act="consult" data-id="${c.id}">Ответить</button>
    </div>`;
  }

  const tags = (c.type === 'hurry' ? '<span class="tag">торопится</span>'
             : c.type === 'scandal' ? '<span class="tag bad">скандалит</span>' : '')
             + (c.tryon ? '<span class="tag">примерка</span>' : '');

  let action = '';
  if (myTask) action = '<div class="cl-act">в пути…</div>';
  else if (handsForMe) action = `<button class="btn small primary" data-act="give" data-id="${c.id}">Выдать</button>`;
  else if (sel && loc) action = `<button class="btn small primary" data-act="fetch" data-id="${c.id}">Взять</button>`;
  else if (sel) action = `<div class="cl-act">нет на полке</div>`;
  else action = `<button class="btn small serve" data-act="pickClient" data-id="${c.id}">Обслужить</button>`;

  return `<div class="client ${sel ? 'sel' : ''} ${c.type} ${handsForMe ? 'ready' : ''}" data-act="pickClient" data-id="${c.id}">
    <button class="cl-tap" data-act="pickClient" data-id="${c.id}">
      <div class="cl-code">${c.code} ${tags}</div>
      <div class="bar"><i class="${patiencePct < 30 ? 'danger' : patiencePct < 60 ? 'warn' : ''}" data-live="pat:${c.id}" style="width:${patiencePct}%"></i></div>
      ${sel && loc ? `<div class="cl-addr">${icon('pin')} ${esc(loc.address)}</div>` : ''}
      ${sel && !loc && !handsForMe ? `<div class="cl-addr bad">Посылки нет на полке</div>` : ''}
      ${myTask ? `<div class="cl-addr">${busy.kind === 'fetch' ? 'Иду за посылкой' : 'Отдаю заказ'} · <span data-live="clt:${c.id}">${busy.t}</span> мин</div>` : ''}
    </button>
    ${action}
  </div>`;
}

/* ---------------- отчёт ---------------- */
function viewReport(){
  const r = S.report || { ds:S.dayStats, costs:0, avgSla:0, missedRate:0, p:E.premOf(S) };
  const ds = r.ds;
  const rows = [
    ['Выручка за заказы', ds.revenue, 'good'],
    ['Чаевые', ds.tips, 'good'],
    ds.events ? ['События дня', ds.events, ds.events > 0 ? 'good' : 'bad'] : null,
    ['Аренда', -ds.rent, 'bad'],
    ['Зарплаты', -ds.payroll, 'bad'],
    ['Коммуналка', -ds.util, 'bad'],
    ['Штрафы', -ds.fines, 'bad'],
    ds.loan ? ['Кредит', -ds.loan, 'bad'] : null,
    ds.tax ? ['Налог', -ds.tax, 'bad'] : null,
  ].filter(Boolean);

  return `
  ${viewHud()}
  <main class="wrap">
    <section class="card pad" data-r="rep">
      <div class="kicker">Итоги дня</div>
      <h2>День ${S.day}</h2>
      <div class="report-grid">
        <div class="rn"><b>${ds.issued}</b><span>выдано</span></div>
        <div class="rn"><b class="${ds.missed ? 'bad' : ''}">${ds.missed}</b><span>упущено</span></div>
        <div class="rn"><b>${Math.round(r.avgSla) || 0} мин</b><span>средняя выдача</span></div>
        <div class="rn"><b>${S.nps.toFixed(2)}</b><span>NPS</span></div>
      </div>
      <div class="pnl">${rows.map(([label, val, cls]) => `
        <div class="pnl-row"><span>${label}</span><b class="${val === 0 ? 'muted' : cls}">${val === 0 ? '0 ₽' : (val > 0 ? '+' : '') + fmt(val) + ' ₽'}</b></div>`).join('')}
        <div class="pnl-row total"><span>Итого за день</span><b class="${ds.net >= 0 ? 'good' : 'bad'}">${ds.net > 0 ? '+' : ''}${fmt(ds.net)} ₽</b></div>
      </div>
      ${ds.onPrepay ? `<div class="muted small" style="margin-bottom:6px">${icon('manager')} ${ds.onPrepay} сотрудник(ов) работают за счёт аванса — зарплата за них не списывалась.</div>` : ''}
      <div class="muted small">${reportAdvice(r)}</div>
    </section>

    ${S.over ? `<section class="card pad gameover">
        <h2 class="bad">Бизнес закрыт</h2>
        <p>${S.overReason === 'bankrupt' ? 'Три дня подряд касса уходила в минус. Поставщик отключил поставки, аренда не прощена.' : 'Вы не справились с обязательствами.'}</p>
        <p class="muted small">Прожито дней: ${S.day}. Выдано заказов: ${S.history.reduce((a,h)=>a+h.issued,0)}. Финальный уровень: ${S.lvl}.</p>
        <button class="btn primary big" data-act="restart">Начать заново</button>
      </section>`
    : `<div class="sticky-cta">
        <div class="muted small">${hintText()}</div>
        <button class="btn primary big" data-act="nextDay">Следующий день ${icon('chevron')}</button>
      </div>`}
  </main>`;
}

function reportAdvice(r){
  const ds = r.ds;
  const tips = [];
  if (ds.missed > 3) tips.push('Много упущенных клиентов — не хватает рук в пиковых часах. Наймите продавца.');
  if (r.avgSla > E.contractOf(S).sla && ds.issued) tips.push('Средняя выдача дольше нормы: помогает сканер, стойка и порядок на полках.');
  if (E.compliance(S) < 1) tips.push('Брендбук закрыт не полностью — это минус к выплате за каждый заказ.');
  if (ds.net < 0) tips.push('День убыточный: сократите постоянные расходы или поднимите поток.');
  if (!tips.length) tips.push('День ровный. Так и держать.');
  return tips.join(' ');
}

/* ---------------- события ---------------- */
function viewEvent(){
  const ev = S.event;
  return `
  <div class="modal-bg">
    <div class="modal">
      <div class="modal-head">
        <div class="modal-ico">${icon('alert')}</div>
        <div>
          <div class="kicker">Событие</div>
          <h2>${esc(ev.title)}</h2>
        </div>
      </div>
      <p class="muted">${esc(ev.text)}</p>
      <div class="opts">
        ${ev.options.map((o, i) => `<button class="btn opt" data-act="eventOpt" data-i="${i}"><span class="opt-t">${esc(o.text)}</span><span class="opt-go">${icon('chevron')}</span></button>`).join('')}
      </div>
      <div class="muted small ico-inline">${icon('clock')} ${Math.max(0, Math.round(ev.endsAt - S.minutes))} мин на решение</div>
    </div>
  </div>`;
}

function viewInstall(){
  const hints = installHints();
  return `
  <div class="modal-bg" data-act="closeInstall">
    <div class="modal">
      <div class="modal-head">
        <div class="modal-ico">${icon('box')}</div>
        <div>
          <div class="kicker">Установка</div>
          <h2>ПВЗ-Сити на телефоне</h2>
        </div>
      </div>
      <p class="muted">Игра ставится как обычное приложение: своя иконка, полный экран, работает без интернета. Прогресс хранится на устройстве.</p>
      <ol class="steps">
        ${hints.map(h => `<li>${h}</li>`).join('')}
      </ol>
      <div class="opts">
        ${U.installEvt ? `<button class="btn primary opt" data-act="installApp"><span class="opt-t">Установить сейчас</span><span class="opt-go">${icon('chevron')}</span></button>` : ''}
        <button class="btn opt" data-act="closeInstall"><span class="opt-t">Понятно</span><span class="opt-go">${icon('chevron')}</span></button>
      </div>
    </div>
  </div>`;
}

/* ---------------- меню ---------------- */
function viewMenu(){
  return `
  <div class="modal-bg" data-act="closeMenu">
    <div class="modal" onclick="void 0">
      <div class="kicker">Меню</div>
      <h2>ПВЗ-Сити</h2>
      <p class="muted small">Версия 0.1 · Срез 0 + ядро глубины. Прогресс сохраняется автоматически.</p>
      <div class="opts">
        <button class="btn opt" data-act="closeMenu"><span class="opt-t">Продолжить</span><span class="opt-go">${icon('chevron')}</span></button>
        <button class="btn opt" data-act="help"><span class="opt-t">Как играть</span><span class="opt-go">${icon('chevron')}</span></button>
        ${U.installEvt ? `<button class="btn opt" data-act="installApp"><span class="opt-t">Установить приложение</span><span class="opt-go">${icon('chevron')}</span></button>` : ''}
        ${!U.installEvt && !U.installed ? `<button class="btn opt" data-act="installHelp"><span class="opt-t">Как установить на телефон</span><span class="opt-go">${icon('chevron')}</span></button>` : ''}
        <button class="btn opt" data-act="toggleSound"><span class="opt-t">Звук: ${soundOn ? 'вкл' : 'выкл'}</span><span class="opt-go">${icon('chevron')}</span></button>
        <button class="btn opt" data-act="hardReset"><span class="opt-t">Начать новую игру</span><span class="opt-go">${icon('chevron')}</span></button>
      </div>
      <div class="menu-state">
        <span class="chip">${icon(U.installed ? 'check' : 'box')} ${U.installed ? 'установлено' : 'в браузере'}</span>
        <span class="chip ${U.online ? '' : 'warn'}">${icon(U.online ? 'activity' : 'alert')} ${U.online ? 'в сети' : 'офлайн'}</span>
        <span class="chip">${icon('archive')} ${U.swReady ? 'офлайн-кеш готов' : 'кеш не активен'}</span>
      </div>
    </div>
  </div>`;
}

function viewHelp(){
  return `
  <div class="modal-bg" data-act="closeHelp">
    <div class="modal">
      <div class="kicker">Правила</div>
      <h2>Как играть</h2>
      <div class="help">
        <p><b>1. Утро.</b> Смотрите прогноз потока, покупайте оборудование, нанимайте людей. «Начать день» — решения приняты.</p>
        <p><b>2. Планировка.</b> Вкладка «Планировка» — расставьте стойку, стеллажи и примерочную по сетке. Чем дальше стеллаж от стойки, тем дольше вы идёте за заказом. Без стойки и стеллажа день не начнётся.</p>
        <p><b>3. Машина.</b> Две поставки в день — большие, но редкие. Принимайте посылки (они попадают в зону приёмки) и раскладывайте по ячейкам: хрупкое — в «Хрупкое», крупное — в КГТ.</p>
        <p><b>3. Клиенты.</b> Клиент показывает код. Тапните на него — система подскажет адрес: «Стеллаж Б · ячейка 7». Жмите «Взять», дойдите до полки (ячейка подсвечена), затем «Выдать» — и деньги в кассе.</p>
        <p><b>4. Время — деньги.</b> Пока вы обслуживаете одного, очередь растёт. Нанимайте продавца и грузчика, чтобы не разрываться.</p>
        <p><b>5. Найм.</b> Сотрудник стоит недешево: оформление плюс аванс зарплаты за 10 дней вперёд. Уволите раньше — аванс не вернут. Поэтому первый наём — это рубеж, к которому вы копите.</p>
        <p><b>6. Вечер.</b> Отчёт покажет прибыль, KPI и усталость. Раз в неделю — аудит контракта: не выполнили KPI — понижение.</p>
      </div>
      <div class="opts"><button class="btn primary" data-act="closeHelp">Понятно</button></div>
    </div>
  </div>`;
}

/* ---------------- подсказки ---------------- */
function hintText(){
  if (S.phase === 'plan'){
    const probs = E.layoutProblems(S);
    if (probs.length) return probs.join(' · ');
    if (!S.shelves.length) return 'Сначала купите стеллаж — без него посылки некуда класть.';
    if (!S.owned.counter) return 'Стойка выдачи ускоряет поиск заказа. Брендбук требует её тоже.';
    if (!S.staff.length) return 'Вы работаете один. Первый сотрудник стоит как оформление + аванс за 10 дней — копите.';
    return 'Проверьте прогноз и закупки, затем начинайте день.';
  }
  if (S.phase === 'day'){
    const truck = S.trucks.find(t => t.arrived && t.left > 0);
    if (S.player.busy) return 'Вы обслуживаете клиента — подождите или прервите.';
    if (truck) return 'Машина ждёт: принимайте посылки, потом раскладывайте.';
    if (S.receiving.length) return 'Выберите посылку и свободную ячейку — или «Разложить всё».';
    if (S.hands) return 'Посылка в руках: отдайте клиенту кнопкой «Выдать».';
    if (S.clients.length) return 'Тапните клиента — система покажет, где лежит его посылка.';
    return 'Спокойно. Смотрите на ленту событий.';
  }
  return '';
}

/* ---------------- действия ---------------- */
async function act(type, d){
  switch(type){
    case 'pickBrand': U.sel.brand = d.id; beep(600,0.05); break;
    case 'pickPremise': U.sel.premise = d.id; beep(600,0.05); break;
    case 'startGame': newGame(); break;
    case 'tab': U.tab = d.id; break;
    case 'buy': {
      const r = E.buy(S, d.id);
      if (r.ok){
        beep(520,0.06,'triangle');
        const it = E.ITEMS[d.id];
        if (it && it.physical) toast(`${it.name}: расставьте на вкладке «Планировка»`, 'good');
        else toast('Куплено');
      } else { toast(r.msg || 'Нельзя', 'bad'); beep(180,0.08,'square'); }
      break;
    }
    case 'hire': {
      const r = E.hire(S, d.role);
      if (r.ok){ toast('Нанят сотрудник'); beep(660,0.08,'triangle'); } else { toast(r.msg || 'Нельзя', 'bad'); beep(180,0.08,'square'); }
      break;
    }
    case 'installApp': {
      const ev = U.installEvt;
      if (!ev){ U.installHelp = true; break; }
      U.installEvt = null;
      U.installHelp = false;
      try {
        ev.prompt();
        const choice = await (ev.userChoice || Promise.resolve({ outcome: 'dismissed' }));
        if (choice && choice.outcome === 'accepted') toast('Устанавливаем…', 'good');
        else toast('Можно установить позже из меню', 'info');
      } catch(e){ toast('Браузер не дал установить — см. инструкцию', 'bad'); U.installHelp = true; }
      break;
    }
    case 'installHelp': U.installHelp = true; break;
    case 'closeInstall': U.installHelp = false; break;
    case 'fire': { const r = E.fire(S, d.id); if (!r.ok) toast(r.msg, 'bad'); break; }
    case 'loan': { const r = E.takeLoan(S, 20000); if (!r.ok) toast(r.msg, 'bad'); else beep(400,0.1,'sawtooth'); break; }
    case 'policy': {
      const k = d.k, v = d.v;
      if (k === 'autoReturn') S.policies[k] = v === '1'; else S.policies[k] = v;
      break;
    }
    case 'startDay': {
      const probs = E.layoutProblems(S);
      if (probs.length){ toast(probs[0], 'bad'); break; }
      E.startDay(S); U.screen = 'day'; save(); beep(440,0.1,'triangle');
      break;
    }
    case 'nextDay': E.nextDay(S); U.screen = 'plan'; U.selClient = null; U.selBox = null; save(); break;
    case 'restart': safeDel('pvz_save_v1'); S = null; U.screen = 'start'; break;
    case 'speed': S.speed = +d.v; break;
    case 'accept': {
      const r = E.acceptBox(S);
      if (!r.ok) toast(r.msg, 'bad'); else beep(700,0.04,'square');
      break;
    }
    case 'acceptAll': {
      let n = 0, r;
      while ((r = E.acceptBox(S, true)).ok){ n++; if (n > 20) break; }
      if (n) { toast(`Принято ${n} посылок`, 'good'); beep(700,0.05,'square'); }
      else toast(r.msg || 'Нечего принимать', 'bad');
      break;
    }
    case 'pickItem': U.selItem = U.selItem === +d.i ? null : +d.i; U.moveId = null; break;
    case 'fixTap': {
      U.moveId = U.moveId === d.id ? null : d.id;
      U.selItem = null;
      break;
    }
    case 'roomCell': {
      if (U.moveId){
        const r = E.moveFixture(S, U.moveId, +d.x, +d.y);
        if (r.ok){ beep(500,0.05,'square'); U.moveId = null; }
        else toast(r.msg || 'Здесь занято', 'bad');
        break;
      }
      if (U.selItem == null){ toast('Сначала выберите предмет из списка'); break; }
      const itemId = S.unplaced[U.selItem];
      const r = E.placeFixture(S, itemId, +d.x, +d.y);
      if (r.ok){ beep(520,0.05,'square'); if (!S.unplaced.length) U.selItem = null; else U.selItem = Math.min(U.selItem, S.unplaced.length - 1); }
      else toast(r.msg || 'Не помещается', 'bad');
      break;
    }
    case 'removeFix': {
      const r = E.removeFixture(S, d.id);
      if (r.ok) beep(420,0.05,'square'); else toast(r.msg, 'bad');
      break;
    }
    case 'autoLayout': {
      const r = E.autoLayout(S);
      toast(r.placed ? `Расставлено: ${r.placed}` : 'Нечего расставлять', r.placed ? 'good' : 'bad');
      break;
    }
    case 'pickBox': U.selBox = U.selBox === d.id ? null : d.id; U.selClient = null; break;
    case 'placeAll': {
      let n = 0;
      for (const pkg of [...S.receiving]){
        let done = false;
        for (const sh of S.shelves){
          if (sh.kind !== E.zoneOf(pkg) && sh.kind !== 'std') continue;
          const idx = sh.cells.indexOf(null);
          if (idx >= 0){ const r = E.placeBox(S, pkg.id, sh.id, idx); if (r.ok){ n++; done = true; } break; }
        }
        if (!done) break;
      }
      if (n){ toast(`Разложено ${n}`, 'good'); beep(520,0.05,'square'); } else toast('Нет свободных ячеек', 'bad');
      break;
    }
    case 'cell': {
      const shelfId = d.shelf, idx = +d.idx;
      if (U.selBox){
        const r = E.placeBox(S, U.selBox, shelfId, idx);
        if (r.ok){ U.selBox = null; beep(520,0.05,'square'); } else toast(r.msg, 'bad');
      } else {
        const sh = S.shelves.find(x => x.id === shelfId);
        const cell = sh && sh.cells[idx];
        if (cell) toast(`${E.cellAddress(S, shelfId, idx)} · ${cell.code} · ${cell.size}${cell.fragile ? ' · хрупкое' : ''}`);
        else toast(`${E.cellAddress(S, shelfId, idx)} — пусто`);
      }
      break;
    }
    case 'fetch': {
      const r = E.startFetch(S, d.id);
      if (r.ok){ toast(`Иду за посылкой: ${r.address}`, 'good'); beep(620,0.05,'square'); }
      else { toast(r.msg || 'Нельзя', 'bad'); beep(180,0.09,'square'); }
      break;
    }
    case 'give': {
      const r = E.giveToClient(S, d.id);
      if (r.ok) beep(760,0.06,'triangle');
      else toast(r.msg || 'Ошибка', 'bad');
      break;
    }
    case 'returnHands': {
      const r = E.returnHands(S);
      if (!r.ok) toast(r.msg, 'bad');
      break;
    }
    case 'pickClient': {
      U.selClient = U.selClient === d.id ? null : d.id;
      U.selBox = null;
      beep(660,0.04,'sine');
      if (U.selClient && window.innerWidth >= 900) setTimeout(() => {
        const cell = document.querySelector('.cell.located');
        if (cell && cell.scrollIntoView) cell.scrollIntoView({ block:'center', behavior:'smooth' });
      }, 60);
      break;
    }
    case 'consult': { const r = E.consult(S, d.id); if (!r.ok) toast(r.msg, 'bad'); break; }
    case 'eventOpt': { E.resolveEvent(S, +d.i); beep(500,0.08,'triangle'); break; }
    case 'endDayNow': E.endDay(S); U.screen = 'report'; save(); break;
    case 'openMenu': U.menu = !U.menu; break;
    case 'help': U.help = true; U.menu = false; break;
    case 'closeHelp': U.help = false; break;
    case 'closeMenu': U.menu = false; break;
    case 'toggleSound': soundOn = !soundOn; U.menu = true; toast(soundOn ? 'Звук включён' : 'Звук выключен'); break;
    case 'hardReset': {
      safeDel('pvz_save_v1');
      S = null; U.screen = 'start'; U.menu = false;
      break;
    }
  }
  render();
}

/* Действия вешаем на pointerup: DOM перерисовывается каждые ~110 мс,
   и обычный click может «потеряться», если кнопку успели перерисовать. */
let press = null;
document.addEventListener('pointerdown', e => {
  const el = e.target.closest('[data-act]');
  press = el ? { act: el.dataset.act, data: Object.assign({}, el.dataset), x: e.clientX, y: e.clientY } : null;
}, { passive:true });

document.addEventListener('pointerup', e => {
  if (!press) return;
  const dx = Math.abs(e.clientX - press.x), dy = Math.abs(e.clientY - press.y);
  const p = press; press = null;
  if (dx < 14 && dy < 14){ try { act(p.act, p.data); } catch(err){ console.error(err); } }
}, { passive:true });

document.addEventListener('pointercancel', () => { press = null; });

/* доступность: клавиатура */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest && e.target.closest('[data-act]');
  if (!el) return;
  e.preventDefault();
  act(el.dataset.act, Object.assign({}, el.dataset));
});

document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });

/* автосейв раз в 20 секунд */
setInterval(save, 20000);
