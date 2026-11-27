// CI: generate the firmware for every preset and check it builds.
// .py: python3 -m py_compile. .ino: arduino-cli compile when CZ_ARDUINO=1 and arduino-cli is installed, else a strict syntax check.
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..'), out = process.argv[2] || path.join(here, 'out');
const W = await import(pathToFileURL(path.join(root, 'wiring.js')).href);
const win = {}; vm.runInNewContext(fs.readFileSync(path.join(root, 'parts.js'), 'utf8'), { window: win });
const CZ = win.CZ; fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const fails = [], made = [];
const strip = (t) => t.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/"(\\.|[^"\\\n])*"/g, '""').replace(/'(\\.|[^'\\\n])'/g, "''");
function inoCheck(t) { const s = strip(t), st = [], P = { ')': '(', ']': '[', '}': '{' };
  if (/["']/.test(s.replace(/""|''/g, ''))) return 'unterminated string or char';
  for (const ch of s) { if ('([{'.includes(ch)) st.push(ch); else if (P[ch]) { if (st.pop() !== P[ch]) return 'unbalanced ' + ch; } }
  if (st.length) return 'unclosed ' + st.join('');
  if (!/void\s+setup\s*\(\s*\)/.test(s) || !/void\s+loop\s*\(\s*\)/.test(s)) return 'missing setup() or loop()';
  if (/\bundefined\b|\bNaN\b|\[object Object\]/.test(s)) return 'undefined / NaN leaked into the code';
  return null; }
const recipes = (CZ.RECIPES || []).filter((r) => Array.isArray(r.parts)).concat((CZ.TRY_PRESETS || []).map((p) => ({ id: 'play_' + p.id, name: p.name, fn: p.fn || p.id, /* Play presets: pads, knobs, screen, speaker on their brain */
  parts: [[p.brain || 'pico', 1], [p.pad || 'tact12', p.pads || 1], [p.knob || 'pot', (p.knobs || []).length]].concat(p.screen ? [['oled096', 1]] : [], p.speaker ? [['speaker28', 1]] : []) })));
for (const r of recipes) {
  const items = []; let brain = null, n = 0;
  r.parts.forEach(([type, q]) => { const P = CZ.PARTS[type]; if (P && P.cat === 'brain') { brain = brain || type; return; } if (!W.NEED[type]) return; for (let i = 0; i < (q || 1); i++) { n++; items.push({ key: String(n), label: n + ' ' + ((P && P.short) || type), type }); } });
  const own = W.BOARD_OF[brain] || 'pico', boards = Array.from(new Set([own, 'pico', 'uno']));
  for (const bk of boards) {
    const B = W.BOARDS[bk]; let c;
    try { c = W.codeFor(W.planWiring(items, {}, B), r.name, r.fn || null, B, {}); } catch (e) { fails.push(r.id + '@' + bk + ': generator threw ' + e.message); continue; }
    if (c.lang === 'txt') continue;
    const f = path.join(out, r.id + '_' + bk, c.lang === 'ino' ? r.id + '_' + bk + '.ino' : 'code.py'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, c.text); made.push([r.id + '@' + bk, f, c.lang, bk]);
  }
}
let arduino = false; if (process.env.CZ_ARDUINO === '1') try { execFileSync('arduino-cli', ['version'], { stdio: 'ignore' }); arduino = true; } catch (e) {}
const FQBN = { uno: 'arduino:avr:uno', nano: 'arduino:avr:nano', esp32: 'esp32:esp32:esp32', s3: 'esp32:esp32:esp32s3', cyd: 'esp32:esp32:esp32' };
for (const [id, f, lang, bk] of made) {
  if (lang === 'py') { try { execFileSync('python3', ['-m', 'py_compile', f], { stdio: 'pipe' }); } catch (e) { fails.push(id + ': py_compile ' + String(e.stderr || e.message).trim()); } continue; }
  const why = inoCheck(fs.readFileSync(f, 'utf8')); if (why) { fails.push(id + ': ' + why); continue; }
  if (arduino && FQBN[bk]) try { execFileSync('arduino-cli', ['compile', '--fqbn', FQBN[bk], path.dirname(f)], { stdio: 'pipe' }); } catch (e) { fails.push(id + ': arduino-cli ' + String(e.stderr || e.message).split('\n').slice(0, 6).join(' ')); }
}
console.log('Presets: ' + recipes.length + ', files: ' + made.length + ' (' + made.filter((m) => m[2] === 'py').length + ' .py, ' + made.filter((m) => m[2] === 'ino').length + ' .ino), arduino-cli: ' + (arduino ? 'on' : 'off, strict syntax check'));
if (fails.length) { console.error('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
console.log('All firmware OK');
