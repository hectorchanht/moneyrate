/* Money Rate service worker — offline support.
 * - App navigations: network-first, fall back to the cached shell.
 * - Same-origin static assets (chunks, fonts, flags, icons): cache-first.
 * - Currency-rate API: stale-while-revalidate so rates work offline.
 */
const CACHE = 'moneyrate-v1';
const APP_SHELL = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function cachePut(request, response) {
  if (!response || !response.ok) return;
  caches.open(CACHE).then((c) => c.put(request, response)).catch(() => {});
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // App navigations: try the network, fall back to the cached shell offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => { cachePut(request, res.clone()); return res; })
        .catch(() => caches.match(request).then((r) => r || caches.match('/')))
    );
    return;
  }

  const isStatic =
    url.origin === self.location.origin &&
    (/\/_next\/static\//.test(url.pathname) ||
      /\/(?:country-flags|crypto-icons|vendor|img|fonts)\//.test(url.pathname) ||
      /\.(?:woff2?|png|svg|ico|css|js|webmanifest)$/.test(url.pathname));

  const isRateApi = /(?:^|\.)currency-api\.pages\.dev$/.test(url.hostname) || url.hostname === 'cdn.jsdelivr.net';

  // Static assets: cache-first.
  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then((res) => { cachePut(request, res.clone()); return res; })
      )
    );
    return;
  }

  // Currency-rate API: stale-while-revalidate.
  if (isRateApi) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => { cachePut(request, res.clone()); return res; })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
