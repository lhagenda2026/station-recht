// Pflicht-Modus Lernkarte: Frage → Begriffe abrufen → Häppchen aufdecken → Chips antippen → Bewertung.
import { h, md, konfetti } from '../ui.js';
import { grade } from '../store.js';
import { topbar, unverifiziert } from './common.js';

export function bewertung(anteil) {
  return anteil >= 0.8 ? 'sitzt' : anteil >= 0.4 ? 'wackelt' : 'weg';
}
const LABEL = { sitzt: 'Sitzt', wackelt: 'Wackelt', weg: 'Weg' };

// Liefert ein Element; onDone(result, gradeInfo) nach der Bewertung
export function lernkarte(ctx, karte, onDone, { fortschritt = null } = {}) {
  const getroffen = new Set();
  let stufe = 0; // 0 Abruf, 1 Kurzantwort, 2 Details

  const chips = karte.schluesselbegriffe.map((b, i) => h('button', {
    type: 'button', class: 'chip begriff', 'aria-pressed': 'false', disabled: true,
    onclick: (e) => {
      getroffen.has(i) ? getroffen.delete(i) : getroffen.add(i);
      e.currentTarget.setAttribute('aria-pressed', String(getroffen.has(i)));
      zaehler.textContent = `${getroffen.size} von ${chips.length} gewusst`;
    },
  }, h('span', { class: 'haken', 'aria-hidden': 'true' }, '✓'), b));
  const zaehler = h('span', { class: 'chip-zaehler' });
  const chipHinweis = h('p', { class: 'hinweis' }, 'Ruf diese Begriffe im Kopf ab und formuliere die Antwort, bevor du aufdeckst.');

  const kurz = h('section', { class: 'aufdeck kurzantwort', hidden: true },
    h('h3', {}, 'Kurzantwort'), h('div', { class: 'text', html: md(karte.kurzantwort) }),
    karte.normpruefung ? h('p', { class: 'normpruefung' }, karte.normpruefung) : null,
    karte.eselsbruecke ? h('p', { class: 'eselsbruecke' }, h('span', { class: 'esel-label' }, 'Merksatz '), karte.eselsbruecke) : null);

  const details = h('section', { class: 'aufdeck details', hidden: true },
    karte.langantwort ? h('div', { class: 'text', html: md(karte.langantwort) }) : null,
    karte.hinweise.length ? h('div', { class: 'hinweise' }, karte.hinweise.map((t) => h('p', { html: md(t) }))) : null,
    karte.beispielfall ? h('div', { class: 'beispielfall' },
      h('h3', {}, 'Beispielfall: ', karte.beispielfall.titel),
      h('p', { class: 'sachverhalt' }, karte.beispielfall.sachverhalt),
      h('details', {}, h('summary', {}, 'Lösung anzeigen'), h('div', { class: 'text', html: md(karte.beispielfall.loesung) }))) : null,
    karte.luecken.length ? h('div', { class: 'luecken' }, h('h3', {}, 'Lückentest'),
      karte.luecken.map((l) => {
        const [vor, nach] = l.text.split('___');
        const loes = h('button', { type: 'button', class: 'luecke', 'aria-label': 'Lösung aufdecken', onclick: (e) => { e.currentTarget.classList.add('offen'); e.currentTarget.textContent = l.loesung; } }, '· · ·');
        return h('p', {}, vor, loes, nach);
      })) : null,
    karte.normen.length ? h('p', { class: 'normen' }, h('span', {}, 'Normen: '), karte.normen.join(' · ')) : null);

  const aktion = h('button', { type: 'button', class: 'knopf knopf-haupt' }, 'Antwort aufdecken');
  const nebenAktion = h('button', { type: 'button', class: 'knopf', hidden: true }, 'Details');

  function zeigeKurz() {
    stufe = 1;
    kurz.hidden = false;
    chips.forEach((c) => { c.disabled = false; });
    chipHinweis.textContent = 'Tippe die Begriffe an, die du hattest.';
    zaehler.textContent = `0 von ${chips.length} gewusst`;
    aktion.textContent = 'Bewerten';
    if (karte.langantwort || karte.beispielfall || karte.luecken.length || karte.hinweise.length) nebenAktion.hidden = false;
    kurz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function zeigeDetails() {
    stufe = 2;
    details.hidden = false;
    nebenAktion.hidden = true;
    details.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function bewerten() {
    const result = bewertung(getroffen.size / chips.length);
    const info = grade(karte.id, result);
    if (info.entlassen) konfetti();
    aktion.disabled = true;
    nebenAktion.hidden = true;
    chips.forEach((c) => { c.disabled = true; });
    urteil.hidden = false;
    urteil.className = `urteil u-${result}`;
    urteil.textContent = `${LABEL[result]} · ${getroffen.size}/${chips.length} Begriffe · Box ${info.vorher} → ${info.nachher}${info.entlassen ? ' · entlassen!' : ''}`;
    setTimeout(() => onDone(result, info), 900);
  }
  aktion.addEventListener('click', () => (stufe === 0 ? zeigeKurz() : bewerten()));
  nebenAktion.addEventListener('click', zeigeDetails);
  const urteil = h('p', { class: 'urteil', hidden: true, role: 'status' });

  return h('article', { class: 'lernkarte' },
    h('div', { class: 'karten-meta' },
      h('span', { class: `kanal-punkt kap-${karte.kapitel}` }, `Frage ${karte.nr}`),
      fortschritt ? h('span', {}, fortschritt) : null),
    h('h2', { class: 'frage' }, karte.frage),
    unverifiziert(karte),
    h('div', { class: 'begriffe' }, chipHinweis, h('div', { class: 'chips' }, chips), zaehler),
    kurz, details, urteil,
    h('div', { class: 'daumenleiste' }, nebenAktion, aktion));
}

// Einzelkarte aus dem Zimmer heraus
export function lernkarteScreen(ctx, id) {
  const karte = ctx.karte(id) ?? ctx.data.karten[0];
  const wrap = h('div', { class: 'screen kartenscreen' }, topbar(ctx, `Zimmer: Frage ${karte.nr}`, null, `zimmer/${karte.kapitel}`));
  wrap.append(lernkarte(ctx, karte, () => {
    const ks = ctx.data.karten.filter((k) => k.kapitel === karte.kapitel);
    const next = ks[ks.indexOf(karte) + 1];
    wrap.append(h('div', { class: 'daumenleiste nach-bewertung' },
      h('button', { class: 'knopf', type: 'button', onclick: () => ctx.go(`zimmer/${karte.kapitel}`) }, 'Zum Zimmer'),
      next ? h('button', { class: 'knopf knopf-haupt', type: 'button', onclick: () => ctx.go(`karte/${next.id}`) }, `Frage ${next.nr}`) : null));
    wrap.querySelector('.lernkarte > .daumenleiste')?.remove();
  }));
  return wrap;
}
