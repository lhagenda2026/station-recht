// Inhalte laden und einen Spieltag planen. Ein Tag ist eine Liste von Plätzen (Regel-IDs);
// welcher Fall drankommt, entscheidet sich erst am Schalter nach der dann aktuellen Stufe.
import { getState, regel, istNeu, jetzt } from './store.js';

export const STOCKWERKE = [
  { nr: 1, name: 'Erdgeschoss', raum: 'Post & Regeln', titelDanach: 'Sachbearbeiter' },
  { nr: 2, name: '1. Stock', raum: 'Bürgerbüro', titelDanach: 'Gruppenleiter' },
  { nr: 3, name: '2. Stock', raum: 'Bescheide', titelDanach: 'Abteilungsleiter' },
  { nr: 4, name: '3. Stock', raum: 'Widerspruchsstelle', titelDanach: 'Vorstand' },
];
export const TITEL = ['Praktikant', 'Sachbearbeiter', 'Gruppenleiter', 'Abteilungsleiter', 'Vorstand'];
export const ZIEL_FAELLE = 9;
export const NEU_PRO_TAG = 3;
export const PRUEFUNG_FAELLE = 10;

let daten = null;

export async function ladeDaten() {
  if (daten) return daten;
  const [regeln, faelle, glossar] = await Promise.all(
    ['data/regeln.json', 'data/faelle.json', 'data/glossar.json'].map((p) => fetch(p).then((r) => r.json())),
  );
  const regelNach = Object.fromEntries(regeln.map((r) => [r.id, r]));
  const faelleNach = {};
  for (const f of faelle) (faelleNach[f.regelId] ??= []).push(f);
  daten = { regeln, faelle, glossar, regelNach, faelleNach, fallNach: Object.fromEntries(faelle.map((f) => [f.id, f])) };
  return daten;
}
export const getDaten = () => daten;

export const titel = () => TITEL[getState().bestanden.length] ?? TITEL[0];

export function verfuegbareRegeln() {
  const s = getState();
  return daten.regeln.filter((r) => r.stockwerk <= s.stockwerk);
}

// Prüfung eines Stockwerks: alle Regeln eingeführt und mindestens 70 % auf Stufe 2 oder höher
export function pruefungsStand(stockwerk) {
  const rs = daten.regeln.filter((r) => r.stockwerk === stockwerk);
  const eingefuehrt = rs.filter((r) => !istNeu(r.id)).length;
  const sicher = rs.filter((r) => regel(r.id).stufe >= 2).length;
  const noetig = Math.ceil(rs.length * 0.7);
  return { gesamt: rs.length, eingefuehrt, sicher, noetig, bereit: eingefuehrt === rs.length && sicher >= noetig };
}

function mischen(liste, seed = jetzt()) {
  const a = [...liste];
  let x = seed % 2147483647 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    x = (x * 48271) % 2147483647;
    const j = x % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function planeTag() {
  const s = getState();
  const plaetze = [];
  const verf = verfuegbareRegeln();
  // 1. Gestern Falsches zuerst
  for (const fallId of s.nachholen.slice(0, 3)) {
    const f = daten.fallNach[fallId];
    if (f) plaetze.push({ regelId: f.regelId, fallId });
  }
  // 2. Fällige Regeln, die ältesten zuerst
  const faellig = verf
    .filter((r) => !istNeu(r.id) && regel(r.id).faellig <= jetzt())
    .sort((a, b) => regel(a.id).faellig - regel(b.id).faellig);
  // 3. Neue Regeln (weniger, wenn viel fällig ist)
  const neuAnzahl = faellig.length > 6 ? 1 : faellig.length > 3 ? 2 : NEU_PRO_TAG;
  const neu = verf.filter((r) => istNeu(r.id)).sort((a, b) => a.nr - b.nr).slice(0, neuAnzahl);
  for (const r of neu) plaetze.push({ regelId: r.id }, { regelId: r.id });
  for (const r of faellig) if (plaetze.length < ZIEL_FAELLE) plaetze.push({ regelId: r.id });
  // 4. Auffüllen: erst neue Regeln ein drittes Mal, dann die schwächsten bekannten
  for (const r of neu) if (plaetze.length < ZIEL_FAELLE) plaetze.push({ regelId: r.id });
  const schwach = verf
    .filter((r) => !istNeu(r.id) && !neu.includes(r))
    .sort((a, b) => regel(a.id).stufe - regel(b.id).stufe || regel(a.id).letzte - regel(b.id).letzte);
  for (const r of schwach) if (plaetze.length < ZIEL_FAELLE && !plaetze.some((p) => p.regelId === r.id)) plaetze.push({ regelId: r.id });
  // Neue Regeln nicht direkt hintereinander: erstes Paar bleibt vorn, Wiederholungen verteilt
  return { art: 'tag', plaetze: verteilen(plaetze), neu: neu.map((r) => r.id) };
}

function verteilen(plaetze) {
  const out = [];
  const rest = [...plaetze];
  while (rest.length) {
    const i = rest.findIndex((p) => p.regelId !== out.at(-1)?.regelId);
    out.push(...rest.splice(i < 0 ? 0 : i, 1));
  }
  return out;
}

export function planePruefung(stockwerk) {
  const rs = daten.regeln.filter((r) => r.stockwerk === stockwerk);
  const gewaehlt = mischen(rs).slice(0, PRUEFUNG_FAELLE);
  while (gewaehlt.length < PRUEFUNG_FAELLE) gewaehlt.push(rs[gewaehlt.length % rs.length]);
  const plaetze = gewaehlt.map((r) => ({ regelId: r.id, minStufe: 2 }));
  plaetze[plaetze.length - 1].format = 'F6'; // Chefin-Stichprobe zum Schluss
  return { art: 'pruefung', stockwerk, plaetze, neu: [] };
}

// Konkreten Fall für einen Platz wählen: passende Stufe, am längsten nicht gespielt
export function waehleFall(platz) {
  if (platz.fallId && daten.fallNach[platz.fallId]) return daten.fallNach[platz.fallId];
  const s = getState();
  const alle = daten.faelle.filter((f) => f.regelId === platz.regelId || f.kombiRegeln?.includes(platz.regelId));
  const stufe = Math.max(platz.minStufe ?? 0, regel(platz.regelId).stufe);
  let kandidaten = alle.filter((f) => f.regelId === platz.regelId);
  if (platz.format) {
    const mitFormat = kandidaten.filter((f) => f.format === platz.format);
    if (mitFormat.length) kandidaten = mitFormat;
  }
  if (stufe >= 3) {
    const kniffel = alle.filter((f) => f.stufe === 3 && f.kombiRegeln?.length);
    kandidaten = [...kandidaten, ...kniffel];
  }
  for (const abstand of [0, -1, 1, -2, 2, -3, 3]) {
    const treffer = kandidaten.filter((f) => f.stufe === stufe + abstand);
    if (treffer.length) {
      return treffer.sort((a, b) => (s.faelle[a.id] ?? 0) - (s.faelle[b.id] ?? 0) || a.id.localeCompare(b.id))[0];
    }
  }
  return kandidaten[0] ?? alle[0];
}

// Geduld je Stufe (Sekunden). Stufe 0: kein Zeitdruck.
export function geduldSek(fall, stufe, bonus = 0) {
  if (stufe === 0) return null;
  const basis = fall.dauerSek ?? 20;
  const faktor = [1, 1.5, 1, 0.85][stufe];
  return Math.round(basis * faktor) + bonus;
}

export function morgenFaellig() {
  const morgen = jetzt() + 86400000;
  return verfuegbareRegeln().filter((r) => !istNeu(r.id) && regel(r.id).faellig <= morgen).length;
}
