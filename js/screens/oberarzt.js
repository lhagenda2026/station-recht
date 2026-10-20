// Kapitelboss: 10 gemischte Aufgaben aus einem Zimmer, 3 Leben.
import { h, shuffle, konfetti } from '../ui.js';
import { bonusXP, oberarztFrei } from '../store.js';
import { triageItem, luegeItem, bombeItem, sammle } from '../items.js';
import { topbar, leben, ergebnisScreen } from './common.js';

export function oberarzt(ctx, kapitelId) {
  const kap = ctx.data.kapitel.find((k) => k.id === kapitelId) ?? ctx.data.kapitel[0];
  const wrap = h('div', { class: 'screen spielscreen bossscreen' });
  const rechts = h('div', { class: 'spielstatus' });
  const buehne = h('div', { class: 'buehne' });
  wrap.append(topbar(ctx, 'Oberarzt-Visite', rechts, `zimmer/${kap.id}`), buehne);
  let aktuell = null;
  ctx.onLeave(() => aktuell?.abbrechen?.());

  if (!oberarztFrei(ctx.data.karten, kap.id)) {
    buehne.append(h('div', { class: 'leer' }, h('h2', {}, 'Noch gesperrt'),
      h('p', {}, 'Die Oberärztin kommt erst, wenn 70 % der Patienten in diesem Zimmer mindestens Box 3 erreicht haben.'),
      h('button', { class: 'knopf knopf-haupt', type: 'button', onclick: () => ctx.go(`zimmer/${kap.id}`) }, 'Zum Zimmer')));
    return wrap;
  }

  function runde() {
    const pool = shuffle([
      ...sammle(ctx, 'triage', kap.id).map((x) => ['triage', x]),
      ...sammle(ctx, 'luegen', kap.id).map((x) => ['luege', x]),
      ...sammle(ctx, 'fristen', kap.id).map((x) => ['bombe', x]),
    ]).slice(0, 10);
    let i = 0, lebenAnz = 3, richtig = 0;
    const status = () => rechts.replaceChildren(leben(lebenAnz));
    function naechste() {
      if (lebenAnz <= 0 || i >= pool.length) return ende();
      status();
      const [art, item] = pool[i++];
      const opts = { onAntwort: (ok) => { if (ok) richtig++; else lebenAnz--; status(); }, onWeiter: naechste };
      aktuell = art === 'triage' ? triageItem(ctx, item, { ...opts, zeitMs: 15000 })
        : art === 'luege' ? luegeItem(ctx, item, opts) : bombeItem(ctx, item, opts);
      buehne.replaceChildren(h('p', { class: 'fortschritt' }, `${kap.titel} · Frage ${i} von ${pool.length}`), aktuell);
      window.scrollTo(0, 0);
    }
    function ende() {
      const bestanden = lebenAnz > 0;
      if (bestanden) { bonusXP(100); konfetti(140); }
      buehne.replaceChildren(ergebnisScreen(ctx, {
        titel: bestanden ? 'Oberarzt-Visite bestanden' : 'Die Oberärztin ist nicht überzeugt',
        gewonnen: bestanden,
        zeilen: [['Richtig', `${richtig} von ${i}`], ['Bonus', bestanden ? '100 XP' : '–']],
        nochmal: runde,
      }));
    }
    naechste();
  }
  runde();
  return wrap;
}
