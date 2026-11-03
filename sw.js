// NOCIV service worker. Network first, so you always get the newest page and the newest data.
// It only keeps a copy of pages to show if the phone has no signal. It never touches
// Supabase, Stripe or any other site, only pages from nociv.co.
var CACHE = 'nociv-v1';
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
