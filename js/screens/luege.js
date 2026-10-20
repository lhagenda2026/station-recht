// Modus B: Zwei Wahrheiten, eine Lüge. 10 Runden.
import { h, shuffle, konfetti } from '../ui.js';
import { bonusXP } from '../store.js';
import { luegeItem, sammle } from '../items.js';
import { topbar, kapitelWahl, ergebnisScreen } from './common.js';

const RUNDEN = 10;

export function luege(ctx) {
  const wrap = h('div', { class: 'screen spielscreen luegescreen' });
  const rechts = h('div', { class: 'spielstatus' });
  const buehne = h('div', { class: 'buehne' });
  wrap.append(topbar(ctx, 'Zwei Wahrheiten, eine Lüge', rechts), buehne);
  let kapitel = 'alle';

  function intro() {
    rechts.replaceChildren();
    buehne.replaceChildren(h('div', { class: 'intro' },
      h('p', { class: 'intro-text' }, 'Drei Aussagen, eine davon ist subtil falsch: vertauschte Merkmale, falsche Frist oder falsche Norm. Finde die Lüge.'),
      kapitelWahl(ctx, kapitel, (k) => { kapitel = k; intro(); }),
      h('p', { class: 'meta' }, `${sammle(ctx, 'luegen', kapitel).length} Sets im Pool`),
      h('div', { class: 'daumenleiste' }, h('button', { class: 'knopf knopf-haupt', type: 'button', onclick: runde }, 'Los geht’s'))));
  }

  function runde() {
    const sets = shuffle(sammle(ctx, 'luegen', kapitel)).slice(0, RUNDEN);
    let i = 0, treffer = 0;
    function naechste() {
      if (i >= sets.length) return ende();
      rechts.replaceChildren(h('span', { class: 'punkte' }, `${treffer}/${i}`));
      const item = luegeItem(ctx, sets[i++], { onAntwort: (ok) => { if (ok) treffer++; rechts.replaceChildren(h('span', { class: 'punkte' }, `${treffer}/${i}`)); }, onWeiter: naechste });
      buehne.replaceChildren(h('p', { class: 'fortschritt' }, `Runde ${i} von ${sets.length}`), item);
      window.scrollTo(0, 0);
    }
    function ende() {
      const gut = treffer >= Math.ceil(sets.length * 0.7);
      if (gut) { bonusXP(15); konfetti(); }
      buehne.replaceChildren(ergebnisScreen(ctx, {
        titel: gut ? 'Kein Märchen kommt an dir vorbei' : 'Ein paar Lügen sind durchgerutscht',
        gewonnen: gut,
        zeilen: [['Lügen entlarvt', `${treffer} von ${sets.length}`]],
        nochmal: runde,
      }));
    }
    naechste();
  }
  intro();
  return wrap;
}
