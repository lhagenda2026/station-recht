// Einstellungen: Zeitdruck, Textgröße, Wörterbuch, Backup-Code, Zurücksetzen.
import { el, zeige, glossarFenster } from '../ui.js';
import { getState, einstellung, backupCode, backupEinlesen, zuruecksetzen } from '../store.js';
import { getDaten } from '../tag.js';

export function wendeTextgroesseAn() {
  document.documentElement.style.setProperty('--text-faktor', String(getState().einstellungen.textgroesse));
}

export function einstellungen({ zurueck }) {
  const s = getState();
  const meldung = el('p', { class: 'einst__meldung', role: 'status' });

  const zeitdruck = el('input', { type: 'checkbox', role: 'switch', id: 'e-zeit', checked: s.einstellungen.zeitdruck });
  zeitdruck.addEventListener('change', () => einstellung('zeitdruck', zeitdruck.checked));

  const groessen = [[0.9, 'Klein'], [1, 'Normal'], [1.15, 'Groß'], [1.3, 'Sehr groß']];
  const groesse = el('div', { class: 'segmente', role: 'group', 'aria-label': 'Textgröße' },
    groessen.map(([f, name]) => el('button', {
      type: 'button', class: 'segment', 'aria-pressed': String(s.einstellungen.textgroesse === f),
      onclick: (e) => {
        einstellung('textgroesse', f);
        wendeTextgroesseAn();
        for (const b of e.currentTarget.parentElement.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
      },
    }, name)));

  const code = el('textarea', { class: 'einst__code', rows: 4, 'aria-label': 'Backup-Code', spellcheck: 'false' });
  const woerter = el('ul', { class: 'woerter' },
    [...getDaten().glossar].sort((a, b) => a.begriff.localeCompare(b.begriff, 'de'))
      .map((g) => el('li', {}, el('button', { type: 'button', class: 'begriff', onclick: () => glossarFenster(g) }, g.begriff))));

  zeige(el('div', { class: 'szene szene--einst' },
    el('h2', { class: 'szene__titel' }, 'Einstellungen'),
    el('label', { class: 'einst__zeile', for: 'e-zeit' },
      el('span', {}, el('strong', {}, 'Zeitdruck'), el('small', {}, 'Aus: Der Geduldsbalken bleibt stehen. Gut zum Lesen in Ruhe.')),
      zeitdruck),
    el('div', { class: 'einst__block' }, el('strong', {}, 'Textgröße'), groesse),
    el('details', { class: 'einst__block' }, el('summary', {}, `Wörterbuch (${getDaten().glossar.length} Begriffe)`), woerter),
    el('div', { class: 'einst__block' },
      el('strong', {}, 'Backup-Code'),
      el('small', {}, 'Kopiere den Code und bewahre ihn auf. Mit ihm holst du deinen Stand auf ein anderes Gerät.'),
      code,
      el('div', { class: 'einst__knoepfe' },
        el('button', { type: 'button', class: 'knopf', onclick: async () => {
          code.value = backupCode();
          code.select();
          try { await navigator.clipboard.writeText(code.value); meldung.textContent = 'Code erstellt und kopiert.'; } catch { meldung.textContent = 'Code erstellt. Bitte markieren und kopieren.'; }
        } }, 'Code erstellen'),
        el('button', { type: 'button', class: 'knopf', onclick: () => {
          try { backupEinlesen(code.value); meldung.textContent = 'Stand übernommen.'; } catch { meldung.textContent = 'Der Code passt nicht. Bitte ganz kopieren, er beginnt mit „BB2-“.'; }
        } }, 'Code einlesen'),
      ),
      meldung,
    ),
    el('div', { class: 'einst__block' },
      el('button', { type: 'button', class: 'knopf knopf--gefahr', onclick: (e) => {
        if (e.currentTarget.dataset.sicher) { zuruecksetzen(); wendeTextgroesseAn(); zurueck(); return; }
        e.currentTarget.dataset.sicher = '1';
        e.currentTarget.textContent = 'Wirklich alles löschen? Nochmal tippen';
      } }, 'Fortschritt löschen'),
    ),
    el('footer', { class: 'daumen' }, el('button', { type: 'button', class: 'knopf knopf--haupt', onclick: zurueck }, 'Zurück ins Büro')),
  ));
}
