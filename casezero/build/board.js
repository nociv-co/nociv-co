// Case Zero carrier board ("Clean it"). One flat two-layer board the Pico solders onto, with labelled pads under every part.
// Input: where the brain and the parts sit, and the pin plan. Output: routed copper, a self-check, and factory files (Gerber + drill) in a zip.
// No outside libraries. Everything is in mm, x right, y up, seen from above (the same frame as the builder).
//
// Rules this file keeps, so a board factory can make it without questions:
//   pads and tracks sit on a 1.27 mm grid (half of the 2.54 mm pin pitch). Tracks only run along the grid, never diagonally.
//   pad 1.6 mm with a 1.0 mm hole, track 0.4 mm, via 1.2 mm with a 0.6 mm hole. Smallest gap anywhere: 0.27 mm (factories ask for 0.13 to 0.2).
//   check() measures every piece of copper against every other one again, without the grid, and follows every connection end to end.
//   If one connection cannot be made or one check fails, no files are written.

export const BR = { P: 1.27, PAD: 1.6, DRILL: 1.0, TRACK: 0.4, VIA: 1.2, VDRILL: 0.6, MOUNT: 2.2, CLR: 0.2, EDGE: 1.1, SILK: 0.15, TH: 1.6 };
const PICO_L = ['GP0', 'GP1', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GND', 'GP6', 'GP7', 'GP8', 'GP9', 'GND', 'GP10', 'GP11', 'GP12', 'GP13', 'GND', 'GP14', 'GP15'];
const PICO_R = ['VBUS', 'VSYS', 'GND', '3V3_EN', '3V3', 'ADC_VREF', 'GP28', 'AGND', 'GP27', 'GP26', 'RUN', 'GP22', 'GND', 'GP21', 'GP20', 'GP19', 'GP18', 'GND', 'GP17', 'GP16'];

// ---------- small geometry ----------
const rotv = (x, y, r) => { r = ((r % 4) + 4) % 4; return r === 0 ? [x, y] : r === 1 ? [-y, x] : r === 2 ? [-x, -y] : [y, -x]; }; // quarter turns, counter clockwise
function pip(poly, x, y) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
function dPS(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy; let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(px - ax - t * dx, py - ay - t * dy); }
function edgeDist(poly, x, y) { let m = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) m = Math.min(m, dPS(x, y, poly[j][0], poly[j][1], poly[i][0], poly[i][1])); return m; }
function dSS(a, b) { // shortest distance between two segments [x1,y1,x2,y2]
  const cross = (ax, ay, bx, by, cx, cy) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d1 = cross(b[0], b[1], b[2], b[3], a[0], a[1]), d2 = cross(b[0], b[1], b[2], b[3], a[2], a[3]), d3 = cross(a[0], a[1], a[2], a[3], b[0], b[1]), d4 = cross(a[0], a[1], a[2], a[3], b[2], b[3]);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  return Math.min(dPS(a[0], a[1], b[0], b[1], b[2], b[3]), dPS(a[2], a[3], b[0], b[1], b[2], b[3]), dPS(b[0], b[1], a[0], a[1], a[2], a[3]), dPS(b[2], b[3], a[0], a[1], a[2], a[3]));
}

// ---------- stroke letters for the print on the board (4 wide, 6 tall) ----------
const O_ = [[1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 1], [3, 0], [1, 0]], P_ = [[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]];
const FONT = {
  A: [[[0, 0], [0, 4], [2, 6], [4, 4], [4, 0]], [[0, 2], [4, 2]]], B: [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]], [[3, 3], [4, 2], [4, 1], [3, 0], [0, 0]]],
  C: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5]]], D: [[[0, 0], [0, 6], [2, 6], [4, 4], [4, 2], [2, 0], [0, 0]]],
  E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]], F: [[[0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
  G: [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0], [3, 0], [4, 1], [4, 3], [2, 3]]], H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[1, 0], [3, 0]], [[2, 0], [2, 6]], [[1, 6], [3, 6]]], J: [[[0, 1], [1, 0], [3, 0], [4, 1], [4, 6]]], K: [[[0, 0], [0, 6]], [[4, 6], [0, 3], [4, 0]]],
  L: [[[0, 6], [0, 0], [4, 0]]], M: [[[0, 0], [0, 6], [2, 3], [4, 6], [4, 0]]], N: [[[0, 0], [0, 6], [4, 0], [4, 6]]], O: [O_], P: [P_],
  Q: [O_, [[2, 2], [4, 0]]], R: [P_, [[2, 3], [4, 0]]], S: [[[0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3], [1, 3], [0, 4], [0, 5], [1, 6], [3, 6], [4, 5]]],
  T: [[[0, 6], [4, 6]], [[2, 6], [2, 0]]], U: [[[0, 6], [0, 1], [1, 0], [3, 0], [4, 1], [4, 6]]], V: [[[0, 6], [2, 0], [4, 6]]], W: [[[0, 6], [1, 0], [2, 3], [3, 0], [4, 6]]],
  X: [[[0, 0], [4, 6]], [[0, 6], [4, 0]]], Y: [[[0, 6], [2, 3], [4, 6]], [[2, 3], [2, 0]]], Z: [[[0, 6], [4, 6], [0, 0], [4, 0]]],
  0: [O_, [[0, 1], [4, 5]]], 1: [[[1, 5], [2, 6], [2, 0]], [[1, 0], [3, 0]]], 2: [[[0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [0, 0], [4, 0]]],
  3: [[[0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3], [1, 3]], [[3, 3], [4, 2], [4, 1], [3, 0], [1, 0], [0, 1]]], 4: [[[3, 0], [3, 6], [0, 2], [4, 2]]],
  5: [[[4, 6], [0, 6], [0, 3], [3, 3], [4, 2], [4, 1], [3, 0], [1, 0], [0, 1]]], 6: [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]]],
  7: [[[0, 6], [4, 6], [1, 0]]], 8: [[[1, 3], [0, 4], [0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3], [1, 3], [0, 2], [0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3]]],
  9: [[[0, 1], [1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 4], [1, 3], [4, 3]]],
  '+': [[[2, 1], [2, 5]], [[0, 3], [4, 3]]], '-': [[[0, 3], [4, 3]]], '.': [[[2, 0], [2, 0.6]]], '/': [[[0, 0], [4, 6]]], ' ': []
};
// text as line pieces. (x, y) = bottom left of the first letter. up: 0 reads left to right, 1 reads bottom to top. mirror: for the back of the board.
export function textStrokes(str, x, y, h, up, mirror) {
  const u = h / 6, out = []; let pen = 0;
  String(str).toUpperCase().split('').forEach((ch) => {
    (FONT[ch] || []).forEach((line) => { for (let i = 1; i < line.length; i++) {
      const p = (q) => { let lx = pen + q[0] * u; const ly = q[1] * u; if (mirror) lx = -lx; return up ? [x - ly, y + lx] : [x + lx, y + ly]; };
      const a = p(line[i - 1]), b = p(line[i]); out.push([a[0], a[1], b[0], b[1]]);
    } });
    pen += 5.6 * u;
  });
  return out;
}
export const textLen = (str, h) => Math.max(0, String(str).length * 5.6 - 1.6) * h / 6;

// ---------- the board ----------
// spec: { keepin: [[x,y],...] one polygon the board must stay inside, posts: [{x,y,r}] round keep-outs (case screw posts),
//   pico: {x,y,r}  (r = quarter turns; r 0 means the USB plug points to -x),
//   zones: [{x0,y0,x1,y1}] no pads here (battery and charger lie on the board), groups: [{ title, x, y, pads: [{ label, net }] }],
//   diode: true to add BAT+ / GND pads and a diode D1 into VSYS, finalize(rect) -> list of closed outlines (outer first), name }
export function makeBoard(spec) {
  const P = BR.P, keep = spec.keepin, errors = [], warnings = [];
  if (!keep || keep.length < 3) return { ok: false, errors: ['No room for a board in this body.'] };
  // grid lined up with the Pico pins
  const pp = spec.pico, picoPads = [];
  PICO_L.forEach((n, i) => { const [dx, dy] = rotv(-24.13 + i * 2.54, -8.89, pp.r || 0); picoPads.push({ name: n, pin: i + 1, x: pp.x + dx, y: pp.y + dy }); });
  PICO_R.forEach((n, j) => { const [dx, dy] = rotv(-24.13 + j * 2.54, 8.89, pp.r || 0); picoPads.push({ name: n, pin: 40 - j, x: pp.x + dx, y: pp.y + dy }); });
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; keep.forEach(([x, y]) => { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); });
  const ox = picoPads[0].x - Math.floor((picoPads[0].x - bx0) / P) * P, oy = picoPads[0].y - Math.floor((picoPads[0].y - by0) / P) * P;
  const nx = Math.floor((bx1 - ox) / P) + 1, ny = Math.floor((by1 - oy) / P) + 1, N = nx * ny;
  if (nx < 8 || ny < 8) return { ok: false, errors: ['This body is too small for a board.'] };
  const X = (i) => ox + i * P, Y = (j) => oy + j * P, I = (x) => Math.round((x - ox) / P), J = (y) => Math.round((y - oy) / P), id = (i, j) => j * nx + i;
  const posts = spec.posts || [];
  const okCell = new Uint8Array(N); // copper may sit here
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const x = X(i), y = Y(j); if (!pip(keep, x, y) || edgeDist(keep, x, y) < BR.EDGE) continue; if (posts.some((q) => Math.hypot(q.x - x, q.y - y) < q.r + BR.EDGE)) continue; okCell[id(i, j)] = 1; }
  // owner of every cell on both layers: 0 free, -1 closed, n = net number. kind: 1 track, 2 pad, 3 via.
  const own = [new Int16Array(N), new Int16Array(N)], kind = [new Uint8Array(N), new Uint8Array(N)];
  for (let k = 0; k < N; k++) if (!okCell[k]) { own[0][k] = -1; own[1][k] = -1; }
  const nets = [null], netId = {}, net = (name) => { if (!netId[name]) { netId[name] = nets.length; nets.push({ name, pads: [], pre: [] }); } return netId[name]; };
  const pads = []; // { x, y, i, j, net, label, group }
  const padAt = new Int32Array(N).fill(-1);
  const addPad = (i, j, netName, label, group) => { const k = id(i, j), n = netName ? net(netName) : 0; pads.push({ x: X(i), y: Y(j), i, j, net: n, label: label || '', group }); padAt[k] = pads.length - 1; own[0][k] = own[1][k] = n || -1; kind[0][k] = kind[1][k] = 2; if (n) nets[n].pads.push(k); return k; };
  // which nets the parts use
  const used = {}; (spec.groups || []).forEach((g) => g.pads.forEach((p) => { used[p.net] = 1; })); if (spec.diode) { used.VSYS = 1; used.GND = 1; }
  // 1. the Pico
  for (const q of picoPads) { const i = I(q.x), j = J(q.y); if (i < 0 || j < 0 || i >= nx || j >= ny || !okCell[id(i, j)]) return { ok: false, errors: ['The brain sits too close to a wall or a corner post for the board to reach all its pins. Move it in a little in Arrange.'] }; }
  const gndSeeds = [];
  picoPads.forEach((q) => { const nm = q.name === 'GND' ? 'GND' : used[q.name] ? q.name : null; const k = addPad(I(q.x), J(q.y), nm, q.name, 'pico'); if (q.name === 'GND') gndSeeds.push(k); });
  if (netId.GND) nets[netId.GND].pre = gndSeeds; // the Pico joins all its GND pins inside itself
  const [phx, phy] = rotv(25.5, 10.5, pp.r || 0), prx = Math.abs(phx) + 3.6, pry = Math.abs(phy) + 3.6; /* pad rows keep clear of the Pico, with room for their names */
  const inPico = (x, y) => Math.abs(x - pp.x) < prx && Math.abs(y - pp.y) < pry, inZone = (x, y) => (spec.zones || []).some((z) => x > z.x0 - 1 && x < z.x1 + 1 && y > z.y0 - 1 && y < z.y1 + 1);
  // 2. pad rows under the parts
  const nearPad = (i, j) => { for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue; if (kind[0][id(ii, jj)] === 2) return true; } return false; };
  const freeForPad = (i, j) => i >= 0 && j >= 0 && i < nx && j < ny && okCell[id(i, j)] && own[0][id(i, j)] === 0 && !nearPad(i, j) && !inPico(X(i), Y(j)) && !inZone(X(i), Y(j));
  const rows = []; // placed rows, for the print
  const placeRow = (g, cellsOf) => { // cellsOf(i, j, vertical) -> [[i, j], ...] for a row that starts at i, j
    const ci = I(g.x), cj = J(g.y), n = g.pads.length; let best = null;
    for (let rad = 0; rad < Math.max(nx, ny) && !best; rad++) for (let b = -rad; b <= rad && !best; b++) for (let a = -rad; a <= rad && !best; a++) {
      if (Math.max(Math.abs(a), Math.abs(b)) !== rad) continue;
      for (const v of [0, 1]) { const span = cellsOf(0, 0, v), last = span[span.length - 1], i0 = ci + a - Math.round(last[0] / 2), j0 = cj + b - Math.round(last[1] / 2), cells = cellsOf(i0, j0, v); if (cells.every(([i, j]) => freeForPad(i, j))) { best = { cells, v }; break; } }
    }
    if (!best) { errors.push('No room on the board for the pads of ' + g.title + '.'); return; }
    best.cells.forEach(([i, j], m) => addPad(i, j, g.pads[m].net, g.pads[m].label, g));
    rows.push({ g, cells: best.cells, v: best.v }); void n;
  };
  (spec.groups || []).slice().sort((a, b) => b.pads.length - a.pads.length).forEach((g) => placeRow(g, (i, j, v) => g.pads.map((_, m) => (v ? [i, j + m * 2] : [i + m * 2, j]))));
  let diode = null;
  if (spec.diode) { // BAT+ and GND pads, then D1 (pads 10.16 mm apart) into VSYS. The stripe end of the diode goes to VSYS.
    const vs = picoPads.find((q) => q.name === 'VSYS'), g = { title: 'BATTERY IN', x: vs.x, y: vs.y, pads: [{ label: 'BAT+', net: 'BAT' }, { label: 'GND', net: 'GND' }, { label: 'D1', net: 'BAT' }, { label: 'D1K', net: 'VSYS' }], isDiode: true };
    const off = [0, 2, 4, 12]; placeRow(g, (i, j, v) => off.map((o) => (v ? [i, j + o] : [i + o, j])));
    diode = rows.find((r) => r.g === g) || null;
  }
  if (errors.length) return { ok: false, errors };
  // 3. four screw holes (M2) near the corners of what is on the board
  let cx0 = 1e9, cy0 = 1e9, cx1 = -1e9, cy1 = -1e9; pads.forEach((p) => { cx0 = Math.min(cx0, p.x); cy0 = Math.min(cy0, p.y); cx1 = Math.max(cx1, p.x); cy1 = Math.max(cy1, p.y); });
  (spec.zones || []).forEach((z) => { cx0 = Math.min(cx0, z.x0); cy0 = Math.min(cy0, z.y0); cx1 = Math.max(cx1, z.x1); cy1 = Math.max(cy1, z.y1); });
  const mounts = [], MK = 3.4; // keep copper this far from a screw
  const mountOk = (i, j) => { if (i < 0 || j < 0 || i >= nx || j >= ny) return false; const x = X(i), y = Y(j); if (!pip(keep, x, y) || edgeDist(keep, x, y) < 3 || posts.some((q) => Math.hypot(q.x - x, q.y - y) < q.r + 3.2) || inPico(x, y) || inZone(x, y)) return false; if (pads.some((p) => Math.hypot(p.x - x, p.y - y) < MK + 0.9)) return false; return !mounts.some((m) => Math.hypot(m.x - x, m.y - y) < 20); };
  [[cx0 - 4, cy0 - 4], [cx1 + 4, cy1 + 4], [cx1 + 4, cy0 - 4], [cx0 - 4, cy1 + 4]].forEach(([tx, ty]) => { let best = null, bd = 1e9; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const d = Math.hypot(X(i) - tx, Y(j) - ty); if (d < bd && mountOk(i, j)) { bd = d; best = [i, j]; } } if (best) mounts.push({ x: X(best[0]), y: Y(best[1]) }); });
  if (mounts.length < 3) return { ok: false, errors: ['No room for the screws that hold the board. Make the body a little bigger.'] };
  mounts.forEach((m) => { for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (Math.hypot(X(i) - m.x, Y(j) - m.y) < MK) { const k = id(i, j); if (kind[0][k] !== 2) { own[0][k] = own[1][k] = -1; } } });

  // 4. route. Dijkstra on the grid, two layers. Top likes to run left-right, bottom up-down, so they stay out of each other's way.
  const snapOwn = () => [own[0].slice(), own[1].slice(), kind[0].slice(), kind[1].slice()], restore = (s) => { own[0].set(s[0]); own[1].set(s[1]); kind[0].set(s[2]); kind[1].set(s[3]); };
  const base = snapOwn(), padNear = new Uint8Array(N);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (kind[0][id(i, j)] === 2) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < nx && jj < ny) padNear[id(ii, jj)] = 1; });
  const viaOk = (k, n) => { const i = k % nx, j = (k / nx) | 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue; const q = id(ii, jj); for (let l = 0; l < 2; l++) if ((kind[l][q] === 2 || kind[l][q] === 3) && own[l][q] !== n) return false; } return true; };
  const DX = [1, -1, 0, 0], DY = [0, 0, 1, -1];
  function routeNet(n, segs, vias) {
    const T = nets[n].pads.slice(); if (!T.length) return true;
    const conn = [new Uint8Array(N), new Uint8Array(N)], pre = nets[n].pre || [];
    const seed = pre.length ? pre : [T[0]]; seed.forEach((k) => { conn[0][k] = conn[1][k] = 1; });
    const first = seed[0], todo = T.filter((k) => !conn[0][k]).sort((a, b) => (Math.abs(a % nx - first % nx) + Math.abs(((a / nx) | 0) - ((first / nx) | 0))) - (Math.abs(b % nx - first % nx) + Math.abs(((b / nx) | 0) - ((first / nx) | 0))));
    const dist = new Float64Array(2 * N), prev = new Int32Array(2 * N); /* Float64: a rounded Float32 cost can look cheaper than itself and loop the walk back */
    for (const t of todo) {
      dist.fill(1e9); prev.fill(-1); const heap = []; // small binary heap of [cost, node]
      const push = (c, v) => { heap.push([c, v]); let q = heap.length - 1; while (q > 0) { const p = (q - 1) >> 1; if (heap[p][0] <= heap[q][0]) break; const s = heap[p]; heap[p] = heap[q]; heap[q] = s; q = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let q = 0; for (;;) { const a = 2 * q + 1, b = a + 1; let m = q; if (a < heap.length && heap[a][0] < heap[m][0]) m = a; if (b < heap.length && heap[b][0] < heap[m][0]) m = b; if (m === q) break; const s = heap[m]; heap[m] = heap[q]; heap[q] = s; q = m; } } return top; };
      dist[t] = 0; dist[N + t] = 0; push(0, t); push(0, N + t); let hit = -1;
      while (heap.length) {
        const [c, v] = pop(); if (c > dist[v]) continue; const l = v >= N ? 1 : 0, k = v - l * N;
        if (conn[l][k]) { hit = v; break; }
        const i = k % nx, j = (k / nx) | 0;
        for (let d = 0; d < 4; d++) { const ii = i + DX[d], jj = j + DY[d]; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue; const q = id(ii, jj), o = own[l][q]; if (o !== 0 && o !== n) continue;
          const w = c + 1 + ((l === 0) === (d < 2) ? 0 : 0.35) + (padNear[q] && o === 0 ? 0.4 : 0); if (w < dist[l * N + q]) { dist[l * N + q] = w; prev[l * N + q] = v; push(w, l * N + q); } }
        const ol = 1 - l, oo = own[ol][k]; // change layer: free at our own pads and vias, a new via anywhere else it fits
        if (oo === 0 || oo === n) { const mine = (kind[l][k] === 2 || kind[l][k] === 3) && own[l][k] === n; if (mine || (own[l][k] === 0 || own[l][k] === n) && kind[ol][k] !== 2 && viaOk(k, n)) { const w = c + (mine ? 0 : 12); if (w < dist[ol * N + k]) { dist[ol * N + k] = w; prev[ol * N + k] = v; push(w, ol * N + k); } } }
      }
      if (hit < 0) return false;
      for (let v = hit; v !== -1; v = prev[v]) { // walk back to the pad, laying copper
        const l = v >= N ? 1 : 0, k = v - l * N, p = prev[v]; conn[l][k] = 1;
        if (own[l][k] === 0) { own[l][k] = n; kind[l][k] = 1; }
        if (p !== -1) { const pl = p >= N ? 1 : 0, pk = p - pl * N;
          if (pk === k) { if (kind[0][k] !== 2 && kind[0][k] !== 3) { kind[0][k] = kind[1][k] = 3; own[0][k] = own[1][k] = n; vias.push({ k, net: n }); } conn[0][k] = conn[1][k] = 1; }
          else segs.push({ l, a: k, b: pk, net: n }); }
      }
      if (kind[0][t] === 2) conn[0][t] = conn[1][t] = 1;
    }
    return true;
  }
  const span = (n) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; nets[n].pads.concat(nets[n].pre || []).forEach((k) => { a = Math.min(a, k % nx); c = Math.max(c, k % nx); b = Math.min(b, (k / nx) | 0); d = Math.max(d, (k / nx) | 0); }); return c - a + d - b; };
  let order = []; for (let n = 1; n < nets.length; n++) order.push(n);
  const rank = (n) => (nets[n].name === 'GND' ? 2e6 : nets[n].name === '3V3' || nets[n].name === 'VBUS' ? 1e6 : 0) + span(n);
  order.sort((a, b) => rank(a) - rank(b));
  let segs = [], vias = [], failed = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    restore(base); segs = []; vias = []; failed = null;
    for (const n of order) if (!routeNet(n, segs, vias)) { failed = n; break; }
    if (failed == null) break;
    order = [failed].concat(order.filter((n) => n !== failed)); // the one that got boxed in goes first next time
  }
  if (failed != null) return { ok: false, errors: ['Could not connect ' + (nets[failed].name === 'GND' ? 'ground' : nets[failed].name) + ' to every part. Spread the parts out a little, or make the body bigger, and try again.'] };

  // 5. real geometry
  const cellXY = (k) => [X(k % nx), Y((k / nx) | 0)];
  const tracks = segs.map((s) => { const a = cellXY(s.a), b = cellXY(s.b); return { l: s.l, net: s.net, x1: a[0], y1: a[1], x2: b[0], y2: b[1] }; });
  const viaList = vias.map((v) => { const p = cellXY(v.k); return { x: p[0], y: p[1], net: v.net }; });
  // board edge: only as big as what is on it
  let ex0 = 1e9, ey0 = 1e9, ex1 = -1e9, ey1 = -1e9; const grow = (x, y, r) => { ex0 = Math.min(ex0, x - r); ey0 = Math.min(ey0, y - r); ex1 = Math.max(ex1, x + r); ey1 = Math.max(ey1, y + r); };
  pads.forEach((p) => grow(p.x, p.y, 3)); viaList.forEach((v) => grow(v.x, v.y, 3)); tracks.forEach((t) => { grow(t.x1, t.y1, 2.5); grow(t.x2, t.y2, 2.5); }); mounts.forEach((m) => grow(m.x, m.y, 3.6)); (spec.zones || []).forEach((z) => { grow(z.x0, z.y0, 1); grow(z.x1, z.y1, 1); });
  const edges = spec.finalize ? spec.finalize({ x0: ex0, y0: ey0, x1: ex1, y1: ey1 }) : [[[ex0, ey0], [ex1, ey0], [ex1, ey1], [ex0, ey1]]];
  if (!edges || !edges.length) return { ok: false, errors: ['The board outline came out empty.'] };
  let ax0 = 1e9, ay0 = 1e9, ax1 = -1e9, ay1 = -1e9; edges[0].forEach(([x, y]) => { ax0 = Math.min(ax0, x); ay0 = Math.min(ay0, y); ax1 = Math.max(ax1, x); ay1 = Math.max(ay1, y); });

  // the print: labels, the Pico outline, the diode
  const silk = [], silkB = [];
  const line = (a, b, c, d) => silk.push([a, b, c, d]), box = (x0, y0, x1, y1) => { line(x0, y0, x1, y0); line(x1, y0, x1, y1); line(x1, y1, x0, y1); line(x0, y1, x0, y0); };
  rows.forEach(({ g, cells, v }) => {
    const pts = cells.map(([i, j]) => [X(i), Y(j)]), a = pts[0], b = pts[pts.length - 1];
    if (v) { box(a[0] - 1.25, a[1] - 1.25, a[0] + 1.25, b[1] + 1.25); pts.forEach((p, m) => { const t = g.pads[m].label; if (t && !(g.isDiode && m > 1)) textStrokes(t, p[0] + 1.75, p[1] - 0.5, 1.0, 0).forEach((s) => silk.push(s)); }); textStrokes(g.title.slice(0, 14), a[0] - 1.75, a[1] - 1.2, 1.1, 1).forEach((s) => silk.push(s)); }
    else { box(a[0] - 1.25, a[1] - 1.25, b[0] + 1.25, a[1] + 1.25); pts.forEach((p, m) => { const t = g.pads[m].label; if (t && !(g.isDiode && m > 1)) textStrokes(t, p[0] + 0.5, p[1] + 1.75, 1.0, 1).forEach((s) => silk.push(s)); }); textStrokes(g.title.slice(0, 14), a[0] - 1.2, a[1] - 2.9, 1.1, 0).forEach((s) => silk.push(s)); }
    if (g.isDiode) { const A = pts[2], K = pts[3], mx = (A[0] + K[0]) / 2, my = (A[1] + K[1]) / 2, ux = v ? 0 : 1, uy = v ? 1 : 0, wx = -uy, wy = ux; // triangle pointing at K, bar on the K side
      const p1 = [mx - ux * 1.6 + wx * 1.3, my - uy * 1.6 + wy * 1.3], p2 = [mx - ux * 1.6 - wx * 1.3, my - uy * 1.6 - wy * 1.3], p3 = [mx + ux * 1.2, my + uy * 1.2];
      line(p1[0], p1[1], p2[0], p2[1]); line(p2[0], p2[1], p3[0], p3[1]); line(p3[0], p3[1], p1[0], p1[1]); line(p3[0] + wx * 1.3, p3[1] + wy * 1.3, p3[0] - wx * 1.3, p3[1] - wy * 1.3);
      line(A[0] + ux * 1.3, A[1] + uy * 1.3, mx - ux * 1.6, my - uy * 1.6); line(p3[0], p3[1], K[0] - ux * 1.3, K[1] - uy * 1.3);
      if (v) textStrokes('1N5817', mx + 2.9, my - textLen('1N5817', 1) / 2, 1.0, 1).forEach((s) => silk.push(s)); else textStrokes('1N5817', mx - textLen('1N5817', 1) / 2, my + 1.9, 1.0, 0).forEach((s) => silk.push(s)); }
  });
  { const r = pp.r || 0, c = [[-25.5, -10.5], [25.5, -10.5], [25.5, 10.5], [-25.5, 10.5]].map(([x, y]) => { const q = rotv(x, y, r); return [pp.x + q[0], pp.y + q[1]]; });
    for (let i = 0; i < 4; i++) line(c[i][0], c[i][1], c[(i + 1) % 4][0], c[(i + 1) % 4][1]);
    const u = rotv(-1, 0, r), w = rotv(0, 1, r), m = (a, b) => [pp.x + u[0] * a + w[0] * b, pp.y + u[1] * a + w[1] * b]; // a = toward the USB end, b = across
    const q1 = m(25.5, -4), q2 = m(21, -4), q3 = m(21, 4), q4 = m(25.5, 4); line(q1[0], q1[1], q2[0], q2[1]); line(q2[0], q2[1], q3[0], q3[1]); line(q3[0], q3[1], q4[0], q4[1]); // the USB plug end
    const horiz = r % 2 === 0, tx = pp.x - (horiz ? textLen('PICO USB', 1.6) / 2 : -0.8), ty = pp.y - (horiz ? 0.8 : textLen('PICO USB', 1.6) / 2);
    textStrokes(r === 0 ? 'USB PICO' : r === 1 ? 'USB PICO' : 'PICO USB', tx, ty, 1.6, horiz ? 0 : 1).forEach((s) => silk.push(s));
    const p1 = picoPads[0], d1 = m(0, -1); line(p1.x - 1.1 + d1[0] * 0 , p1.y - 1.1, p1.x + 1.1, p1.y - 1.1); line(p1.x + 1.1, p1.y - 1.1, p1.x + 1.1, p1.y + 1.1); line(p1.x + 1.1, p1.y + 1.1, p1.x - 1.1, p1.y + 1.1); line(p1.x - 1.1, p1.y + 1.1, p1.x - 1.1, p1.y - 1.1); // a square around pin 1
  }
  { const t = spec.name || 'NOCIV CASE ZERO', h = Math.min(2.2, (ax1 - ax0 - 8) * 6 / (t.length * 5.6)); if (h >= 1) textStrokes(t, (ax0 + ax1) / 2 + textLen(t, h) / 2, ay0 + 4, h, 0, true).forEach((s) => silkB.push(s)); }

  const res = { ok: true, errors, warnings, pads, vias: viaList, tracks, mounts, edges, silk, silkB, rows, diode: !!diode, nets: nets.slice(1).map((n) => n.name), netIds: netId, gndSeeds: gndSeeds.map(cellXY),
    box: { x0: ax0, y0: ay0, x1: ax1, y1: ay1, w: ax1 - ax0, h: ay1 - ay0 }, grid: { ox, oy, nx, ny } };
  res.check = check(res);
  if (!res.check.ok) { res.ok = false; res.errors = res.check.errors.slice(0, 4); }
  res.length = tracks.reduce((a, t) => a + Math.hypot(t.x2 - t.x1, t.y2 - t.y1), 0);
  return res;
}

// ---------- the second look: measure everything again without the grid ----------
export function check(b) {
  const errors = [], F = []; // every piece of copper: { l: 0 top, 1 bottom, 2 both, net, c: [x, y, r] circle or s: [x1, y1, x2, y2] with half width w }
  b.pads.forEach((p, n) => F.push({ l: 2, net: p.net, c: [p.x, p.y, BR.PAD / 2], pad: n }));
  b.vias.forEach((v) => F.push({ l: 2, net: v.net, c: [v.x, v.y, BR.VIA / 2] }));
  b.tracks.forEach((t) => F.push({ l: t.l, net: t.net, s: [t.x1, t.y1, t.x2, t.y2], w: BR.TRACK / 2 }));
  const gap = (a, c) => a.c && c.c ? Math.hypot(a.c[0] - c.c[0], a.c[1] - c.c[1]) - a.c[2] - c.c[2] : a.c ? dPS(a.c[0], a.c[1], c.s[0], c.s[1], c.s[2], c.s[3]) - a.c[2] - c.w : c.c ? dPS(c.c[0], c.c[1], a.s[0], a.s[1], a.s[2], a.s[3]) - c.c[2] - a.w : dSS(a.s, c.s) - a.w - c.w;
  const par = F.map((_, i) => i), find = (i) => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; }, join = (i, j) => { par[find(i)] = find(j); };
  // buckets so we only compare neighbours
  const B = 4, map = new Map(), key = (x, y) => Math.floor(x / B) + ':' + Math.floor(y / B);
  F.forEach((f, n) => { const x0 = f.c ? f.c[0] - 1 : Math.min(f.s[0], f.s[2]) - 1, x1 = f.c ? f.c[0] + 1 : Math.max(f.s[0], f.s[2]) + 1, y0 = f.c ? f.c[1] - 1 : Math.min(f.s[1], f.s[3]) - 1, y1 = f.c ? f.c[1] + 1 : Math.max(f.s[1], f.s[3]) + 1;
    for (let gx = Math.floor(x0 / B); gx <= Math.floor(x1 / B); gx++) for (let gy = Math.floor(y0 / B); gy <= Math.floor(y1 / B); gy++) { const k = gx + ':' + gy; if (!map.has(k)) map.set(k, []); map.get(k).push(n); } });
  void key; let minGap = 1e9; const seen = new Set();
  map.forEach((list) => { for (let a = 0; a < list.length; a++) for (let c = a + 1; c < list.length; c++) { const i = list[a], j = list[c], pk = i < j ? i * 100000 + j : j * 100000 + i; if (seen.has(pk)) continue; seen.add(pk);
    const fa = F[i], fb = F[j]; if (fa.l !== 2 && fb.l !== 2 && fa.l !== fb.l) continue; const g = gap(fa, fb);
    if (fa.net && fa.net === fb.net) { if (g <= 1e-6) join(i, j); continue; }
    if (g < minGap) minGap = g; if (g < BR.CLR - 1e-6) errors.push('Two pieces of copper are ' + g.toFixed(2) + ' mm apart near ' + (fa.c || fa.s)[0].toFixed(1) + ', ' + (fa.c || fa.s)[1].toFixed(1) + '. Not built.'); } });
  // the Pico's own ground pins count as joined
  const gid = b.netIds.GND, seeds = F.map((f, i) => (f.pad != null && f.net === gid && b.gndSeeds.some((s) => Math.abs(s[0] - f.c[0]) < 1e-6 && Math.abs(s[1] - f.c[1]) < 1e-6) ? i : -1)).filter((i) => i >= 0);
  for (let i = 1; i < seeds.length; i++) join(seeds[0], seeds[i]);
  const roots = {}; let open = 0;
  F.forEach((f, i) => { if (f.pad == null || !f.net) return; const r = find(i); if (roots[f.net] == null) roots[f.net] = r; else if (roots[f.net] !== r) open++; });
  if (open) errors.push(open + ' pad' + (open > 1 ? 's are' : ' is') + ' not connected. Not built.');
  // copper stays inside the edge, away from screws
  const outer = b.edges[0]; let minEdge = 1e9;
  F.forEach((f) => { const pts = f.c ? [[f.c[0], f.c[1], f.c[2]]] : [[f.s[0], f.s[1], f.w], [f.s[2], f.s[3], f.w]]; pts.forEach(([x, y, r]) => { if (!pip(outer, x, y)) { errors.push('Copper outside the board edge.'); return; } let d = edgeDist(outer, x, y) - r; for (let h = 1; h < b.edges.length; h++) d = Math.min(d, edgeDist(b.edges[h], x, y) - r); b.mounts.forEach((m) => { d = Math.min(d, Math.hypot(m.x - x, m.y - y) - BR.MOUNT / 2 - r); }); if (d < minEdge) minEdge = d; }); });
  if (minEdge < 0.25) errors.push('Copper is ' + minEdge.toFixed(2) + ' mm from an edge or screw hole. Not built.');
  const connected = b.pads.filter((p) => p.net).length;
  return { ok: !errors.length, errors: Array.from(new Set(errors)), minGap: minGap > 1e8 ? null : minGap, minEdge, connected, features: F.length };
}

// ---------- factory files ----------
const fx = (v) => String(Math.round(v * 1e6));
function gerber(fn, body, b) {
  const L = ['%TF.GenerationSoftware,NOCIV,CaseZero,1*%', '%TF.FileFunction,' + fn + '*%', '%TF.FilePolarity,' + (/Mask/.test(fn) ? 'Negative' : 'Positive') + '*%', '%FSLAX46Y46*%', '%MOMM*%', '%LPD*%', 'G01*'];
  const aps = {}, cmds = []; let cur = null, n = 10;
  const ap = (d) => { const k = d.toFixed(3); if (!aps[k]) { aps[k] = 'D' + (n++); L.push('%AD' + aps[k] + 'C,' + k + '*%'); } if (cur !== aps[k]) { cmds.push(aps[k] + '*'); cur = aps[k]; } };
  const tx = (x) => fx(x - b.box.x0), ty = (y) => fx(y - b.box.y0);
  body({ flash: (x, y, d) => { ap(d); cmds.push('X' + tx(x) + 'Y' + ty(y) + 'D03*'); }, draw: (x1, y1, x2, y2, w) => { ap(w); cmds.push('X' + tx(x1) + 'Y' + ty(y1) + 'D02*', 'X' + tx(x2) + 'Y' + ty(y2) + 'D01*'); } });
  return L.concat(cmds, ['M02*']).join('\n') + '\n';
}
function mergeTracks(tracks, l) { // unit steps into long straight lines, so the files stay small
  const H = {}, V = {}, r = (v) => Math.round(v * 1000);
  tracks.filter((t) => t.l === l).forEach((t) => { if (r(t.y1) === r(t.y2)) (H[r(t.y1)] = H[r(t.y1)] || []).push([Math.min(t.x1, t.x2), Math.max(t.x1, t.x2), t.net]); else (V[r(t.x1)] = V[r(t.x1)] || []).push([Math.min(t.y1, t.y2), Math.max(t.y1, t.y2), t.net]); });
  const out = [], run = (M, horiz) => Object.keys(M).forEach((k) => { const c = +k / 1000, list = M[k].sort((a, b) => a[0] - b[0]); let cur = null; list.forEach((s) => { if (cur && cur[2] === s[2] && s[0] <= cur[1] + 1e-6) cur[1] = Math.max(cur[1], s[1]); else { if (cur) out.push(horiz ? [cur[0], c, cur[1], c] : [c, cur[0], c, cur[1]]); cur = s.slice(); } }); if (cur) out.push(horiz ? [cur[0], c, cur[1], c] : [c, cur[0], c, cur[1]]); });
  run(H, true); run(V, false); return out;
}
export function boardFiles(b, name) {
  const base = name || 'casezero-board', files = [];
  const copper = (l) => gerber('Copper,L' + (l + 1) + ',' + (l ? 'Bot' : 'Top'), (g) => { mergeTracks(b.tracks, l).forEach((t) => g.draw(t[0], t[1], t[2], t[3], BR.TRACK)); b.pads.forEach((p) => g.flash(p.x, p.y, BR.PAD)); b.vias.forEach((v) => g.flash(v.x, v.y, BR.VIA)); }, b);
  const mask = (l) => gerber('Soldermask,' + (l ? 'Bot' : 'Top'), (g) => { b.pads.forEach((p) => g.flash(p.x, p.y, BR.PAD + 0.1)); b.mounts.forEach((m) => g.flash(m.x, m.y, BR.MOUNT + 0.4)); }, b);
  files.push({ name: base + '-F_Cu.gtl', text: copper(0) }, { name: base + '-B_Cu.gbl', text: copper(1) }, { name: base + '-F_Mask.gts', text: mask(0) }, { name: base + '-B_Mask.gbs', text: mask(1) });
  files.push({ name: base + '-F_Silkscreen.gto', text: gerber('Legend,Top', (g) => b.silk.forEach((s) => g.draw(s[0], s[1], s[2], s[3], BR.SILK)), b) });
  files.push({ name: base + '-B_Silkscreen.gbo', text: gerber('Legend,Bot', (g) => b.silkB.forEach((s) => g.draw(s[0], s[1], s[2], s[3], BR.SILK)), b) });
  files.push({ name: base + '-Edge_Cuts.gm1', text: gerber('Profile,NP', (g) => b.edges.forEach((poly) => poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; g.draw(p[0], p[1], q[0], q[1], 0.1); })), b) });
  const dr = ['M48', '; DRILL file NOCIV Case Zero board. T1 vias, T2 pin and wire pads, T3 M2 screws', '; FORMAT={-:-/ absolute / metric / decimal}', 'FMAT,2', 'METRIC', 'T1C' + BR.VDRILL.toFixed(3), 'T2C' + BR.DRILL.toFixed(3), 'T3C' + BR.MOUNT.toFixed(3), '%', 'G90', 'G05'];
  const pt = (x, y) => 'X' + (x - b.box.x0).toFixed(3) + 'Y' + (y - b.box.y0).toFixed(3);
  if (b.vias.length) { dr.push('T1'); b.vias.forEach((v) => dr.push(pt(v.x, v.y))); } dr.push('T2'); b.pads.forEach((p) => dr.push(pt(p.x, p.y))); dr.push('T3'); b.mounts.forEach((m) => dr.push(pt(m.x, m.y))); dr.push('M30');
  files.push({ name: base + '.drl', text: dr.join('\n') + '\n' });
  return files;
}

// a plain zip (no compression): what board factories ask you to upload
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
export function zip(files) {
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  const u16 = (v) => [v & 255, (v >> 8) & 255], u32 = (v) => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  files.forEach((f) => { const nm = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
    const head = [].concat(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(nm.length), u16(0));
    parts.push(new Uint8Array(head), nm, data);
    cen.push({ nm, bytes: [].concat(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off)) });
    off += head.length + nm.length + data.length; });
  let csize = 0; cen.forEach((c) => { parts.push(new Uint8Array(c.bytes), c.nm); csize += c.bytes.length + c.nm.length; });
  parts.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(csize), u32(off), u16(0))));
  let total = 0; parts.forEach((p) => { total += p.length; }); const out = new Uint8Array(total); let o = 0; parts.forEach((p) => { out.set(p, o); o += p.length; }); return out;
}

// ---------- the picture ----------
export function boardSvg(b, show) {
  const m = 2, bx = b.box, W = bx.w + 2 * m, H = bx.h + 2 * m, Xs = (x) => (x - bx.x0 + m).toFixed(2), Ys = (y) => (bx.y1 - y + m).toFixed(2);
  const path = (poly) => 'M' + poly.map((p) => Xs(p[0]) + ' ' + Ys(p[1])).join('L') + 'Z';
  let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1) + '" style="width:100%;display:block;border-radius:12px;background:#e6e1d6">';
  s += '<path d="' + b.edges.map(path).join('') + '" fill="#1f5a3a" fill-rule="evenodd" stroke="#0e2f1e" stroke-width=".3"/>';
  const lay = (l, col) => '<g stroke="' + col + '" stroke-width="' + BR.TRACK + '" stroke-linecap="round" fill="none">' + mergeTracks(b.tracks, l).map((t) => '<path d="M' + Xs(t[0]) + ' ' + Ys(t[1]) + 'L' + Xs(t[2]) + ' ' + Ys(t[3]) + '"/>').join('') + '</g>';
  if (show !== 'top') s += lay(1, '#5aa0e6'); if (show !== 'bottom') s += lay(0, '#e9b84a');
  s += '<g stroke="#f4f1e8" stroke-width="' + BR.SILK + '" stroke-linecap="round" fill="none"><path d="' + b.silk.map((t) => 'M' + Xs(t[0]) + ' ' + Ys(t[1]) + 'L' + Xs(t[2]) + ' ' + Ys(t[3])).join('') + '"/></g>';
  b.vias.forEach((v) => { s += '<circle cx="' + Xs(v.x) + '" cy="' + Ys(v.y) + '" r="' + BR.VIA / 2 + '" fill="#c9cfd4"/><circle cx="' + Xs(v.x) + '" cy="' + Ys(v.y) + '" r="' + BR.VDRILL / 2 + '" fill="#1f5a3a"/>'; });
  b.pads.forEach((p) => { s += '<circle cx="' + Xs(p.x) + '" cy="' + Ys(p.y) + '" r="' + BR.PAD / 2 + '" fill="' + (p.net ? '#f0cf6b' : '#b9b49f') + '"/><circle cx="' + Xs(p.x) + '" cy="' + Ys(p.y) + '" r="' + BR.DRILL / 2 + '" fill="#e6e1d6"/>'; });
  b.mounts.forEach((q) => { s += '<circle cx="' + Xs(q.x) + '" cy="' + Ys(q.y) + '" r="' + BR.MOUNT / 2 + '" fill="#e6e1d6" stroke="#0e2f1e" stroke-width=".3"/>'; });
  return s + '</svg>';
}
