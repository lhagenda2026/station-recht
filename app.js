// Einstieg: Daten laden, Service Worker registrieren, Hash-Router.
import { load, persistAnfragen } from './js/store.js';
import { h } from './js/ui.js';
import { station } from './js/screens/station.js';
import { zimmer } from './js/screens/zimmer.js';
import { lernkarteScreen } from './js/screens/lernkarte.js';
import { visite } from './js/screens/visite.js';
import { triage } from './js/screens/triage.js';
import { luege } from './js/screens/luege.js';
import { bombe } from './js/screens/bombe.js';
import { oberarzt } from './js/screens/oberarzt.js';
import { schema } from './js/screens/schema.js';
import { einstellungen } from './js/screens/einstellungen.js';

const ROUTES = { station, zimmer, karte: lernkarteScreen, visite, triage, luege, bombe, oberarzt, schema, einstellungen };
const app = document.getElementById('app');
let aufraeumen = [];

const ctx = {
  data: null,
  go: (pfad) => { location.hash = '#/' + pfad; },
  zurueck: () => { if (history.length > 1) history.back(); else ctx.go('station'); },
  onLeave: (fn) => aufraeumen.push(fn),
  karte: (id) => ctx.data.karten.find((k) => k.id === id),
};

function route() {
  aufraeumen.forEach((fn) => fn());
  aufraeumen = [];
  const [name, ...params] = (location.hash.replace(/^#\/?/, '').split('?')[0] || 'station').split('/');
  const screen = ROUTES[name] ?? station;
  app.replaceChildren(screen(ctx, ...params.map(decodeURIComponent)));
  app.dataset.screen = name in ROUTES ? name : 'station';
  window.scrollTo(0, 0);
}

async function start() {
  load();
  persistAnfragen();
  try {
    const res = await fetch('data/cards.json');
    ctx.data = await res.json();
  } catch {
    app.replaceChildren(h('p', { class: 'laden' }, 'Die Kartendaten konnten nicht geladen werden. Öffne die App einmal mit Internetverbindung.'));
    return;
  }
  addEventListener('hashchange', route);
  route();
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
