/* ============================================================
   ПВЗ-Сити — движок симуляции
   Чистая логика. Никакого DOM. Детерминированный (seeded RNG).
   ============================================================ */

export const CFG = {
  DAY_MIN: 720,             // 09:00 -> 21:00
  START_HOUR: 9,
  MIN_PER_SEC: 5,           // 1 реальная секунда = 5 игровых минут при 1x
  START_MONEY: 60000,
  PAY_BASE: 100,            // базовая выплата за заказ
  TAX_RATE: 0.06,           // УСН 6% с выручки
  LOAN_RATE: 0.007,         // 0.7% в день
  LOAN_LIMIT_MULT: 3,       // до 3x дневной выручки
  RECV_MAX: 10,             // зона приёмки
  PATIENCE_BASE: 120,       // игровых минут терпения
  UTIL_PER_DAY: 400,
  SEARCH_BASE: 14,          // игровых минут на поиск заказа
  RET_CAP: 4,               // сколько возвратов влезает на стойку
  RET_HOUR_MIN: 600,        // 19:00 — приезжает машина за возвратами
  RET_SHIP_FEE: 25,         // платят за обработку возврата
  RET_LATE_FINE: 80,        // штраф за неотправленный возврат
  PACK_PRICE: 60,           // упаковка заказа
  SHIFT_PART: 0.62,         // смена полдня стоит 62% оклада
  BREAK_CHANCE: 0.10,       // шанс поломки техники за день
  NEG_DAYS_LIMIT: 3,
  DIRTY_TIRED: 70,
  PREPAY_DAYS: 10,         // аванс за первые дни работы при найме
};

export const BRANDS = [
  { id:'plus',  name:'Плюс Маркет', color:'#3b82f6', color2:'#1d4ed8', tag:'Синий. Простой. Надёжный.',
    traffic:1.10, payout:1.00, req:['counter','banner','light'] },
  { id:'skor',  name:'Скороход',    color:'#8b5cf6', color2:'#5b21b6', tag:'Фиолетовый. Быстрый. Дерзкий.',
    traffic:1.22, payout:0.96, req:['counter','banner','light','coffee'] },
  { id:'gorod', name:'Городок',     color:'#22c55e', color2:'#15803d', tag:'Зелёный. Тёплый. Местный.',
    traffic:1.04, payout:1.10, req:['counter','banner','light','sofa'] },
];

export const PREMISES = [
  { id:'garage', name:'Гараж у дома',             deposit:0,     rent:900,  slots:8,  gw:7,  gh:6, traffic:0.78, payout:0.90, lvl:1,
    desc:'Дёшево и сердито. Поток слабый, зато аренда не душит.' },
  { id:'spal',   name:'Первый этаж, спальник',    deposit:12000, rent:2200, slots:12, gw:9,  gh:7, traffic:1.00, payout:1.00, lvl:1,
    desc:'Жилой дом, постоянные клиенты. Золотая середина.' },
  { id:'mall',   name:'Помещение в ТЦ',           deposit:36000, rent:4200, slots:18, gw:11, gh:8, traffic:1.45, payout:1.12, lvl:4,
    desc:'Большой поток и высокие ставки. Ошибка в прогнозе = кассовый разрыв.' },
];

export const ITEMS = {
  counter:  {name:'Стойка выдачи',      icon:'🛒', cost:12000, slots:1, once:true, lvl:1, req:true,  size:{w:2,h:1}, physical:true, short:'Стойка', desc:'Рабочее место. Ставьте ближе к центру зала'},
  banner:   {name:'Баннер бренда',      icon:'🪧', cost:6000,  slots:1, once:true, lvl:1, req:true,  size:{w:1,h:1}, physical:true, short:'Баннер', desc:'Требование брендбука'},
  light:    {name:'Витринное освещение',icon:'💡', cost:5000,  slots:1, once:true, lvl:1, req:true,  desc:'Требование брендбука'},
  scanner:  {name:'Сканер ШК',          icon:'📡', cost:7000,  slots:1, once:true, lvl:2, search:-4, desc:'−4 мин к поиску заказа'},
  printer:  {name:'Принтер этикеток',   icon:'🖨️', cost:6500,  slots:1, once:true, lvl:2, search:-2, acc:2, desc:'−2 мин к поиску, меньше ошибок'},
  terminal: {name:'Терминал оплаты',    icon:'💳', cost:15000, slots:1, once:true, lvl:3, pay:1.08,  desc:'+8% к выплате за заказ'},
  coffee:   {name:'Кофемашина',         icon:'☕', cost:11000, slots:1, once:true, lvl:2, traffic:1.08, size:{w:1,h:1}, physical:true, short:'Кофе', desc:'+8% к потоку клиентов'},
  sofa:     {name:'Диван для клиентов', icon:'🛋️', cost:9000,  slots:1, once:true, lvl:2, patience:1.20, size:{w:2,h:1}, physical:true, short:'Диван', desc:'+20% терпения клиентов'},
  fitting:  {name:'Примерочная',        icon:'🚪', cost:14000, slots:1, once:true, lvl:2, size:{w:2,h:2}, physical:true, short:'Примерка', desc:'Без неё примерка одежды портит NPS'},
  ac:       {name:'Кондиционер',        icon:'❄️', cost:14000, slots:1, once:true, lvl:3, patience:1.25, desc:'+25% терпения, меньше выгорания'},
  music:    {name:'Музыкальный фон',    icon:'🎵', cost:4000,  slots:1, once:true, lvl:1, patience:1.10, desc:'+10% терпения клиентов'},
  cam:      {name:'Камера',             icon:'📹', cost:8000,  slots:1, once:true, lvl:3, fines:0.5,   desc:'Штрафы за ошибки вдвое меньше'},
  shelfStd: {name:'Стеллаж на 16',      icon:'🗄️', cost:9000,  slots:2, repeat:true, lvl:1, cap:16, zone:'std',  size:{w:2,h:1}, physical:true, short:'Стеллаж', desc:'16 ячеек хранения'},
  shelfFrag:{name:'Полка «Хрупкое»',    icon:'🥚', cost:6000,  slots:1, repeat:true, lvl:2, cap:6,  zone:'frag', size:{w:1,h:1}, physical:true, short:'Хрупкое', desc:'6 ячеек, обязательна для хрупких'},
  shelfKgt: {name:'Зона КГТ',           icon:'📦', cost:9000,  slots:2, repeat:true, lvl:3, cap:4,  zone:'kgt',  size:{w:2,h:2}, physical:true, short:'КГТ', desc:'4 ячейки, обязательна для крупногабарита'},
};

export const ROLES = {
  seller:  {name:'Продавец',    icon:'🧑‍💼', salary:1700, onboard:2500, lvl:1, max:3, desc:'Сам находит и выдаёт заказы из очереди'},
  loader:  {name:'Грузчик',     icon:'🧑‍🏭', salary:1300, onboard:2500, lvl:1, max:2, desc:'Принимает поставки и раскладывает по ячейкам'},
  manager: {name:'Управляющий', icon:'👔', salary:2600, onboard:3500, lvl:4, max:1, desc:'+25% скорость команде, гасит скандалы, +NPS'},
};

export const CONTRACTS = [
  { id:'bronze', name:'Бронза',  sla:90, missed:0.08, nps:3.8, brand:0.70, pay:1.00, color:'#a16207' },
  { id:'silver', name:'Серебро', sla:60, missed:0.05, nps:4.1, brand:0.85, pay:1.10, color:'#94a3b8' },
  { id:'gold',   name:'Золото',  sla:40, missed:0.03, nps:4.4, brand:1.00, pay:1.25, color:'#f59e0b' },
  { id:'plat',   name:'Платина', sla:25, missed:0.015,nps:4.6, brand:1.00, pay:1.45, color:'#67e8f9' },
];

const NAMES = ['Игорь','Ольга','Дмитрий','Анна','Сергей','Мария','Алексей','Елена','Павел','Ирина','Ринат','Юлия','Максим','Светлана'];
const TRAITS = [
  { id:'worker',  name:'Трудяга',      speed:1.15, mood:-0.05, desc:'Быстрее, но требует больше' },
  { id:'pedant',  name:'Педант',       speed:0.9,  acc:0.06,    desc:'Аккуратен, но медлит' },
  { id:'soul',    name:'Душа компании',service:0.12, speed:0.97, desc:'Клиенты его любят' },
  { id:'lazy',    name:'Лентяй',       speed:0.82, salary:-250, desc:'Дёшев, но медленный' },
  { id:'grumpy',  name:'Скандалист',   service:-0.06, speed:1.05, desc:'Энергичен, но портит нервы' },
];
const ZONE_LABEL = { std:'Стандарт', frag:'Хрупкое', kgt:'КГТ' };

/* ---------------- RNG ---------------- */
export function rnd(S){ S.rng = (Math.imul(S.rng, 1664525) + 1013904223) >>> 0; return S.rng / 4294967296; }
function rr(S,a,b){ return a + rnd(S)*(b-a); }
function ri(S,a,b){ return Math.floor(rr(S,a,b+1)); }
function pick(S,arr){ return arr[Math.floor(rnd(S)*arr.length)]; }
function chance(S,p){ return rnd(S) < p; }

/* ---------------- accessors ---------------- */
export const brandOf    = S => BRANDS.find(b => b.id === S.brandId);
export const premOf     = S => PREMISES.find(p => p.id === S.premiseId);
export const contractOf = S => CONTRACTS[S.contractIdx];

export function compliance(S){
  const req = brandOf(S).req;
  const have = req.filter(id => S.owned[id]).length;
  return have / req.length;
}

export function slotsUsed(S){
  let n = 0;
  for (const id in S.owned) if (S.owned[id] > 0 && ITEMS[id].slots) n += ITEMS[id].slots * S.owned[id];
  return n;
}

export function capacity(S){
  let n = 0, free = 0;
  for (const sh of S.shelves){ n += sh.cap; free += sh.cells.filter(c => !c).length; }
  return { total:n, free, used:n - free };
}

export function zoneOf(pkg){
  if (pkg.size === 'XL') return 'kgt';
  if (pkg.fragile) return 'frag';
  return 'std';
}

export function storedPackages(S){
  const out = [];
  for (const sh of S.shelves) sh.cells.forEach((c,i)=>{ if (c) out.push({ ...c, shelfId:sh.id, cellIdx:i }); });
  return out;
}

export function findCellByCode(S, code){
  for (const sh of S.shelves){
    for (let i=0;i<sh.cells.length;i++) if (sh.cells[i] && sh.cells[i].code === code) return { shelfId:sh.id, cellIdx:i, pkg:sh.cells[i] };
  }
  return null;
}

/* ---------------- создание игры ---------------- */
export function createGame({ brandId, premiseId, seed }){
  const prem = PREMISES.find(p => p.id === premiseId) || PREMISES[1];
  const s0 = (seed == null ? (Date.now() % 1000000000) : seed) >>> 0;
  const S = {
    seed: s0, rng: s0 || 1,
    brandId: brandId || 'plus',
    premiseId: prem.id,
    money: CFG.START_MONEY - prem.deposit,
    day: 1, minutes: 0, phase: 'plan', speed: 1,
    nps: 4.2, xp: 0, lvl: 1,
    fatigue: 0, tiredUntil: -1, player: { busy: null }, hands: null,
    owned: {},
    grid: { w: prem.gw || 8, h: prem.gh || 6 },
    fixtures: [],
    unplaced: [],
    fittingBusy: [],
    shelves: [],
    receiving: [],
    returns: [],            // принятые возвраты, ждут машину
    broken: {},             // сломанная техника: { printer:true }
    clients: [],
    staff: [],
    candidates: [],
    trucks: [],
    event: null,
    contractIdx: 0,
    debt: 0,
    negDays: 0,
    // статистика дня
    dayStats: null,
    history: [],
    forecast: [],
    kpiWeek: { issued:0, slaSum:0, missed:0, arrivals:0, days:0 },
    log: [],
    aid: 1,
    policies: { placement:'sla', overflow:'block', autoReturn:true },
    report: null,
    over: false, overReason: null,
    tutorialStep: 0,
  };
  S.dayStats = freshDayStats();
  buildCandidates(S);
  S.forecast = forecastFor(S);
  pushLog(S, `Открытие ПВЗ «${brandOf(S).name}» — ${prem.name}. В кассе ${fmt(S.money)} ₽.`, 'info');
  return S;
}

function freshDayStats(){
  return {
    revenue:0, tips:0, fines:0, issued:0, missed:0, consults:0,
    slaSum:0, arrivals:0, accepted:0, payroll:0, rent:0, util:0, tax:0, loan:0, net:0,
    peakQueue:0, mistakes:0, tryon:0, events:0,
    returned:0, packed:0, shipped:0, retFines:0, repairs:0,
  };
}

export function fmt(n){ return Math.round(n).toLocaleString('ru-RU'); }

export function pushLog(S, text, type='info'){
  S.log.unshift({ text, type, day:S.day, t:S.minutes });
  if (S.log.length > 80) S.log.pop();
}

/* ---------------- магазин / люди ---------------- */
/* ---------------- поломки техники ---------------- */
const FRAGILE_TECH = ['scanner','printer','terminal','coffee'];

export function brokenItems(S){
  return Object.keys(S.broken || {}).filter(id => S.broken[id] && S.owned[id]);
}
export function repairCost(S, id){
  const it = ITEMS[id];
  return it ? Math.round(it.cost * 0.3 / 50) * 50 : 0;
}
export function repair(S, id){
  if (!S.broken[id]) return { ok:false, msg:'Не сломано' };
  const cost = repairCost(S, id);
  if (S.money < cost) return { ok:false, msg:`Нужно ${fmt(cost)} ₽` };
  S.money -= cost;
  delete S.broken[id];
  S.dayStats.repairs += cost;
  pushLog(S, `${ITEMS[id].name} отремонтирован за ${fmt(cost)} ₽.`, 'good');
  return { ok:true, cost };
}
function rollBreakdowns(S){
  S.broken = S.broken || {};
  const candidates = FRAGILE_TECH.filter(id => S.owned[id] && !S.broken[id]);
  if (!candidates.length) return;
  if (!chance(S, CFG.BREAK_CHANCE)) return;
  const id = pick(S, candidates);
  S.broken[id] = true;
  pushLog(S, `Сломалась техника: ${ITEMS[id].name}. Работает хуже — почините в «Складе».`, 'bad');
}

export function itemLocked(S, id){
  const it = ITEMS[id];
  if (!it) return true;
  if (it.lvl > S.lvl) return true;
  if (it.once && S.owned[id]) return true;
  return false;
}

export function canBuy(S, id){
  const it = ITEMS[id];
  if (!it || itemLocked(S, id)) return false;
  if (S.money < it.cost) return false;
  if (it.physical && S.unplaced.length > 6) return false;   // сначала расставьте купленное
  return true;
}

export function buy(S, id){
  if (S.phase !== 'plan') return { ok:false, msg:'Закупки — только в фазе планирования' };
  if (!canBuy(S, id)){
    const it = ITEMS[id];
    if (S.money < it.cost) return { ok:false, msg:'Не хватает денег' };
    if (it.physical && S.unplaced.length > 6) return { ok:false, msg:'Сначала расставьте купленное на плане' };
    return { ok:false, msg:'Недоступно' };
  }
  const it = ITEMS[id];
  S.money -= it.cost;
  S.owned[id] = (S.owned[id] || 0) + 1;
  if (it.physical) S.unplaced.push(id);
  pushLog(S, `Куплено: ${it.name} (−${fmt(it.cost)} ₽)${it.physical ? ' — расставьте на плане' : ''}`, 'buy');
  recalcForecast(S);
  return { ok:true };
}

/* ---------------- смены ---------------- */
export const SHIFTS = {
  full: { name:'Полный день', short:'09–21', pay:1.00 },
  am:   { name:'Утро',        short:'09–15', pay:0.62 },
  pm:   { name:'Вечер',       short:'15–21', pay:0.62 },
};
export function shiftPay(shift){ return (SHIFTS[shift] || SHIFTS.full).pay; }
export function onShiftNow(S, st){
  const sh = st.shift || 'full';
  if (sh === 'full') return true;
  if (sh === 'am') return S.minutes < 360;
  if (sh === 'pm') return S.minutes >= 360;
  return true;
}
export function setShift(S, id, shift){
  const st = S.staff.find(x => x.id === id);
  if (!st || !SHIFTS[shift]) return { ok:false };
  st.shift = shift;
  st.onShift = onShiftNow(S, st);
  return { ok:true };
}
export function shiftSalary(st){ return Math.round(st.salary * shiftPay(st.shift)); }

export function hireCost(S, role){
  const r = ROLES[role];
  return (r.onboard || 0) + r.salary * CFG.PREPAY_DAYS;
}
export function hireBreakdown(S, role){
  const r = ROLES[role];
  return { onboard: r.onboard || 0, advance: r.salary * CFG.PREPAY_DAYS, total: hireCost(S, role), days: CFG.PREPAY_DAYS };
}

export function canHire(S, role){
  if (S.phase !== 'plan') return { ok:false, msg:'Найм — только в фазе планирования' };
  const r = ROLES[role];
  const have = S.staff.filter(s => s.role === role).length;
  if (have >= r.max) return { ok:false, msg:`Максимум ${r.max} на этой роли` };
  if (r.lvl > S.lvl) return { ok:false, msg:`Откроется на уровне ${r.lvl}` };
  const cost = hireCost(S, role);
  if (S.money < cost) return { ok:false, msg:`Нужно ${fmt(cost)} ₽: оформление ${fmt(r.onboard)} + аванс ${fmt(r.salary * CFG.PREPAY_DAYS)} за ${CFG.PREPAY_DAYS} дн.` };
  return { ok:true };
}

export function hire(S, role){
  const c = canHire(S, role);
  if (!c.ok) return c;
  if (!S.candidates.length) buildCandidates(S);
  const cand = S.candidates.find(c2 => c2.role === role) || makeCandidate(S, role);
  const cost = hireCost(S, role);
  S.money -= cost;
  S.candidates = S.candidates.filter(c2 => c2.id !== cand.id);
  S.staff.push({ ...cand, id:'e'+(S.aid++), mood:70, fatigue:0, task:null, shift:'full', onShift:true, daysWorked:0, prepay: CFG.PREPAY_DAYS });
  pushLog(S, `Нанят ${ROLES[role].name}: ${cand.name} (${cand.traitName}). Оформление и аванс: −${fmt(cost)} ₽`, 'hire');
  buildCandidates(S);
  return { ok:true };
}

export function fire(S, id){
  if (S.phase !== 'plan') return { ok:false, msg:'Увольнять — только в фазе планирования' };
  const st = S.staff.find(s => s.id === id);
  if (!st) return { ok:false, msg:'Нет такого сотрудника' };
  S.staff = S.staff.filter(s => s.id !== id);
  S.nps = clamp(S.nps - 0.02, 0, 5);
  const lost = (st.prepay || 0) * st.salary;
  pushLog(S, `Уволен ${st.name}.${lost > 0 ? ` Неотработанный аванс ${fmt(lost)} ₽ не возвращается.` : ''} Команда нервничает.`, 'bad');
  return { ok:true };
}

function makeCandidate(S, role){
  const tr = pick(S, TRAITS);
  const base = { seller:{sp:5,ac:5,sv:6}, loader:{sp:6,ac:5,sv:3}, manager:{sp:6,ac:6,sv:7} }[role];
  const salary = ROLES[role].salary + (tr.salary || 0) + ri(S,-150,300);
  return {
    id:'c'+(S.aid++), role,
    name: pick(S, NAMES),
    sp: clamp(base.sp + ri(S,-2,2), 1, 10),
    ac: clamp(base.ac + ri(S,-2,2), 1, 10),
    sv: clamp(base.sv + ri(S,-2,2), 1, 10),
    trait: tr.id, traitName: tr.name, traitDesc: tr.desc,
    salary: Math.max(700, Math.round(salary / 50) * 50),
    mood: 70,
  };
}

function buildCandidates(S){
  const need = [];
  for (const role in ROLES){
    const have = S.staff.filter(s => s.role === role).length;
    const want = role === 'manager' ? 1 : 2;
    for (let i = 0; i < Math.max(0, want - have); i++) need.push(role);
  }
  S.candidates = need.map(r => makeCandidate(S, r));
  // перемешаем, чтобы не было сгруппировано
  S.candidates.sort((a,b) => (a.name > b.name ? 1 : -1));
}

/* ---------------- спрос и прогноз ---------------- */
const HOUR_W = [0.6, 0.8, 1.1, 1.5, 1.3, 0.9, 0.8, 1.0, 1.45, 1.6, 1.2, 0.7]; // 09..20

function npsFactor(S){ return 0.65 + clamp(S.nps,0,5) / 5 * 0.70; }

export function dayDemand(S){
  const p = premOf(S), b = brandOf(S);
  const dow = (S.day - 1) % 7;
  const dowF = [1.0, 0.95, 0.95, 1.0, 1.1, 1.25, 0.85][dow];  // пн..вс
  const growth = 1 + Math.min(0.45, (S.day - 1) * 0.025);
  let d = 26 * p.traffic * b.traffic * npsFactor(S) * dowF * growth;
  if (S.owned.coffee && !(S.broken && S.broken.coffee)) d *= ITEMS.coffee.traffic;
  return d;
}

export function recalcForecast(S){ S.forecast = forecastFor(S); }

export function forecastFor(S){
  const base = dayDemand(S);
  const sumW = HOUR_W.reduce((a,b)=>a+b,0);
  return HOUR_W.map((w,h) => {
    const exp = base * w / sumW;
    return { hour: CFG.START_HOUR + h, exp };
  });
}

/* ---------------- день ---------------- */
export function expirePackages(S){
  let n = 0, fee = 0;
  for (const sh of S.shelves){
    for (let i=0;i<sh.cells.length;i++){
      const p = sh.cells[i];
      if (p && p.slaDay <= S.day){
        sh.cells[i] = null; n++;
        fee += 30;
      }
    }
  }
  // просроченное в приёмке тоже уходит
  const before = S.receiving.length;
  S.receiving = S.receiving.filter(p => p.slaDay > S.day);
  n += before - S.receiving.length;
  if (n){
    S.money += fee;
    pushLog(S, `${n} посылок с истёкшим сроком хранения отправлены назад. +${fmt(fee)} ₽ за обработку.`, 'warn');
  }
  return n;
}

export function layoutProblems(S){
  const out = [];
  if (!S.fixtures.some(f => f.itemId === 'counter')) out.push('Не поставлена стойка выдачи');
  if (!S.shelves.length) out.push('Нет ни одного стеллажа');
  if (S.unplaced.length) out.push(`Не расставлено предметов: ${S.unplaced.length}`);
  return out;
}

export function startDay(S){
  if (S.phase !== 'plan') return;
  const probs = layoutProblems(S);
  if (probs.length) return { ok:false, msg:probs[0] };
  expirePackages(S);
  S.phase = 'day';
  S.minutes = 0;
  S.speed = 1;
  S.tiredUntil = 0;
  if (S.player){ S.player.busy = null; S.player.stand = null; }
  S.hands = null;
  S.fittingBusy = [];
  S.dayStats = freshDayStats();
  S.recalcDone = false;
  S.clients = [];
  S.receiving = S.receiving; // переносим
  S.trucks = [];
  S.event = null;

  // посылок не меньше, чем клиентов: клиент приходит только под свою посылку
  const total = Math.max(9, Math.round(dayDemand(S)));
  const parts = [0.6, 0.4];
  const times = [25, 390];
  parts.forEach((pct, i) => {
    S.trucks.push({
      arriveAt: times[i],
      boxes: Math.max(2, Math.round(total * pct)),
      left: Math.max(2, Math.round(total * pct)),
      waitLeft: 300,
      arrived: false,
    });
  });

  S.staff.forEach(st => { st.task = null; st.shift = st.shift || 'full'; st.onShift = onShiftNow(S, st); st.fatigue = Math.max(0, st.fatigue - 20); });
  S.forecast = forecastFor(S);
  rollBreakdowns(S);
  pushLog(S, `День ${S.day}: открываемся. Прогноз ${Math.round(dayDemand(S))} клиентов.`, 'info');
  scheduleEvents(S);
}

function scheduleEvents(S){
  // 1-2 события за день в случайные моменты
  const n = chance(S, 0.55) ? 2 : 1;
  const times = [];
  for (let i=0;i<n;i++) times.push(ri(S, 60, 640));
  S.eventQueue = times.sort((a,b)=>a-b).map(t => ({ at:t, fired:false }));
}

export function stepMinute(S){
  if (S.phase !== 'day' || S.event || S.evRes || S.over) return;
  S.minutes++;

  // задача игрока
  if (S.player && S.player.busy){
    S.player.busy.t--;
    if (S.player.busy.t <= 0) completePlayerTask(S);
  }

  // события
  if (S.eventQueue){
    for (const ev of S.eventQueue){
      if (!ev.fired && S.minutes >= ev.at){ ev.fired = true; triggerEvent(S); break; }
    }
  }

  // поставки
  for (const tr of S.trucks){
    if (!tr.arrived && S.minutes >= tr.arriveAt){
      tr.arrived = true;
      // машина ждёт и не выбрасывает посылки: сколько влезает — принимайте,
      // остальное уедет только если простой до конца стоянки
      const room = Math.max(0, capacity(S).free - S.receiving.length);
      if (tr.left > 0){
        pushLog(S, room > 0
          ? `Пришла машина: ${tr.left} посылок. Принимайте!`
          : `Машина пришла, но зона приёмки занята — освободите место.`, room > 0 ? 'truck' : 'bad');
      }
    }
    if (tr.arrived && tr.left > 0){
      tr.waitLeft--;
      if (tr.waitLeft <= 0){
        if (tr.left > 0){
          const pen = fine(S, 300 + tr.left * 50);
          S.nps = clamp(S.nps - 0.03, 0, 5);
          S.dayStats.fines += pen;
          pushLog(S, `Машина уехала. ${tr.left} посылок не принято — штраф ${fmt(pen)} ₽.`, 'bad');
          tr.left = 0;
        }
      }
    }
  }

  // машина за возвратами
  if (S.minutes === CFG.RET_HOUR_MIN && S.returns.length) shipReturns(S, true);

  // смены: часть команды приходит/уходит по расписанию
  for (const st of S.staff){
    const now = onShiftNow(S, st);
    if (now !== st.onShift){
      if (!now && st.task){ st.task = null; }
      st.onShift = now;
      pushLog(S, now ? `${st.name} начал(а) смену` : `${st.name} ушёл(ла) со смены`, 'info');
    }
  }

  // клиенты
  const hour = Math.floor(S.minutes / 60);
  const hw = HOUR_W[Math.min(11, Math.max(0, hour))];
  const sumW = HOUR_W.reduce((a,b)=>a+b,0);
  const perMinute = (dayDemand(S) * hw / sumW) / 60;
  if (chance(S, perMinute)) spawnClient(S);

  // терпение
  for (const c of S.clients) c.patience--;
  const gone = S.clients.filter(c => c.patience <= 0);
  if (gone.length){
    for (const c of gone){
      // возврат и консультация — не «упущенный заказ», только лёгкий минус к NPS
      const soft = c.consult || c.returnItem;
      S.nps = clamp(S.nps - (soft ? 0.008 : 0.04), 0, 5);
      if (!soft){ S.dayStats.missed++; S.kpiWeek.missed++; }
      pushLog(S, c.consult ? `Клиент ушёл, не дождавшись консультации.`
               : c.returnItem ? `Клиент с возвратом ${c.returnCode} ушёл.`
               : `Клиент ушёл без заказа ${c.code}.`, 'bad');
    }
    S.clients = S.clients.filter(c => c.patience > 0);
  }
  S.dayStats.peakQueue = Math.max(S.dayStats.peakQueue, S.clients.length);

  if (S.fittingBusy && S.fittingBusy.length) S.fittingBusy = S.fittingBusy.filter(b => b.until > S.minutes);

  // усталость команды
  for (const st of S.staff){
    st.fatigue = Math.min(100, st.fatigue + 0.12);
    st.mood = clamp(st.mood - 0.03 + (S.owned.ac ? 0.01 : 0), 0, 100);
    staffTick(S, st);
  }

  // усталость директора
  if (S.minutes % 30 === 0) S.fatigue = Math.min(100, S.fatigue + 0.4 * (S.owned.coffee ? 0.7 : 1));

  if (S.minutes >= CFG.DAY_MIN) endDay(S);
}

function spawnClient(S){
  const busy = new Set(S.clients.map(c => c.code).filter(Boolean));
  const available = storedPackages(S).filter(p => !busy.has(p.code));
  const patienceMax = CFG.PATIENCE_BASE * patienceMult(S) * rr(S, 0.85, 1.15);

  // возврат: клиент принёс посылку назад — отдельная работа, не требует места на полке
  if (chance(S, 0.09) && S.returns.length + S.clients.filter(c => c.returnItem).length < CFG.RET_CAP){
    S.dayStats.arrivals++;
    S.kpiWeek.arrivals++;
    S.clients.push({
      id: 'cl' + (S.aid++), code: null, consult:false, returnItem:true, returnCode: codeGen(S),
      type:'normal', tryon:false, patience: patienceMax * 1.35, maxPatience: patienceMax * 1.35,
      arrivedAt: S.minutes,
    });
    return;
  }

  // вопрос в зале — редко и только когда есть чем заняться
  if (available.length && chance(S, 0.05) && !S.clients.some(c => c.consult)){
    S.dayStats.arrivals++;
    S.kpiWeek.arrivals++;
    S.clients.push({
      id: 'cl' + (S.aid++), code: null, consult:true, type:'consult',
      patience: patienceMax, maxPatience: patienceMax, arrivedAt: S.minutes,
    });
    return;
  }

  // клиент приходит только под свою посылку: нет посылок — нет клиента
  if (!available.length) return;

  S.dayStats.arrivals++;
  S.kpiWeek.arrivals++;
  {
    const pkg = available[ri(S, 0, available.length - 1)];
    const r = rnd(S);
    let type = 'normal';
    if (r > 0.94){ type = 'scandal'; }
    else if (r > 0.78){ type = 'hurry'; }
    S.clients.push({
      id: 'cl' + (S.aid++), code: pkg.code, consult:false, type, tryon: !!pkg.tryon,
      patience: patienceMax * (type === 'hurry' ? 0.6 : type === 'scandal' ? 0.8 : 1),
      maxPatience: patienceMax * (type === 'hurry' ? 0.6 : type === 'scandal' ? 0.8 : 1),
      arrivedAt: S.minutes,
    });
  }
}

function patienceMult(S){
  let m = 1;
  if (S.owned.sofa)  m *= ITEMS.sofa.patience;
  if (S.owned.ac)    m *= ITEMS.ac.patience;
  if (S.owned.music) m *= ITEMS.music.patience;
  return m;
}

/* ---------------- персонал: ИИ ---------------- */
function staffSpeedMult(S){
  const st = S.staff.find(s => s.role === 'manager' && s.onShift);
  return st ? 1.25 : 1;
}

export function searchMinutes(S, st, cellKind){
  const wrong = cellKind && cellKind === 'std';
  let t = CFG.SEARCH_BASE;
  if (S.owned.scanner) t += ITEMS.scanner.search;
  if (S.owned.printer) t += ITEMS.printer.search;
  if (!S.owned.counter) t += 15;
  const skill = st ? (st.sp / 10) : 0.72;
  t = t * (1.35 - skill * 0.55);
  const tr = st && TRAITS.find(x => x.id === st.trait);
  if (tr && tr.speed) t /= tr.speed;
  t /= staffSpeedMult(S);
  if (wrong) t += 6;
  return Math.max(4, Math.round(t * 10) / 10);
}

function staffTick(S, st){
  if (!st.onShift) return;
  if (st.task){
    st.task.t--;
    if (st.task.t <= 0) finishTask(S, st);
    return;
  }
  assignTask(S, st);
}

function assignTask(S, st){
  const busyClients = new Set(S.staff.map(s => s.task && s.task.kind === 'serve' ? s.task.clientId : null).filter(Boolean));
  const busyCells = new Set(S.staff.map(s => s.task && s.task.kind === 'place' ? s.task.pkgId : null).filter(Boolean));

  if (st.role === 'seller'){
    const target = S.clients
      .filter(c => !c.consult && !busyClients.has(c.id))
      .map(c => { const cell = findCellByCode(S, c.code); return cell ? Object.assign({}, c, {_shelfId: cell.shelfId, _cellIdx: cell.cellIdx}) : null; })
      .filter(Boolean)
      .sort((a,b) => a.patience - b.patience)[0];
    if (target){
      const sh = S.shelves.find(x => x.id === target._shelfId);
      const k = sh ? sh.kind : 'std';
      const dur = searchMinutes(S, st, k);
      st.task = { kind:'serve', clientId:target.id, shelfId:target._shelfId, cellIdx:target._cellIdx, t:dur, total:dur };
      return;
    }
  }
  if (st.role === 'loader'){
    const pkg = S.receiving.find(p => !busyCells.has(p.id));
    if (pkg && freeCellFor(S, pkg)){
      const cell = freeCellFor(S, pkg);
      const dur = Math.max(2, 4 - st.sp * 0.2);
      st.task = { kind:'place', pkgId:pkg.id, cell:{ shelfId:cell.shelf.id, idx:cell.idx }, t:dur, total:dur };
      return;
    }
    const tr = S.trucks.find(t => t.arrived && t.left > 0);
    if (tr && S.receiving.length < CFG.RECV_MAX && capacity(S).free > S.receiving.length){
      const durA = Math.max(1.5, 3 - st.sp * 0.15);
      st.task = { kind:'accept', truckId: tr.arriveAt, t:durA, total:durA };
    }
  }
}

function finishTask(S, st){
  const task = st.task; st.task = null;
  if (!task) return;
  if (task.kind === 'serve'){
    const c = S.clients.find(x => x.id === task.clientId);
    if (!c) return;
    const cell = findCellByCode(S, c.code);
    if (!cell) return;
    const sh = S.shelves.find(x => x.id === cell.shelfId);
    if (!sh || !sh.cells[cell.cellIdx]) return;
    const pkg = sh.cells[cell.cellIdx];
    sh.cells[cell.cellIdx] = null;
    issueInternal(S, c, pkg, st);
  }
  if (task.kind === 'place'){
    const pkg = S.receiving.find(p => p.id === task.pkgId);
    if (!pkg) return;
    const target = freeCellFor(S, pkg);
    if (!target) return;
    takeFromReceiving(S, pkg);
    target.shelf.cells[target.idx] = pkg;
    st.mood = clamp(st.mood + 0.05, 0, 100);
  }
  if (task.kind === 'accept'){
    acceptBox(S, true);
  }
}

function freeCellFor(S, pkg){
  const zone = zoneOf(pkg);
  let best = null;
  for (const sh of S.shelves){
    if (sh.kind !== zone) continue;
    for (let i=0;i<sh.cells.length;i++){
      if (!sh.cells[i]){ best = { shelf:sh, idx:i }; break; }
    }
    if (best) break;
  }
  return best;
}

/* ---------------- действия игрока ---------------- */
export function acceptBox(S, silent){
  if (S.phase !== 'day') return { ok:false, msg:'Сейчас не рабочий день' };
  const tr = S.trucks.find(t => t.arrived && t.left > 0);
  if (!tr) return { ok:false, msg:'Машины нет' };
  if (S.receiving.length >= CFG.RECV_MAX) return { ok:false, msg:'Зона приёмки переполнена' };
  if (capacity(S).free <= S.receiving.length) return { ok:false, msg:'Нет свободных ячеек на полках' };
  if (tired(S)) return { ok:false, msg:'Вы вымотаны — нужна пауза' };
  if (S.player.busy) return { ok:false, msg:'Вы обслуживаете клиента — сначала закончите' };

  const pkg = makePackage(S);
  S.receiving.push(pkg);
  tr.left--;
  S.dayStats.accepted++;
  spendFatigue(S, 0.8);
  if (!silent) pushLog(S, `Принята посылка ${pkg.code} (${pkg.size}${pkg.fragile?', хрупкое':''})`, 'accept');
  return { ok:true };
}

function makePackage(S){
  const r = rnd(S);
  let size = 'M', fragile = false;
  if (r > 0.965) size = 'XL';
  else if (r > 0.86) size = 'L';
  else if (r > 0.62) size = 'S';
  fragile = chance(S, 0.07);
  return {
    id: 'p' + (S.aid++),
    code: codeGen(S),
    size, fragile,
    tryon: size !== 'XL' && chance(S, 0.25),
    slaDay: S.day + ri(S, 3, 7),
    day: S.day,
  };
}

function codeGen(S){
  const letters = 'АБВГДКМНПРСТЗ';
  const used = new Set(storedPackages(S).map(p => p.code).concat(S.receiving.map(p => p.code)));
  for (let i=0;i<500;i++){
    const c = letters[ri(S,0,letters.length-1)] + '-' + ri(S,1000,9999);
    if (!used.has(c)) return c;
  }
  return 'Я-' + (S.aid++);
}

function takeFromReceiving(S, pkg){
  S.receiving = S.receiving.filter(p => p.id !== pkg.id);
}

export function placeBox(S, pkgId, shelfId, cellIdx){
  if (S.phase !== 'day') return { ok:false };
  if (tired(S)) return { ok:false, msg:'Вы вымотаны' };
  if (S.player.busy) return { ok:false, msg:'Вы обслуживаете клиента' };
  const pkg = S.receiving.find(p => p.id === pkgId);
  if (!pkg) return { ok:false, msg:'Посылки нет в приёмке' };
  const sh = S.shelves.find(s => s.id === shelfId);
  if (!sh) return { ok:false };
  const need = zoneOf(pkg);
  if (sh.kind !== need && sh.kind !== 'std') return { ok:false, msg:`Нужна зона «${ZONE_LABEL[need]}» или обычный стеллаж` };
  if (sh.cells[cellIdx]) return { ok:false, msg:'Ячейка занята' };
  takeFromReceiving(S, pkg);
  sh.cells[cellIdx] = pkg;
  spendFatigue(S, 0.8);
  return { ok:true };
}

export function sleepTired(S){ /* noop */ }

function tired(S){ return S.minutes < (S.tiredUntil || 0); }

function spendFatigue(S, n){
  S.fatigue = Math.min(100, S.fatigue + n * (S.owned.coffee ? 0.7 : 1));
  if (S.fatigue >= 95){
    S.tiredUntil = S.minutes + 25;
    S.fatigue = 60;
    pushLog(S, 'Вы вымотаны. Присядьте на 25 минут — без вас никто не обслуживает клиентов.', 'bad');
  }
}

/* ---------- адреса ячеек ---------- */
const SHELF_LETTERS = ['А','Б','В','Г','Д','Е','Ж','З'];

export function shelfName(S, shelfId){
  const i = S.shelves.findIndex(s => s.id === shelfId);
  return 'Стеллаж ' + (SHELF_LETTERS[i] || '?');
}
export function cellAddress(S, shelfId, cellIdx){
  return shelfName(S, shelfId) + ' · ячейка ' + (cellIdx + 1);
}
export function clientLocation(S, clientId){
  const c = S.clients.find(x => x.id === clientId);
  if (!c || !c.code) return null;
  const cell = findCellByCode(S, c.code);
  if (!cell) return null;
  return {
    shelfId: cell.shelfId, cellIdx: cell.cellIdx, pkg: cell.pkg,
    address: cellAddress(S, cell.shelfId, cell.cellIdx),
  };
}

/* время дойти до стеллажа зависит от того, насколько он далеко от стойки */
export function fetchMinutes(S, shelfId){
  const d = shelfDistance(S, shelfId);
  let t = (d >= 99) ? 12 : 2 + d * 0.45;
  if (S.owned.scanner) t -= 1;
  if (S.broken && S.broken.scanner) t += 2.5;      // сломанный сканер — ищите глазами
  if (S.fatigue > CFG.DIRTY_TIRED) t += 2;
  t /= staffSpeedMult(S);
  return Math.max(2, Math.round(t));
}
export const HANDOVER_MIN = 2;

/* шаг 1: пошли за посылкой */
export function startFetch(S, clientId){
  if (S.phase !== 'day') return { ok:false };
  if (tired(S)) return { ok:false, msg:'Вы вымотаны — отдышитесь' };
  if (S.hands) return { ok:false, msg:'Сначала отдайте посылку клиенту' };
  if (S.player.busy) return { ok:false, msg:'Вы уже в пути' };
  const loc = clientLocation(S, clientId);
  if (!loc) return { ok:false, msg:'Этой посылки нет на полке' };
  const t = fetchMinutes(S, loc.shelfId);
  S.player.busy = { kind:'fetch', clientId, shelfId:loc.shelfId, cellIdx:loc.cellIdx, t, total:t };
  return { ok:true, minutes:t, address:loc.address, started:true };
}

/* шаг 2: отдать клиенту */
export function giveToClient(S, clientId, withPack){
  if (S.phase !== 'day') return { ok:false };
  if (!S.hands) return { ok:false, msg:'В руках нет посылки' };
  if (S.player.busy) return { ok:false, msg:'Вы уже в пути' };
  if (tired(S)) return { ok:false, msg:'Вы вымотаны' };
  const c = S.clients.find(x => x.id === clientId);
  if (!c){
    returnToShelf(S, S.hands);
    S.hands = null;
    return { ok:false, msg:'Клиент ушёл — посылка вернулась на полку' };
  }
  const pack = !!withPack && canPack(S);
  const t = HANDOVER_MIN + (pack ? 1 : 0);
  S.player.busy = { kind:'handover', clientId, t, total:t, pack };
  return { ok:true, minutes:t, started:true };
}

/* ---------------- возвраты ---------------- */
export function returnMinutes(S){
  let t = 2;
  if (S.owned.printer && !S.broken.printer) t -= 1;
  return Math.max(1, t);
}
export function takeReturn(S, clientId){
  if (S.phase !== 'day') return { ok:false };
  if (S.player.busy) return { ok:false, msg:'Вы уже заняты' };
  if (tired(S)) return { ok:false, msg:'Вы вымотаны' };
  const c = S.clients.find(x => x.id === clientId);
  if (!c || !c.returnItem) return { ok:false, msg:'Это не возврат' };
  if (S.returns.length >= CFG.RET_CAP) return { ok:false, msg:`Стойка возвратов занята (${CFG.RET_CAP})` };
  const t = returnMinutes(S);
  S.player.busy = { kind:'ret', clientId, t, total:t };
  return { ok:true, minutes:t };
}
function finishReturn(S, busy){
  const c = S.clients.find(x => x.id === busy.clientId);
  S.clients = S.clients.filter(x => x.id !== busy.clientId);
  S.returns.push({ id:'r'+(S.aid++), code: c ? c.returnCode : codeGen(S), from: c ? c.code || 'клиент' : 'клиент', at:S.minutes });
  S.dayStats.returned++;
  S.nps = clamp(S.nps + 0.015, 0, 5);
  addXp(S, 6);
  pushLog(S, `Принят возврат ${S.returns[S.returns.length-1].code}. Машина заберёт в 19:00.`, 'good');
}

export function shipReturns(S, force){
  if (!S.returns.length) return { ok:false, msg:'Возвратов нет' };
  if (!force && S.minutes < CFG.RET_HOUR_MIN) return { ok:false, msg:'Машина за возвратами приезжает в 19:00' };
  const n = S.returns.length;
  const fee = n * CFG.RET_SHIP_FEE;
  S.money += fee;
  S.dayStats.revenue += fee;
  S.dayStats.shipped += n;
  S.returns = [];
  pushLog(S, `Возвраты отправлены: ${n} шт. +${fmt(fee)} ₽ за обработку.`, 'good');
  return { ok:true, n, fee };
}

function packOrder(S, pkg){
  S.money += CFG.PACK_PRICE;
  S.dayStats.revenue += CFG.PACK_PRICE;
  S.dayStats.packed++;
  S.nps = clamp(S.nps + 0.01, 0, 5);
  addXp(S, 3);
  pushLog(S, `Упаковали ${pkg.code}: +${CFG.PACK_PRICE} ₽ за услугу.`, 'good');
}

/* упаковка заказа: платная услуга при выдаче (нужен принтер) */
export function canPack(S){ return !!S.owned.printer && !S.broken.printer; }

export function returnHands(S){
  if (!S.hands) return { ok:false, msg:'Руки пусты' };
  if (S.player.busy) return { ok:false, msg:'Сначала закончите' };
  returnToShelf(S, S.hands);
  S.hands = null;
  return { ok:true };
}

function returnToShelf(S, pkg){
  for (const sh of S.shelves){
    if (sh.kind !== zoneOf(pkg) && sh.kind !== 'std') continue;
    const idx = sh.cells.indexOf(null);
    if (idx >= 0){ sh.cells[idx] = pkg; return true; }
  }
  if (S.receiving.length < CFG.RECV_MAX){ S.receiving.push(pkg); return true; }
  return false;
}

function issueInternal(S, c, pkg, st){
  const sumSla = S.minutes - c.arrivedAt;
  S.dayStats.issued++;
  S.dayStats.slaSum += sumSla;
  S.kpiWeek.issued++;
  S.kpiWeek.slaSum += sumSla;

  const pay = CFG.PAY_BASE * payoutMult(S, pkg);
  let tip = 0;
  if (c.type === 'hurry') tip = 70 * (c.patience / c.maxPatience);
  else tip = 50 * (c.patience / c.maxPatience);
  if (c.type === 'scandal'){
    const mgr = S.staff.find(s => s.role === 'manager' && s.onShift);
    if (!mgr){ S.nps = clamp(S.nps - 0.02, 0, 5); tip = 0; }
  }
  const reward = Math.round(pay + tip);
  S.money += reward;
  S.dayStats.revenue += Math.round(pay);
  S.dayStats.tips += Math.round(tip);

  S.nps = clamp(S.nps + metricNpsDelta(S, sumSla, c), 0, 5);
  addXp(S, 12);

  if (pkg.tryon) handleFitting(S, c, pay, st);

  S.clients = S.clients.filter(x => x.id !== c.id);
  if (st) st.mood = clamp(st.mood + 0.1, 0, 100);
  if (!st) pushLog(S, `Выдан ${pkg.code} за ${Math.round(sumSla)} мин. +${fmt(reward)} ₽`, 'good');
}

/* примерочная: одежду хотят примерить */
function handleFitting(S, c, pay, st){
  const rooms = S.fixtures.filter(f => f.itemId === 'fitting').length;
  const busy = S.fittingBusy.filter(b => b.until > S.minutes).length;
  if (rooms > busy){
    S.fittingBusy.push({ until: S.minutes + 20 });
    S.money += 40;
    S.dayStats.revenue += 40;
    S.dayStats.tryon++;
    S.nps = clamp(S.nps + 0.008, 0, 5);
    if (!st) pushLog(S, 'Клиент ушёл в примерочную (+40 ₽ за услугу)', 'good');
    return;
  }
  S.nps = clamp(S.nps - 0.005, 0, 5);
  if (chance(S, 0.08)){
    const back = Math.round(pay * 0.5);
    S.money -= back;
    S.dayStats.fines += back;
    pushLog(S, `Негде примерить — клиент вернул заказ. −${fmt(back)} ₽`, 'bad');
  } else if (!st){
    pushLog(S, 'Примерить негде — клиент недоволен.', 'warn');
  }
}

function metricNpsDelta(S, sla, c){
  const target = contractOf(S).sla;
  let d = sla <= target * 0.6 ? 0.008 : sla <= target ? 0.003 : sla <= target * 1.6 ? -0.008 : -0.025;
  if (c.type === 'scandal') d -= 0.01;
  return d;
}

export function consult(S, clientId){
  if (tired(S)) return { ok:false, msg:'Вы вымотаны' };
  if (S.player.busy) return { ok:false, msg:'Вы обслуживаете клиента' };
  const c = S.clients.find(x => x.id === clientId);
  if (!c || !c.consult) return { ok:false };
  S.clients = S.clients.filter(x => x.id !== c.id);
  S.money += 25;
  S.dayStats.revenue += 25;
  S.dayStats.consults++;
  S.nps = clamp(S.nps + 0.004, 0, 5);
  spendFatigue(S, 1);
  return { ok:true };
}

export function playerServiceMinutes(S, cellKind){
  let t = 10;
  if (S.owned.counter) t -= 2;
  if (S.owned.scanner) t -= 2;
  if (S.owned.printer) t -= 1;
  if (cellKind === 'std') t += 5;
  if (S.fatigue > CFG.DIRTY_TIRED) t += 3;
  t /= staffSpeedMult(S);
  return Math.max(4, Math.round(t));
}

export function cancelService(S){
  if (!S.player.busy) return { ok:false };
  const c = S.clients.find(x => x.id === S.player.busy.clientId);
  S.player.busy = null;
  if (c) pushLog(S, `Вы прервали обслуживание ${c.code} — клиент ждёт дальше.`, 'warn');
  return { ok:true };
}

function completePlayerTask(S){
  const b = S.player.busy;
  S.player.busy = null;
  if (!b) return;

  if (b.kind === 'fetch'){
    const c = S.clients.find(x => x.id === b.clientId);
    const sh = S.shelves.find(x => x.id === b.shelfId);
    if (!sh || !sh.cells[b.cellIdx]) return;
    const pkg = sh.cells[b.cellIdx];
    if (!c || pkg.code !== c.code) return;
    if (zoneOf(pkg) !== 'std' && sh.kind === 'std' && chance(S, 0.10)){
      const f = fine(S, 700);
      S.dayStats.fines += f;
      S.nps = clamp(S.nps - 0.05, 0, 5);
      sh.cells[b.cellIdx] = null;
      pushLog(S, `По дороге разбилась посылка ${pkg.code}: лежала в общей зоне. −${fmt(f)} ₽`, 'bad');
      return;
    }
    const addr = cellAddress(S, b.shelfId, b.cellIdx);
    sh.cells[b.cellIdx] = null;
    S.hands = pkg;
    const fx = S.fixtures.find(f => f.shelfId === b.shelfId);
    if (fx) S.player.stand = [fx.x + (b.cellIdx % fx.w), fx.y + Math.floor(b.cellIdx / fx.w)];
    spendFatigue(S, 1);
    pushLog(S, `Взяли ${pkg.code} — ${addr}. Несите клиенту.`, 'info');
    return;
  }

  if (b.kind === 'ret'){ finishReturn(S, b); return; }

  if (b.kind === 'handover'){
    const pkg = S.hands;
    S.hands = null;
    S.player.stand = null;
    const c = S.clients.find(x => x.id === b.clientId);
    if (!c){ if (pkg) returnToShelf(S, pkg); return; }
    spendFatigue(S, 1);
    if (b.pack) packOrder(S, pkg);
    issueInternal(S, c, pkg, null);
  }
}

export function payoutMult(S, pkg){
  const b = brandOf(S), p = premOf(S);
  let m = p.payout * b.payout * (0.70 + 0.30 * compliance(S));
  if (S.owned.terminal && !(S.broken && S.broken.terminal)) m *= ITEMS.terminal.pay;
  else if (S.broken && S.broken.terminal) m *= 0.94;   // без терминала часть оплат «мимо кассы»
  m *= 1 + (S.lvl - 1) * 0.05;
  m *= contractOf(S).pay;
  return m;
}

function fine(S, amount){
  return Math.round(amount * (S.owned.cam ? ITEMS.cam.fines : 1));
}

/* ---------------- планировка зала ---------------- */
export function fixtureAt(S, x, y){
  for (const f of S.fixtures) if (x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h) return f;
  return null;
}

export function canPlaceAt(S, w, h, x, y){
  if (x < 0 || y < 0 || x + w > S.grid.w || y + h > S.grid.h) return false;
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (fixtureAt(S, x + dx, y + dy)) return false;
  return true;
}

export function freeArea(S){
  let free = 0;
  for (let y = 0; y < S.grid.h; y++) for (let x = 0; x < S.grid.w; x++) if (!fixtureAt(S, x, y)) free++;
  return free;
}

export function placeFixture(S, itemId, x, y){
  if (S.phase !== 'plan') return { ok:false, msg:'Планировка доступна до начала дня' };
  const it = ITEMS[itemId];
  if (!it || !it.physical) return { ok:false, msg:'Этот предмет не ставится в зал' };
  const idx = S.unplaced.indexOf(itemId);
  if (idx < 0) return { ok:false, msg:'Нет свободного предмета — сначала купите' };
  const w = it.size.w, h = it.size.h;
  if (!canPlaceAt(S, w, h, x, y)) return { ok:false, msg:'Здесь не помещается' };

  const fid = 'f' + (S.aid++);
  const fx = { id:fid, itemId, x, y, w, h, shelfId:null };
  if (it.cap){
    const sh = { id:'sh' + (S.aid++), kind:it.zone, cap:it.cap, cells:new Array(it.cap).fill(null), fx:fid };
    S.shelves.push(sh);
    fx.shelfId = sh.id;
  }
  S.fixtures.push(fx);
  S.unplaced.splice(idx, 1);
  return { ok:true, id:fid };
}

export function canPlaceIgnoring(S, fx, w, h, x, y){
  if (x < 0 || y < 0 || x + w > S.grid.w || y + h > S.grid.h) return false;
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++){
    const f = fixtureAt(S, x + dx, y + dy);
    if (f && f.id !== fx.id) return false;
  }
  return true;
}

export function moveFixture(S, fid, x, y){
  if (S.phase !== 'plan') return { ok:false, msg:'Только до начала дня' };
  const fx = S.fixtures.find(f => f.id === fid);
  if (!fx) return { ok:false, msg:'Нет такого предмета' };
  if (!canPlaceIgnoring(S, fx, fx.w, fx.h, x, y)) return { ok:false, msg:'Здесь занято' };
  fx.x = x; fx.y = y;
  return { ok:true };
}

export function removeFixture(S, fid){
  if (S.phase !== 'plan') return { ok:false, msg:'Только до начала дня' };
  const fx = S.fixtures.find(f => f.id === fid);
  if (!fx) return { ok:false, msg:'Нет такого предмета' };
  if (fx.shelfId){
    const sh = S.shelves.find(x => x.id === fx.shelfId);
    if (sh && sh.cells.some(Boolean)) return { ok:false, msg:'На стеллаже есть посылки — сначала выдайте их' };
    S.shelves = S.shelves.filter(x => x.id !== fx.shelfId);
    if (S.owned[fx.itemId]) S.owned[fx.itemId]--;
  } else {
    if (S.owned[fx.itemId]) S.owned[fx.itemId]--;
  }
  S.fixtures = S.fixtures.filter(f => f.id !== fid);
  S.unplaced.push(fx.itemId);
  return { ok:true };
}

export function autoLayout(S){
  let placed = 0;
  for (const itemId of [...S.unplaced]){
    const it = ITEMS[itemId];
    let done = false;
    for (let y = 0; y < S.grid.h && !done; y++){
      for (let x = 0; x < S.grid.w && !done; x++){
        if (canPlaceAt(S, it.size.w, it.size.h, x, y)){
          if (placeFixture(S, itemId, x, y).ok){ placed++; done = true; }
        }
      }
    }
    if (!done) break;
  }
  return { ok:true, placed };
}

/* путь по проходам между двумя клетками (мебель непроходима, кроме старта и цели) */
export function gridPath(S, from, to){
  if (!from || !to) return [];
  const key = (x, y) => x + ':' + y;
  const blocked = (x, y) => {
    if (x < 0 || y < 0 || x >= S.grid.w || y >= S.grid.h) return true;
    if (x === to[0] && y === to[1]) return false;
    if (x === from[0] && y === from[1]) return false;
    return !!fixtureAt(S, x, y);
  };
  const prev = new Map([[key(from[0], from[1]), null]]);
  const q = [from];
  let head = 0, found = false;
  while (head < q.length){
    const [x, y] = q[head++];
    if (x === to[0] && y === to[1]){ found = true; break; }
    for (const [nx, ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
      const k = key(nx, ny);
      if (prev.has(k) || blocked(nx, ny)) continue;
      prev.set(k, [x, y]);
      q.push([nx, ny]);
    }
  }
  if (!found) return [from, to];
  const out = [];
  let cur = [to[0], to[1]];
  while (cur){ out.push(cur); cur = prev.get(key(cur[0], cur[1])); }
  return out.reverse();
}

/* дверь (разгрузка машины) — низ зала по центру, если свободно */
export function doorCell(S){
  const g = S.grid;
  const cx = Math.floor(g.w / 2);
  for (let d = 0; d < g.w; d++){
    for (const x of [cx - d, cx + d]){
      if (x < 0 || x >= g.w) continue;
      for (let y = g.h - 1; y >= 0; y--) if (!fixtureAt(S, x, y)) return [x, y];
    }
  }
  return [0, g.h - 1];
}

function counterCell(S){
  const cf = S.fixtures.find(f => f.itemId === 'counter');
  return cf ? [cf.x, cf.y] : [0, 0];
}

/* путь по проходам от стойки до конкретной ячейки (для анимации) */
export function shelfPath(S, shelfId, cellIdx){
  const fx = S.fixtures.find(f => f.shelfId === shelfId);
  if (!fx) return [];
  const tx = fx.x + (cellIdx % fx.w), ty = fx.y + Math.floor(cellIdx / fx.w);
  return gridPath(S, counterCell(S), [tx, ty]);
}

/* где сейчас человечек: [x, y] */
export function playerCell(S){
  const p = S.player || {};
  const cf = S.fixtures.find(f => f.itemId === 'counter');
  const home = cf ? [cf.x, cf.y] : [0, 0];
  const b = p.busy;
  if (b && b.kind === 'fetch'){
    const path = shelfPath(S, b.shelfId, b.cellIdx);
    if (path.length < 2) return home;
    const t = 1 - Math.max(0, b.t) / Math.max(1, b.total);
    return path[Math.min(path.length - 1, Math.round(t * (path.length - 1)))];
  }
  if (b && b.kind === 'handover'){
    const stand = p.stand || home;
    const t = 1 - Math.max(0, b.t) / Math.max(1, b.total);
    return [
      Math.round(stand[0] + (home[0] - stand[0]) * t),
      Math.round(stand[1] + (home[1] - stand[1]) * t),
    ];
  }
  if (p.stand) return p.stand;
  return home;
}

/* где сейчас сотрудник: [x, y] */
export function staffCell(S, st){
  const home = st.role === 'loader' ? doorCell(S) : counterCell(S);
  const b = st && st.task;
  if (!b) return home;
  const ease = (path, t, total) => {
    if (!path.length) return home;
    const k = 1 - Math.max(0, t) / Math.max(1, total);
    return path[Math.min(path.length - 1, Math.round(k * (path.length - 1)))];
  };
  if (b.kind === 'serve' && b.shelfId != null){
    const fx = S.fixtures.find(f => f.shelfId === b.shelfId);
    if (!fx) return home;
    const target = [fx.x + (b.cellIdx % fx.w), fx.y + Math.floor(b.cellIdx / fx.w)];
    return ease(gridPath(S, counterCell(S), target), b.t, b.total);
  }
  if (b.kind === 'place' && b.cell){
    const fx = S.fixtures.find(f => f.shelfId === b.cell.shelfId);
    if (!fx) return home;
    const target = [fx.x + (b.cell.idx % fx.w), fx.y + Math.floor(b.cell.idx / fx.w)];
    return ease(gridPath(S, doorCell(S), target), b.t, b.total);
  }
  if (b.kind === 'accept') return doorCell(S);
  return home;
}

/* расстояние от стойки до стеллажа по проходам (BFS) */
export function shelfDistance(S, shelfId){
  const sh = S.shelves.find(x => x.id === shelfId);
  if (!sh) return 99;
  const cf = S.fixtures.find(f => f.itemId === 'counter');
  const startCells = [];
  if (cf) for (let dy=0; dy<cf.h; dy++) for (let dx=0; dx<cf.w; dx++) startCells.push([cf.x+dx, cf.y+dy]);
  else startCells.push([0,0]);

  const target = new Set();
  const fx = S.fixtures.find(f => f.shelfId === shelfId);
  if (fx) for (let dy=0; dy<fx.h; dy++) for (let dx=0; dx<fx.w; dx++) target.add((fx.x+dx) + ':' + (fx.y+dy));
  else return 99;

  const blocked = (x,y) => {
    if (x < 0 || y < 0 || x >= S.grid.w || y >= S.grid.h) return true;
    const f = fixtureAt(S, x, y);
    if (!f) return false;
    if (fx && f.id === fx.id) return false;
    if (cf && f.id === cf.id) return false;
    return true;
    
  };
  const dist = new Map();
  const q = [];
  for (const [x,y] of startCells){ dist.set(x+':'+y, 0); q.push([x,y,0]); }
  let head = 0;
  while (head < q.length){
    const [x,y,d] = q[head++];
    if (target.has(x+':'+y)) return d;
    if (d > 40) continue;
    for (const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
      const k = nx+':'+ny;
      if (dist.has(k) || blocked(nx,ny)) continue;
      dist.set(k, d+1);
      q.push([nx, ny, d+1]);
    }
  }
  return 99;
}

/* ---------------- кредит ---------------- */
export function loanLimit(S){ return Math.round(dayDemand(S) * CFG.PAY_BASE * CFG.LOAN_LIMIT_MULT / 1000) * 1000; }

export function takeLoan(S, amount){
  if (S.phase !== 'plan') return { ok:false, msg:'Кредит — в фазе планирования' };
  const limit = loanLimit(S) - S.debt;
  amount = Math.min(amount, limit);
  if (amount <= 0) return { ok:false, msg:'Лимит исчерпан' };
  S.debt += amount;
  S.money += amount;
  pushLog(S, `Взят кредит ${fmt(amount)} ₽ под 0.7%/день. Платёж ежедневный.`, 'warn');
  return { ok:true };
}

/* ---------------- уровни ---------------- */
export function xpNeed(S){ return Math.round(150 * Math.pow(S.lvl, 1.6)); }

export function addXp(S, n){
  S.xp += n;
  while (S.xp >= xpNeed(S)){
    S.xp -= xpNeed(S);
    S.lvl++;
    pushLog(S, `Уровень ${S.lvl}! Открыты новые возможности.`, 'lvl');
  }
}

/* ---------------- события ---------------- */
export const EV_CATS = {
  clients: { name:'Клиенты',  ico:'users' },
  stock:   { name:'Склад',    ico:'truck' },
  money:   { name:'Деньги',   ico:'wallet' },
  team:    { name:'Команда',  ico:'manager' },
  place:   { name:'Помещение',ico:'store' },
  city:    { name:'Город',    ico:'flag2' },
};

const EVENTS = [
  {
    id:'inspect', minDay:5, cat:'city', art:'award', sev:'warn',
    title:'Проверка Роспотребнадзора',
    text:'Инспектор на пороге. В зале пыльно, но полки в порядке.',
    options:[
      { text:'Дать «на кофе»', hint:'Быстро и тихо, но дорого', money:-12000, nps:0.02,
        log:'Инспектор ушёл довольным. Но осадочек.' },
      { text:'Закрыться и убраться', hint:'Чисто, но теряете два часа торговли', skip:120, nps:0.05,
        log:'Чисто, но потеряли 2 часа торговли.' },
      { text:'Пустить как есть', hint:'Бесплатно, но со штрафом', fine:6000, nps:-0.15,
        log:'Штраф выписан, NPS просел.' },
    ],
  },
  {
    id:'advance', minDay:3, cat:'team', art:'manager', sev:'info',
    title:'Сотрудник просит аванс',
    text:'«Мне бы 5 000 до пятницы, очень надо».',
    options:[
      { text:'Дать 5 000 ₽ сейчас', hint:'Команда это запомнит', money:-5000, mood:12,
        log:'Команда оценила. Настроение выросло.' },
      { text:'Дать под условие «суббота рабочая»', hint:'Дешевле для кассы, тяжелее для людей',
        money:-5000, mood:6, fatigueTeam:8, log:'Согласился. Но суббота будет тяжёлой.' },
      { text:'Отказать', hint:'Касса цела, обида останется', mood:-10, nps:-0.01,
        log:'Обиделся. Работает хуже.' },
    ],
  },
  {
    id:'tariff', minDay:3, cat:'city', art:'chart', sev:'warn',
    title:'Маркетплейс предлагает новый объём',
    text:'+30 % посылок, но −15 % к выплате за заказ и строже SLA.',
    options:[
      { text:'Согласиться', hint:'Больше работы, меньше маржи', pay:-0.15, traffic:1.3,
        log:'Объём вырос, маржа упала.' },
      { text:'Отказаться', hint:'Спокойно, но объём уйдёт соседу', nps:-0.02,
        log:'Объём ушёл соседнему ПВЗ.' },
    ],
  },
  {
    id:'scandal', minDay:1, cat:'clients', art:'alert', sev:'bad',
    title:'Скандал в зале',
    text:'Клиент снимает на телефон: «Мой заказ потеряли!»',
    options:[
      { text:'Извиниться и дать скидку', hint:'Дорого, но видео выйдет добрым', money:-2000, nps:0.06,
        chain:'thanks', log:'Видео вышло добрым. NPS вырос.' },
      { text:'Спокойно найти заказ', hint:'Дольше, зато бесплатно', nps:0.01, spendMin:20,
        log:'Нашли. Нервы, но репутация цела.' },
      { text:'Выгнать', hint:'Бесплатно. Риск: ролик разлетится', nps:-0.12, chain:'bloggerBad',
        log:'Видео набрало просмотры. Плохо.' },
    ],
  },
  {
    id:'blogger', minDay:4, cat:'city', art:'video', sev:'info',
    title:'Блогер снимает ролик',
    text:'«Ребята, у вас тут мило. Можно снять?»',
    options:[
      { text:'Заплатить за рекламу', hint:'Поток +15 % на неделю', money:-8000, traffic:1.15,
        log:'Охват вырос: поток +15% на неделю.' },
      { text:'Разрешить бесплатно', hint:'Бесплатно, эффект небольшой', nps:0.03,
        log:'Сняли. Вышло неплохо.' },
      { text:'Отказать', hint:'Ничего не меняется', log:'Сняли «как есть» — без восторгов.' },
    ],
  },
  {
    id:'fridge', minDay:4, cat:'place', art:'wind', sev:'warn',
    title:'Сломался кондиционер',
    text:'На улице +32, в зале душно.',
    options:[
      { text:'Ремонт сейчас', hint:'Дорого, клиенты не страдают', money:-8000,
        log:'Починили. Клиенты довольны.' },
      { text:'Ждать мастера 2 дня', hint:'Бесплатно, но душно', nps:-0.08, mood:-10,
        log:'Два дня духоты.' },
    ],
  },
  {
    id:'courier', minDay:2, cat:'stock', art:'truck', sev:'info',
    title:'Курьер приехал на час раньше',
    text:'Машина уже во дворе, а вы ещё не готовили зону приёмки.',
    options:[
      { text:'Принять вне графика', hint:'Потратите ~20 минут', spendMin:20, money:600,
        log:'Приняли раньше срока — успели разложить.' },
      { text:'Отправить в соседний ПВЗ', hint:'Спокойно, но с потерей', money:-1500,
        log:'Посылки уехали в соседний пункт.' },
      { text:'Попросить подождать', hint:'Бесплатно. Риск: курьер спешит', risk:{ p:0.45,
          lose:{ nps:-0.05, log:'Курьер уехал, часть посылок опоздала.' } },
        log:'Курьер подождал и уехал довольным.' },
    ],
  },
  {
    id:'vip', minDay:2, cat:'clients', art:'star', sev:'info',
    title:'Постоянный клиент просит вне очереди',
    text:'«Я тут каждый день, пропустите, пожалуйста». Очередь слышит.',
    options:[
      { text:'Пропустить вперёд', hint:'Чаевые, но очередь ворчит', money:300, nps:0.02,
        log:'Клиент оставил чаевые. Очередь — сдержанно.' },
      { text:'Предложить доставку', hint:'Маленькая скидка — все довольны', money:-400, nps:0.05,
        log:'Оформили доставку вне очереди. Все довольны.' },
      { text:'Сказать «в порядке очереди»', hint:'По правилам, но обидно', nps:-0.03,
        log:'Отказали. Правильно, но холодно.' },
    ],
  },
  {
    id:'missing', minDay:6, cat:'money', art:'wallet', sev:'bad',
    title:'Недостача при инвентаризации',
    text:'Одной посылки нет ни на полке, ни в приёмке.',
    options:[
      { text:'Погасить из кассы', hint:'Быстро и без шума', money:-2200,
        log:'Погасили из кассы. Тихо.' },
      { text:'Искать два часа', hint:'Бесплатно. Риск: не найдёте', skip:60,
        risk:{ p:0.5, lose:{ fine:3500, log:'Искали два часа, не нашли — ещё и штраф.' } },
        log:'Нашли! Два часа, зато без потерь.' },
      { text:'Списать на погрешность', hint:'Штраф маркетплейса', fine:1500, nps:-0.03,
        log:'Списали. Маркетплейс выставил штраф.' },
    ],
  },
  {
    id:'leak', minDay:5, cat:'place', art:'wind', sev:'bad',
    title:'Потёк потолок',
    text:'После ливня в углу зала капает прямо на стеллаж.',
    options:[
      { text:'Срочный ремонт', hint:'Дорого, но без потерь', money:-5000,
        log:'Кровлю залатали. Посылки целы.' },
      { text:'Подставить вёдра', hint:'Дёшево. Риск: испортите посылки', money:-800,
        risk:{ p:0.55, lose:{ fine:3000, nps:-0.07, log:'Вода достала посылки — штраф и жалобы.' } },
        log:'Вёдра спасли положение. Пока сухо.' },
    ],
  },
  /* продолжения — приходят на следующий день после решения */
  {
    id:'thanks', chain:true, cat:'clients', art:'sparkle', sev:'info',
    title:'Клиент вернулся с благодарностью',
    text:'Тот самый скандалист: «Вы молодцы, извините за видео».',
    options:[
      { text:'Предложить бонус', hint:'Небольшая скидка — лояльность', money:-500, nps:0.06,
        log:'Клиент стал постоянным.' },
      { text:'Просто поблагодарить', hint:'Бесплатно', nps:0.04,
        log:'Поблагодарили. Тёплый отзыв в картах.' },
    ],
  },
  {
    id:'bloggerBad', chain:true, cat:'city', art:'video', sev:'bad',
    title:'Ролик про ваш ПВЗ набрал 200 тыс. просмотров',
    text:'Комментарии злые, звонят журналисты.',
    options:[
      { text:'Публично ответить и извиниться', hint:'Дешево и снимает волну', money:-1000, nps:0.05,
        log:'Публично ответили — волна спала.' },
      { text:'Нанять SMM-специалиста', hint:'Дорого, зато надолго', money:-2800, nps:0.09,
        log:'SMM выкрутил ситуацию в плюс.' },
      { text:'Игнорировать', hint:'Бесплатно. Репутация просядет', nps:-0.10,
        log:'Игнорировали. Рейтинг просел.' },
    ],
  },
];

const EV_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));

/* чипы последствий для превью опции */
export function eventChips(opt){
  const out = [];
  const m = n => (n > 0 ? '+' : '−') + Math.abs(n).toLocaleString('ru-RU').replace(/,/g, ' ');
  if (opt.money) out.push({ tone: opt.money < 0 ? 'bad' : 'good', ico:'wallet', t:`${m(opt.money)} ₽` });
  if (opt.fine) out.push({ tone:'bad', ico:'alert', t:`штраф до ${m(opt.fine)} ₽` });
  if (opt.nps) out.push({ tone: opt.nps > 0 ? 'good' : 'bad', ico:'star', t:`NPS ${opt.nps > 0 ? '+' : '−'}${Math.abs(opt.nps).toFixed(2)}` });
  if (opt.mood) out.push({ tone: opt.mood > 0 ? 'good' : 'bad', ico:'users', t:`настрой ${opt.mood > 0 ? '+' : '−'}${Math.abs(opt.mood)}` });
  if (opt.fatigueTeam) out.push({ tone:'bad', ico:'clock', t:`усталость +${opt.fatigueTeam}` });
  if (opt.skip) out.push({ tone:'bad', ico:'clock', t:`−${opt.skip} мин` });
  if (opt.spendMin) out.push({ tone:'warn', ico:'clock', t:`~${opt.spendMin} мин` });
  if (opt.pay) out.push({ tone:'warn', ico:'chart', t:`выплата ${Math.round(opt.pay*100)} %` });
  if (opt.traffic) out.push({ tone:'good', ico:'users', t:`поток +${Math.round((opt.traffic-1)*100)} %` });
  if (opt.risk) out.push({ tone:'warn', ico:'target', t:`риск ${Math.round(opt.risk.p*100)} %` });
  if (opt.chain) out.push({ tone:'info', ico:'sparkle', t:'продолжение завтра' });
  return out;
}

function triggerEvent(S){
  if (!S.evChain) S.evChain = [];
  let ev = null;
  if (S.evChain.length){
    const id = S.evChain.shift();
    ev = EV_BY_ID[id] || null;
  }
  if (!ev){
    const pool = EVENTS.filter(e => !e.chain && S.day >= (e.minDay || 1));
    if (!pool.length) return;
    ev = pick(S, pool);
  }
  S.event = { ...ev, id: ev.id };
}

function applyOpt(S, opt){
  if (opt.money){ S.money += opt.money; S.dayStats.events = (S.dayStats.events || 0) + opt.money; }
  if (opt.fine){ const f = fine(S, opt.fine); S.dayStats.fines += f; S.money -= f; }
  if (opt.nps) S.nps = clamp(S.nps + opt.nps, 0, 5);
  if (opt.mood) S.staff.forEach(st => st.mood = clamp(st.mood + opt.mood, 0, 100));
  if (opt.fatigueTeam) S.staff.forEach(st => st.fatigue = Math.min(100, st.fatigue + opt.fatigueTeam));
  if (opt.skip) S.minutes += opt.skip;
  if (opt.spendMin) S.minutes += Math.min(opt.spendMin, 20);
  if (opt.pay) S.eventPayMod = (S.eventPayMod || 1) * (1 + opt.pay);
  if (opt.traffic) S.eventTrafficMod = (S.eventTrafficMod || 1) * opt.traffic;
}

export function resolveEvent(S, optionIdx, silent){
  const ev = S.event;
  if (!ev) return;
  const opt = ev.options[optionIdx];
  S.event = null;
  if (!opt) return;

  // риск: бросок честный, seeded
  let branch = opt, failed = false;
  if (opt.risk){
    failed = chance(S, opt.risk.p);
    if (failed) branch = { ...opt, ...opt.risk.lose, money:(opt.risk.lose.money||0) + (opt.money||0) };
  }
  applyOpt(S, { ...opt, risk: undefined, chain: undefined });
  if (failed) applyOpt(S, opt.risk.lose);

  if (!failed && opt.chain){
    if (!S.evChain) S.evChain = [];
    S.evChain.push(opt.chain);
  }

  const text = failed ? (opt.risk.lose.log || 'Не получилось.') : opt.log;
  pushLog(S, `${ev.title}: ${text}`, failed ? 'bad' : 'event');

  if (!silent){
    if (!S.decisions) S.decisions = [];
    S.decisions.push({ day:S.day, title:ev.title, choice:opt.text, text, failed });
    const chips = failed ? eventChips({ ...opt.risk.lose })
      : eventChips(opt).filter(c => c.t !== 'продолжение завтра');
    const tone = failed ? 'fail' : chips.some(c => c.tone === 'bad') ? 'warn' : 'ok';
    S.evRes = { id: ev.id, title: ev.title, choice: opt.text, text, failed, tone, chips };
  }
}

export function closeEventResult(S){ S.evRes = null; }

export function autoResolveEvent(S){
  // игрок не успел решить — считаем, что выбран последний (самый рискованный) вариант
  if (S.event) resolveEvent(S, S.event.options.length - 1, true);
  if (S.evRes) S.evRes = null;
}



/* ---------------- разбор дня ---------------- */
export function endDay(S){
  if (S.phase !== 'day') return;
  S.phase = 'report';
  S.speed = 0;
  S.event = null;

  const p = premOf(S);
  const ds = S.dayStats;
  let payroll = 0, onPrepay = 0;
  for (const st of S.staff){
    if ((st.prepay || 0) > 0){ st.prepay--; onPrepay++; }
    else payroll += Math.round(st.salary * shiftPay(st.shift));
  }
  S.dayStats.onPrepay = onPrepay;
  const rent = p.rent;
  const util = CFG.UTIL_PER_DAY;
  const loanPay = Math.round(S.debt * CFG.LOAN_RATE);
  const gross = ds.revenue;
  const tax = S.day % 7 === 0 ? Math.round(gross * CFG.TAX_RATE) : 0;

  // неотправленные возвраты — убыток
  if (S.returns && S.returns.length){
    const late = S.returns.length * CFG.RET_LATE_FINE;
    ds.fines += late;
    ds.retFines = late;
    pushLog(S, `${S.returns.length} возврат(ов) не ушли вовремя. Списано ${fmt(late)} ₽.`, 'bad');
    S.returns = [];
  }

  const costs = rent + util + payroll + loanPay + tax + ds.fines;
  S.money -= costs;
  ds.payroll = payroll; ds.rent = rent; ds.util = util; ds.tax = tax; ds.loan = loanPay;
  ds.net = gross + ds.tips + (ds.events || 0) - costs;

  const avgSla = ds.issued ? ds.slaSum / ds.issued : 0;
  const missedRate = ds.arrivals ? ds.missed / ds.arrivals : 0;

  S.history.push({
    day: S.day, revenue: gross + ds.tips, costs, net: ds.net,
    issued: ds.issued, missed: ds.missed, avgSla, nps: S.nps,
  });
  S.kpiWeek.days++;

  // недельный аудит
  if (S.day % 7 === 0) weeklyAudit(S);

  // усталость и текучка
  S.fatigue = Math.max(0, S.fatigue - 55);
  S.staff.forEach(st => {
    st.daysWorked++;
    if (st.mood < 22 && chance(S, 0.5)){
      pushLog(S, `${st.name} уволился: «Устал, извините».`, 'bad');
      st.quit = true;
    }
  });
  S.staff = S.staff.filter(st => !st.quit);

  if (S.money < 0){
    S.negDays++;
    if (S.negDays >= CFG.NEG_DAYS_LIMIT){
      S.over = true; S.overReason = 'bankrupt';
    }
  } else S.negDays = 0;

  S.report = { day:S.day, ds:{ ...ds }, costs, avgSla, missedRate, p };

  if (S.eventTrafficMod){ S.trafficModWeek = (S.trafficModWeek||1) * S.eventTrafficMod; S.eventTrafficMod = 1; }
}

function weeklyAudit(S){
  const k = S.kpiWeek;
  if (!k.issued && !k.arrivals){ return; }
  const avgSla = k.issued ? k.slaSum / k.issued : 999;
  const missed = k.arrivals ? k.missed / k.arrivals : 0;
  const cur = contractOf(S);
  const brandOk = compliance(S) >= cur.brand;

  const ok = avgSla <= cur.sla && missed <= cur.missed && S.nps >= cur.nps && brandOk;
  if (!ok && S.contractIdx > 0){
    S.contractIdx--;
    pushLog(S, `Аудит не пройден: контракт понижен до «${contractOf(S).name}».`, 'bad');
    S.nps = clamp(S.nps - 0.1, 0, 5);
  } else if (ok && S.contractIdx < CONTRACTS.length - 1){
    const next = CONTRACTS[S.contractIdx + 1];
    const serverCash = 12000;
    const better = avgSla <= next.sla && missed <= next.missed && S.nps >= next.nps && compliance(S) >= next.brand;
    if (better && S.money >= serverCash){
      S.money -= serverCash;
      S.contractIdx++;
      pushLog(S, `Заявка одобрена: контракт «${contractOf(S).name}»! (−${fmt(serverCash)} ₽ за аккредитацию)`, 'lvl');
    }
  } else {
    pushLog(S, `Аудит пройден: KPI в норме.`, 'good');
  }
  S.kpiWeek = { issued:0, slaSum:0, missed:0, arrivals:0, days:0 };
}

export function nextDay(S){
  if (S.over) return;
  S.day++;
  S.minutes = 0;
  S.phase = 'plan';
  S.clients = [];
  S.trucks = [];
  S.event = null;
  S.report = null;
  S.dayStats = freshDayStats();
  S.recalcDone = false;
  S.staff.forEach(st => { st.task = null; st.onShift = onShiftNow(S, st); });
  recalcForecast(S);
  buildCandidates(S);
  pushLog(S, `День ${S.day}. Утро. Касса: ${fmt(S.money)} ₽.`, 'info');
}

/* ---------------- сохранение ---------------- */
export function serialize(S){
  const copy = { ...S };
  delete copy.eventQueue;
  return JSON.stringify(copy);
}

export function deserialize(str){
  try {
    const S = JSON.parse(str);
    if (!S || typeof S !== 'object' || !S.day) return null;
    S.returns = S.returns || [];
    S.broken = S.broken || {};
    S.staff = (S.staff || []).map(st => ({ ...st, shift: st.shift || 'full' }));
    return S;
  } catch(e){ return null; }
}

/* ---------------- утилиты для UI ---------------- */
export const CLAMP = (v,a,b) => Math.max(a, Math.min(b, v));
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

export function payrollNow(S){
  return S.staff.filter(st => (st.prepay || 0) <= 0).reduce((a, st) => a + st.salary, 0);
}

export function contractStatus(S){
  const k = S.kpiWeek;
  const avgSla = k.issued ? k.slaSum / k.issued : 0;
  const missed = k.arrivals ? k.missed / k.arrivals : 0;
  const cur = contractOf(S);
  return {
    avgSla: Math.round(avgSla), missed, nps: S.nps, compliance: compliance(S),
    slaOk: avgSla <= cur.sla || !k.issued,
    missedOk: missed <= cur.missed,
    npsOk: S.nps >= cur.nps,
    brandOk: compliance(S) >= cur.brand,
  };
}

export function dayLabel(S){
  const total = CFG.START_HOUR * 60 + S.minutes;
  const h = Math.floor(total / 60), m = total % 60;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}

export const ZONES = ZONE_LABEL;

/* ============================================================
   Быстрые механики: схемы расстановки, наборы закупок, поиск заказа
   ============================================================ */

export const LAYOUT_PRESETS = {
  fast:    { name:'Быстрая выдача', desc:'полки ближе к стойке — меньше ходьбы', ico:'zap' },
  compact: { name:'Компакт',        desc:'плотно в угол — больше проходов',      ico:'layout' },
  stock:   { name:'Склад',          desc:'полки в глубине — свободный зал',      ico:'shelf' },
};

/* опорная точка: стойка, иначе вход (низ зала) */
function anchorPoint(S){
  const c = S.fixtures.find(f => f.itemId === 'counter');
  if (c) return [c.x + c.w / 2, c.y + c.h / 2];
  return [S.grid.w / 2, S.grid.h];
}

/* позиции для поиска места, отсортированные под выбранную схему */
function presetPositions(S, kind){
  const [ax, ay] = anchorPoint(S);
  const list = [];
  for (let y = 0; y < S.grid.h; y++){
    for (let x = 0; x < S.grid.w; x++){
      const d = Math.hypot(x - ax, y - ay);
      let score;
      if (kind === 'fast') score = d;                                  // ближе к стойке — первым
      else if (kind === 'stock') score = -d;                           // дальше — первым
      else score = y * S.grid.w + x;                                   // плотно от угла
      list.push({ x, y, score });
    }
  }
  return list.sort((a, b) => a.score - b.score);
}

/* расставить купленное и подвинуть пустые стеллажи по схеме */
export function applyPreset(S, kind){
  if (S.phase !== 'plan') return { ok:false, msg:'Только до начала дня' };
  const positions = presetPositions(S, kind);
  const prio = id => {
    const it = ITEMS[id];
    if (id === 'counter') return 0;
    if (it && it.cap) return 1;
    if (it && it.physical && it.size.w * it.size.h >= 4) return 2;
    return 3;
  };

  let placed = 0, moved = 0;

  // 1) купленное, но не расставленное
  const pending = [...S.unplaced].sort((a, b) => prio(a) - prio(b));
  for (const id of pending){
    const it = ITEMS[id];
    if (!it || !it.physical) continue;
    for (const pos of positions){
      if (canPlaceAt(S, it.size.w, it.size.h, pos.x, pos.y)){
        if (placeFixture(S, id, pos.x, pos.y).ok){ placed++; break; }
      }
    }
  }

  // 2) уже стоящие пустые полки — подвинуть под схему
  const movable = S.fixtures
    .filter(f => {
      if (!f.shelfId) return false;
      const sh = S.shelves.find(x => x.id === f.shelfId);
      return sh && !sh.cells.some(Boolean);
    })
    .sort((a, b) => prio(a.itemId) - prio(b.itemId));

  for (const f of movable){
    for (const pos of positions){
      if (pos.x === f.x && pos.y === f.y) break;
      if (canPlaceIgnoring(S, f, f.w, f.h, pos.x, pos.y)){
        if (moveFixture(S, f.id, pos.x, pos.y).ok){ moved++; break; }
      }
    }
  }

  pushLog(S, moved || placed
    ? `Схема «${LAYOUT_PRESETS[kind].name}»: расставлено ${placed}, переставлено ${moved}.`
    : `Схема «${LAYOUT_PRESETS[kind].name}»: менять нечего.`, 'info');
  return { ok:true, placed, moved };
}

/* ---------- наборы закупок ---------- */
export const BUNDLES = {
  start:   { name:'Стартовый', ico:'store',  items:['counter', 'banner', 'light'],      desc:'минимум для брендбука' },
  flow:    { name:'Поток',     ico:'coffee', items:['coffee', 'sofa', 'music'],         desc:'больше людей и терпения' },
  service: { name:'Сервис',    ico:'card',   items:['scanner', 'printer', 'terminal'],  desc:'быстрая и дорогая выдача' },
};
export const BUNDLE_DISCOUNT = 0.1;

export function bundleQuote(S, key){
  const b = BUNDLES[key];
  if (!b) return null;
  const missing = b.items.filter(id => !(S.owned[id] > 0));
  const full = missing.reduce((a, id) => a + ITEMS[id].cost, 0);
  const cost = Math.round(full * (1 - BUNDLE_DISCOUNT) / 50) * 50;
  const locked = b.items.some(id => (S.lvl || 1) < ITEMS[id].lvl);
  return { key, name:b.name, items:b.items, missing, desc:b.desc, ico:b.ico,
           full, cost, save:full - cost, locked, ok: missing.length > 0 && !locked };
}

export function buyBundle(S, key){
  if (S.phase !== 'plan') return { ok:false, msg:'Закупки — до начала дня' };
  const q = bundleQuote(S, key);
  if (!q) return { ok:false, msg:'Нет такого набора' };
  if (q.locked) return { ok:false, msg:'Часть набора откроется с новым уровнем' };
  if (!q.missing.length) return { ok:false, msg:'Набор уже собран' };
  if (S.money < q.cost) return { ok:false, msg:`Нужно ${fmt(q.cost)} ₽` };
  S.money -= q.cost;
  for (const id of q.missing){
    S.owned[id] = (S.owned[id] || 0) + 1;
    if (ITEMS[id].physical) S.unplaced.push(id);
  }
  recalcForecast(S);
  pushLog(S, `Набор «${q.name}»: ${q.missing.map(id => ITEMS[id].name).join(', ')} за ${fmt(q.cost)} ₽ (экономия ${fmt(q.save)} ₽)`, 'buy');
  return { ok:true, cost:q.cost, items:q.missing };
}

/* ---------- поиск заказа по коду ---------- */
export function findByCode(S, raw){
  const q = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!q) return null;
  const norm = c => String(c || '').toUpperCase().replace(/\s+/g, '');
  // клиент в очереди
  const client = S.clients.find(c => !c.returnItem && norm(c.code).includes(q));
  if (client) return { kind:'client', client, loc: clientLocation(S, client.id) };
  // посылка в зоне приёмки
  const pkg = S.receiving.find(p => norm(p.code).includes(q));
  if (pkg) return { kind:'receiving', pkg };
  // посылка на полке
  for (const sh of S.shelves){
    for (let i = 0; i < sh.cells.length; i++){
      const p = sh.cells[i];
      if (p && norm(p.code).includes(q)) return { kind:'shelf', pkg:p, shelf: sh, idx:i };
    }
  }
  // возврат
  const ret = S.returns.find(r => norm(r.code).includes(q));
  if (ret) return { kind:'return', ret };
  return null;
}
