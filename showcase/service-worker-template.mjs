export function serviceWorkerSource(version, files) {
  return `const CACHE = 'sussex-showcase-${version}';
const FILES = ${JSON.stringify(files)};
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
`;
}
