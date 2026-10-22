// Kleine DOM-Helfer, Textdarstellung mit Glossar-Wörtern, Blätter (Bottom-Sheets).
import { D } from './daten.js';

export function h(tag, attrs = {}, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kind of kinder.flat(Infinity)) {
    if (kind == null || kind === false) continue;
    el.append(kind instanceof Node ? kind : document.createTextNode(String(kind)));
  }
  return el;
}

/**
 * Text mit Auszeichnung: **fett** und [[Fachwort]] bzw. [[angezeigter Text|Glossar-ID]].
 * Fachwörter werden zu antippbaren Knöpfen, die das Glossar-Fenster öffnen.
 */
export function txt(str = '') {
  const frag = document.createDocumentFragment();
  const re = /\*\*(.+?)\*\*|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let pos = 0;
  for (const m of str.matchAll(re)) {
    if (m.index > pos) frag.append(str.slice(pos, m.index));
    if (m[1] !== undefined) frag.append(h('strong', {}, txt(m[1])));
    else {
      const g = glossarEintrag(m[3] ?? m[2]);
      frag.append(g ? h('button', { class: 'fw', type: 'button', 'data-g': g.id }, m[2]) : m[2]);
    }
    pos = m.index + m[0].length;
  }
  if (pos < str.length) frag.append(str.slice(pos));
  return frag;
}

/** Klartext ohne Auszeichnung (für Lesbarkeit, aria-Labels). */
export const klar = (str = '') => str.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');

export const glossarEintrag = (wort) => D.glossarMap[wort] ?? D.glossarMap[wort.toLowerCase()];

let offenesBlatt = null;

/** Bottom-Sheet. Gibt {schliessen} zurück. */
export function blatt(inhalt, { klasse = '', onClose, modal = true } = {}) {
  const huelle = h('div', { class: `blatt-huelle ${modal ? 'modal' : ''}` });
  const karte = h('section', { class: `blatt ${klasse}`, role: 'dialog', 'aria-modal': modal ? 'true' : 'false' }, inhalt);
  huelle.append(karte);
  const schliessen = () => {
    if (!huelle.isConnected) return;
    huelle.classList.add('zu');
    setTimeout(() => huelle.remove(), 180);
    if (offenesBlatt === huelle) offenesBlatt = null;
    onClose?.();
  };
  if (modal) huelle.addEventListener('click', (e) => { if (e.target === huelle) schliessen(); });
  document.body.append(huelle);
  return { schliessen, el: karte };
}

// Glossar-Fenster: ein Satz Erklärung + Alltagsbeispiel
document.addEventListener('click', (e) => {
  const knopf = e.target.closest('.fw');
  if (!knopf) return;
  e.preventDefault();
  e.stopPropagation();
  const g = D.glossarMap[knopf.dataset.g];
  if (!g) return;
  document.querySelector('.glossar-huelle')?.remove();
  const huelle = h('div', { class: 'glossar-huelle', onClick: (ev) => { if (ev.target === huelle) huelle.remove(); } },
    h('aside', { class: 'glossar', role: 'dialog', 'aria-label': g.begriff },
      h('h3', {}, g.begriff),
      h('p', {}, txt(g.erklaerung)),
      g.beispiel && h('p', { class: 'glossar-bsp' }, h('span', {}, 'Beispiel: '), txt(g.beispiel)),
      h('button', { class: 'knopf klein', type: 'button', onClick: () => huelle.remove() }, 'Verstanden')));
  document.body.append(huelle);
}, true);

export const warte = (ms) => new Promise((r) => setTimeout(r, ms));
export const wenigBewegung = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
