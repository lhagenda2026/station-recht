// Qualitätstor 4: Spieltest im iPhone-Format (WebKit, 390×844).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const faelle = JSON.parse(readFileSync(new URL('../data/faelle.json', import.meta.url)));
const regeln = JSON.parse(readFileSync(new URL('../data/regeln.json', import.meta.url)));
const fallNach = Object.fromEntries(faelle.map((f) => [f.id, f]));
const regelNach = Object.fromEntries(regeln.map((r) => [r.id, r]));
const KEY = 'bescheidBitte.stand';

test.use({ viewport: { width: 390, height: 844 } });

let konsole;
test.beforeEach(async ({ page }) => {
  konsole = [];
  page.on('pageerror', (e) => konsole.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') konsole.push(m.text()); });
});
test.afterEach(() => expect(konsole, 'Konsole fehlerfrei').toEqual([]));

const ohne = (s) => String(s).replace(/\[\[([^|\]]+)(\|[^\]]+)?\]\]/g, '$1').replace(/\*\*/g, '');

// Löst den gerade angezeigten Fall richtig (oder absichtlich falsch)
async function loese(page, { falsch = false } = {}) {
  const id = (await page.locator('.akte__kopf span').first().textContent()).replace('Akte ', '').toLowerCase();
  const f = fallNach[id];
  const t0 = Date.now();
  if (['F1', 'F4', 'F5'].includes(f.format)) {
    const i = f.optionen.findIndex((o) => o.richtig !== falsch);
    await page.locator(`[data-option="${i}"]`).click();
  } else if (f.format === 'F2') {
    const ziel = f.markierbar.find((m) => (falsch ? m.tappbar !== false && !m.ziel : m.ziel));
    await page.locator('.brief__stelle', { hasText: ohne(ziel.text).trim().slice(0, 25) }).first().click();
    if (!falsch && f.optionen?.length) await page.locator('.wahl__knopf', { hasText: ohne(f.optionen.find((o) => o.richtig).text).slice(0, 25) }).click();
  } else if (f.format === 'F3' && f.fachfaecher) {
    for (const k of f.fachfaecher.karten) {
      await page.locator('.sortier__stapel .sortkarte', { hasText: ohne(k.text) }).first().click();
      const fach = falsch ? f.fachfaecher.faecher.find((x) => x !== k.fach) : k.fach;
      await page.locator('.fach__kopf', { hasText: fach }).click();
    }
    await page.getByRole('button', { name: 'Fertig sortiert' }).click();
  } else if (f.format === 'F3') {
    const reihe = f.reihenfolge.map((r) => (typeof r === 'string' ? r : r.text));
    for (const r of falsch ? [...reihe].reverse() : reihe) await page.locator('.reihe__vorrat .sortkarte', { hasText: ohne(r) }).first().click();
    await page.getByRole('button', { name: 'Reihenfolge abgeben' }).click();
  } else if (f.format === 'F6') {
    const r = regelNach[f.regelId];
    const bausteine = f.bausteine ?? r.klausur.bausteine;
    const liste = falsch ? [...bausteine].reverse() : bausteine;
    for (const b of liste) await page.locator('.baustein__vorrat .baustein', { hasText: ohne(b).slice(0, 40) }).first().click();
    await page.getByRole('button', { name: 'Frau Brandt vortragen' }).click();
  }
  // Sofortiges Feedback nach jeder Entscheidung
  await expect(page.locator('.feedback')).toBeVisible({ timeout: 1500 });
  expect(Date.now() - t0).toBeLessThan(6000);
  return f;
}

async function weiter(page) {
  await page.locator('[data-weiter]').click();
}

test('erste Aktion schnell, Morgenbesprechung kurz, ganzer Tag spielbar', async ({ page }) => {
  const t0 = Date.now();
  await page.goto('/');
  const start = page.getByRole('button', { name: /Arbeitstag|Schicht/ });
  await expect(start).toBeVisible();
  expect(Date.now() - t0).toBeLessThan(10000);
  await start.click();
  const morgenText = await page.locator('.morgen__buehne').innerText();
  expect(morgenText.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(60);
  while (await page.locator('.morgen__weiter').count()) await page.locator('.morgen__weiter').click();
  let n = 0;
  while (await page.locator('.akte').count()) {
    await loese(page);
    n += 1;
    await weiter(page);
    await page.waitForTimeout(50);
  }
  await expect(page.locator('.szene--feierabend')).toBeVisible();
  expect(n).toBeGreaterThanOrEqual(8);
  expect(n).toBeLessThanOrEqual(10);
  await expect(page.locator('.bilanz')).toContainText('Serie');
  await expect(page.locator('.gelernt')).toContainText('Heute gelernt');
  // Fortschritt nach Neuladen
  await page.reload();
  await expect(page.locator('.buero__stand')).toContainText(/[1-9]\d* von 58|[1-9]\d* von \d+/);
  await expect(page.getByRole('button', { name: 'Schicht beginnen' })).toBeVisible();
});

test('jedes Format spielbar (richtig und falsch) mit Warum, Denkweg und Warum-nicht', async ({ page }) => {
  for (const format of ['F1', 'F2', 'F3', 'F4', 'F5', 'F6']) {
    const kandidaten = faelle.filter((f) => f.format === format);
    expect(kandidaten.length, format).toBeGreaterThan(0);
    for (const falsch of [false, true]) {
      const f = kandidaten[falsch ? kandidaten.length - 1 : 0];
      await page.goto(`/?fall=${f.id}&stufe=${f.stufe}`);
      await page.waitForSelector('.akte');
      await loese(page, { falsch });
      const fb = page.locator('.feedback');
      await expect(fb).toContainText(falsch ? 'falsch' : 'Richtig');
      await expect(fb).toContainText('Warum?');
      await expect(fb.locator('.denkweg li')).toHaveCount(f.denkweg.length);
      if (falsch && ['F1', 'F4', 'F5'].includes(format)) await expect(fb).toContainText('Warum nicht');
    }
  }
});

test('Glossar-Begriff antippbar', async ({ page }) => {
  const f = faelle.find((x) => x.stufe === 0 && /\[\[/.test(x.akte));
  await page.goto(`/?fall=${f.id}&stufe=0`);
  await page.locator('.akte .begriff').first().click();
  await expect(page.locator('.glossar__satz')).toBeVisible();
});

test('Geduld läuft ab: Kunde geht, Beschwerde', async ({ page }) => {
  await page.clock.install();
  const f = faelle.find((x) => x.stufe === 2 && x.format === 'F1');
  await page.goto(`/?fall=${f.id}&stufe=2`);
  await page.waitForSelector('.akte');
  const vorher = Number(await page.locator('.geduld').getAttribute('aria-valuenow'));
  await page.clock.runFor(5000);
  const nachher = Number(await page.locator('.geduld').getAttribute('aria-valuenow'));
  expect(nachher).toBeLessThan(vorher);
  await page.clock.runFor(60000);
  await expect(page.locator('.feedback')).toContainText('Zu langsam');
  await expect(page.locator('.zettel--voll')).toHaveCount(1);
});

test('Regelbuch kostet: höchstens 2 Sterne', async ({ page }) => {
  const f = faelle.find((x) => x.stufe === 2 && x.format === 'F1');
  await page.goto(`/?fall=${f.id}&stufe=2`);
  await page.waitForSelector('.akte');
  await page.locator('.schublade').click();
  await expect(page.locator('.buch')).toBeVisible();
  await page.locator('.blatt__zu').click();
  await loese(page);
  const lohn = await page.locator('.feedback__lohn').innerText();
  expect((lohn.match(/⭐/g) ?? []).length).toBeLessThanOrEqual(2);
});

test('drei Beschwerden: früher Feierabend, Fehler kommen morgen zuerst', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Arbeitstag|Schicht/ }).click();
  while (await page.locator('.morgen__weiter').count()) await page.locator('.morgen__weiter').click();
  for (let i = 0; i < 3; i++) {
    await loese(page, { falsch: true });
    await weiter(page);
  }
  await expect(page.locator('.szene--feierabend')).toContainText('Ab nach Hause');
  const stand = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
  expect(stand.nachholen.length).toBe(3);
});

test('Stufenaufstieg nach zwei richtigen Antworten', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Arbeitstag|Schicht/ }).click();
  while (await page.locator('.morgen__weiter').count()) await page.locator('.morgen__weiter').click();
  let aufstieg = false;
  for (let i = 0; i < 6 && !aufstieg; i++) {
    await loese(page);
    aufstieg = (await page.locator('.feedback__stufe').count()) > 0;
    await weiter(page);
  }
  expect(aufstieg).toBe(true);
});

test('Beförderungsprüfung bestehen: Titel und nächstes Stockwerk', async ({ page }) => {
  await page.goto('/');
  // Stand vorbereiten: alle Regeln im Erdgeschoss auf Stufe 2
  await page.evaluate(({ k, ids }) => {
    const s = JSON.parse(localStorage.getItem(k)) ?? {};
    const regeln = Object.fromEntries(ids.map((id) => [id, { stufe: 2, serie: 0, box: 2, faellig: Date.now() + 9e8, gesehen: 3, richtig: 3, letzte: 1 }]));
    localStorage.setItem(k, JSON.stringify({ ...s, schemaVersion: 2, regeln, stockwerk: 1, bestanden: [], deko: [], einstellungen: { zeitdruck: false, textgroesse: 1 }, nachholen: [], faelle: {}, muenzen: 0, tage: 1, serie: 1 }));
  }, { k: KEY, ids: regeln.filter((r) => r.stockwerk === 1).map((r) => r.id) });
  await page.reload();
  await page.locator('.aufzug__knopf--bereit').click();
  await page.getByRole('button', { name: /Prüfung starten/ }).click();
  await page.locator('.morgen__weiter').click();
  for (let i = 0; i < 10; i++) {
    await loese(page);
    await weiter(page);
  }
  await expect(page.locator('.szene--feierabend')).toContainText('Befördert');
  await page.getByRole('button', { name: 'Zurück ins Büro' }).click();
  await expect(page.locator('.schreibtisch__schild')).toHaveText('Sachbearbeiter');
});

test('Pause hält den Tag offen und setzt ihn nach Neuladen fort', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Arbeitstag|Schicht/ }).click();
  while (await page.locator('.morgen__weiter').count()) await page.locator('.morgen__weiter').click();
  await loese(page);
  await weiter(page);
  await page.locator('.hud__pause').click();
  await page.getByRole('button', { name: 'Zurück ins Büro' }).click();
  await page.reload();
  await page.getByRole('button', { name: /Schicht fortsetzen \(Fall 2\)/ }).click();
  await expect(page.locator('.hud__fall')).toHaveText(/Fall 2\//);
});

test('Backup-Code exportieren und einlesen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Einstellungen/ }).click();
  await page.getByRole('button', { name: 'Code erstellen' }).click();
  const code = await page.locator('.einst__code').inputValue();
  expect(code.startsWith('BB2-')).toBe(true);
  await page.getByRole('button', { name: 'Code einlesen' }).click();
  await expect(page.locator('.einst__meldung')).toHaveText('Stand übernommen.');
});

test('offline nutzbar und installierbar', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.name).toBe('Bescheid, bitte!');
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: /Arbeitstag|Schicht/ })).toBeVisible();
  await context.setOffline(false);
});

test('nichts außerhalb des sichtbaren Bereichs, Touch-Ziele ≥ 44 px', async ({ page }) => {
  const f = faelle.find((x) => x.format === 'F1' && x.stufe === 2);
  await page.goto(`/?fall=${f.id}&stufe=2`);
  await page.waitForSelector('.akte');
  const zuKlein = await page.$$eval('button', (bs) => bs.filter((b) => {
    const r = b.getBoundingClientRect();
    return r.width && !b.classList.contains('begriff') && !b.classList.contains('brief__stelle') && (r.height < 44 || r.width < 44);
  }).map((b) => b.className));
  expect(zuKlein).toEqual([]);
  const breite = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(breite).toBeLessThanOrEqual(390);
});

test('Tageslänge: Lesezeit eines Tages etwa 3 bis 4 Minuten', async () => {
  // Schätzung: 9 Fälle, je Akte+Frage+Optionen und Feedback lesen (200 Wörter/Minute) + 5 s Entscheidung
  const worte = (s) => ohne(s ?? '').split(/\s+/).filter(Boolean).length;
  const proFall = faelle.filter((f) => f.stufe <= 2).map((f) =>
    (worte(f.akte) + worte(f.frage) + (f.optionen ?? []).reduce((a, o) => a + worte(o.text), 0) + worte(f.ergebnis) + worte(f.warum) + f.denkweg.reduce((a, d) => a + worte(d), 0)) / 200 * 60 + 5);
  const mittel = proFall.reduce((a, b) => a + b, 0) / proFall.length;
  const tag = mittel * 9;
  console.log(`geschätzte Tageslänge: ${(tag / 60).toFixed(1)} min`);
  expect(tag).toBeGreaterThan(150);
  expect(tag).toBeLessThan(300);
});
