// Modus D (Schema-Tetris, vereinfacht): Prüfungsschritte in die richtige Reihenfolge tippen.
import { h, shuffle, konfetti } from '../ui.js';
import { grade, bonusXP } from '../store.js';
import { topbar, ergebnisScreen } from './common.js';

export function schema(ctx) {
  const wrap = h('div', { class: 'screen spielscreen schemascreen' });
  const rechts = h('div', { class: 'spielstatus' });
  const buehne = h('div', { class: 'buehne' });
  wrap.append(topbar(ctx, 'Schema-OP', rechts), buehne);

  function runde() {
    const karten = shuffle(ctx.data.karten.filter((k) => k.reihenfolge)).slice(0, 5);
    let i = 0, sauber = 0;
    function naechstes() {
      if (i >= karten.length) return ende();
      const k = karten[i++];
      const schritte = k.reihenfolge.schritte;
      let pos = 0, fehler = 0;
      rechts.replaceChildren(h('span', { class: 'punkte' }, `${i}/${karten.length}`));
      const gelegt = h('ol', { class: 'gelegt', 'aria-label': 'Deine Reihenfolge' });
      const feedback = h('div', { class: 'feedback', role: 'status' });
      const bloecke = h('div', { class: 'bloecke' }, shuffle(schritte.map((s, idx) => ({ s, idx }))).map(({ s, idx }) =>
        h('button', { type: 'button', class: 'block', onclick: (e) => tippe(idx, e.currentTarget) }, s)));
      function tippe(idx, el) {
        if (idx === pos) {
          el.remove();
          gelegt.append(h('li', {}, schritte[idx]));
          pos++;
          if (pos === schritte.length) {
            const result = fehler === 0 ? 'sitzt' : fehler <= 2 ? 'wackelt' : 'weg';
            if (!fehler) sauber++;
            grade(k.id, result);
            feedback.replaceChildren(h('p', { class: fehler ? 'fehl-text' : 'ok-text' }, fehler ? `Fertig mit ${fehler} Fehlgriff${fehler > 1 ? 'en' : ''}.` : '✓ Sauber operiert.'),
              h('button', { type: 'button', class: 'knopf knopf-haupt weiter', onclick: naechstes }, 'Weiter'));
          }
        } else {
          fehler++;
          el.classList.remove('falsch');
          void el.offsetWidth;
          el.classList.add('falsch');
        }
      }
      buehne.replaceChildren(h('p', { class: 'fortschritt' }, `Frage ${k.nr}`),
        h('h2', { class: 'schema-titel' }, k.reihenfolge.titel),
        h('p', { class: 'auftrag' }, 'Tippe die Schritte in der richtigen Reihenfolge. Falsche Blöcke bleiben liegen.'),
        gelegt, bloecke, feedback);
      window.scrollTo(0, 0);
    }
    function ende() {
      if (sauber >= 3) { bonusXP(10); konfetti(); }
      buehne.replaceChildren(ergebnisScreen(ctx, { titel: 'OP beendet', gewonnen: sauber >= 3, zeilen: [['Fehlerfrei geordnet', `${sauber} von ${karten.length}`]], nochmal: runde }));
    }
    naechstes();
  }
  runde();
  return wrap;
}
