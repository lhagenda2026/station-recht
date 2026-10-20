// Modus C: Fristen-Bombe. 10 Bomben pro Runde, Schwerpunkt Sozialprozessrecht.
import { h, shuffle, konfetti } from '../ui.js';
import { bonusXP } from '../store.js';
import { bombeItem, sammle } from '../items.js';
import { topbar, ergebnisScreen } from './common.js';

const BOMBEN = 10;

export function bombe(ctx) {
  const wrap = h('div', { class: 'screen spielscreen bombescreen' });
  const rechts = h('div', { class: 'spielstatus' });
  const buehne = h('div', { class: 'buehne' });
  wrap.append(topbar(ctx, 'Fristen-Bombe', rechts), buehne);
  let aktuell = null;
  ctx.onLeave(() => aktuell?.abbrechen?.());

  function intro() {
    rechts.replaceChildren();
    buehne.replaceChildren(h('div', { class: 'intro' },
      h('p', { class: 'intro-text' }, 'Zehn Bomben, jede mit einer Frage zu Fristen, Fristbeginn, Rechtsfolgen oder Klageart. Durchtrenne das richtige Kabel, bevor die Zündschnur abbrennt. Jedes falsche Kabel lässt sie schneller brennen.'),
      h('p', { class: 'meta' }, `${sammle(ctx, 'fristen').length} Szenarien im Pool`),
      h('div', { class: 'daumenleiste' }, h('button', { class: 'knopf knopf-haupt', type: 'button', onclick: runde }, 'Erste Bombe'))));
  }

  function runde() {
    // Sozialprozessrecht bevorzugt: erst diese Szenarien mischen, dann mit dem Rest auffüllen
    const sgg = shuffle(sammle(ctx, 'fristen', 'sozialprozessrecht'));
    const rest = shuffle(sammle(ctx, 'fristen').filter((f) => !sgg.includes(f)));
    const bomben = shuffle([...sgg.slice(0, 7), ...rest].slice(0, BOMBEN));
    let i = 0, entschaerft = 0;
    function naechste() {
      if (i >= bomben.length) return ende();
      rechts.replaceChildren(h('span', { class: 'punkte' }, `${entschaerft}/${i}`));
      aktuell = bombeItem(ctx, bomben[i++], {
        onAntwort: (ok) => { if (ok) entschaerft++; rechts.replaceChildren(h('span', { class: 'punkte' }, `${entschaerft}/${i}`)); },
        onWeiter: naechste,
      });
      buehne.replaceChildren(h('p', { class: 'fortschritt' }, `Bombe ${i} von ${bomben.length}`), aktuell);
      window.scrollTo(0, 0);
    }
    function ende() {
      const gut = entschaerft >= 7;
      if (gut) { bonusXP(15); konfetti(); }
      buehne.replaceChildren(ergebnisScreen(ctx, {
        titel: gut ? 'Station gerettet' : 'Ein paar Bomben sind hochgegangen',
        gewonnen: gut,
        zeilen: [['Entschärft', `${entschaerft} von ${bomben.length}`]],
        nochmal: runde,
      }));
    }
    naechste();
  }
  intro();
  return wrap;
}
