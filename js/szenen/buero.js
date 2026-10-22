// Das Büro (Startbildschirm): Schreibtisch mit Deko, Aufzug mit Stockwerken, Schalter öffnen.
import { h, txt, blatt } from '../ui.js';
import { S, save, regelStand } from '../store.js';
import { D } from '../daten.js';
import { STOCKWERKE, STUFEN, TITEL, titel, freigeschaltet, fortschritt, pruefungBereit, regelnVon } from '../lernen.js';
import { regelbuchBlatt } from './regelbuch.js';
import { regelAnsehen } from './schalter.js';

export const DEKO = [
  { id: 'kaktus', emoji: '🌵', name: 'Kaktus', preis: 20, text: 'Pflegeleicht. Wie ein gebundener Bescheid.' },
  { id: 'pflanze', emoji: '🪴', name: 'Grünlilie', preis: 30, text: 'Etwas Grün für die Amtsstube.' },
  { id: 'lampe', emoji: '💡', name: 'Schreibtischlampe', preis: 40, text: 'Endlich Licht auf den Akten.' },
  { id: 'radio', emoji: '📻', name: 'Kofferradio', preis: 45, text: 'Schlager zum Stempeln.' },
  { id: 'poster', emoji: '🖼️', name: 'Poster „Erst lesen, dann stempeln“', preis: 50, text: 'Frau Brandt nickt anerkennend.' },
  { id: 'kaffee', emoji: '☕', name: 'Kaffeemaschine', preis: 70, text: 'Kunden warten mit Kaffee 5 Sekunden länger.' },
  { id: 'fisch', emoji: '🐠', name: 'Goldfischglas', preis: 90, text: 'Der Fisch heißt Paragraf.' },
  { id: 'pokal', emoji: '🏆', name: 'Pokal „Mitarbeiter des Monats“', preis: 150, text: 'Für die Vitrine. Und fürs Ego.' },
];

export function buero(app, nav) {
  const lauf = S.lauf;
  const offen = freigeschaltet();
  const pruefbar = [1, 2, 3, 4].find((st) => pruefungBereit(st));
  const fertig = S.bestanden.length >= 4;

  const aufzug = h('nav', { class: 'aufzug', 'aria-label': 'Stockwerke' },
    [4, 3, 2, 1].map((st) => {
      const f = fortschritt(st);
      const zu = st > offen;
      const status = S.bestanden.includes(st) ? 'bestanden' : zu ? 'zu' : 'offen';
      return h('button', { class: `etage ${status}`, type: 'button', 'data-etage': st, onClick: () => etageZeigen(st) },
        h('span', { class: 'etage-knopf', 'aria-hidden': 'true' }, st === 1 ? 'EG' : String(st - 1)),
        h('span', { class: 'etage-name' }, STOCKWERKE[st].name, h('small', {}, zu ? 'Noch verschlossen' : S.bestanden.includes(st) ? 'Prüfung bestanden' : `${f.gesehen} von ${f.gesamt} Regeln kennengelernt`)),
        h('span', { class: 'etage-balken', 'aria-hidden': 'true' }, h('span', { style: { transform: `scaleX(${f.anteil})` } })));
    }));

  const deko = h('div', { class: 'deko-reihe', 'aria-label': 'Deko auf dem Schreibtisch' },
    S.deko.map((id) => DEKO.find((d) => d.id === id)).filter(Boolean).map((d) => h('span', { class: `deko deko-${d.id}`, title: d.name }, d.emoji)));

  const hauptKnopf = lauf
    ? h('button', { class: 'knopf haupt gross', type: 'button', 'data-start': '', onClick: () => nav.weiter() },
      lauf.art === 'pruefung' ? 'Prüfung fortsetzen' : `Weiterarbeiten`, h('small', {}, `Fall ${lauf.index + 1} von ${lauf.plan.plaetze.length}`))
    : h('button', { class: 'knopf haupt gross', type: 'button', 'data-start': '', onClick: () => nav.tag() },
      'Schalter öffnen', h('small', {}, `Tag ${S.spieltag + 1}`));

  app.replaceChildren(h('div', { class: 'buero', 'data-screen': 'buero' },
    h('header', { class: 'buero-kopf' },
      h('div', {},
        h('h1', { class: 'wortmarke' }, 'Bescheid, bitte!'),
        h('p', { class: 'titelzeile' }, h('span', { class: 'namensschild' }, titel()), 'Gesundheitskasse Nordstadt')),
      h('div', { class: 'konto' },
        h('span', { class: 'muenzen' }, h('span', { class: 'muenze-icon', 'aria-hidden': 'true' }), String(S.muenzen)),
        S.streak.zahl > 0 && h('span', { class: 'serie', title: 'Tage am Stück' }, `${S.streak.zahl} ${S.streak.zahl === 1 ? 'Tag' : 'Tage'} Serie`))),
    !S.introGesehen && h('div', { class: 'sprecher intro' }, h('span', { class: 'sprecher-gesicht', 'aria-hidden': 'true' }, '👩‍💼'),
      h('div', { class: 'sprechblase' }, h('p', { class: 'sprecher-name' }, 'Frau Brandt'),
        h('p', {}, 'Sie sind die neue Kraft am Schalter? Gut. Leute kommen mit Anträgen, Sie entscheiden per Stempel. Die Regeln bringe ich Ihnen nach und nach bei.'))),
    fertig && h('div', { class: 'sprecher intro' }, h('span', { class: 'sprecher-gesicht', 'aria-hidden': 'true' }, '🏆'),
      h('div', { class: 'sprechblase' }, h('p', { class: 'sprecher-name' }, 'Vorstandsetage'),
        h('p', {}, 'Alle Stockwerke bestanden. Der Schalter bleibt offen: Jeder Tag wiederholt fällige Regeln, damit die Klausurformeln sitzen.'))),
    h('section', { class: 'schreibtisch' }, deko, hauptKnopf),
    pruefbar && h('button', { class: 'knopf pruefung-knopf', type: 'button', onClick: () => nav.pruefung(pruefbar) },
      `Beförderungsprüfung ${STOCKWERKE[pruefbar].etage}`, h('small', {}, `Bestehen heißt: ${TITEL[pruefbar]}`)),
    aufzug,
    h('div', { class: 'werkzeuge' },
      h('button', { class: 'knopf leise', type: 'button', onClick: () => regelbuchBlatt() }, 'Regelbuch'),
      h('button', { class: 'knopf leise', type: 'button', onClick: () => laden(() => buero(app, nav)) }, 'Deko-Laden'),
      h('button', { class: 'knopf leise', type: 'button', onClick: () => nav.einstellungen() }, 'Einstellungen'))));
  if (!S.introGesehen) { S.introGesehen = true; save(); }

  function etageZeigen(st) {
    const zu = st > offen;
    const rs = regelnVon(st);
    const b = blatt([
      h('h2', {}, `${STOCKWERKE[st].etage}: ${STOCKWERKE[st].name}`),
      h('p', { class: 'etage-thema' }, STOCKWERKE[st].thema),
      zu ? h('p', {}, `Verschlossen. Bestehe zuerst die Beförderungsprüfung im ${STOCKWERKE[st - 1].etage}.`)
        : h('ul', { class: 'etage-liste' }, rs.map((r) => {
          const s = S.regeln[r.id];
          return h('li', {}, s?.gesehen
            ? h('button', { class: 'rb-eintrag', type: 'button', onClick: () => regelAnsehen(r) }, h('span', { class: 'rb-titel' }, txt(r.fachbegriff)),
              h('span', { class: `rb-stufe s${s.stufe}` }, s.gemeistert ? 'Gemeistert' : STUFEN[s.stufe]))
            : h('span', { class: 'rb-eintrag unbekannt' }, h('span', { class: 'rb-titel' }, `Regel ${r.nr}`), h('span', { class: 'rb-stufe' }, 'Noch nicht gesehen')));
        })),
      !zu && !S.bestanden.includes(st) && h('p', { class: 'etage-hinweis' }, pruefungBereit(st)
        ? 'Die Beförderungsprüfung ist bereit.'
        : 'Die Beförderungsprüfung öffnet, wenn jede Regel hier mindestens Stufe „Lehrling“ hat.'),
      h('button', { class: 'knopf', type: 'button', onClick: () => b.schliessen() }, 'Schließen'),
    ], { klasse: 'etage-blatt' });
  }
}

function laden(neuZeichnen) {
  const liste = h('ul', { class: 'laden-liste' });
  const zeichne = () => {
    liste.replaceChildren(...DEKO.map((d) => {
      const hat = S.deko.includes(d.id);
      return h('li', { class: hat ? 'gekauft' : '' },
        h('span', { class: 'laden-emoji', 'aria-hidden': 'true' }, d.emoji),
        h('span', { class: 'laden-text' }, h('strong', {}, d.name), h('small', {}, d.text)),
        hat ? h('span', { class: 'laden-preis' }, 'Steht schon da')
          : h('button', { class: 'knopf klein', type: 'button', disabled: S.muenzen < d.preis || null, onClick: () => {
            S.muenzen -= d.preis; S.deko.push(d.id); save(); zeichne(); kontostand.textContent = `Du hast ${S.muenzen} Münzen.`;
          } }, `${d.preis} Münzen`));
    }));
  };
  const kontostand = h('p', { class: 'laden-konto' }, `Du hast ${S.muenzen} Münzen.`);
  zeichne();
  const b = blatt([h('h2', {}, 'Deko-Laden'), kontostand, liste,
    h('button', { class: 'knopf', type: 'button', onClick: () => b.schliessen() }, 'Fertig')], { klasse: 'laden-blatt', onClose: neuZeichnen });
}
