// Case Zero Builder v8. Start (3 doors + recipes), Body, Style, Brain, Arrange, Print, Files (with Shopping).
// Brain: pick parts (or snap a photo of yours first). Arrange: place them on the lid and base. Body: shape, size, hinge, measure.
// Print: your printer and bed, material, how it joins, where the puzzle seams go. Files: STL per piece, wood templates, wiring.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import * as G from './geo.js?v=40';
import { CARABINER_HOOK_OUTLINE_MM, CARABINER_DEFAULT_THICKNESS_MM } from './charm_carabiner_hook.js?v=1';
import { openMeasure, GROUPS } from './capture.js?v=26';
import { makeBoard, boardFiles, boardSvg, zip as zipFiles, dipOf } from './board.js?v=5';
import { charParts, chSpec, charBuyList, CH_DEF, headDims, faceSpots, faceLimit, featPoly, flatParts, FEATS } from './char3d.js?v=5';
import { powerPlan, POWER_MODES, micMain, planWiring, codeFor, PICO_LEFT, PICO_RIGHT, PICO_PINS, PICO_BRAINS, NEED, BOARDS, BOARD_OF, SCALES, LIBURL, preflight, DJFX, BEATS, DJMODE, libsFor, ACTS, ACTN, DJA, V33, BOARD_PROFILES } from './wiring.js?v=33';

const CZ = window.CZ, R = G.RULE, $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
if (window.self !== window.top) document.documentElement.classList.add('embedded');

// ---------- state ----------
const KEY = 'nociv-casezero-v7', SIZES = { clam: [9, 6], small: [5, 7], slate: [6, 4], calc: [5, 9], hand: [5, 8], pad: [10, 5], groove: [10, 5], face: [7, 7], camera: [6, 4], mini: [3, 3], panel: [15, 9], deck: [14, 10] };
let S = { step: 2, tab: {}, cat: 'brain', items: [], mine: {}, style: 'clam', cols: 9, rows: 6, add: 0, hinge: 'printed', hside: 'back', magnets: true,
  printer: 'a1', bed: [256, 256], material: 'pla', join: 'dovetail', sdir: 'auto', sn: 'auto', tab3: 'dovetail', open: true, snap: false, spring: false,
  walls: 'normal', layer: 'normal', brand: null, look: null,
  pw: 300, pd: 190, pt: 3, prad: 3, pholes: true, phold: null, plift: 0, notches: [], nsel: 0, started: false, recipe: null, have: {}, picked: false, attachedParts: [], ports: [], mnt: { face: 'back', type: 'screw', view: 'case', pface: 'back' } }; // Panel: real size in mm, thickness, corners, corner screw holes, wire notches
const LOOK0 = () => ({ logos: {}, logoAt: 'lidout', labels: { on: false, place: 'below', size: 4, how: 'dip', text: {} }, tex: { top: { kind: 'none', sp: 6, bump: false }, bottom: { kind: 'none', sp: 6, bump: false }, walls: { kind: 'none', sp: 6 }, lidout: { kind: 'none', sp: 6, bump: false }, lidin: { kind: 'none', sp: 6, bump: false } }, texFace: 'top', colors: 1, c1: '#e9e2cc', c2: '#1a1a1a', single: 'paint' });
// One store for Body, Brain and Parts: S, kept in localStorage. STORED is the text this page last read or wrote,
// so a page that was left open (another tab, or one the Back button brings back) can tell the build changed and take it, instead of saving its old copy over it.
const S_DEF = JSON.stringify(S), VKEY = 'cz_build_v1'; let STORED = null; /* VKEY: versioned crash-proof copy { v: 1, at, S } */
function hydrate() {
  let raw = null; try { raw = localStorage.getItem(KEY); const s = JSON.parse(raw || 'null'); if (s && Array.isArray(s.items)) S = Object.assign(JSON.parse(S_DEF), s); else raw = null; } catch (e) { raw = null; }
  if (raw == null) try { const v = JSON.parse(localStorage.getItem(VKEY) || 'null'); if (v && v.v === 1 && v.S && Array.isArray(v.S.items)) { S = Object.assign(JSON.parse(S_DEF), v.S); raw = JSON.stringify(v.S); localStorage.setItem(KEY, raw); } } catch (e) {} /* iOS reload or a damaged main copy: the versioned copy brings the build back */
  STORED = raw;
  S.look = Object.assign(LOOK0(), S.look || {}); /* a look saved by an older builder gets any part it is missing */
  if (S.look.logo) { const o = S.look.logo; S.look.logos = S.look.logos || {}; S.look.logos[o.face || 'lidout'] = { on: !!o.on, src: o.src || 'text', text: o.text || 'NOCIV', x: o.x, y: o.y, size: o.size || 40, how: o.how || 'dip' }; S.look.logoAt = o.face || 'lidout'; delete S.look.logo; } /* one logo for the whole case becomes the logo of its face */
  if (!S.look.logos) S.look.logos = {};
  if (!S.have) S.have = {};
  if (!Array.isArray(S.attachedParts)) S.attachedParts = [];
  if (!Array.isArray(S.ports)) S.ports = [];
  if (!S.mnt) S.mnt = { face: 'back', type: 'screw', view: 'case' };
  if (!S.phold) S.phold = S.pholes === false ? 'drop' : 'screws';
}
hydrate();
// Walls: Normal 2.4 mm sides and 2.0 mm floor, Thick 3.2 and 2.8. The deck stays 2.4 mm so buttons still reach through it.
function applyWalls() { const t = +S.wallT || (S.walls === 'tough' ? 3.2 : 2.4), r3 = (v) => Math.round(v * 1000) / 1000; R.T = t; R.F = S.wallT ? Math.max(1.2, r3(t - 0.4)) : (S.walls === 'tough' ? 2.8 : 2.0);
  // Clearance: 0.2 mm is the fit the case was drawn with. It moves the openings (R.FIT), the magnet pockets (R.MAG), the gap around the deck (R.CLR) and the split seams (R.SEAM) together.
  const c = tolOf(); R.CLR = r3(0.1 + c); R.MAG = r3(6.1 + c); R.FIT = r3(c - 0.2); R.SEAM = r3(c * 0.375); }
function tolOf() { return S.tol > 0 ? +S.tol : 0.2; }
applyWalls();
const save = () => { try { const raw = JSON.stringify(S); localStorage.setItem(KEY, raw); STORED = raw; localStorage.setItem(VKEY, '{"v":1,"at":' + Date.now() + ',"S":' + raw + '}'); } catch (e) {} histNote(); };
/* iOS Safari can drop a tab at any time: flush the build when the page hides, unless another tab saved a newer one */
const flush = () => { try { const cur = localStorage.getItem(KEY); if (cur != null && cur === STORED && JSON.stringify(S) !== STORED) save(); } catch (e) {} };
addEventListener('pagehide', flush); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
// Undo / Redo: every saved change to the build is one step (moves, swaps, deletes, sizes, shrouds, extras). Where you are (room, page, tab, Simple | Pro) is not a change.
// Quick saves in a row (a drag) fold into one step; snapU() marks a hard edge before a tap that changes things.
const NAVK = ['step', 'tab', 'page', 'seen', 'lastIn', 'moreOn', 'pro', 'fn', 'xsel', 'cat', 'nsel'], HIST = { u: [], r: [], cur: null, t: 0, cut: false, lock: false };
function histKey() { return JSON.stringify(S, function (k, v) { return this === S && NAVK.indexOf(k) > -1 ? undefined : v; }); }
function histNote() { if (HIST.lock) return; const k = histKey(), now = Date.now(); if (HIST.cur == null) { HIST.cur = k; return; } if (k === HIST.cur) return;
  if (HIST.cut || now - HIST.t > 700 || !HIST.u.length) { HIST.u.push(HIST.cur); if (HIST.u.length > 80) HIST.u.shift(); } HIST.t = now; HIST.cut = false; HIST.cur = k; HIST.r.length = 0; histBtns(); }
function histBtns() { const u = document.getElementById('undoTop'), r = document.getElementById('redoTop'); if (u) u.disabled = !HIST.u.length; if (r) r.disabled = !HIST.r.length; }
HIST.cur = histKey();
['pointerdown', 'keydown'].forEach((ev) => document.addEventListener(ev, () => { HIST.cut = true; }, true)); /* each tap or key is its own step; the saves inside one drag fold together */
const LOGOIMGS = {}; /* a logo picture per face, kept on this phone */
function loadLogoImg(f, url) { const im = new Image(); im.onload = () => { markCache = {}; draw(); }; im.src = url; LOGOIMGS[f] = im; }
try { ['lidout', 'lidin', 'top', 'bottom', 'back', 'front', 'left', 'right'].forEach((f) => { const u = localStorage.getItem(KEY + ':logo:' + f); if (u) loadLogoImg(f, u); });
  const old = localStorage.getItem(KEY + ':logo'); if (old) { const f = Object.keys(S.look.logos).find((k) => S.look.logos[k].src === 'image') || S.look.logoAt || 'lidout'; if (!LOGOIMGS[f]) { loadLogoImg(f, old); localStorage.setItem(KEY + ':logo:' + f, old); } } } catch (e) {}
const logoImgKey = () => Object.keys(LOGOIMGS).map((k) => k + LOGOIMGS[k].src.length).join();
const AZ = { z: 1, px: 0, py: 0 }; let PEND = null; /* Arrange zoom, and the spot waiting for "What is here?" */
let uid = S.items.reduce((m, p) => Math.max(m, p.id || 0), 0), sel = null, PHOTO = null;
try { const ph = localStorage.getItem(KEY + ':photo'); if (ph) { PHOTO = new Image(); PHOTO.src = ph; PHOTO.onload = () => draw(); } } catch (e) {}
const PARTS = () => Object.assign({}, CZ.PARTS, S.mine, kbPart(), shroudPart());
const PP = (it) => PARTS()[it.type];
const styleRow = () => CZ.STYLES.find((s) => s[0] === S.style) || CZ.STYLES[0];
const isClam = () => styleRow()[3] === 'clam';
const isPanel = () => S.style === 'panel';
const panels = () => (isClam() ? ['lid', 'base'] : ['top']);
const homePanel = () => (isClam() ? 'base' : 'top');
const PNAME = { lid: 'Lid', base: 'Base', top: 'Top', inside: 'Inside' };
const PLET = { lid: 'L', base: 'B', top: 'T', inside: 'I' };

// ---------- sizes ----------
// Panel: pw, pd = the inside of the box; the panel is 1 mm smaller so it drops in
function dims() { if (isPanel()) return { W: S.pw - 1, D: S.pd - 1 }; const W = S.cols * 20 + 2 * (R.T + R.CLR + 1) + (S.xw || 0), D = S.rows * 20 + 2 * (R.T + R.CLR + 1) + (S.xd || 0); return { W, D }; } /* xw, xd: the odd millimetres past the last 20 mm square, when a size was typed in */
function outline() {
  const d = dims(); if (!isPanel()) return G.outline(S.style, d.W, d.D);
  let base = [G.rrect(0, 0, d.W, d.D, Math.max(0.01, Math.min(S.prad, d.W / 2 - 1, d.D / 2 - 1)))]; const nt = notchPolys();
  if (S.phold === 'ribs') base = G.union(base.concat(ribPolys(d.W, d.D)));
  return nt.length ? G.diff(base, G.union(nt)) : base;
}
function ribPolys(W, D) {
  // snug ribs: little half round bumps on every edge that stand out 0.8 mm and crush a bit against the box, so the panel holds without screws
  const out = [], c = Math.max(S.prad, 3) + 8, along = (L) => { const n = Math.max(2, Math.round((L - 2 * c) / 45) + 1), st = (L - 2 * c) / (n - 1); return Array.from({ length: n }, (_, i) => c + i * st); };
  along(W).forEach((x) => { out.push(G.circle(x, 0.7, 1.5, 20), G.circle(x, D - 0.7, 1.5, 20)); });
  along(D).forEach((y) => { out.push(G.circle(0.7, y, 1.5, 20), G.circle(W - 0.7, y, 1.5, 20)); });
  return out;
}
const EDGE = { bottom: 'Bottom', top: 'Top', left: 'Left', right: 'Right' };
function notchPolys() { // wire notches: each one bites into one edge. at = mm from the left (top, bottom) or from the bottom (sides)
  const d0 = dims(), W = d0.W, D = d0.D, out = [];
  (S.notches || []).forEach((n) => {
    const side = n.edge === 'left' || n.edge === 'right', L = side ? D : W, w = Math.max(2, Math.min(n.w, L - 2)), s = Math.max(w / 2, Math.min(L - w / 2, n.at)), dd = Math.max(1, n.d);
    let loc;
    if (n.shape === 'round') { const r = w / 2, cy = dd - r; loc = cy > 0 ? G.union([G.circle(s, cy, r, 40), G.rect(s - r, -2, s + r, cy)]) : [G.circle(s, cy, r, 40)]; }
    else if (n.shape === 'rrect') loc = [G.rrect(s - w / 2, -4, s + w / 2, dd, Math.max(0.01, Math.min(3, w / 2 - 0.01, (dd + 4) / 2 - 0.01)))];
    else loc = [G.rect(s - w / 2, -2, s + w / 2, dd)];
    const flip = n.edge === 'top' || n.edge === 'left', map = ([a, t]) => (n.edge === 'bottom' ? [a, t] : n.edge === 'top' ? [a, D - t] : n.edge === 'left' ? [t, a] : [W - t, a]);
    loc.forEach((p) => { const q = p.map(map); out.push(flip ? q.reverse() : q); });
  });
  return out;
}
function deckArea() { return G.offset(outline(), isPanel() ? -1 : -(R.T + R.CLR + 0.8)); }
function posts() { const d = dims(); if (isPanel()) { const k = (S.plift > 0 && S.pbase !== 'rim' ? 8.5 : 6.5) + (S.inset || 0); /* half mm: never in line with a notch edge (whole mm), which breaks the mesh */ return S.phold === 'screws' ? [[k, k], [d.W - k, k], [d.W - k, d.D - k], [k, d.D - k]] : []; } return G.postSpots(outline(), d.W * d.D > 30000 ? 6 : 4, S.inset || 0); }
function itemsOn(panel) { return S.items.filter((i) => i.panel === panel); }
function depthOf(panel) { return itemsOn(panel).filter((i) => i.of == null).reduce((m, i) => Math.max(m, PP(i) ? PP(i).depth : 0), 0); } /* parts on a board: the board sets the depth */
function upOf(panel) { return itemsOn(panel).reduce((m, i) => Math.max(m, PP(i) ? Math.max(PP(i).up || 0, i.mt === 'raised' ? 1.6 : 0, i.mt === 'top' ? (PP(i).depth || 0) + (PP(i).up || 0) : 0) : 0), panel !== homePanel() ? 0 : topDeco().some((q) => q.k === 'leg') ? 22 : topDeco().some((q) => q.k === 'arm') ? 14 : topDeco().some((q) => q.mt === 'raised') ? 1.6 : 0); }
// One computed geometry for the whole build. Body, Parts and the 3D view all read the case size from here, so they can never disagree.
function geom() { const d = dims(), h = heights(); return { W: d.W, D: d.D, H: h.H, Hl: h.Hl, closed: h.H + h.Hl, recess: h.recess, recessL: h.recessL }; }
const riserOf = (it) => (it && it.riser != null ? it.riser : 5); /* how high an inside part sits off the floor: its standoffs or its mounting slate */
function keepBox() { // the box stays (size, hinge, its mounts and ports, its height); the electronics go, so you design new insides for it
  backup(); const h = heightsFree(); S.lockBox = { H: h.H, Hl: h.Hl }; if (swapOn()) { const L = swapList(); L.push({ name: 'Insert ' + (L.length + 1), items: [] }); swapTo(L.length - 1); }
  S.items = []; S.pins = {}; S.recipe = null; S.deco = []; sel = null; LAST = null; save(); S.tab[1] = homePanel(); go(1); tag('Box kept: ' + Math.round(dims().W) + ' x ' + Math.round(dims().D) + ' x ' + (h.H + h.Hl) + ' mm. Add the new insides.'); }
function heights() { const h = heightsFree(); if (S.lockBox && !isPanel()) return Object.assign({}, h, { H: S.lockBox.H, Hl: S.lockBox.Hl, grew: h.H > S.lockBox.H || h.Hl > S.lockBox.Hl }); return h; } /* a kept box keeps its height */
function heightsFree() {
  if (isPanel()) return { H: S.pt + (S.plift || 0), Hl: 0, recess: 0, recessL: 0 };
  // base: floor + deepest part or brain + deck, plus room for caps when the lid closes
  const home = homePanel(), inside = S.items.filter((i) => i.panel === 'inside' && i.of == null).reduce((m, i) => Math.max(m, riserOf(i) + (PP(i) ? PP(i).depth : 0)), 0);
  const recess = isClam() ? Math.ceil(upOf(home) + 1) : 0, pcb = pcbOn(); /* with the carrier board: it lies on 5 mm posts and is 1.6 mm thick, so the brain rides 1.6 higher and every part on top has to clear the board */
  const H = Math.max(isClam() ? 18 : 20, Math.ceil(R.F + Math.max(depthOf(home) + (pcb ? 6.6 : 0), inside + (pcb ? 1.6 : 0)) + 3 + R.LT + recess)) + S.add;
  const Hl = isClam() ? Math.max(12, Math.ceil(R.F + depthOf('lid') + 2 + R.LT + Math.ceil(upOf('lid')))) + (S.addL || 0) : 0; /* addL: the lid deeper on its own */
  return { H, Hl, recess, recessL: isClam() ? Math.ceil(upOf('lid')) : 0 };
}

// ---------- layout checks ----------
function fp(it) { const P = PP(it); return G.footprint(P, it.x, it.y, it.r || 0); }
function rectPoly(f) { return [G.rect(f.x0, f.y0, f.x1, f.y1)]; }
function problems(it) {
  const P = PP(it); if (!P) return ['unknown part'];
  const f = fp(it), out = [];
  const area = it.panel === 'inside' ? G.offset(outline(), -(R.T + 0.6)) : deckArea();
  const body = it.of != null && !it.free && it.panel !== 'inside' ? G.cutShape(P, it.x, it.y, it.r || 0) : rectPoly(f); /* a part soldered on a board only needs its hole to fit, not its module size */
  if (body.length && !G.inside(body, area)) out.push('over the edge');
  posts().forEach(([x, y]) => { if (body.length && G.area(G.inter(body, [G.circle(x, y, R.POSTR + 0.8, 16)])) > 0.5) out.push('on a screw post'); });
  if (isClam() && S.wpass === 'channel' && it.panel !== 'lid' && it.of == null) { const m = wireDuct(); if (m && G.area(G.inter(rectPoly(f), [G.mountRect(m, 6.5, R.T + 6.5, 0)])) > 0.5) out.push('on the wire channel'); } /* the duct runs floor to top inside the hinge wall */
  const fam = (a) => (a.of != null ? a.of : a.id); /* a board and the parts on it are one family: the photo already proved they fit together */
  S.items.forEach((q) => {
    if (q === it || !PP(q)) return;
    if ((it.of != null || q.of != null || PP(it).board || PP(q).board) && fam(it) === fam(q)) return;
    if (PP(it).board || PP(q).board) { // the board hangs under the top: a keepout for everything that is not on it, with the clearance around it
      const bd = PP(it).board ? it : q, o = bd === it ? q : it, bf = fp(bd), c = tolOf(), g = fp(o);
      if (!(g.x0 < bf.x1 + c && g.x1 > bf.x0 - c && g.y0 < bf.y1 + c && g.y1 > bf.y0 - c)) return;
      const h = heights(), deckZ = h.H - R.LT - h.recess, under = deckZ - PP(bd).hang - 1.6; /* the board's underside */
      const low = under - (PP(bd).under != null ? PP(bd).under : 8.5); /* the lowest pin or solder joint under the board */
      const clash = o.panel === bd.panel ? PP(o).depth > PP(bd).hang - c : o.panel === 'inside' && R.F + riserOf(o) + PP(o).depth > low - c;
      if (clash) out.push(it === bd ? 'over ' + label(o) : (o.panel === bd.panel ? 'on your board ' : 'under your board ') + label(bd) + ', move it off the board');
      return;
    }
    const g = fp(q), hit = f.x0 < g.x1 - 0.1 && f.x1 > g.x0 + 0.1 && f.y0 < g.y1 - 0.1 && f.y1 > g.y0 + 0.1; if (!hit) return;
    if (q.panel === it.panel) out.push('on top of ' + label(q));
    else if ((it.panel === 'inside' && q.panel === homePanel()) || (q.panel === 'inside' && it.panel === homePanel())) {
      const deck = it.panel === 'inside' ? q : it, brain = it.panel === 'inside' ? it : q, h = heights();
      const bottom = h.H - R.LT - h.recess - PP(deck).depth;
      if (bottom < R.F + riserOf(brain) + PP(brain).depth + (pcbOn() ? 1.6 : 0)) out.push(it === deck ? 'too deep, it hits ' + label(brain) : 'under ' + label(deck) + ', not enough room');
    }
  });
  return out;
}
const allProblems = () => S.items.map((it) => ({ it, list: problems(it) })).filter((x) => x.list.length);
function numbers() { const m = {}; ['lid', 'base', 'top', 'inside'].forEach((p) => { itemsOn(p).slice().sort((a, b) => (b.y - a.y) || (a.x - b.x)).forEach((it, i) => { m[it.id] = PLET[p] + (i + 1); }); }); return m; }
function label(it) { const n = numbers()[it.id]; return (n ? n + ' ' : '') + (PP(it) ? PP(it).short : '') + (it.step ? ' (stepped)' : ''); }
function autoPlace(it) {
  const P = PP(it), d = dims(), tries = [0, 1];
  for (let ry = 0; ry < 2; ry++) for (const r of tries) {
    it.r = r; const f = G.footprint(P, 0, 0, r);
    for (let y = d.D - f.h / 2 - 4; y >= f.h / 2 + 4; y -= 5) for (let x = f.w / 2 + 4; x <= d.W - f.w / 2 - 4; x += 5) { it.x = x; it.y = y; if (!problems(it).length) return true; }
  }
  it.r = 0; it.x = d.W / 2; it.y = d.D / 2; return false;
}
function defaultPanel(P) { if (P.inside) return 'inside'; if (isClam() && (P.screen || P.front || P.lid)) return 'lid'; return homePanel(); } /* front: looks out of the front, like a camera or a sensor */
// Swap part: the same kind of control, in the same spot. Wiring, code.py, Test It and the Shop all follow the new type by themselves.
/* knobs, sliders, click wheels and buttons swap across types; 'step' is a Stepped Button: each press steps 1/4 -> 2/4 -> 3/4 -> 4/4, read like a knob */
const SWAPS = [['pot', 'slider', 'encoder', 'step', 'tact12', 'button16', 'arcade24', 'arcade30'], ['tft28', 'round128', 'oled096']], BTNS = ['tact12', 'button16', 'arcade24', 'arcade30'], STEPN = 'Stepped Button (step on press 1/4 -> 2/4 -> 3/4 -> 4/4)';
const swapGroup = (t) => SWAPS.find((g) => g.indexOf(t) > -1);
const swapCur = (it) => (it.step && BTNS.indexOf(it.type) > -1 ? 'step' : it.type);
function swapBar(it) { const g = it && it.of == null && swapGroup(it.type); if (!g) return ''; const P = PARTS(), c = swapCur(it);
  return '<div class="selbar"><b>Swap part</b><select class="pin" data-swapto="' + it.id + '" aria-label="Swap part">' + g.filter((t) => t === 'step' || P[t]).map((t) => '<option value="' + t + '"' + (t === c ? ' selected' : '') + '>' + esc(t === 'step' ? STEPN : P[t].short) + '</option>').join('') + '</select></div>'; }
function swapType(it, t) { if (!it) return; let st = false; if (t === 'step') { st = true; t = BTNS.indexOf(it.type) > -1 ? it.type : 'button16'; }
  if ((it.type === t && !!it.step === st) || !PARTS()[t]) return; snapU(); const was = label(it).replace(/^\S+ /, ''), at = [it.x, it.y, it.r || 0];
  it.type = t; if (st) it.step = 1; else delete it.step; Object.keys(S.pins || {}).forEach((k) => { if (k.split(':')[0] === String(it.id)) delete S.pins[k]; }); /* its old pin choices: the new part has other pins */
  clampIn(it); if (problems(it).length) { const c = [it.x, it.y, it.r]; if (!placeNear(it)) { it.x = c[0]; it.y = c[1]; it.r = c[2]; } }
  save(); render(); tag(was + ' swapped for ' + (it.step ? 'Stepped Button' : PP(it).short) + (it.x === at[0] && it.y === at[1] ? (it.r === at[2] ? ', same spot' : ', same spot, turned to fit') : ', moved ' + Math.round(Math.hypot(it.x - at[0], it.y - at[1])) + ' mm to fit') + '. Pins and code follow it.'); }
let LAST = null; // the part just added: the 3D box shows it in yellow
// the raised shroud sits on the top (the lid of a lid + base case) as a part, or on the back wall as a wall cut-out. One at a time.
const shroudTop = () => (isClam() ? 'lid' : 'top');
function shroudOn() { return S.items.find((i) => i.type === 'shroud') || S.ports.find((p) => p.kind === 'p_shroud') || null; }
function shroudFace() { const o = shroudOn(); if (o) return o.kind ? 'back' : 'top'; return xp().shroud.face === 'back' && !isPanel() ? 'back' : 'top'; }
function shroudRemove() { S.items = S.items.filter((i) => i.type !== 'shroud'); S.ports = S.ports.filter((p) => p.kind !== 'p_shroud'); if (!S.items.some((i) => i.id === sel)) sel = null; }
function shroudPlace() { SHWHY = ''; if (shroudOn()) return ''; if (shroudFace() === 'top') { const it = addPart('shroud'); it.panel = shroudTop(); autoPlace(it); return ''; }
  const mid = (S.cols - 1) / 2, id = S.ports.reduce((q, x) => Math.max(q, x.id || 0), 0) + 1; let why = '';
  for (const a of anchorsOf('back').sort((p, q) => Math.abs(p.u - mid) - Math.abs(q.u - mid))) { const p = { id, kind: 'p_shroud', face: 'back', anchor: { u: a.u, v: 0, du: 0, dz: 0 } }, w = portBlocked(p); if (!w) { S.ports.push(p); return ''; } why = why || w; }
  SHWHY = why || 'no room'; return SHWHY; }
let SHWHY = '';
function shroudBackWH() { const Q = xp().shroud, g = geom(); return { w: Q.w, h: Math.max(8, Math.min(Q.h, g.H - R.F - 6)) }; } /* on the back wall the hole is as tall as the wall allows */
function shroudRects(p) { const d = shroudBackWH(), g = geom(), zc = (R.F + 2 + g.H - 4) / 2 + ((p.anchor || {}).dz || 0); return [{ u0: -d.w / 2, u1: d.w / 2, z0: zc - d.h / 2, z1: zc + d.h / 2 }]; }
function shroudCtl() {
  const on = shroudOn(), f = shroudFace(), topN = isPanel() ? 'Panel' : isClam() ? 'Top / Lid' : 'Top', nb = (x, y, l, s) => '<button data-act="shnudge" data-nx="' + x + '" data-ny="' + y + '" aria-label="' + l + '">' + s + '</button>';
  let h = '<div class="row"><b>Put it on</b>' + seg('xsh_f', isPanel() ? [['top', topN]] : [['top', topN], ['back', 'Back']], f) + '</div>';
  if (!on) return h + (SHWHY && f === 'back' ? '<p class="note bad">No room on the back wall: ' + esc(SHWHY) + '. Make it narrower or shorter, or put it on the ' + topN.toLowerCase() + '.</p>' : '') + '<button class="btn dark" data-act="shroudplace" style="margin-top:6px">Place it on the ' + (f === 'back' ? 'back wall' : topN.toLowerCase()) + '</button>';
  const why = on.kind ? portBlocked(on) : '', w = on.kind ? portAt(on) : null;
  h += '<div class="selbar nud"><b>Move</b>' + nb(-1, 0, 'Left', '&larr;') + nb(0, 1, 'Up', '&uarr;') + nb(0, -1, 'Down', '&darr;') + nb(1, 0, 'Right', '&rarr;') + '</div>';
  h += '<p class="note keep" style="margin:-2px 0 6px">On the ' + (on.kind ? 'back wall' : topN.toLowerCase()) + ': X ' + (on.kind ? (w ? w.s.toFixed(0) : '?') + ' mm along, Y ' + ((on.anchor.dz || 0) > 0 ? '+' : '') + (on.anchor.dz || 0) + ' mm' : on.x.toFixed(0) + ', Y ' + on.y.toFixed(0) + ' mm') + '. Arrows move it 2 mm' + (on.kind ? '' : ', or drag it in Arrange') + '.</p>' + (why ? '<p class="note bad">Blocked by the ' + esc(why) + ': move it, or it is left out of the files.</p>' : '');
  return h + '<button class="btn" data-act="shroudrm" style="margin-top:4px">Remove Shroud</button>'; }
function addPart(type) { const P = PARTS()[type]; const it = { id: ++uid, type, panel: defaultPanel(P), x: 0, y: 0, r: 0 }; S.items.push(it); autoPlace(it); if (P && P.cat === 'brain' && P.inside) snapBrain(it); if (P && P.jack) jackHole(); LAST = it.id; focusPanel(it); save(); return it; }
// Arrange opens on the side the newest part landed on
const hasBattery = () => S.items.some((i) => PP(i) && PP(i).mah);
function snapBrain(it) { // the brain sits against a wall with its USB end through it; a battery lets it go anywhere
  const P = PP(it); if (!P || P.cat !== 'brain' || !P.inside || hasBattery() || it.of != null || isPanel()) return;
  const b = G.bbox(outline()), m = R.T + 0.6 + 0.3, x0 = it.x, y0 = it.y, r0 = it.r || 0, hf = hingeFace();
  const walls = [['left', 0, () => [b.x0 + m + P.w / 2, y0]], ['right', 2, () => [b.x1 - m - P.w / 2, y0]], ['front', 1, () => [x0, b.y0 + m + P.w / 2]], ['back', 3, () => [x0, b.y1 - m - P.w / 2]]].filter((w) => w[0] !== hf);
  walls.sort((a, c) => { const pa = a[2](), pc = c[2](); return Math.hypot(pa[0] - x0, pa[1] - y0) - Math.hypot(pc[0] - x0, pc[1] - y0); });
  for (const [, r, at] of walls) { const p = at(); it.r = r; it.x = p[0]; it.y = p[1]; if (!problems(it).length) return; for (const d of [10, -10, 20, -20, 30, -30]) { if (r % 2) it.x = p[0] + d; else it.y = p[1] + d; if (!problems(it).length) return; } }
  it.x = x0; it.y = y0; it.r = r0;
}
function focusPanel(it) { const p = panels().indexOf(it.panel) >= 0 ? it.panel : homePanel(), pi = PAGES.findIndex((q) => q.name === 'Parts'); S.tab[1] = p; if (!S.seen) S.seen = {}; S.seen[pi] = '1:' + p; }
function removePart(type) { snapU(); for (let i = S.items.length - 1; i >= 0; i--) if (S.items[i].type === type) { S.items.splice(i, 1); break; } save(); }
function reflow() { // style or size changed: move parts onto the panels this shape has, re-place anything that no longer fits
  S.items.forEach((it) => { if (it.panel !== 'inside' && panels().indexOf(it.panel) < 0) it.panel = defaultPanel(PP(it)) === 'inside' ? 'inside' : homePanel(); });
  S.items.forEach(clampIn); /* first slide anything outside back in, so it keeps its spot near the edge */
  S.items.forEach((it) => { if (it.of == null && problems(it).length) autoPlace(it); });
  syncAll(); keepInside();
}
// No part ever floats outside the case: a part past the edge slides back inside the deck (or the floor, for inside parts).
function areaOf(it) { return it.panel === 'inside' ? G.offset(outline(), -(R.T + 0.6)) : deckArea(); }
function clampIn(it) { if (!it || it.of != null || !PP(it)) return false; const b = G.bbox(areaOf(it)), f = fp(it); if (f.w > b.w || f.h > b.h) return false;
  const dx = Math.max(0, b.x0 - f.x0) - Math.max(0, f.x1 - b.x1), dy = Math.max(0, b.y0 - f.y0) - Math.max(0, f.y1 - b.y1); if (!dx && !dy) return false; it.x += dx; it.y += dy; if (PP(it).board) syncKids(it); return true; }
function placeNear(it) { // the spot it has, a quarter turn there, then the nearest free spot around it (2.5 mm steps, up to 25 mm away)
  const x0 = it.x, y0 = it.y, r0 = it.r || 0, rs = [r0, (r0 + 1) % 4];
  for (let d = 0; d <= 25; d += 2.5) for (const r of rs) for (let a = 0; a < (d ? 16 : 1); a++) { it.r = r; it.x = x0 + d * Math.cos(a * Math.PI / 8); it.y = y0 + d * Math.sin(a * Math.PI / 8); clampIn(it); if (!problems(it).length) return true; }
  it.x = x0; it.y = y0; it.r = r0; return autoPlace(it); }
const overEdge = () => S.items.filter((it) => it.of == null && PP(it) && problems(it).indexOf('over the edge') > -1);
function keepInside() { // still over the edge (a round corner, or no room left): pack them all again at this size, and only grow the body if that cannot work
  if (!S.items.length) return; S.items.forEach((it) => { if (clampIn(it) && problems(it).length) placeNear(it); }); /* slid back in onto another part: the nearest free spot */
  if (!overEdge().length) return; overEdge().forEach((it) => placeNear(it)); if (!overEdge().length) return;
  const keep = [S.cols, S.rows], list = S.items.filter((i) => i.of == null && PP(i)); list.forEach((i) => { i.x = -999; i.y = -999; });
  list.sort((a, b) => (fp(b).w * fp(b).h) - (fp(a).w * fp(a).h)).forEach((i) => { autoPlace(i); if (PP(i).board) syncKids(i); });
  if (overEdge().length && !isPanel() && !S.lockBox) fitAll(); if (S.lockBox) { S.cols = keep[0]; S.rows = keep[1]; } }
// ---------- a built board and the parts on it ----------
// The board item hangs under the top. Each part on it is its own item with an offset (dx, dy, dr) in the board's frame,
// locked to the board unless she unlocks it. Moving or turning the board moves them all.
const kidsOf = (b) => S.items.filter((i) => i.of === b.id);
const boardOf = (k) => S.items.find((i) => i.id === k.of);
function syncKids(b) {
  const a = (b.r || 0) * Math.PI / 2, c = Math.cos(a), sn = Math.sin(a);
  kidsOf(b).forEach((k) => { if (k.free) return; k.x = b.x + k.dx * c - k.dy * sn; k.y = b.y + k.dx * sn + k.dy * c; k.r = ((b.r || 0) + (k.dr || 0)) % 4; if (PP(k) && PP(k).cat !== 'brain') k.panel = b.panel; });
}
function syncAll() { S.items.forEach((k) => { if (k.free && boardOf(k)) { unSync(k); k.free = false; } }); S.items.filter((i) => PP(i) && PP(i).board).forEach(syncKids); } /* parts on a board always stay with it now; old unlocked ones are put back where they are */
function unSync(k) { const b = boardOf(k); if (!b) return; const a = -(b.r || 0) * Math.PI / 2, x = k.x - b.x, y = k.y - b.y; k.dx = x * Math.cos(a) - y * Math.sin(a); k.dy = x * Math.sin(a) + y * Math.cos(a); k.dr = (((k.r || 0) - (b.r || 0)) % 4 + 4) % 4; }
function setBoardTop(P, top) { P.top = Math.max(4, Math.min(40, top)); P.hang = Math.max(2, P.top - 1.5 - R.LT); P.depth = +(P.hang + 1.6 + (P.under != null ? P.under + 1.5 : 10)).toFixed(1); } /* under = measured space below the board (pins, solder, wires), plus 1.5 mm clearance; 10 mm when not measured */
function kidH(k) { const b = boardOf(k), P = b && PP(b); return k.h != null ? k.h : (P && P.top) || 9; } /* height of this part above the board, she can change it per part */
function pokeNote(k) {
  const b = boardOf(k), P = b && PP(b); if (!P || !P.board) return '';
  const deckTop = (P.hang || 6) + R.LT, poke = +(kidH(k) - deckTop).toFixed(1), K = PP(k);
  if (K && K.screen) return poke >= -1 ? 'The screen sits ' + Math.abs(poke) + ' mm ' + (poke >= 0 ? 'above' : 'under') + ' the top surface.' : 'The screen sits ' + Math.abs(poke) + ' mm under the top: you look down into the window. Raise it on taller pins, or lower the top (board, Tallest button).';
  if (poke >= 1) return 'Pokes ' + poke + ' mm through the top.';
  if (poke >= 0) return 'Only ' + poke + ' mm through the top: hard to press. Use a taller cap.';
  return 'Sits ' + Math.abs(poke) + ' mm under the top: your finger cannot reach it. Use a taller cap, or lower the top (board, Tallest button).';
}
const KID_TYPES = ['tact12', 'button16', 'arcade24', 'arcade30', 'dpad', 'pot', 'encoder', 'thumb', 'slider', 'led5', 'ring12', 'speaker28', 'tft28', 'round128', 'oled096', 'cyd', 'hdmi5', 'hdmi7', 'pico', 'picow', 'pico2', 'esp32'];

// ---------- looks: logo, labels, textures, per face ----------
// A face is what you see from outside. Each maps to one side of one half in its own print frame.
const SHORTF = { lidout: 'Lid out', lidin: 'Lid in', top: 'Top', bottom: 'Bottom', walls: 'Sides' };
function faces() { if (isPanel()) return [['top', 'Front']]; return isClam() ? [['lidout', 'Lid outside'], ['lidin', 'Lid inside'], ['top', 'Base top'], ['bottom', 'Bottom']] : [['top', 'Top'], ['bottom', 'Bottom']]; }
function faceHalf(f) { return f === 'lidout' || f === 'lidin' ? 'lid' : homePanel(); }
function faceSide(f) { return f === 'lidin' || f === 'top' ? 'top' : 'bottom'; }
function toOwn(f, polys) {
  const d = dims();
  if (f === 'bottom') return polys.map((p) => p.map(([x, y]) => [d.W - x, y]).reverse());
  if (f === 'lidin') return polys.map((p) => p.map(([x, y]) => [d.W - x, d.D - y]));
  if (f === 'lidout') return S.style === 'small' ? polys.map((p) => p.map(([x, y]) => [x, d.D - y]).reverse()) : polys.map((p) => p.map(([x, y]) => [d.W - x, y]).reverse());
  return polys;
}
let markCache = {}, PAINTED = false; // PAINTED: in 3D, show pressed-in marks filled with the marks color, the way they look after painting
// Logos: one per face. Flat faces (lid, top, bottom) take pressed in, raised or cut through. The back wall too; the other walls are pressed in 0.7 mm so they print clean standing up.
const WALLF = { back: 1, front: 1, left: 1, right: 1 };
SHORTF.back = 'Back'; SHORTF.front = 'Front'; SHORTF.left = 'Left'; SHORTF.right = 'Right';
function logoFaces() { return faces().concat(isPanel() ? [] : [['back', 'Back'], ['front', 'Front'], ['left', 'Left'], ['right', 'Right']]); }
function logoFace() { const f = S.look.logoAt; return logoFaces().some((x) => x[0] === f) ? f : logoFaces()[0][0]; }
function LG(f) { const L = S.look; if (!L.logos) L.logos = {}; f = f || logoFace(); if (!L.logos[f]) L.logos[f] = { on: false, src: 'text', text: 'NOCIV', x: null, y: null, size: WALLF[f] ? 30 : 40, how: 'dip' }; return L.logos[f]; }
const logoOn = (f) => !!(S.look.logos && S.look.logos[f] && S.look.logos[f].on);
function wallMid(f) { const b = G.bbox(outline()), v = f === 'back' || f === 'front'; return [v ? (b.x0 + b.x1) / 2 : (b.y0 + b.y1) / 2, geom().H / 2]; }
function wallArt() { // the side-wall logos of the base, as one band per 0.2 mm print layer: where the wall is pressed in, raised or cut through
  if (isPanel()) return []; const out = outline(), b = G.bbox(out), h = geom(), res = [];
  ['back', 'front', 'left', 'right'].forEach((f) => { if (!logoOn(f)) return; const L = LG(f), sh = logoShape(f); if (!sh.length) return;
    const v = f === 'back' || f === 'front', lo = v ? b.x0 : b.y0, hi = v ? b.x1 : b.y1, flip = f === 'back' || f === 'left' ? -1 : 1, mid = wallMid(f), cs = L.x == null ? mid[0] : L.x, zc = L.y == null ? mid[1] : L.y; /* read from outside: along the back and the left wall, right is toward -x / -y */
    const zTop = f === hingeFace() ? h.H - 2 * R.KR - 1 : h.H - 1, polys = G.inter(sh.map((p) => p.map(([x, y]) => [cs + flip * x, zc + y])), [G.rect(lo + 3, R.F + 0.6, hi - 3, zTop)]); if (!polys.length) return;
    const w = G.wallAt(out, f, cs); if (!w) return; const bb = G.bbox(polys), bands = [];
    for (let i = Math.floor(bb.y0 / 0.2); i * 0.2 < bb.y1; i++) { const z0 = i * 0.2, mz = z0 + 0.1, iv = G.inter(polys, [G.rect(bb.x0 - 1, mz - 0.02, bb.x1 + 1, mz + 0.02)]).map((p) => { const q = G.bbox([p]); return [q.x0, q.x1]; }).filter((q) => q[1] - q[0] >= 0.4).sort((a, c) => a[0] - c[0]), m = [];
      iv.forEach((q) => { const last = m[m.length - 1]; if (last && q[0] <= last[1] + 0.2) last[1] = Math.max(last[1], q[1]); else m.push(q.slice()); });
      if (m.length) bands.push({ z0: +z0.toFixed(2), z1: +(z0 + 0.2).toFixed(2), iv: m }); }
    res.push({ face: f, x: w[0], y: w[1], how: f === 'back' ? L.how : 'dip', depth: 0.7, bands }); });
  return res;
}
function logoShape(f) {
  f = f || logoFace(); const L = LG(f), img = LOGOIMGS[f], key = 'logo:' + L.src + ':' + L.text + ':' + L.size + ':' + (img ? f + img.src.length : 0);
  if (markCache[key]) return markCache[key];
  let cv = null;
  if (L.src === 'image' && img && img.complete && img.naturalWidth) { cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; cv.getContext('2d').drawImage(img, 0, 0); }
  else if (L.text) cv = G.textCanvas(L.text);
  const polys = cv ? G.traceCanvas(cv, L.size) : [];
  return (markCache[key] = polys);
}
function labelText(it, i) { const L = S.look.labels; if (L.text[it.id] != null) return L.text[it.id]; const P = PP(it); if (!P || P.cat !== 'press' || P.printed === 'dpad') return ''; return 'ABXYLRSTUV'[i] || String(i + 1); }
function labelShapes(panel) {
  const L = S.look.labels; if (!L.on) return [];
  const out = [], list = itemsOn(panel).filter((i) => PP(i)).sort((a, b) => (numbers()[a.id] > numbers()[b.id] ? 1 : -1)), btns = list.filter((i) => PP(i).cat === 'press');
  list.forEach((it) => {
    const t = labelText(it, btns.indexOf(it)); if (!t) return;
    const key = 'lab:' + t + ':' + L.size; if (!markCache[key]) { const tc = G.textCanvas(t), w = L.size * tc.width / tc.height; markCache[key] = G.traceCanvas(tc, w); }
    const f = fp(it), y = L.place === 'below' ? f.y0 - L.size * 0.75 : f.y1 + L.size * 0.75;
    out.push(...G.place(markCache[key], it.x, y, 1, 0));
  });
  return out;
}
function marksFor(face, raw) {
  const own = (f, x) => (raw ? x : toOwn(f, x));
  // returns { top:[...], bottom:[...] } marks for that face, already in its half's own frame
  const lk = S.look, list = [], d = dims(), many = lk.colors > 1, glueIn = !many && lk.single === 'glue';
  const hw = (how) => (how === 'cut' ? { how: 'cut' } : how === 'raised' ? { how: 'glue', up: 1.0 } : glueIn ? { how: 'glue', up: 0 } : { how: 'dip', fill: many || PAINTED });
  let keep = [];
  if (logoOn(face)) { const L = LG(face), lp = G.place(logoShape(face), L.x == null ? d.W / 2 : L.x, L.y == null ? d.D / 2 : L.y, 1, 0); if (lp.length) { list.push(Object.assign({ polys: own(face, lp), name: 'logo' }, hw(L.how))); keep.push(...lp); } }
  if ((face === 'top' || face === 'lidin') && lk.labels.on) { const lp = labelShapes(faceHalf(face)); if (lp.length) { list.push(Object.assign({ polys: own(face, lp), name: 'labels' }, hw(lk.labels.how))); keep.push(...lp); } }
  const tx = lk.tex[face];
  if (tx && tx.kind !== 'none') {
    let area = face === 'top' || face === 'lidin' ? G.offset(outline(), -(R.T + R.CLR + 1.2)) : G.offset(outline(), -2);
    if (face === 'top' || face === 'lidin') { const cuts = []; itemsOn(faceHalf(face)).filter((i) => PP(i)).forEach((i) => cuts.push(...G.cutShape(PP(i), i.x, i.y, i.r || 0))); posts().forEach(([x, y]) => cuts.push(G.circle(x, y, 4, 16))); if (cuts.length) area = G.diff(area, G.offset(G.union(cuts), 2)); }
    if (keep.length) area = G.diff(area, G.offset(G.union(keep), 1.2));
    let pat = G.inter(G.texture(tx.kind, G.bbox(outline()), tx.sp, 7), area);
    if (tx.bump) pat = G.diff(area, pat);
    if (pat.length) list.push({ polys: own(face, pat), how: 'dip', fill: many, name: 'texture' });
  }
  return list;
}
function looksFor(panel) {
  const o = { top: [], bottom: [] };
  faces().forEach(([f]) => { if (faceHalf(f) !== panel) return; o[faceSide(f)].push(...marksFor(f)); });
  const w = S.look.tex.walls; o.walls = w.kind !== 'none' ? { kind: w.kind, sp: w.sp, depth: 0.8 } : null;
  return o;
}

// ---------- the halves ----------
function halfFor(panel, h) {
  if (isPanel()) return panelBuilt();
  const d = dims(), lid = panel === 'lid', flip = (it) => ({ P: PP(it), x: lid ? d.W - it.x : it.x, y: lid ? d.D - it.y : it.y, r: ((it.r || 0) + (lid ? 2 : 0)) % 4, mt: it.mt || 'flush', riser: it.riser, fit: it.fit || 0 });
  const parts = itemsOn(panel).filter((i) => PP(i)).map((i) => Object.assign(flip(i), { spring: S.spring && i.type === 'tact12' })); let inside = lid ? [] : S.items.filter((i) => i.panel === 'inside' && PP(i) && i.of == null).map(flip);
  if (!lid && pcbOn()) { const Bd = boardBuild(); if (Bd.ok) { /* the Pico is soldered to the board: no posts for it. The board gets four posts for M2 screws. */
    inside = inside.map((q) => (q.P.cat === 'brain' ? Object.assign({}, q, { P: Object.assign({}, q.P, { holes: null }) }) : q));
    const bx = Bd.box; inside.push({ P: { w: bx.w, h: bx.h, cat: 'pcb', holes: Bd.mounts.map((m) => [m.x - bx.x0, m.y - bx.y0]), hole: 2.1 }, x: (bx.x0 + bx.x1) / 2, y: (bx.y0 + bx.y1) / 2, r: 0 }); } }
  let port = null, port2 = null;
  const onBoard = lid ? null : S.items.find((i) => i.of != null && PP(i) && PP(i).cat === 'brain'), bp = onBoard && boardOf(onBoard) && PP(boardOf(onBoard));
  if (!lid) {
    /* USB opening in the wall the brain's USB end points at. A brain on a board sits just under the top, so the opening starts lower than the top by the board's hang.
       A charger board with its own plug (USB-C) gets a second opening. */
    const o = G.bbox(outline()), wallPort = (b, z) => { const P = b.P, r = b.r % 4; return r === 0 ? { x0: o.x0 - 1, x1: b.x - P.w / 2 + 2, y0: b.y - 7, y1: b.y + 7, z } : r === 2 ? { x0: b.x + P.w / 2 - 2, x1: o.x1 + 1, y0: b.y - 7, y1: b.y + 7, z } : r === 1 ? { x0: b.x - 7, x1: b.x + 7, y0: o.y0 - 1, y1: b.y - P.w / 2 + 2, z } : { x0: b.x - 7, x1: b.x + 7, y0: b.y + P.w / 2 - 2, y1: o.y1 + 1, z }; };
    const br = onBoard ? flip(onBoard) : inside.find((q) => q.P.cat === 'brain');
    const ap = autoPorts(), ids = ap.map((q) => q.auto), pb = pwrBrain(), brA = !onBoard && pb && (ids.indexOf(pb.id) > -1 || (pwrMode() && pwrMode() !== 'usb' && USBK[pb.type])); /* a stepped port (or a battery brain away from the wall) replaces the open slot */
    if (br && !brA) port = wallPort(br, onBoard && bp ? Math.max(R.F + 1, (h.H - R.LT - h.recess) - (bp.hang || 6) - 4) : R.F + 3);
    const ch = inside.find((q) => q.P.charger && q.P.usb), hasA = () => S.items.some((i) => PP(i) && PP(i).charger && ids.indexOf(i.id) > -1);
    if (ch && !hasA()) { const p2 = wallPort(ch, R.F + 1.5); if (port) port2 = p2; else port = p2; }
  }
  const hingeOn = isClam() && S.hinge === 'printed', lk = looksFor(panel);
  return G.buildHalf({ inset: S.inset || 0, style: S.style, W: d.W, D: d.D, H: lid ? h.Hl : h.H, recess: lid ? h.recessL : h.recess, parts, inside, port, port2, deco: !lid && panel === homePanel() ? decoPolys() : [], decoOut: lid && isClam() ? decoPolys('lid') : [],
    top: lk.top, bottom: lk.bottom, walls: lk.walls, snap: S.snap, deckMag: !S.snap && !!S.deckMag, hatch: !lid && panel === homePanel() ? hatchKind() : null, hatchTol: tolOf(), hatchPack: hpack(),
    mounts: !lid && panel === homePanel() ? activeMounts() : lid && isClam() ? activeLidMounts() : [], art: !lid && panel === homePanel() ? wallArt() : [], ports: (!lid && panel === homePanel() ? activePorts().concat(autoPorts()) : []).concat(isClam() ? wireNotch(lid ? 'lid' : 'base') : []), duct: !lid && isClam() && S.wpass === 'channel' ? wireDuct() : null,
    magnets: isClam() && S.magnets, hinge: { on: hingeOn, side: S.style === 'small' ? (S.hside === 'right' ? 'right' : 'left') : 'back' }, hingeSet: lid ? 'b' : 'a' });
}
// Swap panels: a frame (a ledge round the inside of the box) stays put; each insert plate drops into it and is held at the 4 corners by M3 screws or 6 x 3 mm magnets.
// Every insert has the same outline and the same corner holes, so any of them fits the same frame.
const SWAP = { wall: 4, lip: 7 };
const swapOn = () => isPanel() && !!(S.swap && S.swap.on);
function swapCorners() { const d = dims(), k = SWAP.wall + SWAP.lip / 2; return [[k, k], [d.W - k, k], [d.W - k, d.D - k], [k, d.D - k]]; }
function swapFix() { const d = dims(), k = SWAP.wall + SWAP.lip / 2, at = (L) => [Math.max(k + 12, L * 0.25), Math.min(L - k - 12, L * 0.75)]; const [x1, x2] = at(d.W), [y1, y2] = at(d.D); return [[x1, k], [x2, d.D - k], [k, y2], [d.W - k, y1]]; } /* 4 countersunk holes that screw the frame into the box, one per side, off the corners and off the middle where a big frame is split */
const swapLedge = () => (S.swap && S.swap.mount === 'magnets' ? 5 : 4);
function swapFrame() { // the frame, printed ledge down: the ledge the inserts rest on, and the wall round them
  const o = outline(), mag = S.swap.mount === 'magnets', LT = swapLedge(), c = swapCorners(), ring = G.diff(o, G.offset(o, -(SWAP.wall + SWAP.lip))), wall = G.diff(o, G.offset(o, -SWAP.wall)), L = [];
  const fx = swapFix(), cs = (R.HOLE + R.FIT * 2) / 2, ch = 3 - cs, csk = (z) => Math.max(cs, cs + z - (LT - ch)); /* 90 degree countersink for a 6 mm head at the top, stepped so it prints with no overhang */
  const zs = [0, LT].concat(mag ? [LT - R.MAGD] : []).concat([0, 1, 2, 3].map((i) => +(LT - ch + i * ch / 4).toFixed(3))).filter((z, i, a) => z >= 0 && z <= LT && a.indexOf(z) === i).sort((a, b) => a - b);
  for (let i = 0; i + 1 < zs.length; i++) { const z0 = zs[i], z1 = zs[i + 1], cut = fx.map(([x, y]) => G.circle(x, y, csk(z1), 32));
    if (mag && z0 >= LT - R.MAGD - 1e-6) c.forEach(([x, y]) => cut.push(G.circle(x, y, R.MAG / 2, 32)));
    if (!mag) c.forEach(([x, y]) => cut.push(G.circle(x, y, R.PILOT / 2 + R.FIT, 24))); /* the M3 x 8 cuts its own thread in the 4 mm ledge */
    L.push({ polys: G.diff(ring, cut), z0, z1 }); }
  L.push({ polys: wall, z0: LT - 0.1, z1: LT + S.pt + 0.2 }); /* the wall overlaps the ledge 0.1 mm, so they print as one */
  return L;
}
function swapInsert(plate) { // turn the panel into an insert: inside the frame wall with the clearance, the corner holes or magnet pockets
  const o = outline(), c = swapCorners(), T = S.pt, shape = G.inter(plate, G.offset(o, -(SWAP.wall + tolOf())));
  if (S.swap.mount === 'magnets') { const dp = Math.min(R.MAGD, T - 0.8), pk = c.map(([x, y]) => G.circle(x, y, R.MAG / 2, 32)); return [{ polys: G.diff(shape, pk), z0: 0, z1: dp, tag: 'floor' }, { polys: shape, z0: dp, z1: T, tag: 'floor' }]; }
  return [{ polys: G.diff(shape, c.map(([x, y]) => G.circle(x, y, R.HOLE / 2 + R.FIT, 24))), z0: 0, z1: T, tag: 'floor' }];
}
function swapList() { if (!S.swap.inserts || !S.swap.inserts.length) S.swap.inserts = [{ name: 'Insert 1', items: null }]; if (S.swap.cur == null || S.swap.cur >= S.swap.inserts.length) S.swap.cur = 0; return S.swap.inserts; }
function swapTo(i) { const L = swapList(); L[S.swap.cur].items = JSON.parse(JSON.stringify(S.items)); S.items = JSON.parse(JSON.stringify(L[i].items || [])); L[i].items = null; S.swap.cur = i; S.pins = {}; uid = S.items.reduce((m, p) => Math.max(m, p.id || 0), uid); }
function swapHtml() {
  const on = swapOn(), L = on ? swapList() : [];
  return '<div class="row"><b>Swap panels</b>' + seg('swapOn', [['0', 'Off'], ['1', 'On']], on ? '1' : '0') + '</div>' + (!on ? '' : '<div class="row"><b>Mount with</b>' + seg('swapMount', [['screws', 'M3 Screws'], ['magnets', 'Magnets (6 x 3 mm)']], S.swap.mount) + '</div>' +
    '<p class="note keep" style="margin:0 0 6px">A frame screws into your box with 4 countersunk screws. Each insert drops into it and is held at the 4 corners by ' + (S.swap.mount === 'magnets' ? 'magnets' : 'M3 x 8 mm screws') + '. Every insert has the same outline and the same corner holes, so they swap.</p>' +
    '<div class="chosen" style="margin-bottom:8px">' + L.map((q, i) => '<span data-ins="' + i + '" style="cursor:pointer' + (i === S.swap.cur ? ';background:#1a1a1a;color:#fff' : '') + '">' + esc(q.name) + ' (' + (i === S.swap.cur ? S.items.length : (q.items || []).length) + ')</span>').join('') + '</div><button class="btn" data-act="insnew" style="padding:8px;margin-bottom:8px">New insert</button>');
}
function panelBuilt() {
  // one flat plate: outline with notches, minus every part's hole, the screen screws and the corner screws. Marks pressed into the front.
  const o = outline(), T = S.pt, D = 0.6, cuts = [];
  itemsOn('top').filter((i) => PP(i)).forEach((i) => {
    const P = PP(i), a = (i.r || 0) * Math.PI / 2;
    // on the floor of the box the whole screen comes up through the panel; raised, the panel sits on top and shows only the picture
    const fit = i.fit || 0; /* after a test fit: this cutout wider or narrower */
    if (P.screen && !S.plift) { const w = (i.r % 2 ? P.h : P.w) + 1 + fit, h = (i.r % 2 ? P.w : P.h) + 1 + fit; cuts.push(G.rrect(i.x - w / 2, i.y - h / 2, i.x + w / 2, i.y + h / 2, 1.5)); } else cuts.push(...G.cutShape(P, i.x, i.y, i.r || 0, fit / 2));
    (P.mountHoles || []).forEach((m) => cuts.push(G.circle(i.x + m.x * Math.cos(a) - m.y * Math.sin(a), i.y + m.x * Math.sin(a) + m.y * Math.cos(a), m.d / 2 + 0.2, 24)));
  });
  if (!swapOn()) posts().forEach(([x, y]) => cuts.push(G.circle(x, y, R.HOLE / 2, 24))); /* in swap mode the frame holds the insert, not the box screws */
  const dip = [], thru = [], fill = [];
  looksFor('top').top.forEach((m) => { if (m.how === 'cut') thru.push(...m.polys); else { dip.push(...m.polys); if (m.fill || m.how === 'glue') fill.push(...m.polys); } });
  const holes = cuts.concat(thru), plate = holes.length ? G.diff(o, G.union(holes)) : o, tray = [], inlay = [];
  if (dip.length && T > 1.2) { const rec = G.union(dip); tray.push({ polys: plate, z0: 0, z1: T - D, tag: 'floor' }, { polys: G.diff(plate, rec), z0: T - D, z1: T, tag: 'floor' }); if (fill.length) inlay.push({ polys: G.inter(G.union(fill), plate), z0: T - D, z1: T, tag: 'inlayB' }); }
  else tray.push({ polys: plate, z0: 0, z1: T, tag: 'floor' });
  if (S.plift > 0 && S.pbase === 'rim') { // a lip: one wall under the whole edge, bosses in the corners for screws, gaps where the notches are so wires pass
    const d = dims(), wall = 2.4; let rim = G.diff(o, G.offset(o, -wall));
    if (S.phold === 'screws') rim = G.diff(G.offset(G.offset(G.union(rim.concat(posts().map(([x, y]) => G.circle(x, y, 4.5, 28)))), 1), -1), posts().map(([x, y]) => G.circle(x, y, R.HOLE / 2, 20))); /* 1 mm fillet where a boss meets the wall: stronger, and no straight run the mesh maker trips on */
    const gaps = []; (S.notches || []).forEach((n) => { const side = n.edge === 'left' || n.edge === 'right', L = side ? d.D : d.W, w = Math.max(2, Math.min(n.w, L - 2)), sAt = Math.max(w / 2, Math.min(L - w / 2, n.at)), deep = n.d + wall + 2;
      gaps.push(n.edge === 'bottom' ? G.rect(sAt - w / 2, -1, sAt + w / 2, deep) : n.edge === 'top' ? G.rect(sAt - w / 2, d.D - deep, sAt + w / 2, d.D + 1) : n.edge === 'left' ? G.rect(-1, sAt - w / 2, deep, sAt + w / 2) : G.rect(d.W - deep, sAt - w / 2, d.W + 1, sAt + w / 2)); });
    if (gaps.length) rim = G.diff(rim, gaps);
    rim = G.inter(rim, holes.length ? G.diff(o, G.union(holes)) : o);
    if (rim.length) tray.push({ polys: rim, z0: -S.plift, z1: 0, tag: 'leg' });
  } else if (S.plift > 0) { // legs under the panel: in the corners and along long edges, each with a screw hole when it screws down
    const d = dims(), sp = [], xs = [8.5, d.W - 8.5], ys = [8.5, d.D - 8.5]; if (d.W > 150) xs.push(d.W / 3, d.W * 2 / 3); if (d.D > 150) ys.push(d.D / 3, d.D * 2 / 3); // thirds, so a seam in the middle never cuts a leg
    xs.forEach((x) => ys.forEach((y) => { if ((x > 9 && x < d.W - 9) && (y > 9 && y < d.D - 9)) return; sp.push([x, y]); }));
    const legs = []; sp.forEach(([x, y]) => { const c = G.circle(x, y, 4.5, 28); if (G.area(G.inter([c], plate)) < G.area([c]) - 0.5) return; legs.push(S.phold === 'screws' ? G.diff([c], [G.circle(x, y, R.HOLE / 2, 20)])[0] : c); });
    if (legs.length) tray.push({ polys: G.union(legs), z0: -S.plift, z1: 0, tag: 'leg' });
  }
  if (swapOn()) return { out: G.offset(o, -(SWAP.wall + tolOf())), tray: swapInsert(plate), deck: [], extra: [], posts: [], H: T, deckZ: T - R.LT, inlay: [], stick: [], snap: false, frame: swapFrame() }; /* the insert, and the frame it drops into */
  return { out: o, tray, deck: [], extra: [], posts: [], H: T, deckZ: T - R.LT, inlay, stick: [], snap: false };
}
function halves() { const h = heights(); return panels().map((p) => ({ key: p, name: PNAME[p], built: halfFor(p, h) })); }

// ---------- seams for the bed ----------
function footOf(built) {
  const polys = built.out.slice();
  built.extra.forEach((k) => { if (k.side === 'back') polys.push(G.rect(k.s0, k.edge - 1.2, k.s1, k.edge + k.g + k.r)); else if (k.side === 'left') polys.push(G.rect(k.edge - k.g - k.r, k.s0, k.edge + 1.2, k.s1)); else polys.push(G.rect(k.edge - 1.2, k.s0, k.edge + k.g + k.r, k.s1)); });
  return G.union(polys);
}
function plan(built) {
  const foot = footOf(built), bed = S.bed, tryOne = (dir, n) => {
    const regs = n ? G.pieceRegions(foot, dir, n, S.tab3) : [G.offset([G.rect(-999, -999, 999, 999)], 0)[0]].map((p) => [p]);
    const feet = regs.map((r) => G.bbox(G.inter(foot, r)));
    return { dir, n, regs, feet, fit: feet.every((f) => G.fitsBed(f, bed)) };
  };
  if (S.sdir !== 'auto' || S.sn !== 'auto') {
    const dir = S.sdir === 'auto' ? 'v' : S.sdir, n = S.sn === 'auto' ? null : +S.sn;
    if (n != null) return tryOne(dir, n);
    for (let k = 0; k <= 5; k++) { const t = tryOne(dir, k); if (t.fit) return t; }
    return tryOne(dir, 5);
  }
  const order = [['v', 0], ['v', 1], ['h', 1], ['v', 2], ['h', 2], ['both', 1], ['v', 3], ['h', 3], ['both', 2], ['both', 3]];
  for (const [dir, n] of order) { const t = tryOne(dir, n); if (t.fit) return t; }
  return tryOne('both', 3);
}

// ---------- icons ----------
const I = {
  brain: '<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  arrange: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/><circle cx="15" cy="15" r="2.5"/>',
  body: '<path d="M3 9l9-5 9 5v8l-9 4-9-4z"/><path d="M3 9l9 4 9-4M12 13v8"/>',
  print: '<path d="M4 20h16M6 20V6h12v14"/><path d="M9 10h6M12 10v6"/>',
  files: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M10 13v6M7 16l3 3 3-3"/>',
  snap: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  parts: '<rect x="3" y="3" width="7" height="7"/><circle cx="17.5" cy="6.5" r="3.5"/><rect x="3" y="14" width="7" height="7" rx="3.5"/><path d="M14 14h7v7h-7z"/>',
  picks: '<path d="M12 3l2.6 5.6 6 .7-4.5 4 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.5-4 6-.7z"/>',
  lid: '<rect x="3" y="4" width="18" height="12" rx="2"/><rect x="6" y="7" width="12" height="6"/><path d="M3 20h18"/>',
  base: '<path d="M3 13h18v6H3z"/><circle cx="8" cy="10" r="2"/><circle cx="15" cy="10" r="2"/>',
  top: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M13 10h5M13 14h5"/>',
  size: '<path d="M3 21L21 3M3 21h6M3 21v-6M21 3h-6M21 3v6"/>',
  shape: '<rect x="3" y="7" width="10" height="10" rx="2"/><circle cx="17" cy="12" r="4"/>',
  fit: '<path d="M4 7h16M4 12h10M4 17h6"/><circle cx="18" cy="16" r="3"/>',
  measure: '<rect x="2" y="7" width="20" height="10" rx="2"/><path d="M6 7v4M10 7v3M14 7v4M18 7v3"/>',
  printer: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>',
  mat: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  split: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v5l2 1-2 1v4l-2 1 2 1v5"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  file: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/>',
  wire: '<path d="M4 6c6 0 6 12 12 12h4M4 12h6M4 18c4 0 3-6 8-6"/>',
  style: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.2-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="11" cy="7" r="1.2"/><circle cx="15.5" cy="8" r="1.2"/>',
  logo: '<circle cx="12" cy="12" r="9"/><path d="M8.5 15V9l7 6V9"/>',
  labels: '<path d="M3 12l8-8h9v9l-8 8z"/><circle cx="15.5" cy="8.5" r="1.5"/>',
  tex: '<rect x="3" y="3" width="18" height="18"/><path d="M3 9l6-6M3 15L15 3M3 21L21 3M9 21l12-12M15 21l6-6"/>',
  colors: '<circle cx="8" cy="8" r="4"/><circle cx="16" cy="8" r="4"/><circle cx="12" cy="15" r="4"/>',
  cart: '<path d="M3 4h3l2.5 11h10L21 7H7"/><circle cx="10" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/>',
  strong: '<rect x="3" y="6" width="18" height="12" rx="1"/><rect x="7" y="10" width="10" height="4"/><path d="M12 2v3M12 19v3"/>'
};
const ico = (n) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (I[n] || '') + '</svg>';
// clear line-art silhouettes for the parts people pick most: knob, slider, 4x4 keypad, screens, joystick, click wheel, buttons
const LART = {
  pot: '<circle cx="24" cy="18" r="11"/><path d="M24 18V9"/><path d="M10 29l3-3M38 29l-3-3"/>',
  slider: '<rect x="5" y="16" width="38" height="4" rx="2"/><rect x="19" y="8" width="9" height="20" rx="2"/><path d="M23.5 12v12"/>',
  keypad44: '<rect x="8" y="2" width="32" height="32" rx="3"/>' + [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => '<rect x="' + (11 + c * 7.2) + '" y="' + (5 + r * 7.2) + '" width="5" height="5" rx="1"/>').join('')).join(''),
  oled096: '<rect x="5" y="5" width="38" height="26" rx="2"/><rect x="9" y="11" width="30" height="16" rx="1"/><path d="M17 8h2M22 8h2M27 8h2M32 8h2"/>',
  tft28: '<rect x="4" y="4" width="40" height="28" rx="2"/><rect x="8" y="8" width="29" height="20" rx="1"/><path d="M40 12v12"/>',
  round128: '<circle cx="24" cy="18" r="15"/><circle cx="24" cy="18" r="10"/>',
  thumb: '<circle cx="24" cy="24" r="10"/><path d="M24 24l6-12"/><circle cx="31" cy="10" r="5"/>',
  stick: '<rect x="12" y="20" width="24" height="12" rx="3"/><path d="M24 20V10"/><circle cx="24" cy="7" r="5"/>',
  encoder: '<circle cx="24" cy="18" r="10"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => { const a = i * Math.PI / 6; return '<path d="M' + (24 + 10 * Math.cos(a)).toFixed(1) + ' ' + (18 + 10 * Math.sin(a)).toFixed(1) + 'L' + (24 + 13 * Math.cos(a)).toFixed(1) + ' ' + (18 + 13 * Math.sin(a)).toFixed(1) + '"/>'; }).join('') + '<path d="M21 14h6v8h-6z"/>',
  tact12: '<rect x="15" y="9" width="18" height="18" rx="2"/><circle cx="24" cy="18" r="5"/><path d="M11 12h4M11 24h4M33 12h4M33 24h4"/>',
  button16: '<rect x="13" y="7" width="22" height="22" rx="3"/><circle cx="24" cy="18" r="7"/>',
  arcade24: '<circle cx="24" cy="18" r="13"/><circle cx="24" cy="18" r="8"/>', arcade30: '<circle cx="24" cy="18" r="15"/><circle cx="24" cy="18" r="9"/>',
  dpad: '<path d="M19 4h10v9h9v10h-9v9H19v-9h-9V13h9z"/>',
  board: '<rect x="10" y="3" width="28" height="30" rx="2"/><rect x="19" y="13" width="10" height="10" rx="1"/><path d="M20 3v-1h8v1"/>' + [0, 1, 2, 3, 4].map((i) => '<path d="M14 ' + (8 + i * 5) + 'h1M33 ' + (8 + i * 5) + 'h1"/>').join(''),
  speaker: '<circle cx="24" cy="18" r="14"/><circle cx="24" cy="18" r="4"/>' + [0, 1, 2, 3, 4, 5].map((i) => { const a = i * Math.PI / 3; return '<circle cx="' + (24 + 9 * Math.cos(a)).toFixed(1) + '" cy="' + (18 + 9 * Math.sin(a)).toFixed(1) + '" r="1"/>'; }).join('')
};
// real-world colour, one entry per shape in order ('fill' or 'fill|stroke'); shapes past the list stay outlines
const LF = (() => { const dk = '#2b2b2b', mt = '#9aa3ad', gy = '#b8b0a2', sc = '#1f2937', sky = '#7cc8f5', pcb = '#2f7a4b', lt = 'none|#f3efe6';
  return { board: [pcb, '#1a1a1a', '#d4a017'], oled096: [sc, sky], tft28: [sc, sky], round128: [sc, sky], tact12: [mt, dk], button16: [mt, dk], arcade24: [dk, '#4b5563'], arcade30: [dk, '#4b5563'],
    pot: [dk, lt], encoder: [dk].concat(Array(12).fill('none'), [mt]), thumb: ['#3a3a3a', 'none', dk], stick: [mt, 'none', dk], slider: [mt, dk, lt], keypad44: [dk].concat(Array(16).fill('#e5e7eb')),
    dpad: [dk], speaker: [mt, '#5b636d'].concat(Array(6).fill('#2b2f35')), servo: [mt, '#6b7480', '#d7dce2', '#4b5563'] }; })();
LART.servo = '<rect x="4" y="17" width="40" height="5" rx="1.5"/><rect x="9" y="12" width="30" height="20" rx="2"/><rect x="9" y="5" width="18" height="6" rx="3"/><circle cx="18" cy="8" r="2"/>';
const tintArt = (k, pal) => { const L = pal || LF[k] || []; let n = 0; return (LART[k] || '').replace(/<(rect|circle|path|ellipse)\b/g, (m) => { const c = L[n++]; if (!c || c === 'none') return m; const [f, s] = c.split('|'); return m + (f && f !== 'none' ? ' fill="' + f + '"' : '') + (s ? ' stroke="' + s + '"' : ''); }); };
const artKey = (k) => (LART[k] ? k : BOARD_OF[k] ? 'board' : /^speaker/.test(k) ? 'speaker' : ''); /* every brain board and speaker gets a picture too */
const lineArt = (k0, sz, pal) => { const k = artKey(k0); return (LART[k] ? '<svg class="la" viewBox="0 0 48 36"' + (sz ? ' width="' + sz + '" height="' + Math.round(sz * 0.75) + '"' : '') + ' aria-hidden="true">' + tintArt(k, pal) + '</svg>' : '') };
/* the category tiles in Parts: a soft color per job, like Screens, Sensors and Brain */
const FTINT = { press: ['#f6dc9a', '#e8826f'], turn: ['#bcd3ec'].concat(Array(12).fill('none'), ['#4f6f94']), out: ['#f8cfae', '#d9773f'].concat(Array(6).fill('#8a3b16')), move: ['#c3d6f3', '#8fb2e8', '#eef3fb', '#5b86c9'] };
const ARTIMG = {}; /* the same line art as an image, for the canvas cards in Parts, Shop and Board */
function artImg(k0) { const k = artKey(k0); if (!k) return null; let im = ARTIMG[k]; if (!im) { im = ARTIMG[k] = new Image(); im.onload = () => { try { draw(); } catch (e) {} }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 36" width="192" height="144" fill="none" stroke="#1a1a1a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + tintArt(k) + '</svg>'); } return im.complete && im.naturalWidth ? im : null; }
function partSvg(P) {
  const m = Math.max(P.w, P.h) + 6, s = 'width="100%" height="36" viewBox="' + (-m / 2) + ' ' + (-m / 2) + ' ' + m + ' ' + m + '"';
  let g = '';
  if (!P.cut || P.screen || P.inside || P.measured || P.cut.o === 'rect' || P.cut.o === 'keys') g += '<rect x="' + (-P.w / 2) + '" y="' + (-P.h / 2) + '" width="' + P.w + '" height="' + P.h + '" rx="1.5" fill="' + (P.screen ? '#22262a' : '#2f7a4b') + '" opacity="' + (P.inside ? .9 : .8) + '"/>';
  const c = P.cut || {};
  if (P.screen) g += c.o === 'circle' ? '<circle r="' + c.d / 2 + '" fill="#8fd3ff"/>' : '<rect x="' + (-c.w / 2) + '" y="' + (-c.h / 2) + '" width="' + c.w + '" height="' + c.h + '" fill="#8fd3ff"/>';
  else if (c.o === 'circle') g += '<circle r="' + c.d / 2 + '" fill="#1a1a1a"/>' + (P.up > 9 ? '<circle r="' + c.d / 2.6 + '" fill="#c8412f"/>' : '');
  else if (c.o === 'cross') g += '<path d="M' + (-c.w / 2) + ' ' + (-c.t / 2) + 'h' + (c.w / 2 - c.t / 2) + 'v' + (-(c.w / 2 - c.t / 2)) + 'h' + c.t + 'v' + (c.w / 2 - c.t / 2) + 'h' + (c.w / 2 - c.t / 2) + 'v' + c.t + 'h' + (-(c.w / 2 - c.t / 2)) + 'v' + (c.w / 2 - c.t / 2) + 'h' + (-c.t) + 'v' + (-(c.w / 2 - c.t / 2)) + 'h' + (-(c.w / 2 - c.t / 2)) + 'z" fill="#1a1a1a"/>';
  else if (c.o === 'slot') g += '<rect x="' + (-P.w / 2) + '" y="-3" width="' + P.w + '" height="6" rx="2" fill="#2f7a4b"/><rect x="' + (-c.w / 2) + '" y="-1.5" width="' + c.w + '" height="3" rx="1.5" fill="#1a1a1a"/><rect x="-3" y="-4" width="6" height="8" fill="#c8412f"/>';
  else if (c.o === 'keys') g += KEYXY(c).map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="' + c.d / 2 + '" fill="#1a1a1a"/>').join('');
  else if (c.o === 'grille') g += '<circle r="' + c.d / 2 + '" fill="#999"/>' + [0, 1, 2, 3, 4, 5].map((i) => '<circle cx="' + 6 * Math.cos(i * 1.047) + '" cy="' + 6 * Math.sin(i * 1.047) + '" r="1.6" fill="#1a1a1a"/>').join('') + '<circle r="1.6" fill="#1a1a1a"/>';
  else if (c.o === 'ring') g += '<circle r="' + (c.d / 2 - 4) + '" fill="none" stroke="#1a1a1a" stroke-width="8"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => '<circle cx="' + (c.d / 2 - 4) * Math.cos(i * .5236) + '" cy="' + (c.d / 2 - 4) * Math.sin(i * .5236) + '" r="1.8" fill="#ffd23a"/>').join('');
  (P.userHoles || []).forEach((h) => { g += '<circle cx="' + h.x + '" cy="' + (-h.y) + '" r="' + h.d / 2 + '" fill="#1a1a1a"/>'; });
  (P.userCuts || []).forEach((u) => { const c = u.cut; g += c.o === 'rect' ? '<rect x="' + (u.x - c.w / 2) + '" y="' + (-u.y - c.h / 2) + '" width="' + c.w + '" height="' + c.h + '" fill="#8fd3ff"/>' : c.o === 'cross' ? '<rect x="' + (u.x - c.w / 2) + '" y="' + (-u.y - c.t / 2) + '" width="' + c.w + '" height="' + c.t + '" fill="#1a1a1a"/><rect x="' + (u.x - c.t / 2) + '" y="' + (-u.y - c.w / 2) + '" width="' + c.t + '" height="' + c.w + '" fill="#1a1a1a"/>' : '<circle cx="' + u.x + '" cy="' + (-u.y) + '" r="' + (c.d || 6) / 2 + '" fill="#1a1a1a"/>'; });
  if (P.inside && P.holes) P.holes.forEach(([x, y]) => { g += '<circle cx="' + (x - P.w / 2) + '" cy="' + (y - P.h / 2) + '" r="1.2" fill="#f3efe6"/>'; });
  return '<svg ' + s + '>' + g + '</svg>';
}
function styleSvg(id) { const sz = SIZES[id], W = sz[0] * 20 + 8, D = sz[1] * 20 + 8, o = G.outline(id, W, D)[0], m = Math.max(W, D) + 10; return '<svg viewBox="' + (-5 - (m - 10 - W) / 2) + ' ' + (-5 - (m - 10 - D) / 2) + ' ' + m + ' ' + m + '"><path d="M' + o.map(([x, y]) => x.toFixed(1) + ' ' + (D - y).toFixed(1)).join('L') + 'Z" fill="#e9e2cc" stroke="#1a1a1a" stroke-width="' + m / 40 + '"/>' + (CZ.STYLES.find((s) => s[0] === id)[3] === 'clam' ? '<path d="M' + (id === 'small' ? '4 4V' + (D - 4) : '4 ' + (4) + 'H' + (W - 4)) + '" stroke="#c8412f" stroke-width="' + m / 25 + '"/>' : '') + '</svg>'; }

function texSvg(k) {
  if (k === 'none') return '<svg viewBox="0 0 40 24"><rect width="40" height="24" fill="#e9e2cc"/></svg>';
  const b = { x0: 0, y0: 0, x1: 40, y1: 24 }, polys = G.inter(G.texture(k, b, 6, 3), [G.rect(0, 0, 40, 24)]);
  return '<svg viewBox="0 0 40 24"><rect width="40" height="24" fill="#e9e2cc"/><path d="' + polys.map((p) => 'M' + p.map(([x, y]) => x.toFixed(1) + ' ' + (24 - y).toFixed(1)).join('L') + 'Z').join('') + '" fill="#1a1a1a" fill-rule="evenodd"/></svg>';
}
// ---------- steps and tabs ----------
const STEPS = [['Brain', 'brain'], ['Arrange', 'arrange'], ['Body', 'body'], ['Style', 'style'], ['Print', 'print'], ['Files', 'files']];
// her order (11-04): Body first, then its look (color, texture, buttons), then the Brain inside, then Arrange
const ORDER = [2, 3, 0, 1, 4, 5];
// What a device can do. Parts opens on these instead of on a catalog. [id (= part category), name, one line, part whose picture stands for it]
const FUNCS = [['brain', 'Brain', 'The chip that runs it', 'pico'], ['screen', 'Screens', 'It shows things', 'tft28'], ['press', 'Buttons', 'Buttons, a D-pad', 'button16'], ['turn', 'Knobs', 'Knobs, a wheel, a stick', 'encoder'], ['sense', 'Sensors', 'Camera, motion, distance', 'pir'],
  ['out', 'Light and sound', 'Lights, a speaker', 'speaker28'], ['move', 'Motors', 'Turns an arm', 'servo'], ['power', 'Power', 'Battery, charger, switch', 'lipo1200'], ['mine', 'My own board', 'Measure it with your phone', null]];
// electronics in three groups: what you do to it, what it does back, and what ties it together
const FGROUPS = [['Inputs', 'you press, turn or slide, or it senses', ['press', 'turn', 'sense']], ['Outputs', 'it shows, lights, sounds or moves', ['screen', 'out', 'move']], ['Connections', 'the brain, the power, your own board', ['brain', 'power', 'mine']]];
const FN_STAND = '<svg viewBox="0 0 60 36" aria-hidden="true"><path d="M17 31L29 6l9 4-12 25z" fill="#c8412f" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/><path d="M35 15l11 17" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/><path d="M7 33h47" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/></svg>';
const PSVG = { p_hdmi: '<svg viewBox="0 0 60 36" aria-hidden="true"><rect x="6" y="6" width="48" height="24" rx="3" fill="#e9e2cc" stroke="#1a1a1a" stroke-width="2"/><path d="M16 13h28v6l-3 4H19l-3-4z" fill="#1a1a1a"/></svg>', p_minihdmi: '<svg viewBox="0 0 60 36" aria-hidden="true"><rect x="6" y="6" width="48" height="24" rx="3" fill="#e9e2cc" stroke="#1a1a1a" stroke-width="2"/><path d="M20 14h20v5l-2 3H22l-2-3z" fill="#1a1a1a"/></svg>', p_microhdmi: '<svg viewBox="0 0 60 36" aria-hidden="true"><rect x="6" y="6" width="48" height="24" rx="3" fill="#e9e2cc" stroke="#1a1a1a" stroke-width="2"/><path d="M24 15h12v4l-1 2H25l-1-2z" fill="#1a1a1a"/></svg>', p_jack: '<svg viewBox="0 0 60 36" aria-hidden="true"><rect x="6" y="6" width="48" height="24" rx="3" fill="#e9e2cc" stroke="#1a1a1a" stroke-width="2"/><circle cx="30" cy="18" r="6" fill="#1a1a1a"/></svg>', p_usbc: '<svg viewBox="0 0 60 36" aria-hidden="true"><rect x="6" y="6" width="48" height="24" rx="3" fill="#e9e2cc" stroke="#1a1a1a" stroke-width="2"/><rect x="20" y="15" width="20" height="7" rx="3.5" fill="#1a1a1a"/></svg>', p_switch: '<svg viewBox="0 0 60 36" aria-hidden="true"><rect x="6" y="6" width="48" height="24" rx="3" fill="#e9e2cc" stroke="#1a1a1a" stroke-width="2"/><rect x="19" y="14" width="22" height="9" fill="#1a1a1a"/><rect x="22" y="16" width="7" height="5" fill="#c8412f"/></svg>', p_vent: '<svg viewBox="0 0 60 36" aria-hidden="true"><rect x="6" y="6" width="48" height="24" rx="3" fill="#e9e2cc" stroke="#1a1a1a" stroke-width="2"/>' + [17, 24, 31, 38, 45].map((x) => '<rect x="' + (x - 1.5) + '" y="11" width="3" height="14" fill="#1a1a1a"/>').join('') + '</svg>' };
const XGROUPS = [['Stand and carry', ['dstand', 'stand', 'handle', 'feet', 'charm']], ['Camera and sensor', ['lens', 'grip', 'tripod']], ['Character', ['char', 'deco', 'limbs']], ['Moving parts', ['gears', 'hinge', 'clamp']], ['Keyboard', ['keys']], ['Hardware', ['panel', 'standoff', 'clip']]];
const NEWP = ' Sized from published specs, not from a test print.';
function attachSeg(id) { return '<div class="row"><b>Attach to</b>' + seg('xatt_' + id, [['case', 'Case Zero'], ['box', 'Existing Box']], xp()[id].box ? 'box' : 'case') + '</div>'; } /* a box you already have: wood screws, no Case Zero walls */
function xmeta(id) { // one printed part: [short name, what it is and how it goes on, its few settings]
  const X = xp(), fits = stepper('xs_t', 'Fits', X.stand.t + ' mm thick' + (X.stand.auto ? ' (your case)' : ''));
  return {
    dstand: ['Mini desk stand', 'A small angled cradle that holds your device up on a desk. It prints flat on its side, no supports, and fixes to the ' + (X.dstand.m === 'tripod' ? 'tripod nut' : X.dstand.m === 'snap' ? 'snap pin spot' : 'M3 spot') + ' on the bottom of the case through the slot in its back.' + NEWP, '<div class="row"><b>Fix with</b>' + seg('xds_m', [['m3', 'M3'], ['snap', 'Snap'], ['tripod', 'Tripod']], X.dstand.m) + '</div><div class="row"><b>Leans</b>' + seg('xds_a', [['15', '15'], ['25', '25'], ['35', '35 deg']], String(X.dstand.a)) + '</div>' + stepper('xds_w', 'Wide', X.dstand.w + ' mm') + '<button class="btn' + (X.dstand.on ? ' dark' : '') + '" data-act="dstandon" style="margin-top:6px">' + (X.dstand.on ? 'In my print files &#10003; (tap to take it out)' : 'Add it to my print files') + '</button>'],
    stand: ['Kickstand', 'Clips onto the bottom edge and leans it back. No pin to snap.', fits + '<div class="row"><b>Leans</b>' + seg('xs_a', [['15', '15'], ['25', '25'], ['35', '35 deg']], String(X.stand.a)) + '</div>'],
    handle: ['Handle', (X.handle.box ? 'For a box you already have: the arch on its own plate with 2 countersunk 3.4 mm holes. #4 wood screws (12 mm) go straight into the box side or lid.' : 'An arch to carry it by. Glue its two feet to the top or the back with super glue or epoxy: tape will not hold it.') + NEWP, attachSeg('handle') + stepper('xh_l', 'Grip', X.handle.l + ' mm wide')],
    feet: ['Feet', X.feet.box ? 'Four L-shaped corner legs for a box you already have. Each has 2 countersunk 3.4 mm holes: #4 wood screws go up through the leg into the bottom of the box (20 mm long for these legs). Nothing touches your panels.' : 'Little round feet so it does not slide. Screw on, or glue.', attachSeg('feet') + (X.feet.box ? '' : '<div class="row"><b>Fix</b>' + seg('xf_hole', [['1', 'Screw hole'], ['0', 'Glue']], X.feet.hole ? '1' : '0') + '</div>') + stepper('xf_h', 'Tall', X.feet.h + ' mm')],
    char: ['Character', 'A whole character to print: head, body, arms, hands, legs and feet, with a face. Spin it above to see it from every side. The head turns on its neck, the arms and legs swing and hold a pose.' + NEWP, charHtml(), 'print files (zip)'],
    deco: ['Face, arms, legs', 'Give the case you built a face, and arms and legs that swing. Drag a piece onto the case above, then drag it where you want it. It becomes part of your case files.' + NEWP, decoHtml(), 'none'],
    body: ['Body', 'A torso your case sits on like a head. Two arms and two legs screw to its sides and hold a pose when you tighten them. You need 4 M3 x 12 screws (they cut their own thread in the torso) and 2 M3 x 20 with nuts for the feet. A heavy case can tip it: spread the legs.' + NEWP, stepper('xb_h', 'Torso', X.body.h + ' mm tall') + stepper('xl_l', 'Arms, legs', X.limbs.l + ' mm long') + fits],
    limbs: ['Legs or arms', 'No torso: 2 clips grab an edge of the case, then 4 bars and 2 feet. Join them with 6 M3 x 20 screws and nuts, tighten to hold a pose.' + NEWP, stepper('xl_l', 'Bars', X.limbs.l + ' mm long') + fits],
    gears: ['Gears', 'Two gears on a base with pegs, so they turn the moment they come off the printer. The small one has 18 teeth. ' + (X.gears.n === 18 ? 'Same size: they turn at the same speed, in opposite directions.' : 'Turn the small one and the big one turns ' + (X.gears.n / 18).toFixed(X.gears.n % 18 ? 1 : 0) + ' times slower and stronger.') + ' Take them off the base to use them on your own axles, ' + (0.75 * (18 + X.gears.n)).toFixed(1).replace('.0', '') + ' mm apart. Print in PETG if they will do real work.' + NEWP, stepper('xg_n', 'Big gear', X.gears.n + ' teeth')],
    hinge: ['Hinge', 'Two leaves, the same print twice. Flip one over, slide an M3 x 30 screw through both and add a nut. Glue the leaves down: a door, a lid, a flap.' + NEWP, stepper('xhi_l', 'Leaf', X.hinge.l + ' mm long')],
    spring: ['Spring', 'A flat zigzag that pushes back. Good for a button that pops back up or a latch. Light pushes only. PETG lasts longer than PLA, which goes soft over time.' + NEWP, stepper('xsp_n', 'Bends', String(X.spring.n))],
    clamp: ['Clamp', 'Hooks over a shelf or desk edge. Push the wedge in to lock it. The hole in its back takes an M3 screw, so a leg bar or your own part bolts on.' + NEWP, stepper('xcl_t', 'Grips', X.clamp.t + ' mm thick')],
    panel: ['Panel', 'A flat plate with a screw hole in each corner. A door, a cover, a shelf, a base for your own idea.' + NEWP, stepper('xp_w', 'Wide', X.panel.w + ' mm') + stepper('xp_h', 'Tall', X.panel.h + ' mm')],
    keys: ['Keyboard', 'Your own mechanical keyboard, ' + kb().c + ' across and ' + kb().r + ' down: a printed plate the switches click into, printed key caps, and a board you can order that joins every key to a Pico. Every key is one square. For a space bar, two keys share one long cap. Plate and board follow the Cherry MX data sheet.' + NEWP, kbHtml(), 'plate'],
    standoff: ['Standoffs', 'Lift a board off the floor. The screw cuts its own thread in the plastic.', '<div class="row"><b>Screw</b>' + seg('xo_s', [['m25', 'M2.5 (Pi)'], ['m3', 'M3']], X.standoff.s) + '</div>' + stepper('xo_h', 'Tall', X.standoff.h + ' mm')],
    clip: ['Cable clips', 'Keep wires tidy inside. Stick on with tape or glue.', stepper('xc_d', 'Cable', X.clip.d + ' mm')],
    shroud: ['Raised shroud', 'More depth for a shallow box: cut a hole, screw this frame over it, and drop the piece you cut out back in as its lid. Room for a microcontroller, a battery or a switch.', stepper('xsh_w', 'Wide', X.shroud.w + ' mm') + stepper('xsh_h', 'Tall', X.shroud.h + ' mm') + stepper('xsh_d', 'Deeper', X.shroud.d + ' mm') + stepper('xsh_c', 'Cover', X.shroud.ct + ' mm thick') + shroudCtl() + '<p class="note keep" style="margin:4px 0 0">The hole is ' + X.shroud.w + ' x ' + X.shroud.h + ' mm; the cut-out piece drops into a ' + (X.shroud.w + 2 * tolOf()).toFixed(1) + ' x ' + (X.shroud.h + 2 * tolOf()).toFixed(1) + ' mm rabbet at the top.</p>'],
    lens: ['Lens ring', 'A ring round a camera lens or a sensor window. Mount it on the front (the lid) over the opening.', stepper('xln_d', 'Lens', X.lens.d + ' mm across')],
    grip: ['Grip', 'A pad with finger dips, to hold a camera or a scanner steady. Mount it on the back (the base) or a side.', stepper('xgr_l', 'Long', X.grip.l + ' mm')],
    tripod: ['Tripod mount', 'Puts a standard 1/4 in tripod thread on the bottom: a 1/4-20 hex nut sits in a pocket inside it. Push the nut in, then mount it with an M3 screw or a snap pin. The nut is on your Shop list.', ''],
    charm: ['Charm & Hook', (X.charm.box ? 'For a box you already have: the lug on its own plate with countersunk 3.4 mm holes for #4 wood screws (12 mm), straight into the box. ' : '') + 'A lug on the case with a 5 mm eyelet, for a keyring clasp or the printed hook. Mount it below. Mini sits on one screw or pin and fits narrow walls; Chunky is bigger and sits on two.', attachSeg('charm') + '<div class="row"><b>Size</b>' + seg('xch_s', [['mini', 'Mini'], ['chunky', 'Chunky']], X.charm.size) + '</div><div class="row"><b>Hook</b>' + seg('xch_h', [['lug', 'Lug only'], ['hook', 'With printed hook']], X.charm.hook) + '</div><p class="note keep" style="margin:0 0 6px">' + (X.charm.hook === 'lug' ? 'Lug only: a metal trigger clasp keyring goes through the eyelet. It is on your Shop list.' : 'With printed hook: a 4 mm carabiner hook comes as its own flat file. Print it flat, in PETG if you can.') + ' A charm already on the case keeps its size: remove it and mount it again to change it.</p>'] }[id];
}
// ---------- which filament, and is it worth printing ----------
const FILS = [['pla', 'PLA'], ['petg', 'PETG'], ['abs', 'ABS / ASA'], ['tpu', 'TPU (soft)']];
const fil = () => (FILS.some((f) => f[0] === S.fil) ? S.fil : (S.material === 'petg' || S.material === 'abs') ? S.material : 'pla');
const FILNOTE = { pla: 'The easy one. It goes soft at about 55 to 60 C, so keep PLA prints out of a parked car and off a sunny windowsill.', petg: 'Tougher and bends before it breaks. Holds up to about 80 C. It strings a little.', abs: 'Takes about 100 C. It needs an enclosed printer and fresh air, and big flat pieces like to curl.', tpu: 'Soft like rubber. Great where you want grip, wrong where you want stiff.' };
// 2 = good, 1 = works with a catch, 0 = not worth the plastic. Each with the reason in plain words.
const SOFT = [0, 'Too soft. It would bend instead of holding.'];
const FILV = {
  pla: { char: [2, 'PLA is stiff and prints clean, which suits a figure that sits on a desk.'], stand: [2], handle: [1, 'Carries a light device. PLA snaps instead of bending, so do not swing it around.'], feet: [2], body: [2], limbs: [2], gears: [1, 'Good to play with and for light jobs. Under real work the teeth wear and warm up.'], hinge: [2], spring: [0, 'It pushes back on day one, then goes limp if it stays squeezed. PLA does that.'], clamp: [1, 'It grips, but PLA slowly relaxes under a steady squeeze. Push the wedge in again now and then.'], panel: [2], keys: [2, 'PLA is stiff, and stiff is what a switch plate wants. Key caps too.'], standoff: [2], clip: [1, 'Fine if the cable goes in once. It can snap if you keep opening it.'] },
  petg: { char: [2], stand: [2], handle: [2, 'Bends before it breaks, so it is the safer handle.'], feet: [2], body: [2], limbs: [2], gears: [2], hinge: [2], spring: [2, 'The best common filament for a spring.'], clamp: [2], panel: [2], keys: [1, 'PETG gives a little more than PLA, so typing feels softer. The rim keeps it flat. Key caps can come out stringy inside.'], standoff: [2], clip: [2] },
  abs: { char: [1, 'The hollow head and body can warp or split unless the printer is enclosed.'], stand: [2], handle: [2], feet: [2], body: [2], limbs: [2], gears: [2], hinge: [2], spring: [1, 'Springy at first, tires faster than PETG.'], clamp: [2], panel: [1, 'Big flat pieces curl at the corners unless the printer is enclosed.'], keys: [1, 'A wide thin plate curls at the corners unless the printer is enclosed.'], standoff: [2], clip: [2] },
  tpu: { char: SOFT, stand: SOFT, handle: [1, 'A soft strap. It stretches, so only for something light.'], feet: [2, 'Grippy. The best filament for feet.'], body: SOFT, limbs: SOFT, gears: SOFT, hinge: SOFT, spring: [1, 'Squashy like rubber, not springy.'], clamp: SOFT, panel: SOFT, keys: SOFT, standoff: SOFT, clip: [2] } };
const VWORD = ['Skip it', 'With a catch', 'Good'];
const filV = (id) => (FILV[fil()] || {})[id] || [2];
function filBar() { const f = fil(), ids = [].concat(...XGROUPS.map((g) => g[1])), n = [0, 0, 0]; ids.forEach((k) => { n[filV(k)[0]]++; }); const nm = FILS.find((x) => x[0] === f)[1];
  return '<div class="row" style="margin-top:0"><b>My filament</b>' + seg('fil', FILS.map((x) => [x[0], x[1].replace(' (soft)', '')]), f) + '</div><p class="note" style="margin:4px 0 10px">' + FILNOTE[f] + ' <b>With ' + nm + ': ' + n[2] + ' good' + (n[1] ? ', ' + n[1] + ' with a catch' : '') + (n[0] ? ', ' + n[0] + ' not worth printing' : '') + '.</b></p>'; }
function filLine(id) { const v = filV(id), nm = FILS.find((x) => x[0] === fil())[1]; return '<p class="vline v' + v[0] + '"><b>In ' + nm + ': ' + VWORD[v[0]] + '.</b> ' + (v[1] || (v[0] === 2 ? 'Nothing to watch for.' : '')) + '</p>'; }
// ---------- print settings: set for you, with what each one changes ----------
const PQ = { fast: [0.28, 'Faster', 'About a third less time. You will see the layer lines.'], nice: [0.2, 'Quick and nice', 'The usual middle: quick, and it looks clean.'], smooth: [0.12, 'Smoothest', 'About twice as long. Layer lines nearly vanish.'] };
const PSET = { gears: [4, 40], body: [4, 20], clamp: [4, 40], hinge: [4, 30, 1], handle: [4, 25], limbs: [4, 25], spring: [4, 100], stand: [4, 25] };
function printCard(id) { const q = PQ[S.pq] ? S.pq : 'nice', P = PSET[id] || [3, 15], lay = id === 'keycaps' ? Math.min(0.16, PQ[q][0]) : PQ[q][0];
  return '<details class="fold"' + (S.psOpen ? ' open' : '') + ' data-keep="ps"><summary>Print settings: ' + lay + ' mm layers, ' + P[0] + ' walls, ' + P[1] + '% infill' + (P[2] ? ', brim on' : '') + ', no supports</summary>' +
    '<p class="note" style="margin-top:6px">In your slicer pick the standard profile for your printer and your filament. That sets the heat for you. Then change only these.</p>' +
    '<div class="row"><b>Finish</b>' + seg('pq', [['fast', 'Faster'], ['nice', 'Quick and nice'], ['smooth', 'Smoothest']], q) + '</div><p class="note" style="margin:2px 0 8px">' + PQ[q][2] + '</p>' +
    '<div class="list">' +
    '<div class="it"><b>Layer height: ' + lay + ' mm</b>How thick each layer of plastic is. Thinner looks smoother and takes longer.' + (id === 'keycaps' && lay !== PQ[q][0] ? ' Key caps are tiny, so they stay fine even on Faster.' : '') + '</div>' +
    '<div class="it"><b>Walls: ' + P[0] + '</b>How many outlines go around the part. This is where the strength comes from. More walls, stronger and a bit slower.</div>' +
    '<div class="it"><b>Infill: ' + P[1] + '%</b>How full the inside is. ' + (P[1] >= 40 ? 'This part takes force, so it is filled more.' : P[1] === 100 ? 'These strips are thin, so they print solid.' : 'Low is fine here: the walls do the work, and more infill mostly costs time.') + '</div>' +
    '<div class="it"><b>Supports: off</b>Supports are throwaway scaffolding under overhangs. This part is drawn so it needs none.</div>' +
    '<div class="it"><b>Brim: ' + (P[2] ? 'on' : 'off') + '</b>A thin skirt stuck to the bed that keeps a part from tipping or lifting. ' + (P[2] ? 'This one stands tall on a small foot, so turn it on and peel it off after.' : 'Not needed here. Turn it on only if corners lift on your printer.') + '</div>' +
    '</div></details>'; }
// ---------- tap and drop: one flat editor for the face on a character's head and for a face and arms on a case ----------
let DECO = null;
const decoOn = () => S.step === 5 && curTab() === 'extras' && (S.xsel === 'deco' || (S.xsel === 'char' && DECO && DECO.mode === 'char'));
const decoMode = () => (S.xsel === 'deco' ? 'case' : 'char');
const isLimb = (q) => q.k === 'arm' || q.k === 'leg';
const decoFace = () => (isClam() ? (S.dface === 'top' ? 'top' : 'lid') : 'top'); /* which side you are adding to. A case with a lid gets its face on the lid, where people see it. */
const onFace = (q) => (isClam() && q.on === 'lid' ? 'lid' : 'top');
const isGlue = (q) => q.k === 'handle'; /* glued on where you drop it: nothing is cut into the case for it */
const topDeco = () => (S.deco || []).filter((q) => onFace(q) === 'top');
const lidMir = ([x, y]) => (S.style === 'small' ? [x, -y] : [-x, y]); /* the lid is built from its inside, so on its outside a shape is turned over */
const v2l = (x, y, bb) => (decoFace() !== 'lid' ? [x, y] : S.style === 'small' ? [x, bb.y0 + bb.y1 - y] : [bb.x0 + bb.x1 - x, y]);
const deco3d = () => decoOn() && decoMode() === 'case'; /* a face, arms and legs on the case: you work on the real case in 3D */
let LIMBFP = null; const limbFp = () => LIMBFP || (LIMBFP = flatParts(G, { size: 60 }));
function decoPolys(face) { const lid = face === 'lid'; return (S.deco || []).filter((q) => !isGlue(q) && onFace(q) === (lid ? 'lid' : 'top')).map((q) => (isLimb(q) ? { arm: true, x: q.x, y: q.y } : { mt: q.mt || 'sunk', polys: [(lid ? featPoly(q.k, q.s || 1.4, q.f).map(lidMir).reverse() : featPoly(q.k, q.s || 1.4, q.f)).map(([x, y]) => [x + q.x, y + q.y])] })); }
function decoScene() { // the surface, what is already on it, and what you can move
  if (decoMode() === 'char') { const c = chSpec(xp().ch), d = headDims(c), s = d.s, F = faceSpots(c);
    return { both: F.both, s, outline: d.cube ? [G.rrect(-d.W / 2, -d.H / 2, d.W / 2, d.H / 2, 8 * s)] : G.inter([G.circle(0, -0.2 * d.R, d.R, 72)], [G.rect(-d.R, -0.8 * d.R, d.R, d.R)]), refs: [],
      items: F.spots.map((f) => ({ key: f.k, x: f.p[0] * s, y: f.p[1] * s, r: f.kind === 'screen' ? 14 : 8 * s, screen: f.kind === 'screen', poly: f.kind === 'screen' ? [[-15, -9.5], [15, -9.5], [15, 9.5], [-15, 9.5]] : featPoly(f.kind, s, f.flip) })) }; }
  const P = PARTS(), refs = []; itemsOn(homePanel()).forEach((i) => { if (P[i.type]) refs.push(...G.cutShape(P[i.type], i.x, i.y, i.r || 0)); });
  return { outline: outline(), refs, s: 1, items: (S.deco || []).map((q) => ({ key: q.id, x: q.x, y: q.y, r: isLimb(q) ? 9 : 9 * (q.s || 1.4), arm: isLimb(q), poly: isLimb(q) ? G.circle(0, 0, 5, 24) : featPoly(q.k, q.s || 1.4, q.f) })) };
}
function drawDeco(W, H) {
  const d = px(), sc = decoScene(), b = G.bbox(sc.outline), k = Math.min((W - 36 * d) / b.w, (H - 84 * d) / b.h), ox = (W - b.w * k) / 2 - b.x0 * k, oy = (H - 26 * d + b.h * k) / 2 + b.y0 * k;
  DECO = DECO || { mode: decoMode() }; DECO.mode = decoMode(); DECO.xf = { k, ox, oy, d }; DECO.sc = sc;
  const path = (polys, dx, dy) => { const p = new Path2D(); polys.forEach((pl) => { pl.forEach(([x, y], i) => { const X = ox + (x + (dx || 0)) * k, Y = oy - (y + (dy || 0)) * k; if (i) p.lineTo(X, Y); else p.moveTo(X, Y); }); p.closePath(); }); return p; };
  g.lineJoin = 'round'; g.fillStyle = '#f2ecd6'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 2.5 * d; const op = path(sc.outline); g.fill(op, 'evenodd'); g.stroke(op);
  if (sc.refs.length) { g.fillStyle = 'rgba(26,26,26,.16)'; g.fill(path(sc.refs), 'evenodd'); }
  sc.items.forEach((it) => { const on = it.key === DECO.sel, p = path([it.poly], it.x, it.y);
    if (it.screen) { g.fillStyle = '#10242c'; g.fill(p); g.fillStyle = '#1c6f86'; g.fill(path([[[-12, -6.5], [12, -6.5], [12, 6.5], [-12, 6.5]]], it.x, it.y)); }
    else if (it.arm) { g.fillStyle = '#2f4a6b'; g.globalAlpha = 0.85; g.fill(path([[[-6, -46], [6, -46], [6, 0], [-6, 0]]], it.x, it.y)); g.beginPath(); g.arc(ox + it.x * k, oy - (it.y - 46) * k, 9 * k, 0, 7); g.fill(); g.globalAlpha = 1; g.fillStyle = '#1a1a1a'; g.fill(p); }
    else { g.fillStyle = '#1a1a1a'; g.fill(p, 'evenodd'); }
    if (on) { g.strokeStyle = '#c8412f'; g.lineWidth = 2.5 * d; g.setLineDash([6 * d, 4 * d]); g.beginPath(); g.arc(ox + it.x * k, oy - it.y * k, (it.r + 4) * k, 0, 7); g.stroke(); g.setLineDash([]); } });
  tag(sc.items.length ? (sc.both ? 'Two screens share the head, so they stay put' : 'Drag a piece where you want it') : 'Tap a piece below to add it');
}
function decoPoint(e) { const r = cv.getBoundingClientRect(), q = cv.width / r.width, f = DECO.xf; return [((e.clientX - r.left) * q - f.ox) / f.k, (f.oy - (e.clientY - r.top) * q) / f.k]; }
function decoMove(key, x, y) {
  if (decoMode() === 'char') { const X = xp(), c = chSpec(X.ch), s = DECO.sc.s; if (DECO.sc.both) return; const pos = X.ch.pos = X.ch.pos || {};
    let p = faceLimit(c, [x / s, y / s]); if (key === 'es' || key === 'ms') p = [0, p[1]]; pos[key] = p;
    const twin = { eL: 'eR', eR: 'eL', bL: 'bR', bR: 'bL' }[key]; if (twin) pos[twin] = [-p[0], p[1]]; /* eyes and brows move as a pair, so the face stays even */
    return; }
  const q = (S.deco || []).find((z) => z.id === key); if (!q) return; const b = G.bbox(outline()), m = 7; let at = decoInside(Math.max(b.x0 + m, Math.min(b.x1 - m, x)), Math.max(b.y0 + m, Math.min(b.y1 - m, y)));
  if (isLimb(q) && isClam()) { const hf = hingeFace(), k = 18; /* an arm or leg screwed near the hinge would hang off the lid when it opens: keep it 18 mm clear */ if (hf === 'back') at = [at[0], Math.min(at[1], b.y1 - k)]; else if (hf === 'left') at = [Math.max(at[0], b.x0 + k), at[1]]; else if (hf === 'right') at = [Math.min(at[0], b.x1 - k), at[1]]; }
  q.x = at[0]; q.y = at[1];
}
function decoWire() {
cv.addEventListener('pointerdown', (e) => { if (!decoOn() || !DECO || !DECO.xf) return; const [x, y] = decoPoint(e); let best = null, bd = 1e9; DECO.sc.items.forEach((it) => { const dd = Math.hypot(it.x - x, it.y - y); if (dd < Math.max(11, it.r + 5) && dd < bd) { bd = dd; best = it; } });
  DECO.sel = best ? best.key : null; DECO.drag = best ? { key: best.key, dx: best.x - x, dy: best.y - y, moved: false } : null; if (best) { try { cv.setPointerCapture(e.pointerId); } catch (x2) {} if (decoMode() === 'case') snapU(); } draw(); e.preventDefault(); });
cv.addEventListener('pointermove', (e) => { if (!decoOn() || !DECO || !DECO.drag) return; const [x, y] = decoPoint(e); DECO.drag.moved = true; decoMove(DECO.drag.key, x + DECO.drag.dx, y + DECO.drag.dy); draw(); e.preventDefault(); });
['pointerup', 'pointercancel'].forEach((ev) => cv.addEventListener(ev, () => { if (!decoOn() || !DECO) return; const dr = DECO.drag; DECO.drag = null; if (dr && dr.moved) save(); render(); }));
}
function decoIcon(k) { let polys; // a little picture of the piece for its button
  if (k === 'handle') polys = addonPolys('handle').polys; else if (k === 'arm' || k === 'leg') { const fp = limbFp(), end = k === 'leg' ? fp.foot : fp.hand, off = k === 'leg' ? -11 - fp.Lb : -fp.Lb; polys = fp.bar.polys.concat(end.polys.map((p) => p.map(([a, b]) => [a, b + off]))); } else polys = [featPoly(k, 1.4)];
  const b = G.bbox(polys), m = 2, d = polys.map((p) => 'M' + p.map(([x, y]) => (x - b.x0 + m).toFixed(1) + ' ' + (b.y1 - y + m).toFixed(1)).join('L') + 'Z').join('');
  return '<svg viewBox="0 0 ' + (b.w + 2 * m).toFixed(1) + ' ' + (b.h + 2 * m).toFixed(1) + '" style="height:28px"><path d="' + d + '" fill="currentColor" fill-rule="evenodd"/></svg>'; }
function decoHtml() { const D = S.deco || [], sel = DECO && D.find((q) => q.id === DECO.sel), arms = D.filter((q) => q.k === 'arm').length, legs = D.filter((q) => q.k === 'leg').length;
  const chip = (k, name) => '<button class="pick" data-dadd="' + k + '" style="min-height:66px;padding:6px 2px;font-size:11.5px">' + decoIcon(k) + esc(name) + '</button>';
  const add = '<p class="h" style="margin-top:10px">Drag one up onto your case, or tap it</p><div class="hrow dtray" style="grid-auto-columns:82px;padding-top:2px">' + chip('arm', 'Arm') + chip('leg', 'Leg') + Object.keys(FEATS).map((k) => chip(k, FEATS[k])).join('') + (isClam() && decoFace() === 'top' ? '' : chip('handle', 'Handle')) + '</div>';
  const many = (n, w) => n + ' ' + w + (n > 1 ? 's' : ''), what = [arms ? many(arms, 'arm') : '', legs ? many(legs, 'leg') : ''].filter(Boolean).join(' and ');
  const face = isClam() ? '<div class="row" style="margin:8px 0 0"><b>Goes on</b>' + '<div class="seg"><button data-dface="lid" aria-pressed="' + (decoFace() === 'lid') + '">The lid</button><button data-dface="top" aria-pressed="' + (decoFace() === 'top') + '">Inside</button></div></div>' : '';
  return face + add +
    (sel ? (isGlue(sel) ? '<div class="selbar" style="flex-wrap:wrap"><b style="flex:1 0 100%">Handle</b><button data-dact="turnl">Turn left</button><button data-dact="turnr">Turn right</button><button data-xsel="handle">Size and print</button><button data-dact="rm">Remove</button></div><p class="note" style="margin:2px 0 0">It glues on where you put it, so nothing is cut into the case. Its print file is in Parts, Handle.</p>' : isLimb(sel) ? '<div class="selbar" style="flex-wrap:wrap"><b style="flex:1 0 100%">' + (sel.k === 'leg' ? 'Leg' : 'Arm') + '</b><button data-dact="turnl">Turn left</button><button data-dact="turnr">Turn right</button><button data-dact="rm">Remove</button></div><p class="note" style="margin:2px 0 0">A screw spot. The ' + sel.k + ' swings around it, flat against the case. Turning it here only changes the picture: you pose the real one by hand.</p>'
      : '<div class="selbar" style="flex-wrap:wrap"><b style="flex:1 0 100%">' + esc(FEATS[sel.k]) + '</b><button data-dact="sunk"' + ((sel.mt || 'sunk') === 'sunk' ? ' style="background:#1a1a1a;color:#fff"' : '') + '>Sunk in</button><button data-dact="raised"' + (sel.mt === 'raised' ? ' style="background:#1a1a1a;color:#fff"' : '') + '>Raised</button><button data-dact="small">Smaller</button><button data-dact="big">Bigger</button>' + (sel.k === 'brow' ? '<button data-dact="flip">Tilt</button>' : '') + '<button data-dact="rm">Remove</button></div><p class="note" style="margin:2px 0 0">' + ((sel.mt || 'sunk') === 'sunk' ? 'Pressed ' + (onFace(sel) === 'lid' ? '0.6' : '1.2') + ' mm into the ' + (onFace(sel) === 'lid' ? 'lid' : 'top') + '. Wipe paint in to make it pop.' : 'Stands 1.6 mm up. It prints as its own little piece that you glue on.') + '</p>')
      : '<p class="note" style="margin-top:6px">' + (D.length ? 'Tap a piece on the case to change or remove it. Drag the empty space to spin the case.' : 'That is the case you built. Drag a piece up onto it, then drag it again to move it. Swipe the row sideways for more. A screen can be the eyes: put the brows and mouth around it.') + '</p>') +
    (what ? '<button class="btn red" data-xsave="decoarms" style="margin-top:10px">Save ' + what + ' to print</button><p class="note" style="margin-top:4px">An arm is a bar and a hand, a leg is a bar and a foot. Screw the bar to its spot with an M3 x 12 (it cuts its own thread), the hand or foot to the bar with an M3 x 16 and a nut.' + (isClam() && topDeco().some(isLimb) ? ' The ones inside sit under the lid, so the case is made taller to clear them.' : '') + '</p>' : '') +
    '<button class="btn" data-jump="Finish" style="margin-top:10px">See it on my case</button>'; }
// ---------- the character page ----------
let CHC = null;
function charCache() { const k = JSON.stringify(xp().ch); if (!CHC || CHC.k !== k) { CHC = charParts(G, xp().ch); CHC.k = k; } return CHC; }
function charHtml() { const c = chSpec(xp().ch), row = (label, f, opts) => '<div class="row"><b>' + label + '</b>' + seg('ch_' + f, opts, String(c[f])) + '</div>', hasScr = c.eyes === 'screen' || c.mouth === 'screen';
  return '<p class="h" style="margin-top:10px">Shape</p>' + row('Head', 'head', [['cube', 'Cube'], ['sphere', 'Ball']]) + row('Body', 'body', [['box', 'Boxy'], ['round', 'Round']]) + row('Hands', 'hands', [['mitt', 'Mitt'], ['claw', 'Claw']]) + row('Feet', 'feet', [['shoe', 'Shoe'], ['boot', 'Boot']]) + row('Size', 'size', [['50', 'Small'], ['60', 'Medium'], ['72', 'Large']]) +
    '<p class="h" style="margin-top:12px">Face</p>' + row('Eyes', 'eyes', [['dot', 'Dots'], ['oval', 'Ovals'], ['screen', 'A screen']]) + row('Brows', 'brows', [['1', 'On'], ['0', 'Off']]) + row('Nose', 'nose', [['button', 'Button'], ['wedge', 'Wedge'], ['none', 'None']]) + row('Mouth', 'mouth', [['smile', 'Smile'], ['line', 'Line'], ['screen', 'A screen']]) + row('Face parts', 'face', [['raised', 'Raised'], ['sunk', 'Sunk in']]) +
    (hasScr ? row('Screen sits', 'scr', [['flush', 'Flush'], ['raised', 'Raised rim'], ['sunk', 'Sunk in'], ['mounted', 'On top']]) + '<p class="note" style="margin:2px 0 6px">A small OLED screen (0.96 in) shows the ' + (c.eyes === 'screen' ? 'eyes' : 'mouth') + '. ' + (c.head === 'sphere' ? 'The ball gets a flat spot so the flat screen sits right. ' : '') + (c.scr === 'mounted' ? 'It sticks on the outside, its cable goes through the slot.' : 'It sits behind the window, held with a dab of hot glue.') + ' ' + (c.head === 'cube' && c.size >= 72 ? 'The large cube head has room for two: one for the eyes, one for the mouth.' : 'Two screens need the large cube head.') + '</p>' : '') +
    '<button class="btn' + (DECO && DECO.mode === 'char' && S.xsel === 'char' ? ' red' : ' dark') + '" data-act="faceed" style="margin-top:8px">' + (DECO && DECO.mode === 'char' && S.xsel === 'char' ? 'Done. Back to 3D' : 'Move the face parts') + '</button>' + (c.pos ? '<button class="btn" data-act="facereset" style="margin-top:6px;padding:8px">Put the face back where it was</button>' : '') +
    '<p class="h" style="margin-top:12px">Moving</p>' + row('Head turns', 'turn', [['0', 'By hand'], ['1', 'Thumb wheel']]) + row('Arms, legs', 'bend', [['0', 'Straight'], ['1', 'Elbows + knees']]) + row('Right arm', 'servo', [['0', 'By hand'], ['1', 'Motorized (SG90 servo)']]) + (c.servo ? '<p class="note keep" style="margin:2px 0 6px">An SG90 micro servo stands in a sleeve inside the torso; its horn fits a pocket in the right arm. It is on your Shop list and in Wire it.</p>' : '') + '<p class="note" style="margin:2px 0 6px">' + (c.turn ? 'Two gears. Turn the wheel behind the neck and the head turns.' : 'The head turns on its neck when you twist it.') + ' Arms and legs swing on their screws: tighten to hold a pose.</p>' +
    '<p class="note" style="margin:8px 0 0"><b>You buy:</b> ' + charBuyList(c).join('. ') + '.</p>' + filLine('char'); }
// ---------- the keyboard page ----------
function kbCase() { const K = kb(), d = dims(), wall = R.T + R.CLR + 1, iw = d.W - 2 * wall, ih = d.D - 2 * wall; return { iw, ih, fits: (K.w <= iw && K.h <= ih) || (K.h <= iw && K.w <= ih), has: S.items.some((i) => i.type === 'kbd') }; }
function kbHtml() { const K = kb(), X = xp(), n = K.sw.length, C = kbCase(), cost = kbCost(K);
  return '<p class="h" style="margin-top:10px">1. Size</p><div class="row"><b>Layout</b>' + seg('xkp', [['custom', 'Custom'], ['60', '60% (61-key)']], K.s60 ? '60' : 'custom') + '</div>' + (K.s60 ? '<p class="note keep" style="margin:0 0 6px">The standard 61-key typing block: no number pad, F row or arrow keys. Fn+1..= gives F1 to F12, Fn+WASD or IJKL the arrows, Fn+Backspace Delete. The plate is split into puzzle pieces when it is bigger than your bed.</p>' : stepper('xk_c', 'Across', K.c + ' keys') + stepper('xk_r', 'Down', K.r + ' keys')) +
    '<p class="note" style="margin:4px 0 6px">It is ' + K.w.toFixed(0) + ' x ' + K.h.toFixed(0) + ' mm with ' + n + ' keys. ' + (C.has ? '<span class="ok">It is in your case.</span>' : C.fits ? '<span class="ok">It fits inside your case.</span>' : 'Your case has ' + C.iw.toFixed(0) + ' x ' + C.ih.toFixed(0) + ' mm inside, so it does not fit yet.') + '</p>' +
    '<div class="grid g2">' + '<button class="btn" data-act="kbfit" style="padding:9px">Size it to my case</button><button class="btn' + (C.has ? '' : ' dark') + '" data-act="kbadd" style="padding:9px">' + (C.has ? 'Take it out of my case' : 'Put it in my case') + '</button></div>' +
    '<p class="h" style="margin-top:12px">2. Key caps</p>' + filLine('keys') +
    '<div class="row"><b>3D view</b>' + seg('xkview', [['plate', 'Plate only'], ['caps', 'With keycaps']], X.keys.view === 'plate' ? 'plate' : 'caps') + '</div>' +
    '<div class="row"><b>Cap fit</b>' + seg('xkf', [['0', 'Snug'], ['0.1', 'Normal'], ['0.2', 'Loose']], String(X.keys.f)) + '</div>' +
    '<p class="note" style="margin:2px 0 6px">Print 1 test cap first and push it on a switch. Too tight to go on: pick Loose. Falls off: pick Snug. Then print the rest.</p>' +
    (K.s60 ? '<div class="grid g2"><button class="btn" data-xsave="keycap1" style="padding:9px">Save 1 test cap</button><button class="btn" data-xsave="keycapswide" style="padding:9px">Save the ' + K.sw.filter((q) => q.u > 1).length + ' wide caps</button></div><p class="note" style="margin:4px 0 0">Plus ' + K.sw.filter((q) => !(q.u > 1)).length + ' plain caps: Save 24 caps, then again.</p><button class="btn" data-xsave="keycaps" style="padding:9px;margin-top:6px">Save 24 caps</button>' : '') + (K.s60 ? '' : '<div class="row"><b>Space bar</b>' + seg('xksp', [['0', 'No'], ['1', 'Yes']], X.keys.sp ? '1' : '0') + '</div>') + (K.s60 ? '' : X.keys.sp ? '<p class="note" style="margin:2px 0 6px">The two middle keys of the bottom row share one long cap, and both type a space. Two switches push back, so it presses a little heavier than a single key.</p>' : '') +
    '<div class="grid g2"><button class="btn" data-xsave="keycap1" style="padding:9px">Save 1 test cap</button><button class="btn" data-xsave="keycaps" style="padding:9px">Save ' + Math.min(24, n - (X.keys.sp ? 2 : 0)) + ' caps</button></div>' + (X.keys.sp ? '<button class="btn" data-xsave="keycap2" style="padding:9px;margin-top:8px">Save the space bar</button>' : '') + (n - (X.keys.sp ? 2 : 0) > 24 ? '<p class="note" style="margin-top:4px">The file holds 24. Print it ' + Math.ceil((n - (X.keys.sp ? 2 : 0)) / 24) + ' times for all ' + (n - (X.keys.sp ? 2 : 0)) + '.</p>' : '') +
    '<p class="h" style="margin-top:12px">3. Order the board</p><p class="note" style="margin:0 0 6px">' + cost.txt + ' Shipping and import fees usually cost more than the boards.</p>' +
    '<button class="btn dark" data-act="kbzip">Get the board files (zip)</button>' +
    '<p class="note" style="margin-top:6px">The zip has the factory files, the code that makes it type, and a step by step to solder it. <b>You buy:</b> ' + n + ' MX style switches, ' + n + ' small diodes (1N4148), 1 Pico with pins (Pico H), 4 M3 x 12 screws and nuts. About $' + Math.round(n * 0.45 + 9) + ' plus the board.</p>' +
    '<details class="fold"><summary>See the board</summary><div data-kbsvg="1" style="margin-top:6px"><button class="btn" data-act="kbshow" style="padding:8px">Draw it</button></div></details>' +
    '<p class="h" style="margin-top:12px">4. Print the plate</p>'; }
// the picture of a printed part is drawn from the very shape that gets saved, so what you see is what prints
const XTH = {};
function xThumb(id) {
  const key = id + JSON.stringify(S.xp || {}); if (XTH[key]) return XTH[key];
  const a = addonPolys(id); if (!a) return ''; let x0 = 0, hi = 0, d = '';
  (a.sets || [a]).forEach((set) => { const polys = set.layers ? set.layers[0].polys : set.polys, b = G.bbox(polys);
    polys.forEach((pl) => { d += 'M' + pl.map(([x, y]) => (x - b.x0 + x0).toFixed(1) + ' ' + (-(y - b.y0)).toFixed(1)).join('L') + 'Z'; }); x0 += b.w + 5; hi = Math.max(hi, b.h); });
  const w = x0 - 5, sw = Math.max(w, hi) / 60;
  return (XTH[key] = '<svg viewBox="' + (-sw) + ' ' + (-hi - sw) + ' ' + (w + 2 * sw) + ' ' + (hi + 2 * sw) + '" aria-hidden="true"><path d="' + d + '" fill="#c8412f" fill-rule="evenodd" stroke="#1a1a1a" stroke-width="' + sw.toFixed(2) + '" stroke-linejoin="round"/></svg>');
}
function btnHtml() {
  const c = counts(), small = S.items.some((i) => i.type === 'tact12');
  return '<div class="list">' +
    '<div class="it"><b>Printed D-pad' + (c.dpad ? ' <span class="ok">added</span>' : '') + '</b>The cross is printed. Under it sit 4 tiny switches that cost cents.<div style="margin-top:6px"><button class="btn" data-add="dpad" style="display:inline-block;padding:7px 12px">+ Add a D-pad</button></div></div>' +
    '<div class="it"><b>Printed button tops</b>' + (small ? 'The top of the case flexes over each small button, so there are no caps to buy.<div class="row" style="margin-top:6px"><b>Buttons</b>' + seg('spring', [['0', 'Bought caps'], ['1', 'Printed']], S.spring ? '1' : '0') + '</div>' : 'Add a Small button in Brain and the case can print its top for you: no caps to buy.') + '</div>' +
    '<div class="it"><b>Printed knobs</b>Every turn knob and click wheel gets a printed knob in your case files.</div></div>' +
    '<p class="note">Every button still needs a small switch under it to make the click: plastic alone cannot carry a signal.</p>';
}
const xBack = () => (S.xfrom === 'shape' ? '<button type="button" class="btn" data-xback="1">&lsaquo; Shape</button>' : '<button type="button" class="btn" data-xsel="">&lsaquo; All</button>');
function partsRoomHtml() {
  if (PORTS[S.xsel]) return portHtml(S.xsel);
  const id = S.xsel, T = id && xmeta(id);
  const XG = S.style === 'camera' ? [['Make it look like a camera', ['lens', 'grip', 'tripod']]].concat(XGROUPS.filter((g) => g[0] !== 'Camera and sensor')) : XGROUPS,
    cam = S.style === 'camera' ? (() => { const done = ['lens', 'grip'].every((k) => S.attachedParts.some((m) => m.partId === k)); return '<div class="it camk"><b style="display:inline">Make it a camera</b> &mdash; a lens ring round the front lens cut-out and a grip on the side, so it reads as a camera, not a box.<button class="btn ' + (done ? 'dark' : 'red') + '" data-act="camlook" style="margin-top:8px;display:block"' + (done ? ' aria-pressed="true"' : '') + '>' + (done ? 'Lens ring + Grip added &#10003;' : 'Add Lens Ring + Grip') + '</button></div>'; })() : '';
  if (!T) return cam + filBar() + XG.map((g) => '<p class="h">' + g[0] + '</p><div class="grid g3" style="margin-bottom:10px">' + g[1].map((k) => { const v = filV(k)[0]; return '<button type="button" class="pick fn xt" data-xsel="' + k + '">' + xThumb(k) + xmeta(k)[0] + (v < 2 ? '<small class="vd v' + v + '">' + VWORD[v] + '</small>' : '') + '</button>'; }).join('') + '</div>').join('') +
    '<p class="note">Openings in the case (Raised Shroud, Wire hole, USB-C, HDMI, 3.5mm Audio, Vents) are in Design, Shape. <button type="button" class="btn" data-act="toopen" style="display:inline-block;padding:6px 10px">Go to Openings</button></p>' +
    '<details class="fold"><summary>Printed buttons and knobs</summary>' + btnHtml() + '</details><p class="note">Each one is its own print. Make it now or later, then add it to what you already built.</p>';
  return '<div class="fnh">' + xBack() + '<b>' + T[0] + '</b></div><p class="note" style="margin-top:6px">' + T[1] + '</p>' + T[2] + (T[3] ? '' : filLine(id)) +
    (T[3] === 'none' ? '' : '<button class="btn red" data-xsave="' + id + '" style="margin-top:10px">Save the ' + (T[3] || 'print file') + '</button>' + printCard(id)) + mountHtml(id);
}
function tabsFor(step) {
  if (step === 0) return [['snap', 'Photo', 'snap'], ['parts', 'Electronics', 'parts'], ['picks', 'Picks', 'picks'], ['pins', 'Wiring', 'wire']];
  if (step === 1) return panels().map((p) => [p, PNAME[p], p]).concat([[isPanel() ? 'psize' : 'size', 'Size', 'size']]);
  if (step === 2 && isPanel()) return [['shape', 'Shape', 'shape'], ['psize', 'Size', 'size'], ['notch', 'Notches', 'notch'], ['measure', 'Measure', 'measure']];
  if (step === 2) return [['shape', 'Shape', 'shape'], ['measure', 'Measure', 'measure']]; /* size and fit sit on Shape itself */
  if (step === 3) return [['colors', 'Color', 'colors'], ['tex', 'Texture', 'tex'], ['labels', 'Buttons', 'labels'], ['logo', 'Logo', 'logo']];
  if (step === 4) return [['printer', 'Printer', 'printer'], ['strong', 'Strength', 'strong'], ['mat', 'Material', 'mat'], ['split', 'Split', 'split']];
  return [['3d', '3D', 'cube'], ['shop', 'Shop', 'cart'], ['files', 'Files', 'file'], ['pcb', 'Board', 'brain'], ['extras', 'Extras', 'parts'], ['wire', 'Wire it', 'wire'], ['map', 'Wired', 'wire'], ['test', 'PLAY', 'wire'], ['sounds', 'Sound Files', 'file'], ['guide', 'Guide & Code', 'file']];
}
function curTab() { const t = tabsFor(S.step), c = S.tab[S.step]; return t.some((x) => x[0] === c) ? c : t[S.step === 0 ? 1 : 0][0]; }
function nudgeRow() { return '<div class="selbar nud"><b>Nudge</b><button data-act="nudge" data-nx="-1" data-ny="0" aria-label="Left">&larr;</button><button data-act="nudge" data-nx="0" data-ny="1" aria-label="Up">&uarr;</button><button data-act="nudge" data-nx="0" data-ny="-1" aria-label="Down">&darr;</button><button data-act="nudge" data-nx="1" data-ny="0" aria-label="Right">&rarr;</button></div>'; }
const RECTK = (it) => { const P = PP(it); return !!(P && (P.cat === 'brain' || P.cat === 'screen' || P.screen || (P.cut && (P.cut.o === 'rect' || P.cut.o === 'slot')))); };
/* undo: the last 40 changes in Arrange */
const UNDO = HIST.u; let CLEARED = false;
const BAK = KEY + '-bak';
function backup() { try { if (S.items.length) localStorage.setItem(BAK, JSON.stringify(S)); } catch (e) {} } /* the whole build, kept before anything that wipes it */
function bringBack() { try { const b = localStorage.getItem(BAK); if (b) { localStorage.setItem(KEY, b); localStorage.removeItem(BAK); location.reload(); } } catch (e) {} }
function snapU() { HIST.cut = true; zmBar(); }
function undo() { CLEARED = false; histGo(true); }
function redo() { histGo(false); }
function histGo(back) { const from = back ? HIST.u : HIST.r, to = back ? HIST.r : HIST.u; if (!from.length) { tag(back ? 'Nothing to undo' : 'Nothing to redo'); return; }
  to.push(histKey()); const k = from.pop(), nav = {}; NAVK.forEach((n) => { if (n in S) nav[n] = S[n]; }); const o = JSON.parse(k);
  Object.keys(S).forEach((n) => { delete S[n]; }); Object.assign(S, o, nav); HIST.cur = k; HIST.cut = true;
  applyWalls(); uid = S.items.reduce((m, p) => Math.max(m, p.id || 0), 0); if (!S.items.some((i) => i.id === sel)) sel = null; LAST = null; TSEL = null; if (DECO) DECO.sel = null; markCache = {}; MPC = {}; KBC = null;
  HIST.lock = true; save(); HIST.lock = false; histBtns(); zmBar(); render(); tag(back ? 'Undone' : 'Redone'); }
// ---- Studio shell (11-13). Two rooms, like the Case Zero page: the Body is what holds it, the Brain is what it does.
// One job per page. A page shows only its own tools; everything else stays out of sight until you go there.
// A page is a list of [step, tab] pairs from the old six steps, so every pane, action and saved build keeps working. '*' = every tab of that step.
const PAGES = [ /* three rooms: DESIGN (make the case), PLAY (hear and test it), BUILD (files, parts, links) */
  { room: 'design', name: 'Shape', tabs: [[2, '*']], more: ['psize', 'notch'] },
  { room: 'design', name: 'Parts', tabs: [[0, 'parts'], [1, '*'], [5, 'extras'], [0, 'snap'], [0, 'picks']], more: ['snap', 'picks', 'size', 'psize'] },
  { room: 'design', name: 'Style', tabs: [[3, '*']] },
  { room: 'design', name: 'Print Prep', tabs: [[4, '*']], more: ['strong', 'mat', 'split'] },
  { room: 'play', name: 'Play', tabs: [[5, 'test'], [5, 'map'], [5, 'wire'], [0, 'pins']] },
  { room: 'build', name: 'Print Files', tabs: [[5, 'files'], [5, '3d']] },
  { room: 'build', name: 'Parts & Boards', tabs: [[5, 'shop'], [5, 'pcb']] },
  { room: 'build', name: 'Sound Files', tabs: [[5, 'sounds']] },
  { room: 'build', name: 'Guide & Code', tabs: [[5, 'guide']] }
];
const ROOMS = [['design', 'Design'], ['play', 'Play'], ['build', 'Build']];
const ROOMOF = { body: 'design', addons: 'design', parts: 'design', brain: 'play', try: 'play' }; /* old links and saved builds */
const JUMP = { Finish: [5, '3d'], Shop: [5, 'shop'], 'Wire it': [5, 'wire'] };
function pageTabs(p) { const out = []; p.tabs.forEach(([st, id]) => tabsFor(st).forEach((x) => { if (id === '*' || x[0] === id) out.push([st, x[0], x[1], x[2]]); })); return out; }
function pageOf(step, tab) { let hit = -1; PAGES.forEach((p, i) => { if (hit < 0 && pageTabs(p).some((x) => x[0] === step && x[1] === tab)) hit = i; }); if (hit < 0) hit = PAGES.findIndex((p) => p.tabs.some((x) => x[0] === step)); return hit < 0 ? 0 : hit; }
function openPage(i) { // go to a page: its first tool, or the one you last used there
  const p = PAGES[i]; if (!p) return; const list = pageTabs(p), keep = list.find((x) => x[0] === S.step && x[1] === S.tab[x[0]] && S.page === i) || list.find((x) => (S.seen || {})[i] === x[0] + ':' + x[1]) || list[0];
  S.step = keep[0]; S.tab[keep[0]] = keep[1]; S.page = i; BIG3D = false; save(); $('con').classList.remove('down'); render();
}
let SHOWN = -1, VIEWKEY = '';
function render() {
  actsFill(false); /* every placed control stores its action */
  PNAME.top = isPanel() ? 'Panel' : 'Top';
  if (isPanel()) { const L = S.look; if (L.texFace !== 'top') L.texFace = 'top'; }
  const t = curTab(); S.page = pageOf(S.step, t); const pg = PAGES[S.page], list = pageTabs(pg), mine = PAGES.map((p, i) => [p, i]).filter((x) => x[0].room === pg.room), at = mine.findIndex((x) => x[1] === S.page);
  if (!S.seen) S.seen = {}; S.seen[S.page] = S.step + ':' + t; if (!S.lastIn) S.lastIn = {}; S.lastIn[pg.room] = S.page;
  $('rooms').innerHTML = ROOMS.map((r) => '<button type="button" data-room="' + r[0] + '" aria-pressed="' + (r[0] === pg.room) + '">' + r[1] + '</button>').join('');
  document.body.dataset.room = pg.room;
  $('ph').innerHTML = mine.length > 1 ? mine.map((x, k) => '<button type="button" data-pg="' + x[1] + '" aria-current="' + (x[1] === S.page ? 'step' : 'false') + '"><b>' + (k + 1) + '.</b> ' + x[0].name + '</button>').join('') : '';
  $('ph').hidden = mine.length < 2;
  // the main tool of the page shows by itself. The rest sit behind More, so a first-timer sees one thing and anyone can still reach everything.
  const extra = pg.more || [], isMore = (x) => extra.indexOf(x[1]) > -1, mains = list.filter((x) => !isMore(x)), rest = list.filter(isMore);
  if (!S.moreOn) S.moreOn = {}; const open = !!S.moreOn[S.page] || rest.some((x) => x[0] === S.step && x[1] === t);
  const pill = (x) => '<button type="button" data-st="' + x[0] + '" data-t="' + x[1] + '" aria-pressed="' + (x[0] === S.step && x[1] === t) + '"><span>' + x[2] + '</span></button>';
  const body = pg.room === 'design', pro = body && !!S.pro, opn = body ? pro || rest.some((x) => x[0] === S.step && x[1] === t) : open; /* Body: one Simple | Pro (mm) switch instead of More options on every page */
  const sp = body ? '<span class="spro" role="group" aria-label="Simple or Pro"><button type="button" data-pro="0" aria-pressed="' + !pro + '">Simple</button><button type="button" data-pro="1" aria-pressed="' + pro + '">Pro</button></span>' : '';
  const pills = (mains.length > 1 || opn ? mains.map(pill).join('') : '') + (opn ? rest.map(pill).join('') : '') + (rest.length && !body ? '<button type="button" class="mo" data-more="' + (open ? '0' : '1') + '"><span>' + (open ? 'Less' : 'More options') + '</span></button>' : '');
  $('parts').classList.toggle('hasp', !!sp); $('parts').innerHTML = sp ? '<div class="sprow"><span class="sprl">Detail</span>' + sp + '</div><div class="pills">' + pills + '</div>' : pills; /* Simple | Pro on its own row, the page tabs under it */
  $('parts').parentNode.hidden = !!pg.bare || (!body && mains.length < 2 && !rest.length);
  const prev = mine[at - 1], next = mine[at + 1];
  if (0) $('bbar').innerHTML = '<button type="button" data-pg="' + (prev ? prev[1] : '') + '"' + (prev ? '' : ' disabled') + '>Back</button><span class="dots">' + mine.map((x) => '<b role="button" data-pg="' + x[1] + '" aria-label="' + x[0].name + '" title="' + x[0].name + '"' + (x[1] === S.page ? ' class="on" aria-current="step"' : '') + '></b>').join('') + '</span>' +
    (next ? '<button type="button" class="nx" data-pg="' + next[1] + '">Next: ' + next[0].name + '</button>' : (() => { const nr = ROOMS[(ROOMS.findIndex((r) => r[0] === pg.room) + 1) % ROOMS.length]; return '<button type="button" class="nx" data-pg="' + PAGES.findIndex((p) => p.room === nr[0]) + '">' + nr[1] + '</button>'; })()) /* the next room opens on its first page */;
  { const n = PAGES[S.page + 1], nb = $('nxt'); if (nb) { nb.hidden = !n; if (n) { nb.dataset.pg = S.page + 1; nb.innerHTML = 'Next: ' + (n.room === pg.room ? n.name : ROOMS.find((r) => r[0] === n.room)[1]) + ' <span aria-hidden="true">&rarr;</span>'; } } }
  $('con').classList.toggle('tall', false); $('con').classList.toggle('slim', deco3d());
  if (SHOWN !== S.page) { if (SHOWN !== -1) { const st = $('stage'), cn = $('con'); st.classList.remove('zin'); cn.classList.remove('pop'); void st.offsetWidth; st.classList.add('zin'); cn.classList.add('pop'); } SHOWN = S.page; }
  // re-drawing the same view (a + or - tap) keeps folded sections as they were and the scroll where it was
  const vk = S.step + ':' + t + ':' + (S.fn || '') + ':' + (S.xsel || ''), same = vk === VIEWKEY, was = same ? Array.from($('pane').querySelectorAll('details')).map((x) => x.open) : [], top = same ? $('pane').scrollTop : 0; VIEWKEY = vk; if (!same && vk.split(':').slice(0, 2).join(':') !== (render.pg || '')) tag(''); render.pg = S.step + ':' + t; /* a new room or step: the old caption goes, the new view writes its own */
  $('pane').classList.toggle('padb', t === 'map'); $('stage').classList.toggle('wmap', t === 'map'); $('pane').innerHTML = (pg.name === 'Parts' && (S.step === 0 || S.step === 1) ? viewTgl() : '') + pane(t); const now = $('pane').querySelectorAll('details'); if (now.length === was.length) now.forEach((x, i) => { x.open = was[i]; });
  if (pg.room !== 'build') $('pane').querySelectorAll('a[href^="http"]').forEach((x) => { const sp = document.createElement('span'); sp.innerHTML = x.innerHTML; x.replaceWith(sp); }); /* outside links live in BUILD only */
  else $('pane').innerHTML = '<div class="bcard"><h3>' + (at + 1) + '. ' + pg.name + '</h3>' + $('pane').innerHTML + '</div>';
  $('pane').scrollTop = top; after(t); tidy(); draw(); stat();
}
// Less to read: long grey notes show two lines with a 'more' you can tap. Warnings (red) always show in full.
function tidy() { /* long explanations sit behind a small i next to their section title */
  let n = 0; $('pane').querySelectorAll('.note').forEach((x) => { if (x.classList.contains('bad') || x.querySelector('.bad') || x.id === 'partTip' || x.classList.contains('keep') || x.closest('.cop')) return;
    let h = x.previousElementSibling, k = 0; while (h && k < 6 && !(h.classList && h.classList.contains('h'))) { h = h.previousElementSibling; k++; }
    const id = 'tip' + (n++); x.classList.add('tip'); x.dataset.tip = id;
    if (h && h.classList.contains('h')) { if (!h.querySelector('.ib')) h.insertAdjacentHTML('beforeend', '<button type="button" class="ib" aria-label="More info" data-ib="' + id + '">i</button>'); else x.dataset.tip = h.querySelector('.ib').dataset.ib; }
    else x.insertAdjacentHTML('beforebegin', '<button type="button" class="ib solo" aria-label="More info" data-ib="' + id + '">i</button>'); });
  const on = $('pane').querySelector('.hrow [aria-pressed=true]'); if (on && on.scrollIntoView) { const r = on.parentNode; r.scrollLeft = Math.max(0, on.offsetLeft - r.clientWidth / 2 + on.offsetWidth / 2); }
}
$('pane').addEventListener('click', (e) => { const i = e.target.closest('.ib'); if (!i) return; e.stopPropagation(); const o = i.classList.toggle('on'); $('pane').querySelectorAll('[data-tip="' + i.dataset.ib + '"]').forEach((x) => x.classList.toggle('open', o)); }, true);
function stat() { let d = null; try { d = dims(); } catch (e) {} const n = S.items.filter((i) => i.of == null).length; STAT = (d ? Math.round(d.W) + ' \u00d7 ' + Math.round(d.D) + ' mm \u00b7 ' : '') + n + ' part' + (n === 1 ? '' : 's'); if (!TAGT) $('tag').textContent = STAT; }
let STAT = '', TAGT = 0;
function nextBtn() { return ''; }
function go(step) { S.step = step; BIG3D = false; save(); $('con').classList.remove('down'); render(); }
function goRoom(room) { room = ROOMOF[room] || room; const i = (S.lastIn || {})[room], j = i != null && PAGES[i] && PAGES[i].room === room ? i : PAGES.findIndex((p) => p.room === room); openPage(j); }
$('ph').addEventListener('click', (e) => { const b = e.target.closest('[data-pg]'); if (b) openPage(+b.dataset.pg); });
$('bbar').addEventListener('click', (e) => { const r = e.target.closest('[data-room]'); if (r) { goRoom(r.dataset.room); return; } const b = e.target.closest('[data-pg]'); if (b && b.dataset.pg !== '') openPage(+b.dataset.pg); });
$('nxt').addEventListener('click', (e) => { const g = e.currentTarget.dataset.pg; if (g) openPage(+g); });
$('rooms').addEventListener('click', (e) => { const r = e.target.closest('[data-room]'); if (r) goRoom(r.dataset.room); });
$('parts').addEventListener('click', (e) => { const pr = e.target.closest('[data-pro]'); if (pr) { S.pro = pr.dataset.pro === '1'; if (!S.pro) { const L = pageTabs(PAGES[S.page]), ex = PAGES[S.page].more || [], f = L.find((x) => ex.indexOf(x[1]) < 0); if (f && ex.indexOf(S.tab[S.step]) > -1) { S.step = f[0]; S.tab[f[0]] = f[1]; } } save(); render(); return; } const m = e.target.closest('[data-more]'); if (m) { if (!S.moreOn) S.moreOn = {}; S.moreOn[S.page] = m.dataset.more === '1'; if (!S.moreOn[S.page]) { const p = PAGES[S.page], f = pageTabs(p).find((x) => (p.more || []).indexOf(x[1]) < 0); if (f) { S.step = f[0]; S.tab[f[0]] = f[1]; } } save(); render(); return; }
  const b = e.target.closest('[data-t]'); if (!b) return; S.step = +b.dataset.st; S.tab[S.step] = b.dataset.t; BIG3D = false; save(); $('con').classList.remove('down'); render(); });
let DRG = null, DRGSKIP = false; $('drop').addEventListener('pointerdown', (e) => { DRG = e.clientY; });
$('drop').addEventListener('pointerup', (e) => { if (DRG == null) return; const dy = e.clientY - DRG; DRG = null; if (Math.abs(dy) > 24) { $('con').classList.toggle('down', dy > 0); DRGSKIP = true; draw(); } });
$('drop').addEventListener('click', () => { if (DRGSKIP) { DRGSKIP = false; return; } $('con').classList.toggle('down'); draw(); });

// ---------- panes ----------
function seg(name, opts, val) { return '<div class="seg" data-sg="' + name + '">' + opts.map((o) => '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (String(o[0]) === String(val)) + '">' + o[1] + '</button>').join('') + '</div>'; }
const hatchKind = () => (!isPanel() && (S.hatch === 'snap' || S.hatch === 'screw') ? S.hatch : null);
const hpack = () => (G.PACKS[S.hpack] ? S.hpack : null);
function hatchZ() { const k = hatchKind(); return k ? G.hatchZone(outline(), k, tolOf(), hpack()) : null; }
function hatchNote() { const z = hatchZ(); if (!z) return 'The box is too small for ' + (hpack() ? 'a ' + G.PACKS[hpack()][0] + ' hatch' : 'a hatch') + ': make it wider or taller.'; return (z.pack ? G.PACKS[z.pack][0] + ' battery hatch (' + G.PACKS[z.pack][1] + ' x ' + G.PACKS[z.pack][2] + ' mm pack), 1.5 mm stepped rabbet lip, pry notch. ' : '') + (z.kind === 'snap' ? 'Snap hatch: ' : 'M3 screw hatch: ') + (2 * z.hw).toFixed(0) + ' x ' + (2 * z.hh).toFixed(0) + ' mm door in the ' + (UPRIGHT[S.style] ? 'back' : 'bottom') + ', flush in a recessed lip, ' + tolOf() + ' mm clearance. ' + (z.kind === 'snap' ? 'Two clips click over the lip; squeeze them to take it out.' : 'Two M3 x 6 screws go into the lip frame.') + ' The door is its own print file.'; }
function joinHtml() { const m = CZ.MATERIALS.find((x) => x[0] === S.material) || CZ.MATERIALS[0]; return '<p class="h" style="margin-top:12px">How the pieces join <span style="font-weight:600;color:var(--mute)">(best for ' + esc(m[1]) + ' first)</span></p><div class="grid g3">' + m[3].concat(Object.keys(CZ.JOINS).filter((k) => m[3].indexOf(k) < 0)).map((k, i) => '<button type="button" class="pick" data-join="' + k + '" aria-pressed="' + (S.join === k) + '">' + esc(CZ.JOINS[k][0]) + (i < 2 ? '<small>good fit</small>' : '') + '</button>').join('') + '</div><p class="note">' + esc(CZ.JOINS[S.join][1]) + '</p>'; }
const OPENS = [['shroud', 'Raised Shroud'], ['p_jack', 'Wire hole', 'Wire hole'], ['p_usbc', 'USB-C'], ['p_microusb', 'Micro-USB'], ['p_usbb', 'USB-B'], ['p_hdmi', 'HDMI'], ['p_microhdmi', 'Micro-HDMI'], ['p_jack', '3.5mm Audio'], ['p_switch', 'Slide Switch'], ['p_vent', 'Vents']];
function openHtml() { const n = (k) => (k === 'shroud' ? (S.items.some((i) => i.type === 'shroud') || S.ports.some((p) => p.kind === 'p_shroud') ? 1 : 0) : S.ports.filter((p) => p.kind === k).length);
  return '<p class="h" style="margin-top:12px">Openings</p><div class="grid g3">' + OPENS.map((o) => '<button type="button" class="pick" data-xgo="' + o[0] + '" data-xfrom="shape" aria-pressed="' + (n(o[0]) > 0) + '">' + o[1] + '<small>' + (n(o[0]) ? n(o[0]) + ' added &#10003;' : 'Add') + '</small></button>').join('') + '</div><p class="note">Openings are cut into the case walls. Tap one to pick its wall and spot.</p>'; }
function proHtml() { if (!S.pro || isPanel()) return ''; /* Pro (mm): the numbers behind the smart defaults */
  return '<div class="prob"><p class="h" style="margin:0 0 6px">Pro (mm)</p><div class="row"><b>Walls</b>' + seg('walls', [['normal', '2.4'], ['tough', '3.2']], S.wallT ? '' : S.walls) + '<input class="num mm" id="wallT" type="number" inputmode="decimal" step="0.1" min="2" max="5" value="' + R.T + '" aria-label="Wall thickness in mm"><span class="u">mm</span></div>' +
    '<div class="row"><b>Clearance</b>' + seg('tol', [['0.1', '0.1'], ['0.2', '0.2'], ['0.3', '0.3']], String(tolOf())) + '<input class="num mm" id="tolIn" type="number" inputmode="decimal" step="0.05" min="0.05" max="0.6" value="' + tolOf() + '" aria-label="Clearance in mm"><span class="u">mm</span></div>' +
    '<div class="row"><b>Wire Pass-Through</b><button type="button" class="btn" data-xgo="p_jack" style="flex:1;padding:9px 8px">Add a 6.2 mm wire hole</button></div><p class="note keep" style="margin:0">Base / Lid depth are the steppers above. Walls and Clearance are also in Print, Strength.</p></div>'; }
function stepper(name, label, txt) { return '<div class="row"><b>' + label + '</b><div class="step" data-st="' + name + '"><button type="button" data-d="-1" aria-label="Less">&minus;</button><output>' + esc(txt) + '</output><button type="button" data-d="1" aria-label="More">+</button></div></div>'; }
const LK = { solder: 'SOLDER', pins: 'NO SOLDER', plug: 'PLUG IN' };
function counts() { const c = {}; S.items.forEach((i) => { c[i.type] = (c[i.type] || 0) + 1; }); return c; }
// what the running total is made of: the electronics, plus the small stuff every build needs (screws, magnets, wires)
function costSplit() { const c = cost(true), ex = c.ex.filter((x) => !x.have); return money(c.parts) + ' electronics + ' + money(c.extras) + ' small stuff' + (ex.length ? ' (' + ex.map((x) => esc(x.name.split(/[,(]/)[0].trim()) + ' ' + money(x.each)).join(', ') + ')' : '') + '.'; }
function chosenChips(lean) { lean = true; /* the tray and the right column already list your parts: just the cost and Take out all here */ const c = counts(), P = PARTS(); const k = Object.keys(c).filter((t) => !(P[t] && P[t].board)), n = S.items.filter((i) => i.of == null && !(PP(i) && PP(i).board)).length, arm = Date.now() - CLEARARM < 4000;
  return (k.length ? (lean ? '<p class="note keep" style="margin-top:10px">' : '<p class="h" style="margin-top:12px">Electronics in your build</p><div class="chosen">' + k.map((t) => '<span>' + esc(P[t] ? P[t].short : t) + ' <i>x' + c[t] + '</i><button type="button" class="rm" data-sub="' + t + '" aria-label="Remove one ' + esc(P[t] ? P[t].short : t) + '">&times;</button></span>').join('') + '</div><p class="note keep" style="margin-top:6px">Tap the x to take one out. ') + '<b>About ' + money(cost(true).total) + ' so far.</b> ' + costSplit() + '</p>' + (n > 1 ? '<button class="btn' + (arm ? ' red' : '') + '" data-act="clearall" style="margin-top:8px;padding:8px">' + (arm ? 'Tap again: take out all ' + n + ' electronics' : 'Take out all electronics (your case stays)') + '</button>' : '') : '<p class="note keep">Nothing yet. Tap a group, then tap what you want.' + (cost(true).extras ? ' The case alone: ' + costSplit() : '') + '</p>') +
    (CLEARED && UNDO.length ? '<button class="btn dark" data-act="undo1" style="margin-top:8px;padding:8px">Undo: put it back</button>' : ''); }
// Parts: look at the flat top, or the whole case in 3D (front, back, sides, the Character head) and tap a part there to pick it
let PSEL = null; /* the wall port picked in Parts */
// Face: which side the picked part sits on. Electronics: the top they poke through (lid or base), or the floor when inside. Ports: their wall.
function faceRow(s) { if (!s || (PP(s) && PP(s).board)) return '';
  const o = s.panel === 'inside' ? [['inside', 'Bottom (floor)']] : panels().map((p) => [p, p === 'lid' ? 'Lid' : 'Top']);
  return '<div class="selbar"><b>Face</b>' + o.map((m) => '<button data-act="pan_' + m[0] + '"' + (s.panel === m[0] ? ' style="background:#1a1a1a;color:#fff"' : '') + '>' + m[1] + '</button>').join('') + '</div>'; }
function portSelHtml() { const p = S.ports.find((q) => q.id === PSEL); if (!p || !PORTS[p.kind]) return ''; const why = portBlocked(p), hf = hingeFace();
  return '<div class="selbar" style="flex-wrap:wrap"><b style="flex:1 0 100%">' + esc(PORTS[p.kind][0]) + ' &middot; Outside wall</b>' + PFACES.filter((x) => x[0] !== hf).map((x) => '<button type="button" data-pf="' + x[0] + '"' + (p.face === x[0] ? ' style="background:#1a1a1a;color:#fff"' : '') + '>' + x[1] + '</button>').join('') + '</div>' +
    '<div class="selbar"><b>Spot ' + (p.anchor.u + 1) + '</b><button type="button" data-pmv="-1" aria-label="Move left">&lsaquo;</button><button type="button" data-pmv="1" aria-label="Move right">&rsaquo;</button><button type="button" data-prm="' + p.id + '">Remove</button></div>' +
    (why ? '<p class="note"><span class="bad">Blocked: ' + esc(why) + '. It is not cut until you move it.</span></p>' : ''); }
function portMove(p, face, step) { const n = anchorsOf(face).length; if (!n) return; snapU(); let u = Math.max(0, Math.min(n - 1, p.anchor.u + step));
  const t = (k) => portBlocked(Object.assign({}, p, { face, anchor: { u: k, v: 0 } })); if (t(u)) { const free = anchorsOf(face).map((a) => a.u).filter((k) => !t(k)).sort((a, b) => Math.abs(a - u) - Math.abs(b - u)); if (free.length && (step === 0 || (free[0] - p.anchor.u) * step > 0)) u = free[0]; }
  p.face = face; p.anchor = { u, v: 0 }; save(); render(); const why = portBlocked(p); tag(why ? 'Blocked there: ' + why + '.' : PORTS[p.kind][0] + ' on the ' + face + ' wall, spot ' + (u + 1) + '.'); }
const viewMode = () => (xrayOn() ? 2 : BIG3D ? 1 : 0);
const viewTgl = () => { const m = viewMode(); return '<div class="vtg" role="group" aria-label="View">' + [['0', '2D'], ['1', '3D'], ['2', 'X-Ray']].map((o) => '<button type="button" data-v3="' + o[0] + '" aria-pressed="' + (m === +o[0]) + '">' + o[1] + '</button>').join('') + '</div>' + (m ? '<p class="note keep" style="margin:-2px 0 8px">' + (m === 2 ? 'The shell is see-through: spin it to check the room around the board, battery, motors and risers inside.' : 'Drag to spin to any side. Tap a part to pick it.') + '</p>' : ''); };
function pane(t) {
  const P = PARTS(), c = counts();
  if (t === 'snap') return copilotHtml() + '<p class="h">Already built and soldered?</p><button class="btn red" data-act="measure">Photo my board, front and back</button><p class="note" style="margin-bottom:10px">A card next to it is the ruler. Press on each part on the photo, say what it is, do the brain too. Your board goes inside the case, every part on it becomes its own part you can change. Photos stay on your phone.</p>' +
    '<p class="h">Not built yet</p><div class="grid g2"><button class="btn dark" data-act="snap">' + (PHOTO ? 'Take another photo' : 'Take a photo of my electronics') + '</button><button class="btn" data-act="toParts">Pick from the list</button></div>' +
    '<p class="note">Lay your electronics out on a table and snap them. The photo stays here on your phone so you can match each one to the list. Then tap Electronics and add each one you see.</p>' + (PHOTO ? '<button class="btn" data-act="nophoto" style="margin-top:8px">Remove the photo</button>' : '') + chosenChips();
  if (t === 'try') return tryPane();
  if (t === 'sounds') return '<div class="list">' + (CZ.SOUND_LIBS || []).map(([n, u, d]) => '<a href="' + u + '" target="_blank" rel="noopener"><b>' + n + '</b>' + d + '</a>').join('') + '</div><p class="note keep">Pico tip: <b>16-bit, 22 kHz, mono .wav</b>.</p>';
  if (t === 'guide') { const lk = (u, n) => '<a href="' + u + '" target="_blank" rel="noopener"><b>' + n + '</b></a>';
    return (S.items.length ? GUIDE_BTN : '<p class="note keep">Add parts in Design first.</p>') + presetLinksHtml() + '<p class="h" style="margin-top:12px">Code files</p><div class="grid g2">' + codeNow().map((c, i) => '<button type="button" class="btn" data-cf="' + i + '">' + esc(c[0]) + '</button>').join('') + '</div>' +
      '<p class="h" style="margin-top:12px">Tools</p><div class="list">' + lk(LIBURL.ino, 'Arduino IDE') + lk('https://circuitpython.org/', 'CircuitPython.org') + '</div>' + (libsBox() || '<button type="button" class="btn red" data-act="saveall" style="width:100%;margin:10px 0 0">Download Full Project (.zip)</button>'); }
  if (t === 'parts') { return copilotHtml() + partsPane(P, c); } /* no swap dropdown here: the tray x and the - n + steppers do it */
  return paneRest(t, P, c);
}
const plainTag = (t) => String(t || '').replace('CircuitPython (code.py)', 'Beginner-friendly').replace('Arduino (.ino)', 'Uses the free Arduino app'); /* no jargon on the Brain tags */
const SIMPLE = { camera: ['tact12', 'oled096', 'arducam', 'esp32cam', 'tp4056'], mini: ['vl53', 'pir', 'tact12', 'oled096', 'pico'], groove: ['tact12', 'pot', 'slider', 'oled096', 'speaker28'],
  clam: ['pico', 'tft28', 'tact12', 'dpad', 'speaker28', 'lipo500'], hand: ['pico', 'tft28', 'dpad', 'tact12', 'speaker28', 'lipo500'], small: ['pico', 'oled096', 'tact12', 'led5', 'tp4056'], slate: ['pico', 'tft28', 'tact12', 'speaker28', 'lipo1200', 'tp4056'],
  calc: ['pico', 'keypad44', 'oled096', 'tact12', 'tp4056'], pad: ['pico', 'button16', 'arcade24', 'oled096', 'ring12'], face: ['esp32s3', 'round128', 'tact12', 'speaker28', 'ring12'], deck: ['pico', 'button16', 'pot', 'slider', 'oled096', 'arcade24'],
  panel: ['uno', 'tact12', 'pot', 'lcd1602', 'led5', 'servo'], _: ['pico', 'tact12', 'oled096', 'pot', 'speaker28', 'tp4056'] };
const SNAME = { camera: { tact12: 'Shutter Button', esp32cam: 'ESP32-CAM-MB', oled096: '0.96" OLED' }, mini: { tact12: 'Capture Button', oled096: '0.96" OLED', vl53: 'VL53L0X', pir: 'HC-SR501' }, groove: { tact12: 'Buttons', pot: 'Knobs', oled096: 'OLED', speaker28: 'Speaker' } };
// a part card: tap it to add the first one; once you have it, a clear - n + stepper is the only way to change how many (the card itself does nothing)
const pickOpen = (k, c, cls, at) => c[k] ? '<div class="pick has' + cls + '"' + (at || '') + '>' : '<button type="button" class="pick' + cls + '" data-add="' + k + '"' + (at || '') + '>';
const pickClose = (k, c) => c[k] ? '</div>' : '</button>';
const qty = (k, c) => c[k] ? '<span class="qs" role="group" aria-label="How many"><span role="button" tabindex="0" data-sub="' + k + '" aria-label="Take one out">&minus;</span><b>' + c[k] + '</b><span role="button" tabindex="0" data-add="' + k + '" aria-label="Add one more">+</span></span>' : '<span class="qa">+ Add</span>';
function simplePicks(P, c) { const ids = (SIMPLE[S.style] || SIMPLE._).filter((k) => P[k]), nm = styleRow()[1];
  return '<p class="h bfh" style="margin-top:0">Best for your ' + esc(nm) + '<span>The ' + ids.length + ' parts most builds use</span></p><div class="grid g3 simp">' + ids.map((k) => pickOpen(k, c, '') + (lineArt(k) || partSvg(P[k])) + esc((SNAME[S.style] || {})[k] || P[k].short) + '<small>' + (P[k].price ? '$' + P[k].price : '') + '</small>' + qty(k, c) + pickClose(k, c)).join('') + '</div>' +
    '<button type="button" class="btn" data-fn="power" style="margin-top:8px">Power: USB, AA or LiPo' + (pwrMode() ? ' &middot; ' + esc(POWER_MODES[pwrMode()][0]) : '') + '</button><button type="button" class="btn" data-act="allparts" style="margin-top:8px">See every part (Pro)</button>' + chosenChips(true); } /* the tray above already lists what you picked */
function partsPane(P, c) {
  {
    // Parts are about what the device does, not about catalog names. First the question, then the few parts that answer it.
    const fn = FUNCS.find((f) => f[0] === S.fn);
    if (!fn && !S.pro) return simplePicks(P, c);
    if (!fn) { const tile = (f) => { const n = Object.keys(c).reduce((q, k) => q + (P[k] && P[k].cat === f[0] ? c[k] : 0), 0); return '<button type="button" class="pick fn" data-fn="' + f[0] + '">' + (n ? '<span class="n">' + n + '</span>' : '') + (f[3] && P[f[3]] ? lineArt(f[3], 0, FTINT[f[0]]) || partSvg(P[f[3]]) : ico('measure')) + f[1] + '<small>' + f[2] + '</small></button>'; };
      return FGROUPS.map((g) => '<p class="h"' + (g[0] === 'Inputs' ? ' style="margin-top:0"' : '') + '>' + g[0] + ' <span style="font-weight:600;text-transform:none;letter-spacing:0">' + g[1] + '</span></p><div class="grid g3" style="margin-bottom:10px">' + g[2].map((k) => tile(FUNCS.find((f) => f[0] === k))).join('') + '</div>').join('') + chosenChips(); }
    const head = '<div class="fnh"><button type="button" class="btn" data-fn="" aria-label="Back to categories">&lsaquo; Back</button><b>' + fn[1] + '</b></div>';
    const list = Object.keys(P).filter((k) => P[k].cat === fn[0]);
    const cb = {}; list.forEach((k) => { cb[k] = compat(k); });
    return head + (fn[0] === 'power' ? powerPane() : '') + '<div class="hrow">' + (list.map((k) => pickOpen(k, c, (cb[k] && cb[k][0] === 'no' ? ' dim' : ''), cb[k] && cb[k][2] ? ' title="' + esc(cb[k][1] + ': ' + cb[k][2]) + '"' : '') + (cb[k] ? '<span class="cb ' + cb[k][0] + '">' + cb[k][1] + '</span>' : '') + '' + '<span class="lk ' + P[k].link + '">' + LK[P[k].link] + '</span>' + (lineArt(k) || partSvg(P[k])) + esc(P[k].short) + '<small>' + (P[k].price ? '$' + P[k].price : '') + '<span class="sz">' + esc((P[k].w + ' x ' + P[k].h).replace(/\.0\b/g, '')) + ' mm</span></small>' + qty(k, c) + pickClose(k, c)).join('') + (fn[0] === 'mine' || !list.length ? /* My own board: the presets, and measuring one with the phone */
        '<button type="button" class="pick" data-act="measure" style="grid-column:span 2">' + ico('measure') + 'Measure one with my phone<small>Card as the ruler</small></button>' : '')) + '</div>' +
      (list.some((k) => cb[k] && cb[k][0] !== 'ok') ? '<div class="cbl">' + list.filter((k) => cb[k] && cb[k][0] !== 'ok').map((k) => '<div class="' + cb[k][0] + '"><b>' + esc(P[k].short) + '</b> ' + esc(cb[k][1]) + ': ' + esc(cb[k][2]) + '</div>').join('') + '</div>' : '') +
      (fn[0] === 'brain' ? '<div class="btags">' + list.filter((k) => P[k].tag).map((k) => '<div><b>' + esc(P[k].short) + '</b> &middot; ' + esc(plainTag(P[k].tag)) + '</div>').join('') + '</div>' : '') + '<p class="note" id="partTip">' + (list[0] ? 'Tap + Add, then use - and + to change how many. ' + esc(P[list[0]].tip) : '') + '</p>' + (fn[0] === 'power' ? '<p class="note">' + powerNote() + '</p>' : '') + chosenChips();
  }
}
function paneRest(t, P, c) {
  if (t === 'pins') return pinsHtml();
  if (t === 'picks') return '<p class="h">Cheap, loved by the maker community</p><div class="list">' + CZ.PICKS.map((p) => '<div class="it"><b>' + esc(p[1]) + (c[p[0].split('+')[0]] ? ' <span class="ok">added</span>' : '') + '</b>' + esc(p[2]) + '<div style="margin-top:6px"><button class="btn" data-add="' + p[0] + '" style="display:inline-block;padding:7px 12px">+ Add ' + esc(p[0].split('+').map((k) => P[k].short).join(' + ')) + '</button></div></div>').join('') + '</div><p class="note">From Reddit (r/esp32, r/raspberry_pi), Instructables and maker blogs. Sources in the ? help.</p>';
  if (t === 'lid' || t === 'base' || t === 'top') {
    const mine = S.items.filter((i) => i.panel === t || (t !== 'lid' && i.panel === 'inside')), s = S.items.find((i) => i.id === sel), probs = allProblems(), N = numbers();
    let h = s && s.of != null ? '<div class="selbar"><b>' + esc(label(s)) + '</b><select class="pin" data-kidtype="' + s.id + '" aria-label="What it is">' + KID_TYPES.filter((t) => CZ.PARTS[t]).map((t) => '<option value="' + t + '"' + (t === s.type ? ' selected' : '') + '>' + esc(CZ.PARTS[t].short) + '</option>').join('') + '</select>' + (RECTK(s) ? '<button data-act="rot">Turn</button>' : '') + '<button data-act="del">Remove</button></div>' + nudgeRow() + '<p class="note" style="margin:-2px 0 8px">Drag it, or use the arrows (0.5 mm), until it sits where the real part is (turn My photo on to check). Your board stays put.</p>' + (s.panel !== 'inside' ? stepper('kh', 'Height', kidH(s) + ' mm above board') + '<p class="note" style="margin:-2px 0 8px">' + esc(pokeNote(s)) + '</p>' : '') : s ? '<div class="selbar"><b>' + esc(label(s)) + '</b><button data-act="rot">Turn 90&deg;</button><button data-act="del">Remove</button></div>' + swapBar(s) + faceRow(s) +
      (PP(s) && !PP(s).inside ? '<div class="selbar"><b>Mount</b>' + [['top', 'Outside'], ['in', 'Inside']].map((m) => '<button data-act="mnt_' + m[0] + '"' + ((s.panel === 'inside') === (m[0] === 'in') ? ' style="background:#1a1a1a;color:#fff"' : '') + '>' + m[1] + '</button>').join('') + '</div>' : '') +
      (s.panel === 'inside' ? stepper('riser', 'Riser', PP(s) && PP(s).holes && PP(s).holes.length ? riserOf(s) + ' mm standoffs' : s.riser != null && s.riser > 0 ? s.riser + ' mm slate' : 'On the floor') + '<p class="note keep" style="margin:-2px 0 8px">' + (PP(s) && PP(s).holes && PP(s).holes.length ? 'Standoffs at its screw holes, printed with the case.' : 'A flat plate on 4 corner posts lifts it; it prints with the case.') + '</p>' : '') : '';
    if (s && PP(s) && PP(s).board) h += '<div class="selbar"><b>My photo</b>' + [['off', 'Hide'], ['faded', 'Faint'], ['clear', 'Show']].map((m) => '<button data-photo="' + m[0] + '"' + ((S.photo || 'off') === m[0] ? ' style="background:#1a1a1a;color:#fff"' : '') + '>' + m[1] + '</button>').join('') + '</div>' + ((PP(s).kids || []).length ? '<button class="btn" data-act="kidsreset" style="margin:0 0 8px;padding:8px">Put the parts back where my photo had them</button>' : '') + '<div class="selbar"><b>Board</b><button data-act="bmove">' + (s.move ? 'Unlocked: drag moves it' : 'Locked in place') + '</button></div>' + (s.move ? nudgeRow() : '') + '<p class="note" style="margin:-2px 0 8px">Tap an empty spot on your board to add a part there.</p>' + stepper('btop', 'Tallest', (PP(s).top || 9) + ' mm button') + '<p class="note" style="margin:-2px 0 8px">Your board hangs under the top so a ' + (PP(s).top || 9) + ' mm button pokes through 1.5 mm. Tap one to see how far it pokes through.</p>' + stepper('bund', 'Under', (PP(s).under != null ? PP(s).under : 8.5) + ' mm below') + '<p class="note" style="margin:-2px 0 8px">Space under the board for pins, solder and wires' + (PP(s).under != null ? ', from your side photo' : ', a guess: take the side photo to measure it') + '.</p>';
    if (!s && PSEL != null) h += portSelHtml();
    h += '<p class="h">' + (t === 'lid' ? 'The lid: screens live here' : t === 'base' ? 'The base: controls, the brain sits under it' : 'The top') + '</p>';
    h += mine.length ? '<div class="chosen">' + mine.map((i) => '<span data-sel="' + i.id + '" class="ach" style="cursor:pointer' + (i.id === sel ? ';background:#1a1a1a;color:#fff' : '') + '">' + lineArt(i.type, 26) + esc(N[i.id] + ' ' + PP(i).short) + (problems(i).length ? ' <i>!</i>' : '') + '</span>').join('') + '</div>' : '<p class="note">No electronics here yet. Add some in Brain.</p>';
    if (t !== 'lid' && S.ports.length) h += '<p class="h" style="margin-top:8px">Wall ports</p><div class="chosen">' + S.ports.filter((p) => PORTS[p.kind]).map((p) => '<span data-psel="' + p.id + '" class="ach" style="cursor:pointer' + (p.id === PSEL ? ';background:#1a1a1a;color:#fff' : '') + '">' + esc(PORTS[p.kind][0] + ' ' + p.face) + (portBlocked(p) ? ' <i>!</i>' : '') + '</span>').join('') + '</div>';
    if (s && s.of == null && s.panel !== 'inside' && PP(s) && !PP(s).board && !isPanel()) { const mt = s.mt || 'flush'; h += '<div class="selbar"><b>Sits</b>' + [['flush', 'Flush'], ['raised', 'Raised rim'], ['sunk', 'Sunk in'], ['top', 'On top']].map((m) => '<button data-mt="' + m[0] + '"' + (mt === m[0] ? ' style="background:#1a1a1a;color:#fff"' : '') + '>' + m[1] + '</button>').join('') + '</div><p class="note" style="margin:2px 0 0">' + ({ flush: 'Level with the top.', raised: 'A rim stands up around it. The rim prints as its own flat piece that you glue on.', sunk: 'It sits down in a shallow pocket.', top: 'No opening. The part sits on the top, only its wires go through a small hole.' })[mt] + '</p>'; }
    h += '<div class="grid g2" style="margin-top:8px"><button class="btn dark" data-act="auto">Arrange for me</button><button class="btn" data-act="toBrain">Add electronics</button></div>';
    h += '<p class="note">' + (probs.length ? probs.map((x) => '<span class="bad">' + esc(label(x.it)) + ' is ' + esc(x.list[0]) + '.</span>').join(' ') : (mine.length ? '<span class="ok">Everything fits.</span> ' + (S.items.some((i) => PP(i) && PP(i).board) ? 'Tap your board to add a part there. Drag a part to line it up. Two fingers zoom in, and the part numbers show.' : 'Drag anything to move it. Tap to pick it.') : '')) + '</p>';
    return h;
  }
  if (t === 'psize') { const d = dims(), scr = S.items.some((i) => PP(i) && PP(i).screen);
    return mpanHtml() + lipHtml() + swapHtml() + '<button class="btn dark" data-act="measureLid" style="margin-bottom:8px">Measure the inside of my box</button><div class="row"><b>Box inside</b><input class="num" id="pw" type="number" inputmode="decimal" step="0.5" value="' + S.pw + '" aria-label="Inside width in mm"><span class="u">x</span><input class="num" id="pd" type="number" inputmode="decimal" step="0.5" value="' + S.pd + '" aria-label="Inside height in mm"><span class="u">mm</span></div>' +
    '<div class="row"><b>Sits</b>' + seg('plift', [['0', 'On the floor'], ['legs', 'On legs'], ['rim', 'On a lip']], S.plift > 0 ? (S.pbase || 'legs') : '0') + '</div>' + (S.plift > 0 ? stepper('plift', S.pbase === 'rim' ? 'Lip' : 'Legs', S.plift + ' mm tall') : '') + '<div class="row"><b>Holds by</b>' + seg('phold', [['screws', 'Screws'], ['glue', 'Glue'], ['ribs', 'Snug ribs'], ['drop', 'Drops in']], S.phold) + '</div>' +
    '<div class="row"><b>Thick</b>' + seg('pt', [['2', '2 mm'], ['3', '3 mm'], ['4', '4 mm']], String(S.pt)) + '</div><div class="row"><b>Corners</b>' + seg('prad', [['0', 'Square'], ['3', 'Soft'], ['8', 'Round']], String(S.prad)) + '</div>' +
    '<p class="note">Panel: <b>' + d.W + ' x ' + d.D + ' mm</b>, 1 mm smaller than the box so it drops in. ' + ({ screws: 'M3 screws in the corners' + (S.plift > 0 ? ' go down through the ' + (S.pbase === 'rim' ? 'lip' : 'legs') + ' into the box. Already have screws or posts in the box? Line the corner holes up with them, or tag them on a photo.' : '. Already have screws in the box? Line the corner holes up with them.'), glue: 'No holes. ' + (S.plift > 0 ? 'A thin line of glue on the bottom of the ' + (S.pbase === 'rim' ? 'lip' : 'legs') : 'Glue or double sided tape on the back') + ' (E6000 or CA for wood and PLA). It is forever.', ribs: 'Little ribs on every edge press against the box and hold it, no screws.', drop: 'It just lies in the box.' })[S.phold] + ' ' +
    (S.plift > 0 ? (S.pbase === 'rim' ? 'On a lip: a wall under the whole edge holds it up, stiffer than legs and hides the wires. Notches cut through the lip too. ' : 'On legs: posts at the corners and along the edges hold it up. ') + 'The window shows only the picture. Set the height to the front of the screen above the floor. It prints face down.' : scr ? 'On the floor: the whole screen comes up through the window, like your wood panels.' : '') + (d.W > S.bed[0] || d.D > S.bed[1] ? ' Bigger than your bed: it prints as puzzle pieces that lock together (Print, Split).' : '') + '</p>'; }
  if (t === 'notch') {
    const N = S.notches || [], i = Math.min(S.nsel || 0, N.length - 1), n = N[i], along = n && (n.edge === 'left' || n.edge === 'right') ? 'From bottom' : 'From left';
    return '<div class="grid g2"><button class="btn dark" data-act="addNotch">Add a notch</button>' + (n ? '<button class="btn" data-act="delNotch">Remove N' + (i + 1) + '</button>' : '<span></span>') + '</div>' +
      (N.length ? '<div class="chosen" style="margin:6px 0 8px">' + N.map((x, j) => '<span data-nsel="' + j + '" style="cursor:pointer' + (j === i ? ';background:#1a1a1a;color:#fff' : '') + '">N' + (j + 1) + ' ' + EDGE[x.edge] + '</span>').join('') + '</div>' : '') +
      (n ? '<div class="row"><b>Edge</b>' + seg('n_edge', [['bottom', 'Bottom'], ['top', 'Top'], ['left', 'Left'], ['right', 'Right']], n.edge) + '</div><div class="row"><b>Shape</b>' + seg('n_shape', [['round', 'Round'], ['rrect', 'Rounded'], ['rect', 'Square']], n.shape) + '</div>' + stepper('nw', 'Wide', n.w + ' mm') + stepper('nd', 'Deep', n.d + ' mm') + stepper('nat', along, n.at + ' mm') : '<p class="note">A notch lets wires and plugs pass the edge of the panel. Tap Add a notch, or tap an edge on the picture.</p>') + (n ? '<p class="note">Drag on the picture to move N' + (i + 1) + ' along any edge.</p>' : '');
  }
  if (t === 'size') { const d = dims(); return stepper('cols', 'Wide', S.cols + ' squares') + stepper('rows', 'Tall', S.rows + ' squares') + '<p class="note">Each square is 20 mm, like your Panel Layout v1. Outside: <b>' + d.W.toFixed(0) + ' x ' + d.D.toFixed(0) + ' mm</b>, ' + heights().H + ' mm deep' + (isClam() ? ' + ' + heights().Hl + ' mm lid' : '') + '.</p>'; }
  if (t === 'shape') return '<div class="hrow">' + CZ.STYLES.map((s) => '<button type="button" class="pick" data-style="' + s[0] + '" aria-pressed="' + (S.style === s[0]) + '">' + styleSvg(s[0]) + (() => { const m = /^(.*?)\s*\((.+)\)$/.exec(s[1]); return m ? esc(m[1]) + '<small class="psub">' + esc(m[2]) + '</small>' : esc(s[1]); })() + '</button>').join('') + '</div><p class="note">' + esc(styleRow()[2]) + '.' + (S.style === 'face' ? ' Round screens make eyes or a watch face. Want it to move? Add a servo in Brain (Move).' : '') + (S.style === 'hand' || S.style === 'pad' ? ' Our own shape, not a copy of any console.' : '') + '</p>' + shapePresetHtml() + (S.style === 'face' ? '<button class="btn dark" data-xgo="body" style="margin-top:8px">Give it a body, arms and legs</button>' : '') + (isPanel() ? '' : '<p class="h" style="margin-top:12px">Size and fit</p>' + pane('fit')) + proHtml() + '<button class="btn" data-act="start" style="margin-top:10px">Start over with something else</button>';
  if (t === 'fit') {
    const h = geom();
    let o = stepper('cols', 'Wide', S.cols + ' sq' + (S.xw ? ' + ' + S.xw : '')).replace(/<\/div>$/, '<input class="num mm" id="mmw" type="number" inputmode="decimal" step="0.5" value="' + +h.W.toFixed(1) + '" aria-label="Width in mm"><span class="u">mm</span></div>') + stepper('rows', 'Tall', S.rows + ' sq' + (S.xd ? ' + ' + S.xd : '')).replace(/<\/div>$/, '<input class="num mm" id="mmd" type="number" inputmode="decimal" step="0.5" value="' + +h.D.toFixed(1) + '" aria-label="Depth in mm"><span class="u">mm</span></div>') + (!S.pro ? '<p class="note keep" style="margin:-2px 0 8px">' + (isClam() ? 'Base ' + h.H + ' mm, lid ' + h.Hl + ' mm deep' : h.closed + ' mm tall') + ': the smart default for your parts. Pro (mm) changes it.</p>' : isClam() ? stepper('add', 'Base', h.H + ' mm deep' + (S.add ? ' (+' + S.add + ')' : '')) + stepper('addL', 'Lid', h.Hl + ' mm deep' + (S.addL ? ' (+' + S.addL + ')' : '')) + '<p class="note keep" style="margin:-2px 0 8px">' + h.closed + ' mm closed. Deepen the base for batteries or tall parts without thickening the lid.</p>' : stepper('add', 'Height', h.closed + ' mm' + (S.add ? ' (+' + S.add + ')' : '')));
    if (S.lockBox) o = '<p class="vline v1">Box kept: ' + Math.round(dims().W) + ' x ' + Math.round(dims().D) + ' x ' + h.closed + ' mm. <button type="button" class="btn" data-act="unlockbox" style="display:inline-block;padding:6px 10px">Unlock</button></p>' + o + (heights().grew ? '<p class="note bad">Something you added is deeper than the kept box.</p>' : '');
    o += '<p class="h" style="margin-top:12px">Closures</p><div class="row"><b>Deck on</b>' + seg('snap', [['0', 'Screws'], ['1', 'Snap clips'], ['mag', 'Magnets 6x3']], S.snap ? '1' : S.deckMag ? 'mag' : '0') + '</div>';
    if (S.items.some((i) => i.type === 'tact12')) o += '<div class="row"><b>Buttons</b>' + seg('spring', [['0', 'Caps'], ['1', 'Printed springs']], S.spring ? '1' : '0') + '</div>';
    if (isClam()) o += '<div class="row"><b>Hinge</b>' + seg('hinge', [['printed', 'Printed'], ['metal', 'Metal'], ['none', 'Lift off']], S.hinge) + '</div>' + (S.style === 'small' ? '<div class="row"><b>Opens on</b>' + seg('hside', [['left', 'Left'], ['right', 'Right']], S.hside) + '</div>' : '') + '<div class="row"><b>Closes</b>' + seg('magnets', [['1', 'Magnets'], ['0', 'Latch or strap']], S.magnets ? '1' : '0') + '</div><div class="row"><b>Wires</b>' + seg('wpass', [['slot', 'Hinge slot'], ['ribbon', 'Ribbon notch'], ['channel', 'Covered channel']], S.wpass || 'slot') + '</div>';
    if (UPRIGHT[S.style]) o += '<div class="row"><b>Tripod</b>' + seg('tripodOn', [['0', 'None'], ['1', 'Bottom 1/4-20']], S.attachedParts.some((m) => m.partId === 'tripod' && m.face === 'front') ? '1' : '0') + '</div>';
    o += '<div class="row"><b>Hatch</b>' + seg('hatch', [['none', 'None'], ['snap', 'Snap hatch'], ['screw', 'M3 Screw hatch']], hatchKind() || 'none') + '</div>';
    if (hatchKind()) o += '<div class="row"><b>Pack</b>' + seg('hpack', [['', 'Any']].concat(Object.keys(G.PACKS).map((k) => [k, G.PACKS[k][0]])), hpack() || '') + '</div>';
    o += '<p class="note">' + (S.snap ? 'Snap clips: 4 arms under the deck click into a groove in the wall. No screws. ' : '') + (!S.snap && S.deckMag ? 'Deck magnets: a 6 x 3 mm magnet in the top of each post and one under the deck above it. Lift it off, no screws. ' : '') + (hatchKind() ? hatchNote() + ' ' : '') + (S.spring ? 'Printed springs: the deck around each small button becomes a little flexing pad, no caps to buy. ' : '') + (isClam() ? (S.hinge === 'printed' ? 'Printed hinge: a piece of 1.75 mm filament is the pin. ' : S.hinge === 'metal' ? 'Metal hinges: 2 small butt hinges (25 mm) screwed to the back. ' : '') + (S.magnets ? 'Two 6 x 3 mm magnets in each half hold it shut. ' : '') : 'Height grows to fit your deepest part. Add more for batteries or a speaker. ') + '</p>';
    return o + joinHtml() + openHtml();
  }
  if (t === 'measure') { const mine = Object.keys(S.mine); return '<button class="btn dark" data-act="measure">Measure a part with my phone</button><p class="note">Lay a bank, ID or library card next to it. The camera shows a green outline and arrows, and snaps when your phone is level. Then drag the dots onto the corners and tap the holes. Front holes get cut in the deck, back screw holes get posts.</p>' + (mine.length ? '<p class="h" style="margin-top:10px">My electronics</p><div class="chosen">' + mine.map((k) => '<span>' + esc(S.mine[k].name) + ' ' + S.mine[k].w + ' x ' + S.mine[k].h + ' <i data-delmine="' + k + '" style="cursor:pointer">&times;</i></span>').join('') + '</div>' : ''); }
  if (t === 'logo') { const f = logoFace(), L = LG(f), wall = !!WALLF[f], img = LOGOIMGS[f], dot = (x) => (logoOn(x) ? ' &bull;' : '');
    return '<div class="row"><b>Where</b>' + seg('lg_face', logoFaces().map((x) => [x[0], SHORTF[x[0]] + dot(x[0])]), f) + '</div><div class="row"><b>Logo</b>' + seg('lg_src', [['off', 'None'], ['text', 'Words'], ['image', 'My PNG']], L.on ? L.src : 'off') + '</div>' + (L.on ? (L.src === 'text' ? '<div class="row"><b>Words</b><input class="txt" id="lgText" maxlength="16" value="' + esc(L.text) + '" style="flex:1;height:38px;border:1.5px solid #1a1a1a;border-radius:10px;padding:0 10px;font:700 16px var(--sys)"></div>' : '<div class="row"><b>Picture</b><label class="btn" style="flex:1;position:relative">' + (img ? 'Pick another' : 'Pick my logo') + '<input type="file" accept="image/*" id="lgFile" style="position:absolute;inset:0;opacity:0"></label></div>' + (!img ? '<p class="note bad" style="margin:-2px 0 8px">Pick a picture to see it on the case.</p>' : !logoShape(f).length ? '<p class="note bad" style="margin:-2px 0 8px">We could not find a shape in that picture. Try one with a plain background and a bold logo.</p>' : '')) +
      (!wall || f === 'back' ? '<div class="row"><b>How</b>' + seg('lg_how', [['dip', 'Pressed in'], ['raised', 'Raised'], ['cut', 'Cut through']], L.how) + '</div>' : '<p class="note keep" style="margin:0 0 8px">On a side wall the logo is pressed in 0.7 mm, so the wall prints clean standing up.</p>') + stepper('lgsize', 'Size', L.size + ' mm wide') +
      (wall ? stepper('lgx', 'Along', (L.x == null ? 0 : Math.round(((f === 'back' || f === 'left' ? -1 : 1) * (L.x - wallMid(f)[0])) * 10) / 10) + ' mm from the middle') + stepper('lgz', 'Height', (L.y == null ? wallMid(f)[1] : L.y).toFixed(1) + ' mm up') : '') : '<p class="note">Each face takes its own logo: words on one, your PNG on another. Pressed in, raised, or cut all the way through. PNG with a clear or white background works best.</p>'); }
  if (t === 'labels') { const L = S.look.labels, list = S.items.filter((i) => PP(i) && i.panel !== 'inside' && PP(i).cat !== 'brain'), btns = {}; panels().forEach((p) => { btns[p] = itemsOn(p).filter((i) => PP(i) && PP(i).cat === 'press').sort((a, b) => (numbers()[a.id] > numbers()[b.id] ? 1 : -1)); });
    return '<div class="row"><b>Labels</b>' + seg('lb_place', [['off', 'None'], ['below', 'Under'], ['above', 'Over']], L.on ? L.place : 'off') + '</div>' + (L.on ? '<div class="row"><b>How</b>' + seg('lb_how', [['dip', 'Pressed in'], ['raised', 'Raised']], L.how) + '</div>' + stepper('lbsize', 'Letters', L.size + ' mm tall') +
      '<div class="chosen">' + list.map((i) => '<span>' + esc(numbers()[i.id]) + ' <input data-lbl="' + i.id + '" value="' + esc(labelText(i, (btns[i.panel] || []).indexOf(i))) + '" maxlength="5" style="width:52px;border:0;border-bottom:1.5px solid #1a1a1a;font:800 13px var(--sys);background:none"></span>').join('') + '</div>' : '<p class="note">Letters or symbols under each button, like A, B, PLAY, VOL. Pressed into the deck or raised.</p>'); }
  if (t === 'tex') { const f = S.look.texFace, tx = S.look.tex[f], kinds = f === 'walls' ? [['none', 'None'], ['vstripe', '| | |'], ['hstripe', '='], ['grid', 'Grid'], ['checks', 'Checks']] : [['none', 'None'], ['grid', 'Grid'], ['checks', 'Checks'], ['diamond', 'Tread'], ['vstripe', '| | |'], ['hstripe', '='], ['dots', 'Dots'], ['wood', 'Wood']];
    return '<div class="row"><b>Side</b>' + seg('tx_face', faces().map((x) => [x[0], SHORTF[x[0]]]).concat([['walls', 'Sides']]), f) + '</div><div class="grid g4 texg">' + kinds.map((k) => '<button type="button" class="pick" data-tex="' + k[0] + '" aria-pressed="' + (tx.kind === k[0]) + '">' + texSvg(k[0]) + esc(k[1]) + '</button>').join('') + '</div>' + (tx.kind !== 'none' ? stepper('txsp', 'Spacing', tx.sp + ' mm') + (f !== 'walls' ? '<div class="row"><b>Pattern</b>' + seg('tx_bump', [['0', 'Pressed in'], ['1', 'Stands up']], tx.bump ? '1' : '0') + '</div>' : '') : ''); }
  if (t === 'colors') { const L = S.look; return '<div class="row"><b>My printer</b>' + seg('cl_n', [['1', 'One color'], ['2', '2 or more (AMS, MMU)']], String(L.colors)) + '</div><div class="row"><b>Colors</b><label class="btn" style="flex:1;display:flex;gap:8px;align-items:center;justify-content:center"><input type="color" id="c1" value="' + L.c1 + '" style="width:28px;height:28px;border:0;padding:0;background:none">Case</label><label class="btn" style="flex:1;display:flex;gap:8px;align-items:center;justify-content:center"><input type="color" id="c2" value="' + L.c2 + '" style="width:28px;height:28px;border:0;padding:0;background:none">Marks</label></div>' +
    (L.colors > 1 ? '<p class="note">You get a second file for every piece with marks. Load both as one object in Bambu Studio, Orca or Prusa, give the second file your marks color. They line up by themselves.</p>' : '<div class="row"><b>Marks</b>' + seg('cl_single', [['paint', 'Paint the dips'], ['glue', 'Print pieces + glue']], L.single) + '</div><p class="note">' + (L.single === 'paint' ? 'Pressed-in marks stay as dips. Wipe in acrylic paint, scrape the top clean.' : 'Logos and labels print as separate pieces that drop into a 0.1 mm bigger pocket. A dot of glue holds them.') + ' Raised marks are always a separate piece: the deck prints face down, so nothing can stick up from it.</p>'); }
  if (t === 'printer') {
    const cur = printerRow(), brand = S.brand || cur[5];
    return '<input class="mm" id="prSearch" type="search" placeholder="Find my printer (Ender, A1, MK4...)" value="' + esc(S.prq || '') + '" aria-label="Find my printer" style="width:100%;height:42px;margin-bottom:8px">' +
      '<div class="row"><b>Custom bed</b><input class="mm" id="bedW" type="number" inputmode="decimal" min="80" max="1000" value="' + S.bed[0] + '" aria-label="Bed wide, mm" style="width:72px"><span style="margin:0 4px">x</span><input class="mm" id="bedD" type="number" inputmode="decimal" min="80" max="1000" value="' + S.bed[1] + '" aria-label="Bed deep, mm" style="width:72px"><span style="margin-left:4px">mm</span></div><button type="button" class="btn" data-act="measureBed" style="width:100%;padding:8px;margin:-2px 0 8px">Measure bed with my phone</button>' +
      (S.prq ? '' : '<div class="row">' + seg('brand', CZ.BRANDS, brand) + '</div>') + '<div class="grid g2" id="prGrid">' + printerGrid(brand) + '</div><p class="note">' + esc(cur[0] === 'custom' ? 'Your printer' : cur[1]) + ': ' + S.bed[0] + ' x ' + S.bed[1] + ' mm bed. No printer? Print services and libraries take the same files.</p>';
  }
  if (t === 'strong') {
    if (S.material === 'wood') return '<p class="note" style="margin-top:0">Wood is cut, not printed, so there is no print time. Pick a plastic in Material to see it.</p>';
    const e = estimate();
    return '<div class="row"><b>Walls</b>' + seg('walls', [['normal', '2.4 mm'], ['tough', '3.2 mm']], S.wallT ? '' : S.walls) + '<input class="num mm" id="wallT" type="number" inputmode="decimal" step="0.1" min="2" max="5" value="' + R.T + '" aria-label="Wall thickness in mm"><span class="u">mm</span></div>' +
      '<div class="row"><b>Clearance</b>' + seg('tol', [['0.1', '0.1'], ['0.2', '0.2'], ['0.3', '0.3 mm'], ['c', 'Custom']], S.tolC ? 'c' : String(tolOf())) + (S.tolC ? '<input class="num mm" id="tolIn" type="number" inputmode="decimal" step="0.05" min="0.05" max="0.6" value="' + tolOf() + '" aria-label="Clearance in mm"><span class="u">mm</span>' : '') + '</div>' +
      '<p class="note" style="margin:-2px 0 8px">Clearance is the room around every opening, magnet pocket, the deck and the split seams. 0.2 mm is the standard fit. Parts too tight on your printer? Go up. Rattling? Go down.</p><div class="row"><b>Finish</b>' + seg('layer', [['draft', 'Fast'], ['normal', 'Normal'], ['fine', 'Smooth']], S.layer) + '</div>' +
      '<div class="est"><b>About ' + hm(e.sec) + '</b><span>' + Math.round(e.grams) + ' g of ' + S.material.toUpperCase() + ', about $' + (e.grams * 0.02).toFixed(2) + ' at $20 a kilo. ' + e.pieces + ' piece' + (e.pieces > 1 ? 's' : '') + '.</span></div>' +
      '<p class="note">Set your slicer to <b>' + LAYER[S.layer] + ' mm layers, 4 walls, 15 percent infill</b>. Its time is the real one, this is within about a third.</p>' +
      '<p class="note"><b>Hollow or solid?</b> A case is already a hollow shell. Its walls are ' + R.T + ' mm thin, so 4 walls in the slicer print them as solid plastic and infill changes almost nothing. To make it tougher, pick Thick: the sides and floor get thicker (the outside grows ' + (2 * (3.2 - 2.4)).toFixed(1) + ' mm), the deck stays the same so your buttons still reach. Fast shows the layer lines, Smooth takes about twice as long.</p>' +
      '<details class="fold"><summary>What do those slicer words mean?</summary><div class="list" style="margin-top:6px"><div class="it"><b>Layer height</b>How thick each layer of plastic is. Thinner looks smoother and takes longer.</div><div class="it"><b>Walls</b>How many outlines go around each piece. This is where the strength comes from.</div><div class="it"><b>Infill</b>How full the inside is. A case is mostly walls, so 15 percent is plenty.</div><div class="it"><b>Supports</b>Throwaway scaffolding under overhangs. The case is drawn to print without any.</div><div class="it"><b>Brim</b>A thin skirt that keeps corners from lifting. Turn it on only if yours lift.</div></div><p class="note" style="margin-top:6px">In your slicer pick the standard profile for your printer and your filament. That sets the heat for you.</p></details>';
  }
  if (t === 'mat') { const m = CZ.MATERIALS.find((x) => x[0] === S.material); return '<div class="grid g4">' + CZ.MATERIALS.map((x) => '<button type="button" class="pick" data-mat="' + x[0] + '" aria-pressed="' + (S.material === x[0]) + '">' + esc(x[1]) + '</button>').join('') + '</div><p class="note">' + esc(m[2]) + ' How the pieces join is in Design, Shape.</p>'; }
  if (t === 'split') {
    const hs = halves(), pl = hs.map((x) => plan(x.built)), n = pl.reduce((s, p) => s + p.regs.length, 0), bad = pl.some((p) => !p.fit);
    return '<div class="row"><b>Seams go</b>' + seg('sdir', [['auto', 'Auto'], ['v', '|'], ['h', '&mdash;'], ['both', '+'], ['d', '/']], S.sdir) + '</div><div class="row"><b>How many</b>' + seg('sn', [['auto', 'Auto'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']], S.sn) + '</div><div class="row"><b>Edges</b>' + seg('tab3', [['dovetail', 'Puzzle tabs'], ['flat', 'Flat + glue']], S.tab3) + '</div>' +
      '<p class="note">' + (bad ? '<span class="bad">Some pieces are still bigger than your ' + S.bed[0] + ' x ' + S.bed[1] + ' mm bed. Add a seam.</span>' : '<span class="ok">' + n + ' pieces, all fit your bed.</span>') + ' One seam in the middle = 2 even pieces. Two seams = 3. Puzzle tabs lock, a drop of glue keeps them.</p>';
  }
  if (t === '3d') return '<div class="row"><b>View</b>' + seg('bedv', [['asm', 'Assembled'], ['bed', 'Print Bed']], S.bedv === 'bed' ? 'bed' : 'asm') + '</div>' + piecesHtml() + '<p class="h">Spin it with one finger, pinch to zoom</p><div class="grid g2">' + (isClam() ? '<button class="btn" data-act="open">' + (S.open ? 'Close the lid' : 'Open the lid') + '</button>' : '') + '<button class="btn dark" data-act="share">Copy Build Link</button></div><button class="btn" data-act="keepbox" style="margin-top:8px;width:100%">Keep Box, Swap Insides</button><div id="shareOut"></div><p class="note">' + summaryLine() + ' <b>' + money(cost().total) + ' to build.</b></p>';
  if (t === 'shop') return shopHtml();
  if (t === 'pcb') return pcbHtml();
  if (t === 'files') { const probs = allProblems(); return PRINT_SVC + (S.material === 'wood' ? '' : '<div class="row"><b>File type</b>' + seg('fmt', [['stl', 'STL'], ['3mf', '3MF']], fmtOf()) + '</div>') + (S.material === 'wood' ? '' : '<div class="row"><b>Print</b>' + seg('xmode', [['solid', 'Full Solid'], ['skel', 'Skeleton Test (~20 min)']], skelMode() ? 'skel' : 'solid') + '</div>' + (skelMode() ? (() => { let e = null; try { e = estimate(); } catch (er) {} return '<p class="note" style="margin:0 0 6px">' + (e ? '<b>About ' + hm(e.sec) + ', ' + Math.round(e.grams) + ' g.</b> ' : '') + 'A 0.6 mm frame, fast as toothpicks: a 3 mm border, a 3 mm rim round every opening and screw hole, solid bands along the puzzle seams, 1.6 mm ribs 40 mm apart, and a ruler notch every 10 mm on the front edge. Print it, lay it on your parts and your box, then adjust below.</p>'; })() : '')) + '<div class="grid g2"><button class="btn red" data-act="make"' + (probs.length || !S.items.length ? ' aria-disabled="true"' : '') + '>' + (skelMode() ? 'Make the test frame' : 'Make my files') + '</button>' + (S.material === 'wood' || isPanel() ? '' : '<button class="btn" data-act="swatch">Download 15-min Fit Swatch</button>') + '</div>' + (gcodeOk() && printerRow()[5] === 'bambu' ? '<p class="note" style="margin:8px 0 0">Ready-to-print G-code is made for Marlin printers (Ender, Prusa MK, Anycubic...). For your ' + esc(printerRow()[1]) + ', open the STL in Bambu Studio, or pick another printer in 04 Print.</p>' : '') + (gcodeOk() && printerRow()[5] !== 'bambu' ? '<button class="btn dark" data-act="gcode" style="width:100%;margin-top:8px">G-code (' + esc(printerRow()[0] === 'custom' ? 'my printer' : printerRow()[1]) + ' / Marlin, PLA)</button>' + (gcodePieces() > 1 ? '<div class="chosen" style="margin:6px 0 0">' + Array.from({ length: gcodePieces() }, (_, i) => '<span data-gcp="' + i + '" style="cursor:pointer">Piece ' + (i + 1) + '</span>').join('') + '<span data-gcp="all" style="cursor:pointer;background:#1a1a1a;color:#fff">All pieces</span></div>' : '') + '<p class="note" style="margin:4px 0 0">Flat pieces need no slicer: this file goes straight on the SD card. 0.28 mm layers at 60 mm/s; the printer shows its time and progress. Marlin printers: Ender, Prusa MK, Anycubic and most others.</p>' : '') + (S.material === 'wood' ? '' : '<button class="btn" data-act="papersvg" style="width:100%;margin-top:8px">1:1 Paper Template (SVG)</button>' + adjustHtml()) + (S.material === 'wood' || isPanel() ? '' : '<p class="note" style="margin:6px 0 0">The swatch is a ' + swatchSize() + ' mm plate with ' + (isClam() && S.magnets ? 'a magnet pocket, ' : '') + 'the M3 bore, the snap pin slot and ' + esc(swatchButton().short) + ' opening, at your ' + tolOf() + ' mm clearance and ' + R.T + ' mm walls. Print it first: if they fit, the case will.</p>') + '<p class="note">' + (!S.items.length ? 'Add electronics in Brain first.' : probs.length ? '<span class="bad">Fix the electronics marked ! in Arrange first.</span>' : (S.material === 'wood' ? 'Wood: real size templates (SVG) to print at 100 percent or laser cut, plus the cut list.' : 'One file per piece, numbered, as STL or 3MF. Print the deck face down, the tray open side up.')) + '</p><div class="files" id="fileList" style="margin-top:8px"></div>' + (S.items.length ? GUIDE_BTN : '') + (S.material === 'wood' ? '' : sliceGuide() + faqHtml()); } /* make, then the files, then how to slice them */
  if (t === 'wire') return wireHtml();
  if (t === 'map') return simRow() + '<p class="note keep" style="margin:0 0 6px"><b style="color:#c8412f">Red</b> = power, <b>black</b> = ground, <b style="color:#2f6fdb">blue</b> / <b style="color:#c9a200">yellow</b> / <b style="color:#2f9a5b">green</b> = signals. Every wire from every part to its pin on the brain, the same plan as the step-by-step cards and ' + CFILE() + '.</p>' + pfHtml() + (mapWhy() ? '<p class="note bad">' + esc(mapWhy()) + '</p>' : '');
  if (t === 'test' && playSim()) return simKind() ? simPane() : tryPane();
  if (t === 'test') return behHtml() + simRow() + '<div id="bswap">' + bswapHtml() + '</div><p class="note keep" style="margin:0 0 6px">' + ({ macro: 'Your macro pad: each button sends a shortcut. Press them to see what the computer gets.', midi: 'Your MIDI controller: each button sends a note in the ' + SCN[TW().scale] + ' scale, each knob a MIDI CC. Any music app on the computer plays it.', sound: 'Your soundboard: each button plays its own jingle on the speaker.', timer: 'Your desk timer: press the button to start or pause, hold it 1 s to reset, turn the wheel to set the minutes. It beeps at 00:00.', synth: 'Your synth: hold a button to play its note. Knob 1 moves the pitch, knob 2 the tempo of the arpeggio.', sampler: 'Your sampler: tap a pad to hear it. Mode switches Chopper, Drum and Ambient; Bank moves the notes up. Turn the Pitch and Effect wheels and move the stick while a pad rings.' }[recipeFn()] || 'Press the buttons, drag the knobs and sliders, wave at the motion sensor.') + '</p>' + pfHtml() + (mapWhy() ? '<p class="note bad">' + esc(mapWhy()) + '</p>' : '') + '<div class="list" id="tlog" style="font:600 12px/1.35 ui-monospace,Menlo,monospace">' + TEST.log.map((l) => '<div class="it" style="padding:5px 8px">' + esc(l) + '</div>').join('') + '</div><button class="btn" data-act="treset" style="margin-top:8px;padding:8px">Start the test again</button>';
  if (t === 'extras') return partsRoomHtml();
  return '';
}
function summaryLine() { const d = geom(); if (isPanel()) return 'Panel, ' + d.W + ' x ' + d.D + ' x ' + S.pt + ' mm. ' + S.items.length + ' electronics.'; return esc(styleRow()[1]) + ', ' + d.W.toFixed(0) + ' x ' + d.D.toFixed(0) + ' x ' + d.closed + ' mm closed. ' + S.items.length + ' electronics.'; }
const WIRES = { arducam: 8, pir: 3, vl53: 4, esp32cam: 0, tact12: 2, button16: 2, arcade24: 2, arcade30: 2, dpad: 5, pot: 3, encoder: 5, thumb: 5, stick: 5, slider: 3, led5: 2, ring12: 3, speaker28: 2, servo: 3, tft28: 9, round128: 8, oled096: 4, cyd: 0, hdmi5: 0, hdmi7: 0, lipo1200: 0, lipo500: 0, liposhim: 0, tp4056: 4, rocker: 2 };
// ---------- Wire it: one wire at a time, no breadboard ----------
// A wire goes from a part to a pin, the pin has a job, and you test it before the next one. Three ways to join: push-on wires, solder, or the board.
const PIN_OF = {}; PICO_LEFT.forEach((n, i) => { if (PIN_OF[n] == null) PIN_OF[n] = i + 1; }); PICO_RIGHT.forEach((n, j) => { if (PIN_OF[n] == null) PIN_OF[n] = 40 - j; });
const GND_PINS = [3, 8, 13, 18, 23, 28, 38];
const pinWhere = (n) => { const B = BRDX(), L = B.left.length, nl = headerPins(B).nl; return n <= L ? 'left side, pin ' + n + ' counting down from the USB plug' : 'right side, pin ' + (nl + 1 - n) + ' counting down from the USB plug'; };
function picoSvg(pin) { // the Pico seen from above, USB plug at the top, one pin lit
  let h = '<svg viewBox="0 0 64 150" style="float:right;width:74px;margin:0 0 4px 8px" aria-hidden="true"><rect x="14" y="8" width="36" height="136" rx="3" fill="#2f7d55"/><rect x="24" y="2" width="16" height="12" rx="2" fill="#b9b9b9"/><text x="32" y="26" text-anchor="middle" font-size="6" font-weight="800" fill="#fff" font-family="sans-serif">USB</text>';
  for (let i = 0; i < 20; i++) { const y = 14 + i * 6.6, l = i + 1, r = 40 - i; h += '<circle cx="17.5" cy="' + y + '" r="' + (pin === l ? 4.2 : 1.9) + '" fill="' + (pin === l ? '#c8412f' : '#f0cf6b') + '"/><circle cx="46.5" cy="' + y + '" r="' + (pin === r ? 4.2 : 1.9) + '" fill="' + (pin === r ? '#c8412f' : '#f0cf6b') + '"/>'; }
  if (pin) { const left = pin <= 20, y = 14 + (left ? pin - 1 : 40 - pin) * 6.6; h += '<text x="' + (left ? 10 : 54) + '" y="' + (y + 2.6) + '" text-anchor="' + (left ? 'end' : 'start') + '" font-size="8" font-weight="900" fill="#c8412f" font-family="sans-serif">' + pin + '</text>'; }
  return h + '</svg>';
}
const TESTS = { button: 'Press it. The small light on the Pico turns on while you hold it', knob: 'Turn or slide it. The small light on the Pico blinks as it moves', wheel: 'Turn it and press it. The small light on the Pico blinks', stick: 'Push it around. The small light on the Pico blinks', led: 'Press any button. This light switches on and off', ring: 'Press any button. The ring lights up', sound: 'Press any button. It beeps', servo: 'Press a button or turn a knob. The arm moves', screen: 'It shows NOCIV and the word Ready' };
function wirePlan() {
  const bi = brainInfo(); if (!BRD()) return { why: 'The wire by wire guide does not know the pins of the ' + bi.name + ' yet. It knows the Pico, Elegoo / Arduino Uno, Arduino Nano, Pro Micro, ESP32-C3 SuperMini, ESP32 DevKit, the Cheap Yellow Display and the Raspberry Pi.' };
  const w = wiring(); if (!w.rows.length) return { why: 'Add buttons, knobs, screens or lights in Parts, Electronics first. Each one gets its wires here.' };
  if (w.problems.length) return { why: 'Fix this in Brain, Wire it, Wiring first: ' + w.problems[0] };
  const rows = w.rows.slice().sort((a, b) => ((b.N.spi || b.N.i2c) ? 1 : 0) - ((a.N.spi || a.N.i2c) ? 1 : 0)); /* screens first: the screen is how you see the rest work */
  const parts = rows.map((row) => ({ row, pads: padsFor(row) }));
  // power and ground: one pin can take one push-on wire. More wires than pins means a hub (a lever connector) per pin.
  const want = { GND: 0, '3V3': 0, VBUS: 0 }; parts.forEach((p) => p.pads.forEach(([, net]) => { if (want[net] != null) want[net]++; }));
  // direct pins first; only the overflow goes through a hub. A hub has 5 holes: 1 in, 4 out. A net with one pin (3.3 V) chains a second hub off the first.
  const hubs = [], share = {}; ['GND', '3V3', 'VBUS'].forEach((net) => {
    const HP = headerPins(BRDX()), pins = net === 'GND' ? HP.gnd : [HP.P[netName(net)]].filter(Boolean); if (!pins.length || want[net] <= pins.length) return;
    let n; if (pins.length > 1) n = Math.min(pins.length, Math.ceil((want[net] - pins.length) / 3)); else { n = 1; while (4 * n - (n - 1) < want[net]) n++; }
    const sh = share[net] = { hubs: [], direct: pins.length > 1 ? pins.slice(n) : [] };
    for (let i = 0; i < n; i++) { const hb = { net, name: (net === 'GND' ? 'ground' : net === 'VBUS' ? '5 V' : '3.3 V') + ' hub ' + String.fromCharCode(65 + i), left: 4, pin: pins.length > 1 ? pins[i] : i === 0 ? pins[0] : null, from: pins.length === 1 && i > 0 ? sh.hubs[i - 1] : null }; if (hb.from) hb.from.left--; hubs.push(hb); sh.hubs.push(hb); }
  });
  let g = 0; const steps = [{ k: 'code', kind: 'code' }];
  hubs.forEach((h) => steps.push({ k: 'hub:' + h.name, kind: 'hub', hub: h, pin: h.pin }));
  parts.forEach(({ row, pads }) => {
    const title = row.it.label, it = S.items.find((i) => String(i.id) === String(row.it.key)), P = it && PP(it);
    pads.forEach(([label, net], m) => {
      const st = { k: row.it.key + ':' + m, kind: 'wire', title, label, net, link: P ? P.link : 'pins' };
      if (share[net] && share[net].direct.length) st.pin = share[net].direct.shift();
      else if (share[net]) { const hb = share[net].hubs.find((x) => x.left > 0) || share[net].hubs[0]; hb.left--; st.hub = hb; }
      else { const HP = headerPins(BRDX()); st.pin = net === 'GND' ? HP.gnd[g++ % HP.gnd.length] : HP.P[netName(net)] || HP.P[net]; }
      steps.push(st);
    });
    steps.push({ k: row.it.key + ':test', kind: 'test', title, what: row.N.what, note: row.note });
  });
  return { steps, hubs, rows };
}
function wireHtml() {
  const join = S.how || 'push', pl = wirePlan();
  let h = '<div class="selbar"><b>Join with</b>' + [['push', 'Push-on wires'], ['solder', 'Solder'], ['board', 'The board']].map((m) => '<button data-how="' + m[0] + '"' + (join === m[0] ? ' style="background:#1a1a1a;color:#fff"' : '') + '>' + m[1] + '</button>').join('') + '</div>';
  if (pl.why) return h + '<p class="note"><span class="bad">' + esc(pl.why) + '</span></p>';
  if (join === 'board') return h + '<p class="note" style="margin-top:0">One flat board with the Pico on it and named holes under every part. The files are in Brain, Board. Solder the Pico on once, then each part\'s wires go straight down into the holes with its name. The pin for each hole is already connected.</p><button class="btn dark" data-act="toBoard" style="width:100%">Open the board</button>';
  const done = S.wired || {}, steps = pl.steps, nd = steps.filter((x) => done[x.k]).length, cur = steps.find((x) => !done[x.k]);
  const jumpers = steps.filter((x) => x.kind === 'wire' || x.kind === 'hub').length;
  h += join === 'push'
    ? '<p class="note" style="margin-top:0"><b>No solder, no breadboard.</b> You need ' + (BRDX() === BOARDS.pico ? 'a Pico with its pins already on (Pico H or WH)' : (/^[AEIOU]/.test(bshort()) ? 'an ' : 'a ') + bshort() + ' with its header pins already on') + ' and about ' + jumpers + ' push-on jumper wires (female to female). One end pushes onto the part, the other onto a ' + (BRDX() === BOARDS.pico ? 'Pico' : 'board') + ' pin.' + (pl.hubs.length ? ' Also ' + pl.hubs.length + ' lever connector' + (pl.hubs.length > 1 ? 's' : '') + ' with 5 holes (the Wago 221 kind): they join wires with a flip of a lever.' : '') + '</p>'
    : '<p class="note" style="margin-top:0"><b>Solder.</b> One wire at a time: solder one end to the part, the other to the ' + (BRDX() === BOARDS.pico ? 'Pico' : 'board') + ' pin shown. About ' + jumpers + ' wires. Test each part before the next one.</p>';
  h += '<div class="prog"><i style="width:' + Math.round(nd / steps.length * 100) + '%"></i><b>' + nd + ' of ' + steps.length + '</b></div>';
  const tick = (k, on) => '<button data-wired="' + esc(k) + '" style="all:unset;cursor:pointer;float:right;padding:6px 9px;border:1.5px solid #1a1a1a;border-radius:9px;font:800 11.5px/1 var(--sys);margin-left:6px;' + (on ? 'background:#1a1a1a;color:#fff' : '') + '">' + (on ? 'Done' : 'Tick when done') + '</button>';
  const pinTxt = (p) => BRDX().name.replace(/Raspberry Pi /, '').replace(/ \(.*\)/, '') + ' pin ' + p + ' (' + pinWhere(p) + ')';
  const card = (x, solo) => { // solo: the one you are on, shown big with the pin picture. In the full list, a short line each.
    const on = !!done[x.k], full = solo || !on, btn = solo ? '' : tick(x.k, on), end = solo ? '<button class="btn red" data-wired="' + esc(x.k) + '" style="width:100%;margin-top:10px;clear:both">Done. Next one</button>' : '';
    if (x.kind === 'code') return '<div class="it">' + btn + '<b>' + (BRDX().cp || BRDX().ino ? 'First: put the test code on the ' + bshort() + '</b>' + (!full ? '' : 'Save ' + CFILE() + ', plug the ' + bshort() + ' into a computer with its USB cable, and follow the 3 steps at the top of the file. You do this once. After that every part can be tested the moment its wires are on, powered by any USB charger.<br><button class="btn dark" data-act="savecode" style="margin-top:6px">Save ' + CFILE() + '</button>') : 'First: the pin list for your code</b>' + (!full ? '' : 'The ' + bshort() + ' does not run CircuitPython, so there is no test code to load. Save the pin list and write your code ' + (BRDX().pi ? 'in Python on the Pi (gpiozero)' : 'in the Arduino IDE') + ' with these pins.<br><button class="btn dark" data-act="savecode" style="margin-top:6px">Save the pin list</button>')) + end + '</div>';
    if (x.kind === 'hub') return '<div class="it">' + btn + (solo && x.pin ? picoSvg(x.pin) : '') + '<b>' + esc(x.hub.name[0].toUpperCase() + x.hub.name.slice(1)) + '</b>' + (!full ? '' : !x.pin ? 'One wire from ' + esc(x.hub.from.name) + ' into a second 5-hole lever connector. Strip 1 cm on both ends.' : (join === 'push' ? 'One wire from ' + pinTxt(x.pin) + ' into a 5-hole lever connector. Cut off the plug on that end, strip 1 cm, lift the lever, push the wire in, close it. The other 4 holes are for your electronics.' : 'One wire from ' + pinTxt(x.pin) + '. Up to 4 parts join onto this wire.')) + end + '</div>';
    if (x.kind === 'test') return '<div class="it">' + btn + '<b>Test ' + esc(x.title) + '</b>' + (!full ? '' : esc(TESTS[x.what] || 'Check it does its job') + '. Nothing? Check its wires again, one by one.' + (x.note ? '<small>' + esc(x.note) + '</small>' : '')) + end + '</div>';
    const to = x.hub ? x.hub.name + ' (any free hole)' : pinTxt(x.pin) + (x.net !== 'GND' && x.net !== 'VBUS' && x.net !== '3V3' ? ', named ' + x.net : x.net === 'GND' ? ', a ground pin' : x.net === 'VBUS' ? ', 5 volts (' + BRDX().v5 + ')' : ', 3.3 volts (' + BRDX().v3 + ')');
    const bare = x.link === 'solder' && join === 'push' ? '<small>This part has bare legs. No-solder ways: buy it with wires already on, use push-on spade plugs, or clamp its leg and a wire together in a lever connector.</small>' : '';
    return '<div class="it">' + btn + (solo && !x.hub ? picoSvg(x.pin) : '') + '<b>' + esc(x.title) + ': ' + esc(x.label) + '</b>' + (!full ? '' : 'From the ' + esc(x.label) + ' pin on the part to ' + esc(to) + '.' + bare) + end + '</div>';
  };
  h += '<div class="list" style="margin-top:8px">' + (cur ? card(cur, true) : '<div class="it"><b>All wired and tested.</b>Close it up.</div>') + '</div>';
  h += '<details class="fold"><summary>All ' + steps.length + ' steps</summary><div class="list">' + steps.map((x) => card(x, false)).join('') + '</div></details>';
  if (nd) h += '<button class="btn" data-act="unwire" style="margin-top:8px">Start the ticks over</button>';
  return h + '<button class="btn" data-act="toWiring" style="margin-top:8px">Change which pin a part uses</button>';
}
$('pane').addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'prSearch') { S.prq = t.value; const gr = $('prGrid'); if (gr) gr.innerHTML = printerGrid(S.brand || printerRow()[5]); save(); return; } /* the list follows each letter, the box keeps the keyboard */
  if (t.id === 'pw' || t.id === 'pd') { const v = parseFloat(t.value); if (v >= 30 && v <= 600) { S[t.id] = Math.round(v * 2) / 2; save(); draw(); } return; }
  if (t.id === 'lgText') { LG().text = t.value; markCache = {}; save(); if (WALLF[logoFace()]) render(); else draw(); }
  if (t.dataset.lbl) { S.look.labels.text[t.dataset.lbl] = t.value; markCache = {}; save(); draw(); }
  if (t.id === 'c1') { S.look.c1 = t.value; save(); if (T3) T3.key = ''; draw(); }
  if (t.id === 'c2') { S.look.c2 = t.value; save(); if (T3) T3.key = ''; draw(); }
});
$('pane').addEventListener('change', (e) => {
  if (e.target.dataset && e.target.dataset.swapto) { swapType(S.items.find((i) => i.id === +e.target.dataset.swapto), e.target.value); return; }
  if (e.target.dataset && e.target.dataset.kidtype) { const k = S.items.find((i) => i.id === +e.target.dataset.kidtype); if (k) { snapU(); k.type = e.target.value; k.panel = CZ.PARTS[k.type].cat === 'brain' ? 'inside' : (boardOf(k) ? boardOf(k).panel : homePanel()); S.pins = {}; } save(); render(); return; }
  if (e.target.dataset && e.target.dataset.pin) { if (!S.pins) S.pins = {}; S.pins[e.target.dataset.pin] = +e.target.value; save(); render(); return; }
  if (e.target.id === 'pw' || e.target.id === 'pd') { reflow(); save(); render(); return; }
  if (S.lockBox && (e.target.id === 'mmw' || e.target.id === 'mmd')) { render(); return; }
  if (e.target.id === 'mmw' || e.target.id === 'mmd') { const w = e.target.id === 'mmw', v = parseFloat(e.target.value), m = 2 * (R.T + R.CLR + 1); /* a typed size: whole 20 mm squares, plus the odd millimetres */
    if (v > 0) { const q = Math.max(2, Math.min(24, Math.floor((v - m + 1e-6) / 20))); S[w ? 'cols' : 'rows'] = q; S[w ? 'xw' : 'xd'] = Math.max(0, Math.min(19.9, Math.round((v - m - q * 20) * 10) / 10)); reflow(); } save(); render(); return; }
  if (e.target.id === 'wallT') { const v = parseFloat(e.target.value); if (v > 0) { const t = Math.max(2, Math.min(5, Math.round(v * 10) / 10)); S.wallT = t === 2.4 || t === 3.2 ? null : t; if (!S.wallT) S.walls = t === 3.2 ? 'tough' : 'normal'; applyWalls(); reflow(); } save(); render(); return; }
  if (e.target.id === 'tolIn') { const v = parseFloat(e.target.value); if (v > 0) { S.tol = Math.max(0.05, Math.min(0.6, Math.round(v * 100) / 100)); applyWalls(); reflow(); } save(); render(); return; }
  if (e.target.id === 'adjPart') { S.adjSel = +e.target.value; save(); render(); return; }
  if (e.target.id === 'bedW' || e.target.id === 'bedD') { const v = parseFloat(e.target.value); if (v > 0) { S.printer = 'custom'; S.bed[e.target.id === 'bedW' ? 0 : 1] = Math.max(80, Math.min(1000, Math.round(v))); reflow(); } save(); render(); tag('Your bed: ' + S.bed[0] + ' x ' + S.bed[1] + ' mm'); return; }
  if (e.target.id === 'qrIn') { const f = e.target.files[0]; e.target.value = ''; if (f) scanPrinter(f); return; }
  if (e.target.id !== 'lgFile') return; const f = e.target.files[0]; if (!f) return;
  const im = new Image(); im.onload = () => { const c = document.createElement('canvas'), k = Math.min(1, 600 / Math.max(im.width, im.height)); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); const url = c.toDataURL('image/png'), f = logoFace(), li = new Image(); li.onload = () => { markCache = {}; render(); }; li.src = url; LOGOIMGS[f] = li; try { localStorage.setItem(KEY + ':logo:' + f, url); } catch (er) {} };
  im.src = URL.createObjectURL(f);
});
function after(t) {
  codeBox(PAGES[S.page].room === 'play'); playInd();
  if (t === 'parts') { const s = $('cat'); if (s) s.onchange = () => { S.cat = s.value; save(); render(); }; }
  $('sb').hidden = !(native3d() || BIG3D);
  const tv = $('tryv'), ps = playSim() && !BIG3D; if (tv) { tv.hidden = !ps; tv.style.paddingTop = ps ? '136px' : ''; if (ps) { tryWire(); tryStage(); } } $('v3').style.zIndex = play3d() ? '3' : ''; if (t !== 'test') djStop(); else if (playSim()) djSync(TRYS.dj); /* PLAY: one view, the locked top-down 3D case stays in the corner */
}

// ---------- taps ----------
$('pane').addEventListener('click', (e) => {
  const pa = e.target.closest('[data-pact]'); if (pa) { const [id, k] = pa.dataset.pact.split(':'), it = S.items.find((i) => i.id === +id); if (it) { it.action = k; testReset(); save(); render(); tag(label(it).split(' ')[0] + ' is now ' + ACTN(k) + ': Test It and ' + CFILE() + ' follow it.'); } return; }
  const cpb = e.target.closest('[data-cp]'); if (cpb) { cpFix(cpb.dataset.cp); return; }
  if (e.target.closest('[data-act=cpopen]')) { $('sheetIn').innerHTML = '<button class="x" id="sheetX" aria-label="Close">&times;</button><h2>Notes</h2>' + copilotFull(); $('sheet').hidden = false; return; }
  const bw = e.target.closest('[data-bswap]'); if (bw) { const [id, t] = bw.dataset.bswap.split(':'), it = S.items.find((i) => i.id === +id); if (it && t !== swapCur(it)) { testReset(); swapType(it, t); } return; }
  const sp = e.target.closest('[data-sim],[data-wired]'); if (sp) { if (sp.dataset.sim) simTap(sp.dataset.sim); else { S.tab[5] = curTab() === 'map' ? 'test' : 'map'; save(); render(); if (S.tab[5] === 'map') pfTag(); } return; }
  const b = e.target.closest('button, [data-sel], [data-psel], [data-delmine], [data-sub], [data-add], [data-nsel], [data-ins], [data-mpan], [data-gcp]'); if (!b) return; const d = b.dataset;
  if (d.gcp != null) { saveGcode(d.gcp === 'all' ? null : +d.gcp); return; }
  if (d.adj != null) { adjust(d.adj); return; }
  if (d.mpan != null) { mpanLoad(+d.mpan); tag(S.mpan.list[S.mpan.cur].name + ': ' + S.pw + ' x ' + S.pd + ' mm'); return; }
  if (d.ins != null) { swapTo(+d.ins); save(); render(); tag(swapList()[S.swap.cur].name + ': its parts'); return; }
  if (d.nsel != null) { S.nsel = +d.nsel; save(); render(); return; }
  if (d.xsel != null) { DECO = null; S.xsel = d.xsel || null; if (!S.xsel) S.xfrom = null; save(); render(); return; }
  if (d.manc != null) { const [u, v] = d.manc.split(',').map(Number), on = S.attachedParts.find((m) => m.partId === S.xsel && m.face === mnt().face && (m.anchors || [m.anchor]).some((q) => q.u === u && q.v === v)); if (on) { S.attachedParts = S.attachedParts.filter((m) => m !== on); save(); render(); } else attachAt({ u, v }); return; }
  if (d.panc != null) { const u = +d.panc, on = S.ports.find((p) => p.kind === S.xsel && p.face === pface() && p.anchor.u === u); if (on) { S.ports = S.ports.filter((p) => p !== on); save(); render(); } else portAttach({ u }); return; }
  if (d.prm != null) { S.ports = S.ports.filter((p) => p.id !== +d.prm); if (PSEL === +d.prm) PSEL = null; save(); render(); return; }
  if (d.act === 'swatch') { saveFile(fileOut(swatchFile())); return; }
  if (d.act === 'toopen') { S.xsel = null; S.xfrom = null; save(); openPage(PAGES.findIndex((p) => p.name === 'Shape')); return; }
  if (d.act === 'share') { shareLink(); return; }
  if (d.mrm != null) { S.attachedParts = S.attachedParts.filter((m) => m.id !== +d.mrm); save(); render(); return; }
  if (d.mtog != null) { const m = S.attachedParts.find((x) => x.id === +d.mtog); if (m) { m.mountType = m.mountType === 'screw' ? 'snap' : 'screw'; save(); render(); } return; }
  if (d.msave != null) { const i = S.attachedParts.findIndex((x) => x.id === +d.msave), m = S.attachedParts[i]; if (m) saveFile(fileOut(mountFile(m, i))); return; }
  if (d.xgo) { S.xsel = d.xgo; S.xfrom = d.xfrom || null; S.tab[5] = 'extras'; go(5); return; }
  if (d.xback) { S.xsel = null; S.xfrom = null; S.step = 2; S.tab[2] = 'shape'; save(); openPage(PAGES.findIndex((p) => p.name === 'Shape')); return; }
  if (d.cf != null) { const c = codeNow()[+d.cf]; if (c) saveFile({ name: c[0], blob: new Blob([c[1]], { type: 'text/plain' }) }); return; }
  if (d.act === 'undo1') { undo(); return; }
  if (d.beh) { S.beh = d.beh; actsFill(true); testReset(); save(); render(); tag((BEH.find((b) => b[0] === d.beh) || [0, 'Sampler'])[1] + ': Test It and the code follow it.'); return; }
  if (d.tw) { const [k, v] = d.tw.split(':'); TW()[k] = k === 'mac' ? v === '1' : k === 'min' ? +v : v; testReset(); save(); render(); return; }
  if (d.fn != null) { S.fn = d.fn || null; if (d.fn && d.fn !== 'print') S.cat = d.fn; save(); render(); return; }
  if (d.v3 != null) { BIG3D = d.v3 !== '0'; S.xray = d.v3 === '2'; save(); render(); return; }
  if (d.psel != null) { PSEL = +d.psel; sel = null; render(); return; }
  if (d.pf != null) { const p = S.ports.find((q) => q.id === PSEL); if (p) portMove(p, d.pf, 0); return; }
  if (d.pmv != null) { const p = S.ports.find((q) => q.id === PSEL); if (p) portMove(p, p.face, +d.pmv); return; }
  if (d.sub) { e.stopPropagation(); removePart(d.sub); render(); return; }
  if (d.add) { let it = null; d.add.split('+').forEach((k) => { it = addPart(k); }); const P = PP(it); const tip = $('partTip'); render(); if ($('partTip')) $('partTip').textContent = P.tip; void tip; return; }
  if (d.sel) { sel = +d.sel; HL = sel; PSEL = null; render(); return; }
  if (d.delmine) { delete S.mine[d.delmine]; S.items = S.items.filter((i) => i.type !== d.delmine); save(); render(); return; }
  if (d.style && S.lockBox) { tag('The box is kept. Unlock it below to pick another shape.'); return; }
  if (d.style) { S.picked = true; S.style = d.style; const z = SIZES[S.style]; S.cols = z[0]; S.rows = z[1]; S.xw = S.xd = 0; if (UPRIGHT[S.style]) S.snap = true; /* the front plate snaps on */ reflow(); if (allProblems().length) fitAll(); /* the new shape is too small for what is in it: grow it until everything fits */ save(); render(); return; }
  if (d.printer) { setPrinter(d.printer); QRMSG = ''; save(); render(); return; }
  if (d.mat) { S.material = d.mat; const m = CZ.MATERIALS.find((x) => x[0] === d.mat); if (m[3].indexOf(S.join) < 0) S.join = m[3][0]; if (S.join === 'dovetail') S.tab3 = 'dovetail'; save(); render(); return; }
  if (d.tex) { S.look.tex[S.look.texFace].kind = d.tex; save(); render(); return; }
  if (d.join) { S.join = d.join; S.tab3 = d.join === 'dovetail' ? 'dovetail' : 'flat'; save(); render(); return; }
  const act = d.act;
  if (act === 'next') { const i = ORDER.indexOf(S.step); if (i > -1 && i < ORDER.length - 1) go(ORDER[i + 1]); return; }
  if (act === 'savelist') { saveFile({ name: 'casezero-shopping.txt', blob: new Blob([partsText()], { type: 'text/plain' }) }); return; }
  if (d.have) { S.have[d.have] = !S.have[d.have]; save(); render(); return; }
  if (act === 'kidsreset') { const b0 = S.items.find((i) => i.id === sel); if (b0 && PP(b0) && PP(b0).board) { snapU(); S.items = S.items.filter((i) => i.of !== b0.id); makeKids(b0, PP(b0)); S.pins = {}; save(); render(); } return; }
  if (act === 'snap') { $('snapIn').click(); return; }
  if (d.xsave === 'char') { tag('Packing your character...'); setTimeout(() => { const C = charCache();
      Promise.all(C.parts.filter((q) => !q.show).map((q) => G.stl(G.trisOf(G.layerGeos(q.print || q.layers)), q.id).arrayBuffer().then((ab) => ({ name: 'character-' + q.id + (q.n > 1 ? '-print-' + q.n : '') + '.stl', data: new Uint8Array(ab) })))).then((list) => {
        const txt = ['NOCIV CASE ZERO CHARACTER', Math.round(C.tall) + ' mm tall. ' + NEWP.trim(), '', 'PRINT', 'Standard profile for your printer and filament, 0.2 mm layers, 3 walls, 15 percent infill, supports off.'].concat(C.parts.filter((q) => !q.show).map((q) => '  ' + q.name + (q.n > 1 ? ' (print ' + q.n + ')' : '') + ': ' + q.how), ['', 'BUY'], charBuyList(C.spec).map((x) => '  ' + x), ['', 'PUT IT TOGETHER', '1. Legs: screw a leg bar to each hip hole on the body with an M3 x 12. Screw a foot to the bottom of each leg with an M3 x 16 and a nut.', '2. Arms: the same at the shoulder holes, with a hand on the end of each arm.', '3. Push the neck tube into the hole on top of the body. A drop of glue keeps it.', C.turn ? '4. Slide the head gear over the neck. Put the thumb wheel on the tab behind it with the M3 x 20 screw and two nuts, loose enough to turn. Glue the head gear to the underside of the head plate.' : '4. Slide the neck ring over the neck.', '5. Slide the head plate over the neck, then press the head down onto the plate. Glue the plate into the head once any screen is in.', '6. Tighten the arm and leg screws until they hold a pose.', '']).join('\n');
        list.push({ name: 'START HERE.txt', text: txt }); saveFile({ name: 'casezero-character.zip', blob: new Blob([zipFiles(list)], { type: 'application/zip' }) }); tag('Saved casezero-character.zip'); }); }, 30); return; }
  if (d.xsave) { const f = addonFile(d.xsave); if (f && f.pending) f.pending.then((blob) => saveFile({ name: f.name, blob })); else if (f) saveFile(f); return; }
  if (act === 'start') { showStart(); return; }
  if (act === 'clearall') { if (Date.now() - CLEARARM < 4000) { backup(); snapU(); S.items = S.items.filter((i) => i.of != null || (PP(i) && PP(i).board)); /* a board you measured from a photo stays, with the parts on it */ sel = null; LAST = null; CLEARARM = 0; CLEARED = true; } else CLEARARM = Date.now(); save(); render(); return; }
  if (act === 'savemic') { const t = micMain(wiring(), summaryLine().replace(/<[^>]+>/g, ''), BRDX()); if (t) saveFile({ name: 'main.py', blob: new Blob([t], { type: 'text/x-python' }) }); return; }
  if (act === 'savecode') { const c = codeFor(wiring(), summaryLine(), recipeFn(), BRDX(), TW()); saveFile({ name: c.file || 'code.py', blob: new Blob([c.text], { type: 'text/plain' }) }); return; }
  if (act === 'repin') { S.pins = {}; save(); render(); return; }
  if (act === 'toWiring') { S.tab[0] = 'pins'; go(0); return; }
  if (act === 'toBoard') { S.tab[5] = 'pcb'; go(5); return; }
  if (act === 'unwire') { S.wired = {}; save(); render(); return; }
  if (act && act.indexOf('pwr_') === 0 && POWER_MODES[act.slice(4)]) { setPower(act.slice(4)); return; }
  if (act === 'deepen') { const n = zNeed(); snapU(); S.add = (S.add || 0) + n; if (S.lockBox) S.lockBox.H += n; save(); render(); tag('Base deepened ' + n + ' mm: the battery and the part above it both fit.'); return; }
  if (d.how) { S.how = d.how; save(); render(); return; }
  if (d.wired) { if (!S.wired) S.wired = {}; if (S.wired[d.wired]) delete S.wired[d.wired]; else S.wired[d.wired] = true; save(); const top = $('pane').scrollTop; render(); $('pane').scrollTop = top; return; }
  if (act === 'addNotch') { S.notches = S.notches || []; S.notches.push({ edge: 'bottom', shape: 'rrect', w: 20, d: 8, at: Math.round(dims().W / 2) }); S.nsel = S.notches.length - 1; reflow(); save(); render(); return; }
  if (act === 'delNotch') { S.notches.splice(S.nsel, 1); S.nsel = Math.max(0, S.nsel - 1); save(); render(); return; }
  if (act === 'papersvg') { paperSvg(); return; }
  if (act === 'gcode') { saveGcode(); return; }
  if (act === 'measureBed') { openMeasure(() => {}, { useLabel: 'Use it as my bed size', panels(list) { const p = list && list[0]; if (!p) return; S.printer = 'custom'; S.bed = [Math.round(p.w), Math.round(p.h)]; reflow(); save(); render(); tag('Your bed: ' + S.bed[0] + ' x ' + S.bed[1] + ' mm, measured'); } }); return; } /* the card on the bed, the green dots on the bed corners */
  if (act === 'measureLid') { openMeasure((P) => { S.pw = Math.round(P.w * 2) / 2; S.pd = Math.round(P.h * 2) / 2; reflow(); save(); render(); }, MEASURED); return; }
  if (act === 'nophoto') { PHOTO = null; try { localStorage.removeItem(KEY + ':photo'); } catch (er) {} render(); return; }
  if (act === 'toParts') { S.tab[0] = 'parts'; render(); return; }
  if (act === 'toBrain') { S.tab[0] = 'parts'; go(0); return; }
  if (act === 'measure') { openMeasure((P) => {
    const others = S.items.filter((i) => !(PP(i) && PP(i).cat === 'mine'));
    if (!others.length) { addBoard(P, false); return; }
    // a built board already carries its screen, buttons and brain: offer to build the case around it alone
    $('sheetIn').innerHTML = '<h2>Build around your board?</h2><p class="note" style="font-size:14px">Your board already has its screen, buttons and brain on it. You also have ' + others.length + ' electronics added by hand: ' + esc(others.map((i) => PP(i) ? PP(i).short : i.type).slice(0, 6).join(', ')) + (others.length > 6 ? '...' : '') + '.</p><div class="list" style="margin-top:10px"><button class="btn start" data-board="replace"><b>Just my board</b>Remove the ' + others.length + ' other electronics. Best when everything is soldered on the board.</button><button class="btn start" data-board="keep"><b>Keep them too</b>For parts that are not on the board, like a separate speaker.</button></div>';
    $('sheet').hidden = false;
    $('sheetIn').querySelectorAll('[data-board]').forEach((x) => { x.onclick = () => { $('sheet').hidden = true; addBoard(P, x.dataset.board === 'replace'); }; });
  }, MEASURED); return; }
  if (act === 'auto') { snapU(); const list = S.items.filter((i) => i.of == null); /* parts on your board stay where the photo put them */ list.forEach((i) => { i.x = -999; i.y = -999; }); list.sort((a, b) => (fp(b).w * fp(b).h) - (fp(a).w * fp(a).h)).forEach((i) => { autoPlace(i); if (PP(i) && PP(i).board) syncKids(i); }); save(); render(); return; }
  const s = S.items.find((i) => i.id === sel);
  if (act === 'rot' && s && s.of != null) { snapU(); const b = boardOf(s); s.dr = ((s.dr || 0) + 1) % 4; if (b) syncKids(b); save(); render(); return; }
  if (act === 'nudge' && s) { snapU(); const st2 = 0.5; s.x += (+d.nx) * st2; s.y += (+d.ny) * st2; if (s.of != null) unSync(s); if (PP(s) && PP(s).board) syncKids(s); save(); render(); return; }
  if (act === 'bmove' && s) { s.move = !s.move; save(); render(); return; }
  if (d.photo) { S.photo = d.photo; save(); render(); return; }
  if (d.pcb) { snapU(); S.pcb = d.pcb === '1'; LAST = null; save(); render(); return; }
  if (act === 'kbfit') { const X = xp(), d = dims(), wall = R.T + R.CLR + 1, iw = d.W - 2 * wall, ih = d.D - 2 * wall, c = Math.floor((iw - 2 * KB.M) / KB.P), r = Math.floor((ih - 2 * KB.M - KB.STRIP) / KB.P);
    if (c < 3 || r < 1) { tag('Your case is too small for a keyboard. It needs at least ' + Math.ceil(3 * KB.P + 2 * KB.M + 2 * wall) + ' x ' + Math.ceil(KB.P + 2 * KB.M + KB.STRIP + 2 * wall) + ' mm.'); return; }
    X.keys.c = Math.min(12, c); X.keys.r = Math.min(6, r); save(); render(); tag('Sized to your case: ' + X.keys.c + ' x ' + X.keys.r + ' keys'); return; }
  if (act === 'kbadd') { snapU(); const has = S.items.find((i) => i.type === 'kbd'); if (has) { S.items = S.items.filter((i) => i !== has); save(); render(); tag('Keyboard taken out of your case'); return; }
    addPart('kbd'); if (allProblems().length) fitAll(); save(); render(); tag(allProblems().length ? 'It is in, but something overlaps. Open Body, Arrange.' : 'In your case. See it in Body, Arrange.'); return; }
  if ((act === 'kbzip' || act === 'kbshow') && kb().s60) { /* a 60% board's keys sit on quarter steps, off the 2.54 mm board grid: it is hand-wired, so the zip holds the code and the wiring guide */
    const K = kb(), hb = { kb: K, cols: Array.from({ length: K.c }, (q, i) => KB_GP[i]), rows: Array.from({ length: K.r }, (q, i) => KB_GP[K.c + i]) };
    if (act === 'kbshow') { const el = document.querySelector('[data-kbsvg]'); if (el) el.innerHTML = '<p class="note keep">The 60% layout is hand-wired: its wide keys put switches between the 2.54 mm steps a board needs. One diode per key, 5 row wires and 14 column wires to the Pico. The zip has the guide and code.py.</p>'; return; }
    saveFile({ name: 'casezero-keyboard-60.zip', blob: new Blob([zipFiles([{ name: 'code.py', text: kbCode60(hb) }, { name: 'README.txt', text: ['NOCIV Case Zero keyboard, 60% (61 keys), hand-wired', '', 'WIRING', '1. Click the 61 switches into the printed plate.', '2. Each switch: a 1N4148 diode from one pin to its row wire, the stripe (cathode) toward the row. Same for every key.', '3. Rows (top row first): ' + hb.rows.map((g2) => 'GP' + g2).join(', ') + '.', '4. Columns (key position in its row, left to right): ' + hb.cols.map((g2) => 'GP' + g2).join(', ') + '. The other switch pin of each key goes to its column wire.', '5. Save code.py on the Pico. Fn is the key right of the right Alt.', '', 'Keys 2 keys wide and longer (Backspace, Enter, both Shifts, Space) rock a little without stabilizers.'].join('\n') }])], { type: 'application/zip' }) }); tag('Saved casezero-keyboard-60.zip'); return; }
  if (act === 'kbzip' || act === 'kbshow') { tag('Drawing the board...'); setTimeout(() => { const Bd = kbBoard(); if (!Bd.ok) { tag(Bd.errors[0] || 'The board could not be drawn.'); return; }
      if (act === 'kbshow') { const el = document.querySelector('[data-kbsvg]'); if (el) el.innerHTML = boardSvg(Bd) + '<p class="note" style="margin-top:4px">Gold lines are on the front, blue on the back. Checked: all ' + Bd.check.connected + ' pads joined, nothing closer than ' + Bd.check.minGap.toFixed(2) + ' mm.</p>'; tag('Board ' + Bd.box.w.toFixed(0) + ' x ' + Bd.box.h.toFixed(0) + ' mm'); return; }
      const nm = 'casezero-keyboard-' + Bd.kb.c + 'x' + Bd.kb.r; saveFile({ name: nm + '.zip', blob: new Blob([zipFiles(boardFiles(Bd, nm).concat([{ name: 'README.txt', text: kbReadme(Bd) }, { name: 'code.py', text: kbCode(Bd) }]))], { type: 'application/zip' }) }); tag('Saved ' + nm + '.zip'); }, 30); return; }
  if (act === 'saveboard') { const Bd = boardBuild(); if (Bd.ok) saveFile({ name: 'casezero-board.zip', blob: new Blob([zipFiles(boardFiles(Bd, 'casezero-board').concat(bomCpl(Bd), [{ name: 'README.txt', text: boardReadme(Bd) }]))], { type: 'application/zip' }) }); return; }
  if (act === 'rot' && s && PP(s) && PP(s).board) { snapU(); s.r = ((s.r || 0) + 1) % 4; syncKids(s); if (problems(s).length) { autoPlace(s); syncKids(s); } save(); render(); return; }
  if (act === 'rot' && s) { s.r = ((s.r || 0) + 1) % 4; if (problems(s).length) { const keep = [s.x, s.y]; if (!autoPlace(s)) { s.x = keep[0]; s.y = keep[1]; } } save(); render(); return; }
  if (act === 'shroudplace') { snapU(); const why = shroudPlace(); save(); render(); tag(why ? 'No room on the back wall: ' + why + '.' : shroudFace() === 'back' ? 'Shroud on the back wall: use the arrows to move it' : 'Shroud placed: drag it in Arrange, or use the arrows'); return; }
  if (act === 'shroudrm') { snapU(); shroudRemove(); save(); render(); tag('Shroud removed. Undo puts it back.'); return; }
  if (act === 'shnudge') { const o = shroudOn(); if (!o) return; snapU(); const nx = +d.nx * 2, ny = +d.ny * 2;
    if (o.kind) { o.anchor.du = (o.anchor.du || 0) + nx; o.anchor.dz = (o.anchor.dz || 0) + ny; if (portBlocked(o) === 'off the edge') { o.anchor.du -= nx; o.anchor.dz -= ny; tag('That is the edge of the wall'); } } else { o.x += nx; o.y += ny; }
    save(); render(); return; }
  if (act === 'allparts') { S.pro = true; save(); render(); return; }
  if (act === 'camlook') { snapU(); const a = quickMount('lens', ['plate', 'lid', 'bottom']), g = quickMount('grip', ['right', 'left', 'bottom']); save(); render(); flash(a && g ? 'Lens ring + Grip added \u2713' : 'Not all of it fit: ' + (a ? '' : 'lens ring ') + (g ? '' : 'grip ') + 'has no free spot'); return; }
  if (act === 'dstandon') { const Q = xp().dstand; Q.on = !Q.on; save(); render(); tag(Q.on ? 'Mini desk stand added to your print files' : 'Desk stand taken out of the print files'); return; }
  if (act === 'ownkit') { const k = kitInfo(cost(true)); S.ownKit = !S.ownKit; if (!S.have) S.have = {}; if (k) k.cover.forEach((t) => { if (S.ownKit) S.have[t] = true; else delete S.have[t]; }); save(); render(); tag(S.ownKit ? 'Starter kit parts checked off' : 'Starter kit parts back on the list'); return; }
  if (act === 'insnew') { const L = swapList(); L.push({ name: 'Insert ' + (L.length + 1), items: [] }); swapTo(L.length - 1); save(); render(); tag(L[S.swap.cur].name + ': empty, add its parts'); return; }
  if (act === 'keepbox') { keepBox(); return; }
  if (act === 'unlockbox') { S.lockBox = null; save(); render(); tag('The box size is free again'); return; }
  if (act === 'treset') { testReset(); render(); return; }
  if (act === 'xray') { S.xray = !S.xray; BIG3D = false; save(); render(); return; }
  if ((act === 'mnt_top' || act === 'mnt_in') && s) { snapU(); if (act === 'mnt_in') { if (s.panel !== 'inside') { s.top0 = s.panel; s.panel = 'inside'; } } else if (s.panel === 'inside') { s.panel = s.top0 && panels().indexOf(s.top0) > -1 ? s.top0 : defaultPanel(Object.assign({}, PP(s), { inside: false })); } if (problems(s).length) autoPlace(s); save(); render(); return; }
  if (act && act.indexOf('pan_') === 0 && s) { const p = act.slice(4); if (panels().indexOf(p) > -1 && s.panel !== p) { snapU(); s.panel = p; autoPlace(s); S.tab[1] = p; save(); render(); } return; }
  if (act === 'swap' && s) { s.panel = s.panel === 'lid' ? 'base' : 'lid'; autoPlace(s); S.tab[1] = s.panel; save(); render(); return; }
  if (act === 'del' && s) { snapU(); S.items = S.items.filter((i) => i !== s && i.of !== s.id); sel = null; save(); render(); return; }
  
  if (act === 'open') { S.open = !S.open; save(); render(); return; }
  if (act === 'make') { if (b.getAttribute('aria-disabled') === 'true') return; makeFiles(); return; }
  if (d.f != null) { saveFile(fileOut(FILES[+d.f])); return; }
  if (act === 'faceed') { DECO = DECO && DECO.mode === 'char' ? null : { mode: 'char' }; render(); return; }
  if (act === 'facereset') { delete xp().ch.pos; save(); render(); return; }
  if (d.dadd) { if (Date.now() - SKIPC < 500) return; decoAdd(d.dadd); save(); render(); return; }
  if (d.dface) { S.dface = d.dface; if (DECO) DECO.sel = null; save(); render(); return; }
  if (d.dact) { const q = DECO && (S.deco || []).find((z) => z.id === DECO.sel); if (!q) return; snapU(); if (d.dact === 'rm') { S.deco = S.deco.filter((z) => z !== q); DECO.sel = null; } else if (d.dact === 'big') q.s = Math.min(3.2, (q.s || 1.4) + 0.3); else if (d.dact === 'small') q.s = Math.max(0.8, (q.s || 1.4) - 0.3); else if (d.dact === 'flip') q.f = q.f ? 0 : 1; else if (d.dact === 'turnl' || d.dact === 'turnr') q.a = (((q.a || 0) + (d.dact === 'turnl' ? -45 : 45)) % 360 + 360) % 360; else q.mt = d.dact; save(); render(); return; }
  if (d.mt) { const it = S.items.find((i) => i.id === sel); if (it) { snapU(); it.mt = d.mt; save(); render(); } return; }
  if (d.jump && JUMP[d.jump]) { const [st, tb] = JUMP[d.jump]; S.step = st; S.tab[st] = tb; go(st); return; }
  if (d.jump) { const pi = PAGES.findIndex((q) => q.name === d.jump); if (pi >= 0) openPage(pi); return; }
  if (act === 'guide') { printGuide(); return; }
  if (act === 'saveall') { if (!FILES || !FILES.length) { try { FILES = filesOf(); } catch (e) { FILES = null; } } if (!FILES || !FILES.length) { tag('Add a body first, then save the project.'); return; } tag('Packing your files...'); const pf = pfList();
    Promise.all(FILES.map(fileOut).map((f) => f.blob.arrayBuffer().then((ab) => ({ name: f.name, data: new Uint8Array(ab) })))).then((list) => {
      let code = null; try { const w = wiring(); if (w && w.rows && w.rows.length && !w.problems.length) code = codeFor(w, summaryLine(), recipeFn(), BRDX(), TW()).text; } catch (e) { code = null; }
      const wood = S.material === 'wood', start = ['NOCIV CASE ZERO: START HERE', summaryLine().replace(/<[^>]+>/g, ''), '', 'FROM FILES TO A FINISHED DEVICE', '',
        '1. PRINT', wood ? '   Print the .svg templates at 100 percent, tape them to the wood and cut them out.' : '   Print every .' + fmtOf() + ' file. In your slicer pick the standard profile for your printer and filament, then set', wood ? '' : '   ' + LAYER[S.layer] + ' mm layers, 4 walls, 15 percent infill, supports off. Print the deck face down and the tray open side up.', '',
        '2. BUY THE PARTS', '   casezero-parts.txt is the list. For prices and what to search for, open the builder: nociv.co/casezero/build, Brain, Shop.', '',
        '3. WIRE IT', '   In the builder: Brain, Wire it. It shows one wire at a time, with a test after each part. No breadboard.', '',
        '4. LOAD THE CODE', code ? '   ' + CFILE() + ' is in this zip. Its first lines tell you how to put it on the ' + bshort() + '.' : '   Your build has no starter code yet (no brain with parts wired to it). Add them in the builder and save again.', '',
        '5. CLOSE IT UP', '   Fit the electronics, screw the deck down. Done.', '', 'BUILD_GUIDE.html in this zip is your step-by-step guide: open it in a browser and print it, or save it as a PDF.', '', 'Your build is saved in the builder on the phone or computer you made it on.', ''].join('\n');
      list.push({ name: 'START HERE.txt', text: start }); try { list.push({ name: 'BUILD_GUIDE.html', text: guideHtml() }); } catch (e) {} if (code) list.push({ name: CFILE(), text: code });
      list.push({ name: 'shopping-list.txt', text: partsText() }); try { if (wiring().rows.length) list.push({ name: 'wiring.txt', text: wiringText() }); } catch (e) {}
      if (gcodeOk()) { try { gcodeFiles().out.forEach((q) => list.push({ name: q.name, text: q.text })); } catch (e) {} } /* flat builds: ready-to-print G-code too */ try { const mm = micMain(wiring(), summaryLine().replace(/<[^>]+>/g, ''), BRDX()); if (mm) list.push({ name: 'main.py', text: mm }); } catch (e) {} /* the mic recorder, MicroPython */
      saveFile({ name: 'casezero-build.zip', blob: new Blob([zipFiles(list)], { type: 'application/zip' }) }); tag(pf.length ? 'Saved casezero-build.zip. Warning: ' + pf[0] : 'Saved casezero-build.zip'); });
    return; }
  const st = b.closest('[data-st]');
  if (st && d.d) {
    const k = st.dataset.st, v = +d.d;
    if (S.lockBox && ['cols', 'rows', 'add', 'addL'].indexOf(k) > -1) { tag('The box is kept at its size. Unlock it in Shape to change it.'); return; }
    if (k === 'cols') S.cols = Math.max(2, Math.min(24, S.cols + v)); if (k === 'rows') S.rows = Math.max(2, Math.min(24, S.rows + v));
    if (k === 'add') S.add = Math.max(0, Math.min(80, S.add + v * 5)); if (k === 'addL') S.addL = Math.max(0, Math.min(40, (S.addL || 0) + v * 2));
    if (k === 'bedw') S.bed[0] = Math.max(80, Math.min(400, S.bed[0] + v * 10)); if (k === 'bedd') S.bed[1] = Math.max(80, Math.min(400, S.bed[1] + v * 10));
    if (k === 'lgsize') { const L = LG(); L.size = Math.max(6, Math.min(160, L.size + v * (L.size >= 20 ? 5 : 2))); markCache = {}; }
    if (k === 'lgx' || k === 'lgz') { const f = logoFace(), L = LG(f), m = wallMid(f); if (k === 'lgx') L.x = (L.x == null ? m[0] : L.x) + v * 2 * (f === 'back' || f === 'left' ? -1 : 1); else L.y = Math.max(R.F, (L.y == null ? m[1] : L.y) + v); }
    if (k === 'lbsize') { S.look.labels.size = Math.max(2.5, Math.min(10, S.look.labels.size + v * 0.5)); markCache = {}; }
    const nn = (S.notches || [])[S.nsel];
    if (k === 'plift') S.plift = Math.max(3, Math.min(60, S.plift + v));
    if (['kh', 'btop', 'bund'].includes(k)) snapU();
    { const si = S.items.find((i) => i.id === sel); if (si && k === 'riser') si.riser = Math.max(0, Math.min(20, (si.riser == null && !(PP(si) && PP(si).holes && PP(si).holes.length) ? 0 : riserOf(si)) + v)); /* a part on the floor starts its slate from 0 */ if (si && k === 'kh') si.h = Math.max(0, Math.min(60, kidH(si) + v * 0.5)); if (si && k === 'btop' && PP(si) && PP(si).board) setBoardTop(PP(si), (PP(si).top || 9) + v * 0.5); if (si && k === 'bund' && PP(si) && PP(si).board) { const B = PP(si); B.under = Math.max(0, Math.min(40, (B.under != null ? B.under : 8.5) + v * 0.5)); setBoardTop(B, B.top || 9); } }
    const X = xp(); if (k === 'xs_t') { X.stand.t = Math.max(6, Math.min(80, X.stand.t + v)); X.stand.auto = X.stand.t === caseThick(); /* back on the case's own size: it follows the case again */ } if (k === 'xf_h') X.feet.h = Math.max(2, Math.min(15, X.feet.h + v)); if (k === 'xo_h') X.standoff.h = Math.max(2, Math.min(40, X.standoff.h + v)); if (k === 'xc_d') X.clip.d = Math.max(2, Math.min(16, X.clip.d + v)); if (k === 'xh_l') X.handle.l = Math.max(50, Math.min(140, X.handle.l + v * 10)); if (k === 'xl_l') X.limbs.l = Math.max(25, Math.min(90, X.limbs.l + v * 5)); const cl = (o, f, lo, hi, st) => { o[f] = Math.max(lo, Math.min(hi, o[f] + v * st)); };
    if (k === 'xb_h') cl(X.body, 'h', 45, 100, 5); if (k === 'xds_w') cl(X.dstand, 'w', 25, 80, 5); if (k === 'xsh_w') cl(X.shroud, 'w', 20, 200, 5); if (k === 'xsh_h') cl(X.shroud, 'h', 20, 200, 5); if (k === 'xsh_d') cl(X.shroud, 'd', 6, 80, 2); if (k === 'xsh_c') cl(X.shroud, 'ct', 1, 8, 0.5); if (k === 'xln_d') cl(X.lens, 'd', 8, 80, 1); if (k === 'xgr_l') cl(X.grip, 'l', 40, 120, 5); if (k === 'xg_n') cl(X.gears, 'n', 18, 54, 9); if (k === 'xhi_l') cl(X.hinge, 'l', 15, 60, 5); if (k === 'xsp_n') cl(X.spring, 'n', 3, 12, 1); if (k === 'xcl_t') cl(X.clamp, 't', 10, 45, 5); if (k === 'xp_w') cl(X.panel, 'w', 30, 200, 10); if (k === 'xp_h') cl(X.panel, 'h', 30, 200, 10); if (k === 'xk_c') cl(X.keys, 'c', 3, 12, 1); if (k === 'xk_r') cl(X.keys, 'r', 1, 6, 1);
    if (nn && k === 'nw') nn.w = Math.max(4, Math.min(120, nn.w + v * 2)); if (nn && k === 'nd') nn.d = Math.max(2, Math.min(60, nn.d + v)); if (nn && k === 'nat') nn.at = Math.max(0, Math.min(nn.edge === 'left' || nn.edge === 'right' ? dims().D : dims().W, nn.at + v * 5));
    if (k === 'txsp') { const tx = S.look.tex[S.look.texFace]; tx.sp = Math.max(2, Math.min(30, tx.sp + v)); }
    if (k === 'cols' || k === 'rows') reflow();
    save(); render(); return;
  }
  const sg = b.closest('[data-sg]');
  if (sg && d.v != null) {
    const k = sg.dataset.sg, v = d.v, L = S.look; markCache = k.startsWith('lg_') || k.startsWith('lb_') ? {} : markCache;
    if (k === 'pt') { S.pt = +v; save(); render(); return; } if (k === 'prad') { S.prad = +v; save(); render(); return; } if (k === 'phold') { S.phold = v; reflow(); save(); render(); return; } if (k === 'plift') { if (v === '0') S.plift = 0; else { S.plift = S.plift || 12; S.pbase = v; } reflow(); save(); render(); return; }
    const nn = (S.notches || [])[S.nsel]; if (nn && k === 'n_edge') { if ((nn.edge === 'left' || nn.edge === 'right') !== (v === 'left' || v === 'right')) nn.at = Math.round((v === 'left' || v === 'right' ? dims().D : dims().W) / 2); nn.edge = v; reflow(); save(); render(); return; } if (nn && k === 'n_shape') { nn.shape = v; save(); render(); return; }
    if (k.indexOf('ch_') === 0) { const X = xp(), f = k.slice(3); X.ch[f] = (f === 'brows' || f === 'turn' || f === 'size' || f === 'bend' || f === 'servo') ? +v : v; const two = X.ch.head === 'cube' && X.ch.size >= 72; if (!two && f === 'eyes' && v === 'screen' && X.ch.mouth === 'screen') X.ch.mouth = 'line'; if (!two && f === 'mouth' && v === 'screen' && X.ch.eyes === 'screen') X.ch.eyes = 'oval'; if (!two && (f === 'size' || f === 'head') && X.ch.eyes === 'screen' && X.ch.mouth === 'screen') X.ch.mouth = 'line'; save(); render(); return; }
    if (k === 'fil') { S.fil = v; save(); render(); return; } if (k === 'pq') { S.pq = v; S.psOpen = true; save(); render(); return; }
    { const X = xp(); if (k.indexOf('xatt_') === 0) { const id = k.slice(5); X[id].box = v === 'box'; save(); render(); tag(v === 'box' ? 'For a box you already have: countersunk holes for #4 wood screws' : 'For your Case Zero'); return; } if (k === 'xkview') { X.keys.view = v; save(); render(); return; } if (k === 'xkf') { X.keys.f = +v; save(); render(); return; } if (k === 'xksp') { X.keys.sp = v === '1' ? 1 : 0; save(); render(); return; } if (k === 'xkp') { X.keys.preset = v === '60' ? '60' : 'custom'; KBC = null; save(); render(); return; } if (k === 'xs_a') { X.stand.a = +v; save(); render(); return; } if (k === 'xsh_f') { const was = !!shroudOn(); let why = ''; if (shroudFace() !== v) { snapU(); shroudRemove(); xp().shroud.face = v; why = was ? shroudPlace() : ''; } else xp().shroud.face = v; save(); render(); if (why) tag('No room on the back wall: ' + why + '. It is off until you move or resize it.'); return; } if (k === 'xds_m') { xp().dstand.m = v; save(); render(); return; } if (k === 'xds_a') { xp().dstand.a = +v; save(); render(); return; } if (k === 'xch_s' || k === 'xch_h') { X.charm[k === 'xch_s' ? 'size' : 'hook'] = v; if (k === 'xch_h') S.attachedParts.forEach((m) => { if (m.partId === 'charm' && m.charm) m.charm.hook = v; }); MPC = {}; save(); render(); return; } if (k === 'xf_hole') { X.feet.hole = v === '1'; save(); render(); return; } if (k === 'xo_s') { X.standoff.s = v; save(); render(); return; } }
    if (k === 'brand') { S.brand = v; save(); render(); return; }
    if (k === 'walls') { S.walls = v; S.wallT = null; applyWalls(); reflow(); save(); render(); return; }
    if (k === 'wpass') { S.wpass = v; save(); render(); return; }
    if (k === 'swapOn') { S.swap = Object.assign({ mount: 'screws', inserts: null, cur: 0 }, S.swap || {}, { on: v === '1' }); if (S.swap.on) swapList(); save(); render(); return; }
    if (k === 'bedv') { S.bedv = v; save(); render(); return; }
    if (k === 'plip') { const q = S.mpan.list[S.mpan.cur]; S.pw = v === 'cover' ? q.lip.w + 1 : q.w; S.pd = v === 'cover' ? q.lip.h + 1 : q.h; q.cover = v === 'cover'; reflow(); save(); render(); tag(v === 'cover' ? 'The panel covers the rim: ' + q.lip.w + ' x ' + q.lip.h + ' mm' : 'The panel drops into the opening'); return; }
    if (k === 'xmode') { S.xmode = v; FILES = []; save(); render(); tag(v === 'skel' ? 'Skeleton Test: a fast 1 mm frame to check the fit' : 'Full Solid: the real case'); return; }
    if (k === 'swapMount') { S.swap.mount = v; save(); render(); return; }
    if (k === 'tripodOn') { tripodBottom(v === '1'); save(); render(); return; }
    if (k === 'm_face' || k === 'm_type' || k === 'm_view' || k === 'm_pface') { mnt()[k.slice(2)] = v; save(); render(); return; }
    if (k === 'tol') { if (v === 'c') S.tolC = true; else { S.tolC = false; S.tol = +v; } applyWalls(); reflow(); save(); render(); return; }
    if (k === 'fmt') { S.fmt = v; save(); sg.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); $('fileList').querySelectorAll('[data-f]').forEach((x) => { const f = FILES[+x.dataset.f]; if (f) x.textContent = 'Save ' + f.label + fmtTag(f); }); return; }
    if (k === 'layer') { S.layer = v; save(); render(); return; }
    if (k === 'magnets') S.magnets = v === '1'; else if (k === 'snap') { S.snap = v === '1'; S.deckMag = v === 'mag'; } else if (k === 'hatch') S.hatch = v; else if (k === 'hpack') S.hpack = v || null; else if (k === 'spring') S.spring = v === '1';
    else if (k === 'lg_src') { const q = LG(); q.on = v !== 'off'; if (v !== 'off') q.src = v; } else if (k === 'lg_face') { L.logoAt = v; } else if (k === 'lg_how') LG().how = v;
    else if (k === 'lb_place') { L.labels.on = v !== 'off'; if (v !== 'off') L.labels.place = v; } else if (k === 'lb_how') L.labels.how = v;
    else if (k === 'tx_face') L.texFace = v; else if (k === 'tx_bump') L.tex[L.texFace].bump = v === '1';
    else if (k === 'cl_n') L.colors = +v; else if (k === 'cl_single') L.single = v;
    else S[k] = v;
    save(); render();
  }
});
$('snapIn').addEventListener('change', (e) => {
  const f = e.target.files[0]; if (!f) return; e.target.value = '';
  const im = new Image(); im.onload = () => { const c = document.createElement('canvas'), k = Math.min(1, 1100 / Math.max(im.width, im.height)); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); const url = c.toDataURL('image/jpeg', 0.78); PHOTO = new Image(); PHOTO.onload = () => { S.tab[0] = 'parts'; render(); }; PHOTO.src = url; try { localStorage.setItem(KEY + ':photo', url); } catch (er) {} URL.revokeObjectURL(im.src); };
  im.src = URL.createObjectURL(f);
});

// ---------- the picture ----------
const cv = $('view'), g = cv.getContext('2d'); decoWire(); deco3dWire();
let view = null; // current 2D mapping for taps
function fit() { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d)); }
// The 3D box: steps that show a flat picture also show the case in 3D in the top right corner. Tap it to make it big.
let BIG3D = false, miniTimer = 0;
const native3d = () => { const t = curTab(); if (t === 'extras') return !decoOn() || deco3d(); /* nothing picked yet: the case itself, live */ return xrayOn() || (S.step === 2 && !isPanel()) || (S.step === 5 && (t === '3d' || t === 'files')) || (S.step === 3 && (t === 'colors' || (t === 'logo' && !!WALLF[logoFace()]))); }; /* a side-wall logo is placed on the case in 3D */
const wantsMini = () => (play3d() || S.step === 0 || S.step === 1 || S.step === 3 || S.step === 4 || (S.step === 2 && isPanel())) && !$('con').classList.contains('down');
function draw() {
  { const sc = $('selc'); if (sc) sc.hidden = true; } /* drawBrain shows it again when the tray is up */
  const big = native3d() || BIG3D, mini = !big && wantsMini(), v3 = $('v3');
  v3.hidden = !(big || mini); v3.classList.toggle('mini', mini); cv.style.visibility = big ? 'hidden' : 'visible';
  { const rl = $('rlay'); if (rl) rl.hidden = !(mini && (PAGES[S.page] || {}).room === 'design' && !isPanel() && S.items.length > 0); }
  if (T3) T3.controls.enabled = big;
  if (big) { zmBar(); requestAnimationFrame(() => draw3d(false)); return; }
  if (mini && !drag) { clearTimeout(miniTimer); miniTimer = setTimeout(() => draw3d(true), 160); }
  if (!(S.step === 5 && curTab() === 'test') && cv.style.height) { cv.style.height = ''; $('stage').classList.remove('tscroll'); }
  TRAY = []; zmBar(); fit(); const W = cv.width, H = cv.height; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.fillStyle = '#e7e2d6'; g.fillRect(0, 0, W, H);
  if (decoOn()) return drawDeco(W, H);
  if (S.step === 0) return curTab() === 'pins' ? drawPinout(W, H) : drawBrain(W, H);
  if (S.step === 1) { const t = curTab(); return drawPanel(t === 'size' || t === 'psize' ? homePanel() : t, W, H); }
  if (S.step === 2) return drawPanel(homePanel(), W, H);
  if (S.step === 3) return drawFace(W, H);
  if (S.step === 4) return drawBeds(W, H);
  if (S.step === 5 && curTab() === 'map') return drawMap(W, H);
  if (playSim()) return;
  if (S.step === 5 && curTab() === 'test') return drawTest(W, H);
  if (curTab() === 'extras') return drawPrinted(W, H);
  drawBrain(W, H);
}
// the Parts room: the printed part you picked, big, drawn from the same shape that gets saved
function drawPrinted(W, H) {
  const d = px(), id = S.xsel, a = id && addonPolys(id);
  if (!a) { g.fillStyle = '#6f6a60'; g.font = '800 ' + 15 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; g.fillText('Printed parts', W / 2, H / 2 - 8 * d); g.font = '600 ' + 12 * d + 'px -apple-system,Arial'; g.fillText('Pick one below to see it here', W / 2, H / 2 + 12 * d); tag('Each one prints on its own'); return; }
  const sets = (a.sets || [a]).map((st) => { const polys = st.layers ? st.layers[0].polys : st.polys; return { polys, b: G.bbox(polys), n: st.n }; });
  const gap = 6, tw = sets.reduce((q, x) => q + x.b.w, 0) + gap * (sets.length - 1), th = Math.max(...sets.map((x) => x.b.h));
  const k = Math.min((W - 40 * d) / tw, (H - 110 * d) / th, 6 * d), x0 = (W - tw * k) / 2, yb = (H - 30 * d + th * k) / 2; let x = x0;
  sets.forEach((st) => { const path = new Path2D(); st.polys.forEach((pl) => { pl.forEach(([px0, py0], i) => { const X = x + (px0 - st.b.x0) * k, Y = yb - (py0 - st.b.y0) * k; if (i) path.lineTo(X, Y); else path.moveTo(X, Y); }); path.closePath(); });
    g.fillStyle = '#c8412f'; g.fill(path, 'evenodd'); g.strokeStyle = '#1a1a1a'; g.lineWidth = 2 * d; g.lineJoin = 'round'; g.stroke(path);
    if (st.n > 1) { g.fillStyle = '#1a1a1a'; g.font = '800 ' + 12 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; g.fillText('x' + st.n, x + st.b.w * k / 2, yb + 18 * d); }
    x += (st.b.w + gap) * k; });
  tag(xmeta(id)[0] + ': ' + XINFO[id]());
}
const px = () => Math.min(2, devicePixelRatio || 1);
const miniRoom = () => ($('v3').classList.contains('mini') && !$('v3').hidden ? 130 * px() : 0);
function frame(W, H, dW, dD) { // fit a flat picture, leaving room for the 3D box: beside it or under it, whichever is bigger
  const pad = 14 * px(), tagH = 46 * px(), rs = miniRoom(), aw = W - pad * 2, ah = H - pad * 2 - tagH;
  const kA = Math.min((aw - rs) / dW, ah / dD), kB = Math.min(aw / dW, (ah - rs) / dD);
  if (rs && kA > kB) return { k: kA, ox: pad + (aw - rs - dW * kA) / 2, oy: pad };
  return { k: kB, ox: (W - dW * kB) / 2, oy: pad + (rs && kB < Math.min(aw / dW, ah / dD) ? rs : 0) };
}
function flash(s) { clearTimeout(TAGT); TAGT = setTimeout(() => { TAGT = 0; $('tag').textContent = STAT; }, 3000); $('tag').textContent = s; } /* a toast that always shows, for 3 s */
function tag(s) { s = String(s || ''); if (!/^(Saved|Copied|Building|Drawing)|could not|Warning|cannot/i.test(s)) { if (!TAGT) $('tag').textContent = STAT; return; } clearTimeout(TAGT); TAGT = setTimeout(() => { TAGT = 0; $('tag').textContent = STAT; }, 3000); $('tag').textContent = s.replace(/&(amp|lt|gt|quot|#39);/g, (m, k) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" })[k]); } /* captions are plain text: names escaped for the page read right here */
let TRAY = [], TSEL = null; // where each tray picture sits, and the one that is picked
function drawBrain(W, H) {
  TRAY = [];
  const d = px();
  if (PHOTO && PHOTO.complete && PHOTO.naturalWidth) { const k = Math.min(W / PHOTO.naturalWidth, H / PHOTO.naturalHeight); g.drawImage(PHOTO, (W - PHOTO.naturalWidth * k) / 2, (H - PHOTO.naturalHeight * k) / 2, PHOTO.naturalWidth * k, PHOTO.naturalHeight * k); }
  // the parts you picked, side by side at real size: your parts tray
  const P = PARTS(), list = S.items.filter((i) => P[i.type]);
  if (!list.length) { if (!PHOTO) { g.fillStyle = '#6f6a60'; g.font = '800 ' + 15 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; g.fillText('Your electronics tray', W / 2, H / 2 - 8 * d); g.font = '600 ' + 12 * d + 'px -apple-system,Arial'; g.fillText('Snap your electronics or pick them from the list', W / 2, H / 2 + 12 * d); } tag(PHOTO ? 'Your photo. Now add each part you see.' : 'Start with the brain: the electronics that make it work'); return; }
  const pad = 10 * d, area = PHOTO ? { x: pad, y: H * 0.58, w: W - pad * 2, h: H * 0.42 - 44 * d } : { x: pad, y: pad, w: W - pad * 2 - miniRoom(), h: H - pad * 2 - 40 * d };
  if (PHOTO) { g.fillStyle = 'rgba(243,239,230,.92)'; g.fillRect(0, area.y - 6 * d, W, H - area.y + 6 * d); }
  // shelf pack at one shared scale so sizes compare
  let k = 3 * d; const capH = W / d < 700 ? 74 * d : 0; /* on a phone every tile is one height: a big screen no longer towers over a button */ const pack = (kk) => { let x = 0, y = 0, rowH = 0; const out = []; list.forEach((i) => { const p = P[i.type], ki = capH ? Math.min(kk, (capH - 24 * d) / p.h) : kk, w = Math.max(p.w * ki + 8 * d, 58 * d), h = capH || p.h * ki + 20 * d; if (x + w > area.w && x > 0) { x = 0; y += rowH + 6 * d; rowH = 0; } out.push({ i, x, y, w, h, ki }); x += w + 6 * d; rowH = Math.max(rowH, h); }); return { out, h: y + rowH }; };
  let pk = pack(k); while (pk.h > area.h && k > 0.3) { k *= 0.9; pk = pack(k); }
  const N = numbers();
  pk.out.forEach((o) => {
    const p = P[o.i.type], x = area.x + o.x, y = area.y + o.y, on = o.i.id === TSEL; TRAY.push({ id: o.i.id, x, y, w: o.w, h: o.h });
    g.fillStyle = '#fff'; g.strokeStyle = on ? '#2563EB' : '#1a1a1a'; g.lineWidth = (on ? 3.5 : 1.5) * d; g.beginPath(); g.roundRect ? g.roundRect(x, y, o.w, o.h, 8 * d) : g.rect(x, y, o.w, o.h); g.fill(); g.stroke();
    const cx = x + o.w / 2, cy = y + 4 * d + p.h * o.ki / 2;
    { const im = o.h > 44 * d ? artImg(o.i.type) : null; if (im) { const ah = o.h - 24 * d, aw = Math.min(o.w - 12 * d, ah * 4 / 3), bh = aw * 0.75; g.drawImage(im, cx - aw / 2, y + 5 * d + (ah - bh) / 2, aw, bh); } else drawPartAt(p, cx, cy, o.ki, 0, false); } /* crisp line art, like the part buttons */
    g.fillStyle = '#1a1a1a'; g.font = '800 ' + 10 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; let lb = (N[o.i.id] || '') + ' ' + p.short; if (g.measureText(lb).width > o.w - 6 * d) lb = N[o.i.id] || p.short.slice(0, 5); g.fillText(lb, cx, y + o.h - 6 * d);
    if (on) { const bx = x + o.w - 4 * d, by = y + 4 * d; g.fillStyle = '#c8412f'; g.beginPath(); g.arc(bx, by, 11 * d, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2.5 * d; g.beginPath(); g.moveTo(bx - 4 * d, by - 4 * d); g.lineTo(bx + 4 * d, by + 4 * d); g.moveTo(bx + 4 * d, by - 4 * d); g.lineTo(bx - 4 * d, by + 4 * d); g.stroke(); }
  });
  if (!list.some((i) => i.id === TSEL)) TSEL = null;
  { const ts = S.items.find((i) => i.id === TSEL); selCard(ts); tag(ts ? 'Tap ' + P[ts.type].short + ' again to take it out' : list.length + ' in your build. Tap one to take it out.'); }
}
// the picked part, in the right column under the 3D box: name, one line, size, Remove / Swap
function selCard(it) { const el = $('selc'), p = it && PP(it); if (!el) return; if (!p || !miniRoom()) { el.hidden = true; return; }
  el.innerHTML = '<b>' + esc(p.name || p.short) + '</b><span class="d">' + esc([p.tip, [p.w, p.h, p.depth].filter((v) => v != null).map((v) => +(+v).toFixed(1)).join(' x ') + ' mm.'].filter(Boolean).join(' ')) + '</span>'; /* plain text, no card: the x on its tile takes it out */
  el.hidden = false; }
$('selc').addEventListener('click', (e) => { const b = e.target.closest('[data-sc]'), it = S.items.find((i) => i.id === TSEL); if (!b || !it) return;
  if (b.dataset.sc === 'rm') { snapU(); S.items = S.items.filter((i) => i !== it && i.of !== it.id); CLEARED = true; if (sel === TSEL) sel = null; TSEL = null; save(); render(); return; }
  if (!swapGroup(it.type) && PP(it) && FUNCS.some((f) => f[0] === PP(it).cat)) S.fn = PP(it).cat; /* nothing to swap in place: open its group so you can pick another */
  render(); const pn = $('pane'); if (pn) pn.scrollTop = 0; });
const PIMG = new Map();
function pimg(src) { let im = PIMG.get(src); if (!im) { im = new Image(); im.onload = () => draw(); im.src = src; PIMG.set(src, im); } return im.complete && im.naturalWidth ? im : null; }
function drawPartAt(P, cx, cy, k, rq, dim) {
  // real size drawing of a part: board, then what shows through the deck
  g.save(); g.translate(cx, cy); g.rotate(-(rq || 0) * Math.PI / 2);
  const c = P.cut || {}, d = px(), GA = drawPartAt.ga || 1; g.globalAlpha = GA;
  if (P.screen || P.inside || P.measured || !P.cut || c.o === 'rect' || c.o === 'slot' || c.o === 'keys') { g.fillStyle = P.screen ? '#22262a' : '#2f7a4b'; g.globalAlpha = (dim ? 0.35 : 0.9) * GA; g.fillRect(-P.w * k / 2, -P.h * k / 2, P.w * k, P.h * k); g.globalAlpha = GA; }
  const ph = P.img ? pimg(P.img) : null, pa = !dim ? 1 : S.step === 1 ? ({ clear: 0.95, faded: 0.4, off: 0 })[S.photo || 'off'] : 0.4; if (ph && pa) { g.globalAlpha = pa * GA; g.drawImage(ph, -P.w * k / 2, -P.h * k / 2, P.w * k, P.h * k); g.globalAlpha = GA; }
  (P.userCuts || []).forEach((u) => { const cc = u.cut, x = u.x * k, y = -u.y * k; g.fillStyle = cc.o === 'rect' ? 'rgba(143,211,255,.55)' : 'rgba(26,26,26,.55)'; g.strokeStyle = '#ffd23a'; g.lineWidth = 1.5 * d; g.beginPath();
    if (cc.o === 'rect') g.rect(x - cc.w / 2 * k, y - cc.h / 2 * k, cc.w * k, cc.h * k); else if (cc.o === 'cross') { g.rect(x - cc.w / 2 * k, y - cc.t / 2 * k, cc.w * k, cc.t * k); g.rect(x - cc.t / 2 * k, y - cc.w / 2 * k, cc.t * k, cc.w * k); } else g.arc(x, y, (cc.d || 6) / 2 * k, 0, 7);
    g.fill(); g.stroke(); });
  g.fillStyle = '#1a1a1a';
  if (P.screen) { g.fillStyle = '#8fd3ff'; if (c.o === 'circle') { g.beginPath(); g.arc(0, 0, c.d / 2 * k, 0, 7); g.fill(); } else g.fillRect(-c.w / 2 * k, -c.h / 2 * k, c.w * k, c.h * k); }
  else if (c.o === 'circle') { g.beginPath(); g.arc(0, 0, c.d / 2 * k, 0, 7); g.fill(); if (P.up > 9) { g.fillStyle = '#c8412f'; g.beginPath(); g.arc(0, 0, c.d / 2.6 * k, 0, 7); g.fill(); } }
  else if (c.o === 'cross') { g.fillRect(-c.w / 2 * k, -c.t / 2 * k, c.w * k, c.t * k); g.fillRect(-c.t / 2 * k, -c.w / 2 * k, c.t * k, c.w * k); }
  else if (c.o === 'slot') { g.fillRect(-c.w / 2 * k, -c.h / 2 * k, c.w * k, c.h * k); g.fillStyle = '#c8412f'; g.fillRect(-3 * k, -4 * k, 6 * k, 8 * k); }
  else if (c.o === 'keys') KEYXY(c).forEach(([x, y]) => { g.beginPath(); g.arc(x * k, -y * k, c.d / 2 * k, 0, 7); g.fill(); });
  else if (c.o === 'grille') { g.fillStyle = '#9a958a'; g.beginPath(); g.arc(0, 0, c.d / 2 * k, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(6 * k * Math.cos(i * 1.047), 6 * k * Math.sin(i * 1.047), 1.5 * k, 0, 7); g.fill(); } }
  else if (c.o === 'ring') { g.strokeStyle = '#1a1a1a'; g.lineWidth = 8 * k; g.beginPath(); g.arc(0, 0, (c.d / 2 - 4) * k, 0, 7); g.stroke(); }
  (P.userHoles || []).forEach((h) => { g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(h.x * k, -h.y * k, h.d / 2 * k, 0, 7); g.fill(); });
  if (P.bolts) P.bolts.forEach(([bx, by]) => { g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(bx * k, -by * k, 2.2 * k, 0, 7); g.fill(); });
  void d; g.restore();
}
function drawPanel(panel, W, H) {
  const zt = S.step === 1 && !$('zm').hidden ? 50 * px() : 0, d = dims(), o = outline(), deck = deckArea(), fr = frame(W, H - zt, d.W, d.D), z = S.step === 1 ? AZ.z : 1, k = fr.k * z;
  fr.oy += zt; /* room for the zoom row */
  const ox = fr.ox + d.W * (fr.k - k) / 2 + (z > 1 ? AZ.px : 0), oy = fr.oy + d.D * (fr.k - k) / 2 + (z > 1 ? AZ.py : 0), X = (x) => ox + x * k, Y = (y) => oy + (d.D - y) * k;
  view = { k, ox, oy, D: d.D, W: d.W, panel, k0: fr.k, ox0: fr.ox, oy0: fr.oy };
  const path = (polys) => { g.beginPath(); polys.forEach((p) => p.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))))); g.closePath(); };
  path(o); g.fillStyle = '#e9e2cc'; g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 2 * px(); g.stroke();
  path(deck); g.fillStyle = panel === 'lid' ? '#2a2a2a' : '#c8412f'; g.fill('evenodd');
  // her grid: 20 mm squares, 10 mm halves
  g.save(); path(deck); g.clip();
  const b = G.bbox(deck);
  for (let x = R.T + R.CLR + 1; x <= d.W; x += 10) { const major = Math.round((x - (R.T + R.CLR + 1)) / 10) % 2 === 0; g.strokeStyle = 'rgba(255,255,255,' + (major ? .45 : .16) + ')'; g.lineWidth = (major ? 1.2 : .7) * px(); g.beginPath(); g.moveTo(X(x), Y(b.y0)); g.lineTo(X(x), Y(b.y1)); g.stroke(); }
  for (let y = R.T + R.CLR + 1; y <= d.D; y += 10) { const major = Math.round((y - (R.T + R.CLR + 1)) / 10) % 2 === 0; g.strokeStyle = 'rgba(255,255,255,' + (major ? .45 : .16) + ')'; g.lineWidth = (major ? 1.2 : .7) * px(); g.beginPath(); g.moveTo(X(b.x0), Y(y)); g.lineTo(X(b.x1), Y(y)); g.stroke(); }
  g.restore();
  posts().forEach(([x, y]) => { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(X(x), Y(y), R.POSTR * k, 0, 7); g.fill(); g.fillStyle = '#f3efe6'; g.beginPath(); g.arc(X(x), Y(y), R.HOLE / 2 * k, 0, 7); g.fill(); });
  const N = numbers(), bad = new Set(allProblems().map((x) => x.it.id));
  const show = S.items.filter((i) => PP(i) && (i.panel === panel || (panel !== 'lid' && i.panel === 'inside')));
  const under = (i) => i.panel === 'inside' || (PP(i) && PP(i).board); show.sort((a, b) => (under(a) ? -1 : 0) - (under(b) ? -1 : 0)); /* what sits under the top is drawn first */
  show.forEach((it) => {
    const P = PP(it), f = fp(it), ins = it.panel === 'inside' || !!P.board, isSel = it.id === sel;
    g.save();
    if (ins) { g.setLineDash([5 * px(), 4 * px()]); }
    g.fillStyle = isSel ? 'rgba(37,99,235,.45)' : bad.has(it.id) ? 'rgba(255,214,0,.55)' : ins ? 'rgba(47,122,75,.28)' : 'rgba(255,255,255,.18)';
    g.fillRect(X(f.x0), Y(f.y1), f.w * k, f.h * k);
    g.strokeStyle = isSel ? '#2563EB' : bad.has(it.id) ? '#ffd23a' : ins ? '#1a1a1a' : 'rgba(255,255,255,.75)'; g.lineWidth = (isSel ? 3.5 : 1.5) * px(); g.strokeRect(X(f.x0), Y(f.y1), f.w * k, f.h * k);
    g.restore();
    drawPartAt.ga = it.of != null && S.step === 1 && (S.photo || 'off') !== 'off' ? 0.55 : 1; /* see-through over the photo, so the real part shows under it */
    if (!ins || P.board) drawPartAt(P, X(it.x), Y(it.y), k, it.r, !!P.board);
    drawPartAt.ga = 1;
    if (it.of != null && !isSel && !(S.step === 1 && AZ.z >= 1.6)) return;
    const lb = N[it.id] || ''; g.font = '900 ' + 11 * px() + 'px -apple-system,Arial'; const tw = g.measureText(lb).width + 8 * px();
    g.fillStyle = ins ? '#1a1a1a' : '#fff'; g.fillRect(X(f.x0), Y(f.y1), tw, 15 * px()); g.fillStyle = ins ? '#fff' : '#1a1a1a'; g.textAlign = 'left'; g.fillText(lb, X(f.x0) + 4 * px(), Y(f.y1) + 11 * px());
  });
  if (PEND && S.step === 1) { const q = [X(PEND[0]), Y(PEND[1])], dd = px(); g.strokeStyle = '#2bd46b'; g.lineWidth = 3 * dd; g.beginPath(); g.arc(q[0], q[1], 12 * dd, 0, 7); g.moveTo(q[0] - 20 * dd, q[1]); g.lineTo(q[0] + 20 * dd, q[1]); g.moveTo(q[0], q[1] - 20 * dd); g.lineTo(q[0], q[1] + 20 * dd); g.stroke(); }
  const probs = allProblems();
  if (isPanel() && S.plift > 0) { const lg = panelBuilt().tray.filter((l) => l.tag === 'leg'); g.save(); g.setLineDash([4 * px(), 3 * px()]); g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.5 * px(); lg.forEach((l) => { path(l.polys); g.stroke(); }); g.restore(); } /* the lip or legs underneath, dashed */
  if (isPanel()) (S.notches || []).forEach((n, j) => { const L = n.edge === 'left' || n.edge === 'right' ? d.D : d.W, s = Math.max(n.w / 2, Math.min(L - n.w / 2, n.at)), q = n.edge === 'bottom' ? [s, n.d + 6] : n.edge === 'top' ? [s, d.D - n.d - 6] : n.edge === 'left' ? [n.d + 7, s] : [d.W - n.d - 7, s]; g.fillStyle = j === S.nsel ? '#ffd23a' : '#fff'; g.font = '900 ' + 11 * px() + 'px -apple-system,Arial'; g.textAlign = 'center'; g.fillText('N' + (j + 1), X(q[0]), Y(q[1]) + 4 * px()); });
  tag(PNAME[panel] + ', ' + (isPanel() ? d.W + ' x ' + d.D + ' x ' + S.pt + ' mm' + ((S.notches || []).length ? ', ' + S.notches.length + ' notch' + (S.notches.length > 1 ? 'es' : '') : '') + '. ' : S.cols + ' x ' + S.rows + ' squares (20 mm). ') + (probs.length ? probs.length + ' to fix (yellow).' : isPanel() ? 'Drag anything to move it.' : 'Drag to move. Dashed = inside, under the deck.'));
}
// drag on the panel
let drag = null;
const mm = (e) => { const r = cv.getBoundingClientRect(), d = cv.width / r.width, x = (e.clientX - r.left) * d, y = (e.clientY - r.top) * d; return [(x - view.ox) / view.k, view.D - (y - view.oy) / view.k]; };
function notchTo(p) { // tap or drag near an edge: the picked notch jumps there
  const d = dims(), n = (S.notches || [])[S.nsel]; if (!n) return;
  const dist = { bottom: p[1], top: d.D - p[1], left: p[0], right: d.W - p[0] }, edge = Object.keys(dist).sort((a, b) => dist[a] - dist[b])[0];
  n.edge = edge; n.at = Math.round(Math.max(0, Math.min(edge === 'left' || edge === 'right' ? d.D : d.W, edge === 'left' || edge === 'right' ? p[1] : p[0])));
}
/* Arrange: zoom and pan (AZ), tap the board photo to add a part there, drag one part on its own. The board is locked unless she unlocks it. */
const TOUCH = new Map(); let pinch = null;
const cpx = (e) => { const r = cv.getBoundingClientRect(), d = cv.width / r.width; return [(e.clientX - r.left) * d, (e.clientY - r.top) * d]; };
function zoomAt(z, m) { /* keep the spot under m (canvas px) still while zooming */
  if (!view || view.k0 == null) return; const w = [(m[0] - view.ox) / view.k, view.D - (m[1] - view.oy) / view.k];
  AZ.z = Math.max(1, Math.min(8, z)); const k = view.k0 * AZ.z;
  AZ.px = m[0] - w[0] * k - view.ox0 - view.W * (view.k0 - k) / 2; AZ.py = m[1] - (view.D - w[1]) * k - view.oy0 - view.D * (view.k0 - k) / 2;
  if (AZ.z === 1) { AZ.px = 0; AZ.py = 0; } draw();
}
function zmBar() {
  const z = $('zm'); if (!z) return; const on = S.step === 1 && !(native3d() || BIG3D) && !isPanel(); z.hidden = !on; if (!on) return;
  const u = z.querySelector('[data-z=u]'); if (u) u.disabled = !UNDO.length;
}
$('zm').addEventListener('click', (e) => {
  const b = e.target.closest('[data-z]'); if (!b) return; const v = b.dataset.z, c = [cv.width / 2, cv.height / 2];
  if (v === '1') zoomAt(AZ.z * 1.6, c); if (v === '-1') zoomAt(AZ.z / 1.6, c); if (v === '0') { AZ.z = 1; AZ.px = 0; AZ.py = 0; draw(); } if (v === 'u') undo();
});
function addKidAt(b, p, type) {
  snapU(); const P = CZ.PARTS[type]; if (!P) return;
  const it = { id: ++uid, type, panel: P.cat === 'brain' ? 'inside' : b.panel, of: b.id, x: p[0], y: p[1], r: b.r || 0, dr: 0 };
  S.items.push(it); unSync(it); syncKids(b); sel = it.id; LAST = it.id; S.lastKid = type; S.pins = {}; save(); render();
}
function pickAt(b, p) { /* the same "What is it?" sheet as the photo page, over the bottom of the picture so the spot stays visible */
  const old = document.querySelector('.apick'); if (old) old.remove(); PEND = p; draw();
  const el = document.createElement('div'); el.className = 'apick'; const last = S.lastKid && CZ.PARTS[S.lastKid];
  el.innerHTML = '<div class="pkh"><b>What is here?</b><button type="button" data-hide="1">Hide</button><button type="button" data-k="">Cancel</button></div><div class="pkb">' + (last ? '<div class="chips"><button type="button" data-k="' + S.lastKid + '" class="on">Same as last: ' + esc(last.short) + '</button></div>' : '') +
    GROUPS.map((gr) => { const ok = gr[1].filter((x) => CZ.PARTS[x[0]]); return ok.length ? '<h4>' + gr[0] + '</h4><div class="chips">' + ok.map((x) => '<button type="button" data-k="' + x[0] + '">' + esc(x[1]) + '</button>').join('') + '</div>' : ''; }).join('') + '</div>';
  el.style.top = Math.round($('con').getBoundingClientRect().top) + 'px'; document.body.appendChild(el); /* over the controls, so the whole picture and the green cross stay visible */
  el.onclick = (ev) => {
    const hb = ev.target.closest('[data-hide]'); if (hb) { const sm = el.classList.toggle('small'); hb.textContent = sm ? 'Show' : 'Hide'; return; }
    const x = ev.target.closest('[data-k]'); if (!x) return; el.remove(); PEND = null; if (x.dataset.k) addKidAt(b, p, x.dataset.k); else draw();
  };
}
cv.addEventListener('pointerdown', (e) => {
  if (S.step === 5 && curTab() === 'test') { testDown(e); return; }
  if (S.step === 5 && curTab() === 'map') { const [x, y] = pcx(e), q = MAPHITS.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h); if (q && q.id != null) { hlSet(q.id); BSEL = q.id; draw(); tag(label(S.items.find((i) => i.id === q.id) || { type: '' }) + ': lit in Test It, Arrange, 3D and ' + CFILE()); } return; }
  if (decoOn()) return;
  if (S.step === 2 && isPanel() && view && curTab() === 'notch') { if (!(S.notches || []).length) { S.notches = [{ edge: 'bottom', shape: 'rrect', w: 20, d: 8, at: 0 }]; S.nsel = 0; } notchTo(mm(e)); drag = { notch: true }; cv.setPointerCapture(e.pointerId); draw(); return; }
  if (S.step === 3 && view && curTab() === 'logo' && !WALLF[logoFace()] && LG().on) { const p = mm(e), L = LG(); L.x = p[0]; L.y = p[1]; drag = { logo: true }; cv.setPointerCapture(e.pointerId); draw(); return; }
  if (TRAY.length) { const r = cv.getBoundingClientRect(), k = cv.width / r.width, x = (e.clientX - r.left) * k, y = (e.clientY - r.top) * k, h = TRAY.find((t) => x >= t.x - 12 * k && x <= t.x + t.w + 12 * k && y >= t.y - 12 * k && y <= t.y + t.h) || null;
    if (h && h.id === TSEL) { const it = S.items.find((i) => i.id === TSEL); if (it) { snapU(); S.items = S.items.filter((i) => i !== it && i.of !== it.id); CLEARED = true; } TSEL = null; save(); render(); }
    else { if (sel === TSEL) sel = null; TSEL = h ? h.id : null; if (TSEL != null) sel = TSEL; render(); } /* the pane shows Swap part for it; sel lights it blue in 3D too */
    return; }
  if (S.step !== 1 || !view) return;
  try { cv.setPointerCapture(e.pointerId); } catch (er) { /* not a real pointer */ }
  TOUCH.set(e.pointerId, cpx(e));
  if (TOUCH.size === 2) { /* second finger: zoom, and undo whatever the first finger had started moving */
    if (drag && drag.moved && drag.it) { const u = UNDO.pop(); if (u) { UNDO.push(u); undo(); } }
    const [a, b] = [...TOUCH.values()]; drag = null; pinch = { d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, z0: AZ.z }; return;
  }
  if (TOUCH.size > 2) return;
  const p = mm(e), panel = view.panel, s0 = cpx(e);
  const hits = S.items.filter((i) => PP(i) && (i.panel === panel || (panel !== 'lid' && i.panel === 'inside'))).filter((i) => { const f = fp(i); return p[0] >= f.x0 && p[0] <= f.x1 && p[1] >= f.y0 && p[1] <= f.y1; });
  const rank = (i) => (i.of != null ? 0 : PP(i).board ? 3 : i.panel === 'inside' ? 2 : 1); hits.sort((a, b) => rank(a) - rank(b));
  const it = hits[0];
  if (!it) { drag = { pan: true, s0, p0: [AZ.px, AZ.py], moved: false, desel: true }; return; }
  if (PP(it).board && !it.move) { drag = { pan: true, s0, p0: [AZ.px, AZ.py], moved: false, add: p, board: it }; return; }
  drag = { it, dx: it.x - p[0], dy: it.y - p[1], s0, moved: false, fine: it.of != null };
  if (sel !== it.id) { sel = it.id; render(); }
});
cv.addEventListener('pointermove', (e) => {
  if (TEST.drag) { testMove(e); return; }
  if (decoOn()) return;
  if (S.step === 1 && TOUCH.has(e.pointerId)) TOUCH.set(e.pointerId, cpx(e));
  if (pinch && TOUCH.size >= 2) { const [a, b] = [...TOUCH.values()]; zoomAt(pinch.z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); return; }
  if (!drag) return; const p = mm(e);
  if (drag.notch) { notchTo(p); draw(); return; }
  if (drag.logo) { const L = LG(); L.x = Math.round(p[0] * 2) / 2; L.y = Math.round(p[1] * 2) / 2; draw(); return; }
  const c = cpx(e), far = Math.hypot(c[0] - drag.s0[0], c[1] - drag.s0[1]) > 8 * px();
  if (drag.pan) { if (far) drag.moved = true; if (drag.moved && AZ.z > 1) { AZ.px = drag.p0[0] + c[0] - drag.s0[0]; AZ.py = drag.p0[1] + c[1] - drag.s0[1]; draw(); } return; }
  if (!drag.moved) { if (!far) return; drag.moved = true; snapU(); } /* a tap never nudges a part by accident */
  const sn = drag.fine ? 0.5 : 2.5; drag.it.x = Math.round((p[0] + drag.dx) / sn) * sn; drag.it.y = Math.round((p[1] + drag.dy) / sn) * sn;
  if (drag.it.of != null) unSync(drag.it); if (PP(drag.it) && PP(drag.it).board) syncKids(drag.it); draw();
});
['pointerup', 'pointercancel'].forEach((t) => cv.addEventListener(t, (e) => {
  if (TEST.drag || TEST.held) testUp(e);
  TOUCH.delete(e.pointerId); if (pinch) { if (TOUCH.size < 2) pinch = null; drag = null; return; }
  const dr = drag; drag = null; if (!dr) return;
  if (dr.notch || dr.logo) { save(); render(); return; }
  if (dr.pan) { if (!dr.moved && t === 'pointerup') { if (dr.add) { sel = dr.board.id; render(); pickAt(dr.board, dr.add); return; } if (dr.desel) { sel = null; render(); } } return; }
  if (dr.moved) { if (dr.it) snapBrain(dr.it); save(); render(); }
}));

function curFace() { const t = curTab(), L = S.look; if (t === 'logo') return logoFace(); if (t === 'tex') return L.texFace === 'walls' ? 'top' : L.texFace; return 'top'; }
function drawFace(W, H) {
  let f = curFace(); if (!faces().some((x) => x[0] === f)) f = 'top';
  const d = dims(), o = outline(), fr = frame(W, H, d.W, d.D), k = fr.k, ox = fr.ox, oy = fr.oy, X = (x) => ox + x * k, Y = (y) => oy + (d.D - y) * k;
  view = { k, ox, oy, D: d.D, face: f };
  const path = (polys) => { g.beginPath(); polys.forEach((p) => p.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))))); g.closePath(); };
  const deckFace = f === 'top' || f === 'lidin';
  path(o); g.fillStyle = S.look.c1; g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 2 * px(); g.stroke();
  if (S.look.tex.walls.kind !== 'none' && curTab() === 'tex') { path(G.diff(G.offset(o, 3), o)); g.fillStyle = 'rgba(0,0,0,.25)'; g.fill('evenodd'); }
  if (deckFace) {
    path(G.offset(o, -(R.T + R.CLR))); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1 * px(); g.stroke();
    const cuts = []; itemsOn(faceHalf(f)).filter((i) => PP(i)).forEach((i) => cuts.push(...G.cutShape(PP(i), i.x, i.y, i.r || 0))); if (!S.snap) posts().forEach(([x, y]) => cuts.push(G.circle(x, y, R.HOLE / 2, 16)));
    if (cuts.length) { path(G.union(cuts)); g.fillStyle = '#1a1a1a'; g.fill('nonzero'); }
  }
  marksFor(f, true).forEach((m) => { path(m.polys); g.fillStyle = m.how === 'cut' ? '#e7e2d6' : S.look.c2; g.globalAlpha = m.name === 'texture' ? 0.75 : 1; g.fill('evenodd'); g.globalAlpha = 1; if (m.how === 'glue') { g.strokeStyle = '#c8412f'; g.lineWidth = 1.5 * px(); g.stroke(); } });
  const name = (faces().find((x) => x[0] === f) || [0, 'Top'])[1];
  const noLogo = curTab() === 'logo' && LG().on && !logoShape().length;
  tag(name + ', seen from outside. ' + (noLogo ? (LG().src === 'image' && !LOGOIMGS[logoFace()] ? 'Pick your logo picture below.' : 'No logo shape found yet.') : curTab() === 'logo' && LG().on ? 'Drag the logo to move it.' : curTab() === 'tex' && S.look.texFace === 'walls' ? 'Sides: the shaded ring shows where the ribs go.' : ''));
}
function drawBeds(W, H) {
  const hs = halves(), d = px(), pad = 10 * d;
  // one card per piece: the piece on its bed, numbered
  const cards = []; hs.forEach((h) => { const pl = plan(h.built); const foot = footOf(h.built); pl.regs.forEach((r, i) => cards.push({ half: h, i, n: pl.regs.length, piece: G.inter(foot, r), fit: G.fitsBed(pl.feet[i], S.bed), f: pl.feet[i] })); });
  const Wb = W - miniRoom(), cols = Math.min(cards.length, cards.length > 4 ? 3 : 2) || 1, rows = Math.ceil(cards.length / cols), cw = (Wb - pad * (cols + 1)) / cols, ch = (H - pad * (rows + 1) - 18 * d - 46 * d) / rows;
  cards.forEach((c, idx) => {
    const cx = pad + (idx % cols) * (cw + pad), cy = pad + Math.floor(idx / cols) * (ch + pad), bw = S.bed[0], bd = S.bed[1];
    const rotq = !(c.f.w + 4 <= bw && c.f.h + 4 <= bd) && (c.f.h + 4 <= bw && c.f.w + 4 <= bd);
    const k = Math.min((cw - 8 * d) / bw, (ch - 26 * d) / bd), bx = cx + (cw - bw * k) / 2, by = cy + 4 * d;
    g.fillStyle = '#fff'; g.fillRect(bx, by, bw * k, bd * k); g.strokeStyle = c.fit ? '#1a1a1a' : '#c8412f'; g.lineWidth = 2 * d; g.strokeRect(bx, by, bw * k, bd * k);
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1; for (let x = 10; x < bw; x += 10) { g.beginPath(); g.moveTo(bx + x * k, by); g.lineTo(bx + x * k, by + bd * k); g.stroke(); } for (let y = 10; y < bd; y += 10) { g.beginPath(); g.moveTo(bx, by + y * k); g.lineTo(bx + bw * k, by + y * k); g.stroke(); }
    const f = c.f, mx = bx + bw * k / 2, my = by + bd * k / 2;
    g.save(); g.translate(mx, my); if (rotq) g.rotate(Math.PI / 2);
    g.beginPath(); c.piece.forEach((p) => p.forEach(([x, y], i) => { const X = (x - (f.x0 + f.w / 2)) * k, Y = -(y - (f.y0 + f.h / 2)) * k; i ? g.lineTo(X, Y) : g.moveTo(X, Y); })); g.closePath();
    g.fillStyle = c.half.key === 'lid' ? '#2a2a2a' : '#c8412f'; g.fill('evenodd'); g.restore();
    g.fillStyle = c.fit ? '#1a1a1a' : '#c8412f'; g.font = '800 ' + 11 * d + 'px -apple-system,Arial'; g.textAlign = 'left';
    g.fillText(c.half.name + ' ' + (c.i + 1) + ' of ' + c.n + (c.fit ? '' : ', too big'), cx + 2 * d, by + bd * k + 14 * d);
  });
  const n = cards.length, bad = cards.filter((c) => !c.fit).length;
  const pr = printerRow(), est = S.material === 'wood' ? null : estimate(hs);
  tag((pr[0] === 'custom' ? 'Your printer' : pr[1]) + ', ' + S.bed[0] + ' x ' + S.bed[1] + ' mm bed. ' + n + (n === 1 ? ' piece' : ' pieces') + (bad ? ', ' + bad + ' too big' : n === 1 ? ', it fits' : ', all fit') + '.' + (est ? ' About ' + hm(est.sec) + '.' : ''));
}

// ---------- 3D ----------
let T3 = null;
// one face piece, arm or leg, drawn around its own spot so it can be moved without rebuilding the case
function decoMesh(q, tz) { const lid = onFace(q) === 'lid', out = new THREE.Group(), grp = new THREE.Group(), t = lid ? 0 : tz, dp = lid ? 0.6 : 1.2; out.add(grp);
  if (lid) { if (S.style === 'small') out.rotation.x = Math.PI; else out.rotation.y = Math.PI; } /* on the lid the piece faces out, the other way from the inside */
  if (q.k === 'handle') { const a = addonPolys('handle'), b = G.bbox(a.polys), up = new THREE.Group(), m = mesh(G.layerGeos([{ polys: a.polys, z0: 0, z1: a.h }]), 0x2f4a6b); /* the arch stands up on its two feet */
    m.position.set(-(b.x0 + b.w / 2), -b.y0, -a.h / 2); up.add(m); up.rotation.x = Math.PI / 2; up.position.z = t; grp.add(up); grp.rotation.z = (q.a || 0) * Math.PI / 180; return out; }
  if (isLimb(q)) { const fp = limbFp(), L = fp.Lb, leg = q.k === 'leg', end = leg ? fp.foot : fp.hand, off = leg ? -11 - L : -L, z = t + 0.4;
    grp.add(mesh(G.layerGeos([{ polys: fp.bar.polys, z0: z, z1: z + fp.bar.h }]), 0x2f4a6b));
    grp.add(mesh(G.layerGeos([{ polys: end.polys.map((p) => p.map(([a, b]) => [a, b + off])), z0: z + fp.bar.h, z1: z + fp.bar.h + end.h }]), leg ? 0x1a1a1a : 0xe9e2cc));
    grp.rotation.z = (q.a || 0) * Math.PI / 180; }
  else grp.add(mesh(G.layerGeos([{ polys: [featPoly(q.k, q.s || 1.4, q.f)], z0: q.mt === 'raised' ? t + 1.6 : t - dp, z1: q.mt === 'raised' ? t + 1.7 : t - dp + 0.1 }]), 0x1a1a1a));
  return out; }
function decoMark() { const r = T3; if (!r) return; // a red ring around the piece you picked
  if (r.decoRing) { if (r.decoRing.parent) r.decoRing.parent.remove(r.decoRing); r.decoRing.geometry.dispose(); r.decoRing = null; }
  const q = deco3d() && DECO && (S.deco || []).find((z) => z.id === DECO.sel && onFace(z) === decoFace()), m = q && r.decoM && r.decoM[q.id]; if (!m) return;
  const rad = isGlue(q) ? 14 : isLimb(q) ? 10 : 9 * (q.s || 1.4) + 2, ring = new THREE.Mesh(new THREE.RingGeometry(rad, rad + 2.4, 48), new THREE.MeshBasicMaterial({ color: 0xc8412f, side: THREE.DoubleSide, depthTest: false, transparent: true }));
  ring.renderOrder = 999; ring.position.z = (onFace(q) === 'lid' ? 0 : r.decoZ) + 0.5; m.add(ring); r.decoRing = ring; }
function decoPlace(q, lifted) { const r = T3, m = r && r.decoM && r.decoM[q.id]; if (!m) return; m.position.set(q.x, q.y, (lifted && !isLimb(q) ? 2.4 : lifted ? 1 : 0) * (r.decoUp || 1)); r.draw(); }
// where a finger on the 3D picture lands on the top of the case, in case millimetres
function decoRay(e) { const r = T3; if (!r || r.decoZ == null || !r.decoGrp) return null; const el = $('v3'), at = document.elementFromPoint(e.clientX, e.clientY); if (!at || !el.contains(at)) return null;
  const b = el.getBoundingClientRect(), rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1), r.camera);
  r.scene.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(r.decoGrp.matrixWorld).invert(), o = rc.ray.origin.clone().applyMatrix4(inv), dir = rc.ray.direction.clone().transformDirection(inv);
  if (Math.abs(dir.z) < 1e-4) return null; const t = (r.decoZ - o.z) / dir.z; return t > 0 ? [o.x + dir.x * t, o.y + dir.y * t] : null; } /* dir keeps its length through the turn, so t is still the distance along the finger's line */
function decoHit(x, y, slop) { let best = null, bd = 1e9; const lid = decoFace() === 'lid'; (S.deco || []).forEach((q) => { if (onFace(q) !== decoFace()) return; const pts = [[q.x, q.y]];
    if (isLimb(q)) { const a = (q.a || 0) * Math.PI / 180, L = limbFp().Lb + (q.k === 'leg' ? 8 : 14); [0.5, 1].forEach((f) => { let v = [Math.sin(a) * L * f, -Math.cos(a) * L * f]; if (lid) v = lidMir(v); pts.push([q.x + v[0], q.y + v[1]]); }); }
    if (isGlue(q)) { const a = (q.a || 0) * Math.PI / 180, L = G.bbox(addonPolys('handle').polys).w / 2; [-1, -0.5, 0.5, 1].forEach((f) => { let v = [Math.cos(a) * L * f, Math.sin(a) * L * f]; if (lid) v = lidMir(v); pts.push([q.x + v[0], q.y + v[1]]); }); }
    const rad = (isLimb(q) || isGlue(q) ? 9 : 9 * (q.s || 1.4)) + slop; pts.forEach((p) => { const dd = Math.hypot(p[0] - x, p[1] - y); if (dd < rad && dd < bd) { bd = dd; best = q; } }); });
  return best; }
const inPoly = (polys, x, y) => { let c = false; polys.forEach((p) => { for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const a = p[i], b = p[j]; if ((a[1] > y) !== (b[1] > y) && x < a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])) c = !c; } }); return c; };
let DIN = null;
function decoInside(x, y) { // keep a piece on the case: a round or shaped top has corners its box does not
  const k = S.style + JSON.stringify(dims()); if (!DIN || DIN.k !== k) { const o = outline(); let ins = o; try { const t = G.offset(o, -7); if (t && t.length) ins = t; } catch (e) {} DIN = { k, ins, b: G.bbox(o) }; }
  if (inPoly(DIN.ins, x, y)) return [x, y]; const cx = DIN.b.x0 + DIN.b.w / 2, cy = DIN.b.y0 + DIN.b.h / 2; let lo = 0, hi = 1;
  for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (inPoly(DIN.ins, cx + (x - cx) * m, cy + (y - cy) * m)) lo = m; else hi = m; } return [cx + (x - cx) * lo, cy + (y - cy) * lo]; }
function decoAdd(k) { snapU(); S.deco = S.deco || []; const bb = G.bbox(outline()), n = S.deco.length, limb = k === 'arm' || k === 'leg';
  const q = { id: 'd' + Date.now().toString(36) + n, k, x: bb.x0 + bb.w * (0.3 + 0.2 * (n % 3)), y: bb.y0 + bb.h * (0.7 - 0.18 * (Math.floor(n / 3) % 3)), mt: 'sunk', s: 1.4 };
  if (limb) { const side = S.deco.filter((z) => z.k === k).length % 2; q.x = side ? bb.x1 - bb.w * 0.3 : bb.x0 + bb.w * 0.3; q.y = bb.y0; if (k === 'arm') { q.x = side ? bb.x1 : bb.x0; q.y = bb.y0 + bb.h * 0.55; } q.a = k === 'leg' ? 0 : side ? 20 : -20; } /* arms start on the sides, legs on the bottom edge */
  if (k === 'handle') { q.x = bb.x0 + bb.w / 2; q.y = bb.y0 + bb.h * 0.9; q.a = 0; }
  const vl = v2l(q.x, q.y, bb), at = decoInside(vl[0], vl[1]); q.x = at[0]; q.y = at[1]; if (decoFace() === 'lid') q.on = 'lid';
  S.deco.push(q); DECO = DECO || { mode: 'case' }; DECO.sel = q.id; return q; }
let SKIPC = 0;
function deco3dWire() { const el = $('v3'); let dr = null, dn = null, nw = null, ghost = null;
  el.addEventListener('pointerdown', (e) => { if (!deco3d() || !T3) return; const p = decoRay(e); dn = { x: e.clientX, y: e.clientY, id: e.pointerId }; if (!p) return;
    const p2 = decoRay({ clientX: e.clientX + 20, clientY: e.clientY }), slop = p2 ? Math.min(16, Math.hypot(p2[0] - p[0], p2[1] - p[1])) : 8, q = decoHit(p[0], p[1], slop); if (!q) return;
    e.stopPropagation(); e.preventDefault(); dn = null; T3.controls.enabled = false; DECO = DECO || { mode: 'case' }; DECO.sel = q.id; dr = { q, dx: q.x - p[0], dy: q.y - p[1], moved: false, id: e.pointerId };
    try { el.setPointerCapture(e.pointerId); } catch (x) {} decoMark(); T3.draw(); }, true);
  el.addEventListener('pointermove', (e) => { if (!dr || e.pointerId !== dr.id) return; e.stopPropagation(); e.preventDefault(); const p = decoRay(e); if (!p) return;
    if (!dr.moved) { snapU(); dr.moved = true; } decoMove(dr.q.id, p[0] + dr.dx, p[1] + dr.dy); decoPlace(dr.q, true); }, true);
  ['pointerup', 'pointercancel'].forEach((ev) => el.addEventListener(ev, (e) => {
    if (dr && e.pointerId === dr.id) { const d0 = dr; dr = null; e.stopPropagation(); if (T3) T3.controls.enabled = true; if (d0.moved) save(); render(); return; }
    if (dn && e.pointerId === dn.id) { const tap = Math.hypot(e.clientX - dn.x, e.clientY - dn.y) < 7; dn = null; if (tap && deco3d() && DECO && DECO.sel) { DECO.sel = null; render(); } } }, true));
  // pick a piece up from the list and carry it onto the case
  document.addEventListener('pointerdown', (e) => { const b = e.target.closest && e.target.closest('[data-dadd]'); if (!b || !deco3d()) return; nw = { k: b.dataset.dadd, x: e.clientX, y: e.clientY, id: e.pointerId, q: null, name: b.textContent }; });
  document.addEventListener('pointermove', (e) => { if (!nw || e.pointerId !== nw.id) return;
    if (!nw.q) { const mx = e.clientX - nw.x, my = e.clientY - nw.y; if (my > -9 || Math.abs(mx) > -my * 1.4) return; /* up means carry it to the case, sideways scrolls the row */ nw.q = decoAdd(nw.k); draw3d(false);
      ghost = document.createElement('div'); ghost.textContent = nw.name.replace(/^\+\s*/, ''); ghost.style.cssText = 'position:fixed;left:0;top:0;z-index:99;pointer-events:none;padding:9px 13px;border-radius:999px;background:#c8412f;color:#fff;font:800 13px/1 -apple-system,BlinkMacSystemFont,Arial,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.3)'; document.body.appendChild(ghost); }
    e.preventDefault(); const p = decoRay(e); ghost.style.transform = 'translate(' + (e.clientX - 30) + 'px,' + (e.clientY - 58) + 'px)'; ghost.style.opacity = p ? '0' : '1';
    if (p) { decoMove(nw.q.id, p[0], p[1]); decoPlace(nw.q, true); } }, { passive: false });
  ['pointerup', 'pointercancel'].forEach((ev) => document.addEventListener(ev, (e) => { if (!nw || e.pointerId !== nw.id) return; const n = nw; nw = null; if (ghost) { ghost.remove(); ghost = null; }
    if (n.q) { SKIPC = Date.now(); save(); render(); } }));
}
function setup3d() {
  if (T3) return T3;
  const wrap = $('v3'), renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); wrap.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8170, 1.5)); const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(120, 260, 160); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(35, 1, 1, 6000), controls = new OrbitControls(camera, renderer.domElement); controls.enablePan = false;
  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2; scene.add(root);
  T3 = { renderer, scene, camera, controls, root, key: '', slots: {}, hl: null, fit: () => {} };
  T3.draw = () => renderer.render(scene, camera); controls.addEventListener('change', T3.draw);
  new ResizeObserver(() => { const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); T3.fit(); T3.draw(); }).observe(wrap);
  let pd0 = null; wrap.addEventListener('pointerdown', (e) => { pd0 = [e.clientX, e.clientY]; });
  wrap.addEventListener('click', (e) => { if (wrap.classList.contains('mini')) { BIG3D = true; render(); return; }
    if (BIG3D && !play3d() && !native3d() && pd0 && Math.hypot(e.clientX - pd0[0], e.clientY - pd0[1]) < 6) { const h = playHit(e); if (h && S.items.some((i) => i.id === h.id)) { sel = TSEL = h.id; render(); } } }); /* 3D: tap a part on any face to pick it (a drag still spins) */ play3dWire();
  return T3;
}
// ---------- PLAY: press the real 3D case. A tap (moved < 6 px) on a control presses it 1.2 mm, lights it and runs its Function; a drag still spins the case ----------
const play3d = () => S.step === 5 && curTab() === 'test';
const playSim = () => play3d() && (!!simKind() || !S.items.length); /* PLAY for a preset with its own live preview, or nothing built yet: the pads */
const PRESS = {}; let PRAF = 0;
function playHit(e) { const r = T3, el = $('v3'); if (!r || !r.ctl) return null; const b = el.getBoundingClientRect(), rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1), r.camera);
  r.scene.updateMatrixWorld(true); let best = null; const ray = new THREE.Ray(), pt = new THREE.Vector3(), inv = new THREE.Matrix4();
  Object.keys(r.ctl).forEach((id) => { const q = r.ctl[id]; if (!q.grp) return; ray.copy(rc.ray).applyMatrix4(inv.copy(q.grp.matrixWorld).invert()); const bx = [];
    if (q.c.o === 'keys') { const a = q.rq * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), hw = q.c.d / 2 + 2; KEYXY(q.c).forEach(([dx, dy], j) => bx.push([q.x + dx * ca - dy * sa, q.y + dx * sa + dy * ca, hw, hw, j])); }
    else bx.push([q.x, q.y, q.w / 2 + 2, q.h / 2 + 2, null]);
    bx.forEach(([x, y, hw, hh, sub]) => { if (ray.intersectBox(new THREE.Box3(new THREE.Vector3(x - hw, y - hh, q.top - 2), new THREE.Vector3(x + hw, y + hh, q.top + Math.min(q.up, 14) + 3)), pt)) { const dd = pt.distanceTo(ray.origin); if (!best || dd < best.d) best = { id: +id, sub, d: dd }; } }); });
  return best; }
function glow(o, on) { o.traverse((x) => { const mt = x.material; if (!mt || !mt.emissive) return; if (!x.userData.own) { x.material = mt.clone(); x.userData.own = 1; x.userData.e0 = mt.emissive.getHex(); } x.material.emissive.setHex(on ? BLUE : x.userData.e0); }); }
function pressTick() { PRAF = 0; const r = T3; if (!r) return; const now = performance.now(); let live = false;
  Object.keys(PRESS).forEach((k) => { const p = PRESS[k], t = (now - p.t0) / 1000, e = r.ctl && r.ctl[p.id]; let o = e && e.m; if (o && p.sub != null) o = o.children[p.sub] || o; const done = t > 0.55;
    const off = done ? 0 : t < 0.06 ? -1.2 * t / 0.06 : -1.2 * Math.exp(-(t - 0.06) * 12) * Math.cos((t - 0.06) * 28); /* down, then a damped spring back */
    if (o) { if (o.userData.z0 == null) o.userData.z0 = o.position.z; o.position.z = o.userData.z0 + off; glow(o, !done && t < 0.35); }
    if (done) delete PRESS[k]; else live = true; });
  r.draw(); if (live) PRAF = requestAnimationFrame(pressTick); }
function playPress(hit) { const m = testModel(), id = hit.id, it = S.items.find((i) => i.id === id); HL = id; auHot(); PRESS[id + ':' + hit.sub] = { id, sub: hit.sub, t0: performance.now() }; if (!PRAF) PRAF = requestAnimationFrame(pressTick);
  const ki = m.keys.findIndex((k) => k.id === id && (hit.sub == null || k.pad === hit.sub)), pi = m.pots.findIndex((q) => q.id === id), ei = m.encs.findIndex((q) => q.id === id);
  if (ki > -1) { const h = { kind: 'key', i: ki }; TEST.held = h; testAct(h, true); setTimeout(() => { if (TEST.held === h || (TEST.held && TEST.held.kind === 'key' && TEST.held.i === h.i)) testAct(h, false); else draw(); }, 280); return; }
  if (pi > -1) { const h = { kind: 'pot', i: pi }; if (m.pots[pi].kind === 'step') { stepPress(h); return; } TEST.val[pi] = ((TEST.val[pi] || 0) + 25) % 125 > 100 ? 0 : ((TEST.val[pi] || 0) + 25) % 125; testAct(h, true); return; }
  if (ei > -1) { testAct({ kind: 'enc', i: ei, dir: 1 }, true); return; }
  draw(); tag((it && PP(it) ? PP(it).short || PP(it).name : 'This part') + ' is not wired yet. See Wire it.'); }
function play3dWire() { const el = $('v3'); let dn = null;
  el.addEventListener('pointerdown', (e) => { if (!play3d() || el.classList.contains('mini')) return; dn = { x: e.clientX, y: e.clientY, id: e.pointerId, hit: playHit(e) }; });
  el.addEventListener('pointermove', (e) => { if (dn && e.pointerId === dn.id && Math.hypot(e.clientX - dn.x, e.clientY - dn.y) >= 6) dn = null; }); /* it became a spin */
  el.addEventListener('pointerup', (e) => { if (!dn || e.pointerId !== dn.id) return; const d0 = dn; dn = null; if (play3d() && d0.hit) playPress(d0.hit); });
  el.addEventListener('pointercancel', () => { dn = null; }); }
function playPaint(r) { if (!r || !r.ctl) return; const on = play3d();
  if (on && r.scrM.length) { if (!r.oled) { const cv2 = document.createElement('canvas'); cv2.width = 256; cv2.height = 128; r.oled = { cv2, tex: new THREE.CanvasTexture(cv2), txt: null }; r.oled.tex.colorSpace = THREE.SRGBColorSpace; }
    const O = r.oled, txt = String(TEST.text || 'Ready'); if (O.txt !== txt) { O.txt = txt; const x = O.cv2.getContext('2d'); x.fillStyle = '#06141a'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#9ff0ff'; x.textAlign = 'center'; x.textBaseline = 'middle'; let fs = 44; do { x.font = '800 ' + fs + 'px -apple-system,Arial,sans-serif'; fs -= 2; } while (fs > 14 && x.measureText(txt).width > 236); x.fillText(txt, 128, 64); O.tex.needsUpdate = true; } }
  r.scrM.forEach((s) => { const mt = s.material, want = on && r.oled ? r.oled.tex : null; if (mt.map !== want) { mt.map = want; mt.emissiveMap = want; mt.color.setHex(want ? 0xffffff : 0x8fd3ff); mt.emissive.setHex(want ? 0xffffff : 0x16323f); mt.needsUpdate = true; } }); /* the virtual OLED shows what code.py would */
  r.leds.forEach((L) => { const lit = on && (L.ring ? TEST.ring || TEST.lamp : TEST.led || TEST.lamp); L.m.traverse((x) => { if (x.material && x.material.emissive) x.material.emissive.setHex(lit ? (L.ring ? 0xff2a2a : 0xff5030) : 0); }); }); }
const xrayOn = () => !!S.xray && (S.step === 1 || (S.step === 0 && BIG3D && curTab() !== 'pins')); /* Arrange, Inside view: the lid opens and the deck goes see-through */
function ghost(o) { o.traverse((c) => { if (c.material) { c.material = c.material.clone(); c.material.transparent = true; c.material.opacity = 0.3; c.material.depthWrite = false; } }); }
function mesh(geos, color) { const grp = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color, roughness: .85, flatShading: true, side: THREE.DoubleSide }); geos.forEach((gg) => { gg.computeVertexNormals(); grp.add(new THREE.Mesh(gg, mat)); }); return grp; }
const KEYXY = (c) => { const o = []; for (let j = 0; j < c.m; j++) for (let i = 0; i < c.n; i++) o.push([(i - (c.n - 1) / 2) * c.p, (j - (c.m - 1) / 2) * c.p]); return o; }; /* a keypad's key centers, from its middle */
function standIn(P, x, y, rq, top) { // a simple 3D stand-in for what shows above the deck: screen glass, button caps, D-pad
  const c = P.cut || {}; let m = null;
  if (P.screen || (c.o === 'rect' && P.isScreen)) { m = new THREE.Mesh(c.o === 'circle' ? new THREE.CylinderGeometry(c.d / 2, c.d / 2, 0.6, 40) : new THREE.BoxGeometry(((rq % 2) ? c.h : c.w), 0.6, ((rq % 2) ? c.w : c.h)), new THREE.MeshStandardMaterial({ color: 0x8fd3ff, emissive: 0x16323f })); m.rotation.x = Math.PI / 2; m.position.set(x, y, top - 1.2); }
  else if (c.o === 'circle' && P.up) { const rr = c.d / 2; m = new THREE.Mesh(new THREE.CylinderGeometry(rr * (P.up > 12 ? .55 : 1.05), rr * 1.1, Math.min(P.up, 14), 32), new THREE.MeshStandardMaterial({ color: P.up > 9 ? 0xf2ecd6 : 0x1a1a1a })); m.rotation.x = Math.PI / 2; m.position.set(x, y, top + Math.min(P.up, 14) / 2); }
  else if (c.o === 'cross') { m = mesh(G.dpadGeos(), 0x1a1a1a); m.position.set(x, y, top - 1.2); }
  else if (c.o === 'keys') { m = new THREE.Group(); const a = (rq || 0) * Math.PI / 2, mat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), hh = Math.min(P.up || 4, 14); KEYXY(c).forEach(([dx, dy]) => { const k = new THREE.Mesh(new THREE.CylinderGeometry(c.d / 2 * 0.9, c.d / 2, hh, 24), mat); k.rotation.x = Math.PI / 2; k.position.set(x + dx * Math.cos(a) - dy * Math.sin(a), y + dx * Math.sin(a) + dy * Math.cos(a), top + hh / 2); m.add(k); }); }
  else if (c.o === 'slot') { const hh = Math.min(P.up || 8, 14); m = new THREE.Mesh(new THREE.BoxGeometry(rq % 2 ? 8 : 12, rq % 2 ? 12 : 8, hh), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); m.position.set(x, y, top + hh / 2); }
  else if (c.o === 'ring') { m = new THREE.Mesh(new THREE.TorusGeometry(c.d / 2 - c.t / 2, c.t * 0.3, 8, 36), new THREE.MeshStandardMaterial({ color: 0x3a3a3a })); m.position.set(x, y, top + 0.8); }
  return m;
}
// the part you picked (DESIGN) or pressed (PLAY) turns bright blue on the 3D case
const BLUE = 0x2563eb;
function blueSel(r) { const id = play3d() ? HL : sel != null ? sel : HL;
  const all = Object.assign({}, r.ctl || {}, r.ins || {}); Object.keys(r.pm || {}).forEach((k) => { all['p' + k] = r.pm[k]; });
  Object.keys(all).forEach((k) => { const q = all[k]; if (!q.m) return; const on = k[0] === 'p' ? PSEL === +k.slice(1) && !play3d() : +k === id;
    q.m.traverse((x) => { const mt = x.material; if (!mt || !mt.color || r.scrM.includes(x)) return; if (!x.userData.bown) { x.material = mt.clone(); x.userData.bown = 1; x.userData.c0 = mt.color.getHex(); } if (x.userData.own == null && mt.emissive) { x.userData.own = 1; x.userData.e0 = mt.emissive.getHex(); }
      x.material.color.setHex(on ? BLUE : x.userData.c0); if (x.material.emissive) x.material.emissive.setHex(on ? 0x1d4ed8 : x.userData.e0 || 0); }); });
  if (r.head) r.head.scr.forEach((s) => s.bz.material.color.setHex(r.head.id === id ? BLUE : 0x1a1a1a)); }
// PLAY: the Desk-Bot's eyes run on the OLED in the character's head, frame by frame from the live preview
function headPaint(src) { const r = T3; if (!r || !r.head || !src) return; const H = r.head; if (!H.tex || H.tex.image !== src) { H.tex = new THREE.CanvasTexture(src); H.tex.colorSpace = THREE.SRGBColorSpace; H.tex.magFilter = THREE.NearestFilter; }
  H.tex.needsUpdate = true; H.scr.forEach((s) => { const mt = s.m.material; if (mt.map !== H.tex) { mt.map = H.tex; mt.emissiveMap = H.tex; mt.color.setHex(0xffffff); mt.emissive.setHex(0xffffff); mt.needsUpdate = true; } }); r.draw(); }
function setHighlight(r) {
  // yellow see-through box: where the part you just added (or picked) sits and how deep it goes
  if (r.hl) { r.hl.parent && r.hl.parent.remove(r.hl); r.hl.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); r.hl = null; }
  const id = PSEL != null && sel == null && S.step <= 1 ? 'p' + PSEL : S.step === 1 || S.step === 2 ? sel : S.step === 0 ? LAST : null, sl = id != null && r.slots[id]; if (!sl) return;
  const geo = new THREE.BoxGeometry(sl.w + 1, sl.h + 1, sl.dep), box = new THREE.Group();
  const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0.45, depthTest: false })), edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: BLUE, depthTest: false }));
  fill.renderOrder = 998; edge.renderOrder = 999; box.add(fill, edge); box.position.set(sl.x, sl.y, sl.z); sl.grp.add(box); r.hl = box;
}
// the Parts room in 3D: the piece you picked, the way it prints. The character shows put together.
function charGroup() { // the assembled character, feet at z = 0, the way it stands
  const C = charCache(), out = new THREE.Group();
  C.parts.forEach((q) => { if (q.kind === 'up') { const m = mesh(G.layerGeos(q.layers), q.color); m.position.set(q.pose[0], q.pose[1], q.pose[2]); if (q.spin) m.rotation.z = q.spin; out.add(m); }
    else q.at.forEach((a) => { const m = mesh(G.layerGeos(q.layers), q.color); m.matrixAutoUpdate = false; m.matrix.makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)).setPosition(a[0], a[1], a[2]); out.add(m); }); });
  out.userData.scr = []; C.screens.forEach((sc) => { const bz = new THREE.Mesh(new THREE.BoxGeometry(sc.w + 3, 1, sc.h + 3), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })), m = new THREE.Mesh(new THREE.BoxGeometry(sc.w, 1.2, sc.h), new THREE.MeshStandardMaterial({ color: 0x10242c, emissive: 0x1c6f86 })); bz.position.set(sc.x, sc.y + 0.3, sc.z); m.position.set(sc.x, sc.y, sc.z); out.add(bz); out.add(m); out.userData.scr.push({ m, bz }); });
  return out;
}
// the key caps sitting on their switches over the plate, so you see what the caps files make. Not printed this way: the caps print top down.
function capsOn(ox, oy) {
  const K = kb(), X = xp().keys, f = X.f == null ? 0.1 : X.f, top = 1.5, out = new THREE.Group(), G1 = {}, sp = !K.s60 && X.sp, m = Math.floor((K.c - 1) / 2);
  const geo = (k, wide, u) => G1[k] || (G1[k] = G.layerGeos(capPolys(f, wide, u))), sw = new THREE.BoxGeometry(14, 14, 5.5), swm = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 });
  K.sw.forEach((q) => { const hs = new THREE.Mesh(sw, swm); hs.position.set(ox + q.x, oy + q.y, top + 2.75); out.add(hs); /* the switch under it */
    if (sp && q.j === 0 && q.i === m + 1) return; /* the space bar covers two switches */
    const wide = sp && q.j === 0 && q.i === m, u = q.u > 1 ? q.u : 0, c = mesh(geo(wide ? 'w' : u ? 'u' + u : 'c', wide, u), u || wide ? 0x2f4a6b : 0xe9e2cc), Wc = u ? u * KB.P - 1.05 : 0;
    c.scale.z = -1; c.position.set(ox + q.x - (u ? Wc / 2 : 9), oy + q.y - 9, top + 6.5 + 8); out.add(c); });
  return out;
}
function drawParts3d() {
  const r = setup3d(), id = S.xsel, key = 'x:' + id + ':' + JSON.stringify(S.xp || {});
  if (r.key !== key) {
    r.key = key; r.slots = {}; r.hl = null; r.root.children.slice().forEach((c) => { r.root.remove(c); c.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); });
    let tall = 30, wide = 60;
    if (id === 'char') { const C = charCache();
      C.parts.forEach((q) => { if (q.kind === 'up') { const m = mesh(G.layerGeos(q.layers), q.color); m.position.set(q.pose[0], q.pose[1], q.pose[2]); if (q.spin) m.rotation.z = q.spin; r.root.add(m); }
        else q.at.forEach((a) => { const m = mesh(G.layerGeos(q.layers), q.color); m.matrixAutoUpdate = false; m.matrix.makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)).setPosition(a[0], a[1], a[2]); r.root.add(m); }); });
      C.screens.forEach((sc) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sc.w, 1.2, sc.h), new THREE.MeshStandardMaterial({ color: 0x10242c, emissive: 0x1c6f86 })); m.position.set(sc.x, sc.y, sc.z); r.root.add(m); });
      tall = C.tall; wide = C.wide; }
    else { const a = addonPolys(id), sets = a ? (a.sets || [a]) : [], cols = [0xc8412f, 0x2f4a6b, 0xf2c230, 0xe9e2cc]; let x = 0; const rows = sets.map((st) => { const layers = st.layers || [{ polys: st.polys, z0: 0, z1: st.h }], b = G.bbox([].concat(...layers.map((l) => l.polys))), zt = Math.max(...layers.map((l) => l.z1)); return { layers, b, zt }; }), tw = rows.reduce((q, w) => q + w.b.w, 0) + 6 * Math.max(0, rows.length - 1);
      let deep = 0; rows.forEach((w, i) => { const n = Math.max(1, Math.min(8, sets[i].n || 1)), sy = w.b.h + 5, span = n * sy - 5; deep = Math.max(deep, span); /* every copy you print, not one of each */
        for (let j = 0; j < n; j++) { const m = mesh(G.layerGeos(w.layers), cols[i % cols.length]); m.position.set(-tw / 2 + x - w.b.x0, -w.b.y0 - span / 2 + j * sy, 0); r.root.add(m); }
        x += w.b.w + 6; tall = Math.max(tall, w.zt, w.b.h * 0.6); }); wide = Math.max(40, tw, deep); tall = Math.max(tall, deep * 0.6);
      if (id === 'keys' && rows.length && xp().keys.view !== 'plate') { r.root.add(capsOn(-tw / 2 - rows[0].b.x0, -rows[0].b.y0 - rows[0].b.h / 2)); tall = Math.max(tall, 16); } }
    r.root.position.set(0, 0, 0);
    r.fit = () => { const rad = Math.hypot(wide, tall) / 2 * 1.08, v = r.camera.fov * Math.PI / 360, hz = Math.atan(Math.tan(v) * r.camera.aspect), dist = rad / Math.sin(Math.min(v, hz)) * (id === 'char' ? 1.22 : 1.12), dir = id === 'char' ? [0.5, 0.2, 1] : [0.3, 0.75, 0.75];
      r.controls.target.set(0, id === 'char' ? tall * 0.43 : tall / 4, 0); /* the character sits a little high so the caption does not cover its feet */ r.camera.position.copy(new THREE.Vector3(dir[0], dir[1], dir[2]).normalize().multiplyScalar(dist)).add(r.controls.target); r.controls.update(); };
    r.mode = 'big'; r.view = key; r.fit(); $('sb').hidden = true; $('sb').innerHTML = ''; try { tag(xmeta(id)[0] + ': ' + XINFO[id]() + '. Drag to spin it.'); } catch (e) {} /* said once, so a message from a button is not written over */
  }
  r.controls.enabled = true; r.draw();
}
// everything in the build that can change the shape: the 3D view is rebuilt whenever any of it changes, whichever room changed it
function buildKey() { const { step, tab, page, seen, lastIn, moreOn, cat, fn, xsel, xp: x, have, wired, open, started, picked, bedv, adjSel, adjOpen, prq, ...b } = S; return b; }
// Print Bed: every printed file laid out as it prints, on as many beds as it takes, so nothing is hidden inside the case before you download
const BEDC = { k: null, files: [] }, BCOL = [0xc8412f, 0x2f4a6b, 0xf2c230, 0xe9e2cc, 0x2f7a4b, 0x8a6bb8];
function bedFiles() { const k = JSON.stringify(buildKey()) + '|' + S.bed + '|' + S.material + '|' + JSON.stringify(S.xp || {}); if (BEDC.k !== k) { BEDC.k = k; try { BEDC.files = S.material === 'wood' ? [] : filesOf().filter((f) => f.blob && f.blob.tris && f.blob.tris.length); } catch (e) { BEDC.files = []; } } return BEDC.files; }
function bedPack(files) { const bw = S.bed[0], bh = S.bed[1], g = 6, beds = []; let cur = null;
  const ps = files.map((f) => { const t = f.blob.tris; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; for (let i = 0; i < t.length; i += 3) { x0 = Math.min(x0, t[i]); x1 = Math.max(x1, t[i]); y0 = Math.min(y0, t[i + 1]); y1 = Math.max(y1, t[i + 1]); z0 = Math.min(z0, t[i + 2]); z1 = Math.max(z1, t[i + 2]); } return { f, x0, y0, z0, w: x1 - x0, h: y1 - y0, z: z1 - z0 }; }).sort((a, b) => b.h - a.h);
  ps.forEach((p) => { if (p.w > bw - 2 * g || p.h > bh - 2 * g) { beds.push({ items: [Object.assign(p, { px: g, py: g })], big: true, shelves: [] }); return; }
    const put = (bd) => { for (const sh of bd.shelves) if (p.h <= sh.h && sh.x + p.w <= bw - g) { bd.items.push(Object.assign(p, { px: sh.x, py: sh.y })); sh.x += p.w + g; return true; } /* first fit: any shelf with room, then a new shelf */
      const y = bd.shelves.reduce((q, sh) => Math.max(q, sh.y + sh.h + g), g); if (y + p.h > bh - g) return false; bd.shelves.push({ y, h: p.h, x: g + p.w + g }); bd.items.push(Object.assign(p, { px: g, py: y })); return true; };
    if (!beds.some((bd) => !bd.big && put(bd))) { cur = { items: [], shelves: [] }; beds.push(cur); put(cur); } });
  return beds; }
function drawBed3d() {
  const r = setup3d(), files = bedFiles(), key = 'bed:' + BEDC.k;
  if (r.key !== key) {
    r.key = key; r.slots = {}; r.hl = null; r.root.children.slice().forEach((c) => { r.root.remove(c); c.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); });
    const beds = bedPack(files), bw = S.bed[0], bh = S.bed[1], step = bw + 24, total = beds.length * step - 24; let tall = 10, n = 0;
    beds.forEach((b, i) => { const X0 = -total / 2 + i * step, plate = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 1), new THREE.MeshStandardMaterial({ color: b.big ? 0xe8c9c2 : 0xd9d4c7, roughness: 1 })); plate.position.set(X0 + bw / 2, 0, -0.5); r.root.add(plate);
      b.items.forEach((p) => { const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(p.f.blob.tris), 3)); gg.translate(X0 + p.px - p.x0, -bh / 2 + p.py - p.y0, -p.z0); r.root.add(mesh([gg], BCOL[n++ % BCOL.length])); tall = Math.max(tall, p.z); }); });
    r.root.position.set(0, 0, 0); const wide = Math.max(bw, total), deep = bh;
    r.fit = () => { const rad = Math.hypot(wide, deep * 0.7, tall) / 2 * 1.05, v = r.camera.fov * Math.PI / 360, hz = Math.atan(Math.tan(v) * r.camera.aspect), dist = rad / Math.sin(Math.min(v, hz)); r.controls.target.set(0, 0, 0); r.camera.position.copy(new THREE.Vector3(0.25, 0.8, 0.7).normalize().multiplyScalar(dist)); r.controls.update(); };
    r.mode = 'big'; r.view = key; r.fit(); $('sb').hidden = true; $('sb').innerHTML = '';
    const big = beds.filter((b) => b.big).length; tag(files.length + ' printed pieces on ' + beds.length + ' bed' + (beds.length > 1 ? 's' : '') + ' of ' + bw + ' x ' + bh + ' mm' + (big ? ', ' + big + ' bigger than the bed (pink)' : '') + '. Drag to spin.');
  }
  r.controls.enabled = true; r.draw();
}
// X-Ray: the hardware itself, at its real place. Colors say what it is.
function hwColor(it, P) { const t = it.type || ''; if (P.cat === 'brain') return 0x2f7a4b; if (P.charger) return 0x1f4fa0; if (P.cat === 'power') return 0xd9a030; if (P.cat === 'move' || /servo|sg90|motor/i.test(t)) return 0x7a4fd0; if (P.screen || P.isScreen) return 0x22262a; return 0x4a4a4a; }
function insideMesh(it, P, x, y, rq) { const g = new THREE.Group(), bw = rq % 2 ? P.h : P.w, bh = rq % 2 ? P.w : P.h, rs = riserOf(it), z0 = R.F + rs, a = rq * Math.PI / 2, post = new THREE.MeshStandardMaterial({ color: 0xb8b2a4, roughness: .9 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, Math.max(1, P.depth)), new THREE.MeshStandardMaterial({ color: hwColor(it, P), roughness: .7 })); b.position.set(x, y, z0 + Math.max(1, P.depth) / 2); g.add(b);
  if (rs > 0) { const holes = P.holes && P.holes.length ? P.holes.map(([hx, hy]) => [hx - P.w / 2, hy - P.h / 2]) : null, pts = holes || [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => [sx * (P.w / 2 - 2.5), sy * (P.h / 2 - 2.5)]);
    pts.forEach(([u, v]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(holes ? 2.4 : 2, holes ? 2.4 : 2, rs, 16), post); c.rotation.x = Math.PI / 2; c.position.set(x + u * Math.cos(a) - v * Math.sin(a), y + u * Math.sin(a) + v * Math.cos(a), R.F + rs / 2); g.add(c); }); /* standoffs at its screw holes */
    if (!holes) { const sl = new THREE.Mesh(new THREE.BoxGeometry(bw + 2, bh + 2, 1.2), post); sl.position.set(x, y, z0 - 0.6); g.add(sl); } } /* or a slate on 4 posts */
  return g; }
const WIRE_C = { press: 0xe53935, turn: 0xfbc02d, out: 0x1e88e5, sense: 0x43a047, move: 0x8e24aa, power: 0xd32f2f };
function wirePreview(grp, slots, parts, top) { const br = S.items.find((i) => i.panel === 'inside' && PP(i) && PP(i).cat === 'brain' && slots[i.id] && slots[i.id].grp === grp); if (!br) return; const b = slots[br.id], bz = R.F + riserOf(br) + PP(br).depth;
  parts.concat(S.items.filter((i) => i.panel === 'inside' && i !== br)).forEach((it) => { const P = PP(it), q = slots[it.id]; if (!P || !q || q.grp !== grp || P.board || it.of != null) return;
    const ins = it.panel === 'inside', z = ins ? R.F + riserOf(it) + P.depth : top - R.LT - (P.depth || 0), mid = Math.max(bz, z) + 4, pts = [new THREE.Vector3(b.x, b.y, bz), new THREE.Vector3(b.x, b.y, mid), new THREE.Vector3(q.x, q.y, mid), new THREE.Vector3(q.x, q.y, z)];
    grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: WIRE_C[P.cat] || 0x9e9e9e }))); }); }
const PLUG_C = { p_usbc: 0xa0a4aa, p_microusb: 0xa0a4aa, p_usbb: 0xa0a4aa, p_hdmi: 0xa0a4aa, p_minihdmi: 0xa0a4aa, p_microhdmi: 0xa0a4aa, p_jack: 0x2a2a2a, p_switch: 0x3a3a3a };
const BEZEL = new THREE.MeshStandardMaterial({ color: 0x3b3b3b, roughness: .55, metalness: .2 });
function portPlugs(r, grp) { S.ports.map((p) => [p, PLUG_C[p.kind] && portAt(p)]).concat(autoPorts().map((w, i) => [{ id: 'auto' + i, kind: w.kind, face: w.face, auto: true }, w])).forEach(([p, w]) => { if (!w) return; const v = p.face === 'back' || p.face === 'front', N = PNORM[p.face], s0 = Math.min(...w.rects.map((q) => q.s0)), s1 = Math.max(...w.rects.map((q) => q.s1)), al = s1 - s0, ht = w.z1 - w.z0, dn = 7, mid = (s0 + s1) / 2, off = R.T + dn / 2 - 1;
  const m = new THREE.Mesh(new THREE.BoxGeometry(v ? al : dn, v ? dn : al, ht), new THREE.MeshStandardMaterial({ color: !p.auto && portBlocked(p) ? 0xd94a3a : PLUG_C[p.kind], roughness: .4, metalness: .3 })), x = v ? mid : w.x - N[0] * off, y = v ? w.y - N[1] * off : mid, z = (w.z0 + w.z1) / 2;
  m.position.set(x, y, z); grp.add(m); r.pm[p.id] = { m }; r.slots['p' + p.id] = { grp, x, y, z, w: v ? al : dn, h: v ? dn : al, dep: ht };
  if (w.step) { const bt = G.STEP.boot, d0 = G.STEP.bd - 0.15, t = 0.5, W = al + 2 * bt, Hh = ht + 2 * bt, bx = v ? mid : w.x - N[0] * d0, by = v ? w.y - N[1] * d0 : mid; /* a subtle bezel: a thin frame at the bottom of the boot recess */
    [[0, (Hh - t) / 2, W, t], [0, -(Hh - t) / 2, W, t], [(W - t) / 2, 0, t, Hh], [-(W - t) / 2, 0, t, Hh]].forEach(([du, dz, sw, sh]) => { const f = new THREE.Mesh(new THREE.BoxGeometry(v ? sw : 0.3, v ? 0.3 : sw, sh), BEZEL); f.position.set(v ? bx + du : bx, v ? by : by + du, z + dz); grp.add(f); }); }
  }); } /* the socket behind each wall opening */
function draw3d(isMini) {
  const D3 = deco3d();
  if ($('v3').hidden || (!isMini && $('v3').classList.contains('mini'))) return; // the view changed before this frame ran
  const MV = mountView();
  if (curTab() === 'extras' && !D3 && S.xsel && !MV) { if (!isMini) drawParts3d(); return; }
  if (S.step === 5 && curTab() === '3d' && S.bedv === 'bed' && !isMini) { drawBed3d(); return; }
  // styling the lid's outside: show it closed, from above, the way people will see it
  const XR = xrayOn();
  const lidTop = !XR && S.step === 3 && curTab() !== 'colors' && (curFace() === 'lidout' || !!WALLF[curFace()]), DF = D3 ? decoFace() : '', OPEN = XR ? true : D3 || MV ? false : S.open && !lidTop; /* mounting: the lid stays shut, out of the way */
  const r = setup3d(), d = geom(), h = d, key = JSON.stringify([buildKey(), DF, OPEN, logoImgKey(), S.style === 'face' ? JSON.stringify((S.xp || {}).ch || 0) : 0, MV ? S.xsel : 0, S.attachedParts.length ? S.xp : 0, XR]);
  if (isMini && (!$('v3').classList.contains('mini') || $('v3').hidden)) return; // left the flat view before the timer ran
  const mode = isMini ? 'mini' : 'big';
  if (r.key !== key) {
    r.key = key; r.slots = {}; r.ctl = {}; r.scrM = []; r.leds = []; r.ins = {}; r.pm = {}; r.hl = null; r.decoM = {}; r.decoRing = null; r.decoGrp = null; r.marks = [];
    r.root.children.slice().forEach((c) => { r.root.remove(c); c.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); });
    PAINTED = true; let hs; try { hs = halves(); } catch (e) { r.key = ''; throw e; /* do not keep an empty view: try again on the next draw */ } finally { PAINTED = false; }
    hs.forEach((x) => {
      const grp = new THREE.Group();
      const c1 = new THREE.Color(S.look.c1).getHex(), c2 = new THREE.Color(S.look.c2).getHex();
      { const tm = mesh(G.layerGeos(x.built.tray, x.built.extra), c1); if (XR) ghost(tm); grp.add(tm); } /* X-Ray: the whole shell turns see-through */
      if (x.built.frame) { const fm = mesh(G.layerGeos(x.built.frame), 0x2f4a6b); fm.position.z = -swapLedge(); grp.add(fm); } /* swap panels: the frame the insert sits in */ (x.built.plugs || []).forEach((pg) => grp.add(mesh(G.plugGeos(pg), c1)));
      { const dm = mesh(G.layerGeos(x.built.deck), x.key === 'lid' ? 0x2a2a2a : 0xc8412f); if (x.key === 'lid') dm.position.z = -0.1; /* the lid liner's inner face sat exactly on the screen frames: 0.1 mm apart, no flicker */ if (XR) ghost(dm); grp.add(dm); }
      if (x.built.inlay.length) grp.add(mesh(G.layerGeos(x.built.inlay.map((l) => ({ polys: l.polys, z0: l.z0 + (l.tag === 'inlayT' ? 0.02 : -0.02), z1: l.z1 + (l.tag === 'inlayT' ? 0.02 : -0.02) }))), c2));
      x.built.stick.forEach((st) => grp.add(mesh(G.layerGeos(st.layers), c2)));
      const hf = x.key === 'lid' ? (isClam() ? 'lid' : '') : x.key === homePanel() ? 'top' : ''; // the face reads dark, the arms and legs hang from their screws. One group each, so a piece can follow your finger.
      if (hf) { const tz = hf === 'lid' ? 0 : x.built.deckZ + R.LT; if (hf === decoFace()) { r.decoZ = tz; r.decoGrp = grp; r.decoUp = hf === 'lid' ? -1 : 1; }
        (S.deco || []).forEach((q) => { if (onFace(q) !== hf) return; const m = decoMesh(q, tz); m.position.set(q.x, q.y, 0); grp.add(m); r.decoM[q.id] = m; }); }
      if (x.key === homePanel()) portPlugs(r, grp);
      if (x.key === homePanel()) { // parts mounted on the case, and while mounting: a dot on every spot, green free, red blocked
        S.attachedParts.forEach((m) => { if (m.face === 'lid') return; const w = mountAt(m); if (!w || !MOUNTABLE[m.partId]) return; const pm = mesh(mountGeos(m, false), mountBlocked(m) ? 0xd94a3a : 0x2f4a6b); pm.matrixAutoUpdate = false; pm.matrix.makeBasis(new THREE.Vector3(...w.B[0]), new THREE.Vector3(...w.B[1]), new THREE.Vector3(...w.B[2])).setPosition(...w.o); grp.add(pm); });
        if (MV && PORTS[S.xsel]) anchorsOf(pface()).forEach((a) => { const t = { kind: S.xsel, face: pface(), anchor: a }, w = portAt(t); if (!w) return; const why = portBlocked(t), N = PNORM[t.face], dot = new THREE.Mesh(new THREE.SphereGeometry(2.6, 14, 10), new THREE.MeshBasicMaterial({ color: why ? 0xc8412f : 0x2f9a5b }));
          dot.position.set(w.o[0] + N[0] * 3, w.o[1] + N[1] * 3, w.o[2]); grp.add(dot); r.marks.push({ obj: dot, a, why }); });
        else if (MV && mnt().face !== 'lid') anchorsOf(mnt().face).forEach((a) => { const t = { partId: S.xsel, face: mnt().face, anchor: a, mountType: mnt().type }, w = mountAt(t); if (!w) return; const why = mountBlocked(t), dot = new THREE.Mesh(new THREE.SphereGeometry(2.6, 14, 10), new THREE.MeshBasicMaterial({ color: why ? 0xc8412f : 0x2f9a5b }));
          dot.position.set(w.o[0] + w.B[2][0] * 3, w.o[1] + w.B[2][1] * 3, w.o[2] + w.B[2][2] * 3); grp.add(dot); r.marks.push({ obj: dot, a, why }); });
      }
      if (x.key === 'lid' && isClam()) { // parts on the outside of the lid ride with the lid
        S.attachedParts.forEach((m) => { if (m.face !== 'lid' || !MOUNTABLE[m.partId]) return; const w = mountAt(m); if (!w) return; const pm = mesh(mountGeos(m, false), mountBlocked(m) ? 0xd94a3a : 0x2f4a6b); pm.matrixAutoUpdate = false; pm.matrix.makeBasis(new THREE.Vector3(...w.B[0]), new THREE.Vector3(...w.B[1]), new THREE.Vector3(...w.B[2])).setPosition(...w.o); grp.add(pm); });
        if (MV && !PORTS[S.xsel] && mnt().face === 'lid') anchorsOf('lid').forEach((a) => { const t = { partId: S.xsel, face: 'lid', anchor: a, mountType: mnt().type }, w = mountAt(t); if (!w) return; const why = mountBlocked(t), dot = new THREE.Mesh(new THREE.SphereGeometry(2.6, 14, 10), new THREE.MeshBasicMaterial({ color: why ? 0xc8412f : 0x2f9a5b }));
          dot.position.set(w.o[0], w.o[1], -3); grp.add(dot); r.marks.push({ obj: dot, a, why }); });
      }
      // stand ins for the parts so you can read it
      const parts = x.key === 'lid' ? itemsOn('lid') : itemsOn(x.key);
      const top = x.built.deckZ + R.LT, lid = x.key === 'lid';
      parts.concat(lid ? [] : S.items.filter((i) => i.panel === 'inside')).forEach((it) => {
        const P = PP(it); if (!P) return; const px0 = lid ? d.W - it.x : it.x, py0 = lid ? d.D - it.y : it.y, rq = ((it.r || 0) + (lid ? 2 : 0)) % 4;
        const f = fp(it), ins = it.panel === 'inside', dep = ins ? P.depth + 2 : P.depth + (P.up || 0);
        r.slots[it.id] = { grp, x: px0, y: py0, z: ins ? R.F + riserOf(it) + P.depth / 2 : top - P.depth / 2 + (P.up || 0) / 2, w: f.w, h: f.h, dep };
        if (P.board) { const bw = rq % 2 ? P.h : P.w, bh = rq % 2 ? P.w : P.h, pl = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 1.6), new THREE.MeshStandardMaterial({ color: 0x2f7a4b })); pl.position.set(px0, py0, top - R.LT - (P.hang || 6) - 0.8); grp.add(pl); return; } /* her board, inside under the top */
        if (ins) { const im = insideMesh(it, P, px0, py0, rq); grp.add(im); r.ins[it.id] = { m: im }; return; }
        if (P.depth > 0) { const bw = rq % 2 ? f.h : f.w, bh = rq % 2 ? f.w : f.h, bd = new THREE.Mesh(new THREE.BoxGeometry(Math.max(2, Math.min(bw, P.w || bw)), Math.max(2, Math.min(bh, P.h || bh)), P.depth), new THREE.MeshStandardMaterial({ color: hwColor(it, P), roughness: .7 })); bd.position.set(px0, py0, top - R.LT - P.depth / 2 - 0.2); grp.add(bd); } /* its body under the top: seen in X-Ray */
        const m = standIn(P, px0, py0, rq, top); if (m) { grp.add(m); m.userData.z0 = m.position.z; m.children.forEach((ch) => { ch.userData.z0 = ch.position.z; }); }
        r.ctl[it.id] = { m, grp, x: px0, y: py0, top, up: P.up || 2, w: f.w, h: f.h, c: P.cut || {}, rq }; /* PLAY: tap it on the case */
        if (m && (P.screen || ((P.cut || {}).o === 'rect' && P.isScreen))) r.scrM.push(m); if (m && (it.type === 'led5' || it.type === 'ring12')) r.leds.push({ m, ring: it.type === 'ring12' });
        // a board measured from a photo: every tagged part gets its stand-in too
        const a = rq * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
        (P.userCuts || []).forEach((u) => { const K = CZ.PARTS[u.kind] || {}, mm = standIn({ cut: u.cut, up: K.up, isScreen: u.kind === 'screen' }, px0 + u.x * ca - u.y * sa, py0 + u.x * sa + u.y * ca, rq, top); if (mm) grp.add(mm); });
      });
      if (!lid) wirePreview(grp, r.slots, parts, top);
      if (x.key === 'lid' && DF === 'top') return; /* adding to the inside: the lid is out of the way */
      if (x.key === 'lid') {
        // place the lid: turn it 180 about z so its hinge edge faces the base, then fold it up about the hinge axis
        const bk = S.style === 'small' ? (S.hside === 'right' ? 'right' : 'left') : 'back', gap = R.KR + 0.6;
        const inner = new THREE.Group(); inner.add(grp);
        if (bk === 'back') { grp.position.set(-d.W / 2, -(d.D + gap), -h.Hl); grp.rotation.set(0, 0, 0); inner.rotation.z = Math.PI; }
        else if (bk === 'left') { grp.position.set(gap, -d.D / 2, -h.Hl); inner.rotation.z = Math.PI; }
        else { grp.position.set(-(d.W + gap), -d.D / 2, -h.Hl); inner.rotation.z = Math.PI; }
        const hinge = new THREE.Group(); hinge.add(inner);
        const A = (OPEN ? 110 : 0) * Math.PI / 180; // opening angle: 0 closed, 180 flat
        if (bk === 'back') { hinge.position.set(d.W / 2, d.D + gap, h.H); hinge.rotation.x = Math.PI - A; }
        else if (bk === 'left') { hinge.position.set(-gap, d.D / 2, h.H); hinge.rotation.y = Math.PI - A; }
        else { hinge.position.set(d.W + gap, d.D / 2, h.H); hinge.rotation.y = -(Math.PI - A); }
        r.root.add(hinge);
      } else r.root.add(grp);
    });
    const CHP = S.style === 'face' && !D3 && !MV && !XR, CT = CHP ? charCache().tall : 0; /* Character Base: the character stands on it */
    r.head = null; if (CHP) { const cg = charGroup(); cg.position.set(d.W / 2, d.D / 2, h.H - 0.1); r.root.add(cg); const hs = S.items.find((i) => i.head || (i.panel === 'inside' && i.type === (recipe() || {}).headScreen)), sc = cg.userData.scr || []; if (hs && sc.length) r.head = { id: hs.id, scr: sc }; } /* the head OLED: lit blue when picked, PLAY draws on it */
    const UPR = UPRIGHT[S.style]; r.root.rotation.x = UPR ? 0 : -Math.PI / 2; r.root.position.set(-d.W / 2, 0, UPR ? -h.H / 2 : d.D / 2); /* upright: stands on its front edge, the plate facing you */
    r.fit = () => {
      const dk = deco3d(), hh = dk && decoFace() === 'lid' ? h.H + h.Hl : h.H, lm = dk && (S.deco || []).some(isLimb) ? 62 : 0, rad = dk ? Math.hypot(d.W + lm, d.D + lm, hh) / 2 * 1.06 : Math.hypot(d.W, d.D, h.H + h.Hl + CT + (OPEN ? d.D : 0)) / 2, v = r.camera.fov * Math.PI / 360, hz = Math.atan(Math.tan(v) * r.camera.aspect), dist = rad / Math.sin(Math.min(v, hz)) * (r.mode === 'mini' ? 1.0 : 1.15);
      r.controls.target.set(0, UPRIGHT[S.style] ? d.D / 2 : CT ? (h.H + CT) / 2 : dk ? hh / 2 : (h.H + (isClam() && OPEN ? d.D * 0.4 : h.Hl)) / 2, lm ? 16 : 0);
      // in Style, turn to the side being decorated: the lid's outside faces the back when it is open, the bottom faces down
      const f = S.step === 3 && curTab() !== 'colors' ? curFace() : 'top', MD = { plate: [0.3, 0.95, 0.45], lid: [0.3, 0.95, 0.45], back: [0.35, 0.55, -0.85], front: [0.35, 0.55, 0.85], left: [-0.9, 0.5, 0.35], right: [0.9, 0.5, 0.35], bottom: [0.35, -0.85, 0.6] }, MDU = { plate: [0.3, 0.25, 0.95], front: [0.35, -0.85, 0.45], back: [0.35, 0.9, -0.3], left: [-0.9, 0.35, 0.4], right: [0.9, 0.35, 0.4], bottom: [0.35, 0.3, -0.9] }, dir = S.step === 5 && T3 && T3.head && simKind() === 'deskbot' ? [0.12, 0.3, 1] /* PLAY: face the Desk-Bot so its OLED eyes look at you */ : play3d() ? (UPRIGHT[S.style] ? [0, 0.08, 1] : [0, 1, 0.08]) : UPRIGHT[S.style] ? (MV ? MDU[PORTS[S.xsel] ? pface() : mnt().face] : [0.45, 0.3, 0.85]) : MV ? MD[PORTS[S.xsel] ? pface() : mnt().face] : dk ? [0, 1, 0.5] : WALLF[f] ? MD[f] : f === 'lidout' && isClam() ? [0.2, 1, 0.55] : f === 'bottom' ? [0.4, -0.85, 0.6] : [0.45, 0.7, 0.8];
      r.camera.position.copy(new THREE.Vector3(dir[0], dir[1], dir[2]).normalize().multiplyScalar(dist)).add(r.controls.target); r.controls.update();
    };
    const limbs = (S.deco || []).some(isLimb) + DF, stay = D3 && r.view === 'bigdeco' && r.hadLimb === limbs; r.hadLimb = limbs; /* you turned the case to reach a spot: adding or dropping a piece must not turn it back */
    r.mode = mode; r.view = mode + (play3d() ? 'play' : S.step === 5 ? 's5' : '') + (D3 ? 'deco' : S.step === 3 ? curFace() + curTab() : '') + (MV ? 'm' + (PORTS[S.xsel] ? pface() : mnt().face) : ''); if (!stay) r.fit();
  }
  r.controls.enabled = !isMini && !play3d(); /* PLAY: locked top-down, so a tap is always a press */
  const view = mode + (play3d() ? 'play' : S.step === 5 ? 's5' : '') + (D3 ? 'deco' : S.step === 3 ? curFace() + curTab() : '') + (MV ? 'm' + (PORTS[S.xsel] ? pface() : mnt().face) : '');
  if (r.mode !== mode || r.view !== view) { r.mode = mode; r.view = view; r.fit(); }
  setHighlight(r); blueSel(r); decoMark(); playPaint(r);
  r.draw();
  if (isMini) return;
  if (D3) { tag((S.deco || []).length ? 'Drag a piece to move it. Drag the empty space to spin.' : 'Drag a piece from below onto your case'); $('sb').hidden = true; $('sb').innerHTML = ''; return; }
  if (play3d()) tag('Tap any button, pad, knob or wheel on your case.'); else tag(MV ? 'Tap a green dot to ' + (PORTS[S.xsel] ? 'cut the ' : 'mount the ') + xname(S.xsel).toLowerCase() + '. Red is blocked.' : summaryLine());
  const sb = $('sb'), flat = BIG3D && !native3d();
  sb.innerHTML = (flat ? '<button type="button" id="flatBtn" aria-pressed="true">Back to flat</button>' : '') + (isClam() && !lidTop ? '<button type="button" id="openBtn">' + (S.open ? 'Close it' : 'Open it') + '</button>' : '');
  sb.hidden = !sb.innerHTML; const ob = $('openBtn'); if (ob) ob.onclick = () => { S.open = !S.open; save(); render(); };
  const fb = $('flatBtn'); if (fb) fb.onclick = () => { BIG3D = false; render(); };
}

function makeKids(it, P) { // the parts tagged on the photo, each its own item on the board
  const kids = (P.kids || []).slice();
  if (!kids.some((c) => CZ.PARTS[c.type] && CZ.PARTS[c.type].cat === 'brain') && P.brain && CZ.PARTS[P.brain]) kids.push({ type: P.brain, x: 0, y: 0, r: 0 });
  kids.forEach((c) => { if (!CZ.PARTS[c.type]) return; S.items.push({ id: ++uid, type: c.type, panel: CZ.PARTS[c.type].cat === 'brain' ? 'inside' : it.panel === 'inside' ? homePanel() : it.panel, of: it.id, dx: c.x, dy: c.y, dr: c.r || 0, x: 0, y: 0, r: 0 }); });
  syncKids(it);
}
function addBoard(P, replace) {
  if (replace) { S.items = S.items.filter((i) => PP(i) && PP(i).cat === 'mine'); S.pins = {}; sel = null; }
  const alone = !S.items.length && !!P.board && !isPanel(); /* nothing else in the build: the case gets sized to this board */
  if (alone && !S.picked) { S.style = P.h > P.w * 1.15 ? 'hand' : 'slate'; }
  const k = 'mine' + Date.now().toString(36);
  if (P.board) setBoardTop(P, P.top || 9); /* the top sits so the tallest button pokes through 1.5 mm; 10 mm under the board for pins and solder */
  S.mine[k] = P; S.cat = 'mine'; const it = addPart(k);
  if (P.board) makeKids(it, P);
  const room = 2 * (R.T + R.CLR + 1) + 2 * (R.T + R.CLR + 0.8) + 8;
  if (alone) { // wrap the case around the board, the way it lies in the photo: no turning it sideways
    S.cols = Math.max(2, Math.min(24, Math.ceil((P.w + room) / 20))); S.rows = Math.max(2, Math.min(24, Math.ceil((P.h + room) / 20)));
    for (let n = 0; n < 6; n++) { const d = dims(); it.r = 0; it.x = d.W / 2; it.y = d.D / 2; syncKids(it); if (!problems(it).length) break; if (n % 2 ? S.cols < 24 : S.rows < 24) { if (n % 2) S.cols++; else S.rows++; } }
    if (problems(it).length) { autoPlace(it); syncKids(it); }
    S.xw = S.xd = 0; S.photo = 'off'; /* show the clean parts first; My photo brings the picture back */
  } else if (problems(it).length && !isPanel()) {
    const need = (w, h) => [Math.max(replace ? 2 : S.cols, Math.ceil((w + room) / 20)), Math.max(replace ? 2 : S.rows, Math.ceil((h + room) / 20))];
    const a = need(P.w, P.h), b = need(P.h, P.w), pick = a[0] * a[1] <= b[0] * b[1] ? a : b;
    S.cols = Math.min(24, pick[0]); S.rows = Math.min(24, pick[1]); reflow(); autoPlace(it);
  }
  syncAll(); sel = it.id; S.started = true;
  S.tab[1] = it.panel === 'inside' ? homePanel() : it.panel; save();
  if (alone) go(1); else render(); /* straight to Arrange: the clean parts where the photo had them */
}
let CLEARARM = 0;

// ---------- wiring: which pin each part goes to ----------
const KSHORT = { keypad44: 'Keypad', mat8: 'Matrix', jack35: 'Jack', i2sdac: 'DAC', inmp441: 'Mic', tact12: 'Button', button16: 'Button', arcade24: 'Arcade', arcade30: 'Arcade', dpad: 'D-pad', pot: 'Knob', encoder: 'Wheel', thumb: 'Stick', led5: 'LED', speaker28: 'Speaker' };
function wiringItems() {
  // every part that needs a wire, numbered like the rest of the builder. Parts tagged on a board photo count one by one.
  const N = numbers(), out = []; let AD = null;
  S.items.filter((i) => PP(i) && PP(i).cat !== 'brain').sort((a, b) => String(N[a.id]).localeCompare(String(N[b.id]), undefined, { numeric: true })).forEach((i) => {
    const P = PP(i);
    if (P.userCuts && P.userCuts.length) P.userCuts.forEach((u, ci) => { if (NEED[u.kind]) out.push({ key: i.id + '.' + ci, label: N[i.id] + '.' + (ci + 1) + ' ' + (KSHORT[u.kind] || u.kind), type: u.kind }); });
    else if (NEED[i.type]) out.push({ key: String(i.id), label: N[i.id] + ' ' + P.short + (i.step ? ' (stepped)' : ''), type: i.type, step: i.step ? 1 : 0, id: i.id, action: CTRL(i) ? i.action || (AD || (AD = actDefaults()))[i.id] || 'custom' : undefined });
  });
  if (S.xp && S.xp.ch && S.xp.ch.servo) out.push({ key: 'chservo', label: 'C1 Arm servo', type: 'servo' }); /* the character's motorized arm is wired like any servo */
  return out;
}
const BRAIN_NAMES = { pico: 'Raspberry Pi Pico', picow: 'Raspberry Pi Pico W', pico2: 'Raspberry Pi Pico 2', esp32: 'ESP32', other: 'your board brain' };
function brainInfo() {
  // the brain can be a part from the list, or the one she said is on her photographed board
  const b = S.items.find((i) => PP(i) && PP(i).cat === 'brain'); if (b) return { type: b.type, name: PP(b).name };
  const m = S.items.find((i) => PP(i) && PP(i).brain && PP(i).brain !== 'none'); if (m) return { type: PP(m).brain, name: BRAIN_NAMES[PP(m).brain] + ' (on your board)' };
  return null;
}
// ---------- Wiring map: the whole plan as one drawing. Test it: the parts act out what code.py does ----------
const WCOL = ['#2f6fdb', '#c9a200', '#2f9a5b'], PWRNET = ['3V3', 'VBUS', 'VSYS', 'VIN', '5V', 'RAW', 'VCC'], netCol = (net, i) => (PWRNET.indexOf(net) > -1 ? '#d23b2a' : net === 'GND' ? '#1a1a1a' : WCOL[i % 3]);
function powerMapItems() { const m = pwrMode(); if (!m || m === 'usb') return []; const pl = pwrPlan(); if (!pl.wires.length) return []; return [{ row: { it: { id: null, label: (pl.pack ? G.PACKS[pl.pack][0] : 'Battery') + ' ' + pl.volts + 'V' } }, pads: pl.wires, side: BRDX().left.indexOf(pl.pin) > -1 ? 'L' : 'R' }]; }
function mapWhy() { const bi = brainInfo(); if (!BRD()) return 'The map and the test do not know the pins of the ' + bi.name + ' yet.'; if (!wiring().rows.length && !powerMapItems().length) return 'Add buttons, knobs, screens, sensors or lights in Electronics first.'; return ''; }
function pcx(e) { const r = cv.getBoundingClientRect(), k = cv.width / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; }
let MAPHITS = [];
function drawMap(W, H) {
  MAPHITS = []; const d = px(), w = wiring(), rows = w.rows, bi = brainInfo(); g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, W, H);
  const pwrIt = powerMapItems(); if (!rows.length && !pwrIt.length) { g.fillStyle = '#6f6a60'; g.font = '800 ' + 14 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; g.fillText('Add parts to see the wiring map', W / 2, H / 2); tag('Wiring map'); return; }
  const B = BRDX(), BL = B.left, BRr = B.right, nr = Math.max(BL.length, BRr.length), bw = Math.min(W * 0.2, 96 * d), top = 28 * d, bh = H - top - 40 * d, bx = W / 2 - bw / 2, step = bh / nr, gnd = (side) => (side === 'L' ? BL : BRr).map((p, i) => (p === 'GND' ? i : -1)).filter((i) => i > -1);
  const pinAt = (net0, side, yNear) => { const net = netName(net0); let i = BL.indexOf(net); if (i > -1 && net !== 'GND') return ['L', i]; i = BRr.indexOf(net); if (i > -1 && net !== 'GND') return ['R', i]; if (net === 'GND') { const list = gnd(side).length ? gnd(side) : gnd(side === 'L' ? 'R' : 'L'); side = gnd(side).length ? side : side === 'L' ? 'R' : 'L'; const iy = list.reduce((a, c) => (Math.abs(top + (c + 0.5) * step - yNear) < Math.abs(top + (a + 0.5) * step - yNear) ? c : a), list[0]); return list.length ? [side, iy] : null; } return null; };
  const pxy = (sd, i) => [sd === 'L' ? bx : bx + bw, top + (i + 0.5) * step];
  g.fillStyle = '#2f7a4b'; g.beginPath(); g.roundRect ? g.roundRect(bx, top, bw, bh, 8 * d) : g.rect(bx, top, bw, bh); g.fill();
  g.fillStyle = '#fff'; g.font = '800 ' + 11 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; g.fillText(bmini(B.name).slice(0, 14), W / 2, top + bh / 2);
  g.font = '700 ' + Math.min(9 * d, step * 0.62) + 'px -apple-system,Arial';
  for (let i = 0; i < nr; i++) { const yl = top + (i + 0.5) * step; g.textAlign = 'left'; g.fillStyle = '#e8f3ec'; if (BL[i]) g.fillText(BL[i], bx + 4 * d, yl + 3 * d); g.textAlign = 'right'; if (BRr[i]) g.fillText(BRr[i], bx + bw - 4 * d, yl + 3 * d); g.fillStyle = '#d9c46a'; if (BL[i]) g.fillRect(bx - 2 * d, yl - 1.5 * d, 4 * d, 3 * d); if (BRr[i]) g.fillRect(bx + bw - 2 * d, yl - 1.5 * d, 4 * d, 3 * d); }
  const items = rows.map((row) => { const pads = padsFor(row), gl = pads.filter((p) => p[1] !== 'GND' && p[1] !== '3V3' && p[1] !== 'VBUS' && p[1] !== B.v5 && p[1] !== B.v3).map((p) => BL.indexOf(p[1]) > -1 ? -1 : 1).reduce((a, c) => a + c, 0); return { row, pads, side: gl > 0 ? 'R' : 'L' }; }).concat(pwrIt);
  ['L', 'R'].forEach((sd) => { const list = items.filter((x) => x.side === sd); if (!list.length) return; const lh = 11 * d, need = list.reduce((a, x) => a + 16 * d + x.pads.length * lh, 0) + 6 * d * (list.length - 1), k = Math.min(1, bh / need), colW = (sd === 'L' ? bx : W - bx - bw) - 70 * d, x0 = sd === 'L' ? 8 * d : bx + bw + 62 * d; let y = top + Math.max(0, (bh - need * k) / 2), lane = 0;
    list.forEach((it) => { const h = (16 * d + it.pads.length * lh) * k, lit = it.row.it.id != null && it.row.it.id === HL; g.fillStyle = lit ? '#fdeeea' : '#fff'; g.strokeStyle = lit ? '#c8412f' : '#1a1a1a'; g.lineWidth = (lit ? 3.5 : 1.5) * d; g.beginPath(); g.rect(x0, y, Math.max(40 * d, colW), h); g.fill(); g.stroke(); MAPHITS.push({ id: it.row.it.id, x: x0, y, w: Math.max(40 * d, colW), h });
      g.fillStyle = '#1a1a1a'; g.font = '800 ' + 10 * d * Math.max(0.7, k) + 'px -apple-system,Arial'; g.textAlign = sd === 'L' ? 'left' : 'right'; g.fillText(it.row.it.label.slice(0, 18), sd === 'L' ? x0 + 4 * d : x0 + Math.max(40 * d, colW) - 4 * d, y + 11 * d * k);
      it.pads.forEach(([lbl, net], j) => { const py = y + (15 * d + (j + 0.5) * lh) * k, ex = sd === 'L' ? x0 + Math.max(40 * d, colW) : x0, at = pinAt(net, sd, py); g.font = '700 ' + 8.5 * d * Math.max(0.7, k) + 'px -apple-system,Arial'; g.fillStyle = '#6f6a60'; g.textAlign = sd === 'L' ? 'right' : 'left'; g.fillText(lbl, sd === 'L' ? ex - 3 * d : ex + 3 * d, py + 3 * d);
        if (!at) return; const [qx, qy] = pxy(at[0], at[1]), lx = sd === 'L' ? bx - 10 * d - (lane % 10) * 4 * d : bx + bw + 10 * d + (lane % 10) * 4 * d; lane++;
        g.strokeStyle = netCol(net, lane); g.lineWidth = 2 * d; g.beginPath(); g.moveTo(ex, py); g.lineTo(lx, py); g.lineTo(lx, qy); g.lineTo(qx, qy); g.stroke();
        if (it.pads[j][2] === 'sw') { const sx = (ex + lx) / 2, sw = 22 * d, sh = 9 * d; g.fillStyle = '#fff'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.5 * d; g.beginPath(); g.rect(sx - sw / 2, py - sh / 2, sw, sh); g.fill(); g.stroke(); g.fillStyle = '#1a1a1a'; g.font = '800 ' + 6.5 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; g.fillText('ON/OFF', sx, py + 2.3 * d); } }); /* the On/Off switch sits in the red wire */
      y += h + 6 * d * k; }); });
  tag(rows.length + ' parts wired to the ' + (bi ? bi.name : 'brain') + (w.problems.length ? '. ' + w.problems[0] : ''));
}
const TEST = { text: 'Ready', led: false, ring: false, angle: null, lamp: false, val: {}, last: {}, pos: {}, pir: {}, dist: {}, cam: null, log: [], hits: [], drag: null, held: null, ac: null, osc: null };
function testReset() { clearInterval(TEST.tick); synthOff(); sAllOff(); TEST.sm = null; TEST.mx = null; TEST.tm = null; TEST.note = null; TEST.tr = 0; TEST.bpm = 120; TEST.dj = null; djStop(); Object.assign(TEST, { text: 'Ready', led: false, ring: false, angle: null, lamp: false, val: {}, last: {}, pos: {}, pir: {}, dist: {}, cam: null, log: [], drag: null, held: null }); toneOff(); }
function testLog(s) { TEST.log.unshift(s); TEST.log.length = Math.min(TEST.log.length, 40); const el = $('tlog'); if (el) el.innerHTML = TEST.log.map((l) => '<div class="it" style="padding:5px 8px">' + esc(l) + '</div>').join(''); }
function tone(f) { try { if (!TEST.ac) TEST.ac = new (window.AudioContext || window.webkitAudioContext)(); toneOff(); const o = TEST.ac.createOscillator(), gn = TEST.ac.createGain(); o.type = 'square'; o.frequency.value = f; gn.gain.value = 0.06; o.connect(gn).connect(TEST.ac.destination); o.start(); TEST.osc = o; if (typeof auHot === 'function') auHot(); setTimeout(() => { if (TEST.osc === o) toneOff(); }, 600); } catch (e) { TEST.osc = null; } }
function toneOff() { if (TEST.osc) { try { TEST.osc.stop(); } catch (e) {} TEST.osc = null; } }
function testModel() { // the parts as code.py sees them: keys in the order KEYS lists them, knobs, wheels, outputs, sensors
  const plan = wiring(), m = { keys: [], pots: [], encs: [], outs: [], pirs: [], tofs: [], cams: [], screen: null };
  plan.rows.forEach((row) => { const it = row.it, tag = it.label.split(' ')[0], N = row.N, Rr = {}; row.roles.forEach((r) => { Rr[r.role] = r.pin; });
    if (N.what === 'motion') { m.pirs.push({ tag, pin: Rr.out, label: it.label }); return; } if (N.what === 'distance') { m.tofs.push({ tag, label: it.label }); return; } if (N.what === 'camera') { m.cams.push({ tag, label: it.label }); return; }
    if (N.spi || N.i2c) { if (!m.screen) m.screen = { label: it.label }; return; }
    if (N.what === 'keypad') { (recipeFn() === 'sampler' ? SAMPK : PADK).forEach((name, j) => m.keys.push({ name, pin: Rr['row' + (Math.floor(j / 4) + 1)], col: Rr['col' + (j % 4 + 1)], label: it.label, btn: true, pad: j, id: it.id })); return; } /* code.py: KeyMatrix numbers the keys row by row */
    if (N.what === 'matrix8') { m.outs.push({ what: 'matrix8', pin: Rr.din, tag, label: it.label }); return; }
    if (N.what === 'i2sout') { m.outs.push({ what: 'sound', pin: Rr['bclk+lrc'], tag, label: it.label }); return; }
    if (N.what === 'i2sin' || N.what === 'jack' || !row.roles.length) return;
    if (N.what === 'button' && it.step && row.roles.length === 1) { m.pots.push({ name: tag, pin: row.roles[0].pin, label: it.label, kind: 'step', id: it.id }); return; } /* code.py: Stepper(), read like a knob */
    if (N.what === 'button') row.roles.forEach((r) => m.keys.push({ name: row.roles.length > 1 ? tag + ' ' + r.role : tag, pin: r.pin, label: it.label, btn: true, id: it.id }));
    if (N.what === 'knob') ['turn', 'slide'].forEach((k) => { if (Rr[k] != null) m.pots.push({ name: tag, pin: Rr[k], label: it.label, kind: 'knob', id: it.id }); });
    if (N.what === 'stick') { if (Rr.x != null) m.pots.push({ name: tag + ' x', pin: Rr.x, label: it.label, kind: 'x' }); if (Rr.y != null) m.pots.push({ name: tag + ' y', pin: Rr.y, label: it.label, kind: 'y' }); if (Rr.press != null) m.keys.push({ name: tag + ' press', pin: Rr.press, label: it.label }); }
    if (N.what === 'wheel') { m.encs.push({ name: tag, pin: Rr['clk+dt'], label: it.label, id: it.id }); if (Rr.press != null) m.keys.push({ name: tag + ' press', pin: Rr.press, label: it.label }); }
    if (['led', 'ring', 'sound', 'servo'].indexOf(N.what) > -1) m.outs.push({ what: N.what, pin: row.roles[0].pin, tag, label: it.label }); });
  return m;
}
function show(m, t) { if (m.screen || recipeFn()) { TEST.text = t; return m.screen ? ' -> screen: "' + t + '"' : ' -> "' + t + '"'; } return ''; }
const MACRO = [['C', 'copy'], ['V', 'paste'], ['Z', 'undo'], ['PLAY', 'play/pause']], SCALE = [262, 294, 330, 349, 392, 440, 494, 523], NOTE = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
const clock = (r) => String(Math.floor(r / 60)).padStart(2, '0') + ':' + String(r % 60).padStart(2, '0');
function synthOn(f) { try { if (!TEST.ac) TEST.ac = new (window.AudioContext || window.webkitAudioContext)(); if (!TEST.sy) { const o = TEST.ac.createOscillator(), gn = TEST.ac.createGain(); o.type = 'square'; gn.gain.value = 0.05; o.connect(gn).connect(TEST.ac.destination); o.start(); TEST.sy = o; } TEST.sy.frequency.value = Math.max(20, f); } catch (e) { TEST.sy = null; } }
function synthOff() { clearInterval(TEST.arp); TEST.arp = null; if (TEST.sy) { try { TEST.sy.stop(); } catch (e) {} TEST.sy = null; } }
const SAMPK = ['Pad 1', 'Pad 2', 'Pad 3', 'Mode', 'Pad 4', 'Pad 5', 'Pad 6', 'Bank', 'Pad 7', 'Pad 8', 'Pad 9', 'Record', 'Pad 10', 'Pad 11', 'Pad 12', 'Stop'], PADK = ['1', '2', '3', 'A', '4', '5', '6', 'B', '7', '8', '9', 'C', '*', '0', '#', 'D'];
const PAD_OF = [0, 1, 2, null, 3, 4, 5, null, 6, 7, 8, null, 9, 10, 11, null], SMODES = ['Chopper', 'Drum', 'Ambient'];
// the Voice Sampler, like its code.py: a pad plays a sound in the mode, the knobs move pitch and effect live, the 8x8 matrix lights the pad
const sNote = (SM, n) => (SM.mode === 1 ? 36 + n : 48 + SM.bank * 12 + n), sHz = (SM, n) => 440 * Math.pow(2, (sNote(SM, n) - 69 + SM.pitch) / 12);
function sLights(SM, n) { const L = new Array(64).fill(0); if (n != null) { const x = (n % 4) * 2, y = Math.floor(n / 4) * 2; [0, 1].forEach((dx) => [0, 1].forEach((dy) => { L[(y + dy) * 8 + x + dx] = 1; })); } for (let i = 0; i < Math.floor(SM.eff * 8 / 101) + 1; i++) L[56 + i] = 1; return L; }
function sPlay(SM, n) { try { const ac = TEST.ac || (TEST.ac = new (window.AudioContext || window.webkitAudioContext)()), now = ac.currentTime, g = ac.createGain(); g.connect(ac.destination);
    if (SM.mode === 1) { const len = Math.floor(ac.sampleRate * 0.4), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0), k = len * (0.06 + SM.eff / 500); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / k); const src = ac.createBufferSource(); src.buffer = buf; src.playbackRate.value = Math.pow(2, SM.pitch / 12) * (0.6 + n * 0.08); g.gain.value = 0.25 * (SM.level || 1); src.connect(g); src.start(); return { src, g, n }; }
    const o = ac.createOscillator(); o.type = SM.mode === 0 ? 'sawtooth' : 'sine'; o.frequency.value = sHz(SM, n); o.connect(g); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.07 * (SM.level || 1), now + (SM.mode === 2 ? 0.3 : 0.003)); if (SM.mode === 0) g.gain.setTargetAtTime(0.035 * (SM.level || 1), now + 0.003, 0.02 + SM.eff / 2000); o.start(); return { o, g, n }; } catch (e) { return null; } }
function sStop(SM, v) { if (!v || !TEST.ac) return; const now = TEST.ac.currentTime; try { v.g.gain.cancelScheduledValues(now); v.g.gain.setTargetAtTime(0, now, SM && SM.mode === 2 ? 0.1 + SM.eff / 200 : 0.03); if (v.o) v.o.stop(now + 3); } catch (e) {} }
function sAllOff() { Object.keys(TEST.sv || {}).forEach((k) => sStop(TEST.sm, TEST.sv[k])); TEST.sv = {}; }
function sampler(m, h, down) {
  const SM = TEST.sm || (TEST.sm = { mode: 0, bank: 0, rec: false, pitch: 0, eff: 50, scrub: 50, level: 1 }); TEST.sv = TEST.sv || {}; if (!TEST.mx) TEST.mx = sLights(SM, null);
  if (h.kind === 'key') { const k = m.keys[h.i]; if (k.pad == null) return null; const name = SAMPK[k.pad], n = PAD_OF[k.pad], at = 'row ' + LABP(k.pin) + ' x col ' + LABP(k.col);
    if (n != null && down) { TEST.held = h; TEST.lamp = true; sStop(SM, TEST.sv[n]); TEST.sv[n] = sPlay(SM, n); TEST.mx = sLights(SM, n); TEST.text = name + ' . ' + SMODES[SM.mode]; return name + ' pressed (' + at + ') -> ' + SMODES[SM.mode] + ' sound ' + Math.round(sHz(SM, n)) + ' Hz -> USB MIDI note ' + sNote(SM, n) + ' on'; }
    if (n != null) { TEST.held = null; TEST.lamp = false; sStop(SM, TEST.sv[n]); delete TEST.sv[n]; return name + ' released -> MIDI note ' + sNote(SM, n) + ' off'; }
    if (!down) { TEST.held = null; TEST.lamp = false; return ''; } TEST.held = h; TEST.lamp = true;
    if (name === 'Mode') { SM.mode = (SM.mode + 1) % 3; TEST.text = 'Mode: ' + SMODES[SM.mode]; return 'Mode pressed (' + at + ') -> ' + SMODES[SM.mode]; }
    if (name === 'Bank') { SM.bank = (SM.bank + 1) % 4; TEST.text = 'Bank ' + 'ABCD'[SM.bank]; return 'Bank pressed -> bank ' + 'ABCD'[SM.bank] + ' (notes from ' + (48 + SM.bank * 12) + ')'; }
    if (name === 'Record') { SM.rec = !SM.rec; TEST.text = SM.rec ? 'REC' : 'Rec off'; return 'Record pressed -> ' + (SM.rec ? 'recording armed' : 'recording off'); }
    sAllOff(); TEST.mx = sLights(SM, null); TEST.text = 'Stop'; return 'Stop pressed -> every sound off'; }
  const retune = () => Object.keys(TEST.sv).forEach((n) => { const vo = TEST.sv[n]; if (!vo) return; if (vo.o) vo.o.frequency.setValueAtTime(sHz(SM, +n), TEST.ac.currentTime); if (vo.src) vo.src.playbackRate.value = Math.pow(2, SM.pitch / 12) * (0.6 + n * 0.08); });
  if (h.kind === 'enc' && h.i < 2) { const e = m.encs[h.i]; TEST.pos[h.i] = (TEST.pos[h.i] || 0) + h.dir;
    if (h.i === 0) { SM.pitch = Math.max(-12, Math.min(12, SM.pitch + h.dir)); retune(); TEST.text = 'Pitch ' + (SM.pitch > 0 ? '+' : '') + SM.pitch; return e.name + ' (Pitch) turned ' + (h.dir > 0 ? 'right' : 'left') + ' -> pitch ' + (SM.pitch > 0 ? '+' : '') + SM.pitch + ' semitones, MIDI CC 16'; }
    SM.eff = Math.max(0, Math.min(100, SM.eff + 5 * h.dir)); TEST.mx = sLights(SM, null); TEST.text = 'Effect ' + SM.eff; return e.name + ' (Effect) turned ' + (h.dir > 0 ? 'right' : 'left') + ' -> effect ' + SM.eff + ', sounds ring ' + (SM.eff > 50 ? 'longer' : 'shorter') + ', MIDI CC 74'; }
  if (h.kind === 'pot') { const p = m.pots[h.i], v = TEST.val[h.i] || 0; if (Math.abs(v - (TEST.last[h.i] == null ? -10 : TEST.last[h.i])) < 2) return ''; TEST.last[h.i] = v; const kn = m.pots.filter((q) => q.kind === 'knob').indexOf(p);
    if (kn === 0) { SM.pitch = Math.floor(v * 24 / 100) - 12; Object.keys(TEST.sv).forEach((n) => { const vo = TEST.sv[n]; if (!vo) return; if (vo.o) vo.o.frequency.setValueAtTime(sHz(SM, +n), TEST.ac.currentTime); if (vo.src) vo.src.playbackRate.value = Math.pow(2, SM.pitch / 12) * (0.6 + n * 0.08); }); TEST.text = 'Pitch ' + (SM.pitch > 0 ? '+' : '') + SM.pitch; return p.name + ' (Pitch) -> ' + LABP(p.pin) + ' reads ' + v + ' -> pitch ' + (SM.pitch > 0 ? '+' : '') + SM.pitch + ' semitones, MIDI CC 16'; }
    if (kn === 1) { SM.eff = v; TEST.mx = sLights(SM, null); TEST.text = 'Effect ' + v; return p.name + ' (Effect) -> ' + LABP(p.pin) + ' reads ' + v + ' -> sounds ring ' + (v > 50 ? 'longer' : 'shorter') + ', MIDI CC 74'; }
    if (p.kind === 'y') { SM.level = 0.2 + v * 0.8 / 100; Object.keys(TEST.sv).forEach((n) => { const vo = TEST.sv[n]; if (vo) vo.g.gain.setTargetAtTime((vo.src ? 0.25 : 0.07) * SM.level, TEST.ac.currentTime, 0.02); }); TEST.text = 'Level ' + v; return p.name + ' (Level) -> ' + LABP(p.pin) + ' reads ' + v + ' -> pad volume ' + Math.round(SM.level * 100) + '%, MIDI CC 2'; }
    if (p.kind === 'x') { SM.scrub = v; TEST.text = 'Scrub ' + v + '%'; return p.name + ' (Scrub) -> ' + LABP(p.pin) + ' reads ' + v + ' -> MIDI CC 1'; }
    return ''; }
  return null;
}
function presetAct(fn, m, h, down) {
  if (fn === 'sampler') return sampler(m, h, down); // the starters' own programs, step for step like their code.py
  const T = TEST.tm || (TEST.tm = { min: 25, rem: 25 * 60, run: false, at: 0 }), st = Math.max(0, m.keys.findIndex((k) => k.btn));
  if (fn === 'macro' && h.kind === 'key') { const k = m.keys[h.i]; if (!down) { TEST.lamp = false; TEST.held = null; return k.name + ' released -> GP' + k.pin + ' HIGH'; } TEST.lamp = true; TEST.held = h; const sc = MACRO[h.i], txt = sc ? (sc[0] === 'PLAY' ? 'Play/Pause' : 'Ctrl+' + sc[0] + ' (' + sc[1] + ')') : k.name; TEST.text = txt; return k.name + ' pressed -> GP' + k.pin + ' LOW -> the computer gets ' + txt; }
  if (fn === 'timer') {
    if (h.kind === 'key' && h.i === st) { if (down) { T.at = Date.now(); TEST.held = h; return ''; } TEST.held = null; const k = m.keys[h.i];
      if (Date.now() - T.at >= 1000) { T.run = false; T.rem = T.min * 60; clearInterval(TEST.tick); TEST.text = clock(T.rem); return k.name + ' held 1 s -> timer reset -> ' + clock(T.rem); }
      T.run = !T.run; clearInterval(TEST.tick); if (T.run) TEST.tick = setInterval(() => { T.rem -= 1; TEST.text = clock(T.rem); if (T.rem <= 0) { clearInterval(TEST.tick); T.run = false; TEST.text = '00:00 done!'; testLog('00:00 -> speaker beeps 3 times at 880 Hz'); [0, 250, 500].forEach((t) => setTimeout(() => tone(880), t)); T.rem = T.min * 60; } if (S.step === 5 && curTab() === 'test') draw(); }, 1000);
      TEST.text = T.run || T.rem === T.min * 60 ? clock(T.rem) : clock(T.rem) + ' paused'; return k.name + ' pressed -> ' + LABP(k.pin) + ' -> timer ' + (T.run ? 'running' : 'paused') + ' at ' + clock(T.rem); }
    if (h.kind === 'enc' && !T.run) { T.min = Math.max(1, Math.min(99, T.min + h.dir)); T.rem = T.min * 60; TEST.text = clock(T.rem); return m.encs[h.i].name + ' turned -> ' + T.min + ' minutes -> ' + clock(T.rem); }
    if (h.kind === 'key') return m.keys[h.i].name + (down ? ' pressed' : ' released') + ' (the timer only listens to ' + m.keys[st].name + ')';
    return null;
  }
  if (fn === 'midi' || fn === 'sound') return midiAct(fn, m, h, down);
  if (fn === 'djfx') return djAct(m, h, down);
  if (fn === 'synth') { const freq = () => { const n = TEST.note; return SCALEHZ()[n % 8] * Math.pow(2, Math.floor(n / 8) + (TEST.tr || 0) / 12) * [1, 1.5, 2][m.pots.length > 1 ? TEST.step % 3 : 0]; };
    if (h.kind === 'key' && !m.keys[h.i].btn) { const k = m.keys[h.i]; TEST.held = down ? h : null; if (!down) return ''; TEST.text = k.name; return k.name + ' pressed -> ' + LABP(k.pin) + ' LOW -> screen: "' + k.name + '" (no note)'; } /* a wheel or stick press plays no note, like code.py */
    if (h.kind === 'key') { const k = m.keys[h.i], ni = m.keys.slice(0, h.i).filter((q) => q.btn).length; if (!down) { if (TEST.note === ni) { synthOff(); TEST.note = null; TEST.lamp = false; } TEST.held = null; return k.name + ' released -> sound off'; }
      TEST.held = h; TEST.note = ni; TEST.step = 0; TEST.lamp = true; synthOn(freq()); const f = Math.round(freq()); TEST.text = NOTEN()[ni % 8] + ' ' + f + ' Hz'; if (TW().btn === 'step') setTimeout(() => { if (TEST.note === ni) { synthOff(); TEST.note = null; TEST.lamp = false; draw(); } }, 250);
      clearInterval(TEST.arp); if (m.pots.length > 1) TEST.arp = setInterval(() => { TEST.step++; synthOn(freq()); }, 60000 / (TEST.bpm || 120) / 2);
      return k.name + ' pressed -> ' + LABP(k.pin) + ' LOW -> plays ' + NOTEN()[ni % 8] + ' ' + f + ' Hz' + (TW().btn === 'step' ? ' for a 1/4 note' : ''); }
    if (h.kind === 'pot') { const v = TEST.val[h.i] || 0, p = m.pots[h.i]; if (Math.abs(v - (TEST.last[h.i] == null ? -10 : TEST.last[h.i])) < 2) return ''; TEST.last[h.i] = v;
      if (h.i === 0) { TEST.tr = Math.floor(v * 24 / 100) - 12; if (TEST.note != null) synthOn(freq()); return p.name + (p.kind === 'step' ? ' pressed -> step ' + v / 25 + '/4' : ' turned') + ' -> pitch ' + (TEST.tr > 0 ? '+' : '') + TEST.tr + ' semitones'; }
      if (h.i === 1) { TEST.bpm = 60 + Math.floor(v * 180 / 100); if (TEST.arp) { clearInterval(TEST.arp); TEST.arp = setInterval(() => { TEST.step++; synthOn(freq()); }, 60000 / TEST.bpm / 2); } return p.name + (p.kind === 'step' ? ' pressed -> step ' + v / 25 + '/4' : ' turned') + ' -> tempo ' + TEST.bpm + ' bpm'; } }
    return null;
  }
  return null;
}
// ---------- What should the code do? The preset bar and its tweak pills: Test It, the code view and the saved file all follow them ----------
// ---------- part.action: what each control does. Smart defaults per preset (DJ FX: Loop, Echo, Spiral, Phaser, Beat, Wet/Dry), changed in Test It: tap a part, Function ----------
const CTRL = (it) => { const N = it && NEED[it.type]; return !!N && it.of == null && ['button', 'knob', 'wheel'].indexOf(N.what) > -1; };
function actDefaults(fn) { fn = fn || recipeFn() || 'test'; const N = numbers(), L = S.items.filter(CTRL).sort((a, b) => String(N[a.id]).localeCompare(String(N[b.id]), undefined, { numeric: true })), out = {}, wh = (i) => NEED[i.type].what;
  const btn = L.filter((i) => wh(i) === 'button' && !i.step), kn = L.filter((i) => wh(i) === 'knob'), whl = L.filter((i) => wh(i) === 'wheel');
  if (fn === 'djfx') { btn.forEach((i, n) => { out[i.id] = ['loop', 'echo', 'spiral', 'phaser'][n] || 'note'; }); whl.forEach((i, n) => { out[i.id] = n ? 'custom' : 'beat'; }); const bp = !whl.length && kn.length > 1; kn.forEach((i, n) => { out[i.id] = bp ? ['beat', 'wet'][n] || 'custom' : n ? 'custom' : 'wet'; }); }
  else { const b = fn === 'macro' ? 'macro' : ['midi', 'synth', 'sound', 'sampler'].indexOf(fn) > -1 ? (TW().btn === 'step' ? 'step' : 'note') : 'custom'; btn.forEach((i) => { out[i.id] = b; }); kn.concat(whl).forEach((i) => { out[i.id] = 'custom'; }); }
  L.filter((i) => i.step).forEach((i) => { out[i.id] = 'step'; }); return out; }
function actsFill(reset) { const D = actDefaults(); S.items.forEach((i) => { if (D[i.id] && (reset || !i.action)) i.action = D[i.id]; }); }
const actOf = (it) => (it ? it.action || actDefaults()[it.id] || 'custom' : null);
const itemOf = (q) => (q && q.id != null ? S.items.find((i) => i.id === q.id) : null);
function ctlOf(m, h) { return !h ? null : h.kind === 'key' ? m.keys[h.i] : h.kind === 'pot' ? m.pots[h.i] : h.kind === 'enc' ? m.encs[h.i] : null; }
const fnTag = (m, h) => { const it = itemOf(ctlOf(m, h)); return it ? ' [Function: ' + ACTN(actOf(it)) + ']' : ''; };
// tap-to-highlight: one part lit in Test It, Wired, Arrange, the 3D view and its line in the code
let HL = null;
const hlTag = () => { if (HL == null) return null; const n = numbers()[HL]; return n ? String(n) : null; };
function hlSet(id) { if (id == null || HL === id) return; HL = id; if (S.items.some((i) => i.id === id)) sel = id; codeBox(!$('cbx').hidden); }
const BEH = [['synth', 'Synth'], ['macro', 'USB Macro Pad'], ['midi', 'MIDI'], ['timer', 'Timer'], ['sound', 'Soundboard'], ['djfx', 'DJ FX'], ['test', 'Pin Test']];
const SCN = { major: 'Major', penta: 'Pentatonic', minor: 'Minor' }, NN = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
function TW() { if (!S.tw) S.tw = {}; const t = S.tw; if (!SCALES[t.scale]) t.scale = 'major'; if (t.btn !== 'step') t.btn = 'hold'; if (!t.min) t.min = 25; return t; }
const SCALEHZ = () => SCALES[TW().scale].map((x) => Math.round(261.63 * Math.pow(2, x / 12))), NOTEN = () => SCALES[TW().scale].map((x) => NN[x % 12]);
const CFILE = () => (BRDX().ino ? 'casezero.ino' : BRDX().cp ? 'code.py' : 'pins.txt');
const twNow = (k) => (k === 'mac' ? (TW().mac ? 1 : 0) : TW()[k]);
const pillRow = (name, k, opts) => '<div class="selbar tw"><b>' + name + '</b>' + opts.map(([v, n]) => '<button type="button" data-tw="' + k + ':' + v + '" aria-pressed="' + (String(twNow(k)) === String(v)) + '">' + n + '</button>').join('') + '</div>';
function behHtml() { const cur = recipeFn() || 'test', tw = [], list = (recipe() && recipe().fn === 'sampler' ? [['sampler', 'Sampler']] : []).concat(BEH);
  if (['synth', 'midi', 'sound'].indexOf(cur) > -1) tw.push(pillRow('Scale', 'scale', [['major', 'Major'], ['penta', 'Pentatonic'], ['minor', 'Minor']]), pillRow('Button', 'btn', [['hold', 'Hold'], ['step', 'Step 1/4']]));
  if (cur === 'macro') tw.push(pillRow('Computer', 'mac', [[0, 'Windows'], [1, 'Mac']]));
  if (cur === 'timer') tw.push(pillRow('Minutes', 'min', [[5, '5'], [25, '25'], [45, '45']]));
  return '<div class="trtop">' + soundPill() + '</div><p class="h" style="margin-top:0">What should the code do?</p><div class="hrow beh" role="group" aria-label="What should the code do?">' + list.map(([k, n]) => '<button type="button" data-beh="' + k + '" aria-pressed="' + (k === cur) + '">' + n + '</button>').join('') + '</div>' + tw.join(''); }
// Libraries You Need: the exact names for this board's language
function libsBox() { const B = BRDX(); let c; try { c = codeFor(wiring(), summaryLine(), recipeFn(), B, TW()); } catch (e) { return ''; }
  const a = (u, t) => '<a href="' + u + '" target="_blank" rel="noopener">' + t + '</a>';
  const zipBtn = '<button type="button" class="btn red" data-act="saveall" style="width:100%;margin:6px 0">Download Full Project (.zip)</button>';
  if (B.ino) { const L = (c.libs || []).slice(); libsFor(S.items.map((i) => i.type), B).forEach((l) => { if (!L.some((x) => x.n === l.n)) L.push(l); }); const need = L.filter((l) => !l.built);
    return pfHtml() + zipBtn + '<div class="libs"><b>Arduino Libraries to Install</b>' + (L.length ? '<ul>' + L.map((l) => '<li><code>' + esc(l.n) + '</code> <small>' + (l.built ? 'built in, nothing to install' : 'by ' + esc(l.by)) + '</small></li>').join('') + '</ul>' : '<p>None: everything this sketch uses comes with Arduino.</p>') +
      '<ol><li>Install the free ' + a(LIBURL.ino, 'Arduino IDE') + '.</li>' + (need.length ? '<li>Sketch &rarr; Include Library &rarr; Manage Libraries.</li><li>Search each name above, press Install.</li>' : '') + '<li>Open ' + CFILE() + ', pick your board in Tools &rarr; Board, press Upload.</li></ol>' +
      (B === BOARDS.cyd ? '<p><b>CYD spare pins:</b> GPIO22 + GPIO27 (CN1 plug), GPIO35 (P3, input only), GPIO21 (P3, backlight on some boards). TFT_eSPI needs the CYD User_Setup.h copied into its folder.</p>' : '') + '</div>'; }
  if (!B.cp) return '';
  const L = (c.libs || []).map((n) => { const m = n.match(/^(\S+)(.*)$/), nm = m[1]; return '<li><code>CIRCUITPY/lib/' + esc(nm) + (/\.mpy$/.test(nm) ? '' : '/') + '</code>' + (m[2] ? ' <small>' + esc(m[2].trim()) + '</small>' : '') + '</li>'; });
  return pfHtml() + zipBtn + '<div class="libs"><b>CircuitPython Libraries You Need</b>' + (L.length ? '<ul>' + L.join('') + '</ul>' : '<p>None: everything this code.py uses is built into CircuitPython.</p>') +
    '<ol><li>Put CircuitPython on the ' + esc(bshort()) + ' (circuitpython.org, search your board).</li>' + (L.length ? '<li>Get the Library Bundle at ' + a(LIBURL.cp, 'circuitpython.org/libraries') + ', unzip it, copy the names above into <code>CIRCUITPY/lib/</code>.</li>' : '') + '<li>Open ' + a(LIBURL.web, 'code.circuitpython.org') + ' to edit code.py in the browser, or save it on the CIRCUITPY drive.</li></ol></div>'; }
// Test It for DJ FX, step for step like its code: the first 4 buttons are Loop, Echo, Spiral, Phaser; the Beat wheel is CC 14, Wet/Dry CC 15
function djScreen() { const D = TEST.dj, on = DJFX.filter((f, i) => D.on[i]).map((f) => f[0]); TEST.text = (on.length ? on.join('+') : 'No FX') + ' | ' + BEATS[D.beat] + ' | Wet ' + D.wet + '%'; TEST.lamp = on.length > 0; djSync(D); } /* the real sound: the beat loop through the same FX */
function djAct(m, h, down) { const D = TEST.dj || (TEST.dj = { on: [false, false, false, false], beat: 2, wet: 50, at: [], skip: [] }), A = (q) => actOf(itemOf(q)), fxOf = (k) => (k.btn && k.pad == null ? DJA[A(k)] : undefined);
  const beatPot = m.encs.some((e) => A(e) === 'beat') ? null : m.pots.find((p) => p.kind === 'knob' && A(p) === 'beat') || null, wetPot = m.pots.find((p) => p.kind === 'knob' && A(p) === 'wet') || null; /* part.action, the same as the saved code */
  const fx = (i, st) => { D.on[i] = st; const f = DJFX[i]; djScreen(); return f[0] + (st ? ' ON -> MIDI note on ' : ' OFF -> MIDI note off ') + f[1] + ' (' + DJMODE[f[2]] + ') | ' + TEST.text; };
  if (h.kind === 'key') { const k = m.keys[h.i], i = fxOf(k); TEST.held = down ? h : null; if (i == null) { djScreen(); return down ? k.name + ' pressed (Function ' + ACTN(A(k) || 'custom') + ': not a DJ FX button. Tap it, Function, pick Loop, Echo, Spiral or Phaser)' : ''; } const md = DJFX[i][2];
    if (down) { D.at[i] = Date.now(); if (md === 'toggle') return fx(i, !D.on[i]); if (!D.on[i]) return fx(i, true); D.skip[i] = true; return fx(i, false); }
    if (D.skip[i]) { D.skip[i] = false; return ''; } if (md === 'hold' || (md === 'holdtoggle' && Date.now() - D.at[i] >= 300)) return fx(i, false); return md === 'holdtoggle' ? DJFX[i][0] + ' tapped -> stays on (tap again to stop)' : ''; }
  if (h.kind === 'enc' && A(m.encs[h.i]) === 'beat') { D.beat = Math.max(0, Math.min(5, D.beat + h.dir)); djScreen(); return 'Beat wheel -> ' + BEATS[D.beat] + ' -> MIDI CC 14 = ' + Math.floor(D.beat * 127 / 5) + ' | ' + TEST.text; }
  if (h.kind === 'pot') { const p = m.pots[h.i], v = TEST.val[h.i] || 0; if (Math.abs(v - (TEST.last[h.i] == null ? -10 : TEST.last[h.i])) < 2) return ''; TEST.last[h.i] = v;
    if (p === beatPot) { D.beat = Math.min(5, Math.floor(v * 6 / 101)); djScreen(); return p.name + ' -> Beat ' + BEATS[D.beat] + ' -> MIDI CC 14 = ' + Math.floor(D.beat * 127 / 5) + ' | ' + TEST.text; }
    if (p === wetPot) { D.wet = v; djScreen(); return p.name + ' -> Wet/Dry ' + v + '% -> MIDI CC 15 = ' + Math.floor(v * 127 / 100) + ' | ' + TEST.text; } }
  return null; }
// Test It for the MIDI and Soundboard presets, step for step like their code
function midiAct(fn, m, h, down) { const tw = TW(), stp = tw.btn === 'step' || (h.kind === 'key' && actOf(itemOf(m.keys[h.i])) === 'step'), sc = SCALES[tw.scale], hz = SCALEHZ(), num = (n) => 60 + sc[n % 8] + 12 * Math.floor(n / 8);
  if (h.kind === 'key') { const k = m.keys[h.i], n = h.i;
    if (!down) { TEST.held = null; TEST.lamp = false; return fn === 'midi' && !stp ? k.name + ' released -> MIDI note off ' + num(n) : ''; }
    TEST.held = h; TEST.lamp = true;
    if (fn === 'midi') { TEST.text = 'Note ' + num(n); tone(hz[n % 8] * Math.pow(2, Math.floor(n / 8))); if (stp) setTimeout(toneOff, 250); return k.name + ' pressed -> ' + LABP(k.pin) + ' LOW -> MIDI note on ' + num(n) + ' (' + NOTEN()[n % 8] + ')' + (stp ? ', off after a 1/4 note' : ''); }
    TEST.text = 'Sound ' + (n + 1); if (stp) { tone(hz[n % 8]); setTimeout(toneOff, 250); } else [0, 140, 280].forEach((t, i) => setTimeout(() => { tone(hz[(n + i * 2) % 8] * (n + i * 2 >= 8 ? 2 : 1)); setTimeout(toneOff, 120); }, t));
    return k.name + ' pressed -> ' + LABP(k.pin) + ' LOW -> plays ' + (stp ? 'one 1/4 note' : 'its 3-note jingle'); }
  if (h.kind === 'pot' && fn === 'midi') { const v = TEST.val[h.i] || 0, p = m.pots[h.i]; if (Math.abs(v - (TEST.last[h.i] == null ? -10 : TEST.last[h.i])) < 2) return ''; TEST.last[h.i] = v; TEST.text = 'CC ' + (1 + h.i) + ' ' + v; return p.name + ' -> MIDI CC ' + (1 + h.i) + ' = ' + Math.floor(v * 127 / 100); }
  return null; }
(function () { const st = document.createElement('style'); st.textContent = '.hrow.beh{grid-auto-columns:max-content}.hrow.beh button,.selbar.tw button{all:unset;cursor:pointer;padding:9px 12px;border:1.5px solid var(--ink);border-radius:999px;font:800 12px/1 var(--sys);background:#fff;white-space:nowrap}.hrow.beh button[aria-pressed=true],.selbar.tw button[aria-pressed=true]{background:#1a1a1a;color:#fff}.selbar.tw{flex-wrap:wrap}.selbar.tw button{padding:8px 10px}.buy a.amz{background:#ff9900;border-color:#1a1a1a;color:#1a1a1a;padding:6px 12px;font-size:12px}.libs{border:1.5px solid var(--ink);border-radius:12px;padding:8px 10px;margin:8px 0;background:#fffbe9;font:500 13px/1.4 var(--sys);overflow-wrap:anywhere}.libs code{font:700 12px ui-monospace,Menlo,monospace}.libs ul,.libs ol{margin:4px 0 4px 18px;padding:0}.libs p{margin:4px 0}.btags{margin:6px 0 8px;font:500 12px/1.35 var(--sys)}.btags div{padding:5px 0;border-top:1px solid var(--line)}.btags b{font-weight:800}'; document.head.appendChild(st); })();
function testAct(h, down) { if (down) auHot();
  const m = testModel(), has = (w) => m.outs.find((o) => o.what === w); let s = '';
  if (down) bsel(h.kind === 'key' ? m.keys[h.i] : h.kind === 'pot' ? m.pots[h.i] : h.kind === 'enc' ? m.encs[h.i] : null);
  const fnr = recipeFn(); if (fnr) { const out = presetAct(fnr, m, h, down); if (out !== null) { if (out) testLog(out + (down ? fnTag(m, h) : '')); draw(); return; } }
  if (h.kind === 'key') { const k = m.keys[h.i];
    if (down) { s = k.name + ' pressed -> GP' + k.pin + ' LOW' + show(m, k.name + ' pressed'); TEST.lamp = true; if (has('led')) { TEST.led = !TEST.led; s += ' -> LED ' + (TEST.led ? 'on' : 'off'); } if (has('ring')) { TEST.ring = true; s += ' -> ring red'; } if (has('sound')) { const f = 330 + 60 * h.i; tone(f); s += ' -> speaker ' + f + ' Hz'; } if (has('servo') && !m.pots.length) { TEST.angle = TEST.angle == null || TEST.angle < 45 ? 90 : 0; s += ' -> servo ' + TEST.angle + ' deg'; } TEST.held = h; }
    else { s = k.name + ' released -> GP' + k.pin + ' HIGH'; TEST.lamp = false; if (has('ring')) TEST.ring = false; toneOff(); TEST.held = null; } }
  if (h.kind === 'pot') { const p = m.pots[h.i], v = TEST.val[h.i] || 0; if (Math.abs(v - (TEST.last[h.i] == null ? -10 : TEST.last[h.i])) < 2) return; TEST.last[h.i] = v; s = p.name + (p.kind === 'step' ? ' pressed -> step ' + v / 25 + '/4 -> GP' + p.pin + ' reads ' + v + show(m, p.name + ' ' + v / 25 + '/4') : ' turned -> GP' + p.pin + ' reads ' + v + show(m, p.name + ' ' + v)); TEST.lamp = !TEST.lamp; if (has('servo') && h.i === 0) { TEST.angle = Math.floor(v * 180 / 100); /* code.py: value * 180 // 100 */ s += ' -> servo ' + TEST.angle + ' deg'; } }
  if (h.kind === 'enc') { const e = m.encs[h.i]; TEST.pos[h.i] = (TEST.pos[h.i] || 0) + h.dir; s = e.name + ' turned ' + (h.dir > 0 ? 'right' : 'left') + ' -> ' + LABP(e.pin) + '+' + LABP(e.pin + 1) + ' count ' + TEST.pos[h.i] + show(m, e.name + ' ' + TEST.pos[h.i]); TEST.lamp = !TEST.lamp; }
  if (h.kind === 'pir') { const p = m.pirs[h.i]; TEST.pir[h.i] = !TEST.pir[h.i]; s = p.tag + (TEST.pir[h.i] ? ' sees motion -> ' + LABP(p.pin) + ' HIGH' : ' still -> ' + LABP(p.pin) + ' LOW') + show(m, p.tag + (TEST.pir[h.i] ? ' motion' : ' still')); TEST.lamp = !!TEST.pir[h.i]; }
  if (h.kind === 'tof') { const t = m.tofs[h.i], v = TEST.dist[h.i] || 300; s = t.tag + ' measures ' + v + ' mm (I2C ' + (BRDX().i2c || []).map(LABP).join('/') + ')' + show(m, t.tag + ' ' + v + ' mm'); }
  if (h.kind === 'cam') { TEST.cam = true; s = 'camera check -> SPI answers 0x55, I2C finds 0x30' + show(m, 'Camera found'); }
  if (s) testLog(s + (down ? fnTag(m, h) : '')); draw();
}
function drawTest(W, H) {
  const d = px(), m = testModel(), why = mapWhy(); g.fillStyle = '#f7f4ec'; g.fillRect(0, 0, W, H); TEST.hits = [];
  if (!wiring().rows.length) { g.fillStyle = '#6f6a60'; g.font = '800 ' + 14 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; g.fillText('Add parts to test them', W / 2, H / 2); tag('Test it'); return; }
  const font = (s, w) => { g.font = (w || 800) + ' ' + s * d + 'px -apple-system,Arial'; }, box = (x, y, w, h, f, st) => { g.fillStyle = f; g.beginPath(); g.rect(x, y, w, h); g.fill(); if (st) { g.strokeStyle = st; g.lineWidth = 1.5 * d; g.stroke(); } };
  // the screen and the brain at the top
  const mi = $('v3').classList.contains('mini') && !$('v3').hidden, cb = !$('cbx').hidden || mi, sw = cb ? Math.min(W - 152 * d, 260 * d) : Math.min(W - 24 * d, 260 * d), sx = cb ? 8 * d : (W - sw) / 2; let y = ($('pind').hidden ? 10 : 42) * d; /* the screen sits under the Sound pills */
  const scr = m.screen || recipeFn(), fnr = recipeFn(); if (fnr === 'timer' && TEST.text === 'Ready') TEST.text = clock((TEST.tm ? TEST.tm.rem : 1500)); box(sx, y, sw, 40 * d, scr ? '#10242c' : '#e7e2d6', '#1a1a1a'); font(fnr === 'timer' ? 18 : 13); g.textAlign = 'center'; g.fillStyle = scr ? '#9ff0ff' : '#6f6a60'; g.fillText(scr ? TEST.text : (cb ? 'No screen: see the log' : 'No screen: watch the log below'), sx + sw / 2, y + (fnr === 'timer' ? 28 : 25) * d); if (fnr && !m.screen) { font(8.5, 700); g.fillStyle = '#6f6a60'; g.fillText(fnr === 'macro' ? 'what the computer gets' : 'no screen in this build: shown here for the test', W / 2, y + 50 * d); }
  y += 48 * d; box(W / 2 - 34 * d, y, 68 * d, 20 * d, '#2f7a4b'); font(9); g.fillStyle = '#fff'; g.fillText(bmini(BRDX().name).slice(0, 9), W / 2 - 6 * d, y + 14 * d); g.fillStyle = TEST.lamp ? '#7dff6b' : '#204a2c'; g.beginPath(); g.arc(W / 2 + 22 * d, y + 10 * d, 4 * d, 0, 7); g.fill();
  y += 30 * d; if (mi) y = Math.max(y, ($('cbx').hidden ? 132 : 170) * d); /* clear of the 3D corner preview */
  // one cell per control or output
  const cells = []; m.keys.forEach((k, i) => cells.push({ kind: 'key', i, label: k.name })); m.pots.forEach((p, i) => cells.push({ kind: 'pot', i, label: p.name })); m.encs.forEach((e, i) => cells.push({ kind: 'enc', i, label: e.name }));
  m.pirs.forEach((p, i) => cells.push({ kind: 'pir', i, label: p.tag + ' motion' })); m.tofs.forEach((t, i) => cells.push({ kind: 'tof', i, label: t.tag + ' distance' })); m.cams.forEach((c, i) => cells.push({ kind: 'cam', i, label: c.tag + ' camera' }));
  m.outs.forEach((o) => cells.push({ kind: 'out', what: o.what, label: o.tag + ' ' + o.what }));
  const cols = Math.max(2, Math.min(5, Math.floor((W - 16 * d) / (92 * d)))), cw = (W - 16 * d) / cols, rowsN = Math.ceil(cells.length / cols), ch = Math.max(72 * d, Math.min(84 * d, ($('stage').clientHeight * d - y - 64 * d) / Math.max(1, rowsN)));
  { const need = Math.ceil((y + rowsN * ch + 64 * d) / d), st = $('stage'), vis = st.clientHeight; /* the Test It stage scrolls on its own: every knob, slider and button stays reachable above the drawer and the status pill */
    if (need > vis + 2) { if (cv.style.height !== need + 'px') { st.classList.add('tscroll'); cv.style.height = need + 'px'; return draw(); } } else if (cv.style.height) { cv.style.height = ''; st.classList.remove('tscroll'); return draw(); } }
  const hlId = HL;
  cells.forEach((c, n) => { const cx = 8 * d + (n % cols) * cw, cy = y + Math.floor(n / cols) * ch, mx = cx + cw / 2, my = cy + ch * 0.45, r = Math.min(cw, ch) * 0.24, ent = ctlOf(m, c);
    if (ent && ent.id != null && ent.id === hlId) { g.strokeStyle = '#2563EB'; g.lineWidth = 3 * d; g.beginPath(); g.rect(cx + 3 * d, cy + 2 * d, cw - 6 * d, ch - 4 * d); g.stroke(); }
    font(9.5, 700); g.textAlign = 'center'; g.fillStyle = '#1a1a1a'; g.fillText(c.label.slice(0, 16), mx, cy + ch - 6 * d);
    if (c.kind === 'key') { const on = TEST.held && TEST.held.kind === 'key' && TEST.held.i === c.i; g.fillStyle = on ? '#2563EB' : '#1a1a1a'; g.beginPath(); g.arc(mx, my, r, 0, 7); g.fill(); TEST.hits.push({ kind: 'key', i: c.i, x: mx - r, y: my - r, w: 2 * r, h: 2 * r }); }
    if (c.kind === 'pot' && m.pots[c.i].kind === 'step') { const lv = (TEST.val[c.i] || 0) / 25; g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(mx, my, r, 0, 7); g.fill(); for (let q = 0; q < 4; q++) { g.fillStyle = q < lv ? '#c8412f' : '#cfc9bb'; g.fillRect(mx - 2 * r + q * r, my + r + 3 * d, r * 0.8, 4 * d); } font(9, 700); g.fillStyle = '#fff'; g.fillText(lv ? lv + '/4' : '-', mx, my + 3 * d); TEST.hits.push({ kind: 'pot', step: true, i: c.i, x: mx - r, y: my - r, w: 2 * r, h: 2 * r }); }
    else if (c.kind === 'pot' || c.kind === 'tof') { const v = c.kind === 'pot' ? TEST.val[c.i] || 0 : ((TEST.dist[c.i] || 300) - 30) / 11.7, x0 = cx + 10 * d, x1 = cx + cw - 10 * d; g.strokeStyle = '#1a1a1a'; g.lineWidth = 4 * d; g.beginPath(); g.moveTo(x0, my); g.lineTo(x1, my); g.stroke(); const hx = x0 + (x1 - x0) * v / 100; g.fillStyle = '#c8412f'; g.beginPath(); g.arc(hx, my, 8 * d, 0, 7); g.fill(); font(9, 700); g.fillStyle = '#6f6a60'; g.fillText(c.kind === 'pot' ? String(TEST.val[c.i] || 0) : (TEST.dist[c.i] || 300) + ' mm', mx, my - 12 * d); TEST.hits.push({ kind: c.kind, i: c.i, x: x0 - 8 * d, y: my - 14 * d, w: x1 - x0 + 16 * d, h: 28 * d, x0, x1 }); }
    if (c.kind === 'enc') { [-1, 1].forEach((dir) => { const bx2 = mx + dir * 22 * d; g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(bx2, my, 13 * d, 0, 7); g.fill(); g.fillStyle = '#fff'; font(13); g.fillText(dir < 0 ? '<' : '>', bx2, my + 5 * d); TEST.hits.push({ kind: 'enc', i: c.i, dir, x: bx2 - 13 * d, y: my - 13 * d, w: 26 * d, h: 26 * d }); }); font(10); g.fillStyle = '#1a1a1a'; g.fillText(String(TEST.pos[c.i] || 0), mx, my + 4 * d); }
    if (c.kind === 'pir') { const on = !!TEST.pir[c.i]; g.fillStyle = on ? '#fff3b0' : '#fff'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 2 * d; g.beginPath(); g.arc(mx, my + r * 0.4, r * 1.1, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); TEST.hits.push({ kind: 'pir', i: c.i, x: mx - r * 1.2, y: my - r, w: r * 2.4, h: r * 2 }); }
    if (c.kind === 'cam') { g.fillStyle = TEST.cam ? '#2f9a5b' : '#1a1a1a'; g.beginPath(); g.arc(mx, my, r, 0, 7); g.fill(); g.fillStyle = '#8fd3ff'; g.beginPath(); g.arc(mx, my, r * 0.45, 0, 7); g.fill(); TEST.hits.push({ kind: 'cam', i: c.i, x: mx - r, y: my - r, w: 2 * r, h: 2 * r }); }
    if (c.kind === 'out') { if (c.what === 'led') { g.fillStyle = TEST.led ? '#ff4b3a' : '#5a2a26'; g.beginPath(); g.arc(mx, my, r * 0.7, 0, 7); g.fill(); }
      if (c.what === 'ring') { g.strokeStyle = TEST.ring ? '#c8412f' : '#cfc9bb'; g.lineWidth = 6 * d; g.beginPath(); g.arc(mx, my, r, 0, 7); g.stroke(); }
      if (c.what === 'matrix8') { const L = TEST.mx || [], s2 = Math.min(cw, ch) * 0.6, q = s2 / 8; box(mx - s2 / 2, my - s2 / 2, s2, s2, '#1a1a1a'); for (let i = 0; i < 64; i++) { g.fillStyle = L[i] ? '#ff4b3a' : '#3a1d1a'; g.beginPath(); g.arc(mx - s2 / 2 + (i % 8 + 0.5) * q, my - s2 / 2 + (Math.floor(i / 8) + 0.5) * q, q * 0.36, 0, 7); g.fill(); } }
      if (c.what === 'sound') { g.fillStyle = TEST.osc || (TEST.sv && Object.keys(TEST.sv).length) ? '#c8412f' : '#1a1a1a'; g.beginPath(); g.arc(mx, my, r * 0.8, 0, 7); g.fill(); }
      if (c.what === 'servo') { const a = (TEST.angle == null ? 90 : TEST.angle) * Math.PI / 180; g.strokeStyle = '#1a1a1a'; g.lineWidth = 2 * d; g.beginPath(); g.arc(mx, my + r * 0.5, r, Math.PI, 0); g.stroke(); g.strokeStyle = '#c8412f'; g.lineWidth = 4 * d; g.beginPath(); g.moveTo(mx, my + r * 0.5); g.lineTo(mx - Math.cos(a) * r, my + r * 0.5 - Math.sin(a) * r); g.stroke(); } } });
  tag(why || 'Test it: this acts out your ' + CFILE());
}
function testDown(e) { const [x, y] = pcx(e), h = TEST.hits.find((q) => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h); if (!h) return; try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  if (h.step) { stepPress(h); return; } if (h.kind === 'pot' || h.kind === 'tof') { TEST.drag = h; testMove(e); return; } if (h.kind === 'enc') { testAct(h, true); return; } if (h.kind === 'pir' || h.kind === 'cam') { testAct(h, true); return; } testAct(h, true); }
// Swap in Brain: tap a knob, slider, click wheel or button in the test, then trade it here without leaving Brain. Arrange nudges it if it no longer fits.
let BSEL = null;
function bswapHtml() { const it = BSEL != null && S.items.find((i) => i.id === BSEL); if (!it || swapGroup(it.type) !== SWAPS[0]) return ''; const c = swapCur(it), a = actOf(it);
  return '<div class="selbar fnsel"><b>Function ' + esc(label(it).split(' ')[0]) + '</b>' + ACTS.map(([k, n]) => '<button type="button" data-pact="' + it.id + ':' + k + '" aria-pressed="' + (k === a) + '">' + n + '</button>').join('') + '</div><div class="selbar"><b>Swap ' + esc(label(it).split(' ')[0]) + '</b>' + [['pot', 'Knob'], ['slider', 'Slider'], ['encoder', 'Click wheel'], ['step', 'Stepped'], [BTNS.indexOf(it.type) > -1 ? it.type : 'button16', 'Button']].map(([t, n]) => '<button data-bswap="' + it.id + ':' + t + '"' + (t === c ? ' aria-pressed="true" style="background:#1a1a1a;color:#fff"' : '') + '>' + n + '</button>').join('') + '</div>'; }
function bsel(ent) { if (!ent || ent.id == null) return; BSEL = ent.id; hlSet(ent.id); const el = $('bswap'); if (el) el.innerHTML = bswapHtml(); }
function stepPress(h) { TEST.val[h.i] = ((TEST.val[h.i] || 0) / 25 % 4 + 1) * 25; TEST.last[h.i] = null; testAct(h, true); } /* a Stepped Button: 25% -> 50% -> 75% -> 100% -> 25% */
function testMove(e) { const h = TEST.drag; if (!h) return; const [x] = pcx(e), v = Math.max(0, Math.min(100, Math.round((x - h.x0) / (h.x1 - h.x0) * 100))); if (h.kind === 'pot') { TEST.val[h.i] = v; testAct(h, true); } else { TEST.dist[h.i] = Math.round(30 + v * 11.7); draw(); } }
// the Brain stage: tap a group of parts below and the test acts them out; Wired flips the stage to the wiring map
const SIMG = [['pads', 'Pads'], ['btns', 'Buttons'], ['knobs', 'Knobs'], ['stick', 'Stick'], ['sense', 'Sensors']], SIMN = {};
function simList(k) { const m = testModel(), L = [];
  if (k === 'pads') m.keys.forEach((q, i) => { if (q.pad != null) L.push({ kind: 'key', i }); });
  if (k === 'btns') { m.keys.forEach((q, i) => { if (q.pad == null) L.push({ kind: 'key', i }); }); m.pots.forEach((q, i) => { if (q.kind === 'step') L.push({ kind: 'pot', step: true, i }); }); }
  if (k === 'knobs') { m.pots.forEach((q, i) => { if (q.kind === 'knob') L.push({ kind: 'pot', i }); }); m.encs.forEach((q, i) => L.push({ kind: 'enc', i, dir: 1 })); }
  if (k === 'stick') m.pots.forEach((q, i) => { if (q.kind === 'x' || q.kind === 'y') L.push({ kind: 'pot', i }); });
  if (k === 'sense') { m.pirs.forEach((q, i) => L.push({ kind: 'pir', i })); m.tofs.forEach((q, i) => L.push({ kind: 'tof', i })); m.cams.forEach((q, i) => L.push({ kind: 'cam', i })); }
  return L; }
function simRow() { const on = curTab() === 'map';
  return '<div class="hrow simr" role="group" aria-label="Try a part">' + SIMG.map(([k, n]) => { const c = simList(k).length; return '<button type="button" data-sim="' + k + '"' + (c ? '' : ' aria-disabled="true"') + '>' + n + (c ? ' <i>' + c + '</i>' : '') + '</button>'; }).join('') + '<button type="button" class="wd" data-wired="1" aria-pressed="' + on + '">Wired</button></div>'; }
function simTap(k) { const L = simList(k); if (!L.length) { tag('No ' + k.replace('btns', 'buttons').replace('sense', 'sensors') + ' in this build yet. Add them in Parts.'); return; }
  if (curTab() !== 'test') { S.tab[5] = 'test'; save(); render(); }
  const h = L[(SIMN[k] = ((SIMN[k] || 0) + 1)) % L.length];
  if (h.kind === 'key') { TEST.held = h; testAct(h, true); setTimeout(() => { if (TEST.held === h || (TEST.held && TEST.held.kind === 'key' && TEST.held.i === h.i)) testAct(h, false); else draw(); }, 280); return; }
  if (h.step) { stepPress(h); return; }
  if (h.kind === 'pot') { TEST.val[h.i] = ((TEST.val[h.i] || 0) + 25) % 125 > 100 ? 0 : ((TEST.val[h.i] || 0) + 25) % 125; testAct(h, true); return; }
  if (h.kind === 'tof') TEST.dist[h.i] = (TEST.dist[h.i] || 300) >= 1000 ? 100 : (TEST.dist[h.i] || 300) + 300;
  testAct(h, true); }
function codeNow() { const out = []; try { const c = codeFor(wiring(), summaryLine(), recipeFn(), BRDX(), TW()); out.push([c.file || 'code.py', c.text]); } catch (e) { out.push([CFILE(), '# Add parts in Parts and wire them to see your code.py']); }
  try { const mm = micMain(wiring(), summaryLine().replace(/<[^>]+>/g, ''), BRDX()); if (mm) out.push(['main.py', mm]); } catch (e) {}
  const r = recipe(); (r && r.code || []).forEach((c) => out.push([out.some((o) => o[0] === c[0]) ? r.id + '_' + c[0] : c[0], c[1]])); return out; }
let CODEF = 0;
const hlLine = (txt) => { const t = hlTag(); if (!t) return -1; const re = new RegExp('(^|[^A-Za-z0-9_])' + t.replace(/[.]/g, '\\.') + '(?![0-9])'); return txt.split('\n').findIndex((l) => re.test(l)); };
function codeBox(on) { const b = $('cbx'); b.hidden = !on; if (!on) return; const c = codeNow(), hi = hlLine(c[0][1]); $('cbxName').textContent = 'Code'; if (hi > -1) { $('cbxPre').textContent = c[0][1].split('\n').slice(hi, hi + 4).join('\n'); return; } $('cbxPre').textContent = c[0][1].split('\n').filter((l) => l.trim() && !/^(#|\/\/)/.test(l.trim())).slice(0, 4).join('\n') || c[0][1].split('\n').slice(0, 4).join('\n'); }
// a light syntax colourer for the Code viewer: comments, strings, numbers, keywords, #include. One line at a time, no library.
const KW = { py: /^(import|from|as|def|class|return|if|elif|else|for|while|in|not|and|or|is|try|except|finally|with|pass|break|continue|global|lambda|raise|True|False|None)$/,
  ino: /^(void|int|long|bool|char|byte|float|double|const|unsigned|static|if|else|for|while|do|return|break|continue|switch|case|new|true|false|String|HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP)$/ };
const TOK = { py: /(#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b0x[0-9A-Fa-f]+\b|\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g, ino: /(\/\/.*$)|(^\s*#\w+)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|<[\w./]+\.h>)|(\b0x[0-9A-Fa-f]+\b|\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)/g };
function hlCode(line, lang) { const re = new RegExp(TOK[lang].source, 'g'), kw = KW[lang]; let out = '', at = 0, m;
  while ((m = re.exec(line))) { out += esc(line.slice(at, m.index)); const t = m[0], g = lang === 'ino' ? [m[1], m[2], m[3], m[4], m[5]] : [m[1], null, m[2], m[3], m[4]];
    out += g[0] ? '<span class="tc">' + esc(t) + '</span>' : g[1] ? '<span class="tp">' + esc(t) + '</span>' : g[2] ? '<span class="ts">' + esc(t) + '</span>' : g[3] ? '<span class="tn">' + esc(t) + '</span>' : kw.test(t) ? '<span class="tk">' + esc(t) + '</span>' : esc(t); at = re.lastIndex; }
  return out + esc(line.slice(at)); }
function codeFull(i) { const c = codeNow(); CODEF = Math.min(i || 0, c.length - 1); $('cfTabs').innerHTML = c.map((x, j) => '<button type="button" data-cf="' + j + '" aria-pressed="' + (j === CODEF) + '">' + x[0] + '</button>').join(''); const hi = hlLine(c[CODEF][1]), T = c[CODEF][1].split('\n'), lang = /\.ino$/.test(c[CODEF][0]) ? 'ino' : 'py'; $('cfPre').innerHTML = T.map((l, j) => '<span class="ln' + (j === hi ? ' hl" id="cfHL' : '') + '">' + hlCode(l, lang) + '</span>').join(''); $('cfCopy').textContent = 'Copy Code'; $('cfull').hidden = false; const mk = $('cfHL'); if (mk && mk.scrollIntoView) mk.scrollIntoView({ block: 'center' }); }
$('cbx').addEventListener('click', () => codeFull(0));
$('cfull').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.cf != null) { codeFull(+b.dataset.cf); return; }
  if (b.id === 'cfX') { $('cfull').hidden = true; return; }
  if (b.id === 'cfCopy') { const t = (codeNow()[CODEF] || ['', ''])[1], ok = () => { b.textContent = 'Copied!'; setTimeout(() => { b.textContent = 'Copy Code'; }, 1400); };
    const old = () => { try { const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0;top:0'; document.body.appendChild(ta); ta.select(); const done = document.execCommand('copy'); ta.remove(); if (done) ok(); } catch (er) {} }; /* no clipboard API (plain http, older phones) */
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, old); else old(); } catch (er) { old(); } return; }
  if (b.id === 'cfSave') { pfTag(); const c = codeNow()[CODEF]; saveFile({ name: c[0], blob: new Blob([c[1]], { type: 'text/x-python' }) }); } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('cfull').hidden) $('cfull').hidden = true; });
function testUp() { if (TEST.drag && TEST.drag.kind === 'tof') testAct(TEST.drag, true); TEST.drag = null; if (TEST.held) testAct(TEST.held, false); }
// the brain's header: which pins it has and what they are called. No brain yet: the Pico, the board the guide starts from
function BRD() { const bi = brainInfo(); if (!bi) return BOARDS.pico; const k = BOARD_OF[bi.type]; return k ? BOARDS[k] : null; }
const BRDX = () => BRD() || BOARDS.pico, bmini = (n) => n.replace(/Raspberry Pi /, '').replace(/ \(.*\)/, '').replace(/^.*\/\s*(Arduino\s+)?/, ''), /* a short board name for small labels: 'Elegoo / Arduino Uno' -> 'Uno' */ bshort = () => BRDX().name.replace(/Raspberry Pi /, '').replace(/ \(.*\)/, ''), LABP = (p) => BRDX().lab(p), netName = (net) => (net === 'VBUS' ? BRDX().v5 : net === '3V3' ? BRDX().v3 : net);
function headerPins(B) { const P = {}, nl = B.left.length + B.right.length; B.left.forEach((nm, i) => { if (P[nm] == null) P[nm] = i + 1; }); B.right.forEach((nm, j) => { if (P[nm] == null) P[nm] = nl - j; });
  const gnd = B.left.map((nm, i) => (nm === 'GND' ? i + 1 : 0)).concat(B.right.map((nm, j) => (nm === 'GND' ? nl - j : 0))).filter(Boolean); return { P, gnd, nl }; }
function wiring() { if (!S.pins) S.pins = {}; return planWiring(wiringItems(), S.pins, BRDX()); }
// Pin preflight: duplicate pins and 3.3V parts on a 5V Uno, checked before code is exported or Wired is shown
function pfList() { try { return preflight(wiring(), BRDX()); } catch (e) { return []; } }
function pfHtml() { return copilotHtml(); }
function pfTag() { const L = pfList(); if (L.length) tag('Warning: ' + L[0] + (L.length > 1 ? ' (+' + (L.length - 1) + ' more)' : '')); return L; }
function wiringText() { const w = wiring(), B = BRDX(), L = ['NOCIV Case Zero wiring', 'Brain: ' + B.name, ''];
  pfList().forEach((x) => L.push('CHECK FIRST: ' + x)); w.problems.forEach((x) => L.push('FIX: ' + x)); if (w.power && w.power.over) L.push(w.power.tip, '   ' + w.power.detail); if (L.length > 3) L.push('');
  w.rows.forEach((row) => L.push(row.it.label + ': ' + (row.roles.length ? row.roles.map((r) => r.role + ' -> ' + (r.pin == null ? '?' : B.lab(r.pin)) + (r.two ? ' + ' + B.lab(r.pin + 1) : '')).join(', ') : 'no brain pin') + (row.power ? ', power -> ' + netName(row.power) : '') + ', GND -> GND' + (row.note ? '\n   ' + row.note : '')));
  return L.join('\n') + '\n'; }
function pinsHtml() {
  const bi = brainInfo(), bp = bi;
  if (!BRD()) return '<p class="note" style="margin-top:0"><b>' + esc(bi.name) + '</b>: its pins are not in the wiring guide yet.</p>';
  const w = wiring(), list = wiringItems();
  if (!list.length) return '<p class="note" style="margin-top:0">Add buttons, knobs, screens or lights in Electronics, or photo your built board in Snap. Each one gets its pins here.</p>';
  const opt = (k, cur) => '<select class="pin" data-pin="' + k + '">' + BRDX().all.concat(BRDX().adc.filter((p) => BRDX().all.indexOf(p) < 0)).map((p) => '<option value="' + p + '"' + (p === cur ? ' selected' : '') + '>' + LABP(p) + (w.used[p] && p !== cur ? ' *' : '') + '</option>').join('') + '</select>';
  let h = '<div class="grid g2" style="margin:6px 0"><button class="btn dark" data-act="savecode">Save ' + CFILE() + '</button><button class="btn" data-act="repin">Pick pins for me</button></div>' + (S.items.some((i) => i.type === 'inmp441') && BRDX().cp ? '<button class="btn" data-act="savemic" style="width:100%;margin-bottom:6px">Save main.py (records the mic, MicroPython)</button>' : '') + '<p class="note" style="margin-top:0">' + (bp ? '<b>' + esc(bp.name) + '</b>.' : '<b>No brain picked</b>, showing a Raspberry Pi Pico.') + ' Every part gets its pins by the real rules. Soldered already? Pick the pins you used. * = taken. ' + (BRDX().ino ? 'casezero.ino is Arduino code' : 'code.py is CircuitPython') + ': buttons print their name, the screen shows what you press, knobs show 0 to 100. Steps are at the top of the file.</p>' + libsBox();
  const tagScr = S.items.filter((i) => PP(i) && (PP(i).userCuts || []).some((u) => u.kind === 'screen')).length; if (tagScr) h += '<p class="note"><span class="bad">A screen tagged on your board photo is not wired yet.</span> Which screen is it? Add it in Electronics, Screens (2.8 in, round, OLED) and it gets its pins and code here.</p>';
  if (w.problems.length) h += '<p class="note">' + w.problems.map((x) => '<span class="bad">' + esc(x) + '</span>').join('<br>') + '</p>';
  if (w.power && w.power.over) h += '<details class="fold pwtip"><summary>' + esc(w.power.tip) + ' &#9432;</summary><p class="note" style="margin:6px 0 0">' + esc(w.power.detail) + '</p></details>';
  h += '<div class="list" style="margin-top:6px">' + w.rows.map((r) => '<div class="it"><b>' + esc(r.it.label) + '</b>' + r.roles.map((x) => '<span class="pr">' + esc(x.role) + ' ' + (x.fixed || !x.k ? '<i>' + LABP(x.pin) + '</i>' : opt(x.k, x.pin) + (x.two ? ' <i>+ ' + LABP(x.pin + 1) + '</i>' : '')) + '</span>').join('') + '<span class="pr">' + (r.power ? '+ to ' + r.power + ', ' : '') + 'GND to GND</span>' + (r.note ? '<small>' + esc(r.note) + '</small>' : '') + '</div>').join('') + '</div>';
  return h;
}
function drawPinout(W, H) {
  // the Pico from above, USB at the top: every pin labeled, used pins red with the part number beside them
  const d = px(), w = wiring(), who = {}; w.rows.forEach((r) => r.roles.forEach((x) => { if (x.pin != null) { const t = r.it.label.split(' ')[0]; who[x.pin] = (who[x.pin] ? who[x.pin] + ',' : '') + t; if (x.two) who[x.pin + 1] = (who[x.pin + 1] ? who[x.pin + 1] + ',' : '') + t; } }));
  const B = BRDX(), nr = Math.max(B.left.length, B.right.length), num = {}; B.all.concat(B.adc).forEach((p) => { num[B.lab(p)] = p; });
  const room = miniRoom(), aw = W - room, top = 14 * d, rowH = Math.min(22 * d, (H - top - 50 * d) / nr), bw = Math.min(110 * d, aw * 0.28), bx = (aw - bw) / 2, bh = rowH * nr + 10 * d;
  g.fillStyle = '#2f7a4b'; g.fillRect(bx, top, bw, bh); g.fillStyle = '#9a958a'; g.fillRect(bx + bw / 2 - 12 * d, top - 8 * d, 24 * d, 12 * d);
  g.fillStyle = '#fff'; g.font = '900 ' + 12 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; g.fillText(bmini(B.name).toUpperCase().slice(0, 12), bx + bw / 2, top + bh / 2);
  const pinRow = (names, left) => names.forEach((nm, i) => {
    const y = top + 5 * d + rowH * (i + 0.5), x = left ? bx : bx + bw, nn = num[nm] != null ? num[nm] : null, use = nn != null && who[nn];
    g.fillStyle = use ? '#c8412f' : nm.indexOf('GND') > -1 ? '#1a1a1a' : '#e9e2cc'; g.beginPath(); g.arc(x, y, 4.2 * d, 0, 7); g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 1 * d; g.stroke();
    g.font = (use ? '900 ' : '700 ') + 10 * d + 'px -apple-system,Arial'; g.textAlign = left ? 'right' : 'left'; g.fillStyle = use ? '#c8412f' : '#6f6a60';
    g.fillText(nm + (use ? '  ' + who[nn] : ''), left ? x - 8 * d : x + 8 * d, y + 3.5 * d);
  });
  pinRow(B.left, true); pinRow(B.right, false);
  tag(Object.keys(who).length + ' pins used of ' + B.all.length + '. ' + (w.problems.length ? w.problems.length + ' to fix.' : 'Plus GND for every part.'));
}

// ---------- printers, strength and time ----------
const LAYER = { draft: '0.28', normal: '0.2', fine: '0.12' };
let QRMSG = '';
function printerGrid(brand) { const q = (S.prq || '').trim().toLowerCase(), list = q ? CZ.PRINTERS.filter((p) => (p[1] + ' ' + p[5] + ' ' + p[0]).toLowerCase().indexOf(q) > -1) : CZ.PRINTERS.filter((p) => p[5] === brand); /* a search looks in every brand */
  return list.length ? list.map((p) => '<button type="button" class="pick" data-printer="' + p[0] + '" aria-pressed="' + (S.printer === p[0]) + '">' + esc(p[1]) + '<small>' + p[2] + ' x ' + p[3] + ' mm</small></button>').join('') : '<p class="note" style="grid-column:1/-1;margin:0">Not in the list. Type your bed size above, or measure it.</p>'; }
function printerRow() { return CZ.PRINTERS.find((p) => p[0] === S.printer) || CZ.PRINTERS.find((p) => p[0] === 'custom'); }
function setPrinter(id) { const p = CZ.PRINTERS.find((x) => x[0] === id); if (!p) return; S.printer = id; S.brand = p[5]; if (id !== 'custom') S.bed = [p[2], p[3]]; }
const hm = (sec) => { const m = Math.max(10, Math.round(sec / 600) * 10), hh = Math.floor(m / 60), mm = m % 60; return (hh ? hh + ' h' : '') + (hh && mm ? ' ' : '') + (mm ? mm + ' min' : ''); };
function estimate(hsIn) {
  // plastic volume from the real layers, divided by how fast this printer really lays plastic, plus layer changes and heat up per plate
  const hs = hsIn || halves(); let vol = 0, layers = 0, pieces = 0;
  const lh = +LAYER[S.layer], flow = printerRow()[6] * ({ draft: 1.3, normal: 1, fine: 0.55 })[S.layer];
  let skA = 0; if (skelMode()) hs.forEach((x) => { const a = Math.abs(G.area(skelOf(x))); skA += a; vol += a * 0.6; layers += 0.6 / 0.28; pieces += plan(x.built).regs.length; }); /* the 0.6 mm test frame, at 0.28 mm layers */
  else hs.forEach((x) => { [x.built.tray, x.built.deck].forEach((L) => L.forEach((l) => { if (l.polys && l.polys.length) vol += Math.abs(G.area(l.polys)) * (l.z1 - l.z0); })); layers += (x.built.H || 20) / lh; pieces += plan(x.built).regs.length; });
  vol *= 1.04; // hinge barrels and small bits
  const dens = { pla: 1.24, petg: 1.27, abs: 1.05 }[S.material] || 1.24;
  if (skelMode()) return { sec: skA * 0.42 + pieces * 30, grams: vol / 1000 * dens, pieces }; /* measured from our own G-code: about 0.42 s per mm2 of frame, brim and travel included */
  return { sec: vol / flow + layers * 3 + pieces * 240, grams: vol / 1000 * dens, pieces };
}
function printerFromText(txt) {
  const low = String(txt || '').toLowerCase(), flat = low.replace(/[^a-z0-9]/g, ''), spaced = ' ' + low.replace(/[^a-z0-9]+/g, ' ') + ' ';
  for (const [w, id] of CZ.PRINTER_WORDS) if (w.length >= 5 ? flat.includes(w) : spaced.includes(' ' + w + ' ')) return id;
  return null;
}
function loadJsQR() { return window.jsQR ? Promise.resolve(window.jsQR) : new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = '/vendor/jsqr/jsQR.js'; sc.onload = () => ok(window.jsQR); sc.onerror = no; document.head.appendChild(sc); }); }
const BRAND_WORDS = [['creality', 'creality'], ['bambulab', 'bambu'], ['bambu', 'bambu'], ['prusa', 'prusa'], ['elegoo', 'other'], ['anycubic', 'other']];
async function scanPrinter(file) {
  // Reads every QR on the sticker (stickers often have 2: a link and a serial). Tested on her Ender-3 S1:
  // the big code is only https://qr.creality.com and the small one is the serial, so the model comes from a name if there is one, else the brand.
  const note = (m) => { QRMSG = m; const n = $('qrNote'); if (n) n.innerHTML = m; };
  note('Reading the codes...');
  try {
    const jsQR = await loadJsQR(), im = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(file); });
    const W = im.width, H = im.height, found = [], boxes = [[0, 0, 1], [0, 0, 1]];
    [[1, 0], [0.6, 0.4], [0.42, 0.29]].forEach(([f, st]) => { if (f === 1) return; for (let y = 0; y + f <= 1.001; y += st) for (let x = 0; x + f <= 1.001; x += st) boxes.push([x, y, f]); });
    for (const [bx, by, f] of boxes) { // the whole photo, then overlapping pieces, so a small or far code gets enough pixels
      const sw = W * f, sh = H * f, k = Math.min(2.5, 1000 / Math.max(sw, sh)), c = document.createElement('canvas'); c.width = Math.round(sw * k); c.height = Math.round(sh * k);
      const cg = c.getContext('2d'); cg.drawImage(im, bx * W, by * H, sw, sh, 0, 0, c.width, c.height);
      const dd = cg.getImageData(0, 0, c.width, c.height);
      let q = jsQR(dd.data, c.width, c.height, { inversionAttempts: 'attemptBoth' }); if (q && q.data && found.indexOf(q.data) < 0) found.push(q.data);
      const px = dd.data; for (let i = 0; i < px.length; i += 4) { const L = 255 - (px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11); px[i] = px[i + 1] = px[i + 2] = L; } /* white on black stickers read only flipped */
      q = jsQR(px, c.width, c.height, { inversionAttempts: 'dontInvert' }); if (q && q.data && found.indexOf(q.data) < 0) found.push(q.data);
    }
    URL.revokeObjectURL(im.src);
    if (!found.length) { note('<span class="bad">No QR code found in that photo.</span> Get closer, fill the frame with the sticker, no glare. Or pick your printer below.'); return; }
    const all = found.join(' '), id = printerFromText(all);
    if (id) { setPrinter(id); save(); const p = printerRow(); QRMSG = '<span class="ok">Found your ' + esc(p[1]) + '.</span> Bed set to ' + p[2] + ' x ' + p[3] + ' mm.'; render(); return; }
    const flat = all.toLowerCase().replace(/[^a-z0-9]/g, ''), br = BRAND_WORDS.find((w) => flat.includes(w[0]));
    if (br) { S.brand = br[1]; save(); QRMSG = '<span class="ok">' + esc((CZ.BRANDS.find((x) => x[0] === br[1]) || [0, 'Your brand'])[1]) + ' printer.</span> Its codes hold a link and a serial number, not the model. The model is printed on the sticker (Model Number): tap it below.'; render(); return; }
    note('<span class="bad">The code says "' + esc(found[0].slice(0, 60)) + '", no brand or model.</span> That is usually a serial number. The model is printed on the sticker: pick it below.');
  } catch (e) { note('<span class="bad">Could not read that photo.</span> Pick your printer below.'); }
}

// ---------- add-ons: one piece at a time ----------
const caseThick = () => (isPanel() ? 20 : Math.round(geom().closed)); /* what a clip-on part has to grab: the case, closed */
function xp() { if (!S.xp) S.xp = {}; const X = S.xp; X.stand = X.stand || { t: null, a: 25 }; if (X.stand.t == null) X.stand.auto = true; if (X.stand.auto) X.stand.t = caseThick(); /* follows the case until she sets it */ X.feet = X.feet || { hole: true, h: 4 }; X.standoff = X.standoff || { s: 'm25', h: 8 }; X.charm = Object.assign({ size: 'mini', hook: 'lug' }, X.charm || {}); X.shroud = Object.assign({ w: 60, h: 40, d: 20, ct: 3 }, X.shroud || {}); X.dstand = Object.assign({ m: 'm3', a: 25, w: 40, on: false }, X.dstand || {}); X.lens = X.lens || { d: 30 }; X.grip = X.grip || { l: 60 }; X.clip = X.clip || { d: 6 }; X.handle = X.handle || { l: 80 }; X.limbs = X.limbs || { l: 45 }; X.body = X.body || { h: 60 }; X.gears = X.gears || { n: 36 }; X.gears.n = Math.max(18, Math.min(54, Math.round(X.gears.n / 9) * 9)); X.hinge = X.hinge || { l: 30 }; X.spring = X.spring || { n: 6 }; X.clamp = X.clamp || { t: 20 }; X.panel = X.panel || { w: 80, h: 60 }; X.ch = Object.assign({}, CH_DEF, X.ch || {}); X.keys = X.keys || { c: 4, r: 3 }; if (X.keys.c < 3) X.keys.c = 3; if (X.keys.f == null) X.keys.f = 0.1; return X; }
const XINFO = { deco: () => { const n = (S.deco || []).length; return n ? n + ' on your case' : 'nothing added yet'; }, char: () => { const C = charCache(); return C.parts.reduce((n, q) => n + q.n, 0) + ' pieces, ' + Math.round(C.tall) + ' mm tall'; }, body: () => '7 pieces: torso on its side, the rest flat', gears: () => '3 pieces, print flat', hinge: () => '2 leaves, print standing as saved', spring: () => '2 springs, print flat', clamp: () => '1 clamp and 1 wedge, print flat', panel: () => { const X = xp(); return '1 panel, ' + X.panel.w + ' x ' + X.panel.h + ' mm, 2.4 mm thick'; }, keys: () => { const K = kb(); return '1 plate, ' + K.w.toFixed(0) + ' x ' + K.h.toFixed(0) + ' mm, print it rim side up'; }, handle: () => '1 handle, print on its side', limbs: () => '8 pieces, print flat', stand: () => '2 stands, print on their side', dstand: () => '1 cradle, print flat on its side', shroud: () => '1 frame, flange down', lens: () => '1 ring, print flat', grip: () => '1 grip, print flat', tripod: () => '1 block, print flat, nut pocket down', charm: () => '1 lug, print on its side' + (xp().charm.hook === 'hook' ? ', 1 hook, print flat' : ''), feet: () => '4 feet', standoff: () => '4 standoffs', clip: () => '6 clips' };
// ---------- mounting printed parts on the case ----------
// S.attachedParts: [{ id, partId, face: back | left | right | bottom, anchor: { u, v } (20 mm grid squares), mountType: screw | snap }]
const MOUNTABLE = { limbs: 'flat', handle: 'side', stand: 'side', charm: 'side', feet: 'flat', standoff: 'flat', panel: 'flat', lens: 'flat', grip: 'flat', tripod: 'flat' }, TWO = { handle: true };
const twoPoint = (id, opt) => !!TWO[id] || (id === 'charm' && (opt || xp().charm).size === 'chunky');
const mp = (m) => mountPart(m.partId, m.partId === 'charm' ? m.charm : null); /* a mounted charm keeps the size and hook it was mounted with */ /* Chunky charm: two points, like the Handle */ /* side: printed on its side, its feet go against the case */
const MFACES = [['back', 'Back'], ['left', 'Left'], ['right', 'Right'], ['bottom', 'Bottom']];
const UPRIGHT = { camera: 1, mini: 1 }; /* bodies that stand on their thin front edge: the deck is a snap-on plate facing you */
const FLATF = (f) => f === 'bottom' || f === 'lid' || f === 'plate'; /* plate: the top of the deck of a case with no lid (the front of an upright one) */ /* the outside of the base, and the outside of the lid: flat faces, the part prints flat on its plate */
function mfaces() { const CL = { back: 'Hinge edge', left: 'Left edge', right: 'Right edge', bottom: 'Back (base)' }, UP = { back: 'Top edge', left: 'Left edge', right: 'Right edge', bottom: 'Back' }; if (UPRIGHT[S.style]) return [['plate', 'Front (plate)'], ['front', 'Bottom edge']].concat(MFACES.map((f) => [f[0], UP[f[0]]])); return (isClam() ? [['lid', 'Front (lid)']] : isPanel() ? [] : [['plate', 'Top (deck)']]).concat(MFACES.map((f) => (isClam() ? [f[0], CL[f[0]]] : f))); } /* a case with a lid: its front is the lid, its back the base, the walls are its edges */
const mfaceName = (f) => (mfaces().find((x) => x[0] === f) || [f, f])[1];
const MBASIS = { plate: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], front: [[1, 0, 0], [0, 0, 1], [0, -1, 0]], lid: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], back: [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], left: [[0, -1, 0], [0, 0, 1], [-1, 0, 0]], right: [[0, 1, 0], [0, 0, 1], [1, 0, 0]], bottom: [[-1, 0, 0], [0, 1, 0], [0, 0, -1]] }; /* along, up, out of the case */
const mnt = () => { if (!S.mnt) S.mnt = { face: 'back', type: 'screw', view: 'case' }; return S.mnt; };
const mountView = () => curTab() === 'extras' && !!S.xsel && !isPanel() && (!!PORTS[S.xsel] || (!!MOUNTABLE[S.xsel] && mnt().view !== 'part'));
const hingeFace = () => (isClam() && S.hinge !== 'none' ? (S.style === 'small' ? (S.hside === 'right' ? 'right' : 'left') : 'back') : null);
let MPC = {};
function mountPart(id, opt) { // one copy of the part, turned so the side that goes on the case is at z = 0, with its size along the case. opt: a mounted charm's own size and hook
  const k = id + JSON.stringify(S.xp || {}) + JSON.stringify(opt || 0) + (id === 'tripod' ? S.style + geom().H : ''); if (MPC[k]) return MPC[k];
  const a = addonPolys(id, opt), set = (a.sets || [a])[id === 'limbs' ? 1 : 0], /* legs or arms: the bar goes on the wall, its far end takes the next piece */ layers = set.layers || [{ polys: set.polys, z0: 0, z1: set.h }], b = G.bbox([].concat(...layers.map((l) => l.polys))), h = Math.max(...layers.map((l) => l.z1));
  const side = MOUNTABLE[id] === 'side', bw = b.w, bh = side ? h : b.h;
  const M = new THREE.Matrix4(); if (side) M.set(-1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1); /* x, y, z -> -x, z, y: the profile's bottom goes against the case */
  const compact = id === 'charm' && !twoPoint(id, opt), x0 = side ? -b.x1 : b.x0, y0 = side ? 0 : b.y0, z0 = side ? b.y0 : 0, pitch = twoPoint(id, opt) ? Math.ceil((bw + 12) / 20) * 20 : 0; /* two points: whole 20 mm squares apart, the part between them */
  M.premultiply(new THREE.Matrix4().makeTranslation((pitch ? (pitch - bw) / 2 : compact ? 6 : 8) - x0, -y0 - bh / 2, G.MOUNT.PT - 0.1 - z0)); /* sunk 0.1 mm into its plate, so the two merge in the slicer */
  if (Object.keys(MPC).length > 40) MPC = {}; return (MPC[k] = { layers, M, bw, bh, pitch, compact });
}
function mountGeos(m, forPrint) { // the part plus its mating plate (and the snap pin, laid flat beside it when printing)
  const P = mp(m), pl = G.mountPlate(m.mountType, P.bw, P.bh, m.face === 'plate' ? R.LT : FLATF(m.face) ? R.F : R.T, P.pitch, P.compact), geos = G.layerGeos(P.layers).map((gg) => gg.applyMatrix4(P.M));
  if (m.partId === 'tripod') { const hx = [G.circle(8 + P.bw / 2, 0, (11.11 / 2 + tolOf()) / Math.cos(Math.PI / 6), 6)]; pl.layers = pl.layers.map((l) => Object.assign({}, l, { polys: G.diff(l.polys, hx) })); } /* the nut pocket runs on through the plate: the nut goes in from the case side before it is mounted */
  geos.push(...G.layerGeos(pl.layers));
  if (pl.pin && forPrint) for (let i = 0; i < pl.pins; i++) G.layerGeos([{ polys: pl.pin.polys, z0: 0, z1: pl.pin.h }]).forEach((gg) => { gg.translate(-19 - i * 14, -pl.hy, 0); geos.push(gg); });
  return geos;
}
function mountTris(m) { return G.trisOf(mountGeos(m, true)); }
function anchorsOf(face) { const n = face === 'back' || face === 'front' ? S.cols : FLATF(face) ? S.cols * S.rows : S.rows, out = []; for (let i = 0; i < n; i++) out.push(FLATF(face) ? { u: i % S.cols, v: Math.floor(i / S.cols) } : { u: i, v: 0 }); return out; }
function mountAt(m) { // where a mount sits on the case: the point on the outside face, the height of its hole, and the part's frame
  const h = geom(), g0 = R.T + R.CLR + 1, a = m.anchor || { u: 0, v: 0 }, sx = g0 + (a.u + 0.5) * 20, sy = g0 + (a.v + 0.5) * 20, B = MBASIS[m.face];
  let w;
  if (m.face === 'bottom') w = { face: 'bottom', type: m.mountType, x: sx, y: sy, zc: 0, B, o: [sx, sy, 0], H: h.H };
  else if (m.face === 'plate') { if (isClam() || isPanel()) return null; const top = h.H - h.recess; w = { face: 'plate', type: m.mountType, x: sx, y: sy, zc: 0, B, o: [sx, sy, top], H: h.H }; }
  else if (m.face === 'lid') { if (!isClam()) return null; const d = dims(), lx = S.style === 'small' ? sx : d.W - sx, ly = S.style === 'small' ? d.D - sy : sy; w = { face: 'lid', type: m.mountType, x: lx, y: ly, zc: 0, B, o: [lx, ly, 0], H: h.Hl }; } /* the lid's outside, in the lid's own frame: the spot is where you see it from outside */
  else { const s0 = m.face === 'back' || m.face === 'front' ? sx : sy0(a), p = G.wallAt(outline(), m.face, s0 + charmSlide(m, s0)); if (!p) return null; /* back: along x, left and right: along y */
    const deckZ = h.H - R.LT - h.recess, zc = Math.max(R.F + 4, Math.min(deckZ - 6, (R.F + deckZ) / 2));
    w = { face: m.face, type: m.mountType, x: p[0], y: p[1], zc: +zc.toFixed(2), B, o: [p[0], p[1], zc], H: h.H, deckZ }; }
  const w2 = Object.assign({}, w, { B: [B[0].map((q) => -q), B[1].map((q) => -q), B[2]] });
  if (m.anchors && m.anchors.length > 1) { const ax = m.face === 'left' || m.face === 'right' ? 1 : 0; return Math.sign(m.anchors[1].u - m.anchors[0].u) === Math.sign(B[0][ax]) ? w : w2; } /* two points: the part runs from the first to the second */
  if (!edgeWhy(m, w)) return landed(m, w); /* the part runs one way from its screw. If it does not fit that way, it turns around */
  return landed(m, edgeWhy(m, w2) ? w : w2);
}
// a Mini charm in a corner: the deck screw post sits there, so it slides along the wall (3 mm steps, up to 12 mm) to the nearest clear spot
function charmSlide(m, s) { if (m.partId !== 'charm' || twoPoint('charm', m.charm) || FLATF(m.face)) return 0; const out = outline(), b = G.bbox(out), v = m.face === 'back' || m.face === 'front', lo = v ? b.x0 : b.y0, hi = v ? b.x1 : b.y1, ps = posts();
  const mags = isClam() && S.magnets ? G.magnetSpots(out) : [];
  for (const d of [0, 3, -3, 6, -6, 9, -9, 12, -12]) { const at = s + d; if (at < lo + 8 || at > hi - 8) continue; const p = G.wallAt(out, m.face, at); if (!p) continue; const z = [G.mountRect({ face: m.face, x: p[0], y: p[1] }, 6, R.T + 7.5, 0)];
    if (ps.some(([x, y]) => G.area(G.inter(z, [G.circle(x, y, R.POSTR + 1, 20)])) > 0.3) || mags.some(([x, y]) => G.area(G.inter(z, [G.circle(x, y, R.MAG / 2 + 2.6, 24)])) > 0.3)) continue; return d; }
  return 0; }
// a curved or uneven wall: the part's flat back goes on the plane that touches the wall's outermost point under it, and the case gets a flat land
// from that plane into the wall (overlapping it), so the plate sits flat and the two print as one solid. land.out: how far the plane stands off the screw spot.
function landed(m, w) { if (FLATF(m.face) || !w) return w; const v = m.face === 'back' || m.face === 'front', sg = m.face === 'back' || m.face === 'right' ? 1 : -1, pf = plateFace(m, w), out = outline();
  const s0 = Math.min(...pf.map((q) => q[0])), s1 = Math.max(...pf.map((q) => q[0])), z0 = Math.min(...pf.map((q) => q[1])), z1 = Math.max(...pf.map((q) => q[1])), c = [];
  for (let i = 0; i <= 10; i++) { const p = G.wallAt(out, m.face, s0 + (s1 - s0) * i / 10); if (p) c.push(sg * (v ? p[1] : p[0])); }
  const here = sg * (v ? w.y : w.x); if (!c.length) return w; const top = Math.max(here, ...c), sag = top - Math.min(...c);
  if (sag < 0.05) return w; const t = sg * top, o = w.o.slice(); o[v ? 1 : 0] = t;
  return Object.assign({}, w, { o, land: { s0: +s0.toFixed(3), s1: +s1.toFixed(3), z0: +z0.toFixed(3), z1: +z1.toFixed(3), t: +t.toFixed(3), d: +(sag + R.T * 0.6).toFixed(3), out: +(top - here).toFixed(3), sag: +sag.toFixed(3) } }); }
function mountPoints(m) { // every screw or pin of a mount: one, or two for a part that must not turn
  const w = mountAt(m); if (!w) return []; const P = mp(m); if (!P.pitch) return [w];
  const ax = m.face === 'left' || m.face === 'right' ? 1 : 0, d = w.B[0][ax] * P.pitch;
  if (FLATF(m.face)) return [w, Object.assign({}, w, { x: w.x + d, o: [w.x + d, w.y, w.o[2]] })];
  const p = G.wallAt(outline(), m.face, (ax ? w.y : w.x) + d); return p ? [w, Object.assign({}, w, { x: p[0], y: p[1], o: [p[0], p[1], w.zc] })] : [w];
}
const mountCount = (m) => (mp(m).pitch ? 2 : 1);
const sy0 = (a) => R.T + R.CLR + 1 + (a.u + 0.5) * 20;
function edgeWhy(m, w) { const out = outline(), b = G.bbox(out), pf = plateFace(m, w);
  if (FLATF(m.face)) return G.inside([pf], G.offset(out, m.face === 'plate' ? -(R.T + R.CLR + 2) : -1)) ? '' : 'off the edge'; /* on the deck: inside its edge, clear of the snap clips */
  const vx = m.face === 'back' || m.face === 'front', lo = vx ? b.x0 : b.y0, hi = vx ? b.x1 : b.y1; if (G.inside([pf], [G.rect(lo + 4, 0.5, hi - 4, w.H - 0.5)])) return '';
  return pf.some((p) => p[1] < 0.5 || p[1] > w.H - 0.5) ? 'too big for this side' : (pf.reduce((q, p) => Math.max(q, p[0]), -1e9) - pf.reduce((q, p) => Math.min(q, p[0]), 1e9) > hi - lo - 8 ? 'too long for this side' : 'off the edge'); }
function plateFace(m, w) { // the plate's outline on the face it sits on: wall faces in (along the wall, height), the bottom in (x, y)
  const P = mp(m), hy = Math.max(7, P.bh / 2 + 2), B = w.B, pt = (mx, my) => { const q = [0, 1, 2].map((i) => w.o[i] + B[0][i] * mx + B[1][i] * my); return FLATF(m.face) ? [q[0], q[1]] : [m.face === 'back' || m.face === 'front' ? q[0] : q[1], q[2]]; };
  const xa = P.compact ? -6.5 : -7, x1 = P.pitch ? P.pitch + 7 : P.compact ? 7 + P.bw : 9 + P.bw; return [pt(xa, -hy), pt(x1, -hy), pt(x1, hy), pt(xa, hy)];
}
function pillWhy(why) { return /^(electronics|magnet|deck screw|hinge|port|taken|used)\b/.test(why) ? 'used' : 'blocked'; } /* one short word fits the smallest slot pill; the full reason is in its title */
function mountBlocked(m) { // why this spot cannot take this part, or '' if it can
  if (isPanel()) return 'needs a case';
  if (!MOUNTABLE[m.partId]) return 'not a mounting part';
  if (m.face === hingeFace()) return 'hinge';
  if (m.partId === 'tripod' && m.face !== (UPRIGHT[S.style] ? 'front' : 'bottom')) return 'bottom only';
  if (m.face === 'lid' && !isClam()) return 'no lid'; if (m.face === 'plate' && (isClam() || isPanel())) return 'no plate';
  const w = mountAt(m); if (!w) return 'off the edge';
  const out = outline(), pf = plateFace(m, w), ew = edgeWhy(m, w); if (ew) return ew;
  if (w.land && w.land.sag > (m.partId === 'charm' ? 8 : 3)) return 'too curved'; /* a deep land would be a lump: a flatter spot is better */
  const zone = G.union(mountPoints(m).map((q) => (FLATF(m.face) ? G.rect(q.x - 6, q.y - 6, q.x + 6, q.y + 6) : G.mountRect(q, 6, R.T + 7.5, 0)))), ztop = FLATF(m.face) ? R.F + 6 : w.zc + 5, hit = (polys) => G.area(G.inter(zone, polys)) > 0.3;
  if (isClam() && S.magnets && G.magnetSpots(out).some(([x, y]) => hit([G.circle(x, y, R.MAG / 2 + 2.6, 24)]))) return 'magnet';
  if (posts().some(([x, y]) => hit([G.circle(x, y, R.POSTR + 1, 20)]))) return 'deck screw';
  if (m.face === 'plate') { const dz = geom().H - R.LT - geom().recess; if (S.items.some((it) => PP(it) && ((it.panel === homePanel() && it.of == null) || (it.panel === 'inside' && R.F + riserOf(it) + (PP(it).depth || 0) > dz - 6.5)) && hit(rectPoly(fp(it))))) return 'electronics'; } /* the deck's own parts and openings, and anything inside that reaches the boss */
  else if (m.face === 'lid') { const h = geom(), dzL = h.Hl - R.LT - h.recessL, d = dims(); /* the lid's electronics, turned into the lid's frame */
    if (S.items.some((it) => { if (!PP(it) || it.panel !== 'lid' || dzL - (PP(it).depth || 0) >= ztop) return false; const f = fp(it); return hit([G.rect(d.W - f.x1, d.D - f.y1, d.W - f.x0, d.D - f.y0)]); })) return 'electronics'; }
  else { const dz = geom().H - R.LT - geom().recess;
    if (S.items.some((it) => PP(it) && (it.panel === 'inside' || (it.panel === homePanel() && dz - (PP(it).depth || 0) < ztop)) && hit(rectPoly(fp(it))))) return 'electronics'; }
  if (FLATF(m.face)) { const lf = m.face === 'lid' ? 'lidout' : m.face === 'plate' ? 'top' : 'bottom'; if (logoOn(lf)) { const L = LG(lf), d = dims(), lp = toOwn(lf, G.place(logoShape(lf), L.x == null ? d.W / 2 : L.x, L.y == null ? d.D / 2 : L.y, 1, 0)); if (lp.length && G.area(G.inter(G.offset([pf], 1), lp)) > 0.3) return 'logo'; } } /* a logo on that face keeps its room */
  if (S.attachedParts.some((q) => q !== m && q.id !== m.id && q.face === m.face && (() => { const qw = mountAt(q); return qw && G.area(G.inter([pf], [plateFace(q, qw)])) > 0.3; })())) return 'taken';
  if (!FLATF(m.face) && S.ports.some((p) => p.face === m.face && G.area(G.inter([pf], portFace(p))) > 0.3)) return 'port';
  return '';
}
// ---------- ports and vents through a side wall: the same spots, the same blocking rules ----------
// S.ports: [{ id, kind: p_usbc | p_switch | p_vent | p_hdmi | p_minihdmi | p_microhdmi | p_jack, face: back | front | left | right, anchor: { u } }]
const PORTS = { p_hdmi: ['HDMI', 'An opening for a full size HDMI plug: 16.5 x 6.5 mm plus the clearance.'], p_minihdmi: ['Mini HDMI', 'An opening for a Mini HDMI plug (Pi Zero): 12.5 x 4.5 mm plus the clearance.'], p_microhdmi: ['Micro HDMI', 'An opening for a Micro HDMI plug (Pi 4 and 5): 8.5 x 4 mm plus the clearance.'], p_jack: ['3.5mm jack', 'A 6.2 mm round hole for a headphone or audio plug, lined up with the jack inside.'], p_usbc: ['USB-C', 'A stepped USB-C port: a 9.2 x 3.4 mm plug bore, a 1.2 mm recess outside for the cable boot and a collar inside the socket butts against.'], p_microusb: ['Micro-USB', 'A stepped Micro-USB port (Pico): an 8 x 3.6 mm plug bore, a 1.2 mm boot recess outside, a backstop collar inside.'], p_usbb: ['USB-B', 'A stepped USB-B port (Uno): a 12.4 x 11.4 mm plug bore, a 1.2 mm boot recess outside, a backstop collar inside.'], p_switch: ['Slide switch', 'A slot for a small slide switch (SS12D10 type) so you can turn it on and off from outside: 9 x 4 mm plus the clearance.'], p_vent: ['Vent grille', 'Five slots to let warm air out of the case.'] };
const PFACES = [['back', 'Back'], ['front', 'Front'], ['left', 'Left'], ['right', 'Right']], PNORM = { back: [0, 1, 0], front: [0, -1, 0], left: [-1, 0, 0], right: [1, 0, 0] };
const pface = () => (PNORM[mnt().pface] ? mnt().pface : 'back');
const PBORE = { p_usbc: [9.2, 3.4], p_microusb: [8, 3.6], p_usbb: [12.4, 11.4], p_hdmi: [16.5, 6.5], p_minihdmi: [12.5, 4.5], p_microhdmi: [8.5, 4], p_switch: [9, 4] }; /* plug bores, w x h mm */
const STEPPED = { p_usbc: 1, p_microusb: 1, p_usbb: 1, p_hdmi: 1, p_minihdmi: 1, p_microhdmi: 1, p_jack: 1, p_switch: 1 }; /* real 2-stage ports: bore + boot recess + backstop collar */
function boreRects(kind, zc) { const c = tolOf(), b = PBORE[kind]; return [{ u0: -b[0] / 2 - c, u1: b[0] / 2 + c, z0: +(zc - b[1] / 2 - c).toFixed(3), z1: +(zc + b[1] / 2 + c).toFixed(3) }]; }
function portRects(kind) { // the openings: along the wall from the spot (u) and height (z), with the clearance on every side
  const c = tolOf(), F = R.F, dz = geom().H - R.LT - geom().recess;
  if (kind === 'p_switch') return boreRects(kind, F + 5.5);
  if (PBORE[kind]) return boreRects(kind, F + 3 + PBORE[kind][1] / 2 + 0.2 * (kind === 'p_usbb' ? 0 : 1));
  if (kind === 'p_jack') { const r = 3.1 + c, zc = F + 3 + 3.1, nb = 8; return Array.from({ length: nb }, (_, i) => { const z0 = zc - r + i * 2 * r / nb, z1 = z0 + 2 * r / nb, e = Math.min(Math.abs(z0 - zc), Math.abs(z1 - zc)) * (z0 < zc && z1 > zc ? 0 : 1), hw = Math.sqrt(r * r - e * e); return { u0: -hw, u1: hw, z0: +z0.toFixed(3), z1: +z1.toFixed(3) }; }); } /* round, from 8 bands: each one as wide as the circle where it is widest */
  const top = Math.min(dz - 2.5, F + 15); return [-8, -4, 0, 4, 8].map((u) => ({ u0: u - 1 - c, u1: u + 1 + c, z0: F + 3, z1: Math.max(F + 6, top) }));
}
function portAt(p) { const g0 = R.T + R.CLR + 1, s = g0 + ((p.anchor || { u: 0 }).u + 0.5) * 20 + ((p.anchor || {}).du || 0), w = G.wallAt(outline(), p.face, s); if (!w) return null;
  const dz = p.kind === 'p_shroud' ? 0 : (p.anchor || {}).dz || 0, rects = (p.kind === 'p_shroud' ? shroudRects(p) : portRects(p.kind)).map((q) => ({ s0: s + q.u0, s1: s + q.u1, z0: +(q.z0 + dz).toFixed(3), z1: +(q.z1 + dz).toFixed(3) })), z0 = Math.min(...rects.map((q) => q.z0)), z1 = Math.max(...rects.map((q) => q.z1));
  return { face: p.face, x: w[0], y: w[1], s, rects, z0, z1, o: [w[0], w[1], (z0 + z1) / 2], step: !!STEPPED[p.kind], kind: p.kind }; }
function portFace(p) { const w = portAt(p); return w ? w.rects.map((q) => G.rect(q.s0, q.z0, q.s1, q.z1)) : []; } /* in (along the wall, height), like a mount plate */
function portBlocked(p) {
  if (isPanel()) return 'needs a case';
  if (p.face === hingeFace()) return 'hinge';
  const w = portAt(p); if (!w) return 'off the edge';
  const b = G.bbox(outline()), v = p.face === 'back' || p.face === 'front', lo = v ? b.x0 : b.y0, hi = v ? b.x1 : b.y1, h = geom(), s0 = Math.min(...w.rects.map((q) => q.s0)), s1 = Math.max(...w.rects.map((q) => q.s1));
  if (s0 < lo + 5 || s1 > hi - 5 || w.z1 > h.H - 1 || w.z0 < R.F + 0.5) return 'off the edge';
  const zone = [G.mountRect({ face: p.face, x: v ? (s0 + s1) / 2 : w.x, y: v ? w.y : (s0 + s1) / 2 }, (s1 - s0) / 2 + 1.5, R.T + 6, 0)], hit = (polys) => G.area(G.inter(zone, polys)) > 0.3, dz = h.H - R.LT - h.recess;
  if (isClam() && S.magnets && G.magnetSpots(outline()).some(([x, y]) => hit([G.circle(x, y, R.MAG / 2 + 2.6, 24)]))) return 'magnet';
  if (posts().some(([x, y]) => hit([G.circle(x, y, R.POSTR + 1, 20)]))) return 'deck screw';
  if (S.items.some((it) => { const P = PP(it); if (!P || !(it.panel === 'inside' || it.panel === homePanel()) || (P.jack && p.kind === 'p_jack') || (P.sw && p.kind === 'p_switch') || (p.auto === 'usb' && P.cat === 'brain')) return false; /* the jack and the slide switch sit at their own holes */ const zr = it.panel === 'inside' ? [R.F, R.F + riserOf(it) + (P.depth || 0)] : [dz - (P.depth || 0), dz]; return zr[0] < w.z1 && zr[1] > w.z0 && hit(rectPoly(fp(it))); })) return 'electronics';
  const pf = portFace(p);
  if (S.ports.some((q) => q !== p && q.id !== p.id && q.face === p.face && G.area(G.inter(G.offset(pf, 1), portFace(q))) > 0.1)) return 'taken';
  if (S.attachedParts.some((m) => m.face === p.face && MOUNTABLE[m.partId] && (() => { const mw = mountAt(m); return mw && G.area(G.inter(G.offset(pf, 1), [plateFace(m, mw)])) > 0.1; })())) return 'taken';
  return '';
}
// ---------- wires between lid and base: a notch in both hinge walls that meet when the lid closes ----------
function wireNotch(half) { const f = hingeFace(); if (!f) return []; const b = G.bbox(outline()), v = f === 'back', c = v ? (b.x0 + b.x1) / 2 : (b.y0 + b.y1) / 2, w = G.wallAt(outline(), f, c); if (!w) return [];
  const H = half === 'lid' ? geom().Hl : geom().H, k = S.wpass || 'slot', hw = k === 'ribbon' ? 13 : k === 'channel' ? 4 : 5, dz = k === 'ribbon' ? 2.4 : 6;
  return [{ face: f, x: w[0], y: w[1], rects: [{ s0: c - hw, s1: c + hw, z0: H - dz, z1: H + 1 }] }]; }
function wireDuct() { const f = hingeFace(); if (!f) return null; const b = G.bbox(outline()), v = f === 'back', c = v ? (b.x0 + b.x1) / 2 : (b.y0 + b.y1) / 2, w = G.wallAt(outline(), f, c); return w ? { face: f, x: v ? c : w[0], y: v ? w[1] : c } : null; }
function activePorts() { return S.ports.filter((p) => (PORTS[p.kind] || p.kind === 'p_shroud') && !portBlocked(p)).map(portAt).filter(Boolean); }
// ---------- power: USB cable, AA cells or a USB-C LiPo. Each picks its parts, its wall ports, the brain's spot and the red/black wires ----------
const USBK = { pico: 'p_microusb', picow: 'p_microusb', pico2: 'p_microusb', cyd: 'p_microusb', uno: 'p_usbb', nano: 'p_usbc', promicro: 'p_usbc', esp32c3: 'p_usbc', esp32s3: 'p_usbc', esp32: 'p_usbc' };
const PWR_TYPES = ['aa3', 'aa4', 'slidesw', 'lipo1200', 'lipo500', 'tp4056'];
const pwrMode = () => (POWER_MODES[S.power] ? S.power : null);
const pwrBrain = () => S.items.find((i) => i.panel === 'inside' && i.of == null && PP(i) && PP(i).cat === 'brain');
const pwrPlan = () => powerPlan(pwrMode() || 'usb', (pwrBrain() || {}).type || (brainInfo() || {}).type || 'pico');
function wallPortOf(it, kind) { // the stepped port at the wall a part's plug end touches: r 0 left, 1 front, 2 right, 3 back
  if (!it || !PBORE[kind] || isPanel()) return null; const P = PP(it), b = G.bbox(outline()), r = (it.r || 0) % 4, face = ['left', 'front', 'right', 'back'][r], hf = hingeFace(); if (face === hf) return null;
  const end = r === 0 ? it.x - P.w / 2 - b.x0 : r === 2 ? b.x1 - (it.x + P.w / 2) : r === 1 ? it.y - P.w / 2 - b.y0 : b.y1 - (it.y + P.w / 2); if (end > R.T + 3.5) return null; /* only a plug end flush with the wall gets a port */
  const sAt = r % 2 ? it.x : it.y, w = G.wallAt(outline(), face, sAt); if (!w) return null;
  const zc = R.F + riserOf(it) + 1.6 + PBORE[kind][1] / 2 + 0.2, rects = boreRects(kind, zc).map((q) => ({ s0: sAt + q.u0, s1: sAt + q.u1, z0: q.z0, z1: q.z1 })), z0 = rects[0].z0, z1 = rects[0].z1;
  if (z1 > geom().H - R.LT - geom().recess - 0.5) return null;
  return { face, x: w[0], y: w[1], s: sAt, rects, z0, z1, o: [w[0], w[1], (z0 + z1) / 2], step: true, kind, auto: it.id };
}
function autoPorts() { if (isPanel()) return []; const out = [], br = pwrBrain(), ch = S.items.find((i) => i.panel === 'inside' && PP(i) && PP(i).charger && PP(i).usb && /USB-C/.test(PP(i).usb));
  const a = br && wallPortOf(br, USBK[br.type]); if (a) out.push(a); const c = ch && wallPortOf(ch, 'p_usbc'); if (c) out.push(c); return out; }
function snapWall(it) { // a part with a plug: flush against the nearest wall that is not the hinge, plug end out
  const P = PP(it); if (!P || isPanel()) return false; const b = G.bbox(outline()), m = R.T + 0.6 + 0.3, x0 = it.x, y0 = it.y, r0 = it.r || 0, hf = hingeFace();
  const walls = [['left', 0, () => [b.x0 + m + P.w / 2, y0]], ['right', 2, () => [b.x1 - m - P.w / 2, y0]], ['front', 1, () => [x0, b.y0 + m + P.w / 2]], ['back', 3, () => [x0, b.y1 - m - P.w / 2]]].filter((w) => w[0] !== hf);
  walls.sort((a, c) => { const pa = a[2](), pc = c[2](); return Math.hypot(pa[0] - x0, pa[1] - y0) - Math.hypot(pc[0] - x0, pc[1] - y0); });
  for (const [, r, at] of walls) { const p = at(); it.r = r; it.x = p[0]; it.y = p[1]; if (!problems(it).length) return true; for (const d of [10, -10, 20, -20, 30, -30]) { if (r % 2) it.x = p[0] + d; else it.y = p[1] + d; if (!problems(it).length) return true; } }
  it.x = x0; it.y = y0; it.r = r0; return false;
}
function switchHole() { // the On/Off slide switch: a stepped slot in a side wall, its switch parked right behind it
  if (isPanel()) return; S.ports = S.ports.filter((p) => p.auto !== 'power'); const id = S.ports.reduce((q, x) => Math.max(q, +x.id || 0), 0) + 1, hf = hingeFace(), sw = S.items.find((i) => i.type === 'slidesw');
  for (const f of ['right', 'left', 'front', 'back'].filter((x) => x !== hf)) for (const a of anchorsOf(f)) { const p = { id, kind: 'p_switch', face: f, anchor: { u: a.u, v: 0 }, auto: 'power' }; if (portBlocked(p)) continue;
    S.ports = S.ports.concat([p]); const w = portAt(p); if (sw && w) { const N = PNORM[f], k = R.T + 0.9 + 3; sw.r = f === 'left' || f === 'right' ? 1 : 0; sw.riser = 0; sw.x = f === 'left' || f === 'right' ? w.x - N[0] * k : w.s; sw.y = f === 'left' || f === 'right' ? w.s : w.y - N[1] * k; } return; }
}
function setPower(mode) { snapU();
  const plan = powerPlan(mode, (pwrBrain() || {}).type || (brainInfo() || {}).type || 'pico'); S.power = mode;
  S.items = S.items.filter((i) => PWR_TYPES.indexOf(i.type) < 0); S.ports = S.ports.filter((p) => p.auto !== 'power');
  if (S.hatchAuto) { S.hatch = 'none'; S.hpack = null; S.hatchAuto = false; }
  plan.parts.forEach((t) => { const it = addPart(t); if (PP(it).mah || t === 'slidesw') it.riser = 0; });
  const bat = S.items.find((i) => PWR_TYPES.indexOf(i.type) > -1 && PP(i).mah);
  if (mode === 'aa' && plan.pack && !isPanel()) { if (!hatchKind()) { S.hatch = 'snap'; S.hatchAuto = true; } S.hpack = plan.pack; }
  if (mode === 'lipo' && hatchKind()) S.hpack = 'lipo';
  const z = hatchZ(); if (bat && z && z.pack) { const P = PP(bat); bat.r = 2 * z.sw >= P.w ? 0 : 1; bat.x = z.cx; bat.y = z.cy; if (problems(bat).length) autoPlace(bat); } /* the pack sits right over its hatch */
  const ch = S.items.find((i) => i.type === 'tp4056'); if (ch) snapWall(ch);
  const br = pwrBrain(); if (br) { if (mode === 'usb') snapBrain(br); else if (problems(br).length) autoPlace(br); }
  if (mode !== 'usb') switchHole();
  S.items.filter((i) => problems(i).length).forEach((i) => autoPlace(i)); if (allProblems().length) fitAll();
  S.pins = {}; save(); render(); tag(POWER_MODES[mode][0] + ': ' + (plan.warn || plan.note));
}
function zNeed() { // vertical room: a battery on the floor and a part hanging under the deck above it
  if (isPanel()) return 0; const h = heights(), dz = h.H - R.LT - h.recess; let need = 0;
  S.items.filter((b) => b.panel === 'inside' && PP(b) && (PP(b).mah || PP(b).cat === 'brain')).forEach((b) => { const f = fp(b), top = R.F + riserOf(b) + PP(b).depth + (pcbOn() ? 1.6 : 0);
    itemsOn(homePanel()).forEach((q) => { if (!PP(q)) return; const g = fp(q); if (!(f.x0 < g.x1 - 0.1 && f.x1 > g.x0 + 0.1 && f.y0 < g.y1 - 0.1 && f.y1 > g.y0 + 0.1)) return; need = Math.max(need, top + (PP(q).depth || 0) + 1 - dz); }); });
  return Math.ceil(Math.max(0, need));
}
const PWR_CARD = { usb: ['$0', 'Locks the brain flush to a wall with its stepped USB port'], aa: ['~$2', 'Battery hatch, On/Off slide switch, the right voltage'], lipo: ['~$10', 'LiPo + TP4056 USB-C charger + On/Off switch'] };
function powerPane() { const m = pwrMode(), plan = pwrPlan(), br = pwrBrain(), zn = zNeed(), bk = br ? (PP(br).short || PP(br).name) : 'brain', pk = USBK[(br || {}).type];
  let h = '<p class="h" style="margin-top:0">Power <span style="font-weight:600;text-transform:none;letter-spacing:0">how it gets its volts</span></p><div class="grid g3 pwr">' + Object.keys(POWER_MODES).map((k) => '<button type="button" class="pick" data-act="pwr_' + k + '" aria-pressed="' + (m === k) + '"' + (m === k ? ' style="background:#1a1a1a;color:#fff"' : '') + '>' + esc(POWER_MODES[k][0]) + '<small>' + PWR_CARD[k][0] + ' &middot; ' + PWR_CARD[k][1] + '</small></button>').join('') + '</div>';
  if (m) h += '<div class="list" style="margin-top:8px"><div class="it"><b>' + esc(POWER_MODES[m][0]) + (m === 'usb' ? ' &middot; ' + esc(bk) + ' ' + (pk ? esc(PORTS[pk][0]) : 'USB') + ' port' : ' &middot; ' + plan.volts + ' V into ' + esc(plan.pin)) + '</b>' + esc(plan.note) + (plan.warn ? ' <span class="bad">' + esc(plan.warn) + '</span>' : '') + (m !== 'usb' ? '<small>Red (+) runs through the On/Off switch; black (-) to GND. See PLAY, Wired.</small>' : '') + '</div></div>';
  if (zn) h += '<p class="note bad">Battery + the part above it need ' + zn + ' mm more height than the inside has.</p><button type="button" class="btn red" data-act="deepen" style="width:100%">Deepen Base +' + zn + ' mm</button>';
  h += '<details class="fold"><summary>&#9432; Learn: 3.7V LiPo vs 5V vs 3.3V</summary><div class="list"><div class="it"><b>5 V</b>What USB gives. Uno and Nano run on it; Pico VBUS and ESP32 5V/VIN take it in.</div><div class="it"><b>3.3 V</b>What Pico and ESP32 pins speak. The 3V3 pin is an output: never feed a battery into it.</div><div class="it"><b>3.7 V LiPo</b>4.2 V full, 3.0 V empty. Fine on Pico VSYS (1.8 to 5.5 V) through a diode; too low for an Uno without a 5 V boost board.</div><div class="it"><b>Plug and play</b>Buy batteries and holders with a JST-PH 2.0 plug, and check red (+) and black (-) before you plug in: sellers swap them.</div></div></details>';
  return h; }
function jackHole() { // the audio jack gets its round hole in a free spot of a wall: the back first, or a side wall on a lid + base case. Move it in Ports & Vents.
  if (isPanel() || S.ports.some((p) => p.kind === 'p_jack')) return; const id = S.ports.reduce((q, x) => Math.max(q, x.id || 0), 0) + 1, hf = hingeFace();
  for (const f of (isClam() ? ['right', 'left', 'front'] : ['back', 'right', 'left', 'front']).filter((x) => x !== hf)) /* a lid + base case: a side wall, never the hinge wall */ for (const a of anchorsOf(f)) { const p = { id, kind: 'p_jack', face: f, anchor: { u: a.u, v: 0 } }; if (!portBlocked(p)) { S.ports = S.ports.concat([p]); tag('3.5mm jack: a 6.2 mm hole cut in the ' + f + ' wall. Move it in Parts, Ports and vents.'); return; } } }
function portAttach(a) { const p = { id: S.ports.reduce((q, x) => Math.max(q, x.id || 0), 0) + 1, kind: S.xsel, face: pface(), anchor: { u: a.u, v: 0 } }, why = portBlocked(p);
  if (why) { tag('That spot is blocked: ' + why + '.'); return; } S.ports = S.ports.concat([p]); save(); render(); tag(PORTS[p.kind][0] + ' cut into the ' + p.face + ' wall.'); }
function portHtml(id) {
  const f = pface(), hf = hingeFace(), mine = S.ports.filter((p) => p.kind === id), at = anchorsOf(f);
  const btn = (a) => { const t = { kind: id, face: f, anchor: a }, on = mine.find((p) => p.face === f && p.anchor.u === a.u), why = on ? '' : portBlocked(t);
    return '<button type="button" class="manc' + (on ? ' on' : '') + '" data-panc="' + a.u + '"' + (why ? ' disabled aria-disabled="true" title="Blocked: ' + why + '"' : ' title="Cut it here"') + '>' + (a.u + 1) + (why ? '<small>' + pillWhy(why) + '</small>' : '') + '</button>'; };
  return '<div class="fnh">' + xBack() + '<b>' + PORTS[id][0] + '</b></div><p class="note" style="margin-top:6px">' + PORTS[id][1] + ' It is cut into the case walls in your files.</p>' +
    '<div class="row"><b>Wall</b>' + seg('m_pface', PFACES.map((x) => [x[0], x[1] + (x[0] === hf ? ' (hinge)' : '')]), f) + '</div>' +
    '<div class="mgrid" style="grid-template-columns:repeat(' + Math.min(12, at.length) + ',minmax(0,1fr))">' + at.map(btn).join('') + '</div>' +
    '<p class="note keep">Tap a spot, or drag <span class="mdrag" draggable="true" data-mdrag="' + id + '">' + PORTS[id][0] + '</span> onto a spot or a green dot. Red spots are blocked by the hinge, a magnet, a deck screw, your electronics or a mounted part.</p>' +
    (mine.length ? '<div class="list" style="margin-top:6px">' + mine.map((p) => { const why = portBlocked(p); return '<div class="it"><b>' + esc(PFACES.find((x) => x[0] === p.face)[1]) + ' wall, spot ' + (p.anchor.u + 1) + '</b>' + (why ? '<span class="bad">Blocked: ' + esc(why) + '. It is not cut until you move it.</span>' : '') + '<div class="selbar" style="margin:6px 0 0"><button type="button" data-prm="' + p.id + '">Remove</button></div></div>'; }).join('') + '</div>' : '');
}
const xname = (id) => (PORTS[id] ? PORTS[id][0] : xmeta(id)[0]);
function activeMounts() { return [].concat(...S.attachedParts.filter((m) => MOUNTABLE[m.partId] && m.face !== 'lid' && !mountBlocked(m)).map(mountPoints)); }
function tripodBottom(on) { S.attachedParts = S.attachedParts.filter((m) => !(m.partId === 'tripod' && m.face === 'front')); if (!on) return;
  const mid = (S.cols - 1) / 2, order = anchorsOf('front').sort((a, c) => Math.abs(a.u - mid) - Math.abs(c.u - mid)); /* the middle of the bottom edge first */
  for (const a of order) for (const t of ['screw', 'snap']) { const m = { id: S.attachedParts.reduce((q, x) => Math.max(q, x.id || 0), 0) + 1, partId: 'tripod', face: 'front', anchor: { u: a.u, v: 0 }, mountType: t }; if (!mountBlocked(m)) { m.anchors = [m.anchor]; S.attachedParts.push(m); return; } }
  tag('No room for a tripod mount on the bottom edge'); }
function activeLidMounts() { return [].concat(...S.attachedParts.filter((m) => MOUNTABLE[m.partId] && m.face === 'lid' && !mountBlocked(m)).map(mountPoints)).map((w) => Object.assign({}, w, { face: 'bottom' })); } /* to the lid it is its own outside, like the bottom of the base */
function quickMount(id, faces) { // one tap: the part on the first free spot, nearest the middle (a lens ring nearest the camera)
  if (S.attachedParts.some((m) => m.partId === id)) return true; const cam = id === 'lens' && S.items.find((i) => ['arducam', 'esp32cam'].includes(i.type)), g0 = R.T + R.CLR + 1;
  let tu = (S.cols - 1) / 2, tv = (S.rows - 1) / 2; if (cam) { try { const bb = G.bbox(rectPoly(fp(cam))); tu = ((bb.x0 + bb.x1) / 2 - g0) / 20 - 0.5; tv = ((bb.y0 + bb.y1) / 2 - g0) / 20 - 0.5; } catch (e) {} }
  for (const f of faces) for (const a of anchorsOf(f).sort((p, q) => Math.hypot(p.u - tu, (p.v || 0) - tv) - Math.hypot(q.u - tu, (q.v || 0) - tv))) for (const t of ['screw', 'snap']) {
    const m = { id: S.attachedParts.reduce((q, x) => Math.max(q, x.id || 0), 0) + 1, partId: id, face: f, anchor: { u: a.u, v: a.v || 0 }, mountType: t }; let why = 'x'; try { why = mountBlocked(m); } catch (e) {} if (!why) { m.anchors = [m.anchor]; S.attachedParts.push(m); return true; } }
  return false; }
function attachAt(a) {
  if (PORTS[S.xsel]) return portAttach(a);
  const M = mnt(), m = { id: S.attachedParts.reduce((q, x) => Math.max(q, x.id || 0), 0) + 1, partId: S.xsel, face: M.face, anchor: { u: a.u, v: a.v }, mountType: M.type, charm: S.xsel === 'charm' ? Object.assign({}, xp().charm) : undefined }, why = mountBlocked(m);
  if (why) { tag('That spot is blocked: ' + why + '.'); return; }
  if (m.partId === 'charm') m.charm = Object.assign({}, xp().charm);
  { const pts = mountPoints(m); m.anchors = [m.anchor]; if (pts.length > 1) { const ax = m.face === 'left' || m.face === 'right' ? 1 : 0; m.anchors.push({ u: m.anchor.u + Math.round(pts[0].B[0][ax] * mp(m).pitch / 20), v: m.anchor.v }); } } /* both points, on the 20 mm grid */
  S.attachedParts = S.attachedParts.concat([m]); save(); render(); tag(xmeta(m.partId)[0] + ' mounted on the ' + m.face + (mountCount(m) > 1 ? ' at 2 points,' : '') + (m.mountType === 'screw' ? ' with M3 screws.' : ' with snap pins.'));
}
function pickMark(cx, cy, reach) { // the dot nearest a tap or a drop on the 3D view
  const r = T3; if (!r || !r.marks || !r.marks.length) return null; const box = r.renderer.domElement.getBoundingClientRect(); let best = null, bd = reach || 30;
  r.marks.forEach((k) => { k.obj.updateWorldMatrix(true, false); const v = k.obj.getWorldPosition(new THREE.Vector3()).project(r.camera), d = Math.hypot(box.left + (v.x + 1) / 2 * box.width - cx, box.top + (1 - v.y) / 2 * box.height - cy); if (d < bd) { bd = d; best = k; } });
  if (best && best.why) { tag('That spot is blocked: ' + best.why + '.'); return null; } return best ? best.a : null;
}
function mountHtml(id) {
  if (!MOUNTABLE[id]) return '';
  if (isPanel()) return '<p class="note">Mounting needs a case. A panel has no walls to hold it.</p>';
  const M = mnt(), hf = hingeFace(), mine = S.attachedParts.filter((m) => m.partId === id), at = anchorsOf(M.face), wide = FLATF(M.face) ? S.cols : Math.min(12, at.length);
  const btn = (a) => { const t = { partId: id, face: M.face, anchor: a, mountType: M.type }, on = mine.find((m) => m.face === M.face && (m.anchors || [m.anchor]).some((q) => q.u === a.u && q.v === a.v)), why = on ? '' : mountBlocked(t);
    return '<button type="button" class="manc' + (on ? ' on' : '') + '" data-manc="' + a.u + ',' + a.v + '"' + (why ? ' disabled aria-disabled="true" title="Blocked: ' + why + '"' : ' title="Mount here"') + '>' + (FLATF(M.face) ? '' : a.u + 1) + (why ? '<small>' + pillWhy(why) + '</small>' : '') + '</button>'; };
  const noRoom = id === 'handle' && !mine.some((m) => !mountBlocked(m)) && !mfaces().some((f) => anchorsOf(f[0]).some((a) => ['screw', 'snap'].some((ty) => !mountBlocked({ partId: id, face: f[0], anchor: a, mountType: ty })))); /* only when no wall has a single good spot and nothing is mounted yet */
  return '<p class="h" style="margin-top:12px">Mount it on the case</p>' + (noRoom ? '<p class="vline v1">No wall on this case has room for the Handle. <b>Try the Charm &amp; Hook:</b> the Mini fits narrow walls on one screw or pin. <button type="button" class="btn" data-xsel="charm" style="display:inline-block;padding:6px 10px;margin-left:4px">Charm &amp; Hook</button></p>' : '') +
    '<div class="row"><b>Side</b>' + seg('m_face', mfaces().map((f) => [f[0], f[1] + (f[0] === hf && !/Hinge/.test(f[1]) ? ' (hinge)' : '')]), M.face) + '</div>' +
    '<div class="row"><b>Holds by</b>' + seg('m_type', [['screw', 'M3 screw'], ['snap', 'Snap pin']], M.type) + '</div>' +
    '<div class="row"><b>See</b>' + seg('m_view', [['case', 'On the case'], ['part', 'Part alone']], M.view === 'part' ? 'part' : 'case') + '</div>' +
    '<div class="mgrid" style="grid-template-columns:repeat(' + wide + ',minmax(0,1fr))">' + at.map(btn).join('') + '</div>' +
    '<p class="note keep">Tap a spot, or drag <span class="mdrag" draggable="true" data-mdrag="' + id + '">' + esc(xmeta(id)[0]) + '</span> onto a spot here or a green dot on the case. Red spots are blocked by the hinge, a magnet, a deck screw or your electronics. ' + (twoPoint(id) ? 'It takes 2 points, so it cannot turn: the spot you pick is the first one. ' : '') + (M.type === 'screw' ? 'Screw: a counterbored plate on the part, an M3 x 8 mm screw threads into a boss inside the case.' : 'Snap: a printed pin goes through the part and the case and clicks behind the wall. It comes in the same file.') + '</p>' +
    (mine.length ? '<div class="list" style="margin-top:6px">' + mine.map((m) => { const why = mountBlocked(m); return '<div class="it"><b>' + (m.charm ? (m.charm.size === 'chunky' ? 'Chunky, ' : 'Mini, ') : '') + esc(mfaceName(m.face)) + ', ' + ((m.anchors || [m.anchor]).length > 1 ? 'spots ' : 'spot ') + (m.anchors || [m.anchor]).map((a) => (FLATF(m.face) ? (a.u + 1) + '-' + (a.v + 1) : a.u + 1)).join(' and ') + '</b>' + (why ? '<span class="bad">Blocked: ' + esc(why) + '. It is not cut into the case until you move it.</span>' : '') +
      '<div class="selbar" style="margin:6px 0 0"><button type="button" data-mtog="' + m.id + '">' + (m.mountType === 'screw' ? 'M3 screw' : 'Snap pin') + ' &rarr; ' + (m.mountType === 'screw' ? 'snap' : 'screw') + '</button><button type="button" data-msave="' + m.id + '">Save</button><button type="button" data-mrm="' + m.id + '">Remove</button></div></div>'; }).join('') + '</div>' : '');
}
function hookPolys(opt) { const k = (opt || xp().charm).size === 'chunky' ? 1.5 : 1; return G.union([CARABINER_HOOK_OUTLINE_MM.map(([x, y]) => [x * k, y * k])]); } /* the printed carabiner, flat; 1.5 times for Chunky */
function addonPolys(id, opt) {
  // every add-on is a flat shape pushed up into 3D (prints flat, strongest way for each one). Returns { polys, h, n, gap }
  const X = xp();
  if (id === 'stand') {
    const w = X.stand.t + 0.6, wall = 3.2, dep = 16, a = X.stand.a * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const rot = ([x, y]) => [x * ca + y * sa, -x * sa + y * ca], W = w + 2 * wall;
    let U = G.diff([G.rect(0, 0, W, dep + wall)], [G.rect(wall, wall, wall + w, dep + wall + 1)]).map((p) => p.map(rot));
    const bb = G.bbox(U), mv = ([x, y]) => [x - bb.x0, y - bb.y0 + 4]; U = U.map((p) => p.map(mv));
    const bBot = mv(rot([W, 0])), bTop = mv(rot([W, dep + wall])), far = bBot[0] + (bTop[1] + 4) * 0.9;
    const brace = [bBot, [far, 0], [far, 4], bTop].map((p) => p.slice());
    return { polys: G.union(U.concat([G.rect(0, 0, far, 4), brace])), h: 30, n: 2 };
  }
  if (id === 'dstand') { // side profile: a lip, a ledge the case stands on, a back it leans on with a slot for the screw, and a brace. Prints on its side, so the profile is the flat shape.
    const Q = X.dstand, a = Q.a * Math.PI / 180, sa = Math.sin(a), ca = Math.cos(a), T = 4, Lb = 46, led = Math.max(8, Math.min(40, caseThick() + 1)), x0 = 4 + led;
    const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k], dv = [sa, ca], nv = [ca, -sa], P0 = [x0, T * sa], P1 = add(P0, dv, Lb), P2 = add(P1, nv, T), P3 = add(P0, nv, T), Lx = Math.max(P2[0], P3[0]) + 6;
    const back = [P0, P3, P2, P1], br = add(P3, dv, Lb * 0.35), brace = [[P3[0], 0], [Lx, 0], [Lx, 4], br];
    const prof = G.union([G.rect(0, 0, Lx, 4), G.rect(0, 0, 4, 12), back, brace]);
    const hole = Q.m === 'tripod' ? 6.6 : Q.m === 'snap' ? 5.4 : 3.4, hl = Q.m === 'snap' ? 2.7 : 4, C = add(add(P0, dv, Lb * 0.68), nv, T / 2), q = (s, t) => add(add(C, dv, s * hl), nv, t * (T / 2 + 1.5));
    const slot = [q(-1, -1), q(1, -1), q(1, 1), q(-1, 1)], W = Q.w, zc = W / 2, hb = hole / 2;
    return { layers: [{ polys: prof, z0: 0, z1: zc - hb }, { polys: G.diff(prof, [slot]), z0: zc - hb - 0.1, z1: zc + hb + 0.1 }, { polys: prof, z0: zc + hb, z1: W }], n: 1 }; /* the slot is as wide as the screw, through the back; each band overlaps the next 0.1 mm */ }
  if (id === 'shroud') { // over a hole in a shallow box: a flange to screw down, 4 walls for the extra depth, and a rabbet at the top the cut-out piece drops back into
    const Q = Object.assign({}, X.shroud, S.ports.some((p) => p.kind === 'p_shroud') ? { h: shroudBackWH().h } : {}), c = tolOf(), w = Q.w / 2, h = Q.h / 2, F = 12, Wl = 3, top = Q.d + Q.ct, rr = (a, b, r) => G.rrect(-a, -b, a, b, r);
    const flange = G.diff([rr(w + F, h + F, 4)], [G.rect(-w + 4, -h + 4, w - 4, h - 4)].concat([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => G.circle(sx * (w + F / 2 + 1), sy * (h + F / 2 + 1), 1.7, 24))));
    return { layers: [{ polys: flange, z0: 0, z1: 2.5 }, { polys: G.diff([rr(w + Wl, h + Wl, 2)], [G.rect(-w + 4, -h + 4, w - 4, h - 4)]), z0: 2.4, z1: Q.d }, { polys: G.diff([rr(w + Wl, h + Wl, 2)], [G.rect(-w - c, -h - c, w + c, h + c)]), z0: Q.d - 0.1, z1: top }], n: 1 }; /* the 4 mm ledge inside holds the cover; each band overlaps the one under it 0.1 mm */ }
  if (id === 'lens') { const d = X.lens.d; return { polys: G.diff([G.circle(0, 0, d / 2 + 4, 96)], [G.circle(0, 0, d / 2 + tolOf(), 96)]), h: 6, n: 1 }; } /* a ring round a lens of that size, with the clearance */
  if (id === 'grip') { const L = X.grip.l, W = 30; return { polys: G.diff([G.rrect(0, 0, L, W, 8)], [0.25, 0.5, 0.75].map((f) => G.circle(L * f, W + 5, 8, 40))), h: 8, n: 1 }; } /* a pad with three finger dips along one edge */
  if (id === 'tripod') { const c = tolOf(), big = !(UPRIGHT[S.style] && geom().H < 24), sq = [big ? G.rrect(-11, -8, 11, 8, 3) : G.rrect(-10, -7, 10, 7, 2.5)], /* 22 x 16 when the edge has room: 2.2 mm round the nut's flats, else 20 x 14 */ /* 20 x 14: the nut's flats across the short side, so it fits a thin edge */ hex = [G.circle(0, 0, (11.11 / 2 + c) / Math.cos(Math.PI / 6), 6)], bolt = [G.circle(0, 0, 6.35 / 2 + c, 40)];
    return { layers: [{ polys: G.diff(sq, hex), z0: 0, z1: 1.9 }, { polys: G.diff(sq, bolt), z0: 1.9, z1: 8 }], h: 8, n: 1 }; } /* 1/4-20 hex nut: 11.11 mm across the flats, 5.56 thick. The pocket is the plate plus 1.9 mm, the tripod screw comes in through the 1/4 in hole */
  if (id === 'charm') { // seen from the side: a flange on the case, a neck, a ring round a 5 mm eyelet. Pushed up 5 mm (Mini) or 8 mm (Chunky).
    const C = opt || X.charm, big = C.size === 'chunky', k = big ? 1.6 : 1, ro = big ? 5.5 * k : 4.75, base = 4, bw = big ? 30 : 2 * ro, cy = base + 2 + ro; /* the eyelet is 5 mm either way */
    const lug = G.diff(G.union([G.rect(-bw / 2, 0, bw / 2, base), G.rect(-ro * 0.8, 0, ro * 0.8, cy), G.circle(0, cy, ro, 48)]), [G.circle(0, cy, 2.5, 32)]);
    const sets = [{ polys: lug, h: big ? 8 : 6, n: 1 }]; /* Mini: 6 mm thick, a reinforced lug */ if (C.hook === 'hook') sets.push({ polys: hookPolys(C), h: CARABINER_DEFAULT_THICKNESS_MM, n: 1 });
    return { sets };
  }
  if (id === 'handle') { // side view of an arch with two flat feet, pushed up 16 mm wide. Layers run along the arch, the strong way.
    const L = X.handle.l, R = 30, th = 6, F = 16, half = (a, b, cx) => { const o = []; for (let i = 0; i <= 40; i++) { const q = Math.PI * i / 40; o.push([cx + a * Math.cos(q), b * Math.sin(q)]); } return o; };
    const cx = F + L / 2 + th, band = G.diff([half(L / 2 + th, R + th, cx)], [half(L / 2, R, cx)]);
    return { polys: G.union(band.concat([G.rect(0, 0, F + th, 4), G.rect(F + th + L, 0, 2 * F + 2 * th + L, 4)])), h: 16, n: 1 };
  }
  if (id === 'limbs') { // flat pieces with a 3.4 mm hole at every joint: an M3 screw is the hinge, tightening it holds the pose
    const w = X.stand.t + 0.6, wall = 3.2, dep = 16, W = w + 2 * wall, hole = (x, y) => G.circle(x, y, 1.7, 24), L = X.limbs.l;
    const clip = G.diff(G.union([G.rect(0, 0, W, dep + wall), G.rect(W / 2 - 6.5, -7, W / 2 + 6.5, 0.5), G.circle(W / 2, -7, 6.5, 40)]), [G.rect(wall, wall, wall + w, dep + wall + 1), hole(W / 2, -7)]);
    const bar = G.diff(G.union([G.rect(0, -6, L, 6), G.circle(0, 0, 6, 40), G.circle(L, 0, 6, 40)]), [hole(0, 0), hole(L, 0)]);
    const foot = G.diff(G.union([G.rect(0, 0, 46, 4), G.rect(16.5, 0, 29.5, 11), G.circle(23, 11, 6.5, 40)]), [hole(23, 11)]);
    return { sets: [{ polys: clip, h: 12, n: 2 }, { polys: bar, h: 5, n: 4 }, { polys: foot, h: 12, n: 2 }] };
  }
  const hole3 = (x, y) => G.circle(x, y, 1.7, 24);
  const barOf = (L) => G.diff(G.union([G.rect(0, -6, L, 6), G.circle(0, 0, 6, 40), G.circle(L, 0, 6, 40)]), [hole3(0, 0), hole3(L, 0)]);
  const footOf = (L = 46) => G.diff(G.union([G.rect(0, 0, L, 4), G.rect(L / 2 - 6.5, 0, L / 2 + 6.5, 11), G.circle(L / 2, 11, 6.5, 40)]), [hole3(L / 2, 11)]);
  if (id === 'body') { // seen from the side: a slot on top that the case edge drops into, a shoulder hole and a hip hole. Pushed up 36 mm, that is the width of the chest.
    const t = X.stand.t + 0.6, W = Math.max(26, t + 8), Hb = X.body.h, sx = (W - t) / 2, slot = 14;
    const torso = G.diff([G.rect(0, 0, W, Hb)], [G.rect(sx, Hb - slot, sx + t, Hb + 1), G.circle(W / 2, Hb - slot - 8, 1.35, 24), G.circle(W / 2, 8, 1.35, 24)]); /* 2.7 mm: the printed hole size an M3 screw threads itself into. A 12 mm screw through a 5 mm bar leaves 7 mm in the torso, 5 is the least. */
    return { sets: [{ polys: torso, h: 36, n: 1 }, { polys: barOf(X.limbs.l), h: 5, n: 4 }, { polys: footOf(70), h: 12, n: 2 }] }; /* long feet: the head sits high, so the base has to be long */
  }
  if (id === 'gears') { // true involute teeth, 20 degree pressure angle, module 1.5 (the size a 0.4 mm nozzle prints cleanly). Each flank is thinned 0.1 mm, which leaves 0.4 mm of play between meshing teeth, the gap printed gears need so they do not lock.
    const m = 1.5, a0 = 20 * Math.PI / 180, inv = (q) => Math.tan(q) - q;
    const gear = (N) => { const r = m * N / 2, rb = r * Math.cos(a0), ra = r + m, rf = r - 1.25 * m, half = Math.PI / (2 * N) - 0.1 / r, hw = (q) => half + inv(a0) - inv(Math.acos(Math.min(1, rb / Math.max(q, rb))));
      const R = []; if (rf < rb) R.push(rf); const lo = Math.max(rb, rf); for (let i = 0; i <= 8; i++) R.push(lo + (ra - lo) * i / 8);
      const pts = []; for (let i = 0; i < N; i++) { const c = 2 * Math.PI * i / N; R.forEach((q) => { const an = c - hw(q); pts.push([q * Math.cos(an), q * Math.sin(an)]); }); R.slice().reverse().forEach((q) => { const an = c + hw(q); pts.push([q * Math.cos(an), q * Math.sin(an)]); }); }
      return G.diff([pts], [G.circle(0, 0, 2.75, 32)]); }; /* 5.5 mm bore on a 5.0 mm peg: 0.5 mm of play so it turns free off any printer */
    const N1 = 18, N2 = X.gears.n, r1 = m * N1 / 2, r2 = m * N2 / 2, cd = r1 + r2, plate = G.union([G.rect(0, -8, cd, 8), G.circle(0, 0, 8, 40), G.circle(cd, 0, 8, 40)]);
    return { sets: [{ layers: [{ polys: plate, z0: 0, z1: 3 }, { polys: [G.circle(0, 0, 2.5, 32), G.circle(cd, 0, 2.5, 32)], z0: 3, z1: 10 }], n: 1 }, { polys: gear(N1), h: 6, n: 1 }, { polys: gear(N2), h: 6, n: 1 }] };
  }
  if (id === 'hinge') { // seen along the pin. The knuckle fills the bottom half only, so a flipped twin fills the other half.
    const L = X.hinge.l, k = 4.5, low = G.diff(G.union([G.circle(0, 0, k, 40), G.rect(0, -k, L + k, -k + 3)]), [hole3(0, 0)]);
    return { layers: [{ polys: low, z0: 0, z1: 11.8 }, { polys: [G.rect(k + 0.7, -k, L + k, -k + 3)], z0: 11.8, z1: 24 }], n: 2 };
  }
  if (id === 'spring') { const n = X.spring.n, W = 18, t = 1.6, p = 5, r = [G.rect(0, -3, W, t), G.rect(0, n * p, W, n * p + t + 3)];
    for (let i = 1; i < n; i++) r.push(G.rect(0, i * p, W, i * p + t)); for (let i = 0; i < n; i++) { const x = i % 2 ? 0 : W - t; r.push(G.rect(x, i * p, x + t, (i + 1) * p + t)); }
    return { polys: G.union(r), h: 8, n: 2 }; }
  if (id === 'clamp') { const g = X.clamp.t + 7.5, D = 32, w = 8, Hc = g + 2 * w, my = Hc / 2;
    const c = G.diff(G.union([G.rect(0, 0, D + w, Hc), G.rect(-7, my - 6.5, 0.5, my + 6.5), G.circle(-7, my, 6.5, 40)]), [G.rect(w, w, D + w + 1, w + g), hole3(-7, my)]);
    return { sets: [{ polys: c, h: 14, n: 1 }, { polys: [[[0, 0], [50, 0], [50, 11], [0, 4]]], h: 14, n: 1 }] }; } /* the wedge rises 7 mm in 50, an 8 degree slope. Plastic on wood or plastic grips well past that, so it will not back out by itself. */
  if (id === 'panel') { const w = X.panel.w, h = X.panel.h; return { polys: G.diff([G.rect(0, 0, w, h)], [hole3(5, 5), hole3(w - 5, 5), hole3(5, h - 5), hole3(w - 5, h - 5)]), h: 2.4, n: 1 }; }
  if (id === 'keys') { // the switch plate. Holes drawn 14.1: printed holes come out a touch small and 14 is the size the clips need.
    const K = kb(), o = KB.HOLE / 2, out = [G.rect(K.x0, K.y0, K.x1, K.y1)], scr = K.screws.map(([x, y]) => hole3(x, y)), cut = scr.slice();
    K.sw.forEach((q, k) => { const jx = (q.j || 0) * 0.004, jy = (q.i != null ? q.i : k) * 0.004; cut.push(G.rect(q.x - o + jx, q.y - o + jy, q.x + o + jx, q.y + o + jy)); }); /* a few thousandths of a mm apart (at most 0.06 mm), so no two holes share a straight line: holes in one line leave open edges in the mesh */
    [-8.89, 8.89].forEach((dy) => cut.push(G.rect(K.pico.x - 25.8, K.pico.y + dy - 1.6, K.pico.x + 25.8, K.pico.y + dy + 1.6))); /* two slots: the Pico's pins poke up through here */
    const rim = G.union(G.diff(out, [G.rect(K.x0 + 7, K.y0 + 7, K.x1 - 7, K.y1 - 7)]).concat([G.rect(K.x0 + 6, K.H + 0.8, K.x1 - 6, K.H + 2.4)])); /* the rim, and one rib between the keys and the Pico, keep a thin printed plate flat. Its 3.5 mm height is also what holds the board at the right distance. */
    return { layers: [{ polys: G.diff(out, cut), z0: 0, z1: 1.5 }, { polys: G.diff(rim, scr), z0: 1.5, z1: 5 }], n: 1 }; }
  if (id === 'deco') return { polys: G.diff([G.rrect(-24, -18, 24, 18, 6)], [featPoly('eyeoval', 0.9).map(([x, y]) => [x - 10, y + 5]), featPoly('eyeoval', 0.9).map(([x, y]) => [x + 10, y + 5]), featPoly('smile', 0.8).map(([x, y]) => [x, y - 8])]), h: 1, n: 1 }; /* the tile picture */
  if (id === 'decoarms') { const fp = limbFp(), D = S.deco || [], na = D.filter((q) => q.k === 'arm').length, nl = D.filter((q) => q.k === 'leg').length, sets = [{ polys: fp.bar.polys, h: fp.bar.h, n: Math.max(1, na + nl) }]; if (na || !nl) sets.push({ polys: fp.hand.polys, h: fp.hand.h, n: Math.max(1, na) }); if (nl) sets.push({ polys: fp.foot.polys, h: fp.foot.h, n: nl }); return { sets }; }
  if (id === 'char') { const c = chSpec(X.ch); // a front view, for the tile picture only. The real pieces come from charParts.
    return { polys: G.union([c.head === 'sphere' ? G.circle(0, 96, 29, 48) : G.rrect(-30, 68, 30, 122, 8), c.body === 'round' ? G.circle(0, 36, 1, 48).map(([x, y]) => [x * 29, (y - 36) * 31 + 36]) : G.rrect(-28, 6, 28, 64, 6), G.rect(-36, 16, -29, 56), G.rect(29, 16, 36, 56), G.rect(-20, -34, -11, 8), G.rect(11, -34, 20, 8), G.rrect(-28, -42, -8, -33, 3), G.rrect(8, -42, 28, -33, 3), G.rect(-5, 62, 5, 70)]), h: 1, n: 1 }; }
  if (id === 'keycapswide') { const K = kb(), f = xp().keys.f == null ? 0.1 : xp().keys.f, cnt = {}; K.sw.filter((q) => q.u > 1).forEach((q) => { cnt[q.u] = (cnt[q.u] || 0) + 1; }); return { sets: Object.keys(cnt).map((u) => ({ layers: capU(f, +u), n: cnt[u] })) }; } /* the 60% board's wider keys, one of each it needs */
  if (id === 'keycaps' || id === 'keycap1' || id === 'keycap2') { const X2 = xp(), n = id === 'keycaps' ? Math.min(24, kb().c * kb().r - (X2.keys.sp ? 2 : 0)) : 1; return { layers: capPolys(X2.keys.f == null ? 0.1 : X2.keys.f, id === 'keycap2'), n }; }
  if (id === 'feet' && X.feet.box) { // a box you already have: 4 corner legs, L shaped, 2 countersunk holes each for #4 wood screws up into its bottom
    const H = Math.max(10, X.feet.h), foot = G.union([G.rrect(0, 0, 36, 14, 2), G.rrect(0, 0, 14, 36, 2)]), at = [[25, 7], [7, 25]], hole = (r) => at.map(([x, y]) => G.circle(x, y, r, 32)), L = [];
    for (let i = 0; i < 4; i++) L.push({ polys: G.diff(foot, hole(3.0 - i * 0.325)), z0: i * 0.325, z1: (i + 1) * 0.325 }); /* the countersink is at the bottom: the screw goes up through the leg into the box */
    L.push({ polys: G.diff(foot, hole(1.7)), z0: 1.3, z1: H }); return { layers: L, n: 4 }; }
  if (id === 'feet') { const c = G.circle(0, 0, 7, 40); return { polys: X.feet.hole ? G.diff([c], [G.circle(0, 0, 1.7, 20)]) : [c], h: X.feet.h, n: 4 }; }
  if (id === 'standoff') return { polys: G.diff([G.circle(0, 0, 3.2, 32)], [G.circle(0, 0, X.standoff.s === 'm3' ? 1.3 : 1.1, 20)]), h: X.standoff.h, n: 4 };
  if (id === 'clip') { const ro = X.clip.d / 2 + 1.8, ri = X.clip.d / 2 + 0.3, gap = X.clip.d * 0.75;
    const ring = G.diff([G.circle(0, 0, ro, 48)], [G.circle(0, 0, ri, 48), G.rect(-gap / 2, 0, gap / 2, ro + 1)]);
    return { polys: G.union(ring.concat([G.rect(-ro - 5, -ro, ro + 5, -ro + 2.4)])), h: 8, n: 6 }; }
  return null;
}
function addonFile(id) {
  if ((id === 'handle' || id === 'charm') && xp()[id].box) { const m = { id: 'box-' + id, partId: id, face: 'back', mountType: 'wood', anchor: { u: 0, v: 0 }, charm: xp().charm }; return { name: 'casezero-' + id + '-for-a-box.stl', blob: meshBlob(G.trisOf(mountGeos(m, true)), id + ' for a box') }; } /* the part on its own plate, countersunk for wood screws */
  if (id === 'keys') { const a = addonPolys('keys'), foot = a.layers[0].polys, bb = G.bbox(foot), bw = S.bed[0] - 8, bh = S.bed[1] - 8; /* a plate bigger than the bed: puzzle pieces with dovetail seams, like the case */
    if (bb.w > bw || bb.h > bh) { const vert = bb.w > bw, n = Math.ceil((vert ? bb.w : bb.h) / (vert ? bw : bh)) - 1, pcs = G.cutLayers(a.layers, [], G.pieceRegions(foot, vert ? 'v' : 'h', n, 'dovetail'));
      const files = pcs.map((pc, i) => { const t = G.stl(G.trisOf(G.layerGeos(pc.layers)), 'keys plate ' + (i + 1)); return t.arrayBuffer().then((ab) => ({ name: 'casezero-keys-plate-' + (i + 1) + '.stl', data: new Uint8Array(ab) })); });
      return { name: 'casezero-keys-plate.zip', pending: Promise.all(files).then((list) => new Blob([zipFiles(list.concat([{ name: 'README.txt', text: 'The switch plate in ' + pcs.length + ' pieces: it is bigger than your ' + S.bed[0] + ' x ' + S.bed[1] + ' mm bed. Print each one flat, then push the dovetails together (a drop of glue holds them).' }]))], { type: 'application/zip' })) }; } }
  const a = addonPolys(id); if (!a) return null; const geos = []; let y0 = 0;
  (a.sets || [a]).forEach((set) => { // each kind of piece in its own row, copies side by side. A piece can be one slab or a few stacked ones.
    const layers = set.layers || [{ polys: set.polys, z0: 0, z1: set.h }], b = G.bbox([].concat(...layers.map((l) => l.polys))), step = b.w + 4;
    const per = Math.max(1, Math.floor(184 / step)); /* copies wrap into rows so the plate fits a small 180 mm bed */
    for (let i = 0; i < set.n; i++) geos.push(...G.layerGeos(layers.map((l) => ({ polys: l.polys.map((p) => p.map(([x, y]) => [x - b.x0 + (i % per) * step, y - b.y0 + y0 + Math.floor(i / per) * (b.h + 4)])), z0: l.z0, z1: l.z1 }))));
    y0 += Math.ceil(set.n / per) * (b.h + 4);
  });
  return { name: 'casezero-' + id + '.stl', blob: meshBlob(G.trisOf(geos), id) };
}
// ---------- the keyboard: one set of numbers shared by the plate, the caps, the board and the hole in the case ----------
// Cherry MX data sheet: keys 19.05 mm apart, 14 mm square hole in a 1.5 mm plate, 5 mm from plate top to board top.
// Checked against the KiCad library footprint SW_Cherry_MX_1.00u_PCB (pads 2.2 mm with 1.5 mm holes, 4 mm middle hole, 1.7 mm pegs).
// On the board each switch has a 4 mm middle hole, two 1.5 mm pin holes at (-3.81, +2.54) and (+2.54, +5.08) from its middle, and two 1.7 mm peg holes 5.08 to each side.
// All of those are whole steps of 1.27 mm, the grid the board maker routes on.
const KB = { P: 19.05, M: 8.5, STRIP: 24, HOLE: 14.1 }, KB_GP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 28];
let KBC = null;
// the 60% layout: 61 keys in 5 rows, [Keycode name, width in keys]. FN is the layer key.
const K60 = [['GRAVE_ACCENT ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE ZERO MINUS EQUALS', 1, 'BACKSPACE', 2], ['TAB', 1.5, 'Q W E R T Y U I O P LEFT_BRACKET RIGHT_BRACKET', 1, 'BACKSLASH', 1.5], ['CAPS_LOCK', 1.75, 'A S D F G H J K L SEMICOLON QUOTE', 1, 'ENTER', 2.25], ['LEFT_SHIFT', 2.25, 'Z X C V B N M COMMA PERIOD FORWARD_SLASH', 1, 'RIGHT_SHIFT', 2.75], ['LEFT_CONTROL LEFT_GUI LEFT_ALT', 1.25, 'SPACE', 6.25, 'RIGHT_ALT FN APPLICATION RIGHT_CONTROL', 1.25]]
  .map((row) => { const out = []; for (let i = 0; i < row.length; i += 2) row[i].split(' ').forEach((nm) => out.push([nm, row[i + 1]])); return out; });
function kb() {
  const X = (S.xp && S.xp.keys) || { c: 4, r: 3 }, s60 = X.preset === '60', c = s60 ? 14 : Math.max(3, Math.min(12, X.c || 4)), r = s60 ? 5 : Math.max(1, Math.min(6, X.r || 3)); if (KBC && KBC.c === c && KBC.r === r && KBC.s60 === s60) return KBC;
  if (s60) { const P = KB.P, W = 15 * P, H = 5 * P, x0 = -KB.M, y0 = -KB.M, x1 = W + KB.M, y1 = H + KB.M + KB.STRIP, sw = []; let n = 0;
    K60.forEach((row, t) => { let cum = 0; const j = 4 - t; row.forEach(([nm, u], i) => { sw.push({ i, j, n: n++, x: (cum + u / 2) * P, y: (j + 0.5) * P, u, name: nm }); cum += u; }); });
    const px = P / 2 + Math.floor((W - 25.2 - P / 2) / 1.27) * 1.27, py = (r - 0.5) * P + 18 * 1.27;
    return (KBC = { c, r, s60, W, H, x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, sw, pico: { x: px, y: py }, screws: [[x0 + 4, y0 + 4], [x1 - 4, y0 + 4], [x0 + 4, y1 - 4], [x1 - 4, y1 - 4]] }); }
  const P = KB.P, W = c * P, H = r * P, x0 = -KB.M, y0 = -KB.M, x1 = W + KB.M, y1 = H + KB.M + KB.STRIP, sw = [];
  for (let j = 0; j < r; j++) for (let i = 0; i < c; i++) sw.push({ i, j, n: (r - 1 - j) * c + i, x: (i + 0.5) * P, y: (j + 0.5) * P }); // j 0 is the bottom row. n counts from the top left, the way you read.
  const px = P / 2 + Math.floor((W - 25.2 - P / 2) / 1.27) * 1.27, py = (r - 0.5) * P + 18 * 1.27; // the Pico, on the back of the strip above the keys
  return (KBC = { c, r, s60: false, W, H, x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, sw, pico: { x: px, y: py }, screws: [[x0 + 4, y0 + 4], [x1 - 4, y0 + 4], [x0 + 4, y1 - 4], [x1 - 4, y1 - 4]] });
}
let KBP = null;
function shroudPart() { // the raised shroud as a part you place: it cuts a W x H hole and takes its flange's room
  if (typeof S === 'undefined' || !S || !S.xp || !S.xp.shroud) return {}; const Q = S.xp.shroud, F = 12;
  return { shroud: { cat: 'hw', name: 'Raised shroud, ' + Q.w + ' x ' + Q.h + ' mm, ' + Q.d + ' mm deeper', short: 'Shroud', w: Q.w + 2 * F, h: Q.h + 2 * F, depth: 0, cut: { o: 'rect', w: Q.w, h: Q.h }, link: 'none', price: 0, tip: 'Cut a ' + Q.w + ' x ' + Q.h + ' mm hole in your box, screw the shroud over it, and drop the piece you cut out back in as its lid.', src: 'Made by Case Zero' } };
}
function kbPart() { // the keyboard as a part you can put in a case: the case top gets one opening for the keys and four screw holes
  if (typeof S === 'undefined' || !S) return {}; const K = kb(); if (KBP && KBP.K === K) return KBP.o;
  const cx = (K.x0 + K.x1) / 2, cy = (K.y0 + K.y1) / 2, n = K.sw.length;
  const o = { kbd: { cat: 'press', kb: true, name: (K.s60 ? 'Keyboard, 60% (61 keys)' : 'Keyboard, ' + K.c + ' x ' + K.r + ' keys') + ' (printed plate, its own board)', short: 'Keyboard', w: K.w, h: K.h, depth: 14, cut: { o: 'rect', w: K.W + 1, h: K.H + 1, dy: -KB.STRIP / 2 }, userHoles: K.screws.map(([x, y]) => ({ x: x - cx, y: y - cy, d: 3.4 })), link: 'plug',
    tip: 'Change its size in Parts, Keyboard. It has its own brain and plugs in by USB.', price: Math.round(n * 0.45 + 9), src: 'Sized by Case Zero from the Cherry MX data sheet', url: '', find: 'MX style keyboard switch' } };
  KBP = { K, o }; return o;
}
function capPolys(f, wide, u) { if (u && u > 1) return capU(f, u); // one key cap, printed top down. The cross hole takes the switch stem: Cherry gives the hole as 4.1 mm across with 1.17 mm arms; a printed hole closes up a little, so it is drawn wider.
  // wide: a space bar. One long cap over two switches side by side, so its two posts are one key step (19.05 mm) apart and it needs no wire stabilizer.
  const Wc = wide ? 18 + KB.P : 18, top = [G.rrect(0, 0, Wc, 18, 2)], L = 4.2 + f, a = (1.35 + f) / 2, b = (1.15 + f) / 2, posts = wide ? [9, 9 + KB.P] : [9];
  const post = (cx) => G.diff([G.circle(cx, 9, 2.75, 40)], G.union([G.rect(cx - L / 2, 9 - a, cx + L / 2, 9 + a), G.rect(cx - b, 9 - L / 2, cx + b, 9 + L / 2)]));
  return [{ polys: top, z0: 0, z1: 1.6 }, { polys: G.union(G.diff(top, [G.rrect(1.4, 1.4, Wc - 1.4, 16.6, 1)]).concat(...posts.map(post))), z0: 1.6, z1: 8 }];
}
function capU(f, u) { // a wide cap of a 60% board: u keys long, one stem in the middle (2 keys and longer rock a little without stabilizers)
  const Wc = u * KB.P - 1.05, top = [G.rrect(0, 0, Wc, 18, 2)], L = 4.2 + f, a = (1.35 + f) / 2, b2 = (1.15 + f) / 2, cx = Wc / 2;
  const post = G.diff([G.circle(cx, 9, 2.75, 40)], G.union([G.rect(cx - L / 2, 9 - a, cx + L / 2, 9 + a), G.rect(cx - b2, 9 - L / 2, cx + b2, 9 + L / 2)]));
  return [{ polys: top, z0: 0, z1: 1.6 }, { polys: G.union(G.diff(top, [G.rrect(1.4, 1.4, Wc - 1.4, 16.6, 1)]).concat(post)), z0: 1.6, z1: 8 }];
}
const KBB = {};
function kbBoard() {
  const K = kb(), key = K.c + 'x' + K.r + (K.s60 ? '60' : ''); if (KBB.key === key) return KBB.b;
  const fixed = [], holes = [], silk = [], gp = (n) => 'GP' + KB_GP[n];
  K.sw.forEach((s) => { const col = gp(s.i), row = gp(K.c + (K.r - 1 - s.j)), kn = 'K' + s.n, dx = s.x + 8.89;
    fixed.push({ x: s.x - 3.81, y: s.y + 2.54, net: col, d: 2.2, drill: 1.5 }, { x: s.x + 2.54, y: s.y + 5.08, net: kn, d: 2.2, drill: 1.5 }, { x: dx, y: s.y + 3.81, net: kn }, { x: dx, y: s.y - 3.81, net: row });
    holes.push({ x: s.x, y: s.y, d: 4.0 }, { x: s.x - 5.08, y: s.y, d: 1.75 }, { x: s.x + 5.08, y: s.y, d: 1.75 });
    silk.push([dx - 1, s.y - 2, dx + 1, s.y - 2], [dx + 1, s.y - 2, dx + 1, s.y + 2], [dx + 1, s.y + 2, dx - 1, s.y + 2], [dx - 1, s.y + 2, dx - 1, s.y - 2], [dx - 1, s.y - 1.4, dx + 1, s.y - 1.4], [dx - 1, s.y - 1.1, dx + 1, s.y - 1.1]); /* the diode, with its stripe at the bottom end */ });
  K.screws.forEach(([x, y]) => holes.push({ x, y, d: 3.4 }));
  const edge = [[K.x0, K.y0], [K.x1, K.y0], [K.x1, K.y1], [K.x0, K.y1]];
  const b = makeBoard({ keepin: edge, pico: { x: K.pico.x, y: K.pico.y, r: 2, flip: true }, fixed, holes, silk, noMounts: true, finalize: () => [edge], name: K.s60 ? 'NOCIV KEYS 60' : 'NOCIV KEYS ' + K.c + 'X' + K.r });
  if (b.ok) { b.kb = K; b.cols = Array.from({ length: K.c }, (q, i) => KB_GP[i]); /* one column pin per key position, whichever row is longest */ b.rows = []; for (let t = 0; t < K.r; t++) b.rows.push(KB_GP[K.c + t]); }
  KBB.key = key; KBB.b = b; return b;
}
function kbCode(b) { // CircuitPython for the Pico. keypad.KeyMatrix scans the keys; adafruit_hid types them over USB.
  if (b.kb.s60) return kbCode60(b);
  const K = b.kb, ROWS = ['ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE ZERO MINUS BACKSPACE', 'Q W E R T Y U I O P LEFT_BRACKET BACKSLASH', 'A S D F G H J K L SEMICOLON QUOTE ENTER', 'Z X C V B N M COMMA PERIOD FORWARD_SLASH UP_ARROW RIGHT_SHIFT', 'LEFT_CONTROL LEFT_GUI LEFT_ALT SPACE SPACE SPACE SPACE RIGHT_ALT TAB LEFT_ARROW DOWN_ARROW RIGHT_ARROW', 'ESCAPE F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 DELETE'].map((q) => q.split(' '));
  const use = K.r >= 6 ? [5, 0, 1, 2, 3, 4] : K.r === 5 ? [0, 1, 2, 3, 4] : K.r === 4 ? [1, 2, 3, 4] : K.r === 3 ? [1, 2, 3] : K.r === 2 ? [1, 2] : [1];
  const L = ['# NOCIV Case Zero keyboard, ' + K.c + ' x ' + K.r + ' keys. CircuitPython for a Raspberry Pi Pico.', '# 1. Put CircuitPython on the Pico (circuitpython.org, pick your Pico, drag the file on).', '# 2. Copy the adafruit_hid folder from the Adafruit library bundle into the lib folder on the Pico.', '# 3. Save this file on the Pico as code.py. It starts by itself.', '# Not run on real parts by us yet. To change a key, change its name in KEYS below.', '', 'import board', 'import keypad', 'import usb_hid', 'from adafruit_hid.keyboard import Keyboard', 'from adafruit_hid.keycode import Keycode as K', '',
    'COLS = (' + b.cols.map((g) => 'board.GP' + g).join(', ') + ',)  # left to right', 'ROWS = (' + b.rows.map((g) => 'board.GP' + g).join(', ') + ',)  # top to bottom', '', '# One line per row of keys, top row first. None means the key does nothing.', 'KEYS = ['];
  const sp = !!(S.xp && S.xp.keys && S.xp.keys.sp), m = Math.floor((K.c - 1) / 2);
  use.forEach((u, ri) => L.push('    [' + ROWS[u].slice(0, K.c).map((n, ci) => 'K.' + (sp && ri === use.length - 1 && (ci === m || ci === m + 1) ? 'SPACE' : n)).join(', ') + '],' + (sp && ri === use.length - 1 ? '  # the two SPACE keys sit under the long space bar' : ''))); L.push(']', '', 'matrix = keypad.KeyMatrix(row_pins=ROWS, column_pins=COLS, columns_to_anodes=True)', 'kbd = Keyboard(usb_hid.devices)', '', 'while True:', '    event = matrix.events.get()', '    if event:', '        row, col = divmod(event.key_number, len(COLS))', '        code = KEYS[row][col]', '        if code is None:', '            continue', '        if event.pressed:', '            kbd.press(code)', '        else:', '            kbd.release(code)', '');
  return L.join('\n');
}
function kbCode60(b) { // the 60% board: the 61 keys, and an Fn layer for F1 to F12, the arrows and Delete
  const K = b.kb, rows = [0, 1, 2, 3, 4].map((t) => K.sw.filter((s) => s.j === 4 - t).sort((a, c) => a.i - c.i));
  const at = (nm) => { for (let t = 0; t < 5; t++) { const s = rows[t].find((q) => q.name === nm); if (s) return [t, s.i]; } return null; }, fn = [];
  ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'ZERO', 'MINUS', 'EQUALS'].forEach((nm, i) => { const p = at(nm); fn.push('    (' + p[0] + ', ' + p[1] + '): K.F' + (i + 1) + ','); });
  [['BACKSPACE', 'DELETE'], ['W', 'UP_ARROW'], ['A', 'LEFT_ARROW'], ['S', 'DOWN_ARROW'], ['D', 'RIGHT_ARROW'], ['I', 'UP_ARROW'], ['J', 'LEFT_ARROW'], ['K', 'DOWN_ARROW'], ['L', 'RIGHT_ARROW']].forEach(([nm, kc]) => { const p = at(nm); fn.push('    (' + p[0] + ', ' + p[1] + '): K.' + kc + ',  # Fn+' + (nm === 'BACKSPACE' ? 'Backspace' : nm)); });
  const fk = at('FN');
  return ['# NOCIV Case Zero keyboard: 60% layout, 61 keys. CircuitPython for a Raspberry Pi Pico.', '# 1. Put CircuitPython on the Pico (circuitpython.org). 2. Copy adafruit_hid into the lib folder. 3. Save this file as code.py.', '# Fn layer: Fn+1 to Fn+= give F1 to F12, Fn+WASD and Fn+IJKL are the arrows, Fn+Backspace is Delete.', '# Not run on real parts by us yet.', '',
    'import board', 'import keypad', 'import usb_hid', 'from adafruit_hid.keyboard import Keyboard', 'from adafruit_hid.keycode import Keycode as K', '',
    'COLS = (' + b.cols.map((g2) => 'board.GP' + g2).join(', ') + ',)  # key positions, left to right', 'ROWS = (' + b.rows.map((g2) => 'board.GP' + g2).join(', ') + ',)  # top row first', '',
    '# each row, left to right; None where a short row has no key', 'KEYS = ['].concat(rows.map((row) => '    [' + Array.from({ length: K.c }, (q, i) => { const s = row.find((x) => x.i === i); return !s ? 'None' : s.name === 'FN' ? 'None' : 'K.' + s.name; }).join(', ') + '],'),
    [']', 'FN_KEY = (' + fk[0] + ', ' + fk[1] + ')', 'FN = {'], fn, ['}', '', 'matrix = keypad.KeyMatrix(row_pins=ROWS, column_pins=COLS, columns_to_anodes=True)', 'kbd = Keyboard(usb_hid.devices)', 'fn_down = False', 'down = {}', '',
    'while True:', '    event = matrix.events.get()', '    if not event:', '        continue', '    row, col = divmod(event.key_number, len(COLS))', '    if (row, col) == FN_KEY:', '        fn_down = event.pressed', '        continue', '    if event.pressed:', '        code = FN.get((row, col)) if fn_down else None', '        code = code or KEYS[row][col]', '        if code is None:', '            continue', '        down[event.key_number] = code', '        kbd.press(code)', '    else:', '        code = down.pop(event.key_number, None)', '        if code is not None:', '            kbd.release(code)', '']).join('\n');
}
function kbCost(K) { const cheap = K.w <= 100 && K.h <= 100; return { cheap, txt: cheap ? 'It fits the cheapest factory size (under 100 x 100 mm): about $2 for 5 boards at JLCPCB before shipping.' : 'It is bigger than 100 x 100 mm, the cheapest factory size, so the price steps up. The factory shows the exact price the moment you upload the file.' }; }
function kbReadme(b) { const K = b.kb, n = K.c * K.r;
  return ['NOCIV CASE ZERO KEYBOARD, ' + K.c + ' x ' + K.r + ' = ' + n + ' KEYS', 'Board ' + K.w.toFixed(1) + ' x ' + K.h.toFixed(1) + ' mm, 2 layers, 1.6 mm thick. Made by the Case Zero builder at nociv.co.', '',
    'HONEST NOTE', 'A computer drew and checked this board (every pad is joined, nothing touches). Nobody has had this exact board made yet. Order the smallest batch first.', '',
    'ORDER IT', '1. Go to a board factory such as jlcpcb.com or pcbway.com and pick the instant quote.', '2. Upload this whole zip file. Keep their standard settings: 2 layers, 1.6 mm, any color.', '3. ' + kbCost(K).txt, '   Shipping and import fees are usually more than the boards.', '',
    'WHAT TO BUY', n + ' keyboard switches, MX style (3 pin or 5 pin both fit)', n + ' diodes, type 1N4148 (the small glass ones, through hole)', '1 Raspberry Pi Pico with pins already on (Pico H)', '4 screws M3 x 12 with nuts', n + ' key caps: print them from the builder, or buy any MX caps', (S.xp && S.xp.keys && S.xp.keys.sp ? 'Space bar: the two middle switches of the bottom row share one long printed cap. Both type a space.' : ''), '',
    'PUT IT TOGETHER', '1. Diodes first. They go on the FRONT (the side with the little boxes), lying flat in the gap beside each switch. The black stripe on the diode goes to the end with the two lines. Solder on the back, snip the legs.', '2. The Pico next, while the board is still bare. It goes on the BACK, in the box marked PICO HERE, USB end where the drawing shows it. Its pins poke up through the board. Solder them on the front.', '3. Click every switch into the printed plate. The rim faces the board.', '4. Lower the plate onto the board so each switch drops into its holes. The Pico pins come up through the two slots in the plate. Solder the two metal pins of each switch on the back.', '5. Push the key caps on.', '',
    'MAKE IT TYPE', 'Open code.py in this zip and follow the 3 steps at its top.', '',
    'WIRING, IF YOU ARE CURIOUS', 'Columns, left to right: ' + b.cols.map((g) => 'GP' + g).join(' '), 'Rows, top to bottom: ' + b.rows.map((g) => 'GP' + g).join(' '), 'Each key joins its column to its row through one diode. Every key is one square.', ''].join('\n');
}
// ---------- the carrier board (Clean it) ----------
const PICOS = ['pico', 'picow', 'pico2'], DIPS = PICOS.concat(['nano', 'promicro', 'esp32c3']); /* BOARD_PROFILES brains on two rows of pins: the board routes for each */
function pcbOn() { return !!S.pcb && !isPanel() && !S.items.some((i) => i.of != null) && S.items.some((i) => DIPS.indexOf(i.type) > -1); } /* cheap on purpose: heights() asks this all the time */
function pcbWhy() { // null when a board can be made, else the plain reason
  if (isPanel()) return 'A panel has no floor to hold a board.';
  if (S.items.some((i) => i.of != null)) return 'Your parts are already soldered on your own board, so a second board has nothing to do here.';
  const b = S.items.find((i) => PP(i) && PP(i).cat === 'brain');
  if (!b) return 'Add a brain first (Brain, Electronics). The board is made for a Pico, Pico W, Pico 2, Pro Micro, Arduino Nano or ESP32-C3 SuperMini.';
  if (DIPS.indexOf(b.type) < 0) return PP(b).screen || b.type === 'cyd' ? 'Your ' + PP(b).name + ' has its brain and screen on one board, so there is no carrier board to make. Wire the extras straight to its connectors: Wire it shows which.' : 'The carrier board is made for a Pico, Pico 2, Pro Micro, Arduino Nano or ESP32-C3 SuperMini. Your ' + PP(b).name + ' wires up with push-on wires instead: Wire it shows every one.';
  const w = wiring(); if (!w.rows.length) return 'Add buttons, knobs, screens or lights first: the board connects them to the brain.';
  if (w.problems.length) return 'Fix this in Brain, Wire it, Wiring first: ' + w.problems[0];
  if (w.rows.some((r) => r.roles.some((x) => x.pin == null))) return 'A part has no pin yet. Fix it in Brain, Wire it, Wiring first.';
  return null;
}
const PADLBL = { out: 'OUT', press: 'SW', up: 'UP', down: 'DN', left: 'LT', right: 'RT', turn: 'SIG', slide: 'SIG', x: 'X', y: 'Y', light: 'LED+', data: 'DIN', sound: 'SPK+', signal: 'SIG' };
function padsFor(row) { // the pads one part gets, in the order its own pins usually sit. [what is printed next to the pad, which Pico pin it goes to]
  const N = row.N, Rr = {}, gp = (p) => LABP(p), pwr = (L) => L.map(([l, n]) => [l, n === '3V3' || n === 'VBUS' ? netName(n) : n]); row.roles.forEach((r) => { Rr[r.role] = r.pin; });
  if (N.spi) return pwr([['3V3', '3V3'], ['GND', 'GND'], ['CS', gp(Rr.cs)], ['RST', gp(Rr.rst)], ['DC', gp(Rr.dc)], ['MOSI', gp(Rr.data)], ['SCK', gp(Rr.clock)], ['LED', '3V3']]);
  if (N.cam) return pwr([['CS', gp(Rr.cs)], ['MOSI', gp(Rr.data)], ['MISO', gp(Rr.miso)], ['SCK', gp(Rr.clock)], ['GND', 'GND'], ['VCC', '3V3'], ['SDA', gp(Rr.SDA)], ['SCL', gp(Rr.SCL)]]); /* Arducam Mini header order */
  if (N.i2c) return pwr([['GND', 'GND'], ['3V3', '3V3'], ['SCL', gp(Rr.SCL)], ['SDA', gp(Rr.SDA)]]);
  const out = [];
  row.roles.forEach((r) => { if (r.two) out.push(['CLK', gp(r.pin)], ['DT', gp(r.pin + 1)]); else out.push([PADLBL[r.role] || String(r.role).toUpperCase().slice(0, 4), gp(r.pin)]); });
  if (row.power) out.push([row.power === 'VBUS' ? '5V' : '3V3', row.power]);
  out.push(['GND', 'GND']); return out.map(([l, n]) => [l, n === '3V3' || n === 'VBUS' ? netName(n) : n]); /* power on this brain's own pin names: 5V, VCC, 3V3 */
}
let PCB = null;
function boardBuild() {
  const why = pcbWhy(); if (why) return { ok: false, errors: [why] };
  const key = JSON.stringify([BRDX().name, S.style, S.cols, S.rows, S.magnets, S.items.map((i) => [i.id, i.type, i.panel, Math.round(i.x * 10), Math.round(i.y * 10), i.r || 0]), S.pins]);
  if (PCB && PCB.key === key) return PCB.b;
  const d = dims(), br = S.items.find((i) => PP(i) && PP(i).cat === 'brain'), w = wiring(), big = (polys) => polys.slice().sort((a, b) => Math.abs(G.area([b])) - Math.abs(G.area([a])));
  // the board stays 0.8 mm off the inside of the wall. Magnet lids have bosses on the wall, so stay well clear of those.
  const keepPolys = big(G.offset(outline(), -(R.T + 0.8 + (isClam() && S.magnets ? 9 : 0)))), ps = posts().map(([x, y]) => ({ x, y, r: R.POSTR + 0.8 }));
  if (!keepPolys.length) return { ok: false, errors: ['This body is too small for a board.'] };
  const zones = S.items.filter((i) => i.panel === 'inside' && PP(i) && PP(i).cat !== 'brain').map((i) => { const P = PP(i), odd = (i.r || 0) % 2, hw = (odd ? P.h : P.w) / 2, hh = (odd ? P.w : P.h) / 2; return { x0: i.x - hw, y0: i.y - hh, x1: i.x + hw, y1: i.y + hh }; });
  const legend = w.rows.map((row) => String(row.it.label).toUpperCase().replace(/[^A-Z0-9 +\-./]/g, ' ')); const groups = w.rows.map((row) => { const it = S.items.find((i) => String(i.id) === String(row.it.key)); if (!it) return null; return { title: String(row.it.label).split(' ')[0].toUpperCase(), /* just T3: the legend on the back says what it is */ x: it.x, y: it.panel === 'lid' ? d.D - 12 : it.y, pads: padsFor(row).map(([label, net]) => ({ label, net })) }; }).filter(Boolean);
  const pw = powerInfo(), b = makeBoard({ legend, keepin: keepPolys[0], posts: ps, pico: { x: br.x, y: br.y, r: br.r || 0 }, brd: dipOf(BRDX(), BOARD_OF[br.type], PP(br).w, PP(br).h), zones, groups, diode: PICOS.indexOf(br.type) > -1 && !!pw.mah && !S.items.some((i) => i.type === 'liposhim'), name: 'NOCIV CASE ZERO ' + bshort().toUpperCase().replace(/[^A-Z0-9 ]/g, ''),
    finalize: (r) => { const rc = [G.rect(r.x0, r.y0, r.x1, r.y1)], cut = G.diff(G.diff(keepPolys.slice(0, 1), G.diff(keepPolys.slice(0, 1), rc)), ps.map((q) => G.circle(q.x, q.y, q.r, 32))); return big(cut).filter((p) => Math.abs(G.area([p])) > 4); } });
  PCB = { key, b }; return b;
}
function boardReadme(b) {
  const L = ['NOCIV Case Zero carrier board', 'Size: ' + b.box.w.toFixed(1) + ' x ' + b.box.h.toFixed(1) + ' mm. 2 layers.', '',
    'ORDER', 'Upload this zip at a board factory (JLCPCB, PCBWay and others). Pick: 2 layers, 1.6 mm thick, any colour. Leave the rest as it is. They make 5 or more at a time.', 'The price you see there is the real one. Shipping often costs more than the boards.', '',
    'NOT FACTORY TESTED YET', 'The app checked these files twice (every gap, every connection), but NOCIV has not ordered and built this board yet. Order one small batch and test it before you count on it.', '',
    'SOLDER', '1. ' + bshort() + ': solder its two rows of pins into the two long rows of holes. The square marks pin 1. The USB plug goes to the end marked USB.'];
  if (b.diode) L.push('2. D1: a 1N5817 diode in the two holes joined by the arrow. The stripe on the diode goes to the end with the bar.', '3. Battery side (after the charger and the switch): plus to BAT+, minus to the GND next to it.');
  L.push((b.diode ? '4' : '2') + '. Every part: a short wire from each of its pins to the hole with the same name, right under the part.', '', 'PADS');
  b.rows.forEach((r) => { L.push(r.g.isDiode ? 'BATTERY IN: BAT+ and GND holes, then diode D1 into the Pico VSYS pin' : r.g.title + ': ' + r.g.pads.map((p) => p.label + ' -> ' + p.net).join(', ')); });
  L.push('', 'Screws: 4 x M2, 6 mm, into the posts on the case floor.');
  return L.join('\n');
}
// BOM.csv + CPL.csv (JLCPCB / PCBWay format): what sits on the board and where. X/Y in mm from the board's lower left corner, the same origin as the Gerbers.
function bomCpl(b) { const br = S.items.find((i) => PP(i) && PP(i).cat === 'brain'), BP = PP(br), PC = CZ.PCB || {}, ox = b.box.x0, oy = b.box.y0, q = (v) => (/[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v)), mm = (v) => v.toFixed(2) + 'mm';
  const bom = [['Comment', 'Designator', 'Footprint', 'LCSC Part #', 'MPN', 'Qty', 'Note']], cpl = [['Designator', 'Mid X', 'Mid Y', 'Layer', 'Rotation']], B = BRDX(), hn = String(Math.max(B.left.length, B.right.length)).padStart(2, '0');
  bom.push([BP.name, 'U1', BP.fp || '', BP.lcsc || '', BP.mpn || '', 1, 'Brain module: hand-solder']); cpl.push(['U1', mm(br.x - ox), mm(br.y - oy), 'Top', ((br.r || 0) * 90) % 360]);
  const H = PC._hdr || { fp: '', mpn: '' }; bom.push(['Female header 1x' + hn, 'J1,J2', H.fp.replace('{n}', hn), '', H.mpn.replace('{n}', hn), 2, 'Optional: lets the brain unplug']);
  if (b.diode) { const r = b.rows.find((x) => x.g.isDiode), pd = b.pads.filter((p) => p.group === (r && r.g) && /^D1/.test(p.label)), D = PC._diode || {}; bom.push(['1N5817', 'D1', D.fp || '', D.lcsc || '', D.mpn || '1N5817', 1, 'Stripe to the bar']); if (pd.length) cpl.push(['D1', mm(pd.reduce((a, p) => a + p.x, 0) / pd.length - ox), mm(pd.reduce((a, p) => a + p.y, 0) / pd.length - oy), 'Top', r.v ? 90 : 0]); }
  b.rows.forEach((r) => { if (r.g.isDiode) return; const pd = b.pads.filter((p) => p.group === r.g); if (!pd.length) return; const it = S.items.find((i) => String(numbers()[i.id]) === r.g.title || String(numbers()[i.id]).toUpperCase() === r.g.title), P = it ? PP(it) : null;
    bom.push([P ? P.name : r.g.title, r.g.title, P && P.fp || 'Wire pads 1x' + pd.length + ' P2.54mm', P && P.lcsc || '', P && P.mpn || '', 1, 'Wired to pads ' + r.g.title + ' (' + pd.map((p) => p.label).join(' ') + ')']);
    cpl.push([r.g.title, mm(pd.reduce((a, p) => a + p.x, 0) / pd.length - ox), mm(pd.reduce((a, p) => a + p.y, 0) / pd.length - oy), 'Top', r.v ? 90 : 0]); });
  const csv = (L) => L.map((row) => row.map(q).join(',')).join('\r\n') + '\r\n';
  return [{ name: 'BOM.csv', text: csv(bom) }, { name: 'CPL.csv', text: csv(cpl) }]; }
function pcbHtml() {
  let h = '<p class="h" style="margin-top:0">Clean it: one board, no nest of wires</p>';
  const b = boardBuild();
  if (!b.ok) return h + '<p class="note"><span class="bad">' + esc(b.errors[0]) + '</span></p><p class="note">The board is one flat piece the Pico solders onto, with labelled holes right under every part. The app lays it out from your Arrange and your pins, then writes the files a board factory needs.</p>';
  const tall = (() => { const was = S.pcb; S.pcb = false; const a = heights().H; S.pcb = true; const c = heights().H; S.pcb = was; return c - a; })();
  h += boardSvg(b) + '<p class="note"><span class="ok">All ' + b.check.connected + ' pads connected and checked.</span> ' + b.box.w.toFixed(0) + ' x ' + b.box.h.toFixed(0) + ' mm. Yellow lines run on top, blue underneath. Smallest gap between two pieces of copper: ' + b.check.minGap.toFixed(2) + ' mm (factories need 0.13 to 0.2).</p>';
  h += '<button class="btn dark" data-act="saveboard" style="width:100%;margin-top:8px">Save the board files</button>';
  h += '<div class="order5"><b>Order 5 Boards (JLCPCB / PCBWay)</b><ol><li>Open <a href="https://jlcpcb.com/quote" target="_blank" rel="noopener">jlcpcb.com/quote</a> or <a href="https://www.pcbway.com/orderonline.aspx" target="_blank" rel="noopener">pcbway.com</a> and upload <b>casezero-board.zip</b> as it is. It reads the Gerbers by itself.</li><li>Keep 2 layers, 1.6 mm, quantity <b>5</b>. Want them assembled? Turn on assembly and upload <b>BOM.csv</b> and <b>CPL.csv</b> from the same zip.</li><li>Check the board picture they show, then pay. Most arrive in 1 to 2 weeks.</li></ol><p>BOM.csv lists each part with its footprint and maker part number (MPN). Brains, screens and sensor boards are modules you solder yourself, so their LCSC # is blank: search the MPN in the factory parts search before you turn assembly on.</p></div>';
  h += '<p class="note"><span class="bad">Not factory tested yet.</span> The app checks every gap and connection, but NOCIV has not ordered one of these yet. Order one small batch first.</p>';
  h += '<div class="selbar" style="margin-top:8px"><b>Make my case fit it</b>' + [['1', 'Yes'], ['0', 'No']].map((m) => '<button data-pcb="' + m[0] + '"' + ((S.pcb ? '1' : '0') === m[0] ? ' style="background:#1a1a1a;color:#fff"' : '') + '>' + m[1] + '</button>').join('') + '</div>';
  h += '<p class="note">' + (S.pcb ? 'On. The case floor has 4 posts for the board (M2 screws) and no posts for the Pico. ' + (tall > 0 ? 'The case is ' + tall + ' mm taller so the electronics clear the board. ' : '') + 'Make your print files again in Body, Finish.' : 'Off. Turn it on and the case gets 4 posts for the board' + (tall > 0 ? ' and grows ' + tall + ' mm taller so the electronics clear it' : '') + '.') + '</p>';
  h += '<details class="fold"><summary>How to order and solder it</summary><div class="list"><div class="it"><b>Order</b>Upload the zip at a board factory (JLCPCB, PCBWay). Pick 2 layers, 1.6 mm thick, leave the rest. They make 5 at a time. ' + (b.box.w > 100 || b.box.h > 100 ? 'This board is bigger than 100 x 100 mm, which costs more: a smaller body or parts closer together makes it cheaper.' : 'Boards under 100 x 100 mm like this one are the cheap size.') + ' The price on their page is the real one, and shipping often costs more than the boards.</div>' +
    '<div class="it"><b>Solder</b>The Pico into the two long rows (the square is pin 1, USB end is marked). Then a short wire from each part straight down to the holes with its name.' + (b.diode ? ' D1 is a 1N5817 diode: stripe to the bar. The battery side goes to BAT+ and the GND next to it.' : '') + '</div></div></details>';
  return h;
}
// ---------- cost, shopping, power ----------
const money = (n) => '$' + (n >= 100 ? Math.round(n) : n.toFixed(n % 1 ? 2 : 0));
function shopRows() {
  // one row per kind of part. Parts already soldered on a photographed board are yours: nothing to buy. "Have it" takes a row off the bill.
  const P = PARTS(), m = {};
  S.items.forEach((i) => { const p = P[i.type]; if (!p || p.cat === 'mine' || p.cat === 'hw') return; const r = m[i.type] || (m[i.type] = { t: i.type, p, n: 0, own: 0 }); r.n++; if (i.of != null) r.own++; });
  return Object.keys(m).map((t) => { const r = m[t]; r.have = !!S.have[t]; r.buy = r.have ? 0 : r.n - r.own; r.sum = r.buy * (r.p.price || 0); return r; });
}
function extraRows() {
  const P = PARTS(), out = [], loose = S.items.filter((i) => P[i.type] && P[i.type].cat !== 'mine' && i.of == null), wires = loose.some((i) => P[i.type].link !== 'plug' && (WIRES[i.type] == null || WIRES[i.type] > 0));
  if (wires) out.push({ t: 'x_wires', name: 'Jumper wires, 40 pack', each: 4 });
  if (wires && (S.how || 'push') === 'push') { const wp = wirePlan(); if (wp.hubs && wp.hubs.length) out.push({ t: 'x_lever', name: 'Lever connectors, 5 hole (' + wp.hubs.length + ')', each: Math.max(1, Math.round(wp.hubs.length * 0.7)) }); }
  { const dS = !isPanel() && !S.snap && !S.deckMag ? posts().length * panels().length : 0, mS = S.attachedParts.filter((m) => m.mountType === 'screw' && MOUNTABLE[m.partId]).reduce((q, m) => q + mountCount(m), 0); /* the deck screws plus one for every part mounted with a screw */
    if (dS + mS) out.push({ t: 'x_m3', name: 'M3 screws, 8 mm, ' + (dS + mS) + ' (' + [dS ? dS + ' for the deck' : '', mS ? mS + ' for mounted parts' : ''].filter(Boolean).join(', ') + ', small box)', each: 3 }); }
  if (isPanel() && S.phold === 'screws' && !swapOn()) out.push({ t: 'x_m3', name: 'M3 screws (small box)', each: 3 }); /* swap mode: the insert has no box screws, the frame does */
  if (S.items.some((i) => i.type === 'esp32cam')) out.push({ t: 'x_cammb', name: 'ESP32-CAM-MB USB programmer (the ESP32-CAM has no USB plug)', each: 2 });
  if (S.xp && S.xp.ch && S.xp.ch.servo) out.push({ t: 'x_sg90', name: '1 x SG90 Micro Servo (character arm)', each: 2 });
  if (swapOn()) { const nI = swapList().length; if (S.swap.mount === 'magnets') { const nm = 4 * (1 + nI); out.push({ t: 'x_swapmag', name: nm + ' x Magnets 6 x 3 mm (swap frame and ' + nI + ' insert' + (nI > 1 ? 's' : '') + ')', each: 3 * Math.ceil(nm / 10) }); } else out.push({ t: 'x_swapm3', name: '4 x M3 x 8 mm screws (swap insert corners)', each: 1 }); out.push({ t: 'x_swapcsk', name: '4 x M3 x 10 mm countersunk screws, or #4 wood screws (swap frame into the box)', each: 1 }); }
  { const nS = S.items.filter((i) => i.type === 'shroud').length + S.ports.filter((p) => p.kind === 'p_shroud' && !portBlocked(p)).length; if (nS) out.push({ t: 'x_shroudscr', name: (4 * nS) + ' x M3 x 10 mm screws (raised shroud flange)', each: nS }); }
  { const nT = S.attachedParts.filter((m) => m.partId === 'tripod').length; if (nT) out.push({ t: 'x_nut', name: nT + ' x 1/4"-20 hex nut (tripod mount)', each: 0.5 * nT }); }
  { const nC = S.attachedParts.filter((m) => m.partId === 'charm' && (m.charm || xp().charm).hook === 'lug').length; if (nC) out.push({ t: 'x_clasp', name: nC + ' x Trigger clasp keyring (for the charm lug)', each: 2 * nC }); }
  if (isClam() && S.magnets) out.push({ t: 'x_mag', name: 'Round magnets 6 x 3 mm, 4 or more', each: 3 });
  if (!isPanel() && !S.snap && S.deckMag) out.push({ t: 'x_dmag', name: 'Round magnets 6 x 3 mm for the deck, ' + 2 * posts().length * panels().length, each: 3 });
  if (hatchZ() && hatchKind() === 'screw') out.push({ t: 'x_hatch', name: 'M3 x 6 screws for the hatch, 2', each: 1 });
  if (isClam() && S.hinge === 'metal') out.push({ t: 'x_hinge', name: '25 mm butt hinges, 2', each: 3 });
  const pw = powerInfo(); if (pw.mah && !loose.some((i) => i.type === 'liposhim')) out.push({ t: 'x_d1', name: 'Schottky diode 1N5817 (keeps USB power out of the battery)', each: 0.5 });
  if (pcbOn()) { const Bd = boardBuild(); if (Bd.ok) { out.push({ t: 'x_pcb', name: 'Carrier boards, 5 from a board factory (rough price, shipping extra)', each: Bd.box.w > 100 || Bd.box.h > 100 ? 15 : 4 }); out.push({ t: 'x_m2', name: 'M2 screws, 6 mm, 4 for the board', each: 2 }); } }
  out.forEach((r) => { r.have = !!S.have[r.t]; r.sum = r.have ? 0 : r.each; });
  return out;
}
function cost(light) {
  const rows = shopRows(), ex = extraRows(), parts = rows.reduce((a, r) => a + r.sum, 0), extras = ex.reduce((a, r) => a + r.sum, 0);
  let plastic = 0; if (!light && S.items.length && S.material !== 'wood') { try { plastic = estimate().grams * 0.02; } catch (e) { plastic = 0; } }
  return { rows, ex, parts, extras, plastic, total: parts + extras + plastic };
}
// How much power each part pulls, in mA. Rough, typical numbers: good enough to tell 3 hours from 30.
const DRAW = { pico: 30, picow: 60, pico2: 30, esp32: 90, zero2: 250, pi5: 900, cyd: 150, tft28: 80, round128: 40, oled096: 15, hdmi5: 300, hdmi7: 500, ring12: 80, led5: 10, speaker28: 60, servo: 150 };
function powerInfo() {
  const P = PARTS(), list = S.items.filter((i) => P[i.type]), mah = list.reduce((a, i) => a + (P[i.type].mah || 0), 0), bi = brainInfo();
  const ma = Math.max(30, list.reduce((a, i) => a + (DRAW[i.type] || 0), 0) + (bi && !list.some((i) => i.type === bi.type) ? DRAW[bi.type] || 30 : 0));
  return { mah, ma, hours: mah ? mah * 0.8 / ma : 0, charger: list.some((i) => P[i.type].charger), sw: list.some((i) => i.type === 'rocker' || i.type === 'liposhim' || i.type === 'slidesw'), pi: !!bi && (bi.type === 'pi5' || bi.type === 'zero2') };
}
function powerNote() {
  const p = powerInfo(); if (!S.items.length) return 'Add your electronics first, then a battery: the run time depends on what it has to power.';
  if (!p.mah) return 'No battery yet: it runs from the USB cable. Add a battery and a charger to cut the cord. With these electronics a 1200 mAh battery lasts about <b>' + hrs(1200 * 0.8 / p.ma) + '</b>.';
  let o = 'About <b>' + hrs(p.hours) + '</b> on a charge (a rough guess: ' + p.mah + ' mAh battery, electronics pull about ' + p.ma + ' mA).';
  if (p.pi) o += ' <span class="bad">A Raspberry Pi needs 5 volts: a bare LiPo cannot run it.</span> Use a USB power bank or a Pi battery board instead.';
  else if (!p.charger) o += ' <span class="bad">Add a charger</span> so you can charge it: the Pico charger (uses the Pico plug) or the USB-C charger board (cheapest).';
  else if (!p.sw) o += ' Add the power switch so off really is off.';
  if (p.mah && !p.pi && !S.items.some((i) => i.type === 'liposhim')) o += ' <b>Put a 1N5817 diode between the battery side and the Pico VSYS pin</b>, stripe toward the Pico, so USB power can never push back into the battery. The board in Brain, Board has the spot for it.';
  if (p.charger && S.items.some((i) => i.type === 'tp4056')) o += ' In Arrange, slide the USB-C charger against a wall and Turn it so its plug faces out.';
  return o;
}
const hrs = (h) => (h >= 10 ? Math.round(h) + ' hours' : h >= 1 ? (Math.round(h * 2) / 2) + ' hours' : Math.max(5, Math.round(h * 12) * 5) + ' minutes');
const recipe = () => (S.recipe && (CZ.RECIPES || []).find((r) => r.id === S.recipe)) || null;
const recipeFn = () => (S.beh ? (S.beh === 'test' ? null : S.beh) : (recipe() && recipe().fn) || null); /* a starter's own program: macro, timer, synth or sampler */
function creditHtml() {
  const r = recipe(); if (!r) return '';
  return '<details class="fold"><summary>Code: ' + esc(r.credit.project) + ' by ' + esc(r.credit.by) + '</summary><div class="list"><div class="it"><b>' + esc(r.name) + ': the code</b>Comes from <a href="' + esc(r.credit.url) + '" target="_blank" rel="noopener" style="display:inline;padding:0;border:0;text-decoration:underline">' + esc(r.credit.project) + '</a> by ' + esc(r.credit.by) + ' (license: ' + esc(r.credit.license) + '). Their work, their credit. Our starter code in Brain, Wire it, Wiring only proves your wiring works.<small>' + esc(r.note) + (r.tested ? '' : ' Not test-built by NOCIV yet.') + '</small></div></div></details>';
}
const shapePreset = () => (CZ.RECIPES || []).find((r) => r.preset && r.style === S.style) || null;
function shapePresetHtml() { const r = shapePreset(); if (!r) return '';
  return '<button type="button" class="btn red" data-spre="' + r.id + '" style="width:100%;margin-top:8px"><b>Open-source preset: ' + esc(r.name) + '</b> &middot; ' + esc(r.cost || aboutCost(r)) + '<small style="display:block;font-weight:500">' + esc(r.parts.map(([t, n]) => (n > 1 ? n + 'x ' : '') + ((CZ.PARTS[t] || {}).short || t)).join(' + ')) + '</small></button>'; }
function presetLinksHtml() { const r = recipe(); if (!r) return '';
  const L = r.links || [[r.credit.project, r.credit.url, 'Their page']];
  return '<p class="h" style="margin-top:12px">Open-source code + libraries</p>' + creditHtml() + '<div class="list">' + L.map(([n, u, d]) => '<a href="' + esc(u) + '" target="_blank" rel="noopener"><b>' + esc(n) + '</b>' + esc(d || '') + '</a>').join('') + '</div>' + (r.preset && r.note ? '<p class="note keep">' + esc(r.note) + '</p>' : ''); }
// ---------- Compatibility Co-Pilot: when a build hits a hardware limit, a calm why plus 1-Tap Fixes, and always a way to carry on ----------
const SOUNDOUT = ['speaker28', 'jack35', 'i2sdac'], AVRB = ['uno', 'nano', 'promicro'], ANALOG = ['pot', 'slider', 'thumb'];
const brainItem = () => S.items.find((i) => PP(i) && PP(i).cat === 'brain');
const hasT = (t) => S.items.some((i) => i.type === t);
const NOCLIP = ['loop', 'echo', 'spiral', 'phaser', 'beat', 'wet', 'step', 'note', 'macro'];
const clipCount = () => S.items.reduce((n, i) => n + (BTNS.indexOf(i.type) > -1 && !i.step && NOCLIP.indexOf(i.action) < 0 ? 1 : i.type === 'keypad44' ? 12 : i.type === 'dpad' ? 4 : 0), 0); /* every pad that can play its own clip */
const analogUsed = () => S.items.filter((i) => ANALOG.indexOf(i.type) > -1).length;
function copilot() {
  const bi = brainInfo(); if (!bi) return [];
  const bk = BOARD_OF[bi.type], B = BRDX(), nm = bmini(B.name), ok = S.cpOk || {}, out = [], fn = recipeFn(), canSwap = bk !== 'pico' && !!brainItem();
  let w; try { w = wiring(); } catch (e) { w = { problems: [], rows: [] }; }
  const add = (id, title, why, fixes) => { if (!ok[id + ':' + bk]) out.push({ id, title, why, fixes }); };
  const sound = SOUNDOUT.some(hasT) || fn === 'sound' || fn === 'sampler', store = hasT('dfplayer') || hasT('sdcard');
  if (AVRB.indexOf(bk) > -1 && sound && !store && S.beh !== 'midi')
    add('audio', 'Sound clips need somewhere to live', 'The ' + nm + ' keeps its code in 32 KB and has no room for sound files, so on its own it can only beep tones. Pick one way to play real clips.',
      [['add', 'dfplayer', '+ Add $2 DFPlayer Mini + SD'], ['beh', 'midi', 'Play via Laptop (Serial MIDI)']].concat(canSwap ? [['brain', 'pico', 'Swap to Pico']] : []).concat([['ok', '', 'I already have this / Continue']]));
  if (bk === 'pico' && sound && !store && clipCount() > 4 && (recipe() || {}).group !== 'games' && !(fn === 'sampler' && hasT('keypad44'))) /* a game's buttons steer; the keypad sampler synthesizes its pads (synthio), no clips */
    add('clips', 'Room for about 4 clips', 'The Pico keeps clips in its own 2 MB of flash, next to the code: about 4 short .wav clips (16-bit, 22 kHz, 5 s each) fit. Your build has ' + clipCount() + ' pads.',
      [['add', 'sdcard', '+ Add $2 MicroSD Reader'], ['ok', '', 'Keep 4 clips']]);
  if (w.problems.some((p) => /^Out of pins/.test(p))) {
    const loose = S.items.filter((i) => BTNS.indexOf(i.type) > -1 && i.of == null && !i.step).length;
    add('pins', 'Out of pins', 'The ' + nm + ' has run out of free pins: every button and part wants its own wire. A 4x4 matrix reads 16 buttons on 8 wires.',
      (loose >= 2 && !hasT('keypad44') ? [['matrix', '', 'Switch to 4x4 Matrix']] : []).concat(canSwap ? [['brain', 'pico', 'Swap to Pico']] : []).concat([['ok', '', 'Continue']]));
  }
  const low = AVRB.indexOf(bk) > -1 ? S.items.filter((i) => V33[i.type]) : [];
  if (low.length && !hasT('lvlshift'))
    add('v33', '3.3V part on a 5V ' + nm, Array.from(new Set(low.map((i) => PP(i).short))).join(', ') + (low.length > 1 ? ' run' : ' runs') + ' on 3.3V. ' + (B.v3 === '3V3' ? 'Power is already routed to the 3V3 pin in Wired, so the part is safe to power.' : 'The ' + nm + ' has no 3V3 pin: use a breakout with its own 3.3V regulator.') + ' A level shifter keeps the 5V signal wires gentle on it too.',
      [['add', 'lvlshift', '+ Add $1 Level Shifter'], ['ok', '', 'I already have this / Continue']]);
  if (bk === 'pico' && w.problems.some((p) => /needs an analog pin/.test(p)))
    add('analog', 'More than 3 knobs', 'The Pico has 3 analog pins (GP26, GP27, GP28) and your build has ' + analogUsed() + ' knobs, sliders or sticks. A Click wheel turns like a knob but uses normal pins.',
      [['enc', '', 'Swap 1 Knob to Click Wheel'], ['ok', '', 'Continue']]);
  return out;
}
function copilotHtml() { const n = copilot().length + pfList().length; return n ? '<button type="button" class="warnp" data-act="cpopen">&#9888; ' + n + ' note' + (n > 1 ? 's' : '') + ' &middot; Tap to fix</button>' : ''; } /* hardware notes fold into one amber pill; the fixes open in a sheet */
function copilotFull() { const L = copilot(), F = pfList(); return (F.length ? '<div class="cop"><b>Check before you wire</b>' + F.map((w) => '<p>' + esc(w) + '</p>').join('') + '</div>' : '') + L.map((c) => '<div class="cop" role="status"><b>' + esc(c.title) + '</b><p>' + esc(c.why) + '</p><div class="cofx">' + c.fixes.map((f) => '<button type="button" class="' + (f[0] === 'ok' ? 'go' : 'fx') + '" data-cp="' + c.id + '|' + f[0] + '|' + f[1] + '">' + (f[0] === 'ok' ? '' : '<i>1-Tap Fix</i>') + esc(f[2]) + '</button>').join('') + '</div></div>').join(''); }
function cpFix(v) {
  const [id, kind, arg] = v.split('|'), bi = brainInfo(), bk = bi && BOARD_OF[bi.type], P = PARTS();
  if (kind === 'ok') { S.cpOk = S.cpOk || {}; S.cpOk[id + ':' + bk] = 1; save(); render(); tag('Carry on: nothing changed.'); return; }
  if (kind === 'enc') { const it = S.items.slice().reverse().find((i) => (i.type === 'pot' || i.type === 'slider') && i.of == null); if (it) { testReset(); swapType(it, 'encoder'); } return; }
  snapU();
  if (kind === 'add') { addPart(arg); S.pins = {}; tag('Added the ' + P[arg].short + '. Wired, the code and the shop list follow it.'); }
  if (kind === 'beh') { S.beh = arg; testReset(); tag('Sound now goes to your laptop as Serial MIDI. Run the free Hairless MIDI bridge on the computer.'); }
  if (kind === 'brain') { const b = brainItem(); if (b) { b.type = arg; S.pins = {}; snapBrain(b); tag('Your brain is now a ' + P[arg].short + '. Pins and code follow it.'); } }
  if (kind === 'matrix') { const n = S.items.filter((i) => BTNS.indexOf(i.type) > -1 && i.of == null && !i.step).length; S.items = S.items.filter((i) => !(BTNS.indexOf(i.type) > -1 && i.of == null && !i.step)); addPart('keypad44'); S.pins = {}; tag(n + ' buttons became one 4x4 matrix: 16 keys on 8 pins.'); }
  testReset(); save(); render();
}
// Chip-aware badges: with a brain picked, every part says how well it goes with it
function compat(k) {
  const bi = brainInfo(), P = PARTS()[k]; if (!bi || !P || P.cat === 'brain' || P.cat === 'mine') return null;
  const N = NEED[k], B = BRDX(), bk = BOARD_OF[bi.type], nm = bmini(B.name), avr = AVRB.indexOf(bk) > -1, an = N && N.pins && N.pins.some((p) => p[1] === 'a');
  const no = (alt) => ['no', 'Not compatible', alt], note = (why) => ['note', '1 note', why];
  if (N && N.pi && !B.pi) return no('An HDMI screen needs a Raspberry Pi. Try the 2.8 in screen.');
  if (!B.spi && N && (N.spi || N.cam || N.sd)) return no('Its SPI runs ' + (B.builtIn || 'other parts') + '. Try the 0.96 in OLED (I2C).');
  if (avr && k === 'i2sdac') return no('No I2S sound on the ' + nm + '. Try the $2 DFPlayer Mini.');
  if (avr && k === 'inmp441') return no('No I2S input on the ' + nm + '. Swap to a Pico for the mic.');
  if (B.pi && an) return note('The Pi has no analog pins: add an ADS1115 board.');
  if (avr && V33[k]) return note('3.3V part: Wired powers it from 3V3. A $1 level shifter protects its signal pins.');
  if (!avr && k === 'lcd1602') return note('Runs on 5V: put a level shifter on SDA and SCL.');
  if (avr && k === 'sdcard') return note('The SD library uses about 600 bytes of the ' + nm + "'s 2 KB memory.");
  if (bk === 'pico' && an && analogUsed() >= 3) return note('All 3 analog pins are taken. A Click wheel fits.');
  return ['ok', 'Fits', ''];
}
// "What You're Getting Into": three calm lines before buying
function intoCard() {
  const B = BRDX(), loose = S.items.filter((i) => PP(i) && i.of == null && PP(i).cat !== 'mine'), sol = loose.filter((i) => PP(i).link === 'solder');
  const wire = pcbOn() ? ['5 pre-assembled boards', 'One carrier board for everything, made 5 at a time by a board factory.'] : sol.length ? ['Light soldering', 'A few joints on the ' + Array.from(new Set(sol.map((i) => PP(i).short))).join(', ') + '. The rest push on.'] : ['Push-on wires', 'Jumper wires push onto the pins. No soldering iron.'];
  const code = B.ino ? ['Arduino IDE .ino', 'Open it in the free Arduino IDE and press Upload.'] : B.cp ? ['Drag-and-drop code.py', 'Copy code.py onto the CIRCUITPY drive. It runs by itself.'] : ['Python on the Pi', 'The pin list for your own Python script.'];
  let n = copilot().length; try { n += wiring().problems.length + pfList().length; } catch (e) {}
  const chk = n ? [n + ' thing' + (n > 1 ? 's' : '') + ' to check', 'See the notes above, each with a 1-Tap Fix.', 'amb'] : ['All parts check out', 'Every part works with the ' + bmini(B.name) + '.', 'ok'];
  const row = (k, v, c) => '<div><span>' + k + '</span><b' + (c ? ' class="' + c + '"' : '') + '>' + esc(v[0]) + '</b><small>' + esc(v[1]) + '</small></div>';
  return '<div class="into"><p class="h" style="margin:0 0 4px">What You\'re Getting Into</p>' + row('Wiring', wire) + row('Coding', code) + row('Hardware', chk, chk[2]) + '</div>';
}
const KIT_SUPER = ['uno', 'tact12', 'pot', 'thumb', 'servo', 'lcd1602', 'led5'], KIT_BIG = KIT_SUPER.concat(['keypad44', 'mat8', 'pir']), KIT_BASIC = KIT_BIG.concat(['button16', 'buzzer']);
function kitInfo(c) { // an Uno and 3 or more starter parts: one kit box beats buying each part
  if (!S.items.some((i) => i.type === 'uno') || S.items.filter((i) => KIT_BASIC.includes(i.type)).length < 3) return null;
  const big = S.items.some((i) => i.type === 'keypad44' || i.type === 'mat8'), kit = big ? { name: 'ELEGOO UNO R3 Most Complete Starter Kit', q: 'ELEGOO UNO R3 Most Complete Starter Kit', price: 55, cov: KIT_BIG } : { name: 'ELEGOO UNO R3 Super Starter Kit', q: 'ELEGOO UNO R3 Super Starter Kit', price: 37, cov: KIT_SUPER };
  const rows = c.rows.filter((r) => kit.cov.includes(r.t)), wires = c.ex.filter((r) => /jumper|dupont/i.test(r.name)), pieces = rows.reduce((a, r) => a + r.n, 0);
  const val = rows.reduce((a, r) => a + (r.p.price || 0) * r.n, 0) + wires.reduce((a, r) => a + (r.each || 0), 0), rest = c.rows.filter((r) => !kit.cov.includes(r.t) && !r.have).reduce((a, r) => a + r.sum, 0) + c.ex.filter((r) => !wires.includes(r) && !r.have).reduce((a, r) => a + r.sum, 0);
  return { kit, rows, wires, pieces, val, rest, cover: rows.map((r) => r.t).concat(wires.map((r) => r.t)), all: c.rows.length + c.ex.length }; }
const MPACKS = [{ t: ['tact12', 'button16'], name: '150-pc Tactile Button Kit', q: 'tactile push button assortment kit 150 pcs', price: 7, per: 150 }, { t: ['servo'], name: '4-pack SG90 Servos', q: 'SG90 micro servo 4 pack', price: 10, per: 4 }, { t: ['esp32cam'], name: 'ESP32-CAM-MB w/ USB board', q: 'ESP32-CAM-MB USB programmer board', price: 12, per: 1 },
  { ex: /\bM3\b/, name: 'M3 Screw Assortment', q: 'M3 screw nut assortment kit', price: 10 }, { ex: /magnet/i, name: '6x3mm Magnet Pack', q: '6x3mm neodymium magnets', price: 8 }];
function checkout(c) { // what you really pay on Amazon: small parts only come in packs
  const used = c.rows.filter((r) => !r.have).reduce((a, r) => a + r.sum, 0) + c.ex.filter((r) => !r.have).reduce((a, r) => a + r.sum, 0), packs = [];
  let real = 0; const inPack = (r, isEx) => MPACKS.find((m) => (isEx ? m.ex && m.ex.test(r.name) : m.t && m.t.includes(r.t)));
  c.rows.filter((r) => !r.have).forEach((r) => { const m = inPack(r, false); if (!m) { real += r.sum; return; } const need = r.buy != null ? r.buy : r.n; if (!need) return; const k = packs.find((x) => x.m === m); if (k) k.n += need; else packs.push({ m, n: need }); });
  c.ex.filter((r) => !r.have).forEach((r) => { const m = inPack(r, true); if (!m) { real += r.sum; return; } if (!packs.some((x) => x.m === m)) packs.push({ m, n: 1 }); });
  packs.forEach((x) => { x.cnt = x.m.per ? Math.ceil(x.n / x.m.per) : 1; real += x.cnt * x.m.price; });
  return { used, real, packs }; }
function kitHtml(c, amz) {
  const k = kitInfo(c), co = checkout(c), lk = (q) => '<span class="buy"><a class="amz" href="' + esc(amz(q)) + '" target="_blank" rel="noopener">Amazon</a></span>';
  let h = '';
  if (k) h += '<div class="it kitc"><b style="display:inline">Best Value Kit ~' + money(k.kit.price) + '</b> &middot; ' + esc(k.kit.name) + ' covers <b>' + k.cover.length + ' of your ' + k.all + ' shopping lines</b> (' + k.pieces + ' part' + (k.pieces === 1 ? '' : 's') + (k.wires.length ? ' + jumper wires' : '') + ', worth ' + money(k.val) + ' one by one). The rest of the box is spares: LEDs, resistors, a buzzer, sensors and a breadboard for your next build. ' + lk(k.kit.q) +
    '<div class="row" style="margin-top:8px"><b>I already own a Starter Kit</b><button type="button" class="tgl" data-act="ownkit" role="switch" aria-checked="' + !!S.ownKit + '">' + (S.ownKit ? 'On' : 'Off') + '</button></div>' +
    '<p class="note keep" style="margin:4px 0 0">' + (S.ownKit ? 'Checked off: ' : 'One tap checks off ') + 'Uno, buttons, pots, joystick, servo, 1602 LCD, LEDs and jumper wires. With the kit: about ' + money(k.kit.price + k.rest) + ' all in.</p></div>';
  h += '<div class="est vals"><b>Parts Used Value ' + money(co.used) + ' &middot; Realistic Amazon Checkout ~' + money(co.real) + '</b><span>Small parts only come in packs, so the checkout is what you really pay.</span></div>';
  if (co.packs.length) h += '<div class="list shopl">' + co.packs.map((x) => '<div class="it"><b>' + (x.cnt > 1 ? x.cnt + ' x ' : '') + esc(x.m.name) + ' <span class="pr">~' + money(x.cnt * x.m.price) + '</span></b>' + (x.m.per ? 'Covers your ' + x.n + ', the rest are spares. ' : 'One pack covers it. ') + lk(x.m.q) + '</div>').join('') + '</div>';
  return h; }
function shopHtml() {
  const c = cost(); if (!S.items.length) return '<p class="note" style="margin-top:0">Nothing to buy yet. Add electronics in Parts, or pick a recipe on the start screen.</p>';
  const a = (u, n) => '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + n + '</a>';
  const amz = (q) => 'https://www.amazon.com/s?k=' + encodeURIComponent(q);
  const link = (p) => { const sq = p.searchQuery || CZ.cleanQuery(p.find || p.name), q = encodeURIComponent(sq); return '<span class="buy"><a class="amz" href="' + esc(amz(sq)) + '" target="_blank" rel="noopener">Amazon</a>' + (p.url ? a(p.url, 'Maker') : '') + a('https://www.adafruit.com/search?q=' + q, 'Adafruit') + a('https://www.aliexpress.com/wholesale?SearchText=' + q, 'AliExpress') + '</span>'; };
  const haveBtn = (t, on) => '<button data-have="' + t + '" style="all:unset;cursor:pointer;float:right;padding:6px 9px;border:1.5px solid #1a1a1a;border-radius:9px;font:800 11.5px/1 var(--sys);' + (on ? 'background:#1a1a1a;color:#fff' : '') + '">' + (on ? 'Have it' : 'I have this') + '</button>';
  let h = copilotHtml() + intoCard() + '<div class="est"><b>About ' + money(c.total) + ' to build</b><span>' + money(c.parts) + ' electronics + ' + money(c.extras) + ' small stuff + ' + money(c.plastic) + ' plastic. Shipping is extra. Typical prices, not live.</span></div>';
  h += kitHtml(c, amz);
  h += '<div class="list shopl">' + c.rows.map((r) => '<div class="it">' + haveBtn(r.t, r.have) + '<b>' + r.n + ' x ' + esc(r.p.name) + (r.p.check ? ' *' : '') + ' <span class="pr">' + money(r.have ? 0 : r.sum) + '</span></b>' + (r.have ? 'You have it: $0.' : r.own ? (r.own === r.n ? 'Already on your board: $0.' : r.own + ' already on your board. ' + money(r.sum) + ' for the other ' + r.buy + '.') : money(r.p.price || 0) + ' each, ' + money(r.sum) + '.') + ' ' + link(r.p) + '</div>').join('') +
    c.ex.map((r) => '<div class="it">' + haveBtn(r.t, r.have) + '<b>' + esc(r.name) + ' <span class="pr">' + money(r.have ? 0 : r.each) + '</span></b>' + (r.have ? 'You have it: $0.' : 'About ' + money(r.each) + '.') + ' ' + link({ name: r.name }) + '</div>').join('') + '</div>';
  h += '<p class="note" style="margin:8px 0">' + powerNote() + '</p>';
  if (c.rows.some((r) => r.p.check)) h += '<p class="note">* Sizes differ by seller. Measure yours before you print.</p>';
  h += '<details class="fold" open><summary>Cheap starter kits + assortments</summary><div class="list">' + (CZ.KITS || []).map((k) => '<div class="it"><b>' + esc(k[0]) + '</b>' + esc(k[2]) + ' <span class="buy"><a class="amz" href="' + esc(amz(k[1])) + '" target="_blank" rel="noopener">Amazon</a>' + a('https://www.aliexpress.com/wholesale?SearchText=' + encodeURIComponent(k[1]), 'AliExpress') + '</span></div>').join('') + '</div></details>';
  h += '<button class="btn" data-act="savelist" style="margin-top:8px">Save the shopping + build list</button>';
  h += '<details class="fold"><summary>Ways to build it: wires, a board, your own chip</summary><div class="list"><div class="it"><b>1. Wire it <span class="ok">this build</span></b>The brain board plus loose wires. Cheapest for one device: ' + money(c.total) + '.</div><div class="it"><b>2. Clean it <span class="ok">' + (pcbOn() ? 'on' : 'ready to try') + '</span></b>One flat board the Pico solders onto, with labelled pads under every part. Short wires straight down, no nest. Factories make 5 at a time, so it pays when you build a few or split a batch. It is in Brain, Board.</div><div class="it"><b>3. Chip it <span style="color:#6f6a60">later</span></b>Your own board with the bare chip on it, soldered by the factory. The cheapest per device once you make a batch, not for one.</div></div></details>';
  return h;
}
function fitAll() { // place every loose part; if they do not all fit, grow the body a square at a time, keeping its proportions
  const z = SIZES[S.style] || [6, 4], grow = () => { if ((S.cols / S.rows < z[0] / z[1] && S.cols < 24) || S.rows >= 24) S.cols++; else S.rows++; };
  const want = S.items.filter((i) => i.of == null && i.panel !== 'inside' && PP(i)).reduce((a, i) => { const f = fp(i); return a + f.w * f.h; }, 0) * 1.25; /* start near the right size instead of growing one square at a time */
  while (S.cols * S.rows * 400 < want && (S.cols < 24 || S.rows < 24)) grow();
  for (let n = 0; n < 10; n++) {
    const list = S.items.filter((i) => i.of == null); list.forEach((i) => { i.x = -999; i.y = -999; });
    list.sort((a, b) => (fp(b).w * fp(b).h) - (fp(a).w * fp(a).h)).forEach((i) => { autoPlace(i); if (PP(i) && PP(i).board) syncKids(i); });
    if (!allProblems().length) return true;
    if (S.cols >= 24 && S.rows >= 24) break;
    grow();
  }
  return false;
}
function loadRecipe(id) {
  const r = (CZ.RECIPES || []).find((x) => x.id === id); if (!r) return;
  wipeAll(); S.items = []; S.pins = {}; S.have = {}; sel = null; LAST = null; UNDO.length = 0; /* a recipe starts from nothing too */
  placeRecipe(r);
  LAST = null; S.tab[2] = 'shape'; S.tab[5] = '3d'; save(); go(2);
  draw(); requestAnimationFrame(() => { if (T3) T3.key = ''; draw(); tag(summaryLine()); }); /* paint the case now, not an empty grid under "Building it..." */
}
function placeRecipe(r) { // a starter's own body size, parts, layout, mounts and wall ports
  S.items = []; S.pins = {}; S.power = null;
  S.style = r.style; const z = r.size || SIZES[r.style]; S.cols = z[0]; S.rows = z[1]; S.xw = S.xd = 0; S.add = r.add || 0; S.recipe = r.id; S.picked = true; S.started = true; S.pcb = false; S.wired = {};
  if (r.ch) xp().ch = Object.assign({}, xp().ch || {}, r.ch); /* e.g. Desk-Bot: screen eyes on the character's head */
  const mk = (t, x, y, rq) => { const P = CZ.PARTS[t]; if (P) S.items.push({ id: ++uid, type: t, panel: r.headScreen === t ? 'inside' : defaultPanel(P), head: r.headScreen === t || undefined, x, y, r: rq || 0 }); }; /* the head screen hangs in the head, not on the base */
  if (r.place) r.place.forEach(([t, x, y, rq]) => mk(t, x, y, rq)); /* a hand-made layout, in mm from the bottom left */
  else r.parts.forEach(([t, n]) => { for (let i = 0; i < n; i++) mk(t, -999, -999, 0); });
  if (!r.place || allProblems().length) fitAll(); /* no layout, or it does not fit after a size change in the list: place them for her */
  keepInside();
  S.attachedParts = []; S.ports = []; MPC = {};
  (r.mounts || []).forEach((q) => { const m = { id: S.attachedParts.length + 1, partId: q.partId, face: q.face, anchor: Object.assign({ v: 0 }, q.anchor), mountType: q.mountType }; if (mountBlocked(m)) return; const pts = mountPoints(m); m.anchors = [m.anchor]; if (pts.length > 1) { const ax = m.face === 'left' || m.face === 'right' ? 1 : 0; m.anchors.push({ u: m.anchor.u + Math.round(pts[0].B[0][ax] * mp(m).pitch / 20), v: m.anchor.v }); } S.attachedParts.push(m); });
  (r.ports || []).forEach((q) => { const p = { id: S.ports.length + 1, kind: q.kind, face: q.face, anchor: { u: q.u, v: 0 } }; if (!portBlocked(p)) S.ports.push(p); });
  edgeLock();
}
// Reset layout: the starter's (or the shape's) own part spots, edge-locked port and default parts. Colors, logos, printer and the rest of the build stay.
const k0 = (it) => USBK[it.type];
function edgeLock() { // and when no wall has room for it, the body grows a square at a time (up to 3) until one does
  for (let n = 0; n < 4; n++) { edgeLock1(); const br = S.items.find((i) => i.of == null && i.panel === 'inside' && PP(i) && PP(i).cat === 'brain'); if (!br || hasBattery() || isPanel() || !USBK[br.type] || autoPorts().length || n === 3 || S.lockBox) return;
    if (S.cols <= S.rows) S.cols++; else S.rows++; reflow(); S.items.forEach((i) => { i.x = -999; i.y = -999; }); fitAll(); keepInside(); }
}
function edgeLock1() { // the brain's USB end flush with a wall in its stepped port; a brain on the top (CYD) gets a stepped port at its short end
  if (isPanel() || hasBattery()) return; const br = S.items.find((i) => i.of == null && PP(i) && PP(i).cat === 'brain'); if (!br) return; const P = PP(br), k = USBK[br.type];
  if (br.panel === 'inside') { if (autoPorts().length) return; snapBrain(br); if (autoPorts().length) return; /* the nearest wall was full: make room, then try again */
    const b = G.bbox(outline()), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, m = R.T + 0.9, hw = P.w / 2, x0 = br.x, y0 = br.y, r0 = br.r || 0, others = S.items.filter((i) => i !== br && i.panel === 'inside' && i.of == null);
    const spot = (f, k) => (f === 'left' ? [0, b.x0 + m + k + hw, cy] : f === 'right' ? [2, b.x1 - m - k - hw, cy] : f === 'front' ? [1, cx, b.y0 + m + k + hw] : [3, cx, b.y1 - m - k - hw]);
    for (const f of ['left', 'right', 'front', 'back'].filter((x) => x !== hingeFace())) for (const k of [0, 0.8, 1.6, 2.4]) { /* a round or curved wall: on the centre line, a little in from the flat point */
      const [r, x, y] = spot(f, k); br.r = r; br.x = x; br.y = y; if (problems(br).filter((q) => !/^on top of|under /.test(q)).length || !wallPortOf(br, k0(br))) continue;
      others.filter((i) => problems(i).length).forEach((i) => { i.x = -999; i.y = -999; }); others.filter((i) => i.x === -999).forEach((i) => autoPlace(i)); if (!problems(br).length) return; }
    br.x = x0; br.y = y0; br.r = r0; return; }
  if (!k || S.ports.some((p) => p.auto === 'usb')) return; const d = dims(), odd = (br.r || 0) % 2, ends = odd ? [['front', br.x, br.y - P.w / 2], ['back', br.x, d.D - br.y - P.w / 2]] : [['left', br.y, br.x - P.w / 2], ['right', br.y, d.W - br.x - P.w / 2]];
  ends.sort((a, b) => a[2] - b[2]); const hf = hingeFace(), id = S.ports.reduce((q, x) => Math.max(q, +x.id || 0), 0) + 1, dz = geom().H - R.LT - geom().recess - (P.depth || 0) + 2 - (R.F + 3 + PBORE[k][1] / 2);
  for (const [face, sAt] of ends) { if (face === hf) continue; const g0 = R.T + R.CLR + 1, p = { id, kind: k, face, auto: 'usb', anchor: { u: Math.round((sAt - g0) / 20 - 0.5), v: 0, du: 0, dz } }; p.anchor.du = +(sAt - (g0 + (p.anchor.u + 0.5) * 20)).toFixed(2); if (!portBlocked(p)) { S.ports.push(p); return; } }
}
function resetLayout() {
  if (isPanel()) return; snapU(); const r = recipe(); sel = null; LAST = null; PSEL = null;
  if (r) placeRecipe(r);
  else { S.ports = S.ports.filter((p) => p.auto !== 'usb'); const z = SIZES[S.style]; if (z) { S.cols = z[0]; S.rows = z[1]; } S.xw = S.xd = 0; S.add = 0; reflow(); S.items.forEach((i) => { i.x = -999; i.y = -999; }); fitAll(); keepInside();
    edgeLock(); }
  save(); render(); tag('Layout reset: ' + (r ? r.name + ' as it was made' : 'every part back in its spot') + (allProblems().length ? '. Something still overlaps: see Arrange.' : '.'));
}
const recipeCost = (r) => r.parts.reduce((a, [t, n]) => a + ((CZ.PARTS[t] && CZ.PARTS[t].price) || 0) * n, 0);
// ---------- start: three doors ----------
// Start fresh: one reset for everything a build holds. Body, Brain and Parts, mounted parts, wall ports, shroud, swap panels and kept box, risers and electronics,
// logos and their pictures, the board photo, pin choices, and the saved draft. A ?build= or ?recipe= link is taken off the address too.
// The printer and its bed stay (they are her machine, not the build). The old build is kept once, so "Bring back the build I had before" still works.
function wipeAll() {
  backup(); const keep = { printer: S.printer, bed: S.bed };
  try { [KEY, VKEY, KEY + ':photo', KEY + ':logo'].concat(['lidout', 'lidin', 'top', 'bottom', 'back', 'front', 'left', 'right'].map((f) => KEY + ':logo:' + f)).forEach((k) => localStorage.removeItem(k)); } catch (e) {}
  try { if (location.search) history.replaceState(null, '', location.pathname); } catch (e) {}
  S = Object.assign(JSON.parse(S_DEF), keep); S.look = LOOK0(); S.phold = 'screws';
  Object.keys(LOGOIMGS).forEach((k) => delete LOGOIMGS[k]); PHOTO = null; uid = 0; sel = null; LAST = null; UNDO.length = 0; MPC = {}; markCache = {}; FILES = [];
  try { testReset(); } catch (e) {} applyWalls(); save();
}
// ---------- what the phone measured: panels at their locked size, or a Case Zero body sized to fit ----------
// Each tag becomes a part: a catalog part (button, knob, screen) at its spot, or one of your own parts (Screen, Board / Chip, Controller, Button / Cutout) with a cutout of the size you set.
// Positions are mm from the panel's middle, so the same tags land in the same place on a panel or in a case.
function measuredItems(p, cx, cy, panel) {
  const out = [], mk = (type, x, y, r) => { const it = { id: ++uid, type, panel: panel || homePanel(), x: cx + x, y: cy + y, r: r || 0 }; out.push(it); };
  (p.kids || []).forEach((k) => { const P = CZ.PARTS[k.type]; if (!P) return; mk(k.type, k.x, k.y, k.r); if (P.inside && !isPanel()) out[out.length - 1].panel = 'inside'; });
  (p.cuts || []).concat((p.holes || []).map((h) => ({ kind: 'q_hole', label: 'Hole', w: h.d, h: h.d, x: h.x, y: h.y, round: true }))).forEach((c, i) => {
    const key = 'm' + Date.now().toString(36) + out.length + i, w = Math.max(2, +c.w), h = Math.max(2, +c.h);
    S.mine[key] = { cat: 'mine', name: c.label + ', ' + w + ' x ' + h + ' mm (measured)', short: c.label === 'Board / Chip' ? 'Board' : c.label, w, h, depth: c.kind === 'q_screen' ? 6 : 5, screen: c.kind === 'q_screen', measured: true, link: 'none', price: 0,
      cut: c.round ? { o: 'circle', d: w } : { o: 'rect', w, h }, tip: 'Measured with your phone: a ' + w + ' x ' + h + ' mm cutout.', src: 'Measured with a card as the ruler' };
    mk(key, c.x, c.y, 0); });
  return out;
}
const MEASURED = {
  panels(list) { if (!list || !list.length) return; backup(); S.style = 'panel'; S.picked = true; S.started = true; S.lockBox = null;
    S.mpan = { list: list.map((p) => ({ name: p.name, w: Math.round(p.w * 2) / 2, h: Math.round(p.h * 2) / 2, lip: p.lip || null, src: p, items: null })), cur: 0 };
    S.mpan.list.forEach((q) => { S.pw = q.w; S.pd = q.h; const d = dims(); S.items = measuredItems(q.src, d.W / 2, d.D / 2, 'top'); q.src = null; reflow(); keepInside(); q.items = JSON.parse(JSON.stringify(S.items)); }); /* each panel's parts, placed at its own size */
    mpanLoad(0, true); tag(list.length > 1 ? list.length + ' panels measured: ' + list.map((p) => p.name).join(', ') + '. Switch between them in Shape, Size.' : list[0].name + ': ' + S.pw + ' x ' + S.pd + ' mm, ' + S.items.length + ' tagged parts placed.'); },
  case(style, list) { if (!list || !list.length) return; backup(); const p = list[0], c = tolOf(), m = 2 * (R.T + R.CLR + 1), gap = 2 * (R.T + R.CLR + 0.8) - m; /* the deck inside the walls has to hold the panel, plus the clearance all round */
    S.style = style; S.picked = true; S.started = true; S.lockBox = null; S.mpan = null; S.xw = S.xd = 0;
    [['cols', 'xw', p.w], ['rows', 'xd', p.h]].forEach(([q, x, v]) => { const need = v + 2 * c + m + Math.max(0, gap), n = Math.max(2, Math.min(24, Math.floor((need - m) / 20))); S[q] = n; S[x] = Math.max(0, Math.min(19.9, Math.ceil((need - m - n * 20) * 10) / 10)); if (S[x] > 19.9) { S[q]++; S[x] = 0; } });
    const d = dims(); S.items = S.items.filter((i) => PP(i) && PP(i).cat === 'brain'); S.items = S.items.concat(measuredItems(p, d.W / 2, d.D / 2)); reflow(); keepInside(); save(); S.tab[1] = homePanel(); go(1);
    tag(styleRow()[1] + ' sized to ' + Math.round(d.W) + ' x ' + Math.round(d.D) + ' mm to hold ' + p.name + ' (' + p.w.toFixed(1) + ' x ' + p.h.toFixed(1) + ' mm + ' + c + ' mm clearance).'); }
};
function mpanLoad(i, first) { // one measured panel at a time: its size, and its own parts
  const L = S.mpan.list; if (!first) L[S.mpan.cur].items = JSON.parse(JSON.stringify(S.items)); S.mpan.cur = i; const q = L[i]; S.pw = q.w; S.pd = q.h;
  if (q.items) S.items = JSON.parse(JSON.stringify(q.items)); else { const d = dims(); S.items = measuredItems(q.src, d.W / 2, d.D / 2, 'top'); q.src = null; }
  uid = S.items.reduce((m, p) => Math.max(m, p.id || 0), uid); sel = null; reflow(); keepInside(); save(); if (first) { S.tab[1] = 'top'; go(1); } else render(); }
function lipHtml() { const M = S.mpan, q = M && M.list && M.list[M.cur]; if (!isPanel() || !q || !q.lip) return ''; const fx = ((q.lip.w - q.w) / 2).toFixed(1), fy = ((q.lip.h - q.h) / 2).toFixed(1), cover = S.pw === q.lip.w + 1;
  return '<p class="note" style="margin:0 0 8px">Measured: inner opening ' + q.w + ' x ' + q.h + ' mm, outer rim ' + q.lip.w + ' x ' + q.lip.h + ' mm (a ' + fx + ' / ' + fy + ' mm lip).</p><div class="row"><b>Panel</b>' + seg('plip', [['in', 'Drops in'], ['cover', 'Covers the rim']], cover ? 'cover' : 'in') + '</div>'; }
function mpanHtml() { const M = S.mpan; if (!isPanel() || !M || !M.list || M.list.length < 2) return ''; return '<div class="row"><b>Measured</b><div class="chosen" style="margin:0">' + M.list.map((q, i) => '<span data-mpan="' + i + '" style="cursor:pointer' + (i === M.cur ? ';background:#1a1a1a;color:#fff' : '') + '">' + esc(q.name) + ' ' + q.w + ' x ' + q.h + '</span>').join('') + '</div></div>'; }
function hasBak() { try { return !!localStorage.getItem(BAK); } catch (e) { return false; } }
function showStart() {
  $('sheetIn').innerHTML = '<h2>Build your own device</h2><div class="list">' +
    '<button class="btn start" data-door="known"><b>Make something known</b>Beat maker, DJ pad, game handheld, desk assistant. You start with the shape, the electronics and where the code comes from. Change anything.</button>' +
    '<button class="btn start" data-door="new"><b>Make something new</b>Your own idea. Start with an empty body, play with the shape, add any electronics.</button>' +
    '<button class="btn start" data-door="have"><b>I already have electronics</b>Photo your board or your electronics. The case gets built around them.</button></div>' +
    (S.items.length ? '<button class="btn" data-door="close" style="margin-top:10px">Keep working on my build</button>' : '') + (hasBak() ? '<button class="btn" data-door="bak" style="margin-top:8px">Bring back the build I had before</button>' : '');
  $('sheet').hidden = false;
}
function showNew() {
  $('sheetIn').innerHTML = '<h2>Something new</h2><div class="list">' +
    '<button class="btn start" data-go="case"><b>A whole device</b>Box, lid, handheld, controller, cyberdeck. Pick a shape, then fill it.</button>' +
    '<button class="btn start" data-go="panel"><b>A panel for a box I have</b>One flat piece with a screen window, holes and notches for wires.</button>' +
    '<button class="btn start" data-go="part"><b>One part</b>Stand, feet, standoffs, cable clips, knobs.</button></div><button class="btn" data-door="back" style="margin-top:10px">Back</button>';
}
const RGROUPS = [['music', 'Music'], ['games', 'Games'], ['desk', 'Desk'], ['make', 'Gadgets']], LEVELN = { Easy: 1, Medium: 2, Hard: 3 };
const lvlChip = (r) => '<span class="chip lvl" aria-label="' + esc(r.level) + '"><i aria-hidden="true">' + [1, 2, 3].map((n) => (n <= (LEVELN[r.level] || 1) ? '\u25CF' : '\u25CB')).join('') + '</i>' + esc(r.level) + '</span>';
const aboutCost = (r) => r.cost || '~$' + Math.max(1, Math.round(recipeCost(r)));
let RGROUP = '';
function showRecipes() { /* the picker: name, one short line, level and rough price. Everything else is one tap away */
  const G = RGROUPS.filter((g) => (CZ.RECIPES || []).some((r) => r.group === g[0])); if (!G.some((g) => g[0] === RGROUP)) RGROUP = G.length ? G[0][0] : '';
  const L = (CZ.RECIPES || []).filter((r) => r.group === RGROUP);
  $('sheetIn').innerHTML = '<h2>Start from a project</h2><div class="rfilt" role="group" aria-label="Filter projects">' + G.map((g) => '<button type="button" data-rgroup="' + g[0] + '" aria-pressed="' + (g[0] === RGROUP) + '">' + g[1] + '</button>').join('') + '</div>' +
    '<div class="rgrid">' + L.map((r) => '<button type="button" class="rcard" data-rinfo="' + r.id + '"><b>' + esc(r.name) + '</b><span class="rl">' + esc(r.short || r.line) + '</span><span class="chips">' + lvlChip(r) + '<span class="chip">' + aboutCost(r) + '</span></span></button>').join('') + '</div>' +
    '<button class="btn" data-door="back" style="margin-top:12px">Back</button>';
}
function showRecipe(id) { /* the detail: the full story, what you buy, the credit and the test status */
  const r = CZ.RECIPES.find((x) => x.id === id); if (!r) return; const P = CZ.PARTS;
  const rows = r.parts.filter(([t]) => P[t]).map(([t, n]) => '<tr><td>' + n + ' x</td><td>' + esc(P[t].name) + '</td><td class="num">' + (P[t].price ? money(P[t].price * n) : '') + '</td></tr>').join('');
  $('sheetIn').innerHTML = '<button type="button" class="rback" data-door="known" aria-label="Back to projects">&lsaquo; Projects</button><h2 class="rh">' + esc(r.name) + '</h2>' +
    '<div class="chips" style="margin:0 0 10px">' + lvlChip(r) + '<span class="chip">' + aboutCost(r) + ' in parts</span><span class="chip ' + (r.tested ? 'ok' : 'cm') + '">' + (r.tested ? 'NOCIV tested' : 'Community code') + '</span></div>' +
    '<p class="rline">' + esc(r.line) + '</p>' + (r.note ? '<p class="note" style="margin:0 0 10px">' + esc(r.note) + '</p>' : '') +
    '<button class="btn red" data-recipe="' + r.id + '" style="width:100%;margin:2px 0 12px">Start with this</button>' +
    '<div class="rd"><details><summary>What you\'ll buy</summary><table><tbody>' + rows + '<tr><td></td><td><b>Total, roughly</b></td><td class="num"><b>' + money(recipeCost(r)) + '</b></td></tr></tbody></table><p class="note" style="margin:0 0 12px">Typical prices, not live. Plastic and screws come after, in Shop.</p></details>' +
    '<details><summary>Where the code comes from</summary><p><b>' + esc(r.credit.project) + '</b> by ' + esc(r.credit.by) + (r.credit.license ? ', ' + esc(r.credit.license) + ' license' : '') + '. Their repo and library links are in Build, Guide &amp; Code.</p><p>' + (r.tested ? 'NOCIV has built this one for real.' : 'Community code: NOCIV has not built this one for real yet. We lay out the case and parts and link to their code, with their name on it.') + '</p></details></div>';
  const sc = $('sheetIn'); sc.scrollTop = 0; const b = sc.querySelector('[data-recipe]'); if (b) b.focus({ preventScroll: true });
}
$('sheetIn').addEventListener('click', (e) => {
  const dr = e.target.closest('[data-door]'), rc = e.target.closest('[data-recipe]'), ok = e.target.closest('[data-rok]');
  const ri = e.target.closest('[data-rinfo]'), rg = e.target.closest('[data-rgroup]'); if (ri) { showRecipe(ri.dataset.rinfo); return; } if (rg) { RGROUP = rg.dataset.rgroup; showRecipes(); return; }
  if (e.target.closest('[data-act=keepbox]')) { $('sheet').hidden = true; keepBox(); return; }
  if (dr) { const v = dr.dataset.door;
    if (v === 'known') showRecipes(); else if (v === 'new') showNew(); else if (v === 'back') showStart();
    else if (v === 'cancel') $('sheet').hidden = true;
    else if (v === 'wipe') { wipeAll(); render(); showStart(); tag('Fresh start: everything is cleared'); }
    else if (v === 'close') { S.started = true; save(); $('sheet').hidden = true; }
    else if (v === 'bak') bringBack();
    else if (v === 'have') { S.started = true; $('sheet').hidden = true; S.tab[0] = 'snap'; go(0); }
    return; }
  if (rc) { const r = CZ.RECIPES.find((x) => x.id === rc.dataset.recipe);
    if (S.items.length) { $('sheetIn').innerHTML = '<h2>Start the ' + esc(r.name) + '?</h2><p class="note" style="font-size:14px">This replaces the ' + S.items.length + ' electronics in the build you have now.</p><div class="list" style="margin-top:10px"><button class="btn start" data-rok="' + r.id + '"><b>Replace my build</b>Start fresh with the ' + esc(r.name) + '.</button><button class="btn start" data-door="close"><b>Keep my build</b>Go back to what I was making.</button></div>'; return; }
    $('sheet').hidden = true; tag('Building your ' + r.name + '...'); setTimeout(() => loadRecipe(r.id), 40); return; }
  if (ok) { $('sheet').hidden = true; tag('Building it...'); const id = ok.dataset.rok; setTimeout(() => loadRecipe(id), 40); return; }
  const b = e.target.closest('[data-go]'); if (!b) return; const g = b.dataset.go; wipeAll(); S.started = true; $('sheet').hidden = true; /* something new starts from nothing */
  if (g === 'panel') { if (!isPanel()) { S.style = 'panel'; reflow(); } S.tab[2] = 'psize'; go(2); }
  else if (g === 'part') { S.xsel = null; S.tab[5] = 'extras'; go(5); }
  else { if (isPanel()) { S.style = 'clam'; S.cols = 9; S.rows = 6; reflow(); } S.tab[2] = 'shape'; go(2); }
});

// ---------- files ----------
let FILES = [];
// Print files: every piece is kept as its triangles, so it can be saved as STL or as 3MF (real millimetres, one indexed mesh, opens in Bambu Studio, Orca, Prusa and Cura)
const fmtOf = () => (S.fmt === '3mf' ? '3mf' : 'stl'), fmtTag = (f) => (f.blob.tris ? ' (.' + fmtOf() + ')' : '');
function meshBlob(tris, name) { const b = G.stl(tris, name); b.tris = tris; b.title = name; return b; }
function swatchButton() { const it = S.items.find((i) => PP(i) && i.panel === homePanel() && PP(i).cat === 'press' && i.of == null) || S.items.find((i) => PP(i) && i.panel !== 'inside' && PP(i).cut && PP(i).cut.o !== 'none' && i.of == null); return it ? PP(it) : CZ.PARTS.tact12; }
function swatchGeo() { return G.fitSwatch({ magnets: isClam() && S.magnets, button: swatchButton() }); }
const swatchSize = () => { const q = swatchGeo(); return Math.round(q.W) + ' x ' + Math.round(q.H); };
function swatchFile() { const q = swatchGeo(); return { label: 'Fit swatch', name: 'casezero-fit-swatch.stl', blob: meshBlob(G.trisOf(G.layerGeos(q.layers)), 'fit swatch') }; }
function mountFile(m, i) { return { label: 'Mounted ' + xmeta(m.partId)[0].toLowerCase() + ' ' + (i + 1) + ' (' + m.face + ', ' + (m.mountType === 'screw' ? 'M3 screw' : 'snap pin') + ')', name: 'casezero-mount-' + (i + 1) + '-' + m.partId + '.stl', blob: meshBlob(mountTris(m), 'mount ' + (i + 1) + ' ' + m.partId) }; }
// ---------- the build in a link: the whole saved build, packed into ?build=, no server ----------
const b64u = (u8) => { let t = ''; for (let i = 0; i < u8.length; i += 0x8000) t += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(t).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (t) => { const s2 = atob(t.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - t.length % 4) % 4)), u = new Uint8Array(s2.length); for (let i = 0; i < s2.length; i++) u[i] = s2.charCodeAt(i); return u; };
const zpipe = (u8, T) => new Response(new Blob([u8]).stream().pipeThrough(new T('deflate-raw'))).arrayBuffer().then((b) => new Uint8Array(b));
function shareState() { if (S.xp) xp(); /* sizes that follow the case are brought up to date first */ const o = JSON.parse(JSON.stringify(S)); Object.keys(o.mine || {}).forEach((k) => { delete o.mine[k].img; }); ['seen', 'moreOn', 'lastIn', 'page'].forEach((k) => delete o[k]); return o; } /* photos stay on the phone */
async function packBuild() { const raw = new TextEncoder().encode(JSON.stringify(shareState())); return window.CompressionStream ? 'z' + b64u(await zpipe(raw, CompressionStream)) : 'j' + b64u(raw); }
async function unpackBuild(code) { const bytes = unb64u(code.slice(1)); return JSON.parse(new TextDecoder().decode(code[0] === 'z' ? await zpipe(bytes, DecompressionStream) : bytes)); }
async function shareLink() { const url = location.origin + location.pathname + '?build=' + (await packBuild()), out = $('shareOut');
  let ok = false; try { await navigator.clipboard.writeText(url); ok = true; } catch (e) { ok = false; }
  if (out) out.innerHTML = '<p class="note keep" style="margin:6px 0 0">' + (ok ? '<b>Copied.</b> ' : 'Copy this link: ') + 'Anyone who opens it gets this build: body, brain, parts and clearance. Photos and logo pictures stay on this phone.</p><input class="num" readonly value="' + esc(url) + '" style="width:100%;margin-top:6px;font-size:12px" onclick="this.select()">';
  tag(ok ? 'Build link copied' : 'Build link ready below'); }
function fileOut(f) { return f && f.blob.tris && fmtOf() === '3mf' ? { label: f.label, name: f.name.replace(/\.stl$/, '.3mf'), blob: threeMf(f.blob.tris, f.blob.title) } : f; }
function threeMf(tris, name) {
  const seen = new Map(), vs = [], ts = [], num = (v) => String(+v.toFixed(4));
  const vert = (i) => { const k = num(tris[i]) + ' ' + num(tris[i + 1]) + ' ' + num(tris[i + 2]); let q = seen.get(k); if (q == null) { q = seen.size; seen.set(k, q); vs.push('<vertex x="' + num(tris[i]) + '" y="' + num(tris[i + 1]) + '" z="' + num(tris[i + 2]) + '"/>'); } return q; };
  for (let t = 0; t + 8 < tris.length; t += 9) { const a = vert(t), b = vert(t + 3), c = vert(t + 6); if (a !== b && b !== c && a !== c) ts.push('<triangle v1="' + a + '" v2="' + b + '" v3="' + c + '"/>'); }
  const X = '<?xml version="1.0" encoding="UTF-8"?>\n', model = X + '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><metadata name="Title">NOCIV Case Zero ' + esc(name) + '</metadata><metadata name="Application">NOCIV Case Zero</metadata><resources><object id="1" type="model" name="' + esc(name) + '"><mesh><vertices>' + vs.join('') + '</vertices><triangles>' + ts.join('') + '</triangles></mesh></object></resources><build><item objectid="1"/></build></model>';
  return new Blob([zipFiles([
    { name: '[Content_Types].xml', text: X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>' },
    { name: '_rels/.rels', text: X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>' },
    { name: '3D/3dmodel.model', text: model }])], { type: 'model/3mf' });
}
// every file of the build, made now: the Files list, the Print Bed view and the list of pieces all use it
function piecesHtml() { // every printed piece, by what it is, with how many files it takes
  if (S.material === 'wood') return ''; const fs = bedFiles(), grp = {}; fs.forEach((f) => { const n = f.name.replace(/^casezero-/, '').replace(/\.stl$/, ''), k = /test-fit/.test(n) ? 'Test fit' : /color2/.test(n) ? 'Marks color' : /^(lid|base|top|panel)-(box|deck)?/.test(n) ? n.split('-')[0].replace(/^./, (c) => c.toUpperCase()) + (/deck/.test(n) ? ' deck' : isPanel() ? '' : ' box') : /^mount/.test(n) ? 'Mounted parts' : /keycap/.test(n) ? 'Keycaps' : /keys-plate/.test(n) ? 'Keyboard plate' : /shroud/.test(n) ? 'Raised shroud' : /hatch/.test(n) ? 'Hatch door' : /swap-frame/.test(n) ? 'Swap frame' : /swap-insert/.test(n) ? 'Swap inserts' : /knob/.test(n) ? 'Knobs' : /dpad/.test(n) ? 'D-pad' : /hook/.test(n) ? 'Carabiner hook' : /glue/.test(n) ? 'Glue-on pieces' : f.label; grp[k] = (grp[k] || 0) + 1; });
  const ex = []; if (S.items.some((i) => i.panel === 'inside' && (riserOf(i) > 0))) ex.push('Standoffs and slates (print with the case)'); { const sn = S.attachedParts.filter((m) => MOUNTABLE[m.partId] && m.mountType === 'snap').reduce((q, m) => q + mountCount(m), 0); if (sn) ex.push(sn + ' snap pins (in the mounted part files)'); }
  if (!fs.length) return ''; return '<p class="h" style="margin:4px 0">' + fs.length + ' printed files</p><div class="chosen" style="margin-bottom:6px">' + Object.keys(grp).map((k) => '<span>' + esc(k) + (grp[k] > 1 ? ' x' + grp[k] : '') + '</span>').join('') + ex.map((e) => '<span>' + esc(e) + '</span>').join('') + '</div>'; }
// Next: slice to .gcode. Three steps from the files to the printer, with a slicer that runs in the browser.
// ---------- Skeleton Test: a 1 mm frame that prints in minutes, to check the fit before the real print ----------
// The same outline, every opening and screw hole with a 3 mm rim, a 5 mm border, and diagonal ribs that tie it together.
function skelSource(x) { if (isPanel()) { const L = x.built.tray.filter((l) => l.polys && l.polys.length); return L.reduce((a, l) => (Math.abs(G.area(l.polys)) > Math.abs(G.area(a)) ? l.polys : a), L[0].polys); } const dks = x.built.deck.filter((l) => l.tag === 'deck'); return dks.length ? dks[dks.length - 1].polys : []; }
function skeletonOf(polys, regs) { /* regs: the bed pieces: their seams get solid bands so the puzzle joints hold */
  if (!polys || !polys.length) return []; const sg = (p) => Math.sign(G.area([p])), big = polys.reduce((a, p) => (Math.abs(G.area([p])) > Math.abs(G.area([a])) ? p : a), polys[0]), s0 = sg(big);
  const outer = G.union(polys.filter((p) => sg(p) === s0)), cuts = G.diff(outer, polys), b = G.bbox(outer), L = 2 * (b.w + b.h), sp = 40, hw = 0.8, ribs = [], r2 = Math.SQRT1_2; /* 1.6 mm ribs, 40 mm apart: two lines of plastic each, no infill */
  [[1, 1, b.y0], [1, -1, b.y1]].forEach(([dx, dy, y]) => { for (let c = -b.h - sp; c <= b.w + sp; c += sp) { const u = [dx * r2, dy * r2], n = [-u[1] * hw, u[0] * hw], A = [b.x0 + c - u[0] * L, y - u[1] * L], B = [b.x0 + c + u[0] * L, y + u[1] * L]; const q = [[A[0] + n[0], A[1] + n[1]], [B[0] + n[0], B[1] + n[1]], [B[0] - n[0], B[1] - n[1]], [A[0] - n[0], A[1] - n[1]]]; ribs.push(G.area([q]) < 0 ? q.reverse() : q); } }); /* 1.6 mm ribs both ways: triangles. Every rib wound the same way as the border: a rib wound the other way cancels the border under it (the diamond notches) */
  const keep = (parts) => G.diff(G.inter(G.union(parts), outer), cuts);
  const seams = regs && regs.length > 1 ? G.inter(G.union([].concat(...regs.map((r) => G.diff([].concat(r), G.offset([].concat(r), -4))))), G.offset(outer, -0.01)) : []; /* 4 mm of solid each side of a puzzle seam */
  let fr = keep(G.diff(outer, G.offset(outer, -3)).concat(G.diff(G.offset(cuts, 3), cuts), ribs, seams)); /* 3 mm border, 3 mm rim round every opening */
  for (let pass = 0; pass < 3; pass++) { /* a rim the ribs missed: tie it to the border, until it is all one piece */
    const main = fr.reduce((a, q) => (Math.abs(G.area([q])) > Math.abs(G.area([a])) ? q : a), fr[0]), s1 = sg(main), isl = fr.filter((p) => sg(p) === s1 && p !== main); /* the frame's own winding: its biggest ring is the outside */
    if (!isl.length) break;
    fr = keep(fr.concat(isl.map((p) => { const q = G.bbox([p]), cy = (q.y0 + q.y1) / 2, left = q.x0 - b.x0 < b.x1 - q.x1; return left ? G.rect(b.x0, cy - hw, q.x0 + 2, cy + hw) : G.rect(q.x1 - 2, cy - hw, b.x1, cy + hw); }).concat(pass ? isl.map((p) => { const q = G.bbox([p]), cx = (q.x0 + q.x1) / 2, down = q.y0 - b.y0 < b.y1 - q.y1; return down ? G.rect(cx - hw, b.y0, cx + hw, q.y0 + 2) : G.rect(cx - hw, q.y1 - 2, cx + hw, b.y1); }) : []))); }
  fr = G.diff(G.offset(G.offset(fr, -0.15), 0.15), cuts);
  { const ticks = []; for (let x = b.x0 + 10; x < b.x1 - 8; x += 10) ticks.push(G.rect(x - 0.3, b.y0 - 1, x + 0.3, b.y0 + 1)); fr = G.diff(fr, ticks); } /* a ruler: a 1 mm notch every 10 mm along the front edge, to check the scale with a real ruler */ /* opened by 0.15 mm: slivers thinner than 0.3 mm go, so no two holes are split by a hairline or touch at a corner: every hole is its own clean loop */
  { const main = fr.reduce((a, q) => (Math.abs(G.area([q])) > Math.abs(G.area([a])) ? q : a), fr[0]), s1 = main ? sg(main) : 1; fr = fr.filter((p) => !(p !== main && sg(p) === s1 && Math.abs(G.area([p])) < 4)); } /* crumbs under 4 mm2 (rib tips cut off by a slot) are dropped: they would print loose */
  return fr.map((p, k) => p.map(([x, y], i) => [x + (((i * 7 + k) % 5) - 2) * 0.001, y + (((i * 13 + k * 3) % 5) - 2) * 0.001])); /* at most 0.002 mm, so no two outlines share an exact straight line: the mesher leaves gaps on those */
}
const SKC = {}; function skelOf(x) { const k = x.key + '|' + JSON.stringify(buildKey()) + '|' + S.pw + 'x' + S.pd; if (!SKC[k]) { if (Object.keys(SKC).length > 8) Object.keys(SKC).forEach((q) => delete SKC[q]); SKC[k] = skeletonOf(skelSource(x), plan(x.built).regs); } return SKC[k]; }
const skelMode = () => S.xmode === 'skel' && S.material !== 'wood';
// G-code straight from the builder, for flat pieces only: a panel or a skeleton test. Each bed piece is its own file, centered on your bed.
const gcodeOk = () => S.material !== 'wood' && (isPanel() || skelMode());
function gcodeFiles(only) { /* only: just that piece, counting through every half */
  const pr = printerRow(), out = [], bad = []; let idx = -1;
  halves().forEach((x) => { const pl = plan(x.built), nm = x.name.toLowerCase();
    let L = skelMode() ? [{ polys: skelOf(x), z0: 0, z1: 0.6 }] : x.built.tray.filter((l) => l.polys && l.polys.length);
    if (!skelMode() && isPanel() && S.plift > 0) { const T = S.pt; L = L.map((l) => ({ polys: l.polys.map((p) => p.map(([px, py]) => [px, -py]).reverse()), z0: T - l.z1, z1: T - l.z0 })).filter((l) => l.z1 > 0); } /* a raised panel prints face down, like its STL */
    const pcs = G.cutLayers(L, [], pl.regs);
    pcs.forEach((p, i) => { idx++; if (only != null && idx !== only) return; const name = 'casezero-' + nm + (skelMode() ? '-skeleton' : '') + (pcs.length > 1 ? '-' + (i + 1) : '') + '.gcode', g = G.gcodeOf(p, { bed: S.bed, lh: 0.28, solid: skelMode(), name: x.name + (pcs.length > 1 ? ' piece ' + (i + 1) + ' of ' + pcs.length : ''), printer: pr[0] === 'custom' ? 'Custom printer' : pr[1] });
      if (!g) return; if (g.error) bad.push(name + ': ' + g.error); else out.push({ name, text: g.text, grams: g.grams, sec: g.sec }); }); });
  return { out, bad };
}
function gcodePieces() { try { return halves().reduce((a, x) => a + plan(x.built).regs.length, 0); } catch (e) { return 1; } }
function saveGcode(only) { const { out, bad } = gcodeFiles(only); if (!out.length) { tag(bad[0] || 'Nothing to print yet'); return; }
  if (out.length === 1) saveFile({ name: out[0].name, blob: new Blob([out[0].text], { type: 'text/x-gcode' }) });
  else saveFile({ name: 'casezero-gcode.zip', blob: new Blob([zipFiles(out.map((q) => ({ name: q.name, text: q.text })).concat([{ name: 'README.txt', text: 'One .gcode per bed piece. Copy them to the SD card and print them one at a time. Marlin, PLA 200 C, bed 60 C, 0.28 mm layers, 60 mm/s.' }]))], { type: 'application/zip' }) });
  tag(out.length + ' G-code file' + (out.length > 1 ? 's' : '') + ', about ' + hm(out.reduce((a, q) => a + q.sec, 0)) + ' and ' + Math.round(out.reduce((a, q) => a + q.grams, 0)) + ' g of PLA' + (bad.length ? '. Skipped: ' + bad.join('; ') : '')); }
function paperSvg() { const hs = halves(), list = hs.map((x) => ({ name: 'casezero-' + x.name.toLowerCase() + '-template.svg', text: G.svgOf(skelSource(x), x.name + ' 1:1 paper template') }));
  if (list.length === 1) saveFile({ name: list[0].name, blob: new Blob([list[0].text], { type: 'image/svg+xml' }) }); else saveFile({ name: 'casezero-paper-templates.zip', blob: new Blob([zipFiles(list.concat([{ name: 'README.txt', text: 'Print each SVG at 100 percent (no "fit to page"). Check one 10 mm square with a ruler, then hold your parts on the paper.' }]))], { type: 'application/zip' }) });
  tag('Paper template saved: print it at 100 percent, then lay your parts on it'); }
// Adjust After Test Fit: small changes straight into the build, so Full Solid prints the corrected case next
function adjustHtml() { const d = dims(), cand = S.items.filter((i) => PP(i) && i.panel !== 'inside' && i.of == null && PP(i).cut && PP(i).cut.o !== 'none'), N = numbers(); if (!cand.some((i) => i.id === S.adjSel)) S.adjSel = cand[0] ? cand[0].id : null; const it = cand.find((i) => i.id === S.adjSel), b = (a, l) => '<button type="button" class="btn" data-adj="' + a + '" style="padding:8px 4px">' + l + '</button>';
  return '<details id="adjBox" style="margin-top:10px"' + (S.adjOpen ? ' open' : '') + '><summary class="h" style="cursor:pointer;margin:0">Adjust After Test Fit</summary><div class="list" style="margin-top:6px">' +
    '<div class="it"><b>Outer size: ' + d.W.toFixed(1) + ' x ' + d.D.toFixed(1) + ' mm</b><div class="grid g4" style="margin-top:6px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px">' + b('w-1', 'Width -1') + b('w1', 'Width +1') + b('h-1', 'Height -1') + b('h1', 'Height +1') + '</div></div>' +
    (it ? '<div class="it"><b>Part fit and nudge</b><select class="pin" id="adjPart" style="width:100%;margin:6px 0;height:34px">' + cand.map((i) => '<option value="' + i.id + '"' + (i.id === S.adjSel ? ' selected' : '') + '>' + esc((N[i.id] || '') + ' ' + PP(i).short) + (i.fit ? ' (' + (i.fit > 0 ? '+' : '') + i.fit.toFixed(1) + ' mm)' : '') + '</option>').join('') + '</select>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' + b('fit1', 'Too tight (+0.4 mm)') + b('fit-1', 'Too loose (-0.4 mm)') + '</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px">' + b('mx-1', '&larr; 0.5') + b('my1', '&uarr; 0.5') + b('my-1', '&darr; 0.5') + b('mx1', '0.5 &rarr;') + '</div>' +
      '<span style="display:block;margin-top:4px;color:#6f6a60">At ' + it.x.toFixed(1) + ', ' + it.y.toFixed(1) + ' mm' + (it.fit ? ', opening ' + (it.fit > 0 ? '+' : '') + it.fit.toFixed(1) + ' mm' : '') + '.</span></div>' : '') +
    (posts().length ? '<div class="it"><b>Screw holes: ' + ((S.inset || 0) === 0 ? 'as drawn' : Math.abs(S.inset).toFixed(1) + ' mm ' + (S.inset > 0 ? 'further in' : 'further out')) + '</b><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px">' + b('in-1', 'Out 0.5 mm') + b('in1', 'In 0.5 mm') + '</div></div>' : '') +
    '<p class="note" style="margin:0">Every change goes into your build. Switch to Full Solid and make the files again for the corrected case.</p></div></details>'; }
function adjust(a) {
  const it = S.items.find((i) => i.id === S.adjSel), v = +a.replace(/^[a-z]+/, ''), k = a.replace(/-?\d+$/, ''); snapU();
  if (k === 'w' || k === 'h') { if (isPanel()) { const f = k === 'w' ? 'pw' : 'pd'; S[f] = Math.max(30, Math.min(600, S[f] + v)); if (S.mpan && S.mpan.list) S.mpan.list[S.mpan.cur][k === 'w' ? 'w' : 'h'] = S[f]; }
    else { const q = k === 'w' ? 'cols' : 'rows', x = k === 'w' ? 'xw' : 'xd'; let e = +((S[x] || 0) + v).toFixed(1); if (e > 19.9) { if (S[q] < 24) { S[q]++; e -= 20; } else e = 19.9; } if (e < 0) { if (S[q] > 2) { S[q]--; e += 20; } else e = 0; } S[x] = e; }
    reflow(); }
  else if (k === 'in') S.inset = Math.max(isPanel() ? -2.5 : -0.4, Math.min(6, (S.inset || 0) + v * 0.5));
  else if (it && k === 'fit') it.fit = Math.max(-1.2, Math.min(3, +((it.fit || 0) + v * 0.4).toFixed(1)));
  else if (it && (k === 'mx' || k === 'my')) { const f = k === 'mx' ? 'x' : 'y', was = it[f]; it[f] = +(it[f] + v * 0.5).toFixed(2); const pr = problems(it); if (pr.length) { it[f] = was; tag('Not moved: it would be ' + pr[0] + '.'); save(); render(); return; } }
  save(); render(); const d = dims(), pr = allProblems(); tag((k === 'w' || k === 'h' ? 'Outer size ' + d.W.toFixed(1) + ' x ' + d.D.toFixed(1) + ' mm' : k === 'in' ? 'Screw holes ' + (S.inset || 0).toFixed(1) + ' mm in' : it ? PP(it).short + (k === 'fit' ? ' opening ' + ((it.fit || 0) > 0 ? '+' : '') + (it.fit || 0).toFixed(1) + ' mm' : ' at ' + it.x.toFixed(1) + ', ' + it.y.toFixed(1)) : '') + (pr.length ? '. Check Arrange: ' + pr.length + ' part' + (pr.length > 1 ? 's' : '') + ' marked !' : '. Saved in your build.')); }
function faqHtml() { const q = (t, b) => '<div class="it"><b>' + t + '</b><br>' + b + '</div>'; /* plain answers to what people ask on this screen */
  return '<details style="margin-top:10px"><summary class="h" style="cursor:pointer;margin:0">Have questions?</summary><div class="list" style="margin-top:6px">' +
    q('Paper Test or Skeleton Test?', 'The <b>paper test</b> (SVG) prints on paper. Cut it out with scissors and lay your parts on it: in about 2 minutes you see if every hole is in the right place. The <b>skeleton test</b> prints a thin 0.6 mm plastic frame on your 3D printer, in about 10 to 50 minutes instead of 6 hours or more. It checks the real fit: screws, the rims round your screen and buttons, and the puzzle seams.') +
    q('STL, 3MF or .gcode?', '<b>.stl</b> is the 3D shape. <b>.3mf</b> is the same shape plus color information, for printers with more than one color. <b>.gcode</b> is the file your printer reads from its SD card or USB stick. To turn .stl into .gcode, open it in a slicer: <a href="https://grid.space/kiri/" target="_blank" rel="noopener" style="display:inline;padding:0;border:0;text-decoration:underline;font-weight:800">Kiri:Moto</a> is free in the browser, or use your printer\'s own slicer app.') +
    q('Why do the time and grams change?', 'They grow with your build and with how many pieces it splits into for your bed. A small box as a skeleton is about 10 minutes and 5 g; a big panel split in two is about 50 minutes and 16 g. The full print takes hours. Your slicer gives the exact number.') + '</div></details>'; }
function sliceGuide() { const f = fmtOf().toUpperCase();
  return '<div class="list slg" style="margin-top:8px"><p class="h" style="margin:0">Next: slice to .gcode</p>' +
    '<div class="it"><b>1. Download</b> your .' + fmtOf() + ' files: Make my files, then Save everything in one zip.</div>' +
    '<div class="it"><b>2. Open <a href="https://grid.space/kiri/" target="_blank" rel="noopener" style="display:inline;padding:0;border:0;text-decoration:underline;font-weight:800">Kiri:Moto</a></b> (free, in the browser). Tap <b>File &rarr; New</b> to clear the sample cube, then <b>File &rarr; Import</b> and pick your .' + fmtOf() + ' file. Tap <b>Setup &rarr; Machine</b> and pick your printer (for example Creality Ender 3). A desktop slicer works too: Creality Print, PrusaSlicer, Cura, Bambu Studio.</div>' +
    '<div class="it"><b>3. Slice and save</b>: 0.2 mm layers, 15% infill. Tap <b>Slice</b>, then <b>Export</b>, then <b>Download .gcode</b>. Put that .gcode file on your printer\'s SD card or USB stick.</div></div>'; }
function filesOf(only) { /* only: just this panel's pieces, for the other measured panels */
    const files = [], hs = halves(), wood = S.material === 'wood';
    hs.forEach((x) => {
      const pl = plan(x.built), n = pl.regs.length, nm = x.name.toLowerCase();
      if (!wood && skelMode()) { const pcs = G.cutLayers([{ polys: skelOf(x), z0: 0, z1: 0.6, tag: 'skel' }], [], pl.regs); pcs.forEach((p, i) => { const tris = G.trisOf(G.layerGeos(p.layers)); if (tris.length) files.push({ label: x.name + ' skeleton test' + (pcs.length > 1 ? ' ' + (i + 1) + ' of ' + pcs.length : ''), name: 'casezero-' + nm + '-skeleton' + (pcs.length > 1 ? '-' + (i + 1) : '') + '.stl', blob: meshBlob(tris, nm + ' skeleton ' + (i + 1)) }); }); return; } /* the same puzzle seams as the real print */
      if (wood) {
        files.push({ label: x.name + ' top (deck) template', name: 'casezero-' + nm + '-deck.svg', blob: new Blob([G.svgOf(x.built.deck.filter((l) => l.tag === 'deck')[0].polys, x.name + ' deck')], { type: 'image/svg+xml' }) });
        files.push({ label: x.name + ' bottom template', name: 'casezero-' + nm + '-bottom.svg', blob: new Blob([G.svgOf(x.built.out, x.name + ' bottom')], { type: 'image/svg+xml' }) });
        return;
      }
      const tray = G.cutLayers(x.built.tray, x.built.extra, pl.regs), deck = G.cutLayers(x.built.deck, [], pl.regs), top = x.built.deckZ + R.LT;
      const inB = G.cutLayers(x.built.inlay.filter((l) => l.tag === 'inlayB'), [], pl.regs), inT = G.cutLayers(x.built.inlay.filter((l) => l.tag === 'inlayT'), [], pl.regs);
      tray.forEach((p, i) => { let tris = G.trisOf(G.layerGeos(p.layers, p.extra).concat(...(x.built.plugs || []).filter((pg) => G.inside([G.circle(pg.x, pg.y, 0.5, 8)], p.region)).map(G.plugGeos))); if (isPanel() && S.plift > 0) tris = G.flipZ(tris, S.pt); if (tris.length) files.push({ label: x.name + (isPanel() ? ' piece ' : ' box ') + (i + 1) + (n > 1 ? ' of ' + n : ''), name: 'casezero-' + nm + (isPanel() ? '-' : '-box-') + (i + 1) + '.stl', blob: meshBlob(tris, nm + ' box ' + (i + 1)) }); });
      deck.forEach((p, i) => { const tris = G.trisOf(G.layerGeos(p.layers)); if (tris.length) files.push({ label: x.name + ' deck ' + (i + 1) + (n > 1 ? ' of ' + n : ''), name: 'casezero-' + nm + '-deck-' + (i + 1) + '.stl', blob: meshBlob(G.flipZ(tris, top), nm + ' deck ' + (i + 1)) }); });
      inB.forEach((p, i) => { let tris = G.trisOf(G.layerGeos(p.layers)); if (isPanel() && S.plift > 0) tris = G.flipZ(tris, S.pt); if (tris.length) files.push({ label: x.name + ' box ' + (i + 1) + ' marks color', name: 'casezero-' + nm + '-box-' + (i + 1) + '-color2.stl', blob: meshBlob(tris, nm + ' box marks') }); });
      inT.forEach((p, i) => { const tris = G.trisOf(G.layerGeos(p.layers)); if (tris.length) files.push({ label: x.name + ' deck ' + (i + 1) + ' marks color', name: 'casezero-' + nm + '-deck-' + (i + 1) + '-color2.stl', blob: meshBlob(G.flipZ(tris, top), nm + ' deck marks') }); });
      if (x.built.stick.length) { const geos = []; let ox = 0; x.built.stick.forEach((st) => { const gs = G.layerGeos(st.layers.map((l) => ({ polys: l.polys, z0: 0, z1: l.z1 - l.z0 }))); gs.forEach((gg) => { gg.translate(ox, 0, 0); geos.push(gg); }); ox += 2; }); files.push({ label: x.name + ' glue-on pieces', name: 'casezero-' + nm + '-glue-pieces.stl', blob: meshBlob(G.trisOf(geos), nm + ' glue pieces') }); }
      const dks = x.built.deck.filter((l) => l.tag === 'deck'); if (dks.length) files.push({ label: x.name + ' test fit (1 mm)', name: 'casezero-' + nm + '-test-fit.stl', blob: meshBlob(G.trisOf(G.layerGeos([{ polys: dks[dks.length - 1].polys, z0: 0, z1: 1 }])), nm + ' test fit') });

    });
    if (only) return files;
    if (skelMode()) { files.push({ label: 'Electronics + build list', name: 'casezero-parts.txt', blob: new Blob([partsText()], { type: 'text/plain' }) }); return files; } /* a test frame is only the frame */
    if (!wood && isPanel() && S.mpan && S.mpan.list && S.mpan.list.length > 1) { const L = S.mpan.list, cur = S.mpan.cur, keep = { pw: S.pw, pd: S.pd, items: S.items }, tagOf = (f, i) => Object.assign(f, { label: L[i].name + ': ' + f.label, name: f.name.replace('casezero-', 'casezero-p' + (i + 1) + '-') });
      files.forEach((f) => tagOf(f, cur)); /* every measured panel in the same zip, each file named by its panel */
      L.forEach((q, i) => { if (i === cur || !q.items) return; S.pw = q.w; S.pd = q.h; S.items = q.items; markCache = {}; try { filesOf(true).forEach((f) => files.push(tagOf(f, i))); } finally { S.pw = keep.pw; S.pd = keep.pd; S.items = keep.items; markCache = {}; } }); }
    if (!wood && swapOn()) { const regs = plan(hs[0].built).regs, n = regs.length, pcs = (L, nm, lab) => G.cutLayers(L, [], regs).forEach((p, j) => { const tris = G.trisOf(G.layerGeos(p.layers)); if (tris.length) files.push({ label: lab + (n > 1 ? ' piece ' + (j + 1) + ' of ' + n : ''), name: nm + (n > 1 ? '-' + (j + 1) : '') + '.stl', blob: meshBlob(tris, lab) }); }); /* bigger than the bed: the same cuts as the panel */
      pcs(swapFrame(), 'casezero-swap-frame', 'Swap frame (stays in the box)');
      swapList().forEach((q, i) => { if (i === S.swap.cur) return; const keep = S.items; S.items = q.items || []; markCache = {}; try { pcs(panelBuilt().tray, 'casezero-swap-insert-' + (i + 1), q.name + ' (swap insert)'); } finally { S.items = keep; markCache = {}; } }); }
    if (!wood && xp().dstand.on) files.push({ label: 'Mini desk stand (prints flat)', name: 'casezero-desk-stand.stl', blob: meshBlob(G.trisOf(G.layerGeos(addonPolys('dstand').layers)), 'desk stand') });
    if (!wood && hatchZ()) files.push({ label: 'Hatch door', name: 'casezero-hatch-door.stl', blob: meshBlob(G.trisOf(G.layerGeos(G.hatchDoor(hatchZ()))), 'hatch-door') });
    if (!wood && (S.items.some((i) => i.type === 'shroud') || S.ports.some((p) => p.kind === 'p_shroud' && !portBlocked(p)))) files.push({ label: 'Raised shroud', name: 'casezero-shroud.stl', blob: meshBlob(G.trisOf(G.layerGeos(addonPolys('shroud').layers)), 'shroud') });
    if (!wood) S.attachedParts.forEach((m, i) => { if (MOUNTABLE[m.partId]) files.push(mountFile(m, i)); });
    { const hs = wood ? [] : S.attachedParts.filter((m) => m.partId === 'charm' && (m.charm || xp().charm).hook === 'hook'); if (hs.length) { const geos = []; let y = 0; hs.forEach((m) => { const hp = hookPolys(m.charm), hb = G.bbox(hp); G.layerGeos([{ polys: hp, z0: 0, z1: CARABINER_DEFAULT_THICKNESS_MM }]).forEach((gg) => { gg.translate(-hb.x0, -hb.y0 + y, 0); geos.push(gg); }); y += hb.h + 4; }); files.push({ label: hs.length + ' printed carabiner hook' + (hs.length > 1 ? 's' : ''), name: 'casezero-charm-hook.stl', blob: meshBlob(G.trisOf(geos), 'charm hook') }); } }
    const extraOf = (k) => S.items.reduce((n, i) => n + ((PP(i) && PP(i).prints && PP(i).prints[k]) || 0), 0);
    const knobs = S.items.filter((i) => PP(i) && PP(i).printed === 'knob').length + extraOf('knob'), pads = S.items.filter((i) => PP(i) && PP(i).printed === 'dpad').length + extraOf('dpad');
    if (!wood && knobs) { const geos = []; for (let i = 0; i < knobs; i++) { const kg = G.knobGeo(); kg.translate(i * 24, 0, 0); geos.push(kg); } files.push({ label: knobs + (knobs > 1 ? ' knobs' : ' knob'), name: 'casezero-knobs.stl', blob: meshBlob(G.trisOf(geos), 'knobs') }); }
    if (!wood && pads) { const geos = []; for (let i = 0; i < pads; i++) G.dpadGeos().forEach((gg) => { gg.translate(i * 40, 0, 1.5); geos.push(gg); }); files.push({ label: pads + ' D-pad', name: 'casezero-dpad.stl', blob: meshBlob(G.trisOf(geos), 'dpad') }); }
    if (!wood && S.items.some((i) => i.type === 'kbd')) { const a = addonPolys('keys'), foot = a.layers[0].polys, bb = G.bbox(foot), bw = S.bed[0] - 8, bh = S.bed[1] - 8; /* the keyboard in the case: its plate (in pieces if bigger than the bed) and its caps */
      if (bb.w > bw || bb.h > bh) { const vert = bb.w > bw, n = Math.ceil((vert ? bb.w : bb.h) / (vert ? bw : bh)) - 1, pcs = G.cutLayers(a.layers, [], G.pieceRegions(foot, vert ? 'v' : 'h', n, 'dovetail')); pcs.forEach((pc, i) => files.push({ label: 'Keyboard plate piece ' + (i + 1) + ' of ' + pcs.length, name: 'casezero-keys-plate-' + (i + 1) + '.stl', blob: meshBlob(G.trisOf(G.layerGeos(pc.layers)), 'keys plate ' + (i + 1)) })); }
      else files.push({ label: 'Keyboard plate', name: 'casezero-keys-plate.stl', blob: meshBlob(G.trisOf(G.layerGeos(a.layers)), 'keys plate') });
      ['keycaps'].concat(kb().s60 ? ['keycapswide'] : xp().keys.sp ? ['keycap2'] : []).forEach((id) => { const f = addonFile(id); if (f && f.blob) files.push({ label: id === 'keycaps' ? 'Keycaps' : id === 'keycap2' ? 'Space bar cap' : 'Wide keycaps', name: f.name, blob: f.blob }); }); }
    files.push({ label: 'Electronics + build list', name: 'casezero-parts.txt', blob: new Blob([partsText()], { type: 'text/plain' }) });
    return files;
}
function makeFiles() {
  const out = $('fileList'); out.innerHTML = '<p class="note">Making...</p>';
  setTimeout(() => {
    const files = filesOf(), wood = S.material === 'wood';
    FILES = files; const hasBrain = S.items.some((i) => PP(i) && PP(i).cat === 'brain');
    out.innerHTML = '<button type="button" class="btn red" data-act="saveall" style="grid-column:1/-1">Download Full Project (.zip)</button>' + files.map((f, i) => '<button type="button" class="btn" data-f="' + i + '">Save ' + esc(f.label + fmtTag(f)) + '</button>').join('') +
      '<div class="list" style="grid-column:1/-1;margin-top:8px"><p class="h" style="margin:0 0 4px">From files to a finished device</p>' +
      '<div class="it"><b>1. Print</b>Every piece above. ' + (wood ? 'Print the templates at 100 percent and cut them out.' : 'Use ' + LAYER[S.layer] + ' mm layers, 4 walls, 15 percent infill, no supports.') + '</div>' +
      '<div class="it"><b>2. Buy the electronics</b>The list with prices and what to search for.<div style="margin-top:6px"><button class="btn" data-jump="Shop" style="display:inline-block;padding:7px 12px">Open Shop</button></div></div>' +
      (hasBrain ? '<div class="it"><b>3. Wire it</b>One wire at a time, no breadboard, with a test after each part.<div style="margin-top:6px"><button class="btn" data-jump="Wire it" style="display:inline-block;padding:7px 12px">Open Wire it</button></div></div><div class="it"><b>4. Load the code</b>The starter code is in the zip as code.py, with the steps at its top.</div><div class="it"><b>5. Close it up</b>Screw the deck down. Done.</div>' : '<div class="it"><b>3. Close it up</b>Fit your electronics and screw the deck down. Done.</div>') + '</div>';
  }, 30);
}
// ---------- the Step-by-Step Build Guide: one print-ready page made from this build only (Save as PDF from the print dialog) ----------
const PRINT_SVC = '<div class="note keep prsvc" style="margin:0 0 8px"><b>No 3D printer? Order your print.</b> Make your files below, then upload the .stl or .3mf at:<ul style="margin:4px 0 0;padding-left:18px"><li><a href="https://jlc3dp.com/3d-printing-quote" target="_blank" rel="noopener">JLC3DP</a>: budget FDM and resin, from about $0.30 a part. Upload .stl or .3mf.</li><li><a href="https://craftcloud3d.com/en/upload" target="_blank" rel="noopener">Craftcloud</a>: compares local and global print shops, takes multicolor .3mf.</li></ul>A library or makerspace takes the same files. To print from a USB stick, open them in your printer\'s free slicer app first: it turns them into the file your printer reads.</div>';
const GUIDE_BTN = '<button type="button" class="btn dark" data-act="guide" style="width:100%;margin-top:8px;grid-column:1/-1">Save Step-by-Step Build Guide (PDF)</button>';
function guideHtml() {
  const e = esc, N = numbers(), P = PARTS(), d = dims(), wood = S.material === 'wood', B = BRDX();
  const items = S.items.filter((i) => P[i.type]).sort((a, b) => (N[a.id] > N[b.id] ? 1 : -1)), brain = items.find((i) => P[i.type].cat === 'brain');
  let files = []; try { files = FILES && FILES.length ? FILES : filesOf(); } catch (er) { files = []; }
  const pieces = files.filter((f) => !/\.txt$/i.test(f.name)), pt = partsText().split('\n'), hi = pt.indexOf('HARDWARE'), hw = [];
  if (hi > -1) for (let i = hi + 1; i < pt.length && pt[i]; i++) hw.push(pt[i]);
  const box = (t) => '<li><span class="ck"></span>' + t + '</li>', sec = (n, t, body) => '<section><h2><span>' + n + '</span>' + t + '</h2>' + body + '</section>', ol = (L) => '<ol>' + L.filter(Boolean).map((x) => '<li>' + x + '</li>').join('') + '</ol>';
  // 1. parts and files
  let s1 = '<h3>Printed pieces</h3><ul class="cl">' + (pieces.length ? pieces.map((f) => box(e(f.label) + ' <small>' + e(f.name) + '</small>')).join('') : box('Make your files in 05 Finish, Files')) + '</ul>';
  s1 += '<h3>Electronics</h3><ul class="cl">' + (items.length ? items.map((i) => box('<b>' + e(N[i.id] || '') + '</b> ' + e(P[i.type].name))).join('') : box('No electronics added yet')) + '</ul>';
  if (hw.length) s1 += '<h3>Hardware</h3><ul class="cl">' + hw.map((x) => box(e(x))).join('') + '</ul>';
  // 2. assemble the case
  const st = [];
  st.push(wood ? 'Print the SVG templates at 100 percent, tape them to the wood and cut every piece out.' : 'Print every piece: ' + LAYER[S.layer] + ' mm layers, 4 walls, 15 percent infill, no supports' + (isClam() && S.hinge === 'printed' ? ' (supports on for the hinge barrels only)' : '') + '. ' + (isPanel() ? 'The panel prints flat, front face up.' : 'The deck prints face down, the box open side up.'));
  if (items.some((i) => !P[i.type].inside && P[i.type].cat !== 'brain')) st.push('Push each part into its numbered hole in the deck (' + items.filter((i) => !P[i.type].inside && P[i.type].cat !== 'brain').map((i) => e(N[i.id])).join(', ') + '). Check they all fit before you go on.');
  if (items.some((i) => P[i.type].inside)) st.push('Screw the ' + e(brain ? P[brain.type].short || P[brain.type].name : 'brain') + ' onto its posts with 4 x M2 x 5 mm screws, USB end at the wall opening.');
  if (isClam() && S.hinge === 'printed') st.push('Line up the hinge barrels of lid and base, then slide a ' + Math.round((S.style === 'small' ? d.D : d.W) - 12) + ' mm piece of <b>1.75 mm filament</b> through as the hinge pin. Trim it flush.');
  if (isClam() && S.hinge === 'metal') st.push('Screw the 2 x 25 mm butt hinges to the back of the lid and base with short wood screws.');
  if (isClam() && S.magnets) st.push('Press the <b>6 x 3 mm magnets</b> into their pockets, 2 in each half. Check each pair attracts before you glue the second one.');
  if (swapOn()) { st.push('Fix the swap frame into your box with 4 x M3 x 10 mm countersunk screws, or <b>#4 wood screws</b>, one per side.'); st.push(S.swap.mount === 'magnets' ? 'Press a 6 x 3 mm magnet into each corner of the frame and of every insert, poles facing so they attract. Drop the insert in.' : 'Drop the insert into the frame and fix its 4 corners with M3 x 8 mm screws.'); }
  (S.attachedParts || []).filter((m) => MOUNTABLE[m.partId]).forEach((m) => { let nm = m.partId; try { nm = xmeta(m.partId)[0] || nm; } catch (er) {} const n = mountCount(m), boxed = xp()[m.partId] && xp()[m.partId].box;
    st.push('ADD-ONS, ' + e(nm) + ': ' + (boxed ? 'hold it on your box and drive the <b>#4 wood screws</b> (12 mm) straight in.' : m.mountType === 'snap' ? 'push ' + n + ' printed snap pin' + (n > 1 ? 's' : '') + ' through it into the box until they click.' : 'fix it with ' + n + ' x M3 x 8 mm screw' + (n > 1 ? 's' : '') + '.')); });
  if (brain) st.push('Wire every part (step 3) and load the code (step 4) before you close it.');
  if (isPanel()) st.push(swapOn() ? 'Done: swap inserts whenever you like.' : S.phold === 'screws' && posts().length ? 'Set the panel in your box and fix it with ' + posts().length + ' x M3 screws.' : 'Drop the panel into your box. Done.');
  else if (!S.snap && S.deckMag) st.push('Press a <b>6 x 3 mm magnet</b> into the top of each post and one into each pocket under the deck. Check every pair attracts before you glue. Then set the deck on. Done.');
  else st.push(S.snap ? 'Press the deck down until the snap clips click into the wall. Done.' : 'Screw the deck down with ' + posts().length * panels().length + ' x <b>M3 x 8 mm screws</b>. Done.');
  // 3. wire every part
  let s3 = '', s4 = '';
  if (brain) { let w = null; try { w = wiring(); } catch (er) {} const pf = pfList();
    if (pf.length || (w && w.problems.length)) s3 += '<div class="warn"><b>Check before you wire</b>' + pf.concat(w ? w.problems : []).map((x) => '<div>' + e(x) + '</div>').join('') + '</div>';
    if (w && w.rows.length) { const rows = []; w.rows.forEach((row) => { const lab = e(row.it.label), v3 = V33[row.it.type] && profileOf_(B) === '5V';
        row.roles.forEach((r) => rows.push([lab, e(r.role), r.pin == null ? '?' : e(B.lab(r.pin)) + (r.two ? ' + ' + e(B.lab(r.pin + 1)) : '')]));
        if (row.power) rows.push([lab, 'VCC' + (row.power === '3V3' || v3 ? ' <b class="v3">3.3V only</b>' : ''), e(netName(row.power))]);
        rows.push([lab, 'GND', 'GND']); if (row.note) rows.push([lab, '<small>' + e(row.note) + '</small>', '']); });
      s3 += '<p>Brain: <b>' + e(B.name) + '</b>. One wire at a time, and test each part before the next. Red for power, black for ground.</p><table><thead><tr><th>Part</th><th>Part pin</th><th>' + e(bshort()) + ' pin</th></tr></thead><tbody>' + rows.map((r) => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td><b>' + r[2] + '</b></td></tr>').join('') + '</tbody></table>';
      if (items.some((i) => V33[i.type])) s3 += '<p class="v3n"><b>3.3V safety:</b> ' + items.filter((i) => V33[i.type]).map((i) => e(N[i.id] + ' ' + V33[i.type])).join(', ') + ': 3.3V parts. Wire VCC to 3V3 only, never to 5V.</p>'; }
    else s3 += '<p>No parts are wired to the brain yet. Add them in the builder and save the guide again.</p>';
    // 4. upload the code
    const f = CFILE();
    if (B.ino) { let L = []; try { L = (codeFor(wiring(), summaryLine(), recipeFn(), B, TW()).libs || []).slice(); } catch (er) {} libsFor(S.items.map((i) => i.type), B).forEach((l) => { if (!L.some((x) => x.n === l.n)) L.push(l); }); const need = L.filter((l) => !l.built);
      s4 = ol(['Install the free <b>Arduino IDE</b> (arduino.cc/en/software) and plug the ' + e(bshort()) + ' in by USB.', need.length ? 'Sketch &rarr; Include Library &rarr; Manage Libraries. Search and install: ' + need.map((l) => '<code>' + e(l.n) + '</code>').join(', ') + '.' : 'No libraries to install: everything this sketch uses comes with Arduino.', 'Open <code>' + e(f) + '</code> from your zip, pick <b>' + e(bshort()) + '</b> in Tools &rarr; Board and its port in Tools &rarr; Port, then press <b>Upload</b>.']); }
    else if (B.cp) { let L = []; try { L = codeFor(wiring(), summaryLine(), recipeFn(), B, TW()).libs || []; } catch (er) {}
      s4 = ol(['Hold <b>BOOTSEL</b> on the ' + e(bshort()) + ' while you plug it in. Drag the CircuitPython .uf2 for your board (circuitpython.org) onto the drive that opens; it comes back as <b>CIRCUITPY</b>.', L.length ? 'Get the Library Bundle (circuitpython.org/libraries), unzip it and copy into <code>CIRCUITPY/lib/</code>: ' + L.map((n) => '<code>' + e(n.split(' ')[0]) + '</code>').join(', ') + '.' : 'No libraries to copy: everything code.py uses is built into CircuitPython.', 'Drag <code>code.py</code> from your zip onto <b>CIRCUITPY</b> (replace the one there). It runs at once.']); }
    else s4 = ol(['Open <code>' + e(f) + '</code> from your zip: it lists every pin for the ' + e(B.name) + '.', 'Set up the board with its maker\'s tools (for a Raspberry Pi: Raspberry Pi Imager).', 'Write or load your program using the pins in the list.']); }
  const css = '*{box-sizing:border-box}body{font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;background:#fff;margin:0;padding:24px;max-width:780px}h1{font-size:24px;margin:0 0 2px}.sub{color:#555;margin:0 0 18px}section{margin:0 0 20px;break-inside:auto}h2{font-size:18px;margin:0 0 8px;padding-bottom:4px;border-bottom:2px solid #1a1a1a;display:flex;gap:8px;align-items:center}h2 span{display:inline-flex;width:26px;height:26px;border-radius:50%;background:#c8412f;color:#fff;font-size:14px;align-items:center;justify-content:center;flex:none}h3{font-size:14px;margin:10px 0 4px}ul.cl{list-style:none;padding:0;margin:0}ul.cl li{display:flex;gap:8px;align-items:flex-start;padding:3px 0;break-inside:avoid}.ck{flex:none;width:14px;height:14px;border:1.5px solid #1a1a1a;border-radius:3px;margin-top:3px}small{color:#666}ol{padding-left:22px;margin:0}ol li{margin:0 0 6px;break-inside:avoid}table{width:100%;border-collapse:collapse;font-size:13px}th,td{border:1px solid #bbb;padding:4px 6px;text-align:left;vertical-align:top}th{background:#f1ede2}tr{break-inside:avoid}.warn,.v3n{border:2px solid #c8412f;background:#fdeeea;border-radius:8px;padding:8px 10px;margin:0 0 10px}.v3{color:#c8412f}code{font:12px ui-monospace,Menlo,monospace;background:#f1ede2;padding:0 3px;border-radius:3px}.foot{color:#777;font-size:12px;margin-top:24px}@page{margin:14mm}@media print{body{padding:0}}';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Case Zero Build Guide</title><style>' + css + '</style></head><body><h1>Your Case Zero Build Guide</h1><p class="sub">' + e(summaryLine().replace(/<[^>]+>/g, '')) + '</p>' +
    sec(1, 'Your Parts &amp; Files', s1) + sec(2, 'Assemble the Case', ol(st)) + (brain ? sec(3, 'Wire Every Part', s3) + sec(4, 'Upload the Code', s4) : '') + '<p class="foot">Made by the NOCIV Case Zero builder from your build. Change the build and save the guide again to update it.</p></body></html>';
}
const profileOf_ = (B) => { const p = Object.values(BOARD_PROFILES).find((q) => q.board === B); return p ? p.logic : null; };
function printGuide() { let html; try { html = guideHtml(); } catch (er) { tag('The guide could not be made.'); return; }
  const fr = document.createElement('iframe'); fr.setAttribute('aria-hidden', 'true'); fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden'; document.body.appendChild(fr);
  fr.onload = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (er) { saveFile({ name: 'BUILD_GUIDE.html', blob: new Blob([html], { type: 'text/html' }) }); } setTimeout(() => fr.remove(), 60000); };
  fr.srcdoc = html; tag('Pick "Save as PDF" in the print window'); }
function partsText() {
  const N = numbers(), P = PARTS(), d = dims(), h = heights(), lines = ['NOCIV Case Zero', styleRow()[1] + ', ' + d.W.toFixed(0) + ' x ' + d.D.toFixed(0) + ' mm, ' + h.H + ' mm deep' + (isClam() ? ' + ' + h.Hl + ' mm lid' : ''), ''];
  lines.push('PARTS'); S.items.filter((i) => P[i.type]).sort((a, b) => (N[a.id] > N[b.id] ? 1 : -1)).forEach((i) => { const p = P[i.type]; lines.push(N[i.id] + '  ' + p.name + '  [' + LK[p.link] + ']  ' + (p.src || '')); });
  lines.push('', 'HARDWARE', isPanel() ? (posts().length ? posts().length + ' x M3 screws to fix the panel in the box' : 'No screws: the panel drops in') : posts().length * panels().length + ' x M3 screws, 8 mm (deck to box)');
  { const ms = S.attachedParts.filter((m) => MOUNTABLE[m.partId]); const nOf = (t) => ms.filter((m) => m.mountType === t).reduce((q, m) => q + mountCount(m), 0); if (nOf('screw')) lines.push(nOf('screw') + ' x M3 screws, 8 mm (mounted parts)'); if (nOf('snap')) lines.push(nOf('snap') + ' x printed snap pins (in the mounted part files)'); }
  if (isClam() && S.magnets) lines.push('4 x round magnets 6 x 3 mm (press in, glue if loose. Check they attract before gluing the second pair)');
  if (isClam() && S.hinge === 'printed') lines.push('1 x 1.75 mm filament, cut ' + Math.round((S.style === 'small' ? d.D : d.W) - 12) + ' mm long, as the hinge pin');
  if (isClam() && S.hinge === 'metal') lines.push('2 x 25 mm butt hinges + short wood screws');
  if (S.items.some((i) => P[i.type] && P[i.type].inside)) lines.push('4 x M2 screws, 5 mm (brain to its posts)');
  { const c = cost(), r = recipe(); lines.push('', 'SHOPPING (typical prices, not live. Shipping is extra)'); c.rows.forEach((x) => lines.push((x.buy ? x.buy + ' x ' : 'have  ') + x.p.name + (x.buy ? '  ' + money(x.sum) : '') + (x.p.url ? '  ' + x.p.url : '') + '  https://www.amazon.com/s?k=' + encodeURIComponent(x.p.searchQuery || CZ.cleanQuery(x.p.find || x.p.name)))); c.ex.forEach((x) => lines.push((x.have ? 'have  ' : '1 x ') + x.name + (x.have ? '' : '  about ' + money(x.each)))); lines.push('Plastic: about ' + money(c.plastic), 'TOTAL: about ' + money(c.total)); const pw = powerInfo(); if (pw.mah) lines.push('Battery: about ' + hrs(pw.hours) + ' on a charge (rough guess)'); if (r) lines.push('', 'CODE AND CREDIT', r.name + ': ' + r.credit.project + ' by ' + r.credit.by + '. License: ' + r.credit.license + '.', r.credit.url, r.note); }
  if (pcbOn()) { const Bd = boardBuild(); if (Bd.ok) lines.push('', 'BOARD (Clean it)', 'Carrier board ' + Bd.box.w.toFixed(0) + ' x ' + Bd.box.h.toFixed(0) + ' mm, 2 layers. Save its files in Brain, Board. 4 x M2 screws hold it on the floor posts.'); }
  lines.push('', 'PRINTING', 'Material: ' + S.material.toUpperCase() + '. Join: ' + CZ.JOINS[S.join][0] + '. Bed: ' + S.bed[0] + ' x ' + S.bed[1] + ' mm.', (isPanel() ? 'Panel: flat, front face up, no supports' : 'Box: open side up, no supports') + (isClam() && S.hinge === 'printed' ? ' (turn on supports for the hinge barrels only)' : '') + '. Deck: face down, no supports. ' + LAYER[S.layer] + ' mm layers, 4 walls, 15 percent infill. Walls: ' + R.T + ' mm. Clearance: ' + tolOf() + ' mm.', (S.material === 'wood' ? '' : 'Time on ' + printerRow()[1] + ': about ' + hm(estimate().sec) + ', ' + Math.round(estimate().grams) + ' g. Your slicer has the exact time.'), 'Print the deck first and check every part fits its hole.');
  return lines.join('\n');
}
function saveFile(f) {
  if (!f) return; const file = new File([f.blob], f.name, { type: f.blob.type });
  if (matchMedia('(pointer:coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(() => {}); return; }
  const u = URL.createObjectURL(f.blob), a = document.createElement('a'); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
}

// ---------- learn ----------
const LEARN = [
  ['Start here', '<ul><li><b>Make something known</b>: pick a recipe. It loads a shape and an electronics list, and names the open project its code comes from.</li><li><b>Make something new</b>: an empty body for your own idea.</li><li><b>I already have electronics</b>: photo your board. The case is sized to it.</li><li>Two rooms, at the top: <b>Body</b> is what holds it, <b>Brain</b> is what it does. Switch any time.</li><li>Each room is a few pages with one job each. The red Next button takes you on, Back takes you back.</li><li>The tools sit in the sheet at the bottom. Tap its top edge to drop it and see your device full screen. Tap again to bring it back.</li><li><b>Brain, Shop</b>: what to buy, what it costs, how long a battery lasts. Tap I have this on anything you own.</li></ul>'],
  ['Recipes and credits', '<ul>' + (CZ.RECIPES || []).map((r) => '<li><b>' + r.name + '</b>: ' + r.credit.project + ' by ' + r.credit.by + ', license ' + r.credit.license + '. <a href="' + r.credit.url + '" target="_blank" rel="noopener">Their page</a>. ' + r.note + '</li>').join('') + '<li>We do not copy their code into this app. We send you to it, with their name on it.</li><li>Not test-built by NOCIV yet means we have not built that recipe ourselves. Check their parts list before you buy.</li></ul>'],
  ['Wire it: no breadboard', '<ul><li>Brain, Wire it. Pick how you join things: push-on wires (no solder), solder, or the board.</li><li>You get one wire at a time: from this pin on the part, to this pin on the Pico, with a picture of which pin.</li><li>After each part there is a test. The small light on the Pico turns on when a button is pressed, so you can test with no screen and no computer.</li><li>Tick each step. The count at the top shows how far you are.</li><li>Push-on wires need a Pico with its pins already on (Pico H or WH). Parts with bare legs need wires already on, spade plugs or a lever connector.</li><li>When more parts need ground than the Pico has ground pins, the guide adds a hub: a lever connector that joins wires with no solder.</li><li>You put the test code on the Pico once, from a computer. After that any USB charger powers it.</li></ul>'],
  ['The board (Clean it)', '<ul><li>Brain, Board. For a Raspberry Pi Pico, Pico W or Pico 2.</li><li>One flat board. The Pico solders onto it. Every part gets a row of labelled holes right under it, already connected to the right Pico pins.</li><li>The app lays it out from Arrange and from your pins in Brain, Wire it, Wiring. Move a part or change a pin and the board changes.</li><li>Before you can save, the app measures every gap and follows every connection. If anything is off, there are no files.</li><li>Turn on Use it in my case and the case gets posts for the board.</li><li>Board factories make 5 at a time, so it pays when you build a few or share a batch.</li><li>Not factory tested by NOCIV yet. Order a small batch first.</li></ul>'],
  ['Battery power', '<ul><li>Brain, Electronics, Power: a flat LiPo battery, a charger and a switch.</li><li>Easiest for a Pico: the Pico charger. It solders to the back of the Pico and charges through the Pico plug.</li><li>Cheapest: the USB-C charger board. It gets its own opening in the wall: slide it against a wall in Arrange.</li><li>The run time shown is a rough guess from typical numbers.</li><li>With the USB-C charger board, put a 1N5817 diode between the battery side and the Pico VSYS pin, stripe toward the Pico. Without it, USB power can push back into the battery.</li><li>Be careful with LiPo batteries: buy one with a protection circuit, tape it down, never crush, bend or poke it, and check red and black before plugging in.</li><li>A Raspberry Pi needs 5 volts. Use a USB power bank, not a bare LiPo.</li></ul>'],
  ['How it works', '<ol><li><b>Brain</b>: already built? Photo your board front and back and tag each part. Not built yet? Pick each part from the list. Every part has its real size. The 3D box top right shows what you added in yellow, tap it to make it big.</li><li><b>Arrange</b>: place them on the lid and base (or the top). The grid is 20 mm squares, like your Panel Layout. Yellow means it does not fit.</li><li><b>Body</b>: pick a shape, size, hinge and how it closes. Measure a part you have with your phone.</li><li><b>Print</b>: tell us your printer. If the case is bigger than your bed we cut it into puzzle pieces.</li><li><b>Files</b>: one STL per piece, the parts list and how to wire it.</li></ol>'],
  ['No solder: how to connect anything', '<ul><li><b>Jumper wires</b> (Dupont): the black plug ends are female (a hole) or male (a pin). Pins on a board are male, so you use <b>female to female</b> wires between two boards. Male to female goes from a breadboard to a board.</li><li><b>Header pins</b>: buy boards with pins already soldered. Pico H and WH, Pi Zero 2 WH. Then jumpers push right on.</li><li><b>HATs</b>: boards that press straight onto a Raspberry Pi\'s 40 pins. Screens, sound and buttons with zero wires.</li><li><b>Qwiic / STEMMA QT</b>: one small 4 wire plug carries power and data. Chain sensors and screens one after another. Grove is the same idea with a bigger plug.</li><li><b>Screw terminals</b>: a breakout board where wires clamp in with a tiny screwdriver.</li><li><b>Arcade parts</b>: buttons use push-on spade plugs, kits come with a plug and play USB encoder.</li><li>Keep it tidy: red for power, black for ground, one color per button. Tape or zip tie the bundle.</li></ul>'],
  ['Solder in 10 minutes', '<ul><li>Iron at about 330 to 350 C (625 to 660 F) for leaded solder, 350 to 380 C for lead free.</li><li>Tin the tip: melt a little solder on it, wipe on a wet sponge or brass wool.</li><li>Touch the iron to the pad AND the pin together for 1 to 2 seconds. Feed solder into the joint, not onto the iron. Pull solder away, then the iron.</li><li>Good joint: shiny little volcano around the pin. Ball = not hot enough. Bridge to the next pin = too much, drag it away with the iron.</li><li>On perfboard, run one bare wire along a row as a ground line (a bus) and connect every button to it. Fewer wires, like a real board.</li><li>Open a window, wash your hands after leaded solder, never touch the tip. A $10 practice kit is worth it.</li></ul>'],
  ['Plug and play, studied', '<ul><li>What makes something plug and play: a plug that only fits one way, one cable that carries power and data, and a board that knows what is connected (I2C addresses do this).</li><li>So Case Zero labels every part: <b>PLUG IN</b> (keyed plug), <b>NO SOLDER</b> (pins, use jumpers) or <b>SOLDER</b>.</li><li>The decks are swappable like the inserts in your Figure 1 drawing (plain top, arcade top, computer top): same box, unscrew 4 screws, change the deck.</li></ul>'],
  ['Your Panel Layout v1, checked', '<table><tr><td>Grid</td><td>1 square = 20 mm. Your lid and base are each about 10 x 10 squares = 200 x 200 mm before walls. That needs a 220 mm bed or bigger, or 2 pieces on a 180 mm bed.</td></tr><tr><td>5 in display, 8 x 5</td><td>A 5 in HDMI screen is 121 x 90 mm, so <b>7 x 5</b> squares is enough. 8 x 5 is close to a 7 in, but a 7 in is 165 mm wide and needs <b>9 x 5</b>.</td></tr><tr><td>Joystick, 6 x 4</td><td>A Sanwa JLF plate is 95 x 53 mm, so <b>5 x 3</b>. A thumb stick needs only <b>2 x 2</b>.</td></tr><tr><td>2.5 in display, 4 x 3</td><td>2.5 in screens are rare. The common 2.8 in (like yours) is about 86 x 50 mm, so <b>5 x 3</b>.</td></tr><tr><td>Slider, 4 x 2</td><td>A 60 mm slider is about 75 x 9 mm, so <b>4 x 1</b>.</td></tr><tr><td>6 button cluster, 4 x 6</td><td>The label and the drawing disagree: the drawing shows 12 small buttons in 4 x 3. 12 mm buttons fit 1 square each, so 4 x 3 works. Six 30 mm arcade buttons need 2 squares each: <b>6 x 4</b> in 3 rows of 2.</td></tr><tr><td>2 button cluster, 2 x 4</td><td>Two 30 mm arcade buttons: 4 x 2. Two small buttons: 2 x 1.</td></tr><tr><td>D-pad, 2 x 2</td><td>Right. Our printed D-pad is 32 mm.</td></tr><tr><td>1 x 1 and control</td><td>20 mm fits a 12 or 16 mm button, an LED or a knob. Not a 24 or 30 mm arcade button (those need 2 x 2).</td></tr></table><p>Numbering: every part now gets a number by where it sits. L1, L2 on the lid, B1, B2 on the base, T on a top, I for inside. The same numbers show in the parts list and the wiring list.</p>'],
  ['Community picks and why', '<ul><li><b>Cheap Yellow Display</b> (ESP32-2432S028R): brain, 2.8 in touch screen, SD card and speaker plug on one board for about $15. The biggest community of any cheap screen. <a href="https://www.atomic14.com/esp32/boards/esp32-2432s028r/" target="_blank" rel="noopener">atomic14 guide</a></li><li><b>Round 1.28 in GC9A01</b>: watch faces, gauges, robot eyes. <a href="https://www.waveshare.com/1.28inch-lcd-module.htm" target="_blank" rel="noopener">Waveshare</a></li><li><b>Pico + 2.8 in screen</b>: your build, the cheapest handheld.</li><li><b>Pi Zero 2 W</b>: RetroPie for arcade builds, like the AdventurePi.</li></ul>'],
  ['AdventurePi, filtered', '<p>The AdventurePi (howchoo) put a Raspberry Pi, screen, battery and controls in a rugged hard case, with swappable Arcade and Console inserts. What we kept: the case that closes, screen in the lid, controls in the base, swappable decks. What is new: you print the case to fit your parts, any shape, cut to your printer.</p>'],
  ['Wiring and starter code', '<ul><li>Brain, Wire it, Wiring: every part gets its pins on the Pico by the real rules. Screens get the fast pins (GP18 and GP19), knobs and sticks the 3 analog pins (GP26 to 28), click wheels two pins side by side, sound and motors pins that do not fight each other.</li><li>Already soldered? Pick the pins you used in each part. Taken pins have a *. Pick pins for me starts over.</li><li>Save code.py: CircuitPython for the Pico, Pico W or Pico 2. Put CircuitPython on the board (circuitpython.org), copy the libraries named at the top of the file into CIRCUITPY/lib, save code.py on the drive. Buttons print their name and show on the screen, knobs show 0 to 100.</li><li>Every part also needs GND. Buttons need nothing else: the Pico pulls the pin up inside.</li></ul>'],
  ['Photo your built board', '<ul><li>Your board is soldered, everything is where it is. The case fits it, not the other way around.</li><li>Front photo: drag the dots onto the card and the board (watch the close-up). Then press on a part, slide until the cross is on its middle, let go, and say what it is. Screens and the brain appear at their real size: slide them over the photo and Turn them to match. The brain has a USB arrow: point it where the plug is.</li><li>Tap a tag to change what it is, turn it or remove it.</li><li>Back photo: tap the screw holes. They become posts that hold the board under the top.</li><li>Tell it the tallest button height. The top of the case sits so buttons poke through 1.5 mm.</li><li>In the case: your board is dashed, underneath. Every part on it is its own part: tap one to change what it is. Dragging one moves the whole board; Unlock to nudge one alone. The USB opening goes in the wall the arrow points at.</li><li>No AI looks at your photos. Nothing leaves your phone.</li></ul>'],

  ['A panel for a box you have', '<ul><li>Body, Shape, Panel (or pick it on the start screen): one flat piece that fills a box you already have, like a briefcase lid.</li><li>Box inside: type it or measure it with a card. The panel comes out 1 mm smaller so it drops in.</li><li>Holds by: Screws (M3 in the corners), Snug ribs (little bumps on every edge press against the box, no screws) or Drops in.</li><li>Sits: On the floor, and the whole screen comes up through the window. On legs or On a lip, and the panel is lifted to the front of the screen so the window shows only the picture. Measure from the floor of the box to the front of the screen for the height. A lip is a wall under the whole edge: stiffer than legs, hides the wires, notches cut through it. Raised panels print face down.</li><li>Holds by: Screws (M3 in the corners, through the legs or lip into the box; line them up with screws you already have), Glue (no holes, E6000 or CA on the bottom of the lip or legs), Snug ribs, or Drops in.</li><li>Notches let wires out: Round, Rounded or Square, any edge. Tap an edge on the picture or drag to move one.</li><li>Bigger than your bed? It prints in pieces with puzzle tabs that lock in the middle.</li></ul>'],
  ['Extras', '<ul><li>Files, Extras: pieces you print one at a time, sized to your case.</li><li>Clip-on stand: grabs the bottom edge and leans it back 15, 25 or 35 degrees. Prints on its side so the layers run the strong way. No hinge pin to snap.</li><li>Feet, standoffs (the screw cuts its own thread), cable clips (tape or glue them on).</li></ul>'],
  ['Deck (cyberdeck or laptop)', '<p>A big Case Zero: screen in the lid, keyboard and controls in the base. Sizes go up to 24 squares (480 mm). Keyboards vary a lot, so photo yours with the card in Brain (Snap). On a small bed it prints as puzzle pieces.</p>'],
  ['Print time and strength', '<ul><li>The time is worked out from the real plastic in your case and how fast your printer really prints. Your slicer has the exact number, this is within about a third.</li><li>Older bed slingers like the Ender-3 S1 print about 3 times slower than a Bambu, K1 or Ender-3 V3.</li><li>A case is a shell with 2.4 mm walls. Infill does not matter much because 4 walls already fill them. Want it tougher? Thick walls (3.2 mm).</li><li>Fast (0.28 mm layers) shows lines and saves about a quarter of the time. Smooth (0.12 mm) takes about twice as long.</li><li>The QR sticker: Creality stickers hold a link (qr.creality.com) and a serial number, not the model. The scanner reads both and opens the Creality list; the model is printed on the sticker next to Model Number.</li></ul>'],
  ['Measuring with your phone', '<ul><li>Any bank, ID, gift or library card is 85.6 x 54 mm. It is the ruler.</li><li>Card corners are rounded. Do not put the dots on the curve: move them until the white outline sits on the card edge, rounded corners too. A dot on the curve throws every size off by a few percent.</li><li>Lay it flat right next to the part, same table. Good light, no flash, no shadows.</li><li>The green outline goes solid when your phone is level, then it snaps by itself.</li><li>A hand in the photo is a nice size guide for people, but hands differ by a lot. The card is accurate to about 1 mm.</li><li>Flip the part like a page for the back so the screw holes line up.</li></ul>'],
  ['Printing and joining', '<ul><li>Bigger than your bed? Pick where the seams go (up and down, across, both, or diagonal) and how many. Puzzle tabs lock the pieces, a drop of super glue keeps them.</li><li>Magnets: 6 x 3 mm, press in, glue if loose. Check which way they attract before gluing the second one.</li><li>Screws + heat set inserts: press brass inserts in with a soldering iron, then it can come apart forever.</li><li>Printed hinge: slide 1.75 mm filament through the barrels as the pin, melt the ends a little to keep it in.</li><li>Wood (Case Zero Base): print the templates at 100 percent, check the 10 mm line with a ruler, tape on, cut.</li></ul>'],
  ['Logos, labels and textures', '<ul><li><b>Pressed in</b>: the mark is a 0.6 mm dip. One color printer: wipe paint in, scrape the top. Two or more colors: you get a second file that fills the dip in your marks color.</li><li><b>Raised</b>: printed as its own piece that drops into a 0.6 mm pocket, a dot of glue holds it. The deck prints face down, so nothing can stick up from it in the same print.</li><li><b>Cut out</b>: goes all the way through, the inside or a light shows behind it.</li><li>Textures: each side gets its own. Tread, wood grain, grid, checks, dots and stripes on the flat sides, ribs and bands on the walls. Spacing is up to you.</li><li>Logos: a PNG with a clear or white background traces cleanest. Thin lines under about 0.8 mm are too fine to print.</li></ul>'],
  ['Joints and springs (Slant 3D ideas)', '<ul><li>Slant 3D (a print farm with thousands of printers) shows how to join prints without fragile pegs: chamfered pins, fins and slots, tongue and slot, snap clips, glue slots. Case Zero uses the tongue (puzzle tab) for seams and a cantilever snap clip for the deck.</li><li><b>Snap clips</b>: 4 arms under the deck click into a groove in the wall. Long thin arms bend instead of breaking. PETG is the most forgiving.</li><li><b>Printed springs</b>: a living hinge is a thin section that bends. The small button becomes a pad on one arm with a nub that presses the switch. Spread the bend over more length and it lasts longer. Every flexure wears out in the end, so keep spares.</li><li>Print-in-place hinges fuse if the gap is too small. Ours is a separate pin (1.75 mm filament), so it can never fuse.</li></ul>'],
  ['Copy a part like Zack Freedman', '<ul><li>His method for perfect spare parts: break it into simple pieces, measure with calipers, photograph each piece with a ruler, trace the photo, extrude it, print, test fit, fix, repeat.</li><li>Photo tips we use in Measure: step back and zoom in a little (less bend at the edges), keep the phone square to the part, plain background, even light.</li><li>Real parts are made to round numbers. 2.98 mm is really 3 mm. Measure rounds sizes that land within 0.15 mm of a half millimeter.</li><li>Print the <b>test fit</b> file first: a 1 mm thin copy of the deck that prints in minutes. Push your parts through it. Fix, then print the real case.</li></ul>'],
  ['Make it move', '<p>Character shape plus a mini servo (Movement) turns a head, an arm or the eyes. A Pico runs the moves. For a body, arms and legs, open Parts and print the Character body.</p>']
];
function openHelp() { $('sheetIn').innerHTML = '<button class="x" id="sheetX" aria-label="Close">&times;</button><h2>Help and Learn</h2>' + LEARN.map((l, i) => '<details' + (i === 0 ? ' open' : '') + '><summary>' + l[0] + '</summary>' + l[1] + '</details>').join(''); $('sheet').hidden = false; $('sheetX').onclick = () => { $('sheet').hidden = true; }; }
$('helpTop').onclick = openHelp;
document.addEventListener('toggle', (e) => { if (e.target && e.target.id === 'adjBox') { S.adjOpen = e.target.open; save(); } }, true); /* the Adjust section stays open while you work in it */
$('undoTop').onclick = () => undo(); $('redoTop').onclick = () => redo(); histBtns();
document.addEventListener('keydown', (e) => { if (!(e.ctrlKey || e.metaKey) || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return; const k = (e.key || '').toLowerCase(); if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); } });
$('freshTop').onclick = () => { $('sheetIn').innerHTML = '<h2>Clear current build and start fresh?</h2><p class="note" style="font-size:14px">This clears the body, the electronics, the mounted parts, the ports, the logos and the saved draft.</p><div class="list" style="margin-top:10px"><button class="btn start" data-door="wipe"><b>Clear and start fresh</b>Begin again from the start screen.</button><button class="btn start" data-door="cancel"><b>Keep my build</b>Go back to what I was making.</button></div>'; $('sheet').hidden = false; };
$('sheet').addEventListener('click', (e) => { if (e.target === $('sheet') || e.target.closest('#sheetX')) { $('sheet').hidden = true; return; } const cp = e.target.closest('[data-cp]'); if (cp) { $('sheet').hidden = true; cpFix(cp.dataset.cp); } });
window.addEventListener('resize', draw);
// mounting: drag a part onto a spot (desktop), or tap a spot or a dot on the case (phone)
$('pane').addEventListener('dragstart', (e) => { const t = e.target.closest && e.target.closest('[data-mdrag]'); if (t) { e.dataTransfer.setData('text/plain', t.dataset.mdrag); e.dataTransfer.effectAllowed = 'copy'; } });
$('pane').addEventListener('dragover', (e) => { const t = e.target.closest && e.target.closest('[data-manc]:not([disabled]),[data-panc]:not([disabled])'); if (t) e.preventDefault(); });
$('pane').addEventListener('drop', (e) => { const t = e.target.closest && e.target.closest('[data-manc]:not([disabled]),[data-panc]:not([disabled])'); if (!t) return; e.preventDefault(); if (t.dataset.panc != null) { portAttach({ u: +t.dataset.panc }); return; } const [u, v] = t.dataset.manc.split(',').map(Number); attachAt({ u, v }); });
{ const el = $('v3'); let dn = null;
  el.addEventListener('pointerdown', (e) => { dn = [e.clientX, e.clientY]; });
  el.addEventListener('click', (e) => { if (!mountView() || !dn || Math.hypot(e.clientX - dn[0], e.clientY - dn[1]) > 6) return; const a = pickMark(e.clientX, e.clientY); if (a) attachAt(a); });
  el.addEventListener('dragover', (e) => { if (mountView()) e.preventDefault(); });
  el.addEventListener('drop', (e) => { if (!mountView()) return; e.preventDefault(); const a = pickMark(e.clientX, e.clientY, 60); if (a) attachAt(a); }); }
// the build was changed somewhere else (another tab, or this page was put aside and brought back): show the saved one
function resync() { let raw = null; try { raw = localStorage.getItem(KEY); } catch (e) { return; } if (!raw || raw === STORED) return;
  hydrate(); applyWalls(); uid = S.items.reduce((m, p) => Math.max(m, p.id || 0), 0); if (!S.items.some((i) => i.id === sel)) sel = null; LAST = null; TSEL = null; DECO = null; markCache = {}; BIG3D = false; render(); }
window.addEventListener('pageshow', (e) => { if (e.persisted) resync(); });
window.addEventListener('storage', (e) => { if (e.key === KEY) resync(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) resync(); });

// ---------- Sound engine: real Web Audio, made in the browser. One AudioContext, unlocked on the first tap (iPhone Safari needs a tap). ----------
var AU = { ctx: null, on: (() => { try { return localStorage.getItem(KEY + ':sound') !== '0'; } catch (e) { return true; } })(), user: {}, dj: null };
function auCtx() { if (AU.ctx) return AU.ctx; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  try { const c = new AC(); AU.ctx = c; TEST.ac = c; AU.out = c.createGain(); AU.out.gain.value = 0.8; const lim = c.createDynamicsCompressor(); AU.out.connect(lim); lim.connect(c.destination);
    const n = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; AU.noise = n; } catch (e) { AU.ctx = null; } return AU.ctx; }
function auUnlock() { const c = auCtx(); if (!c) return null; if (!AU.on) { if (c.state === 'running') c.suspend().catch(() => {}); return c; }
  if (c.state !== 'running' || !AU.primed) { AU.primed = true; try { c.resume().catch(() => {}); } catch (e) {} try { const b = c.createBufferSource(); b.buffer = c.createBuffer(1, 1, 22050); b.connect(c.destination); b.start(0); } catch (e) {} } return c; } /* iPhone Safari: resume and a 1-sample silent buffer, inside the tap itself */
document.addEventListener('pointerdown', () => { if (AU.on) auUnlock(); if (TEST.ac && TEST.ac !== AU.ctx && TEST.ac.state !== 'running') try { TEST.ac.resume(); } catch (e) {} }, true);
function playInd() { const el = $('pind'); if (!el || !AU) return; const on = (PAGES[S.page] || {}).room === 'play' && curTab() !== 'map'; el.hidden = !on; /* Wired: keep the pin labels clear */ if (!on) return; const live = (AU.on && !!AU.loopT) || Date.now() - (AU.hot || 0) < 1200; /* any tap flips it, sound on or off */
  const k = AU.on + ':' + live; if (el.dataset.k === k) return; el.dataset.k = k; el.innerHTML = '<button type="button" class="' + (AU.on ? 'on' : '') + '" data-snd="' + (AU.on ? '0' : '1') + '" aria-pressed="' + AU.on + '">Sound: ' + (AU.on ? 'On' : 'Off') + '</button><span class="' + (live ? 'live' : '') + '">' + (live ? '\u25B6 Playing' : 'Tap any pad') + '</span>'; }
function auHot() { AU.hot = Date.now(); playInd(); clearTimeout(AU.indT); AU.indT = setTimeout(playInd, 1300); }
$('pind').addEventListener('click', (e) => { const b = e.target.closest('[data-snd]'); if (!b) return; auSet(b.dataset.snd === '1'); if (!AU.on) djStop(); else if (playSim()) djSync(TRYS.dj); else if (curTab() === 'test' && TEST.dj) djSync(TEST.dj); render(); });
function auSet(on) { AU.on = on; try { localStorage.setItem(KEY + ':sound', on ? '1' : '0'); } catch (e) {} const c = auCtx(); if (c) { if (on) auUnlock(); else c.suspend().catch(() => {}); } }
const soundPill = () => '<button type="button" class="spill' + (AU.on ? ' on' : '') + '" data-snd="' + (AU.on ? '0' : '1') + '" aria-pressed="' + AU.on + '">Sound: ' + (AU.on ? 'On' : 'Off') + '</button>';
const libsDrawer = () => '<details class="fold slib"><summary>Free Sound Libraries</summary><div class="list">' + (CZ.SOUND_LIBS || []).map(([n, u, t]) => '<a href="' + u + '" target="_blank" rel="noopener"><b>' + n + '</b>' + t + '</a>').join('') + '</div><p class="note keep">Tip: for the Pico save each sound as a <b>16-bit, 22 kHz, mono .wav</b>.</p></details>';
function auEnv(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
function auNoise(c, t, dur, dest, rate) { const s = c.createBufferSource(); s.buffer = AU.noise; s.loop = true; if (rate) s.playbackRate.value = rate; s.connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.05); return s; }
function auOsc(c, type, f, t, dur, dest) { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.connect(dest); o.start(t); o.stop(t + dur + 0.05); return o; }
function auFilt(c, type, f, q, dest) { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; b.connect(dest); return b; }
// one sound: id = 'pack.name' or 'user:n'. o: { pitch 0.5..2, vol 0..1, cutoff Hz, dest, t }
function auPlay(id, o) { const c = auUnlock(); if (!c || !AU.on) return null; o = o || {}; auHot(); const t = o.t || c.currentTime + 0.005, p = o.pitch || 1, g = c.createGain(); g.gain.value = 1; g.connect(o.dest || AU.out);
  const vol = c.createGain(); vol.gain.value = o.vol == null ? 1 : o.vol; vol.connect(g); const n = String(id).split('.').pop(), out = o.cutoff ? auFilt(c, 'lowpass', o.cutoff, 0.8, vol) : vol, e = (a, pk, d) => { const q = c.createGain(); auEnv(q, t, a, pk, d); q.connect(out); return q; };
  if (/^user:/.test(id)) { const b = AU.user[id.slice(5)]; if (!b) return null; const s = c.createBufferSource(); s.buffer = b; s.playbackRate.value = p; s.connect(out); s.start(t); return { stop: () => { try { s.stop(); } catch (x) {} } }; }
  switch (n) {
    case 'kick': { const q = e(0.002, 1, 0.45), s = auOsc(c, 'sine', 150 * p, t, 0.5, q); s.frequency.exponentialRampToValueAtTime(42 * p, t + 0.14); break; }
    case 'snare': auNoise(c, t, 0.22, auFilt(c, 'highpass', 1200, null, e(0.001, 0.7, 0.2))); auOsc(c, 'triangle', 185 * p, t, 0.12, e(0.001, 0.5, 0.1)); break;
    case 'hat': auNoise(c, t, 0.06, auFilt(c, 'highpass', 7000 * p, null, e(0.001, 0.45, 0.05))); break;
    case 'ohat': auNoise(c, t, 0.4, auFilt(c, 'highpass', 6500 * p, null, e(0.001, 0.4, 0.35))); break;
    case 'clap': { const bp = auFilt(c, 'bandpass', 1500 * p, 1.2, out); [0, 0.011, 0.022].forEach((d) => { const q = c.createGain(); auEnv(q, t + d, 0.001, 0.8, 0.012); q.connect(bp); auNoise(c, t + d, 0.03, q); }); const tl = c.createGain(); auEnv(tl, t + 0.03, 0.001, 0.6, 0.16); tl.connect(bp); auNoise(c, t + 0.03, 0.2, tl); break; }
    case 'tom': { const s = auOsc(c, 'sine', 210 * p, t, 0.35, e(0.002, 0.9, 0.3)); s.frequency.exponentialRampToValueAtTime(95 * p, t + 0.3); break; }
    case 'rim': auOsc(c, 'square', 820 * p, t, 0.04, auFilt(c, 'bandpass', 1700, 3, e(0.001, 0.5, 0.03))); break;
    case 'cow': { const q = auFilt(c, 'bandpass', 800 * p, 2, e(0.001, 0.5, 0.3)); auOsc(c, 'square', 540 * p, t, 0.35, q); auOsc(c, 'square', 800 * p, t, 0.35, q); break; }
    case 'rain': { const q = e(0.25, 0.5, 2.6), lp = auFilt(c, 'lowpass', 2600 * p, null, q); auNoise(c, t, 2.9, lp); for (let i = 0; i < 26; i++) { const tt = t + Math.random() * 2.6, k = c.createGain(); auEnv(k, tt, 0.001, 0.25 + Math.random() * 0.3, 0.02); k.connect(auFilt(c, 'bandpass', 2500 + Math.random() * 3500, 2, out)); auNoise(c, tt, 0.03, k); } break; }
    case 'ocean': { const q = c.createGain(), lp = auFilt(c, 'lowpass', 500 * p, null, q); q.connect(out); q.gain.setValueAtTime(0.0001, t); [[0.9, 0.7], [2.0, 0.12], [3.0, 0.75], [4.4, 0.0001]].forEach(([d, v]) => q.gain.exponentialRampToValueAtTime(v, t + d)); lp.frequency.setValueAtTime(300 * p, t); lp.frequency.linearRampToValueAtTime(1100 * p, t + 0.9); lp.frequency.linearRampToValueAtTime(350 * p, t + 2); lp.frequency.linearRampToValueAtTime(1000 * p, t + 3); auNoise(c, t, 4.5, lp); break; }
    case 'wind': { const q = e(0.6, 0.6, 3), bp = auFilt(c, 'bandpass', 400 * p, 1.4, q); bp.frequency.setValueAtTime(350 * p, t); bp.frequency.linearRampToValueAtTime(950 * p, t + 1.3); bp.frequency.linearRampToValueAtTime(280 * p, t + 3.4); auNoise(c, t, 3.6, bp); break; }
    case 'bird': for (let i = 0; i < 4; i++) { const tt = t + i * 0.13 + (i > 1 ? 0.15 : 0), q = c.createGain(); auEnv(q, tt, 0.005, 0.35, 0.08); q.connect(out); const s = auOsc(c, 'sine', 2600 * p, tt, 0.1, q); s.frequency.exponentialRampToValueAtTime(4300 * p, tt + 0.04); s.frequency.exponentialRampToValueAtTime(3000 * p, tt + 0.09); } break;
    case 'thunder': auNoise(c, t, 3.2, auFilt(c, 'lowpass', 180 * p, null, e(0.05, 1, 3)), 0.5); break;
    case 'stream': { const q = e(0.2, 0.35, 2.6), bp = auFilt(c, 'bandpass', 2400 * p, 0.8, q); const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 7; lg.gain.value = 900; l.connect(lg); lg.connect(bp.frequency); l.start(t); l.stop(t + 3); auNoise(c, t, 2.9, bp); break; }
    case 'cricket': for (let i = 0; i < 6; i++) { const tt = t + i * 0.32, q = c.createGain(); q.connect(out); for (let k = 0; k < 4; k++) { q.gain.setValueAtTime(0.0001, tt + k * 0.03); q.gain.linearRampToValueAtTime(0.18, tt + k * 0.03 + 0.008); q.gain.linearRampToValueAtTime(0.0001, tt + k * 0.03 + 0.022); } auOsc(c, 'sine', 4500 * p, tt, 0.14, q); } break;
    case 'drip': { const s = auOsc(c, 'sine', 1400 * p, t, 0.2, e(0.002, 0.6, 0.15)); s.frequency.exponentialRampToValueAtTime(380 * p, t + 0.12); break; }
    case 'bassC': case 'bassF': case 'bassG': { const f = { bassC: 65.41, bassF: 87.31, bassG: 98 }[n] * p, lp = auFilt(c, 'lowpass', o.cutoff || 900, 6, e(0.005, 0.8, 0.5)); lp.frequency.setValueAtTime((o.cutoff || 900) * 2.5, t); lp.frequency.exponentialRampToValueAtTime(Math.max(120, (o.cutoff || 900) / 3), t + 0.35); auOsc(c, 'sawtooth', f, t, 0.6, lp); auOsc(c, 'square', f / 2, t, 0.6, lp); break; }
    case 'leadC': case 'leadE': case 'leadG': { const f = { leadC: 523.25, leadE: 659.25, leadG: 783.99 }[n] * p, q = e(0.01, 0.35, 0.6); auOsc(c, 'square', f, t, 0.65, q); auOsc(c, 'sawtooth', f * 1.005, t, 0.65, q); break; }
    case 'pluck': auOsc(c, 'triangle', 392 * p, t, 0.4, e(0.002, 0.7, 0.35)); auOsc(c, 'sine', 784 * p, t, 0.2, e(0.002, 0.3, 0.15)); break;
    case 'pad': { const q = e(0.4, 0.25, 1.8); [261.63, 329.63, 392].forEach((f) => [-6, 6].forEach((dt) => { const s = auOsc(c, 'sawtooth', f * p, t, 2.3, q); s.detune.value = dt; })); break; }
    case 'horn': { const q = e(0.02, 0.5, 0.7); [0, 0.18, 0.36].forEach((d) => [440, 554, 659].forEach((f) => { const qq = c.createGain(); auEnv(qq, t + d, 0.01, 0.25, 0.16); qq.connect(q); auOsc(c, 'sawtooth', f * p, t + d, 0.18, qq); })); break; }
    case 'riser': { const q = e(1.4, 0.4, 0.2), bp = auFilt(c, 'bandpass', 300, 3, q); bp.frequency.setValueAtTime(300 * p, t); bp.frequency.exponentialRampToValueAtTime(6000 * p, t + 1.6); auNoise(c, t, 1.7, bp); const s = auOsc(c, 'sawtooth', 110 * p, t, 1.7, q); s.frequency.exponentialRampToValueAtTime(880 * p, t + 1.6); break; }
    case 'scratch': { const bp = auFilt(c, 'bandpass', 1200 * p, 2, out); [0, 0.12, 0.2].forEach((d, i) => { const q = c.createGain(); auEnv(q, t + d, 0.005, 0.7, 0.08); q.connect(bp); auNoise(c, t + d, 0.1, q, i % 2 ? 0.6 : 1.4); }); break; }
    case 'laser': { const s = auOsc(c, 'square', 2200 * p, t, 0.35, e(0.002, 0.3, 0.3)); s.frequency.exponentialRampToValueAtTime(120 * p, t + 0.3); break; }
    case 'click': auOsc(c, 'square', 1800, t, 0.02, e(0.001, 0.2, 0.015)); break;
    case 'beep': [0, 0.25, 0.5].forEach((d) => { const q = c.createGain(); auEnv(q, t + d, 0.005, 0.4, 0.15); q.connect(out); auOsc(c, 'square', 1760, t + d, 0.18, q); }); break;
    default: auOsc(c, 'sine', 440 * p, t, 0.3, e(0.005, 0.4, 0.25));
  }
  return { stop: () => { try { g.gain.setTargetAtTime(0, c.currentTime, 0.03); } catch (x) {} } };
}
// DJ FX: a real beat loop, through an Echo (feedback delay), a Phaser (4 all-pass filters swept by an LFO) and a Spiral (a delay whose time sweeps down, with a rising filter).
// Beat sets the echo time (1/4 to 8 beats), Wet/Dry the mix. Same four buttons and two controls as the DJ FX code.
const DJBPM = 120, DJDIV = [0.25, 0.5, 1, 2, 4, 8];
function djGraph() { const c = auUnlock(); if (!c) return null; if (AU.dj) return AU.dj; const G0 = { bus: c.createGain(), dry: c.createGain(), wet: c.createGain(), sends: [] };
  G0.bus.connect(G0.dry); G0.dry.connect(AU.out); G0.wet.connect(AU.out);
  const send = () => { const s = c.createGain(); s.gain.value = 0; G0.bus.connect(s); G0.sends.push(s); return s; };
  { const s = send(), d = c.createDelay(5), fb = c.createGain(); d.delayTime.value = 0.5; fb.gain.value = 0.55; s.connect(d); d.connect(fb); fb.connect(d); d.connect(G0.wet); G0.echo = d; } /* Echo */
  { const s = send(), d = c.createDelay(2), fb = c.createGain(), hp = c.createBiquadFilter(), l = c.createOscillator(), lg = c.createGain(); d.delayTime.value = 0.25; fb.gain.value = 0.7; hp.type = 'highpass'; hp.frequency.value = 200; l.frequency.value = 0.25; lg.gain.value = 0.2; l.connect(lg); lg.connect(d.delayTime); l.start(); s.connect(d); d.connect(hp); hp.connect(fb); fb.connect(d); hp.connect(G0.wet); G0.spiral = { d, hp }; } /* Spiral */
  { const s = send(), l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 0.5; lg.gain.value = 700; l.connect(lg); l.start(); let at = s; for (let i = 0; i < 4; i++) { const a = c.createBiquadFilter(); a.type = 'allpass'; a.frequency.value = 900; a.Q.value = 0.7; lg.connect(a.frequency); at.connect(a); at = a; } const mix = c.createGain(); s.connect(mix); at.connect(mix); mix.connect(G0.wet); } /* Phaser: dry + all-pass, the notches sweep */
  AU.dj = G0; return G0; }
function djSync(D) { if (!AU) return; // D: { on: [loop, echo, spiral, phaser], beat 0..5, wet 0..100 }
  if (!D || !AU.on || !D.on.some(Boolean)) { djStop(); return; } const G0 = djGraph(); if (!G0) return; const c = AU.ctx, now = c.currentTime, beat = 60 / DJBPM, w = (D.wet == null ? 50 : D.wet) / 100, dv = DJDIV[D.beat == null ? 2 : D.beat];
  G0.echo.delayTime.setTargetAtTime(Math.min(4.9, beat * dv), now, 0.05);
  G0.spiral.d.delayTime.setTargetAtTime(Math.min(1.5, beat * dv / 2), now, 0.3); G0.spiral.hp.frequency.setTargetAtTime(D.on[2] ? 2400 : 200, now, 0.8); /* the Spiral climbs while it is on */
  [1, 2, 3].forEach((k, i) => G0.sends[i].gain.setTargetAtTime(D.on[k] ? 1 : 0, now, 0.04)); G0.wet.gain.setTargetAtTime(w, now, 0.04); G0.dry.gain.setTargetAtTime(1 - w * 0.6, now, 0.04); /* smooth ramps, no clicks */
  djBeat(true); } /* Loop, Echo, Spiral or Phaser: the beat starts by itself, so tap 1 is heard through the FX */
function djBeat(on) { // the beat loop's own lookahead clock: Beat Loop -> Phaser -> Echo -> Spiral, none of them starts or stops it
  if (!on) { if (AU.loopT) { clearInterval(AU.loopT); AU.loopT = null; playInd(); } return; } if (AU.loopT || !AU.ctx || !AU.dj) return;
  const c = AU.ctx, beat = 60 / DJBPM; let next = c.currentTime + 0.05, step = 0;
  const tick = () => { if (!AU.ctx || !AU.dj) return; if (next < c.currentTime) next = c.currentTime + 0.02; /* after a pause: no pile of late hits */
    while (next < c.currentTime + 0.12) { const s = step % 16, B = AU.dj.bus; if (s % 4 === 0) auPlay('kick', { t: next, dest: B }); if (s === 4 || s === 12) auPlay('snare', { t: next, dest: B }); if (s % 2 === 0) auPlay('hat', { t: next, dest: B, vol: 0.6 }); if (s === 14) auPlay('clap', { t: next, dest: B, vol: 0.5 }); next += beat / 4; step++; } };
  AU.loopT = setInterval(tick, 25); tick(); playInd(); }
function djStop() { if (!AU) return; djBeat(false); if (AU.dj && AU.ctx) { const now = AU.ctx.currentTime; AU.dj.sends.forEach((s) => s.gain.setTargetAtTime(0, now, 0.05)); } }

// ---------- TRY: a sandbox to play before any hardware is picked. Pick a preset, give each pad a sound, set the knobs, then Make this my build. ----------
const TRYP = () => CZ.TRY_PRESETS || [], KFN = (k) => ((CZ.KNOB_FNS || []).find((x) => x[0] === k) || [k, k])[1];
const PACKS = () => CZ.SOUND_PACKS || {}, sid = (p, n) => (/^fx:/.test(n) ? n : p + '.' + n), sndName = (id) => { if (/^fx:/.test(id)) return id[3].toUpperCase() + id.slice(4); if (/^user:/.test(id)) return (AU.userName || {})[id.slice(5)] || 'Your file'; if (/^mac:/.test(id)) return id.slice(4); if (/^tm:/.test(id)) return id === 'tm:start' ? 'Start/Pause' : 'Reset'; const [p, n] = id.split('.'), P = PACKS()[p]; const s = P && P.sounds.find((x) => x[0] === n); return s ? s[1] : id; };
const KDEF = { volume: 80, pitch: 50, cutoff: 70, beat: 2, wet: 50, effect: 0, minutes: 25 }, KMAX = { beat: 5, minutes: 60 };
function TRY() { if (!S.tr) S.tr = {}; const T = S.tr, pr = TRYP().find((p) => p.id === T.preset) || TRYP()[0]; if (!pr) return null;
  if (T.preset !== pr.id || !Array.isArray(T.pads) || T.pads.length !== pr.pads) trySetPreset(pr.id); return S.tr; }
function trySetPreset(id) { const pr = TRYP().find((p) => p.id === id) || TRYP()[0], T = S.tr = { preset: pr.id, sel: 0, kv: {} };
  T.pads = pr.sounds ? pr.sounds.slice() : pr.macros ? pr.macros.map((m) => 'mac:' + m) : pr.timer ? ['tm:start', 'tm:reset'] : PACKS()[pr.pack].sounds.slice(0, pr.pads).map((s) => sid(pr.pack, s[0]));
  T.knobs = pr.knobs.slice(); T.knobs.forEach((k) => { T.kv[k] = KDEF[k]; }); TRYS.dj = { on: [false, false, false, false], beat: KDEF.beat, wet: KDEF.wet }; djStop(); tryTimerStop(); TRYS.text = pr.name; }
var TRYS = { text: '', held: {}, dj: { on: [false, false, false, false], beat: 2, wet: 50 } };
const tPreset = () => TRYP().find((p) => p.id === TRY().preset);
const kv = (k) => { const T = TRY(); return T.kv[k] == null ? KDEF[k] : T.kv[k]; };
function tryPad(i, down) { const T = TRY(), id = T.pads[i]; if (!id) return; if (!down) { delete TRYS.held[i]; tryStage(true); return; } TRYS.held[i] = true; auUnlock();
  const pitch = T.knobs.indexOf('pitch') > -1 ? Math.pow(2, (kv('pitch') - 50) / 50) : 1, vol = T.knobs.indexOf('volume') > -1 ? kv('volume') / 100 : 0.9, cutoff = T.knobs.indexOf('cutoff') > -1 ? 200 * Math.pow(60, kv('cutoff') / 100) : 0;
  if (/^fx:/.test(id)) { const k = DJA[id.slice(3)]; TRYS.dj.on[k] = !TRYS.dj.on[k]; TRYS.dj.beat = kv('beat'); TRYS.dj.wet = kv('wet'); djSync(TRYS.dj); const on = DJFX.filter((f, j) => TRYS.dj.on[j]).map((f) => f[0]); TRYS.text = (on.length ? on.join('+') : 'No FX') + ' | ' + BEATS[TRYS.dj.beat] + ' | Wet ' + TRYS.dj.wet + '%'; }
  else if (/^mac:/.test(id)) { auPlay('click'); TRYS.text = 'Types ' + id.slice(4); }
  else if (id === 'tm:start') { auPlay('click'); tryTimerToggle(); }
  else if (id === 'tm:reset') { auPlay('click'); tryTimerStop(); TRYS.text = String(kv('minutes')).padStart(2, '0') + ':00'; }
  else { let dest = null; if (T.knobs.indexOf('effect') > -1 && kv('effect') > 0) dest = tryEcho(kv('effect') / 100); auPlay(id, { pitch, vol, cutoff, dest }); TRYS.text = sndName(id); }
  tryStage(true); }
function tryEcho(w) { const c = auUnlock(); if (!c) return null; if (!AU.techo) { const i = c.createGain(), d = c.createDelay(2), fb = c.createGain(), wg = c.createGain(); d.delayTime.value = 0.28; i.connect(AU.out); i.connect(d); d.connect(fb); fb.connect(d); d.connect(wg); wg.connect(AU.out); AU.techo = { i, fb, wg }; }
  AU.techo.fb.gain.value = 0.3 + w * 0.4; AU.techo.wg.gain.value = w; return AU.techo.i; }
function tryTimerToggle() { if (TRYS.tm) { clearInterval(TRYS.tm); TRYS.tm = null; TRYS.text = 'Paused ' + tmTxt(); return; } if (!TRYS.left) TRYS.left = kv('minutes') * 60; TRYS.tm = setInterval(() => { TRYS.left--; TRYS.text = tmTxt(); if (TRYS.left <= 0) { tryTimerStop(); TRYS.text = '00:00 Done!'; auPlay('beep'); } tryStage(true); }, 1000); TRYS.text = tmTxt(); }
function tryTimerStop() { if (TRYS.tm) clearInterval(TRYS.tm); TRYS.tm = null; TRYS.left = 0; }
const tmTxt = () => String(Math.floor(TRYS.left / 60)).padStart(2, '0') + ':' + String(TRYS.left % 60).padStart(2, '0');
function tryKnob(k, v) { const T = TRY(); T.kv[k] = v; if (k === 'beat' || k === 'wet') { TRYS.dj.beat = kv('beat'); TRYS.dj.wet = kv('wet'); djSync(TRYS.dj); TRYS.text = KFN(k) + ' ' + (k === 'beat' ? BEATS[v] : v + '%'); } else if (k === 'minutes') { if (!TRYS.tm) TRYS.left = 0; TRYS.text = String(v).padStart(2, '0') + ':00'; } else TRYS.text = KFN(k) + ' ' + v; save(); tryStage(true); }
// the stage: a pretend device you can play, pads big enough for a thumb
function tryStage(light) { const el = $('tryv'); if (!el) return; if (simKind()) { simStage(el); return; } if (el.dataset.sim) { delete el.dataset.sim; el.innerHTML = ''; light = false; } const T = TRY(), pr = tPreset(); if (!T || !pr) return;
  if (light && el.firstChild) { const sc = el.querySelector('.tscr'); if (sc) sc.textContent = TRYS.text || pr.name; el.querySelectorAll('[data-tpad]').forEach((b) => { const i = +b.dataset.tpad, id = T.pads[i]; b.classList.toggle('hit', !!TRYS.held[i]); b.classList.toggle('lit', /^fx:/.test(id) && !!TRYS.dj.on[DJA[id.slice(3)]]); }); return; }
  const cols = pr.pads <= 2 ? 2 : pr.pads <= 6 ? 3 : 4;
  el.innerHTML = '<div class="tdev"><div class="trow">' + (pr.screen ? '<div class="tscr">' + esc(TRYS.text || pr.name) + '</div>' : '<div class="tscr dim">' + esc(TRYS.text || pr.name) + '</div>') + '</div>' +
    '<div class="tpads" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' + T.pads.map((id, i) => '<button type="button" class="tpad' + (i === T.sel ? ' sel' : '') + (/^fx:/.test(id) ? ' fx' : '') + '" data-tpad="' + i + '"><b>' + (i + 1) + '</b><span>' + esc(sndName(id)) + '</span></button>').join('') + '</div>' +
    '<div class="tknobs">' + T.knobs.map((k) => '<label class="tknob"><span>' + esc(KFN(k)) + ' <output>' + (k === 'beat' ? BEATS[kv(k)] : kv(k)) + '</output></span><input type="range" min="' + (k === 'minutes' ? 1 : 0) + '" max="' + (KMAX[k] || 100) + '" step="1" value="' + kv(k) + '" data-tknob="' + k + '" aria-label="' + esc(KFN(k)) + '"></label>').join('') + '</div></div>';
  tryStage(true); }
function tryPane() { if (simKind()) return simPane(); const T = TRY(), pr = tPreset(); if (!T) return '';
  const all = [].concat(...Object.keys(PACKS()).map((p) => PACKS()[p].sounds.filter((s) => !/^fx:/.test(s[0])).map((s) => [p + '.' + s[0], PACKS()[p].name + ': ' + s[1]]))), users = Object.keys(AU.user).map((k) => ['user:' + k, 'Your file: ' + sndName('user:' + k)]);
  const opts = (cur) => '<optgroup label="Sounds">' + all.concat(users).map(([v, n]) => '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</optgroup><optgroup label="Functions">' + DJFX.map((f) => 'fx:' + f[0].toLowerCase()).concat((CZ.MACROS || []).map((m) => 'mac:' + m), ['tm:start', 'tm:reset']).map((v) => '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(/^fx:/.test(v) ? 'DJ FX: ' + sndName(v) : /^mac:/.test(v) ? 'Shortcut: ' + v.slice(4) : 'Timer: ' + sndName(v)) + '</option>').join('') + '</optgroup>';
  return '<div class="trtop">' + soundPill() + '<button type="button" class="btn red tmake" data-tmake="1">Make this my build &rarr;</button></div>' +
    '<p class="h">Preset</p><div class="hrow simr" role="group" aria-label="Preset">' + TRYP().map((p) => '<button type="button" data-tpre="' + p.id + '" aria-pressed="' + (p.id === pr.id) + '">' + esc(p.name) + '</button>').join('') + '</div><p class="note keep" style="margin:0 0 8px">' + esc(pr.line) + '</p>' +
    '<p class="h">Sound pack for every pad</p><div class="hrow simr" role="group" aria-label="Sound pack">' + Object.keys(PACKS()).map((p) => '<button type="button" data-tpack="' + p + '">' + esc(PACKS()[p].name) + '</button>').join('') + '<button type="button" data-tup="all">Upload .wav / .mp3</button></div>' +
    '<p class="h">Pads: what each one does</p><div class="tlist">' + T.pads.map((id, i) => '<label class="tsel"><b>' + (i + 1) + '</b><select data-tps="' + i + '" aria-label="Pad ' + (i + 1) + '">' + opts(id) + '</select><button type="button" data-tup="' + i + '" aria-label="Upload a sound for pad ' + (i + 1) + '">&#x2191;</button></label>').join('') + '</div>' +
    '<p class="h" style="margin-top:8px">Knobs</p><div class="tlist">' + T.knobs.map((k, i) => '<label class="tsel"><b>K' + (i + 1) + '</b><select data-tks="' + i + '" aria-label="Knob ' + (i + 1) + '">' + (CZ.KNOB_FNS || []).map(([v, n]) => '<option value="' + v + '"' + (v === k ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select></label>').join('') + '</div>' +
    '<p class="note keep">Uploaded files stay on this phone and play only here. The real build plays them from the Pico as .wav files.</p><input type="file" id="tryFile" accept=".wav,.mp3,audio/wav,audio/mpeg,audio/*" multiple hidden>'; }
function tryUpload(files, at) { const c = auCtx(); if (!c || !files.length) return; const T = TRY(); let i = at === 'all' ? 0 : +at;
  Array.from(files).slice(0, at === 'all' ? T.pads.length : 1).forEach((f, j) => { const pad = i + j, key = String(Date.now()) + j; f.arrayBuffer().then((ab) => new Promise((ok, no) => c.decodeAudioData(ab, ok, no))).then((buf) => { AU.user[key] = buf; (AU.userName = AU.userName || {})[key] = f.name.replace(/\.[^.]+$/, '').slice(0, 18); T.pads[pad] = 'user:' + key; save(); render(); tag('Pad ' + (pad + 1) + ': ' + f.name); }).catch(() => tag('That file could not be played. Try a .wav or .mp3')); }); }
// ---------- PLAY: live simulations of the open-source body presets (no links here: those live in Build, Guide & Code) ----------
const simKind = () => { const r = recipe(); return (r && r.play) || ''; };
const SIM = { k: '', st: {}, live: false, tp: 0 };
const SIMSZ = { deskbot: [128, 64], scanner: [128, 64], retrocam: [128, 64], gamepad: [256, 128], cyd: [320, 240], arcade: [320, 240] };
const CYDT = [['Lights', '#ff4d4d'], ['Music', '#4dd36b'], ['Fan', '#4d8dff'], ['Timer', '#ff4d4d'], ['Scene', '#4dd36b'], ['Wi-Fi', '#4d8dff']];
function simTone(f, d, type, at) { const c = auUnlock(); if (!c || !AU.on || !AU.out) return; const t = c.currentTime + (at || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'square'; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(AU.out); o.start(t); o.stop(t + d + 0.02); }
function simInit(k) { if (k === 'scanner') return { ang: 0, dir: 1, mm: 400, run: true, pts: [], log: [], last: -1 };
  if (k === 'gamepad') return { s: [{ x: 0, y: 0 }, { x: 0, y: 0 }], drag: -1, keys: {} };
  if (k === 'cyd') return { on: [false, false, false, false, false, false], led: '', msg: 'Tap a tile' };
  if (k === 'arcade') return { x: 152, y: 112, cx: 60, cy: 60, keys: {}, score: 0, walk: 0 };
  return { wake: 0, shots: 0, flash: 0, wig: false }; }
const simDpad = (extra) => '<div class="simpad" style="display:grid;grid-template-columns:repeat(3,44px);grid-template-rows:repeat(3,40px);gap:4px">' + [['u', '&uarr;', 2, 1], ['l', '&larr;', 1, 2], ['r', '&rarr;', 3, 2], ['d', '&darr;', 2, 3]].map(([k, l, c, rw]) => '<button type="button" class="btn" data-sim="' + k + '" aria-label="D-pad ' + k + '" style="grid-column:' + c + ';grid-row:' + rw + ';padding:0">' + l + '</button>').join('') + '</div>' +
  '<div style="display:grid;grid-template-columns:repeat(' + (extra.length > 4 ? 3 : 2) + ',52px);gap:6px">' + extra.map((b) => '<button type="button" class="btn" data-sim="' + b + '" style="padding:8px 0">' + b + '</button>').join('') + '</div>';
function simCtl(k) {
  if (k === 'deskbot') return '<button type="button" class="btn red" data-sim="wake" style="width:100%">Wake button</button>';
  if (k === 'scanner') return '<label class="tknob"><span>Distance <output>400</output> mm</span><input type="range" min="30" max="1200" step="10" value="400" data-simr="mm" aria-label="Distance in mm"></label><button type="button" class="btn" data-sim="scan" style="width:100%">Button: pause the scan</button>';
  if (k === 'retrocam') return '<div class="grid g2"><button type="button" class="btn red" data-sim="shutter">Shutter</button><button type="button" class="btn" data-sim="wiggle" aria-pressed="false">Wiggle mode (SG90)</button></div>';
  if (k === 'gamepad') return '<p class="note keep" style="margin:0 0 6px">Drag the two sticks on the screen.</p><div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">' + simDpad(['1', '2', '3', '4', '5', '6']) + '</div>';
  if (k === 'cyd') return '<p class="note keep" style="margin:0;display:flex;align-items:center;gap:8px"><span class="simled" style="width:16px;height:16px;border-radius:50%;background:#333;border:2px solid #888;flex:none"></span>RGB LED (GPIO 4, 16, 17). Tap the tiles on the screen.</p>';
  if (k === 'arcade') return '<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center">' + simDpad(['A', 'B', 'X', 'Y']) + '</div>';
  return ''; }
function simLight(a) { let C = S.items.filter((i) => PP(i) && ['press', 'turn'].indexOf(PP(i).cat) > -1); if (!C.length) C = S.items.filter((i) => PP(i) && (PP(i).cat === 'screen' || PP(i).isScreen || i.type === 'cyd')); const pad = C.find((i) => PP(i).printed === 'dpad' || i.type === 'dpad'), id = 'udlr'.indexOf(a) > -1 && a.length === 1 && pad ? pad.id : (C.filter((i) => i !== pad)[Math.max(0, 'ABXY123456'.indexOf(a)) % Math.max(1, C.length - (pad ? 1 : 0))] || pad || C[0] || {}).id;
  auHot(); if (id == null) return; HL = id; PRESS[id + ':null'] = { id, sub: null, t0: performance.now() }; if (!PRAF) PRAF = requestAnimationFrame(pressTick); if (T3) { blueSel(T3); T3.draw(); } }
function simAct(a, down, b) { const st = SIM.st, k = SIM.k, now = performance.now() / 1000; if (down) simLight(a);
  if (k === 'arcade' && down && 'udlr'.indexOf(a) > -1 && a.length === 1) { const q = 8; st.x = Math.max(0, Math.min(304, st.x + (a === 'r' ? q : a === 'l' ? -q : 0))); st.y = Math.max(0, Math.min(224, st.y + (a === 'd' ? q : a === 'u' ? -q : 0))); } /* each tap moves the sprite at once; holding keeps it walking */
  if (k === 'deskbot' && a === 'wake' && down) { st.wake = now; simTone(880, 0.25, 'sine'); simTone(1318.5, 0.4, 'sine', 0.16); }
  else if (k === 'scanner' && a === 'scan' && down) { st.run = !st.run; if (b) b.textContent = st.run ? 'Button: pause the scan' : 'Button: start the scan'; }
  else if (k === 'retrocam' && down) { if (a === 'shutter') { st.shots++; st.flash = now; simTone(2400, 0.03, 'square'); simTone(700, 0.05, 'square', 0.04); } else if (a === 'wiggle') { st.wig = !st.wig; if (b) b.setAttribute('aria-pressed', String(st.wig)); } }
  else if (k === 'gamepad' || k === 'arcade') { st.keys[a] = down; if (b) b.classList.toggle('hit', down);
    if (down && k === 'gamepad') simTone(1200, 0.02, 'square');
    if (down && k === 'arcade' && 'ABXY'.indexOf(a) > -1) simTone({ A: 523, B: 659, X: 784, Y: 1047 }[a], 0.08, 'square'); } }
function simPointer(e, type, cv) { const k = SIM.k, st = SIM.st, [W, H] = SIMSZ[k], b = cv.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * W, y = ((e.clientY - b.top) / b.height) * H;
  if (k === 'gamepad') { if (type === 'down') st.drag = x < W / 2 ? 0 : 1; if (type === 'up') { if (st.drag > -1) st.s[st.drag] = { x: 0, y: 0 }; st.drag = -1; return; }
    if (st.drag < 0) return; const cx = st.drag ? 216 : 40, dx = (x - cx) / 30, dy = (y - 64) / 30, m = Math.max(1, Math.hypot(dx, dy)); st.s[st.drag] = { x: dx / m, y: dy / m }; return; }
  if (k === 'cyd' && type === 'down' && y > 36) { const i = Math.min(2, Math.floor((x - 4) / 104)) + (y > 134 ? 3 : 0); if (i < 0) return; st.on[i] = !st.on[i]; st.led = st.on[i] ? CYDT[i][1] : (st.on.some(Boolean) ? CYDT[st.on.lastIndexOf(true)][1] : ''); st.msg = 'Touch x=' + Math.round(x) + ' y=' + Math.round(y) + ': ' + CYDT[i][0] + (st.on[i] ? ' ON' : ' OFF'); simTone(st.on[i] ? 1046 : 523, 0.05, 'square'); } }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function simDraw(g, W, H, t, dt) { const k = SIM.k, st = SIM.st; let out = '';
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.fillStyle = '#e8f6ff'; g.strokeStyle = '#e8f6ff'; g.font = '8px monospace'; g.textBaseline = 'top';
  const rr = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, Math.min(r, h / 2)); else g.rect(x, y, w, h); g.fill(); };
  if (k === 'deskbot') { const p = t - st.wake, aw = st.wake && p < 4, ang = aw ? Math.round(90 + 90 * Math.sin(Math.min(p, 3) / 3 * Math.PI * 2)) : 90, look = aw ? Math.sin(p * 3) * 8 : 0, h = aw ? (Math.sin(t * 2.3) > 0.97 ? 3 : 26) : 4;
    [24, 76].forEach((x) => rr(x + look, 32 - h / 2, 28, h, 6)); if (!aw) g.fillText('z z z', 96, 6);
    out = (aw ? 'Awake: eyes open, chime played' : 'Asleep: press the wake button') + '\nServo (SG90) ' + String(ang).padStart(3) + '° ' + '#'.repeat(Math.round(ang / 12)).padEnd(15, '.') + '\nMic (INMP441): ' + (aw ? 'listening' : 'idle'); }
  else if (k === 'scanner') { if (st.run) { st.ang += st.dir * 60 * dt; if (st.ang >= 180) { st.ang = 180; st.dir = -1; } if (st.ang <= 0) { st.ang = 0; st.dir = 1; }
      const a = Math.round(st.ang / 5) * 5; if (a !== st.last) { st.last = a; const mm = Math.max(30, Math.round(st.mm + (Math.random() - 0.5) * 16)); st.pts[a / 5] = mm; st.log.push('(' + a + ', ' + mm + ')'); if (st.log.length > 5) st.log.shift(); } }
    const P = (a, mm) => [64 + Math.cos(a * Math.PI / 180) * Math.min(mm, 1200) / 20, 63 - Math.sin(a * Math.PI / 180) * Math.min(mm, 1200) / 20];
    g.globalAlpha = 0.35; g.beginPath(); g.arc(64, 63, 60, Math.PI, 2 * Math.PI); g.stroke(); g.globalAlpha = 1;
    st.pts.forEach((mm, i) => { if (mm) { const [x, y] = P(i * 5, mm); g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); } });
    const [ex, ey] = P(st.ang, 1200); g.beginPath(); g.moveTo(64, 63); g.lineTo(ex, ey); g.stroke(); g.fillText(st.mm + 'mm', 0, 0); g.fillText(Math.round(st.ang) + '°', 104, 0);
    out = 'Serial (angle, mm):\n' + st.log.join('\n'); }
  else if (k === 'retrocam') { const off = st.wig ? (Math.floor(t * 4) % 2 ? 5 : -5) : 0, im = g.createImageData(W, H), d = im.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const X = x + off; let l = y < 34 ? 0.85 - y / 60 : 0.35 + 0.25 * Math.sin(X / 9 + t * 0.8) * (y - 34) / 30;
      if (Math.hypot(X - 92, y - 16) < 10) l = 1; if (y > 30 + 6 * Math.sin(X / 14 + t * 0.5) && y < 34 + 6 * Math.sin(X / 14 + t * 0.5)) l = 0.15;
      if (Math.abs(X - 40) < 6 && y > 26 && y < 56) l = 0.05; if (Math.hypot(X - 40, y - 22) < 6) l = 0.1;
      const v = l * 16 > BAYER[(y & 3) * 4 + (x & 3)] ? 255 : 0, i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(im, 0, 0); if (t - st.flash < 0.12) { g.fillRect(0, 0, W, H); } g.fillStyle = '#000'; g.fillRect(0, 0, 50, 9); g.fillStyle = '#fff'; g.fillText('SHOTS ' + st.shots, 1, 1);
    out = 'Viewfinder: 1-bit, 128 x 64\nPhotos: ' + st.shots + (st.wig ? '\nWiggle: servo swings left and right' : ''); }
  else if (k === 'gamepad') { const ax = (v) => Math.round((v + 1) / 2 * 32767), keys = st.keys, u = keys.u, dn = keys.d, l = keys.l, r = keys.r;
    st.s.forEach((s, i) => { const cx = i ? 216 : 40; g.globalAlpha = 0.4; g.beginPath(); g.arc(cx, 64, 32, 0, 7); g.stroke(); g.globalAlpha = 1; g.beginPath(); g.arc(cx + s.x * 24, 64 + s.y * 24, 12, 0, 7); g.fill(); });
    [['u', 98, 42], ['d', 98, 74], ['l', 82, 58], ['r', 114, 58]].forEach(([kk, x, y]) => { g.globalAlpha = keys[kk] ? 1 : 0.3; g.fillRect(x, y, 14, 14); });
    ['1', '2', '3', '4', '5', '6'].forEach((kk, i) => { g.globalAlpha = keys[kk] ? 1 : 0.3; g.beginPath(); g.arc(146 + (i % 3) * 14, 52 + Math.floor(i / 3) * 22, 6, 0, 7); g.fill(); }); g.globalAlpha = 1;
    const hat = (u ? 'UP' : dn ? 'DOWN' : '') + (l ? (u || dn ? '_' : '') + 'LEFT' : r ? (u || dn ? '_' : '') + 'RIGHT' : '') || 'CENTERED', pr = ['1', '2', '3', '4', '5', '6'].filter((kk) => keys[kk]);
    out = 'BLE: connected as "Case Zero Pad"\nLeft  X ' + String(ax(st.s[0].x)).padStart(5) + '  Y ' + String(ax(st.s[0].y)).padStart(5) + '\nRight Z ' + String(ax(st.s[1].x)).padStart(5) + '  RZ ' + String(ax(st.s[1].y)).padStart(5) + '\nHat ' + hat + '  Buttons: ' + (pr.join(' ') || 'none'); }
  else if (k === 'cyd') { g.fillStyle = '#fff'; g.font = 'bold 18px sans-serif'; g.fillText('CYD Touch Deck', 8, 8);
    CYDT.forEach(([n, c], i) => { const x = 8 + (i % 3) * 104, y = 40 + Math.floor(i / 3) * 96; g.fillStyle = st.on[i] ? c : '#3a3a3a'; rr(x, y, 96, 88, 10); g.fillStyle = st.on[i] ? '#000' : '#ddd'; g.font = 'bold 16px sans-serif'; g.textAlign = 'center'; g.fillText(n, x + 48, y + 30); g.font = '12px sans-serif'; g.fillText(st.on[i] ? 'ON' : 'OFF', x + 48, y + 54); g.textAlign = 'left'; });
    out = st.msg + '\nRGB LED: ' + (st.led ? { '#ff4d4d': 'red', '#4dd36b': 'green', '#4d8dff': 'blue' }[st.led] : 'off'); }
  else if (k === 'arcade') { const kk = st.keys, sp = 90 * dt, ox = st.x, oy = st.y; st.x = Math.max(0, Math.min(304, st.x + ((kk.r ? 1 : 0) - (kk.l ? 1 : 0)) * sp)); st.y = Math.max(0, Math.min(224, st.y + ((kk.d ? 1 : 0) - (kk.u ? 1 : 0)) * sp));
    st.walk += Math.hypot(st.x - ox, st.y - oy); if (st.walk > 16) { st.walk = 0; simTone(220, 0.03, 'square'); }
    if (Math.abs(st.x + 8 - st.cx) < 14 && Math.abs(st.y + 8 - st.cy) < 14) { st.score++; st.cx = 20 + Math.random() * 280; st.cy = 20 + Math.random() * 200; simTone(660, 0.06); simTone(880, 0.06, 'square', 0.06); simTone(1320, 0.1, 'square', 0.12); }
    g.fillStyle = '#1b1f2a'; g.fillRect(0, 0, W, H); g.fillStyle = '#262c3b'; for (let x = 0; x < W; x += 16) g.fillRect(x, 0, 1, H); for (let y = 0; y < H; y += 16) g.fillRect(0, y, W, 1);
    g.fillStyle = '#4ad66d'; g.beginPath(); g.arc(st.cx, st.cy, 6, 0, 7); g.fill(); g.fillStyle = '#ffd23f'; g.fillRect(Math.round(st.x), Math.round(st.y), 16, 16); g.fillStyle = '#1b1f2a'; g.fillRect(Math.round(st.x) + 4, Math.round(st.y) + 4, 3, 3); g.fillRect(Math.round(st.x) + 10, Math.round(st.y) + 4, 3, 3);
    g.fillStyle = '#fff'; g.font = 'bold 14px monospace'; g.fillText('SCORE ' + st.score, 8, 6);
    out = 'Sprite x ' + Math.round(st.x) + ', y ' + Math.round(st.y) + '\nButtons: ' + (['A', 'B', 'X', 'Y'].filter((b) => kk[b]).join(' ') || 'none'); }
  return out; }
function simStage(el) { const k = simKind(); if (!k) return; const [W, H] = SIMSZ[k];
  if (el.dataset.sim !== k || !el.querySelector('canvas.simc')) { SIM.k = k; SIM.st = simInit(k); el.dataset.sim = k;
    el.innerHTML = '<div class="tdev sim"><canvas class="simc" width="' + W + '" height="' + H + '" style="width:100%;max-width:' + Math.max(W, 320) + 'px;aspect-ratio:' + W + '/' + H + ';image-rendering:pixelated;background:#000;border-radius:6px;display:block;margin:0 auto;touch-action:none" aria-label="' + esc(recipe().name) + ' preview"></canvas>' +
      '<pre class="simread" style="color:#e8f6ff;font:12px/1.35 ui-monospace,monospace;margin:6px 0;white-space:pre-wrap;min-height:4em"></pre><div class="simctl">' + simCtl(k) + '</div></div>';
    const cv = el.querySelector('canvas');
    el.querySelectorAll('[data-sim]').forEach((b) => { b.addEventListener('pointerdown', (e) => { e.preventDefault(); auUnlock(); simAct(b.dataset.sim, true, b); }); ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => b.addEventListener(ev, () => { if (b.classList.contains('hit')) simAct(b.dataset.sim, false, b); })); });
    el.querySelectorAll('input[data-simr]').forEach((i) => i.addEventListener('input', () => { SIM.st[i.dataset.simr] = +i.value; const o = i.parentNode.querySelector('output'); if (o) o.textContent = i.value; }));
    cv.addEventListener('pointerdown', (e) => { auUnlock(); simLight('touch'); try { cv.setPointerCapture(e.pointerId); } catch (x) {} simPointer(e, 'down', cv); });
    cv.addEventListener('pointermove', (e) => simPointer(e, 'move', cv)); ['pointerup', 'pointercancel'].forEach((ev) => cv.addEventListener(ev, (e) => simPointer(e, 'up', cv))); }
  if (SIM.live) return; SIM.live = true; SIM.tp = 0;
  const loop = (ms) => { const cv = el.querySelector('canvas.simc'); if (el.hidden || !cv || SIM.k !== simKind()) { SIM.live = false; return; }
    const t = ms / 1000, dt = SIM.tp ? Math.min(0.1, t - SIM.tp) : 0; SIM.tp = t; const txt = simDraw(cv.getContext('2d'), W, H, t, dt), rd = el.querySelector('.simread'); if (rd && rd.textContent !== txt) rd.textContent = txt; if (SIM.k === 'deskbot') headPaint(cv);
    const led = el.querySelector('.simled'); if (led) led.style.background = SIM.st.led || '#333'; requestAnimationFrame(loop); };
  requestAnimationFrame(loop); }
function simPane() { const r = recipe();
  return '<div class="trtop">' + soundPill() + '</div><p class="h">Live preview: ' + esc(r.name) + '</p><p class="note keep" style="margin:0 0 8px">' + esc(r.line) + '</p><p class="note keep">The real code and its open-source links are in Build, Guide &amp; Code.</p>'; }
// Make this my build: the parts, a body that fits them, the pins on their own. No pin picking.
function tryMake() { const T = TRY(), pr = tPreset(), btns = T.pads.length, wheel = pr.knob === 'encoder';
  backup(); wipeAll(); S.items = []; S.pins = {}; S.have = {}; sel = null; LAST = null; UNDO.length = 0; S.recipe = null; S.beh = pr.fn; S.picked = true; S.started = true; S.pcb = false; S.wired = {};
  S.style = pr.style; const z = SIZES[pr.style] || [6, 4]; S.cols = z[0]; S.rows = z[1]; S.xw = S.xd = 0; S.add = 0; S.attachedParts = []; S.ports = []; MPC = {};
  const mk = (t, n) => { for (let k = 0; k < n; k++) if (CZ.PARTS[t]) S.items.push({ id: ++uid, type: t, panel: defaultPanel(CZ.PARTS[t]), x: -999, y: -999, r: 0 }); };
  const needAdc = wheel ? 0 : T.knobs.length, brain = needAdc > 3 ? 'esp32' : pr.brain; /* the Pico has 3 analog pins: more knobs, a brain with more */
  mk(brain, 1); mk(pr.pad, btns); mk(wheel ? 'encoder' : 'pot', T.knobs.length); if (pr.screen) mk('oled096', 1); if (pr.speaker || T.pads.some((id) => !/^(mac|tm):/.test(id))) mk('speaker28', 1);
  fitAll(); keepInside(); edgeLock(); if (S.beh === 'timer') TW().min = kv('minutes');
  actsFill(true); const B = S.items.filter((i) => i.type === pr.pad), K = S.items.filter((i) => i.type === 'pot' || i.type === 'encoder');
  B.forEach((it, i) => { const id = T.pads[i] || ''; if (/^fx:/.test(id)) it.action = id.slice(3); else if (/^mac:/.test(id)) it.action = 'macro'; else if (pr.fn === 'synth') it.action = 'note'; });
  K.forEach((it, i) => { const k = T.knobs[i]; if (k === 'beat' || k === 'wet') it.action = k; });
  djStop(); tryTimerStop(); save(); S.tab[0] = 'parts'; go(0); tag('Your ' + pr.name + ': ' + S.items.length + ' parts, a ' + S.cols * 20 + ' x ' + S.rows * 20 + ' mm body, every pin picked for you. See Brain, Wire it.'); }
function tryWire() { const el = $('tryv'); if (!el || el.dataset.on) return; el.dataset.on = '1';
  el.addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-tpad]'); if (!b) return; e.preventDefault(); const i = +b.dataset.tpad; if (TRY().sel !== i) { TRY().sel = i; el.querySelectorAll('.tpad.sel').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); } tryPad(i, true); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => el.addEventListener(ev, (e) => { const b = e.target.closest && e.target.closest('[data-tpad]'); if (b) tryPad(+b.dataset.tpad, false); }));
  el.addEventListener('input', (e) => { const r = e.target.closest('[data-tknob]'); if (!r) return; const k = r.dataset.tknob, v = +r.value, o = r.parentNode.querySelector('output'); if (o) o.textContent = k === 'beat' ? BEATS[v] : v; tryKnob(k, v); }); }
$('rlay').addEventListener('click', (e) => { e.stopPropagation(); resetLayout(); });
// a read-only check of the build as it stands: parts that overlap or hang off the edge, pin clashes, the brain's wall port, and whether starter code comes out
CZ.audit = () => { const w = wiring(), br = S.items.find((i) => PP(i) && PP(i).cat === 'brain'); let code = '', err = '', pf = [];
  try { pf = preflight(w, BRDX()); } catch (e) { pf = ['preflight: ' + e.message]; }
  try { code = codeFor(w, summaryLine(), recipeFn(), BRDX(), TW()).text || ''; } catch (e) { err = e.message; }
  return { recipe: S.recipe, style: S.style, items: S.items.map((i) => i.type), probs: allProblems().map((x) => label(x.it) + ': ' + x.list.join(', ')), pins: w.problems, preflight: pf, brain: br ? br.type : null, battery: hasBattery(), autoPorts: autoPorts().map((q) => q.kind + '@' + q.face).concat(S.ports.filter((p) => p.auto === 'usb' && !portBlocked(p)).map((p) => p.kind + '@' + p.face)), notes: copilot().map((c) => c.id + ': ' + c.title), legacyPort: !!(br && !hasBattery() && !autoPorts().length), ports: S.ports.map((p) => p.kind + '@' + p.face + (portBlocked(p) ? '!' + portBlocked(p) : '')), code: code.length, codeErr: err }; };
$('pane').addEventListener('click', (e) => { const p = e.target.closest('[data-spre]'); if (p) { showRecipe(p.dataset.spre); $('sheet').hidden = false; } });
$('pane').addEventListener('click', (e) => { const b = e.target.closest('[data-snd],[data-tpre],[data-tpack],[data-tup],[data-tmake]'); if (!b) return; const d = b.dataset;
  if (d.snd != null) { auSet(d.snd === '1'); if (!AU.on) djStop(); else if (playSim()) djSync(TRYS.dj); render(); return; }
  if (d.tpre) { trySetPreset(d.tpre); save(); render(); return; }
  if (d.tpack) { const T = TRY(), P = PACKS()[d.tpack]; T.pads = T.pads.map((id, i) => sid(d.tpack, P.sounds[i % P.sounds.length][0])); save(); render(); tag(P.name + ' on every pad'); return; }
  if (d.tup != null) { const f = $('tryFile'); if (f) { f.dataset.at = d.tup; f.onchange = () => { tryUpload(f.files, f.dataset.at); f.value = ''; }; f.click(); } return; }
  if (d.tmake) { tryMake(); } });
$('pane').addEventListener('change', (e) => { const s = e.target.closest('[data-tps],[data-tks]'); if (!s) return; const T = TRY();
  if (s.dataset.tps != null) { T.pads[+s.dataset.tps] = s.value; T.sel = +s.dataset.tps; } else { T.knobs[+s.dataset.tks] = s.value; if (T.kv[s.value] == null) T.kv[s.value] = KDEF[s.value]; } save(); render(); });

window.__cz = { AU, TRY, tryMake, trySetPreset, auPlay, djSync, openPage, boardBuild, bomCpl, actOf, get HL() { return HL; }, PAGES, decoMove, mountPart, TEST, testModel, wiring, wallArt, LG, hookPolys, addBoard, packBuild, unpackBuild, shareState, portBlocked, portAt, mountBlocked, swatchFile, loadRecipe, get DECO() { return DECO; }, get T3() { return T3; }, THREE, wiring, codeFor, get S() { return S; }, get view() { return view; }, AZ, get UNDO() { return UNDO.length; }, halves, plan, makeFiles, get FILES() { return FILES; }, allProblems, G, addPart, go, render, dims, heights, addonFile, addonPolys, charParts, charCache, kb, kbBoard, kbCode, kbReadme, boardSvg, wiring, PP, gcodeFiles, gcodePieces, mountGeos, xp, sliceGuide, skeletonOf, skelOf, adjust, posts, estimate, reflow, fitAll, filesOf, MEASURED, portBlocked, testAct, testModel, micMain, get TRAY() { return TRAY; }, showStart, loadRecipe, cost, boardBuild, boardFiles, boardReadme, extraRows, keepBox };
render();
try { if (S.items.length) { keepInside(); save(); } } catch (e) {} /* a saved build from an older builder: nothing left floating outside */
{ const q = new URLSearchParams(location.search), code = q.get('build'), rid = q.get('recipe'), r = rid && (CZ.RECIPES || []).find((x) => x.id === rid), clean = () => { try { history.replaceState(null, '', location.pathname); } catch (e) {} };
  if (code) { /* a build link: it becomes the saved build (the one that was here goes to Bring back), no start sheet */
    unpackBuild(code).then((o) => { if (!o || !Array.isArray(o.items)) throw new Error('bad'); backup(); o.started = true; localStorage.setItem(KEY, JSON.stringify(Object.assign(JSON.parse(S_DEF), o))); clean(); MPC = {}; resync(); keepInside(); save(); render(); tag('Build loaded from the link'); $('sheetIn').innerHTML = '<h2>A build from a link</h2><div class="list"><button class="btn start" data-door="close"><b>Use this build</b>Everything as it was made.</button><button class="btn start" data-act="keepbox"><b>Keep Box, Swap Insides</b>Keep its box, size, hinge and mounts. Clear the electronics and design new insides for it.</button></div>'; $('sheet').hidden = false; })
      .catch(() => { clean(); tag('That build link could not be read'); if (!S.started && !S.items.length) showStart(); });
  } else if (r) { clean(); if (S.items.length) { $('sheetIn').innerHTML = '<h2>Start the ' + esc(r.name) + '?</h2><p class="note" style="font-size:14px">This replaces the ' + S.items.length + ' electronics in the build you have now. It is kept, so Bring back can return it.</p><div class="list" style="margin-top:10px"><button class="btn start" data-rok="' + r.id + '"><b>Start the ' + esc(r.name) + '</b>' + esc(r.line) + '</button><button class="btn start" data-door="close"><b>Keep my build</b>Go back to what I was making.</button></div>'; $('sheet').hidden = false; } else loadRecipe(r.id); }
  else if (!S.started && !S.items.length) showStart(); }
// arriving from the Case Zero page: /casezero/build/?room=brain opens that room
{ const rq = new URLSearchParams(location.search).get('room'); if (rq && (ROOMOF[rq] || ROOMS.some((r) => r[0] === rq)) && PAGES[S.page || 0].room !== (ROOMOF[rq] || rq)) goRoom(rq); }
