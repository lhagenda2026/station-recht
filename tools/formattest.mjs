// Spielt je einen Fall pro Format (F1–F6) richtig durch und macht Screenshots. Aufruf: node tools/formattest.mjs [ordner]
import { webkit, devices } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
const out = process.argv[2] ?? 'tests/screenshots/formate';
mkdirSync(out, { recursive: true });
const faelle = JSON.parse(readFileSync('data/faelle.json', 'utf8'));
const regeln = Object.fromEntries(JSON.parse(readFileSync('data/regeln.json', 'utf8')).map((r) => [r.id, r]));
const wahl = (fmt, pred = () => true) => faelle.find((f) => f.format === fmt && pred(f));
const auswahl = [wahl('F1', (f) => f.optionen.every((o) => o.text.split(' ').length <= 4)), wahl('F1', (f) => f.optionen.some((o) => o.text.split(' ').length > 4)),
  wahl('F2', (f) => !f.optionen), wahl('F2', (f) => f.optionen), wahl('F3', (f) => f.fachfaecher), wahl('F3', (f) => f.reihenfolge), wahl('F4'), wahl('F5'), wahl('F6')].filter(Boolean);
const browser = await webkit.launch();
const fehler = [];
for (const f of auswahl) {
  const page = await browser.newPage({ ...devices['iPhone 14'] });
  page.on('pageerror', (e) => fehler.push(`${f.id}: ${e}`));
  page.on('console', (m) => { if (m.type() === 'error') fehler.push(`${f.id}: ${m.text()}`); });
  await page.goto(`http://localhost:4173/?fall=${f.id}`);
  await page.waitForSelector('.akte');
  const name = `${f.format}-${f.id}`;
  await page.screenshot({ path: `${out}/${name}-a.png` });
  // richtige Antwort geben
  if (f.format === 'F1' || f.format === 'F4' || f.format === 'F5') {
    const i = f.optionen.findIndex((o) => o.richtig);
    await page.click(`[data-option="${i}"]`);
  } else if (f.format === 'F2') {
    for (const [i, t] of f.markierbar.entries()) if (typeof t === 'object' && t.fehler) await page.click(`[data-teil="${i}"]`);
    await page.click('.rotstift');
    if (f.optionen) { await page.waitForTimeout(200); await page.screenshot({ path: `${out}/${name}-b.png` }); await page.click(`[data-option="${f.optionen.findIndex((o) => o.richtig)}"]`); }
  } else if (f.format === 'F3' && f.fachfaecher) {
    for (const [i, k] of f.fachfaecher.karten.entries()) { await page.click(`[data-karte="${i}"]`); await page.click(`.fach[data-fach="${k.fach}"] .fach-name`); }
    await page.screenshot({ path: `${out}/${name}-b.png` });
    await page.click('.sortierablage .knopf.haupt');
  } else if (f.format === 'F3') {
    for (let i = 0; i < f.reihenfolge.length; i++) await page.click(`[data-schritt="${i}"]`);
    await page.click('.aktionsreihe .knopf.haupt');
  } else if (f.format === 'F6') {
    for (const t of regeln[f.regelId].klausur.bausteine) await page.locator('.baustein', { hasText: t.replace(/\*\*/g, '').slice(0, 30) }).first().click();
    await page.screenshot({ path: `${out}/${name}-b.png` });
    await page.click('.aktionsreihe .knopf.haupt');
  }
  await page.waitForSelector('.feedback [data-weiter]');
  await page.waitForTimeout(350);
  const urteil = await page.textContent('.fb-urteil');
  console.log(f.format, f.id, urteil);
  if (urteil !== 'Richtig') fehler.push(`${f.id}: richtige Antwort als falsch gewertet`);
  await page.screenshot({ path: `${out}/${name}-c.png` });
  await page.close();
}
console.log('Fehler:', fehler.length ? fehler : 'keine');
await browser.close();
process.exit(fehler.length ? 1 : 0);
