// Modus A: Triage-Notaufnahme. Timer wird mit jedem Treffer schneller, 3 Leben.
import { h, shuffle, konfetti } from '../ui.js';
import { bonusXP } from '../store.js';
import { triageItem, sammle } from '../items.js';
import { topbar, leben, kapitelWahl, ergebnisScreen } from './common.js';

const START_MS = 14000, MIN_MS = 5000, FAKTOR = 0.9, MAX_FAELLE = 20;

export function triage(ctx) {
  const wrap = h('div', { class: 'screen spielscreen triagescreen' });
  const rechts = h('div', { class: 'spielstatus' });
  const buehne = h('div', { class: 'buehne' });
  wrap.append(topbar(ctx, 'Triage', rechts), buehne);
  let kapitel = 'alle';
  let aktuell = null;
  ctx.onLeave(() => aktuell?.abbrechen?.());

  function intro() {
    rechts.replaceChildren();
    const n = sammle(ctx, 'triage', kapitel).length;
    buehne.replaceChildren(h('div', { class: 'intro' },
      h('p', { class: 'intro-text' }, 'Fälle kommen in die Notaufnahme. Ordne jeden der richtigen Box zu – tippen oder bei zwei Boxen wischen. Mit jedem Treffer läuft die Uhr schneller. Drei Fehler, dann ist Schichtende.'),
      kapitelWahl(ctx, kapitel, (k) => { kapitel = k; intro(); }),
      h('p', { class: 'meta' }, `${n} Fälle im Pool`),
      h('div', { class: 'daumenleiste' }, h('button', { class: 'knopf knopf-haupt', type: 'button', onclick: runde }, 'Schicht beginnen'))));
  }

  function runde() {
    const faelle = shuffle(sammle(ctx, 'triage', kapitel)).slice(0, MAX_FAELLE);
    let i = 0, lebenAnz = 3, zeit = START_MS, treffer = 0;
    const zeigeStatus = () => rechts.replaceChildren(leben(lebenAnz), h('span', { class: 'punkte' }, `${treffer}`));
    function naechster() {
      if (lebenAnz <= 0 || i >= faelle.length) return ende();
      zeigeStatus();
      aktuell = triageItem(ctx, faelle[i++], {
        zeitMs: zeit,
        onAntwort: (ok) => {
          if (ok) { treffer++; zeit = Math.max(MIN_MS, zeit * FAKTOR); } else lebenAnz--;
          zeigeStatus();
        },
        onWeiter: naechster,
      });
      buehne.replaceChildren(h('p', { class: 'fortschritt' }, `Fall ${i} von ${faelle.length}`), aktuell);
    }
    function ende() {
      const geschafft = lebenAnz > 0;
      if (geschafft) { bonusXP(15); konfetti(); }
      buehne.replaceChildren(ergebnisScreen(ctx, {
        titel: geschafft ? 'Notaufnahme geräumt' : 'Schichtende – drei Fehler',
        gewonnen: geschafft,
        zeilen: [['Richtig triagiert', `${treffer} von ${i}`], ['Letztes Tempo', `${(zeit / 1000).toFixed(1)} s pro Fall`]],
        nochmal: runde,
      }));
    }
    naechster();
  }
  intro();
  return wrap;
}
