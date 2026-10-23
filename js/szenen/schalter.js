// Der Schalter: Ein Arbeitstag (oder eine Beförderungsprüfung) als Folge von Fällen.
// Antragsteller + Schlange + Geduldsbalken, Akte auf dem Tisch, Antwort per Format, sofortiges Feedback.
import { h, txt, blatt, wenigBewegung } from '../ui.js';
import { S, save, fallStand, regelStand } from '../store.js';
import { D } from '../daten.js';
import { grade, waehleFall, STUFEN } from '../lernen.js';
import { regelkarte } from '../regelkarte.js';
import { FORMATE } from '../formate/index.js';
import { regelbuchBlatt } from './regelbuch.js';
import { ton } from '../ton.js';

const WARTENDE = ['🧑‍🦳', '👩‍🍳', '🧔', '👵', '🧑‍🎓', '👨‍🔧', '👩‍💼', '🧑‍🌾', '👴', '👩‍🎤', '🧑‍🏫', '👨‍🍼', '🧕', '👷'];
export const GEDULD_SEK = [0, 30, 22, 18];   // je Stufe; 0 = Einarbeitung ohne Zeitdruck
const MEHR_ZEIT = { F2: 6, F3: 12, F6: 16, F4: 6, F5: 4 };
const FORMAT_NAME = { F1: 'Stempeln', F2: 'Rote Tinte', F3: 'Sortieren', F4: 'Frist-Check', F5: 'Praktikanten-Frage', F6: 'Chefin-Stichprobe' };
const OLE = { name: 'Ole, Praktikant', emoji: '🧑‍🎓' };
const BRANDT = { name: 'Frau Brandt, Chefin', emoji: '👩‍💼' };

/** lauf: { art: 'tag'|'pruefung', plan, index, sterne, muenzen, beschwerden, falsche, aufstiege, richtig, maxBeschwerden } */
export function schalter(app, lauf, { onEnde, onPause }) {
  const bonusSek = S.deko.includes('kaffee') ? 5 : 0;

  function naechster() {
    if (lauf.beschwerden >= lauf.maxBeschwerden) return onEnde(lauf.art === 'pruefung' ? 'durchgefallen' : 'heimgeschickt');
    if (lauf.index >= lauf.plan.plaetze.length) return onEnde('fertig');
    S.lauf = lauf;
    save();
    spieleFall(lauf.plan.plaetze[lauf.index]);
  }

  function spieleFall(platz) {
    lauf.gespielt ??= [];
    const fall = platz.fallId ? D.fallMap[platz.fallId] : waehleFall(platz.regelId, { heute: lauf.gespielt });
    if (!fall) { lauf.index++; return naechster(); }
    const regel = D.regelMap[fall.regelId];
    const stand = regelStand(regel.id);
    const pruefung = lauf.art === 'pruefung';
    const stufe = pruefung ? Math.max(2, fall.stufe) : stand.stufe;
    const kartenOffen = !pruefung && stufe === 0;
    const tippErlaubt = !pruefung && stufe === 1;
    const ohneEile = kartenOffen || !S.einstellungen.zeitdruck;
    const dauer = (fall.dauerSek ?? GEDULD_SEK[stufe] ?? 20) + (MEHR_ZEIT[fall.format] ?? 0) + bonusSek;
    const figur = fall.format === 'F5' ? OLE : fall.format === 'F6' ? BRANDT : fall.figur;

    let geduld = 1, tempo = 1, hilfe = false, gesperrt = false, rafId = 0, letzte = performance.now();

    // --- Kopfleiste
    const muenzAnzeige = h('span', { class: 'muenzen', 'aria-label': 'Münzen' }, h('span', { class: 'muenze-icon', 'aria-hidden': 'true' }), String(S.muenzen + lauf.muenzen));
    const beschwerdenAnzeige = h('span', { class: 'beschwerden', 'aria-label': `Beschwerden ${lauf.beschwerden} von ${lauf.maxBeschwerden}` },
      Array.from({ length: lauf.maxBeschwerden }, (_, i) => h('span', { class: `zettel ${i < lauf.beschwerden ? 'voll' : ''}` })));
    const leiste = h('header', { class: 'leiste' },
      h('button', { class: 'pause', type: 'button', 'aria-label': 'Pause', onClick: pause }, h('span', { 'aria-hidden': 'true' }, '❚❚')),
      h('span', { class: 'tagname' }, pruefung ? `Beförderungsprüfung` : `Tag ${S.spieltag}`,
        h('small', {}, `Fall ${lauf.index + 1} von ${lauf.plan.plaetze.length}`)),
      muenzAnzeige, beschwerdenAnzeige);

    // --- Szene: Wand, Schlange, Antragsteller, Geduld
    const restSchlange = lauf.plan.plaetze.length - lauf.index - 1;
    const schlange = h('div', { class: 'schlange', 'aria-hidden': 'true' });
    const kopf = (i) => h('span', { class: 'wartend', style: { '--i': i } }, WARTENDE[(lauf.index * 3 + i * 5) % WARTENDE.length]);
    for (let i = 0; i < Math.min(5, restSchlange); i++) schlange.append(kopf(i));
    const gesicht = h('span', { class: 'gesicht', 'aria-hidden': 'true' }, figur.emoji);
    const reaktion = h('span', { class: 'reaktion', 'aria-hidden': 'true' });
    const balken = h('div', { class: 'geduld-fuellung' });
    const geduldEl = h('div', { class: `geduld ${ohneEile ? 'ruhig' : ''}`, role: 'progressbar', 'aria-label': 'Geduld', 'aria-valuemin': 0, 'aria-valuemax': 100 }, balken);
    const szene = h('section', { class: 'szene' },
      h('div', { class: 'wand' }, h('div', { class: 'fenster' }), h('div', { class: 'uhr', 'aria-hidden': 'true' })),
      schlange,
      h('div', { class: 'kunde', 'data-format': fall.format }, gesicht, reaktion, h('span', { class: 'kunde-name' }, figur.name)),
      h('div', { class: 'tresen' }, geduldEl,
        h('span', { class: 'geduld-text' }, ohneEile ? (kartenOffen ? 'Einarbeitung: keine Eile' : 'Zeitdruck aus') : 'Geduld')));

    // --- Tisch: (offene Regelkarte), Akte
    const ctx = {
      fall, regel,
      akteEl: () => akte,
      gesperrt: () => gesperrt,
      stempeln,
      antwort: (res) => auswerten(res),
    };
    const format = FORMATE[fall.format](fall, ctx);
    const akte = h('article', { class: `akte format-${fall.format}`, 'data-fall': fall.id },
      h('header', { class: 'akte-kopf' },
        h('span', { class: 'akte-format' }, FORMAT_NAME[fall.format]),
        h('span', { class: 'akte-stufe' }, pruefung ? 'Prüfung' : STUFEN[stufe])),
      fall.format === 'F5' && format.akte,
      fall.akte && h('div', { class: 'akte-text' }, txt(fall.akte)),
      fall.format !== 'F5' && format.akte,
      h('p', { class: 'akte-frage' }, txt(fall.frage)));
    const tisch = h('section', { class: 'tisch' },
      akte,
      kartenOffen && h('div', { class: 'offene-karte' }, h('p', { class: 'offen-label' }, 'Die Regelkarte liegt offen neben der Akte:'), regelkarte(regel, { kompakt: true })));

    // --- Ablage (Daumenzone): Stempel/Antworten + Tipp + Regelbuch
    const hilfen = h('div', { class: 'hilfen' },
      tippErlaubt && h('button', { class: 'knopf leise', type: 'button', onClick: tipp }, 'Tipp'),
      h('button', { class: 'regelbuch-knopf', type: 'button', onClick: regelbuch, 'aria-label': 'Regelbuch aufschlagen' },
        h('span', { class: 'buch-icon', 'aria-hidden': 'true' }), 'Regelbuch'));
    const ablage = h('footer', { class: 'ablage' }, format.steuerung, hilfen);

    const screen = h('div', { class: `schalter ${pruefung ? 'ist-pruefung' : ''}`, 'data-screen': 'schalter' }, leiste, szene, tisch, ablage);
    app.replaceChildren(screen);
    tisch.scrollTop = 0;
    zeichneGeduld();
    if (!ohneEile) rafId = requestAnimationFrame(tick);

    function tick(jetzt) {
      const dt = Math.min(0.25, (jetzt - letzte) / 1000);
      letzte = jetzt;
      const pausiert = document.querySelector('.glossar-huelle') || document.hidden;
      if (!pausiert && !gesperrt) {
        geduld = Math.max(0, geduld - (dt * tempo) / dauer);
        zeichneGeduld();
        if (geduld === 0 && !gesicht.classList.contains('sauer')) { gesicht.classList.add('sauer'); reaktion.textContent = '💢'; }
        const extra = Math.floor((1 - geduld) * 3);
        while (schlange.children.length < Math.min(7, restSchlange + extra)) schlange.append(kopf(schlange.children.length));
      }
      if (!gesperrt) rafId = requestAnimationFrame(tick);
    }

    function zeichneGeduld() {
      balken.style.transform = `scaleX(${geduld})`;
      geduldEl.dataset.stand = geduld > 0.5 ? 'gut' : geduld > 0.15 ? 'knapp' : 'leer';
      geduldEl.setAttribute('aria-valuenow', Math.round(geduld * 100));
    }

    function tipp() {
      const b = blatt([h('p', { class: 'blatt-label' }, 'Tipp (kostet nichts)'), regelkarte(regel, { kompakt: true }),
        h('button', { class: 'knopf', type: 'button', onClick: () => b.schliessen() }, 'Zurück zur Akte')], { klasse: 'tipp-blatt' });
    }

    function regelbuch() {
      if (!hilfe) {
        hilfe = true;
        tempo = 1.6;
        screen.classList.add('buch-offen');
      }
      regelbuchBlatt({ imFall: true });
    }

    function stempeln(text, farbe) {
      ton('stempel');
      const abdruck = h('div', { class: `abdruck farbe-${farbe}`, style: { '--dreh': `${(Math.random() * 14 - 9).toFixed(1)}deg` } }, text);
      akte.append(abdruck);
      if (!wenigBewegung()) akte.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(3px)' }, { transform: 'translateY(0)' }], { duration: 160, delay: 120 });
    }

    function auswerten(res) {
      if (gesperrt) return;
      gesperrt = true;
      cancelAnimationFrame(rafId);
      const rest = geduld;
      let sterne = 0;
      if (res.richtig) {
        sterne = ohneEile ? 3 : rest >= 0.5 ? 3 : rest > 0.15 ? 2 : 1;
        if (hilfe) sterne = Math.min(sterne, 2);
      }
      const g = grade(fall.regelId, res.richtig, hilfe, rest, { format: fall.format });
      // Kniffelfälle zählen auch für die zweite Regel
      fall.kombiRegeln?.forEach((id) => grade(id, res.richtig, hilfe, rest, { format: fall.format }));
      lauf.gespielt.push(fall.id);
      const fs = fallStand(fall.id);
      fs.gesehen++;
      if (res.richtig) fs.richtig++;
      const trinkgeld = res.richtig ? sterne * 2 : 0;
      lauf.sterne += sterne;
      lauf.muenzen += trinkgeld;
      if (res.richtig) lauf.richtig++;
      else { lauf.beschwerden++; if (!lauf.falsche.includes(fall.id)) lauf.falsche.push(fall.id); }
      if (g.aufstieg) lauf.aufstiege.push({ regelId: regel.id, stufe: g.nachher });
      lauf.index++;
      S.lauf = lauf;
      save();

      // Reaktion am Schalter
      screen.classList.add(res.richtig ? 'ok' : 'fehler');
      gesicht.classList.remove('sauer');
      gesicht.classList.add(res.richtig ? 'froh' : 'boese');
      reaktion.textContent = res.richtig ? '😊' : '😠';
      muenzAnzeige.lastChild.textContent = String(S.muenzen + lauf.muenzen);
      if (res.richtig) {
        ton('muenze');
        for (let i = 0; i < Math.min(trinkgeld, 6); i++) {
          szene.append(h('span', { class: 'flug-muenze', style: { '--i': i }, 'aria-hidden': 'true' }));
        }
      } else {
        ton('beschwerde');
        beschwerdenAnzeige.children[lauf.beschwerden - 1]?.classList.add('voll', 'neu');
        szene.append(h('span', { class: 'flug-zettel', 'aria-hidden': 'true' }, 'Beschwerde'));
      }
      setTimeout(() => feedback(fall, regel, res, sterne, trinkgeld, g, rest), wenigBewegung() ? 150 : 650);
    }

    function feedback(fall, regel, res, sterne, trinkgeld, g) {
      const richtig = res.richtig;
      const ende = lauf.beschwerden >= lauf.maxBeschwerden;
      const inhalt = [
        h('header', { class: `fb-kopf ${richtig ? 'gut' : 'schlecht'}` },
          h('span', { class: 'fb-zeichen', 'aria-hidden': 'true' }, richtig ? '✓' : '✗'),
          h('div', {},
            h('p', { class: 'fb-urteil' }, richtig ? 'Richtig' : 'Leider falsch'),
            h('p', { class: 'fb-ergebnis' }, txt(fall.ergebnis)))),
        richtig
          ? h('p', { class: 'fb-lohn' }, h('span', { class: 'sterne', 'aria-label': `${sterne} von 3 Sternen` }, '★'.repeat(sterne), h('span', { class: 'leer' }, '★'.repeat(3 - sterne))), ` +${trinkgeld} Münzen Trinkgeld`, hilfe ? ' (Regelbuch benutzt)' : '')
          : h('p', { class: 'fb-lohn schlecht' }, `Beschwerde ${lauf.beschwerden} von ${lauf.maxBeschwerden}. Der Fall kommt morgen wieder.`),
        !richtig && res.gewaehlt?.length > 0 && h('section', { class: 'fb-warumnicht' },
          res.gewaehlt.map((o) => h('div', {}, h('h3', {}, 'Warum nicht ', h('q', {}, o.text), '?'), h('p', {}, txt(o.warumNicht ?? ''))))),
        res.korrektur && h('section', { class: 'fb-korrektur' }, h('h3', {}, 'So wäre es richtig'), res.korrektur),
        h('section', { class: 'fb-warum' }, h('h3', {}, 'Warum?'), h('p', {}, txt(fall.warum))),
        h('section', { class: 'fb-denkweg' }, h('h3', {}, 'Denkweg'),
          h('ol', {}, fall.denkweg.map((s) => h('li', {}, txt(s.replace(/^\d+\.\s*/, '')))))),
        fall.rechnung && h('p', { class: 'fb-rechnung' }, h('strong', {}, 'Rechnung: '), txt(fall.rechnung)),
        g.aufstieg && h('p', { class: 'fb-aufstieg' }, `Aufgestiegen: „${regel.fachbegriff}“ ist jetzt Stufe ${STUFEN[g.nachher]}.`),
        g.abstieg && h('p', { class: 'fb-abstieg' }, `„${regel.fachbegriff}“ geht eine Stufe zurück auf ${STUFEN[g.nachher]}. Kein Drama, das übst du wieder.`),
        h('div', { class: 'fb-knoepfe' },
          h('button', { class: 'knopf leise', type: 'button', onClick: () => regelAnsehen(regel) }, 'Regel ansehen'),
          h('button', { class: 'knopf haupt', type: 'button', 'data-weiter': '', onClick: () => { b.schliessen(); } },
            ende ? (lauf.art === 'pruefung' ? 'Prüfung beenden' : 'Feierabend') : lauf.index >= lauf.plan.plaetze.length ? 'Feierabend' : 'Nächster, bitte!')),
      ];
      const b = blatt(inhalt, { klasse: `feedback ${richtig ? 'gut' : 'schlecht'}`, modal: false, onClose: naechster });
      b.el.querySelector('[data-weiter]').focus({ preventScroll: true });
    }

    function pause() {
      cancelAnimationFrame(rafId);
      gesperrt = true;
      S.lauf = lauf;
      save();
      onPause();
    }
  }

  naechster();
}

export function regelAnsehen(regel) {
  const b = blatt([regelkarte(regel), h('button', { class: 'knopf', type: 'button', onClick: () => b.schliessen() }, 'Schließen')], { klasse: 'karten-blatt' });
}
