/* NOCIV Stencil studio front end (Chat B, 11-10).
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
    '<div class="sd-top"><a href="/creator-tools.html" aria-label="Back to tools">&#8249;</a><b>Stencil + Halftone</b><button type="button" id="sdHelp" aria-label="Help">?</button></div>' +
    '<div class="sd-stage" id="sdStage"><div class="sd-empty" id="sdEmpty"><button type="button" id="sdAddArt">Add your art<small>JPG or PNG. Stays on your phone.</small></button></div>' +
    '<div class="sd-pills" id="sdPills"><button type="button" id="sdCrop">' + ic('crop') + 'Crop</button><button type="button" id="sdVint">' + ic('spark') + 'Vintage</button></div></div>' +
    '<div class="sd-con" id="sdCon"><button type="button" class="sd-grip" id="sdGrip" aria-label="Open or close the panel"></button><div class="sd-head"><div class="sd-title" id="sdTitle"></div></div><div class="sd-add" id="sdAdd"></div><div class="sd-body" id="sdBody"></div></div>' +
    '<div class="sd-rail" id="sdRail" role="toolbar" aria-label="Layer tools"></div>' +
    '<nav class="sd-dock" id="sdDock" aria-label="Steps"></nav>';
  document.body.appendChild(app);
  var stage = $('sdStage'), wrap = $('wrap'), body = $('sdBody'), add = $('sdAdd'), rail = $('sdRail'), con = $('sdCon');
  stage.insertBefore(wrap, stage.firstChild);
  // keep the old parts we reuse out of the hidden column
  var hold = document.createElement('div'); hold.hidden = true; app.appendChild(hold);

  var step = 'start', tool = null; // tool = open layer tool, null = nothing picked
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
    var sizes = Array.prototype.map.call(document.querySelectorAll('#sizePick button'), function (b, i) { return '<button type="button" class="sd-tile c" data-size="' + i + '" aria-pressed="' + b.getAttribute('aria-pressed') + '"><b>' + esc(b.childNodes[0].textContent) + '</b><span>' + esc(b.querySelector('small') ? b.querySelector('small').textContent : '') + '</span></button>'; }).join('');
    body.innerHTML =
      '<div class="sd-tiles"><button type="button" class="sd-tile big" data-a="art"><b>Add your art</b><span>' + (window.__nvPicN > 1 || !sampleOn() ? 'Swap in a new picture' : 'This is a sample. Put yours in') + '</span></button><button type="button" class="sd-tile" data-a="sample"><b>Sample</b><span>Try the tools on ours</span></button></div>' +
      '<p class="sd-h">What are you making?</p><div class="sd-tiles">' + JOBS.map(function (j) { return '<button type="button" class="sd-tile" data-job="' + j[0] + '" aria-pressed="' + (job() === j[0]) + '"><b>' + j[1] + '</b><span>' + j[2] + '</span></button>'; }).join('') + '</div>' +
      '<p class="sd-h">How big</p><div class="sd-tiles t4">' + sizes + '</div>';
  }

  /* ---------- MAKE: layers ---------- */
  function chipsUI() {
    if (step !== 'make' || cut()) { add.innerHTML = ''; return; }
    add.innerHTML = X.L.map(function (l, i) {
      var on = tool && X.sel === i, bg = l.c === '#ffffff' ? '#cfc9bb' : l.c;
      return '<button type="button" class="sd-chip" data-l="' + i + '" aria-pressed="' + on + '"><i style="background:' + bg + '">' + LET[i] + '</i><span>' + styleOf(l) + '<small>Layer ' + LET[i] + '</small></span></button>';
    }).join('') + (X.L.length < 4 ? '<button type="button" class="sd-chip plus" data-a="addlayer" aria-label="Add a layer">+</button>' : '');
  }
  var RAIL = { Solid: ['style', 'tone', 'color', 'layer'], Grit: ['style', 'tone', 'grit', 'color', 'layer'], Halftone: ['style', 'dots', 'grit', 'color', 'layer'] };
  var NAMES = { style: 'Style', tone: 'Light', dots: 'Dots', grit: 'Grit', color: 'Color', layer: 'Layer' };
  function railUI() {
    var on = step === 'make' && !cut() && !!tool; rail.classList.toggle('on', on);
    if (!on) return;
    var l = X.L[X.sel], list = RAIL[styleOf(l)].filter(function (k) { return !(k === 'color' && job() === 'one'); });
    rail.innerHTML = list.map(function (k) { return '<button type="button" data-t="' + k + '" aria-pressed="' + (tool === k) + '">' + ic(k === 'layer' ? 'layer' : k) + '<span>' + NAMES[k] + '</span></button>'; }).join('') + '<button type="button" class="done" data-t="done">' + ic('done') + '<span>Done</span></button>';
  }
  rail.addEventListener('click', function (e) { var b = e.target.closest('button[data-t]'); if (!b) return; if (b.dataset.t === 'done') tool = null; else tool = b.dataset.t; ui(); });
  function pick(i, t) { X.sel = i; tool = t || 'style'; ui(); }

  function slider(key, label, min, max, stepv, val, unit) { return '<div class="sd-row"><b>' + label + '</b><input type="range" data-k="' + key + '" min="' + min + '" max="' + max + '" step="' + stepv + '" value="' + val + '"><output>' + val + (unit || '') + '</output></div>'; }
  function inks(cur, key) { return '<div class="sd-inks">' + INKS.map(function (h) { return '<button type="button" data-ink="' + key + '" data-v="' + h + '" style="background:' + h + '" aria-label="Ink ' + h + '" aria-pressed="' + (h === cur) + '"></button>'; }).join('') + '<label aria-label="Any color"><input type="color" data-inkc="' + key + '" value="' + cur + '"></label></div>'; }
  var MESH = [[110, 25, 'Bold'], [156, 35, 'Shirts'], [230, 50, 'Fine'], [305, 65, 'Very fine']];
  function makeUI() {
    if (cut()) { cutUI(); return; }
    if (!tool) { // nothing picked: the whole project
      var paper = X.paper || '#ffffff';
      body.innerHTML =
        '<div class="sd-tiles"><button type="button" class="sd-tile red" data-a="vintage"><b>Vintage</b><span>Your gritty one ink stack. Tap again for a new one</span></button><button type="button" class="sd-tile" data-a="clean"><b>Clean</b><span>One solid layer</span></button></div>' +
        '<p class="sd-h">Looks</p><div class="sd-tiles t3">' +
          [['shadow', 'Red shadow'], ['misprint', 'Misprint'], ['ghost', 'Ghost'], ['pop', 'Pop dots'], ['double', 'Double'], ['comic', 'Comic']].map(function (k) { return '<button type="button" class="sd-tile c" data-look="' + k[0] + '"><b>' + k[1] + '</b></button>'; }).join('') + '</div>' +
        (job() === 'one' ? '<p class="sd-h">Your one ink</p>' + inks(X.ink1 || '#1a1a1a', 'one') : '') +
        '<p class="sd-h">Paper</p><div class="sd-tiles t3">' + [['#ffffff', 'White'], ['#f3ead7', 'Cream'], ['#1a1a1a', 'Black']].map(function (p) { return '<button type="button" class="sd-tile c" data-paper="' + p[0] + '" aria-pressed="' + (paper === p[0]) + '"><b>' + p[1] + '</b></button>'; }).join('') + '</div>' +
        '<p class="sd-note">Tap a layer above to change it. Drag the picture to move the picked layer.</p>';
      return;
    }
    var l = X.L[X.sel], h = '';
    if (tool === 'style') {
      h = '<div class="sd-tiles t3">' + [['Solid', 'Clean shapes'], ['Halftone', 'Dots for shading'], ['Grit', 'Worn and rough']].map(function (s) { return '<button type="button" class="sd-tile" data-style="' + s[0] + '" aria-pressed="' + (styleOf(l) === s[0]) + '"><b>' + s[0] + '</b><span>' + s[1] + '</span></button>'; }).join('') + '</div>';
    } else if (tool === 'tone') {
      h = slider('t', 'Light to dark', 10, 245, 1, l.t) + '<p class="sd-note">Higher keeps more of the picture as ink.</p>';
    } else if (tool === 'dots') {
      var sh = $('hShape');
      h = '<p class="sd-h">What mesh do you have?</p><div class="sd-tiles t4">' + MESH.map(function (m) { return '<button type="button" class="sd-tile c" data-mesh="' + m[1] + '" aria-pressed="' + (X.lpi === m[1]) + '"><b>' + m[0] + '</b><span>' + m[2] + '</span></button>'; }).join('') + '</div>' +
        '<button type="button" class="sd-tile c" data-mesh="0" aria-pressed="' + (!X.lpi) + '" style="margin-top:7px;width:100%"><b>Not sure</b><span>Medium dots that work on most screens</span></button>' +
        '<p class="sd-h">Dot style</p><div class="sd-tiles t3">' + Array.prototype.map.call(sh.options, function (o) { return '<button type="button" class="sd-tile c" data-shape="' + o.value + '" aria-pressed="' + (sh.value === o.value) + '"><b>' + esc(o.textContent.replace(/\s*\(.*\)/, '')) + '</b></button>'; }).join('') + '</div>' +
        '<details class="sd-fold" id="sdFine"' + (fineOpen ? ' open' : '') + '><summary>Fine tune</summary>' +
          (X.lpi ? slider('lpi', 'Lines per inch', 10, 85, 1, X.lpi) : slider('dotsz', 'Dot size', 0, 3, 1, ['s', 'm', 'b', 'h'].indexOf(X.dots || 'm'))) +
          [['hBri', 'Brightness'], ['hCon', 'Contrast'], ['hAng', 'Angle'], ['hMin', 'Smallest dot'], ['hMax', 'Largest dot']].map(function (r) { var el = $(r[0]); return el ? slider('ctl:' + r[0], r[1], el.min, el.max, el.step || 1, el.value) : ''; }).join('') +
          '<p class="sd-note">Dot style and fine tune apply to every halftone layer.</p></details>';
    } else if (tool === 'grit') {
      h = '<div class="sd-tiles t4">' + [['speck', 'Speckle'], ['crack', 'Cracked'], ['wear', 'Worn'], ['copy', 'Photocopy']].map(function (g) { return '<button type="button" class="sd-tile c" data-gk="' + g[0] + '" aria-pressed="' + (l.grit > 0 && l.gk === g[0]) + '"><b>' + g[1] + '</b></button>'; }).join('') + '</div>' +
        slider('grit', 'Amount', 0, 100, 1, l.grit) + '<button type="button" class="sd-btn" data-a="reseed">Shuffle the grit</button>';
    } else if (tool === 'color') {
      h = inks(l.c, 'layer');
    } else if (tool === 'layer') {
      h = slider('op', 'See-through', 20, 100, 5, l.op, '%') +
        '<div class="sd-tiles t4" style="margin-top:6px"><button type="button" class="sd-tile c" data-a="center"><b>Line up</b></button><button type="button" class="sd-tile c" data-a="copy"><b>Copy</b></button><button type="button" class="sd-tile c" data-a="up"><b>Up</b></button><button type="button" class="sd-tile c" data-a="del"><b>Delete</b></button></div>' +
        '<p class="sd-note">Drag the picture to nudge this layer off register.</p>';
    }
    body.innerHTML = h;
  }
  var fineOpen = false; try { fineOpen = localStorage.getItem('nocivStFine') === '1'; } catch (_) {}
  body.addEventListener('toggle', function (e) { if (e.target.id === 'sdFine') { fineOpen = e.target.open; try { localStorage.setItem('nocivStFine', fineOpen ? '1' : '0'); } catch (_) {} } }, true);

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
  function ui() {
    if (step !== 'make' || !cut()) putBack();
    if (has) engine();
    fixLayers(); dockUI();
    var t = step === 'start' ? 'Start' : step === 'save' ? 'Save <small>' + (JOBS.filter(function (j) { return j[0] === job(); })[0] || ['', ''])[1] + '</small>' : cut() ? 'Make <small>Cut stencil</small>' : tool ? 'Layer ' + LET[X.sel] + ' <small>' + (NAMES[tool] || '') + '</small>' : 'Make <small>' + X.L.length + (X.L.length === 1 ? ' layer' : ' layers') + '</small>';
    $('sdTitle').innerHTML = t;
    chipsUI(); railUI();
    if (step === 'start') startUI(); else if (step === 'make') makeUI(); else saveUI();
    $('sdEmpty').hidden = !!has;
    $('sdPills').hidden = !has || step !== 'make';
    $('sdVint').hidden = cut();
  }
  window.__nvStudioRefresh = function () { setTimeout(ui, 20); };

  /* ---------- looks ---------- */
  function look(k) {
    var ink = X.ink1 || '#1a1a1a', t = S.t;
    var red = job() === 'one' ? ink : '#e2342a';
    var L = {
      clean: [lay({})],
      shadow: [lay({ c: ink }), lay({ src: 'ht', c: red, dx: 2.5, dy: 2 })],
      misprint: [lay({ c: red, dx: -1.5, dy: 1 }), lay({ src: 'ht', c: job() === 'one' ? ink : '#1d4ed8', dx: 1, dy: -.5 })],
      ghost: [lay({ c: ink }), lay({ c: red, dx: 4, dy: -3, op: 45 })],
      pop: [lay({ src: 'ht', c: red }), lay({ c: ink, t: t - 40 })],
      double: [lay({ src: 'ht', c: ink }), lay({ src: 'ht', c: ink, dx: 1.6, dy: 1.2, op: 70 })],
      comic: [lay({ src: 'ht', c: red }), lay({ c: ink, t: t - 50, grit: 15, gk: 'copy' })]
    }[k];
    if (!L) return; X.L = L; X.sel = 0; X.look = -1; tool = null; oneInk(); refresh(); ui();
  }
  var vSeed = 1;
  function vintage() { // her move: one ink, a few cutoffs stacked slightly off, the ink eaten by texture
    var ink = job() === 'one' ? (X.ink1 || '#1a1a1a') : (X.L[0] && X.L[0].c) || '#1a1a1a', t = S.t;
    vSeed += 3; var j = function (n) { return ((vSeed * 7 + n * 13) % 9 - 4) / 10; };
    X.L = [
      lay({ c: ink, t: Math.max(20, t - 40), grit: 22, gk: 'crack', seed: vSeed }),
      lay({ c: ink, t: t, grit: 55, gk: 'wear', seed: vSeed + 1, dx: .3 + j(1), dy: .2 + j(2) }),
      lay({ c: ink, t: Math.min(240, t + 45), grit: 80, gk: 'speck', seed: vSeed + 2, dx: -.25 + j(3), dy: .3 + j(4) })
    ];
    X.sel = 0; X.look = -1; tool = null; refresh(); ui(); say('Vintage. Tap Vintage again for a new one.');
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
    if (d.a === 'vintage') { vintage(); return; }
    if (d.look) { look(d.look); return; }
    if (d.a === 'clean') { look('clean'); return; }
    if (d.paper) { X.paper = d.paper; refresh(); ui(); return; }
    if (d.style) { if (d.style === 'Halftone') { l.src = 'ht'; l.grit = l.gk === 'copy' ? l.grit : 0; } else { l.src = 'st'; l.grit = d.style === 'Grit' ? (l.grit || 45) : 0; } refresh(); tool = d.style === 'Halftone' ? 'dots' : d.style === 'Grit' ? 'grit' : 'tone'; ui(); return; }
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
    MX.render(true); if (e.type === 'change') { later(); if (k === 'grit') railUI(); chipsUI(); }
  }
  body.addEventListener('input', onSlide); body.addEventListener('change', onSlide);
  body.addEventListener('input', function (e) { var k = e.target.dataset && e.target.dataset.inkc; if (!k) return; if (k === 'one') { X.ink1 = e.target.value; oneInk(); } else X.L[X.sel].c = e.target.value; MX.render(true); });
  body.addEventListener('change', function (e) { if (e.target.dataset && e.target.dataset.inkc) { later(); ui(); } });

  /* ---------- the picture ---------- */
  $('sdAddArt').onclick = function () { $('file').click(); };
  $('sdCrop').onclick = function () { $('fCrop').click(); };
  $('sdVint').onclick = vintage;
  $('sdHelp').onclick = function () { var h = $('learnTop'); if (h) h.click(); };
  // touching the picture in Make picks the layer you are working on, and drags it
  wrap.addEventListener('pointerdown', function (e) {
    if (step !== 'make' || cut() || !has || e.target.closest('button,.nv-fl,.viewt,.nv-mag,.nv-zbar')) return;
    if (!tool) { tool = 'style'; setTimeout(ui, 0); }
  }, true);
  wrap.addEventListener('pointerup', function () { if (step === 'make' && !cut()) setTimeout(chipsUI, 0); });

  // a new picture goes straight to Make
  var lastN = window.__nvPicN || 0;
  setInterval(function () { var n = window.__nvPicN || 0; if (n !== lastN) { lastN = n; if (step === 'start') go('make'); else ui(); } }, 400);

  if (!has) { var sb = $('sample'); if (sb) { sb.click(); setTimeout(function () { lastN = window.__nvPicN || 0; ui(); }, 120); } }
  ui();
})();
