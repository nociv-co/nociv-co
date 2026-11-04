// "Add NOCIV to your home screen" + pop-up shop alerts, one block at the bottom of public pages.
// No tracking: no cookies, no storage, no analytics. The install part makes no network calls.
// The alerts part only talks to the database if a person taps the alerts button, and then it
// saves nothing but their phone's alert address (no name, no email).
(function () {
  if (document.getElementById('installApp')) return;
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var android = /Android/.test(ua);
  var canPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });

  var st = document.createElement('style');
  st.textContent =
    '#installApp{color:#1a1a1a;padding:40px 16px 4px;text-align:center}' +
    '#installApp .ia-in{max-width:420px;margin:0 auto;border-top:1px solid rgba(26,26,26,.14);padding-top:22px}' +
    '#installApp p{margin:0 0 10px;font-size:.8rem;line-height:1.45;color:#5a564d}' +
    '#installApp .ia-line{font-weight:600;color:#3d3a33}' +
    '#installApp .ia-row{display:flex;justify-content:center}' +
    '#installApp button.ia-btn{font:inherit;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:.7rem;padding:0 14px;min-height:44px;background:transparent;color:#1a1a1a;border:1.5px solid #1a1a1a;border-radius:0;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '#installApp button.ia-btn:active{transform:translateY(1px)}' +
    '#installApp button.ia-btn:disabled{opacity:.6}' +
    '#installApp .ia-steps{display:none;text-align:left;margin:12px auto 0;max-width:320px;border:1.5px solid #1a1a1a;padding:12px 14px;font-size:.82rem;color:#1a1a1a}' +
    '#installApp .ia-steps.on{display:block}' +
    '#installApp ol{margin:0;padding-left:18px;line-height:1.45}#installApp li{margin:3px 0}' +
    '#installApp .ia-steps p{margin:10px 0 0;font-size:.78rem}' +
    '#installApp .ia-small{margin:10px 0 0;font-size:.74rem}' +
    '#installApp .ia-msg{margin:8px 0 0}';
  document.head.appendChild(st);

  var box = document.createElement('section');
  box.id = 'installApp'; box.setAttribute('aria-label', 'Add NOCIV to your home screen');
  var DET = '<p>No App Store, no account, no tracking. The creator tools run offline once it is on your phone. Pop-up shop alerts live inside the app (iPhone needs iOS 16.4 or newer).</p>';
  box.innerHTML = '<div class="ia-in">' +
    '<p class="ia-line">' + (standalone ? 'Get one alert when a pop-up shop drops. Nothing else.' : 'Add NOCIV to your home screen. Free, works offline.') + '</p>' +
    '<div class="ia-row">' + (standalone ? '<button type="button" class="ia-btn" id="iaAlert" style="display:none">Alert me about pop-ups</button>' : '<button type="button" class="ia-btn" id="iaBtn">Add to home screen</button>') + '</div>' +
    '<div class="ia-steps" id="iaSteps" role="status"></div>' +
    '<p class="ia-msg" id="iaMsg" role="status"></p>' +
    '<p class="ia-small" id="iaSmall" style="display:none">We save only your phone\'s alert address. No name, no email.</p></div>';

  var foot = document.querySelector('footer');
  if (foot && foot.parentNode) foot.parentNode.insertBefore(box, foot); else document.body.appendChild(box);

  // if a full width colored band sits right above, take its color (block and footer) so there is no strip or seam
  (function () {
    function bgOf(el) { var c = getComputedStyle(el).backgroundColor; return c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c) ? c : ''; }
    var top = box.getBoundingClientRect().top, vw = document.documentElement.clientWidth, best = null, gap = 1e9;
    Array.prototype.forEach.call(document.body.querySelectorAll('*'), function (el) {
      if (el === box || box.contains(el) || /^(SCRIPT|STYLE|FOOTER|HTML|BODY)$/.test(el.tagName)) return;
      var r = el.getBoundingClientRect();
      if (r.width < vw * 0.98 || r.height < 40 || r.bottom > top + 1) return;
      var d = top - r.bottom; if (d > 120) return;
      var c = bgOf(el); if (!c) return;
      if (d < gap) { gap = d; best = c; }
    });
    if (best) { box.style.backgroundColor = best; var f = document.querySelector('footer'); if (f) f.style.backgroundColor = best; }
  })();
  var steps = document.getElementById('iaSteps'), msg = document.getElementById('iaMsg'), small = document.getElementById('iaSmall');
  function show(html) { steps.innerHTML = html + DET; steps.classList.add('on'); }
  var iaBtn = document.getElementById('iaBtn');
  if (iaBtn) iaBtn.addEventListener('click', function () {
    if (deferred) { deferred.prompt(); deferred = null; return; }
    if (ios) show('<ol><li>Tap the <b>Share</b> button (the square with an arrow) at the bottom or top of Safari.</li><li>Tap <b>More</b>.</li><li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol><p class="ia-small">Using another browser on iPhone? Open nociv.co in Safari first.</p>');
    else if (android) show('<ol><li>Tap the <b>menu</b> (three dots) in Chrome.</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li><li>Tap <b>Install</b>.</li></ol>');
    else show('<ol><li>Open <b>nociv.co</b> on your phone.</li><li>iPhone: Safari, Share, Add to Home Screen.</li><li>Android: Chrome menu, Install app.</li></ol>');
  });

  // ---- Pop-up shop alerts ----
  var SB = 'https://vscombrgcdtrfndqyugb.supabase.co', KEY = 'sb_publishable_Ys6mf0Uyop7Mq6p3k68C7A_5GA3RusI';
  var ab = document.getElementById('iaAlert');
  function rpc(name, args) {
    return fetch(SB + '/rest/v1/rpc/' + name, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) })
      .then(function (r) { if (!r.ok) throw new Error('rpc ' + r.status); return r.text(); }).then(function (t) { try { return t ? JSON.parse(t) : null; } catch (e) { return null; } });
  }
  function b64(s) { s = (s + '==='.slice((s.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/'); var raw = atob(s), a = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i); return a; }
  var state = 'off';
  function draw(s, m) {
    state = s; ab.disabled = false; ab.style.display = '';
    ab.textContent = s === 'on' ? 'Alerts on. Tap to turn off' : 'Alert me about pop-ups';
    if (s === 'blocked') { ab.style.display = 'none'; m = 'Alerts are blocked on this phone. Turn them on in Settings, Notifications, NOCIV.'; }
    small.style.display = (s === 'on' || s === 'off') && canPush ? '' : 'none';
    msg.textContent = m || (s === 'on' ? 'You will get one alert when a pop-up shop drops.' : '');
  }
  function current() { return navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }); }
  function subscribe() {
    ab.disabled = true;
    Notification.requestPermission().then(function (p) {
      if (p !== 'granted') { draw(p === 'denied' ? 'blocked' : 'off', p === 'denied' ? '' : 'No problem. You can turn alerts on later.'); return; }
      return Promise.all([navigator.serviceWorker.ready, rpc('push_public_key')]).then(function (r) {
        if (!r[1]) throw new Error('not ready');
        return r[0].pushManager.getSubscription().then(function (old) { return old ? old.unsubscribe() : true; }).then(function () {
          return r[0].pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(r[1]) });
        });
      }).then(function (sub) { var j = sub.toJSON(); return rpc('subscribe_push', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth }); })
        .then(function () { draw('on'); });
    }).catch(function () { draw('off', 'Alerts are not ready yet. Try again in a little while.'); });
  }
  function unsubscribe() {
    ab.disabled = true;
    current().then(function (sub) { if (!sub) return; var ep = sub.endpoint; return sub.unsubscribe().then(function () { return rpc('unsubscribe_push', { p_endpoint: ep }); }); })
      .then(function () { draw('off', 'Alerts are off.'); }).catch(function () { draw('off'); });
  }
  if (ab) ab.addEventListener('click', function () {
    if (!canPush) { msg.textContent = 'Alerts are not available on this phone.'; return; }
    if (state === 'on') unsubscribe(); else subscribe();
  });
  if (!ab) { /* website tab: words only, the button lives inside the installed app */ }
  else if (!canPush) { ab.style.display = 'none'; }
  else if (Notification.permission === 'denied') draw('blocked');
  else current().then(function (sub) { draw(sub ? 'on' : 'off'); }).catch(function () { draw('off'); });
})();
