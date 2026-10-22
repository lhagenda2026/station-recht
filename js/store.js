// Spielstand in localStorage, versioniert (schemaVersion). Schlüssel = Regel-ID bzw. Fall-ID.
const KEY = 'bescheid-bitte';
export const SCHEMA_VERSION = 2;

const leer = () => ({
  schemaVersion: SCHEMA_VERSION,
  spieltag: 0,          // Anzahl begonnener Arbeitstage
  regeln: {},           // id → Lernstand
  faelle: {},           // id → { gesehen, richtig }
  nachholen: [],        // Fall-IDs, die gestern falsch waren → kommen zuerst
  bestanden: [],        // bestandene Beförderungsprüfungen (Stockwerk-Nummern)
  muenzen: 0,
  sterneGesamt: 0,
  deko: [],
  streak: { zahl: 0, datum: null },
  einstellungen: { zeitdruck: true, ton: false, schrift: 1 },
  lauf: null,           // laufender Tag / laufende Prüfung (Pause)
  abschlussGesehen: false,
  introGesehen: false,
});

export let S = leer();

export function load() {
  try {
    const roh = JSON.parse(localStorage.getItem(KEY));
    if (roh && roh.schemaVersion === SCHEMA_VERSION) S = { ...leer(), ...roh, einstellungen: { ...leer().einstellungen, ...roh.einstellungen } };
  } catch { /* leerer Spielstand */ }
  return S;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* Speicher voll oder gesperrt */ }
}

export function reset() { S = leer(); save(); }

export function regelStand(id) {
  return S.regeln[id] ??= { stufe: 0, serie: 0, box: 0, faellig: 0, gesehen: false, gemeistert: false, richtig: 0, falsch: 0, boxTag: -1 };
}

export function fallStand(id) {
  return S.faelle[id] ??= { gesehen: 0, richtig: 0 };
}

export async function persistAnfragen() {
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch { /* egal */ }
}

// Backup-Code: Spielstand als Text (Base64 von JSON), mit Präfix zur Erkennung
export function exportCode() {
  const bytes = new TextEncoder().encode(JSON.stringify(S));
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return 'BB2-' + btoa(bin);
}

export function importCode(code) {
  const roh = code.trim().replace(/^BB2-/, '').replace(/\s+/g, '');
  const json = new TextDecoder().decode(Uint8Array.from(atob(roh), (c) => c.charCodeAt(0)));
  const daten = JSON.parse(json);
  if (daten.schemaVersion !== SCHEMA_VERSION) throw new Error('Version passt nicht');
  S = { ...leer(), ...daten };
  save();
}
