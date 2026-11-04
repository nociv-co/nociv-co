// Admin: Case Zero requests. Approve, reject, mark live, delete. Only your admin login can read these (set in the database).
(function () {
  var parking = document.getElementById('roomParking'); if (!parking || document.getElementById('sec-casezero')) return;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var sec = document.createElement('details'); sec.className = 'admin-section'; sec.id = 'sec-casezero';
  sec.innerHTML = '<summary>Case Zero <span class="admin-section-hint">free name requests</span></summary><div class="admin-section-body">' +
    '<p class="field-hint" id="czCount">Open to load.</p><div id="czList"></div>' +
    '<p class="field-hint">Approved means you said yes. Live means the name works on the internet. Names go live automatically only after the domain and Cloudflare are connected, not built yet.</p></div>';
  parking.appendChild(sec);
  var rows = [];
  function load() {
    $('czCount').textContent = 'Loading...';
    supabaseClient.from('casezero_requests').select('*').order('created_at', { ascending: false }).limit(200).then(function (r) {
      if (r.error) { $('czCount').textContent = 'Could not load. Run the Case Zero SQL first, and log in to Admin. (' + r.error.message + ')'; return; }
      rows = r.data || []; draw();
    });
  }
  function draw() {
    var p = rows.filter(function (x) { return x.status === 'pending'; }).length;
    $('czCount').textContent = rows.length + ' request' + (rows.length === 1 ? '' : 's') + ', ' + p + ' waiting.';
    $('czList').innerHTML = rows.map(function (x) {
      var v = x.type === 'URL' ? 'redirects to ' + x.value : x.type + ' ' + x.value;
      return '<div class="how-to-box" style="margin-top:10px"><strong>' + esc(x.name) + '</strong> <em>' + esc(x.status) + '</em><br>' + esc(v) + '<br>From ' + esc(x.owner) + ' on ' + esc((x.created_at || '').slice(0, 10)) + '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">' +
        ['approved', 'rejected', 'live'].map(function (s) { return x.status === s ? '' : '<button type="button" class="edit-btn" data-id="' + x.id + '" data-s="' + s + '">' + (s === 'approved' ? 'Approve' : s === 'rejected' ? 'Reject' : 'Mark live') + '</button>'; }).join('') +
        '<button type="button" class="edit-btn" data-id="' + x.id + '" data-s="delete">Delete</button></div></div>';
    }).join('');
  }
  sec.addEventListener('toggle', function () { if (sec.open) load(); });
  $('czList').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-id]'); if (!b) return;
    var id = b.dataset.id, s = b.dataset.s, q;
    if (s === 'delete') { if (!confirm('Delete this request for good?')) return; q = supabaseClient.from('casezero_requests').delete().eq('id', id); }
    else q = supabaseClient.from('casezero_requests').update({ status: s, decided_at: new Date().toISOString() }).eq('id', id);
    q.then(function (r) { if (r.error) alert('That did not work: ' + r.error.message); load(); });
  });
})();
