// NOCIV Case Zero: a character you can print. Head, body, arms, hands, legs, feet, and a face.
// Every solid is built the way a 3D printer builds it: as a stack of thin flat slices. Each slice is a 2D outline,
// so hollowing a head, cutting a window for a screen, or raising an eyebrow is plain 2D cut and join work per slice.
// Coordinates: millimetres. x is the character's left to right, the face looks toward -y, z is up.

export const CH_DEF = { head: 'cube', body: 'box', hands: 'mitt', feet: 'shoe', eyes: 'oval', brows: 1, nose: 'button', mouth: 'smile', face: 'raised', scr: 'flush', turn: 0, bend: 0, size: 60 };
const T = 2.4, DZ = 0.8;           // wall thickness, slice height
const OLED = { w: 24, h: 13, bz: 3 }; // the window a 0.96 in OLED screen needs, and the border around it

export function chSpec(c) { const o = Object.assign({}, CH_DEF, c || {}); if (o.eyes === 'screen' && o.mouth === 'screen' && !(o.head === 'cube' && o.size >= 72)) o.mouth = 'line'; /* two small screens only fit one above the other in the large cube head */ return o; }

// ---------- gears: true involute teeth, 20 degree pressure angle ----------
export function gearPoly(G, N, m, bore) {
  const a0 = 20 * Math.PI / 180, inv = (q) => Math.tan(q) - q, r = m * N / 2, rb = r * Math.cos(a0), ra = r + m, rf = r - 1.25 * m, half = Math.PI / (2 * N) - 0.1 / r;
  const hw = (q) => half + inv(a0) - inv(Math.acos(Math.min(1, rb / Math.max(q, rb)))), R = []; if (rf < rb) R.push(rf); const lo = Math.max(rb, rf); for (let i = 0; i <= 8; i++) R.push(lo + (ra - lo) * i / 8);
  const pts = []; for (let i = 0; i < N; i++) { const c = 2 * Math.PI * i / N; R.forEach((q) => { const an = c - hw(q); pts.push([q * Math.cos(an), q * Math.sin(an)]); }); R.slice().reverse().forEach((q) => { const an = c + hw(q); pts.push([q * Math.cos(an), q * Math.sin(an)]); }); }
  return G.diff([pts], [G.circle(0, 0, bore / 2, 40)]);
}
const GEAR = { m: 1.5, big: 24, small: 18 }; // the head gear and the thumb wheel. 18 teeth is the smallest that cuts clean.
export const gearGap = () => GEAR.m * (GEAR.big + GEAR.small) / 2;

// ---------- the face ----------
// Every feature is a small flat outline (the same outlines go on a character's head and on the top of a case).
// On a head, each slice asks the outline: "at this height, which stretch of the face do you cover?"
const ring = (rx, ry, n) => { const o = []; for (let i = 0; i < n; i++) { const t = 2 * Math.PI * i / n; o.push([rx * Math.cos(t), ry * Math.sin(t)]); } return o; };
export const FEATS = { eyedot: 'Eye, dot', eyeoval: 'Eye, oval', brow: 'Brow', nosebtn: 'Nose, button', nosewedge: 'Nose, wedge', smile: 'Smile', line: 'Mouth, line' };
export function featPoly(kind, s, flip) { // centred on 0, 0. s = scale (1 = the medium head)
  if (kind === 'eyedot') return ring(3.6 * s, 3.6 * s, 28);
  if (kind === 'eyeoval') return ring(6.2 * s, 4.4 * s, 32);
  if (kind === 'nosebtn') return ring(3 * s, 3 * s, 24);
  if (kind === 'nosewedge') return [[0, 4 * s], [5.5 * s, -4 * s], [-5.5 * s, -4 * s]];
  if (kind === 'line') return [[-9 * s, -1.3 * s], [9 * s, -1.3 * s], [9 * s, 1.3 * s], [-9 * s, 1.3 * s]];
  if (kind === 'brow') { const w = 5.5 * s, h = 1.3 * s, k = (flip ? 1 : -1) * 0.22; return [[-w, -h - w * k], [w, -h + w * k], [w, h + w * k], [-w, h - w * k]]; }
  if (kind === 'smile') { const rx = 11 * s, rv = 8 * s, th = 2.6 * s, o = [], n = 18; for (let i = 0; i <= n; i++) { const t = Math.PI + Math.PI * i / n; o.push([rx * Math.cos(t), rv * Math.sin(t) + 4 * s]); } for (let i = n; i >= 0; i--) { const t = Math.PI + Math.PI * i / n; o.push([(rx - th) * Math.cos(t), (rv - th) * Math.sin(t) + 4 * s]); } return o; }
  return ring(3 * s, 3 * s, 20);
}
const scan = (poly, v) => { const xs = []; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > v) !== (b[1] > v)) xs.push(a[0] + (v - a[1]) * (b[0] - a[0]) / (b[1] - a[1])); } xs.sort((p, q) => p - q); const out = []; for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] > 0.3) out.push([xs[i], xs[i + 1]]); return out; };
// where each feature sits unless you moved it: [across, up] in mm from the middle of the face, for the medium head
export function faceSpots(c0) {
  const c = chSpec(c0), Hh = 54, both = c.eyes === 'screen' && c.mouth === 'screen', D = { eL: [-12.5, 6.5], eR: [12.5, 6.5], bL: [-12.5, c.eyes === 'screen' ? 19.5 : 15.5], bR: [12.5, c.eyes === 'screen' ? 19.5 : 15.5], n: [0, c.nose === 'wedge' ? -2 : -2.7], m: [0, c.mouth === 'smile' ? -12 : -13], es: [0, both ? 14.5 : 6.5], ms: [0, both ? -14.5 : -13] };
  const P = c.pos || {}, out = []; void Hh;
  const at = (k) => (!both && P[k] ? P[k] : D[k]);
  if (c.eyes === 'screen') out.push({ k: 'es', kind: 'screen', p: at('es') }); else { out.push({ k: 'eL', kind: c.eyes === 'dot' ? 'eyedot' : 'eyeoval', p: at('eL') }, { k: 'eR', kind: c.eyes === 'dot' ? 'eyedot' : 'eyeoval', p: at('eR') }); }
  if (c.brows) out.push({ k: 'bL', kind: 'brow', flip: 0, p: at('bL') }, { k: 'bR', kind: 'brow', flip: 1, p: at('bR') });
  if (c.nose === 'button' || c.nose === 'wedge') out.push({ k: 'n', kind: c.nose === 'wedge' ? 'nosewedge' : 'nosebtn', p: at('n') });
  if (c.mouth === 'screen') out.push({ k: 'ms', kind: 'screen', p: at('ms') }); else out.push({ k: 'm', kind: c.mouth === 'smile' ? 'smile' : 'line', p: at('m') });
  return { spots: out, both };
}
// how far from the middle a feature may go and still sit on the face
export function faceLimit(c0, p) { const c = chSpec(c0), d = headDims(c), s = d.s; let u = p[0], v = p[1]; if (d.cube) { const mu = (d.W / 2 - 10) / s, mv = (d.H / 2 - 8) / s; u = Math.max(-mu, Math.min(mu, u)); v = Math.max(-mv, Math.min(mv, v)); } else { const m = 0.6 * d.R / s, l = Math.hypot(u, v); if (l > m) { u *= m / l; v *= m / l; } } return [u, v]; }
function faceOf(c, s) {
  const F = [], scr = [];
  faceSpots(c).spots.forEach((f) => { if (f.kind === 'screen') { scr.push(f.p[1] * s); return; } const poly = featPoly(f.kind, s, f.flip).map(([x, y]) => [x + f.p[0] * s, y + f.p[1] * s]); F.push((v) => scan(poly, v)); });
  return { F, scr };
}

// ---------- head: a hollow shell, open underneath, with the face on its front ----------
export function headDims(c) { const s = c.size / 60, cube = c.head === 'cube', W = 60 * s, D = 52 * s, Hh = 54 * s, R = 32 * s; return { s, cube, W: cube ? W : 2 * R, D: cube ? D : 2 * R, R, zb: cube ? 0 : -0.6 * R, zt: cube ? Hh : R, H: cube ? Hh : 1.6 * R, cz: cube ? Hh / 2 : 0.2 * R, baseR: 0.8 * R }; }
export function headLayers(G, c0) {
  const c = chSpec(c0), d = headDims(c), s = d.s, cube = d.cube, R = d.R, hw = d.W / 2, hd = d.D / 2, fc = faceOf(c, s), raised = c.face !== 'sunk', L = [], faceL = [];
  const a = OLED.w / 2 + OLED.bz, bh = OLED.h / 2 + OLED.bz;
  // on a round head the screen needs a flat spot: a facet cut just deep enough that its corners touch the ball
  const planes = fc.scr.map((v) => { if (cube) return -hd; const zz = d.cz + v, zm = Math.max(Math.abs(zz - bh), Math.abs(zz + bh)); return -Math.sqrt(Math.max(1, R * R - zm * zm - a * a)) + 0.3; });
  for (let z = d.zb; z < d.zt - 1e-6; z += DZ) {
    const zm = z + DZ / 2, v = zm - d.cz, r = cube ? 0 : Math.sqrt(Math.max(0, R * R - zm * zm)); if (!cube && r < 0.6) continue;
    const outer = cube ? [G.rrect(-hw, -hd, hw, hd, 8 * s)] : [G.circle(0, 0, r, 72)];
    let inner = []; if (cube) { if (zm < d.zt - T) inner = [G.rrect(-hw + T, -hd + T, hw - T, hd - T, Math.max(1, 8 * s - T))]; } else { const q = (R - T) * (R - T) - zm * zm; if (q > 1) inner = [G.circle(0, 0, Math.sqrt(q), 64)]; }
    let P = G.diff(outer, inner);
    const far = -(cube ? hd : R) - 9;
    // drawn features: raised stands 1.6 mm proud of the face, sunk is pressed 1.2 mm in
    const cols = []; fc.F.forEach((f) => f(v).forEach(([x0, x1]) => cols.push(G.rect(x0, far, x1, 0))));
    if (cols.length) {
      const band = raised ? (cube ? [G.rect(-hw, -hd - 1.6, hw, -hd + 0.2)] : G.diff([G.circle(0, 0, r + 1.6, 72)], [G.circle(0, 0, Math.max(0.5, r - 0.2), 72)])) : (cube ? [G.rect(-hw, -hd - 0.1, hw, -hd + 1.2)] : G.diff([G.circle(0, 0, r + 0.1, 72)], [G.circle(0, 0, Math.max(0.5, r - 1.2), 72)]));
      const bit = G.inter(band, G.union(cols)); if (bit.length) { P = raised ? G.union(P.concat(bit)) : G.diff(P, bit); faceL.push({ polys: bit, z0: z - d.zb, z1: z - d.zb + DZ }); }
    }
    // a screen: flush, with a raised border, sunk into a pocket, or sitting on top with only a slot for its cable
    fc.scr.forEach((sv, k) => {
      const yP = planes[k], dv = Math.abs(v - sv); if (dv > bh + (c.scr === 'mounted' ? 4 : 0)) return;
      if (dv <= bh) {
        if (!cube) { P = G.diff(P, [G.rect(-a, far, a, yP)]); P = G.union(P.concat([G.rect(-a, yP, a, yP + T)])); }
        if (c.scr === 'raised') P = G.union(P.concat([G.rect(-a, yP - 1.6, a, yP + 0.2)]));
        if (c.scr === 'sunk') P = G.diff(P, [G.rect(-a, yP - 0.1, a, yP + 1.2)]);
        if (c.scr !== 'mounted' && dv <= OLED.h / 2) P = G.diff(P, [G.rect(-OLED.w / 2, yP - 3, OLED.w / 2, yP + T + 1)]);
      }
      if (c.scr === 'mounted' && Math.abs(v - (sv - OLED.h / 2 - 3.5)) <= 1.5) P = G.diff(P, [G.rect(-5, yP - 3, 5, yP + T + 1)]);
    });
    if (P.length) L.push({ polys: P, z0: z - d.zb, z1: z - d.zb + DZ });
  }
  return { layers: L, face: faceL, planes, scr: fc.scr, dims: d }; /* face: just the features, so the preview can show them in ink */
}
// the plate that closes the head from below: the neck goes through its hole, so the head can turn
export function headPlate(G, c0) {
  const c = chSpec(c0), d = headDims(c), s = d.s, hole = [G.circle(0, 0, 7.25, 40)];
  const out = d.cube ? [G.rrect(-d.W / 2, -d.D / 2, d.W / 2, d.D / 2, 8 * s)] : [G.circle(0, 0, d.baseR, 72)];
  const rp = d.cube ? 0 : Math.sqrt(Math.max(100, (d.R - T) * (d.R - T) - 0.36 * d.R * d.R)) - 0.5; /* the plug that centres the plate in the open bottom of the head */
  const plug = d.cube ? G.diff([G.rrect(-d.W / 2 + T + 0.3, -d.D / 2 + T + 0.3, d.W / 2 - T - 0.3, d.D / 2 - T - 0.3, Math.max(1, 8 * s - T))], [G.rrect(-d.W / 2 + T + 3.3, -d.D / 2 + T + 3.3, d.W / 2 - T - 3.3, d.D / 2 - T - 3.3, 2)]) : G.diff([G.circle(0, 0, rp, 64)], [G.circle(0, 0, rp - 3, 64)]);
  return [{ polys: G.diff(out, hole), z0: 0, z1: T }, { polys: plug, z0: T, z1: T + 2.2 }];
}

// ---------- body: a hollow shell, open underneath so a small board and its wires fit inside ----------
export function bodyDims(c) { const s = c.size / 60; return { s, W: 56 * s, D: 38 * s, H: 62 * s, box: c.body !== 'round', zs: 62 * s - 12, zh: 10 }; }
export function bodyHalf(c, z) { const d = bodyDims(c); if (d.box) return { rx: d.W / 2, ry: d.D / 2 }; const f = 0.8 + 0.2 * Math.sin(Math.PI * Math.max(0, Math.min(1, z / d.H))); return { rx: d.W / 2 * f * 1.04, ry: d.D / 2 * f * 1.1 }; }
const oval = (G, rx, ry) => G.circle(0, 0, 1, 72).map(([x, y]) => [x * rx, y * ry]);
export function bodyLayers(G, c0) {
  const c = chSpec(c0), d = bodyDims(c), L = [], cd = gearGap();
  for (let z = 0; z < d.H - 1e-6; z += DZ) {
    const zm = z + DZ / 2, h = bodyHalf(c, zm), rx = h.rx, ry = h.ry, top = zm > d.H - T;
    const outer = d.box ? [G.rrect(-rx, -ry, rx, ry, 6 * d.s)] : [oval(G, rx, ry)];
    let P = top ? outer : G.diff(outer, d.box ? [G.rrect(-rx + T, -ry + T, rx - T, ry - T, Math.max(1, 6 * d.s - T))] : [oval(G, rx - T, ry - T)]);
    if (!top) { // a rib inside each side wall gives the arm and leg screws something to bite into
      P = G.union(P.concat(G.inter(outer, [G.rect(rx - T - 6, -5, rx, 5), G.rect(-rx, -5, -rx + T + 6, 5)])));
      if (zm > d.H - 12) P = G.union(P.concat(G.diff([G.circle(0, 0, 10.5, 48)], [G.circle(0, 0, 7.1, 40)]))); /* a collar under the top holds the neck straight */
    } else {
      if (c.turn) P = G.union(P.concat([G.rect(-7, ry - 2, 7, cd), G.circle(0, cd, 7, 40)])); /* a tab behind the neck carries the thumb wheel */
      P = G.diff(P, [G.circle(0, 0, 7.1, 40)].concat(c.turn ? [G.circle(0, cd, 1.7, 24)] : []));
    }
    [d.zs, d.zh].forEach((zc) => { const dz = Math.abs(zm - zc); if (dz < 1.35) { const hh = Math.sqrt(1.35 * 1.35 - dz * dz); P = G.diff(P, [G.rect(rx - T - 7, -hh, rx + 1, hh), G.rect(-rx - 1, -hh, -rx + T + 7, hh)]); } }); /* 2.7 mm holes: an M3 screw cuts its own thread */
    L.push({ polys: P, z0: z, z1: z + DZ });
  }
  return L;
}

// ---------- flat parts: drawn from the side, then given a thickness ----------
const hole3 = (G, x, y) => G.circle(x, y, 1.7, 24);
export function flatParts(G, c0) {
  const c = chSpec(c0), s = c.size / 60, Lf = 40 * s, Lb = c.bend ? Lf / 2 + 2 : Lf; /* with elbows and knees each limb is two short bars */
  const barP = G.diff(G.union([G.rect(-6, -Lb, 6, 0), G.circle(0, 0, 6, 40), G.circle(0, -Lb, 6, 40)]), [hole3(G, 0, 0), hole3(G, 0, -Lb)]);
  const hand = c.hands === 'claw'
    ? G.diff(G.union([G.circle(0, 0, 6.5, 40), G.rect(-4, -11 * s, 4, 0)].concat(G.diff([G.circle(0, -21 * s, 12 * s, 48)], [G.circle(0, -21 * s, 6.8 * s, 40), G.rect(-3.6 * s, -36 * s, 3.6 * s, -21 * s)]))), [hole3(G, 0, 0)])
    : G.diff(G.union([G.circle(0, 0, 6.5, 40), G.rrect(-9 * s, -30 * s, 9 * s, -3, 8 * s), G.circle(-10 * s, -14 * s, 5 * s, 32)]), [hole3(G, 0, 0)]);
  const foot = c.feet === 'boot'
    ? G.diff(G.union([G.rrect(-26 * s, 0, 16 * s, 13, 6), G.circle(0, 11, 7, 40)]), [hole3(G, 0, 11)])
    : G.diff(G.union([G.rrect(-40 * s, 0, 18 * s, 6, 3), G.rrect(-13, 0, 13, 12, 5), G.circle(0, 11, 6.5, 40)]), [hole3(G, 0, 11)]);
  return { bar: { polys: barP, h: 5 }, hand: { polys: hand, h: 8 }, foot: { polys: foot, h: 16 }, Lb, reach: c.bend ? 2 * Lb : Lb };
}

// ---------- every piece, where it prints and where it sits when the character is put together ----------
// pose: [x, y, z] of the piece's own origin, and kind 'up' (slices stack upward) or 'side' (a flat part standing on edge, its thickness along x)
export function charParts(G, c0) {
  const c = chSpec(c0), hd = headDims(c), bd = bodyDims(c), fp = flatParts(G, c), head = headLayers(G, c), gap = c.turn ? 7 : 3;
  const hipZ = 11 + fp.reach, bodyZ = hipZ - bd.zh, topZ = bodyZ + bd.H, shZ = bodyZ + bd.zs, plateZ = topZ + gap, headZ = plateZ + T;
  const neckLen = 12 + gap + T + 2, P = [];
  const flip = (layers, H) => layers.map((l) => ({ polys: l.polys.map((p) => p.map(([x, y]) => [x, -y]).reverse()), z0: H - l.z1, z1: H - l.z0 })).reverse(); /* turned over for printing: its closed top goes on the bed */
  P.push({ id: 'head', name: 'Head', n: 1, color: 0xe9e2cc, layers: head.layers, print: hd.cube ? flip(head.layers, hd.H) : head.layers, pose: [0, 0, headZ], kind: 'up', how: hd.cube ? 'top face on the bed, no supports' : 'as saved, flat base on the bed, no supports' });
  if (head.face.length) P.push({ id: 'face', name: 'Face', n: 0, color: 0x1a1a1a, layers: head.face.map((l) => ({ polys: G.offset(l.polys, 0.15), z0: l.z0, z1: l.z1 })), pose: [0, c.face === 'sunk' ? 0.25 : -0.12, headZ], kind: 'up', show: true }); /* preview only: paint the face so you can read it */
  P.push({ id: 'plate', name: 'Head plate', n: 1, color: 0x2f4a6b, layers: headPlate(G, c), pose: [0, 0, plateZ], kind: 'up', how: 'flat side down' });
  const bl = bodyLayers(G, c); P.push({ id: 'body', name: 'Body', n: 1, color: 0xc8412f, layers: bl, print: flip(bl, bd.H), pose: [0, 0, bodyZ], kind: 'up', how: 'top face on the bed, no supports' });
  P.push({ id: 'neck', name: 'Neck', n: 1, color: 0x2f4a6b, layers: [{ polys: G.diff([G.circle(0, 0, 7, 40)], [G.circle(0, 0, 4, 32)]), z0: 0, z1: neckLen }], pose: [0, 0, topZ - 12], kind: 'up', how: 'standing up' });
  if (c.turn) {
    P.push({ id: 'gearhead', name: 'Head gear', n: 1, color: 0xf2c230, layers: [{ polys: gearPoly(G, GEAR.big, GEAR.m, 14.5), z0: 0, z1: 6 }], pose: [0, 0, topZ + 0.5], kind: 'up', how: 'flat' });
    P.push({ id: 'gearthumb', name: 'Thumb wheel', n: 1, color: 0xf2c230, layers: [{ polys: gearPoly(G, GEAR.small, GEAR.m, 3.4), z0: 0, z1: 6 }], pose: [0, gearGap(), topZ + 0.5], kind: 'up', spin: Math.PI / GEAR.small, how: 'flat' });
  } else P.push({ id: 'spacer', name: 'Neck ring', n: 1, color: 0x2f4a6b, layers: [{ polys: G.diff([G.circle(0, 0, 11, 40)], [G.circle(0, 0, 7.15, 40)]), z0: 0, z1: 3 }], pose: [0, 0, topZ], kind: 'up', how: 'flat' });
  const shX = bodyHalf(c, bd.zs).rx, hipX = bodyHalf(c, bd.zh).rx, side = (id, name, part, n, color, at) => P.push({ id, name, n, color, layers: [{ polys: part.polys, z0: 0, z1: part.h }], h: part.h, kind: 'side', at, how: 'flat' });
  const B = c.bend ? 1 : 0, out = (x, t) => (x > 0 ? x : x - t); /* x of a piece's inner face, on either side */
  side('arm', B ? 'Arm piece' : 'Arm', fp.bar, B ? 4 : 2, 0x2f4a6b, [].concat(...[-1, 1].map((sd) => [[out(sd * shX, 5), 0, shZ]].concat(B ? [[out(sd * (shX + 5), 5), 0, shZ - fp.Lb]] : []))));
  side('hand', c.hands === 'claw' ? 'Claw hand' : 'Mitt hand', fp.hand, 2, 0xe9e2cc, [-1, 1].map((sd) => [out(sd * (shX + 5 + 5 * B), 8), 0, shZ - fp.reach]));
  side('leg', B ? 'Leg piece' : 'Leg', fp.bar, B ? 4 : 2, 0xf2c230, [].concat(...[-1, 1].map((sd) => [[out(sd * hipX, 5), 0, hipZ]].concat(B ? [[out(sd * (hipX + 5), 5), 0, hipZ - fp.Lb]] : []))));
  side('foot', c.feet === 'boot' ? 'Boot' : 'Shoe', fp.foot, 2, 0x1a1a1a, [-1, 1].map((sd) => [out(sd * (hipX + 5 + 5 * B), 16), 0, 0]));
  const screens = head.scr.map((sv, k) => ({ x: 0, y: head.planes[k] + (c.scr === 'mounted' ? -1.2 : T * 0.6), z: headZ + (hd.cz - hd.zb) + sv, w: OLED.w, h: OLED.h }));
  return { parts: P, screens, tall: headZ + hd.H, wide: 2 * (hipX + 21 + 5 * B), spec: c, turn: !!c.turn };
}
export function charBuyList(c0) { const c = chSpec(c0); const L = ['4 screws M3 x 12 (shoulders and hips: they cut their own thread in the body)', (c.bend ? 8 : 4) + ' screws M3 x 16 with nuts (hands and feet' + (c.bend ? ', elbows and knees' : '') + ')']; if (c.turn) L.push('1 screw M3 x 20 with 2 nuts (the thumb wheel turns on it)'); const ns = (c.eyes === 'screen' ? 1 : 0) + (c.mouth === 'screen' ? 1 : 0); if (ns) L.push(ns + ' small screen' + (ns > 1 ? 's' : '') + ', 0.96 in OLED (SSD1306), and a Pico to drive ' + (ns > 1 ? 'them' : 'it')); return L; }
