/* Orbori service worker: shows the nightly reminder and opens the app when it's tapped. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Orbori', {
    body: d.body || 'Your check-in is waiting ✦',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'orbori-nightly',
    data: { url: d.url || '/today' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/today';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) { await c.navigate(url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(url);
  })());
});
