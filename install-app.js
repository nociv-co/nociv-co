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
    '#installApp{background:#808080;color:#fff;padding:20px 16px 24px;text-align:center}' +
    '#installApp .ia-in{max-width:480px;margin:0 auto}' +
    '#installApp h2{font-family:NocivAnton,Anton,Impact,sans-serif;font-weight:400;font-size:1.45rem;letter-spacing:.06em;margin:0 0 4px;text-transform:uppercase;color:#fff}' +
    '#installApp p{margin:0 0 14px;font-size:.9rem;line-height:1.4;font-weight:600;color:#fff}' +
    '#installApp .ia-row{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}' +
    '#installApp button.ia-btn{font:inherit;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:.85rem;padding:12px 20px;min-height:46px;background:#6a6a6a;color:#fff;border:2px solid #fff;border-radius:16px;box-shadow:0 5px 14px rgba(0,0,0,.38);cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '#installApp button.ia-btn:active{transform:translateY(1px);box-shadow:0 2px 7px rgba(0,0,0,.38)}' +
    '#installApp button.ia-btn:disabled{opacity:.6}' +
    '#installApp .ia-steps{display:none;text-align:left;margin:16px auto 0;max-width:340px;background:rgba(0,0,0,.2);border:2px solid #fff;border-radius:16px;box-shadow:0 5px 14px rgba(0,0,0,.25);color:#fff;padding:12px 16px;font-size:.9rem}' +
    '#installApp .ia-steps.on{display:block}' +
    '#installApp ol{margin:0;padding-left:20px;line-height:1.45}#installApp li{margin:3px 0}' +
    '#installApp .ia-steps p{margin:10px 0 0}' +
    '#installApp .ia-small{margin:12px 0 0;font-size:.78rem;font-weight:600}' +
    '#installApp .ia-msg{margin:12px 0 0;font-size:.85rem}';
  document.head.appendChild(st);

  var box = document.createElement('section');
  box.id = 'installApp'; box.setAttribute('aria-label', 'Add NOCIV to your home screen');
  box.innerHTML = '<div class="ia-in"><h2>' + (standalone ? 'Pop-up shop alerts' : 'Keep NOCIV in your pocket') + '</h2>' +
    '<p>' + (standalone ? 'Get one short alert when a pop-up shop drops. Nothing else. No account.' : 'Put it on your home screen like an app and get an alert when a pop-up shop drops. Free. No App Store, no account, no tracking.') + '</p>' +
    '<div class="ia-row">' + (standalone ? '' : '<button type="button" class="ia-btn" id="iaBtn">Add to home screen</button>') +
    '<button type="button" class="ia-btn" id="iaAlert" style="display:none">Alert me about pop-ups</button></div>' +
    '<div class="ia-steps" id="iaSteps" role="status"></div><p class="ia-msg" id="iaMsg" role="status"></p>' +
    '<p class="ia-small" id="iaSmall" style="display:none">We save only your phone\'s alert address. No name, no email.</p></div>';

  var foot = document.querySelector('footer');
  if (foot && foot.parentNode) foot.parentNode.insertBefore(box, foot); else document.body.appendChild(box);

  var steps = document.getElementById('iaSteps'), msg = document.getElementById('iaMsg'), small = document.getElementById('iaSmall');
  function show(html) { steps.innerHTML = html; steps.classList.add('on'); }
  var iaBtn = document.getElementById('iaBtn');
  if (iaBtn) iaBtn.addEventListener('click', function () {
    if (deferred) { deferred.prompt(); deferred = null; return; }
    if (ios) show('<ol><li>Tap the <b>Share</b> button (the square with an arrow) at the bottom or top of Safari.</li><li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li><li>Open NOCIV from your home screen and tap <b>Alert me about pop-ups</b>.</li></ol><p class="ia-small">Using another browser on iPhone? Open nociv.co in Safari first. Alerts need iOS 16.4 or newer.</p>');
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
    if (!canPush) { msg.textContent = 'Add NOCIV to your home screen first, then open it from there and tap this button. Alerts need iOS 16.4 or newer.'; return; }
    if (state === 'on') unsubscribe(); else subscribe();
  });
  if (!canPush) { if (ios && !standalone) ab.style.display = ''; }
  else if (Notification.permission === 'denied') draw('blocked');
  else current().then(function (sub) { draw(sub ? 'on' : 'off'); }).catch(function () { draw('off'); });
})();
