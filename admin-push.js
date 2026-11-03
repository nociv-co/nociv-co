// Admin: send a pop-up shop drop alert to every phone that opted in from the shop app.
// Calls the send-push edge function (admin login required, checked on the server).
(function () {
  var parking = document.getElementById('roomParking'); if (!parking || document.getElementById('sec-dropalert')) return;
  var $ = function (id) { return document.getElementById(id); };
  var FN = 'https://vscombrgcdtrfndqyugb.supabase.co/functions/v1/send-push';
  var sec = document.createElement('details'); sec.className = 'admin-section'; sec.id = 'sec-dropalert';
  sec.innerHTML = '<summary>Pop-up drop alert <span class="admin-section-hint">notify the phones that opted in</span></summary><div class="admin-section-body">' +
    '<p class="field-hint" id="daCount">Open to load.</p>' +
    '<label for="daTitle">Title (60 characters)</label><input type="text" id="daTitle" maxlength="60" placeholder="Pop-up shop this Saturday" style="width:100%;box-sizing:border-box;margin-bottom:10px">' +
    '<label for="daBody">Message (160 characters)</label><textarea id="daBody" maxlength="160" rows="3" placeholder="Where, when, what we are bringing." style="width:100%;box-sizing:border-box;margin-bottom:10px"></textarea>' +
    '<label for="daUrl">Opens this page</label><select id="daUrl" style="width:100%;box-sizing:border-box;margin-bottom:12px"><option value="/">Home</option><option value="/community.html">Community</option><option value="/shop.html">Shop</option></select>' +
    '<button type="button" class="ny-dl" id="daSend">Send alert</button><p class="field-hint" id="daMsg" role="status"></p>' +
    '<p class="field-hint">One alert per drop. People turn this on themselves in the shop app and can turn it off any time. Only works on iPhone 16.4 or newer from the home screen app, and Android. Phones that turned it off drop off the list on their own.</p></div>';
  parking.appendChild(sec);
  function call(payload) {
    return supabaseClient.auth.getSession().then(function (r) {
      var s = r.data && r.data.session; if (!s) throw new Error('Log in to Admin first.');
      return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.access_token }, body: JSON.stringify(payload) });
    }).then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { if (!res.ok) throw new Error(j.error || ('Error ' + res.status)); return j; }); });
  }
  var subs = null;
  function load() {
    $('daCount').textContent = 'Loading...';
    call({ init: true }).then(function (j) { subs = j.subscribers || 0; $('daCount').textContent = subs + ' phone' + (subs === 1 ? '' : 's') + ' signed up for pop-up alerts.'; })
      .catch(function (e) { subs = null; $('daCount').textContent = 'Not ready: ' + e.message; });
  }
  sec.addEventListener('toggle', function () { if (sec.open && typeof supabaseClient !== 'undefined') load(); });
  $('daSend').addEventListener('click', function () {
    var title = $('daTitle').value.trim(), body = $('daBody').value.trim(), msg = $('daMsg');
    if (!title || !body) { msg.textContent = 'Type a title and a message first.'; return; }
    if (!subs) { msg.textContent = subs === 0 ? 'Nobody has signed up yet.' : 'Not ready yet. Close and reopen this section.'; return; }
    if (!confirm('Send this to ' + subs + ' phone' + (subs === 1 ? '' : 's') + ' now? It cannot be taken back.\n\n' + title + '\n' + body)) return;
    var b = $('daSend'); b.disabled = true; msg.textContent = 'Sending...';
    call({ title: title, body: body, url: $('daUrl').value }).then(function (j) {
      msg.textContent = 'Sent to ' + j.sent + '. ' + (j.failed ? j.failed + ' did not go through' + (j.removed ? ' (' + j.removed + ' removed, they turned alerts off)' : '') + '.' : 'All good.');
      $('daTitle').value = ''; $('daBody').value = ''; load();
    }).catch(function (e) { msg.textContent = 'Did not send: ' + e.message; }).then(function () { b.disabled = false; });
  });
})();
