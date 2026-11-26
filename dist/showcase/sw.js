const CACHE = 'sussex-showcase-f509ff57e78a';
const FILES = ["./assets/DM-Sans-OFL.txt","./assets/Scene-C3t5V9DG.js","./assets/dm-sans-4oNDrrnO.woff2","./assets/dm-sans.woff2","./assets/favicon.png","./assets/index-DfYAqnCq.js","./assets/index-Dlqb-tzv.css","./assets/screens/admin-fees.png","./assets/screens/admin-transport.png","./assets/screens/admin-unpaid.png","./assets/screens/admin.png","./assets/screens/boarding.png","./assets/screens/book-requests.png","./assets/screens/captures.json","./assets/screens/chairman-academic.png","./assets/screens/chairman-attendance.png","./assets/screens/chairman-reports.png","./assets/screens/chairman-staffing.png","./assets/screens/class-attendance.png","./assets/screens/class-events.png","./assets/screens/class-inbox.png","./assets/screens/class-letters.png","./assets/screens/class-notices.png","./assets/screens/class-subjects.png","./assets/screens/class_teacher.png","./assets/screens/coordinator.png","./assets/screens/gps-trackers.png","./assets/screens/librarian.png","./assets/screens/network.png","./assets/screens/parent-boarding.png","./assets/screens/parent-books.png","./assets/screens/parent-bus.png","./assets/screens/parent-courses.png","./assets/screens/parent-events.png","./assets/screens/parent-family.png","./assets/screens/parent-fees.png","./assets/screens/parent-gps-hidden.png","./assets/screens/parent-homework.png","./assets/screens/parent-inbox.png","./assets/screens/parent-letters.png","./assets/screens/parent-notices.png","./assets/screens/parent-payment.png","./assets/screens/parent-ready.png","./assets/screens/parent-uniforms.png","./assets/screens/principal-attendance.png","./assets/screens/principal-reports.png","./assets/screens/principal.png","./assets/screens/section_head.png","./assets/screens/teacher-classes.png","./assets/screens/teacher-homework.png","./assets/screens/teacher-notes.png","./assets/screens/teacher.png","./assets/screens/transport-cards.png","./assets/screens/transport-privacy.png","./assets/screens/transport.png","./assets/screens/uniform-requests.png","./assets/screens/uniform_store.png","./assets/screens/vice_principal.png","./assets/showcase-walkthrough.mp4","./assets/sussex-college-network-logo.png","./assets/walkthrough-poster.jpg","./index.html","./"];
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
