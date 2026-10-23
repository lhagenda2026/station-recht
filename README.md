# Bescheid, bitte!

Büro-Spiel (iPhone-PWA) zum Verwaltungsrecht im Gesundheitswesen nach dem Vorbild „Papers, Please“:
Antragsteller stehen Schlange, du prüfst Akten gegen das Regelbuch und stempelst. 58 Regeln aus
`ANTWORTEN.md`, vier Stockwerke, Beförderung vom Praktikanten zum Vorstand.
Vanilla HTML/CSS/JS, keine Laufzeit-Abhängigkeiten, vollständig offline.

**Installieren:** URL in Safari öffnen → Teilen → „Zum Home-Bildschirm“.

## Inhalte
- `ANTWORTEN.md` ist die verbindliche Quelle. Kurzantwort, Normen, Schlüsselbegriffe übernimmt `tools/build.mjs` wörtlich.
- Einfache Sprache, Fälle und Glossar liegen in `inhalte/stockwerk-*.json` (Format: `inhalte/SCHEMA.md`).
- Fachbegriffe im Text: `[[Begriff]]` oder `[[angezeigt|Begriff]]` → antippbar, Erklärung aus dem Glossar.

## Entwickeln und prüfen
```
npm install && npx playwright install webkit
npm run build                    # Daten bauen, validieren, Lesbarkeit prüfen, Service-Worker-Version setzen
node tools/validate.mjs --voll   # Qualitätstor 1+2 mit allen Mengen
npm test                         # Qualitätstor 4: Spieltest WebKit 390×844
node tools/pruefe.mjs inhalte/stockwerk-1.json   # eine Inhaltsdatei prüfen
npm run serve                    # http://localhost:4173
```
Einen Fall direkt öffnen: `/?fall=f038-2&stufe=2`.

## Deployment
GitHub Pages aus `main` (Repo `station-recht`, gleiche URL wie Version 1). Version 1 liegt im Branch `v1-karteikarten`.
