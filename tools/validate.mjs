// Vollständige Validierung von data/cards.json (BRIEF Abschnitt 5.1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'data/cards.json'), 'utf8'));
const base = JSON.parse(readFileSync(join(root, 'data/base.json'), 'utf8'));
const normpruefung = JSON.parse(readFileSync(join(root, 'content/normpruefung.json'), 'utf8'));
const { karten, triageSets } = data;
const errors = [];
const warn = [];
const err = (id, m) => errors.push(`${id}: ${m}`);

// Leere normen nur, wenn der Antworttext selbst keine Norm nennt
const nenntNorm = (k) => /(§|Art\.)\s?\d/.test([k.frage, k.kurzantwort, k.langantwort].join(' '));

if (karten.length !== 58) errors.push(`Erwartet 58 Karten, gefunden ${karten.length}`);
const ids = new Set();
for (const k of karten) {
  if (ids.has(k.id)) err(k.id, 'ID doppelt');
  ids.add(k.id);
  const b = base.find((x) => x.id === k.id);
  if (!b) { err(k.id, 'nicht in ANTWORTEN.md'); continue; }
  // Wörtliche Übernahme aus ANTWORTEN.md
  if (k.kurzantwort !== b.kurzantwort) err(k.id, 'kurzantwort weicht von ANTWORTEN.md ab');
  if (JSON.stringify(k.schluesselbegriffe) !== JSON.stringify(b.schluesselbegriffe)) err(k.id, 'schluesselbegriffe weichen ab');
  if (b.normen.length && JSON.stringify(k.normen) !== JSON.stringify(b.normen)) err(k.id, 'normen weichen ab');
  if (k.verifiziert !== (b.verifiziert && !normpruefung[k.id]?.unverifiziert)) err(k.id, 'verifiziert passt nicht zu ⚠/Normprüfung');
  for (const f of ['frage', 'kurzantwort', 'eselsbruecke', 'kapitel', 'typ']) if (!k[f]?.toString().trim()) err(k.id, `${f} fehlt`);
  if (k.schluesselbegriffe.length < 2 || k.schluesselbegriffe.length > 6) err(k.id, `${k.schluesselbegriffe.length} Schlüsselbegriffe`);
  if (k.schluesselbegriffe.length < 3) warn.push(`${k.id}: nur ${k.schluesselbegriffe.length} Schlüsselbegriffe (so in ANTWORTEN.md)`);
  if (!k.normen.length && nenntNorm(k)) err(k.id, 'normen leer, obwohl der Antworttext Normen nennt');
  if (!k.normen.length) warn.push(`${k.id}: keine Norm im Antworttext`);
  if (!k.luecken.length) err(k.id, 'keine Lücke');
  for (const l of k.luecken) if ((l.text.match(/___/g) || []).length !== 1 || !l.loesung) err(k.id, 'Lücke ungültig');
  if (b.beispielfallNoetig && !k.beispielfall) err(k.id, 'Beispielfall fehlt');
  for (const t of k.triage) {
    if (!ids.has(t.kartenId) && !karten.some((x) => x.id === t.kartenId)) err(k.id, `triage→${t.kartenId} existiert nicht`);
    if (!triageSets[t.set]?.boxen.includes(t.richtig)) err(k.id, `triage ${t.set}/${t.richtig} ungültig`);
  }
  for (const l of k.luegen) {
    if (!karten.some((x) => x.id === l.kartenId)) err(k.id, `lüge→${l.kartenId} existiert nicht`);
    if (l.aussagen.length !== 3 || ![0, 1, 2].includes(l.luege)) err(k.id, 'Lügen-Set ungültig');
  }
  for (const f of k.fristen) {
    if (!karten.some((x) => x.id === f.kartenId)) err(k.id, `frist→${f.kartenId} existiert nicht`);
    if (f.optionen.length !== 3 || ![0, 1, 2].includes(f.richtig)) err(k.id, 'Fristen-Szenario ungültig');
  }
  if (k.reihenfolge && (!k.reihenfolge.titel || k.reihenfolge.schritte.length < 3)) err(k.id, 'Reihenfolge ungültig');
}

const sum = (f) => karten.reduce((a, k) => a + k[f].length, 0);
const mengen = { triage: [sum('triage'), 60], luegen: [sum('luegen'), 40], fristen: [sum('fristen'), 25] };
for (const [name, [ist, soll]] of Object.entries(mengen)) if (ist < soll) errors.push(`Menge ${name}: ${ist} < ${soll}`);
const kapitelIds = new Set(data.kapitel.map((k) => k.id));
for (const k of karten) if (!kapitelIds.has(k.kapitel)) err(k.id, 'unbekanntes Kapitel');

console.log(`Karten ${karten.length} | Triage ${mengen.triage[0]} | Lügen ${mengen.luegen[0]} | Fristen ${mengen.fristen[0]} | Lücken ${sum('luecken')} | Schemata ${karten.filter((k) => k.reihenfolge).length}`);
console.log(`Nicht verifiziert: ${karten.filter((k) => !k.verifiziert).map((k) => k.nr).join(', ')}`);
warn.forEach((w) => console.log('Hinweis', w));
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('VALIDIERUNG OK');
