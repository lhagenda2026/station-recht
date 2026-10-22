// Das Büro: Startbildschirm mit Schreibtisch, Aufzug (Stockwerke, Beförderungsprüfung), Deko-Laden.
import { el, zeige, blatt, text } from '../ui.js';
import { getState, dekoKaufen } from '../store.js';
import { STOCKWERKE, titel, pruefungsStand, getDaten } from '../tag.js';
import { regelbuch } from './regelbuch.js';
import { einstellungen } from './einstellungen.js';

export const DEKO = [
  { id: 'kaktus', name: 'Kaktus Kurt', emoji: '🌵', preis: 15, text: 'Pflegeleicht und stachelig. Wie Frau Brandt.' },
  { id: 'pflanze', name: 'Gummibaum', emoji: '🪴', preis: 20, text: 'Bringt Grün ins Amt.' },
  { id: 'lampe', name: 'Schreibtischlampe', emoji: '💡', preis: 25, text: 'Für helle Momente.' },
  { id: 'kalender', name: 'Tischkalender', emoji: '🗓️', preis: 25, text: 'Fristen im Blick.' },
  { id: 'poster', name: 'Urlaubsposter', emoji: '🏝️', preis: 30, text: 'Irgendwann ist auch mal Ferien.' },
  { id: 'radio', name: 'Kofferradio', emoji: '📻', preis: 35, text: 'Leise Musik, große Laune.' },
  { id: 'kaffee', name: 'Kaffeemaschine', emoji: '☕', preis: 40, text: '+5 Sekunden Geduld bei allen Kunden.' },
];

export function buero({ starteTag, setzeFort, startePruefung }) {
  const s = getState();
  const d = getDaten();
  const lauf = s.laufenderTag;
  const gelernt = Object.keys(s.regeln).length;

  const tisch = el('div', { class: 'schreibtisch', 'aria-label': 'Dein Schreibtisch' },
    el('div', { class: 'schreibtisch__deko' }, DEKO.filter((x) => s.deko.includes(x.id)).map((x) => el('span', { title: x.name }, x.emoji))),
    el('div', { class: 'schreibtisch__platte' },
      el('span', { class: 'schreibtisch__schild' }, titel()),
      el('span', { class: 'schreibtisch__stapel', 'aria-hidden': 'true' }, '🗂️'),
    ),
  );

  const aufzug = el('div', { class: 'aufzug', role: 'group', 'aria-label': 'Aufzug: Stockwerke' },
    [...STOCKWERKE].reverse().map((st) => {
      const offen = st.nr <= s.stockwerk;
      const bestanden = s.bestanden.includes(st.nr);
      const stand = pruefungsStand(st.nr);
      return el('button', {
        type: 'button',
        class: `aufzug__knopf${offen ? '' : ' aufzug__knopf--zu'}${bestanden ? ' aufzug__knopf--fertig' : ''}${offen && !bestanden && stand.bereit ? ' aufzug__knopf--bereit' : ''}`,
        onclick: () => stockwerkInfo(st, offen, bestanden, stand),
      },
      el('span', { class: 'aufzug__nr' }, st.nr === 1 ? 'E' : String(st.nr - 1)),
      el('span', { class: 'aufzug__name' }, st.raum),
      el('span', { class: 'aufzug__status' }, bestanden ? '✓ bestanden' : offen ? `${stand.sicher}/${stand.gesamt} sicher` : '🔒'));
    }),
  );

  function stockwerkInfo(st, offen, bestanden, stand) {
    const inhalt = el('div', { class: 'stockwerk-info' },
      el('h3', {}, `${st.name}: ${st.raum}`),
      !offen ? el('p', {}, 'Noch verschlossen. Bestehe zuerst die Beförderungsprüfung im Stockwerk darunter.')
        : bestanden ? el('p', {}, 'Bestanden. Die Regeln von hier kommen weiter am Schalter dran.')
          : el('p', {}, text(`Beförderungsprüfung: Alle ${stand.gesamt} Regeln kennenlernen (${stand.eingefuehrt} geschafft) und ${stand.noetig} davon auf Stufe „Geselle“ bringen (${stand.sicher} geschafft).`)),
      offen && !bestanden ? el('button', {
        type: 'button', class: 'knopf knopf--haupt', disabled: !stand.bereit,
        onclick: () => { zu(); startePruefung(st.nr); },
      }, stand.bereit ? `Prüfung starten: ${st.titelDanach} werden` : 'Prüfung noch gesperrt') : null,
    );
    const { zu } = blatt(inhalt, { klasse: 'blatt--klein' });
  }

  function laden() {
    const kasse = el('p', { class: 'laden__kasse' }, `Du hast 🪙 ${getState().muenzen}`);
    const liste = el('ul', { class: 'laden__liste' });
    function render() {
      kasse.textContent = `Du hast 🪙 ${getState().muenzen}`;
      liste.replaceChildren(...DEKO.map((x) => {
        const hat = getState().deko.includes(x.id);
        return el('li', { class: 'laden__ding' },
          el('span', { class: 'laden__emoji', 'aria-hidden': 'true' }, x.emoji),
          el('span', { class: 'laden__info' }, el('strong', {}, x.name), el('small', {}, x.text)),
          el('button', {
            type: 'button', class: 'knopf knopf--klein', disabled: hat || getState().muenzen < x.preis,
            onclick: () => { if (dekoKaufen(x.id, x.preis)) render(); },
          }, hat ? 'Steht schon' : `🪙 ${x.preis}`));
      }));
    }
    render();
    blatt(el('div', { class: 'laden' }, el('h3', {}, 'Büro-Deko'), kasse, liste), { klasse: 'blatt--buch', onzu: () => buero({ starteTag, setzeFort, startePruefung }) });
  }

  zeige(el('div', { class: 'szene szene--buero' },
    el('header', { class: 'buero__kopf' },
      el('div', {},
        el('h1', { class: 'logo' }, 'Bescheid, bitte!'),
        el('p', { class: 'buero__ort' }, 'Gesundheitskasse Nordstadt'),
      ),
      el('p', { class: 'buero__konto' }, el('span', {}, `🪙 ${s.muenzen}`), el('span', {}, `🔥 ${s.serie}`)),
    ),
    tisch,
    el('p', { class: 'buero__stand' }, `${gelernt} von ${d.regeln.length} Regeln kennengelernt`),
    aufzug,
    el('nav', { class: 'buero__nav' },
      el('button', { type: 'button', class: 'knopf', onclick: () => regelbuch({}) }, '📕 Regelbuch'),
      el('button', { type: 'button', class: 'knopf', onclick: laden }, '🪴 Deko'),
      el('button', { type: 'button', class: 'knopf', onclick: () => einstellungen({ zurueck: () => buero({ starteTag, setzeFort, startePruefung }) }) }, '⚙️ Einstellungen'),
    ),
    el('footer', { class: 'daumen' },
      lauf ? el('button', { type: 'button', class: 'knopf knopf--haupt', onclick: setzeFort }, `Schicht fortsetzen (Fall ${lauf.index + 1})`)
        : el('button', { type: 'button', class: 'knopf knopf--haupt', onclick: starteTag }, s.tage === 0 ? 'Ersten Arbeitstag beginnen' : 'Schicht beginnen'),
    ),
  ));
}
