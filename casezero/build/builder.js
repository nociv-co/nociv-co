// Case Zero Builder. Pick what your device does, place the parts on the lid, see it in 3D, download files to print.
// All sizes in millimeters. Part sizes come from the maker's published specs (see PARTS[].src).
// Geometry is built here, no outside CAD service. The box is made on a square grid so the file is watertight.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

// ---------- case rules ----------
const T = 2.4;        // wall thickness (6 lines on a 0.4 mm nozzle)
const F = 2.0;        // floor thickness
const LT = 2.4;       // lid thickness
const POST = 7;       // square corner posts that hold the lid screws
const PILOT = 2.5;    // square pilot hole in corner posts for M3 self tapping screws
const PILOT_DEPTH = 12;
const LID_HOLE = 3.4; // M3 clearance hole in the lid
const CELL = 10;      // half square. Your Case Zero grid is 20 mm squares, parts snap to 10 mm halves.
const MAJOR = 20;
const M = 1;          // gap between the inner wall and the grid
const GRIDS = [[4, 3], [5, 3], [5, 4], [6, 4], [7, 5], [8, 6]]; // 20 mm squares across x down

// Raspberry Pi Pico and Pico W: 51 x 21 mm board, 2.1 mm holes 2 mm from each end and 4.8 mm from each long side
// (Raspberry Pi Pico product brief, physical specification drawing). Micro USB overhangs the short edge by about 1.3 mm.
const PICO = { L: 51, W: 21, holes: [[2, 4.8], [2, 16.2], [49, 4.8], [49, 16.2]], standoff: 5, sq: 5, pilot: 1.7, usbW: 12, usbH: 8, gap: 2.5, top: 9.2 };

// Parts that mount through the lid. hole = published panel hole, tol = extra room for 3D print shrink,
// depth = how far it hangs below the lid, keep = clear space around it.
const PARTS = {
  button16: { name: '16 mm push button', does: 'Press to make it do something', hole: 16, tol: 0.3, depth: 24.4, keep: 9.1,
    src: 'Adafruit 1505 series: 16 mm panel mount, 18.06 mm max width, 29.4 mm tall with a 5 mm button on top', url: 'https://www.adafruit.com/product/1505' },
  arcade30: { name: '30 mm glowing arcade button', does: 'Big button that lights up', hole: 30, tol: 0.3, depth: 38, keep: 18,
    src: 'Adafruit 3487 to 3491: needs a 30 mm hole, 38 mm deep with the contacts straight', url: 'https://www.adafruit.com/product/3491' },
  led5: { name: '5 mm LED', does: 'Light up', hole: 5, tol: 0.1, depth: 12, keep: 4,
    src: 'Standard 5 mm (T-1 3/4) LED, 5 mm body, rim stops it on the lid', url: '' },
  speaker28: { name: 'Mini speaker 28 mm', does: 'Make sound', grille: true, dia: 28, depth: 6, keep: 15,
    src: 'Adafruit 1890: 28 mm across, 4.5 mm tall. Glue it under the speaker holes', url: 'https://www.adafruit.com/product/1890' },
  pot: { name: 'Turn knob (10K potentiometer)', does: 'Turn to adjust', hole: 7, tol: 0.3, depth: 18, keep: 9.5,
    src: 'Adafruit 562 (TT P160): M7 bushing so a 7 mm hole, 17 mm body, 6 mm knurled shaft 15 mm long', url: 'https://www.adafruit.com/product/562' }
};
// how many 10 mm half squares each part takes, from its real size plus room for nuts and fingers
Object.values(PARTS).forEach((P) => { P.cells = Math.ceil((2 * P.keep) / CELL - 1e-9); });
// printed knob for the 6 mm knurled shaft: press fit, 18 mm across, grip ridges, one notch shows where it points
const KNOB = { od: 18, h: 12, bore: 6.0, ridges: 18 };
const BOARDS = {
  pico: { name: 'Raspberry Pi Pico', url: 'https://www.raspberrypi.com/products/raspberry-pi-pico/' },
  picow: { name: 'Raspberry Pi Pico W (Wi-Fi)', url: 'https://www.raspberrypi.com/products/raspberry-pi-pico/' }
};
const FUNCS = [['button16', 'Press to make it do something'], ['arcade30', 'Big button that glows'], ['pot', 'Turn to adjust'], ['led5', 'Light up'], ['speaker28', 'Make sound']];

// ---------- state ----------
const KEY = 'nociv-casezero-build-v2';
let S = { size: 2, board: 'pico', parts: [], step: 1, knobs: true };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.parts)) S = Object.assign(S, s); } catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
let uid = S.parts.reduce((m, p) => Math.max(m, p.id || 0), 0);
let selected = null;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const grid = () => GRIDS[S.size] || GRIDS[2];

function geom() {
  const [gc, gr] = grid();
  const cols = gc * MAJOR / CELL, rows = gr * MAJOR / CELL;
  const W = gc * MAJOR + 2 * (T + M), D = gr * MAJOR + 2 * (T + M);
  const gx = T + M, gy = T + M;
  const maxDepth = S.parts.reduce((m, p) => Math.max(m, PARTS[p.type].depth), 0);
  const inner = Math.max(25, Math.ceil(maxDepth + 3));
  const H = F + inner;
  const px0 = T + PICO.gap, py0 = D / 2 - PICO.W / 2;
  const usbZ = F + PICO.standoff + 1 + 1.5;
  return { W, D, H, inner, px0, py0, usbZ, cols, rows, gx, gy };
}
function posts(W, D) {
  return [[T, T], [W - T - POST, T], [T, D - T - POST], [W - T - POST, D - T - POST]];
}

// ---------- checks (cells) ----------
// p.c, p.r = top left half square of the part (r counts up from the bottom). Center is in the middle of its block.
function center(p) { const g = geom(), n = PARTS[p.type].cells; return { x: g.gx + (p.c + n / 2) * CELL, y: g.gy + (p.r + n / 2) * CELL }; }
function cellsOf(p) { const n = PARTS[p.type].cells, out = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push((p.c + i) + ',' + (p.r + j)); return out; }
function rectHit(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1) { return ax0 < bx1 && ax1 > bx0 && ay0 < by1 && ay1 > by0; }
function problemsFor(p, list) {
  const g = geom(), P = PARTS[p.type], n = P.cells, out = [];
  if (p.c < 0 || p.r < 0 || p.c + n > g.cols || p.r + n > g.rows) { out.push('off the grid'); return out; }
  const x0 = g.gx + p.c * CELL, y0 = g.gy + p.r * CELL, x1 = x0 + n * CELL, y1 = y0 + n * CELL;
  if (posts(g.W, g.D).some(([x, y]) => rectHit(x0, y0, x1, y1, x, y, x + POST, y + POST))) out.push('on a corner screw post');
  const mine = new Set(cellsOf(p));
  list.forEach((q) => { if (q !== p && cellsOf(q).some((k) => mine.has(k))) out.push('sharing squares with the ' + PARTS[q.type].name); });
  const bottom = g.H - P.depth;
  if (bottom < F + PICO.top + 1 && rectHit(x0, y0, x1, y1, g.px0 - 1.3, g.py0 - 1, g.px0 + PICO.L + 1, g.py0 + PICO.W + 1)) out.push('over the Pico and too deep for it');
  return out;
}
function allProblems() { return S.parts.map((p) => ({ p, list: problemsFor(p, S.parts) })).filter((x) => x.list.length); }
function findSpot(type) {
  const g = geom(), n = PARTS[type].cells, test = { type, c: 0, r: 0 };
  for (let r = g.rows - n; r >= 0; r--) for (let c = g.cols - n; c >= 0; c--) { test.c = c; test.r = r; if (!problemsFor(test, S.parts).length) return [c, r]; }
  return null;
}

// ---------- step 1: what it does ----------
function drawFuncs() {
  const counts = {}; S.parts.forEach((p) => { counts[p.type] = (counts[p.type] || 0) + 1; });
  $('funcList').innerHTML = FUNCS.map(([t, label]) => {
    const n = counts[t] || 0, P = PARTS[t];
    const sq = P.cells * CELL;
    return '<div class="fn"><div class="fn-t"><b>' + esc(label) + '</b><span>' + esc(P.name) + ' . takes ' + sq + ' x ' + sq + ' mm</span>' +
      (t === 'pot' && n ? '<button type="button" class="chip knobchip" id="knobs" aria-pressed="' + !!S.knobs + '">' + (S.knobs ? 'Print my knobs: yes' : 'Print my knobs: no') + '</button>' : '') + '</div>' +
      '<div class="fn-n"><button type="button" class="nb" data-t="' + t + '" data-d="-1" aria-label="One less" ' + (n ? '' : 'disabled') + '>-</button>' +
      '<span class="nv">' + n + '</span><button type="button" class="nb" data-t="' + t + '" data-d="1" aria-label="One more">+</button></div></div>';
  }).join('') +
    '<div class="fn"><div class="fn-t"><b>Talk to Wi-Fi</b><span>Uses the Pico W, same size case</span></div><div class="fn-n"><button type="button" class="chip" id="wifi" aria-pressed="' + (S.board === 'picow') + '">' + (S.board === 'picow' ? 'Yes' : 'No') + '</button></div></div>';
  $('fnMsg').textContent = '';
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('.nb');
  if (b) {
    const t = b.dataset.t;
    if (+b.dataset.d > 0) {
      const spot = findSpot(t);
      if (!spot) { $('fnMsg').textContent = 'No room for another ' + PARTS[t].name + '. Pick a bigger case in step 2.'; return; }
      S.parts.push({ id: ++uid, type: t, c: spot[0], r: spot[1] });
    } else {
      for (let i = S.parts.length - 1; i >= 0; i--) if (S.parts[i].type === t) { S.parts.splice(i, 1); break; }
    }
    save(); drawFuncs(); return;
  }
  if (e.target.id === 'wifi') { S.board = S.board === 'picow' ? 'pico' : 'picow'; save(); drawFuncs(); }
  if (e.target.id === 'knobs') { S.knobs = !S.knobs; save(); drawFuncs(); }
});

// ---------- step 2: size ----------
function drawSizes() {
  $('sizeList').innerHTML = GRIDS.map(([c, r], i) => '<button type="button" class="chip" data-size="' + i + '" aria-pressed="' + (i === S.size) + '">' + c + ' x ' + r + ' squares</button>').join('');
  const g = geom();
  $('sizeInfo').textContent = 'Outside: ' + g.W.toFixed(1) + ' x ' + g.D.toFixed(1) + ' x ' + (g.H + LT).toFixed(1) + ' mm tall with the lid. Each square is 20 mm. The height grows to fit your deepest part.';
}
$('sizeList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-size]'); if (!b) return;
  S.size = +b.dataset.size;
  const g = geom();
  S.parts.forEach((p) => { const n = PARTS[p.type].cells; p.c = Math.min(Math.max(p.c, 0), g.cols - n); p.r = Math.min(Math.max(p.r, 0), g.rows - n); });
  save(); drawSizes();
});

// ---------- step 3: place ----------
const svg = $('board');
function drawBoard() {
  const g = geom(), pad = 6;
  svg.setAttribute('viewBox', (-pad) + ' ' + (-pad) + ' ' + (g.W + pad * 2) + ' ' + (g.D + pad * 2));
  const Y = (y) => g.D - y; // lid y goes up, SVG y goes down
  const bad = new Set(allProblems().map((x) => x.p.id));
  let h = '<rect x="0" y="0" width="' + g.W + '" height="' + g.D + '" fill="#c8412f" stroke="#111" stroke-width=".8"/>';
  for (let i = 0; i <= g.cols; i++) { const x = g.gx + i * CELL, major = i % 2 === 0; h += '<line x1="' + x + '" y1="' + Y(g.gy) + '" x2="' + x + '" y2="' + Y(g.gy + g.rows * CELL) + '" stroke="rgba(255,255,255,' + (major ? .5 : .2) + ')" stroke-width="' + (major ? .45 : .25) + '"/>'; }
  for (let j = 0; j <= g.rows; j++) { const y = g.gy + j * CELL, major = j % 2 === 0; h += '<line x1="' + g.gx + '" y1="' + Y(y) + '" x2="' + (g.gx + g.cols * CELL) + '" y2="' + Y(y) + '" stroke="rgba(255,255,255,' + (major ? .5 : .2) + ')" stroke-width="' + (major ? .45 : .25) + '"/>'; }
  h += '<rect x="' + T + '" y="' + T + '" width="' + (g.W - 2 * T) + '" height="' + (g.D - 2 * T) + '" fill="none" stroke="rgba(0,0,0,.35)" stroke-width=".4" stroke-dasharray="1.5 1"/>';
  posts(g.W, g.D).forEach(([x, y]) => { h += '<rect x="' + x + '" y="' + Y(y + POST) + '" width="' + POST + '" height="' + POST + '" fill="rgba(0,0,0,.25)"/><circle cx="' + (x + POST / 2) + '" cy="' + Y(y + POST / 2) + '" r="' + LID_HOLE / 2 + '" fill="#f2ecd6"/>'; });
  // Pico inside, under the lid
  h += '<rect x="' + g.px0 + '" y="' + Y(g.py0 + PICO.W) + '" width="' + PICO.L + '" height="' + PICO.W + '" fill="rgba(47,122,75,.35)" stroke="#111" stroke-width=".5" stroke-dasharray="2 1.2"/>';
  h += '<text x="' + (g.px0 + PICO.L / 2) + '" y="' + (Y(g.py0 + PICO.W / 2) + 1.6) + '" font-size="4.4" text-anchor="middle" fill="#111" font-weight="700">' + (S.board === 'picow' ? 'PICO W' : 'PICO') + ' INSIDE</text>';
  h += '<rect x="-1.5" y="' + Y(g.D / 2 + PICO.usbW / 2) + '" width="3" height="' + PICO.usbW + '" fill="#111"/><text x="2.5" y="' + (Y(g.D / 2) + 1.2) + '" font-size="3.2" fill="#fff">USB</text>';
  S.parts.forEach((p) => {
    const P = PARTS[p.type], ctr = center(p), cx = ctr.x, cy = Y(ctr.y), isBad = bad.has(p.id), isSel = selected === p.id, n = P.cells * CELL;
    h += '<g class="part" data-id="' + p.id + '">';
    h += '<rect x="' + (g.gx + p.c * CELL + .4) + '" y="' + Y(g.gy + p.r * CELL + n - .4) + '" width="' + (n - .8) + '" height="' + (n - .8) + '" fill="' + (isBad ? 'rgba(255,230,0,.5)' : 'rgba(255,255,255,.2)') + '" stroke="' + (isSel ? '#fff' : (isBad ? '#ffe600' : 'rgba(255,255,255,.6)')) + '" stroke-width="' + (isSel ? 1 : .5) + '"/>';
    if (P.grille) grille(ctr.x, ctr.y).forEach(([x, y, r]) => { h += '<circle cx="' + x + '" cy="' + Y(y) + '" r="' + r + '" fill="#111"/>'; });
    else h += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (P.hole + P.tol) / 2 + '" fill="#111"/>';
    h += '</g>';
  });
  svg.innerHTML = h;
  const probs = allProblems();
  $('placeMsg').innerHTML = probs.length ? probs.map((x) => '<span class="bad">' + esc(PARTS[x.p.type].name) + ' is ' + esc(x.list[0]) + '.</span>').join('<br>') : (S.parts.length ? '<span class="ok">Everything fits.</span>' : 'Add parts in step 1.');
  const sp = S.parts.find((p) => p.id === selected);
  $('selBar').hidden = !sp;
  if (sp) $('selName').textContent = PARTS[sp.type].name;
}
function grille(x, y) {
  const out = [[x, y, 1.5]];
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; out.push([x + 6 * Math.cos(a), y + 6 * Math.sin(a), 1.5]); }
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + 0.3; out.push([x + 10.5 * Math.cos(a), y + 10.5 * Math.sin(a), 1.25]); }
  return out;
}
let drag = null;
function lidPoint(ev) {
  const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
  const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
  const q = pt.matrixTransform(m.inverse());
  return { x: q.x, y: geom().D - q.y };
}
svg.addEventListener('pointerdown', (ev) => {
  const g = ev.target.closest('.part');
  if (!g) { selected = null; drawBoard(); return; }
  const p = S.parts.find((q) => q.id === +g.dataset.id); if (!p) return;
  selected = p.id; const pt = lidPoint(ev), ctr = center(p);
  drag = { p, dx: ctr.x - pt.x, dy: ctr.y - pt.y };
  svg.setPointerCapture(ev.pointerId); ev.preventDefault(); drawBoard();
});
svg.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const g = geom(), n = PARTS[drag.p.type].cells, pt = lidPoint(ev);
  let c = Math.round((pt.x + drag.dx - g.gx) / CELL - n / 2), r = Math.round((pt.y + drag.dy - g.gy) / CELL - n / 2);
  c = Math.min(Math.max(c, 0), g.cols - n); r = Math.min(Math.max(r, 0), g.rows - n);
  if (c !== drag.p.c || r !== drag.p.r) { drag.p.c = c; drag.p.r = r; drawBoard(); }
});
['pointerup', 'pointercancel'].forEach((t) => svg.addEventListener(t, () => { if (drag) { drag = null; save(); } }));
$('selRemove').addEventListener('click', () => { S.parts = S.parts.filter((p) => p.id !== selected); selected = null; save(); drawBoard(); });

// ---------- geometry ----------
// Box: solid cells on a square grid. Every face sits on the same grid, so the mesh closes with no gaps.
function buildBox() {
  const g = geom(), W = g.W, D = g.D, H = g.H;
  const usb = { y0: D / 2 - PICO.usbW / 2, y1: D / 2 + PICO.usbW / 2, z0: g.usbZ - PICO.usbH / 2, z1: g.usbZ + PICO.usbH / 2 };
  const pc = posts(W, D).map(([x, y]) => [x + POST / 2, y + POST / 2]);
  const so = PICO.holes.map(([hx, hy]) => [g.px0 + hx, g.py0 + hy]);
  const xs = new Set([0, T, W - T, W, T + POST, W - T - POST]), ys = new Set([0, T, D - T, D, T + POST, D - T - POST, usb.y0, usb.y1]);
  const zs = new Set([0, F, H, H - PILOT_DEPTH, F + PICO.standoff, usb.z0, usb.z1]);
  pc.forEach(([x, y]) => { xs.add(x - PILOT / 2); xs.add(x + PILOT / 2); ys.add(y - PILOT / 2); ys.add(y + PILOT / 2); });
  so.forEach(([x, y]) => { [PICO.sq / 2, PICO.pilot / 2].forEach((r) => { xs.add(x - r); xs.add(x + r); ys.add(y - r); ys.add(y + r); }); });
  const fix = (s) => [...new Set([...s].map((v) => Math.round(v * 1e4) / 1e4))].sort((a, b) => a - b);
  const X = fix(xs), Yv = fix(ys), Z = fix(zs);
  const inBox = (v, a, b) => v > a && v < b;
  function solid(cx, cy, cz) {
    if (cz < F) return true;
    if (cz > H) return false;
    const wall = cx < T || cx > W - T || cy < T || cy > D - T;
    if (wall) return !(cx < T && inBox(cy, usb.y0, usb.y1) && inBox(cz, usb.z0, usb.z1));
    for (const [x, y] of pc) {
      if (Math.abs(cx - x) < POST / 2 && Math.abs(cy - y) < POST / 2) return !(Math.abs(cx - x) < PILOT / 2 && Math.abs(cy - y) < PILOT / 2 && cz > H - PILOT_DEPTH);
    }
    if (cz < F + PICO.standoff) for (const [x, y] of so) {
      if (Math.abs(cx - x) < PICO.sq / 2 && Math.abs(cy - y) < PICO.sq / 2) return !(Math.abs(cx - x) < PICO.pilot / 2 && Math.abs(cy - y) < PICO.pilot / 2);
    }
    return false;
  }
  const nx = X.length - 1, ny = Yv.length - 1, nz = Z.length - 1;
  const cell = new Uint8Array(nx * ny * nz);
  const idx = (i, j, k) => (k * ny + j) * nx + i;
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++)
    cell[idx(i, j, k)] = solid((X[i] + X[i + 1]) / 2, (Yv[j] + Yv[j + 1]) / 2, (Z[k] + Z[k + 1]) / 2) ? 1 : 0;
  const at = (i, j, k) => (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) ? 0 : cell[idx(i, j, k)];
  const tri = [];
  const quad = (a, b, c, d) => { tri.push(...a, ...b, ...c, ...a, ...c, ...d); };
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    if (!at(i, j, k)) continue;
    const x0 = X[i], x1 = X[i + 1], y0 = Yv[j], y1 = Yv[j + 1], z0 = Z[k], z1 = Z[k + 1];
    if (!at(i - 1, j, k)) quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    if (!at(i + 1, j, k)) quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]);
    if (!at(i, j - 1, k)) quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    if (!at(i, j + 1, k)) quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]);
    if (!at(i, j, k - 1)) quad([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]);
    if (!at(i, j, k + 1)) quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
  }
  return new Float32Array(tri);
}
// Lid: flat plate with round holes, made with three.js extrude (one closed solid).
function buildLid() {
  const g = geom();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0); shape.lineTo(g.W, 0); shape.lineTo(g.W, g.D); shape.lineTo(0, g.D); shape.lineTo(0, 0);
  const hole = (x, y, r) => { const p = new THREE.Path(); p.absarc(x, y, r, 0, Math.PI * 2, true); shape.holes.push(p); };
  posts(g.W, g.D).forEach(([x, y]) => hole(x + POST / 2, y + POST / 2, LID_HOLE / 2));
  S.parts.forEach((p) => { const P = PARTS[p.type], o = center(p); if (P.grille) grille(o.x, o.y).forEach(([x, y, r]) => hole(x, y, r)); else hole(o.x, o.y, (P.hole + P.tol) / 2); });
  const geo = new THREE.ExtrudeGeometry(shape, { depth: LT, bevelEnabled: false, curveSegments: 40 });
  const pos = geo.getAttribute('position').array;
  const out = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) { out[i] = pos[i]; out[i + 1] = pos[i + 1]; out[i + 2] = pos[i + 2] + g.H; }
  geo.dispose();
  return out;
}
// Printed knobs, laid out in a row so they print in one go. Through bore so the knurled shaft can go all the way in.
function knobShape() {
  const sh = new THREE.Shape(), n = KNOB.ridges * 2, ro = KNOB.od / 2, ri = ro - 0.8;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, notch = i === 0 || i === n;
    const r = notch ? ri - 1.2 : (i % 2 ? ri : ro);
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
  }
  const bore = new THREE.Path(); bore.absarc(0, 0, KNOB.bore / 2, 0, Math.PI * 2, true); sh.holes.push(bore);
  return sh;
}
function buildKnobs(count) {
  const geo = new THREE.ExtrudeGeometry(knobShape(), { depth: KNOB.h, bevelEnabled: false, curveSegments: 32 });
  const pos = geo.getAttribute('position').array, step = KNOB.od + 6, out = new Float32Array(pos.length * count);
  for (let k = 0; k < count; k++) for (let i = 0; i < pos.length; i += 3) { const o = k * pos.length + i; out[o] = pos[i] + k * step; out[o + 1] = pos[i + 1]; out[o + 2] = pos[i + 2]; }
  geo.dispose();
  return out;
}
function stl(tris, name) {
  const n = tris.length / 9, buf = new ArrayBuffer(84 + n * 50), dv = new DataView(buf);
  const head = ('NOCIV Case Zero ' + name).slice(0, 80);
  for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i));
  dv.setUint32(80, n, true);
  let o = 84;
  for (let t = 0; t < n; t++) {
    const b = t * 9, a = [tris[b], tris[b + 1], tris[b + 2]], c = [tris[b + 3], tris[b + 4], tris[b + 5]], d = [tris[b + 6], tris[b + 7], tris[b + 8]];
    const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0];
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    [nx, ny, nz, ...a, ...c, ...d].forEach((f) => { dv.setFloat32(o, f, true); o += 4; });
    dv.setUint16(o, 0, true); o += 2;
  }
  return new Blob([buf], { type: 'model/stl' });
}
function shiftDown(tris, dz) { const o = new Float32Array(tris.length); for (let i = 0; i < tris.length; i += 3) { o[i] = tris[i]; o[i + 1] = tris[i + 1]; o[i + 2] = tris[i + 2] - dz; } return o; }

// ---------- step 4: 3D ----------
let R = null;
function setup3d() {
  if (R) return R;
  const wrap = $('view3d');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8170, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(80, 160, 120); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(35, 1, 1, 5000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false; controls.enablePan = false;
  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2; scene.add(root);
  R = { renderer, scene, camera, controls, root, open: false };
  const draw = () => renderer.render(scene, camera);
  controls.addEventListener('change', draw);
  R.draw = draw;
  new ResizeObserver(() => { const w = wrap.clientWidth, h = wrap.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(h, 1); camera.updateProjectionMatrix(); if (R.fit) R.fit(); draw(); }).observe(wrap);
  return R;
}
function meshFrom(tris, color, opts) {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(tris, 3)); geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .85, metalness: 0, flatShading: true }, opts || {})));
}
function draw3d() {
  const r = setup3d(), g = geom();
  r.root.children.slice().forEach((c) => { r.root.remove(c); c.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); });
  const box = meshFrom(buildBox(), 0xe9e2cc);
  const lidGroup = new THREE.Group();
  lidGroup.add(meshFrom(buildLid(), 0xc8412f));
  // simple stand ins for the parts so you can see them
  S.parts.forEach((q) => {
    const P = PARTS[q.type], o = center(q), p = { type: q.type, x: o.x, y: o.y };
    let m;
    if (p.type === 'arcade30') { m = new THREE.Mesh(new THREE.CylinderGeometry(15.5, 16.5, 6, 40), new THREE.MeshStandardMaterial({ color: 0xf2ecd6, transparent: true, opacity: .85 })); m.rotation.x = Math.PI / 2; m.position.set(p.x, p.y, g.H + LT + 3); }
    else if (p.type === 'button16') { m = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 9, 5, 36), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); m.rotation.x = Math.PI / 2; m.position.set(p.x, p.y, g.H + LT + 2.5); }
    else if (p.type === 'pot') { const kg = new THREE.ExtrudeGeometry(knobShape(), { depth: KNOB.h, bevelEnabled: false, curveSegments: 24 }); m = new THREE.Mesh(kg, new THREE.MeshStandardMaterial({ color: S.knobs ? 0xf2ecd6 : 0x333333, flatShading: true })); m.position.set(p.x, p.y, g.H + LT + 3); }
    else if (p.type === 'led5') { m = new THREE.Mesh(new THREE.SphereGeometry(2.5, 20, 12), new THREE.MeshStandardMaterial({ color: 0xffe600, emissive: 0x554400 })); m.position.set(p.x, p.y, g.H + LT + 1.5); }
    else { m = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 4.5, 40), new THREE.MeshStandardMaterial({ color: 0x8b8b8b, metalness: .4 })); m.rotation.x = Math.PI / 2; m.position.set(p.x, p.y, g.H - 2.25); }
    lidGroup.add(m);
  });
  const pico = new THREE.Mesh(new THREE.BoxGeometry(PICO.L, PICO.W, 1), new THREE.MeshStandardMaterial({ color: 0x2f7a4b }));
  pico.position.set(g.px0 + PICO.L / 2, g.py0 + PICO.W / 2, F + PICO.standoff + .5);
  r.root.add(box, pico, lidGroup);
  lidGroup.position.z = r.open ? g.H * 0.9 + 10 : 0;
  r.lid = lidGroup;
  r.root.position.set(-g.W / 2, 0, g.D / 2);
  r.fit = () => {
    const tall = g.H + LT + (r.open ? g.H * 0.9 + 10 : 0);
    const rad = Math.hypot(g.W, g.D, tall) / 2;
    const v = r.camera.fov * Math.PI / 360, hz = Math.atan(Math.tan(v) * r.camera.aspect);
    const dist = rad / Math.sin(Math.min(v, hz)) * 1.08;
    const dir = new THREE.Vector3(0.5, 0.62, 0.72).normalize();
    r.controls.target.set(0, tall / 2, 0);
    r.camera.position.copy(dir.multiplyScalar(dist)).add(r.controls.target);
    r.controls.update();
  };
  r.fit();
  r.draw();
}
$('openLid').addEventListener('click', () => {
  if (!R) return; R.open = !R.open; const g = geom();
  R.lid.position.z = R.open ? g.H * 0.9 + 10 : 0;
  $('openLid').textContent = R.open ? 'Close the lid' : 'Open the lid'; if (R.fit) R.fit(); R.draw();
});

// ---------- step 5: files ----------
function drawFiles() {
  const probs = allProblems(), g = geom();
  const ready = S.parts.length && !probs.length;
  $('dlBox').disabled = $('dlLid').disabled = !ready;
  const pots = S.parts.filter((p) => p.type === 'pot').length;
  $('dlKnob').hidden = !(pots && S.knobs); $('dlKnob').disabled = !ready;
  $('dlKnob').textContent = 'Knob file (STL), ' + pots + (pots === 1 ? ' knob' : ' knobs');
  $('fileMsg').innerHTML = !S.parts.length ? '<span class="bad">Add parts in step 1 first.</span>' : probs.length ? '<span class="bad">Fix the yellow parts in step 3 first.</span>' : '<span class="ok">Ready. Print the lid first and check that your parts fit the holes.</span>';
  const counts = {}; S.parts.forEach((p) => { counts[p.type] = (counts[p.type] || 0) + 1; });
  const B = BOARDS[S.board];
  let rows = '<li><b>1 x ' + esc(B.name) + '</b> <a href="' + B.url + '" target="_blank" rel="noopener">see it</a><br><small>Sits on 4 posts inside. USB cable reaches it through the side hole.</small></li>';
  Object.keys(counts).forEach((t) => { const P = PARTS[t]; rows += '<li><b>' + counts[t] + ' x ' + esc(P.name) + '</b>' + (P.url ? ' <a href="' + P.url + '" target="_blank" rel="noopener">see it</a>' : '') + '<br><small>' + esc(P.src) + '</small></li>'; });
  if (pots && S.knobs) rows += '<li><b>' + pots + ' x printed knob</b><br><small>From the knob file. 18 mm across, presses onto the 6 mm knurled shaft. The notch shows where it points. If it is loose, add a drop of glue.</small></li>';
  else if (pots) rows += '<li><b>' + pots + ' x knob for a 6 mm shaft</b><br><small>Any knob made for a 6 mm knurled or round shaft.</small></li>';
  rows += '<li><b>4 x M2 screws, about 5 mm long</b><br><small>Hold the Pico on its posts.</small></li><li><b>4 x M3 screws, about 8 mm long</b><br><small>Hold the lid on. They cut their own thread in the corner posts.</small></li>';
  $('partsList').innerHTML = rows;
  $('fileSize').textContent = 'Box ' + g.W.toFixed(1) + ' x ' + g.D.toFixed(1) + ' x ' + g.H.toFixed(1) + ' mm. Lid ' + g.W.toFixed(1) + ' x ' + g.D.toFixed(1) + ' x ' + LT + ' mm.';
}
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
$('dlBox').addEventListener('click', () => download(stl(buildBox(), 'box'), 'casezero-box.stl'));
$('dlLid').addEventListener('click', () => download(stl(shiftDown(buildLid(), geom().H), 'lid'), 'casezero-lid.stl'));
$('dlKnob').addEventListener('click', () => download(stl(buildKnobs(S.parts.filter((p) => p.type === 'pot').length), 'knobs'), 'casezero-knobs.stl'));

// ---------- steps ----------
function go(n) {
  S.step = n; save();
  document.querySelectorAll('.st').forEach((b) => b.setAttribute('aria-current', +b.dataset.step === n ? 'step' : 'false'));
  document.querySelectorAll('.pane').forEach((p) => { p.hidden = +p.dataset.step !== n; });
  if (n === 1) drawFuncs();
  if (n === 2) drawSizes();
  if (n === 3) drawBoard();
  if (n === 4) { const probs = allProblems(); $('view3dMsg').textContent = probs.length ? 'Some parts do not fit yet. Fix them in step 3.' : ''; requestAnimationFrame(draw3d); }
  if (n === 5) drawFiles();
  $('next').hidden = n === 5; document.querySelector('.next-bar').hidden = n === 5;
  window.scrollTo({ top: 0 });
}
document.querySelector('.steps').addEventListener('click', (e) => { const b = e.target.closest('.st'); if (b) go(+b.dataset.step); });
$('next').addEventListener('click', () => go(Math.min(5, S.step + 1)));
$('startOver').addEventListener('click', () => { if (!confirm('Clear this build and start over?')) return; S = { size: 2, board: 'pico', parts: [], step: 1, knobs: true }; selected = null; save(); go(1); });

// test hooks for the phone test page and automated checks
window.__cz = { get S() { return S; }, geom, buildBox, buildLid, buildKnobs, allProblems, PARTS, go };
go(S.step || 1);
