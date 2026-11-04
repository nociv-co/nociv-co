// Admin: Storage. Shows how much of the free 1 GB file space is used, and deletes files nothing on the site points to.
// Unused = no row in any table mentions the file (checked by the storage_report() database function, admin only).
(function () {
  var parking = document.getElementById('roomParking'); if (!parking || document.getElementById('sec-storage')) return;
  var LIMIT = 1024; // MB on the free plan
  var sec = document.createElement('details'); sec.className = 'admin-section'; sec.id = 'sec-storage';
  sec.innerHTML = '<summary>Storage <span class="admin-section-hint">space used, clear unused files</span></summary><div class="admin-section-body admin-form" style="margin-bottom:0">' +
    '<div style="height:14px;border:2px solid #1a1a1a;background:#fff;position:relative"><div id="stBar" style="position:absolute;left:0;top:0;bottom:0;width:0;background:#1a1a1a"></div></div>' +
    '<p class="field-hint" id="stUsed" style="margin-top:8px">Open to check.</p>' +
    '<div id="stList"></div>' +
    '<button type="button" class="admin-submit" id="stClear" hidden>Delete unused files</button>' +
    '<p class="field-hint" id="stMsg" role="status"></p>' +
    '<p class="field-hint">Nothing that shows on the site is ever deleted here. Only files no product, zine, album post or setting points to.</p>' +
  '</div>';
  parking.appendChild(sec);
  var $ = function (id) { return document.getElementById(id); }, unused = [];
  function load() {
    $('stUsed').textContent = 'Checking...'; $('stMsg').textContent = '';
    supabaseClient.rpc('storage_report').then(function (r) {
      if (r.error) { $('stUsed').textContent = 'Could not check: ' + r.error.message; return; }
      var d = r.data || {}, used = +d.used_mb || 0; unused = d.unused || [];
      var free = unused.reduce(function (a, f) { return a + (+f.mb || 0); }, 0);
      $('stBar').style.width = Math.min(100, used / LIMIT * 100).toFixed(1) + '%';
      $('stUsed').textContent = used.toFixed(0) + ' MB of ' + LIMIT + ' MB used (' + Math.round(used / LIMIT * 100) + '%).' + (unused.length ? ' ' + unused.length + ' unused files take ' + free.toFixed(0) + ' MB.' : ' No unused files.');
      $('stList').innerHTML = unused.length ? '<ul style="margin:8px 0 0;padding-left:18px;font-size:.85rem;line-height:1.5">' + unused.map(function (f) { return '<li>' + String(f.name).replace(/[&<>"']/g, '').slice(-40) + ' <b>' + f.mb + ' MB</b></li>'; }).join('') + '</ul>' : '';
      $('stClear').hidden = !unused.length;
    });
  }
  sec.addEventListener('toggle', function () { if (sec.open) load(); });
  $('stClear').addEventListener('click', function () {
    if (!unused.length || !confirm('Delete ' + unused.length + ' unused files? Nothing on the site uses them.')) return;
    var btn = $('stClear'); btn.disabled = true; $('stMsg').textContent = 'Deleting...';
    var by = {}; unused.forEach(function (f) { (by[f.bucket] = by[f.bucket] || []).push(f.name); });
    Promise.all(Object.keys(by).map(function (b) { return supabaseClient.storage.from(b).remove(by[b]); })).then(function (rs) {
      var bad = rs.filter(function (r) { return r.error; });
      btn.disabled = false; $('stMsg').textContent = bad.length ? 'Some files could not be deleted: ' + bad[0].error.message : 'Done.';
      load();
    });
  });
})();
