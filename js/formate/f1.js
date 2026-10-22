// F1 Stempeln: 2 bis 4 große Stempel, Antwort = Stempel auf die Akte schlagen.
import { el } from '../ui.js';

const FARBEN = ['gruen', 'rot', 'blau', 'violett'];

export function f1(fall, ctx) {
  const leiste = el('div', { class: 'stempel-leiste', role: 'group', 'aria-label': 'Stempel wählen' });
  fall.optionen.forEach((o, i) => {
    const farbe = o.farbe ?? FARBEN[i % FARBEN.length];
    leiste.append(el('button', {
      type: 'button',
      class: `stempel stempel--${farbe}`,
      'data-option': i,
      onclick: () => ctx.antwort({ richtig: o.richtig, gewaehlt: [o], stempel: { text: o.text, farbe } }),
    }, el('span', { class: 'stempel__griff', 'aria-hidden': 'true' }), el('span', { class: 'stempel__text' }, o.text)));
  });
  return { unten: leiste };
}
