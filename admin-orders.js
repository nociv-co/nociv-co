// admin-orders.js  |  NOCIV.CO
// The order board for Admin, Recent Orders: filters, the "where we at" bar on every order,
// one big next-step button, links to Stripe and the customer's tracker, and the switches
// for which steps email the customer. Admin.html gives it the database and the helpers.
(function () {
  var SHIP = [['new', 'Order in'], ['processing', 'Getting it ready'], ['label_printed', 'Label made'], ['shipped', 'On the way'], ['delivered', 'Delivered']];
  var PICK = [['new', 'Order in'], ['processing', 'Getting it ready'], ['ready_pickup', 'Ready for pickup'], ['picked_up', 'Picked up']];
  var NAME = { new: 'New', processing: 'Processing', label_printed: 'Label made', shipped: 'On the way', delivered: 'Delivered', ready_pickup: 'Ready for pickup', picked_up: 'Picked up', cancelled: 'Cancelled' };
  var MAIL = { new: 'Got your order', processing: 'Your order is being packed (or made)', label_printed: 'Your shipping label is made', shipped: 'Your order is on the way, with tracking', delivered: 'Your order was delivered', ready_pickup: 'Your order is ready for pickup', picked_up: 'Thanks for picking up', cancelled: 'Your order was cancelled' };
  var ALL = ['new', 'processing', 'label_printed', 'shipped', 'delivered', 'ready_pickup', 'picked_up', 'cancelled'];
  var FILTERS = [['active', 'Active'], ['new', 'New'], ['processing', 'Processing'], ['label_printed', 'Label made'], ['shipped', 'On the way'], ['ready_pickup', 'Pickup ready'], ['done', 'Done'], ['cancelled', 'Cancelled'], ['all', 'All']];
  var N = { enabled: ALL.slice(), filter: 'active' };

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function status(o) { return o.order_status || 'new'; }
  function flow(o) { return o.shipping_method === 'pickup' ? PICK : SHIP; }
  function when(iso) { try { return new Date(iso).toLocaleString('en-US', { timeZone: 'America/Phoenix', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } }
  function since(o) { var h = Array.isArray(o.status_history) ? o.status_history : []; var last = h.length ? h[h.length - 1] : null; return last ? when(last.at) : ''; }

  function match(o, f) {
    var s = status(o);
    if (f === 'all') return true;
    if (f === 'active') return s !== 'delivered' && s !== 'picked_up' && s !== 'cancelled';
    if (f === 'done') return s === 'delivered' || s === 'picked_up';
    return s === f;
  }

  // the one big button for what to do next
  function nextStep(o) {
    var s = status(o), pickup = o.shipping_method === 'pickup';
    if (o.source === 'in_person') return null;
    if (s === 'new') return { to: 'processing', text: 'Start getting it ready' };
    if (s === 'processing') return pickup ? { to: 'ready_pickup', text: 'Ready for pickup' } : { label: true, text: 'Make shipping label' };
    if (s === 'label_printed') return { to: 'shipped', text: 'Mark shipped (with the carrier)' };
    if (s === 'shipped') return { to: 'delivered', text: 'Mark delivered' };
    if (s === 'ready_pickup') return { to: 'picked_up', text: 'Mark picked up' };
    return null;
  }

  function filterBar(orders, onPick) {
    var bar = el('<div class="ord-filters" role="tablist"></div>');
    FILTERS.forEach(function (f) {
      var n = orders.filter(function (o) { return match(o, f[0]); }).length;
      if (!n && f[0] !== 'active' && f[0] !== 'all' && f[0] !== N.filter) return;
      var b = el('<button type="button" role="tab" aria-selected="' + (N.filter === f[0]) + '">' + esc(f[1]) + ' <b>' + n + '</b></button>');
      b.onclick = function () { N.filter = f[0]; onPick(); };
      bar.appendChild(b);
    });
    return bar;
  }

  // a plain sheet to put in the box. No prices, so it works for gifts too.
  function packingSlip(o) {
    var w = window.open('', '_blank'); if (!w) { alert('Your browser blocked the packing slip. Allow pop ups for this site and try again.'); return; }
    var items = Array.isArray(o.items) && o.items.length ? o.items.map(function (i) { return '<tr><td>' + esc(i.quantity || 1) + ' x</td><td>' + esc(i.name || 'Item') + (i.size ? ' <small>(' + esc(i.size) + ')</small>' : '') + '</td></tr>'; }).join('') : '<tr><td></td><td>' + esc(o.description || 'Your order') + '</td></tr>';
    var addr = [o.ship_name, o.ship_address1, o.ship_address2, [o.ship_city, o.ship_state, o.ship_zip].filter(Boolean).join(' '), o.ship_country && o.ship_country !== 'US' ? o.ship_country : ''].filter(Boolean).map(esc).join('<br>');
    var d = new Date(o.created_at); var when = isNaN(d) ? '' : d.toLocaleDateString('en-US', { timeZone: 'America/Phoenix', year: 'numeric', month: 'long', day: 'numeric' });
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Packing slip ' + esc(o.id) + '</title><style>body{font:16px/1.4 -apple-system,Helvetica,Arial,sans-serif;color:#111;margin:0;padding:28px;max-width:640px}h1{font-size:2rem;letter-spacing:.08em;margin:0 0 2px}.sub{margin:0 0 22px;opacity:.7}h2{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;margin:22px 0 6px;border-bottom:2px solid #111;padding-bottom:4px}table{width:100%;border-collapse:collapse}td{padding:6px 0;border-bottom:1px solid #ddd;vertical-align:top}td:first-child{width:56px;font-weight:700}.thx{margin-top:28px;font-weight:700}button{font:inherit;font-weight:800;padding:12px 18px;border:2px solid #111;background:#111;color:#fff;margin-bottom:20px;cursor:pointer}@media print{button{display:none}body{padding:0}}</style></head><body><button onclick="window.print()">Print</button><h1>NOCIV.CO</h1><p class="sub">Order #' + esc(o.id) + (when ? ' &middot; ' + esc(when) : '') + '</p><h2>Ship to</h2><p>' + (addr || 'Local pickup') + '</p><h2>In this box</h2><table>' + items + '</table><p class="thx">Thank you for your order.</p></body></html>');
    w.document.close();
  }

  function card(o, ctx) {
    var s = status(o), steps = flow(o), idx = Math.max(0, steps.findIndex(function (x) { return x[0] === s; }));
    var done = s === 'delivered' || s === 'picked_up', cancelled = s === 'cancelled', inperson = o.source === 'in_person';
    var root = el('<div class="ord-t"></div>');

    var head = '<div class="ord-head"><span class="ord-pill s-' + esc(s) + '">' + esc(NAME[s] || s) + '</span>' + (inperson ? '<span class="ord-hint">Sold in person</span>' : '<span class="ord-hint">since ' + esc(since(o)) + '</span>') + '</div>';
    var bar = '';
    if (!inperson && !cancelled) {
      bar = '<div class="ord-steps">' + steps.map(function (x, i) {
        var c = i < idx || (done && i === idx) ? 'on' : (i === idx ? 'now' : '');
        return '<div class="ord-seg ' + c + '"><i></i><span>' + esc(x[1]) + '</span></div>';
      }).join('') + '</div>';
    }
    root.innerHTML = head + bar;

    var nx = nextStep(o);
    var acts = el('<div class="ord-acts"></div>');
    if (nx) {
      var b = el('<button type="button" class="ord-go">' + esc(nx.text) + '</button>');
      b.onclick = function () {
        if (nx.label) { ctx.openLabel(); return; }
        ctx.setStatus(o, nx.to);
      };
      acts.appendChild(b);
      if (nx.label) {
        var already = el('<button type="button" class="ord-sec">Label already made</button>');
        already.onclick = function () { ctx.setStatus(o, 'label_printed'); };
        acts.appendChild(already);
      }
      var will = o.customer_email && N.enabled.indexOf(nx.to || 'label_printed') >= 0;
      if (!nx.label || true) {
        var tgt = nx.to || 'label_printed';
        var on = o.customer_email && N.enabled.indexOf(tgt) >= 0;
        acts.appendChild(el('<div class="ord-mail">' + (on ? 'Next step emails ' + esc(o.customer_email) + ': "' + esc(MAIL[tgt]) + '"' : (o.customer_email ? 'Next step: no email goes out (switched off).' : 'No customer email on this order, so nobody is emailed.')) + '</div>'));
      }
    }
    root.appendChild(acts);

    if (o.email_error) root.appendChild(el('<div class="ord-err">' + esc(o.email_error) + '</div>'));

    // links and small actions
    var links = el('<div class="ord-links"></div>');
    var stripe = o.stripe_payment_intent_id ? 'https://dashboard.stripe.com/payments/' + encodeURIComponent(o.stripe_payment_intent_id)
      : (o.stripe_session_id ? 'https://dashboard.stripe.com/checkout/sessions/' + encodeURIComponent(o.stripe_session_id) : '');
    if (stripe) links.appendChild(el('<a href="' + esc(stripe) + '" target="_blank" rel="noopener">Payment in Stripe</a>'));
    // refunds: asks Stripe through the refund-order function, only you can use it
    var paidAmt = Number(o.amount_paid) || 0, refunded = Number(o.refunded_amount) || 0;
    if (refunded > 0) links.appendChild(el('<span class="ord-hint" style="font-weight:800;color:#c8412f;">Refunded $' + refunded.toFixed(2) + (refunded >= paidAmt - 0.005 ? ' (all of it)' : '') + '</span>'));
    if (o.stripe_payment_intent_id && !(refunded > 0 && refunded >= paidAmt - 0.005) && ctx.refund) {
      var rb = el('<button type="button" class="ord-danger">Refund</button>');
      rb.onclick = function () {
        var left = Math.max(0, paidAmt - refunded);
        var typed = prompt('Refund how much? Leave it blank to refund the full $' + left.toFixed(2) + '. Type an amount like 5.00 for part of it.', '');
        if (typed === null) return;
        typed = typed.trim().replace(/^\$/, '');
        var amt = typed === '' ? null : Number(typed);
        if (amt !== null && (!isFinite(amt) || amt <= 0)) { alert('That is not an amount. Type something like 5.00.'); return; }
        var shown = amt === null ? left : amt;
        if (!confirm('Refund $' + shown.toFixed(2) + ' to the customer\'s card now?' + (amt === null || shown >= left - 0.005 ? ' This also cancels the order and emails the customer. Stock is NOT put back, do that by hand.' : '') + ' This cannot be undone.')) return;
        ctx.refund(o, amt, rb);
      };
      links.appendChild(rb);
    }
    if (!inperson && o.ship_address1) {
      var ps = el('<button type="button">Packing slip</button>');
      ps.onclick = function () { packingSlip(o); };
      links.appendChild(ps);
    }
    if (!inperson && o.tracking_token) {
      var url = location.origin + '/order.html?t=' + o.tracking_token;
      links.appendChild(el('<a href="' + esc(url) + '" target="_blank" rel="noopener">What the customer sees</a>'));
      var cp = el('<button type="button">Copy their link</button>');
      cp.onclick = function () { try { navigator.clipboard.writeText(url); cp.textContent = 'Copied'; setTimeout(function () { cp.textContent = 'Copy their link'; }, 1600); } catch (e) { prompt('Copy this link', url); } };
      links.appendChild(cp);
      if (o.customer_email) {
        var tb = el('<button type="button">Send me a test email</button>');
        tb.onclick = function () { ctx.test(o, s, tb); };
        links.appendChild(tb);
      }
    }
    if (!inperson && o.status_history && o.status_history.length > 1 && !cancelled) {
      var ub = el('<button type="button">Undo last step</button>');
      ub.onclick = function () { ctx.undo(o); };
      links.appendChild(ub);
    }
    if (!inperson && !done && !cancelled) {
      var cb = el('<button type="button" class="ord-danger">Cancel order</button>');
      cb.onclick = function () {
        if (confirm('Cancel this order? The customer is emailed that it was cancelled. This does NOT refund them. Refund it in Stripe (use the Payment in Stripe link).')) ctx.setStatus(o, 'cancelled');
      };
      links.appendChild(cb);
    }
    if (!inperson) {
      var sel = el('<select aria-label="Set the step by hand"><option value="">Set step by hand...</option>' + ALL.map(function (k) { return '<option value="' + k + '">' + esc(NAME[k]) + '</option>'; }).join('') + '</select>');
      sel.onchange = function () { if (sel.value && sel.value !== s) { if (confirm('Move this order to "' + NAME[sel.value] + '"? ' + (N.enabled.indexOf(sel.value) >= 0 && o.customer_email ? 'The customer is emailed.' : ''))) ctx.setStatus(o, sel.value); else sel.value = ''; } };
      links.appendChild(sel);
    }
    root.appendChild(links);
    return root;
  }

  // which steps email the customer
  function emailPanel(host, ctx) {
    var box = el('<details class="ord-emailset"><summary>Customer emails (what gets sent, and when)</summary><div class="ord-emailbody"></div></details>');
    var body = box.querySelector('.ord-emailbody');
    body.innerHTML = '<p class="field-hint" style="margin:8px 0;">Tick the steps that email your customer when you tap them. Everyone also gets a private link to a live "where we at" page.</p><div class="ord-checks"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center;"><button type="button" class="edit-btn ord-save">Save</button><span class="ord-saved admin-note" style="display:none;margin:0;">Saved.</span></div><p class="ord-sender field-hint" style="margin-top:10px;">Checking the sender address...</p>';
    var checks = body.querySelector('.ord-checks');
    ALL.forEach(function (k) {
      checks.appendChild(el('<label class="ord-check"><input type="checkbox" value="' + k + '"> <span><b>' + esc(NAME[k]) + '</b><br><small>' + esc(MAIL[k]) + '</small></span></label>'));
    });
    function paint() { checks.querySelectorAll('input').forEach(function (c) { c.checked = N.enabled.indexOf(c.value) >= 0; }); }
    paint();
    body.querySelector('.ord-save').onclick = function () {
      var v = [].slice.call(checks.querySelectorAll('input:checked')).map(function (c) { return c.value; });
      ctx.saveEnabled(v).then(function (ok) { if (!ok) return; N.enabled = v; var s = body.querySelector('.ord-saved'); s.style.display = 'inline'; setTimeout(function () { s.style.display = 'none'; }, 2200); ctx.reload(); });
    };
    host.innerHTML = ''; host.appendChild(box);
    return { paint: paint, sender: function (ok, msg) { var p = body.querySelector('.ord-sender'); p.innerHTML = ok ? '<b style="color:var(--green);">Sender address is set.</b> Customers are being emailed from it.' : '<b style="color:var(--red);">Customers are NOT getting emails yet.</b> ' + esc(msg || 'Verify nociv.co in Resend, then add a secret named CUSTOMER_FROM with a value like NOCIV &lt;orders@nociv.co&gt; in Supabase, Edge Functions, Secrets. The "where we at" page works either way.'); } };
  }

  var css = document.createElement('style');
  css.textContent = '' +
    '.ord-filters{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;margin:0 -2px;-webkit-overflow-scrolling:touch}' +
    '.ord-filters button{flex:none;border:2px solid #111;background:#fff;padding:8px 12px;font:inherit;font-weight:800;font-size:.8rem;cursor:pointer;white-space:nowrap}' +
    '.ord-filters button b{margin-left:4px;opacity:.6}.ord-filters button[aria-selected=true]{background:#111;color:#fff}' +
    '.ord-t{margin:0 0 12px;padding:12px;border:2px solid #111;background:#f2ecd6}' +
    '.ord-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}' +
    '.ord-pill{font-weight:900;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;padding:5px 10px;background:#111;color:#fff}' +
    '.ord-pill.s-new{background:#c8412f}.ord-pill.s-processing{background:#d1a13e;color:#111}.ord-pill.s-delivered,.ord-pill.s-picked_up{background:#3c6b4a}.ord-pill.s-cancelled{background:#777}' +
    '.ord-hint{font-size:.75rem;opacity:.65}' +
    '.ord-steps{display:flex;gap:4px;margin:12px 0 4px}.ord-seg{flex:1;text-align:center;min-width:0}' +
    '.ord-seg i{display:block;height:8px;background:#d9d3c4;border-radius:4px}.ord-seg.on i{background:#111}.ord-seg.now i{background:#c8412f}' +
    '.ord-seg span{display:block;margin-top:5px;font-size:.58rem;line-height:1.2;font-weight:800;letter-spacing:.04em;text-transform:uppercase;opacity:.5}.ord-seg.on span,.ord-seg.now span{opacity:1}.ord-seg.now span{color:#c8412f}' +
    '.ord-acts{margin-top:10px;display:flex;flex-direction:column;gap:8px}' +
    '.ord-go{width:100%;padding:15px 12px;border:0;background:#c8412f;color:#fff;font:inherit;font-weight:900;letter-spacing:.06em;text-transform:uppercase;font-size:.95rem;cursor:pointer}.ord-go:active{transform:scale(.99)}' +
    '.ord-sec{align-self:flex-start;border:2px solid #111;background:#fff;padding:8px 12px;font:inherit;font-weight:700;font-size:.8rem;cursor:pointer}' +
    '.ord-mail{font-size:.78rem;opacity:.75}.ord-err{margin-top:8px;padding:8px 10px;border:2px solid #c8412f;color:#c8412f;font-weight:700;font-size:.8rem;background:#fff}' +
    '.ord-links{display:flex;flex-wrap:wrap;gap:6px 8px;margin-top:10px;align-items:center}' +
    '.ord-links a,.ord-links button{font:inherit;font-size:.75rem;font-weight:700;padding:6px 9px;border:1.5px solid #111;background:#fff;color:#111;text-decoration:none;cursor:pointer}' +
    '.ord-links .ord-danger{color:#c8412f;border-color:#c8412f}.ord-links select{font:inherit;font-size:.75rem;padding:6px;border:1.5px solid #111;background:#fff;width:auto}' +
    '.ord-emailset{margin:0 0 14px;border:2px solid #111;background:#fff}.ord-emailset summary{padding:12px;font-weight:800;cursor:pointer}.ord-emailbody{padding:0 12px 12px}' +
    '.ord-checks{display:grid;grid-template-columns:1fr 1fr;gap:8px}@media(max-width:520px){.ord-checks{grid-template-columns:1fr}}' +
    '.ord-check{display:flex;gap:8px;align-items:flex-start;padding:8px;border:1px solid #ccc;font-size:.85rem;cursor:pointer}.ord-check input{width:auto;margin-top:3px}.ord-check small{opacity:.65}';
  document.head.appendChild(css);

  window.NOrders = { state: N, match: match, filterBar: filterBar, card: card, emailPanel: emailPanel, NAME: NAME, ALL: ALL };
})();
