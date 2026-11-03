/* NOCIV Zine Builder: Bring a PDF.
   Turns any PDF into a print-at-home booklet (or a book file for Lulu).
   Everything happens on the phone. Nothing is uploaded anywhere. */
(function () {
  'use strict';
  var STAPLE_MAX = 44;      // most pages a stapled booklet should have (same cap the Lulu saddle-stitch maker uses)
  var STAPLE_WARN = 36;     // start warning here
  var PAPER = { letter: { name: 'US Letter', w: 792, h: 612 }, a4: { name: 'A4', w: 841.89, h: 595.28 } };
  var TRIMS = { digest: { name: '5.5 x 8.5 in (digest)', w: 396, h: 612 }, trade: { name: '6 x 9 in (US trade)', w: 432, h: 648 }, letter: { name: '8.5 x 11 in (US letter)', w: 612, h: 792 } };
  var BLEED = 9;            // 0.125 in each side, same as the Lulu maker in admin

  /* ---------- pure helpers (also used by the tests) ---------- */
  // Pad a page list so the count is a multiple of `mult` (4 for a booklet, 2 for a book).
  // If keepLast is true the blanks go before the last page, so a back cover stays last.
  function padPages(list, mult, keepLast) {
    var out = list.slice(), add = (mult - (out.length % mult)) % mult, i;
    for (i = 0; i < add; i++) {
      var blank = { blank: true, pad: true };
      if (keepLast && out.length > 1) out.splice(out.length - 1, 0, blank); else out.push(blank);
    }
    return { pages: out, added: add };
  }
  // Saddle stitch order. Returns one entry per paper sheet: [front-left, front-right, back-left, back-right] (0 based page positions).
  function impose(n) {
    var sheets = [], k;
    for (k = 0; k < n / 4; k++) sheets.push([n - 1 - 2 * k, 2 * k, 2 * k + 1, n - 2 - 2 * k]);
    return sheets;
  }
  window.PdfBookCore = { padPages: padPages, impose: impose, STAPLE_MAX: STAPLE_MAX };

  /* ---------- state ---------- */
  var S = null;             // { sources: [], pages: [], sel: -1, numbers: false, skipFirst: true, paper: 'letter', shrink: true, backCover: false, busy: '' }
  var root, rootBase = '';

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function loadScript(src) {
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('Could not load ' + src)); }; document.head.appendChild(s); });
  }
  var libP = null;
  function lib() { if (window.PDFLib) return Promise.resolve(window.PDFLib); if (!libP) libP = loadScript('vendor/pdf-lib.min.js').then(function () { return window.PDFLib; }); return libP; }
  var viewerP = null;
  function viewer() {
    if (!viewerP) viewerP = import('./vendor/pdf.min.mjs').then(function (m) {
      m.GlobalWorkerOptions.workerSrc = new URL('vendor/pdf.worker.min.mjs', document.baseURI).href; return m;
    });
    return viewerP;
  }
  function fresh() { return { sources: [], pages: [], sel: -1, numbers: false, skipFirst: true, paper: 'letter', shrink: true, backCover: false, busy: '', msg: '', trim: 'digest' }; }


  /* ---------- saving on this phone (IndexedDB), so closing the tab does not lose the booklet ---------- */
  function idb() {
    return new Promise(function (ok, no) {
      if (!window.indexedDB) return no(new Error('no idb'));
      var q = indexedDB.open('nocivPdfBook', 1);
      q.onupgradeneeded = function () { q.result.createObjectStore('p'); };
      q.onsuccess = function () { ok(q.result); }; q.onerror = function () { no(q.error); };
    });
  }
  function idbDo(mode, fn) { return idb().then(function (db) { return new Promise(function (ok, no) { var tx = db.transaction('p', mode), st = tx.objectStore('p'), r = fn(st); tx.oncomplete = function () { ok(r && r.result); }; tx.onerror = function () { no(tx.error); }; }); }); }
  var saveT = 0;
  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      if (!S || !S.sources.length) { idbDo('readwrite', function (st) { return st.delete('cur'); }).catch(function () {}); return; }
      var data = { v: 1, opts: { numbers: S.numbers, skipFirst: S.skipFirst, paper: S.paper, shrink: S.shrink, backCover: S.backCover, trim: S.trim },
        sources: S.sources.map(function (s) { return { kind: s.kind, name: s.name, bytes: s.bytes, size: s.size }; }), pages: S.pages.map(function (p) { return p.blank ? { blank: true } : { s: p.s, i: p.i }; }) };
      idbDo('readwrite', function (st) { return st.put(data, 'cur'); }).catch(function () {});
    }, 600);
  }
  function loadSaved() { return idbDo('readonly', function (st) { return st.get('cur'); }).catch(function () { return null; }); }
  async function restore() {
    var d = await loadSaved(); if (!d || !d.sources || !d.sources.length) return false;
    var L = await lib(), n = fresh(), i;
    for (i = 0; i < d.sources.length; i++) {
      var s = d.sources[i], src = { kind: s.kind, name: s.name, bytes: s.bytes, size: s.size, thumbs: {} };
      if (s.kind === 'pdf') { src.doc = await L.PDFDocument.load(s.bytes); src.count = src.doc.getPageCount(); }
      else src.url = URL.createObjectURL(new Blob([s.bytes], { type: 'image/jpeg' }));
      n.sources.push(src);
    }
    n.pages = d.pages; Object.keys(d.opts || {}).forEach(function (k) { n[k] = d.opts[k]; });
    S = n; n.sources.forEach(function (s, k) { if (s.kind === 'pdf') thumbsFor(k); });
    return true;
  }

  /* ---------- adding things ---------- */
  function readBytes(file) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(new Uint8Array(r.result)); }; r.onerror = function () { no(r.error); }; r.readAsArrayBuffer(file); }); }

  async function addPdf(file, at) {
    S.busy = 'Reading ' + file.name + '...'; render();
    try {
      var L = await lib(), bytes = await readBytes(file), doc;
      try { doc = await L.PDFDocument.load(bytes, { ignoreEncryption: false }); }
      catch (e) { if (/encrypt/i.test(String(e && e.message))) throw new Error('That PDF is locked with a password. Unlock it first, then add it again.'); throw new Error('That file would not open as a PDF.'); }
      var count = doc.getPageCount(); if (!count) throw new Error('That PDF has no pages.');
      var src = { kind: 'pdf', name: file.name, bytes: bytes, doc: doc, count: count, thumbs: {}, size: doc.getPage(0).getSize() };
      S.sources.push(src);
      var si = S.sources.length - 1, add = [], i;
      for (i = 0; i < count; i++) add.push({ s: si, i: i });
      var first = S.pages.length === 0;
      insert(add, at); if (first) S.sel = -1;
      S.msg = ''; S.busy = ''; render(); thumbsFor(si);
    } catch (e) { S.busy = ''; S.msg = e.message || 'That did not work.'; render(); }
  }
  async function addPhoto(file, at) {
    S.busy = 'Adding photo...'; render();
    try {
      var url = URL.createObjectURL(file), img = new Image();
      await new Promise(function (ok, no) { img.onload = ok; img.onerror = function () { no(new Error('That photo would not open.')); }; img.src = url; });
      var max = 2400, k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      var blob = await new Promise(function (ok) { c.toBlob(ok, 'image/jpeg', 0.9); });
      var bytes = await readBytes(blob);
      S.sources.push({ kind: 'img', name: file.name, bytes: bytes, url: URL.createObjectURL(blob), size: { width: c.width, height: c.height } });
      insert([{ s: S.sources.length - 1, i: 0 }], at);
      S.msg = ''; S.busy = ''; render();
    } catch (e) { S.busy = ''; S.msg = e.message || 'That did not work.'; render(); }
  }
  function insert(list, at) {
    var pos = at == null ? S.pages.length : at;
    // a back cover stays last: new pages go before it
    if (at == null && S.backCover && S.pages.length) pos = S.pages.length - 1;
    S.pages.splice.apply(S.pages, [pos, 0].concat(list));
    S.sel = pos + list.length - 1;
  }

  /* ---------- thumbnails ---------- */
  var thumbBusy = false, thumbQueue = [];
  function thumbsFor(si) { thumbQueue.push(si); if (!thumbBusy) runThumbs(); }
  async function runThumbs() {
    thumbBusy = true;
    try {
      var pdfjs = await viewer();
      while (thumbQueue.length) {
        var si = thumbQueue.shift(), src = S.sources[si]; if (!src || src.kind !== 'pdf') continue;
        var task = pdfjs.getDocument({ data: src.bytes.slice() }), pdf = await task.promise, p;
        for (p = 1; p <= pdf.numPages; p++) {
          if (!S || S.sources[si] !== src) break;
          var page = await pdf.getPage(p), vp0 = page.getViewport({ scale: 1 }), sc = 150 / vp0.width, vp = page.getViewport({ scale: sc });
          var c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
          await page.render({ canvasContext: c.getContext('2d'), canvas: c, viewport: vp }).promise;
          src.thumbs[p - 1] = c.toDataURL('image/jpeg', 0.6);
          fillThumb(si, p - 1); // update in place so scrolling is not reset
          page.cleanup();
        }
        if (task.destroy) task.destroy();
      }
    } catch (e) { /* thumbnails are a nicety. Numbered tiles still work. */ if (window.console) console.warn('thumbs', e); }
    thumbBusy = false;
  }
  function fillThumb(si, i) {
    document.querySelectorAll('[data-th="' + si + ':' + i + '"]').forEach(function (n) { var u = S.sources[si] && S.sources[si].thumbs[i]; if (u) { n.style.backgroundImage = 'url(' + u + ')'; n.classList.add('has'); } });
  }

  /* ---------- the numbers ---------- */
  function plan() {
    var shown = S.pages.map(function (p, i) { return { p: p, label: i + 1 }; });
    var staple = padPages(S.pages, 4, S.backCover), book = padPages(S.pages, 2, S.backCover);
    return { n: S.pages.length, padded: staple.pages.length, added: staple.added, sheets: staple.pages.length / 4, bookPages: book.pages.length, bookAdded: book.added, shown: shown };
  }

  /* ---------- building the files ---------- */
  // numberFor(list, position): the small number printed at the bottom, or null.
  function numberFor(p, pos) {
    if (!S.numbers || p.pad || p.back) return null;
    if (S.skipFirst && pos === 0) return null;
    return String(pos + 1);
  }
  function markBack(list) { list.forEach(function (p) { p.back = false; }); if (S.backCover && list.length) list[list.length - 1].back = true; return list; }
  // Embed every used source page once.
  async function embedAll(out, pages) {
    var L = window.PDFLib, cache = {}, need = {}, imgs = {};
    pages.forEach(function (p) { if (!p.blank) { (need[p.s] = need[p.s] || {})[p.i] = 1; } });
    for (var key in need) {
      var src = S.sources[key];
      if (src.kind === 'pdf') {
        var idxs = Object.keys(need[key]).map(Number).sort(function (a, b) { return a - b; });
        var embs = await out.embedPdf(src.bytes, idxs);
        idxs.forEach(function (ix, j) { cache[key + ':' + ix] = { emb: embs[j], width: embs[j].width, height: embs[j].height }; });
      } else {
        var img = await out.embedJpg(src.bytes);
        cache[key + ':0'] = { img: img, width: img.width, height: img.height, isImg: true };
      }
    }
    return function (p) { return cache[p.s + ':' + p.i]; };
  }

  async function buildBooklet() {
    var L = await lib(), out = await L.PDFDocument.create(), font = await out.embedFont(L.StandardFonts.Helvetica);
    var padded = markBack(padPages(S.pages, 4, S.backCover).pages), paper = PAPER[S.paper], cw = paper.w / 2, ch = paper.h;
    var margin = S.shrink ? 14 : 0, get = await embedAll(out, padded), sheets = impose(padded.length), k, side;
    for (k = 0; k < sheets.length; k++) {
      for (side = 0; side < 2; side++) {
        var pg = out.addPage([paper.w, paper.h]), pair = [sheets[k][side * 2], sheets[k][side * 2 + 1]], c;
        for (c = 0; c < 2; c++) {
          var pos = pair[c], page = padded[pos], e = page.blank ? null : get(page);
          var num = numberFor(page, pos), numH = num ? 13 : 0, x = c * cw, y = 0;
          if (e) {
            var bw = cw - 2 * margin, bh = ch - 2 * margin - numH, sc = Math.min(bw / e.width, bh / e.height), dw = e.width * sc, dh = e.height * sc;
            var dx = x + (cw - dw) / 2, dy = y + margin + numH + (bh - dh) / 2;
            if (e.isImg) pg.drawImage(e.img, { x: dx, y: dy, width: dw, height: dh }); else pg.drawPage(e.emb, { x: dx, y: dy, width: dw, height: dh });
          }
          if (num) { var tw = font.widthOfTextAtSize(num, 8); pg.drawText(num, { x: x + (cw - tw) / 2, y: y + Math.max(margin * 0.5, 5) + 1, size: 8, font: font, color: L.rgb(0.2, 0.2, 0.2) }); }
        }
      }
    }
    out.setTitle('Booklet'); out.setProducer('NOCIV.CO Zine Builder');
    return out.save();
  }
  async function buildBook() {
    var L = await lib(), out = await L.PDFDocument.create(), font = await out.embedFont(L.StandardFonts.Helvetica);
    var padded = markBack(padPages(S.pages, 2, S.backCover).pages), t = TRIMS[S.trim], W = t.w + 2 * BLEED, H = t.h + 2 * BLEED, inner = 18;
    var get = await embedAll(out, padded);
    padded.forEach(function (page, pos) {
      var pg = out.addPage([W, H]), e = page.blank ? null : get(page), num = numberFor(page, pos), numH = num ? 13 : 0;
      if (e) {
        var bw = t.w - 2 * inner, bh = t.h - 2 * inner - numH, sc = Math.min(bw / e.width, bh / e.height), dw = e.width * sc, dh = e.height * sc;
        var dx = BLEED + (t.w - dw) / 2, dy = BLEED + inner + numH + (bh - dh) / 2;
        if (e.isImg) pg.drawImage(e.img, { x: dx, y: dy, width: dw, height: dh }); else pg.drawPage(e.emb, { x: dx, y: dy, width: dw, height: dh });
      }
      if (num) { var tw = font.widthOfTextAtSize(num, 9); pg.drawText(num, { x: BLEED + (t.w - tw) / 2, y: BLEED + 14, size: 9, font: font, color: L.rgb(0.2, 0.2, 0.2) }); }
    });
    out.setTitle('Book interior'); out.setProducer('NOCIV.CO Zine Builder');
    return out.save();
  }
  function baseName() { var s = S.sources[0]; return (s ? s.name.replace(/\.pdf$/i, '') : 'zine').replace(/[^A-Za-z0-9 _-]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'zine'; }
  async function deliver(bytes, name) {
    var blob = new Blob([bytes], { type: 'application/pdf' }), file;
    try { file = new File([blob], name, { type: 'application/pdf' }); } catch (e) { file = null; }
    if (file && matchMedia('(pointer: coarse)').matches && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }).catch(function () {}); return; }
    var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  async function run(kind) {
    S.busy = kind === 'book' ? 'Making your book file...' : 'Making your booklet...'; S.msg = ''; render();
    try {
      var bytes = kind === 'book' ? await buildBook() : await buildBooklet();
      await deliver(bytes, baseName() + (kind === 'book' ? '-book-interior.pdf' : '-booklet.pdf'));
      S.msg = kind === 'book' ? 'Your book file is ready.' : 'Your booklet is ready. Print it double sided, flip on the short edge.';
    } catch (e) { S.msg = 'That did not work. ' + (e.message || ''); if (window.console) console.error(e); }
    S.busy = ''; render();
  }

  /* ---------- the screen ---------- */
  function render() {
    if (!root) return;
    var keep = root.scrollTop;
    if (!S || !S.sources.length) {
      root.innerHTML = '<div class="card"><h3>Bring a PDF</h3><p class="muted">Pick any PDF. It becomes a booklet you can print on a regular printer. Pages are put in the right order for you.</p>' +
        '<label class="big pdfpick" style="display:block;text-align:center;position:relative;overflow:hidden">Choose a PDF<input type="file" id="pbFile" accept="application/pdf,.pdf" style="position:absolute;inset:0;opacity:0"></label>' +
        (S && S.busy ? '<p class="muted">' + esc(S.busy) + '</p>' : '') + (S && S.msg ? '<p class="muted" style="color:var(--red);font-weight:700">' + esc(S.msg) + '</p>' : '') +
        '<div class="wide"><button class="chip" id="pbBack">Back to set up</button></div></div>';
      wireFile('pbFile', function (f) { addPdf(f, null); });
      $('pbBack').onclick = function () { window.ZineSetStep && window.ZineSetStep('setup'); };
      return;
    }
    var P = plan(), warn = '', tone = '';
    if (P.padded > STAPLE_MAX) { tone = 'red'; warn = 'That is ' + P.padded + ' pages. A stapled booklet is best at ' + STAPLE_MAX + ' or fewer, the pages will not fold flat past that. You can still print it, or make it a book instead (see below).'; }
    else if (P.padded > STAPLE_WARN) { tone = 'amber'; warn = (P.padded === STAPLE_MAX ? 'This is the most a stapled booklet should hold. Adding more? Make it a book instead.' : 'Getting thick. ' + (STAPLE_MAX - P.padded) + ' more page' + (STAPLE_MAX - P.padded === 1 ? '' : 's') + ' fit in a stapled booklet. After that, make it a book.'); }
    var tiles = S.pages.map(function (p, i) {
      var inner = '', cls = 'pbt' + (i === S.sel ? ' sel' : '');
      if (p.blank) { cls += ' blank'; inner = '<i>blank</i>'; }
      else {
        var src = S.sources[p.s];
        if (src.kind === 'img') inner = '<div class="pbimg has" style="background-image:url(' + src.url + ')"></div>';
        else inner = '<div class="pbimg' + (src.thumbs[p.i] ? ' has' : '') + '" data-th="' + p.s + ':' + p.i + '"' + (src.thumbs[p.i] ? ' style="background-image:url(' + src.thumbs[p.i] + ')"' : '') + '></div>';
      }
      return '<button class="' + cls + '" data-i="' + i + '" aria-label="Page ' + (i + 1) + '">' + inner + '<b>' + (i + 1) + '</b></button>';
    }).join('');
    var padNote = P.added ? '<p class="muted"><b>' + P.added + ' blank page' + (P.added === 1 ? '' : 's') + ' added ' + (S.backCover ? 'before the last page' : 'at the end') + '</b> so the booklet folds out even. They are not numbered.</p>' : '';
    var sel = S.sel >= 0 ? S.sel : null, hasSel = sel != null;
    root.innerHTML =
      '<div class="card"><h3>Your pages</h3>' +
      '<p class="muted"><b>' + P.n + ' page' + (P.n === 1 ? '' : 's') + '</b> from ' + S.sources.length + ' file' + (S.sources.length === 1 ? '' : 's') + '. Booklet: <b>' + P.padded + ' pages on ' + P.sheets + ' sheet' + (P.sheets === 1 ? '' : 's') + ' of paper.</b></p>' +
      padNote + (warn ? '<p class="pbwarn ' + tone + '">' + esc(warn) + '</p>' : '') +
      '<div class="pbgrid" id="pbGrid">' + tiles + '</div>' +
      '<div class="wide pbtools"><button class="chip" id="pbL"' + (hasSel && sel > 0 ? '' : ' disabled') + '>&larr; Earlier</button><button class="chip" id="pbR"' + (hasSel && sel < P.n - 1 ? '' : ' disabled') + '>Later &rarr;</button><button class="chip warn" id="pbDel"' + (hasSel ? '' : ' disabled') + '>Remove</button></div>' +
      '<div class="wide pbtools"><button class="chip" id="pbBlank">+ Blank page</button>' +
      '<label class="chip" style="position:relative;overflow:hidden">+ PDF<input type="file" id="pbAddPdf" accept="application/pdf,.pdf" style="position:absolute;inset:0;opacity:0"></label>' +
      '<label class="chip" style="position:relative;overflow:hidden">+ Photo<input type="file" id="pbAddImg" accept="image/*" style="position:absolute;inset:0;opacity:0"></label></div>' +
      '<p class="muted">' + (hasSel ? 'Page ' + (sel + 1) + ' is picked. New pages go right after it.' : 'Tap a page to pick it. New pages go at the end.') + '</p></div>' +

      '<div class="card"><h3>Options</h3>' +
      '<label class="pbopt"><input type="checkbox" id="pbNum"' + (S.numbers ? ' checked' : '') + '><span>Page numbers, small, at the bottom</span></label>' +
      '<label class="pbopt' + (S.numbers ? '' : ' off') + '"><input type="checkbox" id="pbSkip"' + (S.skipFirst ? ' checked' : '') + (S.numbers ? '' : ' disabled') + '><span>No number on the first page (the cover)</span></label>' +
      '<label class="pbopt"><input type="checkbox" id="pbBackCover"' + (S.backCover ? ' checked' : '') + '><span>The last page is the back cover. Keep it last.</span></label>' +
      '<label class="pbopt"><input type="checkbox" id="pbShrink"' + (S.shrink ? ' checked' : '') + '><span>Leave a safe edge so a home printer does not cut anything off</span></label>' +
      '<div class="field"><label for="pbPaper">Paper</label><select id="pbPaper" class="pbsel"><option value="letter"' + (S.paper === 'letter' ? ' selected' : '') + '>US Letter</option><option value="a4"' + (S.paper === 'a4' ? ' selected' : '') + '>A4</option></select></div></div>' +

      '<div class="card"><h3>Print at home</h3>' +
      '<button class="big" id="pbMake"' + (S.busy || !P.n ? ' disabled' : '') + '>Make my booklet</button>' +
      '<p class="muted">Print <b>double sided</b>, <b>flip on the short edge</b>, at <b>100%</b> (not "fit to page"). Stack the sheets, fold in half, staple the fold. If the back comes out upside down, switch to flip on the long edge.</p></div>' +

      '<div class="card"><h3>Make it a book</h3>' +
      '<p class="muted">Over ' + STAPLE_MAX + ' pages, or you want a real spine? Print it as a book at Lulu. This makes the inside pages in reading order' + (P.bookAdded ? ' (' + P.bookAdded + ' blank added so the count is even, ' + P.bookPages + ' pages total)' : ' (' + P.bookPages + ' pages)') + ', with a small extra edge for the print bleed. Lulu has its own minimum page count and a cover template, check both when you upload.</p>' +
      '<div class="field"><label for="pbTrim">Book size</label><select id="pbTrim" class="pbsel">' + Object.keys(TRIMS).map(function (k) { return '<option value="' + k + '"' + (S.trim === k ? ' selected' : '') + '>' + TRIMS[k].name + '</option>'; }).join('') + '</select></div>' +
      '<button class="big" id="pbBook" style="background:var(--ink)"' + (S.busy || !P.n ? ' disabled' : '') + '>Make the book inside file</button></div>' +
      (S.busy ? '<p class="muted" id="pbStatus">' + esc(S.busy) + '</p>' : '') + (S.msg ? '<p class="muted" id="pbMsg"><b>' + esc(S.msg) + '</b></p>' : '') +
      '<div class="wide"><button class="chip" id="pbBack">Back to set up</button><button class="chip warn" id="pbClear">Start over</button></div>';

    root.querySelectorAll('.pbt').forEach(function (b) { b.onclick = function () { S.sel = S.sel === +b.dataset.i ? -1 : +b.dataset.i; render(); }; });
    $('pbL').onclick = function () { move(-1); }; $('pbR').onclick = function () { move(1); };
    $('pbDel').onclick = function () { if (S.sel < 0) return; S.pages.splice(S.sel, 1); S.sel = Math.min(S.sel, S.pages.length - 1); if (!S.pages.length) { S = fresh(); } render(); persist(); };
    $('pbBlank').onclick = function () { insert([{ blank: true }], S.sel >= 0 ? S.sel + 1 : null); render(); };
    wireFile('pbAddPdf', function (f) { addPdf(f, S.sel >= 0 ? S.sel + 1 : null); });
    wireFile('pbAddImg', function (f) { addPhoto(f, S.sel >= 0 ? S.sel + 1 : null); });
    [['pbNum', 'numbers'], ['pbSkip', 'skipFirst'], ['pbBackCover', 'backCover'], ['pbShrink', 'shrink']].forEach(function (m) { $(m[0]).onchange = function () { S[m[1]] = this.checked; render(); }; });
    $('pbPaper').onchange = function () { S.paper = this.value; }; $('pbTrim').onchange = function () { S.trim = this.value; };
    $('pbMake').onclick = function () { run('booklet'); }; $('pbBook').onclick = function () { run('book'); };
    $('pbBack').onclick = function () { window.ZineSetStep && window.ZineSetStep('setup'); };
    $('pbClear').onclick = function () { if (confirm('Start over with a new PDF?')) { S = fresh(); render(); persist(); } };
    root.scrollTop = keep;
    persist();
  }
  function move(d) {
    var a = S.sel, b = a + d; if (a < 0 || b < 0 || b >= S.pages.length) return;
    var t = S.pages[a]; S.pages[a] = S.pages[b]; S.pages[b] = t; S.sel = b; render();
  }
  function wireFile(id, fn) { var i = $(id); if (!i) return; i.onchange = function () { var f = i.files && i.files[0]; i.value = ''; if (f) fn(f); }; }

  window.PdfBook = {
    mount: function (el) { root = el; if (!S) S = fresh(); render(); },
    // pick up the saved booklet, if there is one
    resume: function (el) { root = el; return restore().then(function (ok) { if (!S) S = fresh(); render(); return ok; }); },
    hasSaved: function () { return loadSaved().then(function (d) { return d && d.pages ? d.pages.length : 0; }); },
    // called from step 1 when a file is picked there. A new file starts a new booklet.
    start: function (file) { S = fresh(); addPdf(file, null); },
    _state: function () { return S; }
  };
  window.PdfBookCore.buildBooklet = function () { return buildBooklet(); };
  window.PdfBookCore.buildBook = function () { return buildBook(); };
  window.PdfBookCore.setState = function (s) { S = s; };
})();
