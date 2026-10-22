// Feierabend: Auswertung des Tages bzw. Ergebnis der Beförderungsprüfung.
import { el, zeige } from '../ui.js';
import { getState, tagAbschliessen, befoerdern } from '../store.js';
import { getDaten, morgenFaellig, STOCKWERKE, TITEL } from '../tag.js';
import { MAX_BESCHWERDEN, STUFEN } from './schalter.js';

export function feierabend(lauf, { zumBuero }) {
  const d = getDaten();
  const pruefung = lauf.plan.art === 'pruefung';
  const heimgeschickt = lauf.grund === 'beschwerden';
  const pause = lauf.grund === 'pause';
  tagAbschliessen({ sterne: lauf.sterne, falsche: lauf.falsche });
  const s = getState();

  let ueberschrift = 'Feierabend!';
  let chefin = 'Ordentliche Arbeit. Morgen geht es weiter.';
  let schluss = false;
  if (pause) { ueberschrift = 'Früher Schluss'; chefin = 'Gut, dann bis morgen. Die Akten laufen nicht weg.'; }
  if (heimgeschickt) { ueberschrift = 'Ab nach Hause'; chefin = 'Drei Beschwerden. Gehen Sie heim und schlafen Sie drüber. Die Fälle kommen morgen zuerst.'; }
  if (pruefung) {
    const st = STOCKWERKE[lauf.plan.stockwerk - 1];
    if (lauf.beschwerden < MAX_BESCHWERDEN && lauf.index >= lauf.plan.plaetze.length) {
      befoerdern(lauf.plan.stockwerk);
      ueberschrift = `Befördert: ${st.titelDanach}!`;
      schluss = lauf.plan.stockwerk === 4;
      chefin = schluss
        ? 'Sie sind jetzt im Vorstand. Ich wusste es seit Ihrem ersten Stempel. Fast.'
        : `Bestanden. Ab morgen gehört Ihnen auch der ${STOCKWERKE[lauf.plan.stockwerk].name}.`;
    } else {
      ueberschrift = 'Prüfung nicht bestanden';
      chefin = 'Nicht schlimm. Üben Sie die Fälle am Schalter und versuchen Sie es wieder.';
    }
  }

  const gelernt = new Set([...lauf.plan.neu, ...lauf.aufstiege.map((a) => a.regelId)]);
  const richtige = lauf.ergebnisse.filter((e) => e.richtig).length;
  zeige(el('div', { class: `szene szene--feierabend${schluss ? ' szene--schluss' : ''}` },
    el('h2', { class: 'szene__titel' }, ueberschrift),
    el('div', { class: 'chefin' },
      el('span', { class: 'chefin__gesicht', 'aria-hidden': 'true' }, schluss ? '🥂' : '👩🏼‍💼'),
      el('blockquote', { class: 'sprechblase' }, el('p', {}, chefin), el('cite', {}, 'Frau Brandt')),
    ),
    el('dl', { class: 'bilanz' },
      zeile('Sterne', `⭐ ${lauf.sterne}`),
      zeile('Trinkgeld', `🪙 ${lauf.muenzen}`),
      zeile('Richtig', `${richtige} von ${lauf.ergebnisse.length}`),
      zeile('Beschwerden', `${lauf.beschwerden} von ${MAX_BESCHWERDEN}`),
      zeile('Serie', `🔥 ${s.serie} ${s.serie === 1 ? 'Tag' : 'Tage'}`),
    ),
    gelernt.size ? el('section', { class: 'gelernt' },
      el('h3', {}, `Heute gelernt: ${gelernt.size} ${gelernt.size === 1 ? 'Regel' : 'Regeln'}`),
      el('ul', {}, [...gelernt].map((id) => {
        const auf = lauf.aufstiege.filter((a) => a.regelId === id).at(-1);
        return el('li', {}, d.regelNach[id].titel, auf ? el('span', { class: 'gelernt__stufe' }, ` → ${STUFEN[auf.stufe]}`) : null);
      })),
    ) : null,
    el('p', { class: 'postfach' }, `📬 Morgen im Postfach: ${morgenFaellig()} ${morgenFaellig() === 1 ? 'Akte' : 'Akten'} zum Wiederholen`),
    schluss ? el('p', { class: 'schluss' }, `Vom ${TITEL[0]} zum ${TITEL[4]}: Du kennst jetzt alle 58 Regeln. Wiederhole sie bis zur Prüfung am Schalter.`) : null,
    el('footer', { class: 'daumen' }, el('button', { type: 'button', class: 'knopf knopf--haupt', onclick: zumBuero }, 'Zurück ins Büro')),
  ));
}

function zeile(dt, dd) {
  return el('div', {}, el('dt', {}, dt), el('dd', {}, dd));
}
