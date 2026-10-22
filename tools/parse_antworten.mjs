// Liest ANTWORTEN.md (verbindliche Quelle inkl. Fragenwortlaut) und schreibt data/base.json.
// Kurzantwort, Normen und Schlüsselbegriffe werden wörtlich übernommen.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const antworten = readFileSync(join(root, 'ANTWORTEN.md'), 'utf8');

const stockwerkVon = (nr) => nr <= 11 ? 1 : nr <= 25 ? 2 : nr <= 53 ? 3 : 4;

// Normen-Zeile an Kommas trennen, aber Fortsetzungen ("II GG", "92") an den Vorgänger hängen
function splitNormen(s) {
  const out = [];
  for (const part of s.split(/,\s*/)) {
    if (out.length && !/^(§|Art\.|[A-Z][a-zA-Z]{2,})/.test(part)) out[out.length - 1] += ', ' + part;
    else out.push(part.trim());
  }
  return out;
}

const isListLine = (l) => /^(- |\d+\. )/.test(l);
const blocks = antworten.split(/^### /m).slice(1);
const cards = [];

for (const block of blocks) {
  const lines = block.split('\n');
  const heading = lines[0];
  const nr = +heading.match(/^(\d+)\./)[1];
  const fallMarker = heading.includes('📝');
  let normen = null, begriffe = null;
  const hinweise = [];
  const body = [];
  for (const raw of lines.slice(1)) {
    const l = raw.trimEnd();
    if (/^---$/.test(l) || /^# /.test(l) || /^\*\(Die Nummer/.test(l)) continue;
    if (l.startsWith('**Normen:**')) { normen = splitNormen(l.replace('**Normen:**', '').trim()); continue; }
    if (l.startsWith('**Schlüsselbegriffe:**')) { begriffe = l.replace('**Schlüsselbegriffe:**', '').split(/,\s*/).map(s => s.trim()).filter(Boolean); continue; }
    if (l.includes('⚠')) { hinweise.push(l.replace(/^-\s*/, '').replace('⚠', '').trim()); continue; }
    body.push(l);
  }
  while (body.length && !body[0].trim()) body.shift();
  while (body.length && !body[body.length - 1].trim()) body.pop();

  // Kurzantwort = Text der Kurzantwort-Zeile; endet sie offen (leer oder ":"), gehört die direkt folgende Liste dazu
  const first = body.shift() ?? '';
  const m = first.match(/^\*\*Kurzantwort(?: \(([^)]*)\))?:\*\*\s*(.*)$/);
  if (!m) throw new Error(`Frage ${nr}: keine Kurzantwort-Zeile`);
  const prefix = m[1] ? `${m[1]}: ` : '';
  let kurz = [(prefix + m[2]).trimEnd()].filter(s => s.trim());
  if (!m[2].trim() || m[2].trim().endsWith(':')) {
    while (body.length && isListLine(body[0])) kurz.push(body.shift());
  }
  while (body.length && !body[0].trim()) body.shift();

  cards.push({
    id: `q${nr}`,
    stockwerk: stockwerkVon(nr),
    nr,
    frage: heading.replace(/^\d+\.\s*/, '').replace('📝', '').trim(),
    kurzantwort: kurz.join('\n').trim(),
    details: body.join('\n').trim(),
    schluesselbegriffe: begriffe ?? [],
    normen: normen ?? [],
    normenAusAntwortzeile: normen !== null,
    hinweise,
    verifiziert: hinweise.length === 0,
    beispielfallNoetig: fallMarker,
  });
}

writeFileSync(join(root, 'data/base.json'), JSON.stringify(cards, null, 2) + '\n');
console.log(`${cards.length} Karten geschrieben → data/base.json`);
console.log('Ohne Normen-Zeile:', cards.filter(c => !c.normenAusAntwortzeile).map(c => c.nr).join(', '));
console.log('Unverifiziert (⚠):', cards.filter(c => !c.verifiziert).map(c => c.nr).join(', '));
console.log('Fehlende Fragen:', cards.filter(c => !c.frage).map(c => c.nr).join(', ') || '–');
