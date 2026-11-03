// NOCIV service worker. Network first, so you always get the newest page and the newest data.
// It only keeps a copy of pages to show if the phone has no signal. It never touches
// Supabase, Stripe or any other site, only pages from nociv.co.
var CACHE = 'nociv-v2';
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.add('/offline.html'); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/functions/') === 0) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok && r.mode === 'navigate') { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (hit) { return hit || (r.mode === 'navigate' ? caches.match('/offline.html') : Response.error()); });
  }));
});

// Pop-up shop alerts. A notification only shows for phones that opted in from the shop app.
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'NOCIV.CO', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'NOCIV.CO', {
    body: d.body || '', icon: '/icons/shop-192.png', badge: '/icons/shop-192.png', data: { url: d.url || '/' }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  if (url.charAt(0) !== '/') url = '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) { list[i].navigate(url); return list[i].focus(); } }
    return self.clients.openWindow(url);
  }));
});
