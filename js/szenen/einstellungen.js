// Einstellungen: Zeitdruck, Ton, Textgröße, Glossar, Backup-Code, Neustart.
import { h, txt } from '../ui.js';
import { S, save, exportCode, importCode, reset } from '../store.js';
import { D } from '../daten.js';

export function einstellungen(app, nav) {
  const meldung = h('p', { class: 'meldung', role: 'status' });
  const code = h('textarea', { class: 'backup', rows: 4, 'aria-label': 'Backup-Code', spellcheck: 'false', autocapitalize: 'off' });

  const schalterZeile = (label, hinweis, key) => h('label', { class: 'zeile' },
    h('span', {}, label, h('small', {}, hinweis)),
    h('input', { type: 'checkbox', class: 'kippschalter', checked: S.einstellungen[key] || null,
      onChange: (e) => { S.einstellungen[key] = e.target.checked; save(); } }));

  app.replaceChildren(h('div', { class: 'einstellungen', 'data-screen': 'einstellungen' },
    h('header', { class: 'seiten-kopf' },
      h('button', { class: 'knopf leise klein', type: 'button', onClick: () => nav.buero() }, 'Zurück ins Büro'),
      h('h1', {}, 'Einstellungen')),
    h('section', { class: 'gruppe' },
      schalterZeile('Zeitdruck', 'Aus: Der Geduldsbalken bleibt stehen. Gut zum ruhigen Lesen.', 'zeitdruck'),
      schalterZeile('Ton', 'Kurze Klänge beim Stempeln und bei Münzen.', 'ton'),
      h('div', { class: 'zeile' }, h('span', {}, 'Textgröße'),
        h('div', { class: 'segment', role: 'group', 'aria-label': 'Textgröße' },
          [[1, 'Normal'], [1.15, 'Groß'], [1.3, 'Sehr groß']].map(([wert, name]) => h('button', {
            type: 'button', class: S.einstellungen.schrift === wert ? 'aktiv' : '', 'aria-pressed': String(S.einstellungen.schrift === wert),
            onClick: () => { S.einstellungen.schrift = wert; save(); nav.schrift(); einstellungen(app, nav); },
          }, name))))),
    h('section', { class: 'gruppe' },
      h('h2', {}, 'Glossar'),
      h('p', { class: 'klein' }, `${D.glossar.length} Fachwörter, kurz erklärt. Im Spiel kannst du jedes gepunktet unterstrichene Wort antippen.`),
      h('details', { class: 'glossar-liste' }, h('summary', {}, 'Alle Fachwörter anzeigen'),
        h('dl', {}, D.glossar.slice().sort((a, b) => a.begriff.localeCompare(b.begriff, 'de')).map((g) => h('div', {},
          h('dt', {}, g.begriff), h('dd', {}, txt(g.erklaerung), g.beispiel && h('span', { class: 'glossar-bsp' }, ' Beispiel: ', txt(g.beispiel)))))))),
    h('section', { class: 'gruppe' },
      h('h2', {}, 'Backup-Code'),
      h('p', { class: 'klein' }, 'Kopiere den Code und bewahre ihn auf, zum Beispiel in einer Notiz. Mit dem Code holst du deinen Fortschritt zurück.'),
      code,
      h('div', { class: 'knopf-reihe' },
        h('button', { class: 'knopf klein', type: 'button', onClick: async () => {
          code.value = exportCode();
          try { await navigator.clipboard.writeText(code.value); meldung.textContent = 'Code erstellt und kopiert.'; } catch { meldung.textContent = 'Code erstellt. Bitte selbst kopieren.'; code.select(); }
        } }, 'Code erstellen'),
        h('button', { class: 'knopf klein leise', type: 'button', onClick: () => {
          try { importCode(code.value); meldung.textContent = 'Fortschritt geladen.'; } catch { meldung.textContent = 'Der Code passt nicht. Prüfe, ob er vollständig ist.'; }
        } }, 'Code laden')),
      meldung),
    h('section', { class: 'gruppe' },
      h('h2', {}, 'Neu anfangen'),
      h('p', { class: 'klein' }, 'Löscht deinen ganzen Fortschritt auf diesem Gerät.'),
      h('button', { class: 'knopf klein gefahr', type: 'button', onClick: () => {
        if (confirm('Wirklich den ganzen Fortschritt löschen?')) { reset(); nav.buero(); }
      } }, 'Fortschritt löschen'))));
}
