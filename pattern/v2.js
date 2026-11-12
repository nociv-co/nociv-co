/* NOCIV Patterns v2.
   One canvas (the tile). Everything on it is a layer: your art, words, symbols, shapes. The ground can be a
   color or a fabric (plaid, stripes, checks). The repeat repeats the canvas.
   Make, Look, Save. Undo and redo everywhere. Pictures stay on this phone.
   Uses engine.js (fabric makers, kaleidoscope, PNG with DPI, PDF), letters.js (your lettering), /crop.js. */
(function () {
  'use strict';
  var E = window.PatternEngine || window.E, $ = function (id) { return document.getElementById(id); };
  if (window.self !== window.top) document.documentElement.classList.add('embedded');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function uid() { return Date.now().toString(36) + Math.floor(Math.random() * 1e5).toString(36); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- lists ---------- */
  var FONTS = [['FS Archivo Black', 'Block'], ['FS Rubik Mono One', 'Wide'], ['FS Syne', 'Modern'], ['FS Bricolage', 'Chunky'], ['FS DM Serif Display', 'Serif'], ['FS Fraunces', 'Soft serif'], ['FS Barlow Condensed', 'Tall'], ['FS Tenor Sans', 'Clean'], ['FS Permanent Marker', 'Marker'], ['FS Special Elite', 'Typewriter']];
  var SYMS = [['star', 'Star'], ['bolt', 'Bolt'], ['heart', 'Heart'], ['crown', 'Crown'], ['leaf', 'Leaf'], ['eye', 'Eye'], ['flower', 'Flower'], ['sun', 'Sun']];
  var SHAPES = [['circle', 'Circle'], ['square', 'Square'], ['diamond', 'Diamond'], ['hex', 'Hexagon'], ['star', 'Star'], ['shield', 'Shield'], ['arch', 'Arch'], ['badge', 'Badge'], ['ring', 'Ring']];
  var LAYS = [['line', 'Straight'], ['arcOver', 'Arc over'], ['arcUnder', 'Arc under'], ['circle', 'Circle'], ['seal', 'Seal'], ['stack', 'Stacked'], ['vertical', 'Vertical']];
  var REPS = [['grid', 'Grid'], ['halfdrop', 'Half-drop'], ['halfbrick', 'Half-brick'], ['mirror', 'Mirror'], ['toss', 'Toss'], ['kale', 'Kaleidoscope']];
  var CHECKS = [['board', 'Checkerboard'], ['gingham', 'Gingham'], ['houndstooth', 'Houndstooth'], ['window', 'Windowpane']];
  var BASIC = ['#1a1a1a', '#ffffff', '#f3efe6', '#e9dfcb', '#8a8780', '#c8412f', '#d6336c', '#f2c230', '#d4af37', '#2a9d8f', '#3f4a2c', '#1d6fb8', '#1c2b45', '#6b4f33', '#c6b4f2', '#a8d8f0'];
  var IC = {
    add: '<path d="M12 5v14M5 12h14"/>', repeat: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="7" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    ground: '<path d="M3 17h18M3 21h18"/><path d="M12 3s5 5.5 5 8.5a5 5 0 0 1-10 0C7 8.5 12 3 12 3z"/>', grid: '<rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    ideas: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>', done: '<path d="M5 12l5 5 9-10"/>', color: '<path d="M12 20l8-8-4-4-8 8v4z"/><path d="M14 6l4 4"/>',
    size: '<path d="M3 21L21 3M3 21h6M3 21v-6M21 3h-6M21 3v6"/>', copies: '<rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="9" y="15" width="6" height="6"/>',
    crop: '<path d="M6 2v16h16"/><path d="M2 6h16v16"/>',
    text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>', font: '<path d="M4 20L10 4h1l6 16M6.5 14h8"/>', art: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-9 8"/>'
  };
  function ico(n) { return '<svg viewBox="0 0 24 24">' + (IC[n] || '') + '</svg>'; }

  /* ---------- state: D is the pattern (undo works on it), U is the screen ---------- */
  // 'none' = no background color: the art repeats on a clear tile (prints on the fabric's own color)
  function gHex(doc) { var g = (doc || D).ground; return !g || g === 'none' ? '#ffffff' : g; }
  function freshDoc() { return { tileIn: 4, rep: 'grid', mdir: 'both', mword: 'readable', kale: 'kaleSquare', ground: 'none', fab: null, grid: 0, layers: [], pal: [], cloth: 'poplin', name: 'My pattern', artMap: {} }; }
  var D = freshDoc(), U = { step: 'make', view: 'tile', sel: null, tool: null, ptool: 'ground', addTab: 'art', started: false, cur: null, waySeed: 1, clothOpen: false, shelfSel: null }, ART = [], LETTERS = null, HAND = 'left', NUMS = false;
  function keep() { try { localStorage.setItem('nocivPattern2', JSON.stringify({ d: D, art: ART, letters: LETTERS, hand: HAND, nums: NUMS, started: U.started, cur: U.cur })); } catch (e) {} }
  try { var sv = JSON.parse(localStorage.getItem('nocivPattern2') || 'null'); if (sv) { D = Object.assign(freshDoc(), sv.d || {}); ART = sv.art || []; LETTERS = sv.letters || null; HAND = sv.hand || 'left'; NUMS = !!sv.nums; U.started = !!sv.started; U.cur = sv.cur || null; } } catch (e) {}
  var HIST = [], FUT = [];
  function commit() { HIST.push(JSON.stringify(D)); if (HIST.length > 60) HIST.shift(); FUT = []; }
  function undo() { if (!HIST.length) return; FUT.push(JSON.stringify(D)); D = JSON.parse(HIST.pop()); fixSel(); changed(); }
  function redo() { if (!FUT.length) return; HIST.push(JSON.stringify(D)); D = JSON.parse(FUT.pop()); fixSel(); changed(); }
  function fixSel() { if (U.sel && !layer(U.sel)) { U.sel = null; U.tool = null; } }
  function layer(id) { for (var i = 0; i < D.layers.length; i++) if (D.layers[i].id === id) return D.layers[i]; return null; }
  function sel() { return U.sel ? layer(U.sel) : null; }

  /* ---------- pictures on this phone (same store as before, so old pictures carry over) ---------- */
  var DB = null;
  function idb() { return new Promise(function (res) { if (DB) return res(DB); try { var r = indexedDB.open('nocivPattern', 1); r.onupgradeneeded = function () { r.result.createObjectStore('img'); }; r.onsuccess = function () { DB = r.result; res(DB); }; r.onerror = function () { res(null); }; } catch (e) { res(null); } }); }
  function idbGet(k) { return idb().then(function (db) { return new Promise(function (res) { if (!db) return res(null); var q = db.transaction('img').objectStore('img').get(k); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; }); }); }
  function idbSet(k, v) { return idb().then(function (db) { return new Promise(function (res) { if (!db) return res(); var t = db.transaction('img', 'readwrite'); t.objectStore('img').put(v, k); t.oncomplete = res; t.onerror = res; }); }); }
  function idbDel(k) { return idb().then(function (db) { return new Promise(function (res) { if (!db) return res(); var t = db.transaction('img', 'readwrite'); t.objectStore('img').delete(k); t.oncomplete = res; t.onerror = res; }); }); }
  function blobToCanvas(b) { return new Promise(function (res) { var u = URL.createObjectURL(b), im = new Image(); im.onload = function () { var k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = E.cv(im.width * k, im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c); }; im.onerror = function () { res(null); }; im.src = u; }); }
  var IMG = {}, artVer = 0;
  function loadArt() { return Promise.all(ART.map(function (a) { return idbGet('lib:' + a.id).then(function (b) { return b ? blobToCanvas(b) : null; }).then(function (c) { if (c) IMG[a.id] = c; }); })).then(function () { ART = ART.filter(function (a) { return IMG[a.id]; }); artVer++; }); }
  function addArtCanvas(c) {
    var k = Math.min(1, 3000 / Math.max(c.width, c.height)), c2 = E.cv(c.width * k, c.height * k); c2.getContext('2d').drawImage(c, 0, 0, c2.width, c2.height);
    var id = uid(); IMG[id] = c2; ART.push({ id: id, white: true }); artVer++;
    return new Promise(function (res) { c2.toBlob(function (b) { if (b) idbSet('lib:' + id, b).then(function () { res(id); }); else res(id); }, 'image/png'); });
  }
  function pickArt(files) {
    var list = Array.prototype.slice.call(files || []).slice(0, Math.max(0, 30 - ART.length)), ids = [];
    return list.reduce(function (p, f) {
      return p.then(function () {
        var cr = window.nocivCrop ? window.nocivCrop(f, { title: 'Crop your art', aspects: [['free', 'Free'], ['orig', 'Original'], [1, 'Square']], maxPx: 3000 }).catch(function () { return null; }) : blobToCanvas(f);
        return cr.then(function (c) { if (c) return addArtCanvas(c).then(function (id) { ids.push(id); return idbSet('src:' + id, f); }); });
      });
    }, Promise.resolve()).then(function () { keep(); return ids; });
  }
  // crop a picture on the canvas again, from the full original. Every copy of it changes; Undo brings the old crop back.
  function cropArt() {
    var L = sel(); if (!L || L.t !== 'art' || !window.nocivCrop) return; var old = L.aid;
    idbGet('src:' + old).then(function (b) { return b || new Promise(function (r) { IMG[old].toBlob(r, 'image/png'); }); }).then(function (src) {
      return window.nocivCrop(src, { title: 'Crop your art', aspects: [['free', 'Free'], ['orig', 'Original'], [1, 'Square']], maxPx: 3000 }).then(function (c) {
        if (!c) return; return addArtCanvas(c).then(function (id) { idbSet('src:' + id, src); var a = artInfo(old), n = artInfo(id); if (a && n) n.white = a.white; commit(); D.layers.forEach(function (x) { if (x.t === 'art' && x.aid === old) x.aid = id; }); changed(); });
      });
    }).catch(function () {});
  }
  function artInfo(id) { for (var i = 0; i < ART.length; i++) if (ART[i].id === id) return ART[i]; return null; }
  var pcache = {};
  // the main colors of each picture, so Look and colorways can change them like any other color
  var acols = {};
  function artBase(id) { if (!acols[id] && IMG[id]) acols[id] = artColors(IMG[id]); return acols[id] || []; }
  function artCanvas(id, tint) {
    var src = IMG[id], a = artInfo(id); if (!src) return null;
    var base = artBase(id), am = D.artMap || {}, sh = tint ? [] : base.map(function (h) { return am[h] && am[h] !== h ? am[h] : null; }), anyShift = sh.some(Boolean);
    var key = id + (a && a.white ? 'w' : '') + (tint || '') + (anyShift ? sh.join(',') : '') + artVer; if (pcache[key]) return pcache[key];
    if (Object.keys(pcache).length > 60) pcache = {};
    var c = E.cv(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0);
    if ((a && a.white) || tint || anyShift) {
      var im = g.getImageData(0, 0, c.width, c.height), d = im.data, ink = tint ? E.hex(tint) : null;
      var B0 = base.map(function (h) { return E.hex(h); }), DL = sh.map(function (h, j) { if (!h) return null; var t = E.hex(h); return [t[0] - B0[j][0], t[1] - B0[j][1], t[2] - B0[j][2]]; });
      for (var i = 0; i < d.length; i += 4) {
        var L = (d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722) / 255;
        if (a && a.white && L > .88) d[i + 3] = Math.round(d[i + 3] * Math.max(0, (1 - L) / .12));
        if (ink) { d[i] = ink[0]; d[i + 1] = ink[1]; d[i + 2] = ink[2]; continue; }
        if (anyShift && d[i + 3]) {
          // each pixel moves with the color it is closest to; far away pixels (white paper, highlights) move less
          var bj = 0, bd = 1e9; for (var j = 0; j < B0.length; j++) { var q = B0[j], dd = (d[i] - q[0]) * (d[i] - q[0]) + (d[i + 1] - q[1]) * (d[i + 1] - q[1]) + (d[i + 2] - q[2]) * (d[i + 2] - q[2]); if (dd < bd) { bd = dd; bj = j; } }
          var dl = DL[bj]; if (!dl) continue; var dist = Math.sqrt(bd), w = dist < 70 ? 1 : clamp(1 - (dist - 70) / 120, 0, 1);
          d[i] = clamp(d[i] + dl[0] * w, 0, 255); d[i + 1] = clamp(d[i + 1] + dl[1] * w, 0, 255); d[i + 2] = clamp(d[i + 2] + dl[2] * w, 0, 255);
        }
      }
      g.putImageData(im, 0, 0);
    }
    return (pcache[key] = c);
  }
  // the colors in a picture: a small k-means on its inked pixels, most used first
  function artColors(c) {
    var k = Math.min(1, 80 / Math.max(c.width, c.height)), w = Math.max(1, Math.round(c.width * k)), h = Math.max(1, Math.round(c.height * k)), t = E.cv(w, h), g = t.getContext('2d'); g.drawImage(c, 0, 0, w, h);
    var d = g.getImageData(0, 0, w, h).data, px = [];
    for (var i = 0; i < d.length; i += 4) { if (d[i + 3] < 200) continue; var L = (d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722) / 255; if (L > .93) continue; px.push([d[i], d[i + 1], d[i + 2]]); }
    if (!px.length) return ['#1a1a1a'];
    var K = Math.min(4, px.length), C = []; for (var j = 0; j < K; j++) C.push(px[Math.floor(j * px.length / K)].slice());
    var cnt;
    for (var it = 0; it < 8; it++) {
      var sum = C.map(function () { return [0, 0, 0]; }); cnt = C.map(function () { return 0; });
      px.forEach(function (p) { var b = 0, bd = 1e9; C.forEach(function (q, n) { var dd = (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]) + (p[2] - q[2]) * (p[2] - q[2]); if (dd < bd) { bd = dd; b = n; } }); sum[b][0] += p[0]; sum[b][1] += p[1]; sum[b][2] += p[2]; cnt[b]++; });
      C = C.map(function (q, n) { return cnt[n] ? [sum[n][0] / cnt[n], sum[n][1] / cnt[n], sum[n][2] / cnt[n]] : q; });
    }
    var out = C.map(function (q, n) { return [cnt[n], toHex(q)]; }).filter(function (x) { return x[0] > px.length * .04; }).sort(function (a, b) { return b[0] - a[0]; }).map(function (x) { return x[1]; });
    return out.filter(function (h, i) { return out.indexOf(h) === i; });
  }
  function toHex(c) { if (typeof c === 'string') { var h = E.hex(c); c = h; } return '#' + c.slice(0, 3).map(function (v) { return ('0' + Math.round(clamp(v, 0, 255)).toString(16)).slice(-2); }).join(''); }
  function lum(h) { var c = E.hex(h).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
  function tintOf(h, k) { var c = E.hex(h); return toHex([c[0] + (255 - c[0]) * k, c[1] + (255 - c[1]) * k, c[2] + (255 - c[2]) * k]); }

  /* ---------- drawing pieces ---------- */
  function shapePath(g, kind, R) {
    g.beginPath();
    if (kind === 'circle' || kind === 'ring') g.arc(0, 0, R, 0, 7);
    else if (kind === 'square') { var r = R * .22, s = R * .92; g.moveTo(-s + r, -s); g.arcTo(s, -s, s, s, r); g.arcTo(s, s, -s, s, r); g.arcTo(-s, s, -s, -s, r); g.arcTo(-s, -s, s, -s, r); }
    else if (kind === 'shield') { g.moveTo(-R * .85, -R * .85); g.lineTo(R * .85, -R * .85); g.lineTo(R * .85, 0); g.quadraticCurveTo(R * .8, R * .7, 0, R); g.quadraticCurveTo(-R * .8, R * .7, -R * .85, 0); }
    else if (kind === 'badge') { var n = 16; for (var i = 0; i <= n * 2; i++) { var a = i / (n * 2) * Math.PI * 2, rr = i % 2 ? R * .9 : R; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } }
    else if (kind === 'star') { E.star(g, R * 1.05, 5, .55); return; }
    else if (kind === 'diamond') { g.moveTo(0, -R); g.lineTo(R, 0); g.lineTo(0, R); g.lineTo(-R, 0); }
    else if (kind === 'hex') { for (var k = 0; k < 6; k++) { var b = Math.PI / 6 + k * Math.PI / 3; g.lineTo(Math.cos(b) * R, Math.sin(b) * R); } }
    else if (kind === 'arch') { g.moveTo(-R * .8, R * .9); g.lineTo(-R * .8, -R * .1); g.arc(0, -R * .1, R * .8, Math.PI, 0); g.lineTo(R * .8, R * .9); }
    g.closePath();
  }
  function iconDraw(g, kind, r, col) {
    g.fillStyle = col; g.strokeStyle = col; g.lineWidth = r * .16; g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'star') { E.star(g, r, 5, .45); g.fill(); }
    else if (kind === 'bolt') { g.beginPath(); g.moveTo(r * .2, -r); g.lineTo(-r * .55, r * .1); g.lineTo(0, r * .1); g.lineTo(-r * .2, r); g.lineTo(r * .55, -r * .1); g.lineTo(0, -r * .1); g.closePath(); g.fill(); }
    else if (kind === 'heart') { g.beginPath(); g.moveTo(0, r * .85); g.bezierCurveTo(-r * 1.3, -r * .1, -r * .6, -r * 1.1, 0, -r * .35); g.bezierCurveTo(r * .6, -r * 1.1, r * 1.3, -r * .1, 0, r * .85); g.fill(); }
    else if (kind === 'crown') { g.beginPath(); g.moveTo(-r, r * .6); g.lineTo(-r, -r * .4); g.lineTo(-r * .5, r * .05); g.lineTo(0, -r * .7); g.lineTo(r * .5, r * .05); g.lineTo(r, -r * .4); g.lineTo(r, r * .6); g.closePath(); g.fill(); }
    else if (kind === 'leaf') { g.beginPath(); g.moveTo(-r * .9, r * .9); g.quadraticCurveTo(-r, -r, r * .9, -r * .9); g.quadraticCurveTo(r, r, -r * .9, r * .9); g.fill(); }
    else if (kind === 'eye') { g.beginPath(); g.moveTo(-r, 0); g.quadraticCurveTo(0, -r * 1.1, r, 0); g.quadraticCurveTo(0, r * 1.1, -r, 0); g.stroke(); g.beginPath(); g.arc(0, 0, r * .32, 0, 7); g.fill(); }
    else if (kind === 'flower') { for (var i = 0; i < 6; i++) { g.save(); g.rotate(i * Math.PI / 3); g.beginPath(); g.ellipse(0, -r * .55, r * .3, r * .5, 0, 0, 7); g.fill(); g.restore(); } }
    else if (kind === 'sun') { g.beginPath(); g.arc(0, 0, r * .45, 0, 7); g.fill(); for (var j = 0; j < 8; j++) { g.save(); g.rotate(j * Math.PI / 4); g.beginPath(); g.moveTo(0, -r * .65); g.lineTo(0, -r); g.stroke(); g.restore(); } }
  }

  /* ---------- words: straight, arcs, circle, seal, stacked, vertical ---------- */
  var wcache = {};
  function glyphs(text, L, fs) {
    var mine = L.f === '@mine' && LETTERS && window.NocivLetters, out = [], m = E.cv(4, 4).getContext('2d');
    if (mine) text = NocivLetters.caseOf(text, LETTERS.dna);
    m.font = fs + "px '" + L.f + "', sans-serif";
    for (var i = 0; i < text.length; i++) {
      var ch = text[i], sp = (L.sp || 0) * fs;
      if (mine) {
        if (ch === ' ') { out.push({ w: fs * .32 + sp }); continue; }
        if (!/[A-Za-z]/.test(ch)) continue;
        var wc = NocivLetters.word(ch, LETTERS.dna, fs * .72, L.c); out.push({ w: wc.width * .88 + sp, img: wc });
      } else out.push({ w: m.measureText(ch).width + sp, ch: ch });
    }
    return out;
  }
  function drawGlyph(g, gl, L, fs, base) { // base: 'mid' or 'bottom' or 'top' (relative to 0)
    if (!gl.img && !gl.ch) return;
    if (gl.img) { var h = gl.img.height, y = base === 'bottom' ? -h * .86 : base === 'top' ? -h * .14 : -h / 2; g.drawImage(gl.img, -gl.img.width / 2, y); return; }
    g.font = fs + "px '" + L.f + "', sans-serif"; g.fillStyle = L.c; g.textAlign = 'center'; g.textBaseline = base === 'bottom' ? 'alphabetic' : base === 'top' ? 'top' : 'middle'; g.fillText(gl.ch, 0, 0);
  }
  function wordsCanvas(L, B, hugR) {
    var fs = Math.max(4, L.s * B), key = JSON.stringify([L.tx, L.tx2, L.f, L.lay, L.sp, L.bend, L.c, Math.round(fs * 10), Math.round((hugR || 0) * 10), L.f === '@mine' ? LETTERS : 0]);
    if (wcache[key]) return wcache[key];
    var lay = L.lay, tx = (L.tx || '').slice(0, 60), c, g;
    if (lay === 'line' || lay === 'stack' || lay === 'vertical') {
      var lines = lay === 'stack' ? tx.split(/\s+/).filter(Boolean) : [tx];
      if (lay === 'vertical') lines = tx.replace(/\s+/g, '').split('');
      var gls = lines.map(function (l) { return glyphs(l, L, fs); }), widths = gls.map(function (a) { return a.reduce(function (s, x) { return s + x.w; }, 0); });
      var W = Math.max(fs * .5, Math.max.apply(null, widths.concat([0]))) + fs * .3, lh = fs * (lay === 'vertical' ? 1.02 : 1.08), H = lines.length * lh + fs * .3;
      c = E.cv(W, H); g = c.getContext('2d');
      gls.forEach(function (a, li) { var x = (W - widths[li]) / 2, y = fs * .15 + lh * (li + .5); a.forEach(function (gl) { g.save(); g.translate(x + gl.w / 2 - (L.sp || 0) * fs / 2, y); drawGlyph(g, gl, L, fs, 'mid'); g.restore(); x += gl.w; }); });
    } else {
      var top = glyphs(tx, L, fs), bot = lay === 'seal' ? glyphs((L.tx2 || '').slice(0, 60), L, fs) : null;
      var tw = top.reduce(function (s, x) { return s + x.w; }, 0), R;
      if (hugR) R = hugR + fs * .12;
      else if (lay === 'circle') R = Math.max(fs, tw / (2 * Math.PI * .86));
      else R = Math.max(fs * .8, tw / (Math.PI * clamp((L.bend || 60) / 100, .15, 1.8)));
      var S2 = Math.ceil(2 * (R + fs * 1.1)); c = E.cv(S2, S2); g = c.getContext('2d'); g.translate(S2 / 2, S2 / 2);
      var arc = function (gls, under) {
        var w = gls.reduce(function (s, x) { return s + x.w; }, 0), A = w / R, a0 = under ? Math.PI / 2 + A / 2 : -Math.PI / 2 - A / 2, run = 0;
        if (lay === 'circle') A = Math.min(A, Math.PI * 2);
        gls.forEach(function (gl) {
          var mid = under ? a0 - (run + gl.w / 2) / R : a0 + (run + gl.w / 2) / R; run += gl.w;
          g.save(); g.rotate(mid); g.translate(R, 0); g.rotate(under ? -Math.PI / 2 : Math.PI / 2); drawGlyph(g, gl, L, fs, under ? 'top' : 'bottom'); g.restore();
        });
      };
      arc(top, lay === 'arcUnder'); if (bot) arc(bot, true);
    }
    var keys = Object.keys(wcache); if (keys.length > 80) wcache = {};
    return (wcache[key] = c);
  }

  /* ---------- one layer ---------- */
  function hugShape(L) { if (L.t !== 'words' || !L.hug) return null; var s = layer(L.hug); return s && s.t === 'shape' ? s : null; }
  function pos(L) { var h = hugShape(L); return h ? [h.x, h.y] : [L.x, L.y]; }
  // the drawn picture of a layer, its size in px at block size B
  function content(L, B) {
    if (L.t === 'art') { var c = artCanvas(L.aid, L.tint); if (!c) return null; var k = L.s * B / Math.max(c.width, c.height); return { img: c, w: c.width * k, h: c.height * k }; }
    if (L.t === 'words') { var h = hugShape(L), wc = wordsCanvas(L, B, h ? h.s * B / 2 : 0); return { img: wc, w: wc.width, h: wc.height }; }
    return { w: L.s * B, h: L.s * B };
  }
  function drawLayer(g, L, B, fx, fy, mode) {
    var ct = content(L, B); if (!ct) return;
    var flipC = mode === 'flip' || L.t === 'sym' || L.t === 'shape';
    g.save(); g.globalAlpha = (L.op == null ? 1 : L.op) * FADEV;
    g.rotate((L.r || 0) * (fx !== fy ? -1 : 1) * Math.PI / 180);
    g.scale((flipC && fx ? -1 : 1) * (L.fl === 'x' ? -1 : 1), (flipC && fy ? -1 : 1) * (L.fl === 'y' ? -1 : 1));
    if (ct.img) g.drawImage(ct.img, -ct.w / 2, -ct.h / 2, ct.w, ct.h);
    else if (L.t === 'sym') iconDraw(g, L.k, L.s * B / 2, L.c);
    else if (L.t === 'shape') {
      var R = L.s * B / 2; shapePath(g, L.k, R);
      if (L.k === 'ring') { g.lineWidth = L.s * B * .09; g.strokeStyle = L.c; g.stroke(); }
      else {
        var ft = L.fab ? shapeFab(L, B) : null;
        g.fillStyle = L.c; g.fill();
        if (ft) { var pt = g.createPattern(ft, 'repeat'); g.save(); g.clip(); g.translate(-R, -R); g.fillStyle = pt; g.fillRect(0, 0, R * 2, R * 2); g.restore(); }
        if (L.ol) { shapePath(g, L.k, R); g.lineWidth = R * (L.ol.w === 'thick' ? .14 : .06); g.strokeStyle = L.ol.c; g.lineJoin = 'round'; g.stroke(); }
      }
    }
    g.restore();
  }
  // a fabric inside a shape: the shape's color leads, the fabric uses its light and dark versions
  var sfcache = {};
  function shapeFab(L, B) {
    var ppi = B / D.tileIn, f = L.fab, cols = [tintOf(L.c, .82), L.c, tintOf(L.c, .45), darkOf(L.c, .45), '#ffffff'], key = JSON.stringify([f, cols, Math.round(ppi * 10)]);
    if (sfcache[key]) return sfcache[key]; if (Object.keys(sfcache).length > 30) sfcache = {};
    return (sfcache[key] = fabTile(f, ppi, cols));
  }
  function darkOf(h, k) { var c = E.hex(h); return toHex([c[0] * (1 - k), c[1] * (1 - k), c[2] * (1 - k)]); }
  function reach(L, B) { var ct = content(L, B); return ct ? Math.hypot(ct.w, ct.h) / 2 + 2 : 0; }

  /* ---------- fabric ground ---------- */
  function fabColors(doc) { doc = doc || D; var f = doc.fab; return (f && f.c) || [gHex(doc)].concat(doc.pal.length ? doc.pal : ['#1a1a1a', '#c8412f']).concat(['#1c2b45', '#d4af37', '#2a9d8f']); }
  function fabTile(f, ppi, cols) {
    cols = cols || fabColors(); var sc = f.sz || 1;
    var tIn = sc / (f.tpi || 50);
    if (f.k === 'plaid') { var p = E.PLAIDS.filter(function (x) { return x[0] === f.p; })[0] || E.PLAIDS[0]; return E.plaidTile({ sett: f.sett || p[3], mirror: f.mirror != null ? f.mirror : p[4], threadIn: tIn, ppi: ppi, colors: cols, weave: f.weave || 'twill', step: 1 }); }
    if (f.k === 'stripes') { var st = E.STRIPES.filter(function (x) { return x[0] === f.p; })[0] || E.STRIPES[0]; return E.stripeTile({ bands: (f.bands || st[3]).map(function (b) { return [b[0], b[1] * sc]; }), dir: f.dir || st[4], ppi: ppi, colors: cols }); }
    if (f.p === 'gingham') return E.plaidTile({ sett: f.sett || [[0, 6], [1, 6]], mirror: f.mirror || false, threadIn: tIn, ppi: ppi, colors: cols, weave: f.weave || 'plain', step: 1 });
    return E.checkTile({ kind: f.p, cellIn: .5 * sc, ppi: ppi, colors: cols, fill: 'solid', scale: 1, seed: 3 });
  }
  var fcache = {};
  function fillGround(g, W, H, B, ppi, By) {
    By = By || B; if (D.ground !== 'none') { g.fillStyle = D.ground; g.fillRect(0, 0, W, H); } if (!D.fab) return;
    var key = JSON.stringify([D.fab, fabColors(), Math.round(ppi * 100)]), t = fcache.k === key ? fcache.t : (fcache = { k: key, t: fabTile(D.fab, ppi) }).t; if (!t) return;
    // fit a whole number of fabric repeats into the block so it stays seamless
    var nx = t.width <= 4 ? 0 : Math.max(1, Math.round(B / t.width)), ny = t.height <= 4 ? 0 : Math.max(1, Math.round(By / t.height));
    var sx = nx ? (B / nx) / t.width : 1, sy = ny ? (By / ny) / t.height : 1, p = g.createPattern(t, 'repeat');
    if (p.setTransform && window.DOMMatrix) p.setTransform(new DOMMatrix().scale(sx, sy));
    g.fillStyle = p; g.fillRect(0, 0, W, H);
  }

  /* ---------- the repeat tile ---------- */
  function copies() {
    var r = D.rep;
    var i, out;
    var fa = !!D.flipAlt;
    if (r === 'halfdrop') { var nd = D.drop || 2, cn = fa && nd % 2 ? nd * 2 : nd; out = { w: cn, h: 1, c: [] }; for (i = 0; i < cn; i++) out.c.push([i, (i % nd) / nd, fa ? i % 2 : 0, 0, 0]); return out; }
    if (r === 'halfbrick') { var nb = D.shift || 2, cb = fa && nb % 2 ? nb * 2 : nb; out = { w: 1, h: cb, c: [] }; for (i = 0; i < cb; i++) out.c.push([(i % nb) / nb, i, fa ? i % 2 : 0, 0, 0]); return out; }
    if (r === 'toss') {
      var tt = D.tturn || 'quarter', rots = tt === 'none' ? [0, 0, 0, 0] : tt === 'half' ? [0, 180, 180, 0] : [0, 180, 90, 270], R = E.rng((D.tseed || 0) * 977 + 13);
      if (D.tseed) for (i = 3; i > 0; i--) { var j = Math.floor(R() * (i + 1)), tmp = rots[i]; rots[i] = rots[j]; rots[j] = tmp; }
      out = { w: 2, h: 2, c: [[0, 0], [1, 0], [0, 1], [1, 1]].map(function (q, k) { return [q[0], q[1], fa && (q[0] + q[1]) % 2 ? 1 : 0, 0, rots[k], D.tmix ? [1, .8, 1.15, .9][(k + (D.tseed || 0)) % 4] : 1]; }) };
      return out;
    }
    if (r === 'mirror') {
      if (D.mdir === 'lr') return { w: 2, h: 1, c: [[0, 0, 0, 0, 0], [1, 0, 1, 0, 0]] };
      if (D.mdir === 'ud') return { w: 1, h: 2, c: [[0, 0, 0, 0, 0], [0, 1, 0, 1, 0]] };
      return { w: 2, h: 2, c: [[0, 0, 0, 0, 0], [1, 0, 1, 0, 0], [0, 1, 0, 1, 0], [1, 1, 1, 1, 0]] };
    }
    if (r === 'grid' && fa) return { w: 2, h: 1, c: [[0, 0, 0, 0, 0], [1, 0, 1, 0, 0]] };
    return { w: 1, h: 1, c: [[0, 0, 0, 0, 0]] };
  }
  function blockB(ppi) { return Math.max(16, Math.round(D.tileIn * ppi)); }
  // rectangle tiles: tileIn is the width, tileH the height (none = square). Kaleidoscope always stays square.
  function asp() { return D.rep === 'kale' || !D.tileH ? 1 : D.tileH / D.tileIn; }
  function tileHt() { return D.tileIn * asp(); }
  function blockBh(ppi) { return Math.max(16, Math.round(tileHt() * ppi)); }
  function tileLabel() { return asp() === 1 ? fmtIn(D.tileIn) : inch(D.tileIn) + ' x ' + inch(tileHt()); }
  var FADEV = 1;
  function drawLayersInto(g, W, H, B, cp, ox, oy, Bh) {
    Bh = Bh || B; var rect = Math.abs(Bh - B) > 1; FADEV = D.fade || 1;
    var mode = D.rep === 'mirror' ? (D.mword === 'flip' ? 'flip' : 'readable') : 'flip';
    cp.c.forEach(function (cc) {
      var r0 = cc[4]; if (rect && r0 % 180) r0 = (r0 + 90) % 360; // a rectangle cannot turn a quarter: half turns instead
      var fx = !!cc[2], fy = !!cc[3], rot = r0 * Math.PI / 180;
      D.layers.forEach(function (L) {
        if (L.hide) return;
        var p = pos(L), x = fx ? 1 - p[0] : p[0], y = fy ? 1 - p[1] : p[1];
        if (rot) { var dx = x - .5, dy = y - .5; x = .5 + dx * Math.cos(rot) - dy * Math.sin(rot); y = .5 + dx * Math.sin(rot) + dy * Math.cos(rot); }
        var sc = cc[5] || 1; E.wrapDraw(g, W, H, (ox || 0) + (cc[0] + x) * B, (oy || 0) + (cc[1] + y) * Bh, reach(L, B) * sc, function (gg) { if (rot) gg.rotate(rot); if (sc !== 1) gg.scale(sc, sc); drawLayer(gg, L, B, fx, fy, mode); });
      });
    });
  }
  var tcache = {}, tcount = 0;
  function tile(ppi) {
    var B = blockB(ppi), key = JSON.stringify([D.tileIn, D.tileH, D.rep, D.drop, D.shift, D.tturn, D.tmix, D.tseed, D.flipAlt, D.fade, D.mdir, D.mword, D.kale, D.ground, D.fab, D.layers, D.pal, D.artMap, B, artVer, LETTERS]); if (tcache[key]) return tcache[key];
    var t;
    if (D.rep === 'kale') {
      // the slices are cut from your pieces only; the ground (a color or a fabric) goes under the whole tile
      var m = E.cv(B, B); drawLayersInto(m.getContext('2d'), B, B, B, { w: 1, h: 1, c: [[0, 0, 0, 0, 0]] });
      var kt = E.repeatTile({ motif: m, type: D.kale, tileIn: D.tileIn, ppi: ppi, scale: 1, bg: null });
      t = E.cv(kt.width, kt.height); var kg = t.getContext('2d'); fillGround(kg, kt.width, kt.height, kt.width, ppi, kt.height); kg.drawImage(kt, 0, 0);
    } else {
      var Bh = blockBh(ppi), cp = copies(), W = B * cp.w, H = Bh * cp.h; t = E.cv(W, H); var g = t.getContext('2d');
      fillGround(g, W, H, B, ppi, Bh); drawLayersInto(g, W, H, B, cp, 0, 0, Bh);
    }
    if (++tcount > 14) { tcache = {}; tcount = 1; }
    tcache[key] = t; return t;
  }
  // draw with another version of the pattern (a colorway, a saved pattern), then put yours back
  function withDoc(doc, fn) { var s = D; D = doc; try { return fn(); } finally { D = s; } }

  /* ---------- the cloth it is printed on (preview only, never in the files) ---------- */
  var xcache = {};
  function clothKey() { var f = D.fab; if (f && f.k === 'plaid') return 'plaid'; if (f && f.k === 'stripes') return 'stripes'; if (f && f.k === 'checks') return 'checks'; return 'repeat'; }
  function clothName(k) { var f = (E.FABRICS.filter(function (x) { return x[0] === k; })[0] || E.FABRICS[0]); return f[1]; }
  function clothShort(k) { var n = clothName(k).replace('Cotton ', '').replace('Jersey knit', 'Jersey'); return n.charAt(0).toUpperCase() + n.slice(1); }
  function laycloth(g, W, H, kind, ppi) {
    if (!kind) return; var key = kind + Math.round(ppi); if (!xcache[key]) { if (Object.keys(xcache).length > 24) xcache = {}; xcache[key] = E.fabricTexture(kind, 256, ppi); }
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(xcache[key], 'repeat'); g.fillRect(0, 0, W, H); g.restore();
    if (kind === 'satin') { var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  }
  // a piece of the pattern on cloth: across = inches shown, tex = thread zoom for the texture
  function swatchInto(c, across, cloth, tex) {
    var g = c.getContext('2d'), ppi = c.width / across, t = tile(ppi);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = g.createPattern(t, 'repeat'); g.fillRect(0, 0, c.width, c.height); laycloth(g, c.width, c.height, cloth, tex || ppi);
  }

  /* ---------- colorways: Now plus three others made from your colors ---------- */
  function hsl(h) { var c = E.hex(h), r = c[0] / 255, gg = c[1] / 255, b = c[2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, s = 0, hu = 0; if (mx !== mn) { var dd = mx - mn; s = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn); hu = mx === r ? (gg - b) / dd + (gg < b ? 6 : 0) : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4; hu /= 6; } return [hu, s, l]; }
  function fromHsl(h, s, l) { h = ((h % 1) + 1) % 1; s = clamp(s, 0, 1); l = clamp(l, 0, 1); function f(n) { var k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); } return toHex([f(0) * 255, f(8) * 255, f(4) * 255]); }
  var WAYKINDS = [['night', 'Night'], ['tone', 'Tone'], ['shift', 'Shift'], ['soft', 'Soft'], ['rotate', 'Swap'], ['bright', 'Bright'], ['shift2', 'Shift']];
  function wayKinds() { var R = E.rng(U.waySeed * 977 + 3), pool = WAYKINDS.slice(), out = []; if (U.waySeed === 1) return [WAYKINDS[0], WAYKINDS[1], WAYKINDS[2]]; while (out.length < 3) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; }
  function wayMap(kind) {
    var base = colorsInUse(), map = {}, R = E.rng(U.waySeed * 31 + kind.length), H = base.map(hsl), lead = H.slice().sort(function (a, b) { return b[1] - a[1]; })[0] || [0, 0, 0];
    var turn = kind === 'shift' ? .33 : kind === 'shift2' ? .58 : 0; if (turn && U.waySeed !== 1) turn += (R() - .5) * .16;
    base.forEach(function (h, i) {
      var c = H[i], n = h;
      if (kind === 'night') n = fromHsl(c[0], c[1], 1 - c[2] * .92);
      else if (kind === 'tone') n = c[1] < .06 ? h : fromHsl(lead[0], Math.max(.25, c[1] * .85), c[2]);
      else if (kind === 'shift' || kind === 'shift2') n = c[1] < .06 ? h : fromHsl(c[0] + turn, c[1], c[2]);
      else if (kind === 'soft') n = fromHsl(c[0], c[1] * .42, .3 + c[2] * .62);
      else if (kind === 'bright') n = c[1] < .06 ? h : fromHsl(c[0], Math.min(1, c[1] * 1.35 + .15), clamp(c[2], .3, .62));
      else if (kind === 'rotate') n = base[(i + 1) % base.length];
      if (n !== h) map[h] = n;
    });
    return map;
  }
  function remap(doc, map) {
    var f = function (h) { if (!h) return h; var k = toHex(h); return map[k] || h; };
    var arts = {}; doc.layers.forEach(function (L) { if (L.t === 'art' && !L.tint) arts[L.aid] = 1; });
    var am = doc.artMap || (doc.artMap = {});
    Object.keys(arts).forEach(function (aid) { artBase(aid).forEach(function (k) { var cur = am[k] || k; if (map[cur]) am[k] = map[cur]; }); });
    if (doc.ground !== 'none') doc.ground = f(doc.ground); if (doc.fab) doc.fab.c = fabColors(doc).map(f);
    doc.layers.forEach(function (L) { if (L.c) L.c = f(L.c); if (L.tint) L.tint = f(L.tint); if (L.ol) L.ol.c = f(L.ol.c); });
    doc.pal = doc.pal.map(f);
  }
  function wayDoc(i) { if (!i) return D; var d = clone(D); remap(d, withDoc(d, function () { return wayMap(wayKinds()[i - 1][0]); })); return d; }

  /* ---------- the view ---------- */
  var view = $('view'), VG = view.getContext('2d'), HIT = null, GUIDES = [], raf = 0;
  function fit() { var r = view.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), w = Math.round(r.width * d), h = Math.round(r.height * d); if (view.width !== w || view.height !== h) { view.width = w; view.height = h; } }
  function draw() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; drawNow(); }); }
  function drawNow() {
    fit(); var g = VG, W = view.width, H = view.height; if (!W || !H) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    var u = W / 390;
    if (U.adj) { drawAdj(g, W, H, u); return; }
    if (U.view !== 'tile' && !U.plain) {
      var across = (U.view === 'yard' ? 42 : U.view === 'swatch' ? 8 : D.tileIn * 1.6) / (U.zoom || 1), ppi = W / across, t = tile(ppi);
      g.fillStyle = g.createPattern(t, 'repeat'); g.fillRect(0, 0, W, H); HIT = null; placeCtx(0, 0, false); SV = { pp: ppi, tw: t.width, th: t.height };
      laycloth(g, W, H, D.cloth, ppi);
      if (U.view === 'yard') yardMarks(g, W, H, ppi, u, false, 50 * u);
      var ti = tileInches();
      lbl((U.view === 'yard' ? '42 in across, on ' + clothShort(D.cloth).toLowerCase() : U.view === 'swatch' ? '8 in swatch, on ' + clothShort(D.cloth).toLowerCase() : '') + (NUMS ? (U.view === 'tile' ? '' : ', ') + 'repeat ' + inch(ti[0]) + ' x ' + inch(ti[1]) : '')); return;
    }
    // Tile view: the block big in the middle, its repeats faded around it
    var side = (HAND === 'left' ? 64 : 8) * u, aw = W - side - (HAND === 'left' ? 8 : 64) * u, top = 52 * u, ah = H - top - 34 * u;
    var ZM = U.zoom || 1, ppi2 = Math.min(aw * .9 / D.tileIn, ah * .9 / tileHt()) * ZM, t2 = tile(ppi2), B = blockB(ppi2), Bh = blockBh(ppi2), ox = side + (aw - B) / 2 + (ZM > 1 ? (U.panX || 0) : 0), oy = top + (ah - Bh) / 2 + (ZM > 1 ? (U.panY || 0) : 0);
    var tox = ((ox % t2.width) + t2.width) % t2.width - t2.width, toy = ((oy % t2.height) + t2.height) % t2.height - t2.height;
    if (U.plain) { var tp = withDoc(Object.assign(clone(D), { ground: 'none', fab: null, fade: 1, rep: 'grid', flipAlt: false }), function () { return tile(ppi2); }); g.drawImage(tp, 0, 0, B, Bh, ox, oy, B, Bh); }
    else {
      g.save(); g.translate(tox, toy); g.fillStyle = g.createPattern(t2, 'repeat'); g.fillRect(0, 0, W + t2.width * 2, H + t2.height * 2); g.restore();
      if (seamOn()) seamDraw(g, W, H, ppi2, u, tox, toy);
      g.fillStyle = U.step === 'make' ? 'rgba(242,242,247,.66)' : 'rgba(242,242,247,.3)'; g.fillRect(0, 0, W, oy); g.fillRect(0, oy + Bh, W, H); g.fillRect(0, oy, ox, Bh); g.fillRect(ox + B, oy, W, Bh);
    }
    if (D.grid > 1) { g.save(); g.setLineDash([4 * u, 3 * u]); for (var k = 1; k < D.grid; k++) { var q = B * k / D.grid, qh = Bh * k / D.grid; g.beginPath(); g.moveTo(ox + q, oy); g.lineTo(ox + q, oy + Bh); g.moveTo(ox, oy + qh); g.lineTo(ox + B, oy + qh); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3 * u; g.stroke(); g.strokeStyle = 'rgba(31,42,68,.7)'; g.lineWidth = 1.2 * u; g.stroke(); } g.restore(); }
    g.strokeStyle = '#fff'; g.lineWidth = 3.5 * u; g.strokeRect(ox, oy, B, Bh); g.strokeStyle = '#1f2a44'; g.lineWidth = 1.5 * u; g.strokeRect(ox, oy, B, Bh);
    GUIDES.forEach(function (gd) { g.strokeStyle = '#1f2a44'; g.lineWidth = 1.5 * u; g.beginPath(); if (gd[0] === 'x') { g.moveTo(ox + gd[1] * B, oy - 10 * u); g.lineTo(ox + gd[1] * B, oy + Bh + 10 * u); } else { g.moveTo(ox - 10 * u, oy + gd[1] * Bh); g.lineTo(ox + B + 10 * u, oy + gd[1] * Bh); } g.stroke(); });
    var L = sel();
    if (L) {
      var ct = content(L, B), p = pos(L); if (ct) {
        g.save(); g.translate(ox + p[0] * B, oy + p[1] * Bh); g.rotate((L.r || 0) * Math.PI / 180);
        g.strokeStyle = '#fff'; g.lineWidth = 4 * u; g.strokeRect(-ct.w / 2 - 4 * u, -ct.h / 2 - 4 * u, ct.w + 8 * u, ct.h + 8 * u);
        g.strokeStyle = '#1f2a44'; g.lineWidth = 2 * u; g.setLineDash([6 * u, 4 * u]); g.strokeRect(-ct.w / 2 - 4 * u, -ct.h / 2 - 4 * u, ct.w + 8 * u, ct.h + 8 * u); g.setLineDash([]);
        var hx = ct.w / 2 + 4 * u, hy = -ct.h / 2 - 4 * u; g.fillStyle = '#1f2a44'; g.beginPath(); g.arc(hx, hy, 11 * u, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2 * u; g.beginPath(); g.arc(hx, hy, 5 * u, -2.4, 1.2); g.stroke();
        g.restore();
      }
    }
    HIT = { ox: ox, oy: oy, B: B, Bh: Bh, u: u };
    if (L && !G) { var ct2 = content(L, B), p2 = pos(L); placeCtx(ox + p2[0] * B, oy + p2[1] * Bh - (ct2 ? Math.max(ct2.w, ct2.h) / 2 : 0), true); } else placeCtx(0, 0, false);
    if (L && NUMS) { var ctn = content(L, 1000), pn = pos(L); lbl('Across ' + inch(pn[0] * D.tileIn) + ', down ' + inch(pn[1] * tileHt()) + ', ' + inch(ctn ? ctn.w / 1000 * D.tileIn : 0) + ' wide'); }
    else lbl(seamOn() ? U.seamMsg : U.plain ? 'Just your art. Tap the eye to see it all again.' : L ? '' : !D.layers.length ? 'Tap My art, Words or Symbols to start' : U.step === 'make' ? 'Tap a piece to change it' : 'One repeat is ' + inch(tileInches()[0]) + ' x ' + inch(tileInches()[1]) + ', on ' + clothShort(D.cloth).toLowerCase() + '. Tap a piece to edit it.');
  }
  var FLASH = null;
  function lbl(t) { if (FLASH && Date.now() < FLASH.until) t = FLASH.t; $('lbl').textContent = t; }
  function flash(t) { FLASH = { t: t, until: Date.now() + 4500 }; lbl(t); setTimeout(draw, 4600); }
  function inch(v) { return (Math.round(v * 100) / 100) + ' in'; }
  // Yard view: a ruler in inches along the top with the repeat marked, and the selvage down the left edge
  function yardMarks(g, W, H, ppi, u, big, top) {
    top = top || 0; var rh = (big ? 34 : 24) * u, sv = .6 * ppi, ti = tileInches(), fs = (big ? 13 : 9) * u;
    // selvage: the finished edge of the cloth, printed with the name and the colors
    g.fillStyle = '#f7f4ee'; g.fillRect(0, 0, sv, H); laycloth(g, sv, H, D.cloth, ppi);
    g.fillStyle = 'rgba(26,26,26,.18)'; g.fillRect(sv - Math.max(1, u * .8), 0, Math.max(1, u * .8), H);
    g.save(); g.translate(sv / 2, rh + 10 * u); g.rotate(Math.PI / 2);
    var cols = colorsInUse(), sz = Math.min(sv * .5, 10 * u), x = 0, txt = (D.name || 'My pattern').toUpperCase() + '  NOCIV';
    g.font = '800 ' + Math.min(sv * .42, fs) + 'px ' + getComputedStyle(document.body).fontFamily; g.textBaseline = 'middle';
    while (x < H) { g.fillStyle = '#1a1a1a'; g.fillText(txt, x, 0); x += g.measureText(txt).width + sz; cols.forEach(function (c) { g.fillStyle = c; g.fillRect(x, -sz / 2, sz, sz); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1; g.strokeRect(x, -sz / 2, sz, sz); x += sz * 1.4; }); x += sz * 2; }
    g.restore();
    // ruler
    g.save(); g.translate(0, top); g.fillStyle = 'rgba(251,249,244,.94)'; g.fillRect(0, 0, W, rh); g.fillStyle = '#1a1a1a'; g.fillRect(0, rh - Math.max(1, u), W, Math.max(1, u));
    g.font = '800 ' + fs + 'px ' + getComputedStyle(document.body).fontFamily; g.textAlign = 'center'; g.textBaseline = 'top';
    for (var i = 0; i * ppi <= W; i++) {
      var X = i * ppi, len = i % 12 === 0 ? rh * .55 : i % 6 === 0 ? rh * .4 : rh * .22;
      g.fillRect(X - Math.max(.5, u * .5), rh - len, Math.max(1, u), len);
      if (i && i % 6 === 0 && X < W - 10 * u) g.fillText(String(i), X, 3 * u);
    }
    // the repeat: red marks where each repeat starts
    if (ti[0] > 0) { g.fillStyle = '#1f2a44'; for (var r = 0; r * ti[0] * ppi <= W; r++) { var RX = r * ti[0] * ppi; g.beginPath(); g.moveTo(RX - 5 * u, rh); g.lineTo(RX + 5 * u, rh); g.lineTo(RX, rh + 7 * u); g.closePath(); g.fill(); } }
    var rt = 'Repeat ' + inch(ti[0]) + (Math.abs(ti[0] - ti[1]) > .01 ? ' x ' + inch(ti[1]) : ''), rw = g.measureText(rt).width; g.textAlign = 'left';
    var rx = W - rw - 20 * u; g.fillStyle = 'rgba(251,249,244,.94)'; g.fillRect(rx - 5 * u, rh + 9 * u, rw + 10 * u, fs + 8 * u); g.fillStyle = '#c8412f'; g.fillText(rt, rx, rh + 13 * u); g.restore();
  }

  /* ---------- touch: tap picks, drag moves, pinch sizes, two fingers turn, the red dot sizes and turns with one finger ---------- */
  var PT = {}, G = null, lpTimer = 0;
  function cpt(e) { var r = view.getBoundingClientRect(); return [(e.clientX - r.left) * view.width / r.width, (e.clientY - r.top) * view.height / r.height]; }
  function hitLayer(px, py) {
    if (!HIT) return null; var B = HIT.B;
    for (var i = D.layers.length - 1; i >= 0; i--) {
      var L = D.layers[i]; if (L.hide) continue; var ct = content(L, B), p = pos(L); if (!ct) continue;
      for (var ix = -1; ix <= 1; ix++) for (var iy = -1; iy <= 1; iy++) {
        var dx = px - (HIT.ox + (p[0] + ix) * B), dy = py - (HIT.oy + (p[1] + iy) * HIT.Bh), a = -(L.r || 0) * Math.PI / 180, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
        var pad = 10 * HIT.u; if (Math.abs(lx) < ct.w / 2 + pad && Math.abs(ly) < ct.h / 2 + pad) return L;
      }
    }
    return null;
  }
  function onHandle(px, py) {
    var L = sel(); if (!L || !HIT) return false; var ct = content(L, HIT.B), p = pos(L); if (!ct) return false;
    var a = (L.r || 0) * Math.PI / 180, hx = ct.w / 2 + 4 * HIT.u, hy = -ct.h / 2 - 4 * HIT.u, X = HIT.ox + p[0] * HIT.B + hx * Math.cos(a) - hy * Math.sin(a), Y = HIT.oy + p[1] * HIT.Bh + hx * Math.sin(a) + hy * Math.cos(a);
    return Math.hypot(px - X, py - Y) < 22 * HIT.u;
  }
  // snaps: the center, the guide grid, lined up with another piece, and equal spacing
  // (half way between two pieces, or one more step past them)
  function snapPos(x, y, me) {
    GUIDES = []; if (!HIT) return [x, y]; var tol = 9 * HIT.u / HIT.B, tolY = 9 * HIT.u / (HIT.Bh || HIT.B), xs = [.5], ys = [.5];
    if (D.grid > 1) for (var k = 0; k <= D.grid * 2; k++) { xs.push(k / (D.grid * 2)); ys.push(k / (D.grid * 2)); }
    var others = D.layers.filter(function (o) { return o !== me && !hugShape(o); }).slice(-24);
    others.forEach(function (o, i) {
      xs.push(o.x); ys.push(o.y);
      others.slice(i + 1).forEach(function (q) {
        [[o.x, q.x, xs], [o.y, q.y, ys]].forEach(function (p) { var a = p[0], b = p[1]; if (Math.abs(a - b) < .02) return; p[2].push((a + b) / 2, 2 * b - a, 2 * a - b); });
      });
    });
    function best(v, list, tl) { var bv = null, bd = tl; list.forEach(function (c) { if (c < -.05 || c > 1.05) return; var d = Math.abs(v - c); if (d < bd) { bd = d; bv = c; } }); return bv; }
    var bx = best(x, xs, tol), by = best(y, ys, tolY);
    if (bx != null) { x = bx; GUIDES.push(['x', bx]); } if (by != null) { y = by; GUIDES.push(['y', by]); }
    return [x, y];
  }
  view.addEventListener('pointerdown', function (e) {
    if (U.adj) { adjDown(e); return; }
    if (U.view !== 'tile' && !U.plain) return;
    view.setPointerCapture(e.pointerId); var p = cpt(e); PT[e.pointerId] = p; hideMenu();
    var ids = Object.keys(PT);
    if (ids.length === 1) {
      if (onHandle(p[0], p[1])) { var L0 = sel(), pp = pos(L0); commit(); G = { mode: 'handle', L: L0, cx: HIT.ox + pp[0] * HIT.B, cy: HIT.oy + pp[1] * HIT.Bh, d0: 0, a0: 0, s0: L0.s, r0: L0.r || 0 }; G.d0 = Math.hypot(p[0] - G.cx, p[1] - G.cy); G.a0 = Math.atan2(p[1] - G.cy, p[0] - G.cx); return; }
      var L = hitLayer(p[0], p[1]);
      G = { mode: L ? 'drag' : 'tap', L: L, x0: p[0], y0: p[1], px0: U.panX || 0, py0: U.panY || 0, moved: false, lx: L ? L.x : 0, ly: L ? L.y : 0, committed: false };
      clearTimeout(lpTimer); if (L) lpTimer = setTimeout(function () { if (G && !G.moved && G.L) { U.sel = G.L.id; G = null; showMenu(p); render(); } }, 520);
    } else if (ids.length === 2 && sel()) {
      clearTimeout(lpTimer); var a = PT[ids[0]], b = PT[ids[1]], L2 = sel(); if (!G || !G.committed) commit();
      G = { mode: 'pinch', L: L2, d0: Math.hypot(a[0] - b[0], a[1] - b[1]), a0: Math.atan2(b[1] - a[1], b[0] - a[0]), s0: L2.s, r0: L2.r || 0, committed: true };
    }
  });
  view.addEventListener('pointermove', function (e) {
    if (AG) { adjMove(e); return; }
    if (!PT[e.pointerId] || !G) return; var p = cpt(e); PT[e.pointerId] = p; if (G.L && G.L.lock && Object.keys(PT).length < 2) { if (Math.hypot(p[0] - G.x0, p[1] - G.y0) > 10) G.moved = true; return; }
    if (G.mode === 'handle') { var d = Math.hypot(p[0] - G.cx, p[1] - G.cy), a = Math.atan2(p[1] - G.cy, p[0] - G.cx); G.L.s = clamp(G.s0 * d / Math.max(1, G.d0), .03, 3); G.L.r = Math.round((G.r0 + (a - G.a0) * 180 / Math.PI) / 1) % 360; snapAngle(G.L); draw(); return; }
    if (G.mode === 'pinch') { var ids = Object.keys(PT); if (ids.length < 2) return; var A = PT[ids[0]], Bq = PT[ids[1]]; G.L.s = clamp(G.s0 * Math.hypot(A[0] - Bq[0], A[1] - Bq[1]) / Math.max(1, G.d0), .03, 3); G.L.r = Math.round(G.r0 + (Math.atan2(Bq[1] - A[1], Bq[0] - A[0]) - G.a0) * 180 / Math.PI) % 360; snapAngle(G.L); draw(); return; }
    var dx = p[0] - G.x0, dy = p[1] - G.y0;
    if (!G.moved && Math.hypot(dx, dy) < 8 * (HIT ? HIT.u : 1)) return;
    G.moved = true; clearTimeout(lpTimer);
    if (G.mode === 'tap' && (U.zoom || 1) > 1) { U.panX = (G.px0 || 0) + dx; U.panY = (G.py0 || 0) + dy; draw(); return; }
    if (G.mode === 'drag' && G.L && !G.L.hug && G.L.gcell == null) {
      if (!G.committed) { commit(); G.committed = true; if (U.sel !== G.L.id) { U.sel = G.L.id; U.tool = null; } }
      var s = snapPos(G.lx + dx / HIT.B, G.ly + dy / HIT.Bh, G.L); G.L.x = s[0]; G.L.y = s[1]; draw();
    }
  });
  function snapAngle(L) { [0, 90, 180, 270, -90, -180, -270, 360].forEach(function (v) { if (Math.abs(L.r - v) < 4) L.r = v % 360; }); }
  function up(e) {
    if (AG) { adjUp(); return; }
    delete PT[e.pointerId]; clearTimeout(lpTimer); if (!G) return; var g = G;
    if (Object.keys(PT).length) { if (g.mode === 'pinch') G = { mode: 'none' }; return; }
    G = null; GUIDES = [];
    if (g.mode === 'none') { changed(true); return; }
    if (g.mode === 'handle' || g.mode === 'pinch') { g.L.auto = false; g.L.s = Math.round(g.L.s * 1000) / 1000; changed(true); return; }
    if (!g.moved && D.gs && D.grid > 1 && HIT && (!g.L || g.L.gcell != null)) {
      var bx = (g.x0 - HIT.ox) / HIT.B, by = (g.y0 - HIT.oy) / HIT.Bh;
      if (bx >= 0 && by >= 0 && bx < 1 && by < 1) {
        var gn = D.gs.n, cell = Math.floor(by * gn) * gn + Math.floor(bx * gn); gselect(cell); U.addOpen = null; U.gtool = U.gtool || 'gel';
        var B0 = HIT.B / (U.zoom || 1), Z = Math.min(3, Math.max(1.5, gn / 2)), B1 = B0 * Z; U.zoom = Z; U.panX = -(((cell % gn) + .5) / gn - .5) * B1; U.panY = -((Math.floor(cell / gn) + .5) / gn - .5) * B1 * HIT.Bh / HIT.B;
        render(); return;
      }
      if (U.gsel) { U.gsel = null; U.zoom = 1; U.panX = 0; U.panY = 0; render(); return; }
    }
    if (!g.moved) { var was = U.sel; U.gsel = null; U.sel = g.L ? g.L.id : null; if (U.sel) U.addOpen = null; if (U.sel !== was) U.tool = U.sel ? firstTool(g.L) : null; render(); return; }
    if (g.L) { g.L.x = Math.round(g.L.x * 1000) / 1000; g.L.y = Math.round(g.L.y * 1000) / 1000; }
    changed(true);
  }
  view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);

  /* ---------- long press menu ---------- */
  function showMenu(p) {
    var m = $('menu'), r = view.getBoundingClientRect(), k = r.width / view.width;
    m.innerHTML = '<button data-m="copy">Copy</button><button data-m="front">Front</button><button data-m="back">Back</button><button data-m="del">Delete</button>';
    m.hidden = false; var w = m.offsetWidth; m.style.left = clamp(p[0] * k - w / 2, 6, r.width - w - 6) + 'px'; m.style.top = clamp(p[1] * k - 64, 50, r.height - 50) + 'px';
  }
  function hideMenu() { $('menu').hidden = true; }
  $('menu').addEventListener('click', function (e) { var b = e.target.closest('button[data-m]'); if (!b) return; act(b.dataset.m); hideMenu(); });
  $('ctx').addEventListener('click', function (e) { var b = e.target.closest('button[data-m]'); if (!b) return; act(b.dataset.m); });
  function placeCtx(x, y, on) { var c = $('ctx'); c.classList.toggle('on', !!on); if (!on) return; var r = view.getBoundingClientRect(), k = r.width / view.width, w = c.offsetWidth || 220, tl = $('tools'), rw = tl && tl.classList.contains('on') ? tl.offsetWidth + 14 : 0, lo = (HAND === 'left' ? rw : 0) + w / 2 + 6, hi = r.width - Math.max(HAND === 'left' ? 0 : rw, 60) - w / 2 - 6; c.style.left = (hi < lo ? r.width / 2 : clamp(x * k, lo, hi)) + 'px'; c.style.top = clamp(y * k - 54, 50, r.height - 110) + 'px'; }
  function act(m) {
    var L = sel(); if (!L) return; commit(); var i = D.layers.indexOf(L);
    if (m === 'copy') { var c = clone(L); c.id = uid(); c.x = clamp(L.x + .08, 0, 1); c.y = clamp(L.y + .08, 0, 1); delete c.grp; D.layers.push(c); U.sel = c.id; }
    else if (m === 'del') { D.layers.splice(i, 1); D.layers.forEach(function (x) { if (x.hug === L.id) x.hug = null; }); U.sel = null; U.tool = null; }
    else if (m === 'front') { D.layers.splice(i, 1); D.layers.push(L); }
    else if (m === 'back') { D.layers.splice(i, 1); D.layers.unshift(L); }
    changed();
  }

  /* ---------- adding pieces ---------- */
  function swatchMain() { return D.pal[0] || '#1a1a1a'; }
  function accent() { return D.pal[1] || (contrast('#c8412f', gHex()) > 2 ? '#c8412f' : '#1a1a1a'); }
  function addLayer(L) { U.addOpen = null; commit(); L.id = uid(); if (L.x == null) { L.x = .5; L.y = .5; } if (L.r == null) L.r = 0; if (L.op == null) L.op = 1; D.layers.push(L); U.sel = L.id; U.tool = firstTool(L); changed(); }
  function firstTool(L) { return L.t === 'words' ? 'text' : L.t === 'art' ? 'size' : 'color'; }
  function inkFor() { var c = ['#1a1a1a', '#ffffff'].concat(D.pal); c.sort(function (a, b) { return contrast(b, gHex()) - contrast(a, gHex()); }); return c[0]; }
  function addWords(lay) {
    var hug = null; if (/arc|circle|seal/.test(lay)) { var sh = D.layers.filter(function (x) { return x.t === 'shape'; }).pop(); if (sh) hug = sh.id; }
    addLayer({ t: 'words', tx: 'YOUR WORDS', tx2: lay === 'seal' ? 'EST 2026' : '', f: 'FS Archivo Black', lay: lay, sp: .04, bend: 60, c: inkFor(), y: hug ? .5 : (D.layers.some(function (x) { return Math.hypot(x.x - .5, x.y - .5) < .2; }) ? .86 : .5), x: .5, s: lay === 'line' ? .12 : .09, s0: lay === 'line' ? .12 : .09, auto: true, hug: hug }); fitWords(sel());
    setTimeout(function () { var n = $('wtx'); if (n) { n.focus(); n.select(); } }, 60);
  }

  /* ---------- starters: six patterns from your art ---------- */
  function rnd(seed) { return E.rng(seed); }
  function starterDocs(aid, seed) {
    var R = rnd(seed), pal = D.pal.length ? D.pal : ['#1a1a1a'], main = pal[0], acc = pal[1] || (lum(main) < .4 ? '#c8412f' : '#1a1a1a');
    var light = lum(main) < .35 || pal.length > 1, grounds = light ? ['#f3efe6', '#ffffff', tintOf(main, .88), tintOf(acc, .82)] : ['#1a1a1a', '#1c2b45', '#3f4a2c'];
    function gr(i) { var gnd = grounds[(i + Math.floor(R() * grounds.length)) % grounds.length]; return contrast(main, gnd) < 2.2 ? (lum(main) < .5 ? '#f3efe6' : '#1a1a1a') : gnd; }
    function art(x, y, s, r) { return { id: uid(), t: 'art', aid: aid, x: x, y: y, s: s, r: r || 0, op: 1 }; }
    function base(o) { return Object.assign(freshDoc(), { pal: D.pal.slice() }, o); }
    var j = function (a) { return Math.round(a * (.8 + R() * .4) * 4) / 4; }, tossR = function () { return Math.round((R() - .5) * 60); };
    var mono = [], n = 3; for (var i = 0; i < n * n; i++) { var cx = ((i % n) + .5) / n, cy = (Math.floor(i / n) + .5) / n; mono.push((i % 2 === 0) ? art(cx, cy, .24) : { id: uid(), t: 'sym', k: ['star', 'flower', 'heart', 'sun'][Math.floor(R() * 4)], c: acc, x: cx, y: cy, s: .1, r: 0, op: 1 }); }
    var fabs = [{ k: 'checks', p: 'gingham' }, { k: 'stripes', p: 'breton' }, { k: 'checks', p: 'window' }, { k: 'plaid', p: 'tattersall' }];
    var f = fabs[Math.floor(R() * fabs.length)], fg = tintOf(acc, .55);
    var sym = function (k, x, y, s, c) { return { id: uid(), t: 'sym', k: k, c: c || acc, x: x, y: y, s: s, r: 0, op: 1 }; };
    var shp = function (k, x, y, s, c, o) { return Object.assign({ id: uid(), t: 'shape', k: k, c: c, x: x, y: y, s: s, r: 0, op: 1 }, o || {}); };
    var ico2 = ['star', 'flower', 'heart', 'sun', 'leaf', 'bolt'][Math.floor(R() * 6)], g2 = gr(2);
    var pool = [
      ['Tossed', base({ tileIn: j(6), rep: 'grid', ground: gr(0), layers: [art(.24, .28, .3, tossR()), art(.74, .22, .26, tossR()), art(.52, .74, .3, tossR()), art(.04, .66, .2, tossR())] })],
      ['Grid', base({ tileIn: j(3), rep: 'grid', ground: gr(1), layers: [art(.5, .5, .62)] })],
      ['Half-drop', base({ tileIn: j(3.5), rep: 'halfdrop', ground: gr(2), layers: [art(.5, .5, .56, R() < .5 ? 0 : -12)] })],
      ['Mirrored', base({ tileIn: j(3), rep: 'mirror', mword: 'readable', ground: gr(3), layers: [art(.64, .62, .58, 0)] })],
      ['Monogram', base({ tileIn: j(3.5), rep: 'grid', grid: 3, ground: gr(1), layers: mono })],
      ['On ' + (f.p === 'breton' ? 'stripes' : f.p), base({ tileIn: j(4), rep: 'halfdrop', ground: '#ffffff', fab: { k: f.k, p: f.p, sz: 1, c: ['#ffffff', fg, tintOf(acc, .3), main] }, layers: [art(.5, .5, .5)] })],
      ['Kaleidoscope', base({ tileIn: j(4), rep: 'kale', kale: ['kaleSquare', 'kaleHex'][Math.floor(R() * 2)], ground: gr(0), layers: [art(.62, .5, .42, Math.round(R() * 40))] })],
      ['Big and small', base({ tileIn: j(5), rep: 'halfbrick', ground: gr(3), layers: [art(.5, .5, .5, 0), art(0, 0, .18, 0), art(1, 0, .18), sym(ico2, .5, .02, .07), sym(ico2, .02, .5, .07)] })],
      ['Badge', base({ tileIn: j(3.5), rep: 'halfdrop', ground: g2, layers: [shp(['badge', 'circle', 'shield', 'hex'][Math.floor(R() * 4)], .5, .5, .8, contrast(acc, g2) > 1.6 ? acc : main, { ol: { c: main, w: 'thin' } }), art(.5, .5, .5)] })],
      ['Spaced', base({ tileIn: j(2.5), rep: 'halfdrop', ground: gr(1), layers: [art(.5, .5, .38), sym('star', 0, 0, .06), sym('star', 1, 0, .06)] })],
      ['On checks', base({ tileIn: j(4), rep: 'grid', ground: '#ffffff', fab: { k: 'checks', p: 'board', sz: 1, c: [tintOf(main, .9), tintOf(acc, .7)] }, layers: [shp('circle', .5, .5, .66, '#ffffff'), art(.5, .5, .48)] })],
      ['Up and down', base({ tileIn: j(3), rep: 'toss', ground: gr(2), layers: [art(.5, .5, .5, Math.round((R() - .5) * 30))] })]
    ];
    if (seed === 7) return pool.slice(0, 6);
    var out = []; while (out.length < 6) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    return out;
  }
  var STARTS = null, SEED = 7;
  function showStarters() {
    var aid = (ART[ART.length - 1] || {}).id; if (!aid) return;
    var saved = D; STARTS = starterDocs(aid, SEED);
    $('sgrid').innerHTML = STARTS.map(function (s, i) { return '<button data-si="' + i + '"><canvas width="300" height="300"></canvas>' + esc(s[0]) + '</button>'; }).join('');
    $('starters').hidden = false; $('home').hidden = true;
    var cvs = $('sgrid').querySelectorAll('canvas');
    STARTS.forEach(function (s, i) {
      D = s[1]; tcache = {}; var c = cvs[i], g = c.getContext('2d'), t = tile(c.width / (D.tileIn * 1.9));
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = g.createPattern(t, 'repeat'); g.fillRect(0, 0, c.width, c.height);
    });
    D = saved; tcache = {};
  }
  $('sgrid').addEventListener('click', function (e) { var b = e.target.closest('button[data-si]'); if (!b) return; commit(); D = clone(STARTS[+b.dataset.si][1]); U.started = true; U.sel = null; U.tool = null; $('starters').hidden = true; changed(); });
  $('shuffle').addEventListener('click', function () { SEED = Math.floor(Math.random() * 1e6); showStarters(); });
  $('sclose').addEventListener('click', function () { $('starters').hidden = true; if (!U.started) { U.started = true; keep(); } render(); });
  $('drop').addEventListener('click', function () { WANT = 'start'; $('artfile').click(); });
  $('blank').addEventListener('click', function () { U.started = true; keep(); render(); });
  var WANT = null;
  $('artfile').addEventListener('change', function () {
    var fs = this.files; if (!fs || !fs.length) return; var list = Array.prototype.slice.call(fs); this.value = '';
    pickArt(list).then(function (ids) {
      if (!ids.length) return; var c = IMG[ids[ids.length - 1]];
      if (WANT === 'start' || !D.pal.length) { var cols = artColors(c); D.pal = cols.slice(0, 4); }
      if (WANT === 'start') { WANT = null; keep(); render(); showStarters(); return; }
      WANT = null; addLayer({ t: 'art', aid: ids[ids.length - 1], s: .5 });
    });
  });

  /* ---------- panels ---------- */
  function seg(name, items, cur) { return '<div class="seg" data-sg="' + name + '">' + items.map(function (x) { return '<button type="button" data-v="' + x[0] + '" aria-pressed="' + (String(cur) === String(x[0])) + '">' + x[1] + '</button>'; }).join('') + '</div>'; }
  function stepper(name, label, txt) { return '<div class="row"><b>' + label + '</b><div class="st" data-st="' + name + '"><button type="button" data-d="-1" aria-label="Less">&minus;</button><output>' + txt + '</output><button type="button" data-d="1" aria-label="More">+</button></div></div>'; }
  function swatches(attr, cur) {
    var all = []; D.pal.concat(colorsInUse(), BASIC).forEach(function (h) { h = toHex(h); if (all.indexOf(h) < 0) all.push(h); });
    return '<div class="sw">' + all.slice(0, 20).map(function (h) { return '<button type="button" data-' + attr + '="' + h + '" style="background:' + h + '" aria-label="' + h + '" aria-pressed="' + (toHex(cur || '#000') === h) + '"></button>'; }).join('') + '<label aria-label="Any color">+<input type="color" data-pk="' + attr + '" value="' + toHex(cur || '#1a1a1a') + '"></label></div>';
  }
  function fmtIn(v) { return (Math.round(v * 100) / 100) + ' in' + (NUMS ? ' (' + (Math.round(v * 25.4) / 10) + ' cm)' : ''); }
  function toolsFor() {
    var L = sel();
    if (U.gsel && U.gsel.length) return [['done', 'Done'], ['gel', 'Piece'], ['gink', 'Ink'], ['gback', 'Back'], ['gsize', 'Size']];
    if (!L) return [];
    var t = [['done', 'Done']];
    if (L.t === 'words') t.push(['text', 'Text'], ['font', 'Font']);
    if (L.t === 'shape') t.push(['shape', 'Shape']);
    if (L.t === 'art') t.push(['crop', 'Crop']);
    t.push(['color', 'Color'], ['size', 'Size'], ['copies', 'Copies']);
    return t;
  }
  function toolbar() {
    var list = toolsFor(), tool = curTool();
    $('tools').classList.toggle('on', list.length > 0); if (!list.length) return;
    $('tools').innerHTML = list.map(function (x) { return '<button type="button" data-t="' + x[0] + '" aria-pressed="' + (x[0] === tool) + '"' + (x[0] === 'done' ? ' class="done"' : '') + '>' + ico({ shape: 'ground', gel: 'art', gink: 'color', gback: 'ground', gsize: 'size' }[x[0]] || x[0]) + '<span>' + x[1] + '</span></button>'; }).join('');
  }
  function curTool() { if (U.gsel && U.gsel.length) return ['gel', 'gink', 'gback', 'gsize'].indexOf(U.gtool) >= 0 ? U.gtool : 'gel'; if (!sel()) return U.ptool === 'ground' || U.ptool === 'grid' ? U.ptool : 'ground'; var list = toolsFor().map(function (x) { return x[0]; }); if (U.tool && list.indexOf(U.tool) >= 0) return U.tool; return sel() ? firstTool(sel()) : U.ptool; }
  $('tools').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-t]'); if (!b) return; var t = b.dataset.t;
    if (t === 'done') { U.sel = null; U.tool = null; U.gsel = null; U.zoom = 1; U.panX = 0; U.panY = 0; render(); return; }
    if (/^g(el|ink|back|size)$/.test(t)) { U.gtool = t; render(); return; }
    if (t === 'crop') { cropArt(); return; }
    if (t === 'ideas') { if (ART.length) showStarters(); else { WANT = 'start'; $('artfile').click(); } return; }
    U.tool = t; render();
  });

  function panelHtml() {
    if (U.adj) return adjHtml();
    if (U.layers) return layersHtml();
    if (U.step !== 'make' && (sel() || (U.gsel && U.gsel.length && D.gs))) { var Lp = sel(), tp = curTool(); if (U.gsel && U.gsel.length && D.gs) return squareHtml(tp); return '<p class="ptitle">' + esc(pieceName(Lp)) + '</p>' + toolHtml(tp, Lp); }
    if (U.step === 'look') return lookHtml();
    if (U.step === 'repeat') return repeatHtml();
    if (U.step === 'fabric') return fabricHtml();
    if (U.step === 'save') return saveHtml();
    var L = sel(), t = curTool();
    if (U.gsel && U.gsel.length && D.gs) return squareHtml(t);
    if (U.addOpen) { U.addTab = U.addOpen; return addHtml(true); }
    if (!L) return '<p class="ptitle">Pattern</p><div class="tiles">' + [['ground', 'Color', 'ground'], ['grid', 'Grid', 'grid']].map(function (x) { return '<button type="button" class="tile" data-pt="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + ico(x[2]) + '<small>' + x[1] + '</small></button>'; }).join('') + '</div>' + toolHtml(t, null);
    return '<p class="ptitle">' + esc(pieceName(L)) + '</p>' + toolHtml(t, L);
  }
  function pieceName(L) { if (L.t === 'art') return 'Your art'; if (L.t === 'words') return 'Words'; if (L.t === 'sym') return (SYMS.filter(function (x) { return x[0] === L.k; })[0] || ['', 'Symbol'])[1]; return (SHAPES.filter(function (x) { return x[0] === L.k; })[0] || ['', 'Shape'])[1]; }
  function addHtml(noTabs) {
    {
      var tabs = [['art', 'My art'], ['words', 'Words'], ['sym', 'Symbols'], ['shape', 'Shapes']], at = U.addTab;
      var h = noTabs ? '' : '<div class="tabs5" data-tabs="1">' + tabs.map(function (x) { return '<button type="button" data-tab="' + x[0] + '" aria-pressed="' + (x[0] === at) + '">' + x[1] + '</button>'; }).join('') + (noTabs ? '' : '</div>');
      if (at === 'art') h += '<div class="grid g4">' + ART.map(function (a) { return '<div class="artw"><button type="button" class="pick" data-addart="' + a.id + '"><canvas data-mini="art:' + a.id + '" width="120" height="72"></canvas></button><button type="button" class="artx" data-delart="' + a.id + '" aria-label="Remove this art">&times;</button></div>'; }).join('') + '<button type="button" class="pick" data-a="upload">' + ico('add') + 'Add art</button></div>';
      if (at === 'words') h += '<div class="grid g4">' + LAYS.map(function (x) { return '<button type="button" class="pick" data-addw="' + x[0] + '"><canvas data-mini="lay:' + x[0] + '" width="120" height="72"></canvas>' + x[1] + '</button>'; }).join('') + '</div>';
      if (at === 'sym') h += '<div class="grid g4">' + SYMS.map(function (x) { return '<button type="button" class="pick" data-adds="' + x[0] + '"><canvas data-mini="sym:' + x[0] + '" width="120" height="72"></canvas>' + x[1] + '</button>'; }).join('') + '</div>';
      if (at === 'shape') h += '<div class="grid g5">' + SHAPES.map(function (x) { return '<button type="button" class="pick" data-addsh="' + x[0] + '"><canvas data-mini="shape:' + x[0] + '" width="96" height="72"></canvas>' + x[1] + '</button>'; }).join('') + '</div>';
      if (at === 'fab') {
        var fp = function (k, list) { return '<div class="grid g4" style="margin-bottom:8px">' + list.map(function (x) { var on = D.fab && D.fab.k === k && D.fab.p === x[0]; return '<button type="button" class="pick" data-fab="' + k + ':' + x[0] + '" aria-pressed="' + on + '"><canvas data-mini="fab:' + k + ':' + x[0] + '" width="120" height="72"></canvas>' + x[1] + '</button>'; }).join('') + '</div>'; };
        h += '<button type="button" class="btn" data-fab="none">' + (D.fab ? 'No fabric (plain ground)' : 'Plain ground (picked)') + '</button><p class="h">Checks</p>' + fp('checks', CHECKS) + '<p class="h">Plaid</p>' + fp('plaid', E.PLAIDS.filter(function (x) { return x[0] !== 'gingham'; })) + '<p class="h">Stripes</p>' + fp('stripes', E.STRIPES);
      }
      return h;
    }
  }
  function toolHtml(t, L) {
    if (t === 'ideas') return '<button type="button" class="btn yel" data-a="ideas">' + (ART.length ? 'Show 6 patterns from my art' : 'Pick my art for 6 patterns') + '</button><p class="note">Six ready patterns made from your art and its colors. Shuffle for more.</p>';
    if (t === 'repeat') return '<div class="seg" data-sg="rep" style="margin-bottom:6px">' + REPS.slice(0, 3).map(sb('rep')).join('') + '</div><div class="seg" data-sg="rep" style="margin-bottom:8px">' + REPS.slice(3).map(sb('rep')).join('') + '</div>' +
      (D.rep === 'mirror' ? '<div class="row"><b>Mirror</b>' + seg('mdir', [['both', 'Both ways'], ['lr', 'Left-right'], ['ud', 'Up-down']], D.mdir) + '</div><div class="row"><b>Words</b>' + seg('mword', [['readable', 'Readable'], ['flip', 'True mirror']], D.mword) + '</div>' : '') +
      (D.rep === 'kale' ? '<div class="row"><b>Slices</b>' + seg('kale', [['kaleSquare', 'Square'], ['kaleHex', 'Hexagon'], ['kaleTri', 'Triangle']], D.kale) + '</div>' : '') +
      stepper('tile', 'Tile', tileLabel());
    if (t === 'ground') return '<p class="h">Background color</p><button type="button" class="pick nocol" data-gnd="none" aria-pressed="' + (D.ground === 'none') + '" style="min-height:40px;margin-bottom:8px;flex-direction:row;gap:8px"><i class="clear"></i>No color, just my art</button>' + swatches('gnd', D.ground === 'none' ? '' : D.ground) + (D.fab ? '<div style="height:8px"></div>' + stepper('fsz', 'Fabric', Math.round((D.fab.sz || 1) * 100) + '%') + '<button type="button" class="btn" data-a="fabcols">Mix up fabric colors</button><button type="button" class="btn" data-fab="none">Remove fabric</button>' : '<p class="note" style="margin-top:8px">Plaid, stripes and checks are under +, Fabrics.</p>');
    if (t === 'grid') return stepper('grid', 'Grid', D.grid > 1 ? D.grid + ' x ' + D.grid : 'Off') + (D.grid > 1 ? '<div class="row"><b>Squares</b>' + seg('gsq', [['0', 'Guide only'], ['1', 'Use squares']], D.gs ? '1' : '0') + '</div>' : '') + '<p class="note">' + (D.gs ? 'Tap a square on the picture to style it. Change one, a row, a column, all, or every square with the same piece.' : 'A guide for placing pieces. Use squares turns it into a grid you fill and style square by square.') + '</p>';
    if (t === 'xgrid') return stepper('grid', 'Grid', D.grid > 1 ? D.grid + ' x ' + D.grid : 'Off') + '<p class="note">A guide for placing pieces. Pieces snap to it. It never prints.</p>';
    if (!L) return '';
    if (t === 'text') {
      var hugOK = /arc|circle|seal/.test(L.lay), shapes = D.layers.filter(function (x) { return x.t === 'shape'; });
      return '<div class="row"><input class="txt" id="wtx" maxlength="60" value="' + esc(L.tx) + '" placeholder="' + (L.lay === 'seal' ? 'Top words' : 'Your words') + '" autocomplete="off"></div>' +
        (L.lay === 'seal' ? '<div class="row"><input class="txt" id="wtx2" maxlength="60" value="' + esc(L.tx2) + '" placeholder="Bottom words" autocomplete="off"></div>' : '') +
        '<div class="grid g4" style="margin-bottom:8px">' + LAYS.map(function (x) { return '<button type="button" class="pick" data-lay="' + x[0] + '" aria-pressed="' + (L.lay === x[0]) + '" style="min-height:40px">' + x[1] + '</button>'; }).join('') + '</div>' +
        (hugOK && !L.hug ? stepper('bend', 'Curve', Math.round(L.bend || 60) + '%') : '') + stepper('sp', 'Spacing', Math.round((L.sp || 0) * 100) + '%') +
        (hugOK && shapes.length ? '<button type="button" class="btn' + (L.hug ? ' dark' : '') + '" data-a="hug">' + (L.hug ? 'Wrapped around the shape (tap to free)' : 'Wrap around the shape') + '</button>' : '');
    }
    if (t === 'font') return '<div class="grid g4">' + FONTS.map(function (f) { return '<button type="button" class="pick" data-font="' + f[0] + '" aria-pressed="' + (L.f === f[0]) + '"><span style="font:19px/1.1 \'' + f[0] + '\',sans-serif">' + esc((L.tx || 'Aa').slice(0, 3)) + '</span>' + f[1] + '</button>'; }).join('') +
      '<button type="button" class="pick" data-font="@mine" aria-pressed="' + (L.f === '@mine') + '"><canvas data-mini="mine:' + esc((L.tx || 'Aa').slice(0, 3)) + '" width="120" height="40"></canvas>Mine</button></div><button type="button" class="btn" data-a="letters" style="margin-top:8px">' + (LETTERS ? 'Change my lettering match' : 'Match my lettering from a PNG') + '</button>';
    if (t === 'shape') return '<div class="grid g5">' + SHAPES.map(function (x) { return '<button type="button" class="pick" data-shk="' + x[0] + '" aria-pressed="' + (L.k === x[0]) + '"><canvas data-mini="shape:' + x[0] + '" width="96" height="72"></canvas>' + x[1] + '</button>'; }).join('') + '</div>';
    if (t === 'color') {
      if (L.t === 'art') { var a = artInfo(L.aid) || {}; return '<div class="row"><b>Color</b>' + seg('tint', [['0', 'As it is'], ['1', 'One color']], L.tint ? '1' : '0') + '</div>' + (L.tint ? swatches('col', L.tint) : '') + '<div class="row" style="margin-top:8px"><b>White</b>' + seg('white', [['1', 'Remove white'], ['0', 'Keep white']], a.white ? '1' : '0') + '</div>'; }
      if (L.t === 'shape' && L.k !== 'ring') {
        var fl = L.fab ? L.fab.k + ':' + L.fab.p : '', FP = [['checks', 'board', 'Checker'], ['checks', 'gingham', 'Gingham'], ['checks', 'houndstooth', 'Hounds'], ['checks', 'window', 'Window']].concat(E.PLAIDS.filter(function (x) { return x[0] !== 'gingham'; }).slice(0, 4).map(function (x) { return ['plaid', x[0], x[1]]; })).concat(E.STRIPES.slice(0, 4).map(function (x) { return ['stripes', x[0], x[1]]; }));
        return '<div class="row"><b>Inside</b>' + seg('sfill', [['color', 'Color'], ['fab', 'Fabric']], L.fab ? 'fab' : 'color') + '</div>' + swatches('col', L.c) +
          (L.fab ? '<div class="grid g4" style="margin-top:8px">' + FP.map(function (x) { var k = x[0] + ':' + x[1]; return '<button type="button" class="pick" data-sfab="' + k + '" aria-pressed="' + (fl === k) + '"><canvas data-mini="sfab:' + k + '" width="120" height="60"></canvas>' + esc(x[2]) + '</button>'; }).join('') + '</div>' : '') +
          '<div class="row" style="margin-top:10px"><b>Outline</b>' + seg('ol', [['', 'None'], ['thin', 'Thin'], ['thick', 'Thick']], L.ol ? L.ol.w : '') + '</div>' + (L.ol ? swatches('olc', L.ol.c) : '');
      }
      return swatches('col', L.c);
    }
    if (t === 'size') return stepper('size', 'Size', Math.round(L.s * 100) + '%' + (NUMS ? ' (' + inch(L.s * D.tileIn) + ')' : '')) + stepper('turn', 'Turn', (L.r || 0) + '°') +
      (NUMS && !L.hug ? stepper('px', 'Across', inch(L.x * D.tileIn)) + stepper('py', 'Down', inch(L.y * tileHt())) : '') +
      '<div class="row"><b>See through</b>' + seg('op', [['1', 'Solid'], ['0.7', '70%'], ['0.4', '40%']], String(L.op == null ? 1 : L.op)) + '</div>' +
      '<div class="row"><b>Flip</b>' + seg('fl', [['', 'None'], ['x', 'Across'], ['y', 'Down']], L.fl || '') + '</div>' +
      '<div class="grid g4"><button type="button" class="btn" data-a="center">Center</button><button type="button" class="btn" data-m2="copy">Copy</button><button type="button" class="btn" data-m2="front">Front</button><button type="button" class="btn red" data-m2="del">Delete</button></div>';
    if (t === 'copies') return '<p class="note">Fills the grid with copies of this piece. The grid is ' + (D.grid > 1 ? D.grid + ' x ' + D.grid : 'off, so it becomes 3 x 3') + '.</p><div class="grid g3">' + [['all', 'Every square'], ['checker', 'Checker'], ['rows', 'Every other row'], ['cols', 'Every other column'], ['diag', 'Diagonal'], ['frame', 'Frame']].map(function (x) { return '<button type="button" class="pick" data-fill="' + x[0] + '" style="min-height:44px">' + x[1] + '</button>'; }).join('') + '</div>' + (L.grp ? '<button type="button" class="btn" data-a="uncopy" style="margin-top:8px">Remove the copies</button>' : '');
    return '';
  }
  function sb(name) { return function (x) { var cur = name === 'rep' ? D.rep : ''; return '<button type="button" data-v="' + x[0] + '" aria-pressed="' + (cur === x[0]) + '">' + x[1] + '</button>'; }; }
  /* ---------- Repeat step: see your pattern in every repeat, and fill a grid like the Block builder ---------- */
  var MIXES = [['same', 'Same'], ['checker', 'Checker'], ['rows', 'Rows'], ['cols', 'Columns'], ['diag', 'Diagonal'], ['frame', 'Frame'], ['random', 'Random']];
  function freePieces() { return D.layers.filter(function (x) { return x.gcell == null && !x.hug; }); }
  var REPICON = {
    grid: '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
    halfdrop: '<rect x="3" y="2" width="8" height="8"/><rect x="3" y="12" width="8" height="8"/><rect x="13" y="7" width="8" height="8"/><path d="M13 17v5M21 17v5M13 5V2M21 5V2"/>',
    halfbrick: '<rect x="2" y="3" width="8" height="8"/><rect x="12" y="3" width="8" height="8"/><rect x="7" y="13" width="8" height="8"/><path d="M17 13h5M17 21h5M5 13H2M5 21H2"/>',
    mirror: '<path d="M12 2v20"/><path d="M4 7l5 5-5 5z"/><path d="M20 7l-5 5 5 5z"/>',
    toss: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="4" width="7" height="7" transform="rotate(30 17.5 7.5)"/><rect x="4" y="14" width="7" height="7" transform="rotate(-20 7.5 17.5)"/><rect x="14" y="14" width="7" height="7" transform="rotate(60 17.5 17.5)"/>',
    kale: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>'
  };
  function repeatHtml() {
    var gs = D.gs, n = D.grid > 1 ? D.grid : 0, ti = tileInches(), across = Math.floor(42 / Math.max(.1, ti[0]));
    var h = '<p class="ptitle">Repeat</p><div class="grid g3 repk">' + REPS.map(function (x) { return '<button type="button" class="pick" data-rp="' + x[0] + '" aria-pressed="' + (D.rep === x[0]) + '"><svg viewBox="0 0 24 24">' + REPICON[x[0]] + '</svg>' + x[1] + '</button>'; }).join('') + '</div>' +
      (D.rep === 'halfdrop' ? '<div class="row"><b>Drop by</b>' + seg('drop', [['2', '1/2'], ['3', '1/3'], ['4', '1/4']], String(D.drop || 2)) + '</div>' : '') +
      (D.rep === 'halfbrick' ? '<div class="row"><b>Shift by</b>' + seg('shift', [['2', '1/2'], ['3', '1/3'], ['4', '1/4']], String(D.shift || 2)) + '</div>' : '') +
      (D.rep === 'mirror' ? '<div class="row"><b>Mirror</b>' + seg('mdir', [['both', 'Both ways'], ['lr', 'Left-right'], ['ud', 'Up-down']], D.mdir) + '</div><div class="row"><b>Words</b>' + seg('mword', [['readable', 'Readable'], ['flip', 'True mirror']], D.mword) + '</div>' : '') +
      (D.rep === 'toss' ? '<div class="row"><b>Turns</b>' + seg('tturn', [['none', 'None'], ['half', 'Half'], ['quarter', 'Quarter']], D.tturn || 'quarter') + '</div><div class="row"><b>Sizes</b>' + seg('tmix', [['0', 'All the same'], ['1', 'Mix a little']], D.tmix ? '1' : '0') + '</div><button type="button" class="btn" data-a="tshuf" style="margin-bottom:8px">Shuffle the turns</button>' : '') +
      (D.rep === 'kale' ? '<div class="row"><b>Slices</b>' + seg('kale', [['kaleSquare', 'Square'], ['kaleHex', 'Hexagon'], ['kaleTri', 'Triangle']], D.kale) + '</div>' : '') +
      clashHtml() + '<p class="note">One repeat is ' + inch(ti[0]) + ' x ' + inch(ti[1]) + ', about ' + across + ' across a 42 in yard.</p>' +
      (D.layers.length ? allCopiesHtml() : stepper('tile', 'Tile', tileLabel())) +
      '<button type="button" class="rowbtn" data-a="seam"><b>Seam check</b><span>Shows anything that crosses the edge</span><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>' +
      (seamOn() ? '<p class="note warn">' + esc(U.seamMsg) + '</p>' : '');
    var gi = stepper('grid', 'Squares', n ? n + ' x ' + n : 'Off');
    if (!n) return h + fold('gfill', 'Fill a grid', 'Off', gi + '<p class="note">Turn the grid on to fill squares with your pieces: checker, rows, frame and more.</p>');
    h += '<!--GFILL-->'; var h0 = h; h = gi;
    var pieces = freePieces(), slots = U.slots || (gs ? gs.order : []);
    h += '<div class="grid g4" style="margin-bottom:8px">' + MIXES.map(function (x) { var on = (U.mix || (gs && gs.mix) || 'checker') === x[0]; return '<button type="button" class="pick" data-mix="' + x[0] + '" aria-pressed="' + on + '" style="min-height:48px"><canvas data-mini="mix:' + x[0] + '" width="80" height="44" style="height:26px"></canvas>' + x[1] + '</button>'; }).join('') + '</div>';
    if (pieces.length) h += '<p class="note">Tap your pieces in order: the first is A, the next B, up to D.</p><div class="grid g5" style="margin-bottom:8px">' + pieces.map(function (L) { var k = slots.indexOf(L.id); return '<button type="button" class="pick" data-slot="' + L.id + '" aria-pressed="' + (k >= 0) + '" style="position:relative"><canvas data-mini="piece:' + L.id + '" width="80" height="60"></canvas>' + (k >= 0 ? 'ABCD'[k] : '&nbsp;') + '</button>'; }).join('') + '</div>';
    else if (!gs) h += '<p class="note">Add pieces in Make first (art, words, symbols, shapes), then fill the grid with them.</p>';
    if (pieces.length) h += '<button type="button" class="btn dark" data-a="gfill">Fill the grid</button>';
    if (gs) {
      h += '<p class="note">Tap a square to change what is in it. Tap a row or column number to change the whole line.</p><div class="gmap" style="grid-template-columns:28px repeat(' + gs.n + ',1fr)"><span></span>';
      for (var c = 0; c < gs.n; c++) h += '<button type="button" class="gline" data-gcol="' + c + '">' + (c + 1) + '</button>';
      for (var r = 0; r < gs.n; r++) { h += '<button type="button" class="gline" data-grow="' + r + '">' + (r + 1) + '</button>'; for (var c2 = 0; c2 < gs.n; c2++) { var k2 = gs.cells[r * gs.n + c2]; h += '<button type="button" class="gcell" data-gc="' + (r * gs.n + c2) + '">' + (k2 < 0 ? '' : 'ABCD'[k2]) + '</button>'; } }
      h += '</div><button type="button" class="btn" data-a="gclear" style="margin-top:8px">Take the grid off</button>';
    }
    return h0.replace('<!--GFILL-->', '') + fold('gfill', 'Fill a grid', n + ' x ' + n + (gs ? ', filled' : ''), h);
  }
  function mixSlot(mix, r, c, n, k, R) {
    if (mix === 'same') return 0; if (mix === 'checker') return (r + c) % Math.min(2, k); if (mix === 'rows') return r % k; if (mix === 'cols') return c % k; if (mix === 'diag') return (r + c) % k;
    if (mix === 'frame') { var e = r === 0 || c === 0 || r === n - 1 || c === n - 1; return e ? 0 : Math.min(1, k - 1); }
    return Math.floor(R() * k);
  }
  // the grid keeps one template per letter and a letter per square; the squares become real pieces you can still edit in Make
  function gridBuild() {
    var gs = D.gs; D.layers = D.layers.filter(function (x) { return x.gcell == null; }); if (!gs) return;
    gs.cells.forEach(function (k, i) {
      var o = (gs.ov && gs.ov[i]) || {}, cx = ((i % gs.n) + .5) / gs.n, cy = (Math.floor(i / gs.n) + .5) / gs.n;
      if (o.back && o.back !== 'none') D.layers.push({ id: uid(), t: 'shape', k: o.back === 'rounded' ? 'square' : o.back, c: o.bc || '#f3efe6', s: (o.back === 'square' ? 1.08 : .98) * Math.min(1, asp()) / gs.n, x: cx, y: cy, r: 0, op: 1, gcell: i, gback: 1 });
      if (k < 0 || !gs.tpl[k]) return; var t = clone(gs.tpl[k]); t.id = uid(); t.gcell = i; t.x = cx + (o.nx || 0) / gs.n; t.y = cy + (o.ny || 0) / gs.n; delete t.grp;
      if (o.sm) t.s *= o.sm; if (o.r != null) t.r = o.r; if (o.c) { if (t.t === 'art') t.tint = o.c; else t.c = o.c; }
      D.layers.push(t);
    });
  }
  function gridFill() {
    var ids = (U.slots && U.slots.length ? U.slots : freePieces().slice(0, 2).map(function (x) { return x.id; })), n = D.grid > 1 ? D.grid : 3, mix = U.mix || (D.gs && D.gs.mix) || 'checker';
    if (!ids.length) return; commit(); D.grid = n;
    var ar = asp(), tpl = ids.map(function (id) { var L = layer(id), t = clone(L); var ct = content(t, 1000), cw = ct ? ct.w / 1000 : t.s, ch = ct ? ct.h / 1000 : t.s; t.s = t.s * Math.min(1, .82 / n / Math.max(.01, cw), .82 * ar / n / Math.max(.01, ch)); t.r = t.r || 0; return t; });
    var k = tpl.length, R = E.rng(D.seed || 7), cells = [];
    for (var i = 0; i < n * n; i++) cells.push(mixSlot(mix, Math.floor(i / n), i % n, n, k, R));
    D.layers = D.layers.filter(function (x) { return ids.indexOf(x.id) < 0; });
    D.gs = { n: n, mix: mix, order: ids, tpl: tpl, cells: cells }; U.slots = null; gridBuild(); changed();
  }
  /* ---------- squares: the grid as plug and play (like the Block builder) ---------- */
  var BACKS = [['none', 'None'], ['square', 'Square'], ['rounded', 'Rounded'], ['circle', 'Circle'], ['diamond', 'Diamond'], ['hex', 'Hexagon'], ['star', 'Star'], ['shield', 'Shield'], ['arch', 'Arch']];
  var GSCOPE = [['cell', 'Square'], ['row', 'Row'], ['col', 'Column'], ['all', 'All'], ['same', 'Same']];
  function gselect(a) {
    var gs = D.gs, n = gs.n, r = Math.floor(a / n), c = a % n, sc = U.gscope || 'cell', out = [];
    for (var i = 0; i < n * n; i++) { var ok = sc === 'all' || (sc === 'row' && Math.floor(i / n) === r) || (sc === 'col' && i % n === c) || (sc === 'cell' && i === a) || (sc === 'same' && gs.cells[i] === gs.cells[a]); if (ok) out.push(i); }
    U.gsel = out; U.ganchor = a; U.sel = null;
  }
  function gov(i) { var gs = D.gs; gs.ov = gs.ov || {}; return gs.ov[i] || (gs.ov[i] = {}); }
  function gsetAll(fn) { commit(); U.gsel.forEach(function (i) { fn(gov(i), i); }); gridBuild(); changed(); }
  function squareHtml(t) {
    var gs = D.gs, a = U.ganchor, o = (gs.ov && gs.ov[a]) || {}, k = gs.cells[a], tp = gs.tpl[k], n = gs.n;
    var name = (U.gscope || 'cell') === 'cell' ? 'Square ' + (Math.floor(a / n) + 1) + '-' + (a % n + 1) : ({ row: 'Row ' + (Math.floor(a / n) + 1), col: 'Column ' + (a % n + 1), all: 'All squares', same: 'Every ' + (k < 0 ? 'empty' : 'ABCDEFGH'[k]) + ' square' })[U.gscope];
    var h = '<p class="ptitle">' + name + '</p><div class="row">' + seg('gscope', GSCOPE, U.gscope || 'cell') + '</div>';
    if (t === 'gel') {
      h += '<div class="grid g5">' + gs.tpl.map(function (x, i) { return '<button type="button" class="pick" data-gpick="' + i + '" aria-pressed="' + (k === i) + '"><canvas data-mini="tpl:' + i + '" width="80" height="60"></canvas>' + 'ABCDEFGH'[i] + '</button>'; }).join('') + '<button type="button" class="pick" data-gpick="-1" aria-pressed="' + (k < 0) + '"><span class="clear"></span>Empty</button></div>';
      var fp = freePieces(), lib = ART.slice(0, 8);
      h += fold('gnew', 'Add a new piece', 'art, symbol, shape', (fp.length ? '<p class="h">On your canvas</p><div class="grid g5" style="margin-bottom:8px">' + fp.map(function (L) { return '<button type="button" class="pick" data-gnewl="' + L.id + '"><canvas data-mini="piece:' + L.id + '" width="80" height="60"></canvas></button>'; }).join('') + '</div>' : '') +
        (lib.length ? '<p class="h">My art</p><div class="grid g5" style="margin-bottom:8px">' + lib.map(function (x) { return '<button type="button" class="pick" data-gnewa="' + x.id + '"><canvas data-mini="art:' + x.id + '" width="80" height="60"></canvas></button>'; }).join('') + '</div>' : '') +
        '<p class="h">Symbols</p><div class="grid g4" style="margin-bottom:8px">' + SYMS.map(function (x) { return '<button type="button" class="pick" data-gnews="' + x[0] + '"><canvas data-mini="sym:' + x[0] + '" width="80" height="50"></canvas>' + x[1] + '</button>'; }).join('') + '</div>' +
        '<p class="h">Shapes</p><div class="grid g5">' + SHAPES.map(function (x) { return '<button type="button" class="pick" data-gnewh="' + x[0] + '"><canvas data-mini="shape:' + x[0] + '" width="80" height="50"></canvas></button>'; }).join('') + '</div>');
      return h;
    }
    if (t === 'gink') return h + (tp && tp.t === 'art' ? '<div class="row"><b>Art</b>' + seg('gtint', [['0', 'As it is'], ['1', 'One color']], o.c ? '1' : '0') + '</div>' : '') + swatches('gcol', o.c || (tp && (tp.c || tp.tint)) || '#1f2a44');
    if (t === 'gback') return h + '<div class="grid g5" style="margin-bottom:8px">' + BACKS.map(function (x) { return '<button type="button" class="pick" data-gbk="' + x[0] + '" aria-pressed="' + ((o.back || 'none') === x[0]) + '"><canvas data-mini="shape:' + (x[0] === 'none' ? 'ring' : x[0] === 'rounded' ? 'square' : x[0]) + '" width="80" height="50"></canvas>' + x[1] + '</button>'; }).join('') + '</div>' + swatches('gbc', o.bc || '#f3efe6');
    if (t === 'gsize') return h + stepper('gs_s', 'Size', Math.round((o.sm || 1) * 100) + '%') + stepper('gs_r', 'Turn', (o.r || 0) + '°') + stepper('gs_x', 'Across', Math.round((o.nx || 0) * 100) + '%') + stepper('gs_y', 'Down', Math.round((o.ny || 0) * 100) + '%') + '<button type="button" class="btn" data-a="greset">Reset these squares</button>';
    return h;
  }
  function lookHtml() {
    var cols = colorsInUse(), ks = wayKinds();
    return clashHtml() + '<div class="ways">' + [['now', 'Now']].concat(ks).map(function (k, i) { return '<button type="button" class="pick" data-way="' + i + '" aria-pressed="' + (i === 0) + '"><canvas data-mini="way:' + i + '" data-lazy="1" width="150" height="150"></canvas>' + k[1] + '</button>'; }).join('') + '</div>' +
      '<button type="button" class="btn" data-a="wayshuf" style="margin:8px 0">Other colorways</button>' +
      fold('pms', 'Pantone codes', Object.keys(D.pms || {}).filter(function (k) { return D.pms[k]; }).length ? Object.keys(D.pms).filter(function (k) { return D.pms[k]; }).length + ' added' : 'Optional, for the mood board', '<p class="note">Type the Pantone code you matched for each color (like 19-4052 TCX). It prints on the mood board next to the color.</p>' + cols.map(function (h) { return '<div class="row"><b><i class="pmsdot" style="background:' + h + '"></i>' + h.toUpperCase() + '</b><input class="txt" data-pms="' + h + '" maxlength="24" value="' + esc((D.pms || {})[h] || '') + '" placeholder="Pantone code" autocomplete="off"></div>'; }).join('')) +
      '<p class="h">Colors in your pattern</p><p class="note">Change one and every colorway changes with it.</p><div class="sw">' + cols.map(function (h, i) { return '<label style="background:' + h + ';border-style:solid" aria-label="Color ' + (i + 1) + '"><input type="color" data-ci="' + i + '" value="' + h + '"></label>' + (NUMS ? '<span class="hex">' + h + '</span>' : ''); }).join('') + '</div>' +
      '';
  }
  /* ---------- Fabric step: simple on top, depth one tap away ---------- */
  var FKINDS = [['none', 'None'], ['plaid', 'Plaid'], ['stripes', 'Stripes'], ['checks', 'Checks']];
  function presetOf(f) { if (!f) return null; if (f.k === 'plaid') return E.PLAIDS.filter(function (x) { return x[0] === f.p; })[0]; if (f.k === 'stripes') return E.STRIPES.filter(function (x) { return x[0] === f.p; })[0]; return null; }
  function fBands(f) { if (f.k === 'stripes') return f.bands || (presetOf(f) || E.STRIPES[0])[3]; if (f.k === 'plaid') return f.sett || (presetOf(f) || E.PLAIDS[0])[3]; if (f.p === 'gingham') return f.sett || [[0, 6], [1, 6]]; return null; }
  function fColorCount(f) { var b = fBands(f), m = 1; if (b) b.forEach(function (x) { m = Math.max(m, x[0]); }); return Math.max(2, m + 1); }
  function fold(id, label, summary, inner) {
    var open = U.fopen === id;
    return '<button type="button" class="fold" data-fold="' + id + '" aria-expanded="' + open + '"><b>' + label + '</b><span>' + summary + '</span><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>' + (open ? '<div class="foldin">' + inner + '</div>' : '');
  }
  function fabricHtml() {
    var f = D.fab, kind = f ? f.k : 'none';
    var h = '<p class="ptitle">Fabric</p>' + clashHtml() + '<div class="row">' + seg('fkind', FKINDS, kind) + '</div>';
    if (f) {
      var list = kind === 'plaid' ? E.PLAIDS.filter(function (x) { return x[0] !== 'gingham'; }) : kind === 'stripes' ? E.STRIPES : CHECKS;
      h += '<div class="crow" style="margin-bottom:10px">' + list.map(function (x) { return '<button type="button" class="pick" data-fab="' + kind + ':' + x[0] + '" aria-pressed="' + (f.p === x[0]) + '"><canvas data-mini="fab:' + kind + ':' + x[0] + '" width="120" height="72"></canvas>' + x[1] + '</button>'; }).join('') + '</div>';
      var cols = fabColors(), nC = fColorCount(f), fci = Math.min(U.fci || 0, nC - 1);
      h += fold('cols', 'Thread colors', nC + ' colors', '<div class="sw" style="margin-bottom:8px">' + cols.slice(0, nC).map(function (c, i) { return '<button type="button" data-fci="' + i + '" style="background:' + c + '" aria-pressed="' + (i === fci) + '" aria-label="Thread color ' + (i + 1) + '"></button>'; }).join('') + '</div><p class="note">Pick a thread above, then its new color.</p>' + swatches('fcol', cols[fci]));
      var bands = fBands(f);
      if (bands) h += fold('bands', f.k === 'stripes' ? 'Stripes' : 'Bands', bands.length + ' bands', '<div class="bandl">' + bands.map(function (b, i) { return '<div class="bandr"><button type="button" class="bchip" data-bcyc="' + i + '" style="background:' + cols[b[0]] + '" aria-label="Change color"></button><div class="st"><button type="button" data-bw="' + i + ':-1">&minus;</button><output>' + (f.k === 'stripes' ? Math.round(b[1] * 100) / 100 + ' in' : b[1] + ' threads') + '</output><button type="button" data-bw="' + i + ':1">+</button></div><button type="button" class="bx" data-brm="' + i + '" aria-label="Remove">&times;</button></div>'; }).join('') + '</div><button type="button" class="btn" data-a="badd">Add a band</button>');
      if (f.k === 'plaid' || f.p === 'gingham') h += fold('weave', 'Weave', ({ twill: 'Twill', plain: 'Plain', flat: 'Printed' })[f.weave || (f.p === 'gingham' ? 'plain' : 'twill')] + ', ' + (f.tpi || 50) + ' per in', '<div class="row"><b>Weave</b>' + seg('fweave', [['twill', 'Twill'], ['plain', 'Plain'], ['flat', 'Printed']], f.weave || (f.p === 'gingham' ? 'plain' : 'twill')) + '</div><div class="row"><b>Mirror</b>' + seg('fmir', [['1', 'Mirror'], ['0', 'Repeat']], String((f.mirror != null ? f.mirror : (presetOf(f) || [])[4]) ? 1 : 0)) + '</div>' + stepper('ftpi', 'Threads', (f.tpi || 50) + ' per in'));
      if (f.k === 'stripes') h += fold('weave', 'Direction', ({ h: 'Across', v: 'Up and down', d: 'Diagonal' })[f.dir || (presetOf(f) || [])[4] || 'h'], '<div class="row">' + seg('fdir', [['h', 'Across'], ['v', 'Up and down'], ['d', 'Diagonal']], f.dir || (presetOf(f) || [])[4] || 'h') + '</div>');
      h += fold('size', 'Size', Math.round((f.sz || 1) * 100) + '%', stepper('fsz', 'Size', Math.round((f.sz || 1) * 100) + '%'));
    } else h += '<p class="note">Pick Plaid, Stripes or Checks to weave a fabric under your art.</p>';
    h += fold('cloth', 'Printed on', clothShort(D.cloth), clothRow());
    return h;
  }
  function clothRow() {
    var sug = E.SUGGEST[clothKey()] || [];
    return '<div class="crow">' + E.FABRICS.map(function (f) { return '<button type="button" class="pick' + (sug.indexOf(f[0]) >= 0 ? ' fit' : '') + '" data-cloth="' + f[0] + '" aria-pressed="' + (D.cloth === f[0]) + '"><canvas data-mini="cloth:' + f[0] + '" data-lazy="1" width="110" height="80"></canvas>' + esc(clothShort(f[0])) + '</button>'; }).join('') + '</div><p class="note">Red dot = a good fit for this pattern. The cloth is only a preview. Your files stay clean.</p>';
  }
  function shelf() { try { return JSON.parse(localStorage.getItem('nocivPatternShelf') || '[]'); } catch (e) { return []; } }
  function shelfSet(list) { try { localStorage.setItem('nocivPatternShelf', JSON.stringify(list)); return true; } catch (e) { return false; } }
  function saveHtml() {
    var sh = shelf(), ti = tileInches(), on = U.shelfSel ? sh.filter(function (x) { return x.id === U.shelfSel; })[0] : null, ask = '';
    if (U.delAsk) { var it = U.delAsk === 'cur' ? { name: D.name || 'this pattern' } : sh.filter(function (x) { return x.id === U.delAsk; })[0]; if (it) ask = '<div class="ask"><b>Delete ' + esc(it.name || 'this pattern') + '?</b><span>' + (U.delAsk === 'cur' ? 'It leaves My patterns and the canvas goes blank. ' : '') + 'This cannot be undone.</span><div class="grid g2"><button type="button" class="btn red" data-a="sdelok">Delete</button><button type="button" class="btn" data-a="sdelno">Keep</button></div></div>'; }
    var warn = sharpNotes(), big = ti[0] * ti[1] * 90000 > MAXPX;
    return ask + '<div class="row"><b>Name</b><input class="txt" id="pname" maxlength="40" value="' + esc(D.name || '') + '" placeholder="Name this pattern" autocomplete="off"></div>' +
      '<div class="grid g3"><button type="button" class="btn dark" data-a="shelve">' + (U.cur && sh.some(function (x) { return x.id === U.cur; }) ? 'Save changes' : 'Save to My patterns') + '</button><button type="button" class="btn" data-a="dupe">Make a copy</button><button type="button" class="btn" data-a="newp">New pattern</button></div>' +
      (U.msg ? '<p class="note" style="color:var(--ink)"><b>' + esc(U.msg) + '</b></p>' : '') +
      '<p class="h">My patterns</p>' + (sh.length ? '<div class="shelf">' + sh.map(function (x) { return '<div class="artw"><button type="button" class="pick" data-shelf="' + x.id + '" aria-pressed="' + (x.id === U.shelfSel) + '"><img src="' + x.th + '" alt="">' + esc(x.name || 'Pattern') + (x.id === U.cur ? ' (open)' : '') + '</button><button type="button" class="artx" data-sdelx="' + x.id + '" aria-label="Delete this pattern">&times;</button></div>'; }).join('') + '</div>' : '<p class="note">Saved patterns show here, on this phone.</p>') +
      (on ? '<div class="grid g3" style="margin-top:8px">' + (on.id !== U.cur ? '<button type="button" class="btn dark" data-a="sopen">Open</button><button type="button" class="btn" data-a="scomp">Compare</button>' : '<button type="button" class="btn" data-a="scomp" disabled style="opacity:.4">It is open</button><span></span>') + '<button type="button" class="btn red" data-a="sdel">Delete</button></div>' : '') +
      '<p class="h" style="margin-top:12px">Files</p><button type="button" class="btn dark" data-a="png">Tile for printing (PNG, ' + (big ? 'high quality' : '300 DPI') + ')</button>' +
      (warn.length ? '<p class="note warn">' + warn.map(esc).join('<br>') + '</p>' : '') +
      '<div class="grid g3"><button type="button" class="btn" data-a="pdf">Tile PDF</button><button type="button" class="btn" data-a="sw">8 in swatch</button><button type="button" class="btn" data-a="yardpic">Yard on cloth</button></div><div class="grid g3"><button type="button" class="btn" data-a="mood">Mood board</button><button type="button" class="btn" data-a="moodpdf">Mood board PDF</button><button type="button" class="btn" data-a="png150">Smaller file</button></div>' +
      '<p class="note">The tile repeats on its own. Tile size: ' + fmtIn(ti[0]) + ' by ' + fmtIn(ti[1]) + (NUMS ? ', ' + Math.round(ti[0] * fileDpi(300)) + ' x ' + Math.round(ti[1] * fileDpi(300)) + ' px at ' + fileDpi(300) + ' DPI, sRGB' : '') + '.</p>' +
      fold('print', 'Get it printed', '4 shops, from about $16 a yard', printHtml());
  }
  var MAXPX = 16e6;
  function fileDpi(want) { var ti = tileInches(); return Math.min(want, Math.floor(Math.sqrt(MAXPX / Math.max(.01, ti[0] * ti[1])))); }
  function tileInches() { if (D.rep === 'kale') { var t = tile(20); return [t.width / 20, t.height / 20]; } var cp = copies(); return [D.tileIn * cp.w, tileHt() * cp.h]; }
  function colorsInUse() {
    var out = []; function push(h) { if (!h) return; h = toHex(h); if (out.indexOf(h) < 0) out.push(h); }
    if (D.ground !== 'none') push(D.ground); if (D.fab) fabColors().slice(0, 4).forEach(push);
    var am = D.artMap || {};
    D.layers.forEach(function (L) { if (L.t === 'art') { if (L.tint) push(L.tint); else artBase(L.aid).forEach(function (k) { push(am[k] || k); }); } else { push(L.c); if (L.ol) push(L.ol.c); } });
    return out;
  }
  function swapColor(oldH, newH) { var m = {}; m[toHex(oldH)] = toHex(newH); remap(D, m); }

  // little pictures inside the panel
  // pictures of your pattern (colorways, cloths) are only drawn when they scroll into view
  var IO = window.IntersectionObserver ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { IO.unobserve(e.target); mini(e.target); } }); }) : null;
  function minis(root) {
    Array.prototype.forEach.call((root || $('panel')).querySelectorAll('canvas[data-mini]'), function (c) { if (c.dataset.lazy && IO) IO.observe(c); else mini(c); });
  }
  function mini(c) {
      var id = c.dataset.mini, i = id.indexOf(':'), what = id.slice(0, i), v = id.slice(i + 1), g = c.getContext('2d'), W = c.width, H = c.height, m = Math.min(W, H);
      g.clearRect(0, 0, W, H);
      try {
        if (what === 'way') { var wd = wayDoc(+v); withDoc(wd, function () { swatchInto(c, Math.max(3, D.tileIn * 1.4), D.cloth, 200); }); return; }
        if (what === 'cloth') { swatchInto(c, Math.max(2.5, D.tileIn * 1.1), null); var tx = E.fabricTexture(v, 110, 260); g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(tx, 'repeat'); g.fillRect(0, 0, W, H); g.restore(); return; }
        if (what === 'sfab') { var sp = v.split(':'), L0 = sel(), st2 = fabTile({ k: sp[0], p: sp[1], sz: 1 }, 40, L0 ? [tintOf(L0.c, .82), L0.c, tintOf(L0.c, .45), darkOf(L0.c, .45), '#ffffff'] : null); g.fillStyle = g.createPattern(st2, 'repeat'); g.fillRect(0, 0, W, H); return; }
        if (what === 'art') { var a = artCanvas(v), k = Math.min(W / a.width, H / a.height) * .9; g.drawImage(a, (W - a.width * k) / 2, (H - a.height * k) / 2, a.width * k, a.height * k); }
        else if (what === 'sym') { g.translate(W / 2, H / 2); iconDraw(g, v, m * .36, '#1a1a1a'); }
        else if (what === 'shape') { g.translate(W / 2, H / 2); shapePath(g, v, m * .38); if (v === 'ring') { g.lineWidth = m * .07; g.strokeStyle = '#1a1a1a'; g.stroke(); } else { g.fillStyle = '#1a1a1a'; g.fill(); } }
        else if (what === 'lay') { var L = { tx: v === 'seal' ? 'TOP' : 'WORDS', tx2: 'BOTTOM', f: 'FS Archivo Black', lay: v, sp: .04, bend: 70, c: '#1a1a1a', s: 1 }, wc = wordsCanvas(L, 26, 0), k2 = Math.min(W / wc.width, H / wc.height) * .92; g.drawImage(wc, (W - wc.width * k2) / 2, (H - wc.height * k2) / 2, wc.width * k2, wc.height * k2); }
        else if (what === 'rep') { var dv = clone(D); dv.rep = v; withDoc(dv, function () { var ti = tileInches(); swatchInto(c, Math.max(ti[0], ti[1]) * 2.2, null); }); }
        else if (what === 'mix') { var cl = ['#1f2a44', '#d9dce6', '#8b8ea8'], nn2 = 4, cs = Math.min(W / nn2, H / nn2), ox2 = (W - cs * nn2) / 2, oy2 = (H - cs * nn2) / 2, Rm = E.rng(5); for (var yy = 0; yy < nn2; yy++) for (var xx = 0; xx < nn2; xx++) { g.fillStyle = cl[mixSlot(v, yy, xx, nn2, v === 'same' ? 1 : 2, Rm)]; g.fillRect(ox2 + xx * cs + 1, oy2 + yy * cs + 1, cs - 2, cs - 2); } }
        else if (what === 'L') { var lz = layer(v); if (lz) { var lc = clone(lz), ctz = content(lc, 100), kz = ctz ? Math.min(W / ctz.w, H / ctz.h) * .8 : 1; lc.r = lz.r || 0; lc.hide = false; g.save(); g.translate(W / 2, H / 2); g.scale(kz, kz); drawLayer(g, lc, 100, false, false, 'flip'); g.restore(); } }
        else if (what === 'tpl') { var tq = D.gs && D.gs.tpl[+v]; if (tq) { var lq = clone(tq), ctq = content(lq, 100), kq = ctq ? Math.min(W / ctq.w, H / ctq.h) * .8 : 1; g.save(); g.translate(W / 2, H / 2); g.scale(kq, kq); lq.r = 0; drawLayer(g, lq, 100, false, false, 'flip'); g.restore(); } }
        else if (what === 'piece') { var Lp = layer(v); if (Lp) { var lp = clone(Lp), ctp = content(lp, 100), kp = ctp ? Math.min(W / ctp.w, H / ctp.h) * .8 : 1; g.save(); g.translate(W / 2, H / 2); g.scale(kp, kp); lp.r = 0; drawLayer(g, lp, 100, false, false, 'flip'); g.restore(); } }
        else if (what === 'fab') { var p = v.split(':'), sv = D.fab; D.fab = { k: p[0], p: p[1], sz: 1, c: sv && sv.c }; var t = fabTile(D.fab, 40); D.fab = sv; g.fillStyle = g.createPattern(t, 'repeat'); g.fillRect(0, 0, W, H); }
        else if (what === 'mine') { var col = getComputedStyle(c.closest('button')).color; if (!LETTERS) { g.fillStyle = col; g.font = '800 15px ' + getComputedStyle(document.body).fontFamily; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('+ Yours', W / 2, H / 2); } else { var w2 = NocivLetters.word(v || 'Aa', LETTERS.dna, 60, col), k3 = Math.min(W * .9 / w2.width, H * .9 / w2.height); g.drawImage(w2, (W - w2.width * k3) / 2, (H - w2.height * k3) / 2, w2.width * k3, w2.height * k3); } }
      } catch (e) {}
  }

  /* ---------- panel taps ---------- */
  var panelClick;
  function delArt(id) { commit(); ART = ART.filter(function (a) { return a.id !== id; }); D.layers = D.layers.filter(function (x) { return !(x.t === 'art' && x.aid === id); }); if (U.sel && !layer(U.sel)) { U.sel = null; U.tool = null; } idbDel('lib:' + id); idbDel('src:' + id); artVer++; changed(); }
  function setDown(on) { document.body.classList.toggle('cdown', on); U.down = on; var t0 = Date.now(); (function tick() { draw(); if (Date.now() - t0 < 500) requestAnimationFrame(tick); })(); }
  $('grip').addEventListener('click', function () { setDown(!U.down); });
  (function () { var y0 = null; $('grip').addEventListener('pointerdown', function (e) { y0 = e.clientY; }); window.addEventListener('pointerup', function (e) { if (y0 == null) return; var dy = e.clientY - y0; y0 = null; if (dy > 24) setDown(true); else if (dy < -24) setDown(false); }); })();
  $('addbar').addEventListener('click', function (e) { var b = e.target.closest('button[data-tab]'); if (!b) return; var t = b.dataset.tab; U.addOpen = U.addOpen === t ? null : t; U.addTab = t; if (U.addOpen) { U.sel = null; U.tool = null; } if (U.down) setDown(false); render(); });
  function openAdd() { U.addOpen = U.addTab || 'art'; U.sel = null; U.tool = null; if (U.down) setDown(false); render(); $('fab').classList.remove('pulse'); try { localStorage.setItem('nocivPattern2Fab', '1'); } catch (e) {} }
  $('fab').addEventListener('click', openAdd);
  var ZOOMS = [.5, .75, 1, 1.5, 2, 3];
  $('zoom').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.id === 'zbtn') { $('zoom').classList.toggle('open'); return; }
    var i = ZOOMS.indexOf(U.zoom || 1); if (i < 0) i = 2; i = clamp(i + (b.id === 'zplus' ? 1 : -1), 0, ZOOMS.length - 1); U.zoom = ZOOMS[i]; if (U.zoom <= 1) { U.panX = 0; U.panY = 0; }
    $('zval').textContent = Math.round(U.zoom * 100) + '%'; draw();
  });
  $('trash').addEventListener('click', function () {
    if (sel()) { act('del'); return; }
    if (U.step === 'save') { if (!D.layers.length && !U.cur) return; U.delAsk = 'cur'; U.shelfSel = null; render(); $('panel').scrollTop = 0; return; }
    if (sel()) { act('del'); return; }
    if (!D.layers.length && !D.fab) return;
    shelve(false); commit(); D = freshDoc(); U.cur = null; U.sel = null; U.tool = null; U.ptool = 'ground'; U.view = 'tile'; flash('Fresh start. Last design saved in My patterns.'); changed();
  });
  $('addSheet').addEventListener('click', function (e) {
    if (e.target === $('addSheet')) { $('addSheet').hidden = true; return; }
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tab) { U.addTab = b.dataset.tab; $('addIn').innerHTML = addHtml(); minis($('addIn')); return; }
    if (b.dataset.delart) { delArt(b.dataset.delart); $('addIn').innerHTML = addHtml(); minis($('addIn')); return; var id = b.dataset.delart; commit(); ART = ART.filter(function (a) { return a.id !== id; }); D.layers = D.layers.filter(function (x) { return !(x.t === 'art' && x.aid === id); }); if (U.sel && !layer(U.sel)) { U.sel = null; U.tool = null; } idbDel('lib:' + id); idbDel('src:' + id); artVer++; changed(); $('addIn').innerHTML = addHtml(); minis($('addIn')); return; }
    $('addSheet').hidden = true; if (b.dataset.fab) { U.sel = null; U.ptool = 'ground'; } panelClick(e);
  });
  $('panel').addEventListener('click', panelClick = function (e) {
    var b = e.target.closest('button'); if (!b) return; var d = b.dataset, L = sel(), sg = b.closest('[data-sg]'), st = b.closest('[data-st]');
    if (U.adj) {
      var aa = U.adj;
      if (d.a === 'adjok') return adjClose(true); if (d.a === 'adjno') return adjClose(false);
      if (d.a === 'adjfit') { adjFit(); return render(); }
      if (sg && sg.dataset.sg === 'adjsq') { aa.sq = d.v === '1'; if (aa.sq) { var cw = aa.w, ch = aa.h; adjFix(aa); aa.fx += (cw - aa.w) / 2; aa.fy += (ch - aa.h) / 2; } return render(); }
      if (st && d.d && st.dataset.st === 'adjk') {
        var Lm = mainArt(), base = Lm ? artWidthIn(Lm) : 0; if (!base) return;
        var cur = base * (aa.k || 1), stp = cur < 2 ? .25 : .5, nv = Math.max(.25, Math.round((cur + d.d * stp) / stp) * stp);
        aa.k = adjClampK(aa, nv / base); AV = null; return render();
      }
      if (st && d.d && (st.dataset.st === 'adjw' || st.dataset.st === 'adjh')) {
        var isW = st.dataset.st === 'adjw', ow = aa.w, oh = aa.h, ins = adjOut(aa), kq = aa.k || 1;
        if (isW) aa.w = (ins[0] + d.d * .25) / kq / D.tileIn; else aa.h = (ins[1] + d.d * .25) / kq / tileHt();
        adjFix(aa, isW ? 'w' : 'h'); aa.fx -= (aa.w - ow) / 2; aa.fy -= (aa.h - oh) / 2; return render();
      }
      return;
    }
    if (st && st.dataset.st === 'yards' && d.d) { U.yards = clamp((U.yards || 1) + +d.d, 1, 50); return render(); }
    if (d.sdelx) { U.delAsk = d.sdelx; U.shelfSel = null; render(); $('panel').scrollTop = 0; return; }
    if (d.a === 'sdelno') { U.delAsk = false; return render(); }
    if (d.a === 'sdelok') {
      var did = U.delAsk; U.delAsk = false; if (!did) return render();
      if (did === 'cur') { if (U.cur) shelfSet(shelf().filter(function (x) { return x.id !== U.cur; })); var palk = D.pal.slice(); D = freshDoc(); D.pal = palk; U.cur = null; U.sel = null; U.tool = null; HIST = []; FUT = []; U.msg = 'Deleted. You have a blank canvas.'; return changed(); }
      shelfSet(shelf().filter(function (x) { return x.id !== did; })); if (U.cur === did) U.cur = null; U.shelfSel = null; U.msg = 'Deleted.'; keep(); return render();
    }
    if (d.a === 'png150') { saveFile('png150'); return; }
    if (d.pt) { U.ptool = d.pt; return render(); }
    if (d.fold) { U.fopen = U.fopen === d.fold ? null : d.fold; return render(); }
    if (d.fci != null) { U.fci = +d.fci; return render(); }
    if (d.fcol && D.fab) { commit(); D.fab.c = fabColors().slice(); D.fab.c[U.fci || 0] = d.fcol; fcache = {}; return changed(); }
    if ((d.bcyc != null || d.bw || d.brm != null || d.a === 'badd') && D.fab) {
      commit(); var f = D.fab, key = f.k === 'stripes' ? 'bands' : 'sett', bl = clone(fBands(f)), nC = fColorCount(f), cl = fabColors();
      if (d.bcyc != null) { var bi = +d.bcyc; bl[bi][0] = (bl[bi][0] + 1) % Math.min(cl.length, nC + 1); }
      else if (d.bw) { var pr = d.bw.split(':'), wi = +pr[0], dw = +pr[1]; bl[wi][1] = f.k === 'stripes' ? clamp(Math.round((bl[wi][1] + dw * .05) * 100) / 100, .02, 4) : clamp(bl[wi][1] + dw * 2, 1, 120); }
      else if (d.brm != null) { if (bl.length > 2) bl.splice(+d.brm, 1); }
      else { var last = bl[bl.length - 1]; bl.push([(last[0] + 1) % nC, f.k === 'stripes' ? .25 : 6]); }
      f[key] = bl; fcache = {}; return changed();
    }
    if (d.gpick != null && D.gs && U.gsel) { commit(); U.gsel.forEach(function (i) { D.gs.cells[i] = +d.gpick; }); gridBuild(); return changed(); }
    if ((d.gnewl || d.gnewa || d.gnews || d.gnewh) && D.gs && U.gsel) {
      var nt = d.gnewl ? clone(layer(d.gnewl)) : d.gnewa ? { t: 'art', aid: d.gnewa, s: .5, r: 0, op: 1 } : d.gnews ? { t: 'sym', k: d.gnews, c: accent(), s: .5, r: 0, op: 1 } : { t: 'shape', k: d.gnewh, c: accent(), s: .5, r: 0, op: 1 };
      if (!nt) return; delete nt.id; delete nt.gcell; var ctn = content(nt, 1000), cw2 = ctn ? ctn.w / 1000 : nt.s, ch2 = ctn ? ctn.h / 1000 : nt.s; nt.s = nt.s * Math.min(.82 / D.gs.n / Math.max(.01, cw2), .82 * asp() / D.gs.n / Math.max(.01, ch2));
      commit(); D.gs.tpl.push(nt); var ni = D.gs.tpl.length - 1; U.gsel.forEach(function (i) { D.gs.cells[i] = ni; }); U.fopen = null; gridBuild(); return changed();
    }
    if (d.gcol && U.gsel) { gsetAll(function (o) { o.c = d.gcol; }); return; }
    if (d.gbk && U.gsel) { gsetAll(function (o) { o.back = d.gbk; if (!o.bc) o.bc = '#f3efe6'; }); return; }
    if (d.gbc && U.gsel) { gsetAll(function (o) { o.bc = d.gbc; if (!o.back || o.back === 'none') o.back = 'square'; }); return; }
    if (d.a === 'greset' && U.gsel) { commit(); U.gsel.forEach(function (i) { if (D.gs.ov) D.gs.ov[i] = {}; }); gridBuild(); return changed(); }
    if (sg && d.v != null && /^(fkind|fweave|fmir|fdir|gsq|gscope|gtint)$/.test(sg.dataset.sg)) {
      var k0 = sg.dataset.sg, v0 = d.v;
      if (k0 === 'gscope') { U.gscope = v0; gselect(U.ganchor); return render(); }
      commit();
      if (k0 === 'fkind') { if (v0 === 'none') D.fab = null; else if (!D.fab || D.fab.k !== v0) { var first = v0 === 'plaid' ? 'buffalo' : v0 === 'stripes' ? 'breton' : 'gingham'; D.fab = { k: v0 === 'checks' ? 'checks' : v0, p: first, sz: 1, c: D.fab && D.fab.c }; } }
      else if (k0 === 'fweave') D.fab.weave = v0; else if (k0 === 'fmir') D.fab.mirror = v0 === '1'; else if (k0 === 'fdir') D.fab.dir = v0;
      else if (k0 === 'gtint') { U.gsel.forEach(function (i) { var o = gov(i); o.c = v0 === '1' ? (o.c || swatchMain()) : null; }); gridBuild(); }
      else if (k0 === 'gsq') {
        if (v0 === '1' && !D.gs) { var fp0 = freePieces(); if (fp0.length) { U.slots = fp0.slice(0, 2).map(function (x) { return x.id; }); U.mix = 'checker'; HIST.pop(); gridFill(); return; } var nn = D.grid > 1 ? D.grid : 3, cc = []; for (var q = 0; q < nn * nn; q++) cc.push(-1); D.gs = { n: nn, mix: 'checker', order: [], tpl: [], cells: cc, ov: {} }; }
        else if (v0 === '0') { D.layers.forEach(function (x) { delete x.gcell; delete x.gback; }); D.gs = null; U.gsel = null; }
      }
      fcache = {}; return changed();
    }
    if (d.rp) { commit(); D.rep = d.rp; return changed(); }
    if (d.a === 'adjgo') { adjOpen(); if (U.adj) { U.adj.prev = 'tile'; } return; }
    if (d.a === 'laydone') { U.layers = false; return render(); }
    if (d.lpick) { var Lk = layer(d.lpick); U.layers = false; U.view = 'tile'; pickPiece(Lk); return render(); }
    if (d.lhide) { commit(); var Lh = layer(d.lhide); Lh.hide = !Lh.hide; if (Lh.hide && U.sel === Lh.id) { U.sel = null; U.tool = null; } return changed(); }
    if (d.llock) { commit(); var Ll = layer(d.llock); Ll.lock = !Ll.lock; return changed(); }
    if (d.lgrid) { commit(); var hid = !D.layers.some(function (x) { return x.gcell != null && x.hide; }); D.layers.forEach(function (x) { if (x.gcell != null) x.hide = hid; }); return changed(); }
    if (d.lup || d.ldn) { commit(); var id0 = d.lup || d.ldn, li = D.layers.findIndex(function (x) { return x.id === id0; }), dir = d.lup ? 1 : -1, j = li + dir; while (j >= 0 && j < D.layers.length && (D.layers[j].gcell != null || D.layers[j].gback)) j += dir; if (j >= 0 && j < D.layers.length) { var tmp = D.layers[li]; D.layers.splice(li, 1); D.layers.splice(j, 0, tmp); } return changed(); }
    if (d.a === 'plain') { U.plain = true; U.view = 'tile'; return render(); }
    if (d.a === 'artblk' || d.a === 'artwht') { commit(); var hx = d.a === 'artblk' ? '#1a1a1a' : '#ffffff'; D.layers.forEach(function (x) { if (x.gback) return; if (x.t === 'art') x.tint = hx; else x.c = hx; }); return changed(); }
    if (st && d.d && ['rsize', 'gapx', 'gapy', 'rturn', 'nudx', 'nudy'].indexOf(st.dataset.st) >= 0) {
      var nn = st.dataset.st, dd2 = +d.d; commit();
      if (nn === 'rsize') { var Lm2 = mainArt(), aw2 = Lm2 ? artWidthIn(Lm2) : 0; if (aw2) { var stp2 = aw2 < 2 ? .25 : .5, nv2 = Math.max(.25, Math.round((aw2 + dd2 * stp2) / stp2) * stp2), k2 = nv2 / aw2, hh0 = tileHt(); k2 = Math.min(k2, 24 / D.tileIn, 24 / hh0); k2 = Math.max(k2, .25 / D.tileIn, .25 / hh0); D.tileIn = Math.round(D.tileIn * k2 * 100) / 100; if (D.tileH) D.tileH = Math.round(D.tileH * k2 * 100) / 100; } }
      else if (nn === 'gapx' || nn === 'gapy') { var gp2 = gaps(); if (gp2) { var u2 = gp2[2], cx2 = (u2[0] + u2[2]) / 2, cy2 = (u2[1] + u2[3]) / 2, bw2 = u2[2] - u2[0], bh2 = u2[3] - u2[1], gx = gp2[0], gy = gp2[1]; if (nn === 'gapx') gx = Math.round((gx + dd2 * .25) * 4) / 4; else gy = Math.round((gy + dd2 * .25) * 4) / 4; setTile(bw2 + gx, D.rep === 'kale' ? bw2 + gx : bh2 + gy, cx2, cy2); } }
      else if (nn === 'rturn') turnAll(dd2 * 15);
      else { D.layers.forEach(function (x) { if (x.hug) return; if (nn === 'nudx') x.x = Math.round(((x.x + dd2 * .05) % 1 + 1) % 1 * 1000) / 1000; else x.y = Math.round(((x.y + dd2 * .05) % 1 + 1) % 1 * 1000) / 1000; }); }
      return changed();
    }
    if (d.a === 'seam') { seamCheck(); return; }
    if (d.a === 'tshuf') { commit(); D.tseed = (D.tseed || 0) + 1; return changed(); }
    if (d.mix) { U.mix = d.mix; if (D.gs) { commit(); var R2 = E.rng(Math.floor(Math.random() * 1e6)); D.gs.mix = d.mix; D.gs.cells = D.gs.cells.map(function (_, i) { return mixSlot(d.mix, Math.floor(i / D.gs.n), i % D.gs.n, D.gs.n, D.gs.tpl.length, R2); }); gridBuild(); return changed(); } return render(); }
    if (d.slot) { var sl = (U.slots || []).slice(), at = sl.indexOf(d.slot); if (at >= 0) sl.splice(at, 1); else if (sl.length < 4) sl.push(d.slot); U.slots = sl; return render(); }
    if (d.a === 'gfill') { gridFill(); return; }
    if (d.a === 'gclear') { commit(); D.gs = null; gridBuild(); return changed(); }
    if (d.gc != null && D.gs) { commit(); var gi = +d.gc, kk = D.gs.tpl.length; D.gs.cells[gi] = D.gs.cells[gi] + 1 >= kk ? -1 : D.gs.cells[gi] + 1; gridBuild(); return changed(); }
    if ((d.grow != null || d.gcol != null) && D.gs) { commit(); var gn = D.gs.n, line = []; for (var q = 0; q < gn; q++) line.push(d.grow != null ? (+d.grow) * gn + q : q * gn + (+d.gcol)); var nx = D.gs.cells[line[0]] + 1 >= D.gs.tpl.length ? -1 : D.gs.cells[line[0]] + 1; line.forEach(function (ci) { D.gs.cells[ci] = nx; }); gridBuild(); return changed(); }
    if (d.delart) { delArt(d.delart); return; }
    if (d.a === 'ideas') { if (ART.length) showStarters(); else { WANT = 'start'; $('artfile').click(); } return; }
    if (d.a === 'upload') { WANT = null; $('artfile').click(); return; }
    if (d.addart) { if (!D.pal.length && IMG[d.addart]) D.pal = artColors(IMG[d.addart]).slice(0, 4); addLayer({ t: 'art', aid: d.addart, s: .5 }); return; }
    if (d.addw) { addWords(d.addw); return; }
    if (d.adds) { addLayer({ t: 'sym', k: d.adds, c: accent(), s: .2 }); return; }
    if (d.addsh) { addLayer({ t: 'shape', k: d.addsh, c: accent(), s: .5 }); return; }
    if (d.fab) { U.addOpen = null; if (d.fab !== 'none') { U.sel = null; U.ptool = 'ground'; } commit(); if (d.fab === 'none') D.fab = null; else { var p = d.fab.split(':'); D.fab = { k: p[0], p: p[1], sz: D.fab ? D.fab.sz : 1, c: D.fab && D.fab.c }; } return changed(); }
    if (d.a === 'fabcols') { commit(); var fc = fabColors().slice(), first = fc.shift(); fc.push(first); D.fab.c = fc; return changed(); }
    if (d.a === 'letters') { openLetters(); return; }
    if (d.a === 'png' || d.a === 'pdf' || d.a === 'sw' || d.a === 'yardpic' || d.a === 'mood' || d.a === 'moodpdf') { saveFile(d.a); return; }
    if (d.way != null) { var wi = +d.way; if (!wi) return; commit(); var wm = wayMap(wayKinds()[wi - 1][0]); remap(D, wm); return changed(); }
    if (d.a === 'wayshuf') { U.waySeed = Math.floor(Math.random() * 1e6) + 2; return render(); }
    if (d.cloth) { commit(); D.cloth = d.cloth; if (U.view === 'tile') U.view = 'swatch'; return changed(); }
    if (d.a === 'shelve') { shelve(false); return render(); }
    if (d.a === 'dupe') { shelve(false); D.name = (D.name || 'My pattern') + ' copy'; U.cur = null; shelve(true); U.msg = 'Copy made. You are working on the copy now.'; return render(); }
    if (d.a === 'newp') { shelve(false); var pal = D.pal.slice(); D = freshDoc(); D.pal = pal; U.cur = null; U.started = false; U.sel = null; U.tool = null; U.step = 'make'; U.view = 'tile'; HIST = []; FUT = []; U.msg = ''; return changed(); }
    if (d.shelf) { U.shelfSel = U.shelfSel === d.shelf ? null : d.shelf; U.delAsk = false; return render(); }
    if (d.a === 'sopen') { var it = shelf().filter(function (x) { return x.id === U.shelfSel; })[0]; if (!it) return; shelve(false); D = Object.assign(freshDoc(), clone(it.d)); U.cur = it.id; U.shelfSel = null; U.sel = null; U.tool = null; HIST = []; FUT = []; U.msg = 'Opened ' + (D.name || 'pattern') + '.'; return changed(); }
    if (d.a === 'scomp') { compare(U.shelfSel); return; }
    if (d.a === 'sdel') { U.delAsk = U.shelfSel; render(); $('panel').scrollTop = 0; return; }
    if (sg && sg.dataset.sg === 'sfill' && L) { commit(); L.fab = d.v === 'fab' ? (L.fab || { k: 'checks', p: 'gingham', sz: 1 }) : null; return changed(); }
    if (sg && sg.dataset.sg === 'ol' && L) { commit(); L.ol = d.v ? { c: (L.ol && L.ol.c) || (contrast('#1a1a1a', L.c) > 3 ? '#1a1a1a' : '#ffffff'), w: d.v } : null; return changed(); }
    if (d.sfab && L) { commit(); var sp2 = d.sfab.split(':'); L.fab = { k: sp2[0], p: sp2[1], sz: 1 }; return changed(); }
    if (d.olc && L && L.ol) { commit(); L.ol.c = d.olc; return changed(); }
    if (sg && d.v != null) {
      var k = sg.dataset.sg, v = d.v; commit();
      if (k === 'rep') D.rep = v; else if (k === 'flipalt') D.flipAlt = v === '1'; else if (k === 'fade') { if (+v === 1) delete D.fade; else D.fade = +v; } else if (k === 'drop') D.drop = +v; else if (k === 'shift') D.shift = +v; else if (k === 'tturn') D.tturn = v; else if (k === 'tmix') D.tmix = v === '1'; else if (k === 'mdir') D.mdir = v; else if (k === 'mword') D.mword = v; else if (k === 'kale') D.kale = v;
      else if (L && k === 'tint') L.tint = v === '1' ? (L.tint || swatchMain()) : null;
      else if (L && k === 'white') { var a = artInfo(L.aid); if (a) { a.white = v === '1'; artVer++; pcache = {}; } }
      else if (L && k === 'op') L.op = +v; else if (L && k === 'fl') L.fl = v;
      return changed();
    }
    if (st && d.d) {
      var n = st.dataset.st, dd = +d.d; commit();
      if (n === 'tile') { var tw0 = D.tileIn; D.tileIn = clamp(Math.round((D.tileIn + dd * .5) * 10) / 10, 1, 24); if (D.tileH) D.tileH = clamp(Math.round(D.tileH * D.tileIn / tw0 * 100) / 100, .5, 24); }
      else if (n === 'ftpi' && D.fab) { D.fab.tpi = clamp((D.fab.tpi || 50) + dd * 5, 10, 120); fcache = {}; }
      else if (/^gs_[srxy]$/.test(n) && U.gsel) { U.gsel.forEach(function (i) { var o = gov(i); if (n === 'gs_s') o.sm = clamp(Math.round(((o.sm || 1) + dd * .1) * 10) / 10, .2, 3); else if (n === 'gs_r') o.r = ((o.r || 0) + dd * 15 + 360) % 360; else if (n === 'gs_x') o.nx = clamp(Math.round(((o.nx || 0) + dd * .05) * 100) / 100, -.5, .5); else o.ny = clamp(Math.round(((o.ny || 0) + dd * .05) * 100) / 100, -.5, .5); }); gridBuild(); }
      else if (n === 'grid') {
        var og = D.grid; D.grid = D.grid <= 1 ? (dd > 0 ? 3 : 0) : (D.grid + dd < 2 ? 0 : clamp(D.grid + dd, 2, 9));
        if (D.gs) { if (D.grid < 2) D.gs = null; else { var on = D.gs.n, nn = D.grid, R3 = E.rng(7); D.gs.tpl.forEach(function (t) { t.s = t.s * on / nn; }); D.gs.n = nn; D.gs.cells = []; for (var gi2 = 0; gi2 < nn * nn; gi2++) D.gs.cells.push(mixSlot(D.gs.mix, Math.floor(gi2 / nn), gi2 % nn, nn, D.gs.tpl.length, R3)); } gridBuild(); }
      }
      else if (n === 'fsz' && D.fab) D.fab.sz = clamp(Math.round(((D.fab.sz || 1) + dd * .25) * 100) / 100, .25, 4);
      else if (L && n === 'size') L.auto = false, L.s = clamp(Math.round((L.s + dd * .02) * 100) / 100, .03, 3);
      else if (L && n === 'turn') L.r = ((L.r || 0) + dd * 15 + 360) % 360;
      else if (L && n === 'px') L.x = clamp(Math.round((L.x * D.tileIn + dd * .1) * 100) / 100 / D.tileIn, 0, 1);
      else if (L && n === 'py') L.y = clamp(Math.round((L.y * tileHt() + dd * .1) * 100) / 100 / tileHt(), 0, 1);
      else if (L && n === 'bend') L.bend = clamp((L.bend || 60) + dd * 10, 15, 180);
      else if (L && n === 'sp') L.sp = clamp(Math.round(((L.sp || 0) + dd * .02) * 100) / 100, -.1, .8);
      return changed();
    }
    if (!L) return;
    if (d.col) { commit(); if (L.t === 'art') L.tint = d.col; else L.c = d.col; return changed(); }
    if (d.lay) { commit(); L.lay = d.lay; if (/arc|circle|seal/.test(d.lay) && !L.tx2 && d.lay === 'seal') L.tx2 = 'EST 2026'; if (!/arc|circle|seal/.test(d.lay)) L.hug = null; return changed(); }
    if (d.font) { if (d.font === '@mine' && !LETTERS) { openLetters(); return; } commit(); L.f = d.font; return changed(); }
    if (d.shk) { commit(); L.k = d.shk; return changed(); }
    if (d.a === 'hug') { commit(); if (L.hug) { var hs = layer(L.hug); if (hs) { L.x = hs.x; L.y = hs.y; } L.hug = null; } else { var sh = D.layers.filter(function (x) { return x.t === 'shape'; }); var best = sh.sort(function (p1, p2) { return Math.hypot(p1.x - L.x, p1.y - L.y) - Math.hypot(p2.x - L.x, p2.y - L.y); })[0]; if (best) L.hug = best.id; } return changed(); }
    if (d.a === 'center') { commit(); L.x = .5; L.y = .5; return changed(); }
    if (d.m2) { act(d.m2); return; }
    if (d.fill) { fillCopies(L, d.fill); return; }
    if (d.a === 'uncopy') { commit(); var gid = L.grp; D.layers = D.layers.filter(function (x) { return x.grp !== gid || x.id === L.id; }); delete L.grp; return changed(); }
  });
  $('panel').addEventListener('input', function (e) {
    var t = e.target, L = sel();
    if (t.id === 'wtx' && L) { if (!t._c) { commit(); t._c = 1; } L.tx = t.value; fitWords(L); keep(); draw(); return; }
    if (t.id === 'wtx2' && L) { if (!t._c) { commit(); t._c = 1; } L.tx2 = t.value; keep(); draw(); return; }
    if (t.id === 'pname') { D.name = t.value.slice(0, 40); keep(); return; }
    if (t.dataset.pms) { D.pms = D.pms || {}; D.pms[t.dataset.pms] = t.value.slice(0, 24); keep(); return; }
    if (t.dataset.pk) { if (!t._c) { commit(); t._c = 1; } var a = t.dataset.pk, v = t.value; if (a === 'fcol' && D.fab) { D.fab.c = fabColors().slice(); D.fab.c[U.fci || 0] = v; keep(); tcache = {}; fcache = {}; draw(); return; }
      if ((a === 'gcol' || a === 'gbc') && D.gs && U.gsel) { U.gsel.forEach(function (i) { var o = gov(i); if (a === 'gcol') o.c = v; else { o.bc = v; if (!o.back || o.back === 'none') o.back = 'square'; } }); gridBuild(); keep(); tcache = {}; draw(); return; }
      if (a === 'gnd') D.ground = v; else if (L && a === 'olc' && L.ol) L.ol.c = v; else if (L && a === 'col') { if (L.t === 'art') L.tint = v; else L.c = v; } keep(); draw(); return; }
    if (t.dataset.ci != null) { if (!t._c) { commit(); t._c = 1; t._old = colorsInUse()[+t.dataset.ci]; } swapColor(t._old, t.value); t._old = toHex(t.value); keep(); draw(); }
  });
  $('panel').addEventListener('change', function (e) { if (e.target.dataset.pk || e.target.dataset.ci != null) render(); });
  $('panel').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; var d = b.dataset, L = sel(); if (d.gnd) { commit(); D.ground = d.gnd; changed(); } });
  // new words start small enough to fit the tile; once you size them yourself they stay your size
  function fitWords(L) {
    if (!L.auto || L.hug) return; var B = 1000, ct = content(L, B); if (!ct) return;
    var lim = /arc|circle|seal/.test(L.lay) ? .95 : .9, k = Math.min(1, lim * B / Math.max(ct.w, ct.h)); if (k < 1) L.s = Math.max(.03, Math.round(L.s * k * 1000) / 1000);
    else if (L.s < L.s0) L.s = Math.min(L.s0, Math.round(L.s / Math.max(.01, Math.max(ct.w, ct.h) / (lim * B)) * 1000) / 1000);
  }
  function fillCopies(L, how) {
    commit(); var n = D.grid > 1 ? D.grid : 3; D.grid = n; var gid = L.grp || uid();
    D.layers = D.layers.filter(function (x) { return x.grp !== gid || x.id === L.id; }); L.grp = gid;
    var cells = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      var ok = how === 'all' || (how === 'checker' && (r + c) % 2 === 0) || (how === 'rows' && r % 2 === 0) || (how === 'cols' && c % 2 === 0) || (how === 'diag' && r === c) || (how === 'frame' && (r === 0 || c === 0 || r === n - 1 || c === n - 1));
      if (ok) cells.push([(c + .5) / n, (r + .5) / n]);
    }
    L.s = Math.min(L.s, .8 / n); L.x = cells[0][0]; L.y = cells[0][1];
    var at = D.layers.indexOf(L);
    cells.slice(1).forEach(function (p, i) { var c2 = clone(L); c2.id = uid(); c2.x = p[0]; c2.y = p[1]; D.layers.splice(at + 1 + i, 0, c2); });
    changed();
  }

  /* ---------- Match my lettering (same engine as before, letters.js) ---------- */
  var LS = { img: null, res: null, dna: null, say: '', tryW: '' };
  var LDIAL = { lw: ['weight', .01, .02, .42, 'Weight'], lc: ['contrast', .1, 0, .85, 'Thick and thin'], lwd: ['width', .05, .6, 1.8, 'Width'], lsq: ['square', 1, 2, 10, 'Corners'], lsl: ['slant', 2, -20, 20, 'Slant'], ltr: ['track', .02, -.05, .8, 'Spacing'], lxh: ['xh', .02, .38, .75, 'x-height'] };
  function openLetters() {
    LS.dna = LETTERS ? Object.assign({}, LETTERS.dna) : Object.assign({}, NocivLetters.DEF); LS.say = LETTERS ? LETTERS.say : '';
    idbGet('letters:src').then(function (b) { return b ? blobToCanvas(b) : null; }).then(function (c) { LS.img = c; lsRender(); });
    $('lsheet').hidden = false; lsRender();
  }
  function lsTxt(k) { var dl = LDIAL[k], v = LS.dna[dl[0]]; if (k === 'lsq') return v <= 2 ? 'Round' : v >= 8 ? 'Square' : 'Between ' + v; if (k === 'lsl') return v + '°'; if (k === 'lc') return v ? Math.round(v * 100) + '%' : 'None'; return Math.round(v * 100) + '%'; }
  function lsRender() {
    var d = LS.dna, low = d.kase !== 'upper', st = LS.res ? (LS.res.found === LS.res.typed ? 'Found ' + LS.res.found + ' letters. Measured.' : 'Found ' + LS.res.found + ' shapes, you typed ' + LS.res.typed + ' letters. Check the spelling.') : '';
    $('lsIn').innerHTML = '<button type="button" class="x" data-lx="close" aria-label="Close">&times;</button><h2>Match my lettering</h2><p class="note">Upload the words you made. We redraw A to Z in the same style. Not the font itself.</p>' +
      '<button type="button" class="btn dark" data-lx="up">' + (LS.img ? 'Use another PNG' : 'Upload your words (PNG)') + '</button>' +
      '<div class="row"><b>It says</b><input class="txt" id="lsay" maxlength="24" value="' + esc(LS.say) + '" placeholder="Type exactly what it says" autocomplete="off"></div>' +
      (LS.img ? '<button type="button" class="btn" data-lx="measure">Measure it</button>' : '') + (st ? '<p class="note">' + esc(st) + '</p>' : '') +
      '<canvas id="lcv" width="760" height="420" style="width:100%;height:auto;border:1.5px solid var(--ink);border-radius:12px;background:#fff;margin:6px 0"></canvas>' +
      '<div class="row"><b>Try</b><input class="txt" id="ltry" maxlength="24" value="' + esc(LS.tryW) + '" placeholder="Type the client\'s words" autocomplete="off"></div>' +
      ['lw', 'lc', 'lwd', 'lsq', 'lsl', 'ltr'].concat(low ? ['lxh'] : []).map(function (k) { return stepper(k, LDIAL[k][4], lsTxt(k)); }).join('') +
      '<div class="row"><b>Ends</b>' + seg('lends', [['flat', 'Flat'], ['round', 'Round']], d.ends) + '</div><div class="row"><b>Serifs</b>' + seg('lserif', [['none', 'None'], ['thin', 'Thin'], ['slab', 'Slab']], d.serif) + '</div>' +
      (low ? '<div class="row"><b>a</b>' + seg('la', [['0', 'Two story'], ['1', 'One story']], d.a1 ? '1' : '0') + '</div>' : '') + '<button type="button" class="btn dark" data-lx="use">Use my lettering</button>';
    lsDraw();
  }
  function lsDraw() {
    var c = $('lcv'); if (!c) return; var g = c.getContext('2d'), W = c.width, H = c.height; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#8a8780'; g.font = '700 20px ' + getComputedStyle(document.body).fontFamily; g.fillText('YOURS', 14, 26); g.fillText('OURS', 14, H / 3 + 26); g.fillText('TRY', 14, H * 2 / 3 + 26);
    function f(im, y0) { if (!im) return; var k = Math.min((W - 28) / im.width, (H / 3 - 40) / im.height); g.drawImage(im, (W - im.width * k) / 2, y0 + 34 + (H / 3 - 40 - im.height * k) / 2, im.width * k, im.height * k); }
    f(LS.img, 0); var say = (LS.say || '').trim(); if (say) f(NocivLetters.word(say, LS.dna, 160), H / 3);
    f(NocivLetters.word((LS.tryW || '').trim() || (LS.dna.kase === 'lower' ? 'the quick fox' : 'THE QUICK FOX'), LS.dna, 160), H * 2 / 3);
  }
  function lsMeasure() { if (!LS.img || !(LS.say || '').trim()) return; LS.res = NocivLetters.measure(LS.img, LS.say); LS.dna = LS.res.dna; lsRender(); }
  $('lsheet').addEventListener('click', function (e) {
    if (e.target === $('lsheet')) { $('lsheet').hidden = true; return; }
    var b = e.target.closest('button'); if (!b) return; var d = b.dataset, sg = b.closest('[data-sg]'), st = b.closest('[data-st]');
    if (d.lx === 'close') { $('lsheet').hidden = true; return; }
    if (d.lx === 'up') { $('lfile').click(); return; }
    if (d.lx === 'measure') { lsMeasure(); return; }
    if (d.lx === 'use') { LETTERS = { dna: LS.dna, say: LS.say }; var L = sel(); if (L && L.t === 'words') { commit(); L.f = '@mine'; } $('lsheet').hidden = true; wcache = {}; return changed(); }
    if (st && d.d) { var dl = LDIAL[st.dataset.st]; if (dl) { LS.dna[dl[0]] = Math.round(clamp(LS.dna[dl[0]] + (+d.d) * dl[1], dl[2], dl[3]) * 1000) / 1000; lsRender(); } return; }
    if (sg && d.v != null) { var k = sg.dataset.sg; if (k === 'lends') LS.dna.ends = d.v; else if (k === 'lserif') LS.dna.serif = d.v; else if (k === 'la') LS.dna.a1 = d.v === '1'; lsRender(); }
  });
  $('lsheet').addEventListener('input', function (e) { var t = e.target; if (t.id === 'lsay') { LS.say = t.value; var lo = /[a-z]/.test(t.value), up2 = /[A-Z]/.test(t.value); LS.dna.kase = lo && up2 ? 'mixed' : lo ? 'lower' : 'upper'; lsDraw(); } if (t.id === 'ltry') { LS.tryW = t.value; lsDraw(); } });
  $('lsheet').addEventListener('change', function (e) { if (e.target.id === 'lsay' && LS.img) lsMeasure(); });
  $('lfile').addEventListener('change', function () { var f = this.files && this.files[0]; this.value = ''; if (!f) return; blobToCanvas(f).then(function (c) { LS.img = c; idbSet('letters:src', f); if ((LS.say || '').trim()) lsMeasure(); else lsRender(); }); });


  /* ---------- Adjust tile: a crop frame, rectangle or square; art keeps its real size ---------- */
  // U.adj: fx, fy = frame corner and w, h = frame size, all in units of the current tile (x of its width, y of its height)
  var ADJ = null, AG = null, AV = null;
  function wrap1(v) { v = v - Math.floor(v); return v > .9995 ? 0 : v; }
  function adjLock() { return D.rep === 'kale' || (U.adj && U.adj.sq); }
  function adjIns(a) { return [Math.round(D.tileIn * a.w * 100) / 100, Math.round(tileHt() * a.h * 100) / 100]; }
  // size on fabric: k scales the whole tile with the art in it
  function adjOut(a) { var k = a.k || 1; return [Math.round(D.tileIn * a.w * k * 100) / 100, Math.round(tileHt() * a.h * k * 100) / 100]; }
  function mainArt() { var best = null; D.layers.forEach(function (L) { if (L.gback) return; if (!best || (L.t === 'art') > (best.t === 'art') || ((L.t === 'art') === (best.t === 'art') && L.s > best.s)) best = L; }); return best; }
  function artWidthIn(L) { var ct = content(L, 1000); if (!ct) return 0; var w = ct.w / 1000 * D.tileIn; if (L.t === 'art') { var bx = artBox(L); w *= bx[2] - bx[0]; } return w; }
  function adjClampK(a, k) { var lo = 0, hi = 1e9; [D.tileIn * a.w, tileHt() * a.h].forEach(function (v) { lo = Math.max(lo, .5 / v); hi = Math.min(hi, 24 / v); }); return clamp(k, lo, hi); }
  function adjDoc(a) {
    var d = clone(D), ins = adjIns(a), k = ins[0] / D.tileIn;
    d.layers.forEach(function (L) { if (!L.hug) { L.x = Math.round(wrap1((L.x - a.fx) / a.w) * 1000) / 1000; L.y = Math.round(wrap1((L.y - a.fy) / a.h) * 1000) / 1000; } L.s = Math.round(L.s / k * 1000) / 1000; });
    d.tileIn = ins[0]; if (Math.abs(ins[1] - ins[0]) < .01 || D.rep === 'kale') delete d.tileH; else d.tileH = ins[1]; return d;
  }
  // keep sizes legal (0.5 to 24 in), square when locked, snap to the original
  function adjFix(a, keep) {
    var W0 = D.tileIn, H0 = tileHt(), wi = clamp(a.w * W0, .5, 24), hi = clamp(a.h * H0, .5, 24);
    if (adjLock()) { var sd = keep === 'h' ? hi : keep === 'w' ? wi : Math.max(wi, hi); wi = hi = clamp(sd, .5, 24); }
    if (Math.abs(wi - W0) < W0 * .02) wi = W0; if (Math.abs(hi - H0) < H0 * .02) hi = H0;
    a.w = wi / W0; a.h = hi / H0; if (Math.abs(a.fx) < .015) a.fx = 0; if (Math.abs(a.fy) < .015) a.fy = 0; a.fx = clamp(a.fx, -2, 2); a.fy = clamp(a.fy, -2, 2);
  }
  // where the frame sits at rest: centered and big
  function adjRest(W, H, u) {
    var a = U.adj, top = 88 * u, ah = H - top - 66 * u, aw = W - 76 * u, fw = a.w * D.tileIn, fh = a.h * tileHt(), ppi = Math.min(aw / fw, ah / fh, 260 * u);
    return { ppi: ppi, ox: W / 2 - (a.fx + a.w / 2) * D.tileIn * ppi, oy: top + ah / 2 - (a.fy + a.h / 2) * tileHt() * ppi };
  }
  function pill(g, txt, x, y, u, rot) {
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.font = '800 ' + (13 * u) + 'px ' + getComputedStyle(document.body).fontFamily; g.textAlign = 'center'; g.textBaseline = 'middle';
    var w = g.measureText(txt).width + 16 * u, h = 22 * u; g.fillStyle = '#1f2a44'; g.beginPath(); if (g.roundRect) g.roundRect(-w / 2, -h / 2, w, h, h / 2); else g.rect(-w / 2, -h / 2, w, h); g.fill(); g.fillStyle = '#fff'; g.fillText(txt, 0, 1 * u); g.restore();
  }
  function drawAdj(g, W, H, u) {
    var a = U.adj, R = adjRest(W, H, u);
    if (!AV) AV = R;
    if (!AG) { var dd = Math.abs(AV.ppi - R.ppi) / R.ppi + (Math.abs(AV.ox - R.ox) + Math.abs(AV.oy - R.oy)) / W; if (dd > .002) { AV = { ppi: AV.ppi + (R.ppi - AV.ppi) * .3, ox: AV.ox + (R.ox - AV.ox) * .3, oy: AV.oy + (R.oy - AV.oy) * .3 }; requestAnimationFrame(draw); } else AV = R; }
    var ppi = AV.ppi, Bw = D.tileIn * ppi, Bh = tileHt() * ppi, Fx = AV.ox + a.fx * Bw, Fy = AV.oy + a.fy * Bh, Fw = a.w * Bw, Fh = a.h * Bh;
    if (Object.keys(tcache).length > 80) tcache = {};
    var tc = withDoc(adjDoc(a), function () { return tile(ppi); });
    g.save(); g.translate(((Fx % tc.width) + tc.width) % tc.width - tc.width, ((Fy % tc.height) + tc.height) % tc.height - tc.height); g.fillStyle = g.createPattern(tc, 'repeat'); g.fillRect(0, 0, W + tc.width * 2, H + tc.height * 2); g.restore();
    g.fillStyle = 'rgba(31,42,68,.42)'; g.fillRect(0, 0, W, Fy); g.fillRect(0, Fy + Fh, W, H); g.fillRect(0, Fy, Fx, Fh); g.fillRect(Fx + Fw, Fy, W, Fh);
    g.strokeStyle = '#fff'; g.lineWidth = 5 * u; g.strokeRect(Fx, Fy, Fw, Fh); g.strokeStyle = '#1f2a44'; g.lineWidth = 2.5 * u; g.strokeRect(Fx, Fy, Fw, Fh);
    var L0 = Math.min(26 * u, Fw / 3, Fh / 3); g.lineCap = 'round';
    [[Fx, Fy, 1, 1], [Fx + Fw, Fy, -1, 1], [Fx, Fy + Fh, 1, -1], [Fx + Fw, Fy + Fh, -1, -1]].forEach(function (c) { g.beginPath(); g.moveTo(c[0] + c[2] * L0, c[1]); g.lineTo(c[0], c[1]); g.lineTo(c[0], c[1] + c[3] * L0); g.strokeStyle = '#fff'; g.lineWidth = 10 * u; g.stroke(); g.strokeStyle = '#1f2a44'; g.lineWidth = 6 * u; g.stroke(); });
    if (!adjLock()) { var e = Math.min(30 * u, Fw / 4, Fh / 4); [[Fx + Fw / 2 - e / 2, Fy, Fx + Fw / 2 + e / 2, Fy], [Fx + Fw / 2 - e / 2, Fy + Fh, Fx + Fw / 2 + e / 2, Fy + Fh], [Fx, Fy + Fh / 2 - e / 2, Fx, Fy + Fh / 2 + e / 2], [Fx + Fw, Fy + Fh / 2 - e / 2, Fx + Fw, Fy + Fh / 2 + e / 2]].forEach(function (c) { g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(c[2], c[3]); g.strokeStyle = '#fff'; g.lineWidth = 10 * u; g.stroke(); g.strokeStyle = '#1f2a44'; g.lineWidth = 6 * u; g.stroke(); }); }
    g.lineCap = 'butt';
    var ins = adjOut(a); pill(g, inch(ins[0]), Fx + Fw / 2, Math.max(14 * u, Fy - 18 * u), u); pill(g, inch(ins[1]), Math.max(14 * u, Fx - 18 * u), Fy + Fh / 2, u, -Math.PI / 2);
    ADJ = { ox: AV.ox, oy: AV.oy, Bw: Bw, Bh: Bh, Fx: Fx, Fy: Fy, Fw: Fw, Fh: Fh, u: u };
    HIT = null; placeCtx(0, 0, false); lbl('Repeat ' + inch(ins[0]) + ' x ' + inch(ins[1]) + ' on the fabric.');
  }
  function adjDown(e) {
    if (!ADJ) return; view.setPointerCapture(e.pointerId); var p = cpt(e), A = ADJ, a = U.adj, u = A.u, best = null, bd = 34 * u;
    var cs = [[A.Fx, A.Fy, -1, -1], [A.Fx + A.Fw, A.Fy, 1, -1], [A.Fx, A.Fy + A.Fh, -1, 1], [A.Fx + A.Fw, A.Fy + A.Fh, 1, 1]];
    cs.forEach(function (c) { var d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d < bd) { bd = d; best = c; } });
    var base = { a0: { fx: a.fx, fy: a.fy, w: a.w, h: a.h }, x0: p[0], y0: p[1], v: { ox: A.ox, oy: A.oy, Bw: A.Bw, Bh: A.Bh } };
    if (best) { AG = Object.assign(base, { mode: 'corner', sx: best[2], sy: best[3] }); return; }
    var inY = p[1] > A.Fy && p[1] < A.Fy + A.Fh, inX = p[0] > A.Fx && p[0] < A.Fx + A.Fw, eg = 22 * u;
    if (inY && Math.abs(p[0] - A.Fx) < eg) AG = Object.assign(base, { mode: 'edge', sx: -1, sy: 0 });
    else if (inY && Math.abs(p[0] - A.Fx - A.Fw) < eg) AG = Object.assign(base, { mode: 'edge', sx: 1, sy: 0 });
    else if (inX && Math.abs(p[1] - A.Fy) < eg) AG = Object.assign(base, { mode: 'edge', sx: 0, sy: -1 });
    else if (inX && Math.abs(p[1] - A.Fy - A.Fh) < eg) AG = Object.assign(base, { mode: 'edge', sx: 0, sy: 1 });
    else AG = Object.assign(base, { mode: 'move' });
  }
  function adjMove(e) {
    if (!AG) return; var p = cpt(e), a = U.adj, a0 = AG.a0, V = AG.v, dx = (p[0] - AG.x0) / V.Bw, dy = (p[1] - AG.y0) / V.Bh;
    if (AG.mode === 'move') { a.fx = a0.fx + dx; a.fy = a0.fy + dy; adjFix(a); draw(); return; }
    var w = a0.w, h = a0.h, fx = a0.fx, fy = a0.fy;
    if (AG.sx) w = Math.max(.01, a0.w + AG.sx * dx); if (AG.sy) h = Math.max(.01, a0.h + AG.sy * dy);
    a.w = w; a.h = h; adjFix(a, AG.mode === 'edge' ? (AG.sx ? 'w' : 'h') : null);
    // the opposite side stays put; an edge on a locked square grows from the middle of the other side
    a.fx = AG.sx < 0 ? fx + a0.w - a.w : AG.sx > 0 ? fx : fx + (a0.w - a.w) / 2;
    a.fy = AG.sy < 0 ? fy + a0.h - a.h : AG.sy > 0 ? fy : fy + (a0.h - a.h) / 2;
    draw();
  }
  function adjUp() { if (!AG) return; AG = null; render(); }
  // the inked part of a picture (clear or white edges ignored), as fractions of its size
  var abox = {};
  function artBox(L) {
    var c = artCanvas(L.aid, L.tint); if (!c) return [0, 0, 1, 1]; var key = L.aid + ':' + artVer + ':' + (L.tint || ''); if (abox[key]) return abox[key];
    var k = Math.min(1, 400 / Math.max(c.width, c.height)), w = Math.max(1, Math.round(c.width * k)), h = Math.max(1, Math.round(c.height * k)), m = E.cv(w, h), g = m.getContext('2d'); g.drawImage(c, 0, 0, w, h);
    var d = g.getImageData(0, 0, w, h).data, x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return (abox[key] = x1 < 0 ? [0, 0, 1, 1] : [x0 / w, y0 / h, (x1 + 1) / w, (y1 + 1) / h]);
  }
  function adjFit() {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, W0 = D.tileIn, H0 = tileHt();
    D.layers.forEach(function (L) { var ct = content(L, 1000); if (!ct) return; var p = pos(L), w = ct.w / 1000 * W0, h = ct.h / 1000 * W0, r = (L.r || 0) * Math.PI / 180, ox0 = 0, oy0 = 0;
      if (L.t === 'art') { var bx = artBox(L), fxs = L.fl === 'x' ? -1 : 1, fys = L.fl === 'y' ? -1 : 1, lx = ((bx[0] + bx[2]) / 2 - .5) * w * fxs, ly = ((bx[1] + bx[3]) / 2 - .5) * h * fys; ox0 = lx * Math.cos(r) - ly * Math.sin(r); oy0 = lx * Math.sin(r) + ly * Math.cos(r); w = (bx[2] - bx[0]) * w; h = (bx[3] - bx[1]) * h; }
      var ww = Math.abs(w * Math.cos(r)) + Math.abs(h * Math.sin(r)), hh = Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r)), cx = p[0] * W0 + ox0, cy = p[1] * H0 + oy0; x0 = Math.min(x0, cx - ww / 2); x1 = Math.max(x1, cx + ww / 2); y0 = Math.min(y0, cy - hh / 2); y1 = Math.max(y1, cy + hh / 2); });
    if (x1 < x0) return; var m = Math.max(x1 - x0, y1 - y0) * .06, wi = x1 - x0 + m * 2, hi = y1 - y0 + m * 2;
    if (adjLock()) wi = hi = Math.max(wi, hi);
    var a = U.adj; a.w = wi / W0; a.h = hi / H0; a.fx = ((x0 + x1) / 2 - wi / 2) / W0; a.fy = ((y0 + y1) / 2 - hi / 2) / H0; adjFix(a);
  }
  function adjOpen() {
    if (U.adj) { adjClose(false); return; }
    if (!D.layers.length) { flash('Add some art first, then adjust the tile.'); return; }
    if (D.gs) { flash('Squares fill the whole tile. Turn Use squares off to adjust it.'); return; }
    U.adj = { w: 1, h: 1, k: 1, fx: 0, fy: 0, sq: false, prev: U.view }; AV = null; U.sel = null; U.tool = null; U.gsel = null; U.addOpen = null; U.zoom = 1; U.panX = 0; U.panY = 0; $('zoom').classList.remove('open'); render();
  }
  function adjClose(apply) {
    var a = U.adj; if (!a) return; U.adj = null; ADJ = null; AG = null; AV = null; U.view = a.prev || 'tile';
    if (apply && (a.w !== 1 || a.h !== 1 || a.fx || a.fy || (a.k || 1) !== 1)) { commit(); var nd = adjDoc(a), kk = a.k || 1; D.layers = nd.layers; D.tileIn = Math.round(nd.tileIn * kk * 100) / 100; if (nd.tileH) D.tileH = Math.round(nd.tileH * kk * 100) / 100; else delete D.tileH; changed(); flash('Tile is now ' + tileLabel() + '.'); return; }
    render();
  }
  function adjHtml() {
    var a = U.adj, out = adjOut(a), kale = D.rep === 'kale', L = mainArt(), k = a.k || 1, aw = L ? artWidthIn(L) * k : 0, cp = copies(), across = Math.floor(42 / Math.max(.1, out[0] * cp.w)), warn = '';
    if (L && L.t === 'art' && IMG[L.aid]) { var px = Math.max(IMG[L.aid].width, IMG[L.aid].height), full = L.s * D.tileIn * k; if (px / full < 285) warn = ' Your picture is sharp up to ' + inch(Math.floor(aw * px / full / 300 * 10) / 10) + ' wide.'; }
    return '<p class="ptitle">Adjust tile</p>' +
      (L ? stepper('adjk', L.t === 'art' ? 'Art size' : 'Size', inch(Math.round(aw * 100) / 100) + ' wide') : '') +
      '<div class="adjsw"><figure><canvas id="adjsw" width="240" height="240"></canvas><figcaption>8 in on fabric</figcaption></figure><p class="note' + (warn ? ' warn' : '') + '">Repeat ' + inch(out[0]) + ' x ' + inch(out[1]) + '. About ' + across + ' across a 42 in yard.' + warn + '</p></div>' +
      '<div class="grid g3"><button type="button" class="btn" data-a="adjfit">Fit to my art</button><button type="button" class="btn" data-a="adjno">Cancel</button><button type="button" class="btn dark" data-a="adjok">Done</button></div>' +
      '<p class="h" style="margin-top:10px">Space around it</p>' + stepper('adjw', 'Width', inch(out[0])) + stepper('adjh', 'Height', inch(out[1])) +
      (kale ? '<p class="note">Kaleidoscope tiles stay square.</p>' : '<div class="row"><b>Shape</b>' + seg('adjsq', [['0', 'Any size'], ['1', 'Square']], a.sq ? '1' : '0') + '</div>') +
      '<p class="note">Art size makes everything bigger or smaller together. Drag a corner or an edge to change the space around it, drag inside to move it.</p>';
  }
  // a true-size 8 in swatch of what Done will make, so the size on fabric is easy to judge
  function adjSwatch() {
    var c = $('adjsw'); if (!c || !U.adj) return; var a = U.adj, k = a.k || 1, nd = adjDoc(a); nd.tileIn = nd.tileIn * k; if (nd.tileH) nd.tileH = nd.tileH * k;
    withDoc(nd, function () { swatchInto(c, 8, null); });
  }
  $('adjBtn').addEventListener('click', adjOpen);
  $('plainBtn').addEventListener('click', function () { U.plain = !U.plain; if (U.plain) { U.view = 'tile'; U.adj = null; } render(); });
  $('layBtn').addEventListener('click', function () { U.layers = !U.layers; if (U.layers) { U.adj = null; U.addOpen = null; } render(); });

  /* ---------- sharp enough for 300 DPI? ---------- */
  function sharpNotes() {
    var worst = {};
    D.layers.forEach(function (L) { if (L.t !== 'art') return; var src = IMG[L.aid]; if (!src) return; var px = Math.max(src.width, src.height), size = L.s * D.tileIn; if (size <= 0) return; if (px / size < 285 && (!worst[L.aid] || worst[L.aid][1] < size)) worst[L.aid] = [px / 300, size]; });
    return Object.keys(worst).map(function (id) { var n = 0; ART.forEach(function (a, i) { if (a.id === id) n = i + 1; }); return 'Picture ' + (n || '') + ' is sharp up to ' + inch(Math.floor(worst[id][0] * 10) / 10) + '. It is ' + inch(Math.round(worst[id][1] * 10) / 10) + ' here. Upload a bigger file or make it smaller.'; });
  }

  /* ---------- where to get it printed (prices checked Nov 10, 2026) ---------- */
  var SHOPS = [
    ['Spoonflower', 20, 'Basic cotton $20 a yard, sale days near $15. No minimum.', 'https://www.spoonflower.com'],
    ['Fabric On Demand', 16.25, 'From about $16.25 a yard. They email a proof first.', 'https://www.fabricondemand.com'],
    ['Little Cocalico', 23.5, 'Poplin $23.50 a yard. Free shipping on 10+ items.', 'https://littlecocalico.com'],
    ['Contrado', 24.98, 'Quilting cotton from $24.98 a yard. Swatches under $1.', 'https://www.contrado.com/fabric-printing']
  ];
  function printHtml() {
    var y = U.yards || 1;
    return stepper('yards', 'Yards', y + ' yd') + '<div class="shops">' + SHOPS.map(function (x) { return '<a class="shop" href="' + x[3] + '" target="_blank" rel="noopener"><b>' + x[0] + '</b><em>about $' + Math.round(x[1] * y) + ' for ' + y + ' yd</em><span>' + x[2] + '</span></a>'; }).join('') + '</div>' +
      '<p class="note">Estimates, checked Nov 10, 2026. Shipping and tax not included. Upload your tile as a basic repeat.</p>';
  }


  /* ---------- seam check: pieces that cross the tile edge ---------- */
  var RV = null;
  function seamOn() { return U.seamT && Date.now() - U.seamT < 4500; }
  function pieceBox(L) {
    var ct = content(L, 1000); if (!ct) return null; var W0 = D.tileIn, H0 = tileHt(), p = pos(L), w = ct.w / 1000 * W0, h = ct.h / 1000 * W0, r = (L.r || 0) * Math.PI / 180, ox0 = 0, oy0 = 0;
    if (L.t === 'art') { var bx = artBox(L), lx = ((bx[0] + bx[2]) / 2 - .5) * w * (L.fl === 'x' ? -1 : 1), ly = ((bx[1] + bx[3]) / 2 - .5) * h * (L.fl === 'y' ? -1 : 1); ox0 = lx * Math.cos(r) - ly * Math.sin(r); oy0 = lx * Math.sin(r) + ly * Math.cos(r); w *= bx[2] - bx[0]; h *= bx[3] - bx[1]; }
    var ww = Math.abs(w * Math.cos(r)) + Math.abs(h * Math.sin(r)), hh = Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r)), cx = p[0] * W0 + ox0, cy = p[1] * H0 + oy0;
    return [(cx - ww / 2) / W0, (cy - hh / 2) / H0, (cx + ww / 2) / W0, (cy + hh / 2) / H0];
  }
  function seamCross() { return D.layers.filter(function (L) { if (L.gback) return false; var b = pieceBox(L); return b && (b[0] < -.003 || b[1] < -.003 || b[2] > 1.003 || b[3] > 1.003); }); }
  function seamName(L) { if (L.t === 'art') { var n = 0; ART.forEach(function (a, i) { if (a.id === L.aid) n = i + 1; }); return 'Picture ' + (n || ''); } if (L.t === 'words') return '"' + String(L.text || 'Words').slice(0, 14) + '"'; return L.t === 'sym' ? 'A symbol' : 'A shape'; }
  function seamCheck() {
    var c = seamCross(), wraps = D.rep === 'grid' || D.rep === 'halfdrop' || D.rep === 'halfbrick';
    if (!c.length) U.seamMsg = 'Seam check: nothing crosses the edge. Clean seams.';
    else U.seamMsg = c.length + (c.length === 1 ? ' piece crosses' : ' pieces cross') + ' the edge: ' + c.slice(0, 3).map(seamName).join(', ') + '. ' + (wraps ? 'It carries on into the next copy, so it prints fine.' : 'Here it meets a turned or flipped copy. Check the highlight.');
    U.seamT = Date.now(); U.seamIds = c.map(function (L) { return L.id; }); setTimeout(draw, 4600); render();
  }
  function seamDraw(g, W, H, pp, u, tox, toy) {
    var ids = U.seamIds || []; if (!ids.length) return;
    var hl = withDoc(Object.assign(clone(D), { layers: D.layers.filter(function (L) { return ids.indexOf(L.id) >= 0; }), ground: 'none', fab: null }), function () { return tile(pp); });
    var m = E.cv(hl.width, hl.height), mg = m.getContext('2d'); mg.drawImage(hl, 0, 0); mg.globalCompositeOperation = 'source-in'; mg.fillStyle = 'rgba(240,190,40,.75)'; mg.fillRect(0, 0, m.width, m.height);
    g.save(); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, 0, W, H); g.translate(tox || 0, toy || 0); g.fillStyle = g.createPattern(m, 'repeat'); g.fillRect(0, 0, W + m.width * 2, H + m.height * 2); g.restore();
  }
  // which piece is under a point of a repeated picture (pattern drawn from 0,0 at pp pixels per inch)
  var SV = null;
  function pickAt(px, py, V) {
    if (!V || D.rep === 'kale') return null;
    var cp = copies(), B = blockB(V.pp), Bh = blockBh(V.pp), tx = ((px % V.tw) + V.tw) % V.tw, ty = ((py % V.th) + V.th) % V.th, rect = Math.abs(Bh - B) > 1, hit = null;
    function md(a, m) { return ((a % m) + m) % m; }
    cp.c.forEach(function (cc) {
      if (hit) return; var uu = md(tx / B - cc[0], cp.w), vv = md(ty / Bh - cc[1], cp.h); if (uu >= 1 || vv >= 1) return;
      var r0 = cc[4] || 0; if (rect && r0 % 180) r0 = (r0 + 90) % 360; var rt = -r0 * Math.PI / 180, sc = cc[5] || 1;
      if (rt) { var dx = (uu - .5) * B, dy = (vv - .5) * Bh; uu = .5 + (dx * Math.cos(rt) - dy * Math.sin(rt)) / B; vv = .5 + (dx * Math.sin(rt) + dy * Math.cos(rt)) / Bh; }
      if (cc[2]) uu = 1 - uu; if (cc[3]) vv = 1 - vv;
      for (var i = D.layers.length - 1; i >= 0 && !hit; i--) {
        var L = D.layers[i]; if (L.gback || L.hide) continue; var ct = content(L, B); if (!ct) continue; var p = pos(L);
        for (var ix = -1; ix <= 1 && !hit; ix++) for (var iy = -1; iy <= 1 && !hit; iy++) {
          var ex = (uu - p[0] + ix) * B / sc, ey = (vv - p[1] + iy) * Bh / sc, lr = -(L.r || 0) * Math.PI / 180, qx = ex * Math.cos(lr) - ey * Math.sin(lr), qy = ex * Math.sin(lr) + ey * Math.cos(lr);
          if (Math.abs(qx) <= ct.w / 2 && Math.abs(qy) <= ct.h / 2) hit = L;
        }
      }
    });
    return hit;
  }
  function pickPiece(L) { if (!L) return; if (L.gcell != null && D.gs) { U.gsel = [L.gcell]; U.sel = null; } else { U.sel = L.id; U.tool = firstTool(L); U.gsel = null; } }
  // Swatch and Yard: a tap picks the piece and shows it big in Tile
  var RT = null;
  view.addEventListener('pointerdown', function (e) { if (U.view !== 'tile' && !U.plain && !U.adj) { var p = cpt(e); RT = { x: p[0], y: p[1] }; } }, true);
  view.addEventListener('pointerup', function (e) { if (!RT) return; var p = cpt(e), r = RT; RT = null; if (Math.hypot(p[0] - r.x, p[1] - r.y) > 12 * (view.width / 390)) return; var L = pickAt(p[0], p[1], SV); U.view = 'tile'; U.zoom = 1; U.panX = 0; U.panY = 0; pickPiece(L); render(); }, true);

  /* ---------- Layers: every piece, hide, lock, order ---------- */
  function layersHtml() {
    var list = D.layers.filter(function (L) { return L.gcell == null && !L.gback; }).slice().reverse(), ng = D.layers.filter(function (L) { return L.gcell != null && !L.gback; }).length;
    var eye = '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>', eyeX = '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><path d="M4 4l16 16"/></svg>', lk = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>', ulk = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>';
    return '<p class="ptitle">Layers</p>' + (list.length || ng ? '<p class="note">Top of the list is in front. Tap a name to pick it.</p>' : '<p class="note">Nothing yet. Add art, words or a symbol in Make.</p>') +
      '<div class="lays">' + list.map(function (L, i) { return '<div class="layr' + (U.sel === L.id ? ' on' : '') + (L.hide ? ' off' : '') + '"><canvas data-mini="L:' + L.id + '" width="88" height="88"></canvas><button type="button" class="lname" data-lpick="' + L.id + '">' + esc(pieceName(L)) + '</button><button type="button" class="lic" data-lhide="' + L.id + '" aria-label="Hide or show">' + (L.hide ? eyeX : eye) + '</button><button type="button" class="lic" data-llock="' + L.id + '" aria-pressed="' + !!L.lock + '" aria-label="Lock">' + (L.lock ? lk : ulk) + '</button><button type="button" class="lic" data-lup="' + L.id + '" aria-label="Forward"' + (i === 0 ? ' disabled' : '') + '><svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg></button><button type="button" class="lic" data-ldn="' + L.id + '" aria-label="Back"' + (i === list.length - 1 ? ' disabled' : '') + '><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button></div>'; }).join('') +
      (ng ? '<div class="layr"><span class="lname">Grid squares (' + ng + ')</span><button type="button" class="lic" data-lgrid="1" aria-label="Hide or show the squares">' + (D.layers.some(function (L) { return L.gcell != null && L.hide; }) ? eyeX : eye) + '</button></div>' : '') + '</div>' +
      '<button type="button" class="btn" data-a="laydone" style="margin-top:8px">Done</button>';
  }

  /* ---------- color clash: art nearly the same color as the cloth ---------- */
  var acol = {};
  function artAvg(L) {
    if (L.t !== 'art') return L.c || null; if (L.tint) return L.tint; var c = artCanvas(L.aid, null); if (!c) return null; var key = L.aid + ':' + artVer; if (acol[key]) return acol[key];
    var w = 48, h = Math.max(1, Math.round(48 * c.height / c.width)), m = E.cv(w, h), g = m.getContext('2d'); g.drawImage(c, 0, 0, w, h); var d = g.getImageData(0, 0, w, h).data, r = 0, gg = 0, b = 0, n = 0;
    for (var i = 0; i < d.length; i += 4) if (d[i + 3] > 120) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
    return (acol[key] = n ? '#' + [r, gg, b].map(function (v) { return ('0' + Math.round(v / n).toString(16)).slice(-2); }).join('') : null);
  }
  function rgbOf(h) { h = String(h || '').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); var n = parseInt(h, 16); return isNaN(n) ? null : [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function clashes() {
    var under = D.fab && D.fab.c && D.fab.c.length ? D.fab.c : D.ground && D.ground !== 'none' ? [D.ground] : []; if (!under.length) return false;
    var L = mainArt(), a = L && rgbOf(artAvg(L)); if (!a) return false;
    return under.some(function (h) { var c = rgbOf(h); return c && Math.hypot(a[0] - c[0], a[1] - c[1], a[2] - c[2]) < 70; });
  }
  function clashHtml() { return clashes() ? '<div class="note warn">Your art blends into the fabric.<div class="grid g3" style="margin-top:6px"><button type="button" class="btn" data-a="artblk">Art in black</button><button type="button" class="btn" data-a="artwht">Art in white</button><button type="button" class="btn" data-a="plain">Just my art</button></div></div>' : ''; }

  /* ---------- All copies: size, space, turn, nudge (pieces keep their places relative to each other) ---------- */
  function artUnion() { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; D.layers.forEach(function (L) { if (L.gback || L.hide) return; var b = pieceBox(L); if (!b) return; x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]); }); return x1 < x0 ? null : [x0 * D.tileIn, y0 * tileHt(), x1 * D.tileIn, y1 * tileHt()]; }
  function gaps() { var u = artUnion(); if (!u) return null; return [D.tileIn - (u[2] - u[0]), tileHt() - (u[3] - u[1]), u]; }
  function gapTxt(v) { return v < -.01 ? 'Overlap ' + inch(Math.round(-v * 100) / 100) : inch(Math.max(0, Math.round(v * 100) / 100)); }
  function setTile(nw, nh, cx, cy) { // new tile size in inches; the art's center cx, cy (inches) goes to the middle
    var W0 = D.tileIn, H0 = tileHt(); nw = clamp(nw, .25, 24); nh = clamp(nh, .25, 24); if (D.rep === 'kale') nh = nw;
    D.layers.forEach(function (L) { if (!L.hug) { L.x = Math.round(((L.x * W0 - cx + nw / 2) / nw % 1 + 1) % 1 * 1000) / 1000; L.y = Math.round(((L.y * H0 - cy + nh / 2) / nh % 1 + 1) % 1 * 1000) / 1000; } L.s = Math.round(L.s * W0 / nw * 1000) / 1000; });
    D.tileIn = Math.round(nw * 100) / 100; if (Math.abs(nh - nw) < .01) delete D.tileH; else D.tileH = Math.round(nh * 100) / 100;
  }
  function turnAll(deg) { var W0 = D.tileIn, H0 = tileHt(), r = deg * Math.PI / 180; D.layers.forEach(function (L) { if (L.hug) return; var dx = (L.x - .5) * W0, dy = (L.y - .5) * H0; L.x = Math.round(((.5 + (dx * Math.cos(r) - dy * Math.sin(r)) / W0) % 1 + 1) % 1 * 1000) / 1000; L.y = Math.round(((.5 + (dx * Math.sin(r) + dy * Math.cos(r)) / H0) % 1 + 1) % 1 * 1000) / 1000; L.r = ((L.r || 0) + deg) % 360; }); }
  function allCopiesHtml() {
    var Lm = mainArt(), aw = Lm ? artWidthIn(Lm) : 0, gp = gaps(), sq = !!D.gs, rot = Lm ? Math.round(((Lm.r || 0) % 360 + 360) % 360) : 0;
    return '<p class="h" style="margin-top:12px">All copies</p>' +
      (Lm ? stepper('rsize', 'Size', inch(Math.round(aw * 100) / 100) + ' wide') : '') +
      (gp && !sq ? stepper('gapx', 'Space across', gapTxt(gp[0])) + (D.rep === 'kale' ? '' : stepper('gapy', 'Space down', gapTxt(gp[1]))) : '') +
      (Lm ? stepper('rturn', 'Turn all', rot + '°') : '') +
      stepper('nudx', 'Nudge', 'Across') + stepper('nudy', 'Nudge', 'Down') +
      (D.rep === 'mirror' || D.rep === 'kale' ? '' : '<div class="row"><b>Flip every other</b>' + seg('flipalt', [['0', 'Off'], ['1', 'On']], D.flipAlt ? '1' : '0') + '</div>') +
      '<div class="row"><b>Fade</b>' + seg('fade', [['1', 'Solid'], ['0.6', '60%'], ['0.3', 'Watermark']], String(D.fade || 1)) + '</div>' +
      (sq ? '<p class="note">Space across and down are off while the grid squares are on.</p>' : '') +
      '<button type="button" class="rowbtn" data-a="adjgo"><b>Fine tune the tile</b><span>Drag its edges and corners</span><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>';
  }

  /* ---------- My patterns shelf (on this phone) ---------- */
  function thumb() { var c = E.cv(160, 160); swatchInto(c, Math.max(3, D.tileIn * 1.5), D.cloth, 200); return c.toDataURL('image/jpeg', .8); }
  function shelve(asNew) {
    if (!D.layers.length && !asNew) return;
    var list = shelf(), id = (!asNew && U.cur) || uid(), item = { id: id, name: D.name || 'My pattern', at: Date.now(), d: clone(D), th: thumb() }, i = -1;
    list.forEach(function (x, n) { if (x.id === id) i = n; });
    if (i >= 0) list[i] = item; else list.unshift(item);
    if (list.length > 40) list = list.slice(0, 40);
    if (!shelfSet(list)) { U.msg = 'This phone is out of room for saved patterns. Delete a few.'; return; }
    U.cur = id; U.msg = 'Saved to My patterns.'; keep();
  }
  function compare(id) {
    var it = shelf().filter(function (x) { return x.id === id; })[0]; if (!it) return;
    $('helpIn').innerHTML = '<button type="button" class="x" data-x="1" aria-label="Close">&times;</button><h2>Compare</h2><p class="note">8 in swatches on their cloth.</p><div class="cmp"><figure><canvas id="cmpA" width="420" height="420"></canvas><figcaption>' + esc(D.name || 'This one') + ' (open)</figcaption></figure><figure><canvas id="cmpB" width="420" height="420"></canvas><figcaption>' + esc(it.name || 'Pattern') + '</figcaption></figure></div>';
    $('helpSheet').hidden = false;
    swatchInto($('cmpA'), 8, D.cloth); withDoc(Object.assign(freshDoc(), clone(it.d)), function () { swatchInto($('cmpB'), 8, D.cloth); });
  }

  /* ---------- files ---------- */
  function yardCanvas() { var ppi = 30, c = E.cv(42 * ppi, 36 * ppi), g = c.getContext('2d'); g.fillStyle = g.createPattern(tile(ppi), 'repeat'); g.fillRect(0, 0, c.width, c.height); laycloth(g, c.width, c.height, D.cloth, ppi * 3); yardMarks(g, c.width, c.height, ppi, 2.4, true); return c; }
  function moodBoard() {
    var W = 1200, H = 1600, c = E.cv(W, H), g = c.getContext('2d'), sys = getComputedStyle(document.body).fontFamily, ti = tileInches(), cols = colorsInUse();
    g.fillStyle = '#f3efe6'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1a1a1a'; g.font = '900 54px ' + sys; g.fillText((D.name || 'My pattern').toUpperCase(), 60, 104);
    g.font = '700 22px ' + sys; g.fillStyle = '#6f6a60'; g.fillText('NOCIV PATTERNS', 62, 140);
    var sw = E.cv(700, 700); swatchInto(sw, 8, D.cloth); g.drawImage(sw, 60, 180); g.strokeStyle = '#1a1a1a'; g.lineWidth = 3; g.strokeRect(60, 180, 700, 700);
    g.fillStyle = '#1a1a1a'; g.font = '800 20px ' + sys; g.fillText('8 IN SWATCH ON ' + clothName(D.cloth).toUpperCase(), 60, 912);
    var t = tile(Math.min(380 / ti[0], 380 / ti[1])); g.drawImage(t, 800, 180); g.strokeRect(800, 180, t.width, t.height); g.fillText('ONE REPEAT', 800, 180 + t.height + 32);
    var y = 180 + t.height + 80; g.font = '900 18px ' + sys; g.fillStyle = '#6f6a60'; g.fillText('COLORS', 800, y); y += 18;
    cols.slice(0, 8).forEach(function (h, i) { var yy = y + i * 50; g.fillStyle = h; g.fillRect(800, yy, 40, 40); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1.5; g.strokeRect(800, yy, 40, 40); g.fillStyle = '#1a1a1a'; g.font = '800 20px ' + sys; g.fillText(h.toUpperCase() + ((D.pms || {})[h] ? '  PANTONE ' + D.pms[h].toUpperCase() : ''), 856, yy + 28); });
    var facts = [['Repeat', (REPS.filter(function (x) { return x[0] === D.rep; })[0] || ['', ''])[1] + (D.rep === 'mirror' ? ' (' + ({ both: 'both ways', lr: 'left-right', ud: 'up-down' })[D.mdir] + ')' : '')], ['Repeat size', inch(ti[0]) + ' x ' + inch(ti[1])], ['Printed on', clothName(D.cloth)], ['File', Math.round(ti[0] * fileDpi(300)) + ' x ' + Math.round(ti[1] * fileDpi(300)) + ' px, ' + fileDpi(300) + ' DPI, sRGB PNG'], ['Upload as', 'Basic repeat']];
    var fy = 980; facts.forEach(function (f) { g.fillStyle = '#6f6a60'; g.font = '900 18px ' + sys; g.fillText(f[0].toUpperCase(), 60, fy); g.fillStyle = '#1a1a1a'; g.font = '800 26px ' + sys; g.fillText(f[1], 300, fy); fy += 46; });
    g.fillStyle = '#6f6a60'; g.font = '900 18px ' + sys; g.fillText('COLORWAYS', 60, 1250);
    [0, 1, 2, 3].forEach(function (i) { var m = E.cv(250, 250); withDoc(wayDoc(i), function () { swatchInto(m, Math.max(3, D.tileIn * 1.4), D.cloth, 200); }); g.drawImage(m, 60 + i * 276, 1270); g.strokeStyle = '#1a1a1a'; g.lineWidth = 2; g.strokeRect(60 + i * 276, 1270, 250, 250); g.fillStyle = '#1a1a1a'; g.font = '800 18px ' + sys; g.fillText(i ? wayKinds()[i - 1][1] : 'Now', 60 + i * 276, 1548); });
    return c;
  }
  function saveFile(kind) {
    var t, name = (D.name || 'nociv-pattern').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'nociv-pattern';
    if (kind === 'sw') { var sw = E.cv(1200, 1200), g = sw.getContext('2d'); g.fillStyle = g.createPattern(tile(150), 'repeat'); g.fillRect(0, 0, 1200, 1200); t = sw; name += '-swatch-8in'; }
    else if (kind === 'yardpic') { t = yardCanvas(); name += '-yard-on-' + D.cloth; }
    else if (kind === 'mood' || kind === 'moodpdf') { t = moodBoard(); name += '-mood-board'; }
    else { var dpi = fileDpi(kind === 'png150' ? 150 : 300); t = tile(dpi); name += '-tile'; if (dpi < (kind === 'png150' ? 150 : 300)) { U.msg = 'Saved at ' + dpi + ' DPI, the most this phone can make for a tile this big.'; render(); } }
    var go = function (blob, ext) { var file = new File([blob], name + ext, { type: blob.type }); if (matchMedia('(pointer:coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(function () {}); return; } var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name + ext; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); };
    if (kind === 'pdf') { var ti = kind === 'sw' ? [8, 8] : tileInches(); Promise.resolve(E.pdfOf(t, ti[0], ti[1])).then(function (b) { go(b, '.pdf'); }); }
    else if (kind === 'moodpdf') Promise.resolve(E.pdfOf(t, 8.5, 8.5 * 1600 / 1200)).then(function (b) { go(b, '.pdf'); });
    else Promise.resolve(E.pngWithDpi(t, kind === 'sw' || kind === 'yardpic' || kind === 'mood' ? 150 : dpi)).then(function (b) { go(b, '.png'); });
  }

  /* ---------- help ---------- */
  $('help').addEventListener('click', helpOpen);
  function helpOpen() {
    $('helpIn').innerHTML = '<button type="button" class="x" data-x="1" aria-label="Close">&times;</button><h2>Settings</h2>' +
      '<div class="row"><b>Hand</b>' + seg('hand', [['left', 'Tools on the left'], ['right', 'On the right']], HAND) + '</div>' +
      '<div class="row"><b>Numbers</b>' + seg('nums', [['0', 'Hide'], ['1', 'Show numbers']], NUMS ? '1' : '0') + '</div><p class="note">Show numbers adds inches and cm, exact position, hex colors, file size in pixels.</p>' +
      '<h2 style="margin-top:14px">How it works</h2><ul>' +
      '<li><b>Make</b>: Add your art, words, symbols, shapes or a fabric. Tap a piece to change it. Drag to move, pinch to size, two fingers to turn. The red dot sizes and turns with one finger. Hold a piece for Copy, Front, Back, Delete.</li>' +
      '<li><b>Repeat</b>: Grid, Half-drop, Half-brick, Mirror (Readable keeps words reading the right way), Toss, Kaleidoscope.</li>' +
      '<li><b>Grid</b> is a guide to line pieces up. Turn on <b>Use squares</b> to fill it: tap a square, then change one square, a row, a column, all, or every square with the same piece.</li>' +
      '<li><b>Touch to edit</b> works on every step: tap a piece on Tile to change it, tap one on Swatch or Yard to jump to it. The <b>eye</b> shows just your art on white. <b>Layers</b> lists every piece: hide, lock, move forward or back.</li>' +
      '<li><b>Repeat</b>: pick how copies sit. All copies: Size, Space across and down (below zero overlaps), Turn all, Nudge (where mirror and kaleidoscope reflections meet), Flip every other, Fade. Half-drop and Half-brick can drop or shift by 1/2, 1/3 or 1/4. Toss can turn copies and mix their sizes; Shuffle gives a new mix. Tap a piece on the Repeat picture to edit it. <b>Seam check</b> lights up anything that crosses the tile edge.</li>' +
      '<li><b>Adjust tile</b> (the corners button at the top): drag a corner or an edge to size it, wide, tall or square. Drag inside to move it. Your art keeps its size, so copies sit closer or farther apart. Fit to my art hugs your art. Art size makes the whole thing bigger or smaller on the fabric, with an 8 in preview and how many fit across a yard. Kaleidoscope stays square. Toss turns copies a half turn on a rectangle.</li>' +
      '<li><b>Fabric</b>: plaid, stripes or checks under your art. Open Thread colors, Bands, Weave and Printed on to change each one.</li>' +
      '<li><b>Words</b>: straight, arc over, arc under, circle, seal, stacked, vertical. Wrap words around a shape and they hug it.</li>' +
      '<li><b>Look</b>: colorways (tap one to use it) and change any color everywhere at once. Printed on is in Fabric. The cloth is a preview, it is never in your files.</li><li><b>Save</b>: name it and keep it in My patterns, make a copy to try a variation, compare two, or tap the x to delete one. Files: the tile at 300 DPI repeats on its own (Smaller file is 150 DPI), plus an 8 in swatch, a yard on cloth and a mood board. If a picture is too small to be sharp, Save tells you.</li>' +
      '<li><b>Get it printed</b> (in Save): pick your yards and see an estimate from Spoonflower, Fabric On Demand, Little Cocalico and Contrado, with links. Upload the tile as a basic repeat.</li>' +
      '<li>Your art stays on this phone.</li></ul>';
    $('helpSheet').hidden = false;
  }
  $('helpSheet').addEventListener('click', function (e) {
    if (e.target === $('helpSheet') || e.target.closest('[data-x]')) { $('helpSheet').hidden = true; return; }
    var b = e.target.closest('button[data-v]'), sg = b && b.closest('[data-sg]'); if (!sg) return;
    if (sg.dataset.sg === 'hand') HAND = b.dataset.v; else if (sg.dataset.sg === 'nums') NUMS = b.dataset.v === '1';
    keep(); render(); helpOpen();
  });

  /* ---------- steps, views, undo ---------- */
  $('steps').addEventListener('click', function (e) { var b = e.target.closest('button[data-s]'); if (!b) return; if (U.adj) { U.adj = null; ADJ = null; AG = null; } U.step = b.dataset.s; U.layers = false; U.msg = ''; U.clothOpen = false; U.shelfSel = null; U.delAsk = false; if (U.step !== 'make') { U.sel = null; } if ((U.step === 'look' || U.step === 'fabric') && U.view === 'tile') U.view = 'swatch'; render(); });
  $('views').addEventListener('click', function (e) { var b = e.target.closest('button[data-v]'); if (!b) return; U.plain = false; if (U.adj) { U.adj = null; ADJ = null; AG = null; } U.view = b.dataset.v; render(); });
  // the cloth chip on the picture: tap it for a row of the 11 cloths, each showing your pattern
  $('clothChip').addEventListener('click', function () { U.clothOpen = !U.clothOpen; render(); });
  $('cloths').addEventListener('click', function (e) { var b = e.target.closest('button[data-cloth]'); if (!b) return; commit(); D.cloth = b.dataset.cloth; changed(); });
  $('undo').addEventListener('click', undo); $('redo').addEventListener('click', redo);
  window.addEventListener('resize', draw);

  function changed() { tcache = {}; keep(); render(); }
  function render() {
    document.documentElement.classList.toggle('righty', HAND === 'right');
    $('home').hidden = true; // no first page: it always opens straight into the canvas
    $('addbar').hidden = U.step !== 'make'; $('addbar').innerHTML = [['art', 'My art'], ['words', 'Words'], ['sym', 'Symbols'], ['shape', 'Shapes']].map(function (x) { return '<button type="button" data-tab="' + x[0] + '" aria-pressed="' + (U.addOpen === x[0]) + '">' + x[1] + '</button>'; }).join('');
    toolbar(); $('fab').hidden = true; $('views').parentNode.style.visibility = ''; $('zoom').hidden = U.step === 'look' && false; $('trash').hidden = !!U.adj || !!U.layers || (U.step === 'save' || U.step === 'make' || sel() ? false : true) || (!!sel() && $('stage').clientHeight < 400) || !!(U.gsel && U.gsel.length); // short screens: the side rail needs the room, Delete is on the floating bar $('trash').setAttribute('aria-label', sel() ? 'Delete this piece' : 'Start fresh'); $('trash').classList.toggle('piece', !!sel()); if (U.step !== 'make' || U.view !== 'tile') placeCtx(0, 0, false);
    var pn = $('panel'), s = pn.scrollTop; pn.innerHTML = panelHtml(); pn.scrollTop = s; minis(); adjSwatch();
    var cv2 = false; $('clothChip').hidden = true; $('clothChip').textContent = clothShort(D.cloth); $('clothChip').setAttribute('aria-pressed', String(cv2 && U.clothOpen));
    var co = cv2 && U.clothOpen && U.step !== 'look', cl = $('cloths'); cl.hidden = !co;
    if (co) { var cx = cl.scrollLeft; cl.innerHTML = clothRow().replace(/<p class="note">.*<\/p>$/, ''); cl.scrollLeft = cx; minis(cl); }
    Array.prototype.forEach.call(document.querySelectorAll('#steps button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.s === U.step)); });
    Array.prototype.forEach.call(document.querySelectorAll('#views button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === U.view)); });
    $('undo').disabled = !HIST.length; $('redo').disabled = !FUT.length;
    $('adjBtn').setAttribute('aria-pressed', String(!!U.adj)); $('zoom').hidden = !!U.adj; $('addbar').hidden = !!U.adj || U.step !== 'make';
    if (U.step === 'save' && !U.adj && !sel()) { $('trash').setAttribute('aria-label', 'Delete this pattern'); $('trash').classList.remove('piece'); }
    $('plainBtn').setAttribute('aria-pressed', String(!!U.plain)); $('layBtn').setAttribute('aria-pressed', String(!!U.layers));
    draw();
  }

  /* ---------- start: carry over pictures and lettering from the classic version ---------- */
  function migrate() {
    if (localStorage.getItem('nocivPattern2')) return Promise.resolve();
    var old = null; try { old = JSON.parse(localStorage.getItem('nocivPattern') || 'null'); } catch (e) {}
    var s = old && old.s ? old.s : {};
    if (s.blk && s.blk.lib) ART = s.blk.lib.map(function (x) { return { id: x.id, white: x.white !== false }; });
    if (s.letters) LETTERS = s.letters;
    return idbGet('pic').then(function (b) { if (!b) return; return blobToCanvas(b).then(function (c) { if (c) return addArtCanvas(c); }); });
  }
  migrate().then(loadArt).then(function () {
    if (!D.pal.length && ART.length && IMG[ART[0].id]) D.pal = artColors(IMG[ART[0].id]).slice(0, 4);
    keep(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { wcache = {}; tcache = {}; render(); });
  });
  render();
  try { if (!localStorage.getItem('nocivPattern2Fab')) $('fab').classList.add('pulse'); } catch (e) {}
  window.__p2 = { D: function () { return D; }, U: U, tile: tile, render: render, art: function () { return ART; }, hit: function () { return HIT; }, sv: function () { return SV; }, avg: function () { var L = mainArt(); return L ? artAvg(L) : null; } };
})();
