/* Иконки приложения: рендерим собственный SVG-знак в PNG нужных размеров.
   Запуск: node make-icons.mjs  (нужен playwright-core + chromium) */
import { chromium } from 'playwright-core';
import { writeFileSync } from 'fs';

const GLYPH = '<path d="M12 2.8 3.2 7.4v9.2L12 21.2l8.8-4.6V7.4L12 2.8z"/><path d="M3.2 7.4 12 12l8.8-4.6M12 12v9.2"/>';

// radius — скругление плитки (в долях от стороны), pad — отступ знака внутри плитки
function svg({ radius = 0.22, pad = 0.22, bg = true } = {}) {
  const r = 100 * radius;
  const s = 100 * (1 - pad * 2);      // сторона области со знаком
  const o = 100 * pad;                // отступ
  const k = s / 24;                   // масштаб знака 24×24
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6f9dff"/>
      <stop offset="0.55" stop-color="#5b8cff"/>
      <stop offset="1" stop-color="#2f5fe0"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".28"/>
      <stop offset="0.6" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${bg ? `<rect x="0" y="0" width="100" height="100" rx="${r}" fill="url(#g)"/>
  <rect x="0" y="0" width="100" height="100" rx="${r}" fill="url(#sheen)"/>` : ''}
  <g transform="translate(${o} ${o}) scale(${k})" fill="none" stroke="#ffffff"
     stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"
     style="paint-order:stroke">
     ${GLYPH}
  </g>
</svg>`;
}

const targets = [
  { file: 'icon-192.png', size: 192, opts: { radius: 0.22 } },
  { file: 'icon-512.png', size: 512, opts: { radius: 0.22 } },
  { file: 'icon-512-maskable.png', size: 512, opts: { radius: 0, pad: 0.26 } },
  { file: 'apple-touch-icon.png', size: 180, opts: { radius: 0, pad: 0.2 } },
  { file: 'icon-mono.svg', raw: svg({ radius: 0.22 }) },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const t of targets) {
  if (t.raw) { writeFileSync(t.file, t.raw); console.log('·', t.file); continue; }
  const html = `<!doctype html><html><body style="margin:0;background:transparent">
    <div id="i" style="width:${t.size}px;height:${t.size}px">${svg(t.opts)}</div></body></html>`;
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(html);
  const el = await page.$('#i');
  await el.screenshot({ path: t.file, omitBackground: true });
  console.log('·', t.file, t.size + 'px');
}

// favicon.svg — версия с плиткой и скруглением, для вкладки браузера
writeFileSync('favicon.svg', svg({ radius: 0.26, pad: 0.2 }));
console.log('· favicon.svg');

await browser.close();
