// F5 Praktikanten-Frage: Ole fragt, du wählst eine von drei Erklärungen.
import { h } from '../ui.js';
import { zettelAuswahl } from './f1.js';

export function f5(fall, ctx) {
  return {
    akte: h('div', { class: 'ole-frage' }, h('span', { class: 'ole-sagt' }, 'Ole fragt dich:')),
    steuerung: zettelAuswahl(fall.optionen, ctx),
  };
}
