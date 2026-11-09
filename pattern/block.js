/* NOCIV Patterns: the Block builder.
   A grid of squares (2 x 2 up to 9 x 9). Every square has three layers: the ground under everything,
   a backdrop shape with its own color, and an element on top (logo, words, icon, one of your pictures,
   or a pattern piece) with its own ink. The block then repeats as block, half-drop, half-brick or mirror.
   Mirror can keep words readable: the layout mirrors, the letters do not.
   Pictures stay on this phone (IndexedDB), nothing goes to our server. */
(function () {
  'use strict';
  window.PatternBlock = function (X) {
    var E = X.E, S = X.S, esc = X.esc;

    /* ---------- icons for the left toolbar ---------- */
    var BI = {
      grid: '<rect x="3" y="3" width="18" height="18"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
      mix: '<rect x="3" y="3" width="8" height="8"/><circle cx="17" cy="7" r="4"/><circle cx="7" cy="17" r="4"/><rect x="13" y="13" width="8" height="8"/>',
      repeat: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="7" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
      ground: '<path d="M3 17h18M3 21h18"/><path d="M12 3s5 5.5 5 8.5a5 5 0 0 1-10 0C7 8.5 12 3 12 3z"/>',
      pics: '<rect x="2" y="6" width="15" height="13" rx="2"/><path d="M7 3h13a2 2 0 0 1 2 2v11"/><circle cx="7" cy="11" r="1.6"/><path d="M17 17l-4-4-7 6"/>',
      el: '<path d="M12 3l2.6 5.6 6 .7-4.5 4 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.5-4 6-.7z"/>',
      ink: '<path d="M12 20l8-8-4-4-8 8v4z"/><path d="M14 6l4 4"/>',
      shape: '<circle cx="7" cy="7" r="3.2"/><rect x="14" y="3.8" width="6.4" height="6.4"/><path d="M7 13.5l3.6 3.6L7 20.7l-3.6-3.6z"/><path d="M14 14l6 6M20 14l-6 6"/>',
      back: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 10l6-6M4 16l12-12M8 20l12-12M14 20l6-6"/>',
      size: '<path d="M3 21L21 3M3 21h6M3 21v-6M21 3h-6M21 3v6"/>',
      out: '<path d="M15 5l-7 7 7 7"/>'
    };
    function bico(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (BI[n] || '') + '</svg>'; }

    /* ---------- lists ---------- */
    var SWATCH = ['#1a1a1a', '#ffffff', '#f3efe6', '#e9dfcb', '#8a8780', '#c8412f', '#e2342a', '#d6336c', '#f2c230', '#d4af37', '#f07f2f', '#2a9d8f', '#3f4a2c', '#1d6fb8', '#1c2b45', '#6b4f33', '#c9a878', '#c6b4f2', '#a8d8f0', '#fde2ec'];
    var PATS = [['solid', 'Solid'], ['dots', 'Dots'], ['lines', 'Lines'], ['cross', 'Cross'], ['ring', 'Ring'], ['empty', 'Empty']];
    var SHAPES = [['none', 'None'], ['square', 'Square'], ['rounded', 'Rounded'], ['circle', 'Circle'], ['diamond', 'Diamond'], ['hex', 'Hexagon'], ['star', 'Star'], ['shield', 'Shield'], ['arch', 'Arch']];
    var RULES = [['same', 'Same'], ['checker', 'Checker'], ['rows', 'Rows'], ['cols', 'Columns'], ['diag', 'Diagonal'], ['frame', 'Frame'], ['random', 'Random']];
    var REPS = [['block', 'Block'], ['halfdrop', 'Half-drop'], ['halfbrick', 'Half-brick'], ['mirror', 'Mirror']];
    var PICKS = [['cell', 'Square'], ['row', 'Row'], ['col', 'Column'], ['all', 'All'], ['match', 'Same']];
    var TILE_TOOLS = [['grid', 'Grid'], ['mix', 'Mix'], ['repeat', 'Repeat'], ['ground', 'Ground'], ['pics', 'Pictures']];
    var CELL_TOOLS = [['el', 'Element'], ['ink', 'Ink'], ['shape', 'Shape'], ['back', 'Back'], ['size', 'Size']];
    var NEXT = { el: 'ink', words: 'ink', ink: 'shape', shape: 'back' };
    var MAXPICS = 24;

    function rec(o) { return Object.assign({ el: 'logo', txt: 'NC', font: 'FS Archivo Black', ink: '#1a1a1a', back: 'none', bcol: '#c8412f', size: .72, turn: 0, flip: 'none', nx: 0, ny: 0, tint: false }, o || {}); }
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function B() {
      if (!S.blk || !S.blk.cells) {
        var a = rec(), b = rec({ el: 'dots', ink: '#c8412f', size: .5 });
        S.blk = { n: 3, tileIn: 3, ground: '#f3efe6', rep: 'block', dir: 'both', words: 'readable', rule: 'checker', uses: 2, pick: 'cell', sel: [], anchor: -1, tool: 'grid', seed: 5, lib: [], cells: [] };
        for (var i = 0; i < 9; i++) S.blk.cells.push(clone(((Math.floor(i / 3) + i % 3) % 2) ? b : a));
      }
      return S.blk;
    }
    function n() { return B().n; }

    /* ---------- pictures kept on this phone ---------- */
    var LIB = {}, libVer = 0, pcache = {};
    function loadLib() {
      return Promise.all(B().lib.map(function (it) { return X.idbGet('lib:' + it.id).then(function (b) { return b ? X.blobToCanvas(b) : null; }).then(function (c) { if (c) LIB[it.id] = c; }); }))
        .then(function () { B().lib = B().lib.filter(function (it) { return LIB[it.id]; }); libVer++; pcache = {}; });
    }
    function addCanvas(c) {
      var k = Math.min(1, 1000 / Math.max(c.width, c.height)), c2 = E.cv(c.width * k, c.height * k); c2.getContext('2d').drawImage(c, 0, 0, c2.width, c2.height);
      var id = Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
      LIB[id] = c2; B().lib.push({ id: id, white: true }); libVer++;
      return new Promise(function (res) { c2.toBlob(function (b) { if (b) X.idbSet('lib:' + id, b).then(function () { res(id); }); else res(id); }, 'image/png'); });
    }
    function addFiles(files) {
      var list = Array.prototype.slice.call(files || []).slice(0, Math.max(0, MAXPICS - B().lib.length)), last = null;
      return list.reduce(function (p, f) {
        return p.then(function () {
          var crop = window.nocivCrop ? window.nocivCrop(f, { title: 'Crop this picture', aspects: [['free', 'Free'], ['orig', 'Original'], [1, 'Square']], maxPx: 1400 }).catch(function () { return null; }) : X.blobToCanvas(f);
          return crop.then(function (c) { if (c) return addCanvas(c).then(function (id) { last = id; }); });
        });
      }, Promise.resolve()).then(function () { return last; });
    }
    function picCanvas(id, tintCol) {
      var src = LIB[id], it = B().lib.filter(function (x) { return x.id === id; })[0]; if (!src) return null;
      var key = id + (it && it.white ? 'w' : '') + (tintCol || '') + libVer; if (pcache[key]) return pcache[key];
      var c = E.cv(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0);
      if ((it && it.white) || tintCol) {
        var im = g.getImageData(0, 0, c.width, c.height), d = im.data, ink = tintCol ? E.hex(tintCol) : null;
        for (var i = 0; i < d.length; i += 4) {
          var L = (d[i] * .2126 + d[i + 1] * .7152 + d[i + 2] * .0722) / 255;
          if (it && it.white && L > .88) d[i + 3] = Math.round(d[i + 3] * Math.max(0, (1 - L) / .12));
          if (ink) { var a = Math.round((1 - L) * d[i + 3]); d[i] = ink[0]; d[i + 1] = ink[1]; d[i + 2] = ink[2]; d[i + 3] = it && it.white ? Math.min(d[i + 3], a * 1.3) : d[i + 3]; }
        }
        g.putImageData(im, 0, 0);
      }
      return (pcache[key] = c);
    }
    var lcache = {};
    function logoCanvas(knock, ink) {
      var key = JSON.stringify(S.logo) + knock + ink; if (lcache.k === key) return lcache.c;
      var c = X.renderLogo(S.logo, [knock, ink], 360); lcache = { k: key, c: c }; return c;
    }

    /* ---------- drawing one square ---------- */
    function wordy(r) { return r.el === 'text' || r.el === 'logo' || r.el.indexOf('p:') === 0; }
    function backPath(g, kind, R) {
      if (kind === 'square') { g.beginPath(); g.rect(-R, -R, 2 * R, 2 * R); return; }
      X.shapePath(g, kind === 'rounded' ? 'square' : kind, R * .98);
    }
    // layer 2: the backdrop. fx, fy = this copy is a mirror; shapes always mirror (they are not words)
    function drawBack(g, r, s, fx, fy) {
      if (r.back === 'none') return;
      g.save(); g.scale(fx ? -1 : 1, fy ? -1 : 1); backPath(g, r.back, s / 2); g.fillStyle = r.bcol; g.fill(); g.restore();
    }
    // layer 3: the element. mode 'flip' mirrors everything, 'readable' never flips it, 'shapes' flips all but words, logos and pictures
    function drawEl(g, r, s, fx, fy, mode, ground) {
      if (r.el === 'empty') return;
      var mx = mode === 'flip' || (mode === 'shapes' && !wordy(r)) ? fx : false, my = mode === 'flip' || (mode === 'shapes' && !wordy(r)) ? fy : false;
      var sz = r.size * s, ang = r.turn * (fx !== fy ? -1 : 1) * Math.PI / 180;
      g.save();
      g.translate(r.nx * s * (fx ? -1 : 1), r.ny * s * (fy ? -1 : 1));
      var pattern = /^(solid|dots|lines|cross)$/.test(r.el);
      if (pattern) { // pattern pieces stay inside their square (or their backdrop shape)
        g.save(); g.translate(-r.nx * s * (fx ? -1 : 1), -r.ny * s * (fy ? -1 : 1)); g.scale(fx ? -1 : 1, fy ? -1 : 1);
        if (r.back !== 'none') backPath(g, r.back, s / 2); else { g.beginPath(); g.rect(-s / 2, -s / 2, s, s); }
        g.restore(); g.clip();
      }
      g.rotate(ang);
      var ux = (mx ? -1 : 1) * (r.flip === 'x' ? -1 : 1), uy = (my ? -1 : 1) * (r.flip === 'y' ? -1 : 1); g.scale(ux, uy);
      g.fillStyle = r.ink; g.strokeStyle = r.ink;
      if (r.el === 'logo') { var lc = logoCanvas(r.back !== 'none' ? r.bcol : ground, r.ink); g.drawImage(lc, -sz / 2, -sz / 2, sz, sz); }
      else if (r.el === 'text') {
        var t = (r.txt || '').slice(0, 16); if (t) { var fs = sz * .62, fam = "'" + r.font + "', sans-serif"; g.font = fs + 'px ' + fam; var w = g.measureText(t).width; fs = Math.min(fs, fs * sz / Math.max(1, w)); g.font = fs + 'px ' + fam; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 0, 0); }
      }
      else if (r.el.indexOf('i:') === 0) X.iconDraw(g, r.el.slice(2), sz / 2, r.ink);
      else if (r.el.indexOf('p:') === 0) { var pc = picCanvas(r.el.slice(2), r.tint ? r.ink : null); if (pc) { var k = sz / Math.max(pc.width, pc.height); g.drawImage(pc, -pc.width * k / 2, -pc.height * k / 2, pc.width * k, pc.height * k); } }
      else if (r.el === 'ring') { g.lineWidth = sz * .12; g.beginPath(); g.arc(0, 0, sz * .42, 0, 7); g.stroke(); }
      else if (r.el === 'solid') g.fillRect(-sz / 2, -sz / 2, sz, sz);
      else if (r.el === 'dots') { var q = 3, rr = sz / q * .3; for (var i = 0; i < q; i++) for (var j = 0; j < q; j++) { g.beginPath(); g.arc(-sz / 2 + (i + .5) * sz / q, -sz / 2 + (j + .5) * sz / q, rr, 0, 7); g.fill(); } }
      else if (r.el === 'lines' || r.el === 'cross') {
        g.lineWidth = Math.max(1, sz * .06); var h = sz / 2;
        for (var k2 = -sz; k2 <= sz; k2 += sz / 5) { g.beginPath(); g.moveTo(k2 - h, -h); g.lineTo(k2 + h, h); g.stroke(); if (r.el === 'cross') { g.beginPath(); g.moveTo(k2 + h, -h); g.lineTo(k2 - h, h); g.stroke(); } }
      }
      g.restore();
    }

    /* ---------- the repeat tile ---------- */
    function copies() {
      var b = B(), rp = b.rep;
      if (rp === 'halfdrop') return { w: 2, h: 1, c: [[0, 0, 0, 0], [1, .5, 0, 0]] };
      if (rp === 'halfbrick') return { w: 1, h: 2, c: [[0, 0, 0, 0], [.5, 1, 0, 0]] };
      if (rp === 'mirror') {
        if (b.dir === 'lr') return { w: 2, h: 1, c: [[0, 0, 0, 0], [1, 0, 1, 0]] };
        if (b.dir === 'ud') return { w: 1, h: 2, c: [[0, 0, 0, 0], [0, 1, 0, 1]] };
        return { w: 2, h: 2, c: [[0, 0, 0, 0], [1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 1, 1]] };
      }
      return { w: 1, h: 1, c: [[0, 0, 0, 0]] };
    }
    function tile(ppi) {
      var b = B(), N = b.n, Bp = Math.max(N * 2, Math.round(b.tileIn * ppi)), cs = Bp / N, cp = copies(), W = Bp * cp.w, H = Bp * cp.h;
      var c = E.cv(W, H), g = c.getContext('2d'), mode = b.rep === 'mirror' ? b.words : 'flip';
      g.fillStyle = b.ground; g.fillRect(0, 0, W, H);
      // pass 1 backdrops, pass 2 elements: an element that grows past its square sits on top of the neighbor
      [0, 1].forEach(function (pass) {
        cp.c.forEach(function (cc) {
          var fx = !!cc[2], fy = !!cc[3];
          b.cells.forEach(function (r, i) {
            var row = Math.floor(i / N), col = i % N, cx = fx ? N - 1 - col : col, cy = fy ? N - 1 - row : row;
            var x = cc[0] * Bp + (cx + .5) * cs, y = cc[1] * Bp + (cy + .5) * cs;
            var reach = pass ? cs * Math.max(1, r.size) * .75 + (Math.abs(r.nx) + Math.abs(r.ny)) * cs : cs * .75;
            E.wrapDraw(g, W, H, x, y, reach, function (gg) { if (pass) drawEl(gg, r, cs, fx, fy, mode, b.ground); else drawBack(gg, r, cs, fx, fy); });
          });
        });
      });
      return c;
    }

    /* ---------- selection ---------- */
    function selectFrom(a) {
      var b = B(), N = b.n, rr = Math.floor(a / N), cc = a % N, out = [];
      if (a < 0) { b.sel = []; b.anchor = -1; return; }
      b.cells.forEach(function (r, i) {
        var ok = b.pick === 'all' || (b.pick === 'row' && Math.floor(i / N) === rr) || (b.pick === 'col' && i % N === cc) || (b.pick === 'cell' && i === a) || (b.pick === 'match' && r.el === b.cells[a].el);
        if (ok) out.push(i);
      });
      b.sel = out; b.anchor = a;
    }
    function cur() { var b = B(); return b.cells[b.anchor >= 0 ? b.anchor : 0]; }
    function setF(f, v) { var b = B(); b.sel.forEach(function (i) { b.cells[i][f] = v; }); }
    function addF(f, d, lo, hi) { var b = B(); b.sel.forEach(function (i) { var c = b.cells[i]; c[f] = Math.max(lo, Math.min(hi, Math.round((c[f] + d) * 100) / 100)); }); }

    /* ---------- mix rules ---------- */
    function recipes(k) {
      var b = B(), out = [], seen = {};
      b.cells.forEach(function (r) { var key = JSON.stringify(r); if (!seen[key] && out.length < k) { seen[key] = 1; out.push(clone(r)); } });
      // not enough different squares yet: add ones that are not already in use
      var extra = [rec({ el: 'i:star', ink: '#c8412f', size: .5 }), rec({ el: 'ring', ink: '#1a1a1a', size: .5 }), rec({ el: 'dots', ink: '#1a1a1a', size: .5 }), rec({ el: 'i:heart', ink: '#c8412f', size: .5 }), rec({ el: 'empty' })];
      extra.forEach(function (x) { var key = JSON.stringify(x); if (out.length < k && !seen[key]) { seen[key] = 1; out.push(x); } });
      return out;
    }
    function slotOf(rule, r, c, N, k, R) {
      if (rule === 'same') return 0;
      if (rule === 'checker') return (r + c) % 2;
      if (rule === 'rows') return r % k;
      if (rule === 'cols') return c % k;
      if (rule === 'diag') return (r + c) % k;
      if (rule === 'frame') { var edge = r === 0 || c === 0 || r === N - 1 || c === N - 1; if (edge) return 0; if (k > 2 && N % 2 && r === (N - 1) / 2 && c === (N - 1) / 2) return 2; return 1; }
      return Math.floor(R() * k);
    }
    function applyRule() {
      var b = B(), N = b.n, k = b.rule === 'checker' ? 2 : b.rule === 'same' ? 1 : b.uses, rs = recipes(Math.max(k, b.uses)), R = E.rng(b.seed || 5);
      b.cells = b.cells.map(function (_, i) { return clone(rs[slotOf(b.rule, Math.floor(i / N), i % N, N, k, R)]); });
    }
    function resize(nn) {
      var b = B(), old = b.n, oc = b.cells; if (nn === old) return;
      var cs = []; for (var i = 0; i < nn * nn; i++) { var r = Math.floor(i / nn), c = i % nn; cs.push(clone(oc[(r % old) * old + (c % old)])); }
      b.tileIn = Math.round(b.tileIn / old * nn * 4) / 4; b.n = nn; b.cells = cs; b.sel = []; b.anchor = -1;
    }

    /* ---------- the Tile view (editing) ---------- */
    var HIT = null;
    function drawTile(g, W, H) {
      var b = B(), N = b.n, u = W / 390, left = (X.step() === 1 ? 58 : 8) * u, aw = W - left - 8 * u, zoom = b.sel.length === 1 && b.pick === 'cell' && b.anchor >= 0;
      var bpx = zoom ? Math.min(aw, H) * .5 * N : Math.min(aw * .86, H * .8), ppi = bpx / b.tileIn, cs = bpx / N;
      var t = tile(ppi), ox, oy;
      if (zoom) { var ar = Math.floor(b.anchor / N), ac = b.anchor % N; ox = left + aw / 2 - (ac + .5) * cs; oy = H / 2 - (ar + .5) * cs; }
      else { ox = left + (aw - bpx) / 2; oy = (H - bpx) / 2; }
      g.fillStyle = '#e7e2d6'; g.fillRect(0, 0, W, H);
      g.save(); var tx = ((ox % t.width) + t.width) % t.width - t.width, ty = ((oy % t.height) + t.height) % t.height - t.height; g.translate(tx, ty); g.fillStyle = g.createPattern(t, 'repeat'); g.fillRect(0, 0, W + t.width * 2, H + t.height * 2); g.restore();
      // fade everything that is not the block you are editing, so the seams still show
      g.fillStyle = 'rgba(243,239,230,.6)'; g.fillRect(0, 0, W, Math.max(0, oy)); g.fillRect(0, oy + bpx, W, H); g.fillRect(0, oy, Math.max(0, ox), bpx); g.fillRect(ox + bpx, oy, W, bpx);
      // the grid (a guide, never printed)
      g.save(); g.strokeStyle = 'rgba(26,26,26,.35)'; g.lineWidth = Math.max(1, u); g.setLineDash([4 * u, 3 * u]);
      for (var k = 1; k < N; k++) { g.beginPath(); g.moveTo(ox + k * cs, oy); g.lineTo(ox + k * cs, oy + bpx); g.stroke(); g.beginPath(); g.moveTo(ox, oy + k * cs); g.lineTo(ox + bpx, oy + k * cs); g.stroke(); }
      g.setLineDash([]); g.strokeStyle = '#1a1a1a'; g.lineWidth = 2 * u; g.strokeRect(ox, oy, bpx, bpx);
      b.sel.forEach(function (i) { var x = ox + (i % N) * cs, y = oy + Math.floor(i / N) * cs; g.strokeStyle = '#fff'; g.lineWidth = 5 * u; g.strokeRect(x + 2.5 * u, y + 2.5 * u, cs - 5 * u, cs - 5 * u); g.strokeStyle = '#c8412f'; g.lineWidth = 3 * u; g.strokeRect(x + 2.5 * u, y + 2.5 * u, cs - 5 * u, cs - 5 * u); });
      g.restore();
      HIT = { ox: ox, oy: oy, cs: cs, N: N };
      var sq = b.tileIn / N;
      X.tag(b.sel.length ? (b.sel.length === 1 ? 'Square ' + (Math.floor(b.anchor / N) + 1) + '-' + (b.anchor % N + 1) + ', ' + X.fmtIn(sq) + '. Drag on it to nudge.' : b.sel.length + ' squares picked. Tap the picture to change.') : N + ' x ' + N + ' block, ' + X.fmtIn(b.tileIn) + '. Each square ' + X.fmtIn(sq) + '. Tap a square.');
    }
    function hitCell(px, py) { if (!HIT) return -2; var c = Math.floor((px - HIT.ox) / HIT.cs), r = Math.floor((py - HIT.oy) / HIT.cs); if (c < 0 || r < 0 || c >= HIT.N || r >= HIT.N) return -1; return r * HIT.N + c; }
    // pointer: a tap picks, a drag on a picked square nudges its element
    var P = null;
    function down(px, py) { P = { x: px, y: py, moved: false, cell: hitCell(px, py) }; return true; }
    function move(px, py) {
      if (!P) return; var b = B(), dx = px - P.x, dy = py - P.y;
      if (!P.moved && Math.hypot(dx, dy) < 8) return; P.moved = true;
      if (P.cell < 0 || b.sel.indexOf(P.cell) < 0) return;
      b.sel.forEach(function (i) { var c = b.cells[i]; c.nx = Math.max(-1, Math.min(1, c.nx + dx / HIT.cs)); c.ny = Math.max(-1, Math.min(1, c.ny + dy / HIT.cs)); });
      P.x = px; P.y = py; X.draw();
    }
    function up() {
      if (!P) return; var p = P, b = B(); P = null;
      if (p.moved) { b.sel.forEach(function (i) { var c = b.cells[i]; c.nx = Math.round(c.nx * 100) / 100; c.ny = Math.round(c.ny * 100) / 100; }); X.changed(true); return; }
      if (p.cell === -1) { selectFrom(-1); b.tool = 'grid'; X.changed(true); return; }
      if (p.cell >= 0) { var was = b.sel.length; selectFrom(p.cell); if (!was || TILE_TOOLS.some(function (t) { return t[0] === b.tool; })) b.tool = 'el'; X.changed(true); }
    }

    /* ---------- toolbar and panes ---------- */
    function toolbar() {
      var b = B(), list = b.sel.length ? [['out', 'Tile']].concat(CELL_TOOLS) : TILE_TOOLS, t = b.tool === 'words' ? 'el' : b.tool;
      return list.map(function (x) { return '<button type="button" data-bt="' + x[0] + '" aria-pressed="' + (x[0] === t) + '"' + (x[0] === 'out' ? ' class="out"' : '') + '>' + bico(x[0]) + '<span>' + x[1] + '</span></button>'; }).join('');
    }
    function toolName() { var b = B(), all = TILE_TOOLS.concat(CELL_TOOLS, [['words', 'Words']]); return (all.filter(function (x) { return x[0] === b.tool; })[0] || ['', 'Block'])[1]; }
    function pickRow() { return '<div class="row"><b>Change</b>' + X.seg('bpick', PICKS, B().pick) + '</div>'; }
    function swatches(attr, curV) {
      var used = colorsList(), all = []; used.concat(SWATCH).forEach(function (h) { h = X.toHex(h); if (all.indexOf(h) < 0) all.push(h); });
      return '<div class="bsw">' + all.slice(0, 22).map(function (h) { return '<button type="button" data-' + attr + '="' + h + '" style="background:' + h + '" aria-label="' + h + '" aria-pressed="' + (X.toHex(curV) === h) + '"></button>'; }).join('') + '<label class="hwpick" aria-label="Any color"><input type="color" data-bpk="' + attr + '" value="' + X.toHex(curV) + '">+</label></div><p class="note">' + X.toHex(curV).toUpperCase() + '</p>';
    }
    function elList() {
      var L = [['logo', 'Logo'], ['text', 'Words']];
      X.ICONS.forEach(function (ic) { if (ic[0] !== 'none') L.push(['i:' + ic[0], ic[1]]); });
      B().lib.forEach(function (it, i) { L.push(['p:' + it.id, 'Pic ' + (i + 1)]); });
      return L.concat(PATS);
    }
    function paneHtml() {
      var b = B(), t = b.tool, r = cur();
      if (t === 'grid') return X.stepper('bn', 'Squares', b.n, b.n + ' x ' + b.n) + X.stepper('btile', 'Tile', b.tileIn, X.fmtIn(b.tileIn)) +
        '<p class="note">Each square is ' + X.fmtIn(b.tileIn / b.n) + '. The block saves at 150 DPI: ' + Math.round(b.tileIn * 150) + ' px' + (b.rep !== 'block' ? ', the repeat tile is bigger because of ' + b.rep.replace('half', 'half-') : '') + '.</p><p class="note">Tap a square on the picture to change it. Tap outside the block to come back here.</p>';
      if (t === 'mix') return '<div class="grid g4 tight">' + RULES.map(function (x) { return '<button type="button" class="pick" data-brule="' + x[0] + '" aria-pressed="' + (b.rule === x[0]) + '"><canvas data-bmini="rule:' + x[0] + '" width="96" height="60"></canvas>' + x[1] + '</button>'; }).join('') + '</div>' +
        (b.rule === 'checker' || b.rule === 'same' ? '' : '<div class="row" style="margin-top:8px"><b>Uses</b>' + X.seg('buses', [['2', '2 kinds'], ['3', '3 kinds'], ['4', '4 kinds']], String(b.uses)) + '</div>') +
        (b.rule === 'random' ? '<button type="button" class="btn" data-bact="shuffle" style="padding:9px;margin-top:4px">Shuffle</button>' : '') +
        '<p class="note">Takes the different squares you already made, first one first, and lays them out this way. Then tap a row or a square to change it.</p>';
      if (t === 'repeat') return '<div class="row"><b>Repeat</b>' + X.seg('brep', REPS, b.rep) + '</div>' +
        (b.rep === 'mirror' ? '<div class="row"><b>Mirror</b>' + X.seg('bdir', [['both', 'Both ways'], ['lr', 'Left-right'], ['ud', 'Up-down']], b.dir) + '</div><div class="row"><b>Words</b>' + X.seg('bwords', [['readable', 'Readable'], ['shapes', 'Shapes only'], ['flip', 'True mirror']], b.words) + '</div>' +
          '<p class="note">' + { readable: 'The squares mirror, every element stays the right way round. Words read. Nudge an element toward the edge to make copies meet.', shapes: 'Icons, pattern pieces and backdrops flip. Words, logos and pictures stay readable.', flip: 'Everything flips like a real mirror. Words read backwards. Best for symbols.' }[b.words] + '</p>'
          : '<p class="note">' + { block: 'The block sits in straight rows and columns.', halfdrop: 'Every other column drops half a block. Hides the grid. Nothing flips.', halfbrick: 'Every other row slides half a block, like bricks. Nothing flips.' }[b.rep] + '</p>');
      if (t === 'ground') return '<p class="h">Ground, under everything</p>' + swatches('bgr', b.ground);
      if (t === 'pics') {
        var sel = b.picSel;
        return '<div class="grid g5 tight">' + b.lib.map(function (it, i) { return '<button type="button" class="pick" data-bpic="' + it.id + '" aria-pressed="' + (sel === it.id) + '"><canvas data-bmini="pic:' + it.id + '" width="96" height="72"></canvas>' + (i + 1) + '</button>'; }).join('') +
          (b.lib.length < MAXPICS ? '<button type="button" class="pick" data-bact="addpic"><svg class="sm" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Add</button>' : '') + '</div>' +
          (sel && LIB[sel] ? '<div class="row" style="margin-top:8px"><b>White</b>' + X.seg('bwhite', [['1', 'Remove white'], ['0', 'Keep it']], b.lib.filter(function (x) { return x.id === sel; })[0].white ? '1' : '0') + '</div><button type="button" class="btn" data-bact="delpic" style="padding:9px">Remove this picture</button>' : '') +
          '<p class="note">Add as many as you like (up to ' + MAXPICS + '), several at once. Each one is cropped first. They stay on this phone.</p>';
      }
      if (t === 'el') return pickRow() + '<div class="grid g6 tight bels">' + elList().map(function (x) { return '<button type="button" class="pick" data-bel="' + x[0] + '" aria-pressed="' + (r.el === x[0]) + '"><canvas data-bmini="el:' + x[0] + '" width="72" height="56"></canvas>' + esc(x[1]) + '</button>'; }).join('') +
        (b.lib.length < MAXPICS ? '<button type="button" class="pick" data-bact="addpic"><svg class="sm" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Picture</button>' : '') + '</div>';
      if (t === 'words') return pickRow() + '<div class="row"><input class="txt" id="btext" maxlength="16" value="' + esc(r.txt) + '" placeholder="Type words" autocomplete="off"></div><div class="grid g5 tight">' + X.FONTS.map(function (f) { return '<button type="button" class="pick" data-bfont="' + f[0] + '" aria-pressed="' + (r.font === f[0]) + '"><span style="font:17px/1.1 \'' + f[0] + '\',sans-serif">' + esc((r.txt || 'Aa').slice(0, 3)) + '</span></button>'; }).join('') + '</div><button type="button" class="btn dark" data-bt="ink" style="margin-top:8px;padding:10px">Next: Ink</button>';
      if (t === 'ink') return pickRow() + swatches('bink', r.ink) + (r.el.indexOf('p:') === 0 ? '<div class="row"><b>Picture</b>' + X.seg('btint', [['0', 'As it is'], ['1', 'One color']], r.tint ? '1' : '0') + '</div>' : '');
      if (t === 'shape') return pickRow() + '<div class="grid g5 tight">' + SHAPES.map(function (x) { return '<button type="button" class="pick" data-bshape="' + x[0] + '" aria-pressed="' + (r.back === x[0]) + '"><canvas data-bmini="shape:' + x[0] + '" width="72" height="56"></canvas>' + x[1] + '</button>'; }).join('') + '</div><p class="note">The backdrop sits behind the element, inside the square.</p>';
      if (t === 'back') return pickRow() + (r.back === 'none' ? '<p class="note" style="margin:0 0 8px">No backdrop yet. Picking a color here gives it a square.</p>' : '') + swatches('bbk', r.bcol);
      if (t === 'size') return pickRow() + X.stepper('bsize', 'Size', r.size, Math.round(r.size * 100) + '%') + X.stepper('bturn', 'Turn', r.turn, r.turn + '°') +
        X.stepper('bnx', 'Across', r.nx, nudgeTxt(r.nx, b.tileIn / b.n)) + X.stepper('bny', 'Down', r.ny, nudgeTxt(r.ny, b.tileIn / b.n)) +
        '<div class="row"><b>Flip</b>' + X.seg('bflip', [['none', 'None'], ['x', 'Across'], ['y', 'Down']], r.flip) + '</div><button type="button" class="btn" data-bact="center" style="padding:9px">Center it</button>';
      return '';
    }
    function nudgeTxt(v, sqIn) { return v === 0 ? 'Center' : (v > 0 ? '+' : '') + Math.round(v * 100) + '% (' + (Math.round(v * sqIn * 100) / 100) + ' in)'; }
    function afterPane(root) {
      Array.prototype.forEach.call(root.querySelectorAll('canvas[data-bmini]'), function (c) {
        var id = c.dataset.bmini, i = id.indexOf(':'), what = id.slice(0, i), v = id.slice(i + 1), g = c.getContext('2d'), W = c.width, H = c.height, b = B(), r = cur();
        g.fillStyle = b.ground; g.fillRect(0, 0, W, H);
        try {
          if (what === 'el' || what === 'shape') { var rr = clone(r); if (what === 'el') { rr.el = v; rr.size = Math.max(.6, rr.size); rr.nx = rr.ny = 0; rr.turn = 0; } else { rr.back = v; if (rr.back !== 'none' && X.toHex(rr.bcol) === X.toHex(b.ground)) rr.bcol = '#c8412f'; } var s = Math.min(W, H) * .9; g.save(); g.translate(W / 2, H / 2); drawBack(g, rr, s, false, false); drawEl(g, rr, s, false, false, 'flip', b.ground); g.restore(); }
          else if (what === 'pic') { var pc = picCanvas(v, null); if (pc) { var k = Math.min(W / pc.width, H / pc.height) * .9; g.drawImage(pc, (W - pc.width * k) / 2, (H - pc.height * k) / 2, pc.width * k, pc.height * k); } }
          else if (what === 'rule') { var N = 4, cs = Math.min(W, H) / N, ox = (W - cs * N) / 2, R = E.rng(5), cols = ['#1a1a1a', '#c8412f', '#d4af37', '#8a8780'], k2 = v === 'checker' ? 2 : v === 'same' ? 1 : b.uses; for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { g.fillStyle = cols[slotOf(v, y, x, N, k2, R)]; g.fillRect(ox + x * cs + 1, y * cs + 1, cs - 2, cs - 2); } }
        } catch (e) {}
      });
    }
    function after(t) { var b = B(); b.tool = NEXT[t] && !(t === 'shape' && b.cells[b.anchor >= 0 ? b.anchor : 0].back === 'none') ? NEXT[t] : (t === 'shape' ? 'size' : b.tool); }

    // taps inside the console. Returns true when it was ours.
    function onClick(btn) {
      var d = btn.dataset, b = B(), sg = btn.closest('[data-sg]'), k = sg && sg.dataset.sg;
      if (d.bt) { if (d.bt === 'out') { selectFrom(-1); b.tool = 'grid'; } else b.tool = d.bt; return X.changed(true), true; }
      if (k && k.charAt(0) === 'b' && d.v != null) {
        var v = d.v;
        if (k === 'bpick') { b.pick = v; selectFrom(b.anchor >= 0 ? b.anchor : 0); }
        else if (k === 'buses') { b.uses = +v; applyRule(); }
        else if (k === 'brep') b.rep = v; else if (k === 'bdir') b.dir = v;
        else if (k === 'bwords') b.words = v;
        else if (k === 'bwhite') { var it = b.lib.filter(function (x) { return x.id === b.picSel; })[0]; if (it) { it.white = v === '1'; libVer++; pcache = {}; } }
        else if (k === 'btint') setF('tint', v === '1');
        else if (k === 'bflip') setF('flip', v);
        else return false;
        X.changed(true); return true;
      }
      if (d.brule) { b.rule = d.brule; applyRule(); X.changed(true); return true; }
      if (d.bel) { setF('el', d.bel); if (d.bel === 'text') b.tool = 'words'; else after('el'); X.changed(true); return true; }
      if (d.bfont) { setF('font', d.bfont); X.changed(true); return true; }
      if (d.bink) { setF('ink', d.bink); after('ink'); X.changed(true); return true; }
      if (d.bshape) { setF('back', d.bshape); after('shape'); X.changed(true); return true; }
      if (d.bbk) { if (cur().back === 'none') setF('back', 'square'); setF('bcol', d.bbk); X.changed(true); return true; }
      if (d.bgr) { b.ground = d.bgr; X.changed(true); return true; }
      if (d.bpic) { b.picSel = d.bpic; X.changed(true); return true; }
      if (d.bact === 'addpic') { X.pickFiles(); return true; }
      if (d.bact === 'delpic') { var id = b.picSel; b.lib = b.lib.filter(function (x) { return x.id !== id; }); delete LIB[id]; X.idbDel('lib:' + id); b.cells.forEach(function (c) { if (c.el === 'p:' + id) c.el = 'empty'; }); b.picSel = null; libVer++; X.changed(true); return true; }
      if (d.bact === 'shuffle') { b.seed = Math.floor(Math.random() * 1e6); applyRule(); X.changed(true); return true; }
      if (d.bact === 'center') { setF('nx', 0); setF('ny', 0); X.changed(true); return true; }
      return false;
    }
    function onInput(t) {
      if (t.id === 'btext') { setF('txt', t.value); X.keep(); X.draw(); return true; }
      if (t.dataset.bpk) { var v = t.value, a = t.dataset.bpk; if (a === 'bgr') B().ground = v; else if (a === 'bink') setF('ink', v); else if (a === 'bbk') { if (cur().back === 'none') setF('back', 'square'); setF('bcol', v); } X.keep(); X.draw(); return true; }
      return false;
    }
    var STEPS = {
      bn: function (d) { resize(Math.max(2, Math.min(9, B().n + d))); },
      btile: function (d) { var b = B(); b.tileIn = Math.max(1, Math.min(12, b.tileIn + d * .5)); },
      bsize: function (d) { addF('size', d * .05, .1, 2); },
      bturn: function (d) { var b = B(); b.sel.forEach(function (i) { var c = b.cells[i]; c.turn = (c.turn + d * 15 + 360) % 360; }); },
      bnx: function (d) { addF('nx', d * .05, -1, 1); },
      bny: function (d) { addF('ny', d * .05, -1, 1); }
    };

    /* ---------- colors: every color in the block, swap one and it changes everywhere ---------- */
    function colorsList() {
      var b = B(), out = [X.toHex(b.ground)];
      b.cells.forEach(function (r) { if (r.back !== 'none') push(r.bcol); if (r.el !== 'empty' && !(r.el.indexOf('p:') === 0 && !r.tint)) push(r.ink); });
      function push(h) { h = X.toHex(h); if (out.indexOf(h) < 0) out.push(h); }
      return out;
    }
    function swap(map) {
      var b = B(), f = function (h) { var k = X.toHex(h); return map[k] != null ? map[k] : h; };
      b.ground = f(b.ground); b.cells.forEach(function (r) { r.ink = f(r.ink); r.bcol = f(r.bcol); });
    }
    function setColor(i, v) { var L = colorsList(), m = {}; if (L[i] == null) return; m[L[i]] = v; swap(m); }
    function applyPal(p) { var L = colorsList(), m = {}; L.forEach(function (h, i) { m[h] = p[i % p.length]; }); swap(m); }

    return {
      B: B, tile: tile, drawTile: drawTile, toolbar: toolbar, toolName: toolName, paneHtml: paneHtml, afterPane: afterPane,
      onClick: onClick, onInput: onInput, steps: STEPS, down: down, move: move, up: up,
      colorsList: colorsList, setColor: setColor, applyPal: applyPal, loadLib: loadLib, addFiles: addFiles, addCanvas: addCanvas,
      key: function () { return JSON.stringify([B(), libVer, S.logo]); }, hasPic: function (id) { return !!LIB[id]; }
    };
  };
})();
