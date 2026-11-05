/* NOCIV Patterns: the app. Start (what), Make, Color, Fabric, Board.
   Locked picture on top, a fixed console, part tabs above the step bar, nothing slides. */
(function () {
  'use strict';
  var E = window.PatternEngine, $ = function (x) { return document.getElementById(x); };
  if (window.self !== window.top) document.documentElement.classList.add('embedded');

  /* ---------- icons ---------- */
  var I = {
    spark: '<path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/>',
    make: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
    cloth: '<path d="M4 5h16v14H4z"/><path d="M4 9h16M4 13h16M8 5v14M12 5v14M16 5v14" opacity=".55"/>',
    board: '<rect x="3" y="3" width="18" height="18" rx="1"/><rect x="6" y="6" width="7" height="7"/><path d="M15 7h3M15 10h3M6 16h12"/>',
    logo: '<circle cx="12" cy="12" r="9"/><path d="M8.5 15V9l7 6V9"/>',
    pic: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 16l-5-5-8 8"/>',
    plaid: '<rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/><path d="M3 12h18M12 3v18" stroke-dasharray="1.5 1.5"/>',
    stripes: '<rect x="3" y="3" width="18" height="18"/><path d="M8 3v18M13 3v18M18 3v18"/>',
    checks: '<rect x="3" y="3" width="18" height="18"/><path d="M3 3h6v6H3zM15 3h6v6h-6zM9 9h6v6H9zM3 15h6v6H3zM15 15h6v6h-6z" fill="currentColor"/>',
    camo: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M5 9c2-3 5-1 6 0s4 2 5-1M7 16c1-2 4-2 5 0s3 1 5-1M14 5c1 1 2 0 3 1" />',
    shape: '<circle cx="7" cy="7" r="3.2"/><rect x="14" y="3.8" width="6.4" height="6.4"/><path d="M7 13.5l3.6 3.6L7 20.7l-3.6-3.6z"/><path d="M14 17h7"/>',
    words: '<path d="M4 6V4h16v2M12 4v16M9 20h6"/>',
    icon: '<path d="M12 3l2.6 5.6 6 .7-4.5 4 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.5-4 6-.7z"/>',
    repeat: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="7" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    size: '<path d="M3 21L21 3M3 21h6M3 21v-6M21 3h-6M21 3v6"/>',
    style: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.2-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="11" cy="7" r="1.2"/><circle cx="15.5" cy="8" r="1.2"/>',
    threads: '<path d="M3 7h18M3 12h18M3 17h18" /><path d="M7 3v18M17 3v18" opacity=".5"/>',
    weave: '<path d="M3 5l4 4 4-4 4 4 4-4M3 12l4 4 4-4 4 4 4-4"/>',
    fill: '<rect x="4" y="4" width="16" height="16"/><path d="M4 10l6-6M4 16l12-12M8 20l12-12M14 20l6-6"/>',
    corner: '<path d="M3 12h18M12 3v18"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
    pal: '<circle cx="8" cy="8" r="4"/><circle cx="16" cy="8" r="4"/><circle cx="12" cy="15" r="4"/>',
    mine: '<path d="M12 20l8-8-4-4-8 8v4z"/><path d="M14 6l4 4"/>',
    file: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M10 13v6M7 16l3 3 3-3"/>',
    print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    plate: '<rect x="2" y="7" width="20" height="10" rx="2"/><circle cx="5" cy="10" r=".9" fill="currentColor"/><circle cx="19" cy="14" r=".9" fill="currentColor"/><path d="M8 12h8"/>',
    edge: '<rect x="3" y="6" width="18" height="12" rx="2"/><rect x="6" y="9" width="12" height="6" rx="1" stroke-dasharray="2 1.5"/>',
    halftone: '<circle cx="6" cy="6" r="1.2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2.8"/><circle cx="6" cy="14" r="1.2"/><circle cx="12" cy="14" r="2"/><circle cx="18" cy="14" r="2.8"/>'
  };
  function ico(n, cls) { return '<svg class="' + (cls || 'sm') + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[n] || '') + '</svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- state ---------- */
  var KINDS = [['logo', 'Logo', 'Make a simple logo, then repeat it'], ['picture', 'My picture', 'A PNG or photo you have'], ['plaid', 'Plaid', 'Flannel, tartan, gingham'], ['stripes', 'Stripes', 'Breton to club tie'], ['checks', 'Checks', 'Checkerboard to houndstooth'], ['camo', 'Camo', 'Woodland to bubble'], ['hardware', 'Hardware', 'Plaques and cut out emblems']];
  var KIND_ICON = { logo: 'logo', picture: 'pic', plaid: 'plaid', stripes: 'stripes', checks: 'checks', camo: 'camo', halftone: 'halftone', hardware: 'plate' };
  function presetOf(list, id) { return list.filter(function (x) { return x[0] === id; })[0]; }
  var S = {
    kind: null, step: 0, part: {}, view: 'swatch', fabric: 'poplin',
    colorsBy: {}, palBy: {},
    logo: { shape: 'circle', text: 'NC', font: 'FS Archivo Black', icon: 'none', ring: false },
    rep: { type: 'halfdrop', tileIn: 3, scale: .6, angle: 0, flip: 'none', seed: 7, density: 1, tint: false, white: true, fade: 100 },
    plaid: { preset: 'farmer', sett: presetOf(E.PLAIDS, 'farmer')[3].slice(), mirror: true, threadIn: 1 / 36, weave: 'twill' },
    stripes: { preset: 'breton', bands: presetOf(E.STRIPES, 'breton')[3].slice(), dir: 'h', scale: 1 },
    checks: { kind: 'board', cellIn: .5, fill: 'solid', point: 'none' },
    camo: { type: 'woodland', tileIn: 12, scale: 1, seed: 3 },
    board: { name: '', notes: '', by: '', pantone: {} }
  };
  try { var saved = JSON.parse(localStorage.getItem('nocivPattern') || 'null'); if (saved && saved.v === 1) Object.assign(S, saved.s); } catch (e) {}
  function keep() { try { localStorage.setItem('nocivPattern', JSON.stringify({ v: 1, s: S })); } catch (e) {} }
  var PALKEY = { logo: 'repeat', picture: 'repeat', halftone: 'repeat', plaid: 'plaid', stripes: 'stripes', checks: 'checks', camo: 'camo' };
  function colors() { if (S.kind === 'hardware') return hwCols(); var k = S.kind || 'logo'; if (!S.colorsBy[k]) { var p = E.PALETTES[PALKEY[k]][k === 'camo' ? camoPalIndex() : 0]; S.colorsBy[k] = p[1].slice(); S.palBy[k] = p[0]; } return S.colorsBy[k]; }
  function camoPalIndex() { var t = presetOf(E.CAMOS, S.camo.type), name = t ? t[3] : 'Woodland', i = 0; E.PALETTES.camo.forEach(function (p, j) { if (p[0] === name) i = j; }); return i; }

  /* ---------- pictures kept on this phone (IndexedDB) ---------- */
  var DB = null;
  function idb() { return new Promise(function (res) { if (DB) return res(DB); try { var r = indexedDB.open('nocivPattern', 1); r.onupgradeneeded = function () { r.result.createObjectStore('img'); }; r.onsuccess = function () { DB = r.result; res(DB); }; r.onerror = function () { res(null); }; } catch (e) { res(null); } }); }
  function idbGet(k) { return idb().then(function (db) { return new Promise(function (res) { if (!db) return res(null); var q = db.transaction('img').objectStore('img').get(k); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; }); }); }
  function idbSet(k, v) { return idb().then(function (db) { return new Promise(function (res) { if (!db) return res(); var t = db.transaction('img', 'readwrite'); t.objectStore('img').put(v, k); t.oncomplete = res; t.onerror = res; }); }); }
  var PIC = null, PICSRC = null; // the picture as a canvas, and the original file so it can be cropped again
  function blobToCanvas(b) { return new Promise(function (res) { var u = URL.createObjectURL(b), im = new Image(); im.onload = function () { var k = Math.min(1, 1400 / Math.max(im.width, im.height)), c = E.cv(im.width * k, im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c); }; im.onerror = function () { res(null); }; im.src = u; }); }

  /* ---------- logo maker ---------- */
  var SHAPES = [['none', 'Just words'], ['circle', 'Circle'], ['square', 'Square'], ['shield', 'Shield'], ['badge', 'Badge'], ['star', 'Star'], ['diamond', 'Diamond'], ['hex', 'Hexagon'], ['arch', 'Arch']];
  var FONTS = [['FS Archivo Black', 'Block'], ['FS Rubik Mono One', 'Wide'], ['FS Syne', 'Modern'], ['FS Bricolage', 'Chunky'], ['FS DM Serif Display', 'Serif'], ['FS Fraunces', 'Soft serif'], ['FS Barlow Condensed', 'Tall'], ['FS Tenor Sans', 'Clean'], ['FS Permanent Marker', 'Marker'], ['FS Special Elite', 'Typewriter']];
  var ICONS = [['none', 'None'], ['star', 'Star'], ['bolt', 'Bolt'], ['heart', 'Heart'], ['crown', 'Crown'], ['leaf', 'Leaf'], ['eye', 'Eye'], ['flower', 'Flower'], ['sun', 'Sun']];
  function shapePath(g, kind, R) {
    g.beginPath();
    if (kind === 'circle') g.arc(0, 0, R, 0, 7);
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
  function renderLogo(L, cols, size) {
    size = size || 600; var c = E.cv(size, size), g = c.getContext('2d'), R = size * .46, has = L.shape !== 'none';
    var main = cols[1], knock = cols[0];
    g.translate(size / 2, size / 2);
    if (has) { shapePath(g, L.shape, R); g.fillStyle = main; g.fill(); if (L.ring) { g.save(); g.scale(.86, .86); shapePath(g, L.shape, R); g.restore(); g.strokeStyle = knock; g.lineWidth = size * .018; g.stroke(); } }
    var txtCol = has ? knock : main, iconOn = L.icon !== 'none', text = (L.text || '').slice(0, 14);
    var box = has ? (L.shape === 'star' || L.shape === 'diamond' ? R * .95 : R * 1.35) : size * .92;
    if (iconOn) { g.save(); g.translate(0, text ? -R * .32 : 0); iconDraw(g, L.icon, text ? R * .26 : R * .55, txtCol); g.restore(); }
    if (text) {
      var fs = size * .5, fam = "'" + L.font + "', " + 'sans-serif';
      g.font = fs + 'px ' + fam; var w = g.measureText(text).width; fs = Math.min(fs, fs * box / Math.max(1, w), (iconOn ? R * .5 : R * .8)); g.font = fs + 'px ' + fam;
      g.fillStyle = txtCol; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, iconOn ? R * .3 : (L.shape === 'shield' ? -R * .08 : 0));
    }
    return c;
  }
  function picMotif(cols) {
    if (!PIC) return null;
    var c = E.cv(PIC.width, PIC.height), g = c.getContext('2d'); g.drawImage(PIC, 0, 0);
    if (S.rep.white || S.rep.tint) {
      var im = g.getImageData(0, 0, c.width, c.height), d = im.data, ink = E.hex(cols[1]);
      for (var i = 0; i < d.length; i += 4) {
        var L = (d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722) / 255;
        if (S.rep.white && L > .88) { d[i + 3] = Math.round(d[i + 3] * Math.max(0, (1 - L) / .12)); }
        if (S.rep.tint) { var a = Math.round((1 - L) * d[i + 3]); d[i] = ink[0]; d[i + 1] = ink[1]; d[i + 2] = ink[2]; d[i + 3] = S.rep.white ? Math.min(d[i + 3], a * 1.3) : d[i + 3]; }
      }
      g.putImageData(im, 0, 0);
    }
    return c;
  }
  // mix and match helpers
  var MIXUI = [['solid', 'Solid'], ['dots', 'Dots'], ['hatch', 'Lines'], ['logo', 'Logo'], ['empty', 'Empty']];
  var BANDF = [['solid', 'Solid'], ['dots', 'Dots'], ['hatch', 'Lines'], ['logo', 'Logo']];
  function mixOf() { var m = S.checks.mix; return m && m.length > 1 ? m : null; }
  function fadeIt(m) { if (m && S.rep.fade < 100) { var c = E.cv(m.width, m.height), g = c.getContext('2d'); g.globalAlpha = S.rep.fade / 100; g.drawImage(m, 0, 0); m = c; } return m; }
  function altMotif(cols) {
    var a = S.rep.alt || 'none';
    if (a === 'space') return null;
    if (a === 'icon') return fadeIt(renderLogo({ shape: 'none', text: '', icon: S.logo.icon !== 'none' ? S.logo.icon : 'star', ring: false }, cols));
    if (a === 'other') return fadeIt(S.kind === 'logo' ? picMotif(cols) : renderLogo(S.logo, cols));
    return undefined;
  }
  function motifs() { var m = motif(); if (!m || !S.rep.alt || S.rep.alt === 'none') return null; var b = altMotif(colors()); if (b === undefined || (S.rep.alt === 'other' && !b)) return null; return [m, b]; }
  function motif() {
    var cols = colors(), m = S.kind === 'logo' ? renderLogo(S.logo, cols) : picMotif(cols);
    if (m && S.rep.fade < 100) { var c = E.cv(m.width, m.height), g = c.getContext('2d'); g.globalAlpha = S.rep.fade / 100; g.drawImage(m, 0, 0); m = c; }
    return m;
  }

  /* ---------- hardware: plaques, emblems, cut out logos ---------- */
  // Everything is drawn in millimeters, so the cut file and the spec match the picture.
  var HW_SHAPES = [['rect', 'Bar'], ['rounded', 'Rounded'], ['pill', 'Pill'], ['oval', 'Oval'], ['circle', 'Round'], ['shield', 'Shield'], ['hex', 'Hexagon'], ['arch', 'Arch'], ['badge', 'Badge'], ['diamond', 'Diamond']];
  var HW_FIN = [ // id, name, base, light, dark
    ['gold', 'Gold plated', '#d4a933', '#fff1b8', '#7a5a12'], ['brass', 'Raw brass', '#b9973f', '#efd98d', '#5e4815'],
    ['silver', 'Nickel silver', '#c2c5c8', '#ffffff', '#5d6166'], ['gunmetal', 'Gunmetal', '#4b4e53', '#a3a7ad', '#1d1f22'],
    ['copper', 'Copper', '#b8703f', '#f5c09a', '#5a2f14'], ['rose', 'Rose gold', '#d29a86', '#fbe1d6', '#7d4b3d'],
    ['black', 'Matte black', '#2a2a2a', '#5a5a5a', '#0e0e0e'], ['antique', 'Antique brass', '#8d7134', '#c9ad66', '#3a2c0e']
  ];
  var HW_LOOK = [['polished', 'Polished'], ['brushed', 'Brushed'], ['matte', 'Matte']];
  var HW_MARK = [['engrave', 'Engraved'], ['raised', 'Raised'], ['cut', 'Cut through'], ['enamel', 'Enamel fill']];
  var HW_FIX = [['rivets', 'Rivets'], ['screws', 'Screws'], ['prongs', 'Prongs'], ['sew', 'Sew holes'], ['none', 'Glue']];
  var HW_BACK = [['leather', 'Smooth leather', '#8a5a34'], ['pebble', 'Pebbled leather', '#2b2622'], ['suede', 'Suede', '#b68a5e'], ['canvas', 'Canvas', '#d9cdb3'], ['denim', 'Denim', '#2f4566'], ['none', 'No patch', '']];
  var HW_LEATHER = ['#8a5a34', '#5b3a22', '#2b2622', '#c69a6d', '#7a1f1f', '#1f3324', '#e8dfcf', '#111111'];
  function hwDef() { return { shape: 'rounded', w: 60, h: 20, thick: 1.5, fin: 'gold', look: 'brushed', mark: 'engrave', text: 'NOCIV', line2: 'MADE IN USA', font: 'FS Archivo Black', logo: 'none', border: 'line', fix: 'rivets', back: 'leather', backCol: '#8a5a34', enamel: '#1a1a1a', stitch: true }; }
  function HW() { if (!S.hw) S.hw = hwDef(); return S.hw; }
  function finOf(id) { return presetOf(HW_FIN, id) || HW_FIN[0]; }
  function hwCols() { var h = HW(), c = [finOf(h.fin)[2]]; if (h.back !== 'none') c.push(h.backCol); if (h.mark === 'enamel') c.push(h.enamel); return c; }
  function mmIn(mm) { return (Math.round(mm / 25.4 * 100) / 100) + ' in'; }
  function hwPath(g, h, ppm, inset) {
    var w = h.w * ppm / 2 - inset, hh = h.h * ppm / 2 - inset, k = h.shape;
    g.beginPath();
    if (k === 'rect' || k === 'rounded' || k === 'pill') {
      var r = k === 'rect' ? Math.min(w, hh) * .06 : k === 'rounded' ? Math.min(w, hh) * .35 : Math.min(w, hh);
      r = Math.max(0, r); g.moveTo(-w + r, -hh); g.arcTo(w, -hh, w, hh, r); g.arcTo(w, hh, -w, hh, r); g.arcTo(-w, hh, -w, -hh, r); g.arcTo(-w, -hh, w, -hh, r); g.closePath(); return;
    }
    if (k === 'oval') { g.ellipse(0, 0, Math.max(1, w), Math.max(1, hh), 0, 0, Math.PI * 2); g.closePath(); return; }
    g.save(); g.scale(Math.max(.01, w), Math.max(.01, hh)); shapePath(g, k === 'circle' ? 'circle' : k, 1); g.restore();
  }
  function metalFill(g, f, look, x0, y0, x1, y1, bright) {
    var gr = g.createLinearGradient(x0, y0, x1, y1), b = bright || 0;
    if (look === 'matte') { gr.addColorStop(0, mix(f[2], f[3], .18 + b)); gr.addColorStop(1, mix(f[2], f[4], .18)); }
    else { gr.addColorStop(0, mix(f[2], f[4], .25)); gr.addColorStop(.28, mix(f[2], f[3], .55 + b)); gr.addColorStop(.5, f[2]); gr.addColorStop(.72, mix(f[2], f[3], .35 + b)); gr.addColorStop(1, mix(f[2], f[4], .4)); }
    return gr;
  }
  function mix(a, b, t) { var x = E.hex(a), y = E.hex(b); t = Math.max(0, Math.min(1, t)); return 'rgb(' + x.map(function (v, i) { return Math.round(v + (y[i] - v) * t); }).join(',') + ')'; }
  // The mark (words, logo) as an alpha mask the size of the plate.
  function hwMask(h, ppm) {
    var W = Math.ceil(h.w * ppm), H = Math.ceil(h.h * ppm), c = E.cv(W, H), g = c.getContext('2d');
    var pad = Math.min(W, H) * (h.border === 'none' ? .14 : .22) + (h.fix === 'none' || h.fix === 'prongs' ? 0 : Math.min(W, H) * .18 * (h.shape === 'circle' || h.shape === 'badge' ? 0 : 1));
    if (h.shape === 'shield' || h.shape === 'diamond' || h.shape === 'badge' || h.shape === 'hex' || h.shape === 'circle' || h.shape === 'oval') pad = Math.min(W, H) * .22;
    var bx = pad, by = Math.min(W, H) * .16, bw = W - pad * 2, bh = H - by * 2; if (h.shape === 'arch') by = H * .3, bh = H - by - H * .14;
    var hasLogo = h.logo !== 'none', text = (h.text || '').slice(0, 18), l2 = (h.line2 || '').slice(0, 28);
    g.fillStyle = '#000'; g.textAlign = 'center'; g.textBaseline = 'middle';
    var tx = bx, tw = bw;
    if (hasLogo) {
      var lg = renderLogo(S.logo, ['#ffffff', '#000000'], 400), lc = E.cv(400, 400), lgx = lc.getContext('2d'); lgx.drawImage(lg, 0, 0);
      var im = lgx.getImageData(0, 0, 400, 400), d = im.data; for (var i = 0; i < d.length; i += 4) { var lum = (d[i] + d[i + 1] + d[i + 2]) / 765; d[i + 3] = Math.round(d[i + 3] * (1 - lum)); d[i] = d[i + 1] = d[i + 2] = 0; } lgx.putImageData(im, 0, 0);
      var only = !text && !l2, ls = only ? Math.min(bw, bh) : Math.min(bh, bw * .4);
      if (only || h.logo === 'center') { var cy = only ? H / 2 : by + ls / 2; ls = only ? ls : Math.min(bw, bh * .55); g.drawImage(lc, W / 2 - ls / 2, (only ? H / 2 : by + ls / 2) - ls / 2, ls, ls); void cy; if (!only) { by += ls + bh * .04; bh -= ls + bh * .04; } }
      else { g.drawImage(lc, bx, H / 2 - ls / 2, ls, ls); tx = bx + ls + bw * .04; tw = bw - ls - bw * .04; }
    }
    function fitText(t, fam, maxH, maxW) { var fs = maxH; g.font = fs + "px '" + fam + "', sans-serif"; var w = g.measureText(t).width; if (w > maxW) fs = fs * maxW / w; return Math.max(4, fs); }
    if (text || l2) {
      var big = l2 ? bh * .62 : bh * .9, small = bh * .26, fs1 = text ? fitText(text, h.font, big, tw) : 0, fs2 = l2 ? fitText(l2, 'FS Barlow Condensed', small, tw) : 0;
      var total = fs1 + (fs2 ? fs2 * 1.25 : 0), y = by + bh / 2 - total / 2;
      if (text) { g.font = fs1 + "px '" + h.font + "', sans-serif"; g.fillText(text, tx + tw / 2, y + fs1 / 2); }
      if (l2) { g.font = '600 ' + fs2 + "px 'FS Barlow Condensed', sans-serif"; if (g.letterSpacing !== undefined) g.letterSpacing = (fs2 * .18) + 'px'; g.fillText(l2.toUpperCase(), tx + tw / 2, y + fs1 + fs2 * .25 + fs2 / 2); }
    }
    return c;
  }
  function hwFixPoints(h, ppm) {
    var w = h.w * ppm / 2, hh = h.h * ppm / 2, m = Math.min(w, hh), ins = Math.max(m * .3, 2.6 * ppm);
    if (h.shape === 'circle' || h.shape === 'badge' || h.shape === 'hex' || (h.shape === 'oval' && Math.abs(h.w - h.h) < 8)) return [[0, -hh + ins * .9], [0, hh - ins * .9]];
    if (h.shape === 'shield' || h.shape === 'diamond' || h.shape === 'arch') return [[-w + ins, -hh + ins], [w - ins, -hh + ins], [0, hh - ins]];
    if (h.shape === 'oval' || h.shape === 'pill') return [[-w + ins * 1.15, 0], [w - ins * 1.15, 0]];
    return [[-w + ins, -hh + ins], [w - ins, -hh + ins], [-w + ins, hh - ins], [w - ins, hh - ins]];
  }
  // Draws the piece centered on g at (cx, cy). withBack draws the leather or cloth patch behind it.
  function drawHW(g, cx, cy, ppm, withBack) {
    var h = HW(), f = finOf(h.fin), w = h.w * ppm, hh = h.h * ppm, m = Math.min(w, hh), back = withBack && h.back !== 'none';
    g.save(); g.translate(cx, cy);
    if (back) {
      var pm = Math.max(5 * ppm, m * .22), bw = w / 2 + pm, bhh = hh / 2 + pm, rr = Math.min(bw, bhh) * .18;
      g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 4 * ppm; g.shadowOffsetY = 1.2 * ppm;
      g.beginPath(); g.moveTo(-bw + rr, -bhh); g.arcTo(bw, -bhh, bw, bhh, rr); g.arcTo(bw, bhh, -bw, bhh, rr); g.arcTo(-bw, bhh, -bw, -bhh, rr); g.arcTo(-bw, -bhh, bw, -bhh, rr); g.closePath();
      g.fillStyle = h.backCol; g.fill(); g.restore();
      g.save(); g.clip(); var tx = backTex(h.back, h.backCol, ppm); g.fillStyle = g.createPattern(tx, 'repeat'); g.fillRect(-bw, -bhh, bw * 2, bhh * 2);
      var sh = g.createLinearGradient(0, -bhh, 0, bhh); sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(1, 'rgba(0,0,0,.18)'); g.fillStyle = sh; g.fillRect(-bw, -bhh, bw * 2, bhh * 2); g.restore();
      if (h.stitch) { var si = 2.6 * ppm; g.save(); g.setLineDash([2.4 * ppm, 1.4 * ppm]); g.lineWidth = Math.max(1, .7 * ppm); g.strokeStyle = mix(h.backCol, '#f3e7cf', .7); g.lineCap = 'round'; g.beginPath(); var r2 = Math.max(0, rr - si * .6); g.moveTo(-bw + si + r2, -bhh + si); g.arcTo(bw - si, -bhh + si, bw - si, bhh - si, r2); g.arcTo(bw - si, bhh - si, -bw + si, bhh - si, r2); g.arcTo(-bw + si, bhh - si, -bw + si, -bhh + si, r2); g.arcTo(-bw + si, -bhh + si, bw - si, -bhh + si, r2); g.closePath(); g.stroke(); g.restore(); }
    }
    // plate body with its thickness and shadow
    var depth = Math.max(1, h.thick * ppm * .6);
    g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 2.5 * ppm; g.shadowOffsetY = depth * .9; g.translate(0, depth); hwPath(g, h, ppm, 0); g.fillStyle = mix(f[2], f[4], .55); g.fill(); g.restore();
    hwPath(g, h, ppm, 0); g.fillStyle = metalFill(g, f, h.look, -w / 2, -hh / 2, w / 2, hh / 2); g.fill();
    g.save(); hwPath(g, h, ppm, 0); g.clip();
    if (h.look === 'brushed') { var rnd = E.rng(5); g.globalAlpha = .16; for (var y = -hh / 2; y < hh / 2; y += Math.max(1, ppm * .18)) { g.strokeStyle = rnd() > .5 ? f[3] : f[4]; g.lineWidth = Math.max(.5, ppm * .08); g.beginPath(); g.moveTo(-w / 2, y); g.lineTo(w / 2, y + (rnd() - .5) * ppm * .1); g.stroke(); } g.globalAlpha = 1; }
    if (h.look === 'matte') { var rn = E.rng(9); g.globalAlpha = .12; for (var n = 0; n < w * hh / 18; n++) { g.fillStyle = rn() > .5 ? f[3] : f[4]; g.fillRect((rn() - .5) * w, (rn() - .5) * hh, 1, 1); } g.globalAlpha = 1; }
    if (h.fin === 'antique') { var rg = g.createRadialGradient(0, 0, m * .2, 0, 0, Math.max(w, hh) * .7); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(30,20,5,.45)'); g.fillStyle = rg; g.fillRect(-w / 2, -hh / 2, w, hh); }
    // the mark
    var mk = hwMask(h, ppm), mx = -mk.width / 2, my = -mk.height / 2;
    function tinted(col) { var c = E.cv(mk.width, mk.height), cg = c.getContext('2d'); cg.drawImage(mk, 0, 0); cg.globalCompositeOperation = 'source-in'; cg.fillStyle = col; cg.fillRect(0, 0, c.width, c.height); return c; }
    if (h.mark === 'enamel') { g.globalAlpha = 1; hwPath(g, h, ppm, m * .1); g.fillStyle = h.enamel; g.fill(); var gl = g.createLinearGradient(0, -hh / 2, 0, hh / 2); gl.addColorStop(0, 'rgba(255,255,255,.22)'); gl.addColorStop(.45, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fill(); }
    if (h.mark === 'engrave') { g.drawImage(tinted('rgba(255,255,255,.35)'), mx, my + Math.max(1, ppm * .18)); g.drawImage(tinted(mix(f[2], f[4], .7)), mx, my); }
    else if (h.mark === 'raised' || h.mark === 'enamel') {
      g.drawImage(tinted('rgba(0,0,0,.45)'), mx + ppm * .12, my + Math.max(1, ppm * .25));
      var lit = E.cv(mk.width, mk.height), lg2 = lit.getContext('2d'); lg2.drawImage(mk, 0, 0); lg2.globalCompositeOperation = 'source-in'; lg2.fillStyle = metalFill(lg2, f, 'polished', 0, 0, mk.width, mk.height, .15); lg2.fillRect(0, 0, mk.width, mk.height); g.drawImage(lit, mx, my);
    }
    g.restore();
    if (h.mark === 'cut') {
      var hole = E.cv(mk.width, mk.height), hg = hole.getContext('2d'); hg.drawImage(mk, 0, 0); hg.globalCompositeOperation = 'source-in';
      hg.fillStyle = back ? h.backCol : '#e7e2d6'; hg.fillRect(0, 0, hole.width, hole.height);
      if (back) { hg.fillStyle = hg.createPattern(backTex(h.back, h.backCol, ppm), 'repeat'); hg.fillRect(0, 0, hole.width, hole.height); }
      g.drawImage(tinted('rgba(0,0,0,.55)'), mx, my - Math.max(1, ppm * .3)); g.drawImage(hole, mx, my + Math.max(.5, ppm * .1));
    }
    // bevel
    g.save(); hwPath(g, h, ppm, Math.max(.6, ppm * .25)); var bv = g.createLinearGradient(-w / 2, -hh / 2, w / 2, hh / 2); bv.addColorStop(0, 'rgba(255,255,255,.75)'); bv.addColorStop(.5, 'rgba(255,255,255,0)'); bv.addColorStop(1, 'rgba(0,0,0,.45)'); g.strokeStyle = bv; g.lineWidth = Math.max(1, ppm * .45); g.stroke(); g.restore();
    // border
    if (h.border === 'line') { hwPath(g, h, ppm, m * .1); g.strokeStyle = mix(f[2], f[4], .6); g.lineWidth = Math.max(1, ppm * .35); g.stroke(); hwPath(g, h, ppm, m * .1 + ppm * .3); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = Math.max(.5, ppm * .15); g.stroke(); }
    if (h.border === 'double') { [m * .08, m * .14].forEach(function (i) { hwPath(g, h, ppm, i); g.strokeStyle = mix(f[2], f[4], .6); g.lineWidth = Math.max(1, ppm * .25); g.stroke(); }); }
    if (h.border === 'beads') { var pts = pathPoints(h, ppm, m * .1, Math.max(5, ppm * 1.6)); pts.forEach(function (p) { var bg = g.createRadialGradient(p[0] - ppm * .15, p[1] - ppm * .15, 0, p[0], p[1], ppm * .5); bg.addColorStop(0, f[3]); bg.addColorStop(1, f[4]); g.fillStyle = bg; g.beginPath(); g.arc(p[0], p[1], Math.max(1, ppm * .45), 0, 7); g.fill(); }); }
    // fixings
    if (h.fix === 'rivets' || h.fix === 'screws' || h.fix === 'sew') {
      hwFixPoints(h, ppm).forEach(function (p) {
        var r = Math.max(2, ppm * (h.fix === 'sew' ? .75 : 1.6));
        if (h.fix === 'sew') { g.fillStyle = back ? mix(h.backCol, '#000', .3) : '#e7e2d6'; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 1; g.stroke(); return; }
        g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = ppm * .6; g.shadowOffsetY = ppm * .25;
        var rg2 = g.createRadialGradient(p[0] - r * .35, p[1] - r * .35, r * .1, p[0], p[1], r); rg2.addColorStop(0, f[3]); rg2.addColorStop(.6, f[2]); rg2.addColorStop(1, f[4]); g.fillStyle = rg2; g.beginPath(); g.arc(p[0], p[1], r, 0, 7); g.fill(); g.restore();
        if (h.fix === 'screws') { g.strokeStyle = f[4]; g.lineWidth = Math.max(1, r * .22); g.beginPath(); g.moveTo(p[0] - r * .6, p[1] + r * .2); g.lineTo(p[0] + r * .6, p[1] - r * .2); g.stroke(); }
      });
    }
    g.restore();
  }
  function pathPoints(h, ppm, inset, step) {
    var c = E.cv(4, 4).getContext('2d'), out = [], w = h.w * ppm / 2 - inset, hh = h.h * ppm / 2 - inset;
    // walk the inset outline by sampling a perimeter; good enough for evenly spaced beads
    var N = 720, pts = [];
    for (var i = 0; i < N; i++) { var a = i / N * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a), lo = 0, hi = Math.max(w, hh) * 2; for (var k = 0; k < 16; k++) { var mid = (lo + hi) / 2; hwPath(c, h, ppm, inset); if (c.isPointInPath(dx * mid, dy * mid)) lo = mid; else hi = mid; } pts.push([dx * lo, dy * lo]); }
    var acc = 0; out.push(pts[0]); for (var j = 1; j < pts.length; j++) { acc += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]); if (acc >= step) { out.push(pts[j]); acc = 0; } }
    return out;
  }
  var btCache = {};
  function backTex(kind, col, ppm) {
    var key = kind + col + Math.round(ppm * 4); if (btCache[key]) return btCache[key];
    var S2 = 96, c = E.cv(S2, S2), g = c.getContext('2d'), r = E.rng(11); g.fillStyle = col; g.fillRect(0, 0, S2, S2);
    if (kind === 'pebble') { for (var i = 0; i < 260; i++) { var x = r() * S2, y = r() * S2, s = 2 + r() * 4; g.fillStyle = r() > .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y, s, s * .8, r() * 3, 0, 7); g.fill(); } }
    else if (kind === 'suede') { for (var j = 0; j < 2400; j++) { g.fillStyle = r() > .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.09)'; g.fillRect(r() * S2, r() * S2, 1, 1); } }
    else if (kind === 'canvas' || kind === 'denim') { for (var y2 = 0; y2 < S2; y2 += 2) { g.fillStyle = 'rgba(0,0,0,' + (kind === 'denim' ? .16 : .07) + ')'; g.fillRect(0, y2, S2, 1); } for (var x2 = 0; x2 < S2; x2 += 3) { g.fillStyle = kind === 'denim' ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.05)'; g.fillRect(x2 + (x2 % 6 ? 1 : 0), 0, 1, S2); } }
    else { for (var k = 0; k < 900; k++) { g.fillStyle = r() > .5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.08)'; g.fillRect(r() * S2, r() * S2, 1 + r() * 2, 1); } }
    return (btCache[key] = c);
  }
  function hwDrawView(g, W, H) {
    var h = HW(), bgc = '#e7e2d6';
    g.fillStyle = bgc; g.fillRect(0, 0, W, H);
    var t = E.checkTile({ kind: 'board', cellIn: .5, fill: 'dots', point: 'none', ppi: W / 10, colors: ['#ece6d6', '#ddd5c2'] }); g.fillStyle = g.createPattern(t, 'repeat'); g.fillRect(0, 0, W, H);
    var pm = h.back !== 'none' ? Math.max(5, Math.min(h.w, h.h) * .22) * 2 + 4 : 6, ppm = Math.min(W * .86 / (h.w + pm), H * .72 / (h.h + pm));
    drawHW(g, W / 2, H / 2, ppm, true);
    // a ruler so you can see the real size
    var u = W / 390, mm10 = 10 * ppm, rx = 14 * u, ry = 30 * u; g.fillStyle = 'rgba(26,26,26,.85)'; g.fillRect(rx, ry, mm10, Math.max(2, 2.5 * u)); g.fillRect(rx, ry - 5 * u, Math.max(1.5, 1.5 * u), 7.5 * u); g.fillRect(rx + mm10 - 1.5 * u, ry - 5 * u, Math.max(1.5, 1.5 * u), 7.5 * u); g.font = '800 ' + Math.round(12 * u) + 'px -apple-system,Arial,sans-serif'; g.textAlign = 'left'; g.fillText('10 mm', rx, ry - 9 * u);
    g.textAlign = 'left';
    tag(presetOf(HW_SHAPES, h.shape)[1] + ' plate, ' + h.w + ' x ' + h.h + ' mm (' + mmIn(h.w) + ' x ' + mmIn(h.h) + '), ' + finOf(h.fin)[1].toLowerCase() + ', ' + presetOf(HW_MARK, h.mark)[1].toLowerCase() + '.');
  }
  function hwBoard(Wpx) {
    var h = HW(), W = Wpx || 1275, H = Math.round(W * 11 / 8.5), u = W / 100, c = E.cv(W, H), g = c.getContext('2d'), sys = '-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif';
    g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, W, H);
    var name = S.board.name || ((h.text || 'Custom') + ' plate'); g.fillStyle = '#1a1a1a'; g.font = '900 ' + 5.2 * u + 'px ' + sys; g.textBaseline = 'top'; g.fillText(name.toUpperCase().slice(0, 28), 5 * u, 5 * u);
    g.font = '600 ' + 1.9 * u + 'px ' + sys; g.fillStyle = '#5a564d'; var date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    g.fillText('Hardware spec' + (S.board.by ? '  |  ' + S.board.by : '') + '  |  ' + date, 5 * u, 11.4 * u); g.fillRect(5 * u, 14.6 * u, 90 * u, .25 * u);
    // big render on the patch
    var bx = 5 * u, by = 17 * u, bw = 90 * u, bh = 34 * u; g.fillStyle = '#e7e2d6'; g.fillRect(bx, by, bw, bh);
    var pm = h.back !== 'none' ? Math.max(5, Math.min(h.w, h.h) * .22) * 2 + 4 : 6, ppm = Math.min(bw * .8 / (h.w + pm), bh * .8 / (h.h + pm)); drawHW(g, bx + bw / 2, by + bh / 2, ppm, true);
    g.strokeStyle = '#1a1a1a'; g.lineWidth = .3 * u; g.strokeRect(bx, by, bw, bh);
    g.fillStyle = '#1a1a1a'; g.font = '800 ' + 1.6 * u + 'px ' + sys; g.fillText('RENDER, NOT TO SCALE', bx, by + bh + 1.2 * u);
    // actual size outline with dimensions
    var ay = by + bh + 6 * u, appm = W / 215.9, aw = h.w * appm, ah = h.h * appm, ax = 5 * u;
    if (aw < 44 * u && ah < 30 * u) {
      g.save(); g.translate(ax + aw / 2, ay + ah / 2); hwPath(g, h, appm, 0); g.strokeStyle = '#1a1a1a'; g.lineWidth = .2 * u; g.stroke();
      if (h.fix === 'rivets' || h.fix === 'screws' || h.fix === 'sew') hwFixPoints(h, appm).forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], (h.fix === 'sew' ? .75 : 1.6) * appm, 0, 7); g.stroke(); });
      g.restore();
      g.strokeStyle = '#c8412f'; g.fillStyle = '#c8412f'; g.lineWidth = .15 * u; g.beginPath(); g.moveTo(ax, ay - 1.2 * u); g.lineTo(ax + aw, ay - 1.2 * u); g.moveTo(ax + aw + 1.2 * u, ay); g.lineTo(ax + aw + 1.2 * u, ay + ah); g.stroke();
      g.font = '800 ' + 1.4 * u + 'px ' + sys; g.fillText(h.w + ' mm', ax + aw / 2 - 2.5 * u, ay - 3.4 * u); g.fillText(h.h + ' mm', ax + aw + 2 * u, ay + ah / 2 - .7 * u);
      g.fillStyle = '#1a1a1a'; g.font = '800 ' + 1.6 * u + 'px ' + sys; g.fillText('ACTUAL SIZE ON LETTER PAPER', ax, ay + ah + 1.4 * u);
    } else { g.fillStyle = '#1a1a1a'; g.font = '800 ' + 1.6 * u + 'px ' + sys; g.fillText('Too big to show at actual size here. Use the cut file.', ax, ay); }
    // facts
    var fx = 50 * u, fy = by + bh + 5 * u, facts = [['Piece', presetOf(HW_SHAPES, h.shape)[1] + ' plate'], ['Size', h.w + ' x ' + h.h + ' mm (' + mmIn(h.w) + ' x ' + mmIn(h.h) + ')'], ['Thickness', h.thick + ' mm'], ['Metal', finOf(h.fin)[1] + ', ' + presetOf(HW_LOOK, h.look)[1].toLowerCase()], ['Mark', presetOf(HW_MARK, h.mark)[1] + (h.mark === 'enamel' ? ' ' + toHex(h.enamel).toUpperCase() : '')], ['Border', { none: 'None', line: 'Single line', double: 'Double line', beads: 'Beads' }[h.border]], ['Attach', presetOf(HW_FIX, h.fix)[1] + (h.fix === 'rivets' ? ', 3 mm caps' : h.fix === 'screws' ? ', Chicago screws' : '')], ['Patch', h.back === 'none' ? 'None' : presetOf(HW_BACK, h.back)[1] + (h.stitch ? ', stitched edge' : '')]];
    g.font = '600 ' + 1.7 * u + 'px ' + sys;
    facts.forEach(function (f2, i) { g.fillStyle = '#8d887d'; g.fillText(f2[0].toUpperCase(), fx, fy + i * 3.5 * u); g.fillStyle = '#1a1a1a'; g.font = '800 ' + 1.7 * u + 'px ' + sys; g.fillText(f2[1], fx + 11 * u, fy + i * 3.5 * u); g.font = '600 ' + 1.7 * u + 'px ' + sys; });
    // colorway
    var cy = 92 * u; g.fillStyle = '#1a1a1a'; g.font = '900 ' + 2.1 * u + 'px ' + sys; g.fillText('COLORS', 5 * u, cy);
    var labels = ['Metal'].concat(h.back !== 'none' ? ['Patch'] : []).concat(h.mark === 'enamel' ? ['Enamel'] : []);
    hwCols().forEach(function (hx0, i) { var hx = toHex(hx0), x = 5 * u + i * 22 * u, y = cy + 3.4 * u, pt = S.board.pantone[hx]; g.fillStyle = hx; g.fillRect(x, y, 18 * u, 8 * u); g.strokeStyle = '#1a1a1a'; g.lineWidth = .2 * u; g.strokeRect(x, y, 18 * u, 8 * u); g.fillStyle = '#1a1a1a'; g.font = '800 ' + 1.5 * u + 'px ' + sys; g.fillText(labels[i].toUpperCase() + '  ' + hx.toUpperCase(), x, y + 9 * u); g.font = '600 ' + 1.25 * u + 'px ' + sys; g.fillStyle = pt ? '#1a1a1a' : '#b0aa9c'; g.fillText(pt ? 'PANTONE ' + pt : 'Pantone: match it', x, y + 11.2 * u); });
    var ny = 110 * u; g.fillStyle = '#1a1a1a'; g.font = '900 ' + 2.1 * u + 'px ' + sys; g.fillText('NOTES', 5 * u, ny);
    g.font = '600 ' + 1.8 * u + 'px ' + sys; wrapText(g, S.board.notes || 'Add notes on the Board tab: bag, placement, quantity.', 5 * u, ny + 3.4 * u, 90 * u, 2.6 * u);
    g.fillStyle = '#8d887d'; g.font = '600 ' + 1.35 * u + 'px ' + sys; g.fillText('Metal colors on screen are a guide. Ask for a physical sample before a run. Made with NOCIV Patterns.', 5 * u, H - 4 * u);
    return c;
  }
  // Cut file: the plate outline and holes as real vectors in millimeters. The mark goes in its own PNG.
  function hwSvg() {
    var h = HW(), ppm = 10, rec = [], fake = { beginPath: function () { rec = []; }, moveTo: function (x, y) { rec.push('M' + f(x) + ' ' + f(y)); }, lineTo: function (x, y) { rec.push('L' + f(x) + ' ' + f(y)); }, closePath: function () { rec.push('Z'); } };
    function f(v) { return (Math.round(v / ppm * 100) / 100 + h.w / 2).toFixed(2); }
    // sample the outline into points (exact enough for laser and CNC, about 0.05 mm)
    var c = E.cv(4, 4).getContext('2d'), N = 1440, w = h.w * ppm / 2, hh = h.h * ppm / 2, pts = [];
    for (var i = 0; i < N; i++) { var a = i / N * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a), lo = 0, hi = Math.max(w, hh) * 2; for (var k = 0; k < 18; k++) { var mid = (lo + hi) / 2; hwPath(c, h, ppm, 0); if (c.isPointInPath(dx * mid, dy * mid)) lo = mid; else hi = mid; } pts.push([dx * lo, dy * lo]); }
    void fake;
    var X = function (v) { return (v / ppm + h.w / 2).toFixed(2); }, Y = function (v) { return (v / ppm + h.h / 2).toFixed(2); };
    var d = pts.map(function (p, j) { return (j ? 'L' : 'M') + X(p[0]) + ' ' + Y(p[1]); }).join('') + 'Z', holes = '';
    if (h.fix === 'rivets' || h.fix === 'screws' || h.fix === 'sew') hwFixPoints(h, ppm).forEach(function (p) { holes += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="' + (h.fix === 'sew' ? .75 : 1.25) + '" fill="none" stroke="#ff0000" stroke-width="0.1"/>'; });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + h.w + 'mm" height="' + h.h + 'mm" viewBox="0 0 ' + h.w + ' ' + h.h + '">\n<!-- NOCIV hardware cut file. Units are millimeters. Red = cut. ' + h.thick + ' mm ' + finOf(h.fin)[1] + '. The mark is in the separate mark PNG: trace it or convert text to outlines in your cutter software. -->\n<path d="' + d + '" fill="none" stroke="#ff0000" stroke-width="0.1"/>\n' + holes + '\n</svg>';
  }
  function hwMarkPng() { var h = HW(), ppm = 1000 / 25.4, mk = hwMask(h, ppm), c = E.cv(mk.width, mk.height), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.save(); g.translate(c.width / 2, c.height / 2); hwPath(g, h, ppm, 0); g.strokeStyle = '#999'; g.lineWidth = 2; g.stroke(); g.restore(); g.drawImage(mk, 0, 0); return c; }
  function hwPane(p) {
    var h = HW();
    if (p === 'hplate') return '<div class="grid g5 tight">' + HW_SHAPES.map(function (x) { return '<button type="button" class="pick" data-hshape="' + x[0] + '" aria-pressed="' + (h.shape === x[0]) + '"><canvas data-mini="hshape:' + x[0] + '" width="120" height="64"></canvas>' + x[1] + '</button>'; }).join('') + '</div>' +
      stepper('hw', 'Width', h.w, h.w + ' mm  ' + mmIn(h.w)) + stepper('hh', 'Height', h.h, h.h + ' mm  ' + mmIn(h.h));
    if (p === 'hmark') return '<div class="row"><input class="txt" id="hwtext" maxlength="18" value="' + esc(h.text) + '" placeholder="Brand name" aria-label="Main words"><input class="txt" id="hwline2" maxlength="28" value="' + esc(h.line2) + '" placeholder="Small line" aria-label="Small line"></div>' +
      '<div class="row"><b>How</b>' + seg('hmk', HW_MARK, h.mark) + '</div>' +
      '<div class="row"><b>Logo</b>' + seg('hlogo', [['none', 'None'], ['left', 'Beside words'], ['center', 'Above words']], h.logo) + '</div>' +
      '<div class="hrow">' + FONTS.map(function (x) { return '<button type="button" class="pick" data-hfont="' + x[0] + '" aria-pressed="' + (h.font === x[0]) + '"><span style="font:17px/1.1 \'' + x[0] + '\',sans-serif">' + esc((h.text || 'Aa').slice(0, 3)) + '</span></button>'; }).join('') + '</div>' +
      (h.mark === 'cut' ? '<p class="note">Cut through letters lose their middles (O, A, R). Use a stencil style font, or ask the cutter to leave small bridges.</p>' : '<p class="note">Logo uses the one from the Logo maker. Clear the words to show just the logo.</p>');
    if (p === 'hdetail') return '<div class="row"><b>Edge</b>' + seg('hbd', [['none', 'Plain'], ['line', 'Line'], ['double', 'Double'], ['beads', 'Beads']], h.border) + '</div>' +
      '<div class="row"><b>Attach</b>' + seg('hfix', HW_FIX, h.fix) + '</div>' +
      '<div class="row"><b>Thick</b>' + seg('hthk', [['1', '1 mm'], ['1.5', '1.5 mm'], ['2', '2 mm'], ['3', '3 mm']], String(h.thick)) + '</div>' +
      '<p class="note">' + { rivets: 'Rivets go through the plate and the leather. Strongest on bags.', screws: 'Chicago screws come apart, so the plate can be swapped.', prongs: 'Prongs (tabs) push through slits and fold flat behind. Clean front, no holes showing.', sew: 'Sew holes let you stitch it on like a patch.', none: 'Glue only. Fine for display, weak on bags that flex.' }[h.fix] + '</p>';
    if (p === 'hmetal') return '<div class="grid g4 tight">' + HW_FIN.map(function (x) { return '<button type="button" class="pick" data-hfin="' + x[0] + '" aria-pressed="' + (h.fin === x[0]) + '"><canvas data-mini="hfin:' + x[0] + '" width="120" height="56"></canvas>' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div class="row"><b>Finish</b>' + seg('hlook', HW_LOOK, h.look) + '</div>' +
      (h.mark === 'enamel' ? '<div class="row"><b>Enamel</b><div class="mine"><label><input type="color" data-hen="1" value="' + toHex(h.enamel) + '">Fill color</label></div></div>' : '');
    if (p === 'hback') return '<div class="grid g3 tight hbacks">' + HW_BACK.map(function (x) { return '<button type="button" class="pick" data-hback="' + x[0] + '" aria-pressed="' + (h.back === x[0]) + '"><canvas data-mini="hback:' + x[0] + '" width="120" height="48"></canvas>' + x[1] + '</button>'; }).join('') + '</div>' +
      (h.back !== 'none' ? '<div class="row"><b>Color</b><div class="sw hwcols">' + HW_LEATHER.map(function (c) { return '<button type="button" data-hcol="' + c + '" style="background:' + c + '" aria-label="' + c + '" aria-pressed="' + (h.backCol === c) + '"></button>'; }).join('') + '<label class="hwpick"><input type="color" data-hbc="1" value="' + toHex(h.backCol) + '">+</label></div></div><div class="row"><b>Stitch</b>' + seg('hst', [['1', 'Stitched edge'], ['0', 'No stitch']], h.stitch ? '1' : '0') + '</div>' : '');
    return '';
  }
  var HW_WHERE = [
    ['SendCutSend', 'Laser cut brass, copper, steel and aluminum. Upload the SVG, no minimum.', 'https://sendcutsend.com'],
    ['OSH Cut', 'Instant quotes for laser cut metal from one part.', 'https://www.oshcut.com'],
    ['Ponoko', 'Laser cut and engraved metal and acrylic, small runs.', 'https://www.ponoko.com'],
    ['Local engraver', 'Trophy and sign shops engrave brass plates fast and cheap. Bring the mark PNG.', 'https://www.google.com/search?q=brass+plate+engraving+near+me']
  ];
  function hwMini(c, what, v) {
    var g = c.getContext('2d'), W = c.width, H = c.height, h = Object.assign({}, HW());
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    if (what === 'hback') { if (v === 'none') { g.fillStyle = '#e7e2d6'; g.fillRect(0, 0, W, H); return; } var col = presetOf(HW_BACK, v)[2]; g.fillStyle = g.createPattern(backTex(v, col, 4), 'repeat'); g.fillRect(0, 0, W, H); return; }
    var saved = S.hw; S.hw = Object.assign({}, h, { text: '', line2: '', logo: 'none', back: 'none', border: 'none', fix: 'none' });
    if (what === 'hshape') { S.hw.shape = v; S.hw.w = v === 'circle' || v === 'badge' || v === 'hex' || v === 'shield' || v === 'diamond' ? 30 : 56; S.hw.h = 30; }
    if (what === 'hfin') { S.hw.fin = v; S.hw.shape = 'rounded'; S.hw.w = 56; S.hw.h = 24; }
    try { drawHW(g, W / 2, H / 2 - 2, Math.min(W * .8 / S.hw.w, H * .8 / S.hw.h), false); } finally { S.hw = saved; }
  }

  /* ---------- tiles ---------- */
  var tcache = {};
  function stateKey() { return JSON.stringify([S.kind, colors(), S.logo, S.rep, S.plaid, S.stripes, S.checks, S.camo, !!PIC && PIC.width + 'x' + PIC.height + (PIC._id || '')]); }
  function tileAt(ppi, big) {
    var key = stateKey() + '@' + Math.round(ppi * 10) + (big ? 'B' : '');
    if (tcache.k === key) return tcache.t;
    var cols = colors(), t = null, k = S.kind;
    if (k === 'logo' || k === 'picture') { var m = motif(); if (m) t = E.repeatTile({ motif: m, motifs: motifs(), type: S.rep.type, tileIn: S.rep.tileIn, tileInY: S.rep.tileInY || null, ppi: ppi, scale: S.rep.scale, angle: S.rep.angle, flip: S.rep.flip, bg: S.rep.clear ? null : cols[0], seed: S.rep.seed, density: S.rep.density }); }
    else if (k === 'plaid') t = E.plaidTile({ sett: S.plaid.sett, mirror: S.plaid.mirror, threadIn: S.plaid.threadIn, ppi: ppi, colors: cols, weave: S.plaid.weave });
    else if (k === 'stripes') t = E.stripeTile({ bands: S.stripes.bands.map(function (b) { return [b[0], b[1] * S.stripes.scale, b[2] || 'solid']; }), dir: S.stripes.dir, ppi: ppi, colors: cols, logo: S.stripes.bands.some(function (b) { return b[2] === 'logo'; }) ? renderLogo(S.logo, cols, 300) : null });
    else if (k === 'checks') t = E.checkTile({ kind: S.checks.kind, cellIn: S.checks.cellIn, fill: S.checks.fill, mix: mixOf(), point: S.checks.point, ppi: ppi, colors: cols, logo: S.checks.point === 'logo' || (mixOf() || []).indexOf('logo') >= 0 ? renderLogo(S.logo, cols, 300) : null });
    else if (k === 'camo') t = E.camoTile({ type: S.camo.type, tileIn: S.camo.tileIn, scale: S.camo.scale, seed: S.camo.seed, ppi: ppi, colors: cols, maxWork: big ? 1800 : 900 });
    tcache = { k: key, t: t }; return t;
  }
  function tileInches() { var t = tileAt(20); return t ? [t.width / 20, t.height / 20] : [0, 0]; }
  function repeatName() {
    var k = S.kind; if (!k) return '';
    if (k === 'logo' || k === 'picture') return (presetOf(E.REPEATS, S.rep.type) || [0, ''])[1];
    if (k === 'plaid') return (presetOf(E.PLAIDS, S.plaid.preset) || [0, 'My plaid'])[1] + ' plaid';
    if (k === 'stripes') return (presetOf(E.STRIPES, S.stripes.preset) || [0, 'My stripe'])[1];
    if (k === 'checks') return (presetOf(E.CHECKS, S.checks.kind) || [0, 'Checks'])[1];
    if (k === 'hardware') return (HW().text || 'Custom') + ' plate';
    return (presetOf(E.CAMOS, S.camo.type) || [0, 'Camo'])[1] + ' camo';
  }

  /* ---------- the picture on top ---------- */
  var view = $('view'), vg = view.getContext('2d'), texCache = {};
  function fit() { var r = view.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); view.width = Math.max(1, Math.round(r.width * d)); view.height = Math.max(1, Math.round(r.height * d)); }
  function bgRow() { return S.kind === 'logo' || S.kind === 'picture' ? '<div class="row"><b>Background</b>' + seg('clear', [['0', 'A color'], ['1', 'None, clear']], S.rep.clear ? '1' : '0') + '</div>' : ''; }
  function clearBg() { return (S.kind === 'logo' || S.kind === 'picture') && S.rep.clear; }
  function showBorder() { return S.kind && S.kind !== 'hardware' && S.step < 4 && (S.border || S.part['1:' + S.kind] === 'gap' && S.step === 1); }
  // gaps: the space between one motif and the next, in inches
  function motifAspect() { var m = motif(); if (!m) return [1, 1]; var mx = Math.max(m.width, m.height); return [m.width / mx, m.height / mx]; }
  function gaps() { var a = motifAspect(), w = S.rep.scale * S.rep.tileIn * a[0], h = S.rep.scale * S.rep.tileIn * a[1]; return { w: w, h: h, x: S.rep.tileIn - w, y: (S.rep.tileInY || S.rep.tileIn) - h }; }
  function gapTxt(v) { return v < -.01 ? 'Overlap ' + fmtIn(-v) : fmtIn(Math.max(0, v)); }
  function fillPattern(g, W, H, ppi, withFabric) {
    var t = tileAt(ppi); if (!t) return false; g.clearRect(0, 0, W, H);
    if (clearBg() && S.step < 4) { var ck = E.checkTile({ kind: 'board', cellIn: .125, fill: 'solid', point: 'none', ppi: Math.max(ppi, 64), colors: ['#ffffff', '#e4e1da'] }); g.fillStyle = g.createPattern(ck, 'repeat'); g.fillRect(0, 0, W, H); }
    g.fillStyle = g.createPattern(t, 'repeat'); g.fillRect(0, 0, W, H);
    if (showBorder()) { // the tile border: every repeat edge dashed, the first tile solid
      var tw = t.width, th = t.height; g.save(); g.strokeStyle = '#c8412f'; g.lineWidth = Math.max(1, W / 360); g.setLineDash([g.lineWidth * 4, g.lineWidth * 3]);
      for (var bx = tw; bx < W; bx += tw) { g.beginPath(); g.moveTo(bx, 0); g.lineTo(bx, H); g.stroke(); } for (var by = th; by < H; by += th) { g.beginPath(); g.moveTo(0, by); g.lineTo(W, by); g.stroke(); }
      g.setLineDash([]); g.lineWidth *= 2.2; g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, Math.min(tw, W) - g.lineWidth, Math.min(th, H) - g.lineWidth); g.restore();
    }
    if (withFabric) {
      var key = S.fabric + Math.round(ppi); if (!texCache[key]) texCache[key] = E.fabricTexture(S.fabric, 256, ppi);
      g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(texCache[key], 'repeat'); g.fillRect(0, 0, W, H); g.restore();
      if (S.fabric === 'satin') { var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    }
    return true;
  }
  var raf = 0;
  function draw() { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; drawNow(); }); }
  function drawNow() {
    fit(); var W = view.width, H = view.height, g = vg; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    $('views').hidden = !S.kind || S.step === 4; var bbtn = document.querySelector('#views [data-b]'); if (bbtn) { bbtn.hidden = S.kind === 'hardware'; bbtn.setAttribute('aria-pressed', String(!!S.border)); }
    if (S.step === 4 && S.kind) { var b = boardCanvas(900); var k = Math.min(W / b.width, H / b.height) * .96; g.fillStyle = '#e7e2d6'; g.fillRect(0, 0, W, H); g.drawImage(b, (W - b.width * k) / 2, (H - b.height * k) / 2, b.width * k, b.height * k); tag('Your mood board for the tech pack'); return; }
    if (!S.kind) { welcome(g, W, H); tag('Pick what you are making'); return; }
    if (S.kind === 'hardware') { $('views').hidden = true; hwDrawView(g, W, H); return; }
    var across = { close: 3, swatch: 10, yard: 42 }[S.view] || 10, ppi = W / across;
    if (!fillPattern(g, W, H, ppi, S.step >= 3 || S.view === 'close')) { g.fillStyle = '#e7e2d6'; g.fillRect(0, 0, W, H); tag(S.kind === 'picture' ? 'Choose a picture to repeat' : 'Loading'); return; }
    if (S.view === 'yard') { g.fillStyle = 'rgba(26,26,26,.85)'; for (var x = 0; x <= 42; x += 6) { var px = x * ppi; g.fillRect(px, 0, Math.max(1, ppi * .05), ppi * (x % 12 ? .6 : 1.2)); } }
    var ti = tileInches();
    tag(repeatName() + '. Repeats every ' + fmtIn(ti[0]) + (Math.abs(ti[0] - ti[1]) > .01 ? ' by ' + fmtIn(ti[1]) : '') + '. ' + (S.view === 'yard' ? 'Showing 42 in across.' : S.view === 'close' ? 'Showing 3 in across.' : 'Showing 10 in across.') + (S.step >= 3 ? ' On ' + (presetOf(E.FABRICS, S.fabric) || [0, ''])[1].toLowerCase() + '.' : ''));
  }
  function fmtIn(v) { return (Math.round(v * 100) / 100) + ' in'; }
  function tag(t) { $('tag').textContent = t; }
  function welcome(g, W, H) {
    var cols = ['#f3efe6', '#1a1a1a'], t = E.checkTile({ kind: 'board', cellIn: .5, fill: 'dots', point: 'none', ppi: W / 8, colors: ['#ece6d6', '#d9d1bd'] });
    g.fillStyle = g.createPattern(t, 'repeat'); g.fillRect(0, 0, W, H);
    var m = renderLogo({ shape: 'badge', text: 'YOU', font: 'FS Archivo Black', icon: 'star', ring: true }, ['#f3efe6', '#c8412f'], 400), s = Math.min(W, H) * .5;
    g.drawImage(m, (W - s) / 2, (H - s) / 2, s, s); void cols;
  }

  /* ---------- steps and parts ---------- */
  var STEPS = [['Start', 'spark'], ['Make', 'make'], ['Color', 'drop'], ['Fabric', 'cloth'], ['Board', 'board']];
  function partsFor(step) {
    if (step === 0) return [['what', 'What', 'spark']];
    if (step === 1) {
      var k = S.kind;
      if (k === 'logo') return [['shape', 'Shape', 'shape'], ['words', 'Words', 'words'], ['icon', 'Icon', 'icon'], ['repeat', 'Repeat', 'repeat'], ['size', 'Size', 'size'], ['gap', 'Gaps', 'size']];
      if (k === 'picture') return [['pic', 'Picture', 'pic'], ['repeat', 'Repeat', 'repeat'], ['size', 'Size', 'size'], ['gap', 'Gaps', 'size']];
      if (k === 'plaid') return [['pstyle', 'Style', 'style'], ['threads', 'Threads', 'threads'], ['weave', 'Weave', 'weave']];
      if (k === 'stripes') return [['sstyle', 'Style', 'style'], ['bands', 'Bands', 'threads'], ['lay', 'Lay', 'size']];
      if (k === 'checks') return [['cstyle', 'Style', 'style'], ['fill', 'Fill', 'fill'], ['corner', 'Corners', 'corner'], ['csize', 'Size', 'size']];
      if (k === 'camo') return [['mstyle', 'Style', 'style'], ['msize', 'Size', 'size']];
      if (k === 'hardware') return [['hplate', 'Plate', 'plate'], ['hmark', 'Mark', 'words'], ['hdetail', 'Details', 'edge']];
      return [['what', 'What', 'spark']];
    }
    if (step === 2) return S.kind === 'hardware' ? [['hmetal', 'Metal', 'pal']] : [['pals', 'Palettes', 'pal'], ['mine', 'My colors', 'mine']];
    if (step === 3) return S.kind === 'hardware' ? [['hback', 'Patch', 'cloth']] : [['fabric', 'Fabric', 'cloth']];
    return [['board', 'Board', 'board'], ['files', 'Files', 'file'], ['where', S.kind === 'hardware' ? 'Make it' : 'Print it', 'print']];
  }
  function curPart() { var ps = partsFor(S.step), p = S.part[S.step + ':' + S.kind]; return ps.some(function (x) { return x[0] === p; }) ? p : ps[0][0]; }
  function drawBar() {
    var bb = $('bbar'); bb.innerHTML = '<i style="width:' + ((S.step + 1) / 5 * 100) + '%"></i>' + STEPS.map(function (s, i) { return '<button type="button" data-s="' + i + '"' + (i === S.step ? ' aria-current="step"' : '') + (i > 0 && !S.kind ? ' disabled' : '') + '>' + ico(s[1], '') + '<span>' + s[0] + '</span></button>'; }).join('');
    var p = curPart(); $('parts').innerHTML = partsFor(S.step).map(function (x) { return '<button type="button" data-p="' + x[0] + '" aria-pressed="' + (x[0] === p) + '">' + ico(x[2], '') + '<span>' + x[1] + '</span></button>'; }).join('');
  }
  function go(step, part) { S.step = step; if (part) S.part[step + ':' + S.kind] = part; $('con').classList.remove('down'); keep(); render(); }
  function render() { drawBar(); $('pane').innerHTML = paneHtml(curPart()); $('pane').scrollTop = 0; afterPane(); draw(); }
  function changed(rebuild) { keep(); if (rebuild) { $('pane').innerHTML = paneHtml(curPart()); afterPane(); } draw(); }

  /* ---------- panes ---------- */
  function picks(list, cur, attr, cols, extra, tight) { return '<div class="grid g' + (cols || 3) + (tight ? ' tight' : '') + '">' + list.map(function (x) { return '<button type="button" class="pick" data-' + attr + '="' + x[0] + '" aria-pressed="' + (String(x[0]) === String(cur)) + '">' + (extra ? extra(x) : '') + esc(x[1]) + (x[2] && cols <= 2 && !tight ? '<small>' + esc(x[2]) + '</small>' : '') + '</button>'; }).join('') + '</div>'; }
  function stepper(name, label, val, txt) { return '<div class="row"><b>' + label + '</b><div class="step" data-st="' + name + '"><button type="button" data-d="-1" aria-label="Less">&minus;</button><output>' + esc(txt || val) + '</output><button type="button" data-d="1" aria-label="More">+</button></div></div>'; }
  function seg(name, opts, val) { return '<div class="seg" data-sg="' + name + '">' + opts.map(function (o) { return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (String(o[0]) === String(val)) + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  function mini(id) { return '<canvas data-mini="' + id + '" width="160" height="84"></canvas>'; }
  function paneHtml(p) {
    var cols = colors();
    if (p.charAt(0) === 'h' && p !== 'help') { var hp = hwPane(p); if (hp) return hp; }
    if (p === 'what') return '<p class="h">What are you making?</p><div class="grid g4 kinds">' + KINDS.map(function (k) { return '<button type="button" class="pick big" data-kind="' + k[0] + '" aria-pressed="' + (S.kind === k[0]) + '">' + ico(KIND_ICON[k[0]]) + k[1] + '<small>' + k[2] + '</small></button>'; }).join('') + '</div>';
    if (p === 'shape') return '<p class="h">Pick a shape for your logo</p>' + picks(SHAPES, S.logo.shape, 'shape', 5, function (x) { return mini('shape:' + x[0]); }, true) + '<div class="row" style="margin-top:8px"><b>Inner ring</b>' + seg('ring', [['0', 'Off'], ['1', 'On']], S.logo.ring ? '1' : '0') + '</div>';
    if (p === 'words') return '<div class="row"><b>Words</b><input class="txt" id="ltext" maxlength="14" value="' + esc(S.logo.text) + '" placeholder="Your initials" autocomplete="off"></div><p class="h">Letters</p>' + picks(FONTS, S.logo.font, 'font', 4, function (x) { return '<span style="font:19px/1.1 \'' + x[0] + '\',sans-serif">' + esc((S.logo.text || 'Aa').slice(0, 3)) + '</span>'; }, true);
    if (p === 'icon') return '<p class="h">Add a little picture</p>' + picks(ICONS, S.logo.icon, 'icon', 5, function (x) { return mini('icon:' + x[0]); }, true) + '<p class="note">Colors come from the Color step. Your logo saves as a PNG on the Board.</p>';
    if (p === 'gap') { var gp = gaps(); return '<p class="h">Space between each one</p>' + stepper('gapx', 'Across', 0, gapTxt(gp.x)) + stepper('gapy', 'Down', 0, gapTxt(gp.y)) +
      '<div class="row"><b>Border</b>' + seg('border', [['1', 'Show'], ['0', 'Hide']], S.border ? '1' : '0') + '</div><button type="button" class="btn" data-act="evengap">Make down the same as across</button><p class="note">The red box is one tile, the piece that repeats. It shows here while you set gaps. Border Show keeps it on everywhere.</p>'; }
    if (p === 'pic') return (PIC ? '<div class="grid g2"><button type="button" class="btn dark" data-act="choose">New picture</button><button type="button" class="btn" data-act="recrop">Crop it</button></div>' : '<button type="button" class="btn dark" data-act="choose">Choose a picture</button>') + '<p class="note" style="margin:6px 0 10px">PNG with a clear background works best. A halftone from Stencil + Halftone comes in here too.</p>' +
      '<div class="row"><b>White</b>' + seg('white', [['1', 'Remove white'], ['0', 'Keep it']], S.rep.white ? '1' : '0') + '</div>' +
      '<div class="row"><b>Color</b>' + seg('tint', [['0', 'As it is'], ['1', 'One color']], S.rep.tint ? '1' : '0') + '</div><p class="note">One color turns it into a monogram or watermark in your ink.</p>';
    if (p === 'repeat') return '<p class="h">How it repeats</p>' + picks(E.REPEATS, S.rep.type, 'rep', 5, function (x) { return mini('rep:' + x[0]); }, true) + '<div class="row" style="margin-top:8px"><b>Mix</b>' + seg('ralt', [['none', 'Just one'], ['icon', 'Icon'], ['space', 'Space'], ['other', S.kind === 'logo' ? 'Picture' : 'Logo']], S.rep.alt || 'none') + '</div>';
    if (p === 'size') return stepper('tileIn', 'Repeat', S.rep.tileIn, fmtIn(S.rep.tileIn)) + stepper('scale', 'Motif', S.rep.scale, Math.round(S.rep.scale * 100) + '%') + stepper('angle', 'Turn', S.rep.angle, S.rep.angle + '°') +
      '<div class="row"><b>Flip</b>' + seg('flip', [['none', 'All same'], ['alt', 'Every other']], S.rep.flip) + '</div>' +
      '<div class="row"><b>Fade</b>' + seg('fade', [['100', 'Solid'], ['60', '60%'], ['30', 'Watermark']], String(S.rep.fade)) + '</div>' + (S.rep.type === 'toss' ? '<button type="button" class="btn" data-act="toss">Shuffle the toss</button>' : '');
    if (p === 'pstyle') return picks(E.PLAIDS, S.plaid.preset, 'plaid', 4, function (x) { return mini('plaid:' + x[0]); }, true) + '<p class="note">' + esc((presetOf(E.PLAIDS, S.plaid.preset) || [0, 0, ''])[2]) + '</p>';
    if (p === 'threads') return bandsHtml(S.plaid.sett, cols, 'threads') + '';
    if (p === 'weave') return '<div class="row"><b>Mirror</b>' + seg('pmirror', [['1', 'Like tartan'], ['0', 'No']], S.plaid.mirror ? '1' : '0') + '</div><div class="row"><b>Weave</b>' + seg('weave', [['twill', 'Twill'], ['plain', 'Plain'], ['flat', 'Printed']], S.plaid.weave) + '</div><p class="note" style="margin:-2px 0 10px">Twill is the diagonal you see on flannel. Printed is a flat color mix.</p>' + stepper('thread', 'Thread', S.plaid.threadIn, Math.round(1 / S.plaid.threadIn) + ' per in') + '<p class="note">More threads per inch makes the plaid smaller.</p>';
    if (p === 'sstyle') return picks(E.STRIPES, S.stripes.preset, 'stripe', 4, function (x) { return mini('stripe:' + x[0]); }, true) + '<p class="note">' + esc((presetOf(E.STRIPES, S.stripes.preset) || [0, 0, ''])[2]) + '</p>';
    if (p === 'bands') return '<p class="h">Each band, its color and width</p>' + bandsHtml(S.stripes.bands, cols, 'bands');
    if (p === 'lay') return '<div class="row"><b>Direction</b>' + seg('sdir', [['h', 'Across'], ['v', 'Up and down'], ['d', 'Diagonal']], S.stripes.dir) + '</div>' + stepper('sscale', 'Size', S.stripes.scale, Math.round(S.stripes.scale * 100) + '%');
    if (p === 'cstyle') return picks(E.CHECKS, S.checks.kind, 'check', 3, function (x) { return mini('check:' + x[0]); }, true) + '<p class="note">' + esc((presetOf(E.CHECKS, S.checks.kind) || [0, 0, ''])[2]) + '</p>';
    if (p === 'fill') { var mx = mixOf(), n = mx ? mx.length : 1; return '<div class="row"><b>Squares</b>' + seg('cmix', [['1', 'All same'], ['2', 'Mix 2'], ['3', 'Mix 3'], ['4', 'Mix 4']], String(n)) + '</div>' +
      (mx ? '<div class="slots">' + mx.map(function (f, i) { return '<div class="row"><b>' + (i + 1) + '</b>' + seg('slot' + i, MIXUI, f) + '</div>'; }).join('') + '</div><p class="note">The squares take turns. Logo uses your Logo maker logo.</p>'
        : picks(E.FILLS, S.checks.fill, 'cfill', 3, function (x) { return mini('fill:' + x[0]); }, true) + '<p class="note">Works on Checkerboard and Two-tone.</p>'); }
    if (p === 'corner') return '<p class="h">Put something where the lines meet</p>' + picks(E.POINTS, S.checks.point, 'point', 3, function (x) { return mini('point:' + x[0]); }, true) + '<p class="note">My logo uses the logo from the Logo maker.</p>';
    if (p === 'csize') return stepper('cell', 'Square', S.checks.cellIn, fmtIn(S.checks.cellIn));
    if (p === 'mstyle') return picks(E.CAMOS, S.camo.type, 'camo', 3, function (x) { return mini('camo:' + x[0]); }, true) + '<p class="note">' + esc((presetOf(E.CAMOS, S.camo.type) || [0, 0, ''])[2]) + '</p>';
    if (p === 'msize') return stepper('cscale', 'Blobs', S.camo.scale, Math.round(S.camo.scale * 100) + '%') + stepper('ctile', 'Repeat', S.camo.tileIn, fmtIn(S.camo.tileIn)) + '<button type="button" class="btn dark" data-act="camoseed">Shuffle the shapes</button><p class="note">Bigger repeats hide the seam on big pieces like jackets.</p>';
    if (p === 'pals') { var key = PALKEY[S.kind]; return (bgRow() || '<p class="h">Ready-made colors</p>') + '<div class="pals' + (E.PALETTES[key].length > 4 ? ' two' : '') + '">' + E.PALETTES[key].map(function (pl, i) { return '<button type="button" class="pal" data-pal="' + i + '" aria-pressed="' + (S.palBy[S.kind] === pl[0]) + '">' + esc(pl[0]) + '<span>' + pl[1].map(function (h) { return '<i style="background:' + h + '"></i>'; }).join('') + '</span></button>'; }).join('') + '</div>'; }
    if (p === 'mine') return (bgRow() || '<p class="h">Your own colors</p>') + '<div class="mine">' + cols.map(function (h, i) { return '<label><input type="color" data-ci="' + i + '" value="' + toHex(h) + '">' + colorName(i) + '</label>'; }).join('') + '</div><p class="note">' + (S.kind === 'logo' || S.kind === 'picture' ? 'Ground is the fabric color, Ink is your logo or one color picture.' : 'Each number is one color in your pattern.') + '</p>';
    if (p === 'fabric') { var sug = E.SUGGEST[PALKEY[S.kind] === 'repeat' ? 'repeat' : PALKEY[S.kind]] || []; return '<div class="grid g4 tight fabs">' + E.FABRICS.map(function (f) { return '<button type="button" class="pick' + (sug.indexOf(f[0]) >= 0 ? ' fit' : '') + '" data-fab="' + f[0] + '" aria-pressed="' + (S.fabric === f[0]) + '">' + mini('fab:' + f[0]) + esc(f[1].replace('Cotton ', '').replace('Jersey knit', 'Jersey')) + '</button>'; }).join('') + '</div><p class="note">' + esc((presetOf(E.FABRICS, S.fabric) || [0, 0, ''])[2]) + ' Red dot = good fit. ' + esc(E.SUGGEST_WHY[PALKEY[S.kind] === 'repeat' ? 'repeat' : PALKEY[S.kind]] || '') + '</p>'; }
    if (p === 'board') return '<div class="row"><input class="txt" data-bd="name" value="' + esc(S.board.name) + '" placeholder="Name: ' + esc(repeatName()) + '" aria-label="Name"><input class="txt" data-bd="by" value="' + esc(S.board.by) + '" placeholder="Made by" aria-label="Made by"></div><div class="row"><input class="txt" aria-label="Notes" data-bd="notes" value="' + esc(S.board.notes) + '" placeholder="Notes: season, garment, trims"></div><p class="h" style="margin-top:4px">Pantone codes, if you matched them (? explains)</p><div class="pcodes">' + cols.map(function (h, i) { return '<div class="pcode"><i style="background:' + h + '"></i><code>' + toHex(h).toUpperCase() + '</code><input data-pt="' + i + '" value="' + esc(S.board.pantone[toHex(h)] || '') + '" placeholder="19-4052 TCX"></div>'; }).join('') + '</div>';
    if (p === 'files' && S.kind === 'hardware') return '<button type="button" class="btn dark" data-act="make">Make my files</button><p class="note" style="margin:6px 0 8px">Cut file (SVG in mm), the mark at 1000 DPI, a render and the spec sheet.</p><div class="files" id="files"></div>';
    if (p === 'where' && S.kind === 'hardware') return '<div class="list two">' + HW_WHERE.map(function (w) { return '<a href="' + w[2] + '" target="_blank" rel="noopener"><b>' + w[0] + '</b>' + w[1] + '</a>'; }).join('') + '</div><p class="note">Gold color: cut it in brass, or ask a plater for gold plating after. Ask for one sample first.</p>';
    if (p === 'files') { var ti = tileInches(); return '<button type="button" class="btn dark" data-act="make">Make my files</button><p class="note" style="margin:6px 0 8px">Tile repeats every ' + fmtIn(ti[0]) + ' by ' + fmtIn(ti[1]) + ', saved at 150 DPI (' + Math.round(ti[0] * 150) + ' by ' + Math.round(ti[1] * 150) + ' px), ready for fabric printers.</p><div class="files" id="files"></div>'; }
    if (p === 'where') return '<div class="list two">' + WHERE.map(function (w) { return '<a href="' + w[2] + '" target="_blank" rel="noopener"><b>' + w[0] + '</b>' + w[1] + '</a>'; }).join('') + '</div><p class="note">Prices checked Nov 2026. Upload as Basic repeat.</p>';
    return '';
  }
  function colorName(i) { if (S.kind === 'logo' || S.kind === 'picture') return ['Ground', 'Ink'][i] || 'Color ' + (i + 1); return 'Color ' + (i + 1); }
  function toHex(c) { if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase(); if (/^#[0-9a-f]{3}$/i.test(c)) return ('#' + c.slice(1).replace(/./g, '$&$&')).toLowerCase(); var h = E.hex(c); return '#' + h.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }
  function bandsHtml(list, cols, name) {
    var unit = name === 'threads' ? function (v) { return v + ' th'; } : function (v) { return (Math.round(v * 100) / 100) + ' in'; };
    return '<div class="bands" data-bands="' + name + '">' + list.map(function (b, i) { return '<div class="band" data-i="' + i + '"><div class="sw">' + cols.map(function (h, ci) { return '<button type="button" data-bc="' + ci + '" style="background:' + h + '" aria-label="Color ' + (ci + 1) + '" aria-pressed="' + (b[0] === ci) + '"></button>'; }).join('') + '</div><div class="step" data-bw="' + i + '"><button type="button" data-d="-1">&minus;</button><output>' + unit(b[1]) + '</output><button type="button" data-d="1">+</button></div>' + (name === 'bands' ? '<button type="button" class="bf" data-bf="' + i + '" aria-label="Band fill">' + (presetOf(BANDF, b[2] || 'solid') || BANDF[0])[1] + '</button>' : '') + (list.length > 2 ? '<button type="button" class="x" data-del="' + i + '" aria-label="Remove">&times;</button>' : '') + '</div>'; }).join('') + '</div><button type="button" class="btn" data-act="addband" style="margin-top:6px;padding:9px">+ Add a band</button>';
  }
  var WHERE = [
    ['Spoonflower', 'About $20 a yard basic cotton, sales near $15. No minimum.', 'https://www.spoonflower.com'],
    ['Fabric On Demand', 'Proof by email first. From about $16 a yard.', 'https://www.fabricondemand.com'],
    ['Little Cocalico', 'Family run, wholesale program. Poplin about $22.50 a yard.', 'https://littlecocalico.com'],
    ['Contrado', '100+ fabrics, swatches under $1. From about $24.', 'https://www.contrado.com/fabrics']
  ];

  /* ---------- small pictures inside buttons ---------- */
  function afterPane() {
    var cols = colors();
    Array.prototype.forEach.call($('pane').querySelectorAll('canvas[data-mini]'), function (c) {
      var id = c.dataset.mini.split(':'), what = id[0], v = id[1], g = c.getContext('2d'), W = c.width, H = c.height, t = null;
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      try {
        if (what.charAt(0) === 'h') { hwMini(c, what, v); return; }
        if (what === 'shape' || what === 'icon') { var L = Object.assign({}, S.logo); if (what === 'shape') L.shape = v; else { L.icon = v; } var lg = renderLogo(L, cols, 140); g.drawImage(lg, (W - 80) / 2, 2, 80, 80); return; }
        if (what === 'rep') { var m = S.kind === 'logo' ? renderLogo(S.logo, cols, 120) : (picMotif(cols) || renderLogo(S.logo, cols, 120)); t = E.repeatTile({ motif: m, type: v, tileIn: 1, ppi: 26, scale: .62, angle: 0, flip: 'none', bg: cols[0], seed: 7, density: 1 }); }
        else if (what === 'plaid') { var pr = presetOf(E.PLAIDS, v); t = E.plaidTile({ sett: pr[3], mirror: pr[4], threadIn: 1 / 36, ppi: 50, colors: cols, weave: 'twill' }); }
        else if (what === 'stripe') { var sp = presetOf(E.STRIPES, v); t = E.stripeTile({ bands: sp[3], dir: sp[4], ppi: 40, colors: cols }); }
        else if (what === 'check') t = E.checkTile({ kind: v, cellIn: .4, fill: S.checks.fill, point: 'none', ppi: 50, colors: cols });
        else if (what === 'fill') t = E.checkTile({ kind: 'board', cellIn: .5, fill: v, point: 'none', ppi: 50, colors: cols });
        else if (what === 'point') t = E.checkTile({ kind: S.checks.kind, cellIn: .5, fill: S.checks.fill, point: v, ppi: 50, colors: cols, logo: v === 'logo' ? renderLogo(S.logo, cols, 120) : null });
        else if (what === 'camo') { var cp = E.PALETTES.camo.filter(function (p2) { return p2[0] === (presetOf(E.CAMOS, v) || [])[3]; })[0]; t = E.camoTile({ type: v, tileIn: 6, scale: 1, seed: 3, ppi: 30, colors: S.camo.type === v ? cols : cp[1] }); }
        else if (what === 'fab') { var tx = E.fabricTexture(v, 96, 260); g.fillStyle = cols[0]; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(tx, 'repeat'); g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; return; }
        if (t) { g.fillStyle = g.createPattern(t, 'repeat'); g.fillRect(0, 0, W, H); }
      } catch (e) {}
    });
  }

  /* ---------- taps ---------- */
  var DEF = { logo: 'shape', picture: 'pic', plaid: 'pstyle', stripes: 'sstyle', checks: 'cstyle', camo: 'mstyle', hardware: 'hplate' };
  $('bbar').addEventListener('click', function (e) { var b = e.target.closest('button[data-s]'); if (b && !b.disabled) go(+b.dataset.s); });
  $('parts').addEventListener('click', function (e) { var b = e.target.closest('button[data-p]'); if (!b) return; S.part[S.step + ':' + S.kind] = b.dataset.p; $('con').classList.remove('down'); keep(); render(); });
  $('drop').addEventListener('click', function () { var d = $('con').classList.toggle('down'); this.setAttribute('aria-label', d ? 'Show the controls' : 'Hide the controls'); draw(); });
  $('views').addEventListener('click', function (e) { var bb = e.target.closest('button[data-b]'); if (bb) { S.border = !S.border; bb.setAttribute('aria-pressed', String(S.border)); keep(); render(); return; } var b = e.target.closest('button[data-v]'); if (!b) return; S.view = b.dataset.v; Array.prototype.forEach.call(this.children, function (x) { x.setAttribute('aria-pressed', String(x === b)); }); keep(); draw(); });
  var STEPV = {
    tileIn: function (d) { var o = S.rep.tileIn; S.rep.tileIn = clamp(S.rep.tileIn + d * .5, 1, 12); if (S.rep.tileInY) S.rep.tileInY = S.rep.tileInY * S.rep.tileIn / o; },
    gapx: function (d) { var g0 = gaps(), nt = clamp(g0.w + g0.x + d * .25, Math.max(.25, g0.w * .5), 24); if (!S.rep.tileInY) S.rep.tileInY = S.rep.tileIn; S.rep.scale = clamp(S.rep.scale * S.rep.tileIn / nt, .05, 1.6); S.rep.tileIn = nt; },
    gapy: function (d) { var g0 = gaps(); S.rep.tileInY = clamp(g0.h + g0.y + d * .25, Math.max(.25, g0.h * .5), 24); },
    scale: function (d) { S.rep.scale = clamp(Math.round((S.rep.scale + d * .05) * 100) / 100, .15, 1.6); },
    angle: function (d) { S.rep.angle = (S.rep.angle + d * 15 + 360) % 360; },
    thread: function (d) { var per = Math.round(1 / S.plaid.threadIn) - d * 4; S.plaid.threadIn = 1 / clamp(per, 8, 96); },
    sscale: function (d) { S.stripes.scale = clamp(Math.round((S.stripes.scale + d * .1) * 10) / 10, .3, 4); },
    cell: function (d) { S.checks.cellIn = clamp(Math.round((S.checks.cellIn + d * .125) * 1000) / 1000, .125, 3); },
    cscale: function (d) { S.camo.scale = clamp(Math.round((S.camo.scale + d * .1) * 10) / 10, .4, 2.5); },
    ctile: function (d) { S.camo.tileIn = clamp(S.camo.tileIn + d * 2, 4, 24); },
    hw: function (d) { var h = HW(); h.w = clamp(h.w + d * (h.w >= 40 ? 5 : 2), 10, 200); },
    hh: function (d) { var h = HW(); h.h = clamp(h.h + d * (h.h >= 40 ? 5 : 2), 8, 200); }
  };
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  $('pane').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; var d = b.dataset, cols = colors();
    if (d.kind) { var was = S.kind; S.kind = d.kind; if (d.kind === 'picture' && !PIC) { $('file').click(); } keep(); if (was !== d.kind || true) { S.step = 1; S.part['1:' + S.kind] = S.part['1:' + S.kind] || DEF[S.kind]; } render(); return; }
    if (d.hshape) { HW().shape = d.hshape; if (/circle|badge|hex|shield|diamond/.test(d.hshape) && HW().w > HW().h * 1.4) HW().h = HW().w = Math.max(HW().h, 30); if (/rect|rounded|pill/.test(d.hshape) && HW().w === HW().h) { HW().w = 60; HW().h = 20; } return changed(true); }
    if (d.hfont) { HW().font = d.hfont; return changed(true); }
    if (d.hfin) { HW().fin = d.hfin; return changed(true); }
    if (d.hback) { HW().back = d.hback; if (d.hback !== 'none') HW().backCol = presetOf(HW_BACK, d.hback)[2]; return changed(true); }
    if (d.hcol) { HW().backCol = d.hcol; return changed(true); }
    if (d.shape) { S.logo.shape = d.shape; return changed(true); }
    if (d.font) { S.logo.font = d.font; return changed(true); }
    if (d.icon) { S.logo.icon = d.icon; return changed(true); }
    if (d.rep) { S.rep.type = d.rep; return changed(true); }
    if (d.plaid) { var p = presetOf(E.PLAIDS, d.plaid); S.plaid.preset = d.plaid; S.plaid.sett = p[3].map(function (x) { return x.slice(); }); S.plaid.mirror = p[4]; ensureCols(p[3]); return changed(true); }
    if (d.stripe) { var sp = presetOf(E.STRIPES, d.stripe); S.stripes.preset = d.stripe; S.stripes.bands = sp[3].map(function (x) { return x.slice(); }); S.stripes.dir = sp[4]; ensureCols(sp[3]); return changed(true); }
    if (d.check) { S.checks.kind = d.check; return changed(true); }
    if (d.cfill) { S.checks.fill = d.cfill; return changed(true); }
    if (d.point) { S.checks.point = d.point; return changed(true); }
    if (d.camo) { S.camo.type = d.camo; var cp = E.PALETTES.camo[camoPalIndex()]; S.colorsBy.camo = cp[1].slice(); S.palBy.camo = cp[0]; return changed(true); }
    if (d.pal != null) { var pl = E.PALETTES[PALKEY[S.kind]][+d.pal]; S.colorsBy[S.kind] = pl[1].slice(); S.palBy[S.kind] = pl[0]; return changed(true); }
    if (d.fab) { S.fabric = d.fab; return changed(true); }
    if (d.act === 'choose') { $('file').click(); return; }
    if (d.act === 'recrop') { var src = PICSRC ? Promise.resolve(PICSRC) : new Promise(function (r) { PIC.toBlob(r, 'image/png'); }); src.then(function (f2) { return window.nocivCrop(f2, { title: 'Crop your picture', aspects: [['free', 'Free'], ['orig', 'Original'], [1, 'Square']], maxPx: 1600 }); }).then(function (c) { if (!c) return; PIC = c; PIC._id = Date.now(); c.toBlob(function (b2) { if (b2) idbSet('pic', b2); }, 'image/png'); keep(); render(); }).catch(function () {}); return; }
    if (d.act === 'evengap') { var g0 = gaps(); S.rep.tileInY = Math.max(.25, g0.h + g0.x); return changed(true); }
    if (d.act === 'toss') { S.rep.seed = Math.floor(Math.random() * 1e6); return changed(false); }
    if (d.act === 'camoseed') { S.camo.seed = Math.floor(Math.random() * 1e6); return changed(false); }
    if (d.act === 'addband') { var arr = curPart() === 'threads' ? S.plaid.sett : S.stripes.bands; arr.push([arr.length % cols.length, curPart() === 'threads' ? 4 : .25]); S.plaid.preset = curPart() === 'threads' ? 'mine' : S.plaid.preset; return changed(true); }
    if (d.del != null) { var ar2 = curPart() === 'threads' ? S.plaid.sett : S.stripes.bands; ar2.splice(+d.del, 1); return changed(true); }
    if (d.bf != null) { var bb = S.stripes.bands[+d.bf], ix = BANDF.map(function (x) { return x[0]; }).indexOf(bb[2] || 'solid'); bb[2] = BANDF[(ix + 1) % BANDF.length][0]; return changed(true); }
    if (d.bc != null) { var row = b.closest('.band'), ar3 = curPart() === 'threads' ? S.plaid.sett : S.stripes.bands; ar3[+row.dataset.i][0] = +d.bc; return changed(true); }
    if (d.d) {
      var st = b.closest('[data-st]'), bw = b.closest('[data-bw]'), dir = +d.d;
      if (st && STEPV[st.dataset.st]) { STEPV[st.dataset.st](dir); return changed(true); }
      if (bw) { var thr = curPart() === 'threads', ar4 = thr ? S.plaid.sett : S.stripes.bands, it = ar4[+bw.dataset.bw]; it[1] = thr ? clamp(it[1] + dir * (it[1] >= 8 ? 2 : 1), 1, 60) : clamp(Math.round((it[1] + dir * (it[1] >= .5 ? .1 : .02)) * 100) / 100, .02, 4); return changed(true); }
    }
    var sg = b.closest('[data-sg]');
    if (sg && d.v != null) {
      var k = sg.dataset.sg, v = d.v;
      if (k.charAt(0) === 'h' && k !== 'hx') { var hw = HW(); if (k === 'hmk') hw.mark = v; else if (k === 'hlogo') hw.logo = v; else if (k === 'hbd') hw.border = v; else if (k === 'hfix') hw.fix = v; else if (k === 'hthk') hw.thick = +v; else if (k === 'hlook') hw.look = v; else if (k === 'hst') hw.stitch = v === '1'; return changed(true); }
      if (k === 'ring') S.logo.ring = v === '1'; else if (k === 'white') S.rep.white = v === '1'; else if (k === 'tint') S.rep.tint = v === '1';
      else if (k === 'flip') S.rep.flip = v; else if (k === 'fade') S.rep.fade = +v; else if (k === 'pmirror') S.plaid.mirror = v === '1';
      else if (k === 'border') S.border = v === '1'; else if (k === 'clear') S.rep.clear = v === '1';
      else if (k === 'weave') S.plaid.weave = v; else if (k === 'sdir') S.stripes.dir = v;
      else if (k === 'ralt') { if (v === 'other' && S.kind === 'logo' && !PIC) { S.rep.alt = 'other'; keep(); $('file')._keepKind = true; $('file').click(); return; } S.rep.alt = v; }
      else if (k === 'cmix') { var nn = +v; S.checks.mix = nn > 1 ? ['dots', 'hatch', 'logo', 'solid'].slice(0, nn).map(function (x, i) { return (S.checks.mix && S.checks.mix[i]) || x; }) : null; }
      else if (k.indexOf('slot') === 0) { S.checks.mix[+k.slice(4)] = v; }
      return changed(true);
    }
    if (d.act === 'make') { makeFiles(); return; }
    if (d.f != null) { saveFile(FILES[+d.f]); }
  });
  function ensureCols(list) { var need = 0; list.forEach(function (x) { need = Math.max(need, x[0] + 1); }); var c = colors(); var pal = E.PALETTES[PALKEY[S.kind]][0][1]; while (c.length < need) c.push(pal[c.length % pal.length]); }
  $('pane').addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'ltext') { S.logo.text = t.value; keep(); draw(); clearTimeout(t._tm); t._tm = setTimeout(function () { var s = $('pane').scrollTop; $('pane').innerHTML = paneHtml(curPart()); afterPane(); $('pane').scrollTop = s; var n = $('ltext'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }, 700); return; }
    if (t.id === 'hwtext' || t.id === 'hwline2') { HW()[t.id === 'hwtext' ? 'text' : 'line2'] = t.value; keep(); draw(); return; }
    if (t.dataset.hen) { HW().enamel = t.value; keep(); draw(); return; }
    if (t.dataset.hbc) { HW().backCol = t.value; keep(); draw(); return; }
    if (t.dataset.ci != null) { colors()[+t.dataset.ci] = t.value; S.palBy[S.kind] = ''; keep(); draw(); return; }
    if (t.dataset.bd) { S.board[t.dataset.bd] = t.value; keep(); draw(); return; }
    if (t.dataset.pt != null) { S.board.pantone[toHex(colors()[+t.dataset.pt])] = t.value; keep(); draw(); }
  });
  $('pane').addEventListener('change', function (e) { if (e.target.dataset.ci != null) changed(true); });
  $('file').addEventListener('change', function () {
    var f = this.files && this.files[0]; if (!f) return; this.value = '';
    var keepKind = this._keepKind; this._keepKind = false; PICSRC = f; idbSet('picsrc', f);
    // crop first (free, as it is or square), then use the cropped picture everywhere
    var crop = window.nocivCrop ? window.nocivCrop(f, { title: 'Crop your picture', aspects: [['free', 'Free'], ['orig', 'Original'], [1, 'Square']], maxPx: 1600 }).catch(function () { return null; }) : blobToCanvas(f);
    crop.then(function (c) {
      if (!c) return; if (c.width > 1400 || c.height > 1400) { var k = 1400 / Math.max(c.width, c.height), c2 = E.cv(Math.round(c.width * k), Math.round(c.height * k)); c2.getContext('2d').drawImage(c, 0, 0, c2.width, c2.height); c = c2; }
      PIC = c; PIC._id = Date.now(); if (c.toBlob) c.toBlob(function (b) { if (b) idbSet('pic', b); }, 'image/png');
      if (!keepKind) { S.kind = 'picture'; S.step = 1; S.part['1:picture'] = 'pic'; } keep(); render();
    });
  });

  /* ---------- the mood board / tech pack ---------- */
  function boardCanvas(Wpx) {
    if (S.kind === 'hardware') return hwBoard(Wpx);
    var W = Wpx || 1275, H = Math.round(W * 11 / 8.5), u = W / 100, c = E.cv(W, H), g = c.getContext('2d'), cols = colors();
    g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, W, H);
    var name = S.board.name || repeatName(), sys = '-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif';
    g.fillStyle = '#1a1a1a'; g.font = '900 ' + 5.2 * u + 'px ' + sys; g.textBaseline = 'top'; g.fillText(name.toUpperCase().slice(0, 28), 5 * u, 5 * u);
    g.font = '600 ' + 1.9 * u + 'px ' + sys; g.fillStyle = '#5a564d';
    var d = new Date(), date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    g.fillText('Mood board and print spec' + (S.board.by ? '  |  ' + S.board.by : '') + '  |  ' + date, 5 * u, 11.4 * u);
    g.fillRect(5 * u, 14.6 * u, 90 * u, .25 * u);
    // big swatch on the fabric
    var sw = 54 * u, sx = 5 * u, sy = 17 * u, sc = E.cv(sw, sw), sg = sc.getContext('2d'); fillPattern(sg, sw, sw, sw / 10, true);
    g.drawImage(sc, sx, sy); g.strokeStyle = '#1a1a1a'; g.lineWidth = .3 * u; g.strokeRect(sx, sy, sw, sw);
    g.fillStyle = '#1a1a1a'; g.font = '800 ' + 1.6 * u + 'px ' + sys; g.fillText('10 IN SWATCH ON ' + ((presetOf(E.FABRICS, S.fabric) || [0, ''])[1]).toUpperCase(), sx, sy + sw + 1.2 * u);
    // the repeat tile with its edge
    var rx = 63 * u, ry = 17 * u, rs = 32 * u, ti = tileInches(), k = Math.min(rs / 3 / Math.max(ti[0], .1), rs / 3 / Math.max(ti[1], .1)), rc = E.cv(rs, rs), rg = rc.getContext('2d');
    fillPattern(rg, rs, rs, k, false); g.drawImage(rc, rx, ry); g.strokeRect(rx, ry, rs, rs);
    g.setLineDash([.8 * u, .6 * u]); g.strokeStyle = '#c8412f'; g.lineWidth = .35 * u; g.strokeRect(rx, ry, ti[0] * k, ti[1] * k); g.setLineDash([]);
    g.fillStyle = '#1a1a1a'; g.fillText('ONE TILE, OUTLINED IN RED', rx, ry + rs + 1.2 * u);
    // facts
    var fy = ry + rs + 5 * u; g.font = '600 ' + 1.75 * u + 'px ' + sys;
    var facts = [['Pattern', repeatName()], ['Repeat', fmtIn(ti[0]) + ' x ' + fmtIn(ti[1])], ['File', Math.round(ti[0] * 150) + ' x ' + Math.round(ti[1] * 150) + ' px at 150 DPI'], ['Upload as', 'Basic repeat, sRGB PNG'], ['Fabric', (presetOf(E.FABRICS, S.fabric) || [0, ''])[1]], ['Also good', (E.SUGGEST[PALKEY[S.kind] === 'repeat' ? 'repeat' : PALKEY[S.kind]] || []).map(function (f) { return (presetOf(E.FABRICS, f) || [0, f])[1]; }).slice(0, 2).join(', ')]];
    facts.forEach(function (f, i) { g.fillStyle = '#8d887d'; g.fillText(f[0].toUpperCase(), rx, fy + i * 3.6 * u); g.fillStyle = '#1a1a1a'; g.font = '800 ' + 1.75 * u + 'px ' + sys; g.fillText(f[1], rx + 11 * u, fy + i * 3.6 * u); g.font = '600 ' + 1.75 * u + 'px ' + sys; });
    // colorway
    var cy = 78 * u; g.fillStyle = '#1a1a1a'; g.font = '900 ' + 2.1 * u + 'px ' + sys; g.fillText('COLORWAY', 5 * u, cy);
    var n = cols.length, cw = Math.min(17 * u, (90 * u - (n - 1) * 1.6 * u) / n);
    cols.forEach(function (h, i) {
      var x = 5 * u + i * (cw + 1.6 * u), y = cy + 3.4 * u, hx = toHex(h), rgb = E.hex(hx), cm = E.cmyk(hx), pt = S.board.pantone[hx];
      g.fillStyle = hx; g.fillRect(x, y, cw, cw * .62); g.strokeStyle = '#1a1a1a'; g.lineWidth = .2 * u; g.strokeRect(x, y, cw, cw * .62);
      g.fillStyle = '#1a1a1a'; g.font = '800 ' + 1.5 * u + 'px ' + sys; g.fillText(hx.toUpperCase(), x, y + cw * .62 + .9 * u);
      g.font = '600 ' + 1.25 * u + 'px ' + sys; g.fillStyle = '#5a564d'; g.fillText('RGB ' + rgb.join(' '), x, y + cw * .62 + 3 * u); g.fillText('CMYK ' + cm.join(' '), x, y + cw * .62 + 4.8 * u);
      g.fillStyle = pt ? '#1a1a1a' : '#b0aa9c'; g.fillText(pt ? 'PANTONE ' + pt : 'Pantone: match it', x, y + cw * .62 + 6.6 * u);
    });
    // motif or logo
    var by = 101 * u; if (S.kind === 'logo' || S.kind === 'picture') { var m = motif(); if (m) { var ms = 18 * u, kk = ms / Math.max(m.width, m.height); g.fillStyle = cols[0]; g.fillRect(5 * u, by, ms, ms); g.drawImage(m, 5 * u + (ms - m.width * kk) / 2, by + (ms - m.height * kk) / 2, m.width * kk, m.height * kk); g.strokeRect(5 * u, by, ms, ms); g.fillStyle = '#1a1a1a'; g.font = '800 ' + 1.5 * u + 'px ' + sys; g.fillText('MOTIF', 5 * u, by + ms + 1 * u); } }
    var nx = (S.kind === 'logo' || S.kind === 'picture') ? 27 * u : 5 * u;
    g.fillStyle = '#1a1a1a'; g.font = '900 ' + 2.1 * u + 'px ' + sys; g.fillText('NOTES', nx, by);
    g.font = '600 ' + 1.8 * u + 'px ' + sys; wrapText(g, S.board.notes || 'Add notes on the Board tab: season, garment, trims, care.', nx, by + 3.4 * u, 95 * u - nx, 2.6 * u);
    g.fillStyle = '#8d887d'; g.font = '600 ' + 1.35 * u + 'px ' + sys; g.fillText('Screen colors are a guide. Order a printed swatch before yardage. Made with NOCIV Patterns.', 5 * u, H - 4 * u);
    return c;
  }
  function wrapText(g, t, x, y, w, lh) { var words = String(t).split(/\s+/), line = ''; words.forEach(function (wd) { var test = line ? line + ' ' + wd : wd; if (g.measureText(test).width > w && line) { g.fillText(line, x, y); y += lh; line = wd; } else line = test; }); if (line) g.fillText(line, x, y); }

  /* ---------- files ---------- */
  var FILES = [];
  function makeFiles() {
    var out = $('files'); if (!out) return; out.innerHTML = '<p class="note">Making...</p>';
    setTimeout(function () {
      var jobs = [];
      if (S.kind === 'hardware') {
        var hb = (S.board.name || (HW().text || 'plate') + '-plate').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        var rc = E.cv(1600, 1600), rpm = Math.min(1400 / (HW().w + 30), 1400 / (HW().h + 30)); drawHW(rc.getContext('2d'), 800, 800, rpm, true);
        var pc = E.cv(Math.ceil(HW().w * 20 + 80), Math.ceil(HW().h * 20 + 80)); drawHW(pc.getContext('2d'), pc.width / 2, pc.height / 2, 20, false);
        var hbd = hwBoard(1275), mk = hwMarkPng();
        jobs.push(Promise.resolve({ label: 'Cut file SVG (mm)', name: hb + '-cut.svg', blob: new Blob([hwSvg()], { type: 'image/svg+xml' }) }));
        jobs.push(E.pngWithDpi(mk, 1000).then(function (b) { return { label: 'Mark PNG (1000 DPI)', name: hb + '-mark.png', blob: b }; }));
        jobs.push(new Promise(function (r) { rc.toBlob(function (b) { r({ label: 'Render on patch', name: hb + '-render.png', blob: b }); }, 'image/png'); }));
        jobs.push(new Promise(function (r) { pc.toBlob(function (b) { r({ label: 'Plate only PNG', name: hb + '-plate.png', blob: b }); }, 'image/png'); }));
        jobs.push(new Promise(function (r) { hbd.toBlob(function (b) { r({ label: 'Spec sheet PNG', name: hb + '-spec.png', blob: b }); }, 'image/png'); }));
        jobs.push(Promise.resolve({ label: 'Spec sheet PDF', name: hb + '-spec.pdf', blob: E.pdfOf(hbd, 8.5, 11) }));
        Promise.all(jobs).then(function (fs) { FILES = fs; out.innerHTML = fs.map(function (f, i) { return '<button type="button" class="btn" data-f="' + i + '">Save ' + f.label + '</button>'; }).join(''); });
        return;
      }
      tcache = {}; var tile = tileAt(150, true); if (!tile) { out.innerHTML = '<p class="note">Add your picture first.</p>'; return; }
      var base = (S.board.name || repeatName() || 'pattern').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      jobs.push(E.pngWithDpi(tile, 150).then(function (b) { return { label: 'Tile (150 DPI)', name: base + '-tile.png', blob: b }; }));
      var yd = E.cv(42 * 30, 36 * 30); fillPattern(yd.getContext('2d'), yd.width, yd.height, 30, false);
      jobs.push(new Promise(function (r) { yd.toBlob(function (b) { r({ label: 'Yard preview', name: base + '-yard.png', blob: b }); }, 'image/png'); }));
      var bd = boardCanvas(1275);
      jobs.push(new Promise(function (r) { bd.toBlob(function (b) { r({ label: 'Mood board PNG', name: base + '-board.png', blob: b }); }, 'image/png'); }));
      jobs.push(Promise.resolve({ label: 'Mood board PDF', name: base + '-board.pdf', blob: E.pdfOf(bd, 8.5, 11) }));
      if (S.kind === 'logo') { var lg = renderLogo(S.logo, colors(), 1200); jobs.push(new Promise(function (r) { lg.toBlob(function (b) { r({ label: 'Logo PNG', name: base + '-logo.png', blob: b }); }, 'image/png'); })); }
      Promise.all(jobs).then(function (fs) { FILES = fs; out.innerHTML = fs.map(function (f, i) { return '<button type="button" class="btn" data-f="' + i + '">Save ' + f.label + '</button>'; }).join(''); tcache = {}; });
    }, 30);
  }
  function saveFile(f) {
    if (!f) return; var file = new File([f.blob], f.name, { type: f.blob.type });
    if (matchMedia('(pointer:coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(function () {}); return; }
    var u = URL.createObjectURL(f.blob), a = document.createElement('a'); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }

  /* ---------- help and learn ---------- */
  var LEARN = [
    ['How to use it', '<ul><li><b>Start</b>: pick what you are making. Logo makes a simple logo first. My picture takes any PNG or your halftone.</li><li><b>Make</b>: the tabs above the step bar change with what you picked. Tap the picture view buttons (Close, Swatch, Yard) to see it at real scale.</li><li><b>Color</b>: ready-made palettes or your own.</li><li><b>Fabric</b>: lays a cloth texture over it so you see twill, canvas, flannel and more.</li><li><b>Board</b>: your mood board and print spec, plus the files.</li><li>The round arrow hides the controls for a big look. Everything saves on this phone.</li></ul>'],
    ['Repeats, explained', '<ul><li><b>Grid</b> (block): straight rows and columns. Easy, can look stiff.</li><li><b>Half-drop</b>: every other column drops half a step. The most common repeat in fabric because it hides the grid.</li><li><b>Half-brick</b>: every other row slides half a step, like bricks.</li><li><b>Mirror</b>: four copies facing each other. Great for monograms.</li><li><b>Spin</b>: a quarter turn each time, a pinwheel.</li><li><b>Diamond</b>: the grid on a 45 degree angle, like a monogram canvas.</li><li><b>Toss</b>: random angles and spots, still seamless.</li><li><b>Mirror inside a shape</b>: square (8 slices, quilt block), hexagon (12 slices, snowflake), triangle (every edge reflects). Turn the motif to get totally different results.</li></ul>'],
    ['Sizing for fabric', '<ul><li>Fabric printers print at <b>150 DPI</b>. Your tile is saved at 150 DPI so the inches come out right.</li><li>A yard is 36 in long. Widths run 42 to 58 in.</li><li>Small repeats (1 to 3 in) for tees, shirts and kids. Medium (4 to 8 in) for hoodies and dresses. Big (10 in and up) for jackets, bags and blankets.</li><li>When you upload, pick <b>Basic repeat</b>. The half-drop or mirror is already built into our tile.</li><li>Order a swatch or fat quarter first. Screens lie about color.</li></ul>'],
    ['Where to print, cheaper', '<ul><li>Spoonflower runs about $20 a yard for basic cotton, with sale days near $15. No minimum.</li><li>Fabric On Demand, Little Cocalico and Contrado print from one yard. Compare the same fabric weight, not just price.</li><li>Polyester sublimation is usually the cheapest per yard, and many local print shops do it.</li><li>The more yards you print at once, the lower the price. Some printers have wholesale programs once you sell.</li><li>Big runs (100 m and up) go to converters and mills. Ask for a strike-off (a test print) before the run.</li></ul>'],
    ['Sourcing materials cheaply', '<ul><li><b>Swatch first, always.</b> Mood Fabrics swatches are about $1 each. It saves you from a $60 mistake.</li><li><b>Jobbers</b> buy leftover mill fabric and sell it with very low minimums, often one yard. Cheap, but you usually cannot reorder, so buy everything you need at once.</li><li><b>Deadstock</b> is unused fabric from big brands. FabScrap (NYC) and fabric districts like LA sell it for less. Great for drops and samples.</li><li><b>Mill stock programs</b> (ready-made colors) have lower minimums than custom fabric.</li><li>Wider fabric (58 to 60 in) can save yardage. Count yards per piece: a tee is about 1 to 1.5 yd, a hoodie about 2 yd, a tote under 1 yd.</li><li>Buy the whole order in one dye lot, and prewash a sample to check shrinkage.</li></ul>'],
    ['Fabric guide', '<ul>' + E.FABRICS.map(function (f) { return '<li><b>' + f[1] + '</b>: ' + f[2] + '</li>'; }).join('') + '</ul>'],
    ['Color and Pantone', '<ul><li>Fabric printers print what your file says in sRGB. The hex code is the real color of your file.</li><li>Pantone codes (like 19-4052 TCX for fabric) are a shared language with factories. Find the closest match with the Pantone app or a printed Pantone guide, then type it on the Board. We do not ship Pantone\'s library, it is theirs.</li><li>The CMYK numbers on the board are a starting point for paper printing, not fabric.</li></ul>'],
    ['Hardware, explained', '<ul><li><b>Plates and emblems</b> are cut from sheet metal, usually brass 1 to 2 mm thick. The cut file is the outline in millimeters.</li><li><b>Gold color</b>: raw brass is already gold toned. Real gold is plating over brass, done by a plater after cutting. PVD is a tougher color coat.</li><li><b>Engraved</b> marks are lasered or etched into the face. <b>Raised</b> marks need stamping or casting, which means a mold and higher minimums. <b>Cut through</b> letters show the leather behind, keep the middles of O and A with bridges. <b>Enamel</b> fills a recessed area with color.</li><li><b>Attaching</b>: rivets through plate and leather (strongest), Chicago screws (removable), prongs that fold behind (clean front), or sew holes.</li><li><b>Small runs</b>: laser cut services do one piece. Stamped or cast hardware from factories usually starts around a few hundred pieces, ask for a sample first.</li><li>Keep your design your own. Do not copy a luxury house plate or logo.</li></ul>'],
    ['Make it yours', '<ul><li>Famous checks, monograms and camos belong to the brands that made them. Copying them can get your work taken down.</li><li>Use the structure (a camel check, a two-tone checker, a club stripe), then change the colors, the proportions and put your own logo at the corners. That is how it becomes yours.</li></ul>']
  ];
  function openHelp() {
    $('sheetIn').innerHTML = '<button class="x" id="sheetX" aria-label="Close">&times;</button><h2>Help and Learn</h2>' + LEARN.map(function (l, i) { return '<details' + (i === 0 ? ' open' : '') + '><summary>' + l[0] + '</summary>' + l[1] + '</details>'; }).join('');
    $('sheet').hidden = false; $('sheetX').onclick = function () { $('sheet').hidden = true; };
  }
  $('help').onclick = openHelp; $('helpTop').onclick = openHelp;
  $('sheet').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });

  /* ---------- start ---------- */
  window.addEventListener('resize', draw);
  var from = (location.search.match(/from=(\w+)/) || [])[1];
  (from ? idbGet('incoming') : idbGet('pic')).then(function (b) {
    var p = b ? blobToCanvas(b) : Promise.resolve(null);
    return p.then(function (c) {
      if (c) { PIC = c; PIC._id = Date.now(); if (!from) idbGet('picsrc').then(function (s0) { if (s0) PICSRC = s0; }); }
      if (from && c) { idbSet('pic', b); S.kind = 'picture'; S.step = 1; S.part['1:picture'] = 'repeat'; S.rep.white = true; history.replaceState(null, '', location.pathname); keep(); }
      if (S.kind === 'picture' && !PIC) { S.step = 0; }
    });
  }).then(function () {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { tcache = {}; draw(); afterPane(); });
    render();
  });
  window.__pattern = { S: S, tileAt: tileAt, boardCanvas: boardCanvas, render: render, hwSvg: hwSvg, go: go };
})();
