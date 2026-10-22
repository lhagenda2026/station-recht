// F4 Frist-Check: zwei Kalenderblätter, dann „Rechtzeitig?“ mit drei Antworten.
import { el, text } from '../ui.js';
import { wahlKnoepfe } from './wahl.js';

const TAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function blatt(iso, label) {
  const d = new Date(`${iso}T12:00:00`);
  return el('div', { class: 'kalender', 'aria-label': `${label}: ${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}` },
    el('span', { class: 'kalender__label' }, label),
    el('span', { class: 'kalender__monat', 'aria-hidden': 'true' }, `${MONATE[d.getMonth()]} ${d.getFullYear()}`),
    el('span', { class: 'kalender__tag', 'aria-hidden': 'true' }, String(d.getDate())),
    el('span', { class: 'kalender__wochentag', 'aria-hidden': 'true' }, TAGE[d.getDay()]),
  );
}

export function f4(fall, ctx) {
  const mitte = el('div', { class: 'kalender-paar' },
    blatt(fall.datumA, fall.labelA ?? 'Bescheid zur Post'),
    el('span', { class: 'kalender-paar__pfeil', 'aria-hidden': 'true' }, '→'),
    blatt(fall.datumB, fall.labelB ?? 'Widerspruch kommt an'),
  );
  return { mitte, unten: wahlKnoepfe(fall, ctx) };
}

