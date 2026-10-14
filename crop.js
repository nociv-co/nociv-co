/* ===== NOCIV crop window: pick a photo, crop it full screen with your fingers, then use it. Same in every tool. ===== */
(function () {
  if (window.nocivCrop) return;
  var css = '.ncrop{position:fixed;inset:0;z-index:100000;background:#141312;display:flex;flex-direction:column;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;padding-top:env(safe-area-inset-top);touch-action:none}' +
    '.ncrop-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px}' +
    '.ncrop-bar b{font-size:13px;letter-spacing:.08em;text-transform:uppercase}' +
    '.ncrop-bar button{font:inherit;font-weight:900;font-size:15px;border:0;border-radius:999px;padding:10px 18px;cursor:pointer}' +
    '.ncrop-x{background:#2c2a27;color:#fff}.ncrop-ok{background:#c8412f;color:#fff}' +
    '.ncrop-stage{flex:1;min-height:0;position:relative;overflow:hidden}.ncrop-stage canvas{position:absolute;inset:0;width:100%;height:100%}' +
    '.ncrop-tools{padding:10px 12px calc(14px + env(safe-area-inset-bottom));display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}.ncrop-tools::-webkit-scrollbar{display:none}' +
    '.ncrop-tools button{flex:none;font:inherit;font-weight:800;font-size:14px;color:#fff;background:#2c2a27;border:1.5px solid #4a4743;border-radius:999px;padding:9px 14px;cursor:pointer}' +
    '.ncrop-tools button[aria-pressed=true]{background:#fff;color:#141312;border-color:#fff}' +
    '.ncrop-hint{text-align:center;font-size:12px;color:#b8b2a7;padding:0 12px 4px}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var DEF = [['free', 'Free'], ['orig', 'Original'], [1, 'Square'], [4 / 5, '4:5'], [3 / 4, '3:4'], [2 / 3, '2:3'], [3 / 2, '3:2'], [16 / 9, '16:9']];
  // nocivCrop(file or image, { aspects: [[ratio w/h or 'free' or 'orig', 'Label'], ...], aspect: default, title, maxPx })  ->  Promise<canvas or null>
  window.nocivCrop = function (src, opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var img = new Image(), url = null;
      if (src instanceof Blob) { url = URL.createObjectURL(src); img.src = url; } else if (typeof src === 'string') img.src = src; else { start(src); return; }
      img.onload = function () { start(img); }; img.onerror = function () { if (url) URL.revokeObjectURL(url); resolve(null); };
      function start(im) {
        var W0 = im.naturalWidth || im.width, H0 = im.naturalHeight || im.height, k0 = Math.min(1, 3000 / Math.max(W0, H0));
        var base = document.createElement('canvas'); base.width = Math.round(W0 * k0); base.height = Math.round(H0 * k0); base.getContext('2d').drawImage(im, 0, 0, base.width, base.height); if (url) URL.revokeObjectURL(url);
        var rot = 0, pic = base;
        var box = document.createElement('div'); box.className = 'ncrop'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Crop your photo');
        box.innerHTML = '<div class="ncrop-bar"><button type="button" class="ncrop-x">Cancel</button><b>' + (opts.title || 'Crop it') + '</b><button type="button" class="ncrop-ok">Done</button></div><div class="ncrop-stage"><canvas></canvas></div><div class="ncrop-hint">Drag to move. Pinch to zoom. Drag a corner to change the box.</div><div class="ncrop-tools"></div>';
        document.body.appendChild(box); document.documentElement.style.overflow = 'hidden';
        var stage = box.querySelector('.ncrop-stage'), cv = stage.querySelector('canvas'), g = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1);
        var aspects = opts.aspects || DEF, asp = opts.aspect != null ? opts.aspect : aspects[0][0];
        var V = { s: 1, x: 0, y: 0 }, F = { x: 0, y: 0, w: 0, h: 0 };
        function ratio() { return asp === 'free' ? null : asp === 'orig' ? pic.width / pic.height : asp; }
        function layout(keepFrame) {
          cv.width = Math.round(stage.clientWidth * dpr); cv.height = Math.round(stage.clientHeight * dpr);
          var pad = 28 * dpr, aw = cv.width - pad * 2, ah = cv.height - pad * 2, r = ratio();
          if (!keepFrame) { var fr = r || pic.width / pic.height, fw = aw, fh = fw / fr; if (fh > ah) { fh = ah; fw = fh * fr; } F = { x: (cv.width - fw) / 2, y: (cv.height - fh) / 2, w: fw, h: fh }; }
          var s = Math.max(F.w / pic.width, F.h / pic.height); V.s = s; V.x = F.x + F.w / 2 - pic.width * s / 2; V.y = F.y + F.h / 2 - pic.height * s / 2; clampV(); draw();
        }
        function clampV() { var s0 = Math.max(F.w / pic.width, F.h / pic.height); if (V.s < s0) { var cx = (F.x + F.w / 2 - V.x) / V.s, cy = (F.y + F.h / 2 - V.y) / V.s; V.s = s0; V.x = F.x + F.w / 2 - cx * V.s; V.y = F.y + F.h / 2 - cy * V.s; } V.x = Math.min(F.x, Math.max(F.x + F.w - pic.width * V.s, V.x)); V.y = Math.min(F.y, Math.max(F.y + F.h - pic.height * V.s, V.y)); }
        function draw() {
          g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#141312'; g.fillRect(0, 0, cv.width, cv.height);
          g.drawImage(pic, V.x, V.y, pic.width * V.s, pic.height * V.s);
          g.fillStyle = 'rgba(20,19,18,.68)'; g.beginPath(); g.rect(0, 0, cv.width, cv.height); g.rect(F.x, F.y + F.h, F.w, -F.h); g.fill('evenodd');
          g.strokeStyle = '#fff'; g.lineWidth = 2 * dpr; g.strokeRect(F.x, F.y, F.w, F.h);
          g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1 * dpr; g.beginPath(); for (var i = 1; i < 3; i++) { g.moveTo(F.x + F.w * i / 3, F.y); g.lineTo(F.x + F.w * i / 3, F.y + F.h); g.moveTo(F.x, F.y + F.h * i / 3); g.lineTo(F.x + F.w, F.y + F.h * i / 3); } g.stroke();
          g.strokeStyle = '#fff'; g.lineWidth = 4 * dpr; var L = 18 * dpr;
          [[F.x, F.y, 1, 1], [F.x + F.w, F.y, -1, 1], [F.x, F.y + F.h, 1, -1], [F.x + F.w, F.y + F.h, -1, -1]].forEach(function (c) { g.beginPath(); g.moveTo(c[0] + c[2] * L, c[1]); g.lineTo(c[0], c[1]); g.lineTo(c[0], c[1] + c[3] * L); g.stroke(); });
        }
        var tools = box.querySelector('.ncrop-tools');
        function buildTools() {
          tools.innerHTML = '';
          aspects.forEach(function (a) { var b = document.createElement('button'); b.type = 'button'; b.textContent = a[1]; b.setAttribute('aria-pressed', String(a[0] === asp)); b.onclick = function () { asp = a[0]; buildTools(); layout(false); }; tools.appendChild(b); });
          var t = document.createElement('button'); t.type = 'button'; t.textContent = 'Turn 90°'; t.onclick = function () { rot = (rot + 90) % 360; var c = document.createElement('canvas'), q = rot % 180 !== 0; c.width = q ? base.height : base.width; c.height = q ? base.width : base.height; var x = c.getContext('2d'); x.translate(c.width / 2, c.height / 2); x.rotate(rot * Math.PI / 180); x.drawImage(base, -base.width / 2, -base.height / 2); pic = c; layout(false); }; tools.appendChild(t);
        }
        buildTools();
        var P = {}, gs = null;
        function pos(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; }
        cv.addEventListener('pointerdown', function (e) {
          cv.setPointerCapture(e.pointerId); var p = pos(e); P[e.pointerId] = p; var ids = Object.keys(P);
          if (ids.length === 2) { var a = P[ids[0]], b = P[ids[1]]; gs = { t: 'pinch', d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, s: V.s, cx: ((a[0] + b[0]) / 2 - V.x) / V.s, cy: ((a[1] + b[1]) / 2 - V.y) / V.s }; return; }
          var hit = 30 * dpr, corner = null; [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (c) { if (Math.hypot(p[0] - (F.x + F.w * c[0]), p[1] - (F.y + F.h * c[1])) < hit) corner = c; });
          gs = corner ? { t: 'corner', c: corner, f: Object.assign({}, F) } : { t: 'pan', x: p[0], y: p[1], vx: V.x, vy: V.y };
        });
        cv.addEventListener('pointermove', function (e) {
          if (!(e.pointerId in P) || !gs) return; var p = pos(e); P[e.pointerId] = p; var ids = Object.keys(P);
          if (gs.t === 'pinch' && ids.length >= 2) { var a = P[ids[0]], b = P[ids[1]], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; V.s = Math.max(0.01, gs.s * Math.hypot(a[0] - b[0], a[1] - b[1]) / gs.d); V.x = mx - gs.cx * V.s; V.y = my - gs.cy * V.s; clampV(); draw(); return; }
          if (gs.t === 'pan') { V.x = gs.vx + p[0] - gs.x; V.y = gs.vy + p[1] - gs.y; clampV(); draw(); return; }
          if (gs.t === 'corner') {
            var f = gs.f, ax = gs.c[0] ? f.x : f.x + f.w, ay = gs.c[1] ? f.y : f.y + f.h, minS = 60 * dpr, r = ratio();
            var nw = Math.max(minS, Math.abs(p[0] - ax)), nh = Math.max(minS, Math.abs(p[1] - ay));
            if (r) { if (nw / nh > r) nw = nh * r; else nh = nw / r; }
            var pad = 10 * dpr; nw = Math.min(nw, gs.c[0] ? cv.width - pad - ax : ax - pad); nh = Math.min(nh, gs.c[1] ? cv.height - pad - ay : ay - pad); if (r) { if (nw / nh > r) nw = nh * r; else nh = nw / r; }
            F = { x: gs.c[0] ? ax : ax - nw, y: gs.c[1] ? ay : ay - nh, w: nw, h: nh }; clampV(); draw();
          }
        });
        function up(e) { delete P[e.pointerId]; var ids = Object.keys(P); if (!ids.length) gs = null; else if (gs && gs.t === 'pinch') gs = { t: 'pan', x: P[ids[0]][0], y: P[ids[0]][1], vx: V.x, vy: V.y }; }
        cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
        cv.addEventListener('wheel', function (e) { e.preventDefault(); var p = pos(e), k = Math.exp(-e.deltaY * 0.0015), cx = (p[0] - V.x) / V.s, cy = (p[1] - V.y) / V.s; V.s *= k; V.x = p[0] - cx * V.s; V.y = p[1] - cy * V.s; clampV(); draw(); }, { passive: false });
        function close(out) { window.removeEventListener('resize', onR); box.remove(); document.documentElement.style.overflow = ''; resolve(out); }
        function onR() { layout(true); }
        window.addEventListener('resize', onR);
        box.querySelector('.ncrop-x').onclick = function () { close(null); };
        box.querySelector('.ncrop-ok').onclick = function () {
          var sx = (F.x - V.x) / V.s, sy = (F.y - V.y) / V.s, sw = F.w / V.s, sh = F.h / V.s, mp = opts.maxPx || 2400, k = Math.min(1, mp / Math.max(sw, sh));
          var out = document.createElement('canvas'); out.width = Math.max(1, Math.round(sw * k)); out.height = Math.max(1, Math.round(sh * k));
          var x = out.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(pic, sx, sy, sw, sh, 0, 0, out.width, out.height); close(out);
        };
        requestAnimationFrame(function () { layout(false); });
      }
    });
  };
})();
