// Regelbuch: alle bisher gesehenen Regeln, nach Stockwerk. Im Fall kostet das Aufschlagen (siehe schalter.js).
import { h, txt, blatt, klar } from '../ui.js';
import { S } from '../store.js';
import { D } from '../daten.js';
import { STOCKWERKE, STUFEN } from '../lernen.js';
import { regelkarte } from '../regelkarte.js';

export function regelbuchBlatt({ imFall = false, alle = false } = {}) {
  const bekannt = D.regeln.filter((r) => alle || S.regeln[r.id]?.gesehen);
  const liste = h('div', { class: 'rb-liste' });
  const suche = h('input', { class: 'rb-suche', type: 'search', placeholder: 'Suchen, z. B. Frist', 'aria-label': 'Regeln durchsuchen', enterkeyhint: 'search' });
  const inhalt = h('div', { class: 'rb-inhalt' });

  function zeigeListe() {
    const q = suche.value.trim().toLowerCase();
    liste.replaceChildren();
    for (let st = 1; st <= 4; st++) {
      const rs = bekannt.filter((r) => r.stockwerk === st && (!q || klar(`${r.titel} ${r.fachbegriff} ${r.einSatz}`).toLowerCase().includes(q)));
      if (!rs.length) continue;
      liste.append(h('h3', { class: 'rb-etage' }, `${STOCKWERKE[st].etage}: ${STOCKWERKE[st].name}`),
        h('ul', {}, rs.map((r) => h('li', {}, h('button', { class: 'rb-eintrag', type: 'button', onClick: () => zeigeKarte(r) },
          h('span', { class: 'rb-titel' }, txt(r.fachbegriff)),
          h('span', { class: 'rb-sub' }, klar(r.titel)),
          h('span', { class: `rb-stufe s${S.regeln[r.id]?.stufe ?? 0}` }, S.regeln[r.id]?.gemeistert ? 'Gemeistert' : STUFEN[S.regeln[r.id]?.stufe ?? 0]))))));
    }
    if (!liste.children.length) liste.append(h('p', { class: 'leer-hinweis' }, bekannt.length ? 'Nichts gefunden. Probier ein anderes Wort.' : 'Noch leer. Jede Regel, die du am Schalter kennenlernst, landet hier.'));
    inhalt.replaceChildren(suche, liste);
  }

  function zeigeKarte(r) {
    inhalt.replaceChildren(
      h('button', { class: 'knopf leise klein zurueck', type: 'button', onClick: zeigeListe }, 'Zurück zur Liste'),
      regelkarte(r));
    b.el.scrollTop = 0;
  }

  suche.addEventListener('input', zeigeListe);
  const b = blatt([
    h('header', { class: 'rb-kopf' }, h('h2', {}, 'Regelbuch'),
      imFall && h('p', { class: 'rb-kosten' }, 'Aufgeschlagen: Für diesen Fall gibt es höchstens 2 Sterne, und die Geduld sinkt schneller.')),
    inhalt,
    h('button', { class: 'knopf', type: 'button', onClick: () => b.schliessen() }, imFall ? 'Zurück zur Akte' : 'Schließen'),
  ], { klasse: 'regelbuch-blatt' });
  zeigeListe();
  return b;
}
