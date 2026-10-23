// F2 Rote Tinte: Stelle(n) im Schreiben antippen, mit dem Rotstift bestätigen,
// optional danach die Fehlerart wählen (fall.optionen).
import { h, txt, klar } from '../ui.js';
import { zettelAuswahl } from './f1.js';

export function f2(fall, ctx) {
  const gewaehlt = new Set();
  const schreiben = h('div', { class: 'schreiben' }, fall.markierbar.map((t, i) => (typeof t === 'string'
    ? h('span', {}, txt(t))
    : h('button', { class: 'markierbar', type: 'button', 'data-teil': i, 'aria-pressed': 'false', onClick: (e) => tippe(i, e.currentTarget) }, klar(t.text)))));
  const knopf = h('button', { class: 'knopf rotstift', type: 'button', disabled: true, onClick: anstreichen },
    fall.modus === 'alle' ? 'Fertig angestrichen' : 'Mit Rotstift anstreichen');
  const steuerung = h('div', { class: 'aktionsreihe' }, knopf);
  const hinweis = h('p', { class: 'format-hinweis' }, fall.modus === 'alle'
    ? 'Tippe alle passenden Stellen an. Nochmal tippen hebt auf.' : 'Tippe die Stelle im Text an. Dann bestätigen.');

  function tippe(i, el) {
    if (ctx.gesperrt() || knopf.dataset.fertig) return;
    if (fall.modus === 'einer') {
      gewaehlt.forEach((j) => schreiben.querySelector(`[data-teil="${j}"]`)?.setAttribute('aria-pressed', 'false'));
      if (!gewaehlt.has(i)) gewaehlt.clear();
    }
    if (gewaehlt.has(i)) { gewaehlt.delete(i); el.setAttribute('aria-pressed', 'false'); }
    else { gewaehlt.add(i); el.setAttribute('aria-pressed', 'true'); }
    knopf.disabled = gewaehlt.size === 0;
  }

  function anstreichen() {
    if (ctx.gesperrt() || !gewaehlt.size) return;
    knopf.dataset.fertig = '1';
    const ziele = fall.markierbar.map((t, i) => [t, i]).filter(([t]) => typeof t === 'object' && t.fehler);
    const stelleRichtig = ziele.length === gewaehlt.size && ziele.every(([, i]) => gewaehlt.has(i));
    fall.markierbar.forEach((t, i) => {
      const el = schreiben.querySelector(`[data-teil="${i}"]`);
      if (!el) return;
      if (t.fehler) el.classList.add('ist-ziel');
      else if (gewaehlt.has(i)) el.classList.add('ist-falsch');
      el.disabled = true;
    });
    const falsch = [...gewaehlt].map((i) => fall.markierbar[i]).filter((t) => !t.fehler)
      .map((t) => ({ text: kurz(t.text), warumNicht: t.warumNicht }));
    const korrektur = !stelleRichtig && h('ul', { class: 'korrektur-liste' }, ziele.map(([t, i]) => h('li', {},
      h('q', {}, txt(t.text)), t.fehlerart ? ` (${t.fehlerart})` : '', gewaehlt.has(i) ? '' : h('span', { class: 'verpasst' }, ' – übersehen'))));
    if (!fall.optionen?.length) return fertig(stelleRichtig, falsch, korrektur);
    // Zweiter Schritt: Fehlerart wählen
    steuerung.className = 'fehlerart-wahl';
    steuerung.replaceChildren(h('p', { class: 'format-hinweis hell' }, 'Und welche Art von Fehler ist das?'),
      zettelAuswahl(fall.optionen, ctx, (o) => fertig(stelleRichtig && o.richtig, [...falsch, ...(o.richtig ? [] : [o])], korrektur)));
  }

  function fertig(richtig, gewaehltFalsch, korrektur) {
    ctx.stempeln(richtig ? 'Angestrichen' : 'Daneben', richtig ? 'rot' : 'graphit');
    ctx.antwort({ richtig, gewaehlt: gewaehltFalsch, korrektur });
  }

  return { akte: h('div', {}, schreiben, hinweis), steuerung };
}

const kurz = (s) => { const k = klar(s); return k.length > 70 ? k.slice(0, 67) + '…' : k; };
