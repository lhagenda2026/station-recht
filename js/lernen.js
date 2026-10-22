// Lernlogik: Stufen 0–3, Leitner-Wiederholung, Tagesplan, Fallauswahl.
// Alle Ergebnisse laufen über grade().
import { S, regelStand, fallStand, save } from './store.js';
import { D } from './daten.js';

export const INTERVALLE = [0, 1, 2, 5, 12, 30];   // Spieltage je Leitner-Box
export const STUFEN = ['Einarbeitung', 'Lehrling', 'Geselle', 'Meister'];
export const TITEL = ['Praktikant', 'Sachbearbeiter', 'Gruppenleiter', 'Abteilungsleiter', 'Vorstand'];
export const STOCKWERKE = [
  null,
  { nr: 1, name: 'Post & Regeln', etage: 'Erdgeschoss', thema: 'Allgemeines und Staatsprinzipien' },
  { nr: 2, name: 'Bürgerbüro', etage: '1. Stock', thema: 'Grundrechte' },
  { nr: 3, name: 'Bescheide', etage: '2. Stock', thema: 'Verwaltungsrecht' },
  { nr: 4, name: 'Widerspruchsstelle', etage: '3. Stock', thema: 'Sozialprozessrecht' },
];
const FAELLE_PRO_TAG = 9;
const NEU_PRO_TAG = 3;

/**
 * Zentrale Bewertung. ergebnis: true/false, hilfeGenutzt: Regelbuch aufgeschlagen,
 * zeit: verbleibender Anteil der Geduld (0..1). Gibt Stufenänderung zurück.
 */
export function grade(regelId, ergebnis, hilfeGenutzt, zeit, { format } = {}) {
  const r = regelStand(regelId);
  const vorher = r.stufe;
  r.gesehen = true;
  if (ergebnis) {
    r.richtig++;
    const zaehlt = !(r.stufe >= 2 && hilfeGenutzt);
    if (zaehlt) r.serie++;
    if (r.stufe === 3 && format === 'F6' && zaehlt) r.gemeistert = true;
    if (r.serie >= 2 && r.stufe < 3) { r.stufe++; r.serie = 0; }
    if (r.boxTag !== S.spieltag) {          // höchstens ein Box-Aufstieg pro Tag
      r.box = Math.min(INTERVALLE.length - 1, r.box + 1);
      r.boxTag = S.spieltag;
    }
    r.faellig = S.spieltag + INTERVALLE[r.box];
  } else {
    r.falsch++;
    r.stufe = Math.max(0, r.stufe - 1);
    r.serie = 0;
    r.box = 0;
    r.faellig = S.spieltag + 1;
  }
  save();
  return { vorher, nachher: r.stufe, aufstieg: r.stufe > vorher, abstieg: r.stufe < vorher, zeit };
}

/** Höchstes freigeschaltetes Stockwerk. Stockwerke ohne Inhalte gelten als durchlässig. */
export function freigeschaltet() {
  for (let st = 1; st <= 4; st++) {
    if (regelnVon(st).length && !S.bestanden.includes(st)) return st;
  }
  return 4;
}
export const titel = () => TITEL[Math.min(4, S.bestanden.length)];
export const regelnVon = (stockwerk) => D.regeln.filter((r) => r.stockwerk === stockwerk);
export const offeneRegeln = () => D.regeln.filter((r) => r.stockwerk <= freigeschaltet());

// Prüfung eines Stockwerks ist bereit, wenn jede Regel dort mindestens Stufe 1 (Lehrling) hat.
export function pruefungBereit(stockwerk) {
  return !S.bestanden.includes(stockwerk) && stockwerk <= freigeschaltet() && regelnVon(stockwerk).length > 0
    && regelnVon(stockwerk).every((r) => regelStand(r.id).stufe >= 1);
}

export function fortschritt(stockwerk) {
  const rs = regelnVon(stockwerk);
  const punkte = rs.reduce((s, r) => s + (S.regeln[r.id]?.stufe ?? 0) + (S.regeln[r.id]?.gemeistert ? 1 : 0), 0);
  return { gesehen: rs.filter((r) => S.regeln[r.id]?.gesehen).length, gesamt: rs.length, anteil: punkte / (rs.length * 4) };
}

/** Plan für einen Arbeitstag: Liste von Plätzen {regelId} oder {fallId} (Nachholfall). */
export function planeTag() {
  const plaetze = [];
  const nachholen = S.nachholen.filter((id) => D.fallMap[id]).slice(0, 3);
  nachholen.forEach((fallId) => plaetze.push({ fallId, regelId: D.fallMap[fallId].regelId, nachholen: true }));

  const offen = offeneRegeln();
  const gesehen = offen.filter((r) => S.regeln[r.id]?.gesehen);
  const faellig = gesehen
    .filter((r) => regelStand(r.id).faellig <= S.spieltag && !nachholen.some((f) => D.fallMap[f].regelId === r.id))
    .sort((a, b) => regelStand(a.id).faellig - regelStand(b.id).faellig || regelStand(a.id).stufe - regelStand(b.id).stufe);
  const neu = offen.filter((r) => !S.regeln[r.id]?.gesehen);

  // Neue Regeln: je zwei Plätze (einmal Einarbeitung, später nochmal)
  const anzahlNeu = Math.min(neu.length, faellig.length > 6 ? 1 : faellig.length > 3 ? 2 : NEU_PRO_TAG);
  const neueHeute = neu.slice(0, anzahlNeu);
  const frei = FAELLE_PRO_TAG - plaetze.length - neueHeute.length * 2;
  const wiederholung = faellig.slice(0, Math.max(0, frei));

  // Lücken füllen: Regeln mit niedrigster Stufe üben
  let rest = FAELLE_PRO_TAG - plaetze.length - neueHeute.length * 2 - wiederholung.length;
  const schonDrin = new Set([...wiederholung, ...neueHeute].map((r) => r.id));
  const uebung = gesehen.filter((r) => !schonDrin.has(r.id))
    .sort((a, b) => regelStand(a.id).stufe - regelStand(b.id).stufe || regelStand(a.id).faellig - regelStand(b.id).faellig)
    .slice(0, Math.max(0, rest));
  rest -= uebung.length;
  const extraNeu = rest > 0 ? neu.slice(anzahlNeu, anzahlNeu + Math.ceil(rest / 2)) : [];
  neueHeute.push(...extraNeu);

  // Reihenfolge: Neue Regel zuerst einführen, zweiter Durchgang später gemischt
  const mitte = [...wiederholung, ...uebung].map((r) => ({ regelId: r.id }));
  const ersteRunde = neueHeute.map((r) => ({ regelId: r.id, neu: true }));
  const zweiteRunde = neueHeute.map((r) => ({ regelId: r.id }));
  const gemischt = [];
  const a = [...mitte];
  ersteRunde.forEach((p, i) => { gemischt.push(p); if (a.length) gemischt.push(a.shift()); if (i > 0 && a.length) gemischt.push(a.shift()); });
  gemischt.push(...a.splice(0, Math.ceil(a.length / 2)));
  zweiteRunde.forEach((p) => { gemischt.push(p); if (a.length) gemischt.push(a.shift()); });
  gemischt.push(...a);
  plaetze.push(...gemischt);
  return { plaetze: plaetze.slice(0, 10), neueRegeln: neueHeute.map((r) => r.id) };
}

/** Wählt zur Laufzeit den passenden Fall für eine Regel und ihre aktuelle Stufe. */
export function waehleFall(regelId, { mitKniffel = true, heute = [] } = {}) {
  const r = regelStand(regelId);
  const alle = (D.faelleNachRegel[regelId] ?? []).filter((f) => !heute.includes(f.id));
  const seltenste = (liste) => liste.slice().sort((x, y) => fallStand(x.id).gesehen - fallStand(y.id).gesehen || Math.random() - 0.5)[0];
  if (r.stufe === 3 && r.serie >= 1 && !r.gemeistert) {
    const f6 = alle.filter((f) => f.format === 'F6');
    if (f6.length) return seltenste(f6);
  }
  if (r.stufe === 3 && mitKniffel && Math.random() < 0.4) {
    const kniffel = D.faelle.filter((f) => f.kombiRegeln?.length && !heute.includes(f.id) && (f.regelId === regelId || f.kombiRegeln.includes(regelId))
      && [f.regelId, ...f.kombiRegeln].every((id) => S.regeln[id]?.gesehen));
    if (kniffel.length) return seltenste(kniffel);
  }
  // Gleiche Stufe, sonst eine höher (heute schon gespielt), sonst tiefer
  for (const s of [r.stufe, r.stufe + 1, r.stufe - 1, r.stufe - 2, r.stufe - 3]) {
    const kandidaten = alle.filter((f) => f.stufe === s && f.format !== 'F6' && !f.kombiRegeln?.length);
    if (kandidaten.length) return seltenste(kandidaten);
  }
  return seltenste(alle.length ? alle : D.faelleNachRegel[regelId] ?? []);
}

/** Beförderungsprüfung: 10 gemischte Aufgaben eines Stockwerks, davon bis zu 2 Chefin-Stichproben. */
export function planePruefung(stockwerk) {
  const rs = mische(regelnVon(stockwerk));
  const gewaehlt = [];
  for (let i = 0; gewaehlt.length < 10 && i < 40; i++) {
    const fs = D.faelleNachRegel[rs[i % rs.length].id] ?? [];
    const pool = i < 2 ? fs.filter((f) => f.format === 'F6')
      : fs.filter((f) => f.stufe >= 2 && f.format !== 'F6' && !f.kombiRegeln?.length);
    const f = mische(pool).find((x) => !gewaehlt.includes(x));
    if (f) gewaehlt.push(f);
  }
  const plaetze = [...gewaehlt.slice(2), ...gewaehlt.slice(0, 2)];   // Chefin-Stichproben zum Schluss
  return { plaetze: plaetze.map((f) => ({ fallId: f.id, regelId: f.regelId })), pruefung: stockwerk };
}

export const mische = (liste) => liste.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);

export function morgenImPostfach() {
  const morgen = S.spieltag + 1;
  const offen = offeneRegeln();
  const faelligMorgen = offen.filter((r) => S.regeln[r.id]?.gesehen && regelStand(r.id).faellig <= morgen).length;
  const neu = offen.filter((r) => !S.regeln[r.id]?.gesehen).length;
  return { faellig: faelligMorgen, nachholen: S.nachholen.length, neu: Math.min(neu, NEU_PRO_TAG) };
}

export function streakAktualisieren() {
  const heute = new Date().toISOString().slice(0, 10);
  if (S.streak.datum === heute) return;
  const gestern = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  S.streak.zahl = S.streak.datum === gestern ? S.streak.zahl + 1 : 1;
  S.streak.datum = heute;
}
