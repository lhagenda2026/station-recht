// F4 Frist-Check: zwei Kalenderblätter, drei Antworten. Die Rechnung steht im Feedback.
import { h, txt } from '../ui.js';
import { f1, zettelAuswahl } from './f1.js';

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function blattKalender({ label, datum }) {
  const [j, m, t] = datum.split('-').map(Number);
  const d = new Date(Date.UTC(j, m - 1, t));
  return h('div', { class: 'kalenderblatt' },
    h('span', { class: 'kal-label' }, txt(label)),
    h('span', { class: 'kal-monat' }, `${MONATE[m - 1]} ${j}`),
    h('span', { class: 'kal-tag' }, String(t)),
    h('span', { class: 'kal-wochentag' }, TAGE[d.getUTCDay()]));
}

export function f4(fall, ctx) {
  const kurzeOptionen = fall.optionen.every((o) => o.text.split(/\s+/).length <= 4);
  const auswahl = kurzeOptionen ? f1(fall, ctx).steuerung : zettelAuswahl(fall.optionen, ctx);
  return {
    akte: h('div', { class: 'kalender' }, blattKalender(fall.datumA), h('span', { class: 'kal-pfeil', 'aria-hidden': 'true' }), blattKalender(fall.datumB)),
    steuerung: auswahl,
  };
}
