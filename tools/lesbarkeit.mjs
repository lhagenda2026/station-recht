// Lesbarkeit: 1. Wiener Sachtextformel (WSTF) und Satzlängen. Silben per Vokalgruppen (Näherung für Deutsch).
export const klar = (s = '') => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');

const woerter = (s) => (s.match(/[A-Za-zÄÖÜäöüß]+(?:-[A-Za-zÄÖÜäöüß]+)*/g) ?? []);
export const silben = (w) => Math.max(1, (w.toLowerCase().match(/[aeiouyäöü]+/g) ?? []).length);

export function saetze(text) {
  return klar(text)
    .replace(/\b(z|u|d|o|v|bzw|ca|Nr|Abs|Art|S|ggf|usw|etc|vgl|i|e|a|ff)\.\s?(?=[a-zäöüA-Z0-9])/g, '$1§')   // Abkürzungen nicht als Satzende
    .replace(/(\d)\.\s(?=[A-ZÄÖÜa-z])/g, '$1§ ')                                                                // „3. Februar“, „1. Schritt“
    .split(/(?<=[.!?:])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => woerter(s).length > 0);
}

export function wstf(text) {
  const ss = saetze(text);
  const ws = ss.flatMap(woerter);
  if (ws.length < 10) return null;   // zu kurz für eine sinnvolle Messung
  const n = ws.length;
  const MS = (100 * ws.filter((w) => silben(w) >= 3).length) / n;
  const SL = n / ss.length;
  const IW = (100 * ws.filter((w) => w.replace(/-/g, '').length > 6).length) / n;
  const ES = (100 * ws.filter((w) => silben(w) === 1).length) / n;
  return 0.1935 * MS + 0.1672 * SL + 0.1297 * IW - 0.0327 * ES - 0.875;
}

export const langeSaetze = (text, max = 22) => saetze(text).filter((s) => woerter(s).length > max);
