// Regelkarte: Alltagssprache oben, Klausurformel (wörtlich aus ANTWORTEN.md) einklappbar unten.
import { h, txt } from './ui.js';
import { STOCKWERKE } from './lernen.js';

export function regelkarte(r, { kompakt = false, klausurOffen = false } = {}) {
  if (kompakt) {
    return h('article', { class: 'regelkarte kompakt', 'data-regel': r.id },
      h('p', { class: 'rk-titel' }, txt(r.titel)),
      h('p', { class: 'rk-satz' }, txt(r.einSatz)),
      h('ul', { class: 'rk-check' }, r.erkennen.map((e) => h('li', {}, txt(e)))));
  }
  return h('article', { class: 'regelkarte', 'data-regel': r.id },
    h('header', { class: 'rk-kopf' },
      h('p', { class: 'rk-nr' }, h('span', {}, `Regel ${r.nr}`), h('span', { class: 'rk-etage' }, STOCKWERKE[r.stockwerk].name)),
      h('h2', { class: 'rk-titel' }, txt(r.titel)),
      h('p', { class: 'rk-fach' }, 'Fachbegriff: ', txt(r.fachbegriff))),
    h('p', { class: 'rk-satz' }, txt(r.einSatz)),
    abschnitt('Warum gibt es das?', h('p', {}, txt(r.warum))),
    abschnitt('Aus dem Alltag', h('p', {}, txt(r.alltag)), 'alltag'),
    abschnitt('So erkennst du es', h('ul', { class: 'rk-check' }, r.erkennen.map((e) => h('li', {}, txt(e))))),
    abschnitt('Merktrick', h('p', {}, txt(r.merktrick)), 'merk'),
    klausur(r, klausurOffen));
}

const abschnitt = (titel, inhalt, klasse = '') => h('section', { class: `rk-teil ${klasse}` }, h('h3', {}, titel), inhalt);

function klausur(r, offen) {
  const k = r.klausur;
  return h('details', { class: 'rk-klausur', open: offen || null },
    h('summary', {}, 'Für die Prüfung: die Klausurformel'),
    !r.verifiziert && h('p', { class: 'rk-hinweis' }, 'Bitte mit dem Skript abgleichen: Diese Antwort ist noch nicht sicher geprüft.',
      ...(r.hinweise ?? []).map((t) => h('span', { class: 'rk-hinweis-detail' }, t))),
    markdown(k.kurzantwort),
    k.details && markdown(k.details),
    k.normen.length > 0 && h('p', { class: 'rk-normen' }, h('strong', {}, 'Normen: '), k.normen.join(', ')),
    h('p', { class: 'rk-begriffe' }, h('strong', {}, 'Schlüsselbegriffe: '), k.schluesselbegriffe.join(', ')),
    r.normhinweis && h('p', { class: 'rk-hinweis klein' }, r.normhinweis));
}

/** Minimales Markdown für die Klausurformel: Absätze, Listen, Tabellen, **fett**. */
export function markdown(text) {
  const box = h('div', { class: 'md' });
  let liste = null, tabelle = null;
  for (const zeile of text.split('\n')) {
    const z = zeile.trim();
    if (!z) { liste = tabelle = null; continue; }
    if (z.startsWith('|')) {
      if (/^\|[-\s|]+\|$/.test(z)) continue;
      const zellen = z.slice(1, -1).split('|').map((c) => c.trim());
      if (!tabelle) { tabelle = h('table'); box.append(tabelle); tabelle.append(h('tr', {}, zellen.map((c) => h('th', {}, txt(c))))); continue; }
      tabelle.append(h('tr', {}, zellen.map((c) => h('td', {}, txt(c)))));
      continue;
    }
    const m = z.match(/^(- |\d+\. )(.*)$/);
    if (m) {
      const typ = m[1] === '- ' ? 'ul' : 'ol';
      if (!liste || liste.tagName.toLowerCase() !== typ) { liste = h(typ); box.append(liste); }
      liste.append(h('li', {}, txt(m[2])));
      continue;
    }
    liste = tabelle = null;
    box.append(h('p', {}, txt(z)));
  }
  return box;
}
