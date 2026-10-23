// Selbsttest-Rundgang mit Screenshots (WebKit, iPhone 14). Aufruf: node tools/rundgang.mjs [ausgabeordner] [tage]
import { webkit, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { antworte } from '../tests/helfer.js';
const out = process.argv[2] ?? 'tests/screenshots';
const tage = +(process.argv[3] ?? 1);
mkdirSync(out, { recursive: true });
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'], viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const fehler = [];
page.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });
page.on('pageerror', (e) => fehler.push(String(e)));
const url = process.env.BASE_URL ?? 'http://localhost:4173/';
const t0 = Date.now();
await page.goto(url);
await page.waitForSelector('[data-start]');
console.log('Startknopf sichtbar nach', Date.now() - t0, 'ms');
let n = 0;
const shot = async (name) => page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${name}.png` });
await shot('buero');
for (let tag = 1; tag <= tage; tag++) {
  await page.click('[data-start]');
  await shot(`t${tag}-morgen`);
  while (await page.$('.morgen button.haupt')) { await page.click('.morgen button.haupt'); if (await page.$('[data-screen="neue-regel"]')) await shot(`t${tag}-regel`); }
  let fall = 0;
  while (await page.$('[data-screen="schalter"]')) {
    fall++;
    await page.waitForTimeout(500);
    if (fall <= 2 || tag === 1) await shot(`t${tag}-fall${fall}`);
    // zufällige Antwort, damit auch Fehler vorkommen
    await antworte(page, Math.random() < 0.8);
    await page.waitForTimeout(400);
    if (fall <= 3 || tag === 1) await shot(`t${tag}-fall${fall}-feedback`);
    await page.click('.feedback [data-weiter]');
    await page.waitForTimeout(250);
  }
  await shot(`t${tag}-feierabend`);
  await page.click('.feierabend button.haupt');
}
await shot('buero-ende');
console.log('Konsolenfehler:', fehler.length ? fehler : 'keine');
await browser.close();
