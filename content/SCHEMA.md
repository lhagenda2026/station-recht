# Schema für Kapitel-Ergänzungen (content/<kapitel>.json)

Grundlage: `data/base.json` (aus ANTWORTEN.md geparst, **unveränderlich**). Felder `frage`, `kurzantwort`,
`details`, `normen`, `schluesselbegriffe`, `hinweise` sind die verbindliche Lehrmeinung. Du ergänzt nur.
Alles, was du schreibst, darf diesen Inhalten **nicht widersprechen**. Sprache: Deutsch, klausurtauglich, knapp.
Typografische Anführungszeichen („…“) sind ok, aber JSON muss gültig sein (ASCII-Quotes `"` nur als JSON-Delimiter).

Dateiformat:
```json
{
  "kapitel": "verwaltungsrecht",
  "karten": [
    {
      "id": "q38",
      "typ": "abgrenzung",
      "normenAusText": [],
      "eselsbruecke": "…",
      "luecken": [{ "text": "Die Rücknahme betrifft ___ Verwaltungsakte.", "loesung": "rechtswidrige" }],
      "reihenfolge": null,
      "triage": [{ "fall": "…", "set": "ruecknahme-widerruf", "richtig": "Widerruf", "grund": "ein Satz" }],
      "luegen": [{ "aussagen": ["…", "…", "…"], "luege": 2, "erklaerung": "…" }],
      "fristen": [{ "szenario": "…", "optionen": ["…", "…", "…"], "richtig": 0, "erklaerung": "…" }],
      "beispielfall": null
    }
  ],
  "stichprobe": [{ "karte": "q38", "norm": "§ 47 SGB X", "quelle": "https://www.gesetze-im-internet.de/sgb_10/__47.html", "ergebnis": "stimmt" }],
  "anmerkungen": ["…nur echte Abweichungen Gesetz ↔ ANTWORTEN.md oder getroffene Entscheidungen, je 1 Zeile…"]
}
```

Regeln pro Feld:
- `typ`: eines von `definition | abgrenzung | schema | fakt | fall`.
- `normenAusText`: **nur** wenn `normen` in base.json leer ist: die Normen, die im Text der Karte (frage/kurzantwort/details/hinweise) **wörtlich vorkommen**, im Format „§ 24 SGB X“, „Art. 20 III GG“. Keine neuen Normen erfinden. Kommt keine Norm vor → `[]`. Ist `normen` nicht leer → `[]`.
- `eselsbruecke`: 1 kurzer, einprägsamer Merksatz/Eselsbrücke (max. ~140 Zeichen), gern bildhaft oder Stationsarzt-Bezug.
- `luecken`: 1–3 Lückensätze. `text` enthält genau einmal `___`. `loesung` (1–4 Wörter) muss **wörtlich** (Groß/Klein egal) in kurzantwort oder details der Karte vorkommen.
- `reihenfolge`: nur bei echten Prüfschemata/Abläufen `{ "titel": "…", "schritte": ["…", "…"] }` (3–7 kurze Schritte, max. ~40 Zeichen je Schritt, eindeutige Reihenfolge). Sonst `null`.
- `triage`: Fälle für das Sortierspiel. `set` = Schlüssel aus `content/triage_sets.json`, `richtig` = **exakt** einer der `boxen` dieses Sets. `fall`: konkreter Mini-Sachverhalt aus dem Gesundheitswesen, max. ~160 Zeichen, eindeutig lösbar. `grund`: 1 Satz Begründung. Fall an die Karte hängen, deren Wissen er abfragt.
- `luegen`: 3 Aussagen, genau eine subtil falsch (vertauschte Merkmale, falsche Frist, falsche Norm, falsche Rechtsfolge). `luege` = Index 0–2 (Position variieren!). Wahre Aussagen müssen durch die Karte gedeckt sein. `erklaerung`: warum die Lüge falsch ist (1–2 Sätze). Je Aussage max. ~140 Zeichen.
- `fristen`: Multiple Choice mit genau 3 Optionen (kurz, max. ~60 Zeichen), `richtig` = Index 0–2 (variieren!). Szenario max. ~200 Zeichen. Inhalte: Fristen, Fristbeginn, Rechtsfolgen, Klageart-Wahl, Heilung/Nichtigkeit-Folgen usw. Nur Lösungen, die durch die Karten gedeckt sind.
- `beispielfall`: **nur** für Karten mit `beispielfallNoetig: true`, sonst `null`. Format `{ "titel": "…", "sachverhalt": "konkreter, typischer Fall (2–4 Sätze)", "loesung": "Markdown" }`. Bei q25 und q57: `loesung` als kurzes **Gutachten** (Obersatz, Voraussetzungen mit knapper Subsumtion, Ergebnis). Bei q20/q41/q43: Lösung anhand des Prüfschemas der Karte. Mit „Beispielfall“ wird das in der App gekennzeichnet.
- `stichprobe`: Prüfe mind. 3 Normen deiner Karten per WebFetch gegen gesetze-im-internet.de (oder amtliche Quelle). `ergebnis`: „stimmt“ oder kurze Abweichung.
- `anmerkungen`: Abweichungen zwischen Gesetzestext und ANTWORTEN.md hier notieren, aber **nichts an den Antworten ändern**.

Jede Karte des Kapitels muss im Array vorkommen (auch wenn triage/luegen/fristen leer sind).
Validierung: `node tools/validate_content.mjs content/<kapitel>.json` muss fehlerfrei durchlaufen.
