// Gemeinsame Antwortknöpfe (F4, F5): große Karten im Daumenbereich.
import { el, text } from '../ui.js';

export function wahlKnoepfe(fall, ctx, { klasse = '' } = {}) {
  return el('div', { class: `wahl ${klasse}`, role: 'group', 'aria-label': 'Antwort wählen' },
    fall.optionen.map((o, i) => el('button', {
      type: 'button', class: 'wahl__knopf', 'data-option': i,
      onclick: () => ctx.antwort({ richtig: o.richtig, gewaehlt: [o] }),
    }, text(o.text))));
}
