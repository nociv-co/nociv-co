// Admin: REA notes (private). REA is your fork of a code analysis program that runs on a computer (github.com/nociv-co/rea).
// It cannot run in a website, so this is where its findings live: what we took apart, what we learned, where it is used.
// Saved in app_settings key rea_notes (admin only). Anything worth keeping long term also goes in NOCIV Shop, Reference Library.
(function () {
  var parking = document.getElementById('roomParking'); if (!parking || document.getElementById('sec-rea')) return;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'rea_notes', loaded = false;
  var FIELDS = [['apart', 'What we are taking apart', 'A program, device or site. Where it came from and its license.'],
    ['learned', 'What we learned', 'The useful elements and real measurements. Never their files or look.'],
    ['used', 'Where we used it', 'Which NOCIV build got the new element (Case Zero, From Scratch, a tool).']];
  var sec = document.createElement('details'); sec.className = 'admin-section'; sec.id = 'sec-rea';
  sec.innerHTML = '<summary>REA <span class="admin-section-hint">take apart, learn, filter</span></summary><div class="admin-section-body admin-form" style="margin-bottom:0">' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">' +
      '<a class="edit-btn" href="https://github.com/nociv-co/rea" target="_blank" rel="noopener" style="text-decoration:none">Open your REA fork</a>' +
      '<button type="button" class="edit-btn" id="reaRef">Reference Library</button>' +
    '</div>' +
    '<p class="field-hint">REA runs on a computer, not on the site. Write down here what each run taught us.</p>' +
    FIELDS.map(function (f) { return '<label for="rea-' + f[0] + '">' + f[1] + '</label><textarea id="rea-' + f[0] + '" rows="5" placeholder="' + f[2] + '"></textarea>'; }).join('') +
    '<button type="button" class="admin-submit" id="reaSave">Save REA notes</button>' +
    '<p class="field-hint" id="reaSaved" role="status" style="margin-top:8px"></p>' +
  '</div>';
  parking.appendChild(sec);
  function load() {
    loaded = true;
    supabaseClient.from('app_settings').select('value').eq('key', KEY).maybeSingle().then(function (r) {
      var d = {}; try { d = r && r.data && r.data.value ? JSON.parse(r.data.value) : {}; } catch (e) { d = {}; }
      FIELDS.forEach(function (f) { $('rea-' + f[0]).value = d[f[0]] || ''; });
    });
  }
  sec.addEventListener('toggle', function () { if (sec.open && !loaded) load(); });
  $('reaSave').addEventListener('click', function () {
    var d = {}; FIELDS.forEach(function (f) { d[f[0]] = $('rea-' + f[0]).value; });
    $('reaSaved').textContent = 'Saving...';
    supabaseClient.from('app_settings').upsert([{ key: KEY, value: JSON.stringify(d) }], { onConflict: 'key' }).then(function (r) {
      $('reaSaved').textContent = r.error ? 'Not saved: ' + r.error.message : 'Saved.';
    });
  });
  $('reaRef').addEventListener('click', function () {
    var ref = document.getElementById('sec-reference'); if (window.nocivOpenRoom) window.nocivOpenRoom('shop');
    setTimeout(function () { ref = document.getElementById('sec-reference'); if (ref) { ref.open = true; ref.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 150);
  });
})();
