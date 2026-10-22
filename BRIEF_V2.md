# BRIEF V2: „Bescheid, bitte!“ – das Büro-Spiel, das Verwaltungsrecht beibringt

> Ersetzt BRIEF.md (Konzept verworfen). **Inhaltliche Quelle bleibt `ANTWORTEN.md`** (enthält auch den Wortlaut aller 58 Fragen). Von BRIEF.md gelten nur noch die technischen Abschnitte, die hier unter 6 wiederholt sind.

## 0. Auftrag und Vorgeschichte
Im Ordner liegt bereits eine **Version 1** (Karteikarten mit Spiel-Verpackung). Sie wurde als **zu wenig spielerisch** verworfen: Es fühlte sich wie eine hübsche Karteikarten-App an. Version 2 ist ein **echtes, einfaches Spiel nach bekanntem Vorbild** (Papers, Please: Schlange von Antragstellern, Regelbuch, Stempel, Zeitdruck, Fehler kosten). **Das Lernen steckt in der Spielmechanik, nicht davor.**

Die Zielperson ist ein **Student, der aus einem anderen Fachgebiet kommt**. Er soll **sehr schnell verstehen, worum es geht, und erklären können, wie und warum eine Antwort richtig ist**, und die Klausurantworten am Ende auswendig können.

Vorgehen mit der Version 1: Sichere sie in einem Git-Branch `v1-karteikarten`. Baue V2 auf `main` neu. **Wiederverwenden** darfst du: PWA-Gerüst, Service Worker, Deployment-Skripte, Speicher- und Wiederholungslogik, Icon-Erzeugung. **Ersetzen** musst du: Spielkonzept, Oberfläche, Fallinhalte.

## 1. Arbeitsregeln
1. **Keine Rückfragen an den Nutzer.** Bei Unklarheit die naheliegendste Entscheidung treffen und in einer Zeile in `DECISIONS.md` notieren. Der Nutzer will manuell nichts tun.
2. **Skills laden:** Zu Beginn verfügbare Skills prüfen. Auf jeden Fall `frontend-design`; außerdem alles zu PWA, Playwright und Deployment, falls vorhanden.
3. **Zuerst die Spielschleife, dann die Inhalte (Meilensteine, Abschnitt 10).** Nach Meilenstein 1 ist eine spielbare Runde mit Platzhalter-Fällen deployt, bevor die 58 Regeln eingefüllt werden.
4. **Parallelisieren:** Fall- und Regelinhalte pro Stockwerk (4 Stück) mit Subagents erstellen, nachdem das Datenschema (Abschnitt 4) feststeht.
5. **Vanilla HTML/CSS/JS (ES-Module)**, kein Framework, kein Build-Zwang, keine Laufzeit-Abhängigkeiten. Alles statisch hostbar.
6. **Rechtliche Treue:** Keine Rechtsbehauptung, die nicht aus `ANTWORTEN.md` folgt. Vereinfachen ja, verfälschen nein. Zweifel → `"verifiziert": false` und Eintrag in `DECISIONS.md`.
7. **Keine fremden Marken oder Assets.** Papers, Please dient nur als Mechanik-Vorbild. Grafik, Namen, Figuren, Texte sind **original**.

## 2. Das Spielkonzept

### 2.1 Prämisse und Ton
Du bist neu in der Kasse „**Gesundheitskasse Nordstadt**“ (fiktiv). Deine Chefin, **Frau Brandt**, ist trocken-humorvoll und streng, aber fair. Dein Kollege, der Praktikant **Ole**, stellt die Fragen, die auch ein Laie hätte. Antragsteller sind skurrile, sympathische Alltagsmenschen (Tischlerin, Marathonläufer, Oma mit Hörgerät). Ton: **locker, witzig, kurz.** Der Humor darf nie die Erklärung verdecken.

### 2.2 Ein Spieltag (3 bis 4 Minuten)
1. **Morgenbesprechung (max. 20 Sekunden Lesezeit):** Frau Brandt sagt einen Satz. Falls eine **neue Regel** dran ist, erscheint ihre **Regelkarte** (Abschnitt 3) mit Tippen-zum-Weiter.
2. **8 bis 10 Fälle:** Antragsteller treten nacheinander an den Schalter (Abschnitt 2.3).
3. **Feierabend:** Auswertung mit Sternen, Trinkgeld, Beschwerden, „Heute gelernt: 3 Regeln“, Serie (Streak) und ein Ausblick „Morgen im Postfach“.
Ein Tag ist **jederzeit abbrechbar** (Pause), Fortschritt geht nicht verloren.

### 2.3 Ein Fall (der Kern der Spielschleife)
- Der Antragsteller schiebt eine **Akte** auf den Schreibtisch: 2 bis 4 kurze Sätze oder ein kurzes Schreiben.
- Ein **Geduldsbalken** läuft (Standard 20 Sekunden, abhängig von der Stufe). Hinter dem Schalter steht sichtbar eine **Schlange**, die länger wird, wenn du trödelst.
- Du entscheidest per **Stempel/Tippen/Ziehen** (Fallformate, Abschnitt 2.5).
- **Sofort sichtbares Feedback:** Stempel-Animation, Münzen oder Beschwerde-Zettel, Reaktion des Antragstellers (Emoji-Gesicht).
- **Regelbuch:** Liegt in der Schublade (großer Button unten rechts). **Aufschlagen kostet:** Der Geduldsbalken fällt schneller, und es gibt maximal 2 Sterne statt 3. So lohnt es sich, die Regeln im Kopf zu haben, ohne dass man je festhängt.
- **Bewertung pro Fall:** ⭐⭐⭐ richtig, ohne Regelbuch, schnell · ⭐⭐ richtig mit Regelbuch oder langsam · ⭐ richtig, aber kaum Zeit übrig · 0 falsch (= **eine Beschwerde**).
- **3 Beschwerden:** Frau Brandt schickt dich nach Hause. Der Tag endet früh, die falsch beantworteten Fälle kommen morgen **zuerst** wieder.

### 2.4 Einarbeitung bis Meisterschaft (macht fachfremdes Lernen möglich)
Jede Regel hat vier Stufen. Das Spiel steigert **automatisch** Schwierigkeit und Tempo:
- **Stufe 0 „Einarbeitung“:** Die passende Regelkarte liegt **offen neben der Akte**. Der Fall ist eindeutig. Ziel: verstehen, noch kein Zeitdruck.
- **Stufe 1 „Lehrling“:** Regelkarte nur per Tipp auf „Tipp“ (ohne Sternabzug), milder Zeitdruck.
- **Stufe 2 „Geselle“:** Nur noch das Regelbuch (mit Kosten), normaler Zeitdruck, Fälle mit Ablenkung.
- **Stufe 3 „Meister“:** Keine Hilfe, Kniffelfälle (zwei Regeln gemischt, Fallen), Zeitdruck. Danach erscheint die **Chefin-Stichprobe** (2.5, Format F6): Die Klausurformel aus dem Kopf.
Aufstieg nach 2 richtigen Antworten in Folge (ohne Hilfe ab Stufe 2), Abstieg um eine Stufe bei Fehlern. Wiederholungen folgen dem Leitner-System (Abstände `[0,1,2,5,12,30]` Tage). Alles läuft über **eine** Funktion `grade(regelId, ergebnis, hilfeGenutzt, zeit)`.

### 2.5 Fallformate (jedes Format ist eine Spielmechanik, kein Quiz)
- **F1 Stempeln:** 2 bis 4 große Stempel zur Auswahl („Bewilligt“, „Abgelehnt“, „Rücknahme“, „Widerruf“, „Satzung“ …). Antwort = Stempel auf die Akte schlagen (Animation).
- **F2 Rote Tinte:** Ein kurzes Schreiben, du **tippst die fehlerhafte Stelle** an (z. B. falsche Frist, fehlende Anhörung) und wählst ggf. die Fehlerart. Auch: Markieren von **Tatbestand** und **Rechtsfolge** in einem Gesetzessatz.
- **F3 Sortieren:** Ziehen in Fächer oder in eine Reihenfolge (Legitimationskette, Stufen eines Prüfschemas, Körperschaft/Anstalt, Gesetz/Verordnung/Satzung).
- **F4 Frist-Check:** Kalenderblatt oder zwei Datumsangaben: „Rechtzeitig?“ mit 3 Antworten. Die Rechnung steht im Denkweg.
- **F5 Praktikanten-Frage:** Ole fragt „Was ist eigentlich …?“. Du wählst aus **3 Erklärungen in einfacher Sprache** die richtige (die falschen sind typische Verwechslungen).
- **F6 Chefin-Stichprobe/Prüfung:** Frau Brandt sagt: „Erklären Sie mir …“. Du setzt die **Klausurformel aus Bausteinen** in die richtige Reihenfolge (mit 1 bis 2 Fallen-Bausteinen) oder füllst Lücken mit den Schlüsselbegriffen. Das trainiert das Auswendiglernen der Klausurantwort.

### 2.6 Stockwerke, Beförderung, Endgegner
Das Büro hat vier Stockwerke (= Kapitel in `ANTWORTEN.md`). Jedes Stockwerk hat einen **Aufzugsknopf** und eine **Beförderungsprüfung** (Boss: 10 gemischte Aufgaben, 3 Beschwerden erlaubt, F6 inklusive).
1. **Erdgeschoss „Post & Regeln“:** Allgemeines und Staatsstrukturprinzipien (Fragen 1 bis 11)
2. **1. Stock „Bürgerbüro“:** Grundrechte (12 bis 25)
3. **2. Stock „Bescheide“:** Verwaltungsrecht (27 bis 53)
4. **3. Stock „Widerspruchsstelle“:** Sozialprozessrecht (54 bis 59)
Titel nach Beförderung: Praktikant → Sachbearbeiter → Gruppenleiter → Abteilungsleiter → **Vorstand** (Abschluss mit kurzer Schlussszene). Ein Stockwerk ist freigeschaltet, wenn das vorige bestanden ist. Ab dann mischt der Tag alle freigeschalteten Regeln nach Fälligkeit.

### 2.7 Belohnungen (klein halten)
Sterne, Trinkgeld (Münzen) und Serie. Mit Münzen kaufst du **Büro-Deko** (6 bis 8 Gegenstände, z. B. Pflanze, Kaffeemaschine mit +5 Sekunden Geduld, Lampe, Poster). Sichtbarer Schreibtisch und Titel als Fortschritt. Kein Shop-Overkill, keine Werbung, keine Zahlungen.

### 2.8 Bewusst nicht
Kein Multiplayer, kein Login, kein Ton als Pflicht (Ton aus, optional an), keine Spracherkennung, keine Zufallsstürme von Pop-ups.

## 3. EINFACHE SPRACHE (Pflichtregel für alles, was der Spieler liest)
Alles muss für **jemanden ohne jede Rechtskenntnis sofort verständlich** sein. Gilt für Regelkarten, Fälle, Antwortoptionen, Feedback und Glossar. Ausnahme: die **Klausurformel** (formale Kurzantwort aus `ANTWORTEN.md`), die bewusst Fachsprache bleibt.

**Stilregeln**
- Niveau etwa **Klasse 8**. Kurze Sätze (Ziel höchstens 15, nie über 22 Wörter). Du-Form. Aktiv, konkret.
- **Fachbegriffe nur, wenn nötig**, und beim ersten Auftreten in Klammern oder per Glossar-Tipp erklärt. Jeder Fachbegriff im Text ist **antippbar** (gepunktet unterstrichen) und öffnet ein Mini-Fenster mit einer Erklärung in einem Satz plus Alltagsbeispiel.
- Abkürzungen ausschreiben oder erklären (G-BA, SGB, VA, GKV).
- **Alltagsbeispiele zuerst** (Schule, Kita, Fahrrad, Pizzeria, Fitnessstudio), dann das Rechtsbeispiel.
- Lesbarkeit prüfen (Abschnitt 7): Wiener Sachtextformel höchstens 8 für alle Texte außer der Klausurformel.

**Jede Regelkarte (eine pro Frage) besteht aus:**
1. **Titel in Alltagssprache** + Fachbegriff klein darunter.
2. **In einem Satz** (höchstens 20 Wörter): Was ist das?
3. **Warum gibt es das?** (1 bis 2 Sätze: Sinn und Zweck.)
4. **Alltagsbeispiel** (außerhalb des Rechts).
5. **So erkennst du es** (2 bis 4 Merkmale als Mini-Checkliste oder Entscheidungsfrage).
6. **Merktrick** (Eselsbrücke, Bild oder Reim).
7. **Klausurformel** (einklappbar, „Für die Prüfung“): Kurzantwort, Normen, Schlüsselbegriffe **unverändert aus `ANTWORTEN.md`**.

**Jedes Fall-Feedback hat immer dieselbe Form** (damit man „wie und warum“ lernt):
- ✅/❌ + Ergebnis in **einem Satz**.
- **Warum?** 1 bis 2 Sätze.
- **Denkweg** in 2 bis 3 nummerierten Mini-Schritten (z. B. „1. Wer handelt? Eine Behörde. 2. Regelt sie einen einzelnen Fall? Ja. 3. Also ist es ein Bescheid.“).
- Bei einer **falschen Antwort** zusätzlich: „**Warum nicht [gewählte Option]?**“, ein Satz pro gewählter Option (jede Option hat dafür ein Feld `warumNicht`).
- Button „Regel ansehen“.

**Musterbeispiel (Frage 38, Rücknahme vs. Widerruf):**
- Titel: „Bescheid wieder aufheben: Von Anfang an falsch oder später überholt?“ (Fachbegriff: Rücknahme und Widerruf)
- In einem Satz: „**Rücknahme:** Der Bescheid war schon beim Erlass falsch. **Widerruf:** Er war richtig, wird aber für die Zukunft aufgehoben.“
- Warum? „Die Kasse darf ihre Entscheidungen ändern. Sie muss aber klären, ob sie einen Fehler repariert oder auf eine neue Lage reagiert.“
- Alltag: „Die Lehrerin verrechnet sich bei der Note und korrigiert sie: **Rücknahme**. Die Schule erlaubt Handys in der Pause, ändert später die Hausordnung: **Widerruf**.“
- So erkennst du es: „Frage dich: War zum Zeitpunkt des Bescheids etwas falsch? Ja → Rücknahme. Nein → Widerruf.“
- Klausurformel: aus `ANTWORTEN.md`, Frage 38.

## 4. Datenmodell
Dateien: `data/regeln.json` (58 Regelkarten), `data/faelle.json` (Fälle), `data/glossar.json` (Fachbegriffe).

```json
// regeln.json: ein Objekt pro Frage; id = "q38" usw.
{
  "id": "q38", "nr": 38, "stockwerk": 3,
  "titel": "Bescheid wieder aufheben: Von Anfang an falsch oder später überholt?",
  "fachbegriff": "Rücknahme und Widerruf",
  "einSatz": "…", "warum": "…", "alltag": "…",
  "erkennen": ["…", "…"], "merktrick": "…",
  "klausur": { "kurzantwort": "…", "normen": ["§ 45 SGB X"], "schluesselbegriffe": ["…"], "bausteine": ["…", "…", "…"], "fallenBausteine": ["…"] },
  "verifiziert": true
}

// faelle.json: pro Regel mindestens 4 Fälle
{
  "id": "f038-2", "regelId": "q38", "stufe": 1,          // 0 bis 3
  "format": "F1",                                        // F1 bis F6
  "figur": {"name": "Herr Yilmaz", "emoji": "🧑‍🔧"},
  "akte": "Kurzer Text in einfacher Sprache.",
  "frage": "Was tut die Kasse?",
  "optionen": [
    {"text": "Rücknahme", "richtig": true,  "warumNicht": null},
    {"text": "Widerruf",  "richtig": false, "warumNicht": "Beim Erlass war nichts falsch, deshalb nicht Widerruf, sondern …"}
  ],
  "warum": "…", "denkweg": ["1. …", "2. …", "3. …"],
  "dauerSek": 20,
  "kombiRegeln": []                                       // nur Stufe 3: weitere Regel-IDs
}
```
Für F2 `markierbar` (Satzteile mit `fehler: true|false`, `fehlerart`), für F3 `fachfaecher` oder `reihenfolge`, für F4 `datumA`, `datumB`, `antwort`, `rechnung`, für F6 `bausteine` und `fallenBausteine` (aus `regeln.json`).

## 5. Inhalte erstellen
**Quelle:** `ANTWORTEN.md`. Kurzantwort, Normen und Schlüsselbegriffe **unverändert** in `klausur`. Die einfache Sprache (Titel, einSatz, warum, alltag, erkennen, Fälle) erfindest du **neu**, aber **inhaltlich deckungsgleich**. Mit ⚠ markierte Antworten bekommen `"verifiziert": false` und im Spiel einen dezenten Hinweis „bitte mit Skript abgleichen“. Fragen mit 📝 (fehlender Sachverhalt): eigene, typische Beispielfälle bilden.

**Mengen:** 58 Regelkarten · mindestens **4 Fälle pro Regel** (Stufe 0, Stufe 1, Stufe 2, Stufe 3), bei Abgrenzungen mindestens 6 · zusätzlich mindestens **20 Kniffelfälle** (Stufe 3, zwei Regeln gemischt) · mindestens **60 Glossar-Begriffe**. Jede Regel hat mindestens eine F6-Aufgabe (Bausteine). Fälle sollen **abwechslungsreich** sein (verschiedene Figuren, Berufe, Situationen), nicht nur Krankenkasse.

**Empfohlene Formate je Frage** (Richtschnur, mischen ist erwünscht):

| Fragen | Thema | Passende Formate |
|---|---|---|
| 1 | Öffentliches Recht vs. Privatrecht | F1 „Handelt hier der Staat als Staat?“, F5 |
| 2, 43 | Rechtsnorm, Tatbestand/Rechtsfolge | F2 Markieren, F1 |
| 3, 4, 5 | Auslegung, Analogie, Methoden | F1 (Schild „Fahrzeuge verboten“: Fahrrad?), F5, F6 |
| 6, 7, 42 | Vorrang und Vorbehalt des Gesetzes, Ermächtigung | F1 „Darf die Kasse das?“ |
| 8, 9, 10 | Legitimationskette, G-BA | F3 Kette bauen, F3 „Wer sitzt am Tisch?“, F5 |
| 11, 24 | Sozialstaat, Existenzminimum | F5, F1 |
| 12 bis 16 | Grundrechtsfunktionen, Schutzpflicht, Teilhabe, Schutzbereich, Eingriff | F3 Sortieren, F1 |
| 17, 18 | Schranken, Schranken-Schranken | F3, F2, F6 |
| 19 bis 23 | Berufsfreiheit, Drei Stufen, Handlungsfreiheit, Gleichheit | F1 „Welche Stufe?“, F3 |
| 25 | Nikolaus-Fall | F6 Checkliste (3 Häkchen), F1 |
| 27 bis 33 | Körperschaft, Anstalt, RVO, Satzung, Bund/Land | F3 Fächer, F1 |
| 34, 35, 36 | Verwaltungsakt, Durchsetzung, Handlungsformen | F2 (fehlt ein Merkmal → kein VA), F3 |
| 37 bis 41 | Aufheben, Heilung, Anhörung, Nichtigkeit | F1, F2 |
| 44 bis 49 | Ermessen, Beurteilung, gebunden, Soll, Kontrolle | F1, F3 |
| 50 bis 53 | Ermessensfehler, Verhältnismäßigkeit | F2 Rote Tinte, F1, F6 |
| 54 bis 56 | Fristen, Belehrung | F4 Frist-Check |
| 57 bis 59 | Klagearten, Rechtsschutz gegen Gesetz/Realakt | F1 „Welche Klage?“ |

**Fallgestaltung:** Jede falsche Option entspricht einer **typischen Verwechslung** (nicht Unsinn). Fälle der Stufe 0 haben genau eine eindeutige Lösung, die man mit der offenen Regelkarte findet. Jede Fall-Lösung muss sich allein aus der zugehörigen Regelkarte und `ANTWORTEN.md` ergeben.

## 6. Technik (iPhone-first)
- Dateien: `index.html`, `styles.css`, ES-Module, `data/*.json`, `manifest.webmanifest`, `sw.js`, Icons (per Skript erzeugt).
- **PWA:** `display: standalone`, Name „Bescheid, bitte!“, `apple-touch-icon` 180×180, Icons 192/512, Service Worker mit Cache-First und Versionsstring, **vollständig offline** nutzbar.
- **iOS:** `viewport-fit=cover`, `env(safe-area-inset-*)`, `100dvh`, `apple-mobile-web-app-capable`, Eingabeelemente ≥16 px, Touch-Ziele ≥44 px, Doppeltipp-Zoom und Pull-to-Refresh unterdrücken, **Pointer Events** für Ziehen (Stempel, Sortieren), nur Daumenzone für Hauptaktionen (Stempel unten). Kein Hover. Kein `navigator.vibrate`. Keine Spracherkennung.
- **Grafik und Animation:** HTML/CSS/SVG, CSS-Transitions und Web-Animations. Kein Game-Engine nötig. Originale, einfache Illustrationen (flach, warme Papierfarben, kräftige Stempelfarben), Emojis nur als Gesichter/Requisiten. Dark Mode optional.
- **Speicher:** `localStorage` plus `navigator.storage.persist()`, versioniert (`schemaVersion`), Schlüssel = Regel-ID und Fall-ID. **Backup-Code** (Fortschritt als Text exportieren/importieren) in den Einstellungen.
- **Barrierearm:** Kontrast AA, keine Information nur über Farbe, Textgröße anpassbar, Option „Zeitdruck aus“ (Geduldsbalken pausiert), damit auch konzentriertes Lesen möglich ist.

## 7. Qualitätstore (alles automatisch, vor jedem Deployment)
1. **Datenvalidierung** (Skript): 58 Regeln vollständig, jede mit ≥4 Fällen, Mengen aus Abschnitt 5 erreicht, alle Referenzen gültig, genau eine richtige Option je Fall (außer F3/F6), jede falsche Option hat `warumNicht`, jedes Fachwort im Text ist im Glossar.
2. **Lesbarkeit:** Wiener Sachtextformel ≤ 8 für Regelkarten (ohne Klausurformel), Fälle, Feedback, Glossar. Sätze > 22 Wörter markieren und kürzen.
3. **Laien-Test (Subagent ohne Rechtswissen):** Ein Agent bekommt **nur** die Regelkarten-Texte (ohne Klausurformel) und 25 zufällige Stufe-0- und Stufe-1-Fälle. Er löst sie und notiert jedes unverständliche Wort. **Ziel: ≥ 90 % richtig und keine unerklärten Fachwörter.** Bei Verfehlen: Texte überarbeiten und wiederholen. Ein zweiter Agent prüft **rechtliche Treue** gegen `ANTWORTEN.md` (Stichprobe 20 Regeln, 30 Fälle).
4. **Spiel-Test:** Playwright (WebKit, iPhone-Format 390×844) spielt jeden Fallformat-Typ und mehrere komplette Tage durch. Prüfen: erste Aktion in <10 Sekunden nach dem Öffnen, ein Tag in 3 bis 4 Minuten, Morgenbesprechung ≤ 60 Wörter, **sofortiges Feedback nach jeder Entscheidung**, Geduldsbalken, Regelbuch-Kosten, Beschwerden, Tagesende, Stufenaufstieg, Beförderung, Fortschritt nach Neuladen, Offline-Betrieb, Konsole fehlerfrei, nichts hinter Notch oder Home-Indikator.
5. **Selbstkritik-Runde:** Spiele zwei Tage selbst durch (Screenshots) und beantworte schriftlich in `DECISIONS.md`: Ist nach 30 Sekunden klar, was zu tun ist? Fühlt sich der Zeitdruck spannend an, nicht stressig? Ist das Feedback ein kleiner Belohnungsmoment? Sieht es nach **Spiel** aus oder nach Formular? Wenn eine Antwort „nein“ ist, bauen und neu prüfen.
6. Stichprobe: 10 zufällige Regelkarten gegen den Gesetzestext prüfen (WebSearch, gesetze-im-internet.de), Abweichungen nur melden, nicht eigenmächtig die Klausurformel ändern.

## 8. Deployment (ohne manuelle Schritte, soweit technisch möglich)
Erste funktionierende Option nehmen, nicht nachfragen:
1. `gh` angemeldet → Repo anlegen/aktualisieren, GitHub Pages aktivieren, URL per HTTP prüfen.
2. Sonst angemeldetes CLI für Netlify, Vercel oder Cloudflare Pages.
3. Sonst lokal bauen, `dist/` bereitstellen und im Abschlussbericht **genau einen** Befehl nennen (z. B. `gh auth login`), danach erneut deployen.
HTTPS ist Pflicht, Pfade relativ halten. **Dieselbe URL wie bei V1 weiterverwenden**, falls vorhanden, damit der Home-Bildschirm-Link bestehen bleibt (Service-Worker-Version erhöhen, Caches der V1 löschen).

## 9. Definition of Done
- [ ] Spiel „Bescheid, bitte!“ mit Tagesablauf, Fällen, Geduld, Regelbuch, Sternen, Beschwerden, Streak, Beförderungen
- [ ] F1 bis F6 spielbar, Stufen 0 bis 3 wirken, Wiederholungslogik aktiv
- [ ] 58 Regelkarten und die Mengen aus Abschnitt 5, alle in einfacher Sprache
- [ ] Glossar antippbar, Feedback immer mit Warum, Denkweg und „Warum nicht“
- [ ] Alle Qualitätstore aus Abschnitt 7 bestanden
- [ ] Offline und installierbar, Fortschritt persistent, Backup-Code
- [ ] Deployment-URL erreichbar, V1 im Branch gesichert
- [ ] `README.md` (kurz), `DECISIONS.md`
- [ ] **Abschlussbericht auf Deutsch, höchstens 8 Zeilen:** URL, iPhone-Installation (Safari → Teilen → Zum Home-Bildschirm), Ergebnis des Laien-Tests, Karten mit `verifiziert: false`, offene Punkte.

## 10. Meilensteine (in dieser Reihenfolge, nach jedem committen und deployen)
1. **Spielbarer Durchstich:** Schreibtisch, Schlange, Geduldsbalken, Stempel (F1), Regelbuch mit Kosten, Sterne, Beschwerden, Tagesende, mit **8 Platzhalter-Fällen** aus 3 echten Regeln (z. B. Fragen 38, 54, 50). Selbsttest nach Abschnitt 7 Punkt 5, ggf. nachschärfen, **erst dann weiter**.
2. Stufen 0 bis 3, Wiederholungslogik, Morgenbesprechung, Regelkarten-Ansicht, Glossar.
3. Weitere Formate: F2, F5, F4, F3, F6 (in dieser Reihenfolge).
4. **Alle Inhalte** (parallel pro Stockwerk), Kniffelfälle, Beförderungsprüfungen.
5. Büro-Deko, Feinschliff, Laien-Test und alle Qualitätstore, Deployment, Abschlussbericht.
