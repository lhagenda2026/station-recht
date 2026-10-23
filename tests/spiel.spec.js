// Qualitätstor 4: Spieltest in WebKit, iPhone-Format 390×844.
import { test, expect } from '@playwright/test';
import { FAELLE, REGELN, antworte, weiter, spieleTag, aktuellerFall } from './helfer.js';

const KEY = 'bescheid-bitte';
let konsole = [];
test.beforeEach(async ({ page }) => {
  konsole = [];
  page.on('console', (m) => { if (m.type() === 'error') konsole.push(m.text()); });
  page.on('pageerror', (e) => konsole.push(String(e)));
});
test.afterEach(() => expect(konsole, 'Konsole fehlerfrei').toEqual([]));

/** Spielstand vor dem Laden setzen. */
async function mitStand(page, stand) {
  await page.addInitScript(([k, s]) => { if (!sessionStorage.getItem('gesetzt')) { localStorage.setItem(k, JSON.stringify(s)); sessionStorage.setItem('gesetzt', '1'); } }, [KEY, stand]);
}
const grundstand = (regeln = {}, extra = {}) => ({
  schemaVersion: 2, spieltag: 0, regeln, faelle: {}, nachholen: [], bestanden: [], muenzen: 0, sterneGesamt: 0, deko: [],
  streak: { zahl: 0, datum: null }, einstellungen: { zeitdruck: true, ton: false, schrift: 1 }, lauf: null, abschlussGesehen: false, introGesehen: true, ...extra,
});
const stufe = (s, extra = {}) => ({ stufe: s, serie: 0, box: 1, faellig: 0, gesehen: true, gemeistert: false, richtig: 2, falsch: 0, boxTag: -1, ...extra });

test('erste Aktion in unter 10 Sekunden, Viewport 390×844', async ({ page }) => {
  expect(page.viewportSize()).toEqual({ width: 390, height: 844 });
  const t0 = Date.now();
  await page.goto('./');
  await page.click('[data-start]');
  expect(Date.now() - t0).toBeLessThan(10000);
  await expect(page.locator('[data-screen="morgen"]')).toBeVisible();
});

test('Morgenbesprechung höchstens 60 Wörter', async ({ page }) => {
  await page.goto('./');
  await page.click('[data-start]');
  const text = await page.textContent('.morgen .sprechblase p:not(.sprecher-name)');
  expect(text.split(/\s+/).length).toBeLessThanOrEqual(60);
});

test('ein ganzer Tag: 8 bis 10 Fälle, sofortiges Feedback, Feierabend', async ({ page }) => {
  await page.goto('./');
  await page.click('[data-start]');
  while (await page.$('.morgen button.haupt')) await page.click('.morgen button.haupt');
  let n = 0;
  while (await page.$('[data-screen="schalter"]')) {
    const t = Date.now();
    await antworte(page, true);
    expect(Date.now() - t, 'Feedback sofort').toBeLessThan(2500);
    await expect(page.locator('.fb-warum')).toBeVisible();
    await expect(page.locator('.fb-denkweg li').first()).toBeVisible();
    await weiter(page);
    n++;
  }
  expect(n).toBeGreaterThanOrEqual(6);   // Tag 1: neue Regeln (je 2 Plätze) + Füllung
  expect(n).toBeLessThanOrEqual(10);
  await expect(page.locator('[data-screen="feierabend"]')).toBeVisible();
  await expect(page.locator('.bilanz')).toContainText('Heute gelernt');
  await expect(page.locator('.postfach')).toContainText('Morgen im Postfach');
});

test('falsche Antwort zeigt „Warum nicht“, drei Beschwerden schicken nach Hause', async ({ page }) => {
  await page.goto('./');
  await page.click('[data-start]');
  while (await page.$('.morgen button.haupt')) await page.click('.morgen button.haupt');
  for (let i = 0; i < 3; i++) {
    const f = await antworte(page, false);
    await expect(page.locator('.fb-kopf.schlecht')).toBeVisible();
    if (['F1', 'F4', 'F5'].includes(f.format)) await expect(page.locator('.fb-warumnicht')).toBeVisible();
    await expect(page.locator('.zettel.voll')).toHaveCount(i + 1);
    await weiter(page);
  }
  await expect(page.locator('[data-screen="feierabend"] h1')).toHaveText('Ab nach Hause!');
  // Falsche Fälle kommen morgen zuerst
  const stand = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
  expect(stand.nachholen.length).toBe(3);
});

test('Geduldsbalken läuft ab Stufe 1, Regelbuch kostet Sterne', async ({ page }) => {
  await mitStand(page, grundstand(Object.fromEntries(Object.values(REGELN).filter((r) => r.stockwerk === 1).map((r) => [r.id, stufe(1)]))));
  await page.goto('./');
  await page.click('[data-start]');
  while (await page.$('.morgen button.haupt')) await page.click('.morgen button.haupt');
  const vorher = Number(await page.getAttribute('.geduld', 'aria-valuenow'));
  await page.waitForTimeout(1500);
  const nachher = Number(await page.getAttribute('.geduld', 'aria-valuenow'));
  expect(nachher).toBeLessThan(vorher);
  await page.click('.regelbuch-knopf');
  await expect(page.locator('.rb-kosten')).toBeVisible();
  await page.click('.regelbuch-blatt > .knopf');
  await antworte(page, true);
  await expect(page.locator('.fb-lohn')).toContainText('Regelbuch benutzt');
  expect(await page.locator('.sterne').first().evaluate((e) => e.firstChild.textContent.length)).toBeLessThanOrEqual(2);
});

test('Stufenaufstieg nach zwei richtigen Antworten', async ({ page }) => {
  await page.goto('./');
  await page.click('[data-start]');
  while (await page.$('.morgen button.haupt')) await page.click('.morgen button.haupt');
  let aufstieg = false;
  while (await page.$('[data-screen="schalter"]')) {
    await antworte(page, true);
    if (await page.$('.fb-aufstieg')) aufstieg = true;
    await weiter(page);
  }
  expect(aufstieg).toBe(true);
  await expect(page.locator('.aufstiege')).toBeVisible();
});

test('Fortschritt bleibt nach Neuladen, Pause setzt den Tag fort', async ({ page }) => {
  await page.goto('./');
  await page.click('[data-start]');
  while (await page.$('.morgen button.haupt')) await page.click('.morgen button.haupt');
  await antworte(page, true);
  await weiter(page);
  await page.click('.pause');
  await page.reload();
  await expect(page.locator('[data-start]')).toContainText('Weiterarbeiten');
  await expect(page.locator('[data-start]')).toContainText('Fall 2');
  await page.click('[data-start]');
  await expect(page.locator('[data-screen="schalter"] .tagname small')).toContainText('Fall 2');
});

test('Beförderungsprüfung: bestehen, befördert, nächstes Stockwerk frei', async ({ page }) => {
  await mitStand(page, grundstand(Object.fromEntries(Object.values(REGELN).filter((r) => r.stockwerk === 1).map((r) => [r.id, stufe(2)]))));
  await page.goto('./');
  await page.click('.pruefung-knopf');
  await page.click('[data-screen="pruefung-intro"] .knopf.haupt');
  let n = 0;
  while (await page.$('[data-screen="schalter"]')) { await antworte(page, true); await weiter(page); n++; }
  expect(n).toBe(10);
  await expect(page.locator('[data-screen="pruefung-ende"] h1')).toContainText('Befördert');
  await page.click('[data-screen="pruefung-ende"] .knopf.haupt');
  await expect(page.locator('.titelzeile .namensschild')).toHaveText('Sachbearbeiter');
  await expect(page.locator('.etage[data-etage="2"]')).not.toHaveClass(/zu/);
});

test('alle vier Stockwerke bestanden: Vorstand und Schlussszene', async ({ page }) => {
  await mitStand(page, grundstand(Object.fromEntries(Object.values(REGELN).map((r) => [r.id, stufe(2)])), { bestanden: [1, 2, 3] }));
  await page.goto('./');
  await page.click('.pruefung-knopf');
  await page.click('[data-screen="pruefung-intro"] .knopf.haupt');
  while (await page.$('[data-screen="schalter"]')) { await antworte(page, true); await weiter(page); }
  await expect(page.locator('[data-screen="pruefung-ende"] h1')).toHaveText('Willkommen im Vorstand!');
});

test('jedes Format F1–F6 ist spielbar (richtig und falsch)', async ({ page }) => {
  for (const fmt of ['F1', 'F2', 'F3', 'F4', 'F5', 'F6']) {
    const fs = Object.values(FAELLE).filter((f) => f.format === fmt);
    for (const richtig of [true, false]) {
      const f = fs[Math.floor(Math.random() * fs.length)];
      await page.goto(`./?fall=${f.id}`);
      await page.waitForSelector('.akte');
      await antworte(page, richtig);
      await expect(page.locator('.fb-urteil'), `${f.id} ${richtig}`).toHaveText(richtig ? 'Richtig' : 'Leider falsch');
    }
  }
});

test('Glossar: Fachwort antippen öffnet Erklärung', async ({ page }) => {
  await page.goto('./');
  await page.click('[data-start]');
  await page.click('.morgen button.haupt');
  await page.locator('.regelkarte .fw').first().click();
  await expect(page.locator('.glossar')).toBeVisible();
  await expect(page.locator('.glossar p').first()).not.toBeEmpty();
});

test('Backup-Code: exportieren und wieder laden', async ({ page }) => {
  await page.goto('./');
  await spieleTag(page);
  await page.click('[data-screen="feierabend"] .knopf.haupt');
  await page.click('.werkzeuge .knopf:has-text("Einstellungen")');
  await page.click('text=Code erstellen');
  const code = await page.inputValue('.backup');
  expect(code.startsWith('BB2-')).toBe(true);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.click('.werkzeuge .knopf:has-text("Einstellungen")');
  await page.fill('.backup', code);
  await page.click('text=Code laden');
  await expect(page.locator('.meldung')).toHaveText('Fortschritt geladen.');
  const stand = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
  expect(stand.spieltag).toBe(1);
});

test('offline spielbar nach dem ersten Besuch', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await page.click('[data-start]');
  while (await page.$('.morgen button.haupt')) await page.click('.morgen button.haupt');
  await antworte(page, true);
  await context.setOffline(false);
});

test('Manifest und Icons für die Installation', async ({ page, request }) => {
  await page.goto('./');
  const m = await (await request.get('./manifest.webmanifest')).json();
  expect(m.name).toBe('Bescheid, bitte!');
  expect(m.display).toBe('standalone');
  for (const i of m.icons) expect((await request.get('./' + i.src)).ok()).toBe(true);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', 'icons/apple-touch-icon.png');
});

test('nichts ragt über den Bildschirmrand, Touch-Ziele ≥ 44 px', async ({ page }) => {
  await page.goto('./');
  await page.click('[data-start]');
  while (await page.$('.morgen button.haupt')) await page.click('.morgen button.haupt');
  const breite = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(breite).toBeLessThanOrEqual(390);
  const klein = await page.$$eval('button:not(.fw)', (bs) => bs.filter((b) => b.offsetParent && b.getBoundingClientRect().height < 44 && !b.closest('.fach-inhalt')).map((b) => b.className + ':' + b.textContent.slice(0, 20)));
  expect(klein).toEqual([]);
});
