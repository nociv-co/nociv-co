// Case Zero offline workshop mode. Network first (always the newest), the saved copy when there is no signal.
// Only same-site GETs; ?v= version tags are ignored when matching, so a saved file still answers.
var CACHE = 'cz-build-v1';
var CORE = ['./', './index.html', './builder.js', './parts.js', './geo.js', './wiring.js', './capture.js', './manifest.json'];
var MORE = ['./board.js', './char3d.js', './charm_carabiner_hook.js', '/vendor/clipper/clipper.js', '/vendor/three/three.module.js', '/vendor/three/three.core.js', '/vendor/three/OrbitControls.js', '/icons/shop-192.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.concat(MORE).map(function (u) { return fetch(u, { cache: 'reload' }).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('cz-build-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || r.headers.has('range')) return;
  e.respondWith(fetch(r).then(function (res) {
    if (res && res.ok && res.type === 'basic') { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(u.origin + u.pathname, copy); }); }
    return res;
  }).catch(function () {
    return caches.match(r, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      if (r.mode === 'navigate') return caches.match('./index.html', { ignoreSearch: true });
      return Response.error();
    });
  }));
});
