// F5 Praktikanten-Frage: Ole fragt, du wählst die richtige Erklärung in einfacher Sprache.
import { el, text } from '../ui.js';
import { wahlKnoepfe } from './wahl.js';

export function f5(fall, ctx) {
  const akte = el('div', { class: 'ole' },
    el('span', { class: 'ole__gesicht', 'aria-hidden': 'true' }, '🧑‍🎓'),
    el('p', { class: 'ole__frage' }, el('strong', {}, 'Ole fragt: '), text(fall.akte)));
  return { akte, unten: wahlKnoepfe(fall, ctx, { klasse: 'wahl--lang' }) };
}
