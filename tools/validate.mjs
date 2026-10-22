// Qualitätstore 1 und 2: Datenvalidierung und Lesbarkeit (Wiener Sachtextformel ≤ 8, Sätze ≤ 22 Wörter).
// Aufruf: node tools/validate.mjs [--voll]   (--voll verlangt alle Mengen aus BRIEF_V2 Abschnitt 5)
import { read, validiere, lesbarkeit } from './lib.mjs';

const voll = process.argv.includes('--voll');
const daten = { regeln: read('data/regeln.json'), faelle: read('data/faelle.json'), glossar: read('data/glossar.json') };
const fehler = validiere(daten, { voll });
const kniffel = daten.faelle.filter((f) => f.stufe === 3 && f.kombiRegeln?.length).length;
if (voll && daten.regeln.length !== 58) fehler.push(`Regeln: ${daten.regeln.length} statt 58`);
if (voll && kniffel < 20) fehler.push(`Kniffelfälle: ${kniffel} statt mindestens 20`);
if (voll && daten.glossar.length < 60) fehler.push(`Glossar: ${daten.glossar.length} statt mindestens 60`);
const ids = new Set(daten.regeln.map((r) => r.id));
for (const f of daten.faelle) for (const k of f.kombiRegeln ?? []) if (!ids.has(k)) fehler.push(`${f.id}: Kombi-Regel ${k} fehlt`);
const les = lesbarkeit(daten);
const formate = Object.fromEntries(['F1', 'F2', 'F3', 'F4', 'F5', 'F6'].map((x) => [x, daten.faelle.filter((f) => f.format === x).length]));
console.log(`Regeln ${daten.regeln.length} · Fälle ${daten.faelle.length} · Kniffel ${kniffel} · Glossar ${daten.glossar.length} · Formate ${JSON.stringify(formate)}`);
console.log(`Lesbarkeit: Wiener Sachtextformel Mittel ${les.mittel.toFixed(2)}, Maximum ${les.max.toFixed(2)}`);
const alle = [...fehler, ...les.fehler];
if (alle.length) {
  console.error(`✗ ${alle.length} Fehler:\n` + alle.slice(0, 60).map((x) => '  - ' + x).join('\n'));
  process.exit(1);
}
console.log('✓ Datenvalidierung und Lesbarkeit bestanden' + (voll ? ' (volle Mengen)' : ''));
