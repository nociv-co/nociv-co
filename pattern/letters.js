/* NOCIV Patterns: Match my lettering.
   You upload the words you made (PNG). We measure what makes the letters look the way they do
   (height, weight, thick and thin, width, round or square corners, ends, serifs, slant, spacing)
   and redraw a whole alphabet with our own letter skeletons dressed in those measurements.
   It looks like it comes from the same place. It is not the font, and no font file is made.
   Capitals only if your picture is capitals, lowercase only if it is lowercase. */
(function () {
  'use strict';

  /* ---------- letter skeletons (our own drawing, units: cap height = 1, baseline = 0, y up) ----------
     l = line, p = polyline, e = superellipse arc [cx, cy, rx, ry, from deg, to deg], d = dot */
  var A = 1.02, D = -.24;
  function up() {
    return {
      A: [.72, [[['p', [[0, 0], [.36, 1], [.72, 0]]]], [['l', .14, .3, .58, .3]]]],
      B: [.6, [[['l', 0, 0, 0, 1]], [['p', [[0, 1], [.34, 1]]], ['e', .34, .75, .22, .25, 90, -90], ['p', [[.34, .5], [0, .5]]]], [['p', [[0, .5], [.38, .5]]], ['e', .38, .25, .24, .25, 90, -90], ['p', [[.38, 0], [0, 0]]]]]],
      C: [.7, [[['e', .38, .5, .38, .5, 42, 318]]]],
      D: [.68, [[['l', 0, 0, 0, 1]], [['p', [[0, 1], [.24, 1]]], ['e', .24, .5, .44, .5, 90, -90], ['p', [[.24, 0], [0, 0]]]]]],
      E: [.54, [[['p', [[.54, 1], [0, 1], [0, 0], [.54, 0]]]], [['l', 0, .5, .48, .5]]]],
      F: [.52, [[['p', [[.52, 1], [0, 1], [0, 0]]]], [['l', 0, .5, .46, .5]]]],
      G: [.74, [[['e', .38, .5, .38, .5, 42, 360], ['p', [[.76, .5], [.76, .08]]]], [['l', .44, .48, .76, .48]]]],
      H: [.64, [[['l', 0, 0, 0, 1]], [['l', .64, 0, .64, 1]], [['l', 0, .5, .64, .5]]]],
      I: [0, [[['l', 0, 0, 0, 1]]]],
      J: [.46, [[['p', [[.46, 1], [.46, .27]]], ['e', .23, .27, .23, .27, 0, -180]]]],
      K: [.6, [[['l', 0, 0, 0, 1]], [['p', [[.6, 1], [0, .38]]]], [['l', .2, .58, .62, 0]]]],
      L: [.5, [[['p', [[0, 1], [0, 0], [.5, 0]]]]]],
      M: [.8, [[['p', [[0, 0], [0, 1], [.4, .18], [.8, 1], [.8, 0]]]]]],
      N: [.66, [[['p', [[0, 0], [0, 1], [.66, 0], [.66, 1]]]]]],
      O: [.78, [[['e', .39, .5, .39, .5, 90, 450]]]],
      P: [.56, [[['l', 0, 0, 0, 1]], [['p', [[0, 1], [.3, 1]]], ['e', .3, .73, .26, .27, 90, -90], ['p', [[.3, .46], [0, .46]]]]]],
      Q: [.78, [[['e', .39, .5, .39, .5, 90, 450]], [['l', .5, .24, .82, -.06]]]],
      R: [.6, [[['l', 0, 0, 0, 1]], [['p', [[0, 1], [.32, 1]]], ['e', .32, .73, .26, .27, 90, -90], ['p', [[.32, .46], [0, .46]]]], [['l', .3, .46, .62, 0]]]],
      S: [.58, [[['e', .29, .75, .28, .25, 25, 270], ['e', .29, .25, .29, .25, 90, -155]]]],
      T: [.62, [[['l', 0, 1, .62, 1]], [['l', .31, 1, .31, 0]]]],
      U: [.64, [[['p', [[0, 1], [0, .32]]], ['e', .32, .32, .32, .32, 180, 360], ['p', [[.64, .32], [.64, 1]]]]]],
      V: [.7, [[['p', [[0, 1], [.35, 0], [.7, 1]]]]]],
      W: [1, [[['p', [[0, 1], [.22, 0], [.5, .82], [.78, 0], [1, 1]]]]]],
      X: [.66, [[['l', 0, 1, .66, 0]], [['l', 0, 0, .66, 1]]]],
      Y: [.66, [[['p', [[0, 1], [.33, .48], [.66, 1]]]], [['l', .33, .48, .33, 0]]]],
      Z: [.6, [[['p', [[0, 1], [.6, 1], [0, 0], [.6, 0]]]]]]
    };
  }
  function low(X, a1, g1) {
    var bowl = function (cx) { return [['e', cx, X / 2, .26, X / 2, 90, 450]]; };
    var arch = function (x0) { return [['e', x0 + .25, X * .58, .25, X * .42, 180, 0], ['p', [[x0 + .5, X * .58], [x0 + .5, 0]]]]; };
    return {
      a: a1 ? [.52, [bowl(.26), [['l', .52, 0, .52, X]]]] : [.48, [[['e', .23, X * .64, .23, X * .36, 160, 0], ['p', [[.46, X * .64], [.46, 0]]]], [['p', [[.46, X * .52], [.22, X * .52]]], ['e', .22, X * .26, .22, X * .26, 90, 270], ['p', [[.22, 0], [.46, X * .16]]]]]],
      b: [.52, [[['l', 0, 0, 0, A]], bowl(.26)]],
      c: [.48, [[['e', .26, X / 2, .26, X / 2, 45, 315]]]],
      d: [.52, [[['l', .52, 0, .52, A]], bowl(.26)]],
      e: [.52, [[['p', [[0, X / 2], [.52, X / 2]]], ['e', .26, X / 2, .26, X / 2, 0, 315]]]],
      f: [.32, [[['p', [[.1, 0], [.1, A - .2]]], ['e', .28, A - .2, .18, .2, 180, 40]], [['l', 0, X, .3, X]]]],
      g: [.52, [bowl(.26), [['p', [[.52, X], [.52, -.06]]], ['e', .26, -.06, .26, .18, 0, -165]]]],
      h: [.5, [[['l', 0, 0, 0, A]], arch(0)]],
      i: [0, [[['l', 0, 0, 0, X]]], [[0, X + .16]]],
      j: [.14, [[['p', [[.14, X], [.14, -.08]]], ['e', 0, -.08, .14, .16, 0, -150]]], [[.14, X + .16]]],
      k: [.48, [[['l', 0, 0, 0, A]], [['p', [[.46, X], [0, X * .32]]]], [['l', .14, X * .48, .48, 0]]]],
      l: [0, [[['l', 0, 0, 0, A]]]],
      m: [.8, [[['l', 0, 0, 0, X]], [['e', .2, X * .58, .2, X * .42, 180, 0], ['p', [[.4, X * .58], [.4, 0]]]], [['e', .6, X * .58, .2, X * .42, 180, 0], ['p', [[.8, X * .58], [.8, 0]]]]]],
      n: [.5, [[['l', 0, 0, 0, X]], arch(0)]],
      o: [.54, [[['e', .27, X / 2, .27, X / 2, 90, 450]]]],
      p: [.52, [[['l', 0, X, 0, D]], bowl(.26)]],
      q: [.52, [[['l', .52, X, .52, D]], bowl(.26)]],
      r: [.32, [[['l', 0, 0, 0, X]], [['e', .3, X * .55, .3, X * .45, 180, 75]]]],
      s: [.44, [[['e', .22, X * .75, .21, X * .25, 25, 270], ['e', .22, X * .25, .22, X * .25, 90, -155]]]],
      t: [.32, [[['p', [[.1, A - .16], [.1, X * .22]]], ['e', .3, X * .22, .2, X * .22, 180, 290]], [['l', 0, X, .3, X]]]],
      u: [.5, [[['p', [[0, X], [0, X * .42]]], ['e', .25, X * .42, .25, X * .42, 180, 360]], [['l', .5, X, .5, 0]]]],
      v: [.5, [[['p', [[0, X], [.25, 0], [.5, X]]]]]],
      w: [.76, [[['p', [[0, X], [.17, 0], [.38, X * .82], [.59, 0], [.76, X]]]]]],
      x: [.48, [[['l', 0, X, .48, 0]], [['l', 0, 0, .48, X]]]],
      y: [.5, [[['l', 0, X, .25, 0]], [['l', .5, X, .14, D]]]],
      z: [.46, [[['p', [[0, X], [.46, X], [0, 0], [.46, 0]]]]]]
    };
  }

  var DEF = { kase: 'upper', weight: .14, contrast: 0, stress: 0, width: 1, square: 2.2, ends: 'flat', serif: 'none', slant: 0, track: .12, xh: .53, a1: false };

  /* ---------- sample a stroke into points ---------- */
  function sampleStroke(st, n) {
    var pts = [];
    st.forEach(function (pr) {
      var seg = [];
      if (pr[0] === 'l') seg = [[pr[1], pr[2]], [pr[3], pr[4]]];
      else if (pr[0] === 'p') seg = pr[1].slice();
      else if (pr[0] === 'e') {
        var steps = Math.max(8, Math.round(Math.abs(pr[6] - pr[5]) / 5));
        for (var i = 0; i <= steps; i++) {
          var t = (pr[5] + (pr[6] - pr[5]) * i / steps) * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), k = 2 / n;
          seg.push([pr[1] + pr[3] * Math.sign(c) * Math.pow(Math.abs(c), k), pr[2] + pr[4] * Math.sign(s) * Math.pow(Math.abs(s), k)]);
        }
      }
      seg.forEach(function (q, i) { var last = pts[pts.length - 1]; if (i === 0 && last && Math.hypot(last[0] - q[0], last[1] - q[1]) < 1e-6) return; pts.push(q); });
    });
    return pts;
  }

  /* ---------- draw a word ---------- */
  function caseOf(t, dna) { return dna.kase === 'upper' ? t.toUpperCase() : dna.kase === 'lower' ? t.toLowerCase() : t; }
  // U = how tall a capital looks in px (outside edge to outside edge). The skeleton sits inside it.
  function word(text, dna, U, color) {
    dna = Object.assign({}, DEF, dna || {}); U = U || 200; color = color || '#1a1a1a';
    text = caseOf(text || '', dna).replace(/[^A-Za-z ]/g, '');
    var G = Object.assign(up(), low(dna.xh, dna.a1, true)), w = dna.weight, lw = w * U, h = lw / 2, sl = Math.tan(dna.slant * Math.PI / 180);
    // with thick and thin, the ends of up-and-down strokes stick out only as far as the thin side of the nib
    var nib = dna.contrast > .1, ext = nib ? Math.max(.6, h * (1 - dna.contrast)) : h, Us = U - 2 * ext;
    var hasLow = /[a-z]/.test(text), top = hasLow ? A : 1, bot = /[gjpqy]/.test(text) ? D : 0, pad = U * .06;
    var H = (top - bot) * Us + 2 * ext + pad * 2, base = pad + ext + top * Us;
    var sx = dna.serif === 'none' ? 0 : lw * (dna.serif === 'slab' ? .75 : .9) * .85, x = pad + h + Math.max(0, -bot * sl * Us), items = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ' ') { x += (.32 + dna.track) * U; continue; }
      var gl = G[ch]; if (!gl) continue;
      items.push({ g: gl, x: x + sx }); x += gl[0] * dna.width * Us + lw + dna.track * U + 2 * sx;
    }
    var W = x - dna.track * U + h + pad + Math.max(0, top * sl * Us);
    var c = document.createElement('canvas'); c.width = Math.max(2, Math.ceil(W)); c.height = Math.max(2, Math.ceil(H));
    var g = c.getContext('2d'); g.fillStyle = color; g.strokeStyle = color;
    function P(px, py, ox) { return [ox + (px * dna.width + py * sl) * Us, base - py * Us]; }
    // square ends poke out at an angle on A, V, W: cut everything level with the top and bottom lines
    g.save(); g.beginPath(); g.rect(0, base - top * Us - ext - .5, c.width, (top - bot) * Us + 2 * ext + 1); g.clip();
    items.forEach(function (it) {
      var strokes = it.g[1], dots = it.g[2] || [];
      strokes.forEach(function (st) {
        var pts = sampleStroke(st, dna.square).map(function (q) { return P(q[0], q[1], it.x); });
        if (!nib) {
          // square ends reach the same lines as the bars (one path, so no hairline seams)
          g.lineWidth = lw; g.lineCap = dna.ends === 'round' ? 'round' : 'square'; g.lineJoin = dna.ends === 'round' ? 'round' : 'miter'; g.miterLimit = 3;
          g.beginPath(); pts.forEach(function (q, k) { if (k) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.stroke();
        } else stampNib(g, pts, dna, lw);
        serifs(g, st, dna, lw, ext, it.x, P);
      });
      dots.forEach(function (d) { var q = P(d[0], d[1], it.x), r = lw * .62; g.beginPath(); if (dna.ends === 'round') g.arc(q[0], q[1], r, 0, 7); else g.rect(q[0] - r, q[1] - r, 2 * r, 2 * r); g.fill(); });
    });
    g.restore();
    return c;
  }
  // thick and thin: a calligraphy nib dragged along the path (wide nib = thick downstrokes, thin crossbars)
  function stampNib(g, pts, dna, lw) {
    var rx = lw / 2, ry = Math.max(.6, rx * (1 - dna.contrast)), ang = dna.stress * Math.PI / 180, step = Math.max(.6, ry * .35);
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[i + 1] || a, L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(L / step));
      for (var k = 0; k < n; k++) {
        var x = a[0] + (b[0] - a[0]) * k / n, y = a[1] + (b[1] - a[1]) * k / n;
        g.save(); g.translate(x, y); g.rotate(ang); g.beginPath();
        if (dna.ends === 'round') g.ellipse(0, 0, rx, ry, 0, 0, 7); else g.rect(-rx, -ry, 2 * rx, 2 * ry);
        g.fill(); g.restore();
        if (!pts[i + 1]) break;
      }
    }
  }
  // serifs on the ends of straight up-and-down strokes that sit on a guide line
  function serifs(g, st, dna, lw, ext, ox, P) {
    if (dna.serif === 'none') return;
    var raw = sampleStroke(st, 2), lines = [0, 1, A, dna.xh, D], half = .13 * (dna.serif === 'slab' ? 1.05 : 1), th = lw * (dna.serif === 'slab' ? .8 : Math.max(.22, .45 * (1 - dna.contrast)));
    [[raw[0], raw[1]], [raw[raw.length - 1], raw[raw.length - 2]]].forEach(function (e) {
      var a = e[0], b = e[1]; if (!b) return;
      if (Math.abs(a[0] - b[0]) > .08 * Math.abs(a[1] - b[1])) return;
      if (!lines.some(function (y) { return Math.abs(a[1] - y) < .02; })) return;
      var dir = a[1] > b[1] ? 1 : -1, m = P(a[0], a[1], ox), hp = lw / 2 + lw * (dna.serif === 'slab' ? .75 : .9) + 1, l = [m[0] - hp, m[1]], r = [m[0] + hp, m[1]], hh = ext;
      var y0 = l[1] - dir * hh; th += 1;
      g.beginPath(); g.moveTo(l[0], y0); g.lineTo(r[0], r[1] - dir * hh); g.lineTo(r[0], r[1] - dir * hh + dir * th); g.lineTo(l[0], y0 + dir * th); g.closePath(); g.fill();
    });
  }

  /* ---------- measure the picture ---------- */
  function inkMask(img) {
    var k = Math.min(1, 1400 / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
    var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
    var d = g.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h);
    var corners = [0, w - 1, (h - 1) * w, h * w - 1], clear = corners.every(function (i) { return d[i * 4 + 3] < 40; });
    var bgL = 0; corners.forEach(function (i) { bgL += (d[i * 4] * .2126 + d[i * 4 + 1] * .7152 + d[i * 4 + 2] * .0722) / 255 / 4; });
    for (var i = 0; i < w * h; i++) {
      var a = d[i * 4 + 3]; if (a < 110) continue;
      if (clear) { m[i] = 1; continue; }
      var L = (d[i * 4] * .2126 + d[i * 4 + 1] * .7152 + d[i * 4 + 2] * .0722) / 255; if (Math.abs(L - bgL) > .3) m[i] = 1;
    }
    return { m: m, w: w, h: h };
  }
  function components(M) {
    var w = M.w, h = M.h, lab = new Int32Array(w * h), out = [], st = [];
    for (var i = 0; i < w * h; i++) {
      if (!M.m[i] || lab[i]) continue;
      var id = out.length + 1, b = { x0: w, y0: h, x1: 0, y1: 0, n: 0, id: id }; st.push(i); lab[i] = id;
      while (st.length) {
        var p = st.pop(), x = p % w, y = (p - x) / w; b.n++; if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
        if (x > 0 && M.m[p - 1] && !lab[p - 1]) { lab[p - 1] = id; st.push(p - 1); }
        if (x < w - 1 && M.m[p + 1] && !lab[p + 1]) { lab[p + 1] = id; st.push(p + 1); }
        if (y > 0 && M.m[p - w] && !lab[p - w]) { lab[p - w] = id; st.push(p - w); }
        if (y < h - 1 && M.m[p + w] && !lab[p + w]) { lab[p + w] = id; st.push(p + w); }
      }
      out.push(b);
    }
    var big = out.reduce(function (a, b) { return Math.max(a, b.n); }, 0);
    out = out.filter(function (b) { return b.n > big * .01; });
    // pieces that sit over each other (the dot of an i, a broken letter) become one letter
    out.sort(function (a, b) { return a.x0 - b.x0; });
    var groups = [];
    out.forEach(function (b) {
      var g = groups[groups.length - 1];
      if (g) { var ov = Math.min(g.x1, b.x1) - Math.max(g.x0, b.x0), mn = Math.min(g.x1 - g.x0, b.x1 - b.x0) + 1; if (ov > mn * .5) { g.x0 = Math.min(g.x0, b.x0); g.x1 = Math.max(g.x1, b.x1); g.y0 = Math.min(g.y0, b.y0); g.y1 = Math.max(g.y1, b.y1); g.ids.push(b.id); return; } }
      groups.push({ x0: b.x0, x1: b.x1, y0: b.y0, y1: b.y1, ids: [b.id] });
    });
    return { groups: groups, lab: lab };
  }
  function med(a) { if (!a.length) return null; a = a.slice().sort(function (x, y) { return x - y; }); return a[Math.floor(a.length / 2)]; }
  function runsRow(M, y, x0, x1) { var r = [], n = 0; for (var x = x0; x <= x1 + 1; x++) { var on = x <= x1 && M.m[y * M.w + x]; if (on) n++; else if (n) { r.push(n); n = 0; } } return r; }
  function runsCol(M, x, y0, y1) { var r = [], n = 0; for (var y = y0; y <= y1 + 1; y++) { var on = y <= y1 && M.m[y * M.w + x]; if (on) n++; else if (n) { r.push(n); n = 0; } } return r; }

  // returns { dna, found, typed, letters:[{ch, box}] }
  function measure(img, typed) {
    var M = inkMask(img), C = components(M), chars = (typed || '').replace(/[^A-Za-z]/g, '').split('');
    var gs = C.groups;
    // letters that touch come out as one piece: split the widest piece at its thinnest column until the count matches
    var guard = 0;
    while (gs.length && gs.length < chars.length && guard++ < 20) {
      var wi = 0; gs.forEach(function (g, i) { if ((g.x1 - g.x0) / (g.y1 - g.y0 + 1) > (gs[wi].x1 - gs[wi].x0) / (gs[wi].y1 - gs[wi].y0 + 1)) wi = i; });
      var G0 = gs[wi], best = -1, bv = 1e9;
      for (var x = Math.round(G0.x0 + (G0.x1 - G0.x0) * .25); x <= G0.x0 + (G0.x1 - G0.x0) * .75; x++) { var v = 0; for (var y = G0.y0; y <= G0.y1; y++) v += M.m[y * M.w + x]; if (v < bv) { bv = v; best = x; } }
      if (best < 0) break;
      gs.splice(wi, 1, { x0: G0.x0, x1: best, y0: G0.y0, y1: G0.y1, ids: G0.ids }, { x0: best + 1, x1: G0.x1, y0: G0.y0, y1: G0.y1, ids: G0.ids });
    }
    var n = Math.min(gs.length, chars.length), L = [];
    for (var i = 0; i < n; i++) L.push({ ch: chars[i], b: gs[i] });
    var dna = Object.assign({}, DEF);
    var hasUp = chars.some(function (c) { return /[A-Z]/.test(c); }), hasLow = chars.some(function (c) { return /[a-z]/.test(c); });
    dna.kase = hasUp && hasLow ? 'mixed' : hasLow ? 'lower' : 'upper';
    if (!L.length) return { dna: dna, found: gs.length, typed: chars.length, letters: L };
    var hgt = function (l) { return l.b.y1 - l.b.y0 + 1; };
    // the unit: cap height, or for lowercase the tall letters
    var caps = L.filter(function (l) { return /[A-PR-Z]/.test(l.ch); }), asc = L.filter(function (l) { return /[bdfhklt]/.test(l.ch); }), xl = L.filter(function (l) { return /[acemnorsuvwxz]/.test(l.ch); });
    var U = caps.length ? med(caps.map(hgt)) : asc.length ? med(asc.map(hgt)) / A : med(xl.map(hgt)) / DEF.xh;
    if (xl.length && (caps.length || asc.length)) dna.xh = Math.max(.38, Math.min(.75, med(xl.map(hgt)) / U));
    // stem weight: short runs across the middle of letters with up-and-down stems
    var stemL = L.filter(function (l) { return /[BDEFHIKLMNPRTUbdhiklmnpqru]/.test(l.ch); }); if (!stemL.length) stemL = L;
    var runs = [];
    stemL.forEach(function (l) { for (var y = Math.round(l.b.y0 + hgt(l) * .35); y <= l.b.y0 + hgt(l) * .65; y++) runsRow(M, y, l.b.x0, l.b.x1).forEach(function (r) { if (r < hgt(l) * .45) runs.push(r); }); });
    var stem = med(runs) || U * .14; dna.weight = Math.max(.03, Math.min(.42, stem / U));
    // thin strokes: up-and-down runs through crossbars and the tops of round letters
    var thin = [];
    L.forEach(function (l) { if (!/[AEFHTZGOQCDBPRSaeostzcbdpq]/.test(l.ch)) return; for (var x = Math.round(l.b.x0 + (l.b.x1 - l.b.x0) * .3); x <= l.b.x0 + (l.b.x1 - l.b.x0) * .7; x++) runsCol(M, x, l.b.y0, l.b.y1).forEach(function (r) { if (r < stem * 1.6) thin.push(r); }); });
    var th = med(thin); if (th) { var ct = 1 - th / stem; dna.contrast = ct < .15 ? 0 : Math.min(.85, ct); }
    // width: how wide each letter is next to our skeleton
    var G = Object.assign(up(), low(dna.xh, false, true)), wr = [];
    var Us = U - (dna.contrast > .1 ? Math.max(.6, stem / 2 * (1 - dna.contrast)) : stem / 2) * 2;
    L.forEach(function (l) { var gl = G[l.ch]; if (!gl || gl[0] < .3) return; wr.push(((l.b.x1 - l.b.x0 + 1) - stem) / (gl[0] * Us)); });
    if (wr.length) dna.width = Math.max(.6, Math.min(1.7, med(wr)));
    // corners: how full the left half of a round letter is (round .78, square near 1)
    var fills = [];
    L.forEach(function (l) {
      if (!/[OCGQoce]/.test(l.ch)) return; var cx = (l.b.x0 + l.b.x1) / 2, hw = cx - l.b.x0, s = 0, rows = 0;
      for (var y = l.b.y0; y <= l.b.y1; y++) { var x = l.b.x0; while (x < cx && !M.m[y * M.w + x]) x++; s += Math.max(0, cx - x); rows++; }
      if (hw > 0) fills.push(s / (hw * rows));
    });
    var f = med(fills);
    if (f) { var T = [[2, .785], [2.5, .84], [3, .875], [4, .92], [6, .955], [10, .98]]; dna.square = 2; T.forEach(function (t) { if (f >= t[1] - .01) dna.square = t[0]; }); }
    // ends and serifs: the bottom rows of letters that stand on stems only
    var feet = L.filter(function (l) { return /[HIKMNhiklmnr]/.test(l.ch); }), bot = [], slabRows = [];
    feet.forEach(function (l) {
      var y = l.b.y1, r = runsRow(M, y, l.b.x0, l.b.x1), r2 = runsRow(M, y - Math.max(1, Math.round(stem * .15)), l.b.x0, l.b.x1);
      bot.push((Math.max.apply(null, r.length ? r : [0]) + Math.max.apply(null, r2.length ? r2 : [0])) / 2 / stem);
      var k = 0; while (k < stem * 2 && Math.max.apply(null, runsRow(M, y - k, l.b.x0, l.b.x1).concat([0])) > stem * 1.3) k++; slabRows.push(k / stem);
    });
    var bf = med(bot);
    if (bf != null) { if (bf > 1.5) { dna.serif = med(slabRows) >= .5 ? 'slab' : 'thin'; dna.ends = 'flat'; } else dna.ends = bf < .72 ? 'round' : 'flat'; }
    // slant: how far the top of each letter sits right of its bottom
    var sl = [];
    L.forEach(function (l) {
      var hh = hgt(l), q = Math.max(1, Math.round(hh * .2)), cx = function (y0, y1) { var s = 0, n2 = 0; for (var y = y0; y < y1; y++) for (var x = l.b.x0; x <= l.b.x1; x++) if (M.m[y * M.w + x]) { s += x; n2++; } return n2 ? s / n2 : null; };
      var t = cx(l.b.y0, l.b.y0 + q), b = cx(l.b.y1 - q, l.b.y1 + 1); if (t != null && b != null && /[HIMNTUVYZEFLhilmnu]/.test(l.ch)) sl.push(Math.atan2(t - b, hh * .8) * 180 / Math.PI);
    });
    var sa = med(sl); dna.slant = sa && Math.abs(sa) > 6 ? Math.round(Math.max(-20, Math.min(20, sa))) : 0;
    // spacing: the gaps between letters
    var gaps = []; for (var j = 1; j < L.length; j++) gaps.push((L[j].b.x0 - L[j - 1].b.x1) / U);
    var gp = med(gaps); if (gp != null) dna.track = Math.max(-.05, Math.min(.8, gp));
    dna.weight = Math.round(dna.weight * 1000) / 1000; dna.contrast = Math.round(dna.contrast * 100) / 100; dna.width = Math.round(dna.width * 100) / 100; dna.track = Math.round(dna.track * 100) / 100; dna.xh = Math.round(dna.xh * 100) / 100;
    return { dna: dna, found: gs.length, typed: chars.length, letters: L, U: U, mask: M };
  }

  window.NocivLetters = { word: word, measure: measure, DEF: DEF, caseOf: caseOf };
})();
