// admin-lulu.js  |  NOCIV.CO
// Lulu book maker for Admin, Zine Library. Takes a finished PDF (made anywhere) and makes the two
// files Lulu wants for a stapled booklet: the inside pages and the cover as one spread.
// Lulu facts used (from Lulu's own guides): 0.125 in bleed on every side, US Letter trim is 8.5 x 11,
// booklet page count is a multiple of 4 with a maximum of 44, cover is one spread PDF (back left, front right).
(function () {
  var BLEED = 9; // 0.125 in in PDF points
  var MAX_PAGES = 44;
  var PDFLIB = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
  var libP = null;
  function lib() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (libP) return libP;
    libP = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = PDFLIB;
      s.onload = function () { res(window.PDFLib); };
      s.onerror = function () { libP = null; rej(new Error('Could not load the PDF tool. Check your connection and try again.')); };
      document.head.appendChild(s);
    });
    return libP;
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function inch(pt) { return (Math.round(pt / 72 * 100) / 100) + ''; }

  // Build both PDFs. opts: {frontIsCover, backIsCover, fill}
  async function build(bytes, opts) {
    var L = await lib(), PD = L.PDFDocument;
    var src = await PD.load(bytes, { ignoreEncryption: true });
    var n = src.getPageCount();
    // a page with no content at all cannot be copied, so give it an invisible mark first
    for (var q = 0; q < n; q++) { var sp0 = src.getPage(q); if (!sp0.node.Contents()) sp0.drawRectangle({ x: 0, y: 0, width: 1, height: 1, opacity: 0, borderOpacity: 0 }); }
    if (n < 2) throw new Error('That PDF has only ' + n + ' page. Lulu needs a real book.');
    var first = opts.frontIsCover ? 1 : 0, last = opts.backIsCover ? n - 1 : n; // interior = [first, last)
    var interiorIdx = []; for (var i = first; i < last; i++) interiorIdx.push(i);
    if (!interiorIdx.length) throw new Error('No inside pages left after taking out the covers.');
    var sz = src.getPage(interiorIdx[0]).getSize(), W = sz.width, H = sz.height;
    var pad = (4 - (interiorIdx.length % 4)) % 4, total = interiorIdx.length + pad;
    var info = { pages: n, trimW: W, trimH: H, interior: interiorIdx.length, pad: pad, total: total, frontIsCover: opts.frontIsCover, backIsCover: opts.backIsCover };
    if (total > MAX_PAGES) { info.tooBig = true; return info; }

    // how to place one source page on a target area: scale to cover (fill) or 1 to 1 (keep)
    function place(page, emb, sw, sh, cx, cy, cover) {
      var s = opts.fill ? Math.max(cover[0] / sw, cover[1] / sh) : Math.min(W / sw, H / sh);
      var w = sw * s, h = sh * s;
      page.drawPage(emb, { x: cx - w / 2, y: cy - h / 2, width: w, height: h });
    }
    // interior
    var out = await PD.create();
    var emb = await out.embedPdf(src, interiorIdx);
    var pw = W + 2 * BLEED, ph = H + 2 * BLEED;
    interiorIdx.forEach(function (idx, k) {
      var sp = src.getPage(idx).getSize(), pg = out.addPage([pw, ph]);
      place(pg, emb[k], sp.width, sp.height, pw / 2, ph / 2, [pw, ph]);
    });
    for (var p = 0; p < pad; p++) out.addPage([pw, ph]);
    out.setTitle(src.getTitle() || 'Interior'); out.setProducer('NOCIV.CO Lulu book maker');
    var interiorBytes = await out.save();

    // cover spread: back on the left, front on the right, no spine (stapled booklet)
    var cv = await PD.create(), cw = 2 * W + 2 * BLEED, cpg = cv.addPage([cw, ph]);
    var panelW = W + BLEED;
    var coverIdx = []; if (opts.backIsCover) coverIdx.push(n - 1); if (opts.frontIsCover) coverIdx.push(0);
    var cEmb = coverIdx.length ? await cv.embedPdf(src, coverIdx) : [];
    var backE = opts.backIsCover ? cEmb[0] : null, frontE = opts.frontIsCover ? cEmb[opts.backIsCover ? 1 : 0] : null;
    function drawPanel(embp, srcIdx, x0, trimCx) {
      if (!embp) return;
      var sp = src.getPage(srcIdx).getSize();
      cpg.pushOperators(L.pushGraphicsState(), L.rectangle(x0, 0, panelW, ph), L.clip(), L.endPath());
      place(cpg, embp, sp.width, sp.height, trimCx, ph / 2, [panelW, ph]);
      cpg.pushOperators(L.popGraphicsState());
    }
    drawPanel(backE, n - 1, 0, BLEED + W / 2);
    drawPanel(frontE, 0, panelW, panelW + W / 2);
    cv.setTitle((src.getTitle() || 'Book') + ' cover'); cv.setProducer('NOCIV.CO Lulu book maker');
    var coverBytes = await cv.save();
    info.interiorBytes = interiorBytes; info.coverBytes = coverBytes; info.pw = pw; info.ph = ph; info.cw = cw;
    return info;
  }

  function download(bytes, name) {
    var blob = new Blob([bytes], { type: 'application/pdf' }), u = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 5000);
  }
  function slug(s) { return String(s || 'book').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'book'; }

  function mount(host, getLibrary, o) {
    o = o || {}; var BTN = o.btn || 'edit-btn';
    host.innerHTML = '' +
      '<div class="lulu-box">' +
      '<p class="field-hint" style="margin:0 0 10px;">Have a finished PDF that was not made in the Zine Builder? Pick it here and this makes the two files Lulu wants for a stapled booklet. Nothing gets uploaded or changed on your site.</p>' +
      '<label for="lmFile">Your PDF</label><input type="file" id="lmFile" accept="application/pdf">' +
      '<label for="lmLib" style="margin-top:8px;">...or one from your Zine Library</label><select id="lmLib"><option value="">Choose one</option></select>' +
      '<div id="lmInfo" class="field-hint" style="margin:10px 0;"></div>' +
      '<div id="lmOpts" hidden>' +
      '<label class="lm-check"><input type="checkbox" id="lmFront" checked> <span>Page 1 is the front cover</span></label>' +
      '<label class="lm-check"><input type="checkbox" id="lmBack" checked> <span>The last page is the back cover</span></label>' +
      '<label class="lm-check"><input type="checkbox" id="lmFill" checked> <span>Stretch the art out to the edge (best when your pages have full color or photos to the edge). Uncheck to keep every bit of every page with a white edge.</span></label>' +
      '<button type="button" class="' + BTN + '" id="lmGo" style="margin-top:10px;width:100%;padding:14px;">Make my Lulu files</button>' +
      '</div>' +
      '<div id="lmOut"></div></div>';
    var $ = function (id) { return host.querySelector('#' + id); };
    var cur = null; // {bytes, name}
    var libRows = [];
    var css = document.createElement('style');
    css.textContent = '.lulu-box{border:2px solid #111;padding:12px;margin:0 0 14px;background:#f2ecd6;color:#1d1c1a}.lulu-box .field-hint{font-size:.82rem;opacity:.8;line-height:1.4}.lulu-box label{font-weight:700;font-size:.8rem;display:block;margin-top:6px}.lulu-box input[type=file],.lulu-box select{width:100%;box-sizing:border-box;margin-top:4px;padding:8px;font:inherit}.lm-check{display:flex;gap:8px;align-items:flex-start;margin:8px 0;font-size:.85rem}.lm-check input{width:auto;margin-top:3px}.lm-file{display:flex;gap:8px;align-items:center;justify-content:space-between;border:1.5px solid #111;background:#fff;padding:10px;margin:8px 0;font-size:.82rem}.lm-file button{flex:none}.lm-warn{border:2px solid #c8412f;color:#c8412f;background:#fff;padding:8px 10px;font-weight:700;font-size:.82rem;margin:8px 0}';
    document.head.appendChild(css);

    function setSource(bytes, name) {
      cur = { bytes: bytes, name: name }; $('lmOut').innerHTML = '';
      lib().then(function (L) { return L.PDFDocument.load(bytes, { ignoreEncryption: true }); }).then(function (d) {
        var sz = d.getPage(0).getSize(), n = d.getPageCount();
        var ok = (Math.abs(sz.width - 612) < 3 && Math.abs(sz.height - 792) < 3) ? 'US Letter, a Lulu booklet size.' : ((Math.abs(sz.width - 396) < 3 && Math.abs(sz.height - 612) < 3) ? 'Half letter (digest), a Lulu booklet size.' : 'That is not a standard Lulu booklet size (US Letter 8.5 x 11 or half letter 5.5 x 8.5). Lulu may not accept it.');
        $('lmInfo').innerHTML = '<b>' + esc(name) + '</b><br>' + n + ' pages, ' + inch(sz.width) + ' x ' + inch(sz.height) + ' in. ' + esc(ok);
        $('lmOpts').hidden = false;
      }).catch(function (e) { $('lmInfo').innerHTML = '<span class="lm-warn" style="display:block;">Could not read that PDF. ' + esc(e && e.message || '') + '</span>'; $('lmOpts').hidden = true; });
    }
    $('lmFile').onchange = function () {
      var f = this.files[0]; if (!f) return;
      f.arrayBuffer().then(function (b) { $('lmLib').value = ''; setSource(new Uint8Array(b), f.name); cur.zid = ''; });
    };
    $('lmLib').onchange = function () {
      var u = this.value; if (!u) return; var label = this.options[this.selectedIndex].text; var zid = this.options[this.selectedIndex].dataset.zid || '';
      $('lmInfo').textContent = 'Getting it...';
      fetch(u).then(function (r) { if (!r.ok) throw new Error('could not download'); return r.arrayBuffer(); })
        .then(function (b) { $('lmFile').value = ''; setSource(new Uint8Array(b), label); cur.zid = zid; })
        .catch(function () { $('lmInfo').innerHTML = '<span class="lm-warn" style="display:block;">Could not get that one from the library. Download it and pick it with the first box.</span>'; });
    };
    $('lmGo').onclick = async function () {
      if (!cur) return;
      var b = this; b.disabled = true; var t = b.textContent; b.textContent = 'Making...'; $('lmOut').innerHTML = '';
      try {
        var r = await build(cur.bytes, { frontIsCover: $('lmFront').checked, backIsCover: $('lmBack').checked, fill: $('lmFill').checked });
        var h = '';
        if (r.tooBig) {
          h = '<div class="lm-warn">' + r.total + ' inside pages is too many for a stapled Lulu booklet (the most is ' + MAX_PAGES + '). This one needs a spine book instead, which this tool does not make yet. Tell me and I will add it.</div>';
        } else {
          var name = slug(cur.name.replace(/\.pdf$/i, ''));
          h += '<p class="field-hint" style="margin:8px 0;">Every page stays in the same spot, blank pages too. Inside: ' + r.interior + ' pages' + (r.pad ? ' plus ' + r.pad + ' blank at the end so the count is a multiple of 4 (Lulu needs that)' : ', already a multiple of 4') + ', ' + inch(r.pw) + ' x ' + inch(r.ph) + ' in with the edge. Cover: one spread, ' + inch(r.cw) + ' x ' + inch(r.ph) + ' in, back on the left and front on the right.</p>';
          h += '<div class="lm-file"><span>Inside pages (' + r.total + ' pages)</span><button type="button" class="' + BTN + '" data-k="i">Save</button></div>';
          h += '<div class="lm-file"><span>Cover (one spread)</span><button type="button" class="' + BTN + '" data-k="c">Save</button></div>';
          if (o.keep) h += '<div class="lm-keep"><label for="lmKeepSel">Keep these on my site, attached to:</label><select id="lmKeepSel"><option value="">Choose the zine</option>' + libRows.map(function (z) { return '<option value="' + z.id + '"' + (String(z.id) === String(cur.zid) ? ' selected' : '') + '>' + esc(z.title) + '</option>'; }).join('') + '</select><button type="button" class="' + BTN + '" id="lmKeep" style="margin-top:8px;width:100%;padding:12px;">Keep on my site</button><p class="field-hint" id="lmKeepMsg"></p></div>';
          h += '<ol class="field-hint" style="padding-left:18px;"><li>Go to Lulu, start a booklet, choose US Letter (or your size) and saddle stitch.</li><li>Upload the inside pages file, then the cover file. Lulu checks both and tells you if something is off.</li><li>Order one proof copy before you sell any.</li></ol>';
        }
        $('lmOut').innerHTML = h;
        $('lmOut').querySelectorAll('button[data-k]').forEach(function (bt) { bt.onclick = function () { download(bt.dataset.k === 'i' ? r.interiorBytes : r.coverBytes, 'nociv-' + slug(cur.name.replace(/\.pdf$/i, '')) + (bt.dataset.k === 'i' ? '-lulu-inside.pdf' : '-lulu-cover.pdf')); }; });
        window.__luluLast = r;
        var kb = $('lmKeep');
        if (kb) kb.onclick = async function () {
          var zid = $('lmKeepSel').value, msg = $('lmKeepMsg');
          if (!zid) { msg.textContent = 'Pick which zine these belong to.'; return; }
          kb.disabled = true; msg.textContent = 'Saving...';
          try { await o.keep(zid, r, slug(cur.name.replace(/\.pdf$/i, ''))); msg.innerHTML = '<b>Saved.</b> That zine now says Lulu files ready.'; }
          catch (e) { msg.innerHTML = '<span style="color:#c8412f;font-weight:700;">' + esc(e && e.message || 'Could not save') + '</span>'; }
          kb.disabled = false;
        };
      } catch (e) { $('lmOut').innerHTML = '<div class="lm-warn">That did not work: ' + esc(e && e.message || 'unknown error') + '</div>'; }
      b.disabled = false; b.textContent = t;
    };
    // library list
    Promise.resolve(getLibrary && getLibrary()).then(function (rows) {
      libRows = rows || [];
      (rows || []).forEach(function (z) {
        var parts = Array.isArray(z.parts) && z.parts.length ? z.parts : (z.file_url ? [{ label: '', url: z.file_url }] : []);
        parts.forEach(function (p) { if (!p.url) return; var o = document.createElement('option'); o.value = p.url; o.textContent = z.title + (p.label ? ' (' + p.label + ')' : ''); o.dataset.zid = z.id; $('lmLib').appendChild(o); });
      });
    }).catch(function () {});
  }

  window.NLulu = { mount: mount, build: build };
})();
