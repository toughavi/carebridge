// CareBridge service worker: shows push notifications. It does not cache pages,
// so the newest version of the app always loads.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: 'CareBridge', body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || 'CareBridge', {
    body: data.body || '', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: data.tag || undefined
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window' }).then((list) => {
    for (const c of list) if ('focus' in c) return c.focus();
    return self.clients.openWindow('/');
  }));
});
