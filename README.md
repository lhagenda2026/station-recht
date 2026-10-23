# Bescheid, bitte!

Büro-Lernspiel (iPhone-first PWA) für „Recht im Gesundheitswesen“: Am Schalter der fiktiven Gesundheitskasse Nordstadt
stempelst, markierst und sortierst du Akten. Die 58 Prüfungsfragen stecken in den Fällen, Frau Brandt fragt am Ende die Klausurformel ab.
Vanilla HTML/CSS/JS (ES-Module), keine Laufzeit-Abhängigkeiten, offline nutzbar.

**Spielen:** https://lhagenda2026.github.io/station-recht/ · **Installieren:** in Safari öffnen → Teilen → „Zum Home-Bildschirm“.

## Inhalte
- `ANTWORTEN.md` ist die verbindliche Quelle. Kurzantwort, Normen und Schlüsselbegriffe werden wörtlich übernommen (`data/base.json`).
- Regelkarten, Fälle und Glossar in einfacher Sprache liegen in `inhalte/*.json` (Schema: `inhalte/SCHEMA.md`).
- `npm run build` parst ANTWORTEN.md, baut `data/regeln.json`, `data/faelle.json`, `data/glossar.json`, validiert und setzt die Service-Worker-Version.

## Prüfen
```
npm install && npx playwright install webkit
npm run build
npm run validate          # Mengen, Referenzen, warumNicht, Glossar, Wiener Sachtextformel ≤ 8
npm test                  # Playwright, WebKit 390×844
node tools/validate.mjs --datei stockwerk-2.json   # eine Inhaltsdatei streng prüfen
```
Einzelnen Fall testen: `?fall=f038-0` an die URL hängen (speichert nichts).

## Deployment
GitHub Pages aus `main` (Root). Nach Änderungen: `npm run build`, committen, pushen.
