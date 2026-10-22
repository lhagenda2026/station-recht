// F1 Stempeln: 2–4 Stempel, antippen oder auf die Akte ziehen.
import { h } from '../ui.js';

const ROT = /abgelehnt|nein|zu spät|nichtig|unzulässig|verboten|kein |nicht /i;
const BLAU = /bewilligt|^ja|rechtzeitig|zulässig|gültig|erlaubt/i;
const PALETTE = ['petrol', 'violett', 'ocker', 'graphit'];

export function stempelFarbe(text, i) {
  if (ROT.test(text)) return 'rot';
  if (BLAU.test(text)) return 'blau';
  return PALETTE[i % PALETTE.length];
}

export function f1(fall, ctx) {
  const reihe = h('div', { class: `stempelreihe n${fall.optionen.length}` });
  fall.optionen.forEach((o, i) => {
    const farbe = stempelFarbe(o.text, i);
    const knopf = h('button', { class: `stempel farbe-${farbe}`, type: 'button', 'data-option': i },
      h('span', { class: 'stempel-griff', 'aria-hidden': 'true' }),
      h('span', { class: 'stempel-platte' }, o.text));
    ziehbar(knopf, () => ctx.akteEl(), () => waehle());
    function waehle() {
      if (ctx.gesperrt()) return;
      ctx.stempeln(o.text, farbe);
      ctx.antwort({ richtig: o.richtig, gewaehlt: o.richtig ? [] : [o] });
    }
    reihe.append(knopf);
  });
  return { steuerung: reihe };
}

/** Pointer-Events: kurzer Tipp = auslösen; Ziehen auf das Ziel = auslösen; sonst abbrechen. */
export function ziehbar(el, ziel, ausloesen) {
  let start = null, geist = null;
  el.addEventListener('pointerdown', (e) => {
    start = { x: e.clientX, y: e.clientY };
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!geist && Math.hypot(dx, dy) > 12) {
      geist = el.cloneNode(true);
      geist.classList.add('geist');
      const r = el.getBoundingClientRect();
      Object.assign(geist.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      document.body.append(geist);
    }
    if (geist) geist.style.transform = `translate(${dx}px, ${dy}px) rotate(-4deg)`;
  });
  const ende = (e) => {
    if (!start) return;
    const warGezogen = !!geist;
    geist?.remove();
    geist = null;
    start = null;
    if (e.type === 'pointercancel') return;
    if (!warGezogen) { ausloesen(); return; }
    const z = ziel()?.getBoundingClientRect();
    if (z && e.clientX >= z.left && e.clientX <= z.right && e.clientY >= z.top && e.clientY <= z.bottom) ausloesen();
  };
  el.addEventListener('pointerup', ende);
  el.addEventListener('pointercancel', ende);
  el.addEventListener('click', (e) => { if (e.detail === 0) ausloesen(); });   // Tastatur
}
