// Einzelne Spielaufgaben. Jede ruft grade() über die kartenId auf und meldet das Ergebnis.
import { h } from './ui.js';
import { grade } from './store.js';

const weiterKnopf = (onWeiter, text = 'Weiter') => h('button', { type: 'button', class: 'knopf knopf-haupt weiter', onclick: onWeiter }, text);
const quelle = (ctx, id) => { const k = ctx.karte(id); return h('p', { class: 'quelle' }, `Frage ${k.nr}: ${k.frage}`); };

// ---------- Triage ----------
// opts: { zeitMs, onAntwort(korrekt), onWeiter() }
export function triageItem(ctx, fall, { zeitMs = 0, onAntwort, onWeiter }) {
  const set = ctx.data.triageSets[fall.set];
  let fertig = false;
  let timer = null;

  const karte = h('div', { class: 'fallkarte', tabindex: '-1' },
    h('p', { class: 'set-titel' }, set.titel),
    h('p', { class: 'fall' }, fall.fall));
  const zeitbalken = zeitMs ? h('div', { class: 'zeitbalken', 'aria-hidden': 'true' }, h('span', { style: `--dauer:${zeitMs}ms;animation-duration:${zeitMs}ms` })) : null;
  const feedback = h('div', { class: 'feedback', role: 'status' });
  const boxen = h('div', { class: `boxen n${set.boxen.length}` }, set.boxen.map((b) =>
    h('button', { type: 'button', class: 'box', 'data-box': b, onclick: () => antwort(b) }, b)));

  function antwort(b) {
    if (fertig) return;
    fertig = true;
    clearTimeout(timer);
    zeitbalken?.classList.add('stopp');
    const korrekt = b === fall.richtig;
    grade(fall.kartenId, korrekt ? 'sitzt' : 'weg');
    boxen.querySelectorAll('.box').forEach((el) => {
      el.disabled = true;
      if (el.dataset.box === fall.richtig) el.classList.add('richtig');
      else if (el.dataset.box === b) el.classList.add('falsch');
    });
    karte.classList.add(korrekt ? 'ok' : 'fehl');
    onAntwort?.(korrekt);
    if (korrekt) {
      feedback.replaceChildren(h('p', { class: 'ok-text' }, '✓ Richtig zugeordnet'));
      setTimeout(onWeiter, 650);
    } else {
      feedback.replaceChildren(
        h('p', { class: 'fehl-text' }, b === null ? '⏱ Zeit abgelaufen. ' : '✕ Falsch. ', `Richtig: ${fall.richtig}.`),
        h('p', {}, fall.grund), quelle(ctx, fall.kartenId), weiterKnopf(onWeiter));
    }
  }
  if (zeitMs) timer = setTimeout(() => antwort(null), zeitMs);

  // Wischen bei zwei Boxen: links = erste, rechts = zweite
  if (set.boxen.length === 2) {
    let x0 = null, dx = 0;
    karte.addEventListener('pointerdown', (e) => { x0 = e.clientX; karte.setPointerCapture(e.pointerId); });
    karte.addEventListener('pointermove', (e) => { if (x0 === null) return; dx = e.clientX - x0; karte.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`; });
    const ende = () => {
      if (x0 === null) return;
      x0 = null;
      karte.style.transform = '';
      if (Math.abs(dx) > 80) antwort(set.boxen[dx < 0 ? 0 : 1]);
      dx = 0;
    };
    karte.addEventListener('pointerup', ende);
    karte.addEventListener('pointercancel', ende);
    karte.append(h('p', { class: 'wischhinweis' }, `← ${set.boxen[0]}   ·   ${set.boxen[1]} →`));
  }

  const el = h('div', { class: 'item triage-item' }, zeitbalken, karte, feedback, boxen);
  el.abbrechen = () => clearTimeout(timer);
  return el;
}

// ---------- Zwei Wahrheiten, eine Lüge ----------
export function luegeItem(ctx, set, { onAntwort, onWeiter }) {
  let fertig = false;
  const feedback = h('div', { class: 'feedback', role: 'status' });
  const aussagen = h('ol', { class: 'aussagen' }, set.aussagen.map((a, i) =>
    h('li', {}, h('button', { type: 'button', class: 'aussage', 'data-i': i, onclick: () => antwort(i) },
      h('span', { class: 'marke', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)), h('span', { class: 'satz' }, a)))));

  function antwort(i) {
    if (fertig) return;
    fertig = true;
    const korrekt = i === set.luege;
    grade(set.kartenId, korrekt ? 'sitzt' : 'weg');
    aussagen.querySelectorAll('.aussage').forEach((el) => {
      const j = +el.dataset.i;
      el.disabled = true;
      el.classList.add(j === set.luege ? 'ist-luege' : 'ist-wahr');
      if (j === i) el.classList.add('gewaehlt');
      el.querySelector('.marke').textContent = j === set.luege ? '✕' : '✓';
      el.setAttribute('aria-label', (j === set.luege ? 'Lüge: ' : 'Wahr: ') + set.aussagen[j]);
    });
    onAntwort?.(korrekt);
    feedback.replaceChildren(
      h('p', { class: korrekt ? 'ok-text' : 'fehl-text' }, korrekt ? '✓ Lüge entlarvt.' : `✕ Daneben. Gelogen war Aussage ${String.fromCharCode(65 + set.luege)}.`),
      h('p', {}, set.erklaerung), quelle(ctx, set.kartenId), weiterKnopf(onWeiter));
  }
  return h('div', { class: 'item luege-item' }, h('p', { class: 'auftrag' }, 'Tippe auf die Lüge.'), aussagen, feedback);
}

// ---------- Fristen-Bombe ----------
// Zündschnur brennt zeitMs; jeder Fehler beschleunigt sie.
export function bombeItem(ctx, frist, { zeitMs = 25000, onAntwort, onWeiter }) {
  let rest = zeitMs, tempo = 1, fehler = 0, fertig = false, last = performance.now(), raf = 0;
  const schnur = h('div', { class: 'schnur', 'aria-hidden': 'true' }, h('span', { class: 'brennt' }), h('i', { class: 'funke' }));
  const sek = h('span', { class: 'sekunden' });
  const bombe = h('div', { class: 'bombe' },
    h('div', { class: 'bombe-koerper', 'aria-hidden': 'true', html: '<svg viewBox="0 0 120 120"><circle cx="60" cy="66" r="44"/><rect x="50" y="12" width="20" height="14" rx="3"/><circle cx="44" cy="52" r="9" class="glanz"/></svg>' }),
    h('div', { class: 'zuender' }, schnur, sek));
  const feedback = h('div', { class: 'feedback', role: 'status' });
  const farben = ['rot', 'blau', 'gelb'];
  const kabel = h('div', { class: 'kabel' }, frist.optionen.map((o, i) =>
    h('button', { type: 'button', class: `draht d-${farben[i]}`, 'data-i': i, onclick: (e) => schneiden(i, e.currentTarget) },
      h('span', { class: 'drahtlinie', 'aria-hidden': 'true' }), h('span', { class: 'drahttext' }, o))));

  function tick(t) {
    const dt = t - last; last = t;
    rest -= dt * tempo;
    const anteil = Math.max(0, rest / zeitMs);
    schnur.style.setProperty('--rest', anteil);
    sek.textContent = `${Math.ceil(Math.max(0, rest) / 1000)} s`;
    if (rest <= 0) return explodiert();
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame((t) => { last = t; tick(t); });

  function schneiden(i, el) {
    if (fertig || el.disabled) return;
    el.disabled = true;
    el.classList.add('geschnitten');
    if (i === frist.richtig) {
      fertig = true;
      cancelAnimationFrame(raf);
      el.classList.add('richtig');
      bombe.classList.add('entschaerft');
      grade(frist.kartenId, fehler === 0 ? 'sitzt' : 'wackelt');
      onAntwort?.(true, fehler);
      ende(h('p', { class: 'ok-text' }, fehler === 0 ? '✓ Entschärft.' : '✓ Entschärft, aber knapp.'));
    } else {
      fehler++;
      tempo *= 1.8;
      el.classList.add('falsch');
      bombe.classList.add('wackelt');
      setTimeout(() => bombe.classList.remove('wackelt'), 400);
    }
  }
  function explodiert() {
    fertig = true;
    bombe.classList.add('explodiert');
    kabel.querySelectorAll('.draht').forEach((d) => { d.disabled = true; if (+d.dataset.i === frist.richtig) d.classList.add('richtig'); });
    grade(frist.kartenId, 'weg');
    onAntwort?.(false, fehler);
    ende(h('p', { class: 'fehl-text' }, `✕ Bumm. Richtig war: ${frist.optionen[frist.richtig]}`));
  }
  function ende(kopf) {
    feedback.replaceChildren(kopf, h('p', {}, frist.erklaerung), quelle(ctx, frist.kartenId), weiterKnopf(onWeiter));
  }
  const el = h('div', { class: 'item bombe-item' }, bombe, h('p', { class: 'szenario' }, frist.szenario), kabel, feedback);
  el.abbrechen = () => cancelAnimationFrame(raf);
  return el;
}

// Sammelt Aufgaben aller (oder eines Kapitels) Karten
export function sammle(ctx, feld, kapitel = 'alle') {
  return ctx.data.karten.filter((k) => kapitel === 'alle' || k.kapitel === kapitel).flatMap((k) => k[feld]);
}
