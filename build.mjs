/* Сборка одного автономного файла (превью, PWA, раздача).
   Пишет index.html и game.html — оба входа рабочие. */
import { readFileSync, writeFileSync } from 'fs';

const css = readFileSync('src/styles.css', 'utf8');
const engineRaw = readFileSync('src/engine.js', 'utf8');
const iconsRaw = readFileSync('src/icons.js', 'utf8');
let uiRaw = readFileSync('src/ui.js', 'utf8');

// список экспортов движка — собираем автоматически, чтобы ничего не забыть
const names = [...engineRaw.matchAll(/^export\s+(?:function|const|let|class)\s+([A-Za-z0-9_]+)/gm)].map(m => m[1]);
const engine = engineRaw.replace(/^export\s+/gm, '');

const icons = iconsRaw.replace(/^export\s+/gm, '');

let ui = uiRaw.split('\n').filter(l => !l.startsWith('import ')).join('\n');
ui = ui.replace(/^export\s+/gm, '');

const parts = [];
parts.push('<!DOCTYPE html>');
parts.push('<html lang="ru">');
parts.push('<head>');
parts.push('<meta charset="utf-8" />');
parts.push('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
parts.push('<meta name="theme-color" content="#080c17" />');
parts.push('<meta name="description" content="ПВЗ-Сити — симулятор управления пунктом выдачи заказов" />');
parts.push('<title>ПВЗ-Сити — симулятор пункта выдачи</title>');
parts.push('<link rel="manifest" href="manifest.webmanifest" />');
parts.push('<link rel="icon" href="favicon.svg" type="image/svg+xml" />');
parts.push('<link rel="icon" href="icon-192.png" sizes="192x192" />');
parts.push('<link rel="apple-touch-icon" href="apple-touch-icon.png" />');
parts.push('<meta name="apple-mobile-web-app-capable" content="yes" />');
parts.push('<meta name="mobile-web-app-capable" content="yes" />');
parts.push('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />');
parts.push('<meta name="apple-mobile-web-app-title" content="ПВЗ-Сити" />');
parts.push('<meta name="color-scheme" content="dark" />');
parts.push('<meta name="format-detection" content="telephone=no" />');
parts.push('<meta property="og:title" content="ПВЗ-Сити — симулятор пункта выдачи" />');
parts.push('<meta property="og:description" content="Управляйте пунктом выдачи заказов: поставки, склад, клиенты, команда, KPI и экономика." />');
parts.push('<meta property="og:image" content="icon-512.png" />');
parts.push('<meta property="og:type" content="website" />');
parts.push('<style>');
parts.push(css);
parts.push('</style>');
parts.push('</head>');
parts.push('<body>');
// первый кадр рисуем прямо в HTML: сплэш виден ещё до разбора скрипта
parts.push(`<div id="app"><div class="shell" data-shell="splash"><div class="splash">
  <div class="splash-glow"></div>
  <div class="splash-brand">
    <div class="splash-mark"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.4 7.6 12 3l8.6 4.6v8.8L12 21l-8.6-4.6z"/><path d="M3.4 7.6 12 12.2l8.6-4.6M12 12.2V21"/></svg></div>
    <h1 class="splash-title">ПВЗ-Сити</h1>
    <div class="splash-sub">симулятор пункта выдачи</div>
  </div>
  <div class="splash-progress">
    <div class="splash-bar"><i class="boot-bar"></i></div>
    <div class="splash-step"><span>Загружаем игру</span><b>…</b></div>
  </div>
  <div class="splash-foot">работает без интернета</div>
</div></div></div>`);
parts.push('<noscript><div style="padding:24px;color:#e9eefc;font:16px sans-serif">Для игры нужен включённый JavaScript.</div></noscript>');
parts.push('<script>');
parts.push('(function(){');
parts.push('"use strict";');
parts.push('window.addEventListener("error", function(e){');
parts.push('  var app = document.getElementById("app");');
parts.push('  if (app && !window.__pvzBooted){');
parts.push('    app.innerHTML = \'<div style="padding:24px;color:#fca5a5;font:15px/1.5 sans-serif"><b>Ошибка запуска игры.</b><br>\' + (e.message || "") + \'</div>\';');
parts.push('  }');
parts.push('});');
parts.push('const E = (function(){');
parts.push(engine);
parts.push('return { ' + names.join(', ') + ' };');
parts.push('})();');
parts.push(icons);
parts.push(ui);
parts.push('window.__pvzBooted = true;');
parts.push('boot();');
parts.push('})();');
parts.push('</script>');
parts.push('</body>');
parts.push('</html>');

const html = parts.join('\n');
writeFileSync('game.html', html);
writeFileSync('index.html', html);

writeFileSync('dev.html', [
  '<!DOCTYPE html>',
  '<html lang="ru">',
  '<head>',
  '<meta charset="utf-8" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />',
  '<title>ПВЗ-Сити (dev)</title>',
  '<link rel="stylesheet" href="src/styles.css" />',
  '</head>',
  '<body>',
  '<div id="app"></div>',
  '<script type="module">',
  "  import { boot } from './src/ui.js';",
  '  boot();',
  '</script>',
  '</body>',
  '</html>',
].join('\n'));

console.log('index.html + game.html:', (html.length / 1024).toFixed(1) + ' KB · экспортов движка:', names.length);
