// F3 Sortieren: Karten in Fächer ziehen/tippen (fachfaecher) oder in die richtige Reihenfolge tippen (reihenfolge).
import { h, txt, klar } from '../ui.js';
import { mische } from '../lernen.js';

export function f3(fall, ctx) {
  return fall.fachfaecher ? faecher(fall, ctx) : reihenfolge(fall, ctx);
}

function faecher(fall, ctx) {
  const { faecher: namen, karten } = fall.fachfaecher;
  const platz = new Map();          // Kartenindex → Fachname
  let auswahl = null;
  const stapel = h('div', { class: 'kartenstapel' });
  const kartenEl = mische(karten.map((k, i) => [k, i])).map(([k, i]) => {
    const el = h('button', { class: 'sortierkarte', type: 'button', 'data-karte': i, onClick: () => waehle(i) }, klar(k.text));
    ziehen(el, (fachEl) => { auswahl = i; lege(fachEl.dataset.fach); });
    return [i, el];
  });
  const elVon = new Map(kartenEl);
  kartenEl.forEach(([, el]) => stapel.append(el));
  const fachEls = namen.map((n) => h('div', { class: 'fach', 'data-fach': n },
    h('button', { class: 'fach-name', type: 'button', onClick: () => lege(n) }, n), h('div', { class: 'fach-inhalt' })));
  const abgeben = h('button', { class: 'knopf haupt', type: 'button', disabled: true, onClick: pruefen }, 'Sortierung abgeben');
  const hinweis = h('p', { class: 'format-hinweis' }, 'Tippe eine Karte an, dann ihr Fach. Oder zieh sie direkt hinein.');

  function waehle(i) {
    if (ctx.gesperrt()) return;
    if (platz.has(i)) { platz.delete(i); stapel.append(elVon.get(i)); elVon.get(i).classList.remove('liegt'); }
    auswahl = auswahl === i ? null : i;
    elVon.forEach((el, j) => el.setAttribute('aria-pressed', String(j === auswahl)));
    aktualisiere();
  }
  function lege(fach) {
    if (ctx.gesperrt() || auswahl == null) return;
    platz.set(auswahl, fach);
    const el = elVon.get(auswahl);
    el.setAttribute('aria-pressed', 'false');
    el.classList.add('liegt');
    fachEls.find((f) => f.dataset.fach === fach).querySelector('.fach-inhalt').append(el);
    auswahl = null;
    aktualisiere();
  }
  function aktualisiere() {
    abgeben.disabled = platz.size !== karten.length;
    fachEls.forEach((f) => f.classList.toggle('bereit', auswahl != null));
  }
  function pruefen() {
    if (ctx.gesperrt()) return;
    const falsch = karten.map((k, i) => [k, i]).filter(([k, i]) => platz.get(i) !== k.fach);
    falsch.forEach(([, i]) => elVon.get(i).classList.add('ist-falsch'));
    karten.forEach((k, i) => { if (platz.get(i) === k.fach) elVon.get(i).classList.add('ist-richtig'); });
    ctx.stempeln(falsch.length ? 'Falsch sortiert' : 'Sortiert', falsch.length ? 'graphit' : 'blau');
    ctx.antwort({
      richtig: falsch.length === 0,
      gewaehlt: falsch.map(([k, i]) => ({ text: `${klar(k.text)}“ in „${platz.get(i)}`, warumNicht: `Gehört zu „${k.fach}“. ${k.warumNicht}` })),
    });
  }

  return {
    akte: h('div', {}, stapel, hinweis),
    steuerung: h('div', { class: 'sortierablage' }, h('div', { class: `faecher n${namen.length}` }, fachEls), abgeben),
  };
}

function reihenfolge(fall, ctx) {
  const richtig = fall.reihenfolge;
  const folge = [];
  const vorrat = h('div', { class: 'kartenstapel' });
  const leiste = h('ol', { class: 'folge', 'data-leer': 'Noch leer. Tippe unten die Karten in der richtigen Reihenfolge an.' });
  const els = mische(richtig.map((t, i) => [t, i])).map(([t, i]) => [i, h('button', { class: 'sortierkarte', type: 'button', 'data-schritt': i, onClick: () => tippe(i) }, klar(t))]);
  const elVon = new Map(els);
  els.forEach(([, el]) => vorrat.append(el));
  const abgeben = h('button', { class: 'knopf haupt', type: 'button', disabled: true, onClick: pruefen }, 'Reihenfolge abgeben');

  function tippe(i) {
    if (ctx.gesperrt()) return;
    const pos = folge.indexOf(i);
    if (pos >= 0) folge.splice(pos);                 // ab hier zurücknehmen
    else folge.push(i);
    zeichne();
  }
  function zeichne() {
    leiste.replaceChildren(...folge.map((i) => h('li', {}, elVon.get(i))));
    elVon.forEach((el, i) => { if (!folge.includes(i)) vorrat.append(el); });
    vorrat.hidden = folge.length === richtig.length;
    abgeben.disabled = folge.length !== richtig.length;
  }
  function pruefen() {
    if (ctx.gesperrt()) return;
    const ok = folge.every((i, pos) => i === pos);
    folge.forEach((i, pos) => elVon.get(i).classList.add(i === pos ? 'ist-richtig' : 'ist-falsch'));
    ctx.stempeln(ok ? 'In Ordnung' : 'Durcheinander', ok ? 'blau' : 'graphit');
    ctx.antwort({ richtig: ok, gewaehlt: [], korrektur: !ok && h('ol', { class: 'korrektur-liste' }, richtig.map((t) => h('li', {}, txt(t)))) });
  }

  return {
    akte: h('div', {}, h('p', { class: 'format-hinweis' }, 'Tippe die Karten in der richtigen Reihenfolge an. Antippen in der Liste nimmt sie zurück.'), leiste, vorrat),
    steuerung: h('div', { class: 'aktionsreihe' }, abgeben),
  };
}

/** Ziehen per Pointer Events: Loslassen über einem .fach legt die Karte dort ab. */
function ziehen(el, ablegen) {
  let start = null, geist = null;
  el.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); });
  el.addEventListener('pointermove', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!geist && Math.hypot(dx, dy) > 12) {
      const r = el.getBoundingClientRect();
      geist = el.cloneNode(true);
      geist.classList.add('geist');
      Object.assign(geist.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px' });
      document.body.append(geist);
    }
    if (geist) geist.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  const ende = (e) => {
    if (!geist) { start = null; return; }
    geist.remove(); geist = null; start = null;
    const ziel = document.elementFromPoint(e.clientX, e.clientY)?.closest('.fach');
    if (ziel && e.type === 'pointerup') { ablegen(ziel); el.dataset.gezogen = '1'; }
  };
  el.addEventListener('pointerup', ende);
  el.addEventListener('pointercancel', ende);
  // Nach dem Ziehen keinen zusätzlichen Klick auslösen
  el.addEventListener('click', (e) => { if (el.dataset.gezogen) { delete el.dataset.gezogen; e.stopImmediatePropagation(); } }, true);
}
