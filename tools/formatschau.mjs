// Screenshots je Fall-ID (Formate prüfen). Aufruf: node tools/formatschau.mjs f054-4:2 f050-2:2 …
import { webkit, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
const server = spawn('node', ['tools/serve.mjs', '4198'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'], viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('FEHLER', String(e)));
for (const arg of process.argv.slice(2)) {
  const [id, stufe = '2'] = arg.split(':');
  await page.goto(`http://localhost:4198/?fall=${id}&stufe=${stufe}`);
  await page.waitForSelector('.akte');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `tests/screenshots/format-${id}.png`, fullPage: true });
}
await browser.close();
server.kill();
