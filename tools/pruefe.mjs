// Prüft EINE Inhaltsdatei vollständig (für die Inhalts-Agenten, ohne data/ zu schreiben):
// node tools/pruefe.mjs inhalte/stockwerk-1.json
import { basename } from 'node:path';
import { baue, validiere, lesbarkeit, inhaltsDateien, read } from './lib.mjs';

const datei = basename(process.argv[2] ?? '');
if (!datei) { console.error('Aufruf: node tools/pruefe.mjs inhalte/<datei>.json'); process.exit(2); }
const eigen = baue([datei]);
const alleGlossar = baue(inhaltsDateien()).glossar;
const alleIds = read('data/base.json').map((b) => b.id);
const fehler = validiere(eigen, { voll: true, alleGlossar, regelIdsExtern: alleIds });
const les = lesbarkeit(eigen);
const kniffel = eigen.faelle.filter((f) => f.stufe === 3 && f.kombiRegeln?.length).length;
console.log(`${datei}: ${eigen.regeln.length} Regeln, ${eigen.faelle.length} Fälle, ${kniffel} Kniffel, ${eigen.glossar.length} Glossar · WSTF Mittel ${les.mittel.toFixed(2)}, Max ${les.max.toFixed(2)}`);
const alle = [...fehler, ...les.fehler];
if (alle.length) { console.error(`✗ ${alle.length} Probleme:\n` + alle.map((x) => '  - ' + x).join('\n')); process.exit(1); }
console.log('✓ alles in Ordnung');
