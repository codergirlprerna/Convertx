const CACHE = 'convertx-v1';
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network first for API/CDN calls, cache first for static assets
  if (e.request.url.includes('unpkg.com') || e.request.url.includes('esm.sh')) {
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(e.request).then((cached) =>
          cached || fetch(e.request).then((res) => {
            c.put(e.request, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});