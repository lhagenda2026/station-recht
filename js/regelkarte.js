// Regelkarte: Alltagssprache oben, Klausurformel einklappbar unten.
import { el, text, p } from './ui.js';

export function regelkarte(r, { kompakt = false, klausurOffen = false } = {}) {
  const teile = [
    el('header', { class: 'karte__kopf' },
      el('h3', { class: 'karte__titel' }, r.titel),
      el('p', { class: 'karte__fach' }, r.fachbegriff),
    ),
    p(r.einSatz, 'karte__satz'),
  ];
  if (!kompakt) {
    teile.push(
      abschnitt('Warum gibt es das?', p(r.warum)),
      abschnitt('Aus dem Alltag', p(r.alltag)),
    );
  }
  teile.push(abschnitt('So erkennst du es', el('ul', { class: 'karte__liste' }, r.erkennen.map((e) => el('li', {}, text(e))))));
  teile.push(el('p', { class: 'karte__trick' }, el('span', { class: 'karte__trick-icon', 'aria-hidden': 'true' }, '💡'), text(r.merktrick)));
  if (!kompakt) teile.push(klausurBlock(r, klausurOffen));
  return el('article', { class: `karte${kompakt ? ' karte--kompakt' : ''}` }, ...teile);
}

function abschnitt(titel, inhalt) {
  return el('section', { class: 'karte__abschnitt' }, el('h4', {}, titel), inhalt);
}

export function klausurBlock(r, offen = false) {
  const k = r.klausur;
  const zeilen = k.kurzantwort.split('\n').map((z) => el('p', { class: /^(- |\d+\. )/.test(z) ? 'klausur__punkt' : '' }, text(z)));
  return el('details', { class: 'klausur', open: offen },
    el('summary', {}, 'Für die Prüfung'),
    el('div', { class: 'klausur__text' }, zeilen),
    k.normen.length ? el('p', { class: 'klausur__normen' }, el('strong', {}, 'Normen: '), k.normen.join(', ')) : null,
    el('p', { class: 'klausur__begriffe' }, el('strong', {}, 'Schlüsselbegriffe: '), k.schluesselbegriffe.join(', ')),
    !r.verifiziert ? el('p', { class: 'klausur__warnung' }, 'Bitte mit Skript abgleichen.', ...(r.hinweise ?? []).map((h) => el('span', {}, ' ', h))) : null,
  );
}
