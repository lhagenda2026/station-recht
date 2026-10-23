# Inhaltsschema für „Bescheid, bitte!“ (verbindlich für alle Inhaltsdateien)

Jede Datei `inhalte/<name>.json` hat die Form `{ "regeln": [...], "faelle": [...], "glossar": [...] }`.
`tools/build.mjs` baut daraus `data/*.json`. **Kurzantwort, Details, Normen, Schlüsselbegriffe** der Klausurformel kommen
automatisch und wörtlich aus ANTWORTEN.md (`data/base.json`). Du schreibst sie **nicht** in die Datei.

Prüfen: `node tools/validate.mjs --datei <name>.json` (baut nur deine Datei + `glossar-basis.json` und prüft streng).
Erst fertig, wenn die Ausgabe „Validierung bestanden.“ lautet.

## Spielidee in einem Absatz
Der Spieler sitzt am Schalter der fiktiven „Gesundheitskasse Nordstadt“. Antragsteller (skurrile, sympathische Alltagsmenschen) legen Akten vor.
Er entscheidet per Stempel, Antippen, Sortieren. Chefin **Frau Brandt** (trocken, streng, fair) prüft ihn ab, Praktikant **Ole** stellt Laienfragen.
Ton: locker, witzig, kurz. Der Humor darf nie die Erklärung verdecken. Fälle dürfen auch außerhalb der Krankenkasse spielen
(Ärztekammer, Gemeinde, Schule, Uniklinik, Apotheke, Gesetzgeber …), solange die Regel passt.

## Einfache Sprache (Pflicht, wird automatisch geprüft)
- Leser: Erwachsener **ohne jede Rechtskenntnis**. Niveau Klasse 8. Du-Form in Regelkarten, im Fall Erzählton.
- Sätze möglichst ≤ 15 Wörter, **nie über 22** (Validator). Wiener Sachtextformel je Karte/Fall **≤ 8** (Validator). Kurze Wörter bevorzugen.
- Alltagsbeispiele zuerst (Schule, Kita, Fahrrad, Pizzeria, Fitnessstudio, Sportverein), dann das Rechtsbeispiel.
- Abkürzungen ausschreiben oder als Glossarwort markieren (SGB, GG, VA, GKV, G-BA, BVerfG …).
- Paragrafen (§, Art.) im Spielertext sparsam. Sie gehören in die Klausurformel.
- **Fachwörter auszeichnen:** `[[Bescheid]]` oder `[[Bescheids|bescheid]]` (Anzeige|Glossar-ID). Jedes Glossarwort, das in einer Leseeinheit
  (eine Regelkarte bzw. ein Fall inkl. Optionen und Feedback) vorkommt, muss dort **mindestens einmal** so markiert sein. Ausnahme: der eigene Fachbegriff einer Regelkarte.
- Jedes Fachwort braucht einen Glossareintrag. Erst `inhalte/glossar-basis.json` ansehen und dessen IDs benutzen. Neue Begriffe legst du in **deiner** Datei unter `glossar` an.
  Nur echte Fachwörter (nicht „Gesetz“, „Kasse“, „Staat“, „Arzt“). Glossar-`erklaerung`: ein bis zwei kurze Sätze; `beispiel`: ein Alltagsbeispiel.
  `formen`: gebeugte Formen und Abkürzungen (z. B. `["Verwaltungsakts","VA"]`).
- In Stempeltexten (F1-Optionen) und Kartenüberschriften keine `[[ ]]`; markiere das Wort stattdessen in `warumNicht`, `warum` oder `akte`.
- `**fett**` ist erlaubt, sparsam.

## Regelkarte (eine pro Frage, `id` = "q38" usw.)
```json
{
  "id": "q38",
  "titel": "Bescheid wieder aufheben: Von Anfang an falsch oder später überholt?",   // Alltagssprache, Frageform gern
  "fachbegriff": "Rücknahme und Widerruf",                                       // der Fachbegriff (klein unter dem Titel)
  "einSatz": "…",          // Was ist das? HÖCHSTENS 20 Wörter
  "warum": "…",            // Warum gibt es das? 1–2 Sätze, Sinn und Zweck
  "alltag": "…",           // Alltagsbeispiel AUSSERHALB des Rechts
  "erkennen": ["…", "…"],  // So erkennst du es: 2–4 Merkmale oder Entscheidungsfragen
  "merktrick": "…",        // Eselsbrücke, Bild oder Reim
  "klausur": {
    "bausteine": ["…", "…", "…"],           // 3–6 Stücke der Kurzantwort aus ANTWORTEN.md, IN RICHTIGER REIHENFOLGE, nah am Wortlaut (Fachsprache erlaubt)
    "fallenBausteine": [{ "text": "…", "warumNicht": "…" }]   // 1–2 plausible, aber falsche Stücke (typische Verwechslung) + Erklärung
  }
}
```
Musterbeispiel: Regel q38 in `inhalte/stockwerk-3.json` und q54 in `inhalte/stockwerk-4.json`.
Inhaltlich muss alles **deckungsgleich mit ANTWORTEN.md** sein: vereinfachen ja, verfälschen nein. Keine Rechtsbehauptung, die nicht aus ANTWORTEN.md folgt.
Bei ⚠-Antworten nur das Gesicherte spielbar machen.

## Fälle (gemeinsame Felder)
```json
{
  "id": "f038-2",              // f + Fragennummer dreistellig + "-" + laufende Nr.; Kniffel: "k<stockwerk>-<n>"; Chefin: "f038-chef"
  "regelId": "q38",
  "stufe": 2,                  // 0 Einarbeitung (eindeutig, mit offener Regelkarte lösbar), 1 Lehrling (klar), 2 Geselle (mit Ablenkung/irrelevantem Detail), 3 Meister (Falle, Kniff)
  "format": "F1",
  "figur": { "name": "Oma Hildegard mit Hörgerät", "emoji": "👵" },   // Pflicht außer F5/F6. Vielfältig! Name + Beruf/Eigenschaft
  "akte": "2–4 kurze Sätze oder ein kurzes Schreiben.",
  "frage": "Was tut die Kasse?",
  "ergebnis": "Ein Satz: die Lösung in Worten.",
  "warum": "1–2 Sätze: warum das richtig ist.",
  "denkweg": ["1. …", "2. …", "3. …"],     // 2–3 Mini-Schritte (Frage → Antwort), führt zur Lösung
  "dauerSek": 20,               // optional, sonst Standard je Stufe
  "kombiRegeln": []             // NUR Kniffelfälle (Stufe 3): weitere Regel-IDs, die man zusätzlich braucht
}
```
**Jede falsche Option entspricht einer typischen Verwechslung**, nie Unsinn. Jede falsche Option hat `warumNicht` (ein bis zwei Sätze, erklärt die Verwechslung).
Die Lösung muss sich allein aus Regelkarte + ANTWORTEN.md ergeben.

### F1 Stempeln
`"optionen": [{ "text": "Rücknahme", "richtig": true, "warumNicht": null }, { "text": "Widerruf", "richtig": false, "warumNicht": "…" }]`
2–4 Optionen, Stempeltext **höchstens 4 Wörter**, genau eine richtig.

### F2 Rote Tinte (Stelle antippen)
```json
"modus": "einer",            // "einer": genau eine fehlerhafte Stelle antippen; "alle": alle Ziel-Teile antippen, dann „Fertig“
"markierbar": [
  "Sehr geehrte Frau Kaya, ",                                   // reiner Text (nicht antippbar)
  { "text": "Ihre Haushaltshilfe wird ab sofort gestrichen.", "fehler": false, "warumNicht": "Das ist nur die Entscheidung selbst." },
  { "text": "Eine Anhörung war nicht nötig.", "fehler": true, "fehlerart": "fehlende Anhörung" }
]
```
`akte` kann bei F2 entfallen (das Schreiben steht in `markierbar`). Jeder antippbare Teil ohne `fehler: true` braucht `warumNicht`.
Für Tatbestand/Rechtsfolge: `modus: "alle"`, Frage z. B. „Tippe alle Teile an, die zum [[Tatbestand]] gehören.“, Ziel-Teile `fehler: true`.

### F3 Sortieren
Fächer: `"fachfaecher": { "faecher": ["Körperschaft", "Anstalt"], "karten": [{ "text": "Ärztekammer", "fach": "Körperschaft", "warumNicht": "Sie hat Mitglieder: die Ärzte." }] }`
(2–3 Fächer, 3–6 Karten; `warumNicht` erklärt, warum die Karte in IHR Fach gehört.)
Reihenfolge: `"reihenfolge": ["Volk", "Parlament", "Regierung", "Behördenleitung", "Sachbearbeiter"]` (richtige Reihenfolge, 3–6 Schritte; das Spiel mischt).

### F4 Frist-Check
```json
"datumA": { "label": "Bescheid zur Post gegeben", "datum": "2026-02-03" },
"datumB": { "label": "Widerspruch kommt an", "datum": "2026-02-20" },
"optionen": [ /* genau 3 */ ], "rechnung": "3. Februar + 3 Tage = 6. Februar. Plus ein Monat = 6. März. …"
```
Jahr 2026. Wähle Daten so, dass das Ergebnis **gleich bleibt**, egal ob die Post-Fiktion mit dem 3. Tag (ANTWORTEN.md) oder dem 4. Tag (aktuelles Gesetz) rechnet,
und dass kein Fristende auf ein Wochenende oder einen Feiertag fällt. Keine Fälle direkt an der Fristgrenze.

### F5 Praktikanten-Frage (Ole fragt)
Keine `figur` (Ole erscheint automatisch). `frage` = Oles Frage („Was ist eigentlich …?“), `akte` optional als Kontext.
Genau 3 `optionen`: Erklärungen in einfacher Sprache; die falschen sind typische Verwechslungen.

### F6 Chefin-Stichprobe (eine pro Regel, Pflicht)
Keine `figur` (Frau Brandt erscheint automatisch), `stufe: 3`, `id: "f038-chef"`.
`akte`: Frau Brandts Auftrag, z. B. „Erklären Sie mir den Unterschied zwischen Rücknahme und Widerruf. So, wie es in der Prüfung steht.“
`frage`: „Lege die Bausteine in die richtige Reihenfolge.“ Die Bausteine kommen aus `regel.klausur`. `ergebnis`, `warum` (Kern in einfachen Worten), `denkweg` (2–3 Merkhilfen zur Reihenfolge).

## Mengen pro Regel
- **≥ 4 Fälle** (ohne F6/Kniffel), mindestens einer je Stufe 0, 1, 2, 3. **Abgrenzungsregeln ≥ 6** Fälle:
  q1, q17, q20, q27, q28, q29, q30, q34, q36, q37, q38, q44, q46, q47, q48, q50, q51, q52, q58, q59.
- **Genau 1 F6** (`-chef`).
- Formate mischen (siehe Tabelle in BRIEF_V2.md Abschnitt 5). Nicht nur F1!
- Zusätzlich **5 Kniffelfälle** pro Datei (`kombiRegeln` mit einer zweiten Regel, gern auch aus einem früheren Stockwerk).
