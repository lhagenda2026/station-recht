// Visite: Tagesqueue mit max. 10 Karten als Lernkarten.
import { h, konfetti } from '../ui.js';
import { visiteQueue, bonusXP } from '../store.js';
import { topbar, ergebnisScreen } from './common.js';
import { lernkarte } from './lernkarte.js';

export function visite(ctx) {
  const wrap = h('div', { class: 'screen visitescreen' });
  const queue = visiteQueue(ctx.data.karten);
  const status = h('span', { class: 'visite-status' });
  const buehne = h('div', { class: 'buehne' });
  wrap.append(topbar(ctx, 'Visite', status), buehne);
  const ergebnis = { sitzt: 0, wackelt: 0, weg: 0, xp: 0 };

  if (!queue.length) {
    buehne.append(h('div', { class: 'leer' },
      h('h2', {}, 'Alle Patienten sind versorgt.'),
      h('p', {}, 'Heute ist nichts fällig. Halte die Station im Trainingsraum fit oder schau morgen wieder vorbei.'),
      h('button', { class: 'knopf knopf-haupt', type: 'button', onclick: () => ctx.go('triage') }, 'Triage spielen')));
    return wrap;
  }

  let i = 0;
  function zeige() {
    if (i >= queue.length) return fertig();
    status.textContent = `${i + 1}/${queue.length}`;
    const karte = ctx.karte(queue[i]);
    buehne.replaceChildren(lernkarte(ctx, karte, (result, info) => {
      ergebnis[result]++;
      ergebnis.xp += info.xp;
      i++;
      zeige();
    }, { fortschritt: `Patient ${i + 1} von ${queue.length}` }));
    window.scrollTo(0, 0);
  }
  function fertig() {
    status.textContent = '';
    bonusXP(20);
    konfetti();
    buehne.replaceChildren(ergebnisScreen(ctx, {
      titel: 'Visite abgeschlossen',
      gewonnen: true,
      zeilen: [['Sitzt', ergebnis.sitzt], ['Wackelt', ergebnis.wackelt], ['Weg', ergebnis.weg], ['XP inkl. Visite-Bonus', ergebnis.xp + 20]],
      nochmal: visiteQueue(ctx.data.karten).length ? () => { location.hash = '#/visite?' + Date.now(); } : null,
    }));
  }
  zeige();
  return wrap;
}
