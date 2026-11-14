// Case Zero Builder v8. Start (3 doors + recipes), Body, Style, Brain, Arrange, Print, Files (with Shopping).
// Brain: pick parts (or snap a photo of yours first). Arrange: place them on the lid and base. Body: shape, size, hinge, measure.
// Print: your printer and bed, material, how it joins, where the puzzle seams go. Files: STL per piece, wood templates, wiring.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import * as G from './geo.js?v=19';
import { openMeasure, GROUPS } from './capture.js?v=20';
import { makeBoard, boardFiles, boardSvg, zip as zipFiles } from './board.js?v=1';
import { planWiring, codeFor, PICO_LEFT, PICO_RIGHT, PICO_PINS, PICO_BRAINS, NEED } from './wiring.js?v=19';

const CZ = window.CZ, R = G.RULE, $ = (id) => document.getElementById(id);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
if (window.self !== window.top) document.documentElement.classList.add('embedded');

// ---------- state ----------
const KEY = 'nociv-casezero-v7', SIZES = { clam: [9, 6], small: [5, 7], slate: [6, 4], calc: [5, 9], hand: [5, 8], pad: [10, 5], groove: [10, 5], face: [7, 7], panel: [15, 9], deck: [14, 10] };
let S = { step: 2, tab: {}, cat: 'brain', items: [], mine: {}, style: 'clam', cols: 9, rows: 6, add: 0, hinge: 'printed', hside: 'back', magnets: true,
  printer: 'a1', bed: [256, 256], material: 'pla', join: 'dovetail', sdir: 'auto', sn: 'auto', tab3: 'dovetail', open: true, snap: false, spring: false,
  walls: 'normal', layer: 'normal', brand: null, look: null,
  pw: 300, pd: 190, pt: 3, prad: 3, pholes: true, phold: null, plift: 0, notches: [], nsel: 0, started: false, recipe: null, have: {}, picked: false }; // Panel: real size in mm, thickness, corners, corner screw holes, wire notches
const LOOK0 = () => ({ logo: { on: false, src: 'text', text: 'NOCIV', face: 'lidout', x: null, y: null, size: 40, how: 'dip' }, labels: { on: false, place: 'below', size: 4, how: 'dip', text: {} }, tex: { top: { kind: 'none', sp: 6, bump: false }, bottom: { kind: 'none', sp: 6, bump: false }, walls: { kind: 'none', sp: 6 }, lidout: { kind: 'none', sp: 6, bump: false }, lidin: { kind: 'none', sp: 6, bump: false } }, texFace: 'top', colors: 1, c1: '#e9e2cc', c2: '#1a1a1a', single: 'paint' });
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s && Array.isArray(s.items)) S = Object.assign(S, s); } catch (e) {}
if (!S.look) S.look = LOOK0();
if (!S.have) S.have = {};
if (!S.phold) S.phold = S.pholes === false ? 'drop' : 'screws';
// Walls: Normal 2.4 mm sides and 2.0 mm floor, Thick 3.2 and 2.8. The deck stays 2.4 mm so buttons still reach through it.
function applyWalls() { R.T = S.walls === 'tough' ? 3.2 : 2.4; R.F = S.walls === 'tough' ? 2.8 : 2.0; }
applyWalls();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
let LOGOIMG = null; try { const li = localStorage.getItem(KEY + ':logo'); if (li) { LOGOIMG = new Image(); LOGOIMG.onload = () => { markCache = {}; draw(); }; LOGOIMG.src = li; } } catch (e) {}
const AZ = { z: 1, px: 0, py: 0 }; let PEND = null; /* Arrange zoom, and the spot waiting for "What is here?" */
let uid = S.items.reduce((m, p) => Math.max(m, p.id || 0), 0), sel = null, PHOTO = null;
try { const ph = localStorage.getItem(KEY + ':photo'); if (ph) { PHOTO = new Image(); PHOTO.src = ph; PHOTO.onload = () => draw(); } } catch (e) {}
const PARTS = () => Object.assign({}, CZ.PARTS, S.mine);
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
function dims() { if (isPanel()) return { W: S.pw - 1, D: S.pd - 1 }; const W = S.cols * 20 + 2 * (R.T + R.CLR + 1), D = S.rows * 20 + 2 * (R.T + R.CLR + 1); return { W, D }; }
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
function posts() { const d = dims(); if (isPanel()) { const k = S.plift > 0 && S.pbase !== 'rim' ? 8.5 : 6.5; /* half mm: never in line with a notch edge (whole mm), which breaks the mesh */ return S.phold === 'screws' ? [[k, k], [d.W - k, k], [d.W - k, d.D - k], [k, d.D - k]] : []; } return G.postSpots(outline(), d.W * d.D > 30000 ? 6 : 4); }
function itemsOn(panel) { return S.items.filter((i) => i.panel === panel); }
function depthOf(panel) { return itemsOn(panel).filter((i) => i.of == null).reduce((m, i) => Math.max(m, PP(i) ? PP(i).depth : 0), 0); } /* parts on a board: the board sets the depth */
function upOf(panel) { return itemsOn(panel).reduce((m, i) => Math.max(m, PP(i) ? (PP(i).up || 0) : 0), 0); }
function heights() {
  if (isPanel()) return { H: S.pt + (S.plift || 0), Hl: 0, recess: 0, recessL: 0 };
  // base: floor + deepest part or brain + deck, plus room for caps when the lid closes
  const home = homePanel(), inside = S.items.filter((i) => i.panel === 'inside' && i.of == null).reduce((m, i) => Math.max(m, 5 + (PP(i) ? PP(i).depth : 0)), 0);
  const recess = isClam() ? Math.ceil(upOf(home) + 1) : 0, pcb = pcbOn(); /* with the carrier board: it lies on 5 mm posts and is 1.6 mm thick, so the brain rides 1.6 higher and every part on top has to clear the board */
  const H = Math.max(isClam() ? 18 : 20, Math.ceil(R.F + Math.max(depthOf(home) + (pcb ? 6.6 : 0), inside + (pcb ? 1.6 : 0)) + 3 + R.LT + recess)) + S.add;
  const Hl = isClam() ? Math.max(12, Math.ceil(R.F + depthOf('lid') + 2 + R.LT + Math.ceil(upOf('lid')))) : 0;
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
  const fam = (a) => (a.of != null ? a.of : a.id); /* a board and the parts on it are one family: the photo already proved they fit together */
  S.items.forEach((q) => {
    if (q === it || !PP(q)) return;
    if ((it.of != null || q.of != null || PP(it).board || PP(q).board) && fam(it) === fam(q)) return;
    if (PP(it).board || PP(q).board) return; /* the board hangs under the top: only its own parts come through */
    const g = fp(q), hit = f.x0 < g.x1 - 0.1 && f.x1 > g.x0 + 0.1 && f.y0 < g.y1 - 0.1 && f.y1 > g.y0 + 0.1; if (!hit) return;
    if (q.panel === it.panel) out.push('on top of ' + label(q));
    else if ((it.panel === 'inside' && q.panel === homePanel()) || (q.panel === 'inside' && it.panel === homePanel())) {
      const deck = it.panel === 'inside' ? q : it, brain = it.panel === 'inside' ? it : q, h = heights();
      const bottom = h.H - R.LT - h.recess - PP(deck).depth;
      if (bottom < R.F + 5 + PP(brain).depth + (pcbOn() ? 1.6 : 0)) out.push(it === deck ? 'too deep, it hits ' + label(brain) : 'under ' + label(deck) + ', not enough room');
    }
  });
  return out;
}
const allProblems = () => S.items.map((it) => ({ it, list: problems(it) })).filter((x) => x.list.length);
function numbers() { const m = {}; ['lid', 'base', 'top', 'inside'].forEach((p) => { itemsOn(p).slice().sort((a, b) => (b.y - a.y) || (a.x - b.x)).forEach((it, i) => { m[it.id] = PLET[p] + (i + 1); }); }); return m; }
function label(it) { const n = numbers()[it.id]; return (n ? n + ' ' : '') + (PP(it) ? PP(it).short : ''); }
function autoPlace(it) {
  const P = PP(it), d = dims(), tries = [0, 1];
  for (let ry = 0; ry < 2; ry++) for (const r of tries) {
    it.r = r; const f = G.footprint(P, 0, 0, r);
    for (let y = d.D - f.h / 2 - 4; y >= f.h / 2 + 4; y -= 5) for (let x = f.w / 2 + 4; x <= d.W - f.w / 2 - 4; x += 5) { it.x = x; it.y = y; if (!problems(it).length) return true; }
  }
  it.r = 0; it.x = d.W / 2; it.y = d.D / 2; return false;
}
function defaultPanel(P) { if (P.inside) return 'inside'; if (isClam() && P.screen) return 'lid'; return homePanel(); }
let LAST = null; // the part just added: the 3D box shows it in yellow
function addPart(type) { const P = PARTS()[type]; const it = { id: ++uid, type, panel: defaultPanel(P), x: 0, y: 0, r: 0 }; S.items.push(it); autoPlace(it); LAST = it.id; save(); return it; }
function removePart(type) { for (let i = S.items.length - 1; i >= 0; i--) if (S.items[i].type === type) { S.items.splice(i, 1); break; } save(); }
function reflow() { // style or size changed: move parts onto the panels this shape has, re-place anything that no longer fits
  S.items.forEach((it) => { if (it.panel !== 'inside' && panels().indexOf(it.panel) < 0) it.panel = defaultPanel(PP(it)) === 'inside' ? 'inside' : homePanel(); });
  S.items.forEach((it) => { if (it.of == null && problems(it).length) autoPlace(it); });
  syncAll();
}
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
function logoShape() {
  const L = S.look.logo, key = 'logo:' + L.src + ':' + L.text + ':' + L.size + ':' + (LOGOIMG ? LOGOIMG.src.length : 0);
  if (markCache[key]) return markCache[key];
  let cv = null;
  if (L.src === 'image' && LOGOIMG && LOGOIMG.complete && LOGOIMG.naturalWidth) { cv = document.createElement('canvas'); cv.width = LOGOIMG.naturalWidth; cv.height = LOGOIMG.naturalHeight; cv.getContext('2d').drawImage(LOGOIMG, 0, 0); }
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
  if (lk.logo.on && lk.logo.face === face) { const lp = G.place(logoShape(), lk.logo.x == null ? d.W / 2 : lk.logo.x, lk.logo.y == null ? d.D / 2 : lk.logo.y, 1, 0); if (lp.length) { list.push(Object.assign({ polys: own(face, lp), name: 'logo' }, hw(lk.logo.how))); keep.push(...lp); } }
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
  const d = dims(), lid = panel === 'lid', flip = (it) => ({ P: PP(it), x: lid ? d.W - it.x : it.x, y: lid ? d.D - it.y : it.y, r: ((it.r || 0) + (lid ? 2 : 0)) % 4 });
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
    if (br) port = wallPort(br, onBoard && bp ? Math.max(R.F + 1, (h.H - R.LT - h.recess) - (bp.hang || 6) - 4) : R.F + 3);
    const ch = inside.find((q) => q.P.charger && q.P.usb);
    if (ch) { const p2 = wallPort(ch, R.F + 1.5); if (port) port2 = p2; else port = p2; }
  }
  const hingeOn = isClam() && S.hinge === 'printed', lk = looksFor(panel);
  return G.buildHalf({ style: S.style, W: d.W, D: d.D, H: lid ? h.Hl : h.H, recess: lid ? h.recessL : h.recess, parts, inside, port, port2,
    top: lk.top, bottom: lk.bottom, walls: lk.walls, snap: S.snap,
    magnets: isClam() && S.magnets, hinge: { on: hingeOn, side: S.style === 'small' ? (S.hside === 'right' ? 'right' : 'left') : 'back' }, hingeSet: lid ? 'b' : 'a' });
}
function panelBuilt() {
  // one flat plate: outline with notches, minus every part's hole, the screen screws and the corner screws. Marks pressed into the front.
  const o = outline(), T = S.pt, D = 0.6, cuts = [];
  itemsOn('top').filter((i) => PP(i)).forEach((i) => {
    const P = PP(i), a = (i.r || 0) * Math.PI / 2;
    // on the floor of the box the whole screen comes up through the panel; raised, the panel sits on top and shows only the picture
    if (P.screen && !S.plift) { const w = (i.r % 2 ? P.h : P.w) + 1, h = (i.r % 2 ? P.w : P.h) + 1; cuts.push(G.rrect(i.x - w / 2, i.y - h / 2, i.x + w / 2, i.y + h / 2, 1.5)); } else cuts.push(...G.cutShape(P, i.x, i.y, i.r || 0));
    (P.mountHoles || []).forEach((m) => cuts.push(G.circle(i.x + m.x * Math.cos(a) - m.y * Math.sin(a), i.y + m.x * Math.sin(a) + m.y * Math.cos(a), m.d / 2 + 0.2, 24)));
  });
  posts().forEach(([x, y]) => cuts.push(G.circle(x, y, R.HOLE / 2, 24)));
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
function partSvg(P) {
  const m = Math.max(P.w, P.h) + 6, s = 'width="100%" height="36" viewBox="' + (-m / 2) + ' ' + (-m / 2) + ' ' + m + ' ' + m + '"';
  let g = '';
  if (!P.cut || P.screen || P.inside || P.measured || P.cut.o === 'rect') g += '<rect x="' + (-P.w / 2) + '" y="' + (-P.h / 2) + '" width="' + P.w + '" height="' + P.h + '" rx="1.5" fill="' + (P.screen ? '#22262a' : '#2f7a4b') + '" opacity="' + (P.inside ? .9 : .8) + '"/>';
  const c = P.cut || {};
  if (P.screen) g += c.o === 'circle' ? '<circle r="' + c.d / 2 + '" fill="#8fd3ff"/>' : '<rect x="' + (-c.w / 2) + '" y="' + (-c.h / 2) + '" width="' + c.w + '" height="' + c.h + '" fill="#8fd3ff"/>';
  else if (c.o === 'circle') g += '<circle r="' + c.d / 2 + '" fill="#1a1a1a"/>' + (P.up > 9 ? '<circle r="' + c.d / 2.6 + '" fill="#c8412f"/>' : '');
  else if (c.o === 'cross') g += '<path d="M' + (-c.w / 2) + ' ' + (-c.t / 2) + 'h' + (c.w / 2 - c.t / 2) + 'v' + (-(c.w / 2 - c.t / 2)) + 'h' + c.t + 'v' + (c.w / 2 - c.t / 2) + 'h' + (c.w / 2 - c.t / 2) + 'v' + c.t + 'h' + (-(c.w / 2 - c.t / 2)) + 'v' + (c.w / 2 - c.t / 2) + 'h' + (-c.t) + 'v' + (-(c.w / 2 - c.t / 2)) + 'h' + (-(c.w / 2 - c.t / 2)) + 'z" fill="#1a1a1a"/>';
  else if (c.o === 'slot') g += '<rect x="' + (-P.w / 2) + '" y="-3" width="' + P.w + '" height="6" rx="2" fill="#2f7a4b"/><rect x="' + (-c.w / 2) + '" y="-1.5" width="' + c.w + '" height="3" rx="1.5" fill="#1a1a1a"/><rect x="-3" y="-4" width="6" height="8" fill="#c8412f"/>';
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
function tabsFor(step) {
  if (step === 0) return [['snap', 'Snap', 'snap'], ['parts', 'Parts', 'parts'], ['picks', 'Picks', 'picks'], ['pins', 'Wiring', 'wire']];
  if (step === 1) return panels().map((p) => [p, PNAME[p], p]).concat([[isPanel() ? 'psize' : 'size', 'Size', 'size']]);
  if (step === 2 && isPanel()) return [['shape', 'Shape', 'shape'], ['psize', 'Size', 'size'], ['notch', 'Notches', 'notch'], ['measure', 'Measure', 'measure']];
  if (step === 2) return [['shape', 'Shape', 'shape'], ['fit', 'Fit', 'fit'], ['measure', 'Measure', 'measure']];
  if (step === 3) return [['colors', 'Color', 'colors'], ['tex', 'Texture', 'tex'], ['labels', 'Buttons', 'labels'], ['logo', 'Logo', 'logo']];
  if (step === 4) return [['printer', 'Printer', 'printer'], ['strong', 'Strength', 'strong'], ['mat', 'Material', 'mat'], ['split', 'Split', 'split']];
  return [['3d', '3D', 'cube'], ['shop', 'Shop', 'cart'], ['files', 'Files', 'file'], ['pcb', 'Board', 'brain'], ['extras', 'Extras', 'parts'], ['wire', 'Wire it', 'wire']];
}
function curTab() { const t = tabsFor(S.step), c = S.tab[S.step]; return t.some((x) => x[0] === c) ? c : t[S.step === 0 ? 1 : 0][0]; }
function nudgeRow() { return '<div class="selbar nud"><b>Nudge</b><button data-act="nudge" data-nx="-1" data-ny="0" aria-label="Left">&larr;</button><button data-act="nudge" data-nx="0" data-ny="1" aria-label="Up">&uarr;</button><button data-act="nudge" data-nx="0" data-ny="-1" aria-label="Down">&darr;</button><button data-act="nudge" data-nx="1" data-ny="0" aria-label="Right">&rarr;</button></div>'; }
const RECTK = (it) => { const P = PP(it); return !!(P && (P.cat === 'brain' || P.cat === 'screen' || P.screen || (P.cut && (P.cut.o === 'rect' || P.cut.o === 'slot')))); };
/* undo: the last 40 changes in Arrange */
const UNDO = [];
function snapU() { UNDO.push(JSON.stringify({ items: S.items, b: Object.keys(S.mine || {}).map((k) => [k, S.mine[k].top, S.mine[k].under]) })); if (UNDO.length > 40) UNDO.shift(); zmBar(); }
function undo() { const u = UNDO.pop(); if (!u) return; const o = JSON.parse(u); S.items = o.items; o.b.forEach(([k, t, un]) => { const P = S.mine[k]; if (P && P.board) { P.under = un; setBoardTop(P, t || 9); } }); if (!S.items.some((i) => i.id === sel)) sel = null; syncAll(); save(); render(); }
// ---- Studio shell (11-13). Two rooms, like the Case Zero page: the Body is what holds it, the Brain is what it does.
// One job per page. A page shows only its own tools; everything else stays out of sight until you go there.
// A page is a list of [step, tab] pairs from the old six steps, so every pane, action and saved build keeps working. '*' = every tab of that step.
const PAGES = [
  { room: 'body', name: 'Shape', hint: 'Pick the body and its size', tabs: [[2, '*']] },
  { room: 'body', name: 'Style', hint: 'Color, texture, labels, logo', tabs: [[3, '*']] },
  { room: 'body', name: 'Arrange', hint: 'Drag the parts where you want them', tabs: [[1, '*']] },
  { room: 'body', name: 'Print', hint: 'Fit it to your printer', tabs: [[4, '*']] },
  { room: 'body', name: 'Finish', hint: 'See it in 3D, save the files', tabs: [[5, '3d'], [5, 'files'], [5, 'extras']] },
  { room: 'brain', name: 'Parts', hint: 'Choose what goes inside', tabs: [[0, 'parts'], [0, 'snap'], [0, 'picks']] },
  { room: 'brain', name: 'Wire it', hint: 'One wire at a time, then test', tall: true, tabs: [[5, 'wire'], [0, 'pins']] },
  { room: 'brain', name: 'Shop', hint: 'What to buy, what it costs', tall: true, tabs: [[5, 'shop']] },
  { room: 'brain', name: 'Board', hint: 'One board, no loose wires', tall: true, tabs: [[5, 'pcb']] }
];
const ROOMS = [['body', 'Body'], ['brain', 'Brain']];
function pageTabs(p) { const out = []; p.tabs.forEach(([st, id]) => tabsFor(st).forEach((x) => { if (id === '*' || x[0] === id) out.push([st, x[0], x[1], x[2]]); })); return out; }
function pageOf(step, tab) { let hit = -1; PAGES.forEach((p, i) => { if (hit < 0 && pageTabs(p).some((x) => x[0] === step && x[1] === tab)) hit = i; }); if (hit < 0) hit = PAGES.findIndex((p) => p.tabs.some((x) => x[0] === step)); return hit < 0 ? 0 : hit; }
function openPage(i) { // go to a page: its first tool, or the one you last used there
  const p = PAGES[i]; if (!p) return; const list = pageTabs(p), keep = list.find((x) => x[0] === S.step && x[1] === S.tab[x[0]] && S.page === i) || list.find((x) => (S.seen || {})[i] === x[0] + ':' + x[1]) || list[0];
  S.step = keep[0]; S.tab[keep[0]] = keep[1]; S.page = i; BIG3D = false; save(); $('con').classList.remove('down'); render();
}
let SHOWN = -1;
function render() {
  PNAME.top = isPanel() ? 'Panel' : 'Top';
  if (isPanel()) { const L = S.look; if (L.logo.face !== 'top') { L.logo.face = 'top'; L.logo.x = L.logo.y = null; } if (L.texFace !== 'top') L.texFace = 'top'; }
  const t = curTab(); S.page = pageOf(S.step, t); const pg = PAGES[S.page], list = pageTabs(pg), mine = PAGES.map((p, i) => [p, i]).filter((x) => x[0].room === pg.room), at = mine.findIndex((x) => x[1] === S.page);
  if (!S.seen) S.seen = {}; S.seen[S.page] = S.step + ':' + t; if (!S.lastIn) S.lastIn = {}; S.lastIn[pg.room] = S.page;
  $('rooms').innerHTML = ROOMS.map((r) => '<button type="button" data-room="' + r[0] + '" aria-pressed="' + (r[0] === pg.room) + '">' + r[1] + '</button>').join('');
  $('ph').innerHTML = '<b class="nb">0' + (at + 1) + '</b><span class="pt">' + pg.name + '</span><span class="hint">' + pg.hint + '</span>';
  $('parts').innerHTML = list.map((x) => '<button type="button" data-st="' + x[0] + '" data-t="' + x[1] + '" aria-pressed="' + (x[0] === S.step && x[1] === t) + '"><span>' + x[2] + '</span></button>').join('');
  $('parts').parentNode.hidden = list.length < 2;
  const prev = mine[at - 1], next = mine[at + 1];
  $('bbar').innerHTML = '<button type="button" data-pg="' + (prev ? prev[1] : '') + '"' + (prev ? '' : ' disabled') + '>Back</button><span class="dots">' + mine.map((x) => '<b' + (x[1] === S.page ? ' class="on"' : '') + '></b>').join('') + '</span>' +
    (next ? '<button type="button" class="nx" data-pg="' + next[1] + '">Next: ' + next[0].name + '</button>' : pg.room === 'body' ? '<button type="button" class="nx" data-room="brain">The Brain</button>' : '<button type="button" class="nx" data-room="body">The Body</button>');
  $('con').classList.toggle('tall', !!pg.tall);
  if (SHOWN !== S.page) { if (SHOWN !== -1) { const st = $('stage'), cn = $('con'); st.classList.remove('zin'); cn.classList.remove('pop'); void st.offsetWidth; st.classList.add('zin'); cn.classList.add('pop'); } SHOWN = S.page; }
  $('pane').innerHTML = pane(t); $('pane').scrollTop = 0; after(t); draw();
}
function nextBtn() { return ''; }
function go(step) { S.step = step; BIG3D = false; save(); $('con').classList.remove('down'); render(); }
function goRoom(room) { const i = (S.lastIn || {})[room], j = i != null && PAGES[i] && PAGES[i].room === room ? i : PAGES.findIndex((p) => p.room === room); openPage(j); }
$('bbar').addEventListener('click', (e) => { const r = e.target.closest('[data-room]'); if (r) { goRoom(r.dataset.room); return; } const b = e.target.closest('[data-pg]'); if (b && b.dataset.pg !== '') openPage(+b.dataset.pg); });
$('rooms').addEventListener('click', (e) => { const r = e.target.closest('[data-room]'); if (r) goRoom(r.dataset.room); });
$('parts').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; S.step = +b.dataset.st; S.tab[S.step] = b.dataset.t; BIG3D = false; save(); $('con').classList.remove('down'); render(); });
$('drop').addEventListener('click', () => { $('con').classList.toggle('down'); draw(); });

// ---------- panes ----------
function seg(name, opts, val) { return '<div class="seg" data-sg="' + name + '">' + opts.map((o) => '<button type="button" data-v="' + o[0] + '" aria-pressed="' + (String(o[0]) === String(val)) + '">' + o[1] + '</button>').join('') + '</div>'; }
function stepper(name, label, txt) { return '<div class="row"><b>' + label + '</b><div class="step" data-st="' + name + '"><button type="button" data-d="-1" aria-label="Less">&minus;</button><output>' + esc(txt) + '</output><button type="button" data-d="1" aria-label="More">+</button></div></div>'; }
const LK = { solder: 'SOLDER', pins: 'NO SOLDER', plug: 'PLUG IN' };
function counts() { const c = {}; S.items.forEach((i) => { c[i.type] = (c[i.type] || 0) + 1; }); return c; }
function chosenChips() { const c = counts(), P = PARTS(); const k = Object.keys(c); return k.length ? '<p class="note" style="margin-top:8px"><b>About ' + money(cost(true).total) + ' so far</b> in parts. The full bill is in Brain, Shop.</p><div class="chosen">' + k.map((t) => '<span>' + esc(P[t] ? P[t].short : t) + ' <i>x' + c[t] + '</i></span>').join('') + '</div><button class="btn' + (Date.now() - CLEARARM < 4000 ? ' red' : '') + '" data-act="clearall" style="margin-top:8px;padding:8px">' + (Date.now() - CLEARARM < 4000 ? 'Tap again to remove ' + (S.items.length === 1 ? 'the part' : 'all ' + S.items.length + ' parts') : 'Start over: remove all parts') + '</button>' : '<p class="note">Nothing yet. Tap a part to add it, tap its number to take one away.</p>'; }
function pane(t) {
  const P = PARTS(), c = counts();
  if (t === 'snap') return '<p class="h">Already built and soldered?</p><button class="btn red" data-act="measure">Photo my board, front and back</button><p class="note" style="margin-bottom:10px">A card next to it is the ruler. Press on each part on the photo, say what it is, do the brain too. Your board goes inside the case, every part on it becomes its own part you can change. Photos stay on your phone.</p>' +
    '<p class="h">Not built yet</p><div class="grid g2"><button class="btn dark" data-act="snap">' + (PHOTO ? 'Take another photo' : 'Take a photo of my parts') + '</button><button class="btn" data-act="toParts">Pick from the list</button></div>' +
    '<p class="note">Lay your parts out on a table and snap them. The photo stays here on your phone so you can match each one to the list. Then tap Parts and add each one you see.</p>' + (PHOTO ? '<button class="btn" data-act="nophoto" style="margin-top:8px">Remove the photo</button>' : '') + chosenChips();
  if (t === 'parts') {
    const list = Object.keys(P).filter((k) => P[k].cat === S.cat);
    return '<div class="catsel"><select id="cat" aria-label="Kind of part">' + CZ.CATS.map((x) => '<option value="' + x[0] + '"' + (x[0] === S.cat ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div>' +
      '<div class="hrow">' + (list.length ? list.map((k) => '<button type="button" class="pick" data-add="' + k + '">' + (c[k] ? '<span class="n" data-sub="' + k + '">' + c[k] + '</span>' : '') + '<span class="lk ' + P[k].link + '">' + LK[P[k].link] + '</span>' + partSvg(P[k]) + esc(P[k].short) + '<small>' + esc((P[k].w + ' x ' + P[k].h).replace(/\.0\b/g, '')) + ' mm</small></button>').join('') :
        '<button type="button" class="pick" data-act="measure" style="grid-column:span 2">' + ico('measure') + 'Measure one with my phone<small>Card as the ruler</small></button>') + '</div>' +
      '<p class="note" id="partTip">' + (list[0] ? esc(P[list[0]].tip) : '') + '</p>' + (S.cat === 'power' ? '<p class="note">' + powerNote() + '</p>' : '') + chosenChips();
  }
  if (t === 'pins') return pinsHtml();
  if (t === 'picks') return '<p class="h">Cheap, loved by the maker community</p><div class="list">' + CZ.PICKS.map((p) => '<div class="it"><b>' + esc(p[1]) + (c[p[0]] ? ' <span class="ok">added</span>' : '') + '</b>' + esc(p[2]) + '<div style="margin-top:6px"><button class="btn" data-add="' + p[0] + '" style="display:inline-block;padding:7px 12px">+ Add ' + esc(P[p[0]].short) + '</button></div></div>').join('') + '</div><p class="note">From Reddit (r/esp32, r/raspberry_pi), Instructables and maker blogs. Sources in the ? help.</p>';
  if (t === 'lid' || t === 'base' || t === 'top') {
    const mine = S.items.filter((i) => i.panel === t || (t !== 'lid' && i.panel === 'inside')), s = S.items.find((i) => i.id === sel), probs = allProblems(), N = numbers();
    let h = s && s.of != null ? '<div class="selbar"><b>' + esc(label(s)) + '</b><select class="pin" data-kidtype="' + s.id + '" aria-label="What it is">' + KID_TYPES.filter((t) => CZ.PARTS[t]).map((t) => '<option value="' + t + '"' + (t === s.type ? ' selected' : '') + '>' + esc(CZ.PARTS[t].short) + '</option>').join('') + '</select>' + (RECTK(s) ? '<button data-act="rot">Turn</button>' : '') + '<button data-act="del">Remove</button></div>' + nudgeRow() + '<p class="note" style="margin:-2px 0 8px">Drag it, or use the arrows (0.5 mm), until it sits where the real part is (turn My photo on to check). Your board stays put.</p>' + (s.panel !== 'inside' ? stepper('kh', 'Height', kidH(s) + ' mm above board') + '<p class="note" style="margin:-2px 0 8px">' + esc(pokeNote(s)) + '</p>' : '') : s ? '<div class="selbar"><b>' + esc(label(s)) + '</b><button data-act="rot">Turn</button>' + (isClam() && s.panel !== 'inside' && !(PP(s) && PP(s).board) ? '<button data-act="swap">To ' + (s.panel === 'lid' ? 'base' : 'lid') + '</button>' : '') + '<button data-act="del">Remove</button></div>' : '';
    if (s && PP(s) && PP(s).board) h += '<div class="selbar"><b>My photo</b>' + [['off', 'Hide'], ['faded', 'Faint'], ['clear', 'Show']].map((m) => '<button data-photo="' + m[0] + '"' + ((S.photo || 'off') === m[0] ? ' style="background:#1a1a1a;color:#fff"' : '') + '>' + m[1] + '</button>').join('') + '</div>' + ((PP(s).kids || []).length ? '<button class="btn" data-act="kidsreset" style="margin:0 0 8px;padding:8px">Put the parts back where my photo had them</button>' : '') + '<div class="selbar"><b>Board</b><button data-act="bmove">' + (s.move ? 'Unlocked: drag moves it' : 'Locked in place') + '</button></div>' + (s.move ? nudgeRow() : '') + '<p class="note" style="margin:-2px 0 8px">Tap an empty spot on your board to add a part there.</p>' + stepper('btop', 'Tallest', (PP(s).top || 9) + ' mm button') + '<p class="note" style="margin:-2px 0 8px">Your board hangs under the top so a ' + (PP(s).top || 9) + ' mm button pokes through 1.5 mm. Tap a part to see how far it pokes through.</p>' + stepper('bund', 'Under', (PP(s).under != null ? PP(s).under : 8.5) + ' mm below') + '<p class="note" style="margin:-2px 0 8px">Space under the board for pins, solder and wires' + (PP(s).under != null ? ', from your side photo' : ', a guess: take the side photo to measure it') + '.</p>';
    h += '<p class="h">' + (t === 'lid' ? 'The lid: screens live here' : t === 'base' ? 'The base: controls, the brain sits under it' : 'The top') + '</p>';
    h += mine.length ? '<div class="chosen">' + mine.map((i) => '<span data-sel="' + i.id + '" style="cursor:pointer' + (i.id === sel ? ';background:#1a1a1a;color:#fff' : '') + '">' + esc(N[i.id] + ' ' + PP(i).short) + (problems(i).length ? ' <i>!</i>' : '') + '</span>').join('') + '</div>' : '<p class="note">No parts here yet. Add some in Brain.</p>';
    h += '<div class="grid g2" style="margin-top:8px"><button class="btn dark" data-act="auto">Arrange for me</button><button class="btn" data-act="toBrain">Add parts</button></div>';
    h += '<p class="note">' + (probs.length ? probs.map((x) => '<span class="bad">' + esc(label(x.it)) + ' is ' + esc(x.list[0]) + '.</span>').join(' ') : (S.items.length ? '<span class="ok">Everything fits.</span> ' + (S.items.some((i) => PP(i) && PP(i).board) ? 'Tap your board to add a part there. Drag a part to line it up. Two fingers zoom in, and the part numbers show.' : 'Drag a part to move it. Tap to pick it.') : '')) + '</p>';
    return h;
  }
  if (t === 'psize') { const d = dims(), scr = S.items.some((i) => PP(i) && PP(i).screen);
    return '<button class="btn dark" data-act="measureLid" style="margin-bottom:8px">Measure the inside of my box</button><div class="row"><b>Box inside</b><input class="num" id="pw" type="number" inputmode="decimal" step="0.5" value="' + S.pw + '" aria-label="Inside width in mm"><span class="u">x</span><input class="num" id="pd" type="number" inputmode="decimal" step="0.5" value="' + S.pd + '" aria-label="Inside height in mm"><span class="u">mm</span></div>' +
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
  if (t === 'shape') return '<button class="btn" data-act="start" style="margin-bottom:8px">Start over: pick what to make</button><div class="grid g4">' + CZ.STYLES.map((s) => '<button type="button" class="pick" data-style="' + s[0] + '" aria-pressed="' + (S.style === s[0]) + '">' + styleSvg(s[0]) + esc(s[1]) + '</button>').join('') + '</div><p class="note">' + esc(styleRow()[2]) + '.' + (S.style === 'face' ? ' Round screens make eyes or a watch face. Want it to move? Add a servo in Brain (Movement), then plan the moves in the <a href="/creator-tools.html#cartoon">Cartoon maker</a>.' : '') + (S.style === 'hand' || S.style === 'pad' ? ' Our own shape, not a copy of any console.' : '') + '</p>';
  if (t === 'fit') {
    const h = heights();
    let o = stepper('cols', 'Wide', S.cols + ' squares (' + dims().W.toFixed(0) + ' mm)') + stepper('rows', 'Tall', S.rows + ' squares (' + dims().D.toFixed(0) + ' mm)') + stepper('add', 'Height', h.H + ' mm' + (S.add ? ' (+' + S.add + ')' : ''));
    o += '<div class="row"><b>Deck on</b>' + seg('snap', [['0', 'Screws'], ['1', 'Snap clips']], S.snap ? '1' : '0') + '</div>';
    if (S.items.some((i) => i.type === 'tact12')) o += '<div class="row"><b>Buttons</b>' + seg('spring', [['0', 'Caps'], ['1', 'Printed springs']], S.spring ? '1' : '0') + '</div>';
    if (isClam()) o += '<div class="row"><b>Hinge</b>' + seg('hinge', [['printed', 'Printed'], ['metal', 'Metal'], ['none', 'Lift off']], S.hinge) + '</div>' + (S.style === 'small' ? '<div class="row"><b>Opens on</b>' + seg('hside', [['left', 'Left'], ['right', 'Right']], S.hside) + '</div>' : '') + '<div class="row"><b>Closes</b>' + seg('magnets', [['1', 'Magnets'], ['0', 'Latch or strap']], S.magnets ? '1' : '0') + '</div>';
    o += '<p class="note">' + (S.snap ? 'Snap clips: 4 arms under the deck click into a groove in the wall. No screws. ' : '') + (S.spring ? 'Printed springs: the deck around each small button becomes a little flexing pad, no caps to buy. ' : '') + (isClam() ? (S.hinge === 'printed' ? 'Printed hinge: a piece of 1.75 mm filament is the pin. ' : S.hinge === 'metal' ? 'Metal hinges: 2 small butt hinges (25 mm) screwed to the back. ' : '') + (S.magnets ? 'Two 6 x 3 mm magnets in each half hold it shut. ' : '') : 'Height grows to fit your deepest part. Add more for batteries or a speaker. ') + '</p>';
    return o;
  }
  if (t === 'measure') { const mine = Object.keys(S.mine); return '<button class="btn dark" data-act="measure">Measure a part with my phone</button><p class="note">Lay a bank, ID or library card next to it. The camera shows a green outline and arrows, and snaps when your phone is level. Then drag the dots onto the corners and tap the holes. Front holes get cut in the deck, back screw holes get posts.</p>' + (mine.length ? '<p class="h" style="margin-top:10px">My parts</p><div class="chosen">' + mine.map((k) => '<span>' + esc(S.mine[k].name) + ' ' + S.mine[k].w + ' x ' + S.mine[k].h + ' <i data-delmine="' + k + '" style="cursor:pointer">&times;</i></span>').join('') + '</div>' : ''); }
  if (t === 'logo') { const L = S.look.logo; return '<div class="row"><b>Logo</b>' + seg('lg_src', [['off', 'None'], ['text', 'Words'], ['image', 'My PNG']], L.on ? L.src : 'off') + '</div>' + (L.on ? (L.src === 'text' ? '<div class="row"><b>Words</b><input class="txt" id="lgText" maxlength="16" value="' + esc(L.text) + '" style="flex:1;height:38px;border:1.5px solid #1a1a1a;border-radius:10px;padding:0 10px;font:700 16px var(--sys)"></div>' : '<div class="row"><b>Picture</b><label class="btn" style="flex:1;position:relative">' + (LOGOIMG ? 'Pick another' : 'Pick my logo') + '<input type="file" accept="image/*" id="lgFile" style="position:absolute;inset:0;opacity:0"></label></div>' + (!LOGOIMG ? '<p class="note bad" style="margin:-2px 0 8px">Pick a picture to see it on the case.</p>' : !logoShape().length ? '<p class="note bad" style="margin:-2px 0 8px">We could not find a shape in that picture. Try one with a plain background and a bold logo.</p>' : '')) +
    '<div class="row"><b>Where</b>' + seg('lg_face', faces().map((f) => [f[0], SHORTF[f[0]]]), L.face) + '</div><div class="row"><b>How</b>' + seg('lg_how', [['dip', 'Pressed in'], ['raised', 'Raised'], ['cut', 'Cut out']], L.how) + '</div>' + stepper('lgsize', 'Size', L.size + ' mm wide') : '<p class="note">Turn any logo or word into part of the case: pressed in, raised, or cut all the way through. PNG with a clear or white background works best.</p>'); }
  if (t === 'labels') { const L = S.look.labels, list = S.items.filter((i) => PP(i) && i.panel !== 'inside' && PP(i).cat !== 'brain'), btns = {}; panels().forEach((p) => { btns[p] = itemsOn(p).filter((i) => PP(i) && PP(i).cat === 'press').sort((a, b) => (numbers()[a.id] > numbers()[b.id] ? 1 : -1)); });
    return '<div class="row"><b>Labels</b>' + seg('lb_place', [['off', 'None'], ['below', 'Under'], ['above', 'Over']], L.on ? L.place : 'off') + '</div>' + (L.on ? '<div class="row"><b>How</b>' + seg('lb_how', [['dip', 'Pressed in'], ['raised', 'Raised']], L.how) + '</div>' + stepper('lbsize', 'Letters', L.size + ' mm tall') +
      '<div class="chosen">' + list.map((i) => '<span>' + esc(numbers()[i.id]) + ' <input data-lbl="' + i.id + '" value="' + esc(labelText(i, (btns[i.panel] || []).indexOf(i))) + '" maxlength="5" style="width:52px;border:0;border-bottom:1.5px solid #1a1a1a;font:800 13px var(--sys);background:none"></span>').join('') + '</div>' : '<p class="note">Letters or symbols under each button, like A, B, PLAY, VOL. Pressed into the deck or raised.</p>'); }
  if (t === 'tex') { const f = S.look.texFace, tx = S.look.tex[f], kinds = f === 'walls' ? [['none', 'None'], ['vstripe', '| | |'], ['hstripe', '='], ['grid', 'Grid'], ['checks', 'Checks']] : [['none', 'None'], ['grid', 'Grid'], ['checks', 'Checks'], ['diamond', 'Tread'], ['vstripe', '| | |'], ['hstripe', '='], ['dots', 'Dots'], ['wood', 'Wood']];
    return '<div class="row"><b>Side</b>' + seg('tx_face', faces().map((x) => [x[0], SHORTF[x[0]]]).concat([['walls', 'Sides']]), f) + '</div><div class="grid g4 texg">' + kinds.map((k) => '<button type="button" class="pick" data-tex="' + k[0] + '" aria-pressed="' + (tx.kind === k[0]) + '">' + texSvg(k[0]) + esc(k[1]) + '</button>').join('') + '</div>' + (tx.kind !== 'none' ? stepper('txsp', 'Spacing', tx.sp + ' mm') + (f !== 'walls' ? '<div class="row"><b>Pattern</b>' + seg('tx_bump', [['0', 'Pressed in'], ['1', 'Stands up']], tx.bump ? '1' : '0') + '</div>' : '') : ''); }
  if (t === 'colors') { const L = S.look; return '<div class="row"><b>My printer</b>' + seg('cl_n', [['1', 'One color'], ['2', '2 or more (AMS, MMU)']], String(L.colors)) + '</div><div class="row"><b>Colors</b><label class="btn" style="flex:1;display:flex;gap:8px;align-items:center;justify-content:center"><input type="color" id="c1" value="' + L.c1 + '" style="width:28px;height:28px;border:0;padding:0;background:none">Case</label><label class="btn" style="flex:1;display:flex;gap:8px;align-items:center;justify-content:center"><input type="color" id="c2" value="' + L.c2 + '" style="width:28px;height:28px;border:0;padding:0;background:none">Marks</label></div>' +
    (L.colors > 1 ? '<p class="note">You get a second file for every piece with marks. Load both as one object in Bambu Studio, Orca or Prusa, give the second file your marks color. They line up by themselves.</p>' : '<div class="row"><b>Marks</b>' + seg('cl_single', [['paint', 'Paint the dips'], ['glue', 'Print pieces + glue']], L.single) + '</div><p class="note">' + (L.single === 'paint' ? 'Pressed-in marks stay as dips. Wipe in acrylic paint, scrape the top clean.' : 'Logos and labels print as separate pieces that drop into a 0.1 mm bigger pocket. A dot of glue holds them.') + ' Raised marks are always a separate piece: the deck prints face down, so nothing can stick up from it.</p>'); }
  if (t === 'printer') {
    const cur = printerRow(), brand = S.brand || cur[5];
    return '<label class="btn dark" style="position:relative;margin-bottom:6px">Scan the QR sticker on my printer<input type="file" accept="image/*" capture="environment" id="qrIn" style="position:absolute;inset:0;opacity:0;width:100%"></label><p class="note" id="qrNote" style="margin:0 0 8px">' + (QRMSG || 'The sticker with the serial number, usually on the back or under the screen. Or pick it below.') + '</p>' +
      '<div class="row">' + seg('brand', CZ.BRANDS, brand) + '</div><div class="grid g2">' + CZ.PRINTERS.filter((p) => p[5] === brand).map((p) => '<button type="button" class="pick" data-printer="' + p[0] + '" aria-pressed="' + (S.printer === p[0]) + '">' + esc(p[1]) + '<small>' + p[2] + ' x ' + p[3] + ' mm</small></button>').join('') + '</div>' +
      (S.printer === 'custom' ? '<div style="margin-top:8px">' + stepper('bedw', 'Bed wide', S.bed[0] + ' mm') + stepper('bedd', 'Bed deep', S.bed[1] + ' mm') + '</div>' : '') + '<p class="note">' + esc(cur[0] === 'custom' ? 'Your printer' : cur[1]) + ': ' + S.bed[0] + ' x ' + S.bed[1] + ' mm bed. No printer? Print services and libraries take the same files.</p>';
  }
  if (t === 'strong') {
    if (S.material === 'wood') return '<p class="note" style="margin-top:0">Wood is cut, not printed, so there is no print time. Pick a plastic in Material to see it.</p>';
    const e = estimate();
    return '<div class="row"><b>Walls</b>' + seg('walls', [['normal', 'Normal 2.4 mm'], ['tough', 'Thick 3.2 mm']], S.walls) + '</div><div class="row"><b>Finish</b>' + seg('layer', [['draft', 'Fast'], ['normal', 'Normal'], ['fine', 'Smooth']], S.layer) + '</div>' +
      '<div class="est"><b>About ' + hm(e.sec) + '</b><span>' + Math.round(e.grams) + ' g of ' + S.material.toUpperCase() + ', about $' + (e.grams * 0.02).toFixed(2) + ' at $20 a kilo. ' + e.pieces + ' piece' + (e.pieces > 1 ? 's' : '') + '.</span></div>' +
      '<p class="note">Set your slicer to <b>' + LAYER[S.layer] + ' mm layers, 4 walls, 15 percent infill</b>. Its time is the real one, this is within about a third.</p>' +
      '<p class="note"><b>Hollow or solid?</b> A case is already a hollow shell. Its walls are ' + R.T + ' mm thin, so 4 walls in the slicer print them as solid plastic and infill changes almost nothing. To make it tougher, pick Thick: the sides and floor get thicker (the outside grows ' + (2 * (3.2 - 2.4)).toFixed(1) + ' mm), the deck stays the same so your buttons still reach. Fast shows the layer lines, Smooth takes about twice as long.</p>';
  }
  if (t === 'mat') { const m = CZ.MATERIALS.find((x) => x[0] === S.material); return '<div class="grid g4">' + CZ.MATERIALS.map((x) => '<button type="button" class="pick" data-mat="' + x[0] + '" aria-pressed="' + (S.material === x[0]) + '">' + esc(x[1]) + '</button>').join('') + '</div><p class="note">' + esc(m[2]) + '</p><p class="h" style="margin-top:8px">How the pieces join (best for ' + esc(m[1]) + ' first)</p><div class="grid g3">' + m[3].concat(Object.keys(CZ.JOINS).filter((k) => m[3].indexOf(k) < 0)).map((k, i) => '<button type="button" class="pick" data-join="' + k + '" aria-pressed="' + (S.join === k) + '">' + esc(CZ.JOINS[k][0]) + (i < 2 ? '<small>good fit</small>' : '') + '</button>').join('') + '</div><p class="note">' + esc(CZ.JOINS[S.join][1]) + '</p>'; }
  if (t === 'split') {
    const hs = halves(), pl = hs.map((x) => plan(x.built)), n = pl.reduce((s, p) => s + p.regs.length, 0), bad = pl.some((p) => !p.fit);
    return '<div class="row"><b>Seams go</b>' + seg('sdir', [['auto', 'Auto'], ['v', '|'], ['h', '&mdash;'], ['both', '+'], ['d', '/']], S.sdir) + '</div><div class="row"><b>How many</b>' + seg('sn', [['auto', 'Auto'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']], S.sn) + '</div><div class="row"><b>Edges</b>' + seg('tab3', [['dovetail', 'Puzzle tabs'], ['flat', 'Flat + glue']], S.tab3) + '</div>' +
      '<p class="note">' + (bad ? '<span class="bad">Some pieces are still bigger than your ' + S.bed[0] + ' x ' + S.bed[1] + ' mm bed. Add a seam.</span>' : '<span class="ok">' + n + ' pieces, all fit your bed.</span>') + ' One seam in the middle = 2 even pieces. Two seams = 3. Puzzle tabs lock, a drop of glue keeps them.</p>';
  }
  if (t === '3d') return '<p class="h">Spin it with one finger, pinch to zoom</p>' + (isClam() ? '<button class="btn" data-act="open">' + (S.open ? 'Close the lid' : 'Open the lid') + '</button>' : '') + '<p class="note">' + summaryLine() + ' <b>' + money(cost().total) + ' to build.</b></p>' + creditHtml();
  if (t === 'shop') return shopHtml();
  if (t === 'pcb') return pcbHtml();
  if (t === 'files') { const probs = allProblems(); return '<p class="note" style="margin:0 0 8px">No printer? A print service or a library takes these same files. To print from a USB stick, open them in your printer\'s free slicer app first: it turns them into the file your printer reads.</p>' + '<button class="btn red" data-act="make"' + (probs.length || !S.items.length ? ' aria-disabled="true"' : '') + '>Make my files</button><p class="note">' + (!S.items.length ? 'Add parts in Brain first.' : probs.length ? '<span class="bad">Fix the parts marked ! in Arrange first.</span>' : (S.material === 'wood' ? 'Wood: real size templates (SVG) to print at 100 percent or laser cut, plus the cut list.' : 'One STL per piece, numbered. Print the deck face down, the tray open side up.')) + '</p><div class="files" id="fileList" style="margin-top:8px"></div>'; }
  if (t === 'wire') return wireHtml();
  if (t === 'extras') { const X = xp();
    const card = (id, title, txt, ctl) => '<div class="it"><b>' + title + '</b>' + txt + ctl + '<div class="grid g2" style="margin-top:6px"><button class="btn dark" data-xsave="' + id + '">Save STL</button><span class="note" style="margin:0;align-self:center">' + XINFO[id]() + '</span></div></div>';
    return '<p class="note" style="margin-top:0">Print one piece at a time. Each is sized to your case.</p><div class="list" style="margin-top:6px">' +
      card('stand', 'Clip-on stand', 'Clips onto the bottom edge, leans it back. Stronger than a hinged kickstand: no pin to snap.', stepper('xs_t', 'Fits', X.stand.t + ' mm thick' + (X.stand.auto ? ' (your case)' : '')) + '<div class="row"><b>Leans</b>' + seg('xs_a', [['15', '15'], ['25', '25'], ['35', '35 deg']], String(X.stand.a)) + '</div>') +
      card('feet', 'Feet', 'Little round feet so it does not slide. Screw on, or glue with no hole.', '<div class="row"><b>Fix</b>' + seg('xf_hole', [['1', 'Screw hole'], ['0', 'Glue']], X.feet.hole ? '1' : '0') + '</div>' + stepper('xf_h', 'Tall', X.feet.h + ' mm')) +
      card('standoff', 'Standoffs', 'Lift a board off the floor. The screw cuts its own thread in the plastic.', '<div class="row"><b>Screw</b>' + seg('xo_s', [['m25', 'M2.5 (Pi)'], ['m3', 'M3']], X.standoff.s) + '</div>' + stepper('xo_h', 'Tall', X.standoff.h + ' mm')) +
      card('clip', 'Cable clips', 'Keep wires tidy inside. Stick on with double sided tape or glue.', stepper('xc_d', 'Cable', X.clip.d + ' mm')) + '</div>';
  }
  return '';
}
function summaryLine() { const d = dims(), h = heights(); if (isPanel()) return 'Panel, ' + d.W + ' x ' + d.D + ' x ' + S.pt + ' mm. ' + S.items.length + (S.items.length === 1 ? ' part.' : ' parts.'); return esc(styleRow()[1]) + ', ' + d.W.toFixed(0) + ' x ' + d.D.toFixed(0) + ' x ' + (h.H + h.Hl) + ' mm closed. ' + S.items.length + ' parts.'; }
const WIRES = { tact12: 2, button16: 2, arcade24: 2, arcade30: 2, dpad: 5, pot: 3, encoder: 5, thumb: 5, stick: 5, slider: 3, led5: 2, ring12: 3, speaker28: 2, servo: 3, tft28: 9, round128: 8, oled096: 4, cyd: 0, hdmi5: 0, hdmi7: 0, lipo1200: 0, lipo500: 0, liposhim: 0, tp4056: 4, rocker: 2 };
// ---------- Wire it: one wire at a time, no breadboard ----------
// A wire goes from a part to a pin, the pin has a job, and you test it before the next one. Three ways to join: push-on wires, solder, or the board.
const PIN_OF = {}; PICO_LEFT.forEach((n, i) => { if (PIN_OF[n] == null) PIN_OF[n] = i + 1; }); PICO_RIGHT.forEach((n, j) => { if (PIN_OF[n] == null) PIN_OF[n] = 40 - j; });
const GND_PINS = [3, 8, 13, 18, 23, 28, 38];
const pinWhere = (n) => (n <= 20 ? 'left side, pin ' + n + ' counting down from the USB plug' : 'right side, pin ' + (41 - n) + ' counting down from the USB plug');
function picoSvg(pin) { // the Pico seen from above, USB plug at the top, one pin lit
  let h = '<svg viewBox="0 0 64 150" style="float:right;width:74px;margin:0 0 4px 8px" aria-hidden="true"><rect x="14" y="8" width="36" height="136" rx="3" fill="#2f7d55"/><rect x="24" y="2" width="16" height="12" rx="2" fill="#b9b9b9"/><text x="32" y="26" text-anchor="middle" font-size="6" font-weight="800" fill="#fff" font-family="sans-serif">USB</text>';
  for (let i = 0; i < 20; i++) { const y = 14 + i * 6.6, l = i + 1, r = 40 - i; h += '<circle cx="17.5" cy="' + y + '" r="' + (pin === l ? 4.2 : 1.9) + '" fill="' + (pin === l ? '#c8412f' : '#f0cf6b') + '"/><circle cx="46.5" cy="' + y + '" r="' + (pin === r ? 4.2 : 1.9) + '" fill="' + (pin === r ? '#c8412f' : '#f0cf6b') + '"/>'; }
  if (pin) { const left = pin <= 20, y = 14 + (left ? pin - 1 : 40 - pin) * 6.6; h += '<text x="' + (left ? 10 : 54) + '" y="' + (y + 2.6) + '" text-anchor="' + (left ? 'end' : 'start') + '" font-size="8" font-weight="900" fill="#c8412f" font-family="sans-serif">' + pin + '</text>'; }
  return h + '</svg>';
}
const TESTS = { button: 'Press it. The small light on the Pico turns on while you hold it', knob: 'Turn or slide it. The small light on the Pico blinks as it moves', wheel: 'Turn it and press it. The small light on the Pico blinks', stick: 'Push it around. The small light on the Pico blinks', led: 'Press any button. This light switches on and off', ring: 'Press any button. The ring lights up', sound: 'Press any button. It beeps', servo: 'Press a button or turn a knob. The arm moves', screen: 'It shows NOCIV and the word Ready' };
function wirePlan() {
  const bi = brainInfo(); if (bi && PICO_BRAINS.indexOf(bi.type) < 0 && bi.type !== 'pico2') return { why: 'The wire by wire guide is for the Raspberry Pi Pico, Pico W and Pico 2 for now. Yours is the ' + bi.name + '.' };
  const w = wiring(); if (!w.rows.length) return { why: 'Add buttons, knobs, screens or lights in Brain, Parts first. Each one gets its wires here.' };
  if (w.problems.length) return { why: 'Fix this in Brain, Wire it, Wiring first: ' + w.problems[0] };
  const rows = w.rows.slice().sort((a, b) => ((b.N.spi || b.N.i2c) ? 1 : 0) - ((a.N.spi || a.N.i2c) ? 1 : 0)); /* screens first: the screen is how you see the rest work */
  const parts = rows.map((row) => ({ row, pads: padsFor(row) }));
  // power and ground: one pin can take one push-on wire. More wires than pins means a hub (a lever connector) per pin.
  const want = { GND: 0, '3V3': 0, VBUS: 0 }; parts.forEach((p) => p.pads.forEach(([, net]) => { if (want[net] != null) want[net]++; }));
  // direct pins first; only the overflow goes through a hub. A hub has 5 holes: 1 in, 4 out. A net with one pin (3.3 V) chains a second hub off the first.
  const hubs = [], share = {}; ['GND', '3V3', 'VBUS'].forEach((net) => {
    const pins = net === 'GND' ? GND_PINS : [PIN_OF[net]]; if (want[net] <= pins.length) return;
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
      else st.pin = net === 'GND' ? GND_PINS[g++ % GND_PINS.length] : PIN_OF[net];
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
    ? '<p class="note" style="margin-top:0"><b>No solder, no breadboard.</b> Get a Pico with its pins already on (Pico H, Pico WH or Pico 2 with headers) and a pack of 40 female to female jumper wires: you need about ' + jumpers + '. One end pushes onto the part, the other onto a Pico pin.' + (pl.hubs.length ? ' Also ' + pl.hubs.length + ' lever connector' + (pl.hubs.length > 1 ? 's' : '') + ' with 5 holes (the Wago 221 kind): they join wires with a flip of a lever.' : '') + '</p>'
    : '<p class="note" style="margin-top:0"><b>Solder.</b> One wire at a time: solder one end to the part, the other to the Pico pin shown. About ' + jumpers + ' wires. Test each part before the next one.</p>';
  h += '<div class="est"><b>' + nd + ' of ' + steps.length + ' done</b><span>' + (cur ? 'Do the one marked Now, test it, then tick it.' : 'All wired and tested. Close it up.') + '</span></div>';
  const tick = (k, on) => '<button data-wired="' + esc(k) + '" style="all:unset;cursor:pointer;float:right;padding:6px 9px;border:1.5px solid #1a1a1a;border-radius:9px;font:800 11.5px/1 var(--sys);margin-left:6px;' + (on ? 'background:#1a1a1a;color:#fff' : '') + '">' + (on ? 'Done' : 'Tick when done') + '</button>';
  const pinTxt = (p) => 'Pico pin ' + p + ' (' + pinWhere(p) + ')';
  h += '<div class="list" style="margin-top:8px">' + steps.map((x) => {
    const on = !!done[x.k], now = cur && cur.k === x.k, head = (now ? '<span class="bad">Now: </span>' : '');
    if (x.kind === 'code') return '<div class="it">' + tick(x.k, on) + '<b>' + head + 'First: put the test code on the Pico</b>' + (on && !now ? '' : 'Save code.py, plug the Pico into a computer with its USB cable, and follow the 3 steps at the top of the file. You do this once. After that every part you connect can be tested the moment its wires are on, with any USB charger for power.<br><button class="btn dark" data-act="savecode" style="margin-top:6px">Save code.py</button>') + '</div>';
    if (x.kind === 'hub') return '<div class="it">' + tick(x.k, on) + (now && x.pin ? picoSvg(x.pin) : '') + '<b>' + head + esc(x.hub.name[0].toUpperCase() + x.hub.name.slice(1)) + '</b>' + (on && !now ? '' : !x.pin ? 'One wire from ' + esc(x.hub.from.name) + ' into a second 5-hole lever connector. Strip 1 cm on both ends.' : (join === 'push' ? 'One wire from ' + pinTxt(x.pin) + ' into a 5-hole lever connector. Cut off the plug on that end, strip 1 cm, lift the lever, push the wire in, close it. The other 4 holes are for parts.' : 'One wire from ' + pinTxt(x.pin) + '. Up to 4 parts join onto this wire.')) + '</div>';
    if (x.kind === 'test') return '<div class="it">' + tick(x.k, on) + '<b>' + head + 'Test ' + esc(x.title) + '</b>' + (on && !now ? '' : esc(TESTS[x.what] || 'Check it does its job') + '. Nothing? Check its wires against the steps above, one by one.' + (x.note ? '<small>' + esc(x.note) + '</small>' : '')) + '</div>';
    const to = x.hub ? x.hub.name + ' (any free hole)' : pinTxt(x.pin) + (x.net.indexOf('GP') === 0 ? ', named ' + x.net : x.net === 'GND' ? ', a ground pin' : x.net === 'VBUS' ? ', 5 volts from USB' : ', 3.3 volts');
    const bare = x.link === 'solder' && join === 'push' ? '<small>This part has bare legs. No-solder ways: buy it with wires already on, use push-on spade plugs, or clamp its leg and a wire together in a lever connector.</small>' : '';
    return '<div class="it">' + tick(x.k, on) + (now && !x.hub ? picoSvg(x.pin) : '') + '<b>' + head + esc(x.title) + ': ' + esc(x.label) + '</b>' + (on && !now ? '' : 'From the ' + esc(x.label) + ' pin on the part to ' + esc(to) + '.' + bare) + '</div>';
  }).join('') + '</div>';
  if (nd) h += '<button class="btn" data-act="unwire" style="margin-top:8px">Start the ticks over</button>';
  return h + '<button class="btn" data-act="toWiring" style="margin-top:8px">Change which pin a part uses</button>';
}
$('pane').addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'pw' || t.id === 'pd') { const v = parseFloat(t.value); if (v >= 30 && v <= 600) { S[t.id] = Math.round(v * 2) / 2; save(); draw(); } return; }
  if (t.id === 'lgText') { S.look.logo.text = t.value; markCache = {}; save(); draw(); }
  if (t.dataset.lbl) { S.look.labels.text[t.dataset.lbl] = t.value; markCache = {}; save(); draw(); }
  if (t.id === 'c1') { S.look.c1 = t.value; save(); if (T3) T3.key = ''; draw(); }
  if (t.id === 'c2') { S.look.c2 = t.value; save(); if (T3) T3.key = ''; draw(); }
});
$('pane').addEventListener('change', (e) => {
  if (e.target.dataset && e.target.dataset.kidtype) { const k = S.items.find((i) => i.id === +e.target.dataset.kidtype); if (k) { snapU(); k.type = e.target.value; k.panel = CZ.PARTS[k.type].cat === 'brain' ? 'inside' : (boardOf(k) ? boardOf(k).panel : homePanel()); S.pins = {}; } save(); render(); return; }
  if (e.target.dataset && e.target.dataset.pin) { if (!S.pins) S.pins = {}; S.pins[e.target.dataset.pin] = +e.target.value; save(); render(); return; }
  if (e.target.id === 'pw' || e.target.id === 'pd') { reflow(); save(); render(); return; }
  if (e.target.id === 'qrIn') { const f = e.target.files[0]; e.target.value = ''; if (f) scanPrinter(f); return; }
  if (e.target.id !== 'lgFile') return; const f = e.target.files[0]; if (!f) return;
  const im = new Image(); im.onload = () => { const c = document.createElement('canvas'), k = Math.min(1, 600 / Math.max(im.width, im.height)); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); const url = c.toDataURL('image/png'); LOGOIMG = new Image(); LOGOIMG.onload = () => { markCache = {}; render(); }; LOGOIMG.src = url; try { localStorage.setItem(KEY + ':logo', url); } catch (er) {} };
  im.src = URL.createObjectURL(f);
});
function after(t) {
  if (t === 'parts') { const s = $('cat'); s.onchange = () => { S.cat = s.value; save(); render(); }; }
  $('sb').hidden = !(native3d() || BIG3D);
}

// ---------- taps ----------
$('pane').addEventListener('click', (e) => {
  const b = e.target.closest('button, [data-sel], [data-delmine], [data-sub], [data-nsel]'); if (!b) return; const d = b.dataset;
  if (d.nsel != null) { S.nsel = +d.nsel; save(); render(); return; }
  if (d.sub) { e.stopPropagation(); removePart(d.sub); render(); return; }
  if (d.add) { const it = addPart(d.add); const P = PP(it); const tip = $('partTip'); render(); if ($('partTip')) $('partTip').textContent = P.tip; void tip; return; }
  if (d.sel) { sel = +d.sel; render(); return; }
  if (d.delmine) { delete S.mine[d.delmine]; S.items = S.items.filter((i) => i.type !== d.delmine); save(); render(); return; }
  if (d.style) { S.picked = true; S.style = d.style; const z = SIZES[S.style]; S.cols = z[0]; S.rows = z[1]; reflow(); if (allProblems().length) fitAll(); /* the new shape is too small for what is in it: grow it until everything fits */ save(); render(); return; }
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
  if (d.xsave) { const f = addonFile(d.xsave); if (f) saveFile(f); return; }
  if (act === 'start') { showStart(); return; }
  if (act === 'clearall') { if (Date.now() - CLEARARM < 4000) { S.items = []; S.pins = {}; sel = null; LAST = null; CLEARARM = 0; } else CLEARARM = Date.now(); save(); render(); return; }
  if (act === 'savecode') { const c = codeFor(wiring(), summaryLine()); saveFile({ name: 'code.py', blob: new Blob([c.text], { type: 'text/x-python' }) }); return; }
  if (act === 'repin') { S.pins = {}; save(); render(); return; }
  if (act === 'toWiring') { S.tab[0] = 'pins'; go(0); return; }
  if (act === 'toBoard') { S.tab[5] = 'pcb'; go(5); return; }
  if (act === 'unwire') { S.wired = {}; save(); render(); return; }
  if (d.how) { S.how = d.how; save(); render(); return; }
  if (d.wired) { if (!S.wired) S.wired = {}; if (S.wired[d.wired]) delete S.wired[d.wired]; else S.wired[d.wired] = true; save(); const top = $('pane').scrollTop; render(); $('pane').scrollTop = top; return; }
  if (act === 'addNotch') { S.notches = S.notches || []; S.notches.push({ edge: 'bottom', shape: 'rrect', w: 20, d: 8, at: Math.round(dims().W / 2) }); S.nsel = S.notches.length - 1; reflow(); save(); render(); return; }
  if (act === 'delNotch') { S.notches.splice(S.nsel, 1); S.nsel = Math.max(0, S.nsel - 1); save(); render(); return; }
  if (act === 'measureLid') { openMeasure((P) => { S.pw = Math.round(P.w * 2) / 2; S.pd = Math.round(P.h * 2) / 2; reflow(); save(); render(); }); return; }
  if (act === 'nophoto') { PHOTO = null; try { localStorage.removeItem(KEY + ':photo'); } catch (er) {} render(); return; }
  if (act === 'toParts') { S.tab[0] = 'parts'; render(); return; }
  if (act === 'toBrain') { S.tab[0] = 'parts'; go(0); return; }
  if (act === 'measure') { openMeasure((P) => {
    const others = S.items.filter((i) => !(PP(i) && PP(i).cat === 'mine'));
    if (!others.length) { addBoard(P, false); return; }
    // a built board already carries its screen, buttons and brain: offer to build the case around it alone
    $('sheetIn').innerHTML = '<h2>Build around your board?</h2><p class="note" style="font-size:14px">Your board already has its screen, buttons and brain on it. You also have ' + others.length + ' part' + (others.length > 1 ? 's' : '') + ' added by hand: ' + esc(others.map((i) => PP(i) ? PP(i).short : i.type).slice(0, 6).join(', ')) + (others.length > 6 ? '...' : '') + '.</p><div class="list" style="margin-top:10px"><button class="btn start" data-board="replace"><b>Just my board</b>Remove the ' + others.length + ' other part' + (others.length > 1 ? 's' : '') + '. Best when everything is soldered on the board.</button><button class="btn start" data-board="keep"><b>Keep them too</b>For parts that are not on the board, like a separate speaker.</button></div>';
    $('sheet').hidden = false;
    $('sheetIn').querySelectorAll('[data-board]').forEach((x) => { x.onclick = () => { $('sheet').hidden = true; addBoard(P, x.dataset.board === 'replace'); }; });
  }); return; }
  if (act === 'auto') { snapU(); const list = S.items.filter((i) => i.of == null); /* parts on your board stay where the photo put them */ list.forEach((i) => { i.x = -999; i.y = -999; }); list.sort((a, b) => (fp(b).w * fp(b).h) - (fp(a).w * fp(a).h)).forEach((i) => { autoPlace(i); if (PP(i) && PP(i).board) syncKids(i); }); save(); render(); return; }
  const s = S.items.find((i) => i.id === sel);
  if (act === 'rot' && s && s.of != null) { snapU(); const b = boardOf(s); s.dr = ((s.dr || 0) + 1) % 4; if (b) syncKids(b); save(); render(); return; }
  if (act === 'nudge' && s) { snapU(); const st2 = 0.5; s.x += (+d.nx) * st2; s.y += (+d.ny) * st2; if (s.of != null) unSync(s); if (PP(s) && PP(s).board) syncKids(s); save(); render(); return; }
  if (act === 'bmove' && s) { s.move = !s.move; save(); render(); return; }
  if (d.photo) { S.photo = d.photo; save(); render(); return; }
  if (d.pcb) { snapU(); S.pcb = d.pcb === '1'; LAST = null; save(); render(); return; }
  if (act === 'saveboard') { const Bd = boardBuild(); if (Bd.ok) saveFile({ name: 'casezero-board.zip', blob: new Blob([zipFiles(boardFiles(Bd, 'casezero-board').concat([{ name: 'README.txt', text: boardReadme(Bd) }]))], { type: 'application/zip' }) }); return; }
  if (act === 'rot' && s && PP(s) && PP(s).board) { snapU(); s.r = ((s.r || 0) + 1) % 4; syncKids(s); if (problems(s).length) { autoPlace(s); syncKids(s); } save(); render(); return; }
  if (act === 'rot' && s) { s.r = ((s.r || 0) + 1) % 4; if (problems(s).length) { const keep = [s.x, s.y]; if (!autoPlace(s)) { s.x = keep[0]; s.y = keep[1]; } } save(); render(); return; }
  if (act === 'swap' && s) { s.panel = s.panel === 'lid' ? 'base' : 'lid'; autoPlace(s); S.tab[1] = s.panel; save(); render(); return; }
  if (act === 'del' && s) { snapU(); S.items = S.items.filter((i) => i !== s && i.of !== s.id); sel = null; save(); render(); return; }
  
  if (act === 'open') { S.open = !S.open; save(); render(); return; }
  if (act === 'make') { if (b.getAttribute('aria-disabled') === 'true') return; makeFiles(); return; }
  if (d.f != null) { saveFile(FILES[+d.f]); return; }
  const st = b.closest('[data-st]');
  if (st && d.d) {
    const k = st.dataset.st, v = +d.d;
    if (k === 'cols') S.cols = Math.max(2, Math.min(24, S.cols + v)); if (k === 'rows') S.rows = Math.max(2, Math.min(24, S.rows + v));
    if (k === 'add') S.add = Math.max(0, Math.min(80, S.add + v * 5));
    if (k === 'bedw') S.bed[0] = Math.max(80, Math.min(400, S.bed[0] + v * 10)); if (k === 'bedd') S.bed[1] = Math.max(80, Math.min(400, S.bed[1] + v * 10));
    if (k === 'lgsize') { S.look.logo.size = Math.max(6, Math.min(160, S.look.logo.size + v * (S.look.logo.size >= 20 ? 5 : 2))); markCache = {}; }
    if (k === 'lbsize') { S.look.labels.size = Math.max(2.5, Math.min(10, S.look.labels.size + v * 0.5)); markCache = {}; }
    const nn = (S.notches || [])[S.nsel];
    if (k === 'plift') S.plift = Math.max(3, Math.min(60, S.plift + v));
    if (['kh', 'btop', 'bund'].includes(k)) snapU();
    { const si = S.items.find((i) => i.id === sel); if (si && k === 'kh') si.h = Math.max(0, Math.min(60, kidH(si) + v * 0.5)); if (si && k === 'btop' && PP(si) && PP(si).board) setBoardTop(PP(si), (PP(si).top || 9) + v * 0.5); if (si && k === 'bund' && PP(si) && PP(si).board) { const B = PP(si); B.under = Math.max(0, Math.min(40, (B.under != null ? B.under : 8.5) + v * 0.5)); setBoardTop(B, B.top || 9); } }
    const X = xp(); if (k === 'xs_t') { X.stand.auto = false; X.stand.t = Math.max(6, Math.min(80, X.stand.t + v)); } if (k === 'xf_h') X.feet.h = Math.max(2, Math.min(15, X.feet.h + v)); if (k === 'xo_h') X.standoff.h = Math.max(2, Math.min(40, X.standoff.h + v)); if (k === 'xc_d') X.clip.d = Math.max(2, Math.min(16, X.clip.d + v));
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
    { const X = xp(); if (k === 'xs_a') { X.stand.a = +v; save(); render(); return; } if (k === 'xf_hole') { X.feet.hole = v === '1'; save(); render(); return; } if (k === 'xo_s') { X.standoff.s = v; save(); render(); return; } }
    if (k === 'brand') { S.brand = v; save(); render(); return; }
    if (k === 'walls') { S.walls = v; applyWalls(); reflow(); save(); render(); return; }
    if (k === 'layer') { S.layer = v; save(); render(); return; }
    if (k === 'magnets') S.magnets = v === '1'; else if (k === 'snap') S.snap = v === '1'; else if (k === 'spring') S.spring = v === '1';
    else if (k === 'lg_src') { L.logo.on = v !== 'off'; if (v !== 'off') L.logo.src = v; } else if (k === 'lg_face') { L.logo.face = v; L.logo.x = L.logo.y = null; } else if (k === 'lg_how') L.logo.how = v;
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
const cv = $('view'), g = cv.getContext('2d');
let view = null; // current 2D mapping for taps
function fit() { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d)); }
// The 3D box: steps that show a flat picture also show the case in 3D in the top right corner. Tap it to make it big.
let BIG3D = false, miniTimer = 0;
const native3d = () => { const t = curTab(); return (S.step === 2 && !isPanel()) || (S.step === 5 && t === '3d') || (S.step === 3 && t === 'colors'); };
const wantsMini = () => (S.step === 0 || S.step === 1 || S.step === 3 || S.step === 4 || (S.step === 2 && isPanel())) && (S.items.length > 0 || S.step === 3) && !$('con').classList.contains('down');
function draw() {
  const big = native3d() || BIG3D, mini = !big && wantsMini(), v3 = $('v3');
  v3.hidden = !(big || mini); v3.classList.toggle('mini', mini); cv.style.visibility = big ? 'hidden' : 'visible';
  if (T3) T3.controls.enabled = big;
  if (big) { requestAnimationFrame(() => draw3d(false)); return; }
  if (mini && !drag) { clearTimeout(miniTimer); miniTimer = setTimeout(() => draw3d(true), 160); }
  zmBar(); fit(); const W = cv.width, H = cv.height; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.fillStyle = '#e7e2d6'; g.fillRect(0, 0, W, H);
  if (S.step === 0) return curTab() === 'pins' ? drawPinout(W, H) : drawBrain(W, H);
  if (S.step === 1) { const t = curTab(); return drawPanel(t === 'size' || t === 'psize' ? homePanel() : t, W, H); }
  if (S.step === 2) return drawPanel(homePanel(), W, H);
  if (S.step === 3) return drawFace(W, H);
  if (S.step === 4) return drawBeds(W, H);
  drawBrain(W, H);
}
const px = () => Math.min(2, devicePixelRatio || 1);
const miniRoom = () => ($('v3').classList.contains('mini') && !$('v3').hidden ? 130 * px() : 0);
function frame(W, H, dW, dD) { // fit a flat picture, leaving room for the 3D box: beside it or under it, whichever is bigger
  const pad = 14 * px(), tagH = 46 * px(), rs = miniRoom(), aw = W - pad * 2, ah = H - pad * 2 - tagH;
  const kA = Math.min((aw - rs) / dW, ah / dD), kB = Math.min(aw / dW, (ah - rs) / dD);
  if (rs && kA > kB) return { k: kA, ox: pad + (aw - rs - dW * kA) / 2, oy: pad };
  return { k: kB, ox: (W - dW * kB) / 2, oy: pad + (rs && kB < Math.min(aw / dW, ah / dD) ? rs : 0) };
}
function tag(s) { $('tag').textContent = s; }
function drawBrain(W, H) {
  const d = px();
  if (PHOTO && PHOTO.complete && PHOTO.naturalWidth) { const k = Math.min(W / PHOTO.naturalWidth, H / PHOTO.naturalHeight); g.drawImage(PHOTO, (W - PHOTO.naturalWidth * k) / 2, (H - PHOTO.naturalHeight * k) / 2, PHOTO.naturalWidth * k, PHOTO.naturalHeight * k); }
  // the parts you picked, side by side at real size: your parts tray
  const P = PARTS(), list = S.items.filter((i) => P[i.type]);
  if (!list.length) { if (!PHOTO) { g.fillStyle = '#6f6a60'; g.font = '800 ' + 15 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; g.fillText('Your parts tray', W / 2, H / 2 - 8 * d); g.font = '600 ' + 12 * d + 'px -apple-system,Arial'; g.fillText('Snap your parts or pick them from the list', W / 2, H / 2 + 12 * d); } tag(PHOTO ? 'Your photo. Now add each part you see.' : 'Start with the brain: the parts that make it work'); return; }
  const pad = 10 * d, area = PHOTO ? { x: pad, y: H * 0.58, w: W - pad * 2, h: H * 0.42 - 44 * d } : { x: pad, y: pad, w: W - pad * 2 - miniRoom(), h: H - pad * 2 - 40 * d };
  if (PHOTO) { g.fillStyle = 'rgba(243,239,230,.92)'; g.fillRect(0, area.y - 6 * d, W, H - area.y + 6 * d); }
  // shelf pack at one shared scale so sizes compare
  let k = 3 * d; const pack = (kk) => { let x = 0, y = 0, rowH = 0; const out = []; list.forEach((i) => { const p = P[i.type], w = Math.max(p.w * kk + 8 * d, 58 * d), h = p.h * kk + 20 * d; if (x + w > area.w && x > 0) { x = 0; y += rowH + 6 * d; rowH = 0; } out.push({ i, x, y, w, h }); x += w + 6 * d; rowH = Math.max(rowH, h); }); return { out, h: y + rowH }; };
  let pk = pack(k); while (pk.h > area.h && k > 0.3) { k *= 0.9; pk = pack(k); }
  const N = numbers();
  pk.out.forEach((o) => {
    const p = P[o.i.type], x = area.x + o.x, y = area.y + o.y;
    g.fillStyle = '#fff'; g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.5 * d; g.beginPath(); g.roundRect ? g.roundRect(x, y, o.w, o.h, 8 * d) : g.rect(x, y, o.w, o.h); g.fill(); g.stroke();
    const cx = x + o.w / 2, cy = y + 4 * d + p.h * k / 2;
    drawPartAt(p, cx, cy, k, 0, false);
    g.fillStyle = '#1a1a1a'; g.font = '800 ' + 10 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; let lb = (N[o.i.id] || '') + ' ' + p.short; if (g.measureText(lb).width > o.w - 6 * d) lb = N[o.i.id] || p.short.slice(0, 5); g.fillText(lb, cx, y + o.h - 6 * d);
  });
  tag(list.length + (list.length === 1 ? ' part' : ' parts') + ', shown at the same scale. Next: Arrange.');
}
const PIMG = new Map();
function pimg(src) { let im = PIMG.get(src); if (!im) { im = new Image(); im.onload = () => draw(); im.src = src; PIMG.set(src, im); } return im.complete && im.naturalWidth ? im : null; }
function drawPartAt(P, cx, cy, k, rq, dim) {
  // real size drawing of a part: board, then what shows through the deck
  g.save(); g.translate(cx, cy); g.rotate(-(rq || 0) * Math.PI / 2);
  const c = P.cut || {}, d = px(), GA = drawPartAt.ga || 1; g.globalAlpha = GA;
  if (P.screen || P.inside || P.measured || !P.cut || c.o === 'rect' || c.o === 'slot') { g.fillStyle = P.screen ? '#22262a' : '#2f7a4b'; g.globalAlpha = (dim ? 0.35 : 0.9) * GA; g.fillRect(-P.w * k / 2, -P.h * k / 2, P.w * k, P.h * k); g.globalAlpha = GA; }
  const ph = P.img ? pimg(P.img) : null, pa = !dim ? 1 : S.step === 1 ? ({ clear: 0.95, faded: 0.4, off: 0 })[S.photo || 'off'] : 0.4; if (ph && pa) { g.globalAlpha = pa * GA; g.drawImage(ph, -P.w * k / 2, -P.h * k / 2, P.w * k, P.h * k); g.globalAlpha = GA; }
  (P.userCuts || []).forEach((u) => { const cc = u.cut, x = u.x * k, y = -u.y * k; g.fillStyle = cc.o === 'rect' ? 'rgba(143,211,255,.55)' : 'rgba(26,26,26,.55)'; g.strokeStyle = '#ffd23a'; g.lineWidth = 1.5 * d; g.beginPath();
    if (cc.o === 'rect') g.rect(x - cc.w / 2 * k, y - cc.h / 2 * k, cc.w * k, cc.h * k); else if (cc.o === 'cross') { g.rect(x - cc.w / 2 * k, y - cc.t / 2 * k, cc.w * k, cc.t * k); g.rect(x - cc.t / 2 * k, y - cc.w / 2 * k, cc.t * k, cc.w * k); } else g.arc(x, y, (cc.d || 6) / 2 * k, 0, 7);
    g.fill(); g.stroke(); });
  g.fillStyle = '#1a1a1a';
  if (P.screen) { g.fillStyle = '#8fd3ff'; if (c.o === 'circle') { g.beginPath(); g.arc(0, 0, c.d / 2 * k, 0, 7); g.fill(); } else g.fillRect(-c.w / 2 * k, -c.h / 2 * k, c.w * k, c.h * k); }
  else if (c.o === 'circle') { g.beginPath(); g.arc(0, 0, c.d / 2 * k, 0, 7); g.fill(); if (P.up > 9) { g.fillStyle = '#c8412f'; g.beginPath(); g.arc(0, 0, c.d / 2.6 * k, 0, 7); g.fill(); } }
  else if (c.o === 'cross') { g.fillRect(-c.w / 2 * k, -c.t / 2 * k, c.w * k, c.t * k); g.fillRect(-c.t / 2 * k, -c.w / 2 * k, c.t * k, c.w * k); }
  else if (c.o === 'slot') { g.fillRect(-c.w / 2 * k, -c.h / 2 * k, c.w * k, c.h * k); g.fillStyle = '#c8412f'; g.fillRect(-3 * k, -4 * k, 6 * k, 8 * k); }
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
    g.fillStyle = bad.has(it.id) ? 'rgba(255,214,0,.55)' : ins ? 'rgba(47,122,75,.28)' : 'rgba(255,255,255,.18)';
    g.fillRect(X(f.x0), Y(f.y1), f.w * k, f.h * k);
    g.strokeStyle = isSel ? '#fff' : bad.has(it.id) ? '#ffd23a' : ins ? '#1a1a1a' : 'rgba(255,255,255,.75)'; g.lineWidth = (isSel ? 3 : 1.5) * px(); g.strokeRect(X(f.x0), Y(f.y1), f.w * k, f.h * k);
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
  tag(PNAME[panel] + ', ' + (isPanel() ? d.W + ' x ' + d.D + ' x ' + S.pt + ' mm' + ((S.notches || []).length ? ', ' + S.notches.length + ' notch' + (S.notches.length > 1 ? 'es' : '') : '') + '. ' : S.cols + ' x ' + S.rows + ' squares (20 mm). ') + (probs.length ? probs.length + ' to fix (yellow).' : isPanel() ? 'Drag a part to move it.' : 'Drag to move. Dashed = inside, under the deck.'));
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
  if (S.step === 2 && isPanel() && view && curTab() === 'notch') { if (!(S.notches || []).length) { S.notches = [{ edge: 'bottom', shape: 'rrect', w: 20, d: 8, at: 0 }]; S.nsel = 0; } notchTo(mm(e)); drag = { notch: true }; cv.setPointerCapture(e.pointerId); draw(); return; }
  if (S.step === 3 && view && curTab() === 'logo' && S.look.logo.on) { const p = mm(e); S.look.logo.x = p[0]; S.look.logo.y = p[1]; drag = { logo: true }; cv.setPointerCapture(e.pointerId); draw(); return; }
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
  if (S.step === 1 && TOUCH.has(e.pointerId)) TOUCH.set(e.pointerId, cpx(e));
  if (pinch && TOUCH.size >= 2) { const [a, b] = [...TOUCH.values()]; zoomAt(pinch.z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); return; }
  if (!drag) return; const p = mm(e);
  if (drag.notch) { notchTo(p); draw(); return; }
  if (drag.logo) { S.look.logo.x = Math.round(p[0] * 2) / 2; S.look.logo.y = Math.round(p[1] * 2) / 2; draw(); return; }
  const c = cpx(e), far = Math.hypot(c[0] - drag.s0[0], c[1] - drag.s0[1]) > 8 * px();
  if (drag.pan) { if (far) drag.moved = true; if (drag.moved && AZ.z > 1) { AZ.px = drag.p0[0] + c[0] - drag.s0[0]; AZ.py = drag.p0[1] + c[1] - drag.s0[1]; draw(); } return; }
  if (!drag.moved) { if (!far) return; drag.moved = true; snapU(); } /* a tap never nudges a part by accident */
  const sn = drag.fine ? 0.5 : 2.5; drag.it.x = Math.round((p[0] + drag.dx) / sn) * sn; drag.it.y = Math.round((p[1] + drag.dy) / sn) * sn;
  if (drag.it.of != null) unSync(drag.it); if (PP(drag.it) && PP(drag.it).board) syncKids(drag.it); draw();
});
['pointerup', 'pointercancel'].forEach((t) => cv.addEventListener(t, (e) => {
  TOUCH.delete(e.pointerId); if (pinch) { if (TOUCH.size < 2) pinch = null; drag = null; return; }
  const dr = drag; drag = null; if (!dr) return;
  if (dr.notch || dr.logo) { save(); render(); return; }
  if (dr.pan) { if (!dr.moved && t === 'pointerup') { if (dr.add) { sel = dr.board.id; render(); pickAt(dr.board, dr.add); return; } if (dr.desel) { sel = null; render(); } } return; }
  if (dr.moved) { save(); render(); }
}));

function curFace() { const t = curTab(), L = S.look; if (t === 'logo') return L.logo.face; if (t === 'tex') return L.texFace === 'walls' ? 'top' : L.texFace; return 'top'; }
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
  const noLogo = curTab() === 'logo' && S.look.logo.on && !logoShape().length;
  tag(name + ', seen from outside. ' + (noLogo ? (S.look.logo.src === 'image' && !LOGOIMG ? 'Pick your logo picture below.' : 'No logo shape found yet.') : curTab() === 'logo' && S.look.logo.on ? 'Drag the logo to move it.' : curTab() === 'tex' && S.look.texFace === 'walls' ? 'Sides: the shaded ring shows where the ribs go.' : ''));
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
  wrap.addEventListener('click', () => { if (wrap.classList.contains('mini')) { BIG3D = true; draw(); } });
  return T3;
}
function mesh(geos, color) { const grp = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color, roughness: .85, flatShading: true, side: THREE.DoubleSide }); geos.forEach((gg) => { gg.computeVertexNormals(); grp.add(new THREE.Mesh(gg, mat)); }); return grp; }
function standIn(P, x, y, rq, top) { // a simple 3D stand-in for what shows above the deck: screen glass, button caps, D-pad
  const c = P.cut || {}; let m = null;
  if (P.screen || (c.o === 'rect' && P.isScreen)) { m = new THREE.Mesh(c.o === 'circle' ? new THREE.CylinderGeometry(c.d / 2, c.d / 2, 0.6, 40) : new THREE.BoxGeometry(((rq % 2) ? c.h : c.w), 0.6, ((rq % 2) ? c.w : c.h)), new THREE.MeshStandardMaterial({ color: 0x8fd3ff, emissive: 0x16323f })); m.rotation.x = Math.PI / 2; m.position.set(x, y, top - 1.2); }
  else if (c.o === 'circle' && P.up) { const rr = c.d / 2; m = new THREE.Mesh(new THREE.CylinderGeometry(rr * (P.up > 12 ? .55 : 1.05), rr * 1.1, Math.min(P.up, 14), 32), new THREE.MeshStandardMaterial({ color: P.up > 9 ? 0xf2ecd6 : 0x1a1a1a })); m.rotation.x = Math.PI / 2; m.position.set(x, y, top + Math.min(P.up, 14) / 2); }
  else if (c.o === 'cross') { m = mesh(G.dpadGeos(), 0x1a1a1a); m.position.set(x, y, top - 1.2); }
  return m;
}
function setHighlight(r) {
  // yellow see-through box: where the part you just added (or picked) sits and how deep it goes
  if (r.hl) { r.hl.parent && r.hl.parent.remove(r.hl); r.hl.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); r.hl = null; }
  const id = S.step === 1 ? sel : S.step === 0 ? LAST : null, sl = id != null && r.slots[id]; if (!sl) return;
  const geo = new THREE.BoxGeometry(sl.w + 1, sl.h + 1, sl.dep), box = new THREE.Group();
  const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: 0.5, depthTest: false })), edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x1a1a1a, depthTest: false }));
  fill.renderOrder = 998; edge.renderOrder = 999; box.add(fill, edge); box.position.set(sl.x, sl.y, sl.z); sl.grp.add(box); r.hl = box;
}
function draw3d(isMini) {
  // styling the lid's outside: show it closed, from above, the way people will see it
  const lidTop = S.step === 3 && curTab() !== 'colors' && curFace() === 'lidout', OPEN = S.open && !lidTop;
  const r = setup3d(), d = dims(), h = heights(), key = JSON.stringify([S.items, S.style, S.cols, S.rows, S.add, S.hinge, S.hside, S.magnets, OPEN, S.mine, S.look, S.snap, S.spring, S.walls, LOGOIMG ? LOGOIMG.src.length : 0]);
  if (isMini && (!$('v3').classList.contains('mini') || $('v3').hidden)) return; // left the flat view before the timer ran
  const mode = isMini ? 'mini' : 'big';
  if (r.key !== key) {
    r.key = key; r.slots = {}; r.hl = null;
    r.root.children.slice().forEach((c) => { r.root.remove(c); c.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); });
    PAINTED = true; let hs; try { hs = halves(); } finally { PAINTED = false; }
    hs.forEach((x) => {
      const grp = new THREE.Group();
      const c1 = new THREE.Color(S.look.c1).getHex(), c2 = new THREE.Color(S.look.c2).getHex();
      grp.add(mesh(G.layerGeos(x.built.tray, x.built.extra), c1));
      grp.add(mesh(G.layerGeos(x.built.deck), x.key === 'lid' ? 0x2a2a2a : 0xc8412f));
      if (x.built.inlay.length) grp.add(mesh(G.layerGeos(x.built.inlay.map((l) => ({ polys: l.polys, z0: l.z0 + (l.tag === 'inlayT' ? 0.02 : -0.02), z1: l.z1 + (l.tag === 'inlayT' ? 0.02 : -0.02) }))), c2));
      x.built.stick.forEach((st) => grp.add(mesh(G.layerGeos(st.layers), c2)));
      // stand ins for the parts so you can read it
      const parts = x.key === 'lid' ? itemsOn('lid') : itemsOn(x.key);
      const top = x.built.deckZ + R.LT, lid = x.key === 'lid';
      parts.concat(lid ? [] : S.items.filter((i) => i.panel === 'inside')).forEach((it) => {
        const P = PP(it); if (!P) return; const px0 = lid ? d.W - it.x : it.x, py0 = lid ? d.D - it.y : it.y, rq = ((it.r || 0) + (lid ? 2 : 0)) % 4;
        const f = fp(it), ins = it.panel === 'inside', dep = ins ? P.depth + 2 : P.depth + (P.up || 0);
        r.slots[it.id] = { grp, x: px0, y: py0, z: ins ? R.F + 2 + P.depth / 2 : top - P.depth / 2 + (P.up || 0) / 2, w: f.w, h: f.h, dep };
        if (P.board) { const bw = rq % 2 ? P.h : P.w, bh = rq % 2 ? P.w : P.h, pl = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 1.6), new THREE.MeshStandardMaterial({ color: 0x2f7a4b })); pl.position.set(px0, py0, top - R.LT - (P.hang || 6) - 0.8); grp.add(pl); return; } /* her board, inside under the top */
        if (ins) return;
        const m = standIn(P, px0, py0, rq, top); if (m) grp.add(m);
        // a board measured from a photo: every tagged part gets its stand-in too
        const a = rq * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
        (P.userCuts || []).forEach((u) => { const K = CZ.PARTS[u.kind] || {}, mm = standIn({ cut: u.cut, up: K.up, isScreen: u.kind === 'screen' }, px0 + u.x * ca - u.y * sa, py0 + u.x * sa + u.y * ca, rq, top); if (mm) grp.add(mm); });
      });
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
    r.root.position.set(-d.W / 2, 0, d.D / 2);
    r.fit = () => {
      const rad = Math.hypot(d.W, d.D, h.H + h.Hl + (OPEN ? d.D : 0)) / 2, v = r.camera.fov * Math.PI / 360, hz = Math.atan(Math.tan(v) * r.camera.aspect), dist = rad / Math.sin(Math.min(v, hz)) * (r.mode === 'mini' ? 1.0 : 1.15);
      r.controls.target.set(0, (h.H + (isClam() && OPEN ? d.D * 0.4 : h.Hl)) / 2, 0);
      // in Style, turn to the side being decorated: the lid's outside faces the back when it is open, the bottom faces down
      const f = S.step === 3 && curTab() !== 'colors' ? curFace() : 'top', dir = f === 'lidout' && isClam() ? [0.2, 1, 0.55] : f === 'bottom' ? [0.4, -0.85, 0.6] : [0.45, 0.7, 0.8];
      r.camera.position.copy(new THREE.Vector3(dir[0], dir[1], dir[2]).normalize().multiplyScalar(dist)).add(r.controls.target); r.controls.update();
    };
    r.mode = mode; r.view = mode + (S.step === 3 ? curFace() + curTab() : ''); r.fit();
  }
  r.controls.enabled = !isMini;
  const view = mode + (S.step === 3 ? curFace() + curTab() : '');
  if (r.mode !== mode || r.view !== view) { r.mode = mode; r.view = view; r.fit(); }
  setHighlight(r);
  r.draw();
  if (isMini) return;
  tag(summaryLine());
  const sb = $('sb'), flat = BIG3D && !native3d();
  sb.innerHTML = (flat ? '<button type="button" id="flatBtn" aria-pressed="true">Back to flat</button>' : '') + (isClam() && !lidTop ? '<button type="button" id="openBtn">' + (S.open ? 'Close it' : 'Open it') + '</button>' : '');
  sb.hidden = !sb.innerHTML; const ob = $('openBtn'); if (ob) ob.onclick = () => { S.open = !S.open; save(); render(); };
  const fb = $('flatBtn'); if (fb) fb.onclick = () => { BIG3D = false; draw(); };
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
    S.photo = 'off'; /* show the clean parts first; My photo brings the picture back */
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
const KSHORT = { tact12: 'Button', button16: 'Button', arcade24: 'Arcade', arcade30: 'Arcade', dpad: 'D-pad', pot: 'Knob', encoder: 'Wheel', thumb: 'Stick', led5: 'LED', speaker28: 'Speaker' };
function wiringItems() {
  // every part that needs a wire, numbered like the rest of the builder. Parts tagged on a board photo count one by one.
  const N = numbers(), out = [];
  S.items.filter((i) => PP(i) && PP(i).cat !== 'brain').sort((a, b) => String(N[a.id]).localeCompare(String(N[b.id]), undefined, { numeric: true })).forEach((i) => {
    const P = PP(i);
    if (P.userCuts && P.userCuts.length) P.userCuts.forEach((u, ci) => { if (NEED[u.kind]) out.push({ key: i.id + '.' + ci, label: N[i.id] + '.' + (ci + 1) + ' ' + (KSHORT[u.kind] || u.kind), type: u.kind }); });
    else if (NEED[i.type]) out.push({ key: String(i.id), label: N[i.id] + ' ' + P.short, type: i.type });
  });
  return out;
}
const BRAIN_NAMES = { pico: 'Raspberry Pi Pico', picow: 'Raspberry Pi Pico W', pico2: 'Raspberry Pi Pico 2', esp32: 'ESP32', other: 'your board brain' };
function brainInfo() {
  // the brain can be a part from the list, or the one she said is on her photographed board
  const b = S.items.find((i) => PP(i) && PP(i).cat === 'brain'); if (b) return { type: b.type, name: PP(b).name };
  const m = S.items.find((i) => PP(i) && PP(i).brain && PP(i).brain !== 'none'); if (m) return { type: PP(m).brain, name: BRAIN_NAMES[PP(m).brain] + ' (on your board)' };
  return null;
}
function wiring() { if (!S.pins) S.pins = {}; return planWiring(wiringItems(), S.pins); }
function pinsHtml() {
  const bi = brainInfo(), bp = bi;
  if (bi && PICO_BRAINS.indexOf(bi.type) < 0 && bi.type !== 'pico2') return '<p class="note" style="margin-top:0"><b>' + esc(bi.name) + '</b>: its wiring map comes next. Pico, Pico W and Pico 2 work now.</p>';
  const w = wiring(), list = wiringItems();
  if (!list.length) return '<p class="note" style="margin-top:0">Add buttons, knobs, screens or lights in Parts, or photo your built board in Snap. Each one gets its pins here.</p>';
  const opt = (k, cur) => '<select class="pin" data-pin="' + k + '">' + PICO_PINS.map((p) => '<option value="' + p + '"' + (p === cur ? ' selected' : '') + '>GP' + p + (w.used[p] && p !== cur ? ' *' : '') + '</option>').join('') + '</select>';
  let h = creditHtml() + '<div class="grid g2" style="margin:6px 0"><button class="btn dark" data-act="savecode">Save code.py</button><button class="btn" data-act="repin">Pick pins for me</button></div>' + '<p class="note" style="margin-top:0">' + (bp ? '<b>' + esc(bp.name) + '</b>.' : '<b>No brain picked</b>, showing a Raspberry Pi Pico.') + ' Every part gets its pins by the real rules. Soldered already? Pick the pins you used. * = taken. code.py is CircuitPython: buttons print their name, the screen shows what you press, knobs show 0 to 100. Steps are at the top of the file.</p>';
  const tagScr = S.items.filter((i) => PP(i) && (PP(i).userCuts || []).some((u) => u.kind === 'screen')).length; if (tagScr) h += '<p class="note"><span class="bad">A screen tagged on your board photo is not wired yet.</span> Which screen is it? Add it in Parts, Screens (2.8 in, round, OLED) and it gets its pins and code here.</p>';
  if (w.problems.length) h += '<p class="note">' + w.problems.map((x) => '<span class="bad">' + esc(x) + '</span>').join('<br>') + '</p>';
  h += '<div class="list" style="margin-top:6px">' + w.rows.map((r) => '<div class="it"><b>' + esc(r.it.label) + '</b>' + r.roles.map((x) => '<span class="pr">' + esc(x.role) + ' ' + (x.fixed || !x.k ? '<i>GP' + x.pin + '</i>' : opt(x.k, x.pin) + (x.two ? ' <i>+ GP' + (x.pin + 1) + '</i>' : '')) + '</span>').join('') + '<span class="pr">' + (r.power ? '+ to ' + r.power + ', ' : '') + 'GND to GND</span>' + (r.note ? '<small>' + esc(r.note) + '</small>' : '') + '</div>').join('') + '</div>';
  return h;
}
function drawPinout(W, H) {
  // the Pico from above, USB at the top: every pin labeled, used pins red with the part number beside them
  const d = px(), w = wiring(), who = {}; w.rows.forEach((r) => r.roles.forEach((x) => { if (x.pin != null) { const t = r.it.label.split(' ')[0]; who[x.pin] = (who[x.pin] ? who[x.pin] + ',' : '') + t; if (x.two) who[x.pin + 1] = (who[x.pin + 1] ? who[x.pin + 1] + ',' : '') + t; } }));
  const room = miniRoom(), aw = W - room, top = 14 * d, rowH = Math.min(22 * d, (H - top - 50 * d) / 20), bw = Math.min(110 * d, aw * 0.28), bx = (aw - bw) / 2, bh = rowH * 20 + 10 * d;
  g.fillStyle = '#2f7a4b'; g.fillRect(bx, top, bw, bh); g.fillStyle = '#9a958a'; g.fillRect(bx + bw / 2 - 12 * d, top - 8 * d, 24 * d, 12 * d);
  g.fillStyle = '#fff'; g.font = '900 ' + 12 * d + 'px -apple-system,Arial'; g.textAlign = 'center'; g.fillText('PICO', bx + bw / 2, top + bh / 2);
  const pinRow = (names, left) => names.forEach((nm, i) => {
    const y = top + 5 * d + rowH * (i + 0.5), x = left ? bx : bx + bw, num = /^GP(\d+)$/.test(nm) ? +nm.slice(2) : null, use = num != null && who[num];
    g.fillStyle = use ? '#c8412f' : nm.indexOf('GND') > -1 ? '#1a1a1a' : '#e9e2cc'; g.beginPath(); g.arc(x, y, 4.2 * d, 0, 7); g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 1 * d; g.stroke();
    g.font = (use ? '900 ' : '700 ') + 10 * d + 'px -apple-system,Arial'; g.textAlign = left ? 'right' : 'left'; g.fillStyle = use ? '#c8412f' : '#6f6a60';
    g.fillText(nm + (use ? '  ' + who[num] : ''), left ? x - 8 * d : x + 8 * d, y + 3.5 * d);
  });
  pinRow(PICO_LEFT, true); pinRow(PICO_RIGHT, false);
  tag(Object.keys(who).length + ' pins used of 26. ' + (w.problems.length ? w.problems.length + ' to fix.' : 'Plus GND for every part.'));
}

// ---------- printers, strength and time ----------
const LAYER = { draft: '0.28', normal: '0.2', fine: '0.12' };
let QRMSG = '';
function printerRow() { return CZ.PRINTERS.find((p) => p[0] === S.printer) || CZ.PRINTERS.find((p) => p[0] === 'custom'); }
function setPrinter(id) { const p = CZ.PRINTERS.find((x) => x[0] === id); if (!p) return; S.printer = id; S.brand = p[5]; if (id !== 'custom') S.bed = [p[2], p[3]]; }
const hm = (sec) => { const m = Math.max(10, Math.round(sec / 600) * 10), hh = Math.floor(m / 60), mm = m % 60; return (hh ? hh + ' h' : '') + (hh && mm ? ' ' : '') + (mm ? mm + ' min' : ''); };
function estimate(hsIn) {
  // plastic volume from the real layers, divided by how fast this printer really lays plastic, plus layer changes and heat up per plate
  const hs = hsIn || halves(); let vol = 0, layers = 0, pieces = 0;
  const lh = +LAYER[S.layer], flow = printerRow()[6] * ({ draft: 1.3, normal: 1, fine: 0.55 })[S.layer];
  hs.forEach((x) => { [x.built.tray, x.built.deck].forEach((L) => L.forEach((l) => { if (l.polys && l.polys.length) vol += Math.abs(G.area(l.polys)) * (l.z1 - l.z0); })); layers += (x.built.H || 20) / lh; pieces += plan(x.built).regs.length; });
  vol *= 1.04; // hinge barrels and small bits
  const dens = { pla: 1.24, petg: 1.27, abs: 1.05 }[S.material] || 1.24;
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
function xp() { if (!S.xp) S.xp = {}; const X = S.xp; X.stand = X.stand || { t: null, a: 25 }; if (X.stand.t == null) X.stand.auto = true; if (X.stand.auto) X.stand.t = isPanel() ? 20 : Math.round(heights().H); /* follows the case until she sets it */ X.feet = X.feet || { hole: true, h: 4 }; X.standoff = X.standoff || { s: 'm25', h: 8 }; X.clip = X.clip || { d: 6 }; return X; }
const XINFO = { stand: () => '2 stands, print on their side', feet: () => '4 feet', standoff: () => '4 standoffs', clip: () => '6 clips' };
function addonPolys(id) {
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
  if (id === 'feet') { const c = G.circle(0, 0, 7, 40); return { polys: X.feet.hole ? G.diff([c], [G.circle(0, 0, 1.7, 20)]) : [c], h: X.feet.h, n: 4 }; }
  if (id === 'standoff') return { polys: G.diff([G.circle(0, 0, 3.2, 32)], [G.circle(0, 0, X.standoff.s === 'm3' ? 1.3 : 1.1, 20)]), h: X.standoff.h, n: 4 };
  if (id === 'clip') { const ro = X.clip.d / 2 + 1.8, ri = X.clip.d / 2 + 0.3, gap = X.clip.d * 0.75;
    const ring = G.diff([G.circle(0, 0, ro, 48)], [G.circle(0, 0, ri, 48), G.rect(-gap / 2, 0, gap / 2, ro + 1)]);
    return { polys: G.union(ring.concat([G.rect(-ro - 5, -ro, ro + 5, -ro + 2.4)])), h: 8, n: 6 }; }
  return null;
}
function addonFile(id) {
  const a = addonPolys(id); if (!a) return null; const geos = [], b = G.bbox(a.polys), step = b.w + 4;
  for (let i = 0; i < a.n; i++) geos.push(...G.layerGeos([{ polys: a.polys.map((p) => p.map(([x, y]) => [x + i * step, y])), z0: 0, z1: a.h }]));
  return { name: 'casezero-' + id + '.stl', blob: G.stl(G.trisOf(geos), id) };
}
// ---------- the carrier board (Clean it) ----------
const PICOS = ['pico', 'picow', 'pico2'];
function pcbOn() { return !!S.pcb && !isPanel() && !S.items.some((i) => i.of != null) && S.items.some((i) => i.type === 'pico' || i.type === 'picow' || i.type === 'pico2'); } /* cheap on purpose: heights() asks this all the time */
function pcbWhy() { // null when a board can be made, else the plain reason
  if (isPanel()) return 'A panel has no floor to hold a board.';
  if (S.items.some((i) => i.of != null)) return 'Your parts are already soldered on your own board, so a second board has nothing to do here.';
  const b = S.items.find((i) => PP(i) && PP(i).cat === 'brain');
  if (!b) return 'Add a brain first (Brain, Parts). The board is made for a Raspberry Pi Pico, Pico W or Pico 2.';
  if (PICOS.indexOf(b.type) < 0) return 'The board is made for a Raspberry Pi Pico, Pico W or Pico 2 for now. Yours is the ' + PP(b).name + '.';
  const w = wiring(); if (!w.rows.length) return 'Add buttons, knobs, screens or lights first: the board connects them to the brain.';
  if (w.problems.length) return 'Fix this in Brain, Wire it, Wiring first: ' + w.problems[0];
  if (w.rows.some((r) => r.roles.some((x) => x.pin == null))) return 'A part has no pin yet. Fix it in Brain, Wire it, Wiring first.';
  return null;
}
const PADLBL = { press: 'SW', up: 'UP', down: 'DN', left: 'LT', right: 'RT', turn: 'SIG', slide: 'SIG', x: 'X', y: 'Y', light: 'LED+', data: 'DIN', sound: 'SPK+', signal: 'SIG' };
function padsFor(row) { // the pads one part gets, in the order its own pins usually sit. [what is printed next to the pad, which Pico pin it goes to]
  const N = row.N, Rr = {}, gp = (p) => 'GP' + p; row.roles.forEach((r) => { Rr[r.role] = r.pin; });
  if (N.spi) return [['3V3', '3V3'], ['GND', 'GND'], ['CS', gp(Rr.cs)], ['RST', gp(Rr.rst)], ['DC', gp(Rr.dc)], ['MOSI', gp(Rr.data)], ['SCK', gp(Rr.clock)], ['LED', '3V3']];
  if (N.i2c) return [['GND', 'GND'], ['3V3', '3V3'], ['SCL', gp(Rr.SCL)], ['SDA', gp(Rr.SDA)]];
  const out = [];
  row.roles.forEach((r) => { if (r.two) out.push(['CLK', gp(r.pin)], ['DT', gp(r.pin + 1)]); else out.push([PADLBL[r.role] || String(r.role).toUpperCase().slice(0, 4), gp(r.pin)]); });
  if (row.power) out.push([row.power === 'VBUS' ? '5V' : '3V3', row.power]);
  out.push(['GND', 'GND']); return out;
}
let PCB = null;
function boardBuild() {
  const why = pcbWhy(); if (why) return { ok: false, errors: [why] };
  const key = JSON.stringify([S.style, S.cols, S.rows, S.magnets, S.items.map((i) => [i.id, i.type, i.panel, Math.round(i.x * 10), Math.round(i.y * 10), i.r || 0]), S.pins]);
  if (PCB && PCB.key === key) return PCB.b;
  const d = dims(), br = S.items.find((i) => PP(i) && PP(i).cat === 'brain'), w = wiring(), big = (polys) => polys.slice().sort((a, b) => Math.abs(G.area([b])) - Math.abs(G.area([a])));
  // the board stays 0.8 mm off the inside of the wall. Magnet lids have bosses on the wall, so stay well clear of those.
  const keepPolys = big(G.offset(outline(), -(R.T + 0.8 + (isClam() && S.magnets ? 9 : 0)))), ps = posts().map(([x, y]) => ({ x, y, r: R.POSTR + 0.8 }));
  if (!keepPolys.length) return { ok: false, errors: ['This body is too small for a board.'] };
  const zones = S.items.filter((i) => i.panel === 'inside' && PP(i) && PP(i).cat !== 'brain').map((i) => { const P = PP(i), odd = (i.r || 0) % 2, hw = (odd ? P.h : P.w) / 2, hh = (odd ? P.w : P.h) / 2; return { x0: i.x - hw, y0: i.y - hh, x1: i.x + hw, y1: i.y + hh }; });
  const groups = w.rows.map((row) => { const it = S.items.find((i) => String(i.id) === String(row.it.key)); if (!it) return null; return { title: String(row.it.label).toUpperCase().replace(/[^A-Z0-9 +\-./]/g, ' '), x: it.x, y: it.panel === 'lid' ? d.D - 12 : it.y, pads: padsFor(row).map(([label, net]) => ({ label, net })) }; }).filter(Boolean);
  const pw = powerInfo(), b = makeBoard({ keepin: keepPolys[0], posts: ps, pico: { x: br.x, y: br.y, r: br.r || 0 }, zones, groups, diode: !!pw.mah && !S.items.some((i) => i.type === 'liposhim'),
    finalize: (r) => { const rc = [G.rect(r.x0, r.y0, r.x1, r.y1)], cut = G.diff(G.diff(keepPolys.slice(0, 1), G.diff(keepPolys.slice(0, 1), rc)), ps.map((q) => G.circle(q.x, q.y, q.r, 32))); return big(cut).filter((p) => Math.abs(G.area([p])) > 4); } });
  PCB = { key, b }; return b;
}
function boardReadme(b) {
  const L = ['NOCIV Case Zero carrier board', 'Size: ' + b.box.w.toFixed(1) + ' x ' + b.box.h.toFixed(1) + ' mm. 2 layers.', '',
    'ORDER', 'Upload this zip at a board factory (JLCPCB, PCBWay and others). Pick: 2 layers, 1.6 mm thick, any colour. Leave the rest as it is. They make 5 or more at a time.', 'The price you see there is the real one. Shipping often costs more than the boards.', '',
    'NOT FACTORY TESTED YET', 'The app checked these files twice (every gap, every connection), but NOCIV has not ordered and built this board yet. Order one small batch and test it before you count on it.', '',
    'SOLDER', '1. Pico: solder its two rows of pins into the two long rows of holes. The square marks pin 1. The USB plug goes to the end marked USB.'];
  if (b.diode) L.push('2. D1: a 1N5817 diode in the two holes joined by the arrow. The stripe on the diode goes to the end with the bar.', '3. Battery side (after the charger and the switch): plus to BAT+, minus to the GND next to it.');
  L.push((b.diode ? '4' : '2') + '. Every part: a short wire from each of its pins to the hole with the same name, right under the part.', '', 'PADS');
  b.rows.forEach((r) => { L.push(r.g.isDiode ? 'BATTERY IN: BAT+ and GND holes, then diode D1 into the Pico VSYS pin' : r.g.title + ': ' + r.g.pads.map((p) => p.label + ' -> ' + p.net).join(', ')); });
  L.push('', 'Screws: 4 x M2, 6 mm, into the posts on the case floor.');
  return L.join('\n');
}
function pcbHtml() {
  let h = '<p class="h" style="margin-top:0">Clean it: one board, no nest of wires</p>';
  const b = boardBuild();
  if (!b.ok) return h + '<p class="note"><span class="bad">' + esc(b.errors[0]) + '</span></p><p class="note">The board is one flat piece the Pico solders onto, with labelled holes right under every part. The app lays it out from your Arrange and your pins, then writes the files a board factory needs.</p>';
  const tall = (() => { const was = S.pcb; S.pcb = false; const a = heights().H; S.pcb = true; const c = heights().H; S.pcb = was; return c - a; })();
  h += boardSvg(b) + '<p class="note"><span class="ok">All ' + b.check.connected + ' pads connected and checked.</span> ' + b.box.w.toFixed(0) + ' x ' + b.box.h.toFixed(0) + ' mm, 2 layers. Yellow lines run on top, blue underneath. Smallest gap between two pieces of copper: ' + b.check.minGap.toFixed(2) + ' mm (factories need 0.13 to 0.2).</p>';
  h += '<div class="selbar"><b>Use it in my case</b>' + [['1', 'Yes'], ['0', 'No']].map((m) => '<button data-pcb="' + m[0] + '"' + ((S.pcb ? '1' : '0') === m[0] ? ' style="background:#1a1a1a;color:#fff"' : '') + '>' + m[1] + '</button>').join('') + '</div>';
  h += '<p class="note">' + (S.pcb ? 'On. The case floor has 4 posts for the board (M2 screws) and no posts for the Pico. ' + (tall > 0 ? 'The case is ' + tall + ' mm taller so the parts clear the board. ' : '') + 'Make your print files again in Body, Finish.' : 'Off. Turn it on and the case gets 4 posts for the board' + (tall > 0 ? ' and grows ' + tall + ' mm taller so the parts clear it' : '') + '.') + '</p>';
  h += '<button class="btn dark" data-act="saveboard" style="width:100%">Save the board files (zip)</button>';
  h += '<div class="list" style="margin-top:8px"><div class="it"><b>Order</b>Upload the zip at a board factory (JLCPCB, PCBWay). Pick 2 layers, 1.6 mm thick, leave the rest. They make 5 at a time. ' + (b.box.w > 100 || b.box.h > 100 ? 'This board is bigger than 100 x 100 mm, which costs more: a smaller body or parts closer together makes it cheaper.' : 'Boards under 100 x 100 mm like this one are the cheap size.') + ' The price on their page is the real one, and shipping often costs more than the boards.</div>' +
    '<div class="it"><b>Solder</b>The Pico into the two long rows (the square is pin 1, USB end is marked). Then a short wire from each part straight down to the holes with its name.' + (b.diode ? ' D1 is a 1N5817 diode: stripe to the bar. The battery side goes to BAT+ and the GND next to it.' : '') + '</div>' +
    '<div class="it"><b>New: not factory tested yet</b>The app checks every gap and every connection twice before it lets you save. But NOCIV has not ordered and built one of these boards yet. Order one small batch and test it before you count on it.</div></div>';
  return h;
}
// ---------- cost, shopping, power ----------
const money = (n) => '$' + (n >= 100 ? Math.round(n) : n.toFixed(n % 1 ? 2 : 0));
function shopRows() {
  // one row per kind of part. Parts already soldered on a photographed board are yours: nothing to buy. "Have it" takes a row off the bill.
  const P = PARTS(), m = {};
  S.items.forEach((i) => { const p = P[i.type]; if (!p || p.cat === 'mine') return; const r = m[i.type] || (m[i.type] = { t: i.type, p, n: 0, own: 0 }); r.n++; if (i.of != null) r.own++; });
  return Object.keys(m).map((t) => { const r = m[t]; r.have = !!S.have[t]; r.buy = r.have ? 0 : r.n - r.own; r.sum = r.buy * (r.p.price || 0); return r; });
}
function extraRows() {
  const P = PARTS(), out = [], loose = S.items.filter((i) => P[i.type] && P[i.type].cat !== 'mine' && i.of == null), wires = loose.some((i) => P[i.type].link !== 'plug' && (WIRES[i.type] == null || WIRES[i.type] > 0));
  if (wires) out.push({ t: 'x_wires', name: 'Jumper wires, 40 pack', each: 4 });
  if (wires && (S.how || 'push') === 'push') { const wp = wirePlan(); if (wp.hubs && wp.hubs.length) out.push({ t: 'x_lever', name: 'Lever connectors, 5 hole (' + wp.hubs.length + ')', each: Math.max(1, Math.round(wp.hubs.length * 0.7)) }); }
  if (!isPanel() && !S.snap && posts().length) out.push({ t: 'x_m3', name: 'M3 screws, 8 mm (small box)', each: 3 });
  if (isPanel() && S.phold === 'screws') out.push({ t: 'x_m3', name: 'M3 screws (small box)', each: 3 });
  if (isClam() && S.magnets) out.push({ t: 'x_mag', name: 'Round magnets 6 x 3 mm, 4 or more', each: 3 });
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
  return { mah, ma, hours: mah ? mah * 0.8 / ma : 0, charger: list.some((i) => P[i.type].charger), sw: list.some((i) => i.type === 'rocker' || i.type === 'liposhim'), pi: !!bi && (bi.type === 'pi5' || bi.type === 'zero2') };
}
function powerNote() {
  const p = powerInfo(); if (!S.items.length) return 'Add your parts first, then a battery: the run time depends on what it has to power.';
  if (!p.mah) return 'No battery yet: it runs from the USB cable. Add a battery and a charger to cut the cord. With these parts a 1200 mAh battery lasts about <b>' + hrs(1200 * 0.8 / p.ma) + '</b>.';
  let o = 'About <b>' + hrs(p.hours) + '</b> on a charge (a rough guess: ' + p.mah + ' mAh battery, parts pull about ' + p.ma + ' mA).';
  if (p.pi) o += ' <span class="bad">A Raspberry Pi needs 5 volts: a bare LiPo cannot run it.</span> Use a USB power bank or a Pi battery board instead.';
  else if (!p.charger) o += ' <span class="bad">Add a charger</span> so you can charge it: the Pico charger (uses the Pico plug) or the USB-C charger board (cheapest).';
  else if (!p.sw) o += ' Add the power switch so off really is off.';
  if (p.mah && !p.pi && !S.items.some((i) => i.type === 'liposhim')) o += ' <b>Put a 1N5817 diode between the battery side and the Pico VSYS pin</b>, stripe toward the Pico, so USB power can never push back into the battery. The board in Brain, Board has the spot for it.';
  if (p.charger && S.items.some((i) => i.type === 'tp4056')) o += ' In Arrange, slide the USB-C charger against a wall and Turn it so its plug faces out.';
  return o;
}
const hrs = (h) => (h >= 10 ? Math.round(h) + ' hours' : h >= 1 ? (Math.round(h * 2) / 2) + ' hours' : Math.max(5, Math.round(h * 12) * 5) + ' minutes');
const recipe = () => (S.recipe && (CZ.RECIPES || []).find((r) => r.id === S.recipe)) || null;
function creditHtml() {
  const r = recipe(); if (!r) return '';
  return '<div class="list" style="margin-top:8px"><div class="it"><b>' + esc(r.name) + ': the code</b>Comes from <a href="' + esc(r.credit.url) + '" target="_blank" rel="noopener" style="display:inline;padding:0;border:0;text-decoration:underline">' + esc(r.credit.project) + '</a> by ' + esc(r.credit.by) + ' (license: ' + esc(r.credit.license) + '). Their work, their credit. Our starter code in Brain, Wire it, Wiring only proves your wiring works.<small>' + esc(r.note) + (r.tested ? '' : ' Not test-built by NOCIV yet.') + '</small></div></div>';
}
function shopHtml() {
  const c = cost(); if (!S.items.length) return '<p class="note" style="margin-top:0">Nothing to buy yet. Add parts in Brain, or pick a recipe on the start screen.</p>';
  const link = (p) => (p.url ? '<a href="' + esc(p.url) + '" target="_blank" rel="noopener" style="display:inline;padding:0;border:0;text-decoration:underline">Maker page</a>' : '<a href="https://www.google.com/search?tbm=shop&q=' + encodeURIComponent(p.find || p.name) + '" target="_blank" rel="noopener" style="display:inline;padding:0;border:0;text-decoration:underline">Search shops</a>');
  const haveBtn = (t, on) => '<button data-have="' + t + '" style="all:unset;cursor:pointer;float:right;padding:6px 9px;border:1.5px solid #1a1a1a;border-radius:9px;font:800 11.5px/1 var(--sys);' + (on ? 'background:#1a1a1a;color:#fff' : '') + '">' + (on ? 'Have it' : 'I have this') + '</button>';
  let h = '<div class="est"><b>About ' + money(c.total) + ' to build</b><span>' + money(c.parts) + ' parts + ' + money(c.extras) + ' small stuff + ' + money(c.plastic) + ' plastic. Shipping is extra: buy from as few shops as you can so you pay it once. Prices are typical, not live.</span></div>';
  h += '<p class="note" style="margin:6px 0 8px">' + powerNote() + '</p>';
  h += '<div class="list">' + c.rows.map((r) => '<div class="it">' + haveBtn(r.t, r.have) + '<b>' + r.n + ' x ' + esc(r.p.name) + '</b>' + (r.have ? 'You have it: $0.' : r.own ? (r.own === r.n ? 'Already on your board: $0.' : r.own + ' already on your board. ' + money(r.sum) + ' for the other ' + r.buy + '.') : money(r.p.price || 0) + ' each, ' + money(r.sum) + '.') + ' ' + link(r.p) + (r.p.check ? '<small>Sizes differ by seller. Measure yours before you print.</small>' : '') + '</div>').join('') +
    c.ex.map((r) => '<div class="it">' + haveBtn(r.t, r.have) + '<b>' + esc(r.name) + '</b>' + (r.have ? 'You have it: $0.' : 'About ' + money(r.each) + '.') + '</div>').join('') + '</div>';
  h += '<button class="btn" data-act="savelist" style="margin-top:8px">Save the shopping + build list</button>';
  h += '<p class="h" style="margin-top:12px">How far to take it</p><div class="list"><div class="it"><b>1. Wire it <span class="ok">this build</span></b>The brain board plus loose wires. Cheapest for one device: ' + money(c.total) + '.</div><div class="it"><b>2. Clean it <span class="ok">' + (pcbOn() ? 'on' : 'ready to try') + '</span></b>One flat board the Pico solders onto, with labelled pads under every part. Short wires straight down, no nest. Factories make 5 at a time, so it pays when you build a few or split a batch. It is in Brain, Board.</div><div class="it"><b>3. Chip it <span style="color:#6f6a60">later</span></b>Your own board with the bare chip on it, soldered by the factory. The cheapest per device once you make a batch, not for one.</div></div>';
  return h + creditHtml();
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
  S.items = []; S.pins = {}; S.have = {}; sel = null; LAST = null; UNDO.length = 0;
  S.style = r.style; const z = r.size || SIZES[r.style]; S.cols = z[0]; S.rows = z[1]; S.add = r.add || 0; S.recipe = r.id; S.picked = true; S.started = true; S.pcb = false; S.wired = {};
  const mk = (t, x, y, rq) => { const P = CZ.PARTS[t]; if (P) S.items.push({ id: ++uid, type: t, panel: defaultPanel(P), x, y, r: rq || 0 }); };
  if (r.place) r.place.forEach(([t, x, y, rq]) => mk(t, x, y, rq)); /* a hand-made layout, in mm from the bottom left */
  else r.parts.forEach(([t, n]) => { for (let i = 0; i < n; i++) mk(t, -999, -999, 0); });
  if (!r.place || allProblems().length) fitAll(); /* no layout, or it does not fit after a size change in the list: place them for her */
  LAST = null; S.tab[2] = 'shape'; S.tab[5] = '3d'; save(); go(2);
}
const recipeCost = (r) => r.parts.reduce((a, [t, n]) => a + ((CZ.PARTS[t] && CZ.PARTS[t].price) || 0) * n, 0);
// ---------- start: three doors ----------
function showStart() {
  $('sheetIn').innerHTML = '<h2>Build your own device</h2><div class="list">' +
    '<button class="btn start" data-door="known"><b>Make something known</b>Beat maker, DJ pad, game handheld, desk assistant. You start with the shape, the parts and where the code comes from. Change anything.</button>' +
    '<button class="btn start" data-door="new"><b>Make something new</b>Your own idea. Start with an empty body, play with the shape, add any parts.</button>' +
    '<button class="btn start" data-door="have"><b>I already have parts</b>Photo your board or your parts. The case gets built around them.</button></div>' +
    (S.items.length ? '<button class="btn" data-door="close" style="margin-top:10px">Keep working on my build</button>' : '');
  $('sheet').hidden = false;
}
function showNew() {
  $('sheetIn').innerHTML = '<h2>Something new</h2><div class="list">' +
    '<button class="btn start" data-go="case"><b>A whole device</b>Box, lid, handheld, controller, cyberdeck. Pick a shape, then fill it.</button>' +
    '<button class="btn start" data-go="panel"><b>A panel for a box I have</b>One flat piece with a screen window, holes and notches for wires.</button>' +
    '<button class="btn start" data-go="part"><b>One part</b>Stand, feet, standoffs, cable clips, knobs.</button></div><button class="btn" data-door="back" style="margin-top:10px">Back</button>';
}
function showRecipes() {
  $('sheetIn').innerHTML = '<h2>Pick one to start from</h2><div class="list">' + (CZ.RECIPES || []).map((r) =>
    '<button class="btn start" data-recipe="' + r.id + '"><b>' + esc(r.name) + ' <span style="font:800 11px/1 var(--sys);letter-spacing:0;text-transform:none;color:#6f6a60">' + esc(r.level) + ', about ' + money(recipeCost(r)) + ' in parts</span></b>' + esc(r.line) + '<span style="display:block;margin-top:5px;font:600 11.5px/1.3 var(--sys);color:#6f6a60">Code: ' + esc(r.credit.project) + ' by ' + esc(r.credit.by) + '.' + (r.tested ? '' : ' Not test-built by NOCIV yet.') + '</span></button>').join('') +
    '</div><p class="note">Every recipe is someone\'s open project. We lay out the body and the parts, and send you to their code with their name on it.</p><button class="btn" data-door="back" style="margin-top:10px">Back</button>';
}
$('sheetIn').addEventListener('click', (e) => {
  const dr = e.target.closest('[data-door]'), rc = e.target.closest('[data-recipe]'), ok = e.target.closest('[data-rok]');
  if (dr) { const v = dr.dataset.door;
    if (v === 'known') showRecipes(); else if (v === 'new') showNew(); else if (v === 'back') showStart();
    else if (v === 'close') { S.started = true; save(); $('sheet').hidden = true; }
    else if (v === 'have') { S.started = true; $('sheet').hidden = true; S.tab[0] = 'snap'; go(0); }
    return; }
  if (rc) { const r = CZ.RECIPES.find((x) => x.id === rc.dataset.recipe);
    if (S.items.length) { $('sheetIn').innerHTML = '<h2>Start the ' + esc(r.name) + '?</h2><p class="note" style="font-size:14px">This replaces the ' + S.items.length + ' part' + (S.items.length > 1 ? 's' : '') + ' in the build you have now.</p><div class="list" style="margin-top:10px"><button class="btn start" data-rok="' + r.id + '"><b>Replace my build</b>Start fresh with the ' + esc(r.name) + '.</button><button class="btn start" data-door="close"><b>Keep my build</b>Go back to what I was making.</button></div>'; return; }
    $('sheet').hidden = true; tag('Building your ' + r.name + '...'); setTimeout(() => loadRecipe(r.id), 40); return; }
  if (ok) { $('sheet').hidden = true; tag('Building it...'); const id = ok.dataset.rok; setTimeout(() => loadRecipe(id), 40); return; }
  const b = e.target.closest('[data-go]'); if (!b) return; const g = b.dataset.go; S.started = true; $('sheet').hidden = true;
  if (g === 'panel') { if (!isPanel()) { S.style = 'panel'; reflow(); } S.tab[2] = 'psize'; go(2); }
  else if (g === 'part') { S.tab[5] = 'extras'; go(5); }
  else { if (isPanel()) { S.style = 'clam'; S.cols = 9; S.rows = 6; reflow(); } S.tab[2] = 'shape'; go(2); }
});

// ---------- files ----------
let FILES = [];
function makeFiles() {
  const out = $('fileList'); out.innerHTML = '<p class="note">Making...</p>';
  setTimeout(() => {
    const files = [], hs = halves(), wood = S.material === 'wood';
    hs.forEach((x) => {
      const pl = plan(x.built), n = pl.regs.length, nm = x.name.toLowerCase();
      if (wood) {
        files.push({ label: x.name + ' top (deck) template', name: 'casezero-' + nm + '-deck.svg', blob: new Blob([G.svgOf(x.built.deck.filter((l) => l.tag === 'deck')[0].polys, x.name + ' deck')], { type: 'image/svg+xml' }) });
        files.push({ label: x.name + ' bottom template', name: 'casezero-' + nm + '-bottom.svg', blob: new Blob([G.svgOf(x.built.out, x.name + ' bottom')], { type: 'image/svg+xml' }) });
        return;
      }
      const tray = G.cutLayers(x.built.tray, x.built.extra, pl.regs), deck = G.cutLayers(x.built.deck, [], pl.regs), top = x.built.deckZ + R.LT;
      const inB = G.cutLayers(x.built.inlay.filter((l) => l.tag === 'inlayB'), [], pl.regs), inT = G.cutLayers(x.built.inlay.filter((l) => l.tag === 'inlayT'), [], pl.regs);
      tray.forEach((p, i) => { let tris = G.trisOf(G.layerGeos(p.layers, p.extra)); if (isPanel() && S.plift > 0) tris = G.flipZ(tris, S.pt); if (tris.length) files.push({ label: x.name + (isPanel() ? ' piece ' : ' box ') + (i + 1) + (n > 1 ? ' of ' + n : ''), name: 'casezero-' + nm + (isPanel() ? '-' : '-box-') + (i + 1) + '.stl', blob: G.stl(tris, nm + ' box ' + (i + 1)) }); });
      deck.forEach((p, i) => { const tris = G.trisOf(G.layerGeos(p.layers)); if (tris.length) files.push({ label: x.name + ' deck ' + (i + 1) + (n > 1 ? ' of ' + n : ''), name: 'casezero-' + nm + '-deck-' + (i + 1) + '.stl', blob: G.stl(G.flipZ(tris, top), nm + ' deck ' + (i + 1)) }); });
      inB.forEach((p, i) => { let tris = G.trisOf(G.layerGeos(p.layers)); if (isPanel() && S.plift > 0) tris = G.flipZ(tris, S.pt); if (tris.length) files.push({ label: x.name + ' box ' + (i + 1) + ' marks color', name: 'casezero-' + nm + '-box-' + (i + 1) + '-color2.stl', blob: G.stl(tris, nm + ' box marks') }); });
      inT.forEach((p, i) => { const tris = G.trisOf(G.layerGeos(p.layers)); if (tris.length) files.push({ label: x.name + ' deck ' + (i + 1) + ' marks color', name: 'casezero-' + nm + '-deck-' + (i + 1) + '-color2.stl', blob: G.stl(G.flipZ(tris, top), nm + ' deck marks') }); });
      if (x.built.stick.length) { const geos = []; let ox = 0; x.built.stick.forEach((st) => { const gs = G.layerGeos(st.layers.map((l) => ({ polys: l.polys, z0: 0, z1: l.z1 - l.z0 }))); gs.forEach((gg) => { gg.translate(ox, 0, 0); geos.push(gg); }); ox += 2; }); files.push({ label: x.name + ' glue-on pieces', name: 'casezero-' + nm + '-glue-pieces.stl', blob: G.stl(G.trisOf(geos), nm + ' glue pieces') }); }
      const dks = x.built.deck.filter((l) => l.tag === 'deck'); if (dks.length) files.push({ label: x.name + ' test fit (1 mm)', name: 'casezero-' + nm + '-test-fit.stl', blob: G.stl(G.trisOf(G.layerGeos([{ polys: dks[dks.length - 1].polys, z0: 0, z1: 1 }])), nm + ' test fit') });

    });
    const extraOf = (k) => S.items.reduce((n, i) => n + ((PP(i) && PP(i).prints && PP(i).prints[k]) || 0), 0);
    const knobs = S.items.filter((i) => PP(i) && PP(i).printed === 'knob').length + extraOf('knob'), pads = S.items.filter((i) => PP(i) && PP(i).printed === 'dpad').length + extraOf('dpad');
    if (!wood && knobs) { const geos = []; for (let i = 0; i < knobs; i++) { const kg = G.knobGeo(); kg.translate(i * 24, 0, 0); geos.push(kg); } files.push({ label: knobs + (knobs > 1 ? ' knobs' : ' knob'), name: 'casezero-knobs.stl', blob: G.stl(G.trisOf(geos), 'knobs') }); }
    if (!wood && pads) { const geos = []; for (let i = 0; i < pads; i++) G.dpadGeos().forEach((gg) => { gg.translate(i * 40, 0, 1.5); geos.push(gg); }); files.push({ label: pads + ' D-pad', name: 'casezero-dpad.stl', blob: G.stl(G.trisOf(geos), 'dpad') }); }
    files.push({ label: 'Parts + build list', name: 'casezero-parts.txt', blob: new Blob([partsText()], { type: 'text/plain' }) });
    FILES = files; out.innerHTML = files.map((f, i) => '<button type="button" class="btn" data-f="' + i + '">Save ' + esc(f.label) + '</button>').join('');
  }, 30);
}
function partsText() {
  const N = numbers(), P = PARTS(), d = dims(), h = heights(), lines = ['NOCIV Case Zero', styleRow()[1] + ', ' + d.W.toFixed(0) + ' x ' + d.D.toFixed(0) + ' mm, ' + h.H + ' mm deep' + (isClam() ? ' + ' + h.Hl + ' mm lid' : ''), ''];
  lines.push('PARTS'); S.items.filter((i) => P[i.type]).sort((a, b) => (N[a.id] > N[b.id] ? 1 : -1)).forEach((i) => { const p = P[i.type]; lines.push(N[i.id] + '  ' + p.name + '  [' + LK[p.link] + ']  ' + (p.src || '')); });
  lines.push('', 'HARDWARE', isPanel() ? (posts().length ? posts().length + ' x M3 screws to fix the panel in the box' : 'No screws: the panel drops in') : posts().length * panels().length + ' x M3 screws, 8 mm (deck to box)');
  if (isClam() && S.magnets) lines.push('4 x round magnets 6 x 3 mm (press in, glue if loose. Check they attract before gluing the second pair)');
  if (isClam() && S.hinge === 'printed') lines.push('1 x 1.75 mm filament, cut ' + Math.round((S.style === 'small' ? d.D : d.W) - 12) + ' mm long, as the hinge pin');
  if (isClam() && S.hinge === 'metal') lines.push('2 x 25 mm butt hinges + short wood screws');
  if (S.items.some((i) => P[i.type] && P[i.type].inside)) lines.push('4 x M2 screws, 5 mm (brain to its posts)');
  { const c = cost(), r = recipe(); lines.push('', 'SHOPPING (typical prices, not live. Shipping is extra)'); c.rows.forEach((x) => lines.push((x.buy ? x.buy + ' x ' : 'have  ') + x.p.name + (x.buy ? '  ' + money(x.sum) : '') + (x.p.url ? '  ' + x.p.url : ''))); c.ex.forEach((x) => lines.push((x.have ? 'have  ' : '1 x ') + x.name + (x.have ? '' : '  about ' + money(x.each)))); lines.push('Plastic: about ' + money(c.plastic), 'TOTAL: about ' + money(c.total)); const pw = powerInfo(); if (pw.mah) lines.push('Battery: about ' + hrs(pw.hours) + ' on a charge (rough guess)'); if (r) lines.push('', 'CODE AND CREDIT', r.name + ': ' + r.credit.project + ' by ' + r.credit.by + '. License: ' + r.credit.license + '.', r.credit.url, r.note); }
  if (pcbOn()) { const Bd = boardBuild(); if (Bd.ok) lines.push('', 'BOARD (Clean it)', 'Carrier board ' + Bd.box.w.toFixed(0) + ' x ' + Bd.box.h.toFixed(0) + ' mm, 2 layers. Save its files in Brain, Board. 4 x M2 screws hold it on the floor posts.'); }
  lines.push('', 'PRINTING', 'Material: ' + S.material.toUpperCase() + '. Join: ' + CZ.JOINS[S.join][0] + '. Bed: ' + S.bed[0] + ' x ' + S.bed[1] + ' mm.', (isPanel() ? 'Panel: flat, front face up, no supports' : 'Box: open side up, no supports') + (isClam() && S.hinge === 'printed' ? ' (turn on supports for the hinge barrels only)' : '') + '. Deck: face down, no supports. ' + LAYER[S.layer] + ' mm layers, 4 walls, 15 percent infill. Walls: ' + (S.walls === 'tough' ? 'thick (3.2 mm)' : 'normal (2.4 mm)') + '.', (S.material === 'wood' ? '' : 'Time on ' + printerRow()[1] + ': about ' + hm(estimate().sec) + ', ' + Math.round(estimate().grams) + ' g. Your slicer has the exact time.'), 'Print the deck first and check every part fits its hole.');
  return lines.join('\n');
}
function saveFile(f) {
  if (!f) return; const file = new File([f.blob], f.name, { type: f.blob.type });
  if (matchMedia('(pointer:coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file] }).catch(() => {}); return; }
  const u = URL.createObjectURL(f.blob), a = document.createElement('a'); a.href = u; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
}

// ---------- learn ----------
const LEARN = [
  ['Start here', '<ul><li><b>Make something known</b>: pick a recipe. It loads a shape and a parts list, and names the open project its code comes from.</li><li><b>Make something new</b>: an empty body for your own idea.</li><li><b>I already have parts</b>: photo your board. The case is sized to it.</li><li>Two rooms, at the top: <b>Body</b> is what holds it, <b>Brain</b> is what it does. Switch any time.</li><li>Each room is a few pages with one job each. The red Next button takes you on, Back takes you back.</li><li>The tools sit in the sheet at the bottom. Tap its top edge to drop it and see your device full screen. Tap again to bring it back.</li><li><b>Brain, Shop</b>: what to buy, what it costs, how long a battery lasts. Tap I have this on anything you own.</li></ul>'],
  ['Recipes and credits', '<ul>' + (CZ.RECIPES || []).map((r) => '<li><b>' + r.name + '</b>: ' + r.credit.project + ' by ' + r.credit.by + ', license ' + r.credit.license + '. <a href="' + r.credit.url + '" target="_blank" rel="noopener">Their page</a>. ' + r.note + '</li>').join('') + '<li>We do not copy their code into this app. We send you to it, with their name on it.</li><li>Not test-built by NOCIV yet means we have not built that recipe ourselves. Check their parts list before you buy.</li></ul>'],
  ['Wire it: no breadboard', '<ul><li>Brain, Wire it. Pick how you join things: push-on wires (no solder), solder, or the board.</li><li>You get one wire at a time: from this pin on the part, to this pin on the Pico, with a picture of which pin.</li><li>After each part there is a test. The small light on the Pico turns on when a button is pressed, so you can test with no screen and no computer.</li><li>Tick each step. The count at the top shows how far you are.</li><li>Push-on wires need a Pico with its pins already on (Pico H or WH). Parts with bare legs need wires already on, spade plugs or a lever connector.</li><li>When more parts need ground than the Pico has ground pins, the guide adds a hub: a lever connector that joins wires with no solder.</li><li>You put the test code on the Pico once, from a computer. After that any USB charger powers it.</li></ul>'],
  ['The board (Clean it)', '<ul><li>Brain, Board. For a Raspberry Pi Pico, Pico W or Pico 2.</li><li>One flat board. The Pico solders onto it. Every part gets a row of labelled holes right under it, already connected to the right Pico pins.</li><li>The app lays it out from Arrange and from your pins in Brain, Wire it, Wiring. Move a part or change a pin and the board changes.</li><li>Before you can save, the app measures every gap and follows every connection. If anything is off, there are no files.</li><li>Turn on Use it in my case and the case gets posts for the board.</li><li>Board factories make 5 at a time, so it pays when you build a few or share a batch.</li><li>Not factory tested by NOCIV yet. Order a small batch first.</li></ul>'],
  ['Battery power', '<ul><li>Brain, Parts, Power: a flat LiPo battery, a charger and a switch.</li><li>Easiest for a Pico: the Pico charger. It solders to the back of the Pico and charges through the Pico plug.</li><li>Cheapest: the USB-C charger board. It gets its own opening in the wall: slide it against a wall in Arrange.</li><li>The run time shown is a rough guess from typical numbers.</li><li>With the USB-C charger board, put a 1N5817 diode between the battery side and the Pico VSYS pin, stripe toward the Pico. Without it, USB power can push back into the battery.</li><li>Be careful with LiPo batteries: buy one with a protection circuit, tape it down, never crush, bend or poke it, and check red and black before plugging in.</li><li>A Raspberry Pi needs 5 volts. Use a USB power bank, not a bare LiPo.</li></ul>'],
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
  ['Make it move', '<p>Character shape plus a mini servo (Movement) turns a head, an arm or the eyes. Plan the moves in the <a href="/creator-tools.html#cartoon">Cartoon maker</a> first, then a Pico runs them.</p>']
];
function openHelp() { $('sheetIn').innerHTML = '<button class="x" id="sheetX" aria-label="Close">&times;</button><h2>Help and Learn</h2>' + LEARN.map((l, i) => '<details' + (i === 0 ? ' open' : '') + '><summary>' + l[0] + '</summary>' + l[1] + '</details>').join(''); $('sheet').hidden = false; $('sheetX').onclick = () => { $('sheet').hidden = true; }; }
$('helpTop').onclick = openHelp;
$('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) $('sheet').hidden = true; });
window.addEventListener('resize', draw);

window.__cz = { wiring, codeFor, get S() { return S; }, get view() { return view; }, AZ, get UNDO() { return UNDO.length; }, halves, plan, makeFiles, get FILES() { return FILES; }, allProblems, G, addPart, go, render, dims, heights, addonFile, showStart, loadRecipe, cost, boardBuild, boardFiles, boardReadme };
render();
if (!S.started && !S.items.length) showStart();
// arriving from the Case Zero page: /casezero/build/?room=brain opens that room
{ const rq = new URLSearchParams(location.search).get('room'); if ((rq === 'brain' || rq === 'body') && PAGES[S.page || 0].room !== rq) goRoom(rq); }
