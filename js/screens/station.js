// Startbildschirm: Klinikflur mit 4 Zimmern als Monitorkanäle.
import { h, ekgPfad, ZUSTAND } from '../ui.js';
import { getState, level, streakAktuell, vital, zustand, visiteQueue, oberarztFrei } from '../store.js';

const KANAL = { allgemein: 'hf', grundrechte: 'spo2', verwaltungsrecht: 'af', sozialprozessrecht: 'nibp' };

export function kapitelVital(karten) {
  return Math.round(karten.reduce((a, k) => a + (vital(k.id) ?? 0), 0) / karten.length);
}

export function zustandsZaehler(karten) {
  const z = { kritisch: 0, wackelt: 0, stabil: 0, entlassen: 0, neu: 0 };
  for (const k of karten) z[zustand(k.id)]++;
  return z;
}

export function zaehlerLeiste(z) {
  return h('ul', { class: 'zaehler', 'aria-label': 'Patienten nach Zustand' },
    Object.entries(z).filter(([, n]) => n).map(([name, n]) =>
      h('li', { class: `z-${name}`, title: ZUSTAND[name].label },
        h('span', { class: 'z-icon', 'aria-hidden': 'true' }, ZUSTAND[name].icon), `${n} ${ZUSTAND[name].label}`)));
}

export function station(ctx) {
  const { data } = ctx;
  const s = getState();
  const lv = level(s.xp);
  const streak = streakAktuell();
  const queue = visiteQueue(data.karten);

  const kopf = h('header', { class: 'stationskopf' },
    h('div', { class: 'stationsname' },
      h('h1', {}, 'Station Recht'),
      h('p', { class: 'rang' }, `Level ${lv.lv} · ${lv.rang}`)),
    h('div', { class: 'kennzahlen' },
      h('div', { class: 'kennzahl' }, h('span', { class: 'wert' }, String(s.xp)), h('span', { class: 'einheit' }, 'XP')),
      h('div', { class: 'kennzahl' }, h('span', { class: 'wert' }, String(streak)), h('span', { class: 'einheit' }, streak === 1 ? 'Tag in Folge' : 'Tage in Folge'))),
    h('div', { class: 'xpbalken', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(lv.anteil * 100), 'aria-label': `Noch ${lv.bisNaechstes} XP bis Level ${lv.lv + 1}` },
      h('span', { style: `width:${Math.round(lv.anteil * 100)}%` })));

  const zimmer = data.kapitel.map((kap) => {
    const ks = data.karten.filter((k) => k.kapitel === kap.id);
    const v = kapitelVital(ks);
    const gesehen = ks.some((k) => vital(k.id) !== null);
    const W = 220, H = 44;
    const svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${ekgPfad(W, H, gesehen ? v : null)}"/><rect class="sweep" x="0" y="0" width="26" height="${H}"/></svg>`;
    return h('li', {},
      h('a', { class: `zimmer kanal-${KANAL[kap.id]}`, href: `#/zimmer/${kap.id}` },
        h('div', { class: 'zimmer-kopf' },
          h('span', { class: 'zimmer-nr' }, kap.zimmer),
          h('h2', {}, kap.titel),
          oberarztFrei(data.karten, kap.id) ? h('span', { class: 'boss-frei' }, 'Oberarzt-Visite frei') : null),
        h('div', { class: 'zimmer-monitor' },
          h('div', { class: 'ekg', html: svg }),
          h('div', { class: 'vitalzahl' }, h('span', {}, String(v)), h('small', {}, '%'))),
        zaehlerLeiste(zustandsZaehler(ks))));
  });

  const spiele = [
    ['triage', 'Triage', 'Fälle in die richtige Box sortieren'],
    ['luege', 'Zwei Wahrheiten, eine Lüge', 'Die falsche Aussage finden'],
    ['bombe', 'Fristen-Bombe', 'Das richtige Kabel durchtrennen'],
    ['schema', 'Schema-OP', 'Prüfungsschritte ordnen'],
  ];

  return h('div', { class: 'screen station' },
    kopf,
    h('section', { class: 'flur', 'aria-label': 'Zimmer' }, h('ul', { class: 'zimmerliste' }, zimmer)),
    h('section', { class: 'spiele', 'aria-label': 'Spielmodi' },
      h('h2', { class: 'abschnitt' }, 'Trainingsraum'),
      h('ul', { class: 'spielliste' }, spiele.map(([id, titel, text]) =>
        h('li', {}, h('a', { class: `spiel spiel-${id}`, href: `#/${id}` }, h('strong', {}, titel), h('span', {}, text)))))),
    h('nav', { class: 'daumenleiste' },
      h('a', { class: 'knopf knopf-haupt', href: '#/visite' },
        h('span', {}, 'Visite starten'),
        h('small', {}, queue.length ? `${queue.length} Patient${queue.length === 1 ? '' : 'en'} warten` : 'Alle Patienten versorgt')),
      h('a', { class: 'knopf knopf-icon', href: '#/einstellungen', 'aria-label': 'Einstellungen und Backup' }, h('span', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="8" stroke-width="4" stroke-dasharray="3.1 3.18"/><circle cx="12" cy="12" r="6" stroke-width="2"/><circle cx="12" cy="12" r="2.2" stroke-width="2"/></svg>' }))));
}
