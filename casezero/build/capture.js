// Measure with your phone. A bank, ID or library card is the ruler: every one is 85.6 x 54 mm (ISO ID-1).
// Live camera with a green guide and tilt arrows, auto snaps when the phone is level and still.
// Then you drag corners onto the card and the part. Perspective is undone with a homography, so the phone does not
// need to be perfectly square. Nothing leaves the phone.
const CARD = [85.6, 53.98];
// What you can tag on the front photo of a built board. Each one takes its hole size from the parts catalog (parts.js).
const KINDS = [['tact12', 'Button 12'], ['button16', 'Button 16'], ['arcade24', 'Arcade 24'], ['arcade30', 'Arcade 30'], ['dpad', 'D-pad'], ['pot', 'Knob'], ['encoder', 'Click wheel'], ['thumb', 'Thumb stick'], ['led5', 'LED'], ['speaker28', 'Speaker'], ['screen', 'Screen'], ['hole', 'Other hole']];
const SHORT = { tact12: 'B12', button16: 'B16', arcade24: 'A24', arcade30: 'A30', dpad: 'DP', pot: 'K', encoder: 'CW', thumb: 'TS', led5: 'LED', speaker28: 'SPK', screen: 'SCREEN' }; // short tags on the photo so close parts do not overlap
const KP = (k) => (window.CZ && window.CZ.PARTS && window.CZ.PARTS[k]) || null;
const $ = (id) => document.getElementById(id);

function solve(A, b) { // gaussian elimination, 8 x 8
  const n = b.length, M = A.map((r, i) => r.concat([b[i]]));
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]]; if (Math.abs(M[c][c]) < 1e-12) return null;
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
export function homography(src, dst) { // src px -> dst mm, 4 point pairs
  const A = [], b = [];
  src.forEach(([x, y], i) => { const [u, v] = dst[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); });
  const h = solve(A, b); if (!h) return null;
  return ([x, y]) => { const w = h[6] * x + h[7] * y + 1; return [(h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w]; };
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// parts are made to round numbers: 2.98 mm is really 3 mm (Zack Freedman's tip). Snap to the nearest half mm when close.
const nominal = (v) => { const r = Math.round(v * 2) / 2; return Math.abs(v - r) <= 0.15 ? r : Math.round(v * 10) / 10; };

const CSS = `
.mz{position:fixed;inset:0;z-index:80;background:#111;color:#fff;display:flex;flex-direction:column;font:600 14px/1.35 -apple-system,BlinkMacSystemFont,Arial,sans-serif}
.mz .mt{flex:none;display:flex;align-items:center;gap:8px;padding:10px 12px;padding-top:max(10px,env(safe-area-inset-top))}
.mz .mt b{flex:1;font:900 14px/1 inherit;letter-spacing:.08em;text-transform:uppercase}
.mz .mx{all:unset;cursor:pointer;width:36px;height:36px;display:grid;place-items:center;border:1.5px solid #fff;border-radius:50%;font:900 16px/1 inherit}
.mz .mv{flex:1;min-height:0;position:relative;overflow:hidden;background:#000}
.mz video,.mz canvas.ph{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;touch-action:none}
.mz svg.ov{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.mz .say{position:absolute;left:12px;right:12px;top:12px;text-align:center;font:800 16px/1.25 inherit;text-shadow:0 1px 3px #000}
.mz .mb{flex:none;padding:10px 12px calc(12px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:8px;background:#161616}
.mz .rowb{display:flex;gap:8px}
.mz .bt{all:unset;cursor:pointer;flex:1;text-align:center;padding:13px 8px;border-radius:12px;border:2px solid #fff;font:800 14px/1.1 inherit}
.mz .bt.go{background:#2bd46b;border-color:#2bd46b;color:#0b2414}
.mz .bt.red{background:#c8412f;border-color:#c8412f}
.mz .shut{all:unset;cursor:pointer;width:68px;height:68px;border-radius:50%;border:5px solid #fff;background:#2bd46b;align-self:center}
.mz .lst{font:600 13px/1.4 inherit;color:#ddd}
.mz .lst b{color:#fff}
.mz input.nm{height:44px;border-radius:12px;border:2px solid #fff;background:#000;color:#fff;padding:0 12px;font:700 16px inherit}
.mz .chips{display:flex;gap:6px;flex-wrap:wrap}.mz .chips.scroll{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px}.mz .chips.scroll button{flex:none;min-height:24px}.mz .chips button{all:unset;cursor:pointer;padding:9px 12px;border-radius:999px;border:1.5px solid #fff;font:700 13px/1 inherit}.mz .chips button[aria-pressed=true]{background:#fff;color:#111}
`;

export function openMeasure(done) {
  if (!document.getElementById('mzcss')) { const st = document.createElement('style'); st.id = 'mzcss'; st.textContent = CSS; document.head.appendChild(st); }
  const box = document.createElement('div'); box.className = 'mz'; document.body.appendChild(box);
  const M = { name: 'My board', shots: {}, step: 'intro', stream: null, tilt: null, holes: [], depth: 12, hang: 8, kind: 'tact12' };
  const close = () => { stopCam(); window.removeEventListener('deviceorientation', onTilt); box.remove(); };
  function stopCam() { if (M.stream) { M.stream.getTracks().forEach((t) => t.stop()); M.stream = null; } }
  function onTilt(e) { M.tilt = [e.beta || 0, e.gamma || 0]; }
  function shell(title, mid, bottom) {
    box.innerHTML = '<div class="mt"><b>' + title + '</b><button class="mx" aria-label="Close">&times;</button></div><div class="mv">' + mid + '</div><div class="mb">' + bottom + '</div>';
    box.querySelector('.mx').onclick = close;
  }

  // 1. what and how
  function intro() {
    shell('Measure with your phone', '<div class="say" style="position:static;padding:22px 16px;text-align:left;font-weight:600;font-size:15px">' +
      '<p style="margin:0 0 12px"><b>You need any bank, ID, gift or library card.</b> They are all the same size, 85.6 x 54 mm, so the card is your ruler.</p>' +
      '<p style="margin:0 0 12px">1. Lay the card flat right next to your board, on a plain table.<br>2. Hold your phone flat over both. Follow the arrows. It snaps by itself when it is level.<br>3. Drag the dots onto the card and the board. Then pick what each part is (button, knob, screen) and tap it on the photo. It gets the real hole size.<br>4. Flip the board over like a page (left to right) and tap the screw holes on the back.</p>' +
      '<p style="margin:0;color:#aaa">Step back a little and zoom in 2x: the edges bend less. Plain table, good light, no flash. Photos stay on your phone.</p></div>',
      '<input class="nm" id="mzName" value="' + M.name + '" aria-label="What is it" placeholder="What is it? (My board)"><div class="rowb"><button class="bt go" id="mzGo">Start the camera</button></div><div class="rowb"><label class="bt" style="position:relative">Use photos I have<input type="file" accept="image/*" id="mzFile" style="position:absolute;inset:0;opacity:0"></label></div>');
    $('mzName').oninput = (e) => { M.name = e.target.value || 'My board'; };
    $('mzGo').onclick = async () => {
      try { if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') await DeviceOrientationEvent.requestPermission(); } catch (e) {}
      window.addEventListener('deviceorientation', onTilt);
      cam('front');
    };
    $('mzFile').onchange = (e) => { const f = e.target.files[0]; if (f) fromFile(f, 'front'); };
  }
  function fromFile(f, which) { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); const k = Math.min(1, 1600 / Math.max(im.width, im.height)); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); M.shots[which] = { img: c }; mark(which); }; im.src = URL.createObjectURL(f); }

  // 2. live camera with the guide
  async function cam(which) {
    stopCam();
    const label = which === 'front' ? 'Front' : which === 'back' ? 'Back (flipped like a page)' : 'Side';
    shell(label, '<video playsinline muted autoplay></video><svg class="ov" id="mzOv"></svg><div class="say" id="mzSay">Hold the phone flat over the card and the part</div>',
      '<button class="shut" id="mzShut" aria-label="Take the photo"></button><div class="rowb"><label class="bt" style="position:relative">Use a photo instead<input type="file" accept="image/*" id="mzFile2" style="position:absolute;inset:0;opacity:0"></label></div>');
    $('mzFile2').onchange = (e) => { const f = e.target.files[0]; if (f) { stopCam(); fromFile(f, which); } };
    const v = box.querySelector('video');
    try { M.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false }); v.srcObject = M.stream; }
    catch (e) { $('mzSay').textContent = 'The camera is blocked. Allow it in Settings, or use a photo instead.'; return; }
    const snap = () => { const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); stopCam(); M.shots[which] = { img: c }; mark(which); };
    $('mzShut').onclick = snap;
    let steady = 0, last = null;
    const loop = () => {
      if (!M.stream || !document.body.contains(v)) return;
      const ov = $('mzOv'); if (!ov) return;
      const W = ov.clientWidth, H = ov.clientHeight, gw = W * 0.86, gh = Math.min(H * 0.62, gw * 0.75), gx = (W - gw) / 2, gy = (H - gh) / 2;
      const t = M.tilt, lvl = t ? (Math.abs(t[0]) < 7 && Math.abs(t[1]) < 7) : null;
      let arrows = '';
      if (t && !lvl) {
        const A = (x, y, r) => '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')"><path d="M-14 6 L0 -10 L14 6" fill="none" stroke="#2bd46b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>';
        if (t[0] > 7) arrows += A(W / 2, gy - 22, 0); if (t[0] < -7) arrows += A(W / 2, gy + gh + 22, 180);
        if (t[1] > 7) arrows += A(gx - 22, H / 2, -90); if (t[1] < -7) arrows += A(gx + gw + 22, H / 2, 90);
      }
      const col = lvl === false ? '#ffd23a' : '#2bd46b';
      ov.innerHTML = '<rect x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + gh + '" rx="18" fill="none" stroke="' + col + '" stroke-width="4" stroke-dasharray="' + (lvl ? '0' : '14 10') + '"/>' +
        '<rect x="' + (gx + 12) + '" y="' + (gy + gh - 12 - gw * 0.3 * 0.63) + '" width="' + gw * 0.3 + '" height="' + gw * 0.3 * 0.63 + '" rx="6" fill="rgba(43,212,107,.12)" stroke="' + col + '" stroke-width="2"/><text x="' + (gx + 12 + gw * 0.15) + '" y="' + (gy + gh - 18 - gw * 0.3 * 0.31) + '" fill="' + col + '" font-size="13" font-weight="800" text-anchor="middle">CARD</text>' + arrows;
      const say = $('mzSay');
      if (!t) say.textContent = 'Card in the corner box, part in the big box. Tap the green button.';
      else if (!lvl) say.textContent = 'Tilt toward the arrow until the line goes solid';
      else {
        const moved = last ? Math.abs(t[0] - last[0]) + Math.abs(t[1] - last[1]) : 9;
        steady = moved < 1.2 ? steady + 1 : 0; say.textContent = steady > 6 ? 'Hold still...' : 'Level. Hold still';
        if (steady > 40) { snap(); return; }
      }
      last = t ? t.slice() : null;
      requestAnimationFrame(loop);
    };
    v.onloadedmetadata = () => requestAnimationFrame(loop);
  }

  // 3. drag corners, tap holes
  function mark(which) {
    const shot = M.shots[which], img = shot.img;
    const stage = which === 'side' ? ['card2', 'part2'] : ['card', 'part', 'holes'];
    let st = 0, pts = {}, sel = -1;
    const W0 = img.width, H0 = img.height;
    pts.card = shot.card || [[W0 * 0.1, H0 * 0.6], [W0 * 0.38, H0 * 0.6], [W0 * 0.38, H0 * 0.78], [W0 * 0.1, H0 * 0.78]];
    pts.part = shot.part || [[W0 * 0.45, H0 * 0.25], [W0 * 0.88, H0 * 0.25], [W0 * 0.88, H0 * 0.75], [W0 * 0.45, H0 * 0.75]];
    pts.card2 = [[W0 * 0.2, H0 * 0.35], [W0 * 0.2, H0 * 0.65]]; pts.part2 = [[W0 * 0.6, H0 * 0.35], [W0 * 0.6, H0 * 0.6]];
    const holes = shot.holes || [];
    const say = {
      card: 'Drag the 4 orange dots onto the corners of the card. Top left first, then around.',
      part: 'Now drag the 4 green dots onto the corners of your part.',
      holes: which === 'front' ? 'Pick what it is below, then tap it on the photo. Tap it again to take it off.' : 'Tap every screw hole.',
      card2: 'Card standing on its long edge: drag the 2 dots to its top and bottom.',
      part2: 'Drag the 2 green dots to the top and bottom of your part.'
    };
    shell(which === 'front' ? 'Front' : which === 'back' ? 'Back' : 'Side', '<canvas class="ph" id="mzC"></canvas><div class="say" id="mzSay"></div>',
      '<div class="lst" id="mzInfo"></div><div class="chips scroll" id="mzKinds" hidden>' + KINDS.map((k) => '<button type="button" data-kind="' + k[0] + '">' + k[1] + '</button>').join('') + '</div><div class="rowb" id="mzHoleSize" hidden><button class="bt" data-hd="-1">Smaller</button><button class="bt" data-hd="1">Bigger</button><button class="bt" id="mzUndo">Undo</button></div><div class="rowb"><button class="bt" id="mzBack">Back</button><button class="bt go" id="mzNext">Next</button></div>');
    const cv = $('mzC'), g = cv.getContext('2d');
    let k = 1, ox = 0, oy = 0, hd = which === 'front' ? 12 : 3;
    function fit() { if (!document.body.contains(cv)) return; const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; k = Math.min(cv.width / W0, cv.height / H0); ox = (cv.width - W0 * k) / 2; oy = (cv.height - H0 * k) / 2; draw(); }
    const S = (p) => [ox + p[0] * k, oy + p[1] * k], I = (x, y) => [(x - ox) / k, (y - oy) / k];
    function H() { return homography(pts.card, [[0, 0], [CARD[0], 0], [CARD[0], CARD[1]], [0, CARD[1]]]); }
    function partMM() {
      const h = H(); if (!h) return null; const q = pts.part.map(h);
      const w = (dist(q[0], q[1]) + dist(q[3], q[2])) / 2, hh = (dist(q[0], q[3]) + dist(q[1], q[2])) / 2;
      return { q, w, h: hh, map: h };
    }
    function holeMM(p) { // hole position in part coords (mm from part center, x right, y up)
      const m = partMM(); if (!m) return [0, 0];
      const P = m.map(p), q = m.q, c = [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
      const ex = [(q[1][0] - q[0][0] + q[2][0] - q[3][0]) / 2, (q[1][1] - q[0][1] + q[2][1] - q[3][1]) / 2], el = Math.hypot(ex[0], ex[1]); ex[0] /= el; ex[1] /= el;
      const d = [P[0] - c[0], P[1] - c[1]]; return [d[0] * ex[0] + d[1] * ex[1], -(d[0] * -ex[1] + d[1] * ex[0])];
    }
    function draw() {
      if (!document.body.contains(cv) || !$('mzSay')) return; // this screen is gone
      g.clearRect(0, 0, cv.width, cv.height); g.drawImage(img, ox, oy, W0 * k, H0 * k);
      const key = stage[st], d = Math.min(2, devicePixelRatio || 1);
      const poly = (arr, col, close) => { g.beginPath(); arr.forEach((p, i) => { const s = S(p); i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); if (close) g.closePath(); g.strokeStyle = col; g.lineWidth = 3 * d; g.stroke(); arr.forEach((p, i) => { const s = S(p); g.beginPath(); g.arc(s[0], s[1], 13 * d, 0, 7); g.fillStyle = col; g.globalAlpha = .35; g.fill(); g.globalAlpha = 1; g.lineWidth = 3 * d; g.stroke(); g.fillStyle = '#fff'; g.font = '800 ' + 12 * d + 'px Arial'; g.textAlign = 'center'; g.fillText(String(i + 1), s[0], s[1] + 4 * d); }); };
      if (stage.indexOf('card') > -1) poly(pts.card, '#ff9a2b', true);
      if (key === 'part' || key === 'holes') poly(pts.part, '#2bd46b', true);
      if (key === 'card2' || key === 'part2') { poly(pts.card2, '#ff9a2b', false); if (key === 'part2') poly(pts.part2, '#2bd46b', false); }
      if (key === 'holes') {
        const m = partMM(), ppm = m ? dist(S(pts.part[0]), S(pts.part[1])) / m.w : 3; // screen px per mm
        holes.forEach((h) => {
          const s = S(h.p); g.strokeStyle = h.kind && h.kind !== 'hole' ? '#ffd23a' : '#ff3b6b'; g.lineWidth = 3 * d;
          if (h.kind === 'screen') { const s2 = h.p2 ? S(h.p2) : s; g.strokeRect(Math.min(s[0], s2[0]), Math.min(s[1], s2[1]), Math.abs(s2[0] - s[0]) || 8 * d, Math.abs(s2[1] - s[1]) || 8 * d); }
          else { const c = h.kind && h.kind !== 'hole' && KP(h.kind) ? KP(h.kind).cut : { o: 'circle', d: h.d };
            if (c.o === 'cross') { const a = c.w / 2 * ppm, t = c.t / 2 * ppm; g.strokeRect(s[0] - a, s[1] - t, 2 * a, 2 * t); g.strokeRect(s[0] - t, s[1] - a, 2 * t, 2 * a); }
            else { g.beginPath(); g.arc(s[0], s[1], Math.max(4, (c.d || 6) / 2 * ppm), 0, 7); g.stroke(); } }
          if (h.kind && h.kind !== 'hole') { const nm = SHORT[h.kind] || h.kind; g.font = '800 ' + 10 * d + 'px Arial'; g.textAlign = 'center'; g.lineWidth = 3 * d; g.strokeStyle = '#000'; g.strokeText(nm, s[0], s[1] - 8 * d); g.fillStyle = '#ffd23a'; g.fillText(nm, s[0], s[1] - 8 * d); }
        });
      }
      $('mzSay').textContent = say[key];
      const info = $('mzInfo'), m = (key === 'part' || key === 'holes') ? partMM() : null;
      const tagged = which === 'front' && key === 'holes';
      if (m) info.innerHTML = '<b>' + M.name + ': ' + m.w.toFixed(1) + ' x ' + m.h.toFixed(1) + ' mm</b>' + (key === 'holes' ? (tagged ? '. ' + holes.length + ' tagged. Next tap: ' + (M.kind === 'hole' ? 'a ' + hd + ' mm hole' : M.kind === 'screen' ? 'screen corner ' + (holes.length && holes[holes.length - 1].kind === 'screen' && !holes[holes.length - 1].p2 ? '2 of 2' : '1 of 2') : (KINDS.find((k) => k[0] === M.kind) || [0, ''])[1]) : '. ' + holes.length + ' holes, next one ' + hd + ' mm') : '');
      else if (key === 'part2') { const s = CARD[1] / dist(pts.card2[0], pts.card2[1]); info.innerHTML = '<b>Height: ' + (dist(pts.part2[0], pts.part2[1]) * s).toFixed(1) + ' mm</b>'; }
      else info.textContent = 'Card = 85.6 x 54 mm.';
      $('mzHoleSize').hidden = key !== 'holes';
      const kb = $('mzKinds'); kb.hidden = !tagged; kb.querySelectorAll('[data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === M.kind)));
      $('mzHoleSize').querySelectorAll('[data-hd]').forEach((b) => { b.style.display = tagged && M.kind !== 'hole' ? 'none' : ''; });
    }
    const near = (p, arr) => { let b = -1, bd = 1e9; arr.forEach((q, i) => { const s = S(q), dd = Math.hypot(s[0] - p[0], s[1] - p[1]); if (dd < bd) { bd = dd; b = i; } }); return bd < 46 * Math.min(2, devicePixelRatio || 1) ? b : -1; };
    const evp = (e) => { const r = cv.getBoundingClientRect(), d = cv.width / r.width; return [(e.clientX - r.left) * d, (e.clientY - r.top) * d]; };
    cv.onpointerdown = (e) => {
      const key = stage[st], p = evp(e);
      if (key === 'holes') {
        const tagged = which === 'front', last = holes[holes.length - 1];
        if (tagged && M.kind === 'screen' && last && last.kind === 'screen' && !last.p2) { last.p2 = I(p[0], p[1]); draw(); return; }
        const hit = holes.findIndex((h) => { const s = S(h.p); return Math.hypot(s[0] - p[0], s[1] - p[1]) < 30; });
        if (hit > -1) holes.splice(hit, 1); else holes.push(tagged ? { p: I(p[0], p[1]), d: hd, kind: M.kind } : { p: I(p[0], p[1]), d: hd });
        draw(); return;
      }
      sel = near(p, pts[key]); if (sel > -1) cv.setPointerCapture(e.pointerId);
    };
    cv.onpointermove = (e) => { if (sel < 0) return; const p = evp(e); pts[stage[st]][sel] = I(p[0], p[1]); draw(); };
    cv.onpointerup = () => { sel = -1; };
    box.querySelectorAll('[data-hd]').forEach((b) => { b.onclick = () => { hd = Math.max(1, hd + (+b.dataset.hd) * (hd >= 6 ? 1 : 0.5)); draw(); }; });
    $('mzUndo').onclick = () => { holes.pop(); draw(); };
    box.querySelectorAll('[data-kind]').forEach((b) => { b.onclick = () => { M.kind = b.dataset.kind; draw(); }; });
    function rectify() { // the board, straightened and cropped, so you see your own board in the layout
      const m = partMM(); if (!m || !(m.w > 1) || !(m.h > 1)) return null;
      const k = Math.min(4, 360 / Math.max(m.w, m.h)), ow = Math.max(8, Math.round(m.w * k)), oh = Math.max(8, Math.round(m.h * k));
      const T = homography([[0, 0], [ow, 0], [ow, oh], [0, oh]], pts.part); if (!T) return null;
      const sd = img.getContext('2d').getImageData(0, 0, W0, H0).data, out = document.createElement('canvas'); out.width = ow; out.height = oh;
      const og = out.getContext('2d'), id = og.createImageData(ow, oh), od = id.data;
      for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) { const q = T([x + 0.5, y + 0.5]), u = Math.max(0, Math.min(W0 - 1, q[0] | 0)), v = Math.max(0, Math.min(H0 - 1, q[1] | 0)), si = (v * W0 + u) * 4, oi = (y * ow + x) * 4; od[oi] = sd[si]; od[oi + 1] = sd[si + 1]; od[oi + 2] = sd[si + 2]; od[oi + 3] = 255; }
      og.putImageData(id, 0, 0); return out.toDataURL('image/jpeg', 0.72);
    }
    $('mzBack').onclick = () => { if (st > 0) { st--; draw(); } else intro(); };
    $('mzNext').onclick = () => {
      if (st < stage.length - 1) { st++; draw(); return; }
      if (which === 'side') { const s = CARD[1] / dist(pts.card2[0], pts.card2[1]); M.depth = dist(pts.part2[0], pts.part2[1]) * s; return result(); }
      const m = partMM(); shot.card = pts.card; shot.part = pts.part; shot.holes = holes;
      const plain = holes.filter((h) => !h.kind || h.kind === 'hole'), tags = holes.filter((h) => h.kind && h.kind !== 'hole' && (h.kind !== 'screen' || h.p2));
      shot.mm = m ? { w: nominal(m.w), h: nominal(m.h), holes: plain.map((h) => { const c = holeMM(h.p); return { x: c[0], y: c[1], d: nominal(h.d) }; }),
        cuts: tags.map((h) => { if (h.kind === 'screen') { const a = holeMM(h.p), b = holeMM(h.p2); return { kind: 'screen', x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, cut: { o: 'rect', w: nominal(Math.abs(a[0] - b[0])), h: nominal(Math.abs(a[1] - b[1])) } }; }
          const c = holeMM(h.p); return { kind: h.kind, x: c[0], y: c[1], cut: Object.assign({}, KP(h.kind).cut) }; }),
        img: which === 'front' ? rectify() : null } : null;
      if (which === 'front') return askNext();
      return result();
    };
    new ResizeObserver(fit).observe(cv); fit();
  }
  function askNext() {
    shell('Front done', '<div class="say" style="position:static;padding:22px 16px;text-align:left">' + summary() + '</div>',
      '<div class="rowb"><button class="bt go" id="mzB">Now the back</button></div><div class="rowb"><button class="bt" id="mzS">Side, for the height</button><button class="bt" id="mzDone">Done</button></div>');
    $('mzB').onclick = () => cam('back'); $('mzS').onclick = () => cam('side'); $('mzDone').onclick = result;
  }
  function summary() {
    const f = M.shots.front && M.shots.front.mm, b = M.shots.back && M.shots.back.mm;
    let s = '<b>' + M.name + '</b><br>';
    if (f) { const cnt = {}; (f.cuts || []).forEach((c) => { const nm = (KINDS.find((k) => k[0] === c.kind) || [0, c.kind])[1]; cnt[nm] = (cnt[nm] || 0) + 1; });
      s += 'Size: ' + f.w.toFixed(1) + ' x ' + f.h.toFixed(1) + ' mm<br>On the front: ' + (Object.keys(cnt).map((k) => cnt[k] + ' ' + k).join(', ') || 'nothing tagged') + (f.holes.length ? ', ' + f.holes.length + ' other hole' + (f.holes.length > 1 ? 's' : '') : '') + '<br>'; }
    if (b) s += 'Screw holes on the back: ' + b.holes.length + '<br>';
    s += 'Height: ' + M.depth.toFixed(1) + ' mm' + (M.shots.side ? '' : ' (guess, take the side photo to measure)');
    return s;
  }
  function result() {
    const f = M.shots.front && M.shots.front.mm; if (!f) return intro();
    const b = M.shots.back && M.shots.back.mm;
    shell('Your part', '<div class="say" style="position:static;padding:22px 16px;text-align:left">' + summary() + '<p style="color:#aaa;font-weight:600">Phone measuring is good to about 1 mm when the card lies right next to the part. Check one number with a ruler before a long print.</p></div>',
      '<div class="rowb"><button class="bt" id="mzAgain">Measure again</button><button class="bt go" id="mzUse">Add it to my parts</button></div>');
    $('mzAgain').onclick = intro;
    $('mzUse').onclick = () => {
      const P = { cat: 'mine', name: M.name, short: M.name.slice(0, 12), w: +f.w.toFixed(1), h: +f.h.toFixed(1), depth: +M.depth.toFixed(1), link: 'pins', measured: true,
        cut: { o: 'none' }, userHoles: f.holes, userCuts: f.cuts || [], img: f.img || null, mountHoles: b ? b.holes.map((h) => ({ x: -h.x, y: h.y, d: h.d })) : [], hang: M.hang,
        up: (f.cuts || []).reduce((mx, c) => Math.max(mx, (KP(c.kind) && KP(c.kind).up) || 0), 0),
        prints: { knob: (f.cuts || []).filter((c) => KP(c.kind) && KP(c.kind).printed === 'knob').length, dpad: (f.cuts || []).filter((c) => c.kind === 'dpad').length },
        tip: 'Your built board, measured with your phone. Every part you tagged gets its real hole in the deck, the back screw holes get posts under the deck.', src: 'Measured with a card as the ruler' };
      close(); done(P);
    };
  }
  intro();
  return close;
}
