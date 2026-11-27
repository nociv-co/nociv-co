// CI: open Case Zero at 375 px (a small phone), fail on any console error, page error or sideways scroll.
// Usage: node ci/mobile375.cjs http://127.0.0.1:8080/casezero/build/
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:8080/casezero/build/', errs = [];
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }), p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('requestfailed', (r) => { if (new URL(r.url()).origin === new URL(url).origin) errs.push('request failed: ' + r.url()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  const m = await p.evaluate(async () => {
    const sw = 'serviceWorker' in navigator ? await Promise.race([navigator.serviceWorker.ready.then((r) => r.scope), new Promise((r) => setTimeout(() => r(''), 4000))]) : '';
    return { sw, w: document.documentElement.scrollWidth, man: !!document.querySelector('link[rel=manifest]') };
  });
  await p.evaluate(() => document.getElementById('helpTop') && document.getElementById('helpTop').click()); await p.waitForTimeout(300);
  await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(500);
  const kept = await p.evaluate(() => { try { const v = JSON.parse(localStorage.getItem('cz_build_v1') || 'null'); return v ? v.v : 0; } catch (e) { return -1; } });
  await b.close();
  if (m.w > 375) errs.push('sideways scroll: page is ' + m.w + ' px wide at 375');
  if (!m.man) errs.push('no web app manifest link');
  if (!/\/casezero\/build\/$/.test(m.sw)) errs.push('service worker not active for /casezero/build/ (got "' + m.sw + '")');
  console.log('375 px: width ' + m.w + ', sw ' + (m.sw || 'none') + ', cz_build_v1 schema ' + kept);
  if (errs.length) { console.error('FAILED:\n  ' + errs.join('\n  ')); process.exit(1); }
  console.log('375 px check OK');
})().catch((e) => { console.error(e); process.exit(1); });
