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
  function checks(orders, products, variants, carts) {
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
    if (carts && products) {
      var nowMs = Date.now(), nameOf = {}; products.forEach(function (p) { nameOf[p.id] = p.name; });
      var open2 = carts.filter(function (c) { var age = nowMs - new Date(c.created_at).getTime(); return !c.used_at && age > 45 * 60000 && age < 7 * 86400000; });
      if (open2.length) {
        var tally = {}; open2.forEach(function (c) { (Array.isArray(c.items) ? c.items : []).forEach(function (i) { var n = nameOf[i.productId] || ''; if (n) tally[n] = (tally[n] || 0) + (Number(i.quantity) || 1); }); });
        var top = Object.keys(tally).sort(function (a, b) { return tally[b] - tally[a]; });
        out.push({ n: open2.length, text: open2.length + ' checkout' + (open2.length === 1 ? '' : 's') + ' started this week and not finished', sub: (top.length ? 'Most left in the bag: ' + lines(top, 3) + '. ' : '') + 'No emails are collected, so this is for your information', to: '#sec-products', soft: true });
      }
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
    Promise.all([get('orders', '*'), get('products', '*'), get('product_variants', '*'), get('checkout_carts', '*')]).then(function (r) {
      busy = false;
      if (r[0] === null && r[1] === null) { box.style.display = ''; box.innerHTML = ''; return; } // not signed in yet or tables missing
      var list = checks(r[0] && r[0].slice(-300), r[1], r[2], r[3]); render(list);
      var shopN = list.filter(function (c) { return /Running low|no cost/.test(c.text); }).reduce(function (a, c) { return a + c.n; }, 0), b = $('bub-shop');
      if (b) { b.textContent = shopN ? String(shopN) : ''; b.classList.toggle('on', !!shopN); }
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

  // ---- Customers: who bought, who came back ----
  var parking = $('roomParking');
  if (parking && !$('sec-customers')) {
    var cs = document.createElement('details'); cs.className = 'admin-section'; cs.id = 'sec-customers';
    cs.innerHTML = '<summary>Customers <span class="admin-section-hint">who bought, who came back</span></summary><div class="admin-section-body"><input type="search" id="custFind" placeholder="Search by email" autocomplete="off" style="width:100%;box-sizing:border-box;margin-bottom:10px"><p class="field-hint" id="custSum">Open to load.</p><div id="custList"></div><button type="button" class="ny-dl" id="custCsv" style="margin-top:12px">Download customer list (CSV)</button><p class="field-hint">Built from your orders. In person sales have no email, so they are not here. Only email people who asked to hear from you.</p></div>';
    parking.appendChild(cs);
    var custRows = [];
    var loadCust = function () {
      supabaseClient.from('orders').select('*').order('created_at', { ascending: true }).limit(5000).then(function (r) {
        if (r.error) { $('custSum').textContent = 'Could not read orders: ' + r.error.message; return; }
        var by = {};
        (r.data || []).forEach(function (o) {
          var em = String(o.customer_email || '').trim().toLowerCase(); if (!em || o.order_status === 'cancelled' || o.source === 'in_person') return;
          var net = (Number(o.amount_paid) || 0) - (Number(o.refunded_amount) || 0);
          var c = by[em] || (by[em] = { email: em, n: 0, spent: 0, first: o.created_at, last: o.created_at, name: '' });
          c.n++; c.spent += net; c.last = o.created_at; if (o.ship_name) c.name = o.ship_name;
        });
        custRows = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.spent - a.spent; });
        drawCust();
      });
    };
    var drawCust = function () {
      var q = ($('custFind').value || '').trim().toLowerCase(), rows = custRows.filter(function (c) { return !q || c.email.indexOf(q) > -1 || c.name.toLowerCase().indexOf(q) > -1; });
      var rep = custRows.filter(function (c) { return c.n > 1; }).length;
      $('custSum').textContent = custRows.length ? custRows.length + ' customer' + (custRows.length === 1 ? '' : 's') + ', ' + rep + ' came back for more' + (custRows.length ? ' (' + Math.round(rep / custRows.length * 100) + '%)' : '') + '.' : 'No customers yet.';
      $('custList').innerHTML = rows.slice(0, 100).map(function (c) {
        return '<div style="border-top:1px solid #ddd;padding:8px 0"><b>' + esc(c.name || c.email) + '</b>' + (c.n > 1 ? ' <span class="ny-n soft" style="height:20px;min-width:20px;font-size:.7rem">repeat</span>' : '') + '<br><span style="font-size:.82rem;opacity:.7">' + (c.name ? esc(c.email) + '<br>' : '') + c.n + ' order' + (c.n === 1 ? '' : 's') + ' &middot; $' + c.spent.toFixed(2) + ' &middot; last ' + esc(phoenixDay(new Date(c.last))) + '</span></div>';
      }).join('') + (rows.length > 100 ? '<p class="field-hint">Showing the first 100. Search or download to see the rest.</p>' : '');
    };
    cs.addEventListener('toggle', function () { if (cs.open && typeof supabaseClient !== 'undefined') loadCust(); });
    $('custFind').addEventListener('input', drawCust);
    $('custCsv').addEventListener('click', function () {
      if (!custRows.length) return;
      download('nociv-customers.csv', '﻿' + ['Email,Name,Orders,Spent,First order,Last order'].concat(custRows.map(function (c) { return [c.email, c.name, c.n, c.spent.toFixed(2), phoenixDay(new Date(c.first)), phoenixDay(new Date(c.last))].map(cell).join(','); })).join('\r\n'));
    });
  }

  // ---- Find anything: type a word, tap where it lives ----
  var KEYS = { casezero: 'case zero domain domains subdomain request names free', reference: 'github reference reverse engineer code library study open source repo', dropalert: 'alert alerts notification notify push pop up popup drop send', orders: 'orders refund packing slip shipping label tracking email cancel customer', customers: 'customers buyers repeat emails list export', expenses: 'expenses costs receipts spending', crosslist: 'outside sales etsy vinted cross list', products: 'products inventory stock prices sizes sale items', pins: 'pins buttons print sheets circles', bundles: 'bundles sets deals', codes: 'discount codes coupons promo', shipping: 'shipping rates free shipping weights', zines: 'zines lulu pdf books print', album: 'album photos process', shopgoal: 'goal note shop', cheatsheet: 'cheat sheet help', design: 'clients design invoices hours', messages: 'messages contact inbox', goals: 'calendar to do tasks dates', time: 'clock hours tracker time', directory: 'directory community listings', vendor: 'vendor spots stalls', popup: 'pop up events', mailing: 'mailing list signups newsletter', promo: 'promo flyers', links: 'links shippo printify lulu stripe tools', health: 'what is working installed sql check' };
  var find = document.createElement('div'); find.id = 'adminFindWrap';
  find.innerHTML = '<input type="search" id="adminFind" placeholder="Find something in Admin (try refund, pins, label)" autocomplete="off"><div id="adminFindList"></div>';
  home.parentNode.insertBefore(find, home);
  var css2 = document.createElement('style');
  css2.textContent = '#adminFindWrap{display:none;margin:0 0 10px}body[data-view="home"] #adminFindWrap{display:block}#adminFind{width:100%;box-sizing:border-box;padding:11px 12px;border:2px solid #111;border-radius:10px;font:inherit;font-size:16px;background:#fff}#adminFindList button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #ddd;background:#fff;padding:11px 12px;font:inherit;font-weight:700;color:#111;cursor:pointer}#adminFindList small{display:block;font-weight:400;opacity:.6}#adminFindList{background:#fff;border-radius:0 0 10px 10px}';
  document.head.appendChild(css2);
  var roomName = function (secId) { var rs = window.nocivRooms || []; for (var i = 0; i < rs.length; i++) if (rs[i].sections.indexOf(secId) > -1) return rs[i].name; return ''; };
  $('adminFind').addEventListener('input', function () {
    var q = this.value.trim().toLowerCase(), list = $('adminFindList'); list.innerHTML = ''; if (!q) return;
    var hits = [];
    [].slice.call(document.querySelectorAll('.admin-section')).forEach(function (sec) {
      var id = sec.id.replace('sec-', ''), sm = sec.querySelector('summary'); if (!sm || !roomName(id)) return;
      var title = (sm.childNodes[0] ? sm.childNodes[0].textContent : sm.textContent).trim(), hay = (title + ' ' + (KEYS[id] || '') + ' ' + sm.textContent).toLowerCase();
      var words = q.split(/\s+/);
      if (words.every(function (w) { return hay.indexOf(w) > -1; })) hits.push({ id: id, title: title, room: roomName(id), score: words.every(function (w) { return title.toLowerCase().indexOf(w) > -1; }) ? 2 : words.every(function (w) { return (KEYS[id] || '').indexOf(w) > -1; }) ? 1 : 0 });
    });
    hits.sort(function (x, y) { return y.score - x.score; });
    list.innerHTML = hits.slice(0, 8).map(function (h) { return '<button type="button" data-id="' + esc(h.id) + '">' + esc(h.title) + '<small>' + esc(h.room) + '</small></button>'; }).join('') || '<p class="field-hint" style="padding:8px 4px">Nothing matches. Try another word.</p>';
  });
  $('adminFindList').addEventListener('click', function (e) { var b = e.target.closest('button[data-id]'); if (!b) return; $('adminFind').value = ''; $('adminFindList').innerHTML = ''; location.hash = '#sec-' + b.dataset.id; });
    window.nocivCsv = { csvOf: csvOf };
})();
