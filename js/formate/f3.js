// F3 Sortieren: Karten in Fächer legen (antippen, dann Fach antippen, oder ziehen)
// oder eine Reihenfolge bauen (der Reihe nach antippen).
import { el, text } from '../ui.js';

const ohneMarkup = (s) => String(s).replace(/\[\[([^|\]]+)(\|[^\]]+)?\]\]/g, '$1').replace(/\*\*/g, '');

function mischen(a, seed) {
  const b = [...a];
  let x = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) || 1;
  for (let i = b.length - 1; i > 0; i--) { x = (x * 48271) % 2147483647; const j = x % (i + 1); [b[i], b[j]] = [b[j], b[i]]; }
  if (b.every((v, i) => v === a[i]) && b.length > 1) b.push(b.shift());
  return b;
}

export function f3(fall, ctx) {
  return fall.fachfaecher ? faecher(fall, ctx) : reihe(fall, ctx);
}

function faecher(fall, ctx) {
  const { faecher: namen, karten } = fall.fachfaecher;
  const lage = new Map(); // karte → fach
  let gewaehlt = null;
  const stapel = el('div', { class: 'sortier__stapel' });
  const faecherKnoten = namen.map((n) => el('div', { class: 'fach', 'data-fach': n },
    el('button', { type: 'button', class: 'fach__kopf', onclick: () => ablegen(n) }, n),
    el('div', { class: 'fach__inhalt' })));
  const fertig = el('button', { type: 'button', class: 'knopf knopf--haupt', disabled: true, onclick: auswerten }, 'Fertig sortiert');

  const kartenKnoten = mischen(karten, fall.id).map((k) => {
    const b = el('button', { type: 'button', class: 'sortkarte', onclick: () => waehle(k, b) }, text(k.text));
    b.addEventListener('pointerdown', (e) => ziehen(e, k, b));
    return [k, b];
  });
  const knotenVon = new Map(kartenKnoten);

  function waehle(k, b) {
    gewaehlt = gewaehlt === k ? null : k;
    for (const [, x] of kartenKnoten) x.classList.toggle('sortkarte--gewaehlt', x === b && gewaehlt === k);
  }
  function ablegen(fach, k = gewaehlt) {
    if (!k) return;
    lage.set(k, fach);
    gewaehlt = null;
    render();
  }
  function render() {
    stapel.replaceChildren(...kartenKnoten.filter(([k]) => !lage.has(k)).map(([, b]) => b));
    for (const fk of faecherKnoten) {
      fk.querySelector('.fach__inhalt').replaceChildren(...kartenKnoten.filter(([k]) => lage.get(k) === fk.dataset.fach).map(([, b]) => b));
    }
    for (const [, b] of kartenKnoten) b.classList.remove('sortkarte--gewaehlt');
    fertig.disabled = lage.size < karten.length;
    if (!stapel.children.length) stapel.append(el('p', { class: 'sortier__leer' }, 'Alles einsortiert. Tippe eine Karte an, um sie umzulegen.'));
  }
  // Ziehen mit Pointer Events: Karte folgt dem Finger, Ablage über dem Fach
  function ziehen(e, k, b) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY };
    let bewegt = false;
    const move = (m) => {
      const dx = m.clientX - start.x;
      const dy = m.clientY - start.y;
      if (!bewegt && Math.hypot(dx, dy) < 8) return;
      bewegt = true;
      b.classList.add('sortkarte--zieht');
      b.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const up = (u) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      b.classList.remove('sortkarte--zieht');
      b.style.transform = '';
      if (!bewegt) return;
      b.style.pointerEvents = 'none';
      const ziel = document.elementFromPoint(u.clientX, u.clientY)?.closest('.fach');
      b.style.pointerEvents = '';
      if (ziel) ablegen(ziel.dataset.fach, k);
      b.dataset.gezogen = '1';
      setTimeout(() => delete b.dataset.gezogen, 0);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  for (const [k, b] of kartenKnoten) b.addEventListener('click', (e) => { if (b.dataset.gezogen) e.stopImmediatePropagation(); }, true);

  function auswerten() {
    const falsch = karten.filter((k) => lage.get(k) !== k.fach);
    for (const [k, b] of kartenKnoten) b.classList.add(lage.get(k) === k.fach ? 'sortkarte--ok' : 'sortkarte--falsch');
    ctx.antwort({
      richtig: falsch.length === 0,
      gewaehlt: [],
      zusatz: falsch.map((k) => `**„${ohneMarkup(k.text)}“ gehört zu ${k.fach}.** ${k.warum ?? ''}`),
    });
  }
  render();
  return {
    werkbank: el('div', { class: 'sortier' }, el('p', { class: 'sortier__hilfe' }, 'Karte antippen, dann Fach antippen (oder ziehen).'), stapel, el('div', { class: 'faecher' }, faecherKnoten)),
    unten: fertig,
  };
}

function reihe(fall, ctx) {
  const richtig = fall.reihenfolge.map((r) => (typeof r === 'string' ? { text: r } : r));
  const gemischt = mischen(richtig, fall.id);
  const gelegt = [];
  const vorrat = el('div', { class: 'reihe__vorrat' });
  const leiste = el('ol', { class: 'reihe__leiste' });
  const fertig = el('button', { type: 'button', class: 'knopf knopf--haupt', disabled: true, onclick: auswerten }, 'Reihenfolge abgeben');
  function render() {
    vorrat.replaceChildren(...gemischt.filter((r) => !gelegt.includes(r)).map((r) =>
      el('button', { type: 'button', class: 'sortkarte', onclick: () => { gelegt.push(r); render(); } }, text(r.text))));
    leiste.replaceChildren(...richtig.map((_, i) => el('li', { class: 'reihe__platz' },
      gelegt[i] ? el('button', { type: 'button', class: 'sortkarte sortkarte--gelegt', 'aria-label': `Platz ${i + 1}: ${ohneMarkup(gelegt[i].text)}. Antippen zum Entfernen`, onclick: () => { gelegt.splice(i, 1); render(); } }, text(gelegt[i].text))
        : el('span', { class: 'reihe__leer' }, `${i + 1}.`))));
    fertig.disabled = gelegt.length < richtig.length;
  }
  function auswerten() {
    const ok = gelegt.every((r, i) => r === richtig[i]);
    ctx.antwort({
      richtig: ok,
      gewaehlt: [],
      zusatz: ok ? [] : [`**Richtige Reihenfolge:** ${richtig.map((r, i) => `${i + 1}. ${ohneMarkup(r.text)}`).join('  ')}`],
    });
  }
  render();
  return {
    werkbank: el('div', { class: 'reihe' }, el('p', { class: 'sortier__hilfe' }, 'Tippe die Karten in der richtigen Reihenfolge an. Antippen oben nimmt eine Karte zurück.'), leiste, vorrat),
    unten: fertig,
  };
}
