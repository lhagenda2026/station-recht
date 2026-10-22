// Einstieg: Spielstand und Daten laden, Service Worker registrieren, Szenen wechseln.
import { S, load, persistAnfragen } from './js/store.js';
import { ladeDaten } from './js/daten.js';
import { h } from './js/ui.js';
import { buero } from './js/szenen/buero.js';
import { starteTag, weiterArbeiten, startePruefung } from './js/szenen/tag.js';
import { einstellungen } from './js/szenen/einstellungen.js';

const app = document.getElementById('app');

const nav = {
  buero: () => { aufraeumen(); buero(app, nav); },
  tag: () => { aufraeumen(); starteTag(app, nav); },
  weiter: () => { aufraeumen(); weiterArbeiten(app, nav); },
  pruefung: (st) => { aufraeumen(); startePruefung(app, nav, st); },
  einstellungen: () => { aufraeumen(); einstellungen(app, nav); },
  schrift: () => document.documentElement.style.setProperty('--schrift', S.einstellungen.schrift),
};

function aufraeumen() {
  document.querySelectorAll('.blatt-huelle, .glossar-huelle, .geist').forEach((e) => e.remove());
  window.scrollTo(0, 0);
}

async function start() {
  load();
  nav.schrift();
  persistAnfragen();
  try {
    await ladeDaten();
  } catch {
    app.replaceChildren(h('p', { class: 'laden' }, 'Die Spieldaten konnten nicht geladen werden. Öffne das Spiel einmal mit Internetverbindung.'));
    return;
  }
  nav.buero();
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// iOS: Doppeltipp-Zoom und Pinch verhindern
document.addEventListener('gesturestart', (e) => e.preventDefault());
let letzterTouch = 0;
document.addEventListener('touchend', (e) => {
  const t = Date.now();
  if (t - letzterTouch < 300 && !e.target.closest('textarea, input')) e.preventDefault();
  letzterTouch = t;
}, { passive: false });

start();
