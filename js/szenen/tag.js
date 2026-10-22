// Tagesablauf: Morgenbesprechung → Schalter → Feierabend. Dazu die Beförderungsprüfung.
import { h, txt } from '../ui.js';
import { S, save, regelStand } from '../store.js';
import { D } from '../daten.js';
import { planeTag, planePruefung, morgenImPostfach, streakAktualisieren, STUFEN, STOCKWERKE, TITEL, titel } from '../lernen.js';
import { regelkarte } from '../regelkarte.js';
import { schalter } from './schalter.js';
import { ton } from '../ton.js';

function brandtSagt() {
  if (S.spieltag === 1) return 'Willkommen in der Gesundheitskasse Nordstadt! Die Leute stehen schon Schlange. Lesen Sie jede Akte und stempeln Sie. Drei Beschwerden, und Sie gehen nach Hause.';
  if (S.nachholen.length) return 'Gestern ging einiges schief. Die Akten liegen wieder oben auf dem Stapel. Diesmal klappt das.';
  const saetze = [
    'Guten Morgen. Kaffee steht in der Küche, die Schlange vor der Tür. Los geht\'s.',
    'Heute ist Hochbetrieb. Lesen Sie genau, stempeln Sie schnell.',
    'Die Beschwerdestelle hat gestern geschlafen. Bitte sorgen Sie dafür, dass das so bleibt.',
    'Ole hat wieder Fragen. Antworten Sie ihm ordentlich, er schreibt alles mit.',
    'Wer die Regeln im Kopf hat, braucht das Regelbuch nicht. Nur so als Hinweis.',
  ];
  return saetze[S.spieltag % saetze.length];
}

export function starteTag(app, nav) {
  S.spieltag++;
  const plan = planeTag();
  S.nachholen = S.nachholen.filter((id) => !plan.plaetze.some((p) => p.fallId === id));
  S.lauf = { art: 'tag', plan, index: 0, sterne: 0, muenzen: 0, beschwerden: 0, falsche: [], aufstiege: [], richtig: 0, maxBeschwerden: 3, neueRegeln: plan.neueRegeln };
  save();
  morgen(app, nav, plan);
}

function morgen(app, nav, plan) {
  const neue = plan.neueRegeln.map((id) => D.regelMap[id]);
  const satz = brandtSagt();
  const weiter = () => (neue.length ? zeigeNeueRegel(0) : arbeiten());
  app.replaceChildren(h('div', { class: 'morgen', 'data-screen': 'morgen' },
    h('p', { class: 'morgen-tag' }, `Tag ${S.spieltag}, Morgenbesprechung`),
    h('div', { class: 'sprecher' }, h('span', { class: 'sprecher-gesicht', 'aria-hidden': 'true' }, '👩‍💼'),
      h('div', { class: 'sprechblase' }, h('p', { class: 'sprecher-name' }, 'Frau Brandt'), h('p', {}, satz))),
    neue.length > 0 && h('p', { class: 'morgen-neu' }, neue.length === 1 ? 'Heute gibt es eine neue Regel.' : `Heute gibt es ${neue.length} neue Regeln.`),
    h('button', { class: 'knopf haupt gross', type: 'button', onClick: weiter }, neue.length ? 'Neue Regel ansehen' : 'Schalter öffnen')));

  function zeigeNeueRegel(i) {
    const r = neue[i];
    regelStand(r.id);
    app.replaceChildren(h('div', { class: 'morgen neue-regel', 'data-screen': 'neue-regel' },
      h('p', { class: 'morgen-tag' }, `Neue Regel ${i + 1} von ${neue.length}`),
      regelkarte(r),
      h('button', { class: 'knopf haupt gross', type: 'button', onClick: () => (i + 1 < neue.length ? zeigeNeueRegel(i + 1) : arbeiten()) },
        i + 1 < neue.length ? 'Nächste Regel' : 'Verstanden, Schalter öffnen')));
    window.scrollTo(0, 0);
  }

  function arbeiten() { weiterArbeiten(app, nav); }
}

export function weiterArbeiten(app, nav) {
  const lauf = S.lauf;
  schalter(app, lauf, {
    onPause: () => nav.buero(),
    onEnde: (grund) => (lauf.art === 'pruefung' ? pruefungEnde(app, nav, lauf, grund) : feierabend(app, nav, lauf, grund)),
  });
}

function feierabend(app, nav, lauf, grund) {
  S.muenzen += lauf.muenzen;
  S.sterneGesamt += lauf.sterne;
  S.nachholen = [...new Set([...lauf.falsche, ...S.nachholen])];
  streakAktualisieren();
  S.lauf = null;
  save();
  const heim = grund === 'heimgeschickt';
  const post = morgenImPostfach();
  const gespielt = lauf.index;
  const maxSterne = gespielt * 3;
  const gelernt = lauf.neueRegeln.length;
  app.replaceChildren(h('div', { class: 'feierabend', 'data-screen': 'feierabend' },
    h('p', { class: 'morgen-tag' }, `Tag ${S.spieltag}`),
    h('h1', {}, heim ? 'Ab nach Hause!' : 'Feierabend!'),
    h('div', { class: 'sprecher' }, h('span', { class: 'sprecher-gesicht', 'aria-hidden': 'true' }, heim ? '😤' : '👩‍💼'),
      h('div', { class: 'sprechblase' }, h('p', { class: 'sprecher-name' }, 'Frau Brandt'),
        h('p', {}, heim ? 'Drei Beschwerden. Gehen Sie nach Hause und schlafen Sie drüber. Die Akten liegen morgen zuerst auf Ihrem Tisch.'
          : lauf.beschwerden === 0 ? 'Keine einzige Beschwerde. So mag ich das.' : 'Ordentlicher Tag. Die schiefen Fälle sehen wir uns morgen nochmal an.'))),
    h('dl', { class: 'bilanz' },
      eintrag('Sterne', h('span', {}, h('span', { class: 'sterne' }, '★'), ` ${lauf.sterne} von ${maxSterne}`)),
      eintrag('Trinkgeld', `+${lauf.muenzen} Münzen`),
      eintrag('Beschwerden', `${lauf.beschwerden}`),
      eintrag('Richtig', `${lauf.richtig} von ${gespielt} Fällen`),
      eintrag('Heute gelernt', gelernt === 1 ? '1 neue Regel' : `${gelernt} neue Regeln`),
      eintrag('Serie', S.streak.zahl === 1 ? '1 Tag' : `${S.streak.zahl} Tage am Stück`)),
    lauf.aufstiege.length > 0 && h('section', { class: 'aufstiege' }, h('h2', {}, 'Aufgestiegen'),
      h('ul', {}, lauf.aufstiege.map((a) => h('li', {}, txt(D.regelMap[a.regelId].fachbegriff), h('span', { class: 'stufe-chip' }, STUFEN[a.stufe]))))),
    h('section', { class: 'postfach' }, h('h2', {}, 'Morgen im Postfach'),
      h('p', {}, [post.nachholen && `${post.nachholen} Akte${post.nachholen > 1 ? 'n' : ''} zum Nachholen`, post.faellig && `${post.faellig} Regel${post.faellig > 1 ? 'n' : ''} zum Wiederholen`, post.neu && `${post.neu} neue Regel${post.neu > 1 ? 'n' : ''}`].filter(Boolean).join(', ') || 'Ruhiger Tag in Sicht.')),
    h('button', { class: 'knopf haupt gross', type: 'button', onClick: () => nav.buero() }, 'Zurück ins Büro')));
  window.scrollTo(0, 0);
}

const eintrag = (dt, dd) => h('div', {}, h('dt', {}, dt), h('dd', {}, dd));

export function startePruefung(app, nav, stockwerk) {
  const plan = planePruefung(stockwerk);
  S.lauf = { art: 'pruefung', stockwerk, plan, index: 0, sterne: 0, muenzen: 0, beschwerden: 0, falsche: [], aufstiege: [], richtig: 0, maxBeschwerden: 4, neueRegeln: [] };
  save();
  const st = STOCKWERKE[stockwerk];
  app.replaceChildren(h('div', { class: 'morgen pruefung-intro', 'data-screen': 'pruefung-intro' },
    h('p', { class: 'morgen-tag' }, `Beförderungsprüfung ${st.etage}: ${st.name}`),
    h('div', { class: 'sprecher' }, h('span', { class: 'sprecher-gesicht', 'aria-hidden': 'true' }, '👩‍💼'),
      h('div', { class: 'sprechblase' }, h('p', { class: 'sprecher-name' }, 'Frau Brandt'),
        h('p', {}, `Zehn Fälle aus dem ganzen Stockwerk. Höchstens drei Beschwerden. Zum Schluss frage ich Sie selbst ab. Bestehen Sie, werden Sie ${TITEL[stockwerk]}.`))),
    h('button', { class: 'knopf haupt gross', type: 'button', onClick: () => weiterArbeiten(app, nav) }, 'Prüfung beginnen'),
    h('button', { class: 'knopf leise', type: 'button', onClick: () => { S.lauf = null; save(); nav.buero(); } }, 'Lieber später')));
}

function pruefungEnde(app, nav, lauf, grund) {
  const bestanden = grund === 'fertig';
  S.muenzen += lauf.muenzen;
  S.sterneGesamt += lauf.sterne;
  S.lauf = null;
  if (bestanden && !S.bestanden.includes(lauf.stockwerk)) S.bestanden.push(lauf.stockwerk);
  save();
  if (bestanden) ton('befoerdert');
  const ganzFertig = S.bestanden.length >= 4;
  const st = STOCKWERKE[lauf.stockwerk];
  app.replaceChildren(h('div', { class: `feierabend ${bestanden ? 'befoerdert' : ''}`, 'data-screen': 'pruefung-ende' },
    h('p', { class: 'morgen-tag' }, `Beförderungsprüfung ${st.etage}`),
    h('h1', {}, bestanden ? (ganzFertig ? 'Willkommen im Vorstand!' : `Befördert: ${titel()}!`) : 'Noch nicht bestanden'),
    bestanden && h('div', { class: 'urkunde' },
      h('p', { class: 'urkunde-kopf' }, 'Gesundheitskasse Nordstadt'),
      h('p', {}, 'Hiermit wird befördert zum'),
      h('p', { class: 'urkunde-titel' }, titel()),
      h('div', { class: 'abdruck farbe-blau urkunde-stempel' }, 'Bestanden')),
    h('div', { class: 'sprecher' }, h('span', { class: 'sprecher-gesicht', 'aria-hidden': 'true' }, '👩‍💼'),
      h('div', { class: 'sprechblase' }, h('p', { class: 'sprecher-name' }, 'Frau Brandt'),
        h('p', {}, !bestanden ? 'Vier Beschwerden, das reicht heute nicht. Üben Sie ein paar Tage am Schalter und versuchen Sie es nochmal.'
          : ganzFertig ? 'Sie haben alle vier Stockwerke geschafft. Ab heute sitzen Sie oben im Vorstand. Ole bringt Ihnen den Kaffee. Und vergessen Sie nicht: Rücknahme heißt rechtswidrig, Widerruf heißt rechtmäßig.'
            : lauf.stockwerk < 4 ? `Glückwunsch. Ab morgen kommen auch Fälle aus dem ${STOCKWERKE[lauf.stockwerk + 1].etage}: ${STOCKWERKE[lauf.stockwerk + 1].name}.` : 'Glückwunsch.'))),
    h('dl', { class: 'bilanz' }, eintrag('Richtig', `${lauf.richtig} von ${lauf.index}`), eintrag('Beschwerden', `${lauf.beschwerden}`), eintrag('Trinkgeld', `+${lauf.muenzen} Münzen`)),
    h('button', { class: 'knopf haupt gross', type: 'button', onClick: () => nav.buero() }, 'Zurück ins Büro')));
  window.scrollTo(0, 0);
}
