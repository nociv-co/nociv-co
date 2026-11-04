/* NOCIV tool help sheet. One small piece shared by the advanced tools (Case Zero, From Scratch).
   Usage: <button data-help="KEY">?</button> and window.TOOL_HELP = { KEY: { title, items: [[heading, text], ...] } }.
   Opens a bottom sheet, one topic at a time, closes with Done, the dim area, or Escape. No network, no storage. */
(function () {
  'use strict';
  var css = '.th-q{all:unset;box-sizing:border-box;width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;border:2px solid currentColor;border-radius:50%;font:900 18px/1 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent;flex:none}' +
    '.th-q:focus-visible{outline:3px solid #c8412f;outline-offset:2px}' +
    '.th-back{display:inline-flex;align-items:center;gap:6px;min-height:44px;font:800 .8rem/1 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:inherit;text-decoration:none}' +
    '.th-row{display:flex;align-items:center;justify-content:space-between;gap:10px;max-width:900px;margin:14px auto 0;padding:0 16px;box-sizing:border-box;color:#1a1a1a}' +
    '.th-dim{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;animation:thIn .18s ease}' +
    '.th-sheet{width:100%;max-width:560px;max-height:82vh;overflow-y:auto;background:#f2ecd6;color:#1a1a1a;border-top:3px solid #1a1a1a;padding:18px 18px calc(22px + env(safe-area-inset-bottom));box-sizing:border-box;font:16px/1.5 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;animation:thUp .22s ease}' +
    '.th-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}' +
    '.th-hd h2{margin:0;font-weight:900;font-size:1.25rem;letter-spacing:.04em;text-transform:uppercase}' +
    '.th-done{all:unset;min-height:44px;padding:0 16px;background:#1a1a1a;color:#f2ecd6;font-weight:900;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;display:inline-flex;align-items:center}' +
    '.th-sheet h3{margin:16px 0 4px;font-size:.95rem;font-weight:900;display:flex;gap:8px;align-items:center}' +
    '.th-sheet h3 b{background:#c8412f;color:#fff;min-width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:.75rem}' +
    '.th-sheet p{margin:0;color:#333}' +
    '@keyframes thIn{from{opacity:0}}@keyframes thUp{from{transform:translateY(30px);opacity:.4}}' +
    '@media (prefers-reduced-motion:reduce){.th-dim,.th-sheet{animation:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var last = null;
  function close() { var d = document.querySelector('.th-dim'); if (d) d.remove(); document.removeEventListener('keydown', key); if (last) last.focus(); }
  function key(e) { if (e.key === 'Escape') close(); }
  function open(k, from) {
    var h = (window.TOOL_HELP || {})[k]; if (!h) return;
    last = from || null;
    var d = document.createElement('div'); d.className = 'th-dim';
    d.innerHTML = '<div class="th-sheet" role="dialog" aria-modal="true" aria-labelledby="thT"><div class="th-hd"><h2 id="thT">' + esc(h.title) + '</h2><button type="button" class="th-done">Done</button></div>' +
      h.items.map(function (x, i) { return '<h3><b>' + (i + 1) + '</b>' + esc(x[0]) + '</h3><p>' + esc(x[1]) + '</p>'; }).join('') + '</div>';
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('.th-done')) close(); });
    document.body.appendChild(d); document.addEventListener('keydown', key);
    d.querySelector('.th-done').focus();
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-help]'); if (b) { e.preventDefault(); open(b.getAttribute('data-help'), b); } });
  window.ToolHelp = { open: open, close: close };
})();
