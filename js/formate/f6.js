// F6 Chefin-Stichprobe: Klausurformel aus Bausteinen legen (mit Fallen-Bausteinen).
import { h, txt, klar } from '../ui.js';
import { mische } from '../lernen.js';

export function f6(fall, ctx) {
  const { bausteine, fallenBausteine } = ctx.regel.klausur;
  const alle = [...bausteine.map((text, i) => ({ text, pos: i })), ...fallenBausteine.map((f) => ({ ...(typeof f === 'string' ? { text: f } : f), falle: true }))];
  const folge = [];
  const antwort = h('ol', { class: 'folge formel' });
  const vorrat = h('div', { class: 'kartenstapel bausteine' });
  const els = new Map(mische(alle).map((b) => [b, h('button', { class: 'sortierkarte baustein', type: 'button', onClick: () => tippe(b) }, klar(b.text))]));
  els.forEach((el) => vorrat.append(el));
  const abgeben = h('button', { class: 'knopf haupt', type: 'button', disabled: true, onClick: pruefen }, 'Antwort abgeben');
  const zuruecksetzen = h('button', { class: 'knopf leise hell', type: 'button', onClick: () => { folge.length = 0; zeichne(); } }, 'Neu legen');

  function tippe(b) {
    if (ctx.gesperrt()) return;
    const pos = folge.indexOf(b);
    if (pos >= 0) folge.splice(pos, 1);
    else if (folge.length < bausteine.length) folge.push(b);
    zeichne();
  }
  function zeichne() {
    antwort.replaceChildren(...folge.map((b) => h('li', {}, els.get(b))));
    els.forEach((el, b) => { if (!folge.includes(b)) vorrat.append(el); });
    abgeben.disabled = folge.length !== bausteine.length;
    antwort.dataset.leer = folge.length ? '' : 'Noch leer. Tippe unten die Bausteine an.';
  }
  function pruefen() {
    if (ctx.gesperrt()) return;
    const ok = folge.every((b, i) => !b.falle && b.pos === i);
    folge.forEach((b, i) => els.get(b).classList.add(!b.falle && b.pos === i ? 'ist-richtig' : 'ist-falsch'));
    ctx.stempeln(ok ? 'Prüfung bestanden' : 'Nachsitzen', ok ? 'blau' : 'rot');
    ctx.antwort({
      richtig: ok,
      gewaehlt: folge.filter((b) => b.falle),
      korrektur: !ok && h('ol', { class: 'korrektur-liste' }, bausteine.map((t) => h('li', {}, txt(t)))),
    });
  }
  zeichne();
  return {
    akte: h('div', {}, h('p', { class: 'format-hinweis' }, `Lege ${bausteine.length} Bausteine in die richtige Reihenfolge. Vorsicht: Es sind Fallen dabei.`), antwort, vorrat),
    steuerung: h('div', { class: 'aktionsreihe' }, zuruecksetzen, abgeben),
  };
}
