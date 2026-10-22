// Spielstand: Regel-Stufen, Leitner-Wiederholung, Münzen, Serie, Beförderung, Deko.
// Einziger Schreibweg für Lernfortschritt ist grade(). Versioniert in localStorage.

export const SCHEMA_VERSION = 2;
export const INTERVALLE = [0, 1, 2, 5, 12, 30]; // Tage je Leitner-Box 0–5
export const MAX_STUFE = 3;
const KEY = 'bescheidBitte.stand';
const DAY = 86400000;

let state = null;
let now = () => Date.now();
export const _setClock = (fn) => { now = fn; }; // nur für Tests
export const jetzt = () => now();

const leer = () => ({
  schemaVersion: SCHEMA_VERSION,
  regeln: {},        // regelId → { stufe, serie, box, faellig, gesehen, richtig, letzte }
  faelle: {},        // fallId → zuletzt gespielt (ms)
  nachholen: [],     // Fall-IDs, die morgen zuerst kommen
  muenzen: 0,
  sterneGesamt: 0,
  tage: 0,
  serie: 0,          // Tage in Folge gespielt
  letzterTag: null,
  stockwerk: 1,      // höchstes freigeschaltetes Stockwerk
  bestanden: [],     // bestandene Beförderungsprüfungen (Stockwerk-Nummern)
  deko: [],
  einstellungen: { zeitdruck: true, textgroesse: 1, ton: false },
  laufenderTag: null, // unterbrochener Tag (Pause)
  erstellt: now(),
});

export function tagKey(t = now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function migrate(s) {
  if (!s || typeof s !== 'object' || s.schemaVersion !== SCHEMA_VERSION) return leer();
  const basis = leer();
  return { ...basis, ...s, einstellungen: { ...basis.einstellungen, ...s.einstellungen } };
}

export function load() {
  try { state = migrate(JSON.parse(localStorage.getItem(KEY))); } catch { state = leer(); }
  return state;
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Speicher voll oder gesperrt */ }
}
export const getState = () => state ?? load();

export async function persistAnfragen() {
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch { /* egal */ }
}

export function regel(id) {
  return getState().regeln[id] ?? { stufe: 0, serie: 0, box: 0, faellig: 0, gesehen: 0, richtig: 0, letzte: 0 };
}
export const istNeu = (id) => !getState().regeln[id];

// Zentrale Bewertung. ergebnis: true/false. hilfeGenutzt: Regelbuch aufgeschlagen (ab Stufe 2 zählt das).
// Aufstieg nach 2 richtigen in Folge (ab Stufe 2 nur ohne Hilfe), Abstieg um eine Stufe bei Fehlern.
export function grade(regelId, ergebnis, hilfeGenutzt = false, zeit = 0) {
  const s = getState();
  const r = { ...regel(regelId) };
  const vorher = r.stufe;
  r.gesehen += 1;
  r.letzte = now();
  r.zeit = zeit;
  if (ergebnis) {
    r.richtig += 1;
    const zaehlt = r.stufe < 2 || !hilfeGenutzt;
    if (zaehlt) {
      r.serie += 1;
      if (r.serie >= 2 && r.stufe < MAX_STUFE) { r.stufe += 1; r.serie = 0; }
      r.box = Math.min(INTERVALLE.length - 1, r.box + 1);
    }
  } else {
    r.serie = 0;
    r.stufe = Math.max(0, r.stufe - 1);
    r.box = 0;
  }
  r.faellig = now() + INTERVALLE[r.box] * DAY;
  s.regeln[regelId] = r;
  save();
  return { vorher, nachher: r.stufe, aufstieg: r.stufe > vorher, abstieg: r.stufe < vorher };
}

export function fallGespielt(fallId) {
  getState().faelle[fallId] = now();
}

export function muenzenDazu(n) {
  const s = getState();
  s.muenzen = Math.max(0, s.muenzen + n);
  save();
}

// Am Tagesende: Serie, Zähler, Nachhol-Liste
export function tagAbschliessen({ sterne, falsche }) {
  const s = getState();
  const heute = tagKey();
  if (s.letzterTag !== heute) {
    const gestern = tagKey(now() - DAY);
    s.serie = s.letzterTag === gestern ? s.serie + 1 : 1;
    s.letzterTag = heute;
  }
  s.tage += 1;
  s.sterneGesamt += sterne;
  s.nachholen = [...new Set([...falsche, ...s.nachholen])].slice(0, 6);
  s.laufenderTag = null;
  save();
}

export function nachgeholt(fallId) {
  const s = getState();
  s.nachholen = s.nachholen.filter((id) => id !== fallId);
}

export function befoerdern(stockwerk) {
  const s = getState();
  if (!s.bestanden.includes(stockwerk)) s.bestanden.push(stockwerk);
  s.stockwerk = Math.max(s.stockwerk, Math.min(4, stockwerk + 1));
  save();
}

export function dekoKaufen(id, preis) {
  const s = getState();
  if (s.deko.includes(id) || s.muenzen < preis) return false;
  s.muenzen -= preis;
  s.deko.push(id);
  save();
  return true;
}

export function einstellung(key, wert) {
  const s = getState();
  s.einstellungen[key] = wert;
  save();
}

export function laufenderTag(t) {
  getState().laufenderTag = t;
  save();
}

// Backup-Code: Fortschritt als Text (Base64 von JSON) exportieren und einlesen
export function backupCode() {
  const json = JSON.stringify(getState());
  return 'BB2-' + btoa(unescape(encodeURIComponent(json)));
}
export function backupEinlesen(code) {
  const roh = String(code).trim().replace(/^BB2-/, '');
  const s = JSON.parse(decodeURIComponent(escape(atob(roh))));
  if (s.schemaVersion !== SCHEMA_VERSION || !s.regeln) throw new Error('Unbekannter Code');
  state = migrate(s);
  save();
}

export function zuruecksetzen() {
  state = leer();
  save();
}
