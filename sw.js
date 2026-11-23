/* ПВЗ-Сити — service worker.
   Оболочка кешируется целиком: игра запускается без сети.
   Навигация — сеть с таймаутом, затем кеш. Ассеты — кеш с фоновым обновлением. */

const VERSION='pvz-v7';
const SHELL = [
  './',
  './index.html',
  './game.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      // отдельный сбой не должен ломать установку целиком
      .then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting' || (e.data && e.data.type === 'skipWaiting')) self.skipWaiting();
});

function networkFirst(req, timeout = 3500){
  return new Promise(resolve => {
    let done = false;
    const timer = setTimeout(async () => {
      if (done) return;
      const hit = await caches.match('./index.html');
      if (hit){ done = true; resolve(hit); }
    }, timeout);
    fetch(req).then(res => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
      resolve(res);
    }).catch(async () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      const hit = await caches.match(req) || await caches.match('./index.html');
      resolve(hit || new Response('Офлайн', { status: 503, statusText: 'Offline' }));
    });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // чужие домены не трогаем

  if (req.mode === 'navigate'){
    e.respondWith(networkFirst(req));
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok){
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
