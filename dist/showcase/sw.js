const CACHE = 'sussex-showcase-5c5ed53ef66e';
const FILES = ["./assets/DM-Sans-OFL.txt","./assets/Scene-ygIMoitr.js","./assets/dm-sans-4oNDrrnO.woff2","./assets/dm-sans.woff2","./assets/favicon.png","./assets/index-CbhWeNGH.js","./assets/index-DUyFH1vt.css","./assets/screens/admin-transport.png","./assets/screens/boarding.png","./assets/screens/captures.json","./assets/screens/class-inbox.png","./assets/screens/gps-trackers.png","./assets/screens/network.png","./assets/screens/parent-boarding.png","./assets/screens/parent-bus.png","./assets/screens/parent-gps-hidden.png","./assets/screens/parent-inbox.png","./assets/screens/principal.png","./assets/screens/transport-allocations.png","./assets/screens/transport-cards.png","./assets/screens/transport-issues.png","./assets/screens/transport-privacy.png","./assets/screens/transport-reports.png","./assets/screens/transport-routes.png","./assets/screens/transport.png","./assets/screens/vice_principal.png","./assets/showcase-walkthrough.mp4","./assets/sussex-college-network-logo.png","./assets/walkthrough-poster.jpg","./index.html","./"];
const SCOPE = new URL('./', self.location.href);
const isShowcase = url => url.origin === SCOPE.origin && url.pathname.startsWith(SCOPE.pathname);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(FILES.map(file => new Request(file, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter(key => key.startsWith('sussex-showcase-') && key !== CACHE);
    await Promise.all(old.map(key => caches.delete(key)));
    await self.clients.claim();
    if (!old.length) return;
    const windows = await self.clients.matchAll({ type: 'window' });
    for (const client of windows) {
      if (!isShowcase(new URL(client.url))) continue;
      // The page checks its current hash; do not wait for navigation during activation.
      client.postMessage({ type: 'SUSSEX_SHOWCASE_UPDATED' });
    }
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !isShowcase(new URL(event.request.url))) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(new Request(event.request, { cache: 'no-store' }))
      .catch(async () => (await caches.open(CACHE)).match('./index.html')));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache =>
    await cache.match(event.request) || fetch(event.request)));
});
