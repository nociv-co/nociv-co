// Admin: Case Zero room (private). Your notes for each kit, repo and doc links, software notes.
// Saved in app_settings key casezero_notes, which only your admin login can read. Nothing here shows on the public page.
// The public page is nociv.co/casezero. Its build photos come from Post, Case Zero.
(function () {
  var parking = document.getElementById('roomParking'); if (!parking || document.getElementById('sec-casezero')) return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var KEY = 'casezero_notes';
  var KITS = [['base', 'Case Zero Base'], ['premium', 'Case Zero Premium'], ['facetype', 'FACETYPE']];
  var data = { kits: {}, software: '', links: [] };

  var sec = document.createElement('details'); sec.className = 'admin-section'; sec.id = 'sec-casezero';
  sec.innerHTML = '<summary>Case Zero <span class="admin-section-hint">private notes, links, build log</span></summary><div class="admin-section-body admin-form" style="margin-bottom:0">' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">' +
      '<a class="edit-btn" href="/casezero/" target="_blank" rel="noopener" style="text-decoration:none">See the live page</a>' +
      '<a class="edit-btn" href="post.html?shop=casezero" style="text-decoration:none">Post to the build log</a>' +
    '</div>' +
    '<p class="field-hint" id="czLogCount">Build log posts: open to count.</p>' +
    KITS.map(function (k) { return '<label for="czk-' + k[0] + '">' + k[1] + '</label><textarea id="czk-' + k[0] + '" rows="5" placeholder="Where it stands, parts, measurements, what is next"></textarea>'; }).join('') +
    '<label for="czSoft">Software and code</label><textarea id="czSoft" rows="5" placeholder="GitHub, Supabase, firmware, anything from the other chats"></textarea>' +
    '<label>Links (repos, docs, files)</label><div id="czLinks"></div>' +
    '<button type="button" class="edit-btn" id="czAddLink" style="margin-top:6px">+ Add a link</button>' +
    '<button type="button" class="admin-submit" id="czSave">Save Case Zero notes</button>' +
    '<p class="field-hint" id="czSaved" role="status" style="margin-top:8px"></p>' +
    '<p class="field-hint">Only you can see this. The public page only shows what is written on it plus your Case Zero posts.</p>' +
  '</div>';
  parking.appendChild(sec);

  function linkRow(l) {
    return '<div class="cz-link" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;align-items:center">' +
      '<input type="text" class="czl-name" placeholder="Name" value="' + esc(l.name) + '" style="flex:1 1 100%;min-width:0">' +
      '<input type="url" class="czl-url" placeholder="https://" value="' + esc(l.url) + '" style="flex:1;min-width:0" autocapitalize="off" spellcheck="false">' +
      (/^https:\/\//.test(l.url || '') ? '<a class="edit-btn" href="' + esc(l.url) + '" target="_blank" rel="noopener" style="text-decoration:none">Open</a>' : '') +
      '<button type="button" class="edit-btn czl-del" aria-label="Remove link">X</button></div>';
  }
  function fill() {
    KITS.forEach(function (k) { $('czk-' + k[0]).value = (data.kits && data.kits[k[0]]) || ''; });
    $('czSoft').value = data.software || '';
    var ls = (data.links && data.links.length) ? data.links : [{ name: 'Site repo', url: 'https://github.com/nociv-co/nociv-co' }];
    $('czLinks').innerHTML = ls.map(linkRow).join('');
  }
  function read() {
    var out = { kits: {}, software: $('czSoft').value, links: [] };
    KITS.forEach(function (k) { out.kits[k[0]] = $('czk-' + k[0]).value; });
    document.querySelectorAll('#czLinks .cz-link').forEach(function (r) {
      var n = r.querySelector('.czl-name').value.trim(), u = r.querySelector('.czl-url').value.trim();
      if (n || u) out.links.push({ name: n, url: u });
    });
    return out;
  }
  var loaded = false;
  function load() {
    $('czSaved').textContent = 'Loading...';
    supabaseClient.from('app_settings').select('value').eq('key', KEY).maybeSingle().then(function (r) {
      if (r.error) { $('czSaved').textContent = 'Could not load. Log in to Admin first. (' + r.error.message + ')'; return; }
      if (r.data && r.data.value) { try { data = JSON.parse(r.data.value) || data; } catch (e) { data = { kits: {}, software: r.data.value, links: [] }; } }
      loaded = true; fill(); $('czSaved').textContent = '';
    });
    supabaseClient.from('album_photos').select('id', { count: 'exact', head: true }).eq('shop', 'casezero').then(function (r) {
      $('czLogCount').textContent = r.error ? 'Build log posts: could not count.' : 'Build log posts: ' + (r.count || 0) + '. They show on the live page.';
    });
  }
  sec.addEventListener('toggle', function () { if (sec.open && !loaded) load(); });
  $('czAddLink').addEventListener('click', function () { $('czLinks').insertAdjacentHTML('beforeend', linkRow({ name: '', url: '' })); });
  $('czLinks').addEventListener('click', function (e) { var b = e.target.closest('.czl-del'); if (b) b.closest('.cz-link').remove(); });
  $('czSave').addEventListener('click', function () {
    if (!loaded) { $('czSaved').textContent = 'Still loading, try again in a second.'; return; }
    var btn = $('czSave'); btn.disabled = true; $('czSaved').textContent = 'Saving...';
    data = read();
    supabaseClient.from('app_settings').upsert([{ key: KEY, value: JSON.stringify(data) }], { onConflict: 'key' }).then(function (r) {
      btn.disabled = false;
      if (r.error) { $('czSaved').textContent = 'Not saved: ' + r.error.message; return; }
      $('czSaved').textContent = 'Saved ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '.';
      fill();
    });
  });
})();
