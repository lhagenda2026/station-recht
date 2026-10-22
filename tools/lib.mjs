// Gemeinsame Logik für Build und Qualitätstore: Inhalte zusammenführen, validieren, Lesbarkeit messen.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
export const stockwerkVon = (nr) => (nr <= 11 ? 1 : nr <= 25 ? 2 : nr <= 53 ? 3 : 4);
export const inhaltsDateien = () => readdirSync(join(root, 'inhalte')).filter((f) => f.endsWith('.json')).sort();

// Regeln, deren Unterscheidung zentral ist: mindestens 6 Fälle (BRIEF_V2 Abschnitt 5)
export const ABGRENZUNG = new Set(['q1', 'q12', 'q17', 'q20', 'q22', 'q27', 'q28', 'q29', 'q30', 'q33', 'q36', 'q37', 'q38', 'q44', 'q46', 'q47', 'q48', 'q50', 'q51', 'q52', 'q58', 'q59']);

export function baue(dateien) {
  const base = Object.fromEntries(read('data/base.json').map((b) => [b.id, b]));
  const normpruefung = read('quellen/normpruefung.json');
  const regeln = [];
  const faelle = [];
  const glossar = new Map();
  for (const datei of dateien) {
    const inhalt = read(`inhalte/${datei}`);
    for (const r of inhalt.regeln ?? []) {
      const b = base[r.id];
      if (!b) throw new Error(`${datei}: unbekannte Regel ${r.id}`);
      const np = normpruefung[r.id];
      regeln.push({
        id: r.id, nr: b.nr, stockwerk: inhalt.stockwerkOverride ?? stockwerkVon(b.nr), frage: b.frage,
        titel: r.titel, fachbegriff: r.fachbegriff, einSatz: r.einSatz, warum: r.warum, alltag: r.alltag,
        erkennen: r.erkennen, merktrick: r.merktrick,
        klausur: { kurzantwort: b.kurzantwort, normen: b.normen, schluesselbegriffe: b.schluesselbegriffe, bausteine: r.bausteine, fallenBausteine: r.fallenBausteine },
        verifiziert: b.verifiziert && !np?.unverifiziert && r.verifiziert !== false,
        hinweise: [...b.hinweise, ...(np?.hinweis ? [np.hinweis] : []), ...(r.hinweis ? [r.hinweis] : [])],
      });
    }
    faelle.push(...(inhalt.faelle ?? []));
    for (const g of inhalt.glossar ?? []) if (!glossar.has(g.begriff.toLowerCase())) glossar.set(g.begriff.toLowerCase(), g);
  }
  regeln.sort((a, b) => a.nr - b.nr);
  return { regeln, faelle, glossar: [...glossar.values()] };
}

const leer = (v) => v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length);

export function validiere({ regeln, faelle, glossar }, { voll = false, alleGlossar = glossar, regelIdsExtern = [] } = {}) {
  const base = read('data/base.json');
  const fehler = [];
  const F = (m) => fehler.push(m);
  const regelIds = new Set([...regeln.map((r) => r.id), ...regelIdsExtern]);
  const glossarKeys = new Set(alleGlossar.flatMap((g) => [g.begriff, ...(g.aliase ?? [])].map((x) => x.toLowerCase())));
  for (const r of regeln) {
    for (const k of ['titel', 'fachbegriff', 'einSatz', 'warum', 'alltag', 'erkennen', 'merktrick']) if (leer(r[k])) F(`${r.id}: ${k} fehlt`);
    if (r.erkennen && (r.erkennen.length < 2 || r.erkennen.length > 4)) F(`${r.id}: erkennen braucht 2 bis 4 Punkte`);
    if (leer(r.klausur?.bausteine) || r.klausur.bausteine.length < 2) F(`${r.id}: mindestens 2 Bausteine`);
    if (leer(r.klausur?.fallenBausteine)) F(`${r.id}: Fallen-Bausteine fehlen`);
    const b = base.find((x) => x.id === r.id);
    if (b.kurzantwort !== r.klausur.kurzantwort) F(`${r.id}: Klausurformel weicht von ANTWORTEN.md ab`);
    if (r.einSatz && wortzahl(r.einSatz) > 28) F(`${r.id}: einSatz zu lang (${wortzahl(r.einSatz)} Wörter)`);
  }
  const ids = new Set();
  const proRegel = {};
  for (const f of faelle) {
    if (ids.has(f.id)) F(`${f.id}: doppelte ID`);
    ids.add(f.id);
    if (!regelIds.has(f.regelId)) F(`${f.id}: unbekannte Regel ${f.regelId}`);
    for (const k of f.kombiRegeln ?? []) if (!/^q\d+$/.test(k)) F(`${f.id}: Kombi-Regel ${k} ungültig`);
    if (![0, 1, 2, 3].includes(f.stufe)) F(`${f.id}: Stufe ${f.stufe}`);
    if (!/^F[1-6]$/.test(f.format)) F(`${f.id}: Format ${f.format}`);
    for (const k of ['akte', 'frage', 'warum', 'ergebnis']) if (leer(f[k])) F(`${f.id}: ${k} fehlt`);
    if (!f.figur?.name || !f.figur?.emoji) F(`${f.id}: Figur fehlt`);
    if (!Array.isArray(f.denkweg) || f.denkweg.length < 2 || f.denkweg.length > 3) F(`${f.id}: Denkweg braucht 2 bis 3 Schritte`);
    if (['F1', 'F4', 'F5'].includes(f.format)) {
      const o = f.optionen ?? [];
      if (o.length < 2 || o.length > 4) F(`${f.id}: 2 bis 4 Optionen`);
      if (o.filter((x) => x.richtig).length !== 1) F(`${f.id}: genau eine richtige Option nötig`);
      for (const x of o) if (!x.richtig && leer(x.warumNicht)) F(`${f.id}: „${x.text}“ ohne warumNicht`);
      if (f.format === 'F1') for (const x of o) if (x.text.length > 34) F(`${f.id}: Stempeltext zu lang „${x.text}“ (max. 34 Zeichen)`);
    }
    if (f.format === 'F2') {
      const m = f.markierbar ?? [];
      if (m.filter((x) => x.ziel).length !== 1) F(`${f.id}: F2 braucht genau eine Ziel-Stelle`);
      for (const x of m) if (x.tappbar !== false && !x.ziel && leer(x.warumNicht)) F(`${f.id}: F2-Stelle „${x.text}“ ohne warumNicht`);
      if (f.optionen?.length && f.optionen.filter((x) => x.richtig).length !== 1) F(`${f.id}: F2-Fehlerart braucht genau eine richtige Option`);
      for (const x of f.optionen ?? []) if (!x.richtig && leer(x.warumNicht)) F(`${f.id}: „${x.text}“ ohne warumNicht`);
    }
    if (f.format === 'F3') {
      if (f.fachfaecher) {
        const { faecher, karten } = f.fachfaecher;
        if (!faecher?.length || faecher.length > 3 || !karten?.length) F(`${f.id}: F3 braucht 2 bis 3 Fächer und Karten`);
        for (const k of karten ?? []) { if (!faecher?.includes(k.fach)) F(`${f.id}: Karte „${k.text}“ in unbekanntem Fach`); if (leer(k.warum)) F(`${f.id}: Karte „${k.text}“ ohne warum`); }
      } else if (!(f.reihenfolge?.length >= 3)) F(`${f.id}: F3 braucht fachfaecher oder reihenfolge (≥3)`);
    }
    if (f.format === 'F4') {
      for (const k of ['datumA', 'datumB', 'rechnung']) if (leer(f[k])) F(`${f.id}: F4 ${k} fehlt`);
      for (const k of ['datumA', 'datumB']) if (f[k] && isNaN(new Date(f[k]))) F(`${f.id}: F4 ${k} kein Datum`);
    }
    if (f.format === 'F6' && f.bausteine && !f.fallenBausteine) F(`${f.id}: F6 mit eigenen Bausteinen braucht fallenBausteine`);
    (proRegel[f.regelId] ??= []).push(f);
  }
  for (const r of regeln) {
    const fs = proRegel[r.id] ?? [];
    const soll = voll ? (ABGRENZUNG.has(r.id) ? 6 : 4) : 1;
    if (fs.length < soll) F(`${r.id}: ${fs.length} Fälle, mindestens ${soll}`);
    if (voll) {
      for (const st of [0, 1, 2, 3]) if (!fs.some((f) => f.stufe === st)) F(`${r.id}: kein Fall auf Stufe ${st}`);
      if (!fs.some((f) => f.format === 'F6')) F(`${r.id}: keine F6-Aufgabe`);
    }
  }
  for (const [ort, t] of alleTexte({ regeln, faelle, glossar })) {
    for (const m of String(t ?? '').matchAll(/\[\[([^\]]+)\]\]/g)) {
      const key = (m[1].split('|')[1] ?? m[1]).toLowerCase();
      if (!glossarKeys.has(key)) F(`${ort}: Glossar-Begriff „${key}“ fehlt`);
    }
  }
  for (const g of glossar) for (const k of ['erklaerung', 'beispiel']) if (leer(g[k])) F(`Glossar „${g.begriff}“: ${k} fehlt`);
  return fehler;
}

// Alle Texte, die der Spieler liest (ohne Klausurformel und ohne F6-Bausteine aus ANTWORTEN.md)
export function alleTexte({ regeln, faelle, glossar }) {
  const out = [];
  for (const r of regeln) for (const t of [r.titel, r.einSatz, r.warum, r.alltag, r.merktrick, ...(r.erkennen ?? [])]) out.push([r.id, t]);
  for (const f of faelle) {
    const t = [f.akte, f.frage, f.warum, f.ergebnis, ...(f.denkweg ?? []), ...(f.optionen ?? []).flatMap((o) => [o.text, o.warumNicht]),
      ...(f.markierbar ?? []).flatMap((m) => [m.text, m.warumNicht]), ...(f.fachfaecher?.karten ?? []).flatMap((k) => [k.text, k.warum]),
      ...(f.reihenfolge ?? []).map((x) => (typeof x === 'string' ? x : x.text))];
    for (const x of t) if (x) out.push([f.id, x]);
  }
  for (const g of glossar) for (const t of [g.erklaerung, g.beispiel]) out.push([`Glossar ${g.begriff}`, t]);
  return out;
}

// ---------- Lesbarkeit: 1. Wiener Sachtextformel ----------
export const ohneMarkup = (s) => String(s ?? '').replace(/\[\[([^|\]]+)(\|[^\]]+)?\]\]/g, '$1').replace(/\*\*/g, '');
const woerter = (s) => ohneMarkup(s).split(/\s+/).map((w) => w.replace(/[^A-Za-zÄÖÜäöüß-]/g, '')).filter((w) => /[A-Za-zÄÖÜäöüß]/.test(w));
export const wortzahl = (s) => woerter(s).length;
export function silben(wort) {
  const w = wort.toLowerCase().replace(/-/g, ' ');
  const gruppen = w.match(/[aeiouyäöü]+/g) ?? [];
  return Math.max(1, gruppen.length);
}
export function saetze(s) {
  return ohneMarkup(s).split(/(?<=[.!?…])\s+|(?<=:)\s+(?=[A-ZÄÖÜ])|\n+/).map((x) => x.trim()).filter((x) => woerter(x).length);
}
export function wstf(texte) {
  const alle = texte.flatMap(saetze);
  const ws = alle.flatMap(woerter);
  if (!ws.length) return 0;
  const n = ws.length;
  const MS = (100 * ws.filter((w) => silben(w) >= 3).length) / n;
  const SL = n / alle.length;
  const IW = (100 * ws.filter((w) => w.replace(/-/g, '').length > 6).length) / n;
  const ES = (100 * ws.filter((w) => silben(w) === 1).length) / n;
  return 0.1935 * MS + 0.1672 * SL + 0.1297 * IW - 0.0327 * ES - 0.875;
}

export function lesbarkeit({ regeln, faelle, glossar }, { grenze = 8 } = {}) {
  const fehler = [];
  const werte = [];
  const f6 = new Set(faelle.filter((f) => f.format === 'F6').map((f) => f.id));
  const einheit = (ort, texte) => {
    const w = wstf(texte);
    // F6 trainiert die Klausurformel (Fachsprache erlaubt): keine WSTF-Grenze, Satzlänge gilt trotzdem
    if (!f6.has(ort)) {
      werte.push(w);
      if (w > grenze) fehler.push(`${ort}: Wiener Sachtextformel ${w.toFixed(1)} > ${grenze}`);
    }
    for (const s of texte.flatMap(saetze)) if (woerter(s).length > 22) fehler.push(`${ort}: Satz mit ${woerter(s).length} Wörtern: „${s.slice(0, 60)}…“`);
  };
  for (const r of regeln) einheit(r.id, [r.einSatz, r.warum, r.alltag, r.merktrick, ...(r.erkennen ?? [])]);
  const proFall = new Map();
  for (const [ort, t] of alleTexte({ regeln: [], faelle, glossar: [] })) (proFall.get(ort) ?? proFall.set(ort, []).get(ort)).push(t);
  for (const [ort, t] of proFall) einheit(ort, t);
  if (glossar.length) einheit('Glossar', glossar.flatMap((g) => [g.erklaerung, g.beispiel]));
  const mittel = werte.reduce((a, b) => a + b, 0) / (werte.length || 1);
  return { fehler, mittel, max: Math.max(...werte, 0) };
}
