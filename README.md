# Station Recht

Lernspiel-PWA (iPhone-first) für „Recht im Gesundheitswesen“: 58 Prüfungsfragen als Patienten einer Station.
Vanilla HTML/CSS/JS, keine Laufzeit-Abhängigkeiten, offline nutzbar.

**Installieren:** URL in Safari öffnen → Teilen → „Zum Home-Bildschirm“.

## Inhalte
- `ANTWORTEN.md` ist die verbindliche Quelle (Kurzantwort, Normen, Schlüsselbegriffe werden wörtlich übernommen).
- Ergänzungen (Eselsbrücken, Lücken, Triage, Lügen, Fristen, Schemata, Beispielfälle) liegen in `content/<kapitel>.json`, Normhinweise in `content/normpruefung.json`.
- `npm run build` → parst ANTWORTEN.md, baut `data/cards.json`, validiert und setzt die Service-Worker-Version.

## Entwickeln & Testen
```
npm install
npx playwright install webkit
npm run build
npm test            # WebKit, iPhone 14
npm run serve       # http://localhost:4173
```

## Deployment
GitHub Pages aus `main` (Root). Nach Änderungen: `npm run build && git commit -am "…" && git push`.
