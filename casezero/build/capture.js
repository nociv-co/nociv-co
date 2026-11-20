// Measure with your phone. A bank, ID or library card is the ruler: every one is 85.6 x 54 mm (ISO ID-1).
// Live camera with a green guide and tilt arrows, auto snaps when the phone is level and still.
// Then you drag corners onto the card and the part. Perspective is undone with a homography, so the phone does not
// need to be perfectly square. Nothing leaves the phone.
const CARD = [85.6, 53.98];
// What you can tag on the front photo of a built board. Each one takes its hole size from the parts catalog (parts.js).
// What you can tag on the front photo of a built board, in groups. Each takes its real size from the parts catalog (parts.js).
export const GROUPS = [['Brain', [['pico', 'Pico'], ['picow', 'Pico W'], ['pico2', 'Pico 2'], ['esp32', 'ESP32']]],
  ['Buttons', [['tact12', 'Small button 12 mm'], ['button16', 'Panel button 16 mm'], ['arcade24', 'Arcade 24'], ['arcade30', 'Arcade 30'], ['dpad', 'D-pad']]],
  ['Turn and slide', [['pot', 'Knob'], ['encoder', 'Click wheel'], ['thumb', 'Thumb stick'], ['slider', 'Slider']]],
  ['Screens', [['tft28', '2.8 in'], ['round128', 'Round 1.28'], ['oled096', 'OLED 0.96'], ['hdmi5', '5 in'], ['hdmi7', '7 in']]],
  ['Other', [['led5', 'LED'], ['speaker28', 'Speaker'], ['hole', 'Other hole']]]];
const KINDS = [].concat(...GROUPS.map((g) => g[1]));
const KNAME = (k) => (QK[k] ? QK[k][0] : (KINDS.find((x) => x[0] === k) || [0, k])[1]);
const TNAME = (h) => (h.label || (h.kind === 'q_screen' && h.preset != null && SCREENS[h.preset][1] ? 'Screen ' + SCREENS[h.preset][0] : KNAME(h.kind))); /* a Custom tag can carry its own name */
const SHORT = { tact12: 'B12', button16: 'B16', arcade24: 'A24', arcade30: 'A30', dpad: 'DP', pot: 'K', encoder: 'CW', thumb: 'TS', slider: 'SL', led5: 'LED', speaker28: 'SPK', screen: 'SCREEN', tft28: '2.8 IN', round128: 'ROUND', oled096: 'OLED', hdmi5: '5 IN', hdmi7: '7 IN', pico: 'PICO', picow: 'PICO W', pico2: 'PICO 2', esp32: 'ESP32', hole: 'HOLE' };
const RECT = (k) => { const P = KP(k); return !!(P && (P.cat === 'brain' || P.cat === 'screen')); }; /* drawn at real size, can be turned */ // short tags on the photo so close parts do not overlap
const KP = (k) => (window.CZ && window.CZ.PARTS && window.CZ.PARTS[k]) || null;
const $ = (id) => document.getElementById(id);
// A front photo is a panel (or a box opening): front, front2, front3... Each has its own card, its own locked size and its own tags.
const FR = (w) => String(w).indexOf('front') === 0;
// Quick labels: a part you size yourself, by its outline on the photo. Its cutout is the size you set, in mm.
const SCREENS = [['0.96" OLED', [24, 13]], ['2.8" TFT', [58, 44]], ['3.5"', [74, 49]], ['5"', [110, 66]], ['7"', [156, 88]], ['Custom', null]]; /* the window each screen needs: the picture, not the board */
const QK = { q_screen: ['Screen', [60, 40]], q_board: ['Board / Chip', [50, 25]], q_ctrl: ['Controller', [32, 32]], q_cut: ['Button / Cutout', [12, 12]], q_custom: ['Custom', [20, 20]] };

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
.mz .sayw{flex:none;display:flex;align-items:center;background:#1d1d1d;border-bottom:1px solid #333}.mz .sayw.off:not(.peek){display:none}.mz .sayw .sayh{flex:1;min-width:0;border:0}.mz .sayx{all:unset;cursor:pointer;flex:none;margin:0 8px;padding:5px 9px;border:1.5px solid #888;border-radius:8px;font:800 12px/1 inherit;color:#ddd}.mz .mt .sayq{width:30px;height:30px;font-size:15px}
.mz .sayh{flex:none;padding:7px 12px;background:#1d1d1d;border-bottom:1px solid #333;font:700 13px/1.35 inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}.mz .sayh.open{white-space:normal}
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
.mz [hidden]{display:none!important}
.mz{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}.mz canvas{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.mz .zfit{all:unset;cursor:pointer;margin-left:6px;padding:4px 9px;border:1.5px solid #fff;border-radius:8px;font:800 12px/1 inherit}
.mz .pick .pkh{flex:none;display:flex;gap:6px;align-items:center;padding:0 0 8px}.mz .pick .pkb{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch}.mz .pick .chips{justify-content:flex-start}.mz .pick .pkh h3{flex:1;margin:0;text-align:left}.mz .pick .pkt{all:unset;cursor:pointer;padding:9px 12px;border:1.5px solid #fff;border-radius:10px;font:800 13px/1 inherit}.mz .pick.small{max-height:none;overflow:hidden}.mz .pick.small .pkb{display:none}
.mz .pick{position:absolute;left:0;right:0;bottom:0;max-height:44%;overflow:hidden;display:flex;flex-direction:column;text-align:left;background:#161616;border-top:2px solid #fff;border-radius:16px 16px 0 0;padding:12px 12px 16px}.mz .pick h3{margin:2px 0 8px;font:900 15px/1 inherit;text-transform:uppercase;letter-spacing:.06em}.mz .pick h4{margin:10px 0 6px;font:800 12px/1 inherit;color:#aaa;text-transform:uppercase;letter-spacing:.06em}
.mz .mzsel{display:flex;gap:6px;align-items:center;min-height:42px}.mz .mzsel b{flex:1;min-width:0;font:800 14px/1.2 inherit;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mz .mzsel i{flex:1;font:600 13px/1.3 inherit;font-style:normal;color:#aaa}.mz #mzTags{min-height:36px}.mz .mzsel button{all:unset;cursor:pointer;padding:10px 12px;border:1.5px solid #fff;border-radius:10px;font:800 13px/1 inherit}
.mz .chips{display:flex;gap:6px;flex-wrap:wrap}.mz .chips.scroll{flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px}.mz .chips.scroll button{flex:none;min-height:24px}.mz .pick .chips button{padding:7px 10px;font-size:12.5px}.mz .pick .chips.quick{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.mz .pick .chips.quick button{text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mz .chev{all:unset;cursor:pointer;align-self:center;margin:-4px 0 -2px;padding:2px 18px;font:900 14px/1 inherit;color:#aaa}.mz .mb.min > :not(.chev):not(.nav){display:none!important}.mz .pick h4{margin:7px 0 4px}
.mz .chips button{all:unset;cursor:pointer;padding:9px 12px;border-radius:999px;border:1.5px solid #fff;font:700 13px/1 inherit}.mz .chips button[aria-pressed=true]{background:#fff;color:#111}
`;

export function openMeasure(done, more) { more = more || {};
  if (!document.getElementById('mzcss')) { const st = document.createElement('style'); st.id = 'mzcss'; st.textContent = CSS; document.head.appendChild(st); }
  const box = document.createElement('div'); box.className = 'mz'; document.body.appendChild(box);
  const M = { name: 'Panel / Box Size', ppm: null, pnames: {}, shots: {}, step: 'intro', stream: null, tilt: null, holes: [], depth: 12, hang: 8, kind: null, brain: null, top: 9, under: null };
  const pname = (w) => { if (M.pnames[w]) return M.pnames[w]; const n = w === 'front' ? 1 : +w.slice(5) || 1; return 'Panel ' + n + (n === 1 ? ' (Lid)' : n === 2 ? ' (Base)' : ''); };
  const fronts = () => Object.keys(M.shots).filter(FR).sort((a, b) => (a === 'front' ? 1 : +a.slice(5)) - (b === 'front' ? 1 : +b.slice(5)));
  function applySay() { const w = box.querySelector('.sayw'), q = $('mzHelpT'); if (!w) return; const off = M.sayPref != null ? M.sayPref : !!M.ppm; w.classList.toggle('off', off); if (q) q.hidden = !off; } /* folded by default once the card is locked */
  const close = () => { stopCam(); window.removeEventListener('deviceorientation', onTilt); box.remove(); };
  function stopCam() { if (M.stream) { M.stream.getTracks().forEach((t) => t.stop()); M.stream = null; } }
  function onTilt(e) { M.tilt = [e.beta || 0, e.gamma || 0]; }
  function shell(title, mid, bottom) {
    box.innerHTML = '<div class="mt"><b>' + title + '</b><button class="mx" aria-label="Close">&times;</button></div><div class="mv">' + mid + '</div><div class="mb">' + bottom + '</div>';
    box.querySelector('.mx').onclick = close;
    const sy = box.querySelector('.mv #mzSay'); if (sy) { const w = document.createElement('div'); w.className = 'sayw'; box.insertBefore(w, box.querySelector('.mv')); sy.className = 'sayh'; w.appendChild(sy); sy.title = 'Tap to read it all'; sy.onclick = () => sy.classList.toggle('open');
      const hb = document.createElement('button'); hb.type = 'button'; hb.className = 'sayx'; hb.textContent = 'Hide'; hb.onclick = () => { M.sayPref = true; applySay(); }; w.appendChild(hb);
      const q = document.createElement('button'); q.type = 'button'; q.className = 'mx sayq'; q.id = 'mzHelpT'; q.setAttribute('aria-label', 'Show the instructions'); q.textContent = '?'; q.onclick = () => { M.sayPref = false; applySay(); }; box.querySelector('.mt').insertBefore(q, box.querySelector('.mt .mx')); }
    applySay(); /* the instruction sits in one line over the photo, not on it */
  }

  // 1. what and how
  function intro() {
    shell('Measure with your phone', '<div class="say" style="position:static;padding:22px 16px;text-align:left;font-weight:600;font-size:15px">' +
      '<p style="margin:0 0 12px"><b>You need any bank, ID, gift or library card.</b> They are all the same size, 85.6 x 54 mm, so the card is your ruler.</p>' +
      '<p style="margin:0 0 12px">1. Lay the card flat right next to your panel, box or board, on a plain table.<br>2. Hold your phone flat over both. Follow the arrows. It snaps by itself when it is level.<br>3. <b>Card:</b> the orange dots 1-2 on its top edge, 3-4 on its bottom edge. Next locks the scale.<br>4. <b>Panel / Box Size:</b> the green dots on its corners. Next locks the size.<br>5. <b>Tag parts:</b> + Tag Another Part, pick Screen, Board / Chip, Controller, Button / Cutout or a catalog part, drag it into place and set its size. Tags never change the locked size. Add Panel 2 (Base) the same way.<br>4. Flip the board over like a page (left to right) and tap the screw holes on the back.<br>5. Side photo: board flat, card standing up next to it, phone low and level. It measures how tall your parts are and what hangs under the board.</p>' +
      '<p style="margin:0;color:#aaa">Step back a little and zoom in 2x: the edges bend less. Plain table, good light, no flash. Photos stay on your phone.</p></div>',
      '<input class="nm" id="mzName" value="' + M.name + '" aria-label="What is it" placeholder="What is it? (Panel / Box Size)"><div class="rowb"><button class="bt go" id="mzGo">Start the camera</button></div><div class="rowb"><label class="bt" style="position:relative">Use photos I have<input type="file" accept="image/*" id="mzFile" style="position:absolute;inset:0;opacity:0"></label></div>');
    $('mzName').oninput = (e) => { M.name = e.target.value || 'Panel / Box Size'; };
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
    const label = FR(which) ? pname(which) : which === 'back' ? 'Back (flipped like a page)' : 'Side';
    shell(label, '<video playsinline muted autoplay></video><svg class="ov" id="mzOv"></svg><div class="say" id="mzSay">Hold the phone flat over the card and the part</div>',
      '<button class="shut" id="mzShut" aria-label="Take the photo"></button><div class="rowb"><button class="bt" id="mzCamBack">Back</button><label class="bt" style="position:relative">Use a photo instead<input type="file" accept="image/*" id="mzFile2" style="position:absolute;inset:0;opacity:0"></label></div>');
    $('mzCamBack').onclick = () => { stopCam(); if (M.shots[which]) mark(which, FR(which) ? 2 : 1); else if (M.shots.front && M.shots.front.mm) hub(); else intro(); };
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
      const side = which === 'side', t = M.tilt ? [side ? M.tilt[0] - 90 : M.tilt[0], M.tilt[1]] : null, lvl = t ? (Math.abs(t[0]) < 7 && Math.abs(t[1]) < 7) : null; /* side photo: phone stands upright, so level is 90 degrees */
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
      if (!t) say.textContent = side ? 'Board flat, card standing on its long edge against the board side. Phone low, looking straight at them. Tap the green button.' : 'Card in the corner box, part in the big box. Tap the green button.';
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
  function mark(which, startAt) {
    const shot = M.shots[which], img = shot.img;
    const stage = which === 'side' ? ['card', 'side'] : ['card', 'part', 'holes'];
    let st = Math.min(stage.length - 1, startAt || 0), pts = {}, sel = -1;
    const W0 = img.width, H0 = img.height;
    { const cw = Math.min(W0, H0) * 0.42, ch = cw * CARD[1] / CARD[0], cx = W0 / 2, cy = H0 / 2; /* centered, upright: 1-2 on the top edge, 3-4 on the bottom, card proportions */
      pts.card = shot.card || [[cx - cw / 2, cy - ch / 2], [cx + cw / 2, cy - ch / 2], [cx + cw / 2, cy + ch / 2], [cx - cw / 2, cy + ch / 2]]; }
    pts.part = shot.part || [[W0 * 0.12, H0 * 0.12], [W0 * 0.88, H0 * 0.12], [W0 * 0.88, H0 * 0.88], [W0 * 0.12, H0 * 0.88]];
    pts.side = shot.side || [[W0 * 0.5, H0 * 0.6], [W0 * 0.9, H0 * 0.6], [W0 * 0.7, H0 * 0.45], [W0 * 0.7, H0 * 0.7]]; /* 1-2 the board's top face, 3 top of the tallest part, 4 the lowest thing under the board */
    const holes = shot.holes || [];
    const say = {
      card: 'Move the 4 orange dots onto the card: 1 and 2 on its top edge, 3 and 4 on the bottom, until the white outline sits on its edges. Next locks the scale.',
      part: FR(which) ? 'Panel / Box Size: the 4 green dots onto the corners of your panel or box opening. Next locks the size.' : 'Now the 4 green dots onto the corners of your board. Move slowly for small steps.',
      holes: FR(which) ? '+ Tag Another Part, then drag it into place. Drag a green corner, or W and H, to fit it. The panel size stays locked.' : 'Press on each screw hole, slide until the cross is on it, let go.',
      side: 'Green line on the top face of the board (the side with the buttons). Yellow dot on top of the tallest part. Blue dot on the lowest thing underneath (pins, solder, wires).'
    };
    const NAMES = { card: 'card', part: FR(which) ? 'Panel / Box Size' : 'board edges', holes: FR(which) ? 'tag parts' : 'screw holes', side: 'heights' };
    shell((FR(which) ? pname(which) : which === 'back' ? 'Back' : 'Side') + ': ' + (st + 1) + ' of ' + stage.length, '<canvas class="ph" id="mzC"></canvas><div class="say" id="mzSay"></div>',
      '<button type="button" class="chev" id="mzChev" aria-label="Fold the panel down">&#8964;</button><div class="lst" id="mzInfo"></div><div class="mzsel" id="mzSel" hidden></div><div class="chips scroll" id="mzTags" hidden></div><div class="rowb" id="mzTagRow" hidden><button class="bt go" id="mzAddTag">+ Tag Another Part</button></div><div class="rowb" id="mzQSize" hidden><button class="bt" data-qs="w-1">W -</button><button class="bt" data-qs="w1">W +</button><button class="bt" data-qs="h-1">H -</button><button class="bt" data-qs="h1">H +</button></div><div class="rowb" id="mzHoleSize" hidden><button class="bt" data-hd="-1">Smaller</button><button class="bt" data-hd="1">Bigger</button><button class="bt" id="mzUndo">Undo</button></div><div class="rowb nav"><button class="bt" id="mzBack">Back</button><button class="bt go" id="mzNext">Next</button></div>');
    { const mb = box.querySelector('.mb'), ch = $('mzChev'), set = () => { mb.classList.toggle('min', !!M.mbMin); ch.innerHTML = M.mbMin ? '&#8963;' : '&#8964;'; ch.setAttribute('aria-label', M.mbMin ? 'Show the panel' : 'Fold the panel down'); }; ch.onclick = () => { M.mbMin = !M.mbMin; set(); }; set(); } /* folded: only Back and Next, the whole photo to drag corners on */
    const cv = $('mzC'), g = cv.getContext('2d');
    let k = 1, ox = 0, oy = 0, hd = FR(which) ? 12 : 3;
    let Z = 1, PX = 0, PY = 0; /* pinch zoom: Z times the fitted size, PX PY = how far the photo is moved, in canvas px */
    function place() { const k0 = Math.min(cv.width / W0, cv.height / H0); k = k0 * Z; ox = (cv.width - W0 * k) / 2 + PX; oy = (cv.height - H0 * k) / 2 + PY; }
    function fit() { if (drag) { fit.wait = true; return; } /* never resize the photo under a finger: it jumps */ if (!document.body.contains(cv)) return; const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); cv.width = r.width * d; cv.height = r.height * d; place(); draw(); }
    const S = (p) => [ox + p[0] * k, oy + p[1] * k], I = (x, y) => [(x - ox) / k, (y - oy) / k];
    // The card can lie either way round: its longer edge in the photo is the 85.6 mm one. 1-2 is always the edge the dots start on,
    // so a card stood on end maps 1-2 to 53.98 mm. Mapping the long edge to 85.6 keeps one scale for x and y: a tall lid stays tall.
    function cardDims() { const q = pts.card, a = (dist(q[0], q[1]) + dist(q[3], q[2])) / 2, b = (dist(q[0], q[3]) + dist(q[1], q[2])) / 2; return a >= b ? [CARD[0], CARD[1]] : [CARD[1], CARD[0]]; }
    function cardPpm() { const q = pts.card, a = (dist(q[0], q[1]) + dist(q[3], q[2])) / 2, b = (dist(q[0], q[3]) + dist(q[1], q[2])) / 2; return (Math.max(a, b) / CARD[0] + Math.min(a, b) / CARD[1]) / 2; } /* one px per mm, from both edges */
    function H() { const [cw, ch] = cardDims(); return homography(pts.card, [[0, 0], [cw, 0], [cw, ch], [0, ch]]); }
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
    function sideMM() { /* distances square to the board line, in the card's plane */
      const h = H(); if (!h) return null; const q = pts.side.map(h), ax = q[1][0] - q[0][0], ay = q[1][1] - q[0][1], L = Math.hypot(ax, ay) || 1;
      const off = (p) => Math.abs((p[0] - q[0][0]) * ay - (p[1] - q[0][1]) * ax) / L;
      return { top: off(q[2]), under: Math.max(0, off(q[3]) - 1.6) }; /* 1.6 mm = the board itself, the line is on its top face */
    }
    // The real card outline, rounded corners included (ID-1 cards: 85.6 x 54 mm, corner radius 3.18 mm), mapped onto the photo through the 4 dots.
    // The dots are where the straight edges would meet; matching the curves puts them there.
    function cardOutline() {
      const [cw, ch] = cardDims(), T = homography([[0, 0], [cw, 0], [cw, ch], [0, ch]], pts.card); if (!T) return null;
      const r = 3.18, out = [], corner = (cx, cy, a0) => { for (let i = 0; i <= 8; i++) { const a = a0 + i / 8 * Math.PI / 2; out.push(T([cx + r * Math.cos(a), cy + r * Math.sin(a)])); } };
      corner(cw - r, r, -Math.PI / 2); corner(cw - r, ch - r, 0); corner(r, ch - r, Math.PI / 2); corner(r, r, Math.PI);
      return out;
    }
    function draw() {
      if (!document.body.contains(cv) || !$('mzSay')) return; // this screen is gone
      g.clearRect(0, 0, cv.width, cv.height); g.drawImage(img, ox, oy, W0 * k, H0 * k);
      const key = stage[st], d = Math.min(2, devicePixelRatio || 1);
      const poly = (arr, col, close) => { g.beginPath(); arr.forEach((p, i) => { const s = S(p); i ? g.lineTo(s[0], s[1]) : g.moveTo(s[0], s[1]); }); if (close) g.closePath(); g.strokeStyle = col; g.lineWidth = 3 * d; g.stroke(); arr.forEach((p, i) => { const s = S(p); g.beginPath(); g.arc(s[0], s[1], 13 * d, 0, 7); g.fillStyle = col; g.globalAlpha = .35; g.fill(); g.globalAlpha = 1; g.lineWidth = 3 * d; g.stroke(); g.fillStyle = '#fff'; g.font = '800 ' + 12 * d + 'px Arial'; g.textAlign = 'center'; g.fillText(String(i + 1), s[0], s[1] + 4 * d); }); };
      if (stage.indexOf('card') > -1) { if (key !== 'card') g.globalAlpha = 0.35; poly(pts.card, '#ff9a2b', true); g.globalAlpha = 1; /* locked: faded, so it does not get in the way of the tags */ if (key === 'card') { const ol = cardOutline(); if (ol) { g.beginPath(); ol.forEach((q2, i) => { const s2 = S(q2); i ? g.lineTo(s2[0], s2[1]) : g.moveTo(s2[0], s2[1]); }); g.closePath(); g.strokeStyle = '#fff'; g.lineWidth = 2 * d; g.stroke(); } } }
      if (key === 'part' || key === 'holes') poly(pts.part, '#2bd46b', true);
      if (key === 'side') {
        const P4 = pts.side, a = S(P4[0]), b = S(P4[1]), ux = b[0] - a[0], uy = b[1] - a[1], ul = Math.hypot(ux, uy) || 1, ex = ux / ul * 4000, ey = uy / ul * 4000;
        g.setLineDash([8 * d, 6 * d]); g.strokeStyle = '#2bd46b'; g.lineWidth = 2 * d; g.beginPath(); g.moveTo(a[0] - ex, a[1] - ey); g.lineTo(b[0] + ex, b[1] + ey); g.stroke(); g.setLineDash([]);
        const foot = (p) => { const s0 = S(p), t2 = ((s0[0] - a[0]) * ux + (s0[1] - a[1]) * uy) / (ul * ul); return [a[0] + ux * t2, a[1] + uy * t2]; };
        [[2, '#ffd23a', 'TOP'], [3, '#5aa9ff', 'UNDER']].forEach(([i, col, lab]) => { const s0 = S(P4[i]), f = foot(P4[i]); g.strokeStyle = col; g.lineWidth = 2 * d; g.beginPath(); g.moveTo(s0[0], s0[1]); g.lineTo(f[0], f[1]); g.stroke(); g.font = '900 ' + 10 * d + 'px Arial'; g.textAlign = 'center'; g.fillStyle = col; g.fillText(lab, s0[0], s0[1] - 18 * d); });
        poly([P4[0], P4[1]], '#2bd46b', false);
        [[2, '#ffd23a'], [3, '#5aa9ff']].forEach(([i, col]) => { const s0 = S(P4[i]); g.beginPath(); g.arc(s0[0], s0[1], 13 * d, 0, 7); g.fillStyle = col; g.globalAlpha = .35; g.fill(); g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 3 * d; g.stroke(); g.fillStyle = '#fff'; g.font = '800 ' + 12 * d + 'px Arial'; g.fillText(String(i + 1), s0[0], s0[1] + 4 * d); });
      }
      if (key === 'holes') {
        const m = partMM(), ppm = m ? dist(S(pts.part[0]), S(pts.part[1])) / m.w : 3; // screen px per mm
        holes.forEach((h) => {
          const s0 = S(h.p), on = h === picked, col = !h.kind ? '#ff3b6b' : on ? '#fff' : '#ffd23a'; g.strokeStyle = col; g.lineWidth = (on ? 4 : 3) * d;
          if (QK[h.kind]) { const w = h.sz[0] * ppm, hh = h.sz[1] * ppm, tw = (h.r || 0) % 2 ? hh : w, th = (h.r || 0) % 2 ? w : hh; g.fillStyle = h.kind === 'q_screen' ? 'rgba(143,211,255,.3)' : 'rgba(255,210,58,.18)'; g.fillRect(s0[0] - tw / 2, s0[1] - th / 2, tw, th); g.strokeRect(s0[0] - tw / 2, s0[1] - th / 2, tw, th); }
          else if (h.kind && RECT(h.kind)) {
            const P = KP(h.kind), turned = (h.r || 0) % 2, w = (turned ? P.h : P.w) * ppm, hh = (turned ? P.w : P.h) * ppm;
            g.strokeRect(s0[0] - w / 2, s0[1] - hh / 2, w, hh);
            if (P.cat === 'screen' && P.cut) { const c = P.cut; g.fillStyle = 'rgba(143,211,255,.35)'; if (c.o === 'circle') { g.beginPath(); g.arc(s0[0], s0[1], c.d / 2 * ppm, 0, 7); g.fill(); } else { const cw = (turned ? c.h : c.w) * ppm, ch = (turned ? c.w : c.h) * ppm; g.fillRect(s0[0] - cw / 2, s0[1] - ch / 2, cw, ch); } }
            if (P.cat === 'brain') { const ang = (h.r || 0) * Math.PI / 2, ex = -Math.cos(ang), ey = Math.sin(ang), L = (turned ? hh : w) / 2; g.beginPath(); g.moveTo(s0[0] + ex * (L - 14 * d), s0[1] + ey * (L - 14 * d)); g.lineTo(s0[0] + ex * (L + 10 * d), s0[1] + ey * (L + 10 * d)); g.lineWidth = 4 * d; g.stroke(); g.font = '900 ' + 9 * d + 'px Arial'; g.textAlign = 'center'; g.fillStyle = col; g.fillText('USB', s0[0] + ex * (L + 20 * d), s0[1] + ey * (L + 20 * d) + 3 * d); }
          } else {
            const c = h.kind && h.kind !== 'hole' && KP(h.kind) ? KP(h.kind).cut : { o: 'circle', d: h.d };
            if (c.o === 'cross') { const a2 = c.w / 2 * ppm, t2 = c.t / 2 * ppm; g.strokeRect(s0[0] - a2, s0[1] - t2, 2 * a2, 2 * t2); g.strokeRect(s0[0] - t2, s0[1] - a2, 2 * t2, 2 * a2); }
            else if (c.o === 'rect' || c.o === 'slot') { const w = c.w * ppm, hh = c.h * ppm; g.strokeRect(s0[0] - w / 2, s0[1] - hh / 2, w, hh); }
            else { g.beginPath(); g.arc(s0[0], s0[1], Math.max(4, (c.d || 6) / 2 * ppm), 0, 7); g.stroke(); }
          }
          if (h.kind) { const nm = QK[h.kind] ? TNAME(h).toUpperCase() : SHORT[h.kind] || h.kind; g.font = '800 ' + 10 * d + 'px Arial'; g.textAlign = 'center'; g.lineWidth = 3 * d; g.strokeStyle = '#000'; g.strokeText(nm, s0[0], s0[1] - 8 * d); g.fillStyle = col; g.fillText(nm, s0[0], s0[1] - 8 * d); }
        });
        if (picked && QK[picked.kind]) { const P2 = sppm(), s0 = S(picked.p), t = (picked.r || 0) % 2, w = (t ? picked.sz[1] : picked.sz[0]) * P2 / 2, hh = (t ? picked.sz[0] : picked.sz[1]) * P2 / 2; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => { g.beginPath(); g.arc(s0[0] + sx * w, s0[1] + sy * hh, 9 * d, 0, 7); g.fillStyle = '#2bd46b'; g.fill(); g.strokeStyle = '#0b2414'; g.lineWidth = 2 * d; g.stroke(); }); } /* its 4 corners: drag one to fit the real part */
        if (pending) { const s1 = S(pending); g.strokeStyle = '#2bd46b'; g.lineWidth = 3 * d; g.beginPath(); g.arc(s1[0], s1[1], 14 * d, 0, 7); g.stroke(); g.beginPath(); g.moveTo(s1[0] - 20 * d, s1[1]); g.lineTo(s1[0] + 20 * d, s1[1]); g.moveTo(s1[0], s1[1] - 20 * d); g.lineTo(s1[0], s1[1] + 20 * d); g.stroke(); }
        if (drag && drag.kind === 'new') { const s1 = S(drag.p); g.strokeStyle = '#fff'; g.lineWidth = 2 * d; g.beginPath(); g.arc(s1[0], s1[1], 10 * d, 0, 7); g.stroke(); }
      }
      { const w = box.querySelector('.sayw'); if (!(w && w.classList.contains('peek'))) $('mzSay').textContent = say[key]; } applySay(); /* a warning on show is not written over */
      const info = $('mzInfo'), m = (key === 'part' || key === 'holes') ? partMM() : null;
      const tagged = FR(which) && key === 'holes';
      if (m) info.innerHTML = '<b>' + (FR(which) ? 'Panel / Box Size' : M.name) + ': ' + m.w.toFixed(1) + ' x ' + m.h.toFixed(1) + ' mm' + (key === 'holes' ? ' (locked)' : '') + '</b>' + (key === 'holes' ? '. ' + holes.length + (tagged ? ' tagged.' : ' holes, next one ' + hd + ' mm') : '') + (M.ppm ? '<br><span style="color:#aaa">Card locked (' + (M.cardWay || 'landscape') + '): ' + M.ppm.toFixed(2) + ' px per mm, same across and down</span>' : '') +
        (tagged && holes.length ? '<div id="mzList" style="max-height:66px;overflow:auto;margin-top:4px">' + holes.map((h, i) => { const c = holeMM(h.p), sz = tagSize(h); return '<div' + (h === picked ? ' style="color:#fff"' : '') + '>' + (i + 1) + '. ' + esc(TNAME(h) || 'Hole') + ': ' + sz + ' at ' + (c[0] + m.w / 2).toFixed(1) + ', ' + (c[1] + m.h / 2).toFixed(1) + ' mm</div>'; }).join('') + '</div>' : '');
      else if (key === 'side') { const sm = sideMM(); info.innerHTML = sm ? '<b>Tallest part ' + sm.top.toFixed(1) + ' mm above the board, ' + sm.under.toFixed(1) + ' mm under it</b>' : ''; }
      else { const cd = cardDims(); info.textContent = 'Card = 85.6 x 54 mm, ' + (cd[0] > cd[1] ? 'lying flat' : 'stood on end') + ' (' + cardPpm().toFixed(2) + ' px per mm). 1-2 top edge, 3-4 bottom edge.'; }
      if (Z > 1.01) info.insertAdjacentHTML('beforeend', ' <button type="button" class="zfit" id="mzFit">Fit photo</button>');
      const sb = $('mzSel'), tl = $('mzTags');
      sb.hidden = !tagged; tl.hidden = !tagged; /* both rows stay on the tag step so the photo never jumps */
      if (tagged && !picked) sb.innerHTML = '<i>' + (holes.length ? 'Tap a tag to change, turn or remove it.' : 'Nothing tagged yet.') + '</i>';
      if (tagged && picked) sb.innerHTML = (picked.kind === 'q_custom' ? '<input class="nm" id="mzRen" style="flex:1;min-width:0;height:38px" maxlength="24" aria-label="Name this part" placeholder="Name it (HDMI Switch)" value="' + esc(picked.label || '') + '">' : '<b>' + esc(TNAME(picked)) + (QK[picked.kind] ? ' ' + tagSize(picked) : '') + '</b>') + '<button type="button" id="mzChg">Change</button>' + ((picked.kind === 'q_screen' || (KP(picked.kind) && KP(picked.kind).cat === 'screen')) ? '<button type="button" id="mzPre">' + (picked.preset != null ? SCREENS[picked.preset][0] : 'Preset') + '</button>' : '') + (RECT(picked.kind) || QK[picked.kind] ? '<button type="button" id="mzTurn">Turn</button>' : '') + '<button type="button" id="mzDel">Remove</button>';
      if (tagged) tl.innerHTML = holes.map((h, i) => '<button type="button" data-tag="' + i + '" aria-pressed="' + (h === picked) + '">' + (i + 1) + ' ' + esc(QK[h.kind] ? TNAME(h) : SHORT[h.kind] || h.kind || 'hole') + '</button>').join('');
      $('mzTagRow').hidden = !tagged; $('mzQSize').hidden = !(tagged && picked && QK[picked.kind]);
      $('mzHoleSize').hidden = key !== 'holes' || (tagged && !(picked && picked.kind === 'hole'));
      $('mzHoleSize').querySelectorAll('[data-hd]').forEach((b) => { b.style.display = tagged && !(picked && picked.kind === 'hole') ? 'none' : ''; });
      { const tb = box.querySelector('.mt b'); if (tb) tb.textContent = (FR(which) ? pname(which) : which === 'back' ? 'Back' : 'Side') + ' ' + (st + 1) + ' of ' + stage.length + ': ' + NAMES[key]; }
      $('mzNext').textContent = st < stage.length - 1 ? 'Next' : (FR(which) ? 'Done' : which === 'back' ? 'Back done' : 'Side done');
      $('mzBack').textContent = st > 0 ? (stage[st] === 'holes' && FR(which) ? 'Change size' : 'Back') : 'New photo';
      if (loupe) drawLoupe(loupe, d);
      wireBar();
    }
    // magnifier: while a finger is down, a round close-up shows exactly where the dot or tag lands (the finger hides it)
    let loupe = null, drag = null, picked = null, pending = null;
    const tagSize = (h) => { if (QK[h.kind]) return ((h.r || 0) % 2 ? h.sz[1] + ' x ' + h.sz[0] : h.sz[0] + ' x ' + h.sz[1]) + ' mm'; const P = h.kind && h.kind !== 'hole' && KP(h.kind); if (P && (RECT(h.kind) || !P.cut || P.cut.o === 'rect')) return P.w + ' x ' + P.h + ' mm'; const c = P ? P.cut : null; return c && c.d ? c.d + ' mm round' : (h.d || 6) + ' mm hole'; };
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    function drawLoupe(q, d) {
      const R = 64 * d, Z = 4, s = S(q), cx = s[0] < cv.width / 2 ? cv.width - R - 10 * d : R + 10 * d, cy = R + 10 * d, r = R / (k * Z);
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.closePath(); g.fillStyle = '#000'; g.fill(); g.clip();
      g.drawImage(img, q[0] - r, q[1] - r, 2 * r, 2 * r, cx - R, cy - R, 2 * R, 2 * R);
      if (stage[st] === 'card') { const ol = cardOutline(); if (ol) { const zz = R / r; g.beginPath(); ol.forEach((p2, i) => { const x = cx + (p2[0] - q[0]) * zz, y = cy + (p2[1] - q[1]) * zz; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); g.strokeStyle = '#fff'; g.lineWidth = 2 * d; g.stroke(); } } /* the card outline in the close-up too */
      g.strokeStyle = '#ff3b6b'; g.lineWidth = 1.5 * d; g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx - 5 * d, cy); g.moveTo(cx + 5 * d, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy - 5 * d); g.moveTo(cx, cy + 5 * d); g.lineTo(cx, cy + R); g.stroke();
      g.restore(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.strokeStyle = '#fff'; g.lineWidth = 3 * d; g.stroke();
    }
    const near = (p, arr) => { let b = -1, bd = 1e9; arr.forEach((q, i) => { const s = S(q), dd = Math.hypot(s[0] - p[0], s[1] - p[1]); if (dd < bd) { bd = dd; b = i; } }); return bd < 46 * Math.min(2, devicePixelRatio || 1) ? b : -1; };
    const evp = (e) => { const r = cv.getBoundingClientRect(), d = cv.width / r.width; return [(e.clientX - r.left) * d, (e.clientY - r.top) * d]; };
    // Corners: the dot does not jump to the finger, it moves with it from where it was. Slow finger = slow dot (down to a third), for exact corners.
    // Tags (front): press on an empty spot, slide while the close-up shows it, let go, then say what it is. Press on a tag to pick it and slide to move it.
    // Screw holes (back): press, slide, let go. A tap on a hole without sliding takes it off.
    const hitTag = (p) => {
      const m = partMM(), ppm = m ? dist(S(pts.part[0]), S(pts.part[1])) / m.w : 3, dpr = Math.min(2, devicePixelRatio || 1);
      for (let i = holes.length - 1; i >= 0; i--) { const h = holes[i], s0 = S(h.p);
        if (QK[h.kind]) { const t = (h.r || 0) % 2, w = (t ? h.sz[1] : h.sz[0]) * ppm / 2, hh = (t ? h.sz[0] : h.sz[1]) * ppm / 2; if (Math.abs(p[0] - s0[0]) < Math.max(w, 14 * dpr) && Math.abs(p[1] - s0[1]) < Math.max(hh, 14 * dpr)) return h; }
        else if (h.kind && RECT(h.kind)) { const P = KP(h.kind), t = (h.r || 0) % 2, w = (t ? P.h : P.w) * ppm / 2, hh = (t ? P.w : P.h) * ppm / 2; if (Math.abs(p[0] - s0[0]) < w && Math.abs(p[1] - s0[1]) < hh) return h; }
        else if (Math.hypot(p[0] - s0[0], p[1] - s0[1]) < Math.max(16 * dpr, ((h.kind && KP(h.kind) && KP(h.kind).cut && KP(h.kind).cut.d) || h.d || 6) / 2 * ppm)) return h; }
      return null;
    };
    const sppm = () => { const m = partMM(); return m ? dist(S(pts.part[0]), S(pts.part[1])) / m.w : 3; }; /* screen px per mm on the panel */
    const hitCorner = (p) => { if (!picked || !QK[picked.kind]) return null; const P2 = sppm(), s0 = S(picked.p), t = (picked.r || 0) % 2, w = (t ? picked.sz[1] : picked.sz[0]) * P2 / 2, hh = (t ? picked.sz[0] : picked.sz[1]) * P2 / 2, dpr = Math.min(2, devicePixelRatio || 1);
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) if (Math.hypot(p[0] - (s0[0] + sx * w), p[1] - (s0[1] + sy * hh)) < 22 * dpr) return { sx, sy, o: [s0[0] - sx * w, s0[1] - sy * hh] }; return null; };
    const touches = new Map(); let pinch = null, hold = false;
    const inBoard = (q) => { const P4 = pts.part; let c = false; for (let i = 0, j = 3; i < 4; j = i++) { const a = P4[i], b = P4[j]; if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
    const note = (t) => { const n = $('mzSay'), w = box.querySelector('.sayw'); if (n) { n.textContent = t; if (w) w.classList.add('peek'); clearTimeout(note.t); note.t = setTimeout(() => { if (w) w.classList.remove('peek'); draw(); }, 1600); } }; /* a warning shows even when the banner is folded */
    cv.onpointerdown = (e) => {
      e.preventDefault(); const key = stage[st], p = evp(e); try { cv.setPointerCapture(e.pointerId); } catch (er) { /* not a real pointer */ } touches.set(e.pointerId, p);
      if (touches.size === 2) { /* second finger: pinch to zoom, cancel whatever the first finger started */
        const [a, b] = [...touches.values()], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        drag = null; loupe = null; sel = -1; hold = true; pinch = { d0: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, Z0: Z, ip: I(m[0], m[1]) }; draw(); return;
      }
      if (hold) return;
      if (key === 'holes') {
        const cn = hitCorner(p); if (cn) { drag = { kind: 'corner', t: picked, o: cn.o }; loupe = I(p[0], p[1]); draw(); return; } /* the opposite corner stays put */
        const h = hitTag(p);
        if (h) { picked = FR(which) ? h : null; drag = { kind: 'move', t: h, off: [h.p[0] - I(p[0], p[1])[0], h.p[1] - I(p[0], p[1])[1]], f0: p, moved: false }; loupe = h.p; }
        else { picked = null; drag = { kind: 'new', p: I(p[0], p[1]) }; loupe = drag.p; }
        draw(); return;
      }
      sel = near(p, pts[key]); if (sel < 0) return;
      drag = { kind: 'dot', key, i: sel, last: p }; loupe = pts[key][sel]; draw();
    };
    cv.onpointermove = (e) => {
      if (touches.has(e.pointerId)) touches.set(e.pointerId, evp(e));
      if (pinch && touches.size >= 2) {
        const [a, b] = [...touches.values()], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        Z = Math.max(1, Math.min(5, pinch.Z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch.d0));
        const k0 = Math.min(cv.width / W0, cv.height / H0); k = k0 * Z; PX = m[0] - pinch.ip[0] * k - (cv.width - W0 * k) / 2; PY = m[1] - pinch.ip[1] * k - (cv.height - H0 * k) / 2;
        if (Z === 1) { PX = 0; PY = 0; } place(); draw(); return;
      }
      if (!drag) return; const p = evp(e), dpr = Math.min(2, devicePixelRatio || 1);
      if (drag.kind === 'dot') {
        const dx = p[0] - drag.last[0], dy = p[1] - drag.last[1], v = Math.hypot(dx, dy) / dpr, gain = v > 14 ? 1 : 0.3 + 0.7 * v / 14;
        const q = pts[drag.key][drag.i]; q[0] = Math.max(0, Math.min(W0, q[0] + dx * gain / k)); q[1] = Math.max(0, Math.min(H0, q[1] + dy * gain / k)); drag.last = p; loupe = q;
      } else if (drag.kind === 'corner') { const P2 = sppm(), t = drag.t, tw = Math.max(4, Math.abs(p[0] - drag.o[0])), th = Math.max(4, Math.abs(p[1] - drag.o[1])), r = (v) => Math.max(2, Math.round(v / P2 * 2) / 2), turned = (t.r || 0) % 2;
        t.sz = turned ? [r(th), r(tw)] : [r(tw), r(th)]; t.p = I((p[0] + drag.o[0]) / 2, (p[1] + drag.o[1]) / 2); if (t.kind === 'q_screen') t.preset = SCREENS.length - 1; loupe = I(p[0], p[1]); }
      else if (drag.kind === 'move') { if (Math.hypot(p[0] - drag.f0[0], p[1] - drag.f0[1]) > 8 * dpr) drag.moved = true; const q = I(p[0], p[1]); drag.t.p = [q[0] + drag.off[0], q[1] + drag.off[1]]; loupe = drag.t.p; }
      else { drag.p = I(p[0], p[1]); loupe = drag.p; }
      draw();
    };
    const endDrag = (ok) => {
      const dr = drag; drag = null; loupe = null; sel = -1; if (fit.wait) { fit.wait = false; fit(); } if (!dr) return;
      if (ok && dr.kind === 'new' && !inBoard(dr.p)) { draw(); note('Tags go on your board, inside the green dots. Two fingers zoom.'); return; }
      if (ok && dr.kind === 'new') { if (FR(which)) { draw(); openPick(dr.p); return; } holes.push({ p: dr.p, d: hd }); }
      if (ok && dr.kind === 'move' && !dr.moved && !FR(which)) holes.splice(holes.indexOf(dr.t), 1);
      draw();
    };
    const lift = (e, ok) => { touches.delete(e.pointerId); if (pinch) { if (touches.size < 2) pinch = null; if (!touches.size) hold = false; return; } if (!touches.size) hold = false; endDrag(ok); };
    cv.onpointerup = (e) => lift(e, true);
    cv.onpointercancel = (e) => lift(e, false);
    // "What is it?": a sheet over the photo with every kind in groups. The last kind used is first, for speed.
    function openPick(pt) {
      const mv = box.querySelector('.mv'), old = mv.querySelector('.pick'); if (old) old.remove();
      const el = document.createElement('div'); el.className = 'pick'; pending = pt; draw();
      el.innerHTML = '<div class="pkh"><h3>What is it?</h3><button type="button" class="pkt" data-hide="1">Hide</button><button type="button" class="pkt" data-k="">Cancel</button></div><div class="pkb">' + (M.kind && pt ? '<div class="chips"><button type="button" data-k="' + M.kind + '" aria-pressed="true">Same as last: ' + esc(KNAME(M.kind)) + '</button></div>' : '') +
        '<h4>Quick</h4><div class="chips quick">' + Object.keys(QK).map((q) => '<button type="button" data-k="' + q + '">' + QK[q][0] + '</button>').join('') + '</div>' + GROUPS.map((gr) => '<h4>' + gr[0] + '</h4><div class="chips scroll">' + gr[1].map((x) => '<button type="button" data-k="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>').join('') + '</div>';
      mv.appendChild(el);
      el.onclick = (ev) => {
        const hb = ev.target.closest('[data-hide]'); if (hb) { const sm = el.classList.toggle('small'); hb.textContent = sm ? 'Show' : 'Hide'; return; } /* drop it down to see the photo */
        const b = ev.target.closest('[data-k]'); if (!b) return; const kd = b.dataset.k; el.remove(); pending = null; if (!kd) { draw(); return; }
        M.kind = kd; if (pt) { const t = { p: pt, kind: kd, d: hd, r: 0 }; if (QK[kd]) t.sz = QK[kd][1].slice(); if (kd === 'q_screen') { t.preset = 1; t.sz = SCREENS[1][1].slice(); } holes.push(t); picked = t; } else if (picked) { picked.kind = kd; picked.r = picked.r || 0; if (QK[kd] && !picked.sz) picked.sz = QK[kd][1].slice(); } draw(); };
    }
    function wireBar() {
      const zf = $('mzFit'); if (zf) zf.onclick = () => { Z = 1; PX = 0; PY = 0; place(); draw(); };
      const pr = $('mzPre'); if (pr) pr.onclick = () => { /* the next screen size; a catalog screen becomes a sized screen tag */ const i = picked.preset == null ? 0 : (picked.preset + 1) % SCREENS.length, s2 = SCREENS[i][1]; if (picked.kind !== 'q_screen') { picked.kind = 'q_screen'; picked.sz = picked.sz || [60, 40]; } picked.preset = i; if (s2) picked.sz = s2.slice(); draw(); };
      const rn = $('mzRen'); if (rn) { rn.oninput = () => { picked.label = rn.value.slice(0, 24); const L = $('mzList'), i = holes.indexOf(picked), b2 = box.querySelector('[data-tag="' + i + '"]'); if (b2) b2.textContent = (i + 1) + ' ' + (picked.label || 'Custom'); if (L && L.children[i]) L.children[i].firstChild.textContent = (i + 1) + '. ' + (picked.label || 'Custom') + ': ' + L.children[i].textContent.split(': ').slice(1).join(': '); }; rn.onchange = () => draw(); } /* typing does not redraw the bar, so the keyboard stays up */
      const c = $('mzChg'), t = $('mzTurn'), x = $('mzDel');
      if (c) c.onclick = () => openPick(null); if (t) t.onclick = () => { picked.r = ((picked.r || 0) + 1) % 4; draw(); }; if (x) x.onclick = () => { holes.splice(holes.indexOf(picked), 1); picked = null; draw(); };
      box.querySelectorAll('[data-tag]').forEach((b) => { b.onclick = () => { picked = holes[+b.dataset.tag]; draw(); }; });
    }
    $('mzAddTag').onclick = () => { const P4 = pts.part, n = holes.length, c = [(P4[0][0] + P4[1][0] + P4[2][0] + P4[3][0]) / 4 + (n % 3 - 1) * W0 * 0.04, (P4[0][1] + P4[1][1] + P4[2][1] + P4[3][1]) / 4 + (Math.floor(n / 3) % 3 - 1) * H0 * 0.04]; picked = null; openPick(c); }; /* lands in the middle of the panel: drag it into place */
    box.querySelectorAll('[data-qs]').forEach((b) => { b.onclick = () => { if (!picked || !QK[picked.kind]) return; const v = b.dataset.qs, i = v[0] === 'w' ? 0 : 1; picked.sz[i] = Math.max(2, Math.min(400, picked.sz[i] + +v.slice(1))); draw(); }; });
    box.querySelectorAll('[data-hd]').forEach((b) => { b.onclick = () => { hd = Math.max(1, hd + (+b.dataset.hd) * (hd >= 6 ? 1 : 0.5)); draw(); }; });
    $('mzUndo').onclick = () => { holes.pop(); picked = null; draw(); };
    function rectify() { // the board, straightened and cropped, so you see your own board in the layout
      const m = partMM(); if (!m || !(m.w > 1) || !(m.h > 1)) return null;
      const k = Math.min(4, 360 / Math.max(m.w, m.h)), ow = Math.max(8, Math.round(m.w * k)), oh = Math.max(8, Math.round(m.h * k));
      const T = homography([[0, 0], [ow, 0], [ow, oh], [0, oh]], pts.part); if (!T) return null;
      const sd = img.getContext('2d').getImageData(0, 0, W0, H0).data, out = document.createElement('canvas'); out.width = ow; out.height = oh;
      const og = out.getContext('2d'), id = og.createImageData(ow, oh), od = id.data;
      for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) { const q = T([x + 0.5, y + 0.5]), u = Math.max(0, Math.min(W0 - 1, q[0] | 0)), v = Math.max(0, Math.min(H0 - 1, q[1] | 0)), si = (v * W0 + u) * 4, oi = (y * ow + x) * 4; od[oi] = sd[si]; od[oi + 1] = sd[si + 1]; od[oi + 2] = sd[si + 2]; od[oi + 3] = 255; }
      og.putImageData(id, 0, 0); return out.toDataURL('image/jpeg', 0.72);
    }
    $('mzBack').onclick = () => { if (st > 0) { st--; draw(); } else cam(which); }; /* never throws away the tags: the first step offers a new photo instead */
    $('mzNext').onclick = () => {
      if (stage[st] === 'card') { M.ppm = cardPpm(); M.cardWay = cardDims()[0] > cardDims()[1] ? 'landscape' : 'portrait'; shot.card = pts.card.map((p) => p.slice()); } /* the card is locked: its scale holds for the next steps */
      if (stage[st] === 'part') { shot.part = pts.part.map((p) => p.slice()); } /* the size is locked: tags never change it */
      if (st < stage.length - 1) { st++; draw(); return; }
      if (which === 'side') { const sm = sideMM(); shot.card = pts.card; shot.side = pts.side; if (sm) { shot.mm = sm; M.top = Math.max(4, Math.round(sm.top * 2) / 2); M.under = Math.round(sm.under * 2) / 2; } return hub(); }
      const m = partMM(); shot.card = pts.card; shot.part = pts.part; shot.holes = holes;
      const plain = holes.filter((h) => !h.kind || h.kind === 'hole'), tags = holes.filter((h) => h.kind && h.kind !== 'hole' && KP(h.kind)), quick = holes.filter((h) => QK[h.kind]);
      shot.mm = m ? { w: nominal(m.w), h: nominal(m.h), holes: plain.map((h) => { const c = holeMM(h.p); return { x: c[0], y: c[1], d: nominal(h.d) }; }),
        kids: tags.map((h) => { const c = holeMM(h.p); return { type: h.kind, x: Math.round(c[0] * 10) / 10, y: Math.round(c[1] * 10) / 10, r: h.r || 0 }; }),
        cuts: quick.map((h) => { const c = holeMM(h.p), t = (h.r || 0) % 2; return { kind: h.kind, label: (h.label || '').trim() || TNAME(h), w: t ? h.sz[1] : h.sz[0], h: t ? h.sz[0] : h.sz[1], x: Math.round(c[0] * 10) / 10, y: Math.round(c[1] * 10) / 10 }; }),
        img: FR(which) ? rectify() : null } : null;
      return hub();
    };
    cv.__set = (key, arr) => { pts[key] = arr.map((p) => p.slice()); draw(); }; cv.__corners = () => { if (!picked || !QK[picked.kind]) return []; const P2 = sppm(), s0 = S(picked.p), t = (picked.r || 0) % 2, w = (t ? picked.sz[1] : picked.sz[0]) * P2 / 2, hh = (t ? picked.sz[0] : picked.sz[1]) * P2 / 2; return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => [s0[0] + sx * w, s0[1] + sy * hh]); }; cv.__img = (cx, cy) => { const r = cv.getBoundingClientRect(), d = cv.width / r.width; return I((cx - r.left) * d, (cy - r.top) * d); }; cv.__toImg = (p) => I(p[0], p[1]); /* for the automated tests: put the dots exactly */
    new ResizeObserver(fit).observe(cv); fit();
  }
  /* The hub: every photo has its own row, done ones can be opened again with their tags kept. Nothing here starts over. */
  function hub() {
    const row = (w, label, why) => { const has = M.shots[w] && M.shots[w].mm; return '<div class="rowb"><button class="bt' + (has ? '' : ' go') + '" data-shot="' + w + '">' + (has ? 'Change ' + (FR(w) ? label : 'the ' + label + ' photo') : 'Take the ' + label + ' photo') + '</button></div>' + (has ? '' : '<p style="margin:-4px 0 8px;color:#aaa;font:600 13px/1.3 inherit">' + why + '</p>'); };
    shell('Your photos', '<div class="say" style="position:static;padding:22px 16px;text-align:left">' + summary() + '</div>',
      fronts().concat(fronts().length ? [] : ['front']).map((w) => row(w, pname(w), '')).join('') + (fronts().some((w) => M.shots[w].mm) ? '<div class="rowb"><button class="bt" id="mzMore">+ Add another panel (' + pname('front' + (fronts().length + 1)) + ')</button></div>' : '') + row('back', 'back', 'Screw holes, so the case has posts for them.') + row('side', 'side', 'How tall your parts are and what hangs under the board.') + '<div class="rowb"><button class="bt go" id="mzDone">Done with photos</button></div>');
    { const mm = $('mzMore'); if (mm) mm.onclick = () => cam('front' + (fronts().length + 1)); }
    box.querySelectorAll('[data-shot]').forEach((b) => { b.onclick = () => { const w = b.dataset.shot; if (M.shots[w]) mark(w, FR(w) ? 2 : w === 'side' ? 1 : 2); else cam(w); }; });
    $('mzDone').onclick = result;
  }
  function summary() {
    const b = M.shots.back && M.shots.back.mm;
    let s = '<b>' + M.name + '</b><br>';
    fronts().forEach((w) => { const f = M.shots[w].mm; if (!f) return; const cnt = {}; (f.kids || []).forEach((c) => { const nm = KNAME(c.type); cnt[nm] = (cnt[nm] || 0) + 1; }); (f.cuts || []).forEach((c) => { cnt[c.label] = (cnt[c.label] || 0) + 1; });
      s += '<b>' + pname(w) + '</b>: ' + f.w.toFixed(1) + ' x ' + f.h.toFixed(1) + ' mm (locked)<br>On it: ' + (Object.keys(cnt).map((x) => cnt[x] + ' ' + x).join(', ') || 'nothing tagged') + (f.holes.length ? ', ' + f.holes.length + ' other hole' + (f.holes.length > 1 ? 's' : '') : '') + '<br>'; });
    if (b) s += 'Screw holes on the back: ' + b.holes.length + '<br>';
    s += M.under != null ? 'Tallest part ' + M.top.toFixed(1) + ' mm above the board, ' + M.under.toFixed(1) + ' mm under it' : 'Heights: not measured yet (side photo)';
    return s;
  }
  function panelsOut() { return fronts().filter((w) => M.shots[w].mm).map((w) => { const f = M.shots[w].mm; return { name: pname(w), w: f.w, h: f.h, kids: f.kids || [], cuts: f.cuts || [], holes: f.holes || [] }; }); }
  function result() {
    const f = M.shots.front && M.shots.front.mm; if (!f) return intro();
    if (!more.panels && !more.case) return boardResult();
    const ps = panelsOut(), ST = ((window.CZ && window.CZ.STYLES) || []).filter((x) => x[0] !== 'panel');
    shell('Use what you measured', '<div class="say" style="position:static;padding:22px 16px;text-align:left">' + summary() + '</div>',
      (more.panels ? '<div class="rowb"><button class="bt go" id="mzPanels">' + (more.useLabel ? more.useLabel + ': ' + ps[0].w.toFixed(1) + ' x ' + ps[0].h.toFixed(1) + ' mm' : 'Build ' + (ps.length > 1 ? ps.length + ' panels' : 'the panel') + ' at ' + ps.map((p) => p.w.toFixed(1) + ' x ' + p.h.toFixed(1)).join(' and ') + ' mm') + '</button></div>' : '') +
      (more.case ? '<div class="lst"><b>Or size a Case Zero body to fit ' + ps[0].name + ' (plus your clearance):</b></div><div class="chips" id="mzStyles">' + ST.map((x) => '<button type="button" data-st="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' : '') +
      '<div class="rowb"><button class="bt" id="mzAgain">Back to photos</button><button class="bt" id="mzBoard">Add as my built board</button></div>');
    $('mzAgain').onclick = hub; $('mzBoard').onclick = boardResult;
    if ($('mzPanels')) $('mzPanels').onclick = () => { close(); more.panels(ps); };
    box.querySelectorAll('[data-st]').forEach((b) => { b.onclick = () => { close(); more.case(b.dataset.st, ps); }; });
  }
  function boardResult() {
    const f = M.shots.front && M.shots.front.mm; if (!f) return intro();
    const b = M.shots.back && M.shots.back.mm;
    const BR = [['pico', 'Pico'], ['picow', 'Pico W'], ['pico2', 'Pico 2'], ['esp32', 'ESP32'], ['other', 'Other'], ['none', 'None']];
    const hasBrain = (f.kids || []).some((c) => KP(c.type) && KP(c.type).cat === 'brain'); M.top = M.top || 9;
    shell('Your board', '<div class="say" style="position:static;padding:22px 16px;text-align:left">' + summary() + '<p style="color:#aaa;font-weight:600">Phone measuring is good to about 1 mm when the card lies right next to the board. Check one number with a ruler before a long print.</p></div>',
      (hasBrain ? '' : '<div class="lst"><b>No brain tagged. Which is on the board?</b></div><div class="chips" id="mzBrain">' + BR.map((x) => '<button type="button" data-br="' + x[0] + '" aria-pressed="' + (M.brain === x[0]) + '">' + x[1] + '</button>').join('') + '</div>') +
      '<div class="lst"><b>How tall is the tallest button, from the board to its top?</b> The top of the case sits so it pokes through 1.5 mm.</div><div class="rowb"><button class="bt" id="mzTopL">-</button><button class="bt" id="mzTopV" style="flex:2">' + M.top + ' mm</button><button class="bt" id="mzTopM">+</button></div>' +
      '<div class="rowb"><button class="bt" id="mzAgain">Back to photos</button><button class="bt go" id="mzUse">Add it to my parts</button></div>');
    box.querySelectorAll('[data-br]').forEach((x) => { x.onclick = () => { M.brain = x.dataset.br; box.querySelectorAll('[data-br]').forEach((y) => y.setAttribute('aria-pressed', String(y === x))); }; });
    const topSet = (v) => { M.top = Math.max(4, Math.min(40, M.top + v)); $('mzTopV').textContent = M.top + ' mm'; };
    $('mzTopL').onclick = () => topSet(-1); $('mzTopM').onclick = () => topSet(1);
    $('mzAgain').onclick = hub;
    $('mzUse').onclick = () => {
      const P = { cat: 'mine', board: true, name: M.name, short: M.name.slice(0, 12), w: +f.w.toFixed(1), h: +f.h.toFixed(1), link: 'pins', measured: true, brain: hasBrain ? null : M.brain, top: M.top, under: M.under,
        cut: { o: 'none' }, userHoles: f.holes, kids: f.kids || [], img: f.img || null, mountHoles: b ? b.holes.map((h) => ({ x: -h.x, y: h.y, d: h.d })) : [],
        tip: 'Your built board, measured with your phone. It sits inside under the top, every part on it is its own part you can change.', src: 'Measured with a card as the ruler' };
      close(); done(P);
    };
  }
  intro();
  return close;
}
