// Selbsttest (Qualitätstor 5): spielt im iPhone-Format und macht Screenshots. Aufruf: node tools/selbsttest.mjs [name]
import { webkit, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
const name = process.argv[2] ?? 'durchlauf';
const server = spawn('node', ['tools/serve.mjs', '4199'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'], viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
const fehler = [];
page.on('pageerror', (e) => fehler.push(String(e)));
page.on('console', (m) => m.type() === 'error' && fehler.push(m.text()));
const shot = (n) => page.screenshot({ path: `tests/screenshots/${name}-${n}.png` });
const t0 = Date.now();
await page.goto('http://localhost:4199/');
await page.getByRole('button', { name: /Arbeitstag|Schicht/ }).click();
console.log('erste Aktion nach', Date.now() - t0, 'ms');
await shot('1-morgen');
await page.locator('.morgen__weiter').click();
await shot('2-regel');
while (await page.locator('.morgen__weiter').count()) await page.locator('.morgen__weiter').click();
await page.waitForSelector('.akte');
await shot('3-schalter');
let n = 0;
while (await page.locator('.akte').count() && n < 12) {
  const stempel = page.locator('.stempel');
  await stempel.nth(n % 3 === 2 ? 1 : 0).click();
  await page.waitForSelector('.feedback');
  if (n === 0) await shot('4-feedback');
  if (n === 2) await shot('5-feedback-falsch');
  await page.locator('[data-weiter]').click();
  n++;
  await page.waitForTimeout(200);
  if (await page.locator('.szene--feierabend').count()) break;
}
await shot('6-feierabend');
console.log('Fälle gespielt:', n, 'Fehler:', fehler.length ? fehler : 'keine');
await browser.close();
server.kill();
