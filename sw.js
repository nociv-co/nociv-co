// NOCIV service worker.
// Pages and data: network first, so you always get the newest. If there is no signal, you get the saved copy.
// Tools: every creator tool is saved on the phone when the app is added to the home screen, so they work with no signal.
// It never touches Supabase, Stripe or any other site, only files from nociv.co.
var CACHE = 'nociv-v69';
var TOOLS = [
  '/card/fonts/abrilfatface.woff',
  '/card/fonts/anton.woff',
  '/card/fonts/bagelfatone.woff',
  '/card/fonts/bungee.woff',
  '/card/fonts/shrikhand.woff',
  '/cut-sew/clothing-builder.html',
  '/cut-sew/crop.js',
  '/fonts/anton.woff',
  '/qr/qr.js',
  '/vendor/pdf-lib.min.js',
  '/zine/crop.js',
  '/zine/fonts/abrilfatface.woff',
  '/zine/fonts/anton.woff',
  '/zine/fonts/bungee.woff',
  '/zine/fonts/courierprime.woff',
  '/zine/fonts/permanentmarker.woff',
  '/zine/fonts/rocksalt.woff',
  '/zine/fonts/shrikhand.woff',
  '/zine/fonts/specialelite.woff',
  '/zine/pdfbook.js',
  '/zine/qr.js',
  '/zine/vendor/pdf-lib.min.js',
  '/zine/vendor/pdf.min.mjs',
  '/zine/vendor/pdf.worker.min.mjs',
  '/zine/',
  '/qr/',
  '/stencil/',
  '/pattern/',
  '/pattern/engine.js',
  '/pattern/block.js',
  '/pattern/letters.js',
  '/pattern/app.js',
  '/pattern/v2.js',
  '/pattern/classic.html',
  '/phone-animations/',
  '/phone-animations/character/',
  '/card/',
  '/creator-tools.html',
  '/style.css',
  '/crop.js',
  '/install-app.js',
  '/tool-help.js',
  '/supabase.js',
  '/header.webp',
  '/nav-about.png',
  '/nav-shop.png',
  '/nav-tools.png',
  '/base-button.webp',
  '/img/type/build-something.webp',
  '/img/tools/cartoon-card.webp',
  '/img/tools/cartoon-strip.webp',
  '/img/tools/stop-hero.webp',
  '/img/tools/vhs.webp',
  '/img/tools/video-hero.webp',
  '/img/signifier-mural.webp',
  '/icons/shop-192.png'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.add('/offline.html').then(function () {
      // Save the tools. One missing file must not stop the rest, so each one is tried alone.
      return Promise.all(TOOLS.map(function (u) { return fetch(u, { cache: 'reload' }).then(function (r) { if (r && r.ok) return c.put(u, r); }).catch(function () {}); }));
    });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
function keepable(r) { var d = r.destination; return r.mode === 'navigate' || d === 'script' || d === 'style' || d === 'font' || d === 'image' || d === 'document' || d === 'iframe' || d === 'worker' || d === ''; }
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.indexOf('/functions/') === 0 || r.headers.has('range')) return;
  var saved = function () { return caches.match(r, { ignoreSearch: true }); };
  // Pictures and fonts: show the saved copy right away, refresh it quietly for next time.
  var d = r.destination;
  if (d === 'image' || d === 'font') {
    e.respondWith(saved().then(function (hit) {
      var net = fetch(r).then(function (res) { if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r.url.split('#')[0], copy); }); } return res; }).catch(function () { return hit || Response.error(); });
      if (hit) { e.waitUntil(net.catch(function () {})); return hit; }
      return net;
    }));
    return;
  }
  // Pages, code and styles: newest copy first. Weak signal: after 3 seconds, show the saved copy if there is one.
  e.respondWith(new Promise(function (resolve) {
    var done = false;
    var t = setTimeout(function () { saved().then(function (hit) { if (hit && !done) { done = true; resolve(hit); } }); }, 3000);
    fetch(r).then(function (res) {
      clearTimeout(t);
      if (res && res.ok && keepable(r)) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r.url.split('#')[0], copy); }); }
      if (!done) { done = true; resolve(res); }
    }).catch(function () {
      clearTimeout(t);
      saved().then(function (hit) { if (!done) { done = true; resolve(hit || (r.mode === 'navigate' ? caches.match('/offline.html') : Response.error())); } });
    });
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
