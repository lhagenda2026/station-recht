// Baut data/regeln.json, data/faelle.json, data/glossar.json aus data/base.json (Klausurformel wörtlich
// aus ANTWORTEN.md) und inhalte/*.json (einfache Sprache, Fälle, Glossar).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, baue, inhaltsDateien } from './lib.mjs';

execFileSync('node', [join(root, 'tools/parse_antworten.mjs')], { stdio: 'ignore' });
const { regeln, faelle, glossar } = baue(inhaltsDateien());
writeFileSync(join(root, 'data/regeln.json'), JSON.stringify(regeln) + '\n');
writeFileSync(join(root, 'data/faelle.json'), JSON.stringify(faelle) + '\n');
writeFileSync(join(root, 'data/glossar.json'), JSON.stringify(glossar) + '\n');
console.log(`Gebaut: ${regeln.length} Regeln, ${faelle.length} Fälle, ${glossar.length} Glossar-Begriffe`);
