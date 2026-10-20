// Setzt die Cache-Version im Service Worker auf einen Hash aller App-Dateien.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const swPfad = join(root, 'sw.js');
const sw = readFileSync(swPfad, 'utf8');
const dateien = [...sw.match(/const DATEIEN = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((f) => f !== './');
const hash = createHash('sha256');
for (const f of dateien) hash.update(readFileSync(join(root, f)));
const version = 'sr-' + hash.digest('hex').slice(0, 10);
writeFileSync(swPfad, sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`));
console.log('SW-Version', version, `(${dateien.length} Dateien)`);
