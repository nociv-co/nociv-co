/* From Scratch Studio. Free to use, change and share (MIT).
   Runs in the browser only. Edits a copy of your site and hands you a .zip.
   Nothing here can change your live site, so it needs no password. */
(function () {
'use strict';

var KEY = 'fromscratch-v1', ORIGIN = location.origin, GUIDE = 'https://nociv.co/scratch/#steps';
var D = null, pane = 'start', editTab = null, editItem = null, pvHash = null, mode = 'pick', URLS = {}, db = null, ready = false, timer = null;

function $(s, el) { return (el || document).querySelector(s); }
function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function rid() { return Math.random().toString(36).slice(2, 8); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function slug(s) { return String(s || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page'; }

/* color math, same as the site engine */
function hex(h) { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function lum(h) { var w = [0.2126, 0.7152, 0.0722]; return hex(h).reduce(function (a, v, i) { v /= 255; v = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); return a + v * w[i]; }, 0); }
function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function onColor(bg) { return ratio(bg, '#000') >= ratio(bg, '#fff') ? '#000000' : '#ffffff'; }

/* ---------- starting points ---------- */
var TYPES = {
  home:    ['Home', 'A big welcome and a tile for every page.'],
  grid:    ['Items', 'Products or work. Each one gets its own page.'],
  page:    ['Page', 'Words and a photo. About, story, FAQ.'],
  gallery: ['Gallery', 'Photos only. Tap to view big.'],
  links:   ['Links', 'A list of big buttons to anywhere.'],
  contact: ['Contact', 'How to reach you.'],
  log:     ['Log', 'Dated entries, newest first. Document anything.'],
  finds:   ['Finds', 'Curated things from around the internet, each with its link.'],
  tracks:  ['Tracks', 'Beats, songs or packs with a play button and a buy button.']
};
var LISTY = { grid: 1, log: 1, finds: 1, tracks: 1 };
var T_ICON = { home: 'home', grid: 'grid', page: 'page', gallery: 'image', links: 'link', contact: 'mail', log: 'page', finds: 'star', tracks: 'play' };
function ico(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || ICONS.star) + '</svg>'; }
function today(off) { var d = new Date(Date.now() - (off || 0) * 864e5); return d.toISOString().slice(0, 10); }
function lit(title, date, text) { var x = it(title, '', '', text); x.date = date; return x; }
function fnd(title, link, tag, text) { var x = it(title, '', tag, text); x.buy = link; return x; }
var ICONS = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>', grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>', image: '<rect x="3" y="4" width="18" height="16" rx="1"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>',
  page: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7M9 8h3"/>', link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/>', star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>', play: '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>'
};
var ICON_NAMES = Object.keys(ICONS);
var PALETTES = [
  ['Paper', '#fafaf7', '#141414', '#141414'], ['Ink', '#111111', '#f4f4f0', '#ffd23f'], ['Clay', '#f3ece2', '#2a1f17', '#b5482d'],
  ['Moss', '#eef1e8', '#1e2a1c', '#3f6b3a'], ['Ocean', '#eaf2f8', '#0e2233', '#1f6feb'], ['Night', '#0f1115', '#f2f2f2', '#7cf29a'],
  ['Blush', '#fbeff0', '#2b1418', '#d6336c'], ['Mono', '#ffffff', '#000000', '#000000'],
  ['Denim', '#1f2f45', '#f2ecd6', '#e0a240'], ['Poster', '#f2c230', '#141414', '#141414'], ['Linen', '#f6f1e9', '#22201c', '#7a5c3e'], ['Lime', '#d7ff3b', '#0f0f0f', '#0f0f0f'],
  ['Peach', '#ffe9dc', '#3a1d12', '#e2553d'], ['Midnight', '#0e1726', '#eef2f7', '#9cc4ff'], ['Ember', '#1a1210', '#f6e6dc', '#ff6a3d'], ['Electric', '#1d1dff', '#ffffff', '#f2ff3b']
];
/* ---------- looks: 30 ready-made looks in 6 families. Applying one keeps every word, photo and page. ---------- */
var FONT_H = { clean: 'system-ui,sans-serif', editorial: '"FS Fraunces",Georgia,serif', poster: 'Impact,"Arial Narrow Bold",sans-serif', type: '"FS IBM Plex Mono",Menlo,monospace', soft: '"FS Nunito",ui-rounded,sans-serif',
  grotesk: '"FS Inter Tight","Helvetica Neue",sans-serif', didone: '"FS DM Serif Display",Didot,Georgia,serif', slab: '"FS Roboto Slab",Rockwell,serif', condensed: '"FS Barlow Condensed","Arial Narrow",sans-serif', humanist: '"FS Tenor Sans",Optima,sans-serif', marker: '"FS Permanent Marker","Marker Felt",sans-serif', space: '"FS Space Grotesk",system-ui,sans-serif', block: '"FS Archivo Black","Arial Black",sans-serif', gallery: '"FS Syne",sans-serif', bricolage: '"FS Bricolage",sans-serif', journal: '"FS Instrument Serif",Georgia,serif', typed: '"FS Special Elite","Courier New",monospace', mono: '"FS Rubik Mono One",monospace' };
var FONT_W = { poster: 400, didone: 400, marker: 400, humanist: 400, grotesk: 800, condensed: 700, editorial: 700, type: 600, slab: 800, soft: 800, space: 700, block: 400, gallery: 800, bricolage: 800, journal: 400, typed: 400, mono: 400 };
var LOOK_KEYS = ['font', 'bg', 'text', 'accent', 'corner', 'density', 'header', 'layout', 'photo', 'btn', 'case', 'tex', 'card', 'motion'];
var LOOKS = {
  Clean: [['Gallery White', 'clean,#ffffff,#111111,#111111,sharp,comfy,left,grid,natural,outline,normal,none,plain,fade'], ['Soft Paper', 'humanist,#fafaf7,#1b1b1b,#2f6db5,soft,comfy,center,grid,portrait,solid,normal,none,plain,fade'],
    ['Swiss', 'space,#f4f4f2,#0a0a0a,#d92d20,sharp,compact,stack,list,square,solid,upper,grid,plain,slide'], ['Air', 'clean,#eef3f7,#10202e,#1f5fd6,round,comfy,left,grid,landscape,pill,normal,none,shadow,rise'],
    ['Linen', 'didone,#f6f1e9,#22201c,#22201c,sharp,comfy,center,masonry,natural,underline,normal,grain,plain,fade']],
  Street: [['Stencil', 'condensed,#e9e6df,#141414,#b83a2a,sharp,compact,stack,grid,portrait,solid,upper,grain,tape,slide'], ['Denim', 'grotesk,#1f2f45,#f2ecd6,#e0a240,soft,compact,left,grid,square,solid,upper,none,border,slide'],
    ['Sticker', 'marker,#fffbe8,#141414,#d1287a,round,comfy,center,grid,square,pill,normal,dots,shadow,zoom'], ['Concrete', 'condensed,#c9c6bf,#111111,#111111,sharp,compact,stack,list,landscape,outline,upper,grain,border,rise'],
    ['Skate', 'block,#141414,#f4f4f0,#f2c230,soft,compact,left,masonry,natural,solid,upper,none,tape,zoom']],
  Editorial: [['Magazine', 'didone,#ffffff,#111111,#b42318,sharp,comfy,stack,masonry,natural,underline,normal,none,plain,rise'], ['Archive', 'journal,#f3f1ec,#1d1d1b,#b23d0b,sharp,comfy,stack,masonry,natural,underline,normal,none,plain,rise'],
    ['Newsprint', 'editorial,#ecebe6,#1a1a1a,#1a1a1a,sharp,compact,center,list,landscape,outline,upper,lines,plain,fade'], ['Typewriter', 'typed,#f7f4ec,#222222,#2f5d8a,sharp,comfy,left,list,square,underline,normal,lines,plain,none'],
    ['Gallery Night', 'gallery,#121212,#f1efe9,#c9a96e,sharp,comfy,center,grid,portrait,outline,upper,none,plain,fade']],
  Warm: [['Clay', 'humanist,#f3ece2,#2a1f17,#a8432a,soft,comfy,left,grid,portrait,solid,normal,grain,plain,fade'], ['Market', 'slab,#fff6e5,#2b1d10,#2f7d4a,soft,comfy,center,list,square,solid,normal,none,border,rise'],
    ['Peach', 'soft,#ffe9dc,#3a1d12,#c4432c,round,comfy,center,grid,square,pill,normal,dots,shadow,zoom'], ['Olive', 'editorial,#eef0e3,#20251a,#4f5d27,soft,comfy,left,masonry,natural,outline,normal,grain,plain,fade'],
    ['Cocoa', 'humanist,#2b1d16,#f6ead8,#e0a240,soft,comfy,stack,grid,portrait,solid,normal,none,shadow,fade']],
  Loud: [['Poster', 'block,#f2c230,#141414,#141414,sharp,compact,stack,grid,square,solid,upper,none,border,zoom'], ['Signal', 'grotesk,#ffffff,#0a0a0a,#d92d20,sharp,compact,stack,grid,square,solid,upper,none,border,slide'],
    ['Electric', 'mono,#1d1dff,#ffffff,#f2ff3b,sharp,compact,stack,grid,square,solid,upper,none,plain,zoom'], ['Bubblegum', 'bricolage,#ffd6ec,#2a0f1f,#7a1fd1,round,comfy,center,grid,square,pill,normal,dots,shadow,zoom'],
    ['Lime', 'condensed,#d7ff3b,#0f0f0f,#0f0f0f,round,compact,left,grid,square,pill,upper,none,plain,slide']],
  Night: [['Ink', 'clean,#111111,#f4f4f0,#ffd23f,soft,comfy,left,grid,square,solid,normal,none,plain,fade'], ['Neon', 'space,#0f1115,#f2f2f2,#7cf29a,round,compact,left,grid,square,pill,normal,grid,plain,slide'],
    ['Midnight', 'didone,#0e1726,#eef2f7,#9cc4ff,sharp,comfy,center,masonry,natural,outline,normal,none,plain,rise'], ['Ember', 'slab,#1a1210,#f6e6dc,#ff6a3d,soft,compact,stack,grid,portrait,solid,upper,grain,shadow,fade'],
    ['Studio Black', 'condensed,#0a0a0a,#ffffff,#ffffff,sharp,compact,stack,list,landscape,outline,upper,none,border,slide']]
};
var LOOK_FAMS = Object.keys(LOOKS);
var KIND_ICON = {"shop": "<path d=\"M5 8h14l-1 13H6z\"/><path d=\"M9 8V6a3 3 0 0 1 6 0v2\"/>", "archive": "<rect x=\"3\" y=\"4\" width=\"18\" height=\"5\" rx=\"1\"/><path d=\"M5 9v11h14V9\"/><path d=\"M10 13h4\"/>", "app": "<rect x=\"6\" y=\"2.5\" width=\"12\" height=\"19\" rx=\"3\"/><path d=\"M10.5 18.5h3\"/>", "music": "<path d=\"M9 18V5l11-2v13\"/><circle cx=\"6.5\" cy=\"18\" r=\"2.5\"/><circle cx=\"17.5\" cy=\"16\" r=\"2.5\"/>", "food": "<path d=\"M4 11h16a8 8 0 0 1-16 0z\"/><path d=\"M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5\"/>", "event": "<path d=\"M4 7a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4z\"/><path d=\"M14 5v14\" stroke-dasharray=\"2 2\"/>", "links": "<path d=\"M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1\"/><path d=\"M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1\"/>", "blank": "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"1.5\" stroke-dasharray=\"3 2.5\"/><path d=\"M12 9v6M9 12h6\"/>"};
var KINDS = [["shop", "Shop", "Sell your stuff"], ["archive", "Archive", "Finds, beats or a log"], ["app", "App", "Feels like a phone app"], ["music", "Music", "Songs, shows, links"], ["food", "Food", "Menu, hours, orders"], ["event", "Event", "One date, tickets"], ["links", "Links", "One page of buttons"], ["blank", "Blank", "Start empty"]];
// each kind opens to picture tiles: [template, look ("Family:index" or null), name]
var VARIANTS = {
  shop: [['shop', null, 'Corner store'], ['shop', 'Street:0', 'Stencil'], ['shop', 'Night:0', 'Ink'], ['shop', 'Clean:0', 'Gallery']],
  archive: [['archive', null, 'Finds'], ['archiveProducer', null, 'Producer'], ['archiveLog', null, 'Log']],
  app: [['app', null, 'Pocket'], ['app', 'Loud:3', 'Bubblegum'], ['app', 'Clean:3', 'Air'], ['app', 'Night:1', 'Neon']],
  music: [['music', null, 'Record'], ['music', 'Loud:2', 'Electric'], ['music', 'Editorial:4', 'Gallery night'], ['music', 'Street:4', 'Skate']],
  food: [['food', null, 'Kitchen'], ['food', 'Warm:2', 'Peach'], ['food', 'Night:3', 'Ember'], ['food', 'Editorial:2', 'Newsprint']],
  event: [['event', null, 'Night market'], ['event', 'Street:2', 'Sticker'], ['event', 'Night:1', 'Neon'], ['event', 'Clean:2', 'Swiss']],
  links: [['links', null, 'Bubble'], ['links', 'Clean:0', 'Gallery'], ['links', 'Street:1', 'Denim'], ['links', 'Night:2', 'Midnight']],
  blank: [['blank', null, 'Blank']]
};
function kindOf(preset) { if (!preset) return 'shop'; if (/^archive/.test(preset)) return 'archive'; return VARIANTS[preset] ? preset : 'shop'; }
function variantStyle(v) { var st = clone(PRESETS[v[0]]().style); if (v[1]) { var f = v[1].split(':'); Object.assign(st, lookStyle(LOOKS[f[0]][+f[1]][1])); } return st; }

function lookStyle(spec) { var v = spec.split(','), o = {}; LOOK_KEYS.forEach(function (k, i) { o[k] = v[i]; }); return o; }
function lookTile(name, st, act, v) {
  var bt = st.btn === 'outline' || st.btn === 'underline' ? 'background:transparent;border:2px solid ' + (st.btn === 'underline' ? 'transparent;border-bottom-color:' + st.accent : st.text) : 'background:' + st.accent + ';border:2px solid ' + st.accent;
  var tex = { grid: 'background-image:linear-gradient(rgba(127,127,127,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(127,127,127,.18) 1px,transparent 1px);background-size:10px 10px;', lines: 'background-image:repeating-linear-gradient(transparent 0 11px,rgba(127,127,127,.22) 11px 12px);', dots: 'background-image:radial-gradient(rgba(127,127,127,.35) 1px,transparent 1.3px);background-size:8px 8px;' }[st.tex] || '';
  var r = { sharp: '0', soft: '5px', round: '12px' }[st.corner] || '5px';
  var cards = '<span class="lk-c"><i style="border-radius:' + r + ';background:' + st.text + '"></i><i style="border-radius:' + r + ';background:' + st.text + '"></i></span>';
  return '<button type="button" class="lk" data-act="' + act + '" data-v="' + v + '" style="background-color:' + st.bg + ';color:' + st.text + ';' + tex + '">' +
    '<span class="lk-h" style="font-family:' + esc(FONT_H[st.font] || FONT_H.clean) + ';font-weight:' + (FONT_W[st.font] || 800) + ';' + (st.case === 'upper' ? 'text-transform:uppercase;' : '') + '">Aa</span>' +
    '<span class="lk-b" style="' + bt + ';border-radius:' + (st.btn === 'pill' ? '99px' : st.btn === 'underline' ? '0' : r) + '"></span>' + cards + '<small>' + esc(name) + '</small></button>';
}
function shuffleStyle(cur) {
  var pals = PALETTES.map(function (p) { return p.slice(1); });
  LOOK_FAMS.forEach(function (f) { LOOKS[f].forEach(function (l) { var x = lookStyle(l[1]); pals.push([x.bg, x.text, x.accent]); }); });
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  for (var n = 0; n < 40; n++) {
    var p = pick(pals), o = Object.assign({}, cur, {
      bg: p[0], text: p[1], accent: p[2], font: pick(Object.keys(FONT_H)), btn: pick(['solid', 'solid', 'outline', 'pill', 'underline']),
      case: pick(['normal', 'normal', 'upper']), tex: pick(['none', 'none', 'none', 'grain', 'grid', 'lines', 'dots']), card: pick(['plain', 'plain', 'border', 'shadow', 'tape']), corner: pick(['sharp', 'soft', 'round'])
    });
    if (o.bg === cur.bg && o.font === cur.font) continue;
    if (ratio(o.bg, o.text) >= 4.5 && ratio(o.accent, onColor(o.accent)) >= 4.5 && (o.btn === 'solid' || o.btn === 'pill' ? ratio(o.accent, o.bg) >= 1.6 : true)) return o;
  }
  return cur;
}

function it(title, price, tag, text) { return { id: rid(), title: title, price: price || '', tag: tag || '', text: text || '', images: [], buy: '', soldout: false }; }
function tab(type, name, extra) { var t = { id: rid(), type: type, name: name || TYPES[type][0], intro: '', items: [] }; for (var k in extra) t[k] = extra[k]; return t; }
var SHIP = { currency: 'USD', shipping: 'Ships in 3 to 5 business days. US only for now.', returns: 'Unused items can come back within 30 days. Email us first.' };
var PRESETS = {
  shop: function () { return { v: 1, base: 'shop', name: 'Corner Store', tagline: 'Small batch goods, made by hand.', notice: 'Free shipping on orders over $50', email: '', footer: '', domain: '', description: '', logo: '', shareImage: '',
    style: { nav: 'tabs', motion: 'fade', font: 'clean', bg: '#fafaf7', text: '#141414', accent: '#141414', corner: 'soft', density: 'comfy', header: 'left', layout: 'grid', photo: 'portrait' },
    shop: clone(SHIP),
    tabs: [tab('home', 'Home', { headline: 'Made slow. Sold direct.', intro: 'Small runs. When it is gone, it is gone.', button: 'Shop now', buttonTo: 1 }),
      tab('grid', 'Shop', { intro: 'Everything we have right now.', items: [it('Logo Tee', '32', 'Tees', 'Heavy cotton. Printed by hand.\n\nFits true to size.'), it('Pocket Tee', '30', 'Tees'), it('Poster No. 1', '20', 'Prints', '18 x 24 in. Signed.'), it('Sticker Pack', '8', 'Extras')] }),
      tab('page', 'About', { body: 'Tell people who you are and why you make what you make.\n\n# How it started\nOne paragraph is enough. People buy from people.' }),
      tab('contact', 'Contact', { body: 'Questions, custom orders or wholesale. We answer every email.' })] }; },
  archive: function () { return { v: 1, base: 'archive', name: 'Found Things', tagline: 'Things I keep coming back to.', notice: '', email: '', footer: '', domain: '', description: '', logo: '', shareImage: '',
    style: Object.assign({ nav: 'side' }, lookStyle('gallery,#f4f1ea,#161616,#2a46d6,sharp,comfy,stack,masonry,natural,underline,normal,none,plain,rise')),
    shop: clone(SHIP),
    tabs: [tab('finds', 'Finds', { intro: 'Collected from around the internet. Tap one to see where it lives.', items: [fnd('Bus stops of the 1970s', 'https://example.com', 'Photo', 'A whole archive of concrete bus shelters. Every one is different.'), fnd('Hand painted shop signs', 'https://example.com', 'Type', 'Letters nobody will ever paint the same way again.'), fnd('An old synth manual', 'https://example.com', 'Sound', 'The diagrams alone are worth it.'), fnd('A zine library, scanned', 'https://example.com', 'Print', 'Hundreds of zines, free to read.')] }),
      tab('log', 'Notes', { items: [lit('Why I keep this', today(2), 'Things worth seeing get buried fast. This is where I keep them.')] }),
      tab('page', 'About', { body: 'What you collect and why. One short paragraph.' }),
      tab('links', 'Elsewhere', { items: [{ id: rid(), title: 'Email me a find', buy: 'mailto:you@example.com', images: [] }] })] }; },
  archiveProducer: function () { return { v: 1, base: 'archive', name: 'Producer Name', tagline: 'Beats, packs and leftovers from the studio.', notice: '', email: '', footer: '', domain: '', description: '', logo: '', shareImage: '',
    style: Object.assign({ nav: 'tabs' }, lookStyle('space,#0d0d0d,#f2f2f2,#ff5c00,soft,compact,left,list,square,solid,upper,grain,plain,slide')),
    shop: clone(SHIP),
    tabs: [tab('tracks', 'Beats', { intro: 'Tap play to hear it. Buy to get the files.', items: [it('Night Drive', '30', 'Beat', '92 BPM, A minor. Lease or exclusive.'), it('Dust Kit', '25', 'Sample pack', '120 one shots and 40 loops.'), it('Warm Tape', '30', 'Beat', '84 BPM, F major.'), it('Studio Tee', '28', 'Merch', 'Heavy cotton. Printed by hand.')] }),
      tab('gallery', 'Studio', { intro: 'Where it gets made.', items: [it('Desk'), it('Gear'), it('Late night')] }),
      tab('contact', 'Work with me', { body: 'Custom beats, mixing and collabs. Tell me what you are working on.' })] }; },
  archiveLog: function () { return { v: 1, base: 'archive', name: 'Field Log', tagline: 'Documenting one thing, week by week.', notice: '', email: '', footer: '', domain: '', description: '', logo: '', shareImage: '',
    style: Object.assign({ nav: 'tabs' }, lookStyle('typed,#f3efe6,#222222,#2f5d8a,sharp,comfy,left,list,natural,underline,normal,lines,plain,fade')),
    shop: clone(SHIP),
    tabs: [tab('log', 'Log', { intro: 'Newest first.', items: [lit('Week 3: the roof', today(0), 'The roof came off today. You can see the old beams for the first time.'), lit('Week 2: first walls down', today(7), 'Two walls gone. The light changed the whole room.'), lit('Week 1: before', today(14), 'Taking pictures of everything before it changes.')] }),
      tab('gallery', 'Photos', { items: [it('Before'), it('During'), it('Detail')] }),
      tab('page', 'About', { body: 'What you are documenting, where, and why it matters to you.' })] }; },
  app: function () { return { v: 1, base: 'app', name: 'Pocket', tagline: 'Everything in one place.', notice: '', email: '', footer: '', domain: '', description: '', logo: '', shareImage: '',
    style: { nav: 'bottom', motion: 'slide', font: 'soft', bg: '#0f1115', text: '#f2f2f2', accent: '#7cf29a', corner: 'round', density: 'compact', header: 'left', layout: 'grid', photo: 'square' },
    shop: clone(SHIP),
    tabs: [tab('home', 'Home', { icon: 'home', headline: 'Hey.', intro: 'New drops every month. Tap around.', button: 'See drops', buttonTo: 1 }),
      tab('grid', 'Drops', { icon: 'bag', items: [it('Drop 01', '25', 'Now'), it('Drop 02', '25', 'Now'), it('Drop 00', '20', 'Past')] }),
      tab('gallery', 'Feed', { icon: 'image', items: [it('Today'), it('Studio'), it('Show')] }),
      tab('links', 'Links', { icon: 'link', items: [{ id: rid(), title: 'My music', buy: 'https://example.com', images: [] }, { id: rid(), title: 'Newsletter', buy: 'https://example.com', images: [] }] }),
      tab('page', 'Me', { icon: 'user', body: 'Who you are, in two lines.' })] }; },
  music: function () { return { v: 1, base: 'music', name: 'Band Name', tagline: 'New record out now.', notice: '', email: '', footer: '', domain: '', description: '', logo: '', shareImage: '',
    style: Object.assign({ nav: 'tabs' }, lookStyle('condensed,#0f0f0f,#f4f4f0,#ff3b30,sharp,compact,stack,grid,square,solid,upper,grain,plain,slide')),
    shop: clone(SHIP),
    tabs: [tab('home', 'Home', { headline: 'New record out now.', intro: 'Listen everywhere. See us live.', button: 'Listen', buttonTo: 3 }),
      tab('grid', 'Music', { items: [it('First Album', '', 'Album', 'Released 2026. 10 songs.'), it('Night EP', '', 'EP'), it('Single', '', 'Single')] }),
      tab('page', 'Shows', { body: '# Coming up\nMar 14, The Venue, City\nApr 2, Backyard show, City\n\n# Past\nDec 9, Record store set, City' }),
      tab('links', 'Listen', { items: [{ id: rid(), title: 'Bandcamp', buy: 'https://example.com', images: [] }, { id: rid(), title: 'Apple Music', buy: 'https://example.com', images: [] }, { id: rid(), title: 'Spotify', buy: 'https://example.com', images: [] }] }),
      tab('contact', 'Booking', { body: 'Shows, press and collabs.' })] }; },
  food: function () { return { v: 1, base: 'food', name: 'Corner Kitchen', tagline: 'Open Tue to Sun, 11 to 8.', notice: 'Call ahead for big orders', email: '', footer: '', domain: '', description: '', logo: '', shareImage: '',
    style: Object.assign({ nav: 'tabs' }, lookStyle('slab,#fff6e5,#2b1d10,#2f7d4a,soft,comfy,center,list,square,solid,normal,none,border,rise')),
    shop: clone(SHIP),
    tabs: [tab('home', 'Home', { headline: 'Made fresh, every day.', intro: 'Order at the window or call ahead.', button: 'See the menu', buttonTo: 1 }),
      tab('grid', 'Menu', { intro: 'Prices include tax.', items: [it('Street Tacos', '3', 'Mains', 'Corn tortilla, onion, cilantro.'), it('Big Burrito', '11', 'Mains'), it('Elote', '5', 'Sides'), it('Agua Fresca', '4', 'Drinks')] }),
      tab('page', 'Hours', { body: 'Tue to Fri: 11 to 8\nSat and Sun: 10 to 9\nClosed Mondays\n\n# Find us\nStreet name, City' }),
      tab('contact', 'Catering', { body: 'Parties, offices and events. Tell us the date and how many people.' })] }; },
  event: function () { return { v: 1, base: 'event', name: 'Night Market', tagline: 'Sat, May 3. 6 to 11 pm.', notice: '', email: '', footer: '', domain: '', description: '', logo: '', shareImage: '',
    style: Object.assign({ nav: 'tabs' }, lookStyle('grotesk,#f2c230,#141414,#141414,sharp,compact,stack,grid,landscape,solid,upper,none,border,zoom')),
    shop: clone(SHIP),
    tabs: [tab('home', 'Home', { headline: 'One night only.', intro: 'Food, music and 40 local makers.', button: 'Get tickets', buttonTo: 3 }),
      tab('page', 'Schedule', { body: '# Saturday\n6 pm, Doors\n7 pm, DJ set\n9 pm, Live band\n11 pm, Lights out' }),
      tab('grid', 'Vendors', { items: [it('Maker One', '', 'Food'), it('Maker Two', '', 'Art'), it('Maker Three', '', 'Clothes'), it('Maker Four', '', 'Art')] }),
      tab('links', 'Tickets', { items: [{ id: rid(), title: 'Get tickets', buy: 'https://example.com', images: [] }, { id: rid(), title: 'Become a vendor', buy: 'https://example.com', images: [] }] }),
      tab('gallery', 'Last year', { items: [it('Crowd'), it('Stage'), it('Stalls')] })] }; },
  links: function () { return { v: 1, base: 'links', name: 'Your Name', tagline: 'Artist. Your city.', notice: '', email: '', footer: '', domain: '', description: '', logo: '', shareImage: '',
    style: Object.assign({ nav: 'tabs' }, lookStyle('soft,#ffd6ec,#2a0f1f,#7a1fd1,round,comfy,center,list,square,pill,normal,dots,shadow,zoom')),
    shop: clone(SHIP),
    tabs: [tab('links', 'Links', { intro: 'Everything I do, in one place.', items: [{ id: rid(), title: 'New drop', buy: 'https://example.com', images: [] }, { id: rid(), title: 'My shop', buy: 'https://example.com', images: [] }, { id: rid(), title: 'Mailing list', buy: 'https://example.com', images: [] }, { id: rid(), title: 'Book me', buy: 'mailto:you@example.com', images: [] }] }),
      tab('page', 'About', { body: 'Two lines about you. What you make and where.' })] }; },
  blank: function () { return { v: 1, base: 'shop', name: '', tagline: '', notice: '', email: '', footer: '', domain: '', description: '', logo: '', shareImage: '',
    style: { nav: 'tabs', motion: 'fade', font: 'clean', bg: '#ffffff', text: '#111111', accent: '#111111', corner: 'soft', density: 'comfy', header: 'left', layout: 'grid', photo: 'square' },
    shop: clone(SHIP), tabs: [tab('home', 'Home', { headline: 'Hello', button: '', buttonTo: null })] }; }
};
var BASES = [
  ['shop', 'Shop', 'Sell anything. Home, product pages, shipping info, buy buttons.'],
  ['archive', 'Archive', 'Three versions: Finds (curated things with links), Producer (beats and packs with a play button), Log (dated entries documenting something).'],
  ['app', 'App', 'Feels like a phone app. Bottom bar, cards, dark mode.'],
  ['music', 'Music', 'Releases, shows, where to listen, booking.'],
  ['food', 'Food', 'Menu with prices, hours, catering. For a truck, cart or kitchen.'],
  ['event', 'Event', 'One date. Schedule, vendors, tickets, photos.'],
  ['links', 'Links', 'One page of big buttons. Put it in your bio or on a sticker.'],
  ['blank', 'Blank', 'One empty page. Build it your way.']
];

/* ---------- storage ---------- */
function idb() {
  return new Promise(function (res) {
    try {
      var r = indexedDB.open('fromscratch', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('img'); };
      r.onsuccess = function () { db = r.result; res(db); };
      r.onerror = function () { res(null); };
    } catch (e) { res(null); }
  });
}
function idbDo(mode, fn) { return new Promise(function (res) { if (!db) return res(null); var tx = db.transaction('img', mode), st = tx.objectStore('img'), out = fn(st); tx.oncomplete = function () { res(out && out.result); }; tx.onerror = function () { res(null); }; }); }
function putImg(k, blob) { return idbDo('readwrite', function (s) { return s.put(blob, k); }); }
function loadImgs() {
  return new Promise(function (res) {
    if (!db) return res();
    var tx = db.transaction('img', 'readonly'), req = tx.objectStore('img').openCursor();
    req.onsuccess = function () { var c = req.result; if (c) { URLS[c.key] = URL.createObjectURL(c.value); c.continue(); } else res(); };
    req.onerror = function () { res(); };
  });
}
function getBlob(k) { return idbDo('readonly', function (s) { return s.get(k); }); }

function save() {
  D._touched = true;
  try { localStorage.setItem(KEY, JSON.stringify(D)); flash('Saved'); } catch (e) { flash('Not saved, storage full'); }
  clearTimeout(timer); timer = setTimeout(push, 90);
}
function flash(t) { var s = $('#saved'); if (!s) return; s.textContent = t; s.classList.add('on'); clearTimeout(flash.t); flash.t = setTimeout(function () { s.classList.remove('on'); }, 900); }

/* ---------- preview ---------- */
function vis() { return D.tabs.filter(function (t) { return !t.hidden; }); }
function slugOf(ti) {
  var t = D.tabs[ti]; if (!t || t.hidden) return null;
  var seen = {}, out = null;
  vis().forEach(function (x) { var s = slug(x.name), b = s, n = 2; while (seen[s]) s = b + '-' + n++; seen[s] = 1; if (x === t) out = s; });
  return out;
}
function hashFor() {
  if (pvHash) return pvHash;
  if (editTab == null) return null;
  var s = slugOf(editTab); if (!s) return null;
  var t = D.tabs[editTab];
  if (editItem != null && LISTY[t.type] && t.items[editItem]) return '#/' + s + '/' + t.items[editItem].id;
  return '#/' + s;
}
function markFor() {
  if (pane === 'info') return { kind: 'site', label: 'Site: ' + (D.name || 'name') };
  if (pane !== 'pages' || editTab == null || !D.tabs[editTab]) return null;
  var t = D.tabs[editTab], sl = slugOf(editTab); if (!sl) return null;
  var x = editItem != null && t.items && t.items[editItem];
  return x ? { kind: 'item', slug: sl, item: x.id, label: 'Item: ' + (x.title || 'Untitled') } : { kind: 'tab', slug: sl, label: 'Page: ' + (t.name || 'Untitled') };
}
function post(m) { if (ready) try { $('#pv').contentWindow.postMessage(m, ORIGIN); } catch (e) {} }
function push() { if (!ready || !D) return; post({ type: 'site', site: D, images: URLS, hash: hashFor(), mark: markFor() }); post({ type: 'mode', pick: mode === 'pick' }); }
window.addEventListener('message', function (e) {
  if (e.origin !== ORIGIN || !e.data) return;
  if (e.data.type === 'ready') { ready = true; push(); return; }
  if (e.data.type === 'pick') {
    var d = e.data; pvHash = d.hash || null;
    if (d.kind === 'site') { pane = 'info'; editTab = editItem = null; }
    else {
      var ti = -1; D.tabs.forEach(function (t, i) { if (slugOf(i) === d.slug) ti = i; });
      if (ti < 0) return;
      pane = 'pages'; editTab = ti; editItem = null;
      if (d.item) (D.tabs[ti].items || []).forEach(function (x, j) { if (x.id === d.item) editItem = j; });
    }
    draw(true); $('.st-ed').scrollTop = 0;
  }
});

function demoMotion() {
  var list = vis(), i = 0;
  (function step() {
    if (i > Math.min(list.length, 4)) return;
    var ti = D.tabs.indexOf(list[i % list.length]);
    $('#pv').contentWindow.postMessage({ type: 'go', hash: '#/' + slugOf(ti) }, ORIGIN);
    i++; setTimeout(step, 750);
  })();
}

/* ---------- data paths ---------- */
function get(p) { return p.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, D); }
function set(p, v) { var ks = p.split('.'), o = D; for (var i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null) o[ks[i]] = {}; o = o[ks[i]]; } o[ks[ks.length - 1]] = v; }
function url(p) { return URLS[p] || p; }

/* ---------- form helpers ---------- */
function fld(label, p, o) {
  o = o || {}; var v = get(p); v = v == null ? '' : v;
  var id = 'f' + p.replace(/\W/g, '_');
  var inp = o.area ? '<textarea id="' + id + '" data-b="' + p + '" rows="' + (o.rows || 4) + '" placeholder="' + esc(o.ph || '') + '">' + esc(v) + '</textarea>'
    : '<input id="' + id + '" data-b="' + p + '" type="' + (o.type || 'text') + '" value="' + esc(v) + '" placeholder="' + esc(o.ph || '') + '"' + (o.mode ? ' inputmode="' + o.mode + '"' : '') + (o.max ? ' maxlength="' + o.max + '"' : '') + ' autocomplete="off" autocapitalize="' + (o.type === 'url' || o.type === 'email' ? 'off' : 'sentences') + '">';
  return '<div class="f"><label for="' + id + '">' + label + '</label>' + inp + (o.help ? '<p class="help">' + o.help + '</p>' : '') + '</div>';
}
function chk(label, p) { return '<label class="tg"><input type="checkbox" data-b="' + p + '"' + (get(p) ? ' checked' : '') + '><span>' + label + '</span></label>'; }
function imgf(label, p) {
  var v = get(p);
  return '<div class="f"><span class="lab">' + label + '</span><div class="imgf">' + (v ? '<img src="' + esc(url(v)) + '" alt=""><button type="button" class="sm" data-act="imgclear" data-p="' + p + '">Remove</button>' : '') +
    '<label class="up">' + (v ? 'Change' : '+ Add photo') + '<input type="file" accept="image/*" data-up="' + p + '"></label></div></div>';
}
function group(title, key, opts, note) {
  return '<div class="g"><h3>' + title + '</h3><div class="ch">' + opts.map(function (o) {
    return '<button type="button" class="c' + (D.style[key] === o[0] ? ' on' : '') + '" data-act="style" data-k="' + key + '" data-v="' + o[0] + '"' + (o[3] ? ' style="' + o[3] + '"' : '') + '>' + o[1] + (o[2] ? '<small>' + o[2] + '</small>' : '') + '</button>';
  }).join('') + '</div>' + (note ? '<p class="note">' + note + '</p>' : '') + '</div>';
}

/* ---------- panes ---------- */
function pStart() {
  var k = kindSel || kindOf(D._preset);
  var row = '<div class="kinds-grid" role="list">' + KINDS.map(function (x) {
    return '<button type="button" class="kd' + (x[0] === kindOf(D._preset) ? ' on' : '') + '" data-act="kind" data-v="' + x[0] + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + KIND_ICON[x[0]] + '</svg><b>' + x[1] + '</b></button>';
  }).join('') + '</div>';
  var more = '';
  if (k === 'archive') {
    more = '<p class="step-h">Which kind of archive?</p><div class="vers3">' + [['archive', 'Finds', 'Cool things you found, with links', 'star'], ['archiveProducer', 'Producer', 'Beats and packs with a play button', 'play'], ['archiveLog', 'Log', 'Dated entries documenting something', 'page']].map(function (v) {
      return '<button type="button" class="vr' + (D._preset === v[0] ? ' on' : '') + '" data-act="variant" data-v="archive:' + ['archive', 'archiveProducer', 'archiveLog'].indexOf(v[0]) + '">' + ico(v[3]) + '<b>' + v[1] + '</b><span>' + v[2] + '</span></button>';
    }).join('') + '</div>';
  }
  var pages = D.tabs.map(function (t) { return '<li>' + ico(t.icon || T_ICON[t.type]) + esc(t.name) + '</li>'; }).join('');
  return '<p class="step-h">What are you making?</p>' + row + more +
    '<p class="step-h">You get these pages</p><ul class="youget">' + pages + '</ul>' +
    '<p class="help">You can rename, add or remove any page after.</p>' +
    '<button type="button" class="next" data-act="pane" data-v="look">Next: pick a look &rarr;</button>';
}

function pAdd() {
  return '<button type="button" class="back" data-act="pane" data-v="pages">&lsaquo; Pages</button><h2>Add a page</h2><p class="lede">It shows up in your menu.</p><div class="tools">' +
    Object.keys(TYPES).map(function (k) { return '<button type="button" data-act="add" data-v="' + k + '">' + ico(T_ICON[k]) + '<b>' + TYPES[k][0] + '</b><span>' + TYPES[k][1] + '</span></button>'; }).join('') + '</div>';
}

function pLook() {
  var s = D.style, n = vis().length, navNote = '';
  if (s.nav === 'menu' && n <= 5) navNote = 'Heads up: with ' + n + ' pages, tabs people can see get used more. Studies found hidden menus get found less often. Your call.';
  if (s.nav === 'bottom' && n > 5) navNote = 'Only 4 fit on the bar. The rest go under More.';
  if (s.nav === 'side') navNote = 'Side list on computers, tabs on phones.';
  var tr = ratio(s.bg, s.text), ar = ratio(s.accent, onColor(s.accent)), ab = ratio(s.accent, s.bg);
  function rd(r, need, what) { var ok = r >= need; return '<li class="' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✓ ' : '! ') + what + ' <b>' + r.toFixed(1) + ':1</b>' + (ok ? '' : ' needs ' + need + ':1') + '</li>'; }
  var fam = lookFam || 'Clean';
  var gal = '<div class="lk-fams" role="tablist">' + LOOK_FAMS.map(function (f) { return '<button type="button" class="c' + (f === fam ? ' on' : '') + '" data-act="fam" data-v="' + f + '">' + f + '</button>'; }).join('') + '</div>' +
    '<div class="lk-grid">' + LOOKS[fam].map(function (l, i) { return lookTile(l[0], lookStyle(l[1]), 'look', fam + ':' + i); }).join('') +
    '<button type="button" class="lk lk-sh" data-act="shuffle"><b>Shuffle</b><small>New colors and type, same pages</small></button></div>' +
    (D._prevStyle ? '<button type="button" class="sm wide" data-act="lookundo">Undo last look</button>' : '') +
    '<p class="note">Looks change colors, type, buttons and spacing. Your words, photos and pages stay.</p>';
  var colors = '<p class="step-h">Colors</p><div class="dots">' + PALETTES.map(function (q) {
      var on = q[1] === s.bg && q[3] === s.accent;
      return '<button type="button" class="dot' + (on ? ' on' : '') + '" data-act="pal" data-v="' + q.slice(1).join(',') + '" aria-label="' + q[0] + '" style="background:linear-gradient(135deg,' + q[1] + ' 50%,' + q[3] + ' 50%);border-color:' + q[2] + '"></button>';
    }).join('') + '</div><p class="step-s">Or pick your own</p><div class="mine">' +
    [['style.bg', 'Background', s.bg], ['style.text', 'Words', s.text], ['style.accent', 'Buttons', s.accent]].map(function (c) {
      return '<label class="swatch"><input type="color" data-b="' + c[0] + '" value="' + esc(c[2]) + '"><i style="background:' + esc(c[2]) + '"></i><span>' + c[1] + '</span></label>';
    }).join('') + '</div><ul class="ratios">' + rd(tr, 4.5, 'Words are easy to read') + rd(ar, 4.5, 'Button words are easy to read') + '</ul>';
  var FL = [['clean', 'Clean'], ['space', 'Space Grotesk'], ['grotesk', 'Inter Tight'], ['block', 'Archivo Black'], ['gallery', 'Syne'], ['bricolage', 'Bricolage'], ['condensed', 'Barlow'], ['humanist', 'Tenor Sans'], ['soft', 'Nunito'], ['editorial', 'Fraunces'], ['journal', 'Instrument'], ['didone', 'DM Serif'], ['slab', 'Roboto Slab'], ['type', 'Plex Mono'], ['typed', 'Special Elite'], ['mono', 'Rubik Mono'], ['marker', 'Marker']];
  var type = '<p class="step-h">Type</p><div class="ftiles">' + FL.map(function (f) {
    return '<button type="button" class="ft' + (s.font === f[0] ? ' on' : '') + '" data-act="style" data-k="font" data-v="' + f[0] + '"><b style="font-family:' + FONT_H[f[0]].replace(/"/g, "'") + ';font-weight:' + (FONT_W[f[0]] || 800) + '">Aa</b><span>' + f[1] + '</span></button>';
  }).join('') + '</div>';
  var acx = onColor(s.accent), rr = { sharp: '0', soft: '7px', round: '14px' }[s.corner] || '7px';
  var bstyle = { solid: 'background:' + s.accent + ';color:' + acx + ';border:2px solid ' + s.accent + ';border-radius:' + rr, outline: 'background:transparent;color:' + s.text + ';border:2px solid ' + s.text + ';border-radius:' + rr, pill: 'background:' + s.accent + ';color:' + acx + ';border:2px solid ' + s.accent + ';border-radius:99px', underline: 'background:transparent;color:' + s.text + ';border:0;border-bottom:3px solid ' + s.accent + ';border-radius:0' };
  var btns = '<p class="step-h">Buttons</p><div class="btiles">' + [['solid', 'Solid'], ['outline', 'Outline'], ['pill', 'Pill'], ['underline', 'Underline']].map(function (x) {
    return '<button type="button" class="bt2' + ((s.btn || 'solid') === x[0] ? ' on' : '') + '" data-act="style" data-k="btn" data-v="' + x[0] + '" style="background:' + s.bg + '"><i style="' + bstyle[x[0]] + '">Shop</i><span>' + x[1] + '</span></button>';
  }).join('') + '</div>';
  var ics = '<p class="step-h">Icons</p><div class="btiles">' + [['line', 'Line'], ['bold', 'Bold'], ['duo', 'Filled'], ['badge', 'Badge'], ['none', 'Words only']].map(function (x) {
    var st = x[0] === 'bold' ? 'stroke-width:2.7' : x[0] === 'duo' ? 'stroke-width:1.8' : 'stroke-width:1.8', fill = x[0] === 'duo' ? 'fill:currentColor;fill-opacity:.4' : 'fill:none';
    var one = function (n) { return '<svg viewBox="0 0 24 24" style="' + st + ';' + fill + (x[0] === 'badge' ? ';background:' + s.accent + ';color:' + acx + ';border-radius:6px;padding:3px' : '') + '">' + ICONS[n] + '</svg>'; };
    return '<button type="button" class="ic2' + ((s.icons || 'line') === x[0] ? ' on' : '') + '" data-act="style" data-k="icons" data-v="' + x[0] + '"><i>' + (x[0] === 'none' ? '<em>Home Shop</em>' : one('home') + one('bag') + one('user')) + '</i><span>' + x[1] + '</span></button>';
  }).join('') + '</div>';
  return '<h2>Look</h2>' + gal + colors + type + btns + ics + '<details class="fine"' + (fineOpen ? ' open' : '') + '><summary>Fine tune</summary>' +
    group('Menu', 'nav', [['tabs', 'Tabs', 'on top'], ['menu', 'Menu', 'button'], ['bottom', 'Bottom bar', 'like an app'], ['side', 'Side list', 'computer']], navNote) +
    group('Page change', 'motion', [['none', 'None'], ['fade', 'Fade'], ['slide', 'Slide'], ['rise', 'Rise'], ['zoom', 'Zoom']]) +
    '<button type="button" class="sm wide" data-act="demo">▶ Watch it</button>' +
    group('Corners', 'corner', [['sharp', 'Sharp'], ['soft', 'Soft'], ['round', 'Round']]) +
    group('Spacing', 'density', [['comfy', 'Roomy'], ['compact', 'Tight']]) +
    group('Name at top', 'header', [['left', 'Left'], ['center', 'Center'], ['stack', 'Big']]) +
    group('Item layout', 'layout', [['grid', 'Grid'], ['masonry', 'Stagger'], ['list', 'List']]) +
    group('Photo shape', 'photo', [['square', 'Square'], ['portrait', 'Tall'], ['landscape', 'Wide'], ['natural', 'As is']]) +
    group('Headings', 'case', [['normal', 'As typed'], ['upper', 'ALL CAPS']]) +
    group('Background', 'tex', [['none', 'Plain'], ['grain', 'Grain'], ['grid', 'Graph'], ['lines', 'Lined'], ['dots', 'Dots']]) +
    group('Photo frame', 'card', [['plain', 'None'], ['border', 'Line'], ['shadow', 'Shadow'], ['tape', 'Tape']]) + '</details>' +
    '<button type="button" class="next" data-act="pane" data-v="pages">Next: fill in your pages &rarr;</button>';
}

function pPages() {
  if (editTab != null && D.tabs[editTab]) return editItem != null ? pItem() : pTab();
  editTab = null;
  var rows = D.tabs.map(function (t, i) {
    var kids = (LISTY[t.type] || t.type === 'gallery' || t.type === 'links') ? (t.items || []) : [];
    var k = kids.slice(0, 8).map(function (x, j) {
      return '<li><button type="button" class="ly-k" data-act="pick" data-i="' + i + '" data-j="' + j + '"><i></i>' + esc(x.title || (t.type === 'gallery' ? 'Photo ' + (j + 1) : 'Untitled')) + '</button></li>';
    }).join('') + (kids.length > 8 ? '<li><button type="button" class="ly-k ly-more" data-act="open" data-i="' + i + '">+ ' + (kids.length - 8) + ' more</button></li>' : '');
    return '<li class="ly' + (t.hidden ? ' off' : '') + '"><div class="ly-row"><button type="button" class="ly-main" data-act="open" data-i="' + i + '">' + ico(t.icon || T_ICON[t.type]) + '<b>' + esc(t.name || 'Untitled') + '</b><small>' + TYPES[t.type][0] + (t.hidden ? ' . hidden' : '') + '</small></button>' +
      '<button type="button" class="ic" data-act="hide" data-i="' + i + '" aria-label="' + (t.hidden ? 'Show page' : 'Hide page') + '">' + (t.hidden ? '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-2.6 3.2M6.6 7.6C4.4 9.2 3 12 3 12s4 6 9 6c1.4 0 2.7-.4 3.9-1"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="3"/></svg>') + '</button>' +
      '<button type="button" class="ic" data-act="up" data-i="' + i + '" aria-label="Move up"' + (i ? '' : ' disabled') + '>&uarr;</button>' +
      '<button type="button" class="ic" data-act="down" data-i="' + i + '" aria-label="Move down"' + (i < D.tabs.length - 1 ? '' : ' disabled') + '>&darr;</button>' +
      '<button type="button" class="ic" data-act="del" data-i="' + i + '" aria-label="Delete page">&times;</button></div>' + (k ? '<ul class="ly-kids">' + k + '</ul>' : '') + '</li>';
  }).join('');
  return '<h2>Pages</h2><p class="lede">Tap a page or anything in it to fill it in. You can also tap things right in the preview.</p><ul class="lys">' + rows + '</ul>' +
    '<button type="button" class="add" data-act="pane" data-v="add">+ Add a page</button>';
}

function pTab() {
  var t = D.tabs[editTab], P = 'tabs.' + editTab, h = '<button type="button" class="back" data-act="close">‹ Pages</button><h2>' + esc(t.name || 'Untitled') + ' <small>' + TYPES[t.type][0] + '</small></h2>';
  h += fld('Page name', P + '.name', { max: 24, help: 'Short works best. One or two words.' });
  if (D.style.nav === 'bottom') h += '<div class="f"><span class="lab">Icon</span><div class="icons">' + ICON_NAMES.map(function (n) { return '<button type="button" class="' + ((t.icon || '') === n ? 'on' : '') + '" data-act="icon" data-v="' + n + '" aria-label="' + n + '"><svg viewBox="0 0 24 24">' + ICONS[n] + '</svg></button>'; }).join('') + '</div></div>';
  if (t.type === 'home') {
    h += fld('Big headline', P + '.headline', { ph: D.name }) + fld('Line under it', P + '.intro', { area: true, rows: 2, ph: D.tagline }) + imgf('Cover photo', P + '.image');
    h += fld('Button words', P + '.button', { ph: 'Shop now' }) + '<div class="f"><label for="bto">Button goes to</label><select id="bto" data-b="' + P + '.buttonTo" data-num="1"><option value="">No button</option>' +
      vis().map(function (x) { if (x === t) return ''; return '<option value="' + vis().indexOf(x) + '"' + (t.buttonTo === vis().indexOf(x) ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('') + '</select></div>';
  } else if (t.type === 'page') {
    h += imgf('Photo at top', P + '.image') + fld('Words', P + '.body', { area: true, rows: 10, help: 'Leave a blank line for a new paragraph. Start a line with # and a space to make a heading.' });
  } else if (t.type === 'contact') {
    h += fld('Intro', P + '.intro', { area: true, rows: 2 }) + fld('Email', P + '.email', { type: 'email', mode: 'email', ph: D.email || 'you@yourname.com', help: 'Leave empty to use the email in Info.' }) + fld('More words', P + '.body', { area: true, rows: 4 });
  } else {
    h += fld('Intro', P + '.intro', { area: true, rows: 2, ph: 'Optional line at the top' });
    if (LISTY[t.type]) {
      h += '<h3>' + ({ log: 'Entries', finds: 'Finds', tracks: 'Tracks' }[t.type] || 'Items') + ' <small>' + t.items.length + '</small></h3><ul class="rows">' + t.items.map(function (x, j) {
        var p = x.images && x.images[0];
        return '<li class="row"><button type="button" class="row-main" data-act="item" data-j="' + j + '">' + (p ? '<img src="' + esc(url(p)) + '" alt="">' : '<span class="nopic"></span>') + '<span><b>' + esc(x.title || 'Untitled') + '</b><small>' + (t.type === 'log' ? esc(x.date || 'no date') : t.type === 'finds' ? esc((String(x.buy || '').match(/^https?:\/\/(?:www\.)?([^\/]+)/) || [, 'no link'])[1]) : (x.price ? '$' + esc(x.price) : '') + (t.type === 'tracks' ? (x.audio ? ' . has preview' : ' . no preview') : '') + (x.soldout ? ' . sold out' : '') + (x.price && !x.buy && !x.soldout ? ' . no buy link' : '')) + '</small></span></button>' +
          '<button type="button" class="ic" data-act="iup" data-j="' + j + '" aria-label="Move up"' + (j ? '' : ' disabled') + '>↑</button>' +
          '<button type="button" class="ic" data-act="idel" data-j="' + j + '" aria-label="Delete">×</button></li>';
      }).join('') + '</ul><button type="button" class="add" data-act="iadd">+ Add ' + ({ log: 'entry', finds: 'find', tracks: 'track' }[t.type] || 'item') + '</button>';
      if (t.type === 'grid') h += '<p class="help">Tags become filter buttons when you use two or more.</p>';
    } else if (t.type === 'gallery') {
      h += '<h3>Photos <small>' + t.items.length + '</small></h3><div class="gthumbs">' + t.items.map(function (x, j) {
        var p = x.images && x.images[0];
        return '<div class="gt">' + (p ? '<img src="' + esc(url(p)) + '" alt="">' : '<span class="nopic"></span>') + '<input data-b="' + P + '.items.' + j + '.title" value="' + esc(x.title) + '" placeholder="Caption" aria-label="Caption"><button type="button" class="ic" data-act="idel" data-j="' + j + '" aria-label="Delete">×</button></div>';
      }).join('') + '</div><label class="add up">+ Add photos<input type="file" accept="image/*" multiple data-gal="' + editTab + '"></label>';
    } else if (t.type === 'links') {
      h += '<h3>Links</h3>' + t.items.map(function (x, j) {
        return '<div class="lrow">' + fld('Words', P + '.items.' + j + '.title') + fld('Goes to', P + '.items.' + j + '.buy', { type: 'url', mode: 'url', ph: 'https://' }) + '<button type="button" class="sm" data-act="idel" data-j="' + j + '">Remove link</button></div>';
      }).join('') + '<button type="button" class="add" data-act="ladd">+ Add link</button>';
    }
  }
  return h;
}

function pItem() {
  var t = D.tabs[editTab], x = t.items[editItem], P = 'tabs.' + editTab + '.items.' + editItem;
  if (!x) { editItem = null; return pTab(); }
  var bad = x.buy && !/^(https:\/\/|mailto:)/i.test(x.buy);
  var pics = '<div class="f"><span class="lab">' + (t.type === 'tracks' ? 'Cover art' : 'Photos') + '</span><div class="pics">' + (x.images || []).map(function (p, k) {
      return '<div class="pic"><img src="' + esc(url(p)) + '" alt=""><div><button type="button" class="ic" data-act="pleft" data-k="' + k + '" aria-label="Move left"' + (k ? '' : ' disabled') + '>‹</button><button type="button" class="ic" data-act="pdel" data-k="' + k + '" aria-label="Remove">×</button></div></div>';
    }).join('') + '<label class="pic up">+<input type="file" accept="image/*" multiple data-many="' + P + '.images"></label></div>' +
    (t.type === 'grid' ? '<p class="help">First photo is the cover. Add one that shows the real size, like it in a hand or on a person. Shoppers look for that.</p>' : '') + '</div>';
  var top = '<button type="button" class="back" data-act="iclose">‹ ' + esc(t.name) + '</button><h2>' + esc(x.title || 'Untitled') + '</h2>';
  var del = '<button type="button" class="danger" data-act="idel" data-j="' + editItem + '">Delete this ' + ({ log: 'entry', finds: 'find', tracks: 'track' }[t.type] || 'item') + '</button>';
  if (t.type === 'log') return top + fld('Title', P + '.title') + fld('Date', P + '.date', { type: 'date', help: 'Entries sort newest first by this date.' }) + pics +
    fld('What happened', P + '.text', { area: true, rows: 8, help: 'Blank line for a new paragraph. Start a line with # for a heading.' }) + fld('Link (optional)', P + '.buy', { type: 'url', mode: 'url', ph: 'https://' }) + del;
  if (t.type === 'finds') return top + fld('What it is', P + '.title') + fld('Where it lives', P + '.buy', { type: 'url', mode: 'url', ph: 'https://', help: bad ? '<b class="warn">Links must start with https://</b>' : 'The page you found it on. People see "via" and the site name.' }) + pics +
    fld('Why you picked it', P + '.text', { area: true, rows: 5 }) + fld('Tag', P + '.tag', { ph: 'Photo, Type, Sound...' }) + del;
  var audio = t.type === 'tracks' ? '<div class="f"><span class="lab">Preview sound</span>' + (x.audio ? '<div class="aud"><audio controls src="' + esc(url(x.audio)) + '"></audio><button type="button" class="sm" data-act="imgclear" data-p="' + P + '.audio">Remove</button></div>' : '') +
    '<label class="add up">' + (x.audio ? 'Replace sound' : '+ Add an mp3 or m4a') + '<input type="file" accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav" data-audio="' + P + '.audio"></label><p class="help">Use a short tagged preview, 30 to 60 seconds. Sell the full file through your buy link. Up to 12 MB.</p></div>' : '';
  return top + audio + pics +
    fld('Name', P + '.title') +
    fld('Price', P + '.price', { mode: 'decimal', ph: 'Leave empty if not for sale' }) +
    fld('Buy link', P + '.buy', { type: 'url', mode: 'url', ph: 'https://buy.stripe.com/...', help: bad ? '<b class="warn">Links must start with https://</b>' : 'Paste a Stripe Payment Link. Stripe runs the checkout, asks for the shipping address and emails the receipt. Any link works too, like a booking or a preorder form.' }) +
    fld('Button words', P + '.cta', { ph: x.price ? 'Buy' : 'Open' }) +
    fld('Tag', P + '.tag', { ph: t.type === 'tracks' ? 'Beat, Sample pack, Merch' : 'Tees, Prints, 2024...', help: 'Groups items. Two or more tags make filter buttons.' }) +
    (t.type === 'grid' ? fld('Badge', P + '.badge', { ph: 'New, Last one, Preorder', max: 16 }) : '') +
    fld(t.type === 'tracks' ? 'Details' : 'Describe it', P + '.text', { area: true, rows: 6, help: t.type === 'tracks' ? 'BPM, key, what is in the pack, lease terms.' : 'Size, material, how it is made. Blank line for a new paragraph.' }) +
    chk('Sold out', P + '.soldout') + del;
}

function pInfo() {
  var c = ['USD', 'CAD', 'MXN', 'EUR', 'GBP', 'AUD', 'JPY'];
  return '<h2>Info</h2>' + fld('Name', 'name', { max: 40 }) + fld('Tagline', 'tagline', { max: 90 }) + imgf('Logo', 'logo') +
    fld('Top banner', 'notice', { max: 70, ph: 'Free shipping over $50', help: 'A short line across the very top. Leave empty to hide.' }) +
    fld('Email', 'email', { type: 'email', mode: 'email', ph: 'you@yourname.com', help: 'Shown in the footer and on Contact.' }) +
    fld('Footer', 'footer', { ph: '© ' + new Date().getFullYear() + ' ' + (D.name || 'Your Name') }) +
    '<h3>Selling</h3><div class="f"><label for="cur">Money</label><select id="cur" data-b="shop.currency">' + c.map(function (k) { return '<option' + (D.shop.currency === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select></div>' +
    fld('Shipping', 'shop.shipping', { area: true, rows: 3, help: 'Shows on every item page. Most shoppers look for this before they buy.' }) +
    fld('Returns', 'shop.returns', { area: true, rows: 3 }) +
    '<h3>Search and sharing</h3>' + fld('Your domain', 'domain', { type: 'url', mode: 'url', ph: 'yourname.com', help: 'So link previews in texts show your photo.' }) +
    fld('Description', 'description', { area: true, rows: 3, max: 160, help: 'One or two sentences. Google shows this under your name. Under 160 letters.' }) +
    imgf('Share photo', 'shareImage');
}

function checks() {
  var out = [], s = D.style, priced = [], nolink = 0, badlink = 0, empty = 0, nopic = 0;
  D.tabs.forEach(function (t) {
    if (t.hidden) return;
    if ((t.type === 'grid' || t.type === 'gallery' || t.type === 'links') && !t.items.length) empty++;
    if (t.type === 'page' && !t.body) empty++;
    (t.items || []).forEach(function (x) {
      if (t.type === 'grid' && x.price) { priced.push(x); if (!x.buy && !x.soldout) nolink++; }
      if (x.buy && !/^https:\/\//i.test(x.buy)) badlink++;
      if ((t.type === 'grid' || t.type === 'gallery') && !(x.images && x.images.length)) nopic++;
    });
  });
  function c(ok, yes, no, go) { out.push({ ok: ok, t: ok ? yes : no, go: go }); }
  c(!!D.name, 'Your site has a name', 'Give your site a name', 'info');
  c(ratio(s.bg, s.text) >= 4.5, 'Text is easy to read', 'Text is hard to read on that background', 'look');
  c(!nolink, priced.length ? 'Every item for sale has a buy link' : 'Nothing priced yet, that is fine', nolink + ' priced item' + (nolink > 1 ? 's have' : ' has') + ' no buy link', 'pages');
  c(!badlink, 'Links look right', badlink + ' link' + (badlink > 1 ? 's do' : ' does') + ' not start with https://', 'pages');
  c(!priced.length || !!D.shop.shipping, 'Shipping info is on item pages', 'Add shipping info, shoppers look for it', 'info');
  c(!nopic, 'Every item has a photo', nopic + ' item' + (nopic > 1 ? 's need' : ' needs') + ' a photo', 'pages');
  c(!empty, 'No empty pages', empty + ' page' + (empty > 1 ? 's are' : ' is') + ' empty', 'pages');
  c(!!D.description, 'Search description is set', 'Add a search description', 'info');
  c(true, D.domain ? 'Your own domain is set' : 'Free link works, no domain needed. You can add one any time in Info', '', 'info');
  return out;
}

function pPublish() {
  var cs = checks(), bad = cs.filter(function (x) { return !x.ok; }).length;
  return '<h2>Publish</h2><ul class="checks">' + cs.map(function (x) { return '<li class="' + (x.ok ? 'ok' : 'bad') + '"><span>' + (x.ok ? '✓' : '!') + '</span>' + x.t + (x.ok ? '' : ' <button type="button" class="sm" data-act="pane" data-v="' + x.go + '">Fix</button>') + '</li>'; }).join('') + '</ul>' +
    (bad ? '<p class="help">You can still download. These just make it better.</p>' : '') +
    '<button type="button" class="big" data-act="zip">Download my site (.zip)</button><p class="help" id="zipmsg"></p>' +
    '<div class="steps"><h3>Then put it online</h3><ol><li>Get your own domain name first. This kit is free; the domain is paid to the domain seller, usually about $11 a year for a .com on Cloudflare.</li><li>In Cloudflare: Workers and Pages, Create, Pages, Upload assets. Drop in the zip.</li><li>Add your domain under Custom domains.</li><li>Make your buy links in Stripe and paste them in.</li></ol><a class="sm" href="' + GUIDE + '" target="_blank" rel="noopener">Full guide with every tap</a></div>' +
    '<h3>To change it later</h3><p class="help">Open yourname.com/admin.html, edit, download a new zip and upload it again. Your live site only changes when you upload.</p>' +
    '<h3>Share your look</h3><p class="help">A link with your colors, type, menu, motion and page layout. Never your words, photos, prices or email. Nothing is stored anywhere, it all rides in the link. Whoever opens it starts their own site from your look, and their footer credits you.</p><button type="button" class="sm wide" data-act="remix">Copy my remix link</button><p class="help" id="remixMsg"></p>' +
    '<h3>Backup</h3><div class="ch"><button type="button" class="sm" data-act="backup">Save backup</button><label class="sm up">Open backup<input type="file" accept=".json,application/json" data-restore="1"></label><button type="button" class="sm" data-act="live">Load live site</button><button type="button" class="sm danger" data-act="reset">Start over</button></div>';
}

function draw(fromPick) {
  if (!fromPick) post({ type: 'mark', mark: markFor() });
  var P = { start: pStart, add: pAdd, look: pLook, pages: pPages, info: pInfo, publish: pPublish };
  $('#pane').innerHTML = P[pane]();
  $$('.st-tabs button').forEach(function (b) { var on = b.dataset.p === pane || (pane === 'add' && b.dataset.p === 'pages'); b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
}

/* ---------- images ---------- */
function shrink(file) {
  return new Promise(function (res, rej) {
    var u = URL.createObjectURL(file), im = new Image();
    im.onload = function () {
      var max = 1600, w = im.naturalWidth, h = im.naturalHeight, k = Math.min(1, max / Math.max(w, h));
      var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      c.toBlob(function (b) { b ? res(b) : rej(new Error('Could not read photo')); }, 'image/jpeg', 0.82);
    };
    im.onerror = function () { URL.revokeObjectURL(u); rej(new Error('Could not read photo')); };
    im.src = u;
  });
}
function addPhotos(files) {
  flash('Adding photos');
  return Promise.all(Array.prototype.map.call(files, function (f) {
    return shrink(f).then(function (b) { var k = 'images/' + rid() + '.jpg'; URLS[k] = URL.createObjectURL(b); return putImg(k, b).then(function () { return k; }); });
  }));
}

/* ---------- export ---------- */
var CRC = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u) { var c = 0xFFFFFFFF; for (var i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) {
  var enc = new TextEncoder(), parts = [], cen = [], off = 0, d = new Date();
  var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  files.forEach(function (f) {
    var name = enc.encode(f.name), data = f.data, crc = crc32(data);
    var h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
    h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    var c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
    c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    cen.push(new Uint8Array(c.buffer), name);
    off += 30 + name.length + data.length;
  });
  var size = cen.reduce(function (a, b) { return a + b.length; }, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
  return new Blob(parts.concat(cen, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
}
function absUrl(p) { var d = String(D.domain || '').trim().replace(/^https?:\/\//, '').replace(/\/.*$/, ''); return d ? 'https://' + d + '/' + p : p; }
function indexHtml() {
  var title = esc(D.name || 'My site'), desc = esc(D.description || D.tagline || ''), share = D.shareImage || firstImage();
  var icon = D.logo ? esc(D.logo) : 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="' + D.style.accent + '"/><text x="50%" y="66%" text-anchor="middle" font-family="Arial" font-weight="700" font-size="38" fill="' + onColor(D.style.accent) + '">' + esc((D.name || 'S').charAt(0).toUpperCase()) + '</text></svg>');
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>' + title + '</title>\n' +
    '<meta name="description" content="' + desc + '">\n<meta property="og:type" content="website">\n<meta property="og:title" content="' + title + '">\n<meta property="og:description" content="' + desc + '">\n' +
    (share ? '<meta property="og:image" content="' + esc(absUrl(share)) + '">\n<meta name="twitter:card" content="summary_large_image">\n' : '') +
    (D.domain ? '<link rel="canonical" href="' + esc(absUrl('')) + '">\n' : '') +
    '<meta name="theme-color" content="' + esc(D.style.bg) + '">\n<link rel="icon" href="' + icon + '">\n<link rel="apple-touch-icon" href="' + (D.logo ? esc(D.logo) : icon) + '">\n<link rel="stylesheet" href="kit/site.css">\n</head>\n<body>\n' +
    '<div id="site"><noscript><p style="padding:24px">' + title + '. Turn on JavaScript to see this site.</p></noscript></div>\n<script src="kit/site.js"></script>\n</body>\n</html>\n';
}
function firstImage() { var f = ''; D.tabs.some(function (t) { if (t.image) { f = t.image; return true; } return (t.items || []).some(function (x) { if (x.images && x.images[0]) { f = x.images[0]; return true; } return false; }); }); return f; }
function usedImages() {
  var s = {};
  function add(p) { if (p && /^(images|audio)\//.test(p)) s[p] = 1; }
  add(D.logo); add(D.shareImage);
  D.tabs.forEach(function (t) { add(t.image); (t.items || []).forEach(function (x) { (x.images || []).forEach(add); add(x.audio); }); });
  return Object.keys(s);
}
var README = 'YOUR SITE\n=========\n\nThis folder is your whole website. You own it.\n\nindex.html     the site\nsite.json      everything you typed: pages, items, colors\nimages/        your photos\nadmin.html     the studio, to change things later\nkit/           the engine. You do not need to touch it.\n\nPUT IT ONLINE (Cloudflare, free hosting, $0)\n1. Make a free Cloudflare account.\n2. Workers and Pages > Create > Pages > Upload assets. Name it, then drop in this zip or folder. Deploy.\n   You get a free link right away, like yourname.pages.dev. That is all you need.\n3. Optional: your own domain. Buy one in Cloudflare (sold at cost, about $11 a year for .com), then Custom domains > Set up a domain > type it.\n\nSELL THINGS (Stripe)\n1. Make a Stripe account. Stripe is who pays you.\n2. Payment Links > New. Add the product and price. Turn on: collect shipping address, shipping rates.\n3. Copy the link and paste it into the item\'s Buy link in admin.html.\nStripe sends the receipt email. You see orders in Stripe and buy labels at USPS or Pirate Ship.\n\nCHANGE IT LATER\nGo to your site address + /admin.html (like yourname.pages.dev/admin.html). Edit. Download a new zip. Upload it again in Cloudflare (Create deployment).\nYour live site only changes when you upload.\n\nFull guide: ' + GUIDE + '\n';
var LICENSE = 'MIT License\n\nCopyright (c) ' + new Date().getFullYear() + ' NOCIV.CO From Scratch\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n';

function bytes(r) { return r.arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
function fetchBytes(p) { return fetch(p, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(p + ' is missing'); return bytes(r); }); }
function buildZip() {
  var enc = new TextEncoder(), files = [], self = location.pathname.split('/').pop() || 'studio.html';
  var json = clone(D); delete json._touched; delete json._preset;
  var html = indexHtml();
  files.push({ name: 'index.html', data: enc.encode(html) }, { name: '404.html', data: enc.encode(html) },
    { name: 'site.json', data: enc.encode(JSON.stringify(json, null, 2)) }, { name: 'README.txt', data: enc.encode(README) },
    { name: 'LICENSE.txt', data: enc.encode(LICENSE) }, { name: 'robots.txt', data: enc.encode('User-agent: *\nDisallow: /admin.html\nDisallow: /preview.html\n') });
  var kit = [['kit/site.js', 'kit/site.js'], ['kit/site.css', 'kit/site.css'], ['kit/studio.js', 'kit/studio.js'], ['kit/studio.css', 'kit/studio.css'], ['preview.html', 'preview.html'], ['admin.html', self], ['kit/fonts/archivo-black.woff', 'kit/fonts/archivo-black.woff'], ['kit/fonts/bricolage-grotesque-800.woff', 'kit/fonts/bricolage-grotesque-800.woff'], ['kit/fonts/dm-serif-display.woff', 'kit/fonts/dm-serif-display.woff'], ['kit/fonts/instrument-serif.woff', 'kit/fonts/instrument-serif.woff'], ['kit/fonts/permanent-marker.woff', 'kit/fonts/permanent-marker.woff'], ['kit/fonts/rubik-mono-one.woff', 'kit/fonts/rubik-mono-one.woff'], ['kit/fonts/space-grotesk-400.woff', 'kit/fonts/space-grotesk-400.woff'], ['kit/fonts/space-grotesk-700.woff', 'kit/fonts/space-grotesk-700.woff'], ['kit/fonts/special-elite.woff', 'kit/fonts/special-elite.woff'], ['kit/fonts/syne-800.woff', 'kit/fonts/syne-800.woff'], ['kit/fonts/LICENSE-spacegrotesk.txt', 'kit/fonts/LICENSE-spacegrotesk.txt'], ['kit/fonts/LICENSE-archivoblack.txt', 'kit/fonts/LICENSE-archivoblack.txt'], ['kit/fonts/LICENSE-dmserifdisplay.txt', 'kit/fonts/LICENSE-dmserifdisplay.txt'], ['kit/fonts/LICENSE-syne.txt', 'kit/fonts/LICENSE-syne.txt'], ['kit/fonts/LICENSE-instrumentserif.txt', 'kit/fonts/LICENSE-instrumentserif.txt'], ['kit/fonts/LICENSE-rubikmonoone.txt', 'kit/fonts/LICENSE-rubikmonoone.txt'], ['kit/fonts/LICENSE-bricolagegrotesque.txt', 'kit/fonts/LICENSE-bricolagegrotesque.txt'], ['kit/fonts/LICENSE-specialelite.txt', 'kit/fonts/LICENSE-specialelite.txt'], ['kit/fonts/LICENSE-permanentmarker.txt', 'kit/fonts/LICENSE-permanentmarker.txt'], ['kit/fonts/inter-tight-800.woff', 'kit/fonts/inter-tight-800.woff'], ['kit/fonts/barlow-condensed-700.woff', 'kit/fonts/barlow-condensed-700.woff'], ['kit/fonts/tenor-sans.woff', 'kit/fonts/tenor-sans.woff'], ['kit/fonts/nunito-800.woff', 'kit/fonts/nunito-800.woff'], ['kit/fonts/fraunces-700.woff', 'kit/fonts/fraunces-700.woff'], ['kit/fonts/roboto-slab-800.woff', 'kit/fonts/roboto-slab-800.woff'], ['kit/fonts/ibm-plex-mono-600.woff', 'kit/fonts/ibm-plex-mono-600.woff'], ['kit/fonts/LICENSE-intertight.txt', 'kit/fonts/LICENSE-intertight.txt'], ['kit/fonts/LICENSE-barlowcondensed.txt', 'kit/fonts/LICENSE-barlowcondensed.txt'], ['kit/fonts/LICENSE-tenorsans.txt', 'kit/fonts/LICENSE-tenorsans.txt'], ['kit/fonts/LICENSE-nunito.txt', 'kit/fonts/LICENSE-nunito.txt'], ['kit/fonts/LICENSE-fraunces.txt', 'kit/fonts/LICENSE-fraunces.txt'], ['kit/fonts/LICENSE-ibmplexmono.txt', 'kit/fonts/LICENSE-ibmplexmono.txt'], ['kit/fonts/LICENSE-robotoslab.txt', 'kit/fonts/LICENSE-robotoslab.txt']];
  var jobs = kit.map(function (k) { return fetchBytes(k[1]).then(function (d) { files.push({ name: k[0], data: d }); }); });
  usedImages().forEach(function (p) {
    jobs.push(getBlob(p).then(function (b) { return b ? bytes(b) : fetchBytes(p); }).then(function (d) { files.push({ name: p, data: d }); }));
  });
  return Promise.all(jobs).then(function () { return makeZip(files); });
}
function download(blob, name) {
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}


/* ---------- remix: look and layout only, carried in the link, stored nowhere ---------- */
var REMIX_URL = 'https://nociv.co/scratch/studio.html';
function b64e(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function b64d(str) { str = str.replace(/-/g, '+').replace(/_/g, '/'); while (str.length % 4) str += '='; return decodeURIComponent(escape(atob(str))); }
function remixPack() {
  return { v: 1, from: D.name || 'someone', base: D.base, style: clone(D.style),
    tabs: D.tabs.map(function (t) { return { type: t.type, name: t.name, icon: t.icon || '', hidden: !!t.hidden, n: (t.items || []).length }; }) };
}
function remixApply(r) {
  var d = PRESETS.blank();
  d.base = r.base || 'shop'; d.style = Object.assign(d.style, r.style || {});
  d.tabs = (r.tabs || []).filter(function (t) { return TYPES[t.type]; }).slice(0, 12).map(function (t) {
    var x = tab(t.type, String(t.name || '').slice(0, 24) || TYPES[t.type][0]);
    if (t.icon) x.icon = String(t.icon); if (t.hidden) x.hidden = true;
    var n = Math.min(+t.n || 0, 12);
    if (LISTY[t.type] || t.type === 'gallery') for (var i = 0; i < n; i++) x.items.push(t.type === 'log' ? lit('Entry ' + (i + 1), today(i)) : it('Item ' + (i + 1)));
    if (t.type === 'links') for (var j = 0; j < n; j++) x.items.push({ id: rid(), title: 'Link ' + (j + 1), buy: '', images: [] });
    if (t.type === 'home') { x.headline = 'Your name here'; x.button = ''; x.buttonTo = null; }
    return x;
  });
  if (!d.tabs.length) d.tabs = PRESETS.blank().tabs;
  d.remixFrom = String(r.from || 'someone').slice(0, 40);
  return d;
}

/* ---------- events ---------- */
var lookFam = null, fineOpen = false, kindSel = null;
function onAct(b) {
  var a = b.dataset.act, i = +b.dataset.i, j = +b.dataset.j, t = D.tabs[editTab];
  switch (a) {
    case 'base':
      if (D._touched && !confirm('Start from the ' + b.textContent.trim().split(/\s/)[0] + ' start? What you have now gets replaced. Save a backup first if you want it.')) return;
      D = PRESETS[b.dataset.v](); D._preset = b.dataset.v; editTab = editItem = null; save(); D._touched = false; localStorage.setItem(KEY, JSON.stringify(D)); break;
    case 'style': D.style[b.dataset.k] = b.dataset.v; save(); break;
    case 'fam': lookFam = b.dataset.v; break;
    case 'kind':
      kindSel = b.dataset.v;
      if (kindSel === 'archive' && /^archive/.test(D._preset || '')) break;
      var base0 = kindSel === 'archive' ? 'archive' : kindSel;
      if (base0 === D._preset) break;
      if (D._touched && !confirm('Start a new ' + b.textContent.trim() + ' site? What you have now gets replaced. Save a backup first if you want it.')) return;
      D = PRESETS[base0](); D._preset = base0; editTab = editItem = null; pvHash = null; save(); break;
    case 'variant':
      var vk = b.dataset.v.split(':'), vv = VARIANTS[vk[0]][+vk[1]];
      if (D._touched && D._preset !== vv[0] && !confirm('Start a new ' + vv[2] + ' site? What you have now gets replaced. Save a backup first if you want it.')) return;
      if (D._preset === vv[0] && D._touched) { D._prevStyle = clone(D.style); D.style = Object.assign({}, D.style, variantStyle(vv)); }
      else { D = PRESETS[vv[0]](); D.style = variantStyle(vv); }
      D._preset = vv[0]; D._variant = b.dataset.v; kindSel = vk[0]; editTab = editItem = null; pvHash = null; save(); break;
    case 'look': var lv = b.dataset.v.split(':'); D._prevStyle = clone(D.style); D.style = Object.assign({}, D.style, lookStyle(LOOKS[lv[0]][+lv[1]][1])); save(); break;
    case 'shuffle': D._prevStyle = clone(D.style); D.style = shuffleStyle(D.style); save(); break;
    case 'lookundo': if (D._prevStyle) { D.style = D._prevStyle; delete D._prevStyle; save(); } break;
    case 'pal': var v = b.dataset.v.split(','); D.style.bg = v[0]; D.style.text = v[1]; D.style.accent = v[2]; save(); break;
    case 'demo': demoMotion(); return;
    case 'open': pvHash = null; editTab = i; editItem = null; pane = 'pages'; push(); break;
    case 'pick': pvHash = null; editTab = i; editItem = j; pane = 'pages'; push(); break;
    case 'close': pvHash = null; editTab = editItem = null; push(); break;
    case 'up': D.tabs.splice(i - 1, 0, D.tabs.splice(i, 1)[0]); save(); break;
    case 'down': D.tabs.splice(i + 1, 0, D.tabs.splice(i, 1)[0]); save(); break;
    case 'hide': D.tabs[i].hidden = !D.tabs[i].hidden; save(); break;
    case 'del': if (D.tabs.length < 2) { alert('Keep at least one page.'); return; } if (!confirm('Delete the page "' + D.tabs[i].name + '"?')) return; D.tabs.splice(i, 1); save(); break;
    case 'add': D.tabs.push(tab(b.dataset.v)); pvHash = null; editTab = D.tabs.length - 1; editItem = null; pane = 'pages'; save(); break;
    case 'icon': t.icon = b.dataset.v; save(); break;
    case 'item': pvHash = null; editItem = j; push(); break;
    case 'iclose': pvHash = null; editItem = null; push(); break;
    case 'iadd': t.items.push(t.type === 'log' ? lit('New entry', today()) : it(t.type === 'finds' ? 'New find' : t.type === 'tracks' ? 'New track' : 'New item')); editItem = t.items.length - 1; save(); break;
    case 'ladd': t.items.push({ id: rid(), title: '', buy: '', images: [] }); save(); break;
    case 'iup': t.items.splice(j - 1, 0, t.items.splice(j, 1)[0]); save(); break;
    case 'idel': if (!confirm('Delete "' + (t.items[j].title || 'this') + '"?')) return; t.items.splice(j, 1); editItem = null; save(); break;
    case 'pleft': var im = t.items[editItem].images, k = +b.dataset.k; im.splice(k - 1, 0, im.splice(k, 1)[0]); save(); break;
    case 'pdel': t.items[editItem].images.splice(+b.dataset.k, 1); save(); break;
    case 'imgclear': set(b.dataset.p, ''); save(); break;
    case 'pane': pane = b.dataset.v; if (pane === 'pages') { editTab = editItem = null; pvHash = null; } break;
    case 'zip':
      var m = $('#zipmsg'); b.disabled = true; m.textContent = 'Packing your site...';
      buildZip().then(function (z) { download(z, slug(D.name || 'my-site') + '-site.zip'); m.textContent = 'Done. ' + (z.size / 1048576).toFixed(1) + ' MB. Look in your Downloads (Files app on iPhone).'; })
        .catch(function (e) { m.textContent = 'Could not pack it: ' + e.message; }).then(function () { b.disabled = false; });
      return;
    case 'remix':
      var link = REMIX_URL + '#remix=' + b64e(JSON.stringify(remixPack())), msg = $('#remixMsg');
      if (navigator.share) { navigator.share({ title: 'Remix my look', url: link }).catch(function () {}); msg.textContent = 'Share sheet opened.'; return; }
      (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(function () { msg.textContent = 'Copied. Text it to anyone.'; }).catch(function () { prompt('Copy this link:', link); });
      return;
    case 'backup': var c = clone(D); delete c._touched; download(new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' }), 'site.json'); return;
    case 'live':
      fetch('site.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) {
        if (!confirm('Replace what is here with your live site?')) return; D = d; editTab = editItem = null; save(); draw();
      }).catch(function () { alert('No live site.json found here. This works from your own site\'s admin.html.'); });
      return;
    case 'reset': if (!confirm('Start over from nothing? This clears what is saved on this device.')) return; D = PRESETS.blank(); editTab = editItem = null; pane = 'start'; save(); break;
  }
  draw();
}

function bind() {
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (b && !b.disabled) { e.preventDefault(); onAct(b); return; }
    var p = e.target.closest('.st-tabs button'); if (p) { pane = p.dataset.p; if (pane === 'pages' && editTab != null) { editTab = editItem = null; pvHash = null; push(); } draw(); $('.st-ed').scrollTop = 0; }
    var md = e.target.closest('[data-mode]'); if (md) { mode = md.dataset.mode; $$('[data-mode]').forEach(function (x) { var on = x === md; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); post({ type: 'mode', pick: mode === 'pick' }); document.body.classList.toggle('viewing', mode !== 'pick'); }
    var d = e.target.closest('[data-dev]'); if (d) { $$('[data-dev]').forEach(function (x) { x.classList.toggle('on', x === d); }); document.body.dataset.dev = d.dataset.dev; }
    if (e.target.closest('#full')) { document.body.classList.toggle('full'); $('#full').textContent = document.body.classList.contains('full') ? 'Close' : 'Full view'; }
  });
  document.addEventListener('toggle', function (e) { if (e.target.classList && e.target.classList.contains('fine')) fineOpen = e.target.open; }, true);
  document.addEventListener('input', function (e) {
    var el = e.target, p = el.dataset.b; if (!p) return;
    var v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.num) v = v === '' ? null : +v;
    set(p, v); save();
    if (el.type === 'color' && pane === 'look') { clearTimeout(bind.t); bind.t = setTimeout(draw, 250); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el.type === 'checkbox' && el.dataset.b && pane === 'pages') draw();
    if (el.tagName === 'SELECT' && el.dataset.b) draw();
    if (el.type !== 'file' || !el.files || !el.files.length) return;
    var files = el.files;
    if (el.dataset.restore) {
      var r = new FileReader();
      r.onload = function () { try { var d = JSON.parse(r.result); if (!d.tabs || !d.style) throw 0; D = d; editTab = editItem = null; save(); draw(); } catch (x) { alert('That file is not a site backup.'); } };
      r.readAsText(files[0]); return;
    }
    if (el.dataset.audio) {
      var af = files[0]; if (af.size > 12 * 1048576) { alert('That sound is ' + (af.size / 1048576).toFixed(1) + ' MB. Keep previews under 12 MB.'); return; }
      var ext = (af.name.match(/\.(mp3|m4a|aac|wav)$/i) || [, 'mp3'])[1].toLowerCase(), ak = 'audio/' + rid() + '.' + ext;
      URLS[ak] = URL.createObjectURL(af); putImg(ak, af).then(function () { set(el.dataset.audio, ak); save(); draw(); }); return;
    }
    addPhotos(files).then(function (keys) {
      if (el.dataset.up) set(el.dataset.up, keys[0]);
      if (el.dataset.many) { var arr = get(el.dataset.many) || []; set(el.dataset.many, arr.concat(keys)); }
      if (el.dataset.gal) { var g = D.tabs[+el.dataset.gal]; keys.forEach(function (k) { var x = it(''); x.images = [k]; g.items.push(x); }); }
      save(); draw();
    }).catch(function (x) { alert(x.message); });
  });
}

/* ---------- start ---------- */
function boot() {
  idb().then(loadImgs).then(function () {
    var saved = null; try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    var rm = (location.hash.match(/remix=([A-Za-z0-9_-]+)/) || [])[1];
    if (rm) {
      history.replaceState(null, '', location.pathname + location.search);
      try {
        var pack = JSON.parse(b64d(rm));
        if (!saved || !saved._touched || confirm('Start a new site from ' + (pack.from || 'this') + '\'s look? What you have here gets replaced. Save a backup first if you want it.')) { pane = 'pages'; var nd = remixApply(pack); nd._touched = true; try { localStorage.setItem(KEY, JSON.stringify(nd)); } catch (e) {} return nd; }
      } catch (e) { alert('That remix link is broken or cut off.'); }
    }
    var want = (location.search.match(/base=(\w+)/) || [])[1];
    if (want && PRESETS[want]) {
      history.replaceState(null, '', location.pathname);
      if (!saved || !saved._touched || confirm('Start a new site from this template? What you have here gets replaced. Save a backup first if you want it.')) { var bp = PRESETS[want](); bp._preset = want; return bp; }
    }
    if (saved && saved.tabs) { pane = 'pages'; return saved; }
    if (/studio\.html$/.test(location.pathname)) { var b0 = PRESETS[want] ? want : 'shop', p0 = PRESETS[b0](); p0._preset = b0; return p0; }
    return fetch('site.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { pane = 'pages'; return d; })
      .catch(function () { var p = PRESETS.shop(); p._preset = 'shop'; return p; });
  }).then(function (d) {
    D = d; if (!D.shop) D.shop = clone(SHIP); if (!D.style) D.style = PRESETS.blank().style;
    bind(); draw();
    var f = $('#pv'); f.addEventListener('load', function () { ready = true; push(); });
    try { if (f.contentWindow.SiteKit) ready = true; } catch (e) {}
    push();
  });
}
boot();
})();
