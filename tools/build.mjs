// Baut data/regeln.json, data/faelle.json, data/glossar.json aus inhalte/*.json + data/base.json.
// Klausurformel (Kurzantwort, Details, Normen, Schlüsselbegriffe) kommt IMMER wörtlich aus base.json (= ANTWORTEN.md).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lies = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const base = Object.fromEntries(lies('data/base.json').map((b) => [b.id, b]));
const norm = lies('quellen/normpruefung.json');

const dateien = readdirSync(join(root, 'inhalte')).filter((f) => f.endsWith('.json')).sort();
const regeln = [], faelle = [], glossar = new Map();
for (const datei of dateien) {
  const inhalt = lies(`inhalte/${datei}`);
  for (const r of inhalt.regeln ?? []) {
    const b = base[r.id];
    if (!b) throw new Error(`${datei}: unbekannte Regel ${r.id}`);
    regeln.push({
      id: r.id, nr: b.nr, stockwerk: b.stockwerk, frage: b.frage,
      titel: r.titel, fachbegriff: r.fachbegriff, einSatz: r.einSatz, warum: r.warum, alltag: r.alltag,
      erkennen: r.erkennen, merktrick: r.merktrick,
      klausur: {
        kurzantwort: b.kurzantwort, details: b.details, normen: b.normen, schluesselbegriffe: b.schluesselbegriffe,
        bausteine: r.klausur?.bausteine ?? [], fallenBausteine: r.klausur?.fallenBausteine ?? [],
      },
      verifiziert: b.verifiziert && !norm[r.id]?.unverifiziert,
      hinweise: b.hinweise,
      normhinweis: norm[r.id]?.hinweis ?? null,
    });
  }
  faelle.push(...(inhalt.faelle ?? []));
  for (const g of inhalt.glossar ?? []) {
    const alt = glossar.get(g.id);
    if (alt) alt.formen = [...new Set([...(alt.formen ?? []), ...(g.formen ?? [])])];
    else glossar.set(g.id, { ...g, formen: g.formen ?? [] });
  }
}
regeln.sort((a, b) => a.nr - b.nr);

writeFileSync(join(root, 'data/regeln.json'), JSON.stringify(regeln, null, 1) + '\n');
writeFileSync(join(root, 'data/faelle.json'), JSON.stringify(faelle, null, 1) + '\n');
writeFileSync(join(root, 'data/glossar.json'), JSON.stringify([...glossar.values()], null, 1) + '\n');
console.log(`Build: ${regeln.length} Regeln, ${faelle.length} Fälle, ${glossar.size} Glossar-Begriffe (${dateien.join(', ')})`);
