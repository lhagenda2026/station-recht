# Inhalte für „Bescheid, bitte!“ – Anleitung für die Inhalts-Dateien

Jede Datei `inhalte/<name>.json` enthält Regelkarten, Fälle und Glossar für einen Fragenbereich.
Vorbild mit allen Formaten: `quellen/durchstich-beispiel.json` (Fragen 38, 50, 54). Prüfen: `node tools/pruefe.mjs inhalte/<name>.json` (muss mit „✓ alles in Ordnung“ enden). **Nicht** `tools/build.mjs` ausführen und nichts außer der eigenen Datei ändern.

## Quelle und Treue
- Inhaltliche Quelle ist **nur `ANTWORTEN.md`**. Keine Rechtsbehauptung, die nicht daraus folgt. Vereinfachen ja, verfälschen nein.
- Kurzantwort, Normen, Schlüsselbegriffe werden automatisch wörtlich aus `ANTWORTEN.md` übernommen. Du schreibst sie **nicht** in die Datei.
- Bei Zweifel an einer eigenen Formulierung: in der Regel `"verifiziert": false` und `"hinweis": "…"` setzen und im Abschlussbericht nennen.
- Fragen mit 📝: eigene typische Beispielfälle bilden. ⚠-Fragen werden automatisch als „bitte mit Skript abgleichen“ markiert.

## Einfache Sprache (Pflicht)
- Leser: Student ohne jede Rechtskenntnis. Niveau Klasse 8, Du-Form, aktiv, konkret.
- Sätze möglichst ≤ 15 Wörter, **nie über 22**. Wiener Sachtextformel ≤ 8 je Regelkarte und je Fall (prüft das Skript).
- Lange Wörter vermeiden: lieber „Brief der Kasse“ als „Leistungsbescheid“, „aufheben“ statt „Aufhebungsentscheidung“.
- Alltagsbeispiele zuerst (Schule, Kita, Fahrrad, Pizzeria, Fitnessstudio, Verein), dann das Rechtsbeispiel.
- Abkürzungen ausschreiben oder erklären (G-BA, SGB, VA, GKV, BVerfG).
- **Fachbegriffe** beim ersten Auftreten je Text als `[[Begriff]]` markieren, gebeugt als `[[Bescheids|Bescheid]]` (angezeigt|Glossar-Begriff). Jeder markierte Begriff muss im Glossar stehen (Begriff oder Alias). Lieber einen Fachbegriff vermeiden als markieren.
- Humor erlaubt (Ton: locker, witzig, kurz), aber er darf die Erklärung nie verdecken.

## Regel (eine pro Frage, `id` = "q<nr>")
```json
{
  "id": "q38",
  "titel": "Frage in Alltagssprache (max. ~12 Wörter)",
  "fachbegriff": "Fachbegriff(e) klein darunter",
  "einSatz": "Was ist das? Höchstens 20 Wörter.",
  "warum": "Sinn und Zweck, 1 bis 2 Sätze.",
  "alltag": "Alltagsbeispiel außerhalb des Rechts.",
  "erkennen": ["2 bis 4 Merkmale als Mini-Checkliste oder Entscheidungsfrage"],
  "merktrick": "Eselsbrücke, Bild oder Reim.",
  "bausteine": ["3 bis 6 Sätze, die zusammen die Kurzantwort aus ANTWORTEN.md wiedergeben, in fester Reihenfolge"],
  "fallenBausteine": ["1 bis 2 falsche Sätze, die wie typische Verwechslungen klingen"]
}
```
- `bausteine` dürfen Fachsprache enthalten (Klausurformel), müssen aber inhaltlich exakt der Kurzantwort entsprechen, in sinnvoller Reihenfolge (die Reihenfolge wird abgefragt). Jeder Baustein ≤ 22 Wörter.

## Fälle (mindestens 4 pro Regel, bei Abgrenzungsfragen mindestens 6)
Abgrenzungsfragen (≥ 6 Fälle): q1, q12, q17, q20, q22, q27, q28, q29, q30, q33, q36, q37, q38, q44, q46, q47, q48, q50, q51, q52, q58, q59.
Je Regel: mindestens ein Fall auf **jeder Stufe 0, 1, 2, 3**, und mindestens eine **F6-Aufgabe (immer Stufe 3)**.
- Stufe 0 „Einarbeitung“: ganz eindeutig, mit der offen liegenden Regelkarte lösbar, 2 Optionen.
- Stufe 1 „Lehrling“: eindeutig, 2 bis 3 Optionen.
- Stufe 2 „Geselle“: mit Ablenkung (unwichtige Details, ähnliche Begriffe), 3 Optionen.
- Stufe 3 „Meister“: Kniffel, Fallen, oder F6.

Gemeinsame Felder:
```json
{
  "id": "f038-2",               // f + Fragennummer dreistellig + laufende Nr.; Kniffelfälle: "k038-1"
  "regelId": "q38", "stufe": 2, "format": "F1",
  "figur": { "name": "Oma Liesel mit Hörgerät", "emoji": "👵" },   // abwechslungsreich, original, Beruf/Eigenart
  "akte": "2 bis 4 kurze Sätze oder ein kurzes Schreiben.",
  "frage": "Kurze Frage an dich.",
  "ergebnis": "Ein Satz: richtige Lösung + kurzer Grund.",
  "warum": "1 bis 2 Sätze: warum ist das richtig?",
  "denkweg": ["1. Wer handelt? …", "2. …", "3. Also …"],   // 2 bis 3 Mini-Schritte
  "dauerSek": 20,               // 18 bis 30 (mehr bei langem Text, F3, F4, F6: bis 45)
  "kombiRegeln": []             // nur Kniffelfälle: weitere Regel-IDs (q…)
}
```
Formate (jedes Format ist eine Spielmechanik, Empfehlungen je Frage: BRIEF_V2.md Abschnitt 5):
- **F1 Stempeln**: `optionen` 2 bis 4, genau eine `richtig: true`; `text` = Stempelaufschrift, **max. 34 Zeichen**; jede falsche Option hat `warumNicht` (ein Satz: warum nicht diese).
- **F2 Rote Tinte**: `markierbar`: Liste von Satzteilen `{ "text": "…", "tappbar": false }` (Anrede, Füllsätze), `{ "text": "…", "warumNicht": "…" }` (antippbar, aber korrekt) und genau **einem** `{ "text": "…", "ziel": true }` (die fehlerhafte Stelle bzw. die gesuchte Stelle, z. B. die Rechtsfolge). Optional `optionen` für die Fehlerart (wie F1).
- **F3 Sortieren**: entweder `fachfaecher: { "faecher": ["A", "B"], "karten": [{ "text": "…", "fach": "A", "warum": "…" }] }` (2 bis 3 Fächer, 4 bis 6 Karten) oder `reihenfolge: ["Schritt 1", "Schritt 2", …]` (3 bis 6, richtige Reihenfolge).
- **F4 Frist-Check**: `datumA`, `datumB` (ISO "2026-03-02"), `labelA`, `labelB` (kurz), `optionen` (3, eine richtig, mit `warumNicht`), `rechnung` (ein Satz mit der Rechnung). Bekanntgabe: dritter Tag nach Aufgabe zur Post (ANTWORTEN.md). **Wähle die Daten so, dass das Ergebnis auch mit dem vierten Tag gleich bleibt** (Normabweichung § 37 II SGB X), also nicht genau auf den Grenztag.
- **F5 Praktikanten-Frage**: `akte` = Oles Frage („Was ist eigentlich …?“); `optionen` = 3 Erklärungen in einfacher Sprache (je ≤ 25 Wörter), die falschen sind typische Verwechslungen, mit `warumNicht`.
- **F6 Chefin-Stichprobe** (nur Stufe 3): `figur` = `{ "name": "Frau Brandt", "emoji": "👩🏼‍💼" }`, `akte` = „Erklären Sie mir …“; nutzt die `bausteine`/`fallenBausteine` der Regel (eigene nur bei Bedarf, dann beide Felder).

Fallgestaltung: Jede falsche Option ist eine **typische Verwechslung**, kein Unsinn. Jede Lösung ergibt sich allein aus der Regelkarte und `ANTWORTEN.md`. Figuren und Situationen abwechslungsreich (Tischlerin, Marathonläufer, Kita-Leiter, Imker, Pizzabäcker …), nicht nur Krankenkasse. Formate je Regel mischen.

## Glossar
```json
{ "begriff": "Bescheid", "aliase": ["Verwaltungsakt", "VA", "Bescheids"], "erklaerung": "Ein Satz.", "beispiel": "Alltagsbeispiel, ein Satz." }
```
Jeder in der Datei markierte Begriff braucht einen Eintrag (Begriff oder Alias, ohne Groß/klein). Doppelte Begriffe über mehrere Dateien sind erlaubt; es gewinnt der erste.

## Dateiaufbau
```json
{ "regeln": [ … ], "faelle": [ … ], "glossar": [ … ] }
```
