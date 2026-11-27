const CACHE = 'school-product-f8fd92ba3ca1';
const FILES = ["./assets/DM-Sans-OFL.txt","./assets/Scene-YLfg05RF.js","./assets/dm-sans-4oNDrrnO.woff2","./assets/dm-sans.woff2","./assets/index-CdZv61Rk.js","./assets/index-DmXzq7cW.css","./assets/product-mark.svg","./assets/screens/admin-transport.png","./assets/screens/boarding.png","./assets/screens/captures.json","./assets/screens/class-inbox.png","./assets/screens/gps-trackers.png","./assets/screens/network.png","./assets/screens/parent-boarding.png","./assets/screens/parent-bus.png","./assets/screens/parent-gps-hidden.png","./assets/screens/parent-inbox.png","./assets/screens/principal.png","./assets/screens/transport-allocations.png","./assets/screens/transport-cards.png","./assets/screens/transport-issues.png","./assets/screens/transport-privacy.png","./assets/screens/transport-reports.png","./assets/screens/transport-routes.png","./assets/screens/transport.png","./assets/screens/vice_principal.png","./assets/showcase-walkthrough.mp4","./assets/walkthrough-poster.jpg","./index.html","./portal/academic-portal-data.js","./portal/academic-portal.js","./portal/academic-scope.js","./portal/academic-seed.js","./portal/access.js","./portal/admin-data.js","./portal/app.js","./portal/assets/DM-Sans-OFL.txt","./portal/assets/colombo-map.webp","./portal/assets/dm-sans.woff2","./portal/assets/library-cover-art.webp","./portal/assets/product-mark.svg","./portal/boarding-data.js","./portal/boarding-seed.js","./portal/boarding.js","./portal/chairman-data.js","./portal/chairman.js","./portal/class-data.js","./portal/class-support.js","./portal/class-teacher.js","./portal/communications-data.js","./portal/communications.js","./portal/coordinator-data.js","./portal/data.js","./portal/family-portal.js","./portal/family-seed.js","./portal/fees-data.js","./portal/fees.js","./portal/gps-seed.js","./portal/grade-coordinator.js","./portal/grade-data.js","./portal/grade-support.js","./portal/icons.js","./portal/index.html","./portal/learning.js","./portal/library.js","./portal/management.js","./portal/map.js","./portal/network-analytics.js","./portal/network-data.js","./portal/network-fleet.js","./portal/network-map.js","./portal/network-routes.js","./portal/network-transport.js","./portal/network.js","./portal/notifications-data.js","./portal/parent-login.js","./portal/portal-controller.js","./portal/principal-data.js","./portal/principal.js","./portal/records.js","./portal/routes.js","./portal/school-admin.js","./portal/school-sample.js","./portal/section-data.js","./portal/section-head.js","./portal/sri-lanka-land.js","./portal/sri-lanka-roads.js","./portal/stores-data.js","./portal/stores-seed.js","./portal/stores.js","./portal/styles.css","./portal/subject-data.js","./portal/subject-support.js","./portal/subject-teacher.js","./portal/transport-coordinator.js","./portal/transport-privacy.js","./portal/transport-records.js","./portal/transport.js","./portal/ui.js","./portal/vendor/leaflet/LICENSE","./portal/vendor/leaflet/leaflet.css","./portal/vendor/leaflet/leaflet.js","./portal/vice-data.js","./portal/vice-principal.js","./"];
const SCOPE = new URL('./', self.location.href);
const isShowcase = url => url.origin === SCOPE.origin && url.pathname.startsWith(SCOPE.pathname);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(FILES.map(file => new Request(file, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter(key => key.startsWith('school-product-') && key !== CACHE);
    await Promise.all(old.map(key => caches.delete(key)));
    await self.clients.claim();
    if (!old.length) return;
    const windows = await self.clients.matchAll({ type: 'window' });
    for (const client of windows) {
      if (!isShowcase(new URL(client.url))) continue;
      // The page checks its current hash; do not wait for navigation during activation.
      client.postMessage({ type: 'SCHOOL_PRODUCT_UPDATED' });
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
