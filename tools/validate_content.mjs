// Prüft eine Kapitel-Ergänzungsdatei gegen data/base.json und content/SCHEMA.md.
// Aufruf: node tools/validate_content.mjs content/<kapitel>.json
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const base = JSON.parse(readFileSync(join(root, 'data/base.json'), 'utf8'));
export const sets = JSON.parse(readFileSync(join(root, 'content/triage_sets.json'), 'utf8'));
const TYPEN = ['definition', 'abgrenzung', 'schema', 'fakt', 'fall'];

const plain = (s) => s.replace(/\*\*/g, '').toLowerCase();
const normNummer = (n) => (n.match(/(?:§§?|Art\.)\s*(\d+[a-z]?)/) || [])[1];

export function validateChapter(data) {
  const errors = [];
  const err = (id, msg) => errors.push(`${id}: ${msg}`);
  const soll = base.filter(c => c.kapitel === data.kapitel);
  if (!soll.length) return [`unbekanntes Kapitel "${data.kapitel}"`];
  const ids = new Set();
  for (const k of data.karten ?? []) {
    const b = base.find(c => c.id === k.id);
    if (!b || b.kapitel !== data.kapitel) { err(k.id, 'gehört nicht zu diesem Kapitel'); continue; }
    if (ids.has(k.id)) err(k.id, 'doppelt');
    ids.add(k.id);
    const text = plain([b.frage, b.kurzantwort, b.details, ...b.hinweise].join('\n'));
    if (!TYPEN.includes(k.typ)) err(k.id, `typ "${k.typ}" ungültig`);
    if (!k.eselsbruecke?.trim()) err(k.id, 'eselsbruecke fehlt');
    if (!Array.isArray(k.normenAusText)) err(k.id, 'normenAusText fehlt');
    else {
      if (b.normen.length && k.normenAusText.length) err(k.id, 'normenAusText nur bei leeren normen');
      for (const n of k.normenAusText) {
        const nr = normNummer(n);
        if (!nr || !text.includes(nr.toLowerCase())) err(k.id, `Norm "${n}" kommt im Kartentext nicht vor`);
      }
    }
    if (!Array.isArray(k.luecken) || !k.luecken.length) err(k.id, 'mind. 1 Lücke');
    for (const l of k.luecken ?? []) {
      if ((l.text.match(/___/g) || []).length !== 1) err(k.id, `Lücke ohne genau ein ___: ${l.text}`);
      if (!l.loesung || !text.includes(plain(l.loesung))) err(k.id, `Lückenlösung "${l.loesung}" nicht wörtlich im Text`);
    }
    if (k.reihenfolge !== null && k.reihenfolge !== undefined) {
      const r = k.reihenfolge;
      if (!r.titel || !Array.isArray(r.schritte) || r.schritte.length < 3) err(k.id, 'reihenfolge braucht titel + ≥3 schritte');
    }
    for (const t of k.triage ?? []) {
      const s = sets[t.set];
      if (!s) err(k.id, `Triage-Set "${t.set}" unbekannt`);
      else if (!s.boxen.includes(t.richtig)) err(k.id, `Triage "${t.richtig}" nicht in Set ${t.set}`);
      if (!t.fall?.trim() || !t.grund?.trim()) err(k.id, 'Triage ohne fall/grund');
    }
    for (const l of k.luegen ?? []) {
      if (!Array.isArray(l.aussagen) || l.aussagen.length !== 3) err(k.id, 'Lüge braucht 3 Aussagen');
      if (![0, 1, 2].includes(l.luege)) err(k.id, 'luege-Index ungültig');
      if (!l.erklaerung?.trim()) err(k.id, 'Lüge ohne erklaerung');
    }
    for (const f of k.fristen ?? []) {
      if (!Array.isArray(f.optionen) || f.optionen.length !== 3) err(k.id, 'Frist braucht 3 Optionen');
      if (![0, 1, 2].includes(f.richtig)) err(k.id, 'Frist-richtig ungültig');
      if (!f.szenario?.trim() || !f.erklaerung?.trim()) err(k.id, 'Frist ohne szenario/erklaerung');
    }
    if (b.beispielfallNoetig) {
      const bf = k.beispielfall;
      if (!bf?.titel || !bf?.sachverhalt || !bf?.loesung) err(k.id, 'beispielfall (titel/sachverhalt/loesung) fehlt');
    } else if (k.beispielfall) err(k.id, 'beispielfall nur bei 📝-Karten');
  }
  for (const b of soll) if (!ids.has(b.id)) err(b.id, 'fehlt');
  return errors;
}

export function zaehle(data) {
  const sum = (f) => data.karten.reduce((a, k) => a + (k[f]?.length ?? 0), 0);
  return { triage: sum('triage'), luegen: sum('luegen'), fristen: sum('fristen'), luecken: sum('luecken'),
    reihenfolge: data.karten.filter(k => k.reihenfolge).length };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const errors = validateChapter(data);
  console.log(JSON.stringify(zaehle(data)));
  if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
  console.log('OK');
}
