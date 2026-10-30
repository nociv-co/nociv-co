/* NOCIV admin: Home screen.
   One screen of big buttons. Each button opens a room. Each room shows its sections as dropdowns,
   one open at a time. Nothing is rebuilt: the existing sections are just parked until a room asks for them.
   Needs: admin.html (#dashboard, #adminHome, #adminTitle, .admin-section ids). */
(function () {
  var dash = document.getElementById('dashboard');
  var home = document.getElementById('adminHome');
  if (!dash || !home) return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  // What each room holds, in the order you see it. First section is the one you reach for most.
  var ROOMS = [
    { id: 'money', name: 'Transactions', desc: 'Orders, expenses, outside sales', sections: ['orders', 'expenses', 'crosslist'] },
    { id: 'shop', name: 'NOCIV Shop', desc: 'Products, pins, codes, shipping, zines', sections: ['products', 'pins', 'bundles', 'codes', 'shipping', 'album', 'shopgoal', 'zines', 'cheatsheet'] },
    { id: 'clients', name: 'Clients', desc: 'Design clients, hours, invoices, files', sections: ['design'], open: true },
    { id: 'messages', name: 'Messages', desc: 'What people sent you', sections: ['messages'], open: true },
    { id: 'calendar', name: 'Calendar', desc: 'Dates, to-do list, phone calendar', sections: ['goals'], open: true },
    { id: 'tracker', name: 'Tracker', desc: 'Clock in, hours, what your time earns', sections: ['time'], open: true },
    { id: 'community', name: 'Community', desc: 'Directory, vendor spots, mailing list', sections: ['directory', 'vendor', 'popup', 'mailing', 'promo'] },
    { id: 'tools', name: 'Tools and Setup', desc: 'Your tool links, Stripe, what is working', sections: ['links', 'health'], open: false }
  ];
  var byId = {}; ROOMS.forEach(function (r) { byId[r.id] = r; });
  var roomOf = {}; ROOMS.forEach(function (r) { r.sections.forEach(function (s) { roomOf['sec-' + s] = r.id; }); });
  var current = 'home';

  // ---------- styles ----------
  var st = document.createElement('style');
  st.textContent =
    '#adminJumpNav{display:none !important}' +
    '.nociv-header{max-height:60px;overflow:hidden;margin-bottom:0}' +
    '.nociv-header img{width:100%;height:60px;object-fit:cover;object-position:center 30%}' +
    '.admin-wrap{padding-top:16px !important}body[data-view="home"] .admin-wrap{padding-bottom:10px !important}body[data-view="home"] .nociv-footer{display:none}' +
    '#adminHome{display:none}' +
    'body[data-view="home"] #adminHome{display:grid;grid-template-columns:1fr;gap:8px}' +
    '@media(min-width:640px){body[data-view="home"] #adminHome{grid-template-columns:1fr 1fr}}' +
    '.ah-card{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:#fff;border:2px solid #111;border-radius:10px;padding:9px 12px;cursor:pointer;font-family:inherit;color:#111;-webkit-tap-highlight-color:transparent}' +
    '.ah-card:active{background:#f1ead8}' +
    '.ah-card .t{flex:1;min-width:0}' +
    '.ah-card b{display:block;font-size:1.02rem;line-height:1.2}' +
    '.ah-card span.d{display:block;font-size:.76rem;opacity:.6;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ah-card .go{font-size:1.4rem;opacity:.4}' +
    '.ah-bub{background:#c8281e;color:#fff;border-radius:99px;min-width:24px;height:24px;padding:0 7px;display:none;align-items:center;justify-content:center;font-size:.8rem;font-weight:800}' +
    '.ah-bub.on{display:inline-flex}' +
    '#roomBar{display:none;align-items:center;gap:10px;margin-bottom:14px}' +
    'body:not([data-view="home"]) #roomBar{display:flex}' +
    '#roomBack{border:2px solid #111;background:#fff;border-radius:8px;padding:9px 14px;font-weight:800;font-size:.9rem;cursor:pointer;font-family:inherit}' +
    '#roomTitle{font-size:1.25rem;font-weight:800;margin:0}' +
    'body[data-view="home"] .admin-header{margin-bottom:10px}body[data-view="home"] #adminTitle{font-size:1.25rem}body[data-view="home"] .help-btn,body[data-view="home"] .logout-btn{padding:6px 10px;font-size:.75rem}' +
    'body:not([data-view="home"]) .admin-header{display:none}' +
    '#roomBody{display:flex;flex-direction:column}' +
    'body[data-view="home"] #roomBody{display:none}' +
    '#roomQuick{display:none}#roomQuick.on{display:block}' +
    '.ah-health{display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid #ddd;font-size:.9rem}' +
    '.ah-dot{flex:0 0 22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.8rem}' +
    '.ah-dot.ok{background:#2f6b2f}.ah-dot.bad{background:#c8281e}.ah-dot.wait{background:#999}' +
    '.ah-health small{display:block;opacity:.6}' +
    '.ah-btn{display:block;width:100%;max-width:380px;margin:0 auto 12px;text-align:center;background:#111;color:#fff;border:0;border-radius:6px;padding:14px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;font-size:.9rem;font-family:inherit;cursor:pointer;text-decoration:none;box-sizing:border-box}' +
    '.ah-btn.alt{background:#fff;color:#111;border:2px solid #111}';
  document.head.appendChild(st);

  // ---------- structure ----------
  var bar = document.createElement('div');
  bar.id = 'roomBar';
  bar.innerHTML = '<button id="roomBack" type="button">&larr; Home</button><h2 id="roomTitle"></h2>';
  home.parentNode.insertBefore(bar, home.nextSibling);
  var quick = document.createElement('div'); quick.id = 'roomQuick';
  bar.parentNode.insertBefore(quick, bar.nextSibling);
  var body = document.createElement('div'); body.id = 'roomBody';
  quick.parentNode.insertBefore(body, quick.nextSibling);
  var parking = document.createElement('div'); parking.id = 'roomParking'; parking.style.display = 'none';
  body.parentNode.insertBefore(parking, body.nextSibling);

  // Park every existing section. They keep their ids, so every loader keeps working.
  [].slice.call(dash.querySelectorAll(':scope > .admin-section')).forEach(function (s) { parking.appendChild(s); });

  // Pull a few controls out of the Calendar section so they live where you look for them.
  var goals = $('sec-goals');
  var camroll = goals && goals.querySelector('.camroll-launch');
  var stripeBtn = goals && goals.querySelector('.stripe-launch-btn');
  var launchpad = goals && goals.querySelector('.launchpad');
  var goalsHowTo = goals && goals.querySelector('.how-to-box');
  if (goalsHowTo) goalsHowTo.remove();
  if (goals) { var sm = goals.querySelector('summary'); if (sm) sm.innerHTML = 'Calendar &amp; to-do <span class="admin-section-hint">tap a date, add a task, link your phone calendar</span>'; goals.removeAttribute('open'); }

  function makeSection(id, title, hint) {
    var d = document.createElement('details');
    d.className = 'admin-section'; d.id = 'sec-' + id;
    d.innerHTML = '<summary>' + title + ' <span class="admin-section-hint">' + hint + '</span></summary><div class="admin-section-body"></div>';
    parking.appendChild(d);
    return d.querySelector('.admin-section-body');
  }
  var linksBody = makeSection('links', 'Your tool links', 'Shippo, Printify, Lulu and the rest, one tap each');
  if (launchpad) linksBody.appendChild(launchpad);
  var healthBody = makeSection('health', 'What is working', 'checks every feature is installed');
  healthBody.innerHTML = '<div id="ahHealthList"><p class="field-hint">Open this to check.</p></div><button class="ah-btn alt" id="ahHealthBtn" type="button" style="margin-top:12px">Check again</button>' +
    '<p class="field-hint">This checks the database. It cannot check edge functions (order emails, Stripe, label buying). If something is red, it names the SQL file to run.</p>';

  // ---------- home cards ----------
  function renderHome() {
    home.innerHTML = ROOMS.map(function (r) {
      return '<button class="ah-card" type="button" data-room="' + r.id + '"><span class="t"><b>' + esc(r.name) + '</b><span class="d">' + esc(r.desc) + '</span></span><span class="ah-bub" id="bub-' + r.id + '"></span><span class="go">&rsaquo;</span></button>';
    }).join('');
    refreshBubbles();
  }
  home.addEventListener('click', function (e) { var c = e.target.closest('[data-room]'); if (c) go(c.dataset.room); });
  $('roomBack').addEventListener('click', function () { go('home'); });

  function setBubble(id, text) {
    var b = $('bub-' + id); if (!b) return;
    b.textContent = text || ''; b.classList.toggle('on', !!text);
  }
  function digits(s) { var m = String(s || '').match(/\d+/); return m ? Number(m[0]) : 0; }
  function refreshBubbles() {
    var u = digits(($('msgUnreadBadge') || {}).textContent); setBubble('messages', u ? String(u) : '');
    var d = digits(($('dirReqCount') || {}).textContent); setBubble('community', d ? String(d) : '');
    if (typeof supabaseClient === 'undefined') return;
    supabaseClient.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid').is('tracking_number', null)
      .then(function (r) { if (!r.error) setBubble('money', r.count ? String(r.count) : ''); });
    supabaseClient.from('design_time').select('id', { count: 'exact', head: true }).eq('running', true)
      .then(function (r) { if (!r.error) setBubble('clients', r.count ? 'ON' : ''); });
    supabaseClient.from('time_entries').select('id', { count: 'exact', head: true }).is('clock_out', null)
      .then(function (r) { if (!r.error) setBubble('tracker', r.count ? 'ON' : ''); });
  }
  ['msgUnreadBadge', 'dirReqCount'].forEach(function (id) {
    var el = $(id); if (el) new MutationObserver(refreshBubbles).observe(el, { childList: true, characterData: true, subtree: true });
  });
  setInterval(function () { if (current === 'home' && dash.style.display !== 'none') refreshBubbles(); }, 60000);

  // ---------- rooms ----------
  function go(id, keepHash) {
    if (id !== 'home' && !byId[id]) id = 'home';
    var from = current; current = id;
    // put the old room's sections back
    [].slice.call(body.children).forEach(function (s) { parking.appendChild(s); });
    [].slice.call(quick.children).forEach(function (n) { n.remove(); });
    document.body.setAttribute('data-view', id);
    if (id === 'home') {
      $('adminTitle').textContent = 'NOCIV Admin';
      quick.classList.remove('on');
      refreshBubbles();
    } else {
      var r = byId[id];
      $('roomTitle').textContent = r.name;
      r.sections.forEach(function (s) {
        var sec = $('sec-' + s); if (!sec) return;
        sec.open = !!r.open && r.sections.length === 1;
        body.appendChild(sec);
      });
      quick.classList.remove('on');
      if (id === 'shop' && camroll) { quick.appendChild(camroll); quick.classList.add('on'); }
      if (id === 'tools') {
        if (stripeBtn) quick.appendChild(stripeBtn);
        var hb = document.createElement('button'); hb.type = 'button'; hb.className = 'ah-btn alt'; hb.textContent = 'How this works'; hb.onclick = function () { $('helpBtn').click(); };
        quick.appendChild(hb); quick.classList.add('on');
      }
      window.scrollTo(0, 0);
      if (id === 'tools') runHealth();
      if (id === 'calendar' && typeof window.renderGoalsCalendar === 'function') { try { window.renderGoalsCalendar(); } catch (e) {} }
    }
    if (!keepHash) {
      var want = id === 'home' ? '' : '#/' + id;
      if (location.hash !== want && !(want === '' && location.hash === '')) history.pushState(null, '', location.pathname + location.search + want);
    }
  }
  // one dropdown open at a time inside a room
  document.addEventListener('toggle', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'DETAILS' || !t.classList.contains('admin-section') || !t.open || t.parentNode !== body) return;
    [].slice.call(body.children).forEach(function (s) { if (s !== t && s.open) s.open = false; });
    setTimeout(function () { t.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60);
  }, true);

  function route() {
    var h = location.hash || '';
    if (/^#\/[a-z]+$/.test(h)) { go(h.slice(2), true); return; }
    var m = h.match(/^#(sec-[a-z-]+)$/);
    if (m && roomOf[m[1]]) { go(roomOf[m[1]], true); var s = $(m[1]); if (s) { s.open = true; setTimeout(function () { s.scrollIntoView(); }, 100); } return; }
    go('home', true);
  }
  window.addEventListener('popstate', route);
  window.addEventListener('hashchange', route);

  // ---------- What is working ----------
  var PROBES = [
    ['Products and shop', 'products', 'id,name', null],
    ['Orders', 'orders', 'id,status', null],
    ['Sizes and stock', 'product_variants', 'id', null],
    ['Made to order and pre-order cap', 'products', 'made_to_order,made_to_order_limit', 'supabase-migration-made-to-order.sql'],
    ['Made to order queue on orders', 'orders', 'make_status,due_date,ready_notified_at', 'supabase-migration-made-to-order.sql'],
    ['Shipping address and labels', 'orders', 'ship_name,label_url,tracking_number', 'supabase-migration-shipping-labels.sql'],
    ['Discount and list codes', 'discount_codes', 'id', 'supabase-migration-shipping-codes.sql'],
    ['Sale price (crossed out)', 'products', 'compare_at_price', 'supabase-migration-sale-and-free-shipping.sql'],
    ['Free shipping switch', 'shipping_settings_public', 'key', 'supabase-migration-sale-and-free-shipping.sql', function (rows) { return rows.some(function (r) { return r.key === 'free_shipping_all'; }); }],
    ['Bundles (pins and patches)', 'bundle_settings_public', 'key', 'supabase-migration-bundles.sql'],
    ['1 of 1 and fancy blank stages', 'products', 'stage', 'supabase-migration-product-stage.sql'],
    ['Shop goal note', 'shop_goal_public', 'key', 'supabase-migration-shop-goal.sql'],
    ['Album posts for Art and Zines', 'album_photos', 'shop', 'supabase-migration-album-shops.sql'],
    ['Pin sheet stock log', 'pin_print_log', 'id', 'supabase-migration-pin-sheets.sql'],
    ['Zines and back covers', 'zines', 'id,back_cover_url', 'supabase-migration-made-to-order.sql'],
    ['Directory and card requests', 'directory_submissions', 'id', 'supabase-migration-directory-cards.sql'],
    ['Expenses', 'expenses', 'id', 'supabase-migration-expenses.sql'],
    ['Outside and cross-listed sales', 'external_sales', 'id', 'supabase-migration-crosslisting.sql'],
    ['Messages', 'contact_messages', 'id', 'supabase-migration-cart-contact.sql'],
    ['Mailing list', 'signups', 'id', null],
    ['Goals and calendar', 'daily_goals', 'id', null],
    ['Time tracker', 'time_entries', 'id', null],
    ['Design clients, hours and invoices', 'design_clients', 'id', 'supabase-migration-design-clients.sql']
  ];
  var healthRunning = false;
  function runHealth() {
    var list = $('ahHealthList'); if (!list || healthRunning || typeof supabaseClient === 'undefined') return;
    healthRunning = true;
    list.innerHTML = PROBES.map(function (p, i) { return '<div class="ah-health" id="ahp' + i + '"><span class="ah-dot wait">&middot;</span><span>' + esc(p[0]) + '</span></div>'; }).join('');
    var ok = 0, done = 0;
    PROBES.forEach(function (p, i) {
      supabaseClient.from(p[1]).select(p[2]).limit(50).then(function (r) {
        var good = !r.error && (!p[4] || p[4](r.data || []));
        if (good) ok++;
        var row = $('ahp' + i); if (row) row.innerHTML = '<span class="ah-dot ' + (good ? 'ok' : 'bad') + '">' + (good ? '&#10003;' : '!') + '</span><span>' + esc(p[0]) + (good ? '' : '<small>' + (p[3] ? 'Not installed. Run ' + esc(p[3]) + ' in Supabase, SQL Editor.' : 'Could not read it: ' + esc((r.error && r.error.message) || 'missing')) + '</small>') + '</span>';
        if (++done === PROBES.length) {
          healthRunning = false;
          var head = document.createElement('p'); head.style.fontWeight = '800'; head.textContent = ok + ' of ' + PROBES.length + ' ready' + (ok === PROBES.length ? '. Everything checks out.' : '.');
          list.insertBefore(head, list.firstChild);
        }
      });
    });
  }
  $('ahHealthBtn').addEventListener('click', runHealth);

  // ---------- go ----------
  renderHome();
  document.body.setAttribute('data-view', 'home');
  window.adminHome = { go: go, refresh: refreshBubbles };
  // After login the dashboard appears. Route once it does, and refresh bubbles as data arrives.
  var tries = 0;
  var wait = setInterval(function () {
    tries++;
    if (dash.style.display !== 'none') { route(); refreshBubbles(); setTimeout(refreshBubbles, 2500); clearInterval(wait); }
    if (tries > 120) clearInterval(wait);
  }, 250);
})();
