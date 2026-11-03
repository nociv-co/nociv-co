// "Add NOCIV to your home screen" block at the bottom of public pages.
// No tracking: no cookies, no storage, no analytics, no network calls. It only shows
// the button and the steps. Hidden when the site is already open as an installed app.
(function () {
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  if (standalone || document.getElementById('installApp')) return;
  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var android = /Android/.test(ua);
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; });

  var st = document.createElement('style');
  st.textContent =
    '#installApp{background:#111;color:#f2ecd6;border-top:4px solid #c8412f;padding:26px 16px 28px;text-align:center}' +
    '#installApp .ia-in{max-width:520px;margin:0 auto}' +
    '#installApp h2{font-family:NocivAnton,Anton,Impact,sans-serif;font-weight:400;font-size:1.9rem;letter-spacing:.06em;margin:0 0 6px;text-transform:uppercase}' +
    '#installApp p{margin:0 0 16px;font-size:.98rem;line-height:1.4;opacity:.85}' +
    '#installApp button.ia-btn{font:inherit;font-weight:800;letter-spacing:.08em;text-transform:uppercase;font-size:1rem;padding:15px 24px;min-height:48px;background:#c8412f;color:#f2ecd6;border:2px solid #f2ecd6;border-radius:0;cursor:pointer}' +
    '#installApp .ia-steps{display:none;text-align:left;margin:18px auto 0;max-width:340px;background:#1c1c1c;border:2px solid #f2ecd6;padding:14px 16px}' +
    '#installApp .ia-steps.on{display:block}' +
    '#installApp ol{margin:0;padding-left:20px;line-height:1.5}#installApp li{margin:4px 0}' +
    '#installApp .ia-small{margin:14px 0 0;font-size:.82rem;opacity:.6}';
  document.head.appendChild(st);

  var box = document.createElement('section');
  box.id = 'installApp'; box.setAttribute('aria-label', 'Add NOCIV to your home screen');
  box.innerHTML = '<div class="ia-in"><h2>Keep NOCIV in your pocket</h2>' +
    '<p>Put it on your home screen like an app. Free. No App Store, no account, no tracking. Your projects and tools are one tap away.</p>' +
    '<button type="button" class="ia-btn" id="iaBtn">Add to home screen</button>' +
    '<div class="ia-steps" id="iaSteps" role="status"></div></div>';

  var foot = document.querySelector('footer');
  if (foot && foot.parentNode) foot.parentNode.insertBefore(box, foot); else document.body.appendChild(box);

  var steps = document.getElementById('iaSteps');
  function show(html) { steps.innerHTML = html; steps.classList.add('on'); }
  document.getElementById('iaBtn').addEventListener('click', function () {
    if (deferred) { deferred.prompt(); deferred = null; return; }
    if (ios) show('<ol><li>Tap the <b>Share</b> button (the square with an arrow) at the bottom or top of Safari.</li><li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>.</li></ol><p class="ia-small">Using another browser on iPhone? Open nociv.co in Safari first.</p>');
    else if (android) show('<ol><li>Tap the <b>menu</b> (three dots) in Chrome.</li><li>Tap <b>Add to Home screen</b> or <b>Install app</b>.</li><li>Tap <b>Install</b>.</li></ol>');
    else show('<ol><li>Open <b>nociv.co</b> on your phone.</li><li>iPhone: Safari, Share, Add to Home Screen.</li><li>Android: Chrome menu, Install app.</li></ol>');
  });
})();
