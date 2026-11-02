/* NOCIV admin: "Needs you" list on the Admin home, plus tax-time CSV downloads in Transactions.
   Read only. It never changes anything. Each line is one tap to the place that fixes it.
   Needs: admin.html (#adminHome, #roomQuick, #dashboard) and admin-home.js loaded first. */
(function () {
  var home = document.getElementById('adminHome');
  if (!home) return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var LOW_STOCK = 3;          // pieces left that count as low
  var DUE_SOON_DAYS = 3;      // made to order jobs due within this many days
  var OPEN = ['new', 'processing', 'label_printed'];

  var css = document.createElement('style');
  css.textContent =
    '#needsYou{display:none;border:2px solid #111;border-radius:10px;background:#fff;padding:10px 12px;margin:0 0 10px}' +
    'body[data-view="home"] #needsYou{display:block}' +
    '#needsYou h3{margin:0 0 6px;font-size:.78rem;letter-spacing:.1em;text-transform:uppercase}' +
    '.ny-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:0;border-top:1px solid #ddd;padding:9px 0;font:inherit;color:#111;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.ny-row:first-of-type{border-top:0}' +
    '.ny-row:active{background:#f1ead8}' +
    '.ny-n{flex:0 0 auto;min-width:26px;height:26px;padding:0 7px;border-radius:99px;background:#c8281e;color:#fff;font-weight:800;font-size:.82rem;display:inline-flex;align-items:center;justify-content:center}' +
    '.ny-n.soft{background:#111}' +
    '.ny-t{flex:1;min-width:0;font-weight:700;font-size:.94rem;line-height:1.25}' +
    '.ny-t small{display:block;font-weight:400;opacity:.65;font-size:.78rem;margin-top:1px}' +
    '.ny-go{opacity:.4;font-size:1.3rem}' +
    '.ny-clear{margin:0;font-size:.92rem}' +
    '.ny-dl{display:block;width:100%;max-width:380px;margin:0 auto 10px;padding:13px;border:2px solid #111;background:#fff;color:#111;font:inherit;font-weight:900;letter-spacing:.05em;text-transform:uppercase;font-size:.85rem;cursor:pointer;border-radius:6px;box-sizing:border-box}' +
    '.ny-dl:active{background:#f1ead8}';
  document.head.appendChild(css);

  var box = document.createElement('div'); box.id = 'needsYou';
  home.parentNode.insertBefore(box, home);

  function phoenixDay(d) { return d.toLocaleDateString('en-CA', { timeZone: 'America/Phoenix' }); }
  function lines(names, max) { names = names.filter(Boolean); return names.slice(0, max).join(', ') + (names.length > max ? ' and ' + (names.length - max) + ' more' : ''); }
  function get(table, cols) {
    if (typeof supabaseClient === 'undefined') return Promise.resolve([]);
    return supabaseClient.from(table).select(cols).limit(1000).then(function (r) { return r.error ? null : (r.data || []); }, function () { return null; });
  }

  // Each check returns null (nothing to show) or { n, text, sub, to, soft }.
  function checks(orders, products, variants) {
    var out = [];
    if (orders) {
      var hasStatus = orders.some(function (o) { return o.order_status != null; });
      var open = orders.filter(function (o) { return hasStatus ? OPEN.indexOf(o.order_status) > -1 : (o.source === 'online' && !o.label_url && !o.tracking_number); });
      if (open.length) out.push({ n: open.length, text: open.length === 1 ? '1 order is waiting on you' : open.length + ' orders are waiting on you', sub: hasStatus ? 'Open Recent Orders and tap the red button' : 'No label made yet', to: '#sec-orders' });
      var failed = orders.filter(function (o) { return o.printify_status === 'failed'; });
      if (failed.length) out.push({ n: failed.length, text: failed.length === 1 ? 'A Printify order did not go through' : failed.length + ' Printify orders did not go through', sub: 'The customer paid. Open the order to see why', to: '#sec-orders' });
      var today = phoenixDay(new Date()), soon = phoenixDay(new Date(Date.now() + DUE_SOON_DAYS * 86400000));
      var mto = orders.filter(function (o) { return o.made_to_order && o.due_date && ['queued', 'making'].indexOf(o.make_status) > -1 && String(o.due_date).slice(0, 10) <= soon; });
      var late = mto.filter(function (o) { return String(o.due_date).slice(0, 10) < today; });
      if (mto.length) out.push({ n: mto.length, text: late.length ? late.length + ' made to order job' + (late.length === 1 ? ' is' : 's are') + ' late' : mto.length + ' made to order job' + (mto.length === 1 ? ' is' : 's are') + ' due soon', sub: 'Due within ' + DUE_SOON_DAYS + ' days', to: '#sec-orders' });
    }
    if (products) {
      var live = products.filter(function (p) { return p.status === 'for_sale'; });
      var byProduct = {}; (variants || []).forEach(function (v) { (byProduct[v.product_id] = byProduct[v.product_id] || []).push(v); });
      var low = [];
      live.forEach(function (p) {
        if (p.made_to_order || (p.fulfillment_type && p.fulfillment_type !== 'in_house')) return; // only your own stock
        var vs = byProduct[p.id];
        if (vs && vs.length) { vs.forEach(function (v) { if (Number(v.inventory_count) <= LOW_STOCK) low.push(p.name + ' (' + v.size + ': ' + (Number(v.inventory_count) || 0) + ' left)'); }); }
        else if (p.inventory_count != null && Number(p.inventory_count) <= LOW_STOCK) low.push(p.name + ' (' + (Number(p.inventory_count) || 0) + ' left)');
      });
      if (low.length) out.push({ n: low.length, text: low.length === 1 ? 'Running low on 1 item' : 'Running low on ' + low.length + ' items', sub: lines(low, 3), to: '#sec-products' });
      var nocost = live.filter(function (p) { return p.cost == null || p.cost === ''; });
      if (nocost.length) out.push({ n: nocost.length, text: nocost.length + ' for sale item' + (nocost.length === 1 ? ' has' : 's have') + ' no cost filled in', sub: 'Profit cannot be worked out. ' + lines(nocost.map(function (p) { return p.name; }), 3), to: '#sec-products', soft: true });
    }
    return out;
  }

  function render(list) {
    if (!list.length) { box.innerHTML = '<h3>Needs you</h3><p class="ny-clear">All clear. Nothing is waiting on you.</p>'; return; }
    box.innerHTML = '<h3>Needs you</h3>' + list.map(function (c, i) {
      return '<button type="button" class="ny-row" data-i="' + i + '"><span class="ny-n' + (c.soft ? ' soft' : '') + '">' + c.n + '</span><span class="ny-t">' + esc(c.text) + (c.sub ? '<small>' + esc(c.sub) + '</small>' : '') + '</span><span class="ny-go">&rsaquo;</span></button>';
    }).join('');
    box._list = list;
  }
  box.addEventListener('click', function (e) {
    var r = e.target.closest('.ny-row'); if (!r || !box._list) return;
    var c = box._list[+r.dataset.i]; if (c && c.to) location.hash = c.to;
  });

  var busy = false;
  function refresh() {
    if (busy || typeof supabaseClient === 'undefined') return; busy = true;
    Promise.all([get('orders', '*'), get('products', '*'), get('product_variants', '*')]).then(function (r) {
      busy = false;
      if (r[0] === null && r[1] === null) { box.style.display = ''; box.innerHTML = ''; return; } // not signed in yet or tables missing
      render(checks(r[0] && r[0].slice(-300), r[1], r[2]));
    }, function () { busy = false; });
  }
  window.nocivNeedsYou = refresh;

  // ---- tax time: orders as a spreadsheet file ----
  function cell(v) {
    if (v == null) return '';
    var s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // customer typed text must never run as a spreadsheet formula
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function money(v) { return v == null || v === '' || isNaN(Number(v)) ? '' : Number(v).toFixed(2); }
  function csvOf(rows) {
    var head = ['Date', 'Order number', 'Where', 'Step', 'Customer email', 'What', 'Paid', 'Shipping paid', 'Code', 'Code took off', 'Your cost', 'Profit', 'Carrier', 'Tracking number'];
    var lines = [head.join(',')];
    rows.forEach(function (o) {
      var profit = o.cost != null && o.cost !== '' && o.amount_paid != null ? Number(o.amount_paid) - Number(o.cost) : '';
      lines.push([phoenixDay(new Date(o.created_at)), o.id, o.source || '', o.order_status || o.status || '', o.customer_email || '', o.description || '', money(o.amount_paid), money(o.shipping_paid), o.discount_code || '', money(o.discount_amount), money(o.cost), money(profit), o.carrier || '', o.tracking_number || ''].map(cell).join(','));
    });
    return '﻿' + lines.join('\r\n'); // BOM so Excel and Numbers read it right
  }
  function download(name, text) {
    var url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function exportOrders(year, msgEl) {
    msgEl.textContent = 'Getting your orders...';
    supabaseClient.from('orders').select('*').order('created_at', { ascending: true }).limit(5000).then(function (r) {
      if (r.error) { msgEl.textContent = 'Could not read orders: ' + r.error.message; return; }
      var rows = (r.data || []).filter(function (o) { return !year || phoenixDay(new Date(o.created_at)).slice(0, 4) === String(year); });
      if (!rows.length) { msgEl.textContent = 'No orders found' + (year ? ' for ' + year : '') + '.'; return; }
      download('nociv-orders-' + (year || 'all') + '.csv', csvOf(rows));
      msgEl.textContent = rows.length + ' order' + (rows.length === 1 ? '' : 's') + ' saved. Check your Downloads or Files.';
    });
  }
  function addExport() {
    var quick = $('roomQuick'); if (!quick || quick.querySelector('.ny-dl')) return;
    var y = new Date().getFullYear(), wrap = document.createElement('div');
    wrap.innerHTML = '<button type="button" class="ny-dl" data-y="' + y + '">Download ' + y + ' orders (CSV)</button><button type="button" class="ny-dl" data-y="' + (y - 1) + '">Download ' + (y - 1) + ' orders (CSV)</button><button type="button" class="ny-dl" data-y="">Download every order (CSV)</button><p class="field-hint" id="nyDlMsg" role="status" style="text-align:center">A spreadsheet for taxes: date, what, paid, your cost and profit. Opens in Numbers, Excel or Sheets.</p>';
    wrap.addEventListener('click', function (e) { var b = e.target.closest('.ny-dl'); if (b) exportOrders(b.dataset.y, $('nyDlMsg')); });
    quick.appendChild(wrap); quick.classList.add('on');
  }

  // when the Transactions room opens, add the downloads; when Home shows, refresh the list
  new MutationObserver(function () {
    var v = document.body.getAttribute('data-view');
    if (v === 'money') addExport();
    if (v === 'home') refresh();
  }).observe(document.body, { attributes: true, attributeFilter: ['data-view'] });
  setInterval(function () { if (document.body.getAttribute('data-view') === 'home') refresh(); }, 90000);
  if (document.body.getAttribute('data-view') === 'home') setTimeout(refresh, 1200);
  var tries = 0, t = setInterval(function () { if (typeof supabaseClient !== 'undefined' || ++tries > 20) { clearInterval(t); if (document.body.getAttribute('data-view') === 'home') refresh(); } }, 700);
  window.nocivCsv = { csvOf: csvOf };
})();
