/* NOCIV Stencil studio front end (Chat B, 11-10; one level at a time, 11-13).
   A new face on the engines already in index.html: Mix layers (window.__nvMix), cut stencil (S, masks, bridges),
   Save (#nvSave from Chat A), Undo/Redo (window.__nvLater). Add ?classic to the address for the old screen. */
(function () {
  'use strict';
  if (/classic/.test(location.search)) return;
  var $ = function (x) { return document.getElementById(x); };
  var MX = window.__nvMix; if (!MX || !$('wrap')) return;
  var X = MX.state;
  var say = function (t) { if (window.__nvSay) window.__nvSay(t); };
  var later = function () { if (window.__nvLater) window.__nvLater(); };
  var I = {
    start: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M21 16l-5-5-8 8"/>',
    make: '<path d="M18 3l3 3-9.5 9.5-3-3z"/><path d="M8.5 12.5c-2 0-3.5 1.5-3.5 3.5 0 1.5-1 2.5-2 3 3 1 7 0 8-3.5"/>',
    save: '<path d="M12 3v12M7 10l5 5 5-5M4 19h16"/>',
    style: '<circle cx="7" cy="7" r="3"/><rect x="14" y="4" width="6" height="6"/><path d="M4 14l3 3-3 3M14 17h7"/>',
    tone: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
    dots: '<circle cx="6" cy="6" r="1.5"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2.5"/><circle cx="18" cy="12" r="3"/><circle cx="6" cy="18" r="2.5"/><circle cx="12" cy="18" r="3"/>',
    grit: '<path d="M4 6h1M9 4h1M15 7h1M19 5h1M6 11h1M12 10h1M17 12h1M4 17h1M9 15h1M14 18h1M19 16h1M11 20h1"/>',
    color: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
    layer: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
    done: '<path d="M5 12l5 5 9-10"/>',
    crop: '<path d="M6 2v16h16"/><path d="M2 6h16v16"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + I[n] + '</svg>'; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var INKS = ['#1a1a1a', '#e2342a', '#1d4ed8', '#2f7a4b', '#f2b705', '#ffffff'];
  var LET = 'ABCD';
  function sampleOn() { var f = $('fname'); return !f || /JPG or PNG/.test(f.textContent); }
  function job() { return window.__nvJob || 'one'; }
  function cut() { return job() === 'cut'; }

  /* ---------- the frame ---------- */
  document.documentElement.classList.add('sd-on');
  var app = document.createElement('div'); app.className = 'sd'; app.id = 'sd';
  app.innerHTML =
    '<div class="sd-top"><a href="/creator-tools.html" aria-label="Back to tools">&#8249;</a><b>Stencil + Halftone</b></div>' +
    '<div class="sd-bar"><span class="sd-bar-l" id="sdBarL"></span><span class="sd-bar-r" id="sdBarR"><button type="button" id="sdHelp" class="sd-q" aria-label="Help">?</button></span></div>' +
    '<div class="sd-stage" id="sdStage"><div class="sd-empty" id="sdEmpty"><button type="button" id="sdAddArt">Add your art<small>JPG or PNG. Stays on your phone.</small></button></div></div>' +
    '<div class="sd-con" id="sdCon"><button type="button" class="sd-grip" id="sdGrip" aria-label="Open or close the panel"></button><div class="sd-head"><div class="sd-title" id="sdTitle"></div><button type="button" class="sd-done" id="sdDone" hidden>' + ic('done') + 'Done</button></div><div class="sd-add" id="sdAdd"></div><div class="sd-body" id="sdBody"></div></div>' +
    '<nav class="sd-dock" id="sdDock" aria-label="Steps"></nav>';
  document.body.appendChild(app);
  var framed = false; try { framed = window.top !== window; } catch (_) { framed = true; }
  if (framed) app.querySelector('.sd-top').remove();
  var stage = $('sdStage'), wrap = $('wrap'), body = $('sdBody'), add = $('sdAdd'), con = $('sdCon');
  stage.insertBefore(wrap, stage.firstChild);
  // nothing floats on the picture: Undo, Redo and the Artboard switch move up into the toolbar
  (function () { var u = wrap.querySelector('.nv-fl.tl'), v = $('viewT'); if (u) $('sdBarL').appendChild(u); if (v) $('sdBarR').insertBefore(v, $('sdHelp')); })();
  // keep the old parts we reuse out of the hidden column
  var hold = document.createElement('div'); hold.hidden = true; app.appendChild(hold);

  var step = 'start', tool = null; // tool = a layer is open for editing, null = the whole design
  var STEPS = [['start', 'Start'], ['make', 'Make'], ['save', 'Save']];

  /* ---------- engine helpers ---------- */
  function fire(el, ev) { el.dispatchEvent(new Event(ev, { bubbles: true })); }
  function setCtl(id, v) { var el = $(id); if (!el) return; el.value = v; fire(el, 'input'); fire(el, 'change'); }
  function refresh() { if (!cut() && has) { X.applied = true; } MX.render(true); later(); }
  function engine() { // cut stencil uses the classic stencil view, every other job uses the layer stack
    if (typeof setMode === 'function' && mode !== 'st') $('mSt').click();
    if (cut()) { if (MX.isOn()) MX.leave(); }
    else { X.applied = true; if (!MX.isOn()) MX.enter(); }
  }
  function lay(o) { return Object.assign({ src: 'st', pic: 'same', c: X.ink1 || '#1a1a1a', dx: 0, dy: 0, op: 100, t: S.t, grit: 0, gk: 'speck', seed: 1 }, o); }
  function oneInk() { if (job() !== 'one') return; X.L.forEach(function (l) { l.c = X.ink1 || '#1a1a1a'; }); }
  function fixLayers() {
    if (!X.L || !X.L.length) X.L = [lay({})];
    X.L = X.L.filter(function (l) { return l.src !== 'off' && l.src !== 'cur'; });
    if (!X.L.length) X.L = [lay({})];
    X.L.forEach(function (l) { if (l.t == null) l.t = S.t; if (l.grit == null) l.grit = 0; if (!l.gk) l.gk = 'speck'; if (!l.seed) l.seed = 1; });
    if (X.sel >= X.L.length) X.sel = X.L.length - 1;
    oneInk();
  }
  function styleOf(l) { return l.src === 'ht' ? 'Halftone' : l.grit > 0 ? 'Grit' : 'Solid'; }

  /* ---------- dock ---------- */
  function dockUI() {
    $('sdDock').innerHTML = STEPS.map(function (s) { return '<button type="button" data-s="' + s[0] + '"' + (s[0] === step ? ' aria-current="step"' : '') + '>' + ic(s[0]) + '<span>' + s[1] + '</span></button>'; }).join('');
  }
  $('sdDock').addEventListener('click', function (e) { var b = e.target.closest('button[data-s]'); if (b) go(b.dataset.s); });
  function go(s) {
    step = s; tool = null; con.classList.remove('shut');
    if (s === 'save') { try { window.dispatchEvent(new CustomEvent('nvpart', { detail: 'files' })); } catch (_) {} }
    ui();
  }

  /* ---------- console grip ---------- */
  (function () {
    var g = $('sdGrip'), y0 = null;
    g.addEventListener('click', function () { con.classList.toggle('shut'); });
    g.addEventListener('pointerdown', function (e) { y0 = e.clientY; });
    window.addEventListener('pointerup', function (e) { if (y0 == null) return; var dy = e.clientY - y0; y0 = null; if (dy > 30) con.classList.add('shut'); else if (dy < -30) con.classList.remove('shut'); });
  })();

  /* ---------- START ---------- */
  var JOBS = [['digital', 'Digital', 'Post it, stickers, DTF'], ['one', 'One screen', 'Every layer in one ink'], ['multi', 'Screen per color', 'One screen per layer'], ['cut', 'Cut stencil', 'Cut it from a sheet']];
  function startUI() {
    var sizes = Array.prototype.map.call(document.querySelectorAll('#sizePick button'), function (b, i) { var w = b.querySelector('small') ? b.querySelector('small').textContent.replace(/ wide/, '') : ''; return '<button type="button" class="sd-pill" data-size="' + i + '" aria-pressed="' + b.getAttribute('aria-pressed') + '">' + esc(b.childNodes[0].textContent.replace(/ front| back| or hat| or cut-out| page/, '')) + ' <small>' + esc(w) + '</small></button>'; }).join('');
    var jb = JOBS.filter(function (j) { return j[0] === job(); })[0] || JOBS[1];
    body.innerHTML =
      '<div class="sd-lead"><button type="button" class="sd-main" data-a="art">' + ic('start') + '<span><b>Add your art</b><small>' + (sampleOn() ? 'You are looking at our sample' : 'Swap in a new picture') + '</small></span></button><button type="button" class="sd-link" data-a="sample">Sample</button></div>' +
      (has ? '<div class="sd-pills4 two"><button type="button" class="sd-pill" data-a="crop">' + ic('crop') + 'Crop</button><button type="button" class="sd-pill" data-a="over">Start over</button></div>' : '') +
      '<p class="sd-h">Making</p><div class="sd-pills4">' + JOBS.map(function (j) { return '<button type="button" class="sd-pill" data-job="' + j[0] + '" aria-pressed="' + (job() === j[0]) + '">' + j[1] + '</button>'; }).join('') + '</div><p class="sd-why">' + jb[2] + '</p>' +
      '<p class="sd-h">Size</p><div class="sd-pills4">' + sizes + '</div>';
  }

  /* ---------- MAKE: layers ---------- */
  function chipsHTML() {
    return X.L.map(function (l, i) {
      var on = !!tool && X.sel === i, bg = l.c === '#ffffff' ? '#cfc9bb' : l.c;
      return '<button type="button" class="sd-chip" data-l="' + i + '" aria-pressed="' + on + '"><i style="background:' + bg + '">' + LET[i] + '</i><span>' + styleOf(l) + '<small>Layer ' + LET[i] + '</small></span></button>';
    }).join('') + (X.L.length < 4 ? '<button type="button" class="sd-chip plus" data-a="addlayer" aria-label="Add a layer">+</button>' : '');
  }
  function chipsUI() { // with a layer open the chips sit on top to switch layers. Otherwise they live under Looks.
    add.innerHTML = step === 'make' && !cut() && tool ? chipsHTML() : '';
  }
  function pick(i) { X.sel = i; tool = 'edit'; ui(); }

  function slider(key, label, min, max, stepv, val, unit) { return '<div class="sd-row"><b>' + label + '</b><input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + stepv + '" value="' + val + '"><output>' + val + (unit || '') + '</output></div>'; }
  function inks(cur, key) { return '<div class="sd-inks">' + INKS.map(function (h) { return '<button type="button" data-ink="' + key + '" data-v="' + h + '" style="background:' + h + '" aria-label="Ink ' + h + '" aria-pressed="' + (h === cur) + '"></button>'; }).join('') + '<label aria-label="Any color"><input type="color" data-inkc="' + key + '" value="' + cur + '"></label></div>'; }
  var MESH = [[110, 25, 'Bold'], [156, 35, 'Shirts'], [230, 50, 'Fine'], [305, 65, 'Very fine']];
  function fold(id, label, inner) { return '<details class="sd-fold" id="' + id + '"' + (openF[id] ? ' open' : '') + '><summary>' + label + '</summary>' + inner + '</details>'; }
  function gritUI(l, min) {
    return '<div class="sd-tiles t4">' + [['speck', 'Speckle'], ['crack', 'Cracked'], ['wear', 'Worn'], ['copy', 'Photocopy']].map(function (g) { return '<button type="button" class="sd-tile c" data-gk="' + g[0] + '" aria-pressed="' + (l.grit > 0 && l.gk === g[0]) + '"><b>' + g[1] + '</b></button>'; }).join('') + '</div>' +
      slider('grit', 'Amount', min, 100, 1, Math.max(min, l.grit)) + '<button type="button" class="sd-btn" data-a="reseed">Shuffle the grit</button>';
  }
  function makeUI() {
    if (cut()) { cutUI(); return; }
    if (!tool) { // nothing picked: the whole design. Looks first, layers second.
      var paper = X.paper || '#ffffff', cur = curLook();
      body.innerHTML =
        '<p class="sd-h">Pick a look</p><div class="sd-looks" id="sdLooks">' +
          LOOKS.map(function (k) { return '<button type="button" class="sd-look" data-look="' + k[0] + '" aria-pressed="' + (cur === k[0]) + '"><canvas width="8" height="8"></canvas><b>' + k[1] + '</b></button>'; }).join('') + '</div>' +
        (cur === 'vintage' ? '<p class="sd-note">Tap Vintage again for a new one.</p>' : '') +
        '<p class="sd-h">Fine tune a layer</p><div class="sd-add in">' + chipsHTML() + '</div>' +
        '<div class="sd-mini">' + (job() === 'one' ? '<span><p class="sd-h">Ink</p>' + inks(X.ink1 || '#1a1a1a', 'one') + '</span>' : '') +
        '<span><p class="sd-h">Paper</p><div class="sd-inks">' + [['#ffffff', 'White'], ['#f3ead7', 'Cream'], ['#1a1a1a', 'Black']].map(function (p) { return '<button type="button" data-paper="' + p[0] + '" style="background:' + p[0] + '" aria-label="' + p[1] + ' paper" aria-pressed="' + (paper === p[0]) + '"></button>'; }).join('') + '</div></span></div>';
      paintLooks();
      return;
    }
    // one layer: everything for it in one panel. Style on top, the control that matters, color, then the rest folded away.
    var l = X.L[X.sel], st = styleOf(l), sh = $('hShape');
    var h = '<div class="sd-seg" role="group" aria-label="Style">' + ['Solid', 'Halftone', 'Grit'].map(function (s) { return '<button type="button" data-style="' + s + '" aria-pressed="' + (st === s) + '">' + s + '</button>'; }).join('') + '</div>';
    if (st !== 'Halftone') h += slider('t', 'Light to dark', 10, 245, 1, l.t);
    if (st === 'Grit') h += gritUI(l, 5);
    if (st === 'Halftone') {
      h += '<p class="sd-h">Dot size, by screen mesh</p><div class="sd-tiles t5">' +
        '<button type="button" class="sd-tile c" data-mesh="0" aria-pressed="' + (!X.lpi) + '"><b>Auto</b><span>Most</span></button>' +
        MESH.map(function (m) { return '<button type="button" class="sd-tile c" data-mesh="' + m[1] + '" aria-pressed="' + (X.lpi === m[1]) + '"><b>' + m[0] + '</b><span>' + m[2].replace('Very fine', 'V. fine') + '</span></button>'; }).join('') + '</div>';
    }
    if (job() !== 'one') h += '<p class="sd-h">Color</p>' + inks(l.c, 'layer');
    if (st === 'Halftone') {
      h += fold('sdFine', 'Dot shape and fine tune',
        '<div class="sd-tiles t3">' + Array.prototype.map.call(sh.options, function (o) { return '<button type="button" class="sd-tile c" data-shape="' + o.value + '" aria-pressed="' + (sh.value === o.value) + '"><b>' + esc(o.textContent.replace(/\s*\(.*\)/, '')) + '</b></button>'; }).join('') + '</div>' +
        (X.lpi ? slider('lpi', 'Lines per inch', 10, 85, 1, X.lpi) : slider('dotsz', 'Dot size', 0, 3, 1, ['s', 'm', 'b', 'h'].indexOf(X.dots || 'm'))) +
        [['hBri', 'Brightness'], ['hCon', 'Contrast'], ['hAng', 'Angle'], ['hMin', 'Smallest dot'], ['hMax', 'Largest dot']].map(function (r) { var el = $(r[0]); return el ? slider('ctl:' + r[0], r[1], el.min, el.max, el.step || 1, el.value) : ''; }).join('') +
        '<p class="sd-note">Dot shape and fine tune apply to every halftone layer.</p>') +
        fold('sdGrit', 'Add grit', gritUI(l, 0));
    }
    h += fold('sdMore', 'Move, copy, delete',
      slider('op', 'See-through', 20, 100, 5, l.op, '%') +
      '<div class="sd-tiles t4" style="margin-top:6px"><button type="button" class="sd-tile c" data-a="center"><b>Line up</b></button><button type="button" class="sd-tile c" data-a="copy"><b>Copy</b></button><button type="button" class="sd-tile c" data-a="up"><b>Up</b></button><button type="button" class="sd-tile c" data-a="del"><b>Delete</b></button></div>' +
      '<p class="sd-note">Drag the picture to nudge this layer off register.</p>');
    body.innerHTML = h;
  }
  var openF = {}; try { openF.sdFine = localStorage.getItem('nocivStFine') === '1'; } catch (_) {}
  body.addEventListener('toggle', function (e) { var id = e.target.id; if (!id || !/^sd(Fine|Grit|More)$/.test(id)) return; openF[id] = e.target.open; if (id === 'sdFine') { try { localStorage.setItem('nocivStFine', e.target.open ? '1' : '0'); } catch (_) {} } }, true);


  /* ---------- MAKE: cut stencil uses the classic tools ---------- */
  var moved = false;
  function cutUI() {
    body.innerHTML = slider('ctl:thr', 'Light to dark', $('thr').min, $('thr').max, 1, $('thr').value) +
      '<div class="sd-row"><b>Layers</b><div class="sd-tiles t4" style="flex:1">' + [1, 2, 3, 4].map(function (n) { return '<button type="button" class="sd-tile c" data-nl="' + n + '" aria-pressed="' + (S.n === n) + '"><b>' + n + '</b></button>'; }).join('') + '</div></div>' +
      (S.n > 1 ? '<div class="sd-row"><b>Show layer</b><div class="sd-tiles t4" style="flex:1">' + Array.from({ length: S.n }, function (_, i) { return '<button type="button" class="sd-tile c" data-al="' + i + '" aria-pressed="' + (S.a === i) + '"><b>' + stLetter(i) + '</b></button>'; }).join('') + '</div></div>' : '') +
      '<p class="sd-h">Bridges</p><div id="sdCutSlot"></div>' + slider('ctl:bw', 'Bridge width', $('bw').min, $('bw').max, $('bw').step || 1, $('bw').value);
    var slot = $('sdCutSlot');
    [$('islN'), $('autoB'), $('tools'), $('toolHelp'), $('edClear')].forEach(function (el) { if (el) { el.classList.add('sd-moved'); slot.appendChild(el); } });
    moved = true;
  }
  function putBack() { // tools borrowed for Cut go back to their home so Undo and the old code still find them
    if (!moved) return; moved = false;
    [$('islN'), $('autoB'), $('tools'), $('toolHelp'), $('edClear')].forEach(function (el) { if (el) hold.appendChild(el); });
  }

  /* ---------- SAVE ---------- */
  function saveUI() {
    var sv = $('nvSave'); body.innerHTML = '';
    if (!has) { body.innerHTML = '<p class="sd-note">Add your art first.</p>'; return; }
    if (!cut()) X.applied = true;
    body.appendChild(sv);
    if (job() === 'multi') {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'sd-btn'; b.textContent = 'One film per layer (' + X.L.length + ')';
      var out = document.createElement('div'); out.className = 'mfiles';
      b.onclick = function () { MX.makeFiles(out); }; body.appendChild(b); body.appendChild(out);
      var p = document.createElement('p'); p.className = 'sd-note'; p.textContent = 'Each layer becomes its own black film, lined up with the others. Print them at 100%.'; body.appendChild(p);
    }
    if (cut()) { body.appendChild($('make')); body.appendChild($('files')); }
    var w = $('wi'); if (w) { var d = document.createElement('div'); d.innerHTML = slider('ctl:wi', 'Print width', w.min, w.max, w.step, w.value, ' in'); body.appendChild(d.firstChild); }
    var tp = document.querySelector('.topattern'); if (tp) body.appendChild(tp);
  }

  /* ---------- everything on screen ---------- */
  var lastKey = '';
  function ui() {
    if (step !== 'make' || !cut()) putBack();
    if (has) engine();
    fixLayers(); dockUI();
    var edit = step === 'make' && !cut() && !!tool;
    if (!edit) tool = null;
    var t = step === 'start' ? 'Start' : step === 'save' ? 'Save <small>' + (JOBS.filter(function (j) { return j[0] === job(); })[0] || ['', ''])[1] + '</small>' : cut() ? 'Make <small>Cut stencil</small>' : edit ? 'Layer ' + LET[X.sel] + ' <small>' + styleOf(X.L[X.sel]) + '</small>' : 'Make <small>Whole design</small>';
    $('sdTitle').innerHTML = t;
    // one level at a time: with a layer open, the step bar steps aside and Done brings it back
    $('sdDone').hidden = !edit; $('sdDock').hidden = edit;
    var key = step + ':' + (edit ? 'L' + X.sel : ''), top = body.scrollTop;
    chipsUI();
    if (step === 'start') startUI(); else if (step === 'make') makeUI(); else saveUI();
    body.scrollTop = key === lastKey ? top : 0; lastKey = key;
    $('sdEmpty').hidden = !!has;
  }
  window.__nvStudioRefresh = function () { setTimeout(ui, 20); };

  /* ---------- looks ---------- */
  var LOOKS = [['clean', 'Clean'], ['vintage', 'Vintage'], ['shadow', 'Red shadow'], ['misprint', 'Misprint'], ['ghost', 'Ghost'], ['pop', 'Pop dots'], ['double', 'Double'], ['comic', 'Comic']];
  var vSeed = 1;
  function vintLayers(ink) { // her move: one ink, a few cutoffs stacked slightly off, the ink eaten by texture
    var t = S.t, j = function (n) { return ((vSeed * 7 + n * 13) % 9 - 4) / 10; };
    return [
      lay({ c: ink, t: Math.max(20, t - 40), grit: 22, gk: 'crack', seed: vSeed }),
      lay({ c: ink, t: t, grit: 55, gk: 'wear', seed: vSeed + 1, dx: .3 + j(1), dy: .2 + j(2) }),
      lay({ c: ink, t: Math.min(240, t + 45), grit: 80, gk: 'speck', seed: vSeed + 2, dx: -.25 + j(3), dy: .3 + j(4) })
    ];
  }
  function lookLayers(k) {
    var one = job() === 'one', ink = X.ink1 || '#1a1a1a', t = S.t, red = one ? ink : '#e2342a';
    if (k === 'vintage') return vintLayers(one ? ink : '#1a1a1a');
    return {
      clean: [lay({ c: ink })],
      shadow: [lay({ c: ink }), lay({ src: 'ht', c: red, dx: 2.5, dy: 2 })],
      misprint: [lay({ c: red, dx: -1.5, dy: 1 }), lay({ src: 'ht', c: one ? ink : '#1d4ed8', dx: 1, dy: -.5 })],
      ghost: [lay({ c: ink }), lay({ c: red, dx: 4, dy: -3, op: 45 })],
      pop: [lay({ src: 'ht', c: red }), lay({ c: ink, t: t - 40 })],
      double: [lay({ src: 'ht', c: ink }), lay({ src: 'ht', c: ink, dx: 1.6, dy: 1.2, op: 70 })],
      comic: [lay({ src: 'ht', c: red }), lay({ c: ink, t: t - 50, grit: 15, gk: 'copy' })]
    }[k] || null;
  }
  function look(k) {
    if (k === 'vintage' && curLook() === 'vintage') vSeed += 3; // tap Vintage again for a new one
    var L = lookLayers(k); if (!L) return;
    X.L = L; X.sel = 0; X.look = -1; tool = null; oneInk(); refresh(); ui();
  }
  // which look is on screen right now, worked out from the layers so Undo and edits stay honest
  function sigL(L) { return JSON.stringify(L.map(function (l) { return [l.src, l.c, Math.round(l.dx * 10), Math.round(l.dy * 10), l.op, l.src === 'st' ? l.t : 0, l.grit || 0, l.grit > 0 ? l.gk : '']; })); }
  function curLook() {
    var L = X.L;
    if (L.length === 3 && L[0].gk === 'crack' && L[0].grit === 22 && L[1].gk === 'wear' && L[1].grit === 55 && L[2].gk === 'speck' && L[2].grit === 80) return 'vintage';
    var s = sigL(L);
    for (var i = 0; i < LOOKS.length; i++) { var k = LOOKS[i][0]; if (k !== 'vintage' && sigL(lookLayers(k)) === s) return k; }
    return null;
  }
  // small pictures of every look, made from her own art
  var thumbs = {}, thumbSig = '';
  function paintLooks() {
    var box = $('sdLooks'); if (!box || !has) return;
    var sh = $('hShape');
    var sig = [window.__nvPicN || 0, src.width, src.height, job(), X.ink1, X.paper, S.t, vSeed, X.lpi, X.dots, sh ? sh.value : ''].join('|');
    if (sig !== thumbSig) {
      thumbSig = sig; thumbs = {};
      var keepL = X.L, k = Math.min(1, 220 / Math.max(src.width, src.height)), W = Math.max(1, Math.round(src.width * k)), Hh = Math.max(1, Math.round(src.height * k));
      LOOKS.forEach(function (d) {
        try { X.L = lookLayers(d[0]); var t = document.createElement('canvas'); t.width = W; t.height = Hh; MX.compose(t.getContext('2d'), W, Hh); thumbs[d[0]] = t; } catch (_) {}
      });
      X.L = keepL; MX.render(true);
    }
    Array.prototype.forEach.call(box.querySelectorAll('button[data-look]'), function (b) {
      var t = thumbs[b.dataset.look], cv = b.querySelector('canvas'); if (!t || !cv) return;
      cv.width = t.width; cv.height = t.height; cv.getContext('2d').drawImage(t, 0, 0);
    });
  }

  /* ---------- taps in the console ---------- */
  function onTap(e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    var d = b.dataset, l = X.L[X.sel];
    if (d.a === 'art') { $('file').click(); return; }
    if (d.a === 'sample') { $('sample').click(); setTimeout(function () { go('make'); }, 200); return; }
    if (d.job) { var jb = document.querySelector('#jobs button[data-j=' + d.job + ']'); if (jb) jb.click(); fixLayers(); refresh(); ui(); return; }
    if (d.size != null) { var sb = document.querySelectorAll('#sizePick button')[+d.size]; if (sb) sb.click(); refresh(); ui(); return; }
    if (d.l != null) { if (tool && X.sel === +d.l) { tool = null; ui(); } else pick(+d.l); return; }
    if (d.a === 'addlayer') { var src = X.L[X.L.length - 1]; X.L.push(lay({ c: job() === 'one' ? X.ink1 || '#1a1a1a' : INKS[X.L.length % INKS.length], t: src ? src.t : S.t, dx: 1, dy: 1 })); refresh(); pick(X.L.length - 1); return; }
    if (d.a === 'crop') { $('fCrop').click(); return; }
    if (d.a === 'over') { var tr = $('nvTrash'); if (tr) tr.click(); return; }
    if (d.look) { look(d.look); return; }
    if (d.a === 'clean') { look('clean'); return; }
    if (d.paper) { X.paper = d.paper; refresh(); ui(); return; }
    if (d.style) { if (d.style === 'Halftone') { l.src = 'ht'; l.grit = l.gk === 'copy' ? l.grit : 0; } else { l.src = 'st'; l.grit = d.style === 'Grit' ? (l.grit || 45) : 0; } refresh(); ui(); return; }
    if (d.mesh != null) { X.lpi = +d.mesh; if (X.lpi) { setCtl('hMin', X.lpi <= 25 ? 12 : X.lpi <= 35 ? 8 : 5); } refresh(); ui(); return; }
    if (d.shape) { setCtl('hShape', d.shape); refresh(); ui(); return; }
    if (d.gk) { l.gk = d.gk; if (!(l.grit > 0)) l.grit = 45; refresh(); ui(); return; }
    if (d.a === 'reseed') { l.seed = (l.seed || 1) + 1; refresh(); return; }
    if (d.ink) { if (d.ink === 'one') { X.ink1 = d.v; oneInk(); } else l.c = d.v; refresh(); ui(); return; }
    if (d.a === 'center') { l.dx = 0; l.dy = 0; refresh(); return; }
    if (d.a === 'copy' && X.L.length < 4) { X.L.splice(X.sel + 1, 0, Object.assign({}, l, { dx: l.dx + 1, dy: l.dy + 1 })); X.sel++; refresh(); ui(); return; }
    if (d.a === 'up' && X.sel < X.L.length - 1) { var a = X.L.splice(X.sel, 1)[0]; X.L.splice(X.sel + 1, 0, a); X.sel++; refresh(); ui(); return; }
    if (d.a === 'del') { if (X.L.length === 1) { say('Keep at least one layer.'); return; } X.L.splice(X.sel, 1); X.sel = Math.max(0, X.sel - 1); tool = null; refresh(); ui(); return; }
    if (d.nl) { setCtl('layers', d.nl); ui(); return; }
    if (d.al != null) { S.a = +d.al; $('active').value = d.al; draw(); ui(); return; }
  }
  body.addEventListener('click', onTap); add.addEventListener('click', onTap);
  function onSlide(e) {
    var k = e.target.dataset && e.target.dataset.k; if (!k) return;
    var v = +e.target.value, out = e.target.nextElementSibling, l = X.L[X.sel];
    if (out) out.textContent = v + (k === 'op' ? '%' : k === 'ctl:wi' ? ' in' : '');
    if (k.indexOf('ctl:') === 0) { var el = $(k.slice(4)); el.value = v; fire(el, 'input'); if (e.type === 'change') fire(el, 'change'); if (!cut()) MX.render(true); later(); return; }
    if (k === 't') l.t = v; else if (k === 'grit') l.grit = v; else if (k === 'op') l.op = v; else if (k === 'lpi') X.lpi = v; else if (k === 'dotsz') X.dots = ['s', 'm', 'b', 'h'][v];
    MX.render(true); if (e.type === 'change') { later(); if (k === 'grit') ui(); else chipsUI(); }
  }
  body.addEventListener('input', onSlide); body.addEventListener('change', onSlide);
  body.addEventListener('input', function (e) { var k = e.target.dataset && e.target.dataset.inkc; if (!k) return; if (k === 'one') { X.ink1 = e.target.value; oneInk(); } else X.L[X.sel].c = e.target.value; MX.render(true); });
  body.addEventListener('change', function (e) { if (e.target.dataset && e.target.dataset.inkc) { later(); ui(); } });

  /* ---------- On a shirt: the garment shows the layers you made, not the classic view ---------- */
  var classicDesign = designCanvas;
  designCanvas = function () {
    if (cut() || !MX.isOn()) return classicDesign();
    var k = Math.min(1, 1400 / Math.max(src.width, src.height)), W = Math.round(src.width * k), Hh = Math.round(src.height * k), t = document.createElement('canvas'); t.width = W; t.height = Hh;
    var g = t.getContext('2d'); MX.compose(g, W, Hh);
    var im = g.getImageData(0, 0, W, Hh), d = im.data, dark = X.paper === '#1a1a1a';
    for (var q = 0; q < d.length; q += 4) { if (dark ? (d[q] < 6 && d[q + 1] < 6 && d[q + 2] < 6) : (d[q] > 249 && d[q + 1] > 249 && d[q + 2] > 249)) d[q + 3] = 0; }
    g.putImageData(im, 0, 0); return t;
  };
  ['vArt', 'vShirt'].forEach(function (id) { var b = $(id); if (b) b.addEventListener('click', function () { setTimeout(function () { if (MX.isOn()) MX.render(true); }, 30); }); });

  /* ---------- the picture ---------- */
  $('sdAddArt').onclick = function () { $('file').click(); };
  $('sdHelp').onclick = function () { var h = $('learnTop'); if (h) h.click(); };
  $('sdDone').onclick = function () { tool = null; ui(); };
  // the picture only moves while a layer is open. A stray touch never changes the panel or the art.
  var told = false;
  wrap.addEventListener('pointerdown', function (e) {
    if (!has || cut() || e.target !== c) return;
    if (step === 'make' && tool) return;
    e.stopPropagation();
    if (step === 'make' && !M.mock && !told) { told = true; say('Tap a layer below to move it.'); }
  }, true);
  wrap.addEventListener('pointerup', function () { if (step === 'make' && !cut() && tool) setTimeout(chipsUI, 0); });

  // a new picture goes straight to Make
  var lastN = window.__nvPicN || 0;
  setInterval(function () { var n = window.__nvPicN || 0; if (n !== lastN) { lastN = n; if (step === 'start') go('make'); else ui(); } }, 400);

  if (!has) { var sb = $('sample'); if (sb) { sb.click(); setTimeout(function () { lastN = window.__nvPicN || 0; ui(); }, 120); } }
  ui();
})();
