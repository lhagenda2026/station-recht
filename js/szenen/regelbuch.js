// Regelbuch aus der Schublade: alle schon eingeführten Regeln, durchsuchbar.
import { el, blatt } from '../ui.js';
import { getDaten, verfuegbareRegeln } from '../tag.js';
import { istNeu, regel } from '../store.js';
import { regelkarte } from '../regelkarte.js';
import { STUFEN } from './schalter.js';

export function regelbuch({ onzu, alle = false } = {}) {
  const regeln = (alle ? getDaten().regeln : verfuegbareRegeln()).filter((r) => !istNeu(r.id));
  const liste = el('ul', { class: 'buch__liste' });
  const suche = el('input', { type: 'search', class: 'buch__suche', placeholder: 'Regel suchen', 'aria-label': 'Regel suchen', autocomplete: 'off' });
  const ansicht = el('div', { class: 'buch__ansicht' });
  function zeigeListe() {
    const q = suche.value.trim().toLowerCase();
    liste.replaceChildren(...regeln
      .filter((r) => !q || `${r.titel} ${r.fachbegriff}`.toLowerCase().includes(q))
      .map((r) => el('li', {}, el('button', { type: 'button', class: 'buch__eintrag', onclick: () => oeffne(r) },
        el('span', { class: 'buch__titel' }, r.titel),
        el('span', { class: 'buch__fach' }, `${r.fachbegriff} · ${STUFEN[regel(r.id).stufe]}`)))));
    if (!liste.children.length) liste.append(el('li', { class: 'buch__leer' }, regeln.length ? 'Nichts gefunden.' : 'Noch keine Regeln gelernt. Die erste kommt in der Morgenbesprechung.'));
    ansicht.replaceChildren(suche, liste);
  }
  function oeffne(r) {
    ansicht.replaceChildren(el('button', { type: 'button', class: 'buch__zurueck', onclick: zeigeListe }, '‹ Alle Regeln'), regelkarte(r));
    ansicht.scrollTop = 0;
  }
  suche.addEventListener('input', zeigeListe);
  zeigeListe();
  return blatt(el('div', { class: 'buch' }, el('h3', { class: 'buch__kopf' }, 'Regelbuch'), ansicht), { klasse: 'blatt--buch', onzu });
}
