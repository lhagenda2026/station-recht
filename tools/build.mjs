// Baut data/regeln.json, data/faelle.json, data/glossar.json aus
// data/base.json (Klausurformel wörtlich aus ANTWORTEN.md) und inhalte/*.json (einfache Sprache, Fälle).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

execFileSync('node', [join(root, 'tools/parse_antworten.mjs')], { stdio: 'inherit' });
const base = Object.fromEntries(read('data/base.json').map((b) => [b.id, b]));
const normpruefung = read('quellen/normpruefung.json');
export const stockwerkVon = (nr) => (nr <= 11 ? 1 : nr <= 25 ? 2 : nr <= 53 ? 3 : 4);

const regeln = [];
const faelle = [];
const glossar = new Map();
for (const datei of readdirSync(join(root, 'inhalte')).filter((f) => f.endsWith('.json')).sort()) {
  const inhalt = read(`inhalte/${datei}`);
  for (const r of inhalt.regeln ?? []) {
    const b = base[r.id];
    if (!b) throw new Error(`${datei}: unbekannte Regel ${r.id}`);
    const np = normpruefung[r.id];
    regeln.push({
      id: r.id,
      nr: b.nr,
      stockwerk: inhalt.stockwerkOverride ?? stockwerkVon(b.nr),
      frage: b.frage,
      titel: r.titel,
      fachbegriff: r.fachbegriff,
      einSatz: r.einSatz,
      warum: r.warum,
      alltag: r.alltag,
      erkennen: r.erkennen,
      merktrick: r.merktrick,
      klausur: {
        kurzantwort: b.kurzantwort,
        normen: b.normen,
        schluesselbegriffe: b.schluesselbegriffe,
        bausteine: r.bausteine,
        fallenBausteine: r.fallenBausteine,
      },
      verifiziert: b.verifiziert && !(np?.unverifiziert),
      hinweise: [...b.hinweise, ...(np?.hinweis ? [np.hinweis] : [])],
    });
  }
  for (const f of inhalt.faelle ?? []) faelle.push(f);
  for (const g of inhalt.glossar ?? []) {
    const key = g.begriff.toLowerCase();
    if (!glossar.has(key)) glossar.set(key, g);
  }
}
regeln.sort((a, b) => a.nr - b.nr);
writeFileSync(join(root, 'data/regeln.json'), JSON.stringify(regeln, null, 1) + '\n');
writeFileSync(join(root, 'data/faelle.json'), JSON.stringify(faelle, null, 1) + '\n');
writeFileSync(join(root, 'data/glossar.json'), JSON.stringify([...glossar.values()], null, 1) + '\n');
console.log(`Gebaut: ${regeln.length} Regeln, ${faelle.length} Fälle, ${glossar.size} Glossar-Begriffe`);
