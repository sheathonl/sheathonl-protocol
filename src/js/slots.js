// Shared by the build (node) and the browser. Pure string renderers: they read one register record
// at call time and never cache its state.

const ICONS = {
  x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.153h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  github: 'M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z'
};
const VIEWBOX = { x: '0 0 24 24', github: '0 0 16 16' };

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const isStated = (r) => !!r && r.state === 'stated';

export function byId(register, id) {
  return register.records.find((r) => r.id === id) || { id, label: id, state: 'absent' };
}

// Derive a display handle from a stored URL. The URL is the stored fact, the handle is computed.
export function handleOf(url) {
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean)[0];
    return seg ? '@' + seg : u.hostname;
  } catch {
    return '';
  }
}

export function renderSocial(rec, kind) {
  const svg = `<svg viewBox="${VIEWBOX[kind]}" width="20" height="20" aria-hidden="true" focusable="false"><path fill="currentColor" d="${ICONS[kind]}"/></svg>`;
  const name = kind === 'x' ? 'X' : 'GitHub';
  if (isStated(rec) && rec.url) {
    const h = handleOf(rec.url);
    return `<a class="soc" data-record="${esc(rec.id)}" data-state="stated" href="${esc(rec.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(name + (h ? ' ' + h : ''))}">${svg}</a>`;
  }
  return `<span class="soc is-inert" data-record="${esc(rec.id)}" data-state="${esc(rec.state)}" role="img" aria-disabled="true" aria-label="${esc(name)}, pending" title="${esc(name)}: pending">${svg}</span>`;
}

export function renderCa(rec) {
  if (isStated(rec) && rec.value) {
    const v = esc(rec.value);
    return `<button class="ca-btn" type="button" data-copy="${v}" data-record="contract" data-state="stated" aria-label="Copy contract address ${v}"><span class="ca-l">Contract address</span><span class="ca-v" data-ca-value>${v}</span><span class="ca-act" data-ca-act aria-live="polite">Copy</span></button>`;
  }
  return `<div class="ca-btn is-inert" data-record="contract" data-state="${esc(rec.state)}" aria-disabled="true"><span class="ca-l">Contract address</span><span class="ca-v" data-ca-value>pending</span><span class="ca-act">Copy</span></div>`;
}

export function renderValue(rec) {
  if (isStated(rec) && rec.value != null) return esc(rec.value) + (rec.unit ? esc(rec.unit) : '');
  return 'pending';
}

export function renderChip(rec) {
  const ok = isStated(rec) && rec.value != null;
  return `<span class="chip${ok ? '' : ' is-inert'}" data-record="${esc(rec.id)}" data-state="${esc(rec.state)}"><span class="chip-l">${esc(rec.label)}</span><span class="chip-v">${renderValue(rec)}</span></span>`;
}

export function renderStat(rec) {
  const ok = isStated(rec) && rec.value != null;
  return `<div class="stat spot${ok ? '' : ' is-inert'}" data-record="${esc(rec.id)}" data-state="${esc(rec.state)}"><span class="stat-l">${esc(rec.label)}</span><strong class="stat-v">${renderValue(rec)}</strong></div>`;
}

// Public view of the register shipped to the browser: no dates, no values on inert records.
export function publicRegister(register) {
  return {
    records: register.records.map((r) => {
      const o = { id: r.id, label: r.label, state: r.state };
      if (r.state === 'stated') {
        for (const k of ['value', 'url', 'pairs', 'unit']) if (r[k] != null) o[k] = r[k];
      }
      return o;
    })
  };
}
