/* Юнит-проверки экономики найма */
import * as E from '../src/engine.js';

let fails = 0;
const check = (n, c, i='') => { console.log((c?'  ✓ ':'  ✗ ')+n+(i?' — '+i:'')); if(!c) fails++; };

const S = E.createGame({ brandId:'plus', premiseId:'spal', seed:42 });
S.money = 100000;
// зал: стойка + стеллажи (иначе день не начнётся)
E.buy(S,'counter'); E.buy(S,'light'); E.buy(S,'shelfStd'); E.buy(S,'shelfStd');
E.autoLayout(S);

console.log('Найм');
const cost = E.hireCost(S, 'loader');
const before = S.money;
check('цена найма = оформление + аванс', cost === E.ROLES.loader.onboard + E.ROLES.loader.salary * E.CFG.PREPAY_DAYS, cost + ' ₽');
E.hire(S, 'loader');
check('списано ровно стоимость найма', before - S.money === cost, (before - S.money) + ' ₽');
check('у сотрудника аванс 10 дней', S.staff[0].prepay === E.CFG.PREPAY_DAYS);

console.log('Команда на карте');
{
  const T = E.createGame({ brandId:'plus', premiseId:'spal', seed:11 });
  T.money = 300000;
  ['counter','light','shelfStd','shelfStd'].forEach(i => E.buy(T, i));
  E.autoLayout(T);
  E.startDay(T);
  const sh = T.shelves[1];
  T.staff.push({ id:'e1', role:'seller', name:'Пётр', sp:5, ac:5, sv:6, trait:'work', mood:70, fatigue:0, task:null, onShift:true, salary:1700, prepay:0 });
  T.staff.push({ id:'e2', role:'loader', name:'Гарик', sp:6, ac:5, sv:3, trait:'work', mood:70, fatigue:0, task:null, onShift:true, salary:1300, prepay:0 });
  const c0 = E.staffCell(T, T.staff[0]);
  check('сотрудник без задачи у стойки', c0[0] === 0 && c0[1] === 0, JSON.stringify(c0));
  T.staff[0].task = { kind:'serve', shelfId:sh.id, cellIdx:1, t:6, total:12 };
  const mid = E.staffCell(T, T.staff[0]);
  T.staff[0].task.t = 0.1;
  const end = E.staffCell(T, T.staff[0]);
  check('продавец идёт к полке и доходит', mid[0] !== end[0] || mid[1] !== end[1], JSON.stringify(mid) + ' → ' + JSON.stringify(end));
  const inGrid = end[0] >= 0 && end[0] < T.grid.w && end[1] >= 0 && end[1] < T.grid.h;
  check('позиция в пределах зала', inGrid, JSON.stringify(end));
  const door = E.doorCell(T);
  check('дверь разгрузки свободна', !E.fixtureAt(T, door[0], door[1]), JSON.stringify(door));
}

console.log('Зарплата и аванс');
E.startDay(S);
E.endDay(S);
check('в день найма зарплата не списывается', S.report.ds.payroll === 0, 'payroll=' + S.report.ds.payroll);
check('аванс уменьшился на 1', S.staff[0].prepay === E.CFG.PREPAY_DAYS - 1, String(S.staff[0].prepay));
for (let i = 0; i < 9; i++){ E.nextDay(S); E.startDay(S); E.endDay(S); }
check('через 10 дней аванс исчерпан', S.staff[0].prepay === 0, String(S.staff[0].prepay));
E.nextDay(S); E.startDay(S); E.endDay(S);
check('после аванса зарплата списывается', S.report.ds.payroll === S.staff[0].salary, S.report.ds.payroll + ' vs оклад ' + S.staff[0].salary);

console.log('Нехватка денег');
const S2 = E.createGame({ brandId:'plus', premiseId:'spal', seed:1 });
S2.money = 5000;
const r = E.canHire(S2, 'loader');
check('наём заблокирован при нехватке денег', r.ok === false, r.msg);

console.log('Увольнение с авансом');
const S3 = E.createGame({ brandId:'plus', premiseId:'spal', seed:3 });
S3.money = 100000;
E.hire(S3, 'loader');
const id = S3.staff[0].id;
const cash = S3.money;
E.fire(S3, id);
check('при увольнении аванс не возвращается', S3.money === cash, 'касса не изменилась');

console.log(fails ? `\n❌ провалов: ${fails}` : '\n✅ экономика найма в порядке');
process.exit(fails ? 1 : 0);
