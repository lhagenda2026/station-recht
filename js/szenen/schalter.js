// Der Schalter: Ein Tag (oder eine Beförderungsprüfung) als Folge von Fällen.
// Antragsteller + Schlange + Geduldsbalken, Akte auf dem Tisch, Antwort per Format, sofortiges Feedback.
import { el, text, p, zeige, blatt, reducedMotion } from '../ui.js';
import { getState, grade, regel, fallGespielt, nachgeholt, muenzenDazu, laufenderTag } from '../store.js';
import { getDaten, waehleFall, geduldSek } from '../tag.js';
import { regelkarte } from '../regelkarte.js';
import { regelbuch } from './regelbuch.js';
import { FORMATE } from '../formate/index.js';

export const MAX_BESCHWERDEN = 3;
const WARTENDE = ['🧑‍🦳', '👩‍🍳', '🧔', '👵', '🧑‍🎓', '👨‍🔧', '👩‍💼', '🧑‍🌾', '👴', '👩‍🎤', '🧑‍🏫', '👨‍🍼'];

export function starteSchalter(plan, { onEnde, stand }) {
  const d = getDaten();
  const lauf = stand ?? { plan, index: 0, sterne: 0, muenzen: 0, beschwerden: 0, falsche: [], aufstiege: [], ergebnisse: [] };
  const deko = getState().deko;
  const bonusSek = deko.includes('kaffee') ? 5 : 0;

  function speichern() { laufenderTag({ ...lauf }); }

  function ende(grund) {
    laufenderTag(grund === 'pause' ? { ...lauf } : null); // Pause: später fortsetzen
    onEnde({ ...lauf, grund });
  }

  function naechster() {
    if (lauf.beschwerden >= MAX_BESCHWERDEN) return ende('beschwerden');
    if (lauf.index >= lauf.plan.plaetze.length) return ende('fertig');
    speichern();
    spieleFall(lauf.plan.plaetze[lauf.index]);
  }

  function spieleFall(platz) {
    const fall = waehleFall(platz);
    const r = d.regelNach[fall.regelId];
    const stufe = Math.max(platz.minStufe ?? 0, regel(fall.regelId).stufe);
    const zeitdruck = getState().einstellungen.zeitdruck;
    const gesamt = geduldSek(fall, stufe, bonusSek);
    let rest = gesamt;
    let regelbuchOffen = false;
    let regelbuchGenutzt = false;
    let fertig = false;
    let pausiert = false;
    let letzte = performance.now();
    const start = performance.now();

    // --- Kopfzeile ---
    const kopf = el('header', { class: 'hud' },
      el('span', { class: 'hud__fall' }, lauf.plan.art === 'pruefung' ? `Prüfung ${lauf.index + 1}/${lauf.plan.plaetze.length}` : `Fall ${lauf.index + 1}/${lauf.plan.plaetze.length}`),
      el('span', { class: 'hud__sterne', 'aria-label': `${lauf.sterne} Sterne` }, `⭐ ${lauf.sterne}`),
      el('span', { class: 'hud__beschwerden', 'aria-label': `${lauf.beschwerden} von ${MAX_BESCHWERDEN} Beschwerden` },
        Array.from({ length: MAX_BESCHWERDEN }, (_, i) => el('span', { class: `zettel${i < lauf.beschwerden ? ' zettel--voll' : ''}`, 'aria-hidden': 'true' }))),
      el('button', { type: 'button', class: 'hud__pause', 'aria-label': 'Pause', onclick: pause }, 'Ⅱ'),
    );

    // --- Schalterfenster mit Antragsteller und Schlange ---
    const restPlaetze = lauf.plan.plaetze.length - lauf.index - 1;
    const schlange = el('div', { class: 'schlange', 'aria-hidden': 'true' },
      Array.from({ length: Math.min(restPlaetze, 5) }, (_, i) => el('span', { class: 'schlange__kopf' }, WARTENDE[(lauf.index + i) % WARTENDE.length])));
    const balken = el('div', { class: 'geduld__fuellung' });
    const geduld = el('div', { 'data-hinweis': gesamt == null ? 'Einarbeitung: kein Zeitdruck' : !zeitdruck ? 'Zeitdruck aus' : null, class: `geduld${gesamt == null || !zeitdruck ? ' geduld--ruhig' : ''}`, role: 'progressbar', 'aria-label': 'Geduld', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': 100 }, balken);
    const gesicht = el('span', { class: 'figur__gesicht' }, fall.figur.emoji);
    const stimmung = el('span', { class: 'figur__stimmung', 'aria-hidden': 'true' });
    const fenster = el('section', { class: 'schalter', 'aria-label': 'Schalter' },
      schlange,
      el('div', { class: 'figur' }, gesicht, stimmung),
      el('p', { class: 'figur__name' }, fall.figur.name),
      geduld,
    );

    // --- Akte und Format ---
    const format = FORMATE[fall.format] ?? FORMATE.F1;
    const akteKnoten = el('article', { class: 'akte', 'aria-label': 'Akte' });
    const ctx = { antwort, regel: r, stufe, akte: akteKnoten };
    const teil = format(fall, ctx);
    akteKnoten.append(...[
      el('p', { class: 'akte__kopf' }, el('span', {}, `Akte ${fall.id.toUpperCase()}`), !r.verifiziert ? el('span', { class: 'akte__pruefen' }, 'mit Skript abgleichen') : null),
      teil.akte ?? p(fall.akte, 'akte__text'),
      teil.mitte ?? null,
      el('p', { class: 'akte__frage' }, text(fall.frage)),
    ].filter(Boolean));

    // Hilfen je Stufe: 0 Regelkarte offen, 1 Tipp gratis, 2+ nur Regelbuch (kostet)
    const hilfen = el('div', { class: 'hilfen' });
    if (stufe === 0) {
      hilfen.append(el('div', { class: 'offene-karte' }, el('p', { class: 'offene-karte__label' }, 'Regelkarte liegt offen daneben'), regelkarte(r, { kompakt: true })));
    } else if (stufe === 1) {
      hilfen.append(el('button', { type: 'button', class: 'tipp', onclick: (e) => {
        e.currentTarget.replaceWith(el('div', { class: 'offene-karte' }, regelkarte(r, { kompakt: true })));
      } }, '💡 Tipp ansehen (kostet nichts)'));
    }

    const schublade = el('button', { type: 'button', class: 'schublade', onclick: oeffneRegelbuch, 'aria-label': 'Regelbuch aus der Schublade nehmen' },
      el('span', { class: 'schublade__icon', 'aria-hidden': 'true' }, '📕'),
      el('span', { class: 'schublade__text' }, 'Regelbuch'),
      stufe >= 2 ? el('span', { class: 'schublade__kosten' }, 'max. 2 ⭐') : null,
    );

    const tisch = el('section', { class: 'tisch' }, akteKnoten, hilfen);
    const unten = el('footer', { class: 'daumen' }, teil.unten ?? null, schublade);
    zeige(el('div', { class: `szene szene--schalter${stufe >= 2 ? '' : ' szene--lernen'}` }, kopf, fenster, tisch, unten));

    // --- Geduld läuft ---
    let raf = 0;
    function tick(t) {
      const dt = (t - letzte) / 1000;
      letzte = t;
      if (!fertig && !pausiert && gesamt != null && getState().einstellungen.zeitdruck) {
        rest -= dt * (regelbuchOffen ? 2 : 1);
        const anteil = Math.max(rest / gesamt, 0);
        balken.style.transform = `scaleX(${anteil})`;
        geduld.setAttribute('aria-valuenow', String(Math.round(anteil * 100)));
        geduld.classList.toggle('geduld--knapp', anteil < 0.3);
        stimmung.textContent = anteil < 0.3 ? '💢' : anteil < 0.6 ? '…' : '';
        // Schlange wird länger, wenn man trödelt
        const extra = Math.floor((t - start) / 7000);
        while (schlange.children.length < Math.min(restPlaetze, 5) + Math.min(extra, 4)) {
          schlange.append(el('span', { class: 'schlange__kopf schlange__kopf--neu' }, WARTENDE[(schlange.children.length * 5) % WARTENDE.length]));
        }
        if (rest <= 0) return zeitUm();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    function oeffneRegelbuch() {
      if (fertig) return;
      regelbuchOffen = true;
      if (stufe >= 2) regelbuchGenutzt = true;
      regelbuch({ fokus: null, onzu: () => { regelbuchOffen = false; } });
    }

    function pause() {
      pausiert = true;
      const { zu } = blatt(el('div', { class: 'pause' },
        el('h3', {}, 'Kaffeepause'),
        el('p', {}, 'Die Schlange wartet. Dein Fortschritt ist gespeichert.'),
        el('button', { type: 'button', class: 'knopf knopf--haupt', onclick: () => zu() }, 'Weiterarbeiten'),
        el('button', { type: 'button', class: 'knopf', onclick: () => { fertig = true; cancelAnimationFrame(raf); document.querySelector('.blatt-hinter')?.remove(); ende('pause'); } }, 'Zurück ins Büro'),
      ), { onzu: () => { pausiert = false; letzte = performance.now(); } });
    }

    function zeitUm() {
      antwort({ richtig: false, gewaehlt: [], zeitUm: true });
    }

    function antwort(erg) {
      if (fertig) return;
      fertig = true;
      cancelAnimationFrame(raf);
      document.querySelector('.blatt-hinter')?.remove();
      const zeit = (performance.now() - start) / 1000;
      const anteil = gesamt == null || !getState().einstellungen.zeitdruck ? 1 : Math.max(rest / gesamt, 0);
      let sterne = 0;
      if (erg.richtig) {
        sterne = anteil < 0.2 ? 1 : anteil < 0.5 ? 2 : 3;
        if (regelbuchGenutzt) sterne = Math.min(sterne, 2);
      }
      const g = grade(fall.regelId, erg.richtig, regelbuchGenutzt, zeit);
      fallGespielt(fall.id);
      if (platz.fallId) nachgeholt(platz.fallId);
      const trinkgeld = sterne * 2;
      muenzenDazu(trinkgeld);
      lauf.sterne += sterne;
      lauf.muenzen += trinkgeld;
      if (!erg.richtig) { lauf.beschwerden += 1; lauf.falsche.push(fall.id); }
      if (g.aufstieg) lauf.aufstiege.push({ regelId: fall.regelId, stufe: g.nachher });
      lauf.ergebnisse.push({ fallId: fall.id, regelId: fall.regelId, richtig: erg.richtig, sterne });
      lauf.index += 1;
      speichern();

      // Sofortige Reaktion: Stempel, Gesicht, Münzen oder Beschwerde-Zettel
      gesicht.textContent = erg.richtig ? (fall.figur.froh ?? '😊') : '😤';
      stimmung.textContent = erg.richtig ? '✨' : '💢';
      if (erg.stempel) stempelAbdruck(akteKnoten, erg.stempel, erg.richtig);
      unten.classList.add('daumen--fertig');
      const verzug = reducedMotion() ? 150 : 550;
      setTimeout(() => feedback(fall, r, erg, sterne, trinkgeld, g), verzug);
    }
  }

  function feedback(fall, r, erg, sterne, trinkgeld, g) {
    const richtigeOption = fall.optionen?.find((o) => o.richtig);
    const ergebnis = fall.ergebnis ?? (richtigeOption ? `Richtig ist: ${richtigeOption.text}.` : '');
    const kopfzeile = erg.zeitUm
      ? `⏰ Zu langsam. ${fall.figur.name} ist gegangen.`
      : erg.richtig ? '✅ Richtig!' : '❌ Leider falsch.';
    const warumNicht = (erg.gewaehlt ?? []).filter((o) => o && !o.richtig && o.warumNicht);
    const inhalt = el('div', { class: `feedback feedback--${erg.richtig ? 'gut' : 'schlecht'}` },
      el('p', { class: 'feedback__kopf' }, kopfzeile),
      el('p', { class: 'feedback__ergebnis' }, text(ergebnis)),
      erg.richtig ? el('p', { class: 'feedback__lohn' }, sterne ? `${'⭐'.repeat(sterne)}  +${trinkgeld} 🪙 Trinkgeld` : '') : el('p', { class: 'feedback__lohn' }, '📝 Eine Beschwerde'),
      ...warumNicht.map((o) => el('div', { class: 'feedback__warumnicht' },
        el('h4', {}, `Warum nicht „${o.text}“?`), p(o.warumNicht))),
      ...(erg.zusatz ?? []).map((z) => p(z, 'feedback__warumnicht')),
      el('h4', {}, 'Warum?'), p(fall.warum),
      el('h4', {}, 'Denkweg'),
      el('ol', { class: 'denkweg' }, fall.denkweg.map((s) => el('li', {}, text(s.replace(/^\d+\.\s*/, ''))))),
      g.aufstieg ? el('p', { class: 'feedback__stufe' }, `📈 Regel „${r.titel}“: jetzt ${STUFEN[g.nachher]}`) : null,
      g.abstieg ? el('p', { class: 'feedback__stufe feedback__stufe--ab' }, `Regel „${r.titel}“: zurück auf ${STUFEN[g.nachher]}`) : null,
      el('div', { class: 'feedback__knoepfe' },
        el('button', { type: 'button', class: 'knopf', onclick: () => blatt(regelkarte(r, { klausurOffen: false }), { klasse: 'blatt--karte' }) }, 'Regel ansehen'),
        el('button', { type: 'button', class: 'knopf knopf--haupt', 'data-weiter': '', onclick: () => { box.remove(); naechster(); } },
          lauf.beschwerden >= MAX_BESCHWERDEN || lauf.index >= lauf.plan.plaetze.length ? 'Feierabend' : 'Nächster bitte!'),
      ),
    );
    const box = el('div', { class: 'feedback-hinter' }, inhalt);
    document.querySelector('.szene')?.append(box);
    box.querySelector('[data-weiter]').focus({ preventScroll: true });
  }

  naechster();
}

export const STUFEN = ['Einarbeitung', 'Lehrling', 'Geselle', 'Meister'];

function stempelAbdruck(akte, { text: t, farbe }, richtig) {
  const abdruck = el('div', { class: `abdruck abdruck--${farbe}${richtig ? '' : ' abdruck--falsch'}`, 'aria-hidden': 'true' }, t);
  akte.append(abdruck);
}
