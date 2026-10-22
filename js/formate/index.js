// Fallformate: jedes liefert Akte-Inhalt (akte), Zusatz unter der Akte (mitte) und die Bedienung im
// Daumenbereich (unten) und meldet das Ergebnis über ctx.antwort({ richtig, gewaehlt, stempel?, zusatz? }).
import { f1 } from './f1.js';
import { f2 } from './f2.js';
import { f3 } from './f3.js';
import { f4 } from './f4.js';
import { f5 } from './f5.js';
import { f6 } from './f6.js';

export const FORMATE = { F1: f1, F2: f2, F3: f3, F4: f4, F5: f5, F6: f6 };
