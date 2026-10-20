// Fortschritt, Leitner-Logik und die zentrale grade()-Funktion.
// Kein Spielmodus schreibt selbst in den Speicher – alle rufen grade() auf.

export const SCHEMA_VERSION = 1;
export const INTERVALLE = [0, 1, 2, 5, 12, 30]; // Tage je Box 0–5
const KEY = 'stationRecht.progress';
const DAY = 86400000;

let state = null;
let now = () => Date.now();
export const _setClock = (fn) => { now = fn; }; // nur für Tests

const leer = () => ({ schemaVersion: SCHEMA_VERSION, karten: {}, xp: 0, streak: 0, letzterTag: null, erstellt: now() });

export function tagKey(t = now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function migrate(s) {
  if (!s || typeof s !== 'object' || !s.karten) return leer();
  // schemaVersion 1 ist aktuell; spätere Versionen hier migrieren. Karten-IDs bleiben Schlüssel.
  return { ...leer(), ...s, schemaVersion: SCHEMA_VERSION };
}

export function load() {
  try { state = migrate(JSON.parse(localStorage.getItem(KEY))); } catch { state = leer(); }
  return state;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Speicher voll/gesperrt */ }
}
export const getState = () => state ?? load();

export async function persistAnfragen() {
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch { /* egal */ }
}

export function karte(id) {
  return getState().karten[id] ?? { box: 0, faellig: 0, gesehen: 0, letzte: 0, letzterAufstieg: null };
}

// result: 'sitzt' | 'wackelt' | 'weg'
export function grade(cardId, result) {
  const s = getState();
  const k = { ...karte(cardId) };
  const heute = tagKey();
  const vorher = k.box;
  if (result === 'sitzt') {
    // Max. ein Aufstieg pro Karte und Tag, damit Spielrunden die Boxen nicht hochjagen
    if (k.letzterAufstieg !== heute || k.gesehen === 0) { k.box = Math.min(5, k.box + 1); k.letzterAufstieg = heute; }
  } else if (result === 'wackelt') {
    k.box = Math.max(0, k.box - 2);
  } else {
    k.box = 0;
  }
  k.gesehen += 1;
  k.letzte = now();
  k.faellig = now() + INTERVALLE[k.box] * DAY;
  s.karten[cardId] = k;
  const xp = { sitzt: 10, wackelt: 5, weg: 2 }[result] ?? 0;
  s.xp += xp;
  streakTick(s, heute);
  save();
  return { vorher, nachher: k.box, xp, entlassen: vorher < 5 && k.box === 5 };
}

export function bonusXP(n) {
  const s = getState();
  s.xp += n;
  save();
}

function streakTick(s, heute) {
  if (s.letzterTag === heute) return;
  const gestern = tagKey(now() - DAY);
  s.streak = s.letzterTag === gestern ? s.streak + 1 : 1;
  s.letzterTag = heute;
}

export function streakAktuell() {
  const s = getState();
  return s.letzterTag === tagKey() || s.letzterTag === tagKey(now() - DAY) ? s.streak : 0;
}

// Vitalwert 0–100 aus Box und Überfälligkeit
const BASIS = [18, 40, 58, 74, 88, 100];
export function vital(id) {
  const k = karte(id);
  if (!k.gesehen) return null; // noch nicht aufgenommen
  const ueber = Math.max(0, (now() - k.faellig) / DAY);
  const iv = Math.max(1, INTERVALLE[k.box]);
  return Math.max(5, Math.round(BASIS[k.box] - (ueber / iv) * 30));
}

export function zustand(id) {
  const v = vital(id);
  if (v === null) return 'neu';
  if (karte(id).box === 5 && v >= 90) return 'entlassen';
  if (v >= 70) return 'stabil';
  if (v >= 40) return 'wackelt';
  return 'kritisch';
}

export const istFaellig = (id) => { const k = karte(id); return k.gesehen > 0 && k.faellig <= now(); };

// Visite: max. 10 Karten – fällige zuerst, dann schwächste (Vital < 70), dann neue
export function visiteQueue(karten, max = 10) {
  const ids = karten.map((c) => c.id);
  const byVital = (a, b) => vital(a) - vital(b);
  const faellig = ids.filter(istFaellig).sort(byVital);
  const schwach = ids.filter((id) => !istFaellig(id) && vital(id) !== null && vital(id) < 70).sort(byVital);
  const neu = ids.filter((id) => !karte(id).gesehen);
  return [...faellig, ...schwach, ...neu].slice(0, max);
}

export function oberarztFrei(karten, kapitel) {
  const ks = karten.filter((c) => c.kapitel === kapitel);
  return ks.filter((c) => karte(c.id).box >= 3).length / ks.length >= 0.7;
}

const RAENGE = ['Famulant:in', 'PJ', 'Assistenzärzt:in', 'Fachärzt:in', 'Oberärzt:in', 'Chefärzt:in'];
export function level(xp = getState().xp) {
  const lv = Math.floor(Math.sqrt(xp / 40)) + 1;
  const start = 40 * (lv - 1) ** 2, ziel = 40 * lv ** 2;
  return { lv, rang: RAENGE[Math.min(RAENGE.length - 1, Math.floor((lv - 1) / 3))], anteil: (xp - start) / (ziel - start), bisNaechstes: ziel - xp };
}

// Backup als Textcode
export function exportCode() {
  const json = JSON.stringify(getState());
  return 'SR1.' + btoa(unescape(encodeURIComponent(json)));
}
export function importCode(code) {
  const t = code.trim();
  if (!t.startsWith('SR1.')) throw new Error('Das ist kein Backup-Code von Station Recht (er beginnt mit „SR1.“).');
  let parsed;
  try { parsed = JSON.parse(decodeURIComponent(escape(atob(t.slice(4))))); } catch { throw new Error('Der Code ist unvollständig. Kopiere ihn noch einmal komplett.'); }
  if (!parsed.karten) throw new Error('Im Code steckt kein Fortschritt.');
  state = migrate(parsed);
  save();
  return state;
}
export function reset() { state = leer(); save(); }
