// Optionaler Ton (Standard: aus). Kurze synthetische Klänge über WebAudio, keine Dateien.
import { S } from './store.js';

let ctx = null;
const KLANG = {
  stempel: [[90, 0.09, 'square', 0.25]],
  muenze: [[880, 0.06, 'triangle', 0.15], [1320, 0.12, 'triangle', 0.12]],
  beschwerde: [[220, 0.12, 'sawtooth', 0.12], [160, 0.2, 'sawtooth', 0.1]],
  befoerdert: [[523, 0.12, 'triangle', 0.15], [659, 0.12, 'triangle', 0.15], [784, 0.25, 'triangle', 0.15]],
};

export function ton(name) {
  if (!S.einstellungen.ton) return;
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const [freq, dauer, typ, laut] of KLANG[name] ?? []) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = typ;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(laut, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dauer);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dauer);
      t += dauer * 0.9;
    }
  } catch { /* kein Ton verfügbar */ }
}
