// Führt data/base.json (aus ANTWORTEN.md) und content/<kapitel>.json zu data/cards.json zusammen.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

execFileSync('node', [join(root, 'tools/parse_antworten.mjs')], { stdio: 'inherit' });
const base = read('data/base.json');
const triageSets = read('content/triage_sets.json');
const normpruefung = read('content/normpruefung.json');

const KAPITEL = [
  { id: 'allgemein', titel: 'Allgemeines & Staatsstruktur', zimmer: 'Zimmer 1' },
  { id: 'grundrechte', titel: 'Grundrechte', zimmer: 'Zimmer 2' },
  { id: 'verwaltungsrecht', titel: 'Verwaltungsrecht', zimmer: 'Zimmer 3' },
  { id: 'sozialprozessrecht', titel: 'Sozialprozessrecht', zimmer: 'Zimmer 4' },
];

const extra = {};
for (const k of KAPITEL) {
  const p = `content/${k.id}.json`;
  if (!existsSync(join(root, p))) { console.warn(`! ${p} fehlt – Karten ohne Ergänzungen`); continue; }
  for (const c of read(p).karten) extra[c.id] = c;
}

const karten = base.map((b) => {
  const e = extra[b.id] ?? {};
  const ref = (arr) => (arr ?? []).map((x) => ({ kartenId: b.id, ...x }));
  return {
    id: b.id, kapitel: b.kapitel, nr: b.nr, typ: e.typ ?? 'definition',
    frage: b.frage,
    kurzantwort: b.kurzantwort,
    langantwort: b.details,
    schluesselbegriffe: b.schluesselbegriffe,
    normen: b.normen.length ? b.normen : (e.normenAusText ?? []),
    eselsbruecke: e.eselsbruecke ?? '',
    luecken: e.luecken ?? [],
    reihenfolge: e.reihenfolge ?? null,
    triage: ref(e.triage),
    luegen: ref(e.luegen),
    fristen: ref(e.fristen),
    beispielfall: e.beispielfall ?? null,
    hinweise: b.hinweise,
    normpruefung: normpruefung[b.id]?.hinweis ?? null,
    verifiziert: b.verifiziert && !normpruefung[b.id]?.unverifiziert,
  };
});

const out = { version: new Date().toISOString().slice(0, 10), kapitel: KAPITEL, triageSets, karten };
writeFileSync(join(root, 'data/cards.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`data/cards.json: ${karten.length} Karten`);
