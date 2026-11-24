/* Headless-симулятор: проверка баланса без графики.
   Запуск: node sim.mjs --days=30 --strategy=service --seed=7            */

import * as E from './src/engine.js';

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));

const DAYS = +(args.days || 30);
const STRATEGY = args.strategy || 'balanced';
const SEED = +(args.seed || 12345);

const BUY_ORDER = {
  balanced: ['counter','banner','light','shelfStd','shelfStd','scanner','coffee','sofa','printer','shelfFrag','ac','terminal','music','cam','shelfKgt','shelfStd'],
  service:  ['counter','banner','light','shelfStd','shelfStd','scanner','printer','sofa','music','fitting','coffee','ac','terminal','shelfFrag','cam','shelfKgt','shelfStd'],
  volume:   ['counter','banner','light','shelfStd','shelfStd','shelfStd','scanner','printer','coffee','shelfFrag','terminal','ac','sofa','cam','music','shelfKgt'],
};
const HIRE_ORDER = {
  balanced: [['loader'],['seller'],['seller'],['loader'],['manager']],
  service:  [['seller'],['loader'],['seller'],['manager'],['loader']],
  volume:   [['loader'],['loader'],['seller'],['seller'],['manager']],
};

const order = BUY_ORDER[STRATEGY] || BUY_ORDER.balanced;
const hires = HIRE_ORDER[STRATEGY] || HIRE_ORDER.balanced;

const S = E.createGame({ brandId: args.brand || 'plus', premiseId: args.premise || 'spal', seed: SEED });
let buyIdx = 0, hireIdx = 0;

function planning(){
  // 1) брендбук: недостающие обязательные предметы — первыми (иначе нет контракта и выплат)
  for (const id of E.brandOf(S).req){
    if (!S.owned[id] && E.canBuy(S, id) && S.money - E.ITEMS[id].cost > 0){
      E.buy(S, id);
      const k = order.indexOf(id);
      if (k === buyIdx) buyIdx++;
    }
  }
  // найм: если накопили — берём до закупок
  const recentMissed0 = S.history.slice(-3).reduce((a,h) => a + h.missed, 0);
  const roles0 = hires[hireIdx];
  if (roles0 && (recentMissed0 >= 2 || S.day > 6)){
    for (const r of roles0){
      const c = E.canHire(S, r);
      const reserve = E.premOf(S).rent;
      if (c.ok && S.money - E.hireCost(S, r) > reserve){
        E.hire(S, r); hireIdx++;
        break;
      }
    }
  }
  // закупки в порядке приоритета
  for (let guard = 0; guard < 6; guard++){
    const id = order[buyIdx];
    if (!id) break;
    if (E.canBuy(S, id)){
      // держим резерв на аренду и зарплаты
      const saveForHire = (hires[hireIdx] && S.day > 4) ? E.hireCost(S, hires[hireIdx][0]) : 0;
      const reserve = E.premOf(S).rent * 2 + S.staff.reduce((a,s)=>a+s.salary,0) * 2 + saveForHire;
      if (S.money - E.ITEMS[id].cost > reserve || (S.day <= 2 && S.money - E.ITEMS[id].cost > 1500)){
        E.buy(S, id); buyIdx++;
        continue;
      }
    }
    break;
  }
  // найм: только когда реально не справляемся (упущенные клиенты за 3 дня)
  const recentMissed = S.history.slice(-3).reduce((a,h) => a + h.missed, 0);

  // расстановка купленного
  if (S.unplaced.length) E.autoLayout(S);
  // кредит, если совсем плохо
  if (S.money < 0 && S.debt < E.loanLimit(S)) E.takeLoan(S, 20000);
}

const PERFECT = args.perfect === 'true';
const stats = { events:0, evMoney:0, fines:0 };

/* Автоигрок: действует как живой менеджер — по одному действию, с учётом занятости */
function botActions(){
  if (S.phase !== 'day' || S.event) return;
  if (PERFECT) S.fatigue = 0;
  if (S.player.busy) return;

  // 1) если в руках посылка — отдать
  if (S.hands){
    const owner = S.clients.find(x => x.code === S.hands.code);
    if (owner && E.giveToClient(S, owner.id).ok) return;
    E.returnHands(S);
    return;
  }
  // 1б) принять возврат, если есть
  const ret = S.clients.find(x => x.returnItem);
  if (ret && E.takeReturn(S, ret.id).ok) return;
  // 2) обслужить самого нетерпеливого: дойти до полки
  const c = [...S.clients].filter(x => !x.consult && !x.returnItem && E.clientLocation(S, x.id)).sort((a,b) => a.patience - b.patience)[0];
  if (c && E.startFetch(S, c.id).ok) return;
  // 2) консультация
  const cons = S.clients.find(x => x.consult);
  if (cons && E.consult(S, cons.id).ok) return;
  // 3) разложить посылки
  for (const pkg of [...S.receiving]){
    for (const sh of S.shelves){
      if (sh.kind !== E.zoneOf(pkg) && sh.kind !== 'std') continue;
      const idx = sh.cells.indexOf(null);
      if (idx >= 0 && E.placeBox(S, pkg.id, sh.id, idx).ok) return;
    }
  }
  // 3б) отправить возвраты в 19:00
  if (S.returns.length && S.minutes >= E.CFG.RET_HOUR_MIN) { E.shipReturns(S, true); return; }
  // 4) принять поставку
  if (S.receiving.length < Math.max(2, Math.floor(E.CFG.RECV_MAX * 0.6))){
    if (E.acceptBox(S, true).ok) return;
  }
}

console.log(`\n=== ПВЗ-Сити: headless, стратегия «${STRATEGY}», сид ${SEED}, ${DAYS} дней ===\n`);
console.log('день  деньги      выручка  расходы  прибыль  выдано  упущ.  SLA(мин)  NPS   контракт  люди');

for (let d = 1; d <= DAYS; d++){
  if (S.phase === 'plan') planning();
  E.startDay(S);
  let guard = 0;
  while (S.phase === 'day' && guard++ < 2000){
    if (S.event){
      stats.events++;
      if (args.noevents) { S.event = null; } else E.autoResolveEvent(S);
    }
    botActions();
    E.stepMinute(S);
    if (S.over) break;
  }
  if (S.over) { console.log(`\n💀 День ${S.day}: ${S.overReason === 'bankrupt' ? 'банкротство' : 'провал'}\n`); break; }
  const r = S.report;
  if (!r) break;
  console.log(
    String(S.day).padStart(4),
    String(Math.round(S.money)).padStart(8),
    String(Math.round(r.ds.revenue + r.ds.tips)).padStart(8),
    String(Math.round(r.costs)).padStart(8),
    String(Math.round(r.ds.net)).padStart(8),
    String(r.ds.issued).padStart(7),
    String(r.ds.missed).padStart(6),
    String(Math.round(r.avgSla)).padStart(8),
    String(r.ds.nps !== undefined ? S.nps.toFixed(2) : S.nps.toFixed(2)).padStart(5),
    (E.contractOf(S).name).padStart(9),
    String(S.staff.length).padStart(5),
  );
  stats.evMoney += r.ds.events || 0;
  stats.fines += r.ds.fines || 0;
  E.nextDay(S);
}

const h = S.history;
if (h.length){
  const last7 = h.slice(-7);
  const avgNet = last7.reduce((a,x)=>a+x.net,0) / last7.length;
  const avgRev = last7.reduce((a,x)=>a+x.revenue,0) / last7.length;
  console.log(`\nИтог: деньги ${Math.round(S.money).toLocaleString('ru-RU')} ₽ | уровень ${S.lvl} | контракт ${E.contractOf(S).name} | NPS ${S.nps.toFixed(2)} | долг ${Math.round(S.debt)}`);
  console.log(`Средние за 7 дней: выручка ${Math.round(avgRev)} ₽, прибыль ${Math.round(avgNet)} ₽/день`);
  console.log(`События: ${stats.events} шт, деньги от событий ${Math.round(stats.evMoney)} ₽, штрафы ${Math.round(stats.fines)} ₽`);
  console.log(`Выдано всего: ${h.reduce((a,x)=>a+x.issued,0)}, упущено: ${h.reduce((a,x)=>a+x.missed,0)}\n`);
}
