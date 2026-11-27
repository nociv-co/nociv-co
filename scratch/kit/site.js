/* From Scratch site engine. Free to use, change and share (MIT).
   Reads site.json and draws the whole site. No accounts, no tracking. */
(function () {
'use strict';

var FONTS = {
  clean:     ['system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif', 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif'],
  editorial: ['"FS Fraunces","Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif', 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'],
  poster:    ['Impact,Haettenschweiler,"Arial Narrow Bold","Franklin Gothic Bold",sans-serif', 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'],
  type:      ['"FS IBM Plex Mono",ui-monospace,"SF Mono",Menlo,Consolas,"Courier New",monospace', 'ui-monospace,"SF Mono",Menlo,Consolas,"Courier New",monospace'],
  soft:      ['"FS Nunito",ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold",system-ui,sans-serif', 'ui-rounded,"SF Pro Rounded",system-ui,sans-serif'],
  grotesk:   ['"FS Inter Tight","Helvetica Neue","Arial Black",Arial,sans-serif', '"Helvetica Neue",Arial,sans-serif'],
  didone:    ['"FS DM Serif Display",Didot,"Bodoni 72",Georgia,serif', 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'],
  slab:      ['"FS Roboto Slab",Rockwell,"Rockwell Extra Bold","Roboto Slab","Courier New",serif', 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'],
  condensed: ['"FS Barlow Condensed","Avenir Next Condensed","Arial Narrow","Roboto Condensed","Helvetica Neue",sans-serif', '"Avenir Next","Avenir",system-ui,sans-serif'],
  humanist:  ['"FS Tenor Sans",Optima,Candara,"Gill Sans","Noto Sans",sans-serif', 'Optima,Candara,"Gill Sans","Noto Sans",sans-serif'],
  marker:    ['"FS Permanent Marker","Marker Felt","Chalkboard SE",sans-serif', 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'],
  space:     ['"FS Space Grotesk",system-ui,sans-serif', '"FS Space Grotesk",system-ui,sans-serif'],
  block:     ['"FS Archivo Black","Arial Black",sans-serif', 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'],
  gallery:   ['"FS Syne","Helvetica Neue",sans-serif', 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'],
  bricolage: ['"FS Bricolage","Helvetica Neue",sans-serif', 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'],
  journal:   ['"FS Instrument Serif",Georgia,serif', 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'],
  typed:     ['"FS Special Elite","Courier New",monospace', '"FS Special Elite","Courier New",monospace'],
  mono:      ['"FS Rubik Mono One",ui-monospace,monospace', 'ui-monospace,"SF Mono",Menlo,Consolas,monospace']
};
var RADIUS = { sharp: '0px', soft: '10px', round: '22px' };
var ICONS = {
  home:  '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  grid:  '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  bag:   '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
  page:  '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7M9 8h3"/>',
  link:  '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
  mail:  '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/>',
  star:  '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/>',
  user:  '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  play:  '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>',
  more:  '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
};
var TYPE_ICON = { home: 'home', grid: 'grid', page: 'page', gallery: 'image', links: 'link', contact: 'mail', log: 'page', finds: 'star', tracks: 'play' };
var LISTY = { grid: 1, log: 1, finds: 1, tracks: 1 };

var S = null, IMG = {}, lastIndex = 0, booted = false;
var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function $(s, el) { return (el || document).querySelector(s); }
function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function src(p) { return IMG[p] || p; }
function icon(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || ICONS.star) + '</svg>'; }

function hex(h) { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function lum(h) { var w = [0.2126, 0.7152, 0.0722]; return hex(h).reduce(function (a, v, i) { v /= 255; v = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); return a + v * w[i]; }, 0); }
function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function mix(a, b, t) { var A = hex(a), B = hex(b); return '#' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0'); }).join(''); }
function onColor(bg) { return contrast(bg, '#000000') >= contrast(bg, '#ffffff') ? '#000000' : '#ffffff'; }

function slug(s) { return String(s || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page'; }
function tabs() { return (S.tabs || []).filter(function (t) { return !t.hidden; }); }
function slugs() { var seen = {}; return tabs().map(function (t) { var s = slug(t.name), b = s, n = 2; while (seen[s]) s = b + '-' + n++; seen[s] = 1; return s; }); }

function money(p) {
  if (p === '' || p == null) return '';
  var n = Number(String(p).replace(/[^0-9.]/g, ''));
  if (!isFinite(n) || String(p).replace(/[^0-9.]/g, '') === '') return esc(p);
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: (S.shop && S.shop.currency) || 'USD' }).format(n); }
  catch (e) { return '$' + n.toFixed(2); }
}

/* ---------- placeholder art when there is no photo yet ---------- */
function ph(label) {
  var c = S.style || {};
  var a = c.accent || '#888', t = c.text || '#111', b = mix(c.bg || '#fff', t, 0.08);
  var r = { sharp: 0, soft: 8, round: 22 }[c.corner]; if (r == null) r = 8;
  /* a quiet picture frame: border, hills and a sun in the accent color */
  return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="' + b + '"/>' +
    '<g fill="none" stroke="' + t + '" stroke-opacity=".3" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"><rect x="130" y="140" width="140" height="120" rx="' + r + '"/><path d="M144 246l40-42 30 28 20-18 24 32"/></g>' +
    '<circle cx="238" cy="176" r="11" fill="' + a + '"/></svg>');
}
function pic(it, cls) {
  var p = it.images && it.images[0];
  return '<img class="' + (cls || '') + '" src="' + esc(p ? src(p) : ph(it.title)) + '" alt="' + esc(it.alt || it.title || '') + '" loading="lazy" decoding="async">';
}

/* ---------- style ---------- */
function applyStyle() {
  var c = S.style || {};
  var bg = c.bg || '#ffffff', tx = c.text || '#111111', ac = c.accent || '#111111';
  var f = FONTS[c.font] || FONTS.clean, cf = c.customFont, fs = $('#fs-cf');
  if (c.font === 'custom' && cf && cf.key) {
    if (!fs) { fs = document.createElement('style'); fs.id = 'fs-cf'; document.head.appendChild(fs); }
    var fmt = { woff2: 'woff2', woff: 'woff', ttf: 'truetype' }[String(cf.key).split('.').pop()] || 'woff2';
    fs.textContent = '@font-face{font-family:"FS Custom";src:url("' + src(cf.key) + '") format("' + fmt + '");font-display:swap}';
    f = ['"FS Custom",system-ui,sans-serif', '"FS Custom",system-ui,sans-serif'];
  } else if (fs) fs.textContent = '';
  var r = document.documentElement.style;
  r.setProperty('--bg', bg); r.setProperty('--tx', tx); r.setProperty('--ac', ac);
  r.setProperty('--acx', onColor(ac));
  r.setProperty('--tex', mix(bg, tx, 0.09));
  r.setProperty('--sf', mix(bg, tx, 0.05)); r.setProperty('--line', mix(bg, tx, 0.16)); r.setProperty('--mute', mix(tx, bg, 0.38));
  r.setProperty('--hf', f[0]); r.setProperty('--bf', f[1]);
  r.setProperty('--r', RADIUS[c.corner] || RADIUS.soft);
  var b = document.body;
  b.className = ['nav-' + (c.nav || 'tabs'), 'm-' + (reduce ? 'none' : (c.motion || 'fade')), 'f-' + (c.font || 'clean'), 'd-' + (c.density || 'comfy'),
    'h-' + (c.header || 'left'), 'g-' + (c.layout || 'grid'), 'p-' + (c.photo || 'square'), 'base-' + (S.base || 'shop'),
    'b-' + (c.btn || 'solid'), 'c-' + (c.case || 'normal'), 't-' + (c.tex || 'none'), 'k-' + (c.card || 'plain'), 'ic-' + (c.icons || 'line')].join(' ');
  var tc = $('meta[name="theme-color"]'); if (tc) tc.setAttribute('content', bg);
}

/* ---------- shell ---------- */
function brand() {
  var logo = S.logo ? '<img class="logo" src="' + esc(src(S.logo)) + '" alt="">' : '';
  return '<a class="brand" href="#/">' + logo + '<span class="brand-name">' + esc(S.name || 'Your Name') + '</span></a>';
}
function navLinks(cls) {
  var sl = slugs();
  return tabs().map(function (t, i) {
    return '<a class="' + cls + '" href="#/' + sl[i] + '" data-i="' + i + '">' + (cls === 'bt' ? icon(t.icon || TYPE_ICON[t.type]) : '') + '<span>' + esc(t.name) + '</span></a>';
  }).join('');
}
function shell() {
  var c = S.style || {}, nav = c.nav || 'tabs', h = '';
  h += '<a class="skip" href="#main">Skip to content</a>';
  if (S.notice) h += '<div class="notice">' + esc(S.notice) + '</div>';
  h += '<header class="hd"><div class="hd-in">' + brand();
  if (nav === 'tabs' || nav === 'side') h += '<nav class="toptabs" aria-label="Main">' + navLinks('tt') + '</nav>';
  if (nav === 'menu') h += '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="panel"><span class="burger" aria-hidden="true"><i></i><i></i><i></i></span><span>Menu</span></button>';
  h += '</div>';
  if (S.tagline && (c.header === 'stack')) h += '<p class="tagline">' + esc(S.tagline) + '</p>';
  h += '</header>';
  if (nav === 'menu' || nav === 'bottom') h += '<div class="panel" id="panel" hidden><nav class="panel-in" aria-label="Main">' + navLinks('pl') + '</nav></div>';
  h += '<div class="body">';
  if (nav === 'side') h += '<aside class="rail"><nav aria-label="Main">' + navLinks('rl') + '</nav></aside>';
  h += '<main id="main" class="view" tabindex="-1"></main></div>';
  h += '<footer class="ft"><div>' + esc(S.footer || ('© ' + new Date().getFullYear() + ' ' + (S.name || ''))) + (S.remixFrom ? '<br><small>Remixed from ' + esc(S.remixFrom) + '</small>' : '') + '</div>' +
    (S.email ? '<a href="mailto:' + esc(S.email) + '">' + esc(S.email) + '</a>' : '') + '</footer>';
  if (nav === 'bottom') {
    var all = tabs(), sl = slugs(), max = all.length > 5 ? 4 : all.length, bh = '';
    for (var i = 0; i < max; i++) bh += '<a class="bt" href="#/' + sl[i] + '" data-i="' + i + '">' + icon(all[i].icon || TYPE_ICON[all[i].type]) + '<span>' + esc(all[i].name) + '</span></a>';
    if (all.length > 5) bh += '<button class="bt more" type="button" aria-expanded="false" aria-controls="panel">' + icon('more') + '<span>More</span></button>';
    h += '<nav class="bottom" aria-label="Main">' + bh + '</nav>';
  }
  h += '<div class="lb" hidden role="dialog" aria-modal="true" aria-label="Photo"><button class="lb-x" type="button" aria-label="Close">×</button><button class="lb-p" type="button" aria-label="Previous">‹</button><img alt=""><button class="lb-n" type="button" aria-label="Next">›</button><p class="lb-c"></p></div>';
  $('#site').innerHTML = h;
}

/* ---------- routing ---------- */
function route() {
  var parts = (location.hash || '#/').replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  var sl = slugs(), i = parts[0] ? sl.indexOf(parts[0]) : 0;
  if (i < 0) i = -1;
  return { i: i, tab: tabs()[i], item: parts[1] || null, tag: parts[2] || null };
}
function href(i, item) { return '#/' + slugs()[i] + (item ? '/' + encodeURIComponent(item) : ''); }

/* ---------- shared blocks: link lists, slideshows, video, tags ---------- */
function isOut(u) { return /^(https?:|mailto:|tel:)/i.test(u || ''); }
function linkList(list, cls) {
  list = (list || []).filter(function (x) { return x && (x.title || x.url || x.buy); });
  if (!list.length) return '';
  return '<div class="links' + (cls ? ' ' + cls : '') + '">' + list.map(function (x) {
    var u = x.url || x.buy || '#', im = x.image || (x.images && x.images[0]), st = x.style || (im ? 'thumb' : 'button');
    var tx = '<span class="lnk-tx"><b>' + esc(x.title || via(u) || 'Link') + '</b>' + (x.sub ? '<small>' + esc(x.sub) + '</small>' : '') + '</span>';
    return '<a class="lnk lnk-' + st + '" href="' + esc(u) + '"' + (isOut(u) && !/^mailto:|^tel:/i.test(u) ? ' target="_blank" rel="noopener"' : '') + '>' +
      (st === 'thumb' ? '<span class="lnk-img">' + (im ? '<img src="' + esc(src(im)) + '" alt="" loading="lazy">' : icon('link')) + '</span>' : '') + tx + '<i aria-hidden="true">' + (isOut(u) ? '↗' : '›') + '</i></a>';
  }).join('') + '</div>';
}
function slides(list, cls) {
  list = list.filter(function (x) { return x.p; });
  if (!list.length) return '';
  var one = list.length < 2;
  return '<div class="ss ' + (cls || '') + '" data-n="' + list.length + '">' + list.map(function (x, k) {
    return '<figure class="ss-s' + (k ? '' : ' on') + '"><img src="' + esc(src(x.p)) + '" alt="' + esc(x.c || '') + '"' + (k ? ' loading="lazy"' : '') + '>' + (x.c && cls !== 'hero-img' ? '<figcaption>' + esc(x.c) + '</figcaption>' : '') + '</figure>';
  }).join('') + (one ? '' : '<button type="button" class="ss-p" aria-label="Previous photo">‹</button><button type="button" class="ss-n" aria-label="Next photo">›</button><div class="ss-dots">' +
    list.map(function (x, k) { return '<button type="button" class="' + (k ? '' : 'on') + '" data-k="' + k + '" aria-label="Photo ' + (k + 1) + '"></button>'; }).join('') + '</div>') + '</div>';
}
function video(v) {
  if (!v) return '';
  var m = String(v).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/))([\w-]{6,})/i);
  if (m) return '<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/' + m[1] + '" title="Video" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>';
  m = String(v).match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return '<div class="vid"><iframe src="https://player.vimeo.com/video/' + m[1] + '" title="Video" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
  return '<div class="vid vid-f"><video src="' + esc(src(v)) + '" controls playsinline preload="metadata"></video></div>';
}
var FUL = { ready: 'Ready to ship', store: 'Made in store', custom: 'Custom order', digital: 'Digital' };
function itemTags(it) { var o = []; (it.tags || []).concat(it.tag ? [it.tag] : []).forEach(function (g) { g = String(g).trim(); if (g && o.indexOf(g) < 0) o.push(g); }); return o; }
function filters(it) { var o = itemTags(it); if (FUL[it.ful]) o.push(FUL[it.ful]); return o; }
function isLinktree() { return (S.style || {}).layout === 'links'; }

/* ---------- views ---------- */
function intro(t) { return (t.intro ? '<p class="intro">' + esc(t.intro).replace(/\n/g, '<br>') + '</p>' : ''); }
function head(t) { return '<h1 class="ttl">' + esc(t.name) + '</h1>' + intro(t); }

function vHome(t, r) {
  var pics = [t.image].concat(t.images || []).filter(Boolean).map(function (p) { return { p: p }; });
  var bt = '';
  if (t.button && t.buttonTo === -1 && isOut(t.buttonUrl)) bt = '<a class="btn" href="' + esc(t.buttonUrl) + '" target="_blank" rel="noopener">' + esc(t.button) + '</a>';
  else if (t.button && t.buttonTo != null && t.buttonTo >= 0 && tabs()[t.buttonTo]) bt = '<a class="btn" href="' + href(t.buttonTo) + '">' + esc(t.button) + '</a>';
  var tx = '<h1 class="hero-h">' + esc(t.headline || S.name || '') + '</h1>' + ((t.intro || S.tagline) ? '<p class="hero-p">' + esc(t.intro || S.tagline) + '</p>' : '') + bt;
  if (isLinktree()) {
    /* Linktree: profile on top, then one stacked list of links, pages and items */
    var av = S.logo || (pics[0] && pics[0].p);
    var h0 = '<section class="prof">' + (av ? '<img class="prof-av" src="' + esc(src(av)) + '" alt="">' : '') + '<div class="hero-tx">' + tx + '</div></section>' + video(t.video) + linkList(t.links);
    var sl0 = slugs(), pages = [];
    tabs().forEach(function (o, i) {
      if (i === r.i) return;
      var cover = (o.items && o.items[0] && o.items[0].images && o.items[0].images[0]) || o.image;
      pages.push({ title: o.name, sub: o.intro ? firstLine(o.intro, 60) : '', url: '#/' + sl0[i], image: cover, style: 'thumb' });
    });
    return h0 + linkList(pages, 'links-pages');
  }
  var h = '<section class="hero">' + (pics.length > 1 ? slides(pics, 'hero-img') : pics.length ? '<img class="hero-img" src="' + esc(src(pics[0].p)) + '" alt="">' : '') +
    '<div class="hero-tx">' + tx + '</div></section>' + video(t.video) + linkList(t.links);
  var sl = slugs(), tiles = '';
  tabs().forEach(function (o, i) {
    if (i === r.i) return;
    var cover = (o.items && o.items[0] && o.items[0].images && o.items[0].images[0]) || o.image;
    tiles += '<a class="tile" href="#/' + sl[i] + '">' + (cover ? '<img src="' + esc(src(cover)) + '" alt="" loading="lazy">' : '<span class="tile-ic">' + icon(o.icon || TYPE_ICON[o.type]) + '</span>') +
      '<span class="tile-n">' + esc(o.name) + '</span></a>';
  });
  if (tiles) h += '<section class="tiles">' + tiles + '</section>';
  var g = -1; tabs().some(function (o, i) { if (o.type === 'grid' && o.items && o.items.length) { g = i; return true; } return false; });
  if (g >= 0) h += '<section class="feat"><div class="row-h"><h2>' + esc(tabs()[g].name) + '</h2><a href="' + href(g) + '">See all</a></div>' + cards(tabs()[g], g, tabs()[g].items.slice(0, 4)) + '</section>';
  return h;
}

function cards(t, ti, list) {
  return '<div class="cards">' + list.map(function (it) {
    return '<a class="card' + (it.soldout ? ' is-out' : '') + (it.size === 'wide' || it.size === 'tall' ? ' sz-' + it.size : '') + '" href="' + href(ti, it.id) + '"><span class="card-img">' + pic(it) +
      (it.soldout ? '<b class="badge">Sold out</b>' : (it.badge ? '<b class="badge">' + esc(it.badge) + '</b>' : '')) + '</span>' +
      '<span class="card-t">' + esc(it.title || 'Untitled') + '</span>' +
      (it.price ? '<span class="card-p">' + money(it.price) + '</span>' : (itemTags(it)[0] ? '<span class="card-p">' + esc(itemTags(it)[0]) + '</span>' : '')) + (FUL[it.ful] ? '<span class="card-f">' + FUL[it.ful] + '</span>' : '') + '</a>';
  }).join('') + '</div>';
}

function vGrid(t, r) {
  var items = t.items || [];
  var tags = []; items.forEach(function (it) { filters(it).forEach(function (g) { if (tags.indexOf(g) < 0) tags.push(g); }); });
  var tag = r.tag, list = tag ? items.filter(function (it) { return filters(it).indexOf(tag) >= 0; }) : items;
  var h = head(t);
  if (tags.length > 1) {
    h += '<div class="chips" role="group" aria-label="Filter"><a class="chip' + (tag ? '' : ' on') + '" href="' + href(r.i) + '">All</a>' +
      tags.map(function (g) { return '<a class="chip' + (g === tag ? ' on' : '') + '" href="' + href(r.i) + '/~/' + encodeURIComponent(g) + '">' + esc(g) + '</a>'; }).join('') + '</div>';
  }
  if (!list.length) return h + '<p class="empty">Nothing here yet.</p>';
  return h + cards(t, r.i, list);
}

function vItem(t, r) {
  var it = (t.items || []).filter(function (x) { return x.id === r.item; })[0];
  if (!it) return vMissing();
  var imgs = (it.images && it.images.length) ? it.images : [null];
  var g = '<div class="gal"><div class="gal-main">' + imgs.map(function (p, k) {
    return '<button type="button" class="gal-slide" data-k="' + k + '" aria-label="Open photo ' + (k + 1) + '"><img src="' + esc(p ? src(p) : ph(it.title)) + '" alt="' + esc((it.title || '') + (imgs.length > 1 ? ' photo ' + (k + 1) : '')) + '"' + (k ? ' loading="lazy"' : '') + '></button>';
  }).join('') + '</div>';
  if (imgs.length > 1) g += '<div class="gal-th">' + imgs.map(function (p, k) { return '<button type="button" data-k="' + k + '" class="' + (k ? '' : 'on') + '" aria-label="Photo ' + (k + 1) + '"><img src="' + esc(src(p)) + '" alt="" loading="lazy"></button>'; }).join('') + '</div>';
  g += '</div>';
  var buy;
  if (it.soldout) buy = '<span class="btn is-off" aria-disabled="true">Sold out</span>';
  else if (it.buy) buy = '<a class="btn" href="' + esc(it.buy) + '" target="_blank" rel="noopener">' + esc(it.cta || (it.price ? 'Buy' : t.type === 'finds' ? 'See it' : 'Open')) + '</a>';
  else if (S.email && t.type !== 'log') buy = '<a class="btn ghost" href="mailto:' + esc(S.email) + '?subject=' + encodeURIComponent(it.title || '') + '">Ask about this</a>';
  else buy = '';
  var sh = S.shop || {}, more = '';
  if (it.price || it.buy) {
    if (sh.shipping) more += '<details open><summary>Shipping</summary><p>' + esc(sh.shipping).replace(/\n/g, '<br>') + '</p></details>';
    if (sh.returns) more += '<details><summary>Returns</summary><p>' + esc(sh.returns).replace(/\n/g, '<br>') + '</p></details>';
  }
  return '<a class="back" href="' + href(r.i) + '">‹ ' + esc(t.name) + '</a><article class="item">' + g +
    '<div class="item-tx">' + (it.date ? '<p class="item-tag">' + day(it.date) + '</p>' : '') + '<h1 class="ttl">' + esc(it.title || 'Untitled') + '</h1>' +
    (it.audio ? '<div class="trk trk-one"><button type="button" class="trk-play" data-audio="' + esc(src(it.audio)) + '" aria-label="Play">' + PLAY + '</button><span class="trk-tx"><b>Preview</b></span><i class="trk-bar" aria-hidden="true"><i></i></i></div>' : '') +
    (t.type === 'finds' && via(it.buy) ? '<p class="item-tag">via ' + esc(via(it.buy)) + '</p>' : '') +
    (it.price ? '<p class="item-p">' + money(it.price) + '</p>' : '') + (filters(it).length ? '<p class="item-tag">' + filters(it).map(esc).join(' \u00b7 ') + '</p>' : '') +
    (buy ? '<div class="buybar">' + buy + '</div>' : '') +
    video(it.video) + (it.text ? '<div class="prose">' + para(it.text) + '</div>' : '') + more + '</div></article>';
}

function para(s) {
  return String(s || '').split(/\n\s*\n/).map(function (b) {
    b = b.trim(); if (!b) return '';
    if (/^#\s/.test(b)) return '<h2>' + esc(b.replace(/^#\s+/, '')) + '</h2>';
    return '<p>' + esc(b).replace(/\n/g, '<br>') + '</p>';
  }).join('');
}

function vPage(t) {
  return (t.image ? '<img class="page-img" src="' + esc(src(t.image)) + '" alt="">' : '') + video(t.video) + '<h1 class="ttl">' + esc(t.name) + '</h1><div class="prose">' + para(t.body || t.intro) + '</div>' + linkList(t.links);
}

function vGallery(t) {
  var items = t.items || [];
  if (t.mode === 'slideshow' && items.length) return head(t) + slides(items.map(function (x) { return { p: (x.images && x.images[0]) || ph(x.title), c: x.title }; }), 'ss-box');
  return head(t) + (items.length ? '<div class="masonry">' + items.map(function (it, k) {
    return '<button type="button" class="m-it" data-k="' + k + '">' + pic(it) + (it.title ? '<span>' + esc(it.title) + '</span>' : '') + '</button>';
  }).join('') + '</div>' : '<p class="empty">Nothing here yet.</p>');
}

function vLinks(t) {
  return head(t) + (linkList(t.items) || '<p class="empty">No links yet.</p>');
}

function vContact(t) {
  var em = t.email || S.email;
  return head(t) + (t.body ? '<div class="prose">' + para(t.body) + '</div>' : '') +
    (em ? '<a class="btn" href="mailto:' + esc(em) + '">Email ' + esc(em) + '</a>' : '<p class="empty">Add your email in Info.</p>');
}

/* ---------- Archive versions: Log (dated entries), Finds (curated links), Tracks (play button + buy) ---------- */
function day(d) { if (!d) return ''; var x = new Date(d + 'T12:00:00'); return isNaN(x) ? esc(d) : x.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
function via(u) { var m = String(u || '').match(/^https?:\/\/(?:www\.)?([^\/?#]+)/i); return m ? m[1] : ''; }
function firstLine(t, n) { t = String(t || '').split(/\n/)[0]; return t.length > n ? t.slice(0, n - 1) + '...' : t; }
var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="pl" d="M8 5l12 7-12 7z"/><path class="pa" d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
function vLog(t, r) {
  var items = (t.items || []).slice().sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
  if (!items.length) return head(t) + '<p class="empty">No entries yet.</p>';
  return head(t) + '<p class="log-n">' + items.length + ' entr' + (items.length === 1 ? 'y' : 'ies') + '</p><ol class="log">' + items.map(function (it) {
    var p = it.images && it.images[0];
    return '<li><a class="log-e" href="' + href(r.i, it.id) + '"><time class="log-d" datetime="' + esc(it.date || '') + '">' + day(it.date) + '</time><span class="log-b"><b class="log-t">' + esc(it.title || 'Untitled') + '</b>' +
      (it.text ? '<span class="log-x">' + esc(firstLine(it.text, 160)) + '</span>' : '') + (p ? '<img src="' + esc(src(p)) + '" alt="" loading="lazy">' : '') + '</span></a></li>';
  }).join('') + '</ol>';
}
function vFinds(t, r) {
  var items = t.items || [];
  if (!items.length) return head(t) + '<p class="empty">Nothing found yet.</p>';
  return head(t) + '<div class="finds">' + items.map(function (it, k) {
    return '<a class="find" href="' + href(r.i, it.id) + '"><span class="find-n">' + String(k + 1).padStart(2, '0') + '</span><span class="find-img">' + pic(it) + '</span><b class="find-t">' + esc(it.title || 'Untitled') + '</b>' +
      (it.text ? '<span class="find-x">' + esc(firstLine(it.text, 110)) + '</span>' : '') + (via(it.buy) ? '<span class="find-v">via ' + esc(via(it.buy)) + ' &#8599;</span>' : '') + '</a>';
  }).join('') + '</div>';
}
function vTracks(t, r) {
  var items = t.items || [];
  if (!items.length) return head(t) + '<p class="empty">Nothing here yet.</p>';
  return head(t) + '<div class="tracks">' + items.map(function (it, k) {
    var p = it.images && it.images[0];
    return '<div class="trk">' + (it.audio ? '<button type="button" class="trk-play" data-audio="' + esc(src(it.audio)) + '" aria-label="Play ' + esc(it.title || 'track') + '">' + PLAY + '</button>' : '<span class="trk-play is-off" title="No preview">' + PLAY + '</span>') +
      (p ? '<img class="trk-art" src="' + esc(src(p)) + '" alt="" loading="lazy">' : '') +
      '<a class="trk-tx" href="' + href(r.i, it.id) + '"><b>' + esc(it.title || 'Untitled') + '</b><small>' + esc([itemTags(it).join(', '), firstLine(it.text, 60)].filter(Boolean).join(' \u00b7 ')) + '</small></a>' +
      (it.price && (!it.buy || it.soldout) ? '<span class="trk-p">' + money(it.price) + '</span>' : '') +
      (it.soldout ? '<span class="btn is-off trk-buy">Sold</span>' : it.buy ? '<a class="btn trk-buy" href="' + esc(it.buy) + '" target="_blank" rel="noopener">' + esc(it.cta || (it.price ? 'Buy' : 'Get')) + (it.price ? ' ' + money(it.price) : '') + '</a>' : '') +
      '<i class="trk-bar" aria-hidden="true"><i></i></i></div>';
  }).join('') + '</div>';
}
var AUD = null, AUDB = null;
function playToggle(b) {
  if (!AUD) { AUD = new Audio(); AUD.addEventListener('timeupdate', function () { if (!AUDB) return; var bar = AUDB.closest('.trk, .item'); var f = bar && $('.trk-bar i', bar); if (f) f.style.width = (AUD.duration ? AUD.currentTime / AUD.duration * 100 : 0) + '%'; }); AUD.addEventListener('ended', function () { if (AUDB) AUDB.classList.remove('on'); AUDB = null; }); }
  if (AUDB === b && !AUD.paused) { AUD.pause(); b.classList.remove('on'); return; }
  if (AUDB && AUDB !== b) AUDB.classList.remove('on');
  if (AUDB !== b) { AUD.src = b.getAttribute('data-audio'); }
  AUDB = b; AUD.play().then(function () { b.classList.add('on'); }).catch(function () { b.classList.remove('on'); });
}

function vMissing() { return '<h1 class="ttl">Not found</h1><p class="intro">That page moved or never existed.</p><a class="btn" href="#/">Go home</a>'; }

function render(r) {
  if (!r.tab) return vMissing();
  if (r.item && r.item !== '~' && LISTY[r.tab.type]) return vItem(r.tab, r);
  switch (r.tab.type) {
    case 'home': return vHome(r.tab, r);
    case 'grid': return vGrid(r.tab, r);
    case 'page': return vPage(r.tab);
    case 'gallery': return vGallery(r.tab);
    case 'links': return vLinks(r.tab);
    case 'contact': return vContact(r.tab);
    case 'log': return vLog(r.tab, r);
    case 'finds': return vFinds(r.tab, r);
    case 'tracks': return vTracks(r.tab, r);
  }
  return vMissing();
}

/* ---------- motion + wiring ---------- */
var busy = null;
function go(first) {
  var r = route(), v = $('#main');
  if (r.item === '~') r.item = null;
  $$('[data-i]').forEach(function (a) { var on = +a.getAttribute('data-i') === r.i; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  document.title = (r.tab && r.tab.type !== 'home' ? r.tab.name + ' | ' : '') + (S.name || '');
  closePanel();
  var html = render(r);
  var dir = r.i >= lastIndex ? 1 : -1; lastIndex = r.i;
  var m = (S.style && S.style.motion) || 'fade';
  function put() { v.innerHTML = html; wire(v, r); if (!first) { window.scrollTo(0, 0); v.focus({ preventScroll: true }); } }
  clearTimeout(busy);
  if (first || m === 'none' || reduce) { put(); return; }
  v.style.setProperty('--dir', dir);
  v.classList.add('out');
  busy = setTimeout(function () {
    put(); v.classList.remove('out'); v.classList.add('in');
    requestAnimationFrame(function () { requestAnimationFrame(function () { v.classList.remove('in'); }); });
  }, 150);
}

function wire(v, r) {
  var main = $('.gal-main', v);
  if (main) {
    var th = $$('.gal-th button', v);
    th.forEach(function (b) { b.onclick = function () { var k = +b.dataset.k; main.scrollTo({ left: main.clientWidth * k, behavior: reduce ? 'auto' : 'smooth' }); }; });
    main.addEventListener('scroll', function () { var k = Math.round(main.scrollLeft / Math.max(1, main.clientWidth)); th.forEach(function (b, j) { b.classList.toggle('on', j === k); }); }, { passive: true });
    var it = (r.tab.items || []).filter(function (x) { return x.id === r.item; })[0];
    $$('.gal-slide', v).forEach(function (b) { b.onclick = function () { if (it && it.images && it.images.length) lightbox(it.images.map(function (p) { return { p: p, c: it.title }; }), +b.dataset.k); }; });
  }
  $$('.ss', v).forEach(function (ss) {
    var sl = $$('.ss-s', ss), dots = $$('.ss-dots button', ss), k = 0, sx = null;
    if (sl.length < 2) return;
    function show(n) { k = (n + sl.length) % sl.length; sl.forEach(function (x, j) { x.classList.toggle('on', j === k); }); dots.forEach(function (d, j) { d.classList.toggle('on', j === k); }); }
    $('.ss-p', ss).onclick = function () { show(k - 1); }; $('.ss-n', ss).onclick = function () { show(k + 1); };
    dots.forEach(function (d) { d.onclick = function () { show(+d.dataset.k); }; });
    ss.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    ss.addEventListener('touchend', function (e) { if (sx == null) return; var d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 40) show(k + (d < 0 ? 1 : -1)); sx = null; });
  });
  $$('.trk-play[data-audio]', v).forEach(function (b) { b.onclick = function () { playToggle(b); }; });
  $$('.m-it', v).forEach(function (b) {
    b.onclick = function () { lightbox((r.tab.items || []).map(function (x) { return { p: x.images && x.images[0], c: x.title, t: x.title }; }), +b.dataset.k); };
  });
}

function lightbox(list, k) {
  var lb = $('.lb'), img = $('img', lb), cap = $('.lb-c', lb), opener = document.activeElement;
  function show() { var x = list[k]; img.src = x.p ? src(x.p) : ph(x.t); img.alt = x.c || ''; cap.textContent = x.c || ''; $('.lb-p', lb).hidden = $('.lb-n', lb).hidden = list.length < 2; }
  function step(d) { k = (k + d + list.length) % list.length; show(); }
  function close() { lb.hidden = true; document.removeEventListener('keydown', key); if (opener && opener.focus) opener.focus(); }
  function key(e) { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); }
  $('.lb-x', lb).onclick = close; $('.lb-p', lb).onclick = function () { step(-1); }; $('.lb-n', lb).onclick = function () { step(1); };
  lb.onclick = function (e) { if (e.target === lb) close(); };
  var sx = null; lb.ontouchstart = function (e) { sx = e.touches[0].clientX; };
  lb.ontouchend = function (e) { if (sx == null) return; var d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 40) step(d < 0 ? 1 : -1); sx = null; };
  show(); lb.hidden = false; document.addEventListener('keydown', key); $('.lb-x', lb).focus();
}

function closePanel() {
  var p = $('#panel'); if (!p || p.hidden) return;
  p.hidden = true; document.body.classList.remove('panel-open');
  $$('[aria-controls="panel"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
}
function wireShell() {
  $$('[aria-controls="panel"]').forEach(function (b) {
    b.onclick = function () {
      var p = $('#panel'), open = p.hidden;
      if (!open) return closePanel();
      p.hidden = false; document.body.classList.add('panel-open'); b.setAttribute('aria-expanded', 'true');
      var a = $('a', p); if (a) a.focus();
    };
  });
  var p = $('#panel'); if (p) p.onclick = function (e) { if (e.target === p) closePanel(); };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(); });
}

function draw(first) {
  applyStyle(); shell(); wireShell(); go(first);
}

function start(data, images) {
  if (!data || !data.tabs) return;
  S = data; IMG = images || {};
  if (document.documentElement.hasAttribute('data-preview') && route().i < 0) history.replaceState(null, '', '#/');
  draw(true);
  if (!booted) { booted = true; window.addEventListener('hashchange', function () { go(false); }); }
}

/* ---------- Studio select mode (preview only): tap anything to select it, like a design tool.
   Menus, play buttons and photo thumbs still work. The studio opens the matching settings. ---------- */
var PICK = true, LAST = null, BOX = null, HOV = null;
var PASS = '.ss-p,.ss-n,.ss-dots,.ss-dots *,.tt,.bt,.panel a,.menu-btn,.back,.chip,.gal-th button,.trk-play,.lb,.lb *';
var PICKABLE = '.vid,.prof,.hero-h,.hero-p,.hero-img,.card,.find,.log-e,.trk,.m-it,.lnk,.tile,.hero,.ttl,.intro,.prose,.page-img,.brand,.notice,.item,.gal,.feat .row-h,.links,.tracks,.empty';
// which input in the studio a tapped element belongs to
function fieldOf(el, t, isItem) {
  if (el.matches('.hero-h')) return 'headline';
  if (el.closest('.vid')) return 'video';
  if (el.closest('.lnk') && t && t.type !== 'links' && !el.closest('.links-pages')) return 'links';
  if (el.matches('.hero-p,.intro')) return 'intro';
  if (el.matches('.hero-img,.page-img')) return 'image';
  if (el.matches('.prose')) return isItem ? 'text' : 'body';
  if (el.matches('.ttl')) return isItem ? 'title' : 'name';
  if (isItem && el.closest('.gal')) return 'images';
  return null;
}
function pickInfo(el) {
  var info = pickBase(el);
  info.field = info.kind === 'site' ? (el.closest('.notice') ? 'notice' : 'name') : fieldOf(el, route().tab, info.kind === 'item' && !!el.closest('.item'));
  return info;
}
function pickBase(el) {
  var r = route(), sl = slugs(), t = r.tab, k = 'tab', slug = sl[r.i], item = null, name = t ? t.name : '';
  if (el.closest('.brand,.notice')) return { kind: 'site', label: 'Site: ' + (S.name || 'name') };
  var a = el.matches('a') ? el : el.querySelector('a[href^="#/"]');
  var hm = a && (a.getAttribute('href') || '').match(/^#\/([^\/]+)(?:\/([^\/]+))?/);
  if (el.closest('.tile,.links-pages') && hm) { slug = hm[1]; var ti = sl.indexOf(slug); return { kind: 'tab', slug: slug, label: 'Page: ' + (tabs()[ti] ? tabs()[ti].name : slug) }; }
  if (hm && hm[2] && hm[2] !== '~') { slug = hm[1]; item = decodeURIComponent(hm[2]); }
  if (el.closest('.item') && r.item) item = r.item;
  var mi = el.closest('.m-it'); if (mi && t && t.items && t.items[+mi.dataset.k]) item = t.items[+mi.dataset.k].id;
  var ln = el.closest('.lnk'); if (ln && t) { var idx = $$('.lnk').indexOf(ln); if (t.items && t.items[idx]) item = t.items[idx].id; }
  if (item) { k = 'item'; var tt = tabs()[sl.indexOf(slug)], x = tt && (tt.items || []).filter(function (q) { return q.id === item; })[0]; name = x ? (x.title || 'Untitled') : 'Item'; }
  return { kind: k, slug: slug, item: item, label: (k === 'item' ? 'Item: ' : 'Page: ') + name };
}
function outline(el, label, hover) {
  var b = hover ? HOV : BOX;
  if (!b) { b = document.createElement('div'); b.className = hover ? 'fs-hov' : 'fs-sel'; b.innerHTML = hover ? '' : '<span></span>'; document.body.appendChild(b); if (hover) HOV = b; else BOX = b; }
  if (!el) { b.hidden = true; return; }
  var q = el.getBoundingClientRect();
  b.hidden = false; b.style.left = (q.left + scrollX - 2) + 'px'; b.style.top = (q.top + scrollY - 2) + 'px'; b.style.width = (q.width + 4) + 'px'; b.style.height = (q.height + 4) + 'px';
  if (!hover) { b.firstChild.textContent = label; var hd = $('.hd'), hb = hd ? hd.getBoundingClientRect().bottom : 0, inn = q.top < hb + 22; b.classList.toggle('in', inn); b.firstChild.style.top = inn ? Math.max(0, hb - q.top + 2) + 'px' : ''; }
}
function findPicked() {
  if (!LAST) return null;
  if (LAST.kind === 'site') return $('.brand');
  if (LAST.kind === 'item') { var a = $$('a[href]').filter(function (x) { return /\/[^\/]+\/([^\/]+)$/.test(x.getAttribute('href')) && decodeURIComponent(x.getAttribute('href').split('/').pop()) === LAST.item; })[0]; if (a) return a.closest('.card,.find,.log-e,.trk') || a; return $('.item') || null; }
  return $('.hero') || $('.ttl');
}
function remark() { if (PICK && LAST) outline(findPicked(), LAST.label); }
function initPick() {
  document.addEventListener('click', function (e) {
    if (!PICK || e.target.closest(PASS)) return;
    var el = e.target.closest(PICKABLE); if (!el) return;
    e.preventDefault(); e.stopPropagation();
    var box = el.closest('.card,.find,.log-e,.trk,.m-it,.lnk,.tile') || el;
    LAST = pickInfo(box); outline(box, LAST.label); outline(null, '', true);
    parent.postMessage({ type: 'pick', kind: LAST.kind, slug: LAST.slug, item: LAST.item, field: LAST.field || null, hash: location.hash }, location.origin);
  }, true);
  document.addEventListener('mouseover', function (e) { if (!PICK || !matchMedia('(hover:hover)').matches) return; var el = e.target.closest(PICKABLE); if (el && !e.target.closest(PASS)) outline(el.closest('.card,.find,.log-e,.trk,.m-it,.lnk,.tile') || el, '', true); else outline(null, '', true); });
  window.addEventListener('resize', remark); window.addEventListener('hashchange', function () { LAST = null; outline(null); });
}

/* Preview mode: the studio sends the site in a message. Live mode: read site.json. */
window.SiteKit = { contrast: contrast, mix: mix, onColor: onColor, slug: slug, FONTS: FONTS, ICONS: ICONS };
if (document.documentElement.hasAttribute('data-preview')) {
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.type === 'go') { if (booted) location.hash = e.data.hash; return; }
    if (e.data.type === 'mode') { PICK = !!e.data.pick; document.documentElement.classList.toggle('fs-picking', PICK); if (!PICK) { outline(null); outline(null, '', true); } return; }
    if (e.data.type === 'mark') { LAST = e.data.mark; requestAnimationFrame(remark); return; }
    if (e.data.type !== 'site') return;
    var keepHash = e.data.hash;
    if (keepHash != null && keepHash !== location.hash) history.replaceState(null, '', keepHash || '#/');
    start(e.data.site, e.data.images);
    if (e.data.mark !== undefined) LAST = e.data.mark;
    requestAnimationFrame(function () { requestAnimationFrame(remark); });
  });
  initPick(); document.documentElement.classList.add('fs-picking');
  parent.postMessage({ type: 'ready' }, location.origin);
} else {
  fetch('site.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) { start(d, {}); })
    .catch(function () { document.getElementById('site').innerHTML = '<p style="padding:24px;font-family:system-ui">site.json is missing or broken. Open admin.html to fix it.</p>'; });
}
})();
