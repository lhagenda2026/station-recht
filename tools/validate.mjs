// Qualitätstor 1: Datenvalidierung (Vollständigkeit, Referenzen, Optionen, Glossar).
// Aufruf: node tools/validate.mjs [--voll]  (--voll verlangt die Mengen aus BRIEF_V2 Abschnitt 5)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const regeln = read('data/regeln.json');
const faelle = read('data/faelle.json');
const glossar = read('data/glossar.json');
const base = read('data/base.json');
const voll = process.argv.includes('--voll');
const fehler = [];
const F = (m) => fehler.push(m);

const regelIds = new Set(regeln.map((r) => r.id));
const glossarKeys = new Set(glossar.flatMap((g) => [g.begriff, ...(g.aliase ?? [])].map((x) => x.toLowerCase())));
const leer = (v) => v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);

// Regeln
for (const r of regeln) {
  for (const k of ['titel', 'fachbegriff', 'einSatz', 'warum', 'alltag', 'erkennen', 'merktrick']) if (leer(r[k])) F(`${r.id}: ${k} fehlt`);
  if (r.erkennen && (r.erkennen.length < 2 || r.erkennen.length > 4)) F(`${r.id}: erkennen braucht 2 bis 4 Punkte`);
  if (leer(r.klausur?.bausteine) || r.klausur.bausteine.length < 2) F(`${r.id}: mindestens 2 Bausteine`);
  if (leer(r.klausur?.fallenBausteine)) F(`${r.id}: Fallen-Bausteine fehlen`);
  const b = base.find((x) => x.id === r.id);
  if (b.kurzantwort !== r.klausur.kurzantwort || JSON.stringify(b.schluesselbegriffe) !== JSON.stringify(r.klausur.schluesselbegriffe)) F(`${r.id}: Klausurformel weicht von ANTWORTEN.md ab`);
}
if (voll && regeln.length !== 58) F(`Regeln: ${regeln.length} statt 58`);

// Fälle
const ids = new Set();
const proRegel = {};
const ABGRENZUNG = new Set(['q1', 'q12', 'q17', 'q20', 'q22', 'q27', 'q28', 'q29', 'q30', 'q33', 'q36', 'q37', 'q38', 'q44', 'q46', 'q47', 'q48', 'q50', 'q51', 'q52', 'q58', 'q59']);
for (const f of faelle) {
  if (ids.has(f.id)) F(`${f.id}: doppelte ID`);
  ids.add(f.id);
  if (!regelIds.has(f.regelId)) F(`${f.id}: unbekannte Regel ${f.regelId}`);
  for (const k of f.kombiRegeln ?? []) if (!regelIds.has(k)) F(`${f.id}: unbekannte Kombi-Regel ${k}`);
  if (![0, 1, 2, 3].includes(f.stufe)) F(`${f.id}: Stufe ${f.stufe}`);
  if (!/^F[1-6]$/.test(f.format)) F(`${f.id}: Format ${f.format}`);
  for (const k of ['akte', 'frage', 'warum']) if (leer(f[k])) F(`${f.id}: ${k} fehlt`);
  if (!f.figur?.name || !f.figur?.emoji) F(`${f.id}: Figur fehlt`);
  if (!Array.isArray(f.denkweg) || f.denkweg.length < 2 || f.denkweg.length > 3) F(`${f.id}: Denkweg braucht 2 bis 3 Schritte`);
  if (['F1', 'F4', 'F5'].includes(f.format)) {
    const o = f.optionen ?? [];
    if (o.length < 2 || o.length > 4) F(`${f.id}: 2 bis 4 Optionen`);
    if (o.filter((x) => x.richtig).length !== 1) F(`${f.id}: genau eine richtige Option nötig`);
    for (const x of o) if (!x.richtig && leer(x.warumNicht)) F(`${f.id}: „${x.text}“ ohne warumNicht`);
    if (f.format === 'F1') for (const x of o) if (x.text.length > 34) F(`${f.id}: Stempeltext zu lang „${x.text}“`);
  }
  if (f.format === 'F2') {
    const m = f.markierbar ?? [];
    if (!m.some((x) => x.ziel)) F(`${f.id}: F2 ohne Ziel-Stelle`);
    for (const x of m) if (x.tappbar !== false && !x.ziel && leer(x.warumNicht)) F(`${f.id}: F2-Stelle „${x.text}“ ohne warumNicht`);
  }
  if (f.format === 'F3') {
    if (f.fachfaecher) {
      const { faecher, karten } = f.fachfaecher;
      if (!faecher?.length || !karten?.length) F(`${f.id}: F3 Fächer unvollständig`);
      for (const k of karten ?? []) if (!faecher?.includes(k.fach)) F(`${f.id}: Karte „${k.text}“ in unbekanntem Fach`);
    } else if (!(f.reihenfolge?.length >= 3)) F(`${f.id}: F3 braucht fachfaecher oder reihenfolge (≥3)`);
  }
  if (f.format === 'F4') for (const k of ['datumA', 'datumB', 'rechnung']) if (leer(f[k])) F(`${f.id}: F4 ${k} fehlt`);
  (proRegel[f.regelId] ??= []).push(f);
}
for (const r of regeln) {
  const fs = (proRegel[r.id] ?? []);
  const soll = voll ? (ABGRENZUNG.has(r.id) ? 6 : 4) : 1;
  if (fs.length < soll) F(`${r.id}: ${fs.length} Fälle, mindestens ${soll}`);
  if (voll) {
    for (const st of [0, 1, 2, 3]) if (!fs.some((f) => f.stufe === st)) F(`${r.id}: kein Fall auf Stufe ${st}`);
    if (!fs.some((f) => f.format === 'F6')) F(`${r.id}: keine F6-Aufgabe`);
  }
}
const kniffel = faelle.filter((f) => f.stufe === 3 && f.kombiRegeln?.length);
if (voll && kniffel.length < 20) F(`Kniffelfälle: ${kniffel.length} statt mindestens 20`);
if (voll && glossar.length < 60) F(`Glossar: ${glossar.length} statt mindestens 60`);

// Glossar: jeder markierte Fachbegriff muss existieren
const texte = [
  ...regeln.flatMap((r) => [r.id, [r.titel, r.einSatz, r.warum, r.alltag, r.merktrick, ...r.erkennen]]),
  ...faelle.flatMap((f) => [f.id, [f.akte, f.frage, f.warum, f.ergebnis, ...(f.denkweg ?? []), ...(f.optionen ?? []).flatMap((o) => [o.text, o.warumNicht]), ...(f.markierbar ?? []).flatMap((m) => [m.text, m.warumNicht])]]),
  ...glossar.flatMap((g) => [g.begriff, [g.erklaerung, g.beispiel]]),
];
for (let i = 0; i < texte.length; i += 2) {
  for (const t of texte[i + 1]) {
    for (const m of String(t ?? '').matchAll(/\[\[([^\]]+)\]\]/g)) {
      const key = (m[1].split('|')[1] ?? m[1]).toLowerCase();
      if (!glossarKeys.has(key)) F(`${texte[i]}: Glossar-Begriff „${key}“ fehlt`);
    }
  }
}
for (const g of glossar) for (const k of ['erklaerung', 'beispiel']) if (leer(g[k])) F(`Glossar „${g.begriff}“: ${k} fehlt`);

const formate = Object.fromEntries(['F1', 'F2', 'F3', 'F4', 'F5', 'F6'].map((x) => [x, faelle.filter((f) => f.format === x).length]));
console.log(`Regeln ${regeln.length} · Fälle ${faelle.length} · Kniffel ${kniffel.length} · Glossar ${glossar.length} · Formate ${JSON.stringify(formate)}`);
if (fehler.length) {
  console.error(`✗ ${fehler.length} Fehler:\n` + fehler.slice(0, 80).map((x) => '  - ' + x).join('\n'));
  process.exit(1);
}
console.log('✓ Datenvalidierung bestanden' + (voll ? ' (volle Mengen)' : ''));
