/* NOCIV admin: Pin & Button Sheets.
   Upload pin art, pick how many rows of each, get print-ready Letter sheets for a
   button maker, a pin mockup picture for each design, and add what you made to stock.
   Needs: admin.html (supabaseClient, section #sec-pins) and crop.js (optional, for cropping). */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  if (!$('sec-pins')) return;
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };
  var PAPER = { letter: [8.5, 11], a4: [8.27, 11.69] };
  var DPI = 300;
  // VEVOR 1.25 in / 32 mm quick change. Numbers from the VEVOR listing (button 1.26 in, paper circle 1.73 in / 44 mm).
  var MACHINES = {
    vevor32: { finish: 1.25, cut: 1.73, note: 'VEVOR 1.25 in (32 mm). The 1.73 in (44 mm) paper circle is from the VEVOR listing. Cut one circle with your cutter, press one pin, and check the edge wraps clean before you print a full sheet. If it is off, type your real paper circle size below.' },
    custom: { finish: 1.25, cut: 1.73, note: 'Type the finished size of your button and the size of the paper circle your cutter makes.' }
  };
  var designs = [], uid = 0, page = 0, products = [], timer = null, restored = false, saveT = null;
  var CFG_IDS = ['pinMachine', 'pinFinish', 'pinCut', 'pinMargin', 'pinGap', 'pinPaper', 'pinOutline', 'pinBg'];

  // ---- keep your work if the page reloads (phone browsers do this a lot). Saved only on this device. ----
  function idb() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open('nociv-pins', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
  }
  function idbDo(mode, fn) { return idb().then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('kv', mode), q = fn(t.objectStore('kv')); t.oncomplete = function () { res(q && q.result); db.close(); }; t.onerror = function () { rej(t.error); }; }); }); }
  function queueSave() {
    if (!restored) return; clearTimeout(saveT);
    saveT = setTimeout(async function () {
      try {
        var list = [];
        for (var i = 0; i < designs.length; i++) { var d = designs[i], cv = d.art, c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; c2.getContext('2d').drawImage(cv, 0, 0); var b = await toBlob(c2, 'image/png'); c2.width = c2.height = 0; if (b) list.push({ name: d.name, count: d.count, productId: d.productId, added: d.added, art: b }); }
        var conf = {}; CFG_IDS.forEach(function (id) { conf[id] = $(id).type === 'checkbox' ? $(id).checked : $(id).value; });
        await idbDo('readwrite', function (st) { return st.put({ list: list, conf: conf, savedAt: Date.now() }, 'state'); });
      } catch (e) { /* private mode or no space: the tool still works, it just will not remember */ }
    }, 500);
  }
  async function restore() {
    try {
      var st = await idbDo('readonly', function (s2) { return s2.get('state'); });
      if (st && st.conf) CFG_IDS.forEach(function (id) { if (st.conf[id] != null) { if ($(id).type === 'checkbox') $(id).checked = !!st.conf[id]; else $(id).value = st.conf[id]; } });
      if (st && st.list) for (var i = 0; i < st.list.length; i++) {
        var it = st.list[i], art = await new Promise(function (res) { var im = new Image(), u = URL.createObjectURL(it.art); im.onload = function () { var c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); URL.revokeObjectURL(u); res(c); }; im.onerror = function () { res(null); }; im.src = u; });
        if (art) designs.push({ id: ++uid, name: it.name, art: art, count: it.count, productId: it.productId || '', mockUrl: '', added: it.added || 0 });
      }
    } catch (e) {}
    $('pinMachineNote').textContent = (MACHINES[$('pinMachine').value] || MACHINES.vevor32).note;
    restored = true; renderAll();
  }

  function cfg() {
    var n = function (id, d) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : d; };
    var p = PAPER[$('pinPaper').value] || PAPER.letter;
    var c = { finish: n('pinFinish', 1.25), cut: n('pinCut', 1.73), margin: Math.max(0, parseFloat($('pinMargin').value) || 0), gap: Math.max(0, parseFloat($('pinGap').value) || 0), pw: p[0], ph: p[1], outline: $('pinOutline').checked, bg: $('pinBg').value || '#ffffff' };
    var uw = c.pw - 2 * c.margin, uh = c.ph - 2 * c.margin;
    c.cols = Math.max(0, Math.floor((uw + c.gap + 1e-9) / (c.cut + c.gap)));
    c.rows = Math.max(0, Math.floor((uh + c.gap + 1e-9) / (c.cut + c.gap)));
    c.per = c.cols * c.rows;
    c.x0 = (c.pw - (c.cols * c.cut + (c.cols - 1) * c.gap)) / 2;
    c.y0 = (c.ph - (c.rows * c.cut + (c.rows - 1) * c.gap)) / 2;
    return c;
  }
  function total() { return designs.reduce(function (n, d) { return n + d.count; }, 0); }
  function pagesFor(c) { var t = total(); return c.per ? Math.max(1, Math.ceil(t / c.per)) : 1; }
  function slots() { var out = []; designs.forEach(function (d) { for (var i = 0; i < d.count; i++) out.push(d); }); return out; }

  // ---- drawing ----
  function drawArt(g, art, cx, cy, d, bg) {
    g.save(); g.beginPath(); g.arc(cx, cy, d / 2, 0, Math.PI * 2); g.clip();
    g.fillStyle = bg; g.fillRect(cx - d / 2, cy - d / 2, d, d);
    var s = d / Math.min(art.width, art.height), w = art.width * s, h = art.height * s;
    g.drawImage(art, cx - w / 2, cy - h / 2, w, h); g.restore();
  }
  function drawPage(canvas, pageIdx, dpi, guides) {
    var c = cfg(), sl = slots(), g = canvas.getContext('2d');
    canvas.width = Math.round(c.pw * dpi); canvas.height = Math.round(c.ph * dpi);
    g.fillStyle = '#fff'; g.fillRect(0, 0, canvas.width, canvas.height);
    var from = pageIdx * c.per, to = Math.min(sl.length, from + c.per);
    for (var i = from; i < to; i++) {
      var k = i - from, r = Math.floor(k / c.cols), col = k % c.cols;
      var cx = (c.x0 + col * (c.cut + c.gap) + c.cut / 2) * dpi, cy = (c.y0 + r * (c.cut + c.gap) + c.cut / 2) * dpi;
      drawArt(g, sl[i].art, cx, cy, c.cut * dpi, c.bg);
      if (c.outline) { // sits just outside the art, so it is cut off with the circle
        g.beginPath(); g.arc(cx, cy, c.cut * dpi / 2 + 0.012 * dpi, 0, Math.PI * 2); g.lineWidth = Math.max(1, 0.006 * dpi); g.strokeStyle = '#8a8a8a'; g.stroke();
      }
      if (guides) { g.beginPath(); g.arc(cx, cy, c.finish * dpi / 2, 0, Math.PI * 2); g.lineWidth = 1; g.setLineDash([3, 3]); g.strokeStyle = 'rgba(200,40,30,.75)'; g.stroke(); g.setLineDash([]); }
    }
    if (guides) { // empty spots
      for (var j = to - from; j < c.per; j++) { var rr = Math.floor(j / c.cols), cc = j % c.cols; g.beginPath(); g.arc((c.x0 + cc * (c.cut + c.gap) + c.cut / 2) * dpi, (c.y0 + rr * (c.cut + c.gap) + c.cut / 2) * dpi, c.cut * dpi / 2, 0, Math.PI * 2); g.lineWidth = 1; g.strokeStyle = '#ccc'; g.stroke(); }
    }
  }
  // A clean pin picture: art in a round pin with a metal rim, shadow and a little gloss.
  function mockup(art, size, transparent, bg) {
    var c = document.createElement('canvas'); c.width = c.height = size; var g = c.getContext('2d');
    if (!transparent) { g.fillStyle = '#efe9db'; g.fillRect(0, 0, size, size); }
    var R = size * 0.36, cx = size / 2, cy = size * 0.48;
    g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = size * 0.045; g.shadowOffsetY = size * 0.022; g.fillStyle = '#9a9a9a'; g.beginPath(); g.arc(cx, cy, R * 1.04, 0, Math.PI * 2); g.fill(); g.restore();
    var rim = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R); rim.addColorStop(0, '#fbfbfb'); rim.addColorStop(0.5, '#a9a9a9'); rim.addColorStop(1, '#ececec');
    g.fillStyle = rim; g.beginPath(); g.arc(cx, cy, R * 1.04, 0, Math.PI * 2); g.fill();
    drawArt(g, art, cx, cy, R * 2 * 0.97, bg || '#fff');
    g.save(); g.beginPath(); g.arc(cx, cy, R * 0.97, 0, Math.PI * 2); g.clip();
    var edge = g.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 0.97); edge.addColorStop(0, 'rgba(0,0,0,0)'); edge.addColorStop(1, 'rgba(0,0,0,.2)'); g.fillStyle = edge; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    var gl = g.createRadialGradient(cx - R * 0.45, cy - R * 0.55, R * 0.05, cx - R * 0.45, cy - R * 0.55, R * 1.15); gl.addColorStop(0, 'rgba(255,255,255,.55)'); gl.addColorStop(0.5, 'rgba(255,255,255,.08)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    g.restore();
    g.beginPath(); g.arc(cx, cy, R * 0.97, 0, Math.PI * 2); g.lineWidth = Math.max(1, size * 0.002); g.strokeStyle = 'rgba(0,0,0,.28)'; g.stroke();
    return c;
  }
  function toBlob(c, type, q) { return new Promise(function (res) { c.toBlob(res, type, q); }); }
  function slug(s) { return String(s || 'pin').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'pin'; }

  // ---- PDF: one JPEG per page at exact size so "Actual size" prints right ----
  // makeCanvas(i) draws page i. Each page is turned into a JPEG and its canvas freed before the next one, so a phone never holds every big page at once.
  async function pdfOf(count, makeCanvas) {
    var pages = [];
    for (var i = 0; i < count; i++) {
      var cv = makeCanvas(i), w = cv.width, h = cv.height;
      var b = await toBlob(cv, 'image/jpeg', 0.93); cv.width = cv.height = 0;
      if (!b) throw new Error('This phone could not make a page that big. Try a computer, or print fewer sheets at a time.');
      pages.push({ jpg: new Uint8Array(await b.arrayBuffer()), w: w, h: h, pw: +(w / DPI * 72).toFixed(2), ph: +(h / DPI * 72).toFixed(2) });
      await new Promise(function (r) { setTimeout(r, 0); });
    }
    var enc = new TextEncoder(), parts = [], offs = [], len = 0, n = pages.length;
    function add(x) { var b = typeof x === 'string' ? enc.encode(x) : x; parts.push(b); len += b.length; }
    function obj(k, body) { offs[k] = len; add(k + ' 0 obj\n'); body(); add('\nendobj\n'); }
    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    obj(1, function () { add('<< /Type /Catalog /Pages 2 0 R >>'); });
    var kids = []; for (var j = 0; j < n; j++) kids.push((3 + j * 3) + ' 0 R');
    obj(2, function () { add('<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>'); });
    pages.forEach(function (pg, j) {
      var o = 3 + j * 3, content = 'q ' + pg.pw + ' 0 0 ' + pg.ph + ' 0 0 cm /Im0 Do Q';
      obj(o, function () { add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pg.pw + ' ' + pg.ph + '] /Resources << /XObject << /Im0 ' + (o + 1) + ' 0 R >> >> /Contents ' + (o + 2) + ' 0 R >>'); });
      obj(o + 1, function () { add('<< /Type /XObject /Subtype /Image /Width ' + pg.w + ' /Height ' + pg.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + pg.jpg.length + ' >>\nstream\n'); add(pg.jpg); add('\nendstream'); });
      obj(o + 2, function () { add('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'); });
    });
    var tot = 3 + n * 3, x = len; add('xref\n0 ' + tot + '\n0000000000 65535 f \n');
    for (var i2 = 1; i2 < tot; i2++) add(String(offs[i2]).padStart(10, '0') + ' 00000 n \n');
    add('trailer\n<< /Size ' + tot + ' /Root 1 0 R >>\nstartxref\n' + x + '\n%%EOF');
    var out = new Uint8Array(len), off = 0; parts.forEach(function (q) { out.set(q, off); off += q.length; });
    return new Blob([out], { type: 'application/pdf' });
  }

  // ---- adding art ----
  function squareFrom(file) {
    return new Promise(function (res) {
      var im = new Image(), u = URL.createObjectURL(file);
      im.onload = function () { var s = Math.min(im.width, im.height), k = Math.min(1, 1800 / s), c = document.createElement('canvas'); c.width = c.height = Math.round(s * k); c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c); };
      im.onerror = function () { URL.revokeObjectURL(u); res(null); }; im.src = u;
    });
  }
  async function getArt(file, title) {
    if (window.nocivCrop) return window.nocivCrop(file, { title: title || 'Crop your pin art', aspects: [[1, 'Square']], aspect: 1, maxPx: 1800 });
    return squareFrom(file);
  }
  async function addFiles(files) {
    var c = cfg();
    for (var i = 0; i < files.length; i++) {
      var art = await getArt(files[i]);
      if (!art) continue;
      designs.push({ id: ++uid, name: (files[i].name || 'Pin').replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 60), art: art, count: Math.max(1, c.cols || 1), productId: '', mockUrl: '', added: 0 });
    }
    $('pinFile').value = ''; renderAll();
  }

  // ---- rendering the screen ----
  function renderAll() { renderFit(); renderDesigns(); renderSummary(); renderStock(); schedulePreview(); queueSave(); }
  function renderFit() {
    var c = cfg(), el = $('pinFit');
    if (c.cut <= c.finish) { el.innerHTML = '<strong style="color:#b00020;">The paper circle must be bigger than the finished button, so there is paper to wrap around the back.</strong>'; return; }
    el.textContent = c.per ? (c.cols + ' across x ' + c.rows + ' down = ' + c.per + ' pins on each ' + ($('pinPaper').value === 'a4' ? 'A4' : 'Letter') + ' sheet. A printer usually cannot print the last 1/4 in of the page, so keep the side space about 0.2 in or more.') : 'The paper circle is too big for the page. Check the sizes.';
  }
  function renderDesigns() {
    var c = cfg(), box = $('pinDesigns'); box.innerHTML = '';
    if (!designs.length) { box.innerHTML = '<p class="field-hint">No art yet. Add one or several pin pictures.</p>'; return; }
    designs.forEach(function (d) {
      var row = document.createElement('div'); row.dataset.id = d.id;
      row.style.cssText = 'display:flex; flex-wrap:wrap; gap:10px; align-items:center; border-top:1px solid #333; padding:10px 0;';
      var rows = c.cols ? Math.ceil(d.count / c.cols) : 0;
      row.innerHTML = '<div class="pinthumb" style="width:72px;height:72px;flex:none;"></div>' +
        '<div style="flex:1 1 180px;"><input type="text" class="pin-name" value="' + esc(d.name) + '" aria-label="Pin name" style="margin:0 0 6px;">' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;"><button type="button" class="edit-btn pin-less" aria-label="One less row">-</button><strong>' + (d.count % (c.cols || 1) === 0 ? rows + ' row' + (rows === 1 ? '' : 's') + ' of ' + c.cols + ' (' + d.count + ' pins)' : d.count + ' pin' + (d.count === 1 ? '' : 's')) + '</strong><button type="button" class="edit-btn pin-more" aria-label="One more row">+</button></div></div>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;"><button type="button" class="edit-btn pin-mock">Mockup</button><button type="button" class="edit-btn pin-crop">Crop again</button><button type="button" class="edit-btn pin-del" style="color:var(--red);">Remove</button></div>';
      var th = mockup(d.art, 160, true, c.bg); th.style.cssText = 'width:72px;height:72px;'; row.querySelector('.pinthumb').appendChild(th);
      box.appendChild(row);
    });
  }
  function renderSummary() {
    var c = cfg(), t = total(), pg = pagesFor(c), el = $('pinSummary');
    if (!t || !c.per) { el.textContent = ''; $('pinMakePdf').disabled = true; return; }
    $('pinMakePdf').disabled = false;
    var empty = pg * c.per - t;
    el.innerHTML = '<strong>' + t + ' pins on ' + pg + ' sheet' + (pg === 1 ? '' : 's') + '.</strong>' + (empty ? ' ' + empty + ' empty spot' + (empty === 1 ? '' : 's') + ' left on the last sheet. Add a row or tap Split evenly to fill them.' : ' The sheets are full.');
  }
  function schedulePreview() { clearTimeout(timer); timer = setTimeout(renderPreview, 120); }
  function renderPreview() {
    var c = cfg(), pg = pagesFor(c), wrap = $('pinPreviewWrap');
    if (!designs.length || !c.per) { wrap.hidden = true; return; }
    wrap.hidden = false; if (page >= pg) page = pg - 1;
    var cv = $('pinPreview'); drawPage(cv, page, Math.min(60, 320 / c.pw), true); cv.style.width = '100%'; cv.style.maxWidth = '340px';
    var ch = $('pinPages'); ch.innerHTML = '';
    if (pg > 1) for (var i = 0; i < pg; i++) { var b = document.createElement('button'); b.type = 'button'; b.className = 'edit-btn'; b.textContent = 'Sheet ' + (i + 1); b.style.fontWeight = i === page ? '800' : '400'; b.dataset.p = i; ch.appendChild(b); }
  }
  function evenSplit() {
    var c = cfg(), n = designs.length; if (!n || !c.per) return;
    var sheets = pagesFor(c), tr = sheets * c.rows, cap = sheets * c.per;
    if (n <= tr) { var b = Math.floor(tr / n), x = tr % n; designs.forEach(function (d, i) { d.count = (b + (i < x ? 1 : 0)) * c.cols; }); }
    else { var b2 = Math.floor(cap / n), x2 = cap % n; designs.forEach(function (d, i) { d.count = Math.max(1, b2 + (i < x2 ? 1 : 0)); }); }
    renderAll();
  }
  // Phones: the share sheet has Save to Files and Print. Computers: a normal download. Anything that fails falls back to opening the file.
  function saveBlob(blob, name) {
    var type = blob.type || 'application/octet-stream', file = new File([blob], name, { type: type });
    if (matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) {
      return navigator.share({ files: [file] }).catch(function (e) { if (e && e.name === 'AbortError') return; openBlob(blob); });
    }
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    return Promise.resolve();
  }
  function openBlob(blob) { var u = URL.createObjectURL(blob); if (!window.open(u, '_blank')) location.href = u; }
  function btnFor(label, fn, main) {
    var b = document.createElement('button'); b.type = 'button'; b.className = main ? 'admin-submit' : 'edit-btn'; b.textContent = label; b.style.cssText = 'margin:6px 6px 0 0;'; b.onclick = fn; return b;
  }
  async function makePdf() {
    var btn = $('pinMakePdf'), c = cfg(), pg = pagesFor(c), out = $('pinFiles');
    btn.disabled = true; btn.textContent = 'Making...'; out.innerHTML = '';
    try {
      var pdf = await pdfOf(pg, function (i) { var cv = document.createElement('canvas'); drawPage(cv, i, DPI, false); return cv; });
      var lab = pg + ' page' + (pg === 1 ? '' : 's');
      out.appendChild(btnFor('Save or print the sheets (PDF, ' + lab + ')', function () { saveBlob(pdf, 'nociv-pin-sheets.pdf'); }, true));
      out.appendChild(btnFor('Open the PDF', function () { openBlob(pdf); }, false));
      var note = document.createElement('p'); note.className = 'field-hint'; note.textContent = 'Print at 100 percent, Actual size. Do not choose Fit to page, it shrinks the circles. Print one sheet on plain paper first and hold a pressed pin up to it.'; out.appendChild(note);
    } catch (e) { out.textContent = 'Could not make the sheets: ' + e.message; }
    btn.disabled = false; btn.textContent = 'Make print sheets (PDF)'; renderSummary();
  }

  // ---- products, stock and log ----
  async function loadProducts() {
    try { var r = await supabaseClient.from('products').select('id, name, inventory_count, image_url').order('name', { ascending: true }); products = r.data || []; } catch (e) { products = []; }
    renderStock(); loadLog();
  }
  function renderStock() {
    var box = $('pinStock'); if (!box) return; box.innerHTML = '';
    if (!designs.length) { box.innerHTML = '<p class="field-hint">Add your art above, print the sheets, press your pins, then come back here and tap Add to stock.</p>'; return; }
    designs.forEach(function (d) {
      var row = document.createElement('div'); row.dataset.id = d.id; row.style.cssText = 'border-top:1px solid #333; padding:10px 0;';
      var opts = '<option value="">Pick a product...</option><option value="new">+ Make a new pin product from this</option>' + products.map(function (p) { return '<option value="' + esc(p.id) + '"' + (String(p.id) === String(d.productId) ? ' selected' : '') + '>' + esc(p.name) + (p.inventory_count != null ? ' (stock ' + p.inventory_count + ')' : '') + '</option>'; }).join('');
      row.innerHTML = '<div class="name">' + esc(d.name) + '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px;"><label style="margin:0;">Pins that came out good</label><input type="number" class="pin-made" min="1" value="' + d.count + '" style="width:90px;margin:0;"></div>' +
        '<select class="pin-prod" style="margin-top:6px;">' + opts + '</select>' +
        '<label style="display:flex;gap:8px;align-items:center;margin-top:6px;cursor:pointer;"><input type="checkbox" class="pin-useimg" style="width:auto;margin:0;" checked> Use the mockup as the product photo (only if it has none)</label>' +
        '<button type="button" class="admin-submit pin-add" style="margin-top:8px;" ' + (d.added ? 'disabled' : '') + '>' + (d.added ? 'Added ' + d.added + ' to stock' : 'Add to stock') + '</button>';
      box.appendChild(row);
    });
  }
  async function loadLog() {
    var box = $('pinLog'); if (!box) return;
    try {
      var r = await supabaseClient.from('pin_print_log').select('*').order('created_at', { ascending: false }).limit(8);
      if (r.error) { box.innerHTML = '<p class="field-hint">Run the pin sheets SQL in Supabase to keep a log here.</p>'; return; }
      var rows = r.data || []; box.innerHTML = rows.length ? '' : '<p class="field-hint">Nothing added yet.</p>';
      rows.forEach(function (l) {
        var d = document.createElement('div'); d.dataset.id = l.id; d.style.cssText = 'display:flex;gap:8px;align-items:center;padding:4px 0;flex-wrap:wrap;';
        d.innerHTML = '<div class="meta" style="flex:1 1 200px;">' + esc(new Date(l.created_at).toLocaleDateString()) + ' · +' + esc(l.qty) + ' · ' + esc(l.product_name || l.product_id) + '</div><button type="button" class="edit-btn pin-undo">Take back</button>';
        d._log = l; box.appendChild(d);
      });
    } catch (e) { box.innerHTML = ''; }
  }
  async function uploadMockup(d) {
    var blob = await toBlob(mockup(d.art, 1200, false, cfg().bg), 'image/png');
    var name = 'pin-mockups/' + Date.now() + '-' + slug(d.name) + '.png';
    var up = await supabaseClient.storage.from('product-images').upload(name, blob, { contentType: 'image/png', upsert: true });
    if (up.error) throw new Error('Mockup upload failed: ' + up.error.message);
    return supabaseClient.storage.from('product-images').getPublicUrl(name).data.publicUrl;
  }
  async function addStock(d, row) {
    var made = parseInt(row.querySelector('.pin-made').value) || 0, pid = row.querySelector('.pin-prod').value, useImg = row.querySelector('.pin-useimg').checked, btn = row.querySelector('.pin-add');
    if (made < 1) { alert('Type how many pins came out good.'); return; }
    if (!pid) { alert('Pick a product first, or choose "Make a new pin product".'); return; }
    var prod = pid === 'new' ? null : products.filter(function (p) { return String(p.id) === String(pid); })[0];
    var msg = pid === 'new' ? 'Make a new product "' + d.name + '" with ' + made + ' in stock? It starts as Coming Soon with no price, so you can set the price in Products.' : 'Add ' + made + ' to "' + (prod && prod.name) + '"?' + (prod && prod.inventory_count == null ? ' It is not tracking stock yet, this starts it at ' + made + '.' : ' Stock goes from ' + prod.inventory_count + ' to ' + (prod.inventory_count + made) + '.');
    if (!confirm(msg)) return;
    btn.disabled = true; btn.textContent = 'Saving...';
    try {
      if (pid !== 'new') {
        var v = await supabaseClient.from('product_variants').select('id').eq('product_id', pid).limit(1);
        if (v.data && v.data.length) throw new Error('That product has sizes. Add its stock in Products, by size.');
      }
      var imageUrl = '';
      if (pid === 'new' || (useImg && prod && !prod.image_url)) imageUrl = await uploadMockup(d);
      var name, base;
      if (pid === 'new') {
        var ins = await supabaseClient.from('products').insert([{ name: d.name, description: '', price: null, shop: 'art', category: 'Pins', status: 'coming_soon', fulfillment_type: 'in_house', inventory_count: 0, image_url: imageUrl || null }]).select().single();
        if (ins.error || !ins.data) throw new Error('Could not make the product: ' + (ins.error ? ins.error.message : 'no row'));
        pid = ins.data.id; name = d.name; base = 0;
      } else {
        var cur = await supabaseClient.from('products').select('name, inventory_count').eq('id', pid).single();
        if (cur.error || !cur.data) throw new Error('Could not read that product.');
        name = cur.data.name; base = cur.data.inventory_count || 0;
      }
      // Log first. If the log table is missing, nothing changes.
      var lg = await supabaseClient.from('pin_print_log').insert([{ product_id: String(pid), product_name: name, qty: made }]);
      if (lg.error) throw new Error('Run the pin sheets SQL in Supabase first (it makes the stock log). Nothing was changed. ' + lg.error.message);
      var upd = { inventory_count: base + made }; if (imageUrl && prod && !prod.image_url) upd.image_url = imageUrl;
      var up = await supabaseClient.from('products').update(upd).eq('id', pid);
      if (up.error) throw new Error('Stock did not save: ' + up.error.message);
      d.added = made; d.productId = String(pid);
      await loadProducts();
    } catch (e) { alert(e.message); btn.disabled = false; btn.textContent = 'Add to stock'; return; }
    renderStock();
  }
  async function undoLog(l) {
    if (!confirm('Take back ' + l.qty + ' from "' + (l.product_name || 'this product') + '"? Stock goes down by ' + l.qty + ', not below 0.')) return;
    try {
      var cur = await supabaseClient.from('products').select('inventory_count').eq('id', l.product_id).single();
      if (cur.data && cur.data.inventory_count != null) {
        var up = await supabaseClient.from('products').update({ inventory_count: Math.max(0, cur.data.inventory_count - l.qty) }).eq('id', l.product_id);
        if (up.error) throw new Error(up.error.message);
      }
      await supabaseClient.from('pin_print_log').delete().eq('id', l.id);
    } catch (e) { alert('Could not take that back: ' + e.message); return; }
    designs.forEach(function (d) { if (String(d.productId) === String(l.product_id)) d.added = 0; });
    await loadProducts();
  }

  // ---- wiring ----
  function byId(el) { var r = el.closest('[data-id]'); return r ? designs.filter(function (d) { return String(d.id) === r.dataset.id; })[0] : null; }
  $('pinMachine').addEventListener('change', function () { var m = MACHINES[this.value]; if (this.value !== 'custom') { $('pinFinish').value = m.finish; $('pinCut').value = m.cut; } $('pinMachineNote').textContent = m.note; renderAll(); });
  ['pinFinish', 'pinCut', 'pinMargin', 'pinGap', 'pinPaper', 'pinOutline', 'pinBg'].forEach(function (id) {
    $(id).addEventListener('input', function () { if (id === 'pinFinish' || id === 'pinCut') { $('pinMachine').value = (parseFloat($('pinFinish').value) === 1.25 && parseFloat($('pinCut').value) === 1.73) ? 'vevor32' : 'custom'; } renderAll(); });
  });
  $('pinFile').addEventListener('change', function (e) { var f = [].slice.call(e.target.files || []); if (f.length) addFiles(f); });
  $('pinEven').addEventListener('click', evenSplit);
  $('pinMakePdf').addEventListener('click', makePdf);
  $('pinPages').addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (b) { page = +b.dataset.p; renderPreview(); } });
  $('pinDesigns').addEventListener('click', async function (e) {
    var d = byId(e.target); if (!d) return; var c = cfg(), cols = Math.max(1, c.cols);
    if (e.target.closest('.pin-more')) { d.count = (Math.ceil(d.count / cols) + 1) * cols; renderAll(); }
    else if (e.target.closest('.pin-less')) { d.count = Math.max(cols, (Math.ceil(d.count / cols) - 1) * cols); renderAll(); }
    else if (e.target.closest('.pin-del')) { designs = designs.filter(function (x) { return x !== d; }); renderAll(); }
    else if (e.target.closest('.pin-crop')) {
      var cv = document.createElement('canvas'); cv.width = d.art.width; cv.height = d.art.height; cv.getContext('2d').drawImage(d.art, 0, 0);
      var blob = await toBlob(cv, 'image/png'); var n = await getArt(blob, 'Crop your pin art'); if (n) { d.art = n; renderAll(); }
    }
    else if (e.target.closest('.pin-mock')) { var b = await toBlob(mockup(d.art, 1200, false, c.bg), 'image/png'); var mn = 'pin-mockup-' + slug(d.name) + '.png', o2 = $('pinFiles'); o2.appendChild(btnFor('Save mockup: ' + d.name, function () { saveBlob(b, mn); }, true)); o2.scrollIntoView({ block: 'nearest' }); }
  });
  $('pinDesigns').addEventListener('input', function (e) { if (e.target.classList.contains('pin-name')) { var d = byId(e.target); if (d) { d.name = e.target.value; renderStock(); } } });
  $('pinStock').addEventListener('click', function (e) { if (e.target.closest('.pin-add')) { var row = e.target.closest('[data-id]'), d = byId(e.target); if (d) addStock(d, row); } });
  $('pinStock').addEventListener('change', function (e) { var d = byId(e.target); if (d && e.target.classList.contains('pin-prod')) d.productId = e.target.value; });
  $('pinLog').addEventListener('click', function (e) { var b = e.target.closest('.pin-undo'); if (b) undoLog(b.parentNode._log); });
  $('sec-pins').addEventListener('toggle', function () { if (this.open) loadProducts(); });
  $('pinMachineNote').textContent = MACHINES.vevor32.note;
  renderAll();
  restore();
  window.__pins = { designs: function () { return designs; }, cfg: cfg, drawPage: drawPage, mockup: mockup, addFiles: addFiles, evenSplit: evenSplit, loadProducts: loadProducts };
})();
