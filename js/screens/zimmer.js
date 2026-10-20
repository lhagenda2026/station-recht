// Zimmer = Kapitel: Patientenliste und Oberarzt-Visite.
import { h, ZUSTAND } from '../ui.js';
import { vital, zustand, oberarztFrei, karte } from '../store.js';
import { topbar } from './common.js';
import { zaehlerLeiste, zustandsZaehler } from './station.js';

export function zimmer(ctx, kapitelId) {
  const kap = ctx.data.kapitel.find((k) => k.id === kapitelId) ?? ctx.data.kapitel[0];
  const ks = ctx.data.karten.filter((k) => k.kapitel === kap.id);
  const frei = oberarztFrei(ctx.data.karten, kap.id);
  const quote = Math.round(ks.filter((k) => karte(k.id).box >= 3).length / ks.length * 100);

  const boss = h('div', { class: 'boss' + (frei ? ' frei' : '') },
    h('div', {},
      h('strong', {}, 'Oberarzt-Visite'),
      h('p', {}, frei ? '10 gemischte Fragen aus diesem Zimmer, 3 Leben.' : `Wird frei, wenn 70 % der Patienten stabil sind (mind. Box 3). Aktuell: ${quote} %.`)),
    h('button', { class: 'knopf' + (frei ? ' knopf-haupt' : ''), type: 'button', disabled: !frei, onclick: () => ctx.go(`oberarzt/${kap.id}`) }, frei ? 'Starten' : 'Gesperrt'));

  const liste = h('ol', { class: 'patienten' }, ks.map((k) => {
    const z = zustand(k.id);
    const v = vital(k.id);
    return h('li', {}, h('a', { class: `patient z-${z}`, href: `#/karte/${k.id}` },
      h('span', { class: 'p-nr' }, String(k.nr)),
      h('span', { class: 'p-frage' }, k.frage),
      h('span', { class: 'p-status' },
        h('span', { class: 'z-icon', 'aria-hidden': 'true' }, ZUSTAND[z].icon),
        h('span', {}, v === null ? 'neu' : `${v} %`),
        k.verifiziert ? null : h('span', { class: 'flagge', title: 'nicht verifiziert' }, '⚑'))));
  }));

  return h('div', { class: 'screen zimmerscreen' },
    topbar(ctx, kap.titel),
    h('p', { class: 'zimmer-info' }, `${kap.zimmer} · ${ks.length} Patienten`),
    zaehlerLeiste(zustandsZaehler(ks)),
    boss,
    liste);
}
