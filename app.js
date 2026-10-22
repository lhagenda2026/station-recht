// Bescheid, bitte! – Ablauf: Büro → Morgenbesprechung → Schalter → Feierabend → Büro.
import { load, persistAnfragen, getState } from './js/store.js';
import { ladeDaten, planeTag, planePruefung, getDaten } from './js/tag.js';
import { el, zeige } from './js/ui.js';
import { buero } from './js/szenen/buero.js';
import { morgen } from './js/szenen/morgen.js';
import { starteSchalter } from './js/szenen/schalter.js';
import { feierabend } from './js/szenen/feierabend.js';
import { wendeTextgroesseAn } from './js/szenen/einstellungen.js';

function zumBuero() {
  buero({ starteTag, setzeFort, startePruefung });
}

function spiele(plan, stand) {
  starteSchalter(plan, {
    stand,
    onEnde: (lauf) => (lauf.grund === 'pause' ? zumBuero() : feierabend(lauf, { zumBuero })),
  });
}

function starteTag() {
  const plan = planeTag();
  morgen(plan, { weiter: () => spiele(plan) });
}

function startePruefung(stockwerk) {
  const plan = planePruefung(stockwerk);
  morgen(plan, { weiter: () => spiele(plan) });
}

function setzeFort() {
  const lauf = getState().laufenderTag;
  if (!lauf) return zumBuero();
  spiele(lauf.plan, lauf);
}

async function start() {
  load();
  wendeTextgroesseAn();
  persistAnfragen();
  try {
    await ladeDaten();
  } catch {
    zeige(el('p', { class: 'laden' }, 'Die Akten konnten nicht geladen werden. Bitte einmal mit Internet öffnen.'));
    return;
  }
  // Direkter Fall für Tests und Vorschau: ?fall=f038-2 (optional &stufe=2)
  const q = new URLSearchParams(location.search);
  const fall = q.get('fall') && getDaten().fallNach[q.get('fall')];
  if (fall) return spiele({ art: 'tag', plaetze: [{ regelId: fall.regelId, fallId: fall.id, minStufe: +(q.get('stufe') ?? 0) }], neu: [] });
  zumBuero();
}

// Doppeltipp-Zoom unterdrücken (iOS ignoriert user-scalable teilweise)
let letzterTipp = 0;
document.addEventListener('touchend', (e) => {
  const t = Date.now();
  if (t - letzterTipp < 300 && !e.target.closest('input, textarea')) e.preventDefault();
  letzterTipp = t;
}, { passive: false });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
start();
