import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(new URL('../data/cards.json', import.meta.url), 'utf8'));
const alle = (feld) => data.karten.flatMap((k) => k[feld]);
const SHOTS = 'tests/screenshots';

// Konsole muss fehlerfrei bleiben
let fehler;
test.beforeEach(async ({ page }) => {
  fehler = [];
  page.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });
  page.on('pageerror', (e) => fehler.push(e.message));
});
test.afterEach(() => { expect(fehler, 'Konsolenfehler').toEqual([]); });

async function keinUeberlauf(page, name) {
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  expect(sw, `horizontaler Überlauf auf ${name}`).toBeLessThanOrEqual(iw);
  // Kein Element ragt seitlich aus dem Viewport
  const raus = await page.evaluate(() => [...document.querySelectorAll('#app *')]
    .filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1) && !el.closest('.tabelle, .konfetti'); })
    .map((el) => el.className || el.tagName).slice(0, 5));
  expect(raus, `Elemente außerhalb auf ${name}`).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

async function frisch(page) {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('.stationskopf h1')).toHaveText('Station Recht');
}

test('Station, Zimmer und Einstellungen rendern ohne Überlauf', async ({ page }) => {
  await frisch(page);
  await expect(page.locator('.zimmer')).toHaveCount(4);
  await keinUeberlauf(page, '01-station');
  await page.locator('.zimmer').nth(2).click();
  await expect(page.locator('.patient')).toHaveCount(data.karten.filter((k) => k.kapitel === 'verwaltungsrecht').length);
  await keinUeberlauf(page, '02-zimmer');
  await page.goto('./#/karte/q34');
  await page.getByRole('button', { name: 'Antwort aufdecken' }).click();
  await page.getByRole('button', { name: 'Details' }).click();
  await keinUeberlauf(page, '03-karte-q34-tabelle');
  await page.goto('./#/karte/q25');
  await page.getByRole('button', { name: 'Antwort aufdecken' }).click();
  await page.getByRole('button', { name: 'Details' }).click();
  await page.locator('details summary').click();
  await keinUeberlauf(page, '04-karte-q25-beispielfall');
  await page.goto('./#/karte/q54');
  await expect(page.locator('.unverifiziert')).toBeVisible();
  await page.goto('./#/einstellungen');
  await expect(page.locator('.offen-liste li')).toHaveCount(data.karten.filter((k) => !k.verifiziert).length);
  await keinUeberlauf(page, '05-einstellungen');
});

test('Visite: Lernkarten bewerten, Fortschritt übersteht Reload', async ({ page }) => {
  await frisch(page);
  await page.getByRole('link', { name: /Visite starten/ }).click();
  await expect(page.locator('.visite-status')).toHaveText('1/10');
  await keinUeberlauf(page, '06-visite-frage');
  // Karte 1: alle Begriffe getroffen → Sitzt
  await page.getByRole('button', { name: 'Antwort aufdecken' }).click();
  for (const chip of await page.locator('.begriff').all()) await chip.click();
  await keinUeberlauf(page, '07-visite-aufgedeckt');
  await page.getByRole('button', { name: 'Bewerten' }).click();
  await expect(page.locator('.urteil')).toContainText('Sitzt');
  // Restliche 9 Karten: Wackelt / Weg im Wechsel
  for (let i = 2; i <= 10; i++) {
    await expect(page.locator('.visite-status')).toHaveText(`${i}/10`);
    await page.getByRole('button', { name: 'Antwort aufdecken' }).click();
    if (i % 2) { const chips = await page.locator('.begriff').all(); for (const c of chips.slice(0, Math.ceil(chips.length / 2))) await c.click(); }
    await page.getByRole('button', { name: 'Bewerten' }).click();
  }
  await expect(page.locator('.ergebnis h2')).toHaveText('Visite abgeschlossen');
  await keinUeberlauf(page, '08-visite-ergebnis');
  const vorher = await page.evaluate(() => JSON.parse(localStorage.getItem('stationRecht.progress')));
  expect(Object.keys(vorher.karten)).toHaveLength(10);
  expect(vorher.xp).toBeGreaterThan(20);
  await page.reload();
  await page.goto('./#/station');
  await expect(page.locator('.kennzahl .wert').first()).toHaveText(String(vorher.xp));
  const nachher = await page.evaluate(() => JSON.parse(localStorage.getItem('stationRecht.progress')));
  expect(nachher).toEqual(vorher);
  expect(nachher.streak).toBe(1);
  await keinUeberlauf(page, '09-station-nach-visite');
});

test('Triage: eine Runde fehlerfrei spielen', async ({ page }) => {
  await frisch(page);
  const loesung = new Map(alle('triage').map((t) => [t.fall, t.richtig]));
  await page.goto('./#/triage');
  await keinUeberlauf(page, '10-triage-intro');
  await page.getByRole('button', { name: 'Schicht beginnen' }).click();
  for (let n = 0; n < 20; n++) {
    const fall = await page.locator('.fall').textContent();
    if (n === 0) await keinUeberlauf(page, '11-triage-fall');
    await page.locator(`.box[data-box="${loesung.get(fall)}"]`).click();
    await expect(page.locator('.ok-text')).toBeVisible();
    await page.waitForFunction((alt) => document.querySelector('.ergebnis') || document.querySelector('.fall')?.textContent !== alt, fall);
    if (await page.locator('.ergebnis').count()) break;
  }
  await expect(page.locator('.ergebnis h2')).toHaveText('Notaufnahme geräumt');
  await keinUeberlauf(page, '12-triage-ergebnis');
});

test('Triage: Fehler zeigt Begründung und kostet Leben', async ({ page }) => {
  await frisch(page);
  const loesung = new Map(alle('triage').map((t) => [t.fall, t.richtig]));
  await page.goto('./#/triage');
  await page.getByRole('button', { name: 'Schicht beginnen' }).click();
  for (let leben = 3; leben > 0; leben--) {
    const fall = await page.locator('.fall').textContent();
    await page.locator(`.box:not([data-box="${loesung.get(fall)}"])`).first().click();
    await expect(page.locator('.fehl-text')).toBeVisible();
    if (leben === 3) await keinUeberlauf(page, '13-triage-fehler');
    await expect(page.locator('.herz.voll')).toHaveCount(leben - 1);
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  }
  await expect(page.locator('.ergebnis h2')).toContainText('Schichtende');
});

test('Zwei Wahrheiten, eine Lüge: 10 Runden', async ({ page }) => {
  await frisch(page);
  const luege = new Map(alle('luegen').map((l) => [l.aussagen[0], l.luege]));
  await page.goto('./#/luege');
  await page.getByRole('button', { name: 'Los geht’s' }).click();
  for (let r = 1; r <= 10; r++) {
    await expect(page.locator('.fortschritt')).toHaveText(`Runde ${r} von 10`);
    const erste = await page.locator('.aussage .satz').first().textContent();
    if (r === 1) await keinUeberlauf(page, '14-luege-frage');
    await page.locator('.aussage').nth(luege.get(erste)).click();
    await expect(page.locator('.ok-text')).toBeVisible();
    if (r === 1) await keinUeberlauf(page, '15-luege-aufloesung');
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  }
  await expect(page.locator('.ergebnis-zeilen')).toContainText('10 von 10');
});

test('Fristen-Bombe: 10 Bomben, eine mit Fehlschnitt', async ({ page }) => {
  await frisch(page);
  const richtig = new Map(alle('fristen').map((f) => [f.szenario, f.richtig]));
  await page.goto('./#/bombe');
  await page.getByRole('button', { name: 'Erste Bombe' }).click();
  for (let b = 1; b <= 10; b++) {
    await expect(page.locator('.fortschritt')).toHaveText(`Bombe ${b} von 10`);
    const sz = await page.locator('.szenario').textContent();
    const idx = richtig.get(sz);
    if (b === 1) {
      await keinUeberlauf(page, '16-bombe');
      await page.locator('.draht').nth((idx + 1) % 3).click(); // falsches Kabel
      await expect(page.locator('.draht.falsch')).toHaveCount(1);
    }
    await page.locator('.draht').nth(idx).click();
    await expect(page.locator('.ok-text')).toBeVisible();
    if (b === 1) await keinUeberlauf(page, '17-bombe-entschaerft');
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  }
  await expect(page.locator('.ergebnis-zeilen')).toContainText('10 von 10');
});

test('Fristen-Bombe: Zündschnur brennt ab', async ({ page }) => {
  await frisch(page);
  await page.clock.install();
  await page.goto('./#/bombe');
  await page.getByRole('button', { name: 'Erste Bombe' }).click();
  await page.clock.runFor(26000);
  await expect(page.locator('.fehl-text')).toContainText('Bumm');
});

test('Schema-OP: fünf Schemata ordnen', async ({ page }) => {
  await frisch(page);
  const schemata = new Map(data.karten.filter((k) => k.reihenfolge).map((k) => [k.reihenfolge.titel, k.reihenfolge.schritte]));
  await page.goto('./#/schema');
  for (let s = 0; s < 5; s++) {
    const titel = await page.locator('.schema-titel').textContent();
    for (const schritt of schemata.get(titel)) await page.locator('.block', { hasText: schritt }).filter({ hasText: new RegExp(`^${schritt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first().click();
    await expect(page.locator('.ok-text')).toBeVisible();
    if (s === 0) await keinUeberlauf(page, '18-schema');
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  }
  await expect(page.locator('.ergebnis h2')).toHaveText('OP beendet');
});

test('Oberarzt-Visite: gesperrt, nach Fortschritt frei und spielbar', async ({ page }) => {
  await frisch(page);
  await page.goto('./#/zimmer/sozialprozessrecht');
  await expect(page.getByRole('button', { name: 'Gesperrt' })).toBeDisabled();
  // Fortschritt: alle Karten des Kapitels in Box 3
  await page.evaluate((ids) => {
    const karten = Object.fromEntries(ids.map((id) => [id, { box: 3, faellig: Date.now() + 5 * 864e5, gesehen: 3, letzte: Date.now(), letzterAufstieg: null }]));
    localStorage.setItem('stationRecht.progress', JSON.stringify({ schemaVersion: 1, karten, xp: 0, streak: 0, letzterTag: null }));
  }, data.karten.filter((k) => k.kapitel === 'sozialprozessrecht').map((k) => k.id));
  await page.reload();
  await expect(page.locator('.boss.frei')).toBeVisible();
  await keinUeberlauf(page, '19-zimmer-boss-frei');
  await page.getByRole('button', { name: 'Starten' }).click();
  const triage = new Map(alle('triage').map((t) => [t.fall, t.richtig]));
  const luege = new Map(alle('luegen').map((l) => [l.aussagen[0], l.luege]));
  const frist = new Map(alle('fristen').map((f) => [f.szenario, f.richtig]));
  for (let i = 1; i <= 10; i++) {
    await expect(page.locator('.fortschritt')).toContainText(`Frage ${i} von 10`);
    if (await page.locator('.fall').count()) {
      const fall = await page.locator('.fall').textContent();
      await page.locator(`.box[data-box="${triage.get(fall)}"]`).click();
      await page.waitForFunction((alt) => document.querySelector('.ergebnis') || document.querySelector('.fortschritt')?.textContent !== alt, await page.locator('.fortschritt').textContent());
      continue;
    }
    if (await page.locator('.aussage').count()) {
      await page.locator('.aussage').nth(luege.get(await page.locator('.aussage .satz').first().textContent())).click();
    } else {
      await page.locator('.draht').nth(frist.get(await page.locator('.szenario').textContent())).click();
    }
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  }
  await expect(page.locator('.ergebnis h2')).toHaveText('Oberarzt-Visite bestanden');
  await keinUeberlauf(page, '20-boss-bestanden');
});

test('Backup-Code: exportieren, zurücksetzen, wiederherstellen', async ({ page }) => {
  await frisch(page);
  await page.goto('./#/karte/q1');
  await page.getByRole('button', { name: 'Antwort aufdecken' }).click();
  for (const c of await page.locator('.begriff').all()) await c.click();
  await page.getByRole('button', { name: 'Bewerten' }).click();
  await page.goto('./#/einstellungen');
  const code = await page.locator('textarea[readonly]').inputValue();
  expect(code.startsWith('SR1.')).toBe(true);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Fortschritt löschen' }).click();
  await expect(page.locator('.stationskopf')).toBeVisible();
  expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('stationRecht.progress')).karten).length)).toBe(0);
  await page.goto('./#/einstellungen');
  await page.locator('textarea:not([readonly])').fill('Quatsch');
  await page.getByRole('button', { name: 'Fortschritt wiederherstellen' }).click();
  await expect(page.locator('.meldung')).toContainText('kein Backup-Code');
  await page.locator('textarea:not([readonly])').fill(code);
  await page.getByRole('button', { name: 'Fortschritt wiederherstellen' }).click();
  await expect(page.locator('.meldung')).toHaveText('Fortschritt wiederhergestellt.');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('stationRecht.progress')).karten.q1.box)).toBe(1);
});

test('Offline: nach erstem Laden ohne Netz voll nutzbar', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.zimmer')).toHaveCount(4);
  await page.goto('./#/bombe');
  await page.getByRole('button', { name: 'Erste Bombe' }).click();
  await expect(page.locator('.draht')).toHaveCount(3);
  await page.goto('./#/karte/q57');
  await expect(page.locator('.frage')).toContainText('Raucher');
  const icon = await page.evaluate(async () => (await fetch('icons/icon-512.png')).status);
  expect(icon).toBe(200);
  await context.setOffline(false);
});

test('PWA-Grundlagen: Manifest, Icons, iOS-Meta', async ({ page, request }) => {
  await page.goto('./');
  const m = await (await request.get('manifest.webmanifest')).json();
  expect(m.display).toBe('standalone');
  expect(m.name).toBe('Station Recht');
  for (const i of m.icons) expect((await request.get(i.src)).status()).toBe(200);
  expect(await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content')).toBe('yes');
  expect(await page.locator('meta[name="viewport"]').getAttribute('content')).toContain('viewport-fit=cover');
  expect((await request.get('icons/apple-touch-icon.png')).status()).toBe(200);
});
