// Qualitätstor 1 + 2: Datenvalidierung und Lesbarkeit. Aufruf: node tools/validate.mjs [--voll] [--bericht]
// --voll: Mengen aus BRIEF_V2 Abschnitt 5 erzwingen (58 Regeln, ≥4 Fälle je Regel, ≥20 Kniffel, ≥60 Glossar).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { klar, wstf, langeSaetze } from './lesbarkeit.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lies = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const voll = process.argv.includes('--voll');
const bericht = process.argv.includes('--bericht');
const regeln = lies('data/regeln.json');
const faelle = lies('data/faelle.json');
const glossar = lies('data/glossar.json');

export const ABGRENZUNG = ['q1', 'q17', 'q20', 'q27', 'q28', 'q29', 'q30', 'q34', 'q36', 'q37', 'q38', 'q44', 'q46', 'q47', 'q48', 'q50', 'q51', 'q52', 'q58', 'q59'];
// Fachwort-Stämme: Kommen sie im Spielertext vor, muss ein Glossar-Eintrag sie abdecken.
const FACHSTAEMME = ['Verwaltungsakt', 'Ermessen', 'Tatbestand', 'Rechtsfolge', 'Körperschaft', 'Anstalt', 'Satzung', 'Rechtsverordnung', 'Verordnung',
  'Widerspruch', 'Bekanntgabe', 'Anhörung', 'Nichtigkeit', 'nichtig', 'Grundrecht', 'Schutzbereich', 'Schranke', 'verhältnismäßig', 'Verhältnismäßigkeit',
  'Legitimation', 'Analogie', 'Auslegung', 'Rechtsnorm', 'Vorbehalt', 'Klage', 'Realakt', 'Bestandskraft', 'Behörde', 'hoheitlich', 'Ermächtigung',
  'Sozialstaat', 'Existenzminimum', 'G-BA', 'SGB', 'SGG', 'GKV', 'Grundgesetz', 'Gesetzgeber', 'Verwaltung', 'Selbstverwaltung', 'Rechtsaufsicht', 'Richtlinie',
  'Berufsfreiheit', 'Wiedereinsetzung', 'Rechtsbehelfsbelehrung', 'Sozialgericht', 'Verfassungsbeschwerde', 'Bundesverfassungsgericht', 'BVerfG', 'BSG'];

const fehler = [], warn = [];
const F = (m) => fehler.push(m), W = (m) => warn.push(m);
const regelMap = Object.fromEntries(regeln.map((r) => [r.id, r]));
const gMap = {};
glossar.forEach((g) => { gMap[g.id] = g; [g.begriff, ...g.formen].forEach((w) => { gMap[w.toLowerCase()] = g; }); });
const woerterVon = (s) => s.split(/\s+/).filter(Boolean).length;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ganzesWort = (w) => new RegExp(`(?<![A-Za-zÄÖÜäöüß-])${esc(w)}(?![A-Za-zÄÖÜäöüß])`);

/** Prüft eine Leseeinheit: Glossar-Verweise gültig, Fachwörter markiert, Lesbarkeit. */
function einheit(name, texte, { eigenerBegriff = '' } = {}) {
  const roh = texte.filter(Boolean).join('\n');
  const markiert = new Set();
  for (const m of roh.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
    const g = gMap[(m[2] ?? m[1]).toLowerCase()];
    if (!g) F(`${name}: Glossar-Verweis [[${m[0].slice(2, -2)}]] ohne Eintrag`);
    else markiert.add(g.id);
  }
  const plain = klar(roh);
  for (const g of glossar) {
    if (markiert.has(g.id) || eigenerBegriff.toLowerCase().includes(g.begriff.toLowerCase())) continue;
    const treffer = [g.begriff, ...g.formen].find((w) => ganzesWort(w).test(plain));
    if (treffer) F(`${name}: Fachwort „${treffer}“ nicht markiert (mindestens einmal [[…]] setzen)`);
  }
  for (const stamm of FACHSTAEMME) {
    const m = plain.match(new RegExp(`(?<![A-Za-zÄÖÜäöüß])${esc(stamm)}[a-zäöüß]*`, 'i'));
    if (!m) continue;
    const wort = m[0];
    const abgedeckt = gMap[wort.toLowerCase()] || glossar.some((g) => [g.begriff, ...g.formen].some((f) => f.toLowerCase() === wort.toLowerCase()));
    if (!abgedeckt && !eigenerBegriff.toLowerCase().includes(wort.toLowerCase())) F(`${name}: Fachwort „${wort}“ fehlt im Glossar`);
  }
  for (const s of langeSaetze(roh)) F(`${name}: Satz > 22 Wörter: „${s.slice(0, 70)}…“`);
  const w = wstf(roh);
  if (w != null && w > 8) F(`${name}: Wiener Sachtextformel ${w.toFixed(1)} > 8`);
  return w;
}

// --- Regeln
const wstfWerte = [];
const PFLICHT_R = ['titel', 'fachbegriff', 'einSatz', 'warum', 'alltag', 'merktrick'];
for (const r of regeln) {
  for (const k of PFLICHT_R) if (!r[k]?.trim()) F(`${r.id}: Feld ${k} fehlt`);
  if (!Array.isArray(r.erkennen) || r.erkennen.length < 2 || r.erkennen.length > 4) F(`${r.id}: erkennen braucht 2–4 Punkte`);
  if (woerterVon(klar(r.einSatz ?? '')) > 20) F(`${r.id}: einSatz hat ${woerterVon(klar(r.einSatz))} Wörter (max. 20)`);
  if ((r.klausur.bausteine?.length ?? 0) < 3) F(`${r.id}: mindestens 3 Klausur-Bausteine nötig`);
  if (!(r.klausur.fallenBausteine?.length >= 1)) F(`${r.id}: mindestens 1 Fallen-Baustein nötig`);
  r.klausur.fallenBausteine?.forEach((f, i) => { if (!f.text || !f.warumNicht) F(`${r.id}: Fallen-Baustein ${i} braucht text und warumNicht`); });
  if (!r.klausur.kurzantwort) F(`${r.id}: Kurzantwort fehlt (base.json)`);
  wstfWerte.push(einheit(`Regel ${r.id}`, [r.einSatz, r.warum, r.alltag, ...(r.erkennen ?? []), r.merktrick], { eigenerBegriff: `${r.fachbegriff} ${r.titel}` }));
}

// --- Fälle
const FORMATE = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'];
const ids = new Set();
for (const f of faelle) {
  const n = `Fall ${f.id}`;
  if (ids.has(f.id)) F(`${n}: doppelte ID`);
  ids.add(f.id);
  if (!regelMap[f.regelId]) { F(`${n}: unbekannte regelId ${f.regelId}`); continue; }
  if (!FORMATE.includes(f.format)) F(`${n}: unbekanntes Format ${f.format}`);
  if (![0, 1, 2, 3].includes(f.stufe)) F(`${n}: stufe muss 0–3 sein`);
  for (const k of ['frage', 'ergebnis', 'warum']) if (!f[k]?.trim()) F(`${n}: Feld ${k} fehlt`);
  if (!['F5', 'F6'].includes(f.format) && !(f.figur?.name && f.figur?.emoji)) F(`${n}: figur fehlt`);
  if (!Array.isArray(f.denkweg) || f.denkweg.length < 2 || f.denkweg.length > 3) F(`${n}: denkweg braucht 2–3 Schritte`);
  (f.kombiRegeln ?? []).forEach((id) => { if (!regelMap[id]) F(`${n}: kombiRegeln enthält unbekannte ${id}`); });
  if (f.kombiRegeln?.length && f.stufe !== 3) F(`${n}: Kniffelfälle müssen Stufe 3 sein`);
  const extra = [];
  if (['F1', 'F4', 'F5'].includes(f.format)) {
    const o = f.optionen ?? [];
    const soll = f.format === 'F1' ? [2, 4] : [3, 3];
    if (o.length < soll[0] || o.length > soll[1]) F(`${n}: ${f.format} braucht ${soll.join('–')} Optionen`);
    if (o.filter((x) => x.richtig).length !== 1) F(`${n}: genau eine richtige Option nötig`);
    o.filter((x) => !x.richtig).forEach((x) => { if (!x.warumNicht?.trim()) F(`${n}: Option „${x.text}“ ohne warumNicht`); });
    if (f.format === 'F1') o.forEach((x) => { if (woerterVon(klar(x.text)) > 4) F(`${n}: Stempeltext „${x.text}“ zu lang (max. 4 Wörter)`); });
    extra.push(...o.map((x) => x.text), ...o.map((x) => x.warumNicht));
  }
  if (f.format === 'F4') {
    for (const k of ['datumA', 'datumB']) if (!f[k]?.label || !/^\d{4}-\d{2}-\d{2}$/.test(f[k]?.datum ?? '')) F(`${n}: ${k} braucht label und datum (JJJJ-MM-TT)`);
    if (!f.rechnung) F(`${n}: rechnung fehlt`);
    extra.push(f.datumA?.label, f.datumB?.label, f.rechnung);
  }
  if (f.format === 'F2') {
    const teile = f.markierbar ?? [];
    const klick = teile.filter((t) => typeof t === 'object');
    if (!['einer', 'alle'].includes(f.modus)) F(`${n}: F2 braucht modus "einer" oder "alle"`);
    if (klick.filter((t) => t.fehler).length < 1) F(`${n}: F2 braucht mindestens einen Teil mit fehler: true`);
    if (f.modus === 'einer' && klick.filter((t) => t.fehler).length !== 1) F(`${n}: modus "einer" braucht genau einen Treffer`);
    klick.filter((t) => !t.fehler).forEach((t) => { if (!t.warumNicht) F(`${n}: Teil „${t.text}“ ohne warumNicht`); });
    extra.push(...teile.map((t) => (typeof t === 'string' ? t : `${t.text} ${t.warumNicht ?? ''} ${t.fehlerart ?? ''}`)));
  }
  if (f.format === 'F3') {
    if (f.fachfaecher) {
      const { faecher, karten } = f.fachfaecher;
      if (!(faecher?.length >= 2 && faecher.length <= 3)) F(`${n}: F3 braucht 2–3 Fächer`);
      if (!(karten?.length >= 3)) F(`${n}: F3 braucht mindestens 3 Karten`);
      karten?.forEach((k) => { if (!faecher.includes(k.fach)) F(`${n}: Karte „${k.text}“ hat unbekanntes Fach`); if (!k.warumNicht) F(`${n}: Karte „${k.text}“ ohne warumNicht`); });
      extra.push(...(faecher ?? []), ...(karten ?? []).flatMap((k) => [k.text, k.warumNicht]));
    } else if (f.reihenfolge) {
      if (f.reihenfolge.length < 3) F(`${n}: Reihenfolge braucht mindestens 3 Schritte`);
      extra.push(...f.reihenfolge);
    } else F(`${n}: F3 braucht fachfaecher oder reihenfolge`);
  }
  if (f.format === 'F6' && !(regelMap[f.regelId].klausur.bausteine?.length >= 3)) F(`${n}: F6 ohne Bausteine in der Regel`);
  const textFelder = f.format === 'F6' ? [f.akte, f.frage, f.ergebnis, f.warum, ...(f.denkweg ?? [])] : [f.akte, f.frage, ...extra, f.ergebnis, f.warum, ...(f.denkweg ?? [])];
  wstfWerte.push(einheit(n, textFelder));
}

// --- Glossar
for (const g of glossar) {
  if (!g.id || !g.begriff || !g.erklaerung) F(`Glossar ${g.id}: id, begriff, erklaerung nötig`);
  if (!g.beispiel) F(`Glossar ${g.id}: Alltagsbeispiel fehlt`);
  for (const s of langeSaetze(`${g.erklaerung} ${g.beispiel ?? ''}`)) F(`Glossar ${g.id}: Satz > 22 Wörter`);
}
const gw = wstf(glossar.map((g) => `${g.erklaerung} ${g.beispiel ?? ''}`).join(' '));
if (gw != null && gw > 8) F(`Glossar gesamt: Wiener Sachtextformel ${gw.toFixed(1)} > 8`);

// --- Mengen
const proRegel = (id) => faelle.filter((f) => f.regelId === id && f.format !== 'F6' && !f.kombiRegeln?.length);
for (const r of regeln) {
  const fs = proRegel(r.id);
  const stufen = new Set(fs.map((f) => f.stufe));
  const min = ABGRENZUNG.includes(r.id) ? 6 : 4;
  if (voll && fs.length < min) F(`${r.id}: nur ${fs.length} Fälle (mind. ${min})`);
  if (voll) [0, 1, 2, 3].forEach((s) => { if (!stufen.has(s)) F(`${r.id}: kein Fall für Stufe ${s}`); });
  if (voll && !faelle.some((f) => f.regelId === r.id && f.format === 'F6')) F(`${r.id}: keine F6-Aufgabe`);
  if (!voll && !stufen.has(0)) W(`${r.id}: kein Fall für Stufe 0`);
}
const kniffel = faelle.filter((f) => f.kombiRegeln?.length).length;
if (voll) {
  if (regeln.length !== 58) F(`Regeln: ${regeln.length} statt 58`);
  if (kniffel < 20) F(`Kniffelfälle: ${kniffel} (mind. 20)`);
  if (glossar.length < 60) F(`Glossar: ${glossar.length} Begriffe (mind. 60)`);
  for (const fmt of FORMATE) if (!faelle.some((f) => f.format === fmt)) F(`Format ${fmt} kommt nicht vor`);
}

const gemessen = wstfWerte.filter((x) => x != null);
const schnitt = gemessen.reduce((a, b) => a + b, 0) / (gemessen.length || 1);
const formate = Object.fromEntries(FORMATE.map((x) => [x, faelle.filter((f) => f.format === x).length]));
console.log(`Regeln ${regeln.length}, Fälle ${faelle.length} (Kniffel ${kniffel}), Glossar ${glossar.length}, Formate ${JSON.stringify(formate)}`);
console.log(`WSTF: Schnitt ${schnitt.toFixed(2)}, max ${Math.max(...gemessen).toFixed(2)} (${gemessen.length} Einheiten), unverifiziert: ${regeln.filter((r) => !r.verifiziert).map((r) => r.id).join(', ') || '–'}`);
warn.forEach((m) => console.log('Hinweis:', m));
if (fehler.length) {
  (bericht ? fehler : fehler.slice(0, 60)).forEach((m) => console.log('FEHLER:', m));
  console.log(`${fehler.length} Fehler.`);
  process.exit(1);
}
console.log('Validierung bestanden.');
