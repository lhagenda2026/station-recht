// Einstellungen: Backup-Code, Wiederherstellen, Zurücksetzen, nicht verifizierte Karten.
import { h, toast } from '../ui.js';
import { exportCode, importCode, reset } from '../store.js';
import { topbar } from './common.js';

export function einstellungen(ctx) {
  const code = exportCode();
  const ausgabe = h('textarea', { class: 'code', readonly: true, rows: 4, 'aria-label': 'Dein Backup-Code' }, code);
  const eingabe = h('textarea', { class: 'code', rows: 4, placeholder: 'Backup-Code hier einfügen (beginnt mit SR1.)', 'aria-label': 'Backup-Code einfügen' });
  const meldung = h('p', { class: 'meldung', role: 'status' });

  async function kopieren() {
    try { await navigator.clipboard.writeText(code); toast('Backup-Code kopiert'); }
    catch { ausgabe.select(); toast('Code markiert – jetzt kopieren'); }
  }
  function wiederherstellen() {
    try { importCode(eingabe.value); meldung.textContent = 'Fortschritt wiederhergestellt.'; toast('Fortschritt wiederhergestellt'); }
    catch (e) { meldung.textContent = e.message; }
  }
  function zuruecksetzen() {
    if (confirm('Gesamten Fortschritt löschen? Das lässt sich nur mit einem Backup-Code rückgängig machen.')) { reset(); toast('Station zurückgesetzt'); ctx.go('station'); }
  }
  const offen = ctx.data.karten.filter((k) => !k.verifiziert);

  return h('div', { class: 'screen einstellungen' },
    topbar(ctx, 'Einstellungen'),
    h('section', { class: 'block-abschnitt' },
      h('h2', {}, 'Backup'),
      h('p', {}, 'Dein Fortschritt liegt nur auf diesem Gerät. Kopiere den Code und bewahre ihn z. B. in den Notizen auf.'),
      ausgabe,
      h('button', { class: 'knopf knopf-haupt', type: 'button', onclick: kopieren }, 'Code kopieren')),
    h('section', { class: 'block-abschnitt' },
      h('h2', {}, 'Wiederherstellen'),
      eingabe, meldung,
      h('button', { class: 'knopf', type: 'button', onclick: wiederherstellen }, 'Fortschritt wiederherstellen')),
    h('section', { class: 'block-abschnitt' },
      h('h2', {}, 'Bitte mit Skript abgleichen'),
      h('p', {}, 'Diese Antworten sind als nicht verifiziert markiert:'),
      h('ul', { class: 'offen-liste' }, offen.map((k) => h('li', {}, h('a', { href: `#/karte/${k.id}` }, `Frage ${k.nr}: ${k.frage}`))))),
    h('section', { class: 'block-abschnitt' },
      h('h2', {}, 'Neu anfangen'),
      h('button', { class: 'knopf knopf-warnung', type: 'button', onclick: zuruecksetzen }, 'Fortschritt löschen')),
    h('p', { class: 'version' }, `Kartenstand ${ctx.data.version} · Ton ist aus, es gibt nur Animationen.`));
}
