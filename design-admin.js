/* NOCIV admin: Design Clients.
   Graphic design clients, a 7 step tracker, hours by step with a timer, Friday payments,
   proofs and locked final files, invoices, and a private link the client can open.
   Needs: admin.html (supabaseClient, section #sec-design with #designMount) and design-portal.html.
   SQL: supabase-migration-design-clients.sql */
(function () {
  var mount = document.getElementById('designMount');
  if (!mount) return;
  var STEPS = ['Gather inspo', 'Draw it', 'Vector base', 'Mockup', 'Refine', 'Finish PNGs', 'Send + invoice'];
  var SHORT = ['INSPO', 'DRAW', 'VECTOR', 'MOCKUP', 'REFINE', 'FINAL', 'SENT'];
  var S = { clients: [], cid: null, projects: [], time: [], pays: [], files: [], invs: [], step: 1, loaded: false };
  var liveTimer = null;

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { n = Number(n) || 0; return (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2); };
  var round2 = function (n) { return Math.round(n * 100) / 100; };
  function today() { return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Phoenix' }); }
  function dparse(s) { return new Date(String(s).slice(0, 10) + 'T00:00:00Z'); }
  function dfmt(s) { if (!s) return ''; return dparse(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }); }
  function hm(min) { min = Math.round(Number(min) || 0); return Math.floor(min / 60) + 'h ' + (min % 60) + 'm'; }
  function hrs(min) { return ((Number(min) || 0) / 60).toFixed(2); }
  function payDays(start, end, dow) {
    var n = 0, d = dparse(start), e = dparse(end);
    for (; d <= e; d = new Date(d.getTime() + 86400000)) if (d.getUTCDay() === dow) n++;
    return n;
  }
  function weekStart(t) { var d = dparse(t); var back = (d.getUTCDay() + 6) % 7; return new Date(d.getTime() - back * 86400000).toISOString().slice(0, 10); }
  function fail(error) {
    var m = (error && error.message) || String(error);
    if (/design_|relation|schema cache/i.test(m)) m += '\n\nRun supabase-migration-design-clients.sql in Supabase, SQL Editor, first.';
    alert('Error: ' + m);
  }
  function cur() { return S.clients.find(function (c) { return c.id === S.cid; }); }
  function link(c) { return location.origin + '/design-portal.html?c=' + c.token; }
  function copy(text, okMsg) {
    var done = function () { toast(okMsg || 'Copied.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { prompt('Copy this:', text); });
    else prompt('Copy this:', text);
  }
  function toast(msg) { var t = $('dzToast'); if (!t) return; t.textContent = msg; t.style.opacity = 1; clearTimeout(toast._t); toast._t = setTimeout(function () { t.style.opacity = 0; }, 2200); }

  // ---------- money math (same formulas as design_portal in the SQL) ----------
  function summary() {
    var c = cur(), t = today();
    var minutes = S.time.reduce(function (a, r) { return a + (r.running ? 0 : r.minutes); }, 0) + Number(c.past_hours) * 60;
    var earned = round2(minutes / 60 * Number(c.rate));
    var paid = S.pays.reduce(function (a, p) { return a + Number(p.amount); }, 0);
    var ws = weekStart(t);
    var wkMin = S.time.reduce(function (a, r) { return a + (!r.running && r.work_date >= ws ? r.minutes : 0); }, 0);
    var days = payDays(c.start_date, t, c.pay_dow);
    var expected = days * Number(c.weekly_payment);
    return {
      minutes: minutes, earned: earned, paid: paid, balance: round2(earned - paid), days: days, expected: expected,
      behind: Math.max(0, expected - paid), wkMin: wkMin, covered: Number(c.weekly_payment) / (Number(c.rate) || 1)
    };
  }

  // ---------- load ----------
  async function loadClients() {
    var r = await supabaseClient.from('design_clients').select('*').order('created_at', { ascending: true });
    if (r.error) { mount.innerHTML = '<p class="admin-error" style="display:block">' + esc(r.error.message) + ' Run supabase-migration-design-clients.sql in Supabase, SQL Editor.</p>'; return; }
    S.clients = r.data || [];
    S.loaded = true;
    if (!S.cid || !cur()) S.cid = S.clients.length ? S.clients[0].id : null;
    shell();
    if (S.cid) await loadClient();
  }
  async function loadClient() {
    var id = S.cid, q = function (t, order) { return supabaseClient.from(t).select('*').eq('client_id', id).order(order, { ascending: false }); };
    var res = await Promise.all([q('design_projects', 'created_at'), q('design_time', 'created_at'), q('design_payments', 'paid_on'), q('design_files', 'created_at'), q('design_invoices', 'created_at')]);
    for (var i = 0; i < res.length; i++) if (res[i].error) { fail(res[i].error); return; }
    S.projects = res[0].data; S.time = res[1].data; S.pays = res[2].data; S.files = res[3].data; S.invs = res[4].data;
    renderAll();
  }

  // ---------- skeleton ----------
  function css() {
    if ($('dzCss')) return;
    var st = document.createElement('style'); st.id = 'dzCss';
    st.textContent = '#designMount .dz-card{border:2px solid #111;background:#fff;padding:12px;margin:12px 0}' +
      '#designMount h3{margin:0 0 8px;font-size:.95rem;text-transform:uppercase;letter-spacing:.05em}' +
      '#designMount input,#designMount select{font-size:16px;padding:9px;border:1px solid #888;border-radius:0;background:#fff;width:100%;box-sizing:border-box;margin:3px 0}' +
      '#designMount .dz-row{display:flex;gap:8px;flex-wrap:wrap}#designMount .dz-row>*{flex:1 1 120px}' +
      '#designMount .dz-btn{border:2px solid #111;background:#111;color:#fff;padding:11px 14px;font-weight:800;text-transform:uppercase;font-size:.78rem;letter-spacing:.04em;cursor:pointer;font-family:inherit}' +
      '#designMount .dz-btn.alt{background:#fff;color:#111}#designMount .dz-btn.red{background:#c8281e;border-color:#c8281e}#designMount .dz-btn.sm{padding:7px 10px;font-size:.7rem}' +
      '#designMount .dz-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
      '#designMount .dz-stat{border:2px solid #111;padding:8px}#designMount .dz-stat b{display:block;font-size:1.3rem}#designMount .dz-stat span{font-size:.65rem;text-transform:uppercase;letter-spacing:.05em;opacity:.6;font-weight:800}' +
      '#designMount .dz-steps{display:flex;gap:4px;margin:6px 0}#designMount .dz-steps button,#designMount .dz-dot{flex:1;height:38px;border:2px solid #111;background:#fff;font-weight:800;font-size:.85rem;cursor:pointer;padding:0}' +
      '#designMount .dz-steps button.on,#designMount .dz-dot.now{background:#c8281e;color:#fff;border-color:#c8281e}#designMount .dz-dot.done{background:#111;color:#fff}' +
      '#designMount .dz-line{display:flex;gap:8px;align-items:center;justify-content:space-between;border-top:1px solid #ddd;padding:8px 0;font-size:.88rem}' +
      '#designMount .dz-line small{display:block;opacity:.6}' +
      '#designMount .dz-bar{height:14px;border:2px solid #111;margin:6px 0}#designMount .dz-bar i{display:block;height:100%;background:#111}#designMount .dz-bar.over i{background:#c8281e}' +
      '#designMount .dz-live{background:#c8281e;color:#fff;padding:10px;font-weight:800;margin:8px 0}' +
      '#designMount .dz-tag{border:2px solid #111;padding:1px 6px;font-size:.65rem;font-weight:800;text-transform:uppercase}' +
      '#dzToast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 16px;font-weight:700;opacity:0;transition:opacity .2s;z-index:99;pointer-events:none}';
    document.head.appendChild(st);
  }
  function shell() {
    css();
    var opts = S.clients.map(function (c) { return '<option value="' + c.id + '"' + (c.id === S.cid ? ' selected' : '') + '>' + esc(c.business || c.name) + '</option>'; }).join('');
    mount.innerHTML =
      '<div class="dz-card"><div class="dz-row"><select id="dzClientSel">' + (opts || '<option value="">No clients yet</option>') + '</select>' +
      '<button class="dz-btn alt" id="dzNewToggle" type="button">+ New client</button></div>' +
      '<div id="dzNewForm" hidden>' +
      '<div class="dz-row"><input id="dzNName" placeholder="Client name"><input id="dzNBiz" placeholder="Business (optional)"></div>' +
      '<div class="dz-row"><input id="dzNCode" placeholder="Initials for file names, like IM" maxlength="6"><input id="dzNEmail" type="email" placeholder="Email (optional)"></div>' +
      '<div class="dz-row"><div><label class="field-hint">Rate ($ per hour)</label><input id="dzNRate" type="number" step="0.5" value="45"></div>' +
      '<div><label class="field-hint">Pays each Friday ($)</label><input id="dzNWeekly" type="number" step="1" value="200"></div></div>' +
      '<div class="dz-row"><div><label class="field-hint">Friday payments start on</label><input id="dzNStart" type="date"></div>' +
      '<div><label class="field-hint">Earlier unpaid work (hours)</label><input id="dzNPast" type="number" step="0.25" value="0"></div></div>' +
      '<input id="dzNPastNote" placeholder="What the earlier work was (shows on his page)">' +
      '<button class="dz-btn" id="dzNSave" type="button" style="margin-top:8px;width:100%">Save client</button></div></div>' +
      '<div id="dzBody"></div><div id="dzToast"></div>';
    $('dzNStart').value = today();
    $('dzClientSel').onchange = function () { S.cid = this.value; loadClient(); };
    $('dzNewToggle').onclick = function () { var f = $('dzNewForm'); f.hidden = !f.hidden; };
    $('dzNSave').onclick = saveClient;
    if (!S.cid) $('dzBody').innerHTML = '<p class="field-hint">Add your first client above. Isaac &amp; More is $45 an hour, $200 each Friday, with your earlier hours entered as "Earlier unpaid work".</p>';
  }
  async function saveClient() {
    var name = $('dzNName').value.trim();
    if (!name) { alert('Add the client name.'); return; }
    var biz = $('dzNBiz').value.trim();
    var code = ($('dzNCode').value.trim() || (biz || name).split(/\s+/).map(function (w) { return w[0]; }).join('')).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'CL';
    var row = {
      name: name, business: biz || null, code: code, email: $('dzNEmail').value.trim() || null,
      rate: Number($('dzNRate').value) || 45, weekly_payment: Number($('dzNWeekly').value) || 0,
      start_date: $('dzNStart').value || today(), past_hours: Number($('dzNPast').value) || 0,
      past_note: $('dzNPastNote').value.trim() || null
    };
    var r = await supabaseClient.from('design_clients').insert([row]).select();
    if (r.error) { fail(r.error); return; }
    S.cid = r.data[0].id;
    await loadClients();
  }

  // ---------- render ----------
  function renderAll() {
    var c = cur(); if (!c) return;
    var body = $('dzBody');
    body.innerHTML =
      '<div class="dz-card" id="dzTop"></div>' +
      '<div class="dz-card"><h3>Clock in</h3><div id="dzTimer"></div></div>' +
      '<div class="dz-card"><h3>Projects and the 7 steps</h3><div id="dzProjects"></div></div>' +
      '<div class="dz-card"><h3>Friday payments</h3><div id="dzPays"></div></div>' +
      '<div class="dz-card"><h3>Files</h3><div id="dzFiles"></div></div>' +
      '<div class="dz-card"><h3>Invoices</h3><div id="dzInvs"></div></div>' +
      '<div class="dz-card"><h3>Time log</h3><div id="dzLog"></div></div>' +
      '<div class="dz-card"><h3>Client settings</h3><div id="dzSet"></div></div>';
    rTop(); rTimer(); rProjects(); rPays(); rFiles(); rInvs(); rLog(); rSet();
  }
  function rTop() {
    var c = cur(), s = summary(), over = Math.max(0, s.wkMin / 60 - s.covered), pct = s.covered ? Math.min(100, s.wkMin / 60 / s.covered * 100) : 0;
    $('dzTop').innerHTML =
      '<div class="dz-row"><button class="dz-btn" id="dzCopyLink" type="button">Copy his link</button>' +
      '<button class="dz-btn alt" id="dzOpenLink" type="button">Open his page</button>' +
      '<button class="dz-btn alt" id="dzCopyUpdate" type="button">Copy Friday text</button>' +
      '<button class="dz-btn alt" id="dzEmailUpdate" type="button">Email him</button></div>' +
      '<p class="field-hint">His page is private. Only someone with the link sees it. It updates live as you log hours.</p>' +
      '<div class="dz-stats">' +
      '<div class="dz-stat"><span>Hours logged</span><b>' + hrs(s.minutes) + '</b></div>' +
      '<div class="dz-stat"><span>Work value</span><b>' + money(s.earned) + '</b></div>' +
      '<div class="dz-stat"><span>Paid</span><b>' + money(s.paid) + '</b></div>' +
      '<div class="dz-stat"><span>Balance owed</span><b style="color:' + (s.balance > 0 ? '#c8281e' : '#2f6b2f') + '">' + money(s.balance) + '</b></div></div>' +
      '<p style="margin:10px 0 0"><b>This week:</b> ' + hm(s.wkMin) + ' logged. His ' + money(c.weekly_payment) + ' covers ' + s.covered.toFixed(1) + ' hours.</p>' +
      '<div class="dz-bar ' + (over > 0 ? 'over' : '') + '"><i style="width:' + pct + '%"></i></div>' +
      '<p class="field-hint">' + (over > 0 ? over.toFixed(1) + ' hours over what he pays for this week. Those add to his balance. Stop, or tell him.' : Math.max(0, s.covered - s.wkMin / 60).toFixed(1) + ' covered hours left this week.') + '</p>' +
      '<p class="field-hint">Friday payments due since ' + dfmt(c.start_date) + ': ' + s.days + ' (' + money(s.expected) + '). Received ' + money(s.paid) + '. ' + (s.behind > 0 ? '<b style="color:#c8281e">' + money(s.behind) + ' behind.</b>' : 'On schedule.') + '</p>';
    $('dzCopyLink').onclick = function () { copy(link(c), 'Link copied. Text it to him.'); };
    $('dzOpenLink').onclick = function () { window.open(link(c), '_blank'); };
    $('dzCopyUpdate').onclick = function () { copy(fridayText(), 'Friday text copied.'); };
    $('dzEmailUpdate').onclick = function () { emailHim('Design update, ' + dfmt(today()), fridayText() + '\n\nJasilyn\nNOCIV'); };
  }
  async function emailHim(subject, text) {
    var c = cur();
    if (!c.email) { alert('Add his email under Client settings first.'); return; }
    if (!confirm('Email this to ' + c.email + ' from hello@nociv.co?\n\n' + text)) return;
    var r = await supabaseClient.functions.invoke('design-send', { body: { client_id: c.id, subject: subject, text: text } });
    var msg = r.error ? r.error.message : (r.data && r.data.error);
    if (msg) { alert('Email did not send: ' + msg + '\n\nIs the design-send function deployed?'); return; }
    toast('Emailed to ' + c.email);
  }
  function fridayText() {
    var c = cur(), s = summary(), over = Math.max(0, s.wkMin / 60 - s.covered);
    var first = (c.name || '').split(' ')[0];
    return 'Hey ' + first + ', Friday update.\n' +
      'This week: ' + hm(s.wkMin) + ' logged. Your ' + money(c.weekly_payment) + ' covers ' + s.covered.toFixed(1) + ' hours' + (over > 0 ? ', I am ' + over.toFixed(1) + ' hours over.' : '.') + '\n' +
      'All time: ' + hrs(s.minutes) + ' hours (' + money(s.earned) + '), paid ' + money(s.paid) + ', balance ' + money(s.balance) + '.\n' +
      'Everything is on your page: ' + link(c);
  }

  function projOptions(selected, withNew) {
    var o = S.projects.filter(function (p) { return p.status !== 'done' || p.id === selected; }).map(function (p) { return '<option value="' + p.id + '"' + (p.id === selected ? ' selected' : '') + '>' + esc(p.name) + '</option>'; }).join('');
    return (withNew ? '<option value="">(pick a project)</option>' : '') + o;
  }
  function rTimer() {
    var run = S.time.find(function (t) { return t.running; });
    var keep = { p: ($('dzTProj') || {}).value, n: ($('dzTNote') || {}).value };
    var h;
    if (run) {
      var pr = S.projects.find(function (p) { return p.id === run.project_id; });
      h = '<div class="dz-live" id="dzLive"></div><p>Step ' + run.step + ', ' + esc(STEPS[run.step - 1]) + (pr ? ' on ' + esc(pr.name) : '') + (run.note ? ' (' + esc(run.note) + ')' : '') + '</p>' +
        '<button class="dz-btn red" id="dzOut" type="button" style="width:100%">Clock out</button>';
    } else {
      h = '<select id="dzTProj">' + projOptions(keep.p, true) + '</select>' +
        '<input id="dzTNewProj" placeholder="Or type a new project name">' +
        '<div class="dz-steps" id="dzTSteps">' + STEPS.map(function (n, i) { return '<button type="button" data-s="' + (i + 1) + '" class="' + (S.step === i + 1 ? 'on' : '') + '">' + (i + 1) + '</button>'; }).join('') + '</div>' +
        '<p class="field-hint" id="dzStepName">Step ' + S.step + ': ' + esc(STEPS[S.step - 1]) + '</p>' +
        '<input id="dzTNote" placeholder="What are you doing? (he sees this)" value="' + esc(keep.n || '') + '">' +
        '<button class="dz-btn" id="dzIn" type="button" style="width:100%;margin-top:6px">Clock in</button>' +
        '<details style="margin-top:12px"><summary class="field-hint" style="cursor:pointer">Add past hours by hand</summary>' +
        '<div class="dz-row"><input id="dzMDate" type="date" value="' + today() + '"><input id="dzMH" type="number" step="0.25" placeholder="Hours, like 1.5"></div>' +
        '<button class="dz-btn alt" id="dzMAdd" type="button">Add these hours</button><p class="field-hint">Uses the project, step and note above.</p></details>';
    }
    $('dzTimer').innerHTML = h;
    if (run) { $('dzOut').onclick = function () { clockOut(run); }; tickLive(run); }
    else {
      clearInterval(liveTimer);
      $('dzTSteps').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; S.step = Number(b.dataset.s); [].forEach.call(this.children, function (x) { x.classList.toggle('on', x === b); }); $('dzStepName').textContent = 'Step ' + S.step + ': ' + STEPS[S.step - 1]; };
      $('dzIn').onclick = clockIn;
      $('dzMAdd').onclick = addManual;
    }
  }
  function tickLive(run) {
    clearInterval(liveTimer);
    var f = function () { var el = $('dzLive'); if (!el) { clearInterval(liveTimer); return; } var sec = Math.max(0, Math.floor((Date.now() - new Date(run.started_at).getTime()) / 1000)); el.textContent = 'Running ' + Math.floor(sec / 3600) + ':' + String(Math.floor(sec / 60) % 60).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };
    f(); liveTimer = setInterval(f, 1000);
  }
  async function pickProject() {
    var id = $('dzTProj').value, nn = $('dzTNewProj').value.trim();
    if (nn) {
      var r = await supabaseClient.from('design_projects').insert([{ client_id: S.cid, name: nn, current_step: S.step }]).select();
      if (r.error) { fail(r.error); return null; }
      S.projects.unshift(r.data[0]); return r.data[0].id;
    }
    if (!id) { alert('Pick a project or type a new name.'); return null; }
    return id;
  }
  async function clockIn() {
    if (S.time.some(function (t) { return t.running; })) { alert('Already clocked in.'); return; }
    var pid = await pickProject(); if (!pid) return;
    var r = await supabaseClient.from('design_time').insert([{ client_id: S.cid, project_id: pid, step: S.step, note: $('dzTNote').value.trim() || null, running: true, started_at: new Date().toISOString(), work_date: today(), minutes: 0 }]).select();
    if (r.error) { fail(r.error); return; }
    await supabaseClient.from('design_projects').update({ current_step: S.step }).eq('id', pid);
    await loadClient();
  }
  async function clockOut(run) {
    var min = Math.max(1, Math.round((Date.now() - new Date(run.started_at).getTime()) / 60000));
    var r = await supabaseClient.from('design_time').update({ running: false, minutes: min }).eq('id', run.id);
    if (r.error) { fail(r.error); return; }
    await loadClient();
  }
  async function addManual() {
    var h = Number($('dzMH').value);
    if (!(h > 0)) { alert('Type the hours, like 1.5'); return; }
    var pid = await pickProject(); if (!pid) return;
    var r = await supabaseClient.from('design_time').insert([{ client_id: S.cid, project_id: pid, step: S.step, note: $('dzTNote').value.trim() || null, running: false, work_date: $('dzMDate').value || today(), minutes: Math.round(h * 60) }]);
    if (r.error) { fail(r.error); return; }
    await loadClient();
  }

  function rProjects() {
    var box = $('dzProjects');
    var byProj = {};
    S.time.forEach(function (t) { if (t.running) return; var k = t.project_id || 'none'; (byProj[k] = byProj[k] || {})[t.step] = ((byProj[k] || {})[t.step] || 0) + t.minutes; });
    if (!S.projects.length) { box.innerHTML = '<p class="field-hint">No projects yet. Type a new project name in Clock in and it shows up here.</p>'; return; }
    box.innerHTML = S.projects.map(function (p) {
      var m = byProj[p.id] || {}, total = Object.keys(m).reduce(function (a, k) { return a + m[k]; }, 0);
      var dots = '';
      for (var i = 1; i <= 7; i++) dots += '<button type="button" class="dz-dot ' + (p.done_steps.indexOf(i) >= 0 ? 'done' : (p.current_step === i && p.status === 'active' ? 'now' : '')) + '" data-p="' + p.id + '" data-i="' + i + '">' + i + '</button>';
      var hs = STEPS.map(function (n, i) { return m[i + 1] ? (i + 1) + ' ' + n + ' ' + hrs(m[i + 1]) : ''; }).filter(Boolean).join(' &middot; ');
      return '<div style="margin-bottom:14px"><div class="dz-row" style="align-items:center"><b style="flex:3 1 140px">' + esc(p.name) + ' <span class="dz-tag">' + esc(p.status) + '</span></b>' +
        '<button class="dz-btn alt sm" type="button" data-act="pstatus" data-p="' + p.id + '">' + (p.status === 'done' ? 'Reopen' : 'Mark done') + '</button>' +
        '<button class="dz-btn alt sm" type="button" data-act="pdel" data-p="' + p.id + '">Delete</button></div>' +
        '<div style="display:flex;gap:4px;margin:6px 0">' + dots + '</div>' +
        '<div class="field-hint">Tap a number: current, then done, then clear. ' + hrs(total) + ' hrs total. ' + hs + '</div></div>';
    }).join('');
    box.onclick = async function (e) {
      var d = e.target.closest('.dz-dot'), b = e.target.closest('[data-act]');
      if (d) {
        var p = S.projects.find(function (x) { return x.id === d.dataset.p; }), i = Number(d.dataset.i), done = p.done_steps.slice(), curStep = p.current_step;
        if (done.indexOf(i) >= 0) done = done.filter(function (x) { return x !== i; });
        else if (curStep === i) { done.push(i); curStep = Math.min(7, i + 1); }
        else curStep = i;
        var r = await supabaseClient.from('design_projects').update({ done_steps: done.sort(), current_step: curStep }).eq('id', p.id);
        if (r.error) { fail(r.error); return; }
        p.done_steps = done; p.current_step = curStep; rProjects();
      } else if (b) {
        var pr = S.projects.find(function (x) { return x.id === b.dataset.p; });
        if (b.dataset.act === 'pstatus') {
          var ns = pr.status === 'done' ? 'active' : 'done';
          var r2 = await supabaseClient.from('design_projects').update({ status: ns }).eq('id', pr.id);
          if (r2.error) { fail(r2.error); return; } pr.status = ns; rProjects();
        } else if (b.dataset.act === 'pdel') {
          if (!confirm('Delete "' + pr.name + '"? Its hours stay on the log but lose the project name.')) return;
          var r3 = await supabaseClient.from('design_projects').delete().eq('id', pr.id);
          if (r3.error) { fail(r3.error); return; } await loadClient();
        }
      }
    };
  }

  function rPays() {
    var c = cur(), box = $('dzPays');
    box.innerHTML = '<div class="dz-row"><input id="dzPAmt" type="number" step="1" value="' + c.weekly_payment + '"><input id="dzPDate" type="date" value="' + today() + '"></div>' +
      '<input id="dzPNote" placeholder="How he paid (Zelle, cash...) optional">' +
      '<button class="dz-btn" id="dzPAdd" type="button" style="width:100%;margin-top:6px">Log payment received</button>' +
      '<div style="margin-top:10px">' + (S.pays.map(function (p) {
        return '<div class="dz-line"><span>' + money(p.amount) + ' <small>' + dfmt(p.paid_on) + (p.method ? ' &middot; ' + esc(p.method) : '') + '</small></span><button class="dz-btn alt sm" type="button" data-pd="' + p.id + '">Delete</button></div>';
      }).join('') || '<p class="field-hint">No payments yet.</p>') + '</div>';
    $('dzPAdd').onclick = async function () {
      var amt = Number($('dzPAmt').value);
      if (!(amt > 0)) { alert('Type the amount.'); return; }
      var r = await supabaseClient.from('design_payments').insert([{ client_id: S.cid, amount: amt, paid_on: $('dzPDate').value || today(), method: $('dzPNote').value.trim() || null }]);
      if (r.error) { fail(r.error); return; }
      await loadClient();
      // if he is all caught up, close the open invoices
      if (summary().balance <= 0.005) await supabaseClient.from('design_invoices').update({ status: 'paid', paid_on: today() }).eq('client_id', S.cid).neq('status', 'paid');
      await loadClient();
    };
    box.onclick = async function (e) {
      var b = e.target.closest('[data-pd]'); if (!b) return;
      if (!confirm('Delete this payment?')) return;
      var r = await supabaseClient.from('design_payments').delete().eq('id', b.dataset.pd);
      if (r.error) { fail(r.error); return; } await loadClient();
    };
  }

  // ---------- files ----------
  function slug(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 14) || 'PROJECT'; }
  function isLink(path) { return /^https?:\/\//i.test(path || ''); }
  function fileUrl(path) { return isLink(path) ? path : bucketUrl(path); }
  function bucketUrl(path) { return SUPABASE_URL + '/storage/v1/object/public/design-files/' + encodeURI(path); }
  function fileName(proj, stage, ver, ext) {
    var c = cur(), d = today().replace(/-/g, '');
    return c.code + '_' + slug(proj ? proj.name : '') + '_V' + ver + '_' + stage.toUpperCase() + '_' + d + '.' + ext;
  }
  function rFiles() {
    var box = $('dzFiles');
    var keep = { p: ($('dzFProj') || {}).value };
    box.innerHTML = '<div class="dz-row"><select id="dzFProj">' + projOptions(keep.p, true) + '</select>' +
      '<select id="dzFStage"><option>Concept</option><option>Mockup</option><option selected>Final</option></select>' +
      '<input id="dzFVer" type="number" min="1" value="1"></div>' +
      '<input id="dzFile" type="file" accept="image/*,.pdf">' +
      '<input id="dzFLink" type="url" placeholder="Or paste a Google Drive, iCloud or Dropbox link instead">' +
      '<p class="field-hint">A link uses no storage here. Make the Drive file "Anyone with the link can view", then paste it. On his page a Final link stays hidden until you Release it.</p>' +
      '<label class="field-hint"><input id="dzFMark" type="checkbox" checked style="width:auto"> Concept and Mockup: shrink and stamp PREVIEW so he can see it but not use it</label>' +
      '<p class="field-hint" id="dzFName">Name: pick a project and a file.</p>' +
      '<button class="dz-btn" id="dzFUp" type="button" style="width:100%">Upload</button>' +
      '<p class="field-hint">Final files stay LOCKED on his page until you tap Release. Name format: initials, project, version, stage, date.</p>' +
      '<div id="dzFList">' + (S.files.map(function (f) {
        var proj = S.projects.find(function (p) { return p.id === f.project_id; });
        return '<div class="dz-line"><span style="min-width:0;word-break:break-all"><b>' + esc(f.file_name) + '</b><small>' + (proj ? esc(proj.name) + ' &middot; ' : '') + f.stage + ' v' + f.version + (f.stage === 'Final' ? (f.released ? ' &middot; RELEASED' : ' &middot; LOCKED') : '') + '</small></span>' +
          '<span style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">' +
          (f.stage === 'Final' ? '<button class="dz-btn ' + (f.released ? 'alt' : 'red') + ' sm" type="button" data-fr="' + f.id + '">' + (f.released ? 'Lock' : 'Release') + '</button>' : '') +
          '<a class="dz-btn alt sm" href="' + esc(fileUrl(f.path)) + '" target="_blank" rel="noopener" style="text-decoration:none">Open</a>' +
          '<button class="dz-btn alt sm" type="button" data-fd="' + f.id + '">Delete</button></span></div>';
      }).join('') || '<p class="field-hint">No files yet.</p>') + '</div>';
    var upd = function () {
      var p = S.projects.find(function (x) { return x.id === $('dzFProj').value; }), fl = $('dzFile').files[0];
      var ext = fl ? (fl.name.split('.').pop() || 'png').toLowerCase() : 'png';
      $('dzFName').textContent = 'Name: ' + fileName(p, $('dzFStage').value, $('dzFVer').value || 1, $('dzFStage').value !== 'Final' && fl && /^image\//.test(fl.type) ? 'png' : ext);
    };
    ['dzFProj', 'dzFStage', 'dzFVer', 'dzFile', 'dzFLink'].forEach(function (id) { $(id).onchange = upd; $(id).oninput = upd; });
    upd();
    $('dzFUp').onclick = uploadFile;
    $('dzFList').onclick = async function (e) {
      var r = e.target.closest('[data-fr]'), d = e.target.closest('[data-fd]');
      if (r) {
        var f = S.files.find(function (x) { return x.id === r.dataset.fr; });
        if (!f.released && !confirm('Release ' + f.file_name + '? He can download it right away. Balance owed is ' + money(summary().balance) + '.')) return;
        var u = await supabaseClient.from('design_files').update({ released: !f.released }).eq('id', f.id);
        if (u.error) { fail(u.error); return; } f.released = !f.released; rFiles();
      } else if (d) {
        var g = S.files.find(function (x) { return x.id === d.dataset.fd; });
        if (!confirm('Delete ' + g.file_name + '?')) return;
        await supabaseClient.storage.from('design-files').remove([g.path]);
        var x = await supabaseClient.from('design_files').delete().eq('id', g.id);
        if (x.error) { fail(x.error); return; } await loadClient();
      }
    };
  }
  function stampPreview(file, mark) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var max = 1400, w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * k); h = Math.round(h * k);
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        var cx = cv.getContext('2d'); cx.drawImage(img, 0, 0, w, h);
        if (mark) {
          cx.save(); cx.translate(w / 2, h / 2); cx.rotate(-Math.PI / 6);
          var fs = Math.max(24, Math.round(w / 12)); cx.font = '800 ' + fs + 'px Arial'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
          for (var y = -h; y <= h; y += fs * 2.2) for (var x = -w; x <= w; x += fs * 7) {
            cx.fillStyle = 'rgba(255,255,255,.35)'; cx.fillText('PREVIEW', x + 2, y + 2);
            cx.fillStyle = 'rgba(0,0,0,.30)'; cx.fillText('PREVIEW', x, y);
          }
          cx.restore();
        }
        cv.toBlob(function (b) { b ? resolve(b) : reject(new Error('Could not process image')); }, 'image/png');
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
      img.src = url;
    });
  }
  async function uploadFile() {
    var pid = $('dzFProj').value, stage = $('dzFStage').value, ver = Number($('dzFVer').value) || 1, fl = $('dzFile').files[0];
    if (!pid) { alert('Pick the project.'); return; }
    var lk = ($('dzFLink').value || '').trim();
    var proj = S.projects.find(function (p) { return p.id === pid; });
    if (lk) {
      if (!isLink(lk)) { alert('The link must start with https://'); return; }
      var ext0 = fl ? (fl.name.split('.').pop() || 'png').toLowerCase() : 'png';
      var ins0 = await supabaseClient.from('design_files').insert([{ client_id: S.cid, project_id: pid, stage: stage, version: ver, file_name: fileName(proj, stage, ver, ext0), path: lk, released: false }]);
      if (ins0.error) { fail(ins0.error); return; }
      await loadClient(); toast('Link saved.'); return;
    }
    if (!fl) { alert('Choose a file or paste a link.'); return; }
    var isImg = /^image\//.test(fl.type), body = fl, ext = (fl.name.split('.').pop() || 'png').toLowerCase(), ctype = fl.type || 'application/octet-stream';
    var btn = $('dzFUp'); btn.disabled = true; btn.textContent = 'Uploading...';
    try {
      if (stage !== 'Final' && isImg) { body = await stampPreview(fl, $('dzFMark').checked); ext = 'png'; ctype = 'image/png'; }
      var path = S.cid + '/' + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)) + '.' + ext;
      var up = await supabaseClient.storage.from('design-files').upload(path, body, { contentType: ctype, upsert: false });
      if (up.error) throw up.error;
      var ins = await supabaseClient.from('design_files').insert([{ client_id: S.cid, project_id: pid, stage: stage, version: ver, file_name: fileName(proj, stage, ver, ext), path: path, released: false }]);
      if (ins.error) throw ins.error;
      await loadClient();
    } catch (err) { fail(err); }
    finally { btn.disabled = false; btn.textContent = 'Upload'; }
  }

  // ---------- invoices ----------
  function unbilled() { return S.time.filter(function (t) { return !t.running && !t.invoice_id && t.minutes > 0; }); }
  function rInvs() {
    var c = cur(), rows = unbilled(), box = $('dzInvs');
    var newMin = rows.reduce(function (a, r) { return a + r.minutes; }, 0);
    var pastOpen = Number(c.past_hours) > 0 && !c.past_invoice_id;
    box.innerHTML = '<p class="field-hint">Not on an invoice yet: ' + hrs(newMin + (pastOpen ? c.past_hours * 60 : 0)) + ' hours' + (pastOpen ? ' (includes ' + c.past_hours + ' earlier hours)' : '') + '.</p>' +
      '<button class="dz-btn" id="dzMakeInv" type="button" style="width:100%"' + (newMin || pastOpen ? '' : ' disabled') + '>Make invoice from unbilled hours</button>' +
      '<div style="margin-top:10px">' + (S.invs.map(function (i) {
        return '<div class="dz-line"><span><b>' + esc(i.number) + '</b> ' + money(i.total_due) + ' <span class="dz-tag">' + (i.status === 'paid' ? 'Paid' : 'Due') + '</span><small>' + dfmt(i.issued_on) + ' &middot; ' + (i.lines || []).length + ' lines</small></span>' +
          '<span style="display:flex;gap:4px"><button class="dz-btn alt sm" type="button" data-ie="' + i.id + '">Email</button><button class="dz-btn alt sm" type="button" data-ip="' + i.id + '">' + (i.status === 'paid' ? 'Mark due' : 'Mark paid') + '</button><button class="dz-btn alt sm" type="button" data-id="' + i.id + '">Delete</button></span></div>';
      }).join('') || '<p class="field-hint">No invoices yet.</p>') + '</div>';
    $('dzMakeInv').onclick = makeInvoice;
    box.onclick = async function (e) {
      var p = e.target.closest('[data-ip]'), d = e.target.closest('[data-id]'), em = e.target.closest('[data-ie]');
      if (em) {
        var iv0 = S.invs.find(function (x) { return x.id === em.dataset.ie; });
        emailHim('Invoice ' + iv0.number + ' from NOCIV', 'Hey ' + (cur().name || '').split(' ')[0] + ',\n\nInvoice ' + iv0.number + ' is ' + money(iv0.total_due) + '. Every hour and step is on your page:\n' + link(cur()) + '\n\nJasilyn\nNOCIV');
      } else if (p) {
        var inv = S.invs.find(function (x) { return x.id === p.dataset.ip; }), paid = inv.status !== 'paid';
        var r = await supabaseClient.from('design_invoices').update({ status: paid ? 'paid' : 'sent', paid_on: paid ? today() : null }).eq('id', inv.id);
        if (r.error) { fail(r.error); return; } await loadClient();
      } else if (d) {
        if (!confirm('Delete this invoice? Its hours go back to unbilled.')) return;
        var iv = S.invs.find(function (x) { return x.id === d.dataset.id; });
        if (cur().past_invoice_id === iv.id) await supabaseClient.from('design_clients').update({ past_invoice_id: null }).eq('id', S.cid).then(function () { cur().past_invoice_id = null; });
        var x = await supabaseClient.from('design_invoices').delete().eq('id', iv.id);
        if (x.error) { fail(x.error); return; } await loadClient();
      }
    };
  }
  async function makeInvoice() {
    var c = cur(), rows = unbilled(), lines = [], rate = Number(c.rate);
    var pastOpen = Number(c.past_hours) > 0 && !c.past_invoice_id;
    if (pastOpen) lines.push({ label: 'Past work' + (c.past_note ? ': ' + c.past_note : ''), hours: Number(c.past_hours), amount: round2(Number(c.past_hours) * rate) });
    var g = {};
    rows.forEach(function (t) {
      var pr = S.projects.find(function (p) { return p.id === t.project_id; }), k = (t.project_id || 'none') + '|' + t.step;
      g[k] = g[k] || { label: (pr ? pr.name : 'Design work') + ' - ' + STEPS[t.step - 1], min: 0 };
      g[k].min += t.minutes;
    });
    Object.keys(g).forEach(function (k) { lines.push({ label: g[k].label, hours: round2(g[k].min / 60), amount: round2(g[k].min / 60 * rate) }); });
    var newTotal = round2(lines.reduce(function (a, l) { return a + l.amount; }, 0));
    var s = summary();
    var carried = round2(s.balance - newTotal);
    if (Math.abs(carried) > 0.004) lines.push({ label: carried > 0 ? 'Balance carried from before' : 'Payments received, credit', hours: null, amount: carried });
    var total = round2(Math.max(0, s.balance));
    var num = c.code + '-' + String(S.invs.length + 1).padStart(3, '0');
    if (!confirm('Make invoice ' + num + ' for ' + money(total) + '? (New work ' + money(newTotal) + (carried ? ', carried/credit ' + money(carried) : '') + ')')) return;
    var r = await supabaseClient.from('design_invoices').insert([{ client_id: S.cid, number: num, issued_on: today(), lines: lines, subtotal: s.balance, credits: 0, total_due: total, status: total > 0 ? 'sent' : 'paid', paid_on: total > 0 ? null : today() }]).select();
    if (r.error) { fail(r.error); return; }
    var iid = r.data[0].id;
    if (rows.length) { var u = await supabaseClient.from('design_time').update({ invoice_id: iid }).in('id', rows.map(function (t) { return t.id; })); if (u.error) { fail(u.error); return; } }
    if (pastOpen) { var u2 = await supabaseClient.from('design_clients').update({ past_invoice_id: iid }).eq('id', S.cid); if (u2.error) { fail(u2.error); return; } c.past_invoice_id = iid; }
    await loadClient();
    toast('Invoice made. It is on his page.');
  }

  // ---------- log + settings ----------
  function rLog() {
    var box = $('dzLog');
    var rows = S.time.slice(0, 25);
    box.innerHTML = (rows.map(function (t) {
      var pr = S.projects.find(function (p) { return p.id === t.project_id; });
      return '<div class="dz-line"><span>' + dfmt(t.work_date) + ' &middot; step ' + t.step + ' ' + esc(STEPS[t.step - 1]) + '<small>' + (pr ? esc(pr.name) : '') + (t.note ? ' &middot; ' + esc(t.note) : '') + (t.invoice_id ? ' &middot; invoiced' : '') + '</small></span>' +
        '<span style="display:flex;gap:4px;align-items:center">' + (t.running ? '<span class="dz-tag">NOW</span>' : '<b>' + hm(t.minutes) + '</b><button class="dz-btn alt sm" type="button" data-te="' + t.id + '">Fix</button>') + '<button class="dz-btn alt sm" type="button" data-td="' + t.id + '">x</button></span></div>';
    }).join('') || '<p class="field-hint">Nothing logged yet.</p>');
    box.onclick = async function (e) {
      var ed = e.target.closest('[data-te]'), del = e.target.closest('[data-td]');
      if (ed) {
        var t = S.time.find(function (x) { return x.id === ed.dataset.te; });
        var v = prompt('Hours for this entry (like 1.5):', hrs(t.minutes)); if (v == null) return;
        var h = Number(v); if (!(h >= 0)) { alert('Type a number.'); return; }
        var r = await supabaseClient.from('design_time').update({ minutes: Math.round(h * 60) }).eq('id', t.id);
        if (r.error) { fail(r.error); return; } await loadClient();
      } else if (del) {
        if (!confirm('Delete this time entry?')) return;
        var r2 = await supabaseClient.from('design_time').delete().eq('id', del.dataset.td);
        if (r2.error) { fail(r2.error); return; } await loadClient();
      }
    };
  }
  function rSet() {
    var c = cur(), box = $('dzSet');
    box.innerHTML = '<div class="dz-row"><div><label class="field-hint">Name</label><input id="dsName" value="' + esc(c.name) + '"></div><div><label class="field-hint">Business</label><input id="dsBiz" value="' + esc(c.business || '') + '"></div></div>' +
      '<div class="dz-row"><div><label class="field-hint">File initials</label><input id="dsCode" value="' + esc(c.code) + '" maxlength="6"></div><div><label class="field-hint">Rate $/hr</label><input id="dsRate" type="number" step="0.5" value="' + c.rate + '"></div>' +
      '<div><label class="field-hint">Pays each Friday $</label><input id="dsWeekly" type="number" value="' + c.weekly_payment + '"></div></div>' +
      '<div class="dz-row"><div><label class="field-hint">Payments start</label><input id="dsStart" type="date" value="' + String(c.start_date).slice(0, 10) + '"></div><div><label class="field-hint">Earlier unpaid hours</label><input id="dsPast" type="number" step="0.25" value="' + c.past_hours + '"></div></div>' +
      '<input id="dsPastNote" placeholder="What the earlier work was" value="' + esc(c.past_note || '') + '">' +
      '<label class="field-hint">His email (for Email him)</label><input id="dsEmail" type="email" value="' + esc(c.email || '') + '">' +
      '<div class="dz-row" style="margin-top:8px"><button class="dz-btn" id="dsSave" type="button">Save settings</button><button class="dz-btn alt" id="dsNew" type="button">New private link</button><button class="dz-btn alt" id="dsDel" type="button">Delete client</button></div>' +
      '<p class="field-hint">New private link kills the old one. Use it if the link got shared by mistake.</p>';
    $('dsSave').onclick = async function () {
      var row = { name: $('dsName').value.trim() || c.name, business: $('dsBiz').value.trim() || null, code: ($('dsCode').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CL'), rate: Number($('dsRate').value) || 45, weekly_payment: Number($('dsWeekly').value) || 0, start_date: $('dsStart').value || c.start_date, past_hours: Number($('dsPast').value) || 0, past_note: $('dsPastNote').value.trim() || null, email: $('dsEmail').value.trim() || null };
      var r = await supabaseClient.from('design_clients').update(row).eq('id', c.id);
      if (r.error) { fail(r.error); return; }
      Object.assign(c, row); toast('Saved.'); shell(); await loadClient();
    };
    $('dsNew').onclick = async function () {
      if (!confirm('Make a new private link? The old one stops working.')) return;
      var tk = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '');
      var r = await supabaseClient.from('design_clients').update({ token: tk }).eq('id', c.id);
      if (r.error) { fail(r.error); return; } c.token = tk; rTop(); toast('New link ready. Copy it.');
    };
    $('dsDel').onclick = async function () {
      if (prompt('This deletes ALL of this client\'s hours, payments, files and invoices. Type DELETE to confirm.') !== 'DELETE') return;
      var r = await supabaseClient.from('design_clients').delete().eq('id', c.id);
      if (r.error) { fail(r.error); return; } S.cid = null; await loadClients();
    };
  }

  window.loadDesignAdmin = loadClients;
  window.__dz = S; // for tests
})();
