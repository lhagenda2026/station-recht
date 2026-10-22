// F2 Rote Tinte: Im Schreiben die fehlerhafte Stelle antippen (bzw. Tatbestand/Rechtsfolge markieren),
// optional danach die Fehlerart wählen.
import { el, text } from '../ui.js';

export function f2(fall, ctx) {
  const unten = el('div', { class: 'hinweis-leiste' }, el('p', {}, '🖊️ Tippe die Stelle im Schreiben an.'));
  let erledigt = false;
  const brief = el('div', { class: 'brief', role: 'group', 'aria-label': 'Schreiben' },
    fall.markierbar.map((teil) => teil.tappbar === false
      ? el('span', { class: 'brief__teil' }, text(teil.text))
      : el('button', { type: 'button', class: 'brief__stelle', onclick: (e) => waehle(teil, e.currentTarget) }, text(teil.text))));

  function waehle(teil, knoten) {
    if (erledigt) return;
    erledigt = true;
    knoten.classList.add(teil.ziel ? 'brief__stelle--treffer' : 'brief__stelle--daneben');
    if (!teil.ziel) {
      return ctx.antwort({ richtig: false, gewaehlt: [{ text: kurz(teil.text), richtig: false, warumNicht: teil.warumNicht }] });
    }
    if (!fall.optionen?.length) return ctx.antwort({ richtig: true, gewaehlt: [] });
    // Zweiter Schritt: Fehlerart wählen
    unten.replaceChildren(
      el('p', { class: 'hinweis-leiste__frage' }, 'Richtig markiert! Welcher Fehler ist das?'),
      el('div', { class: 'wahl' }, fall.optionen.map((o) => el('button', {
        type: 'button', class: 'wahl__knopf', onclick: () => ctx.antwort({ richtig: o.richtig, gewaehlt: [o] }),
      }, text(o.text)))),
    );
  }
  return { akte: el('div', {}, fall.akte ? el('p', { class: 'akte__text' }, text(fall.akte)) : null, brief), unten };
}

const kurz = (s) => (s.length > 40 ? s.slice(0, 38).replace(/\s+\S*$/, '') + ' …' : s).replace(/\[\[([^|\]]+)(\|[^\]]+)?\]\]/g, '$1').replace(/\*\*/g, '');
