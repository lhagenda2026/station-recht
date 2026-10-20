import { h } from '../ui.js';

export function topbar(ctx, titel, rechts = null, zurueckZiel = 'station') {
  return h('header', { class: 'topbar' },
    h('button', { class: 'zurueck', type: 'button', 'aria-label': 'Zurück zur Station', onclick: () => ctx.go(zurueckZiel) },
      h('span', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' })),
    h('h1', {}, titel),
    h('div', { class: 'topbar-rechts' }, rechts));
}

export function leben(n, max = 3) {
  return h('div', { class: 'leben', 'aria-label': `${n} von ${max} Leben` },
    Array.from({ length: max }, (_, i) => h('span', { class: i < n ? 'herz voll' : 'herz leer', 'aria-hidden': 'true' }, i < n ? '♥' : '♡')));
}

// Kapitel-Filter für Spielmodi
export function kapitelWahl(ctx, aktiv, onWahl) {
  const optionen = [['alle', 'Alle Zimmer'], ...ctx.data.kapitel.map((k) => [k.id, k.titel])];
  return h('div', { class: 'kapitelwahl', role: 'radiogroup', 'aria-label': 'Zimmer wählen' },
    optionen.map(([id, titel]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(id === aktiv), class: id === aktiv ? 'chip aktiv' : 'chip', onclick: () => onWahl(id) }, titel)));
}

export function ergebnisScreen(ctx, { titel, zeilen, nochmal, gewonnen }) {
  return h('div', { class: 'ergebnis' + (gewonnen ? ' gewonnen' : '') },
    h('h2', {}, titel),
    h('ul', { class: 'ergebnis-zeilen' }, zeilen.map(([k, v]) => h('li', {}, h('span', {}, k), h('strong', {}, String(v))))),
    h('div', { class: 'aktionen' },
      nochmal ? h('button', { class: 'knopf knopf-haupt', type: 'button', onclick: nochmal }, 'Nochmal spielen') : null,
      h('button', { class: 'knopf', type: 'button', onclick: () => ctx.go('station') }, 'Zur Station')));
}

export function unverifiziert(karte) {
  return karte.verifiziert ? null : h('p', { class: 'unverifiziert' },
    h('span', { 'aria-hidden': 'true' }, '⚑ '), 'Nicht verifiziert – bitte mit Skript abgleichen.');
}
