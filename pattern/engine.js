/* NOCIV Patterns: the engine.
   Every maker here returns ONE seamless tile (a canvas). Tile it in any direction and the edges meet.
   Sizes are in inches; ppi is pixels per inch (150 is what fabric printers print at).
   Clean room: repeat ideas are the common textile terms (block, half-drop, half-brick, mirror, wallpaper symmetry),
   weaves are drawn from how threads cross (warp and weft), camo from layered noise. No one's files or patterns. */
(function () {
  'use strict';
  var E = {};

  /* ---------- helpers ---------- */
  function cv(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  function rng(seed) { var a = (seed >>> 0) || 1; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hex(h) { h = (h || '#000000').replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { var A = hex(a), B = hex(b); return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')'; }
  E.hex = hex; E.mix = mix; E.rng = rng; E.cv = cv;
  // draw something centered at (x, y) and again across every edge it touches, so the tile stays seamless
  function wrapDraw(g, W, H, x, y, r, fn) {
    for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) {
      var px = x + dx * W, py = y + dy * H;
      if (px + r < 0 || px - r > W || py + r < 0 || py - r > H) continue;
      g.save(); g.translate(px, py); fn(g); g.restore();
    }
  }
  E.wrapDraw = wrapDraw;

  /* ---------- 1. repeats of a motif (your logo, your picture, your halftone) ---------- */
  // o: {motif canvas, type, tileIn, ppi, scale 0.2..1, angle deg, flip 'none'|'alt', bg color, seed, density}
  E.REPEATS = [
    ['grid', 'Grid', 'Straight rows and columns. The block repeat.'],
    ['halfdrop', 'Half-drop', 'Every other column drops half a step. Hides the grid.'],
    ['halfbrick', 'Half-brick', 'Every other row slides half a step, like bricks.'],
    ['mirror', 'Mirror', 'Flips left-right and up-down, four facing copies.'],
    ['spin', 'Spin', 'Turns a quarter each time, a pinwheel of four.'],
    ['diamond', 'Diamond', 'The grid turned 45 degrees.'],
    ['toss', 'Toss', 'Scattered at random angles, like confetti. Still seamless.'],
    ['kaleSquare', 'Mirror: square', 'Reflected inside a square, 8 slices, like a quilt block.'],
    ['kaleHex', 'Mirror: hexagon', 'Reflected inside a hexagon, 12 slices, like a snowflake.'],
    ['kaleTri', 'Mirror: triangle', 'Reflected inside triangles, every edge is a mirror.']
  ];
  function placeMotif(g, m, size, angle, flipX, flipY) {
    var k = size / Math.max(m.width, m.height), w = m.width * k, h = m.height * k;
    g.rotate(angle * Math.PI / 180); g.scale(flipX ? -1 : 1, flipY ? -1 : 1); g.drawImage(m, -w / 2, -h / 2, w, h);
  }
  // undo the flip that placeMotif applied, then draw the words the right way round
  function placeMotifUp(g, t, size, fx, fy) {
    g.scale(fx ? -1 : 1, fy ? -1 : 1);
    var k = size / Math.max(t.width, t.height), w = t.width * k, h = t.height * k; g.drawImage(t, -w / 2, -h / 2, w, h);
  }
  // one kaleidoscope slice: the motif seen through a wedge of angle `a`, then mirrored around the center
  // the art under one slice. win: {x, y, z, r, fill} moves, sizes and turns it; fill repeats the art so the slice is never empty.
  // under: a ground picture the same size as the art (a fabric), repeated under it so the fabric runs with the slices.
  function kaleArt(wg, m, R, angle, nudge, win, under) {
    var wz = win && win.z ? win.z : 1, wr = win && win.r ? win.r : 0, mx = Math.max(m.width, m.height), fk = R * 0.9 * wz / mx, far = 4 * R / fk + mx;
    wg.save(); wg.translate(R * (0.55 + (nudge ? nudge[0] : 0) + (win && win.x ? win.x : 0)), R * ((nudge ? nudge[1] : 0) + (win && win.y ? win.y : 0)));
    if (under || (win && win.fill)) {
      wg.save(); wg.rotate((angle + wr) * Math.PI / 180); wg.scale(fk, fk); wg.translate(-m.width / 2, -m.height / 2);
      if (under) { wg.fillStyle = wg.createPattern(under, 'repeat'); wg.fillRect(-far, -far, far * 2, far * 2); }
      if (win && win.fill) { wg.fillStyle = wg.createPattern(m, 'repeat'); wg.fillRect(-far, -far, far * 2, far * 2); }
      wg.restore();
    }
    if (!(win && win.fill)) placeMotif(wg, m, R * 0.9 * wz, angle + wr, false, false);
    wg.restore();
  }
  // rot0 turns the finished cell (4 slices sit on the axes so the tile edges stay mirrors)
  function kaleCell(m, R, slices, angle, tri, nudge, win, rot0, under) {
    var c = cv(R * 2, R * 2), g = c.getContext('2d'), a = Math.PI * 2 / slices;
    var w = cv(R * 2, R * 2), wg = w.getContext('2d');
    // tri: the wedge is a real equilateral triangle (straight outer edge), so every edge of every triangle is a mirror
    wg.translate(R, R); wg.beginPath(); wg.moveTo(0, 0); var e2 = a / 2 + .012; if (tri) { wg.lineTo(Math.cos(-e2) * R * 1.05, Math.sin(-e2) * R * 1.05); wg.lineTo(Math.cos(e2) * R * 1.05, Math.sin(e2) * R * 1.05); } else wg.arc(0, 0, R * 1.02, -e2, e2); wg.closePath(); wg.clip();
    kaleArt(wg, m, R, angle, nudge, win, under);
    g.translate(R, R);
    for (var i = 0; i < slices; i++) { g.save(); g.rotate(i * a + (rot0 || 0)); if (i % 2) g.scale(1, -1); g.drawImage(w, -R, -R); g.restore(); }
    return c;
  }
  // the slice of each kaleidoscope: how many, whether its outer edge is straight (triangle) or round, or a plain rectangle
  E.kaleGeom = function (type, slices) { return type === 'kaleRect' ? { n: 4, rect: true } : type === 'kaleHex' ? { n: 12, tri: false } : type === 'kaleTri' ? { n: 6, tri: true } : { n: slices === 4 ? 4 : 8, tri: false }; };
  E.repeatTile = function (o) {
    var m = o.motif, P = o.ppi, T = Math.max(8, Math.round(o.tileIn * P)), size = T * (o.scale || .7), ang = o.angle || 0, t = o.type;
    var W = T, H = T, spots = [];
    if (t === 'grid') spots = [[T / 2, T / 2, 0, 0, 0]];
    // half-drop and half-brick only shift, they never flip (that is the textile meaning, and words stay readable)
    else if (t === 'halfdrop') { W = 2 * T; spots = [[T / 2, T / 2, 0, 0, 0], [1.5 * T, T, 0, 0, 0]]; }
    else if (t === 'halfbrick') { H = 2 * T; spots = [[T / 2, T / 2, 0, 0, 0], [T, 1.5 * T, 0, 0, 0]]; }
    else if (t === 'mirror') {
      var md = o.mirrorDir || 'both';
      if (md === 'lr') { W = 2 * T; spots = [[T / 2, T / 2, 0, 0, 0], [1.5 * T, T / 2, 0, 1, 0]]; }
      else if (md === 'ud') { H = 2 * T; spots = [[T / 2, T / 2, 0, 0, 0], [T / 2, 1.5 * T, 0, 0, 1]]; }
      else { W = H = 2 * T; spots = [[T / 2, T / 2, 0, 0, 0], [1.5 * T, T / 2, 0, 1, 0], [T / 2, 1.5 * T, 0, 0, 1], [1.5 * T, 1.5 * T, 0, 1, 1]]; }
    }
    else if (t === 'spin') { W = H = 2 * T; spots = [[T / 2, T / 2, 0, 0, 0], [1.5 * T, T / 2, 90, 0, 0], [1.5 * T, 1.5 * T, 180, 0, 0], [T / 2, 1.5 * T, 270, 0, 0]]; }
    else if (t === 'diamond') { spots = [[T / 2, T / 2, 0, 0, 0], [0, 0, 0, 0, 0]]; size *= .7; }
    else if (t === 'toss') {
      W = H = 2 * T; var R = rng(o.seed || 7), n = Math.round(4 * (o.density || 1) + 2), tries = 0;
      while (spots.length < n && tries++ < 400) { var x = R() * W, y = R() * H, ok = true; for (var i = 0; i < spots.length; i++) { var ddx = Math.abs(x - spots[i][0]), ddy = Math.abs(y - spots[i][1]); ddx = Math.min(ddx, W - ddx); ddy = Math.min(ddy, H - ddy); if (Math.hypot(ddx, ddy) < size * .85) { ok = false; break; } } if (ok) spots.push([x, y, R() * 360, 0, 0]); }
      size *= .8;
    }
    var c, g;
    if (t === 'kaleRect') { // a rectangle of any proportion, mirrored left-right and up-down: every edge is a mirror, so it always repeats cleanly
      var ra = Math.max(.3, Math.min(3, o.aspect || 1)), sw = T, sh = Math.max(8, Math.round(T * ra)), rc = cv(sw, sh), rg = rc.getContext('2d');
      rg.translate(0, sh / 2); kaleArt(rg, m, T, ang, o.nudge, o.win, o.under);
      c = cv(sw * 2, sh * 2); g = c.getContext('2d'); if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, sw * 2, sh * 2); }
      [[0, 0, 1, 1], [sw * 2, 0, -1, 1], [0, sh * 2, 1, -1], [sw * 2, sh * 2, -1, -1]].forEach(function (q) { g.save(); g.translate(q[0], q[1]); g.scale(q[2], q[3]); g.drawImage(rc, 0, 0); g.restore(); });
      return c;
    }
    if (t === 'kaleSquare' || t === 'kaleHex' || t === 'kaleTri') {
      if (t === 'kaleSquare') {
        c = cv(T, T); g = c.getContext('2d'); if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, T, T); }
        var cell = o.slices === 4 ? kaleCell(m, T / 2 * 1.415, 4, ang, false, o.nudge, o.win, Math.PI / 4, o.under) : kaleCell(m, T / 2 * 1.415, 8, ang, false, o.nudge, o.win, 0, o.under); g.save(); g.beginPath(); g.rect(0, 0, T, T); g.clip(); g.drawImage(cell, T / 2 - cell.width / 2, T / 2 - cell.height / 2); g.restore(); return c;
      }
      // hexagons sit on a lattice; the rectangle of 2 hexes across and 2 rows down repeats cleanly
      var Rh = T / 2, hw = Math.round(Math.sqrt(3) * Rh), hh = Math.round(3 * Rh);
      c = cv(hw, hh); g = c.getContext('2d'); if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, hw, hh); }
      var slices = t === 'kaleHex' ? 12 : 6, cellH = t === 'kaleTri' ? kaleCell(m, Rh, 6, ang, true, o.nudge, o.win, 0, o.under) : kaleCell(m, Rh * 1.16, slices, ang, false, o.nudge, o.win, 0, o.under);
      var hexPath = function (gg, r) { gg.beginPath(); for (var k = 0; k < 6; k++) { var aa = Math.PI / 6 + k * Math.PI / 3; gg.lineTo(Math.cos(aa) * r, Math.sin(aa) * r); } gg.closePath(); };
      [[0, 0], [hw / 2, hh / 2]].forEach(function (p) {
        wrapDraw(g, hw, hh, p[0], p[1], Rh * 1.2, function (gg) { hexPath(gg, Rh + 1); gg.clip(); gg.drawImage(cellH, -cellH.width / 2, -cellH.height / 2); });
      });
      return c;
    }
    // mix and match: several motifs (your logo, your picture, an icon, empty space) take turns. The tile repeats n times across.
    // turns run both across and down, so neighbors are never the same motif
    // gap down can differ from gap across: stretch the rows (not for the mirror-in-shape kinds)
    var sy = o.tileInY ? Math.max(8, Math.round(o.tileInY * P)) / T : 1; H = Math.round(H * sy);
    var ms = o.motifs && o.motifs.length > 1 ? o.motifs : [m], n = ms.length, SW = W * n, SH = H * n;
    c = cv(SW, SH); g = c.getContext('2d'); if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, SW, SH); }
    if (t === 'diamond') { spots = [[W / 2, H / 2, 0, 0, 0], [0, 0, 0, 0, 0]]; }
    // nudge: move the motif inside its spot. Mirrored copies move the mirrored way, so you pick where the copies meet.
    // words: 'flip' flips everything, 'readable' mirrors the layout but draws every copy the right way round,
    // 'shapes' flips the motif but lays the words (o.textLayer) on top unflipped.
    var nu = o.nudge || [0, 0], words = o.words || 'flip';
    for (var cy = 0; cy < n; cy++) for (var cp = 0; cp < n; cp++) spots.forEach(function (s, i) {
      var alt = o.flip === 'alt' && (i % 2 === 1), fx = !!s[3] !== alt, fy = !!s[4], mm = ms[(cp + cy + i) % n]; if (!mm) return;
      var ox = nu[0] * T * (s[3] ? -1 : 1), oy = nu[1] * T * (s[4] ? -1 : 1);
      if (s[2]) { var ra = s[2] * Math.PI / 180, rx = ox * Math.cos(ra) - oy * Math.sin(ra), ry = ox * Math.sin(ra) + oy * Math.cos(ra); ox = rx; oy = ry; }
      var tx = words === 'readable' ? false : fx, ty = words === 'readable' ? false : fy, sa = words === 'readable' && (fx !== fy) ? -1 : 1;
      wrapDraw(g, SW, SH, s[0] + cp * W + ox, s[1] * sy + cy * H + oy, size * .75 + Math.abs(ox) + Math.abs(oy), function (gg) {
        placeMotif(gg, mm, size, (ang * sa) + s[2], tx, ty);
        if (words === 'shapes' && o.textLayer && mm === m) placeMotifUp(gg, o.textLayer, size, fx, fy);
      });
    });
    return c;
  };

  /* ---------- 2. plaid: threads crossing ---------- */
  // sett: [[colorIndex, threads], ...]. Mirrored setts read forward then back, like most tartans.
  E.PLAIDS = [
    ['buffalo', 'Buffalo', 'Big two color blocks. Cabin jackets.', [[0, 24], [1, 24]], false],
    ['farmer', 'Farmer', 'Work shirt flannel. Medium blocks with a thin line.', [[0, 18], [1, 4], [0, 4], [2, 12], [1, 2]], true],
    ['heritage', 'Heritage', 'Soft camel ground, fine dark lines and one bright thread.', [[0, 22], [1, 6], [2, 2], [1, 6], [0, 4], [3, 1]], true],
    ['tartan', 'Highland', 'Deep green and navy with black, the old regiment kind.', [[1, 4], [2, 2], [1, 2], [2, 2], [1, 16], [2, 16], [0, 16], [3, 2], [0, 4]], true],
    ['madras', 'Madras', 'Bright summer cotton, lots of thin colors.', [[0, 8], [1, 3], [2, 6], [3, 2], [1, 3], [4, 8], [2, 2]], true],
    ['glen', 'Glen check', 'Small checks in big squares. Suiting.', [[0, 2], [1, 2], [0, 2], [1, 2], [0, 2], [1, 2], [0, 4], [1, 4], [0, 4], [1, 4]], false],
    ['tattersall', 'Tattersall', 'Thin lines on a light ground, two colors crossing.', [[0, 12], [1, 1], [0, 12], [2, 1]], false],
    ['gingham', 'Gingham', 'Even stripes both ways, picnic and button downs.', [[0, 6], [1, 6]], false]
  ];
  E.plaidTile = function (o) {
    var sett = o.sett.slice(); if (o.mirror) { var back = sett.slice(1, -1).reverse(); sett = sett.concat(back); }
    var seq = []; sett.forEach(function (s) { for (var i = 0; i < Math.max(1, Math.round(s[1])); i++) seq.push(s[0]); });
    var thr = Math.max(1, o.threadIn * o.ppi), N = seq.length, S = Math.max(4, Math.round(N * thr));
    var c = cv(S, S), g = c.getContext('2d'), im = g.createImageData(S, S), d = im.data, cols = o.colors.map(hex);
    var step = o.step ? Math.max(1, Math.round(thr * o.step)) : Math.max(1, Math.round(thr / 2)); // twill step: one weave cell is about half a thread
    for (var y = 0; y < S; y++) {
      var wy = seq[Math.min(N - 1, Math.floor(y / S * N))];
      for (var x = 0; x < S; x++) {
        var wx = seq[Math.min(N - 1, Math.floor(x / S * N))], on;
        if (o.weave === 'plain') on = ((Math.floor(x / step) + Math.floor(y / step)) & 1) === 0;
        else on = (((Math.floor(x / step) + Math.floor(y / step)) % 4) + 4) % 4 < 2; // 2/2 twill, the diagonal you see on flannel
        var A = cols[wx] || cols[0], B = cols[wy] || cols[0], p = (y * S + x) * 4, C = on ? A : B;
        if (o.weave === 'flat') C = [(A[0] + B[0]) >> 1, (A[1] + B[1]) >> 1, (A[2] + B[2]) >> 1];
        d[p] = C[0]; d[p + 1] = C[1]; d[p + 2] = C[2]; d[p + 3] = 255;
      }
    }
    g.putImageData(im, 0, 0); return c;
  };

  /* ---------- 3. stripes ---------- */
  // bands: [[colorIndex, widthIn], ...]
  E.STRIPES = [
    ['breton', 'Breton', '1950s sailor tee. Even navy on white.', [[1, .4], [0, .6]], 'h'],
    ['rep', 'Rep stripe', '1960s club tie. Diagonal, two colors on a dark ground.', [[0, .7], [1, .14], [0, .1], [2, .24], [0, .1], [1, .14]], 'd'],
    ['bengal', 'Bengal', 'Shirting. Bold even stripes, one color and white.', [[1, .25], [0, .25]], 'v'],
    ['awning', 'Awning', 'Wide and loud, beach chairs and canopies.', [[1, 1.2], [0, 1.2]], 'v'],
    ['pin', 'Pinstripe', 'Banker suit. A hair line on dark cloth.', [[0, .5], [1, .03]], 'v'],
    ['chalk', 'Chalk stripe', '1930s suiting. Soft wider lines far apart.', [[0, .9], [1, .07]], 'v'],
    ['candy', 'Candy', 'Thin bright stripe on white, oxford shirts.', [[0, .12], [1, .08]], 'v'],
    ['ticking', 'Ticking', 'Old mattress cloth. Pairs of thin lines.', [[0, .5], [1, .06], [0, .06], [1, .06], [0, .5], [1, .2]], 'v'],
    ['rugby', 'Rugby', '1980s rugby shirt. Fat stripes with a thin divider.', [[1, 1], [2, .12], [0, 1], [2, .12]], 'h'],
    ['varsity', 'Varsity', 'Sleeve band. Three colors stacked.', [[0, 1.4], [1, .25], [2, .25], [1, .25]], 'h']
  ];
  E.stripeTile = function (o) {
    var P = o.ppi, tot = 0; o.bands.forEach(function (b) { tot += b[1]; });
    var L = Math.max(4, Math.round(tot * P)), dir = o.dir, cols = o.colors;
    if (dir === 'd') { // diagonal at 45 degrees: the tile is one period square
      var c = cv(L, L), g = c.getContext('2d'); g.fillStyle = cols[o.bands[0][0]]; g.fillRect(0, 0, L, L);
      var pos = 0; o.bands.forEach(function (b) { var w = b[1] / tot * L; g.fillStyle = cols[b[0]] || cols[0];
        for (var k = -2; k <= 2; k++) { var s = pos + k * L; g.beginPath(); g.moveTo(s, 0); g.lineTo(s + w, 0); g.lineTo(s + w - L, L); g.lineTo(s - L, L); g.closePath(); g.fill(); }
        pos += w; });
      return c;
    }
    // a band can be solid, dots, lines, outline or your logo running along it (mix and match)
    var fancy = o.bands.some(function (b) { return b[2] && b[2] !== 'solid'; }), A = fancy ? L : 8;
    var vert = dir === 'v', c2 = vert ? cv(L, A) : cv(A, L), g2 = c2.getContext('2d'), p2 = 0;
    g2.fillStyle = cols[0]; g2.fillRect(0, 0, c2.width, c2.height);
    o.bands.forEach(function (b) {
      var w = b[1] / tot * L, col = cols[b[0]] || cols[0], f = b[2] || 'solid', x0 = Math.round(p2), bw = Math.ceil(w);
      if (f === 'solid') { g2.fillStyle = col; if (vert) g2.fillRect(x0, 0, bw, A); else g2.fillRect(0, x0, A, bw); }
      else { var n = Math.max(1, Math.round(A / Math.max(2, bw))), step = A / n; for (var k = 0; k < n; k++) { if (vert) fillCell(g2, x0, k * step + (step - bw) / 2, bw, f, col, cols[0], o.logo); else fillCell(g2, k * step + (step - bw) / 2, x0, bw, f, col, cols[0], o.logo); } }
      p2 += w;
    });
    return c2;
  };

  /* ---------- 4. checks ---------- */
  E.CHECKS = [
    ['board', 'Checkerboard', 'Every other square filled. Skate shoes, racing flags.'],
    ['twotone', 'Two-tone', 'Two close shades with a fine line between. Luggage and leather goods.'],
    ['window', 'Windowpane', 'Thin lines making big squares. Blazers.'],
    ['houndstooth', 'Houndstooth', 'Broken checks with little teeth. Wool coats.'],
    ['argyle', 'Argyle', 'Diamonds with dashed lines. Socks and sweaters.'],
    ['buffalo', 'Block check', 'Two crossing stripes make three tones.']
  ];
  E.FILLS = [['solid', 'Solid'], ['dots', 'Dots'], ['outline', 'Outline'], ['hatch', 'Lines'], ['cross', 'Crosshatch']];
  // mix and match: every slot can be any of these, the slots take turns
  E.MIXFILLS = [['solid', 'Solid'], ['dots', 'Dots'], ['hatch', 'Lines'], ['outline', 'Outline'], ['cross', 'Cross'], ['logo', 'Logo'], ['empty', 'Empty']];
  E.POINTS = [['none', 'None'], ['dot', 'Dot'], ['diamond', 'Diamond'], ['star', 'Star'], ['plus', 'Plus'], ['logo', 'My logo']];
  function fillCell(g, x, y, s, style, col, bg, logo) {
    g.fillStyle = col; g.strokeStyle = col;
    if (style === 'empty') return;
    if (style === 'solid') { g.fillRect(x, y, s, s); return; }
    if (style === 'logo') { if (logo) { var lk = s * .78 / Math.max(logo.width, logo.height); g.drawImage(logo, x + (s - logo.width * lk) / 2, y + (s - logo.height * lk) / 2, logo.width * lk, logo.height * lk); } return; }
    if (style === 'outline') { g.lineWidth = Math.max(1, s * .08); g.strokeRect(x + g.lineWidth / 2 + s * .08, y + g.lineWidth / 2 + s * .08, s - g.lineWidth - s * .16, s - g.lineWidth - s * .16); return; }
    if (style === 'dots') { var n = 3, r = s / n * .3; for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) { g.beginPath(); g.arc(x + (i + .5) * s / n, y + (j + .5) * s / n, r, 0, 7); g.fill(); } return; }
    g.save(); g.beginPath(); g.rect(x, y, s, s); g.clip(); g.lineWidth = Math.max(1, s * .06);
    for (var k = -s; k < s * 2; k += s / 5) { g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + k + s, y + s); g.stroke(); if (style === 'cross') { g.beginPath(); g.moveTo(x + k + s, y); g.lineTo(x + k, y + s); g.stroke(); } }
    g.restore();
  }
  function star(g, r, pts, inner) { g.beginPath(); for (var i = 0; i < pts * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / pts, rr = i % 2 ? r * inner : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); }
  E.star = star;
  function pointMark(g, kind, r, col, logo) {
    g.fillStyle = col; g.strokeStyle = col;
    if (kind === 'dot') { g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill(); }
    else if (kind === 'diamond') { g.beginPath(); g.moveTo(0, -r); g.lineTo(r, 0); g.lineTo(0, r); g.lineTo(-r, 0); g.closePath(); g.fill(); }
    else if (kind === 'star') { star(g, r * 1.2, 4, .4); g.fill(); }
    else if (kind === 'plus') { g.fillRect(-r, -r * .25, 2 * r, r * .5); g.fillRect(-r * .25, -r, r * .5, 2 * r); }
    else if (kind === 'logo' && logo) { var k = r * 2.4 / Math.max(logo.width, logo.height); g.drawImage(logo, -logo.width * k / 2, -logo.height * k / 2, logo.width * k, logo.height * k); }
  }
  E.checkTile = function (o) {
    var s = Math.max(4, Math.round(o.cellIn * o.ppi)), cols = o.colors, kind = o.kind, c, g;
    if (kind === 'houndstooth') {
      // real houndstooth is a weave: 4 dark and 4 light threads both ways, crossed in a 2/2 twill
      c = E.plaidTile({ sett: [[1, 4], [0, 4]], mirror: false, threadIn: o.cellIn / 4, ppi: o.ppi, colors: cols, weave: 'twill', step: 1 }); g = c.getContext('2d');
    } else if (kind === 'argyle') {
      c = cv(s * 2, s * 3); g = c.getContext('2d'); var W = c.width, H = c.height; g.fillStyle = cols[0]; g.fillRect(0, 0, W, H);
      var dia = function (cx, cy, col) { g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy - H / 2); g.lineTo(cx + W / 2, cy); g.lineTo(cx, cy + H / 2); g.lineTo(cx - W / 2, cy); g.closePath(); g.fill(); };
      dia(W / 2, H / 2, cols[1]); [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (p) { dia(p[0], p[1], cols[2] || cols[1]); });
      g.strokeStyle = cols[3] || cols[0]; g.lineWidth = Math.max(1, s * .06); g.setLineDash([s * .18, s * .14]);
      for (var k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(k * W, 0); g.lineTo(k * W + W, H); g.stroke(); g.beginPath(); g.moveTo(k * W + W, 0); g.lineTo(k * W, H); g.stroke(); }
      g.setLineDash([]);
    } else if (kind === 'window') {
      c = cv(s * 2, s * 2); g = c.getContext('2d'); g.fillStyle = cols[0]; g.fillRect(0, 0, c.width, c.height);
      var lw = Math.max(1, s * .06); g.fillStyle = cols[1]; g.fillRect(0, s - lw / 2, c.width, lw); g.fillRect(s - lw / 2, 0, lw, c.height);
      if (cols[2]) { g.fillStyle = cols[2]; g.fillRect(0, 0, c.width, lw * .6); g.fillRect(0, 0, lw * .6, c.height); }
    } else if (kind === 'buffalo') {
      c = cv(s * 2, s * 2); g = c.getContext('2d'); g.fillStyle = cols[0]; g.fillRect(0, 0, s * 2, s * 2);
      g.fillStyle = mix(cols[0], cols[1], .5); g.fillRect(s, 0, s, s); g.fillRect(0, s, s, s); g.fillStyle = cols[1]; g.fillRect(s, s, s, s);
    } else { // checkerboard and two-tone
      // mix and match: the filled squares take turns through the slots (one dots, one lines, one logo...). The tile grows so the turns repeat cleanly.
      var slots = o.mix && o.mix.length > 1 ? o.mix : [o.fill || 'solid'], n = slots.length, nx = 2 * n, ny = n % 2 ? 2 * n : n;
      if (n === 1) { nx = 2; ny = 2; }
      c = cv(s * nx, s * ny); g = c.getContext('2d');
      var a = cols[0], b = kind === 'twotone' ? mix(cols[0], cols[1], .35) : cols[1];
      g.fillStyle = a; g.fillRect(0, 0, c.width, c.height);
      for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) { if ((i + j) % 2 === 0) continue; var slot = slots[(Math.floor(i / 2) + j) % n]; fillCell(g, i * s, j * s, s, slot, b, a, o.logo); }
      if (kind === 'twotone') { g.fillStyle = cols[2] || mix(cols[0], cols[1], .7); var l2 = Math.max(1, s * .03); for (var q = 0; q <= Math.max(nx, ny); q++) { g.fillRect(0, q * s, c.width, l2); g.fillRect(q * s, 0, l2, c.height); } }
    }
    if (o.point && o.point !== 'none') { // something at the corners where the lines meet
      var W2 = c.width, H2 = c.height, step = kind === 'argyle' ? [W2, H2] : [s, s];
      for (var px = 0; px < W2; px += step[0]) for (var py = 0; py < H2; py += step[1]) wrapDraw(g, W2, H2, px, py, s * .4, function (gg) { pointMark(gg, o.point, s * .16, cols[o.pointColor || 1] || cols[1], o.logo); });
    }
    return c;
  };

  /* ---------- 5. camo: layered seamless noise ---------- */
  function noiseField(W, H, period, seed, octaves, stretchX) {
    // value noise on a grid that wraps, so the field tiles; several sizes added together look natural
    var out = new Float32Array(W * H), amp = 1, tot = 0, R = rng(seed);
    for (var o = 0; o < octaves; o++) {
      var gx = Math.max(1, Math.round(period * Math.pow(2, o) / (stretchX || 1))), gy = Math.max(1, Math.round(period * Math.pow(2, o))), grid = new Float32Array(gx * gy);
      for (var i = 0; i < grid.length; i++) grid[i] = R();
      for (var y = 0; y < H; y++) {
        var fy = y / H * gy, y0 = Math.floor(fy), ty = fy - y0; ty = ty * ty * (3 - 2 * ty); var y1 = (y0 + 1) % gy;
        for (var x = 0; x < W; x++) {
          var fx = x / W * gx, x0 = Math.floor(fx), tx = fx - x0; tx = tx * tx * (3 - 2 * tx); var x1 = (x0 + 1) % gx;
          var a = grid[y0 * gx + x0], b = grid[y0 * gx + x1], c = grid[y1 * gx + x0], d = grid[y1 * gx + x1];
          out[y * W + x] += ((a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty) * amp;
        }
      }
      tot += amp; amp *= .5;
    }
    for (var k = 0; k < out.length; k++) out[k] /= tot;
    return out;
  }
  E.CAMOS = [
    ['woodland', 'Woodland', 'Big soft blobs in four colors. The classic forest kind.', 'Woodland'],
    ['digital', 'Digital', 'The same blobs cut into square pixels.', 'Urban'],
    ['tiger', 'Tiger stripe', 'Long thin streaks running sideways.', 'Jungle'],
    ['splinter', 'Splinter', 'Sharp angled shards with fine rain lines.', 'Field'],
    ['dots', 'Dot', 'Clusters of small spots, many colors.', 'Woodland'],
    ['chip', 'Chocolate chip', 'Desert blobs sprinkled with dark and light chips.', 'Desert'],
    ['bubble', 'Bubble', 'Round soft shapes. Playful, pastel or loud.', 'Candy'],
    ['street', 'Street', 'Oversized bold blobs, high contrast.', 'Night'],
    ['hunter', 'Hunter', 'Branches and leaves over bark.', 'Autumn']
  ];
  E.camoTile = function (o) {
    var P = o.ppi, S = Math.max(16, Math.round(o.tileIn * P)), cols = o.colors, seed = o.seed || 3, type = o.type, sc = o.scale || 1;
    var work = Math.min(S, o.maxWork || 900), c = cv(work, work), g = c.getContext('2d'), Wd = work;
    g.fillStyle = cols[0]; g.fillRect(0, 0, Wd, Wd);
    function layers(per, oct, stretch, levels, pix) {
      var im = g.getImageData(0, 0, Wd, Wd), d = im.data;
      levels.forEach(function (lv, li) {
        var f = noiseField(Wd, Wd, Math.max(1, Math.round(per / sc)), seed * 31 + li * 7, oct, stretch), col = hex(cols[lv[0]] || cols[cols.length - 1]);
        for (var y = 0; y < Wd; y++) for (var x = 0; x < Wd; x++) {
          var xx = x, yy = y; if (pix) { xx = Math.floor(x / pix) * pix; yy = Math.floor(y / pix) * pix; }
          if (f[yy * Wd + xx] > lv[1]) { var p = (y * Wd + x) * 4; d[p] = col[0]; d[p + 1] = col[1]; d[p + 2] = col[2]; }
        }
      });
      g.putImageData(im, 0, 0);
    }
    var R = rng(seed);
    if (type === 'woodland' || type === 'street') layers(type === 'street' ? 3 : 5, 3, 1.3, [[1, .5], [2, .58], [3, .62]]);
    else if (type === 'digital') layers(5, 3, 1.2, [[1, .5], [2, .57], [3, .61]], Math.max(2, Math.round(Wd / 64)));
    else if (type === 'tiger') layers(6, 3, 5, [[1, .5], [2, .58], [3, .6]]);
    else if (type === 'bubble') {
      // metaballs: soft circles that melt into each other
      var balls = []; for (var i = 0; i < 26 * sc; i++) balls.push([R() * Wd, R() * Wd, (.04 + R() * .07) * Wd / sc, 1 + Math.floor(R() * (cols.length - 1))]);
      var im2 = g.getImageData(0, 0, Wd, Wd), d2 = im2.data, step = 2;
      for (var y = 0; y < Wd; y += step) for (var x = 0; x < Wd; x += step) {
        var sums = [0, 0, 0, 0, 0, 0, 0, 0], best = 0, bc = 0;
        for (var b = 0; b < balls.length; b++) { var dx = Math.abs(x - balls[b][0]), dy = Math.abs(y - balls[b][1]); dx = Math.min(dx, Wd - dx); dy = Math.min(dy, Wd - dy); sums[balls[b][3]] += balls[b][2] * balls[b][2] / (dx * dx + dy * dy + 1); }
        for (var q2 = 1; q2 < sums.length; q2++) if (sums[q2] > best) { best = sums[q2]; bc = q2; }
        if (best > .9) { var col2 = hex(cols[bc]); for (var yy2 = 0; yy2 < step; yy2++) for (var xx2 = 0; xx2 < step; xx2++) { var p2 = ((y + yy2) * Wd + x + xx2) * 4; if (p2 < d2.length) { d2[p2] = col2[0]; d2[p2 + 1] = col2[1]; d2[p2 + 2] = col2[2]; } } }
      }
      g.putImageData(im2, 0, 0);
    } else if (type === 'splinter') {
      for (var s2 = 0; s2 < 34 * sc; s2++) {
        var cx = R() * Wd, cy = R() * Wd, len = (.12 + R() * .2) * Wd / sc, wid = len * (.25 + R() * .3), ang = -.5 + R() * .4, col3 = cols[1 + Math.floor(R() * (cols.length - 1))];
        wrapDraw(g, Wd, Wd, cx, cy, len, function (gg) { gg.rotate(ang); gg.fillStyle = col3; gg.beginPath(); gg.moveTo(-len / 2, 0); gg.lineTo(-len / 6, -wid / 2); gg.lineTo(len / 2, -wid / 4); gg.lineTo(len / 4, wid / 2); gg.closePath(); gg.fill(); });
      }
      g.strokeStyle = cols[cols.length - 1]; g.lineWidth = Math.max(1, Wd / 400);
      for (var r2 = 0; r2 < 140; r2++) { var rx = R() * Wd, ry = R() * Wd, rl = Wd * (.01 + R() * .02); g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx, ry + rl); g.stroke(); }
    } else if (type === 'dots' || type === 'chip') {
      if (type === 'chip') layers(4, 3, 1.4, [[1, .52], [2, .6]]);
      var nd = type === 'dots' ? 900 : 220;
      for (var k = 0; k < nd * sc; k++) {
        var cl = type === 'dots' ? 1 + Math.floor(R() * (cols.length - 1)) : (R() < .5 ? cols.length - 1 : cols.length - 2), dx2 = R() * Wd, dy2 = R() * Wd, rr = Wd * (type === 'dots' ? .006 + R() * .008 : .004 + R() * .006) / sc;
        var colk = cols[cl]; wrapDraw(g, Wd, Wd, dx2, dy2, rr * 2, function (gg) { gg.fillStyle = colk; gg.beginPath(); gg.ellipse(0, 0, rr * (1 + R()), rr, R() * 3, 0, 7); gg.fill(); });
      }
    } else if (type === 'hunter') {
      layers(4, 4, 3, [[1, .55]]);
      g.lineCap = 'round';
      for (var br = 0; br < 22 * sc; br++) { var bx = R() * Wd, by = R() * Wd, bl = (.15 + R() * .25) * Wd / sc, ba = R() * 6.28, colb = cols[2];
        wrapDraw(g, Wd, Wd, bx, by, bl, function (gg) { gg.rotate(ba); gg.strokeStyle = colb; gg.lineWidth = Wd * .008; gg.beginPath(); gg.moveTo(0, 0); gg.quadraticCurveTo(bl * .5, bl * .1, bl, 0); gg.stroke(); gg.lineWidth = Wd * .004; for (var tw = .3; tw < 1; tw += .25) { gg.beginPath(); gg.moveTo(bl * tw, 0); gg.lineTo(bl * tw + bl * .12, -bl * .12); gg.stroke(); } }); }
      for (var lf = 0; lf < 160 * sc; lf++) { var lx = R() * Wd, ly = R() * Wd, ls = Wd * (.012 + R() * .02) / sc, la = R() * 6.28, coll = cols[3 + Math.floor(R() * Math.max(1, cols.length - 3))] || cols[3];
        wrapDraw(g, Wd, Wd, lx, ly, ls * 2, function (gg) { gg.rotate(la); gg.fillStyle = coll; gg.beginPath(); gg.moveTo(-ls, 0); gg.quadraticCurveTo(0, -ls * .7, ls, 0); gg.quadraticCurveTo(0, ls * .7, -ls, 0); gg.fill(); }); }
    }
    if (work === S) return c;
    var out = cv(S, S), og = out.getContext('2d'); og.imageSmoothingEnabled = type !== 'digital'; og.drawImage(c, 0, 0, S, S); return out;
  };

  /* ---------- palettes ---------- */
  E.PALETTES = {
    plaid: [['Red flannel', ['#b5272d', '#1a1a1a', '#3d3d3d', '#e9d9b8', '#7a1c1c']], ['Camel', ['#c9a878', '#1f2a36', '#f1e9d9', '#b23a2e', '#6b4f33']], ['Highland', ['#1f3b2c', '#1b2440', '#141414', '#c9b23a', '#7a1f1f']], ['Madras', ['#f2c230', '#d6336c', '#1d6fb8', '#2a9d8f', '#f07f2f']], ['Grey suit', ['#d9d6cf', '#3b3d42', '#8a8780', '#1c2b45', '#a33']], ['Sky', ['#e9f0f7', '#3a6ea5', '#b9d0e6', '#1c2b45', '#f2c230']]],
    stripes: [['Sailor', ['#f6f3ea', '#1c2b45', '#b5272d']], ['Club', ['#1c2b45', '#b5272d', '#d4af37']], ['Candy', ['#ffffff', '#e05d8b', '#3a6ea5']], ['Bold', ['#f2c230', '#1a1a1a', '#ffffff']], ['Suit', ['#2a2c33', '#cfcac0', '#8a8780']], ['Sea', ['#f2ecd6', '#2a9d8f', '#1c2b45']]],
    checks: [['Classic', ['#f2ecd6', '#1a1a1a', '#b5272d', '#8a8780']], ['Leather', ['#6b4f33', '#c9a878', '#3a2a1c', '#e9d9b8']], ['Racing', ['#ffffff', '#1a1a1a', '#e2342a', '#1d4ed8']], ['Picnic', ['#ffffff', '#d6336c', '#2a9d8f', '#f2c230']], ['Navy', ['#e9f0f7', '#1c2b45', '#b5272d', '#d4af37']], ['Mono', ['#f2f2f2', '#555', '#111', '#999']]],
    camo: [['Woodland', ['#6b6a4e', '#3f4a2c', '#5c4630', '#1e1f1a']], ['Desert', ['#d8c49a', '#b59a6a', '#8a6e4b', '#3a2e22', '#f2ead6']], ['Urban', ['#bdbdbd', '#7d7d7d', '#4a4a4a', '#1f1f1f']], ['Night', ['#1a1a1a', '#3a3a3a', '#5d1d1d', '#9a9a9a']], ['Snow', ['#f4f4f2', '#cfd4d6', '#9aa3a8', '#4a5257']], ['Navy', ['#2a3550', '#1c2438', '#4a5a7a', '#11151f']], ['Candy', ['#fde2ec', '#a8d8f0', '#f7c6d9', '#c6b4f2', '#fff3b0']], ['Street', ['#111111', '#e2342a', '#f2f2f2', '#2b2b2b']], ['Autumn', ['#6e5a3c', '#8a6a3c', '#3a2c1c', '#b5642a', '#c98d2e', '#7a2e1c']], ['Jungle', ['#4e6a3a', '#2c3a22', '#1a1f14', '#8a8a4a']], ['Field', ['#9a9a6a', '#5a6a3a', '#7a5a3a', '#2c2c22']]],
    repeat: [['Paper', ['#f6f3ea', '#1a1a1a']], ['White', ['#ffffff', '#1a1a1a']], ['Black', ['#141414', '#f2f2f2']], ['Navy', ['#1c2b45', '#f2ecd6']], ['Oat', ['#e9dfcb', '#6b4f33']], ['Sage', ['#c9d3c0', '#2c3a22']]]
  };

  /* ---------- fabrics: textures to see how it lands on cloth ---------- */
  E.FABRICS = [
    ['poplin', 'Cotton poplin', 'Smooth and crisp. Shirts, dresses, linings. About 3 to 4 oz.'],
    ['twill', 'Cotton twill', 'Diagonal rib. Chinos, workwear, jackets. About 7 to 9 oz.'],
    ['canvas', 'Canvas', 'Thick and stiff. Totes, bags, aprons. About 10 to 12 oz.'],
    ['denim', 'Denim', 'Twill with light threads showing. Jeans, jackets.'],
    ['linen', 'Linen', 'Slubby and dry. Summer shirts and pants.'],
    ['flannel', 'Flannel', 'Brushed and fuzzy. Shirts and pajamas, plaids live here.'],
    ['jersey', 'Jersey knit', 'Stretchy knit. Tees, dresses, leggings.'],
    ['satin', 'Satin', 'Shiny and fluid. Scarves, linings, slips.'],
    ['ripstop', 'Ripstop', 'Grid of strong threads. Outerwear, bags, cargo pants.'],
    ['corduroy', 'Corduroy', 'Raised vertical ribs. Pants and jackets.'],
    ['fleece', 'Fleece', 'Soft and thick. Hoodies, blankets.']
  ];
  // which fabric each kind of pattern usually lives on
  E.SUGGEST = {
    plaid: ['flannel', 'twill', 'poplin'], stripes: ['poplin', 'jersey', 'twill'], checks: ['poplin', 'twill', 'canvas'],
    camo: ['twill', 'ripstop', 'canvas', 'fleece'], repeat: ['poplin', 'canvas', 'jersey', 'satin']
  };
  E.SUGGEST_WHY = {
    plaid: 'Plaids are woven on flannel and twill for shirts and jackets. Printed plaid on poplin works for linings.',
    stripes: 'Stripes live on shirting poplin and oxford, jersey for tees, twill for pants.',
    checks: 'Gingham and windowpane are shirting. Bold checkers go on canvas and twill for bags and shoes.',
    camo: 'Camo is printed on cotton twill and ripstop for pants and jackets, fleece for hoodies.',
    repeat: 'Monograms and logo repeats print well on poplin and canvas. Satin for scarves, jersey for tees.'
  };
  E.fabricTexture = function (kind, S, ppi) {
    // a gray texture that tiles; 1 = no change, lower = darker. Laid over the pattern with multiply.
    var c = cv(S, S), g = c.getContext('2d'), im = g.createImageData(S, S), d = im.data, R = rng(11);
    var th = Math.max(1, ppi / 60); // about 60 threads per inch at the zoom you are looking at
    var n = noiseField(S, S, 6, 5, 3, 1), slub = kind === 'linen' ? noiseField(S, S, 3, 9, 2, 8) : null;
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var v = 1, i = y * S + x, cx = Math.floor(x / th), cy = Math.floor(y / th);
      if (kind === 'poplin') v = ((cx + cy) & 1) ? .94 : 1;
      else if (kind === 'twill' || kind === 'denim') { v = ((cx + cy) % 4 < 2) ? .9 : 1; if (kind === 'denim' && ((cx + cy) % 4 === 3)) v = 1.12; }
      else if (kind === 'canvas') { var t2 = th * 2; v = ((Math.floor(x / t2) + Math.floor(y / t2)) & 1) ? .86 : 1; v -= (x % t2 < 1 || y % t2 < 1) ? .05 : 0; }
      else if (kind === 'linen') { v = (((cx + cy) & 1) ? .93 : 1) - Math.max(0, slub[i] - .55) * .6; }
      else if (kind === 'flannel') v = .9 + n[i] * .14 + (R() - .5) * .08;
      else if (kind === 'jersey') { var col = Math.floor(x / (th * 1.5)), vy = (y + (col % 2) * th) % (th * 2); v = (Math.abs((x % (th * 1.5)) - th * .75) < th * .5 - vy * .2) ? 1 : .9; }
      else if (kind === 'satin') v = .92 + .16 * Math.pow(Math.sin((x * .6 + y) / S * Math.PI * 2) * .5 + .5, 2);
      else if (kind === 'ripstop') { var gs = Math.round(ppi * .25); v = (((cx + cy) & 1) ? .95 : 1) - (((x % gs) < th * 1.2 || (y % gs) < th * 1.2) ? .1 : 0); }
      else if (kind === 'corduroy') { var w = Math.max(3, ppi / 11); v = .82 + .2 * Math.sin((x % w) / w * Math.PI); }
      else if (kind === 'fleece') v = .9 + n[i] * .1 + (R() - .5) * .14;
      var q = i * 4, val = Math.max(0, Math.min(255, Math.round(v * 232)));
      d[q] = d[q + 1] = d[q + 2] = val; d[q + 3] = 255;
    }
    g.putImageData(im, 0, 0); return c;
  };

  /* ---------- color numbers for the tech pack ---------- */
  E.cmyk = function (h) { var c = hex(h), r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, k = 1 - Math.max(r, g, b); if (k >= 1) return [0, 0, 0, 100]; return [Math.round((1 - r - k) / (1 - k) * 100), Math.round((1 - g - k) / (1 - k) * 100), Math.round((1 - b - k) / (1 - k) * 100), Math.round(k * 100)]; };

  /* ---------- files ---------- */
  // PNG with a 150 dpi tag inside, so printers read the right inches
  E.pngWithDpi = function (canvas, dpi) {
    return new Promise(function (res) {
      canvas.toBlob(function (blob) {
        blob.arrayBuffer().then(function (buf) {
          var u = new Uint8Array(buf), ppm = Math.round(dpi / .0254);
          var chunk = new Uint8Array(21), dv = new DataView(chunk.buffer); dv.setUint32(0, 9); chunk.set([112, 72, 89, 115], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
          var crcT = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })(), crc = 0xFFFFFFFF;
          for (var i = 4; i < 17; i++) crc = crcT[(crc ^ chunk[i]) & 255] ^ (crc >>> 8); dv.setUint32(17, (crc ^ 0xFFFFFFFF) >>> 0);
          var out = new Uint8Array(u.length + 21); out.set(u.subarray(0, 33)); out.set(chunk, 33); out.set(u.subarray(33), 54);
          res(new Blob([out], { type: 'image/png' }));
        });
      }, 'image/png');
    });
  };
  // one page PDF holding a JPEG, for the mood board
  E.pdfOf = function (canvas, wIn, hIn) {
    var data = atob(canvas.toDataURL('image/jpeg', .92).split(',')[1]), img = new Uint8Array(data.length); for (var i = 0; i < data.length; i++) img[i] = data.charCodeAt(i);
    var W = Math.round(wIn * 72), H = Math.round(hIn * 72), enc = new TextEncoder(), parts = [], off = [], pos = 0;
    function add(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); pos += b.length; }
    add('%PDF-1.4\n');
    off[1] = pos; add('1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n');
    off[2] = pos; add('2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n');
    off[3] = pos; add('3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 ' + W + ' ' + H + ']/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>endobj\n');
    off[4] = pos; add('4 0 obj<</Type/XObject/Subtype/Image/Width ' + canvas.width + '/Height ' + canvas.height + '/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ' + img.length + '>>stream\n'); add(img); add('\nendstream endobj\n');
    var cs = 'q ' + W + ' 0 0 ' + H + ' 0 0 cm /Im0 Do Q';
    off[5] = pos; add('5 0 obj<</Length ' + cs.length + '>>stream\n' + cs + '\nendstream endobj\n');
    var x = pos; add('xref\n0 6\n0000000000 65535 f \n'); for (var k = 1; k <= 5; k++) add(String(off[k]).padStart(10, '0') + ' 00000 n \n');
    add('trailer<</Size 6/Root 1 0 R>>\nstartxref\n' + x + '\n%%EOF');
    return new Blob(parts, { type: 'application/pdf' });
  };

  window.PatternEngine = E;
})();
