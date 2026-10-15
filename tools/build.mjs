import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { transform } from 'esbuild';
import { byId, isStated, renderSocial, renderCa, renderChip, renderStat, publicRegister, esc } from '../src/js/slots.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...a) => path.join(root, ...a);
const out = P('dist');

// Slot rendering is exported so the gates can build both CA branches from the same code path.
export function renderHtml(register) {
  const tokens = fs.readFileSync(P('src/tokens.css'), 'utf8');
  const bg = /--bg:\s*(#[0-9a-f]{6})/i.exec(tokens)[1];
  const skel = Array.from({ length: 6 }, () => '          <li class="skel" aria-hidden="true"><i class="sk sk-c"></i><i class="sk sk-w"></i><i class="sk sk-s"></i><i class="sk sk-s"></i><i class="sk sk-s"></i></li>').join('\n');
  const html = fs.readFileSync(P('src/index.html'), 'utf8');
  const val = (id) => { const r = byId(register, id); return isStated(r) && r.value != null ? esc(r.value) + (r.unit ? esc(r.unit) : '') : 'pending'; };
  return html.replace(/\{\{([a-z]+)(?::([a-z-]+))?\}\}/g, (_, kind, id) => {
    switch (kind) {
      case 'token': return bg;
      case 'social': return renderSocial(byId(register, id), id);
      case 'ca': return renderCa(byId(register, 'contract'));
      case 'chip': return renderChip(byId(register, id));
      case 'stat': return renderStat(byId(register, id));
      case 'state': return esc(byId(register, id).state);
      case 'value': return val(id);
      case 'width': { const r = byId(register, id); const n = isStated(r) ? Number(r.value) : NaN; return isFinite(n) ? Math.max(0, Math.min(100, n)) + '%' : '0%'; }
      case 'skeleton': return skel;
      case 'register': return JSON.stringify(publicRegister(register)).replace(/</g, '\u003c');
      default: throw new Error('unknown slot ' + kind);
    }
  });
}

export const loadRegister = () => JSON.parse(fs.readFileSync(P('src/register.json'), 'utf8'));

async function main() {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(P('dist/assets/fonts'), { recursive: true });

  fs.writeFileSync(P('dist/index.html'), renderHtml(loadRegister()));

  const css = fs.readFileSync(P('src/tokens.css'), 'utf8') + '\n' + fs.readFileSync(P('src/css/app.css'), 'utf8');
  fs.writeFileSync(P('dist/assets/app.css'), (await transform(css, { loader: 'css', minify: true })).code);
  const js = fs.readFileSync(P('src/js/app.js'), 'utf8');
  fs.writeFileSync(P('dist/assets/app.js'), (await transform(js, { loader: 'js', minify: true, target: 'es2020' })).code);

  const fonts = [['outfit', 'outfit', [400, 600, 700]], ['ibm-plex-mono', 'ibm-plex-mono', [400, 500, 600]]];
  for (const [pkg, name, ws] of fonts) for (const w of ws) {
    const f = `${name}-latin-${w}-normal.woff2`;
    fs.copyFileSync(P('node_modules/@fontsource', pkg, 'files', f), P('dist/assets/fonts', f));
  }

  // Brand PNG has pure-black RGB under alpha 0. sharp (libvips) premultiplies alpha before the
  // resize kernel, so transparent black never bleeds into edges; the gate re-checks the fringe.
  const logo = P('brand/LOGO SHEATH PNG...png');
  for (const s of [96, 192, 512]) await sharp(logo).resize(s, s, { kernel: 'lanczos3', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toFile(P('dist/assets', `logo-${s}.png`));
  const bg = await sharp({ create: { width: 180, height: 180, channels: 4, background: '#07080a' } }).png().toBuffer();
  const mark = await sharp(logo).resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp(bg).composite([{ input: mark, gravity: 'centre' }]).png().toFile(P('dist/apple-touch-icon.png'));

  for (const f of fs.readdirSync(P('src/static'))) fs.copyFileSync(P('src/static', f), P('dist', f));
  console.log('build ok: dist/');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
