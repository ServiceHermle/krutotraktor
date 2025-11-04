const CACHE_VER = 'hdh-code-v2_7_9-soft';
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './service-worker.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VER).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VER).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname === '/' ) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE_VER);
        const cached = await cache.match('./index.html');
        return cached || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VER);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      if (req.method === 'GET' && (url.origin === location.origin)) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch(e) { return Response.error(); }
  })());
});
