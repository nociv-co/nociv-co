// "Add NOCIV to your home screen" block at the bottom of public pages.
// No tracking: no cookies, no storage, no analytics. The install part makes no network calls.
// The alerts part only talks to the database if a person taps the opt in button, and then it
// saves nothing but their phone's alert address (no name, no email).
(function () {
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  if (document.getElementById('installApp')) return;
  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var android = /Android/.test(ua);
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });

  var st = document.createElement('style');
  st.textContent =
    '#installApp{background:#808080;color:#fff;padding:20px 16px 22px;text-align:center}' +
    '#installApp .ia-in{max-width:480px;margin:0 auto}' +
    '#installApp h2{font-family:NocivAnton,Anton,Impact,sans-serif;font-weight:400;font-size:1.45rem;letter-spacing:.06em;margin:0 0 4px;text-transform:uppercase;color:#fff}' +
    '#installApp p{margin:0 0 12px;font-size:.9rem;line-height:1.4;font-weight:600;color:#fff}' +
    '#installApp button.ia-btn{font:inherit;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:.9rem;padding:12px 20px;min-height:44px;background:#fff;color:#111;border:2px solid #111;border-radius:0;cursor:pointer}' +
    '#installApp button.ia-btn:disabled{opacity:.6}' +
    '#installApp .ia-steps{display:none;text-align:left;margin:14px auto 0;max-width:340px;background:#fff;color:#111;padding:12px 14px;font-size:.9rem}' +
    '#installApp .ia-steps.on{display:block}' +
    '#installApp ol{margin:0;padding-left:20px;line-height:1.45}#installApp li{margin:3px 0}' +
    '#installApp .ia-steps p{margin:10px 0 0;color:#111}' +
    '#installApp .ia-small{margin:10px 0 0;font-size:.78rem;font-weight:600}' +
    '#installApp .ia-alerts{margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.5)}#installApp .ia-alerts h3{font-family:NocivAnton,Anton,Impact,sans-serif;font-weight:400;font-size:1.15rem;letter-spacing:.06em;margin:0 0 4px;text-transform:uppercase;color:#fff}' +
    '#installApp .ia-btn.ghost{background:#fff;border-color:#111}#installApp .ia-msg{margin:10px 0 0;font-size:.85rem}';
  document.head.appendChild(st);

  var box = document.createElement('section');
  box.id = 'installApp'; box.setAttribute('aria-label', 'Add NOCIV to your home screen');
  box.innerHTML = '<div class="ia-in">' + (standalone ? '' :
    '<h2>Keep NOCIV in your pocket</h2>' +
    '<p>Put it on your home screen like an app. Free. No App Store, no account, no tracking.</p>' +
    '<button type="button" class="ia-btn" id="iaBtn">Add to home screen</button>' +
    '<div class="ia-steps" id="iaSteps" role="status"></div>') +
    '<div class="ia-alerts" id="iaAlerts" style="' + (standalone ? 'margin:0;padding:0;border:0' : '') + '"></div></div>';

  var foot = document.querySelector('footer');
  if (foot && foot.parentNode) foot.parentNode.insertBefore(box, foot); else document.body.appendChild(box);

  var steps = document.getElementById('iaSteps');
  function show(html) { steps.innerHTML = html; steps.classList.add('on'); }
  var iaBtn = document.getElementById('iaBtn');
  if (iaBtn) iaBtn.addEventListener('click', function () {
    if (deferred) { deferred.prompt(); deferred = null; return; }
    if (ios) show('<ol><li>Tap the <b>Share</b> button (the square with an arrow) at the bottom or top of Safari.</li><li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol><p class="ia-small">Using another browser on iPhone? Open nociv.co in Safari first.</p>');
    else if (android) show('<ol><li>Tap the <b>menu</b> (three dots) in Chrome.</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li><li>Tap <b>Install</b>.</li></ol>');
    else show('<ol><li>Open <b>nociv.co</b> on your phone.</li><li>iPhone: Safari, Share, Add to Home Screen.</li><li>Android: Chrome menu, Install app.</li></ol>');
  });

  // ---- Pop-up shop alerts (opt in from the installed app) ----
  var SB = 'https://vscombrgcdtrfndqyugb.supabase.co', KEY = 'sb_publishable_Ys6mf0Uyop7Mq6p3k68C7A_5GA3RusI';
  var al = document.getElementById('iaAlerts');
  var canPush = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  function rpc(name, args) {
    return fetch(SB + '/rest/v1/rpc/' + name, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) })
      .then(function (r) { if (!r.ok) throw new Error('rpc ' + r.status); return r.text(); }).then(function (t) { try { return t ? JSON.parse(t) : null; } catch (e) { return null; } });
  }
  function b64(s) { s = (s + '==='.slice((s.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/'); var raw = atob(s), a = new Uint8Array(raw.length); for (var i = 0; i < raw.length; i++) a[i] = raw.charCodeAt(i); return a; }
  function draw(state, msg) {
    var head = '<h3>Pop-up shop alerts</h3>';
    if (state === 'need-install') al.innerHTML = head + '<p>Add NOCIV to your home screen first, then open it from there and tap the alerts button that shows up here. Needs iOS 16.4 or newer.</p>';
    else if (state === 'on') al.innerHTML = head + '<p>Alerts are on. You will get one when a pop-up shop drops.</p><button type="button" class="ia-btn ghost" id="iaOff">Turn alerts off</button><p class="ia-small">We save only your phone\'s alert address. No name, no email.</p>';
    else if (state === 'blocked') al.innerHTML = head + '<p>Alerts are blocked on this phone. Turn them on in Settings, Notifications, NOCIV.</p>';
    else al.innerHTML = head + '<p>Get one short alert when a pop-up shop drops. Nothing else. No account. Turn it off any time.</p><button type="button" class="ia-btn" id="iaOn">Alert me</button><p class="ia-small">We save only your phone\'s alert address. No name, no email.</p>';
    if (msg) { var m = document.createElement('p'); m.className = 'ia-msg'; m.textContent = msg; al.appendChild(m); }
    var on = document.getElementById('iaOn'), off = document.getElementById('iaOff');
    if (on) on.addEventListener('click', subscribe);
    if (off) off.addEventListener('click', unsubscribe);
  }
  function current() { return navigator.serviceWorker.ready.then(function (reg) { return reg.pushManager.getSubscription(); }); }
  function subscribe() {
    var b = document.getElementById('iaOn'); if (b) b.disabled = true;
    Notification.requestPermission().then(function (p) {
      if (p !== 'granted') { draw(p === 'denied' ? 'blocked' : 'off', p === 'denied' ? '' : 'No problem. You can turn alerts on later.'); return; }
      return Promise.all([navigator.serviceWorker.ready, rpc('push_public_key')]).then(function (r) {
        if (!r[1]) throw new Error('not ready');
        return r[0].pushManager.getSubscription().then(function (old) { return old ? old.unsubscribe() : true; }).then(function () {
          return r[0].pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(r[1]) });
        });
      }).then(function (sub) {
        var j = sub.toJSON();
        return rpc('subscribe_push', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
      }).then(function () { draw('on'); });
    }).catch(function () { draw('off', 'Alerts are not ready yet. Try again in a little while.'); });
  }
  function unsubscribe() {
    current().then(function (sub) { if (!sub) return; var ep = sub.endpoint; return sub.unsubscribe().then(function () { return rpc('unsubscribe_push', { p_endpoint: ep }); }); })
      .then(function () { draw('off'); }).catch(function () { draw('off'); });
  }
  if (!canPush) {
    if (ios && !standalone) draw('need-install'); else al.style.display = 'none';
  } else if (Notification.permission === 'denied') draw('blocked');
  else current().then(function (sub) { draw(sub ? 'on' : 'off'); }).catch(function () { draw('off'); });
})();
