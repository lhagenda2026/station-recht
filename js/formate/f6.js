// F6 Chefin-Stichprobe: Die Klausurformel aus Bausteinen in die richtige Reihenfolge bringen.
// Fallen-Bausteine gehören nicht hinein.
import { el, text } from '../ui.js';

function mischen(a, seed) {
  const b = [...a];
  let x = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 11) || 1;
  for (let i = b.length - 1; i > 0; i--) { x = (x * 48271) % 2147483647; const j = x % (i + 1); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

export function f6(fall, ctx) {
  const richtig = fall.bausteine ?? ctx.regel.klausur.bausteine;
  const fallen = fall.fallenBausteine ?? ctx.regel.klausur.fallenBausteine ?? [];
  const alle = mischen([...richtig.map((t) => ({ t, ok: true })), ...fallen.map((t) => ({ t, ok: false }))], fall.id);
  const gelegt = [];
  const vorrat = el('div', { class: 'baustein__vorrat' });
  const antwort = el('ol', { class: 'baustein__antwort' });
  const fertig = el('button', { type: 'button', class: 'knopf knopf--haupt', disabled: true, onclick: auswerten }, 'Frau Brandt vortragen');
  function render() {
    vorrat.replaceChildren(...alle.filter((b) => !gelegt.includes(b)).map((b) =>
      el('button', { type: 'button', class: 'baustein', onclick: () => { gelegt.push(b); render(); } }, text(b.t))));
    antwort.replaceChildren(...richtig.map((_, i) => el('li', { class: 'baustein__platz' },
      gelegt[i] ? el('button', { type: 'button', class: 'baustein baustein--gelegt', onclick: () => { gelegt.splice(i, 1); render(); } }, text(gelegt[i].t))
        : el('span', { class: 'baustein__leer' }, `Satz ${i + 1}`))));
    fertig.disabled = gelegt.length < richtig.length;
  }
  function auswerten() {
    const ok = gelegt.every((b, i) => b.ok && b.t === richtig[i]);
    const zusatz = [];
    const falle = gelegt.find((b) => !b.ok);
    if (falle) zusatz.push(`**Falle erwischt:** „${falle.t}“ stimmt so nicht.`);
    if (!ok) zusatz.push(`**So lautet die Antwort:** ${richtig.join(' ')}`);
    ctx.antwort({ richtig: ok, gewaehlt: [], zusatz });
  }
  render();
  return {
    akte: el('div', { class: 'ole' },
      el('span', { class: 'ole__gesicht', 'aria-hidden': 'true' }, '👩🏼‍💼'),
      el('p', { class: 'ole__frage' }, el('strong', {}, 'Frau Brandt: '), text(fall.akte))),
    werkbank: el('div', { class: 'bausteine' }, el('p', { class: 'sortier__hilfe' }, `Lege ${richtig.length} Sätze in die richtige Reihenfolge. Vorsicht: ${fallen.length === 1 ? 'Ein Satz ist' : 'Einige Sätze sind'} falsch.`), antwort, vorrat),
    unten: fertig,
  };
}
