// Kleine DOM-Helfer, Texte mit Glossar-Begriffen und das Glossar-Fenster.
import { getDaten } from './tag.js';

export const app = () => document.getElementById('app');

export function el(tag, attrs = {}, ...kinder) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k === 'text') n.textContent = v;
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kinder.flat()) if (k != null && k !== false) n.append(k);
  return n;
}

export function zeige(...knoten) {
  const root = app();
  root.replaceChildren(...knoten);
  root.scrollTop = 0;
  window.scrollTo(0, 0);
}

// Glossar-Eintrag zu einem Begriff (auch über Aliase, ohne Groß-/Kleinschreibung)
export function glossarEintrag(begriff) {
  const g = getDaten()?.glossar ?? [];
  const key = begriff.toLowerCase();
  return g.find((e) => e.begriff.toLowerCase() === key || e.aliase?.some((a) => a.toLowerCase() === key));
}

// Text mit **fett** und [[Begriff]] bzw. [[angezeigt|Begriff]] → Knoten
export function text(s) {
  const frag = document.createDocumentFragment();
  if (!s) return frag;
  const teile = String(s).split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*)/g);
  for (const t of teile) {
    if (!t) continue;
    if (t.startsWith('[[')) {
      const [anzeige, schluessel = anzeige] = t.slice(2, -2).split('|');
      const eintrag = glossarEintrag(schluessel);
      frag.append(eintrag
        ? el('button', { type: 'button', class: 'begriff', onclick: (e) => { e.stopPropagation(); glossarFenster(eintrag); } }, anzeige)
        : anzeige);
    } else if (t.startsWith('**')) {
      frag.append(el('strong', {}, t.slice(2, -2)));
    } else frag.append(t);
  }
  return frag;
}

export const p = (s, cls) => el('p', { class: cls }, text(s));

// Unteres Blatt (Sheet) für Glossar, Regelkarte, Regelbuch
export function blatt(inhalt, { klasse = '', onzu } = {}) {
  const hinter = el('div', { class: 'blatt-hinter' });
  const zu = () => { hinter.remove(); onzu?.(); };
  const knopfZu = el('button', { type: 'button', class: 'blatt__zu', 'aria-label': 'Schließen', onclick: zu }, '✕');
  const box = el('div', { class: `blatt ${klasse}`, role: 'dialog', 'aria-modal': 'true' }, knopfZu, inhalt);
  hinter.append(box);
  hinter.addEventListener('click', (e) => { if (e.target === hinter) zu(); });
  document.body.append(hinter);
  knopfZu.focus({ preventScroll: true });
  return { zu, box };
}

export function glossarFenster(e) {
  blatt(el('div', { class: 'glossar' },
    el('h3', { class: 'glossar__begriff' }, e.begriff),
    p(e.erklaerung, 'glossar__satz'),
    e.beispiel ? el('p', { class: 'glossar__bsp' }, el('span', { class: 'glossar__bsp-label' }, 'Beispiel: '), text(e.beispiel)) : null,
  ), { klasse: 'blatt--klein' });
}

export function reducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
