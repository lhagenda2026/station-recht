// Morgenbesprechung: ein Satz von Frau Brandt, danach neue Regelkarten zum Durchtippen.
import { el, zeige, text } from '../ui.js';
import { getDaten, STOCKWERKE } from '../tag.js';
import { getState } from '../store.js';
import { regelkarte } from '../regelkarte.js';

const SAETZE = [
  'Guten Morgen. Die Schlange ist schon da, der Kaffee leider noch nicht.',
  'Heute bitte zügig und richtig. In dieser Reihenfolge ist es mir egal.',
  'Wer stempelt, denkt vorher nach. Wer nicht denkt, schreibt Entschuldigungen.',
  'Ole hat die Akten sortiert. Rechnen Sie also mit Überraschungen.',
  'Freundlich bleiben, auch wenn jemand drängelt. Die Regeln drängeln nicht.',
  'Gestern war gut. Heute wird besser. Das ist keine Bitte.',
  'Wenn Sie unsicher sind: Regelbuch. Wenn Sie sicher sind: trotzdem kurz nachdenken.',
];

export function morgen(plan, { weiter }) {
  const d = getDaten();
  const s = getState();
  const neu = plan.neu.map((id) => d.regelNach[id]);
  const satz = plan.art === 'pruefung'
    ? `Beförderungsprüfung im ${STOCKWERKE[plan.stockwerk - 1].name}. Zehn Fälle, kein Tipp. Nach drei Beschwerden ist Schluss.`
    : s.tage === 0
      ? 'Willkommen in der Gesundheitskasse Nordstadt. Ich zeige Ihnen drei Regeln, dann öffnen wir den Schalter.'
      : SAETZE[s.tage % SAETZE.length];
  const zusatz = plan.art === 'pruefung' ? null
    : neu.length ? `Neu heute: ${neu.length} ${neu.length === 1 ? 'Regel' : 'Regeln'}.` : 'Heute keine neue Regel. Wir wiederholen.';

  let i = 0;
  const buehne = el('div', { class: 'morgen__buehne' });
  const knopf = el('button', { type: 'button', class: 'knopf knopf--haupt morgen__weiter' });

  function schritt() {
    if (i < neu.length) {
      buehne.replaceChildren(
        el('p', { class: 'morgen__label' }, `Neue Regel ${i + 1} von ${neu.length}`),
        regelkarte(neu[i]),
      );
      knopf.textContent = i === neu.length - 1 ? 'Schalter öffnen' : 'Verstanden, nächste Regel';
    } else {
      weiter();
      return;
    }
    i += 1;
    window.scrollTo(0, 0);
  }

  knopf.addEventListener('click', schritt);
  buehne.append(...[
    el('div', { class: 'chefin' },
      el('span', { class: 'chefin__gesicht', 'aria-hidden': 'true' }, '👩🏼‍💼'),
      el('blockquote', { class: 'sprechblase' }, el('p', {}, text(satz)), el('cite', {}, 'Frau Brandt, Abteilungsleitung')),
    ),
    s.tage === 0 && plan.art !== 'pruefung' ? el('div', { class: 'chefin chefin--ole' },
      el('span', { class: 'chefin__gesicht', 'aria-hidden': 'true' }, '🧑‍🎓'),
      el('blockquote', { class: 'sprechblase' }, el('p', {}, 'Ich bin Ole, Praktikant. Keine Sorge: Hier lernt man beim Stempeln.'), el('cite', {}, 'Ole'))) : null,
    zusatz ? el('p', { class: 'morgen__zusatz' }, zusatz) : null,
  ].filter(Boolean));
  knopf.textContent = neu.length ? 'Zur ersten Regel' : 'Schalter öffnen';
  zeige(el('div', { class: 'szene szene--morgen' },
    el('h2', { class: 'szene__titel' }, plan.art === 'pruefung' ? 'Prüfungsmorgen' : 'Morgenbesprechung'),
    buehne,
    el('footer', { class: 'daumen' }, knopf),
  ));
  knopf.focus({ preventScroll: true });
}
