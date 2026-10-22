// Minimaler statischer Server ohne Abhängigkeiten. Aufruf: node tools/serve.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.argv[2] ?? process.env.PORT ?? 4173);
const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };

createServer(async (req, res) => {
  let pfad = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (pfad.endsWith('/')) pfad += 'index.html';
  const datei = normalize(join(root, pfad));
  if (!datei.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(datei);
    res.writeHead(200, { 'Content-Type': TYPEN[extname(datei)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Nicht gefunden');
  }
}).listen(port, () => console.log(`Bescheid, bitte! läuft auf http://localhost:${port}/`));
