// Testhelfer: aktuellen Fall erkennen und gezielt richtig oder falsch beantworten.
import { readFileSync } from 'node:fs';

export const FAELLE = Object.fromEntries(JSON.parse(readFileSync('data/faelle.json', 'utf8')).map((f) => [f.id, f]));
export const REGELN = Object.fromEntries(JSON.parse(readFileSync('data/regeln.json', 'utf8')).map((r) => [r.id, r]));
const klar = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');

export async function aktuellerFall(page) {
  const id = await page.getAttribute('.akte', 'data-fall');
  return FAELLE[id];
}

/** Beantwortet den offenen Fall. richtig=false wählt eine falsche Antwort. */
export async function antworte(page, richtig = true) {
  const f = await aktuellerFall(page);
  if (['F1', 'F4', 'F5'].includes(f.format)) {
    const i = f.optionen.findIndex((o) => o.richtig === richtig);
    await page.click(`[data-option="${i}"]`);
  } else if (f.format === 'F2') {
    const teile = f.markierbar.map((t, i) => [t, i]).filter(([t]) => typeof t === 'object');
    const ziele = richtig ? teile.filter(([t]) => t.fehler) : [teile.find(([t]) => !t.fehler) ?? teile[0]];
    for (const [, i] of ziele) await page.click(`[data-teil="${i}"]`);
    await page.click('.rotstift');
    if (f.optionen?.length) await page.click(`.fehlerart-wahl [data-option="${f.optionen.findIndex((o) => o.richtig)}"]`);
  } else if (f.format === 'F3' && f.fachfaecher) {
    const { faecher, karten } = f.fachfaecher;
    for (const [i, k] of karten.entries()) {
      const fach = richtig || i > 0 ? k.fach : faecher.find((x) => x !== k.fach);
      await page.click(`[data-karte="${i}"]`);
      await page.click(`.fach[data-fach="${fach}"] .fach-name`);
    }
    await page.click('.sortierablage .knopf.haupt');
  } else if (f.format === 'F3') {
    const n = f.reihenfolge.length;
    const folge = richtig ? [...Array(n).keys()] : [...Array(n).keys()].reverse();
    for (const i of folge) await page.click(`[data-schritt="${i}"]`);
    await page.click('.aktionsreihe .knopf.haupt');
  } else if (f.format === 'F6') {
    const { bausteine } = REGELN[f.regelId].klausur;
    const reihe = richtig ? bausteine : [...bausteine].reverse();
    for (const t of reihe) await page.locator('.baustein', { hasText: klar(t).slice(0, 40) }).first().click();
    await page.click('.aktionsreihe .knopf.haupt');
  }
  await page.waitForSelector('.feedback [data-weiter]', { timeout: 3000 });
  return f;
}

export async function weiter(page) {
  await page.click('.feedback [data-weiter]');
  await page.waitForTimeout(260);
}

/** Spielt einen ganzen Tag ab Büro. strategie(fall, index) → true (richtig) / false. */
export async function spieleTag(page, strategie = () => true) {
  await page.click('[data-start]');
  while (await page.$('.morgen button.haupt')) await page.click('.morgen button.haupt');
  let i = 0;
  while (await page.$('[data-screen="schalter"]')) {
    await page.waitForSelector('.akte');
    const f = await aktuellerFall(page);
    await antworte(page, strategie(f, i++));
    await weiter(page);
  }
  return i;
}
