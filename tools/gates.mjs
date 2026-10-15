import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { renderHtml, loadRegister } from './build.mjs';
import { byId, isStated } from '../src/js/slots.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...a) => path.join(root, ...a);
const results = [];
const gate = (name, fn) => {
  try {
    const r = fn();
    if (r === true || r === undefined || (r && typeof r !== "string")) results.push([name, true]);
    else results.push([name, false, String(r)]);
  } catch (e) {
    results.push([name, false, e.message]);
  }
};
const read = (...a) => fs.readFileSync(P(...a), 'utf8');

const walk = (d, skip = []) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const f = path.join(d, e.name);
  if (skip.includes(e.name)) return [];
  return e.isDirectory() ? walk(f, skip) : [f];
});
const SKIP = ['node_modules', '.gate-tmp', 'dist', 'brand', 'reference'];
const srcFiles = walk(P('src')).filter((f) => /\.(css|js|html)$/.test(f));

// Inspect a rendered document the way a reader would: visible text plus every attribute a reader could see or hear.
function surface(html) {
  const d = new JSDOM(html).window.document;
  d.querySelectorAll('script,style').forEach((n) => n.remove());
  const attrs = [];
  d.querySelectorAll('*').forEach((el) => {
    for (const a of ['aria-label', 'title', 'alt', 'placeholder', 'content']) if (el.hasAttribute(a)) attrs.push(el.getAttribute(a));
  });
  return { d, text: d.body.textContent.replace(/\s+/g, ' ').trim(), attrs };
}

const B58 = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
const HEX = /\b0x[0-9a-fA-F]{40}\b/g;
// Gate warning: address-shaped strings are matched against the stated registry. The CA slot is exempt.
function scanAddresses(html, register) {
  const known = new Set(register.records.filter((r) => isStated(r) && r.value).map((r) => String(r.value)));
  const d = new JSDOM(html).window.document;
  d.querySelectorAll('script,style,[data-record="contract"]').forEach((n) => n.remove());
  const t = d.body.textContent + ' ' + [...d.querySelectorAll('*')].flatMap((e) => [...e.attributes].map((a) => a.value)).join(' ');
  return [...(t.match(B58) || []), ...(t.match(HEX) || [])].filter((h) => !known.has(h));
}

const reg0 = loadRegister();
const clone = (o) => JSON.parse(JSON.stringify(o));
const SAMPLE_CA = 'So11111111111111111111111111111111111111112';

// Mutations read the current record at runtime and set the state they need, so they hold from either starting state.
function toStated(register, id, patch) {
  const r = clone(register);
  const i = r.records.findIndex((x) => x.id === id);
  r.records[i] = { ...byId(r, id), ...patch, state: 'stated' };
  return r;
}
function toAbsent(register, id) {
  const r = clone(register);
  const i = r.records.findIndex((x) => x.id === id);
  const { label, source, scope, checked } = r.records[i];
  r.records[i] = { id, label, source, scope, checked, state: 'absent' };
  return r;
}

const absent = ['contract', 'x', 'github'].reduce(toAbsent, reg0);
const stated = toStated(toStated(toStated(reg0, 'contract', { value: SAMPLE_CA }), 'x', { url: 'https://x.com/example' }), 'github', { url: 'https://github.com/example/repo' });
const htmlA = renderHtml(absent);
const htmlB = renderHtml(stated);
const A = surface(htmlA);
const Bd = surface(htmlB);
const js = read('src/js/app.js');
const css = read('src/css/app.css');

// ---- register pattern
gate('register: states valid', () => reg0.records.every((r) => ['stated', 'absent', 'unconfirmed'].includes(r.state)) || 'bad state');
gate('register: inert records carry no value or url', () => reg0.records.filter((r) => r.state !== 'stated').every((r) => !('value' in r) && !('url' in r) && !('pairs' in r)) || 'inert record has value/url');
gate('register: chain stated as Solana with rpc', () => { const c = byId(reg0, 'chain'); return (isStated(c) && c.value === 'Solana' && c.url === 'https://solana-rpc.publicnode.com') || 'chain'; });
gate('register: market-source stated with url and pairs', () => { const m = byId(reg0, 'market-source'); return (isStated(m) && m.url && m.pairs) ? true : 'market-source'; });
gate('register: contract, x, github absent', () => ['contract', 'x', 'github'].every((i) => byId(reg0, i).state === 'absent') || 'not absent');
gate('register: reference-only facts are not asserted as ours', () => ['cap', 'identity', 'window', 'fee-split', 'supply-split', 'price-unit'].every((i) => byId(reg0, i).state !== 'stated') || 'reference number stated');

// ---- CA slot, both branches
gate('CA absent: inert, pending, no copy payload', () => { const e = A.d.querySelector('[data-record="contract"]'); return (e && e.classList.contains('is-inert') && !e.hasAttribute('data-copy') && !e.querySelector('[data-copy]') && /pending/.test(e.textContent)) || 'ca inert'; });
gate('CA stated: full address, copy payload, feedback hook', () => { const e = Bd.d.querySelector('[data-record="contract"]'); return (e && e.getAttribute('data-copy') === SAMPLE_CA && e.textContent.includes(SAMPLE_CA) && e.querySelector('[data-ca-act]')) || 'ca live'; });
gate('CA slot sits in the header', () => !!A.d.querySelector('header .ca-row [data-record="contract"]') || 'ca not in header');
gate('CA copy handler gives Copied feedback', () => /clipboard/.test(js) && /Copied/.test(js));

// ---- socials
for (const [k] of [['x'], ['github']]) {
  gate(`social ${k}: icon present, inert, no href while absent`, () => { const e = A.d.querySelector(`.socials [data-record="${k}"]`); return (e && e.querySelector('svg path') && !e.hasAttribute('href') && e.classList.contains('is-inert') && e.tagName === 'SPAN') || 'social absent'; });
  gate(`social ${k}: link with derived handle when stated`, () => { const e = Bd.d.querySelector(`.socials [data-record="${k}"]`); return (e && e.tagName === 'A' && e.getAttribute('href') === stated.records.find((r) => r.id === k).url && /@example/.test(e.getAttribute('aria-label'))) || 'social stated'; });
  gate(`social ${k}: icon only, no text label`, () => A.d.querySelector(`.socials [data-record="${k}"]`).textContent.trim() === '' || 'text label');
}
gate('social: official X and Octicon paths', () => { const s = read('src/js/slots.js'); return (s.includes('M18.901 1.153h3.68l-8.04 9.19L24 22.846') && s.includes('M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59')) || 'icon paths'; });
gate('social: top-right at every breakpoint (no display:none on .socials)', () => !/\.socials\s*\{[^}]*display:\s*none/.test(css) && !/\.soc\s*\{[^}]*display:\s*none/.test(css) || 'socials hidden');

// ---- gate warning scanner
gate('scanner: clean page, absent branch', () => scanAddresses(htmlA, absent).length === 0 || 'unexpected address');
gate('scanner: stated CA exempt, no other hits', () => scanAddresses(htmlB, stated).length === 0 || 'unexpected address');
gate('scanner: rogue 0x caught, same 0x passes once in registry', () => {
  const rogue = '0x' + 'ab12cd34ef'.repeat(4);
  const inject = (h) => h.replace('<footer', `<p>${rogue}</p><footer`);
  const known = toStated(absent, 'chain', { value: rogue });
  return (scanAddresses(inject(htmlA), absent).includes(rogue) && scanAddresses(inject(renderHtml(known)), known).length === 0) || 'scanner';
});
gate('scanner: rogue base58 address caught', () => scanAddresses(htmlA.replace('<footer', '<p>9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin</p><footer'), absent).length === 1 || 'b58');

// ---- no dates
const DATE = [/\b(19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/, /\b\d{1,2}[-/.]\d{1,2}[-/.](19|20)\d{2}\b/, /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.? \d{1,2}\b/i, /\b\d{1,2}:\d{2}\b/, /\b(19|20)\d{2}\b/, /\bas of\b/i, /\bchecked\b/i, /\bupdated\b/i, /\blast sync/i, /\b(am|pm)\b/i];
for (const [nm, S] of [['absent', A], ['stated', Bd]]) {
  gate(`no dates in visible text or attributes (${nm})`, () => { const all = [S.text, ...S.attrs].join(' | '); const h = DATE.find((r) => r.test(all)); return !h || 'date-like: ' + all.match(h)[0]; });
}
gate('no dates in runtime script strings', () => { const strs = [...js.matchAll(/"([^"\\\n]{2,})"/g)].map((m) => m[1]).join(' | '); return !DATE.some((r) => r.test(strs)) || 'date-like string in js'; });
gate('public register payload has no dates', () => { const m = /<script id="register-data"[^>]*>([^<]*)<\/script>/.exec(htmlA); return (m && !/checked|20\d\d-/.test(m[1])) || 'dates in payload'; });
gate('register.json keeps dates as data only', () => reg0.records.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.checked)));

// ---- palette
gate('palette: colour literals only in tokens.css', () => {
  const bad = srcFiles.filter((f) => !f.endsWith('tokens.css')).filter((f) => /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-zA-Z-])|\b(rgb|rgba|hsl|hsla)\(\s*\d/.test(fs.readFileSync(f, 'utf8').replace(/href="#[a-z-]+"/g, '').replace(/&#\d+;/g, '').replace(/url\(#[a-z-]+\)/g, '')));
  return !bad.length || bad.map((f) => path.relative(root, f)).join(', ');
});
gate('palette: every token hex has a provenance coordinate', () => {
  const [head, body] = read('src/tokens.css').toLowerCase().split(':root');
  const hexes = [...new Set([...body.matchAll(/#[0-9a-f]{6}/g)].map((m) => m[0]))];
  const miss = hexes.filter((h) => !new RegExp(h + '\\s*@\\s*\\d+,\\s*\\d+').test(head));
  return !miss.length || 'no pixel coordinate for ' + miss.join(',');
});
gate('palette: provenance names k-means and snapping', () => { const t = read('src/tokens.css'); return (/k-means/.test(t) && /snapped/.test(t)) || 'comment'; });

// ---- repo hygiene
gate('hygiene: no CLAUDE.md or .claude', () => (!fs.existsSync(P('CLAUDE.md')) && !fs.existsSync(P('.claude'))) || 'present');
gate('hygiene: no AI attribution in repo files', () => {
  const files = walk(root, SKIP).filter((f) => /\.(md|json|css|js|mjs|html|txt|svg)$/.test(f) && !/package-lock|ref-corpus|gates\.mjs/.test(f));
  const bad = files.filter((f) => /\b(claude|anthropic|chatgpt|openai|copilot|co-authored-by|ai[- ]generated)\b/i.test(fs.readFileSync(f, 'utf8')));
  return !bad.length || bad.join(',');
});
gate('hygiene: README, whitepaper, LICENSE at root, absent from dist', () => (['README.md', 'docs/whitepaper.md', 'LICENSE'].every((f) => fs.existsSync(P(f))) && !['README.md', 'LICENSE', 'whitepaper.md', 'docs'].some((f) => fs.existsSync(P('dist', f)))) || 'repo files');
gate('hygiene: LICENSE is MIT, Sheath, 2026', () => { const l = read('LICENSE'); return (/MIT License/.test(l) && /Copyright \(c\) 2026 Sheath/.test(l)) || 'license'; });

// ---- dist
gate('dist: all deploy files present', () => ['index.html', 'assets/app.css', 'assets/app.js', 'favicon.svg', 'apple-touch-icon.png', 'assets/logo-96.png', 'assets/logo-192.png', 'assets/logo-512.png', '_headers'].every((f) => fs.existsSync(P('dist', f))) || 'missing dist file');
gate('dist: index.html matches render of committed register', () => read('dist/index.html') === renderHtml(reg0) || 'dist stale, run build');
gate('favicon: 32x32 svg, no comments, no double hyphen', () => { const s = read('dist/favicon.svg'); return (/width="32" height="32"/.test(s) && /viewBox="0 0 32 32"/.test(s) && !/<!--/.test(s) && !/--/.test(s)) || 'favicon'; });
gate('favicon: colours come from tokens', () => { const s = read('dist/favicon.svg'); const t = read('src/tokens.css').toLowerCase(); const miss = [...new Set([...s.matchAll(/#[0-9a-f]{6}/gi)].map((m) => m[0].toLowerCase()))].filter((h) => !t.includes(h)); return !miss.length || 'off-palette ' + miss; });
gate('dist: css and js carry no raw tokens leaks (served css has the :root block)', () => /--bg:\s*#07080a/.test(read('dist/assets/app.css')) || 'tokens missing from css');

// ---- market independence
gate('market: markup identical in structure across CA states', () => { const q = (S) => ['#rows', '#ticker-track', '#tape-list', '[data-live]', '.mhead', '.skel'].map((s) => S.d.querySelectorAll(s).length).join(); return q(A) === q(Bd) || 'market markup differs'; });
gate('market: script reads only market-source, never contract', () => (/"market-source"/.test(js) && !/contract/i.test(js)) || 'market coupled');
gate('market: 60s poll, backoff, visibility pause, solana filter, top 10', () => (/U = 6e4/.test(js) && /Math\.pow\(2/.test(js) && /visibilitychange/.test(js) && /"solana"/.test(js) && /J = 10/.test(js) && /imageUrl/.test(js)) || 'market logic');
gate('market: letter-tile fallback, skeletons, last-good retention', () => (/tile-letter/.test(js) && A.d.querySelectorAll('#rows .skel').length >= 6 && /e\.items\.length \? l\("stale"/.test(js)) || 'tile/skeleton/retain');
gate('market: stated endpoints', () => { const m = byId(reg0, 'market-source'); return (m.url === 'https://api.dexscreener.com/token-boosts/top/v1' && m.pairs === 'https://api.dexscreener.com/tokens/v1/solana/{addresses}') || 'endpoints'; });

// ---- motion and measurement rules
gate('motion: reduced-motion block disables animation and transition', () => { const m = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/.exec(css); return (m && /animation:\s*none/.test(m[1]) && /transition:\s*none/.test(m[1])) || 'reduced motion'; });
gate('motion: script honours reduced motion', () => /prefers-reduced-motion: reduce/.test(js));
gate('motion: spring solver, parallax, progress, spotlight, count-up flash', () => (/stiffness/.test(js) && /damping/.test(js) && /data-depth/.test(js) && /scaleX/.test(js) && /--mx/.test(js) && /flash-up/.test(js)) || 'motion features');
gate('css: no ch units', () => !/\d(\.\d+)?ch\b/.test(css) || 'ch unit');
gate('css: 44px tap-target floor on controls', () => ['.soc', '.copy-mini', '.tape-btn', '.ghost'].every((s) => new RegExp('\\' + s + '[^{]*\\{[^}]*(min-)?(height|width):\\s*(4[4-9]|[5-9]\\d)px').test(css)) || 'tap target');

// ---- copy
const tok = (s) => s.toLowerCase().replace(/[^a-z0-9$%\s]/g, ' ').split(/\s+/).filter(Boolean);
const grams = (s) => { const t = tok(s); const o = new Set(); for (let i = 0; i < t.length - 1; i++) o.add(t[i] + ' ' + t[i + 1]); return o; };
const refG = grams(read('tools/ref-corpus.txt'));
for (const [nm, S] of [['absent', A], ['stated', Bd]]) {
  gate(`copy: zero 2-grams shared with the reference (${nm})`, () => { const hit = [...grams([S.text, ...S.attrs.filter((a) => /\s/.test(a))].join(' . '))].filter((x) => refG.has(x)); return !hit.length || hit.join(' | '); });
}
gate('copy: no reference-only figures or names', () => !/\b5\s?%|1,000,000,000|\$100\b|\b2[- ]hour|human\.tech|pump\.fun|\$sheath|condom/i.test(A.text + ' ' + Bd.text) || 'reference figure');

let fail = 0;
for (const [n, ok, why] of results) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : '  <- ' + why}`); if (!ok) fail++; }
console.log(`\ngates: ${results.length - fail}/${results.length} passed`);
process.exit(fail ? 1 : 0);
