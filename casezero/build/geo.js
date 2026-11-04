// Case Zero geometry. Everything is flat layers in millimeters (a polygon set stacked between two heights),
// so any outline works, holes are exact, and the same layers can be cut into puzzle pieces for any printer bed.
// Uses ClipperLib (Boost license, /vendor/clipper) for the 2D math and three.js only to triangulate.
import * as THREE from 'three';
const CL = window.ClipperLib, SC = 1000; // clipper works in integers, 1 unit = 1/1000 mm

export const RULE = { T: 2.4, F: 2.0, LT: 2.4, POSTR: 3.6, PILOT: 2.5, HOLE: 3.4, CLR: 0.3, MAG: 6.3, MAGD: 3.2, KR: 4.2, PIN: 2.1 };

// ---------- polygon helpers ----------
const toC = (poly) => poly.map(([x, y]) => ({ X: Math.round(x * SC), Y: Math.round(y * SC) }));
const fromC = (path) => path.map((p) => [p.X / SC, p.Y / SC]);
export function circle(cx, cy, r, n) { n = n || Math.max(24, Math.min(96, Math.round(r * 6))); const o = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; }
export function rect(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
export function rrect(x0, y0, x1, y1, r, rs) {
  // rs = per corner radii [bl, br, tr, tl] (y up)
  const R = rs || [r, r, r, r], o = [], seg = 10;
  const corner = (cx, cy, rad, a0) => { if (rad <= 0.01) { o.push([cx, cy]); return; } for (let i = 0; i <= seg; i++) { const a = a0 + i / seg * Math.PI / 2; o.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } };
  corner(x0 + R[0], y0 + R[0], R[0], Math.PI); if (R[0] <= 0.01) o[o.length - 1] = [x0, y0];
  corner(x1 - R[1], y0 + R[1], R[1], -Math.PI / 2); if (R[1] <= 0.01) o[o.length - 1] = [x1, y0];
  corner(x1 - R[2], y1 - R[2], R[2], 0); if (R[2] <= 0.01) o[o.length - 1] = [x1, y1];
  corner(x0 + R[3], y1 - R[3], R[3], Math.PI / 2); if (R[3] <= 0.01) o[o.length - 1] = [x0, y1];
  return o;
}
function clip(type, subj, cl) {
  const c = new CL.Clipper(), out = new CL.Paths();
  c.AddPaths(subj.map(toC), CL.PolyType.ptSubject, true);
  if (cl && cl.length) c.AddPaths(cl.map(toC), CL.PolyType.ptClip, true);
  c.Execute(type, out, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
  return out.map(fromC);
}
export const union = (a, b) => clip(CL.ClipType.ctUnion, a, b || []);
export const diff = (a, b) => (b && b.length ? clip(CL.ClipType.ctDifference, a, b) : union(a));
export const inter = (a, b) => clip(CL.ClipType.ctIntersection, a, b);
export function offset(polys, d) {
  const co = new CL.ClipperOffset(2, 0.05 * SC), out = new CL.Paths();
  co.AddPaths(polys.map(toC), CL.JoinType.jtRound, CL.EndType.etClosedPolygon);
  co.Execute(out, d * SC);
  return out.map(fromC);
}
export function area(polys) { return polys.reduce((s, p) => s + CL.Clipper.Area(toC(p)) / SC / SC, 0); }
export function bbox(polys) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; polys.forEach((p) => p.forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); })); return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }; }
export function inside(inner, outer) { return area(diff(inner, outer)) < 0.5; }
const rot = (p, a, cx, cy) => p.map(([x, y]) => { const c = Math.cos(a), s = Math.sin(a), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; });

// ---------- the outline of each body style ----------
// W x D is the outside size. Returns one polygon, y goes up (front of the device is y = 0).
export function outline(style, W, D) {
  if (style === 'face') return [circle(W / 2, D / 2, Math.min(W, D) / 2, 96).map(([x, y]) => [W / 2 + (x - W / 2) * (W / Math.min(W, D)), D / 2 + (y - D / 2) * (D / Math.min(W, D))])];
  if (style === 'calc') return [rrect(0, 0, W, D, 10)];
  if (style === 'hand') return [rrect(0, 0, W, D, 6, [Math.min(W, D) * 0.2, 6, 6, 6].map((v, i) => (i === 1 ? Math.min(W, D) * 0.22 : v)))];
  if (style === 'pad') {
    const g = Math.min(W * 0.26, D * 0.62), body = rrect(g * 0.35, D * 0.18, W - g * 0.35, D, 14);
    const gl = circle(g * 0.55, g * 0.62, g * 0.62, 64), gr = circle(W - g * 0.55, g * 0.62, g * 0.62, 64);
    return union([body, gl, gr]);
  }
  if (style === 'groove') return [rrect(0, 0, W, D, 3)];
  return [rrect(0, 0, W, D, 6)];
}
// Where the screw posts go: inside the walls, near the far left, right, top and bottom of the outline.
export function postSpots(out, n) {
  const inner = offset(out, -(RULE.T + RULE.POSTR + 0.4)), b = bbox(inner), pts = [];
  if (!inner.length) return pts;
  const ring = inner.reduce((a, p) => (p.length > a.length ? p : a), inner[0]);
  const targets = [[b.x0, b.y0], [b.x1, b.y0], [b.x1, b.y1], [b.x0, b.y1]];
  if (n > 4) targets.push([(b.x0 + b.x1) / 2, b.y0], [(b.x0 + b.x1) / 2, b.y1]);
  targets.forEach(([tx, ty]) => { let best = null, bd = 1e9; ring.forEach(([x, y]) => { const d = (x - tx) ** 2 + (y - ty) ** 2; if (d < bd) { bd = d; best = [x, y]; } }); if (best && !pts.some((p) => Math.hypot(p[0] - best[0], p[1] - best[1]) < RULE.POSTR * 3)) pts.push(best); });
  return pts;
}

// ---------- the cut each part makes in the deck ----------
export function cutShape(P, x, y, rotq, extra) {
  const c = P.cut || { o: 'rect', w: P.w, h: P.h }, out = [], a = (rotq || 0) * Math.PI / 2;
  const R = (poly) => rot(poly, a, x, y);
  const tol = extra || 0;
  if (c.o === 'circle') out.push(circle(x, y, c.d / 2 + tol));
  else if (c.o === 'rect') out.push(R(rrect(x - c.w / 2 - tol, y - c.h / 2 - tol, x + c.w / 2 + tol, y + c.h / 2 + tol, 1.2)));
  else if (c.o === 'slot') out.push(R(rrect(x - c.w / 2, y - c.h / 2, x + c.w / 2, y + c.h / 2, c.h / 2 - 0.01)));
  else if (c.o === 'cross') { const w = c.w / 2 + 0.4, t = c.t / 2 + 0.4; out.push(...union([R(rect(x - w, y - t, x + w, y + t)), R(rect(x - t, y - w, x + t, y + w))])); }
  else if (c.o === 'ring') { for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2, r = c.d / 2 - c.t / 2; out.push(circle(x + Math.cos(an) * r, y + Math.sin(an) * r, 2.2, 20)); } }
  else if (c.o === 'grille') { out.push(circle(x, y, 1.5, 16)); for (let i = 0; i < 6; i++) { const an = i * Math.PI / 3; out.push(circle(x + 6 * Math.cos(an), y + 6 * Math.sin(an), 1.5, 16)); } for (let i = 0; i < 10; i++) { const an = i * Math.PI / 5 + 0.3; out.push(circle(x + 10.5 * Math.cos(an), y + 10.5 * Math.sin(an), 1.25, 16)); } }
  if (P.bolts) P.bolts.forEach(([bx, by]) => { const p = rot([[x + bx, y + by]], a, x, y)[0]; out.push(circle(p[0], p[1], 2.2, 20)); });
  (P.userHoles || []).forEach((h) => { const p = rot([[x + h.x, y + h.y]], a, x, y)[0]; out.push(circle(p[0], p[1], h.d / 2 + 0.2, 28)); });
  return out;
}
// The room a part takes on the deck (for overlap checks and the layout picture).
export function footprint(P, x, y, rotq) {
  // keep = half the room it needs on top (nut, flange, fingers). The board under it counts too.
  const c = P.cut || {}, k = P.keep || 0, cw = c.o === 'circle' ? c.d + 2 : c.o === 'cross' ? c.w + 2 : 0;
  let w = Math.max(P.w, 2 * k, cw), h = Math.max(P.h, 2 * k, cw);
  if (P.screen || P.bolts || P.measured) { w = P.w; h = P.h; }
  if (rotq % 2) { const t = w; w = h; h = t; }
  return { x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2, w, h };
}

// ---------- build one half (tray + deck) as layers ----------
// layer = { polys, z0, z1 }. Units mm, z up, tray floor at z = 0.
export function buildHalf(o) {
  // o: { style, W, D, H, parts:[{P,x,y,r}], inside:[{P,x,y,r}], hinge, magnets, port, joins, deckOnTop }
  const R = RULE, out = outline(o.style, o.W, o.D);
  const innerWall = offset(out, -R.T), deckPoly = offset(out, -(R.T + R.CLR));
  const posts = postSpots(out, o.W * o.D > 30000 ? 6 : 4);
  const H = o.H, deckZ = H - R.LT - (o.recess || 0); // a recess leaves room for caps and knobs when the lid closes
  const tray = [], deck = [], extra = [];
  const inlay = [], stick = [], D = 0.6; // D = how deep a mark or texture goes (3 layers at 0.2 mm)
  // floor, with marks on the bottom face: dips (filled with a second color or paint), cut throughs (vents), pockets for glue-on pieces
  const bm = marks(o.bottom), floorCut = diff(out, bm.cut);
  if (bm.recess.length) { tray.push({ polys: diff(floorCut, bm.recess), z0: 0, z1: D, tag: 'floor' }); tray.push({ polys: floorCut, z0: D, z1: R.F, tag: 'floor' }); if (bm.fill.length) inlay.push({ polys: inter(bm.fill, floorCut), z0: 0, z1: D, tag: 'inlayB' }); }
  else tray.push({ polys: floorCut, z0: 0, z1: R.F, tag: 'floor' });
  bm.stick.forEach((sp) => { sp.layers.forEach((l) => { const h = l.z1; l.z0 = -(h - D); l.z1 = D; }); sp.face = 'bottom'; stick.push(sp); });
  // walls: split into height bands where the USB notch, the snap groove or a texture changes the outline
  const wallBase = diff(out, innerWall), wt = o.walls && o.walls.kind && o.walls.kind !== 'none' ? o.walls : null;
  const snapOK = o.snap && deckZ - 10.6 > R.F + 1, gz = [deckZ - 10.4, deckZ - 7.6];
  const zs = new Set([R.F, H]); if (o.port) zs.add(o.port.z); if (snapOK) { zs.add(gz[0]); zs.add(gz[1]); }
  if (wt && wt.kind !== 'vstripe') { const bh = Math.max(1, wt.sp / 2); for (let z = R.F + bh; z < H - 0.3; z += bh) zs.add(+z.toFixed(2)); }
  const Z = [...zs].filter((z) => z >= R.F && z <= H).sort((x, y) => x - y);
  const ringOut = wt ? diff(offset(out, wt.depth), out) : [];
  for (let i = 0; i < Z.length - 1; i++) {
    const z0 = Z[i], z1 = Z[i + 1], mid = (z0 + z1) / 2; if (z1 - z0 < 0.05) continue;
    let w = wallBase;
    if (wt) {
      const band = wt.kind === 'vstripe' ? 0 : Math.floor((mid - R.F) / Math.max(1, wt.sp / 2));
      if ((wt.kind === 'hstripe' || wt.kind === 'grid') && band % 2 === 0) w = union(w, ringOut);
      if (wt.kind === 'vstripe' || wt.kind === 'grid') w = union(w, ribs(out, wt.sp, wt.depth, wt.kind === 'grid' ? Math.max(0.8, wt.sp * 0.22) : wt.sp / 2, 0));
      if (wt.kind === 'checks') w = union(w, ribs(out, wt.sp, wt.depth, wt.sp / 2, band % 2 ? wt.sp / 2 : 0));
    }
    if (snapOK && mid > gz[0] && mid < gz[1]) w = diff(w, offset(out, -(R.T - 1.2)));
    if (o.port && mid > o.port.z) w = diff(w, [rect(o.port.x0, o.port.y0, o.port.x1, o.port.y1)]);
    tray.push({ polys: w, z0, z1, tag: 'wall' });
  }
  // screw posts: deck sits on top of them, flush with the wall
  const postPolys = posts.map(([x, y]) => circle(x, y, R.POSTR, 32)), pilots = posts.map(([x, y]) => circle(x, y, R.PILOT / 2, 20));
  tray.push({ polys: diff(union(postPolys), pilots), z0: R.F, z1: deckZ });
  // magnet bosses at the front (clamshell closing), flush with the wall top, pocket on top
  if (o.magnets) {
    const b = bbox(out), mx = [b.x0 + b.w * 0.3, b.x0 + b.w * 0.7], ins = R.T + R.MAG / 2 + 1.4;
    const bosses = mx.map((x) => { const p = nearestInside(innerWall, [x, b.y0 + ins]); return p; }).filter(Boolean);
    const bp = bosses.map(([x, y]) => circle(x, y, R.MAG / 2 + 1.6, 36)), pk = bosses.map(([x, y]) => circle(x, y, R.MAG / 2, 32));
    tray.push({ polys: union(bp), z0: R.F, z1: H - R.MAGD - R.LT * (o.deckOnTop ? 0 : 0) });
    tray.push({ polys: diff(union(bp), pk), z0: H - R.MAGD, z1: H });
    o._mag = bosses;
  }
  // inside parts (brains): standoffs with pilot holes
  (o.inside || []).forEach((q) => {
    const P = q.P; if (!P.holes) return;
    q.P.holes.forEach(([hx, hy]) => { const p = rot([[q.x - P.w / 2 + hx, q.y - P.h / 2 + hy]], (q.r || 0) * Math.PI / 2, q.x, q.y)[0]; tray.push({ polys: diff([circle(p[0], p[1], 2.6, 24)], [circle(p[0], p[1], (P.hole || 2.1) * 0.8 / 2, 16)]), z0: R.F, z1: R.F + 5 }); });
  });
  // the deck: outline minus every cut and the post screw holes
  const cuts = [], thin = [], nubs = [];
  o.parts.forEach((q) => {
    if (q.spring) { // printed spring button (a living hinge): a C shaped slot leaves the pad on one arm, a nub presses the switch
      const pad = circle(q.x, q.y, 6.2, 32), arm = rect(q.x - 2.2, q.y - 8.2, q.x + 2.2, q.y);
      cuts.push(...diff([circle(q.x, q.y, 7.4, 36)], union([pad, rect(q.x - 2.2, q.y - 9, q.x + 2.2, q.y)])));
      thin.push(pad, arm); nubs.push(circle(q.x, q.y, 1.6, 16)); return;
    }
    cuts.push(...cutShape(q.P, q.x, q.y, q.r || 0));
  });
  if (!snapOK) posts.forEach(([x, y]) => cuts.push(circle(x, y, R.HOLE / 2, 24)));
  const tm = marks(o.top), deckFlat = diff(diff(deckPoly, union(cuts)), tm.cut), top = deckZ + R.LT;
  const thinU = thin.length ? inter(union(thin), deckFlat) : [];
  deck.push({ polys: diff(deckFlat, thinU), z0: deckZ, z1: top - 1.2, tag: 'deck' });
  if (tm.recess.length) { deck.push({ polys: deckFlat, z0: top - 1.2, z1: top - D, tag: 'deck' }); deck.push({ polys: diff(deckFlat, tm.recess), z0: top - D, z1: top, tag: 'deck' }); if (tm.fill.length) inlay.push({ polys: inter(tm.fill, deckFlat), z0: top - D, z1: top, tag: 'inlayT' }); }
  else deck.push({ polys: deckFlat, z0: top - 1.2, z1: top, tag: 'deck' });
  tm.stick.forEach((sp) => { sp.layers.forEach((l) => { l.z0 += top - D; l.z1 += top - D; }); sp.face = 'top'; stick.push(sp); });
  if (nubs.length) deck.push({ polys: union(nubs), z0: deckZ - 1.5, z1: top - 1.2, tag: 'nub' });
  // snap clips (Slant 3D style cantilever): four arms hang from the deck edge, their lips catch a groove in the wall. No screws.
  if (snapOK) {
    const b = bbox(deckPoly), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, win = [rect(cx - 6, b.y0 - 5, cx + 6, b.y0 + 8), rect(cx - 6, b.y1 - 8, cx + 6, b.y1 + 5), rect(b.x0 - 5, cy - 6, b.x0 + 8, cy + 6), rect(b.x1 - 8, cy - 6, b.x1 + 5, cy + 6)];
    const armRing = diff(offset(out, -(R.T + R.CLR)), offset(out, -(R.T + R.CLR + 1.6))), lipRing = diff(offset(out, -(R.T - 0.8)), offset(out, -(R.T + R.CLR + 1.6)));
    deck.push({ polys: inter(armRing, win), z0: deckZ - 10, z1: deckZ, tag: 'clip' });
    deck.push({ polys: inter(lipRing, win), z0: deckZ - 10, z1: deckZ - 8, tag: 'clip' });
  }
  // screen frames hang under the deck so the board sits square behind its window
  o.parts.forEach((q) => {
    const P = q.P; if (!P.screen) return;
    const a = (q.r || 0) * Math.PI / 2, bw = P.w / 2 + 0.4, bh = P.h / 2 + 0.4;
    const ring = diff([rot(rect(q.x - bw - 1.6, q.y - bh - 1.6, q.x + bw + 1.6, q.y + bh + 1.6), a, q.x, q.y)], [rot(rect(q.x - bw, q.y - bh, q.x + bw, q.y + bh), a, q.x, q.y)]);
    const kept = inter(ring, offset(deckPoly, -0.2));
    if (kept.length) deck.push({ polys: kept, z0: deckZ - 4, z1: deckZ, tag: 'frame' });
  });
  // boards measured with the phone hang under the deck on posts at their back screw holes
  o.parts.forEach((q) => {
    const P = q.P; if (!P.mountHoles || !P.mountHoles.length) return;
    const a = (q.r || 0) * Math.PI / 2, hang = P.hang || 8;
    P.mountHoles.forEach((h) => { const p = rot([[q.x + h.x, q.y + h.y]], a, q.x, q.y)[0]; const ring = diff([circle(p[0], p[1], Math.max(2.6, h.d / 2 + 1.6), 24)], [circle(p[0], p[1], h.d * 0.4, 16)]); deck.push({ polys: inter(ring, deckPoly), z0: deckZ - hang, z1: deckZ, tag: 'post' }); });
  });
  // printed hinge knuckles on the hinge edge
  if (o.hinge && o.hinge.on) extra.push(...knuckles(out, o.hinge, H, o.hingeSet));
  return { out, tray, deck, extra, posts, H, deckZ, inlay, stick, snap: snapOK };
}
// marks on a face: [{ polys, how }] how = dip (second color or paint), cut (all the way through), glue (a pocket now, a separate piece to glue in)
function marks(list) {
  const r = { recess: [], fill: [], cut: [], stick: [] };
  (list || []).forEach((m) => {
    if (!m.polys || !m.polys.length) return;
    if (m.how === 'cut') r.cut.push(...m.polys);
    else if (m.how === 'glue') { r.recess.push(...offset(m.polys, 0.1)); r.stick.push({ name: m.name || 'piece', layers: [{ polys: offset(m.polys, -0.05), z0: 0, z1: 0.6 + (m.up || 1.0) }] }); }
    else { r.recess.push(...m.polys); if (m.fill !== false) r.fill.push(...m.polys); }
  });
  r.recess = r.recess.length ? union(r.recess) : []; r.fill = r.fill.length ? union(r.fill) : []; r.cut = r.cut.length ? union(r.cut) : [];
  return r;
}
function nearestInside(polys, p) { if (inside([circle(p[0], p[1], RULE.MAG / 2 + 1.6, 24)], offset(polys, 1.4))) return p; for (let s = 1; s < 30; s++) { const q = [p[0], p[1] + s]; if (inside([circle(q[0], q[1], RULE.MAG / 2 + 1.6, 24)], offset(polys, 1.4))) return q; } return null; }

// Knuckles: round barrels along the hinge edge that share one axis when the case is closed.
// set 'a' takes segments 1,3,5 and set 'b' takes 2,4. Pin = 1.75 mm filament through a 2.1 mm hole.
function knuckles(out, hinge, H, set) {
  const b = bbox(out), R = RULE, g = R.KR + 0.6, n = 5, gap = 0.4, list = [];
  const along = hinge.side === 'back' ? [b.x0 + 8, b.x1 - 8] : [b.y0 + 8, b.y1 - 8];
  const L = along[1] - along[0], seg = (L - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const mine = set === 'a' ? i % 2 === 0 : i % 2 === 1; if (!mine) continue;
    const s0 = along[0] + i * (seg + gap);
    list.push({ kind: 'knuckle', side: hinge.side, s0, s1: s0 + seg, edge: hinge.side === 'back' ? b.y1 : hinge.side === 'left' ? b.x0 : b.x1, g, r: R.KR, pin: R.PIN, zc: H });
  }
  return list;
}
// Knuckle cross section (in the plane across the hinge axis): barrel + bridge back to the wall, minus the pin hole.
function knuckleGeo(k) {
  const prof = union([circle(k.g, 0, k.r, 40), rect(-1.2, -k.r, k.g, k.r)]), sec = diff(prof, [circle(k.g, 0, k.pin / 2, 20)]);
  const geos = [];
  exPolys(sec).forEach((ex) => {
    const sh = toShape(ex);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: k.s1 - k.s0, bevelEnabled: false, curveSegments: 16 });
    // profile x = distance out from the hinge edge, profile y = height around the axis, extrude = along the edge
    const p = geo.getAttribute('position'), a = p.array;
    for (let i = 0; i < a.length; i += 3) {
      const u = a[i], v = a[i + 1], w = a[i + 2] + k.s0;
      if (k.side === 'back') { a[i] = w; a[i + 1] = k.edge + u; a[i + 2] = k.zc + v; }
      else if (k.side === 'left') { a[i] = k.edge - u; a[i + 1] = w; a[i + 2] = k.zc + v; }
      else { a[i] = k.edge + u; a[i + 1] = w; a[i + 2] = k.zc + v; }
    }
    // mirrored mapping flips the winding for 'left'
    if (k.side === 'right') flipWinding(geo); // that mapping mirrors, the other two only rotate
    p.needsUpdate = true; geos.push(geo);
  });
  return geos;
}
function flipWinding(geo) { const g = geo.index ? geo.toNonIndexed() : geo; const a = g.getAttribute('position').array; for (let i = 0; i < a.length; i += 9) for (let j = 0; j < 3; j++) { const t = a[i + 3 + j]; a[i + 3 + j] = a[i + 6 + j]; a[i + 6 + j] = t; } if (g !== geo) { geo.setAttribute('position', g.getAttribute('position')); geo.setIndex(null); } }

// ---------- cutting into puzzle pieces ----------
// A seam is a straight line with dovetail tabs. dir: 'v' (up and down), 'h' (across), 'd' (diagonal).
export function seamHalf(origin, angle, L, style) {
  // left side of a seam running along local y through origin, as one polygon
  const BIG = 2000, line = [[0, -L]];
  if (style === 'dovetail') {
    const pitch = 34, a = 7, b = 11, d = 5; let k = 0;
    for (let c = -L + pitch / 2; c < L - pitch / 2; c += pitch) {
      const s = k++ % 2 ? 1 : -1;
      line.push([0, c - a / 2], [s * d, c - b / 2], [s * d, c + b / 2], [0, c + a / 2]);
    }
  }
  line.push([0, L]);
  const poly = [[-BIG, -L], ...line, [-BIG, L]];
  return rot(poly.map(([x, y]) => [x + origin[0], y + origin[1]]), angle, origin[0], origin[1]);
}
// Returns regions (polygon sets) that tile the footprint. n = seams.
export function pieceRegions(foot, dir, n, style) {
  const b = bbox(foot), BIG = [rect(b.x0 - 50, b.y0 - 50, b.x1 + 50, b.y1 + 50)], L = Math.hypot(b.w, b.h) + 60;
  let regions = [BIG];
  const cutAll = (origin, angle) => {
    const left = [seamHalf(origin, angle, L, style)], next = [];
    regions.forEach((r) => { const a = inter(r, left), c = diff(r, left); if (area(a) > 1) next.push(a); if (area(c) > 1) next.push(c); });
    regions = next;
  };
  if (dir === 'v' || dir === 'both') for (let i = 1; i <= n; i++) cutAll([b.x0 + b.w * i / (n + 1), (b.y0 + b.y1) / 2], 0);
  if (dir === 'h' || dir === 'both') for (let i = 1; i <= n; i++) cutAll([(b.x0 + b.x1) / 2, b.y0 + b.h * i / (n + 1)], Math.PI / 2);
  if (dir === 'd') { const c = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2], span = (b.w + b.h) / Math.SQRT2; for (let i = 1; i <= n; i++) { const t = -span / 2 + span * i / (n + 1); cutAll([c[0] + t / Math.SQRT2, c[1] - t / Math.SQRT2], Math.PI / 4); } }
  // a hair of room on every seam so the pieces slide together (0.15 mm total)
  return regions.map((r) => offset(r, -0.075)).filter((r) => area(inter(r, foot)) > 4);
}
// Cut a half's layers into the regions. Knuckles go whole to the piece their middle sits in.
export function cutLayers(layers, extra, regions) {
  return regions.map((reg) => ({
    layers: layers.map((l) => ({ polys: inter(l.polys, reg), z0: l.z0, z1: l.z1, tag: l.tag })).filter((l) => l.polys.length),
    // a barrel that crosses a seam is cut there too, the filament pin still runs through both halves
    extra: (extra || []).map((k) => {
      // test along the barrel axis only, so two pieces never claim the same stretch
      const ax = k.side === 'back' ? k.edge + k.g : k.side === 'left' ? k.edge - k.g : k.edge + k.g, box = k.side === 'back' ? rect(k.s0, ax - 0.05, k.s1, ax + 0.05) : rect(ax - 0.05, k.s0, ax + 0.05, k.s1);
      const part = inter([box], reg); if (area(part) < 0.05) return null;
      const b = bbox(part), s0 = k.side === 'back' ? b.x0 : b.y0, s1 = k.side === 'back' ? b.x1 : b.y1;
      return s1 - s0 > 2 ? Object.assign({}, k, { s0, s1 }) : null;
    }).filter(Boolean),
    region: reg
  }));
}
export function pieceFoot(piece) { const all = []; piece.layers.forEach((l) => all.push(...l.polys)); return all.length ? bbox(all) : { w: 0, h: 0 }; }
export function fitsBed(f, bed) { const m = 4; return (f.w + m <= bed[0] && f.h + m <= bed[1]) || (f.h + m <= bed[0] && f.w + m <= bed[1]); }

// ---------- triangles ----------
function exPolys(polys) {
  const c = new CL.Clipper(), tree = new CL.PolyTree(); c.StrictlySimple = true; // no two rings may touch, or the triangles leave gaps
  c.AddPaths(CL.Clipper.CleanPolygons(polys.map(toC), 0.004 * SC), CL.PolyType.ptSubject, true);
  c.Execute(CL.ClipType.ctUnion, tree, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
  return CL.JS.PolyTreeToExPolygons(tree).map((e) => ({ outer: fromC(e.outer), holes: e.holes.map(fromC) }));
}
function toShape(ex) {
  const ccw = (p) => { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s > 0; };
  const o = ccw(ex.outer) ? ex.outer : ex.outer.slice().reverse();
  const sh = new THREE.Shape(o.map(([x, y]) => new THREE.Vector2(x, y)));
  ex.holes.forEach((h) => { const hh = ccw(h) ? h.slice().reverse() : h; sh.holes.push(new THREE.Path(hh.map(([x, y]) => new THREE.Vector2(x, y)))); });
  return sh;
}
export function layerGeos(layers, extra) {
  const geos = [];
  layers.forEach((l) => {
    if (l.z1 - l.z0 < 0.01) return;
    const all = [];
    exPolys(l.polys).forEach((ex) => {
      // a face with lots of little holes (textures) is cut into 12 mm strips first: the triangulator gets every strip right
      if (ex.holes.length > 24) {
        // cut on a line through the middle of every hole, so no piece has a hole left: simple shapes always triangulate cleanly
        const b = bbox([ex.outer]), xs = [b.x0 - 1]; ex.holes.map((h) => { const hb = bbox([h]); return (hb.x0 + hb.x1) / 2; }).sort((p, q) => p - q).forEach((x) => { if (x - xs[xs.length - 1] > 0.4) xs.push(x); }); xs.push(b.x1 + 1);
        for (let i = 0; i < xs.length - 1; i++) exPolys(inter([ex.outer, ...ex.holes], [rect(xs[i], b.y0 - 1, xs[i + 1], b.y1 + 1)])).forEach((e) => { if (!e.holes.length) all.push(e); else { const bb = bbox([e.outer]), m = (bb.y0 + bb.y1) / 2; [[bb.y0 - 1, m], [m, bb.y1 + 1]].forEach(([y0, y1]) => all.push(...exPolys(inter([e.outer, ...e.holes], [rect(bb.x0 - 1, y0, bb.x1 + 1, y1)])))); } });
      }
      else all.push(ex);
    });
    all.forEach((ex) => {
      if (Math.abs(CL.Clipper.Area(toC(ex.outer))) < 50) return; // skip crumbs under 0.05 mm2
      const g = new THREE.ExtrudeGeometry(toShape(ex), { depth: l.z1 - l.z0, bevelEnabled: false, curveSegments: 1 });
      g.translate(0, 0, l.z0); geos.push(g);
    });
  });
  (extra || []).forEach((k) => { if (k.kind === 'knuckle') geos.push(...knuckleGeo(k)); });
  return geos;
}
export function trisOf(geos) {
  let n = 0; const parts = geos.map((g) => { const ng = g.index ? g.toNonIndexed() : g; const a = ng.getAttribute('position').array; n += a.length; return a; });
  const out = new Float32Array(n); let o = 0; parts.forEach((a) => { out.set(a, o); o += a.length; }); return out;
}
// Flip a half upside down (for the deck, which prints face down) and drop it to z = 0.
export function flipZ(tris, zTop) { let zmax = -1e9; for (let i = 2; i < tris.length; i += 3) zmax = Math.max(zmax, tris[i]); if (zTop != null) zmax = zTop; const o = new Float32Array(tris.length); for (let i = 0; i < tris.length; i += 3) { o[i] = tris[i]; o[i + 1] = -tris[i + 1]; o[i + 2] = zmax - tris[i + 2]; } return o; } // a half turn about x, so faces keep pointing out
export function dropZ(tris) { let z0 = 1e9; for (let i = 2; i < tris.length; i += 3) z0 = Math.min(z0, tris[i]); const o = new Float32Array(tris); for (let i = 2; i < o.length; i += 3) o[i] -= z0; return o; }
export function stl(tris, name) {
  const n = tris.length / 9, buf = new ArrayBuffer(84 + n * 50), dv = new DataView(buf), head = ('NOCIV Case Zero ' + name).slice(0, 80);
  for (let i = 0; i < head.length; i++) dv.setUint8(i, head.charCodeAt(i));
  dv.setUint32(80, n, true); let o = 84;
  for (let t = 0; t < n; t++) {
    const b = t * 9, a = [tris[b], tris[b + 1], tris[b + 2]], c = [tris[b + 3], tris[b + 4], tris[b + 5]], d = [tris[b + 6], tris[b + 7], tris[b + 8]];
    const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0]; const l = Math.hypot(nx, ny, nz) || 1;
    [nx / l, ny / l, nz / l, ...a, ...c, ...d].forEach((f) => { dv.setFloat32(o, f, true); o += 4; }); dv.setUint16(o, 0, true); o += 2;
  }
  return new Blob([buf], { type: 'model/stl' });
}
// printed extras
export function knobGeo() {
  const sh = new THREE.Shape(), n = 36, ro = 9, ri = 8.2;
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, r = i === 0 || i === n ? ri - 1.2 : (i % 2 ? ri : ro); const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y); }
  const bore = new THREE.Path(); bore.absarc(0, 0, 3, 0, Math.PI * 2, true); sh.holes.push(bore);
  return new THREE.ExtrudeGeometry(sh, { depth: 12, bevelEnabled: false, curveSegments: 24 });
}
export function dpadGeos() {
  // cross 32 mm, 9 mm tall, with a 1.2 mm lip under the deck so it cannot fall out, and a pivot nub in the middle
  const cross = union([rect(-16, -5.5, 16, 5.5), rect(-5.5, -16, 5.5, 16)]), lip = offset(cross, 1.6);
  return layerGeos([{ polys: lip, z0: 0, z1: 1.2 }, { polys: cross, z0: 1.2, z1: 9 }, { polys: [circle(0, 0, 1.5)], z0: -1.5, z1: 0 }]);
}
// 1:1 SVG of flat layers (wood templates, laser cutters)
export function svgOf(polys, title) {
  const b = bbox(polys), pad = 5, W = b.w + pad * 2, H = b.h + pad * 2;
  const d = polys.map((p) => 'M' + p.map(([x, y]) => (x - b.x0 + pad).toFixed(2) + ' ' + (b.y1 - y + pad).toFixed(2)).join('L') + 'Z').join('');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' + W.toFixed(2) + 'mm" height="' + H.toFixed(2) + 'mm" viewBox="0 0 ' + W.toFixed(2) + ' ' + H.toFixed(2) + '">\n<!-- NOCIV Case Zero ' + title + '. Real size in mm. Print at 100 percent, or send to a laser cutter. Red = cut. -->\n<path d="' + d + '" fill="none" stroke="#ff0000" stroke-width="0.2" fill-rule="evenodd"/>\n<path d="M' + pad + ' ' + (H - 2) + 'h10" stroke="#000" stroke-width="0.4"/><text x="' + pad + '" y="' + (H - 2.6) + '" font-size="2.4" font-family="Arial">10 mm</text>\n</svg>';
}

// ---------- looks: logos, labels, textures (all flat layers, so they cut and split like the rest) ----------
// Trace a picture into polygons: every dark or solid pixel row becomes a strip, strips are joined, edges smoothed.
export function traceCanvas(cv, mmWide, invert) {
  const max = 260, k = Math.min(1, max / Math.max(cv.width, cv.height)), w = Math.max(1, Math.round(cv.width * k)), h = Math.max(1, Math.round(cv.height * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(cv, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, s = mmWide / w, strips = [];
  let anyAlpha = false; for (let i = 3; i < d.length; i += 16) if (d[i] < 200) { anyAlpha = true; break; }
  for (let y = 0; y < h; y++) {
    let run = -1;
    for (let x = 0; x <= w; x++) {
      let on = false;
      if (x < w) { const i = (y * w + x) * 4, a = d[i + 3], L = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11); on = anyAlpha ? a > 128 && L < 245 : L < 128; if (invert) on = !on && a > 20; }
      if (on && run < 0) run = x; if (!on && run >= 0) { strips.push(rect(run * s, (h - y - 1) * s, x * s, (h - y) * s)); run = -1; }
    }
  }
  if (!strips.length) return [];
  const u = union(strips), sm = offset(offset(u, -s * 0.35), s * 0.35);
  return sm.map((p) => p.map(([x, y]) => [x - mmWide / 2, y - h * s / 2])).filter((p) => Math.abs(CL.Clipper.Area(toC(p))) / SC / SC > 0.2);
}
export function textCanvas(txt, font) {
  const c = document.createElement('canvas'), g = c.getContext('2d'), fs = 120; g.font = '900 ' + fs + 'px ' + (font || '-apple-system,Arial');
  c.width = Math.max(10, Math.ceil(g.measureText(txt).width) + 20); c.height = Math.round(fs * 1.25);
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#000'; g.font = '900 ' + fs + 'px ' + (font || '-apple-system,Arial'); g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(txt, c.width / 2, c.height / 2 + 4);
  // trim to the ink
  const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4] < 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < x0) return c; const t = document.createElement('canvas'); t.width = x1 - x0 + 3; t.height = y1 - y0 + 3; t.getContext('2d').fillStyle = '#fff'; t.getContext('2d').fillRect(0, 0, t.width, t.height); t.getContext('2d').drawImage(c, -x0 + 1, -y0 + 1); return t;
}
export function place(polys, x, y, scale, rotq) { const a = (rotq || 0) * Math.PI / 2, c = Math.cos(a), s = Math.sin(a); return polys.map((p) => p.map(([u, v]) => [x + (u * c - v * s) * (scale || 1), y + (u * s + v * c) * (scale || 1)])); }
// Flat textures for a face. kind: grid, checks, diamond, hstripe, vstripe, dots, wood. sp = spacing in mm.
export function texture(kind, b, sp, seed) {
  const out = [], x0 = b.x0 - sp, x1 = b.x1 + sp, y0 = b.y0 - sp, y1 = b.y1 + sp, lw = Math.max(0.8, sp * 0.22);
  if (kind === 'grid' || kind === 'vstripe') for (let x = x0; x < x1; x += sp) out.push(rect(x, y0, x + (kind === 'grid' ? lw : sp / 2), y1));
  if (kind === 'grid' || kind === 'hstripe') for (let y = y0; y < y1; y += sp) out.push(rect(x0, y, x1, y + (kind === 'grid' ? lw : sp / 2)));
  if (kind === 'checks') { let j = 0; for (let y = y0; y < y1; y += sp, j++) { let i = 0; for (let x = x0; x < x1; x += sp, i++) if ((i + j) % 2 === 0) out.push(rect(x, y, x + sp, y + sp)); } }
  if (kind === 'dots') for (let y = y0; y < y1; y += sp) for (let x = x0 + (Math.round((y - y0) / sp) % 2) * sp / 2; x < x1; x += sp) out.push(circle(x, y, sp * 0.22, 14));
  if (kind === 'diamond') { // tread plate: long thin diamonds that alternate direction, like the metal sheet
    let j = 0; for (let y = y0; y < y1; y += sp, j++) { let i = 0; for (let x = x0; x < x1; x += sp, i++) { const cx = x + sp / 2, cy = y + sp / 2, L = sp * 0.42, W = sp * 0.11, a = ((i + j) % 2 ? 1 : -1) * Math.PI / 4; out.push(rot([[cx - L, cy], [cx, cy - W], [cx + L, cy], [cx, cy + W]], a, cx, cy)); } }
  }
  if (kind === 'wood') { // grain: wavy lines that drift and bunch, plus a couple of knots
    const r = (() => { let s = seed || 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    for (let y = y0; y < y1; y += sp * (0.6 + r() * 0.8)) {
      const amp = sp * (0.2 + r() * 0.5), f = (0.02 + r() * 0.03), ph = r() * 6, line = [];
      for (let x = x0; x <= x1; x += 1.5) line.push({ X: Math.round(x * SC), Y: Math.round((y + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.1 + ph) * amp * 0.25) * SC) });
      const co = new CL.ClipperOffset(2, 0.05 * SC), o = new CL.Paths(); co.AddPath(line, CL.JoinType.jtRound, CL.EndType.etOpenRound); co.Execute(o, (lw * 0.45) * SC); out.push(...o.map(fromC));
    }
  }
  return union(out);
}
// Ribs on the outside of a wall, walked along the outline. Returns polygons that sit on the outer face.
export function ribs(out, sp, depth, width, phase) {
  const ring = out.reduce((a, p) => (p.length > a.length ? p : a), out[0]), pts = [], segs = [];
  let L = 0; for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push([a, b, l, L]); L += l; }
  const ccw = CL.Clipper.Area(toC(ring)) > 0, res = [];
  for (let t = (phase || 0) + sp / 2; t < L; t += sp) {
    const s = segs.find((q) => t >= q[3] && t <= q[3] + q[2]); if (!s || s[2] < 0.01) continue;
    const u = (t - s[3]) / s[2], px = s[0][0] + (s[1][0] - s[0][0]) * u, py = s[0][1] + (s[1][1] - s[0][1]) * u;
    let tx = (s[1][0] - s[0][0]) / s[2], ty = (s[1][1] - s[0][1]) / s[2], nx = ccw ? ty : -ty, ny = ccw ? -tx : tx;
    const hw = width / 2, a = [px - tx * hw - nx * 0.4, py - ty * hw - ny * 0.4], b = [px + tx * hw - nx * 0.4, py + ty * hw - ny * 0.4];
    res.push([a, b, [b[0] + nx * (depth + 0.4), b[1] + ny * (depth + 0.4)], [a[0] + nx * (depth + 0.4), a[1] + ny * (depth + 0.4)]]);
    void pts;
  }
  return union(res);
}
