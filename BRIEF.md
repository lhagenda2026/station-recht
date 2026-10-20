# BRIEF: „Station Recht“ – Lernspiel-PWA für Recht im Gesundheitswesen (iPhone)

## 0. Auftrag in einem Satz
Baue autonom und schnell eine spielerische, offlinefähige Web-App (PWA, iPhone-first), mit der ein Student der Gesundheitsökonomie die 58 Fragen aus dem Anhang (Katalog „Recht im Gesundheitswesen“) samt Antworten auswendig lernt. Am Ende steht eine öffentlich erreichbare URL, die der Nutzer nur noch auf dem iPhone öffnet und „Zum Home-Bildschirm“ hinzufügt.

## 1. Arbeitsregeln (wichtig, bitte strikt befolgen)
1. **Keine Rückfragen an den Nutzer.** Bei Unklarheit die naheliegendste Entscheidung treffen, in `DECISIONS.md` in einer Zeile notieren, weiterarbeiten. Der Nutzer will manuell nichts tun.
2. **Tempo vor Perfektion.** Erst ein lauffähiger Durchstich (Lernkarte + Station + Speicherung), dann Spielmodi nacheinander, nach jedem Modus committen.
3. **Skills holen:** Zu Beginn verfügbare Skills prüfen und laden. Auf jeden Fall `frontend-design` (Skill-Tool) für den visuellen Look. Wenn Skills für PWA, Testing/Playwright oder Deployment vorhanden sind, ebenfalls laden. Fehlt etwas, selbst lösen, nicht den Nutzer fragen.
4. **Parallelisieren:** Die Inhaltserstellung (Abschnitt 4) darf auf Subagents verteilt werden, ein Agent pro Kapitel (4 Stück), während du das App-Gerüst baust. Schema aus Abschnitt 4 vorher festlegen, damit die Ergebnisse zusammenpassen.
5. **Kein Build-Zwang:** Vanilla HTML/CSS/JS (ES-Module), keine Frameworks, kein Bundler, keine npm-Abhängigkeiten zur Laufzeit. Alles muss statisch hostbar sein.
6. **Ehrlichkeit bei Inhalten:** Was nicht verifiziert werden konnte, bekommt `"verifiziert": false` und wird in der App dezent mit „bitte mit Skript abgleichen“ markiert.

## 2. Das Spielkonzept

**Rahmengeschichte:** Du bist Stationsarzt/-ärztin. Jede der 58 Fragen ist ein **Patient** (Wissens-Patient). Seine **Vitalwerte** sinken, wenn du lange nicht wiederholt hast, und steigen mit jedem richtigen Abruf. Ziel: Station stabil halten, alle Patienten „entlassen“ (= gelernt).

### 2.1 Kern: Station (Startbildschirm) + Lernlogik
- Startbildschirm = Klinikflur mit 4 Zimmern = 4 Kapitel (Allgemeines/Staatsstrukturprinzipien, Grundrechte, Verwaltungsrecht, Sozialprozessrecht). Jedes Zimmer zeigt Anzahl Patienten nach Zustand (kritisch/wackelt/stabil/entlassen) als farbige Punkte oder EKG-Linie.
- Großer Button **„Visite“** = Tagesqueue: max. 10 Karten, fällige zuerst, dann schwächste, dann neue. Das ist der Hauptweg. Dauer 3–5 Minuten.
- **Spaced Repetition (Leitner):** Boxen 0–5, Intervalle in Tagen `[0,1,2,5,12,30]`. Richtig = Box+1, falsch = Box 0 (oder −2 bei „wackelt“). Vitalwert = Funktion aus Box und Überfälligkeit (0–100 %).
- Eine zentrale Funktion `grade(cardId, result)` wird von allen Spielmodi aufgerufen. Kein Modus schreibt selbst in den Speicher.
- Gamification: XP, Tages-Streak, Station-Level, „Oberarzt-Visite“ als Kapitelboss (10 gemischte Karten aus einem Kapitel, 3 Leben), freigeschaltet, wenn ≥70 % des Kapitels in Box ≥3 sind. Sound standardmäßig aus, kleine CSS-Animationen und Konfetti statt Audio.

### 2.2 Pflicht-Modus: Lernkarte (Stufe 1 für jede neue Karte)
Frage groß, Tippen deckt die Antwort **in Häppchen** auf (Kurzantwort, dann Details). Darunter die **Schlüsselbegriffe als Chips**, die der Nutzer vor dem Aufdecken im Kopf abruft und danach antippt („hatte ich“). Anzahl getroffener Chips bestimmt die Bewertung: ≥80 % = „Sitzt“, 40–79 % = „Wackelt“, darunter = „Weg“. Zusätzlich Merksatz/Eselsbrücke. Damit ist jede der 58 Fragen auch ohne Spezialmodus lernbar.

### 2.3 Spielmodi (alle in Version 1)
**A) Triage-Notaufnahme (Abgrenzungen, Definitionen)**
Fälle erscheinen als Karte im Stapel, der Nutzer wischt/tippt sie in eine von 2–4 Boxen. Boxen je Set, z. B. `Gesetz | Rechtsverordnung | Satzung | Verwaltungsakt`, `Körperschaft | Anstalt`, `Nichtgebrauch | Überschreitung | Fehlgebrauch`, `Rücknahme | Widerruf`, `Anfechtungsklage | Verpflichtungsklage | Leistungsklage | Feststellungsklage`, `Entschließungs- | Auswahlermessen`. Timer wird mit jeder richtigen Antwort schneller, 3 Leben. Nach Fehler kurze Einblendung der Begründung (1 Satz). Jeder Fall verweist auf die zugehörige Karte (`kartenId`) für `grade()`.

**B) Zwei Wahrheiten, eine Lüge**
Drei Aussagen zu einem Begriff, eine ist subtil falsch (typisch: vertauschte Merkmale, falsche Frist, falsche Norm). Tippen auf die Lüge, danach Erklärung. Lügen entstehen aus den Verwechslungsfallen der Karte.

**C) Fristen-Bombe (Sozialprozessrecht, Fristen, Rechtsfolgen)**
Eine Bombe mit Zündschnur. Frage/Szenario oben, 3 Antwortkabel unten, richtiges Kabel durchtippen. Falsch = Schnur brennt schneller. Szenarien: Widerspruchsfrist, Klagefrist, Fristbeginn, Folge fehlerhafter Rechtsbehelfsbelehrung, Klageart-Wahl. 10 Bomben pro Runde.

**D) Schema-Tetris (Prüfungsschemata, wenn Zeit)**
Schritte eines Schemas (z. B. Schutzbereich → Eingriff → Rechtfertigung; Verhältnismäßigkeit; Ermessensfehler; Nichtigkeit VA) fallen als Blöcke, Nutzer sortiert per Tippen/Ziehen in die richtige Reihenfolge. Falscher Block bleibt liegen. Nur wenn A–C und die Qualitätskontrolle fertig sind.

Erste Version = Station + Lernkarte + A + B + C. D optional, danach.

## 3. Technik (iPhone-first)
- Dateien: `index.html`, `styles.css`, `app.js` (+ Module), `data/cards.json`, `manifest.webmanifest`, `sw.js`, Icons.
- **PWA:** Manifest (`display: standalone`, Name „Station Recht“, Theme-Color), `apple-touch-icon` 180×180 und Icons 192/512 (per Skript erzeugen, z. B. Python PIL oder Node-Canvas, kein manueller Schritt), Service Worker mit Cache-First und Versionsstring, vollständig **offline** nutzbar.
- **iOS-Details:** `viewport-fit=cover`, `env(safe-area-inset-*)`, `100dvh`, `apple-mobile-web-app-capable`, Eingabefelder ≥16 px (kein Auto-Zoom), `touch-action` setzen, Doppeltipp-Zoom verhindern, Overscroll/Pull-to-Refresh unterdrücken, Touch-Ziele ≥44 px, Daumenzone: Hauptaktionen unten. Kein Hover. `navigator.vibrate` gibt es auf iOS nicht, nicht verwenden. Spracherkennung ist auf iOS unzuverlässig, nicht einbauen.
- **Speicher:** `localStorage` (+ `navigator.storage.persist()` anfragen). Zusätzlich in den Einstellungen „Backup“: Fortschritt als Textcode kopieren/einfügen. Fortschritt ist versioniert (`schemaVersion`), damit spätere Kartenupdates Fortschritt nicht zerstören (Schlüssel = Karten-ID).
- **Look:** Skill `frontend-design` nutzen. Richtung: moderne Klinik/Monitor-Ästhetik, Dark Mode als Standard, ein starker Akzent (EKG-Grün oder Cyan), klare Typografie über Systemschrift oder ein eingebettetes Fontfile (keine externen CDNs, wegen Offline). Rechtstext muss auf kleinem Display gut lesbar sein (Zeilenlänge, Kontrast, Absatzabstand).
- Barrierearm: Kontrast AA, keine Information nur über Farbe (zusätzlich Icon/Form).

## 4. Inhalte: Karten erstellen (Kernaufgabe, hier entscheidet sich die Qualität)
**Verbindliche Quelle ist `ANTWORTEN.md`** (liegt neben dieser Datei, vom Nutzer geprüft und ggf. korrigiert). Sie enthält zu allen 58 Fragen Kurzantwort, Normen und Schlüsselbegriffe. Übernimm diese Inhalte **unverändert** in `kurzantwort`, `normen` und `schluesselbegriffe`; weiche inhaltlich nicht ab und verbessere sie nicht eigenmächtig. Du ergänzt nur das, was dort fehlt: `langantwort` (aus den Details der Datei), `eselsbruecke`, `luecken`, `triage`, `luegen`, `fristen`, `reihenfolge` und Beispielfälle für die mit 📝 markierten Fragen. Karten mit ⚠ in `ANTWORTEN.md` erhalten `"verifiziert": false`. Eine eigene Websuche ist nur für die Ergänzungen nötig (z. B. Beispielfälle, Lügen-Aussagen) und zur Absicherung von Normen, nicht um Antworten zu ersetzen. Weicht eine Norm im Gesetz erkennbar von `ANTWORTEN.md` ab, trage das in `DECISIONS.md` ein, ändere aber die Antwort nicht.

Ältere Hinweise zur Antworterstellung, nur für Lücken relevant:
- Grundlage: deutsches Recht (GG, SGB V, SGB X, SGG, VwVfG-Dogmatik), Stil: **klausurtauglich, knapp, auswendig lernbar**.
- Jede Antwort mit einschlägigen Normen. Zur Verifikation WebSearch/WebFetch nutzen, bevorzugt `gesetze-im-internet.de` und amtliche Quellen. Mehrere Fragen sind Fallfragen mit `[...]` (Sachverhalt fehlt im Katalog). Dafür **eigene, typische Beispielfälle** bilden, die zur Frage passen, und die Karte als „Beispielfall“ kennzeichnen.
- Orientierungspunkte (vor Verwendung prüfen): Widerspruchsfrist § 84 SGG, Klagefrist § 87 SGG, Folge fehlerhafter Belehrung § 66 Abs. 2 SGG; Verwaltungsakt § 31 SGB X; Anhörung § 24 SGB X; Nichtigkeit § 40 SGB X; Heilung § 41 SGB X; Rücknahme §§ 44–45, Widerruf § 47 SGB X; Gemeinsamer Bundesausschuss §§ 91 f. SGB V; Existenzminimum/Leistungsanspruch (Nikolaus-Beschluss BVerfG 2005, § 2 Abs. 1a SGB V); Gesetzgebungs- und Verwaltungskompetenzen Art. 30, 83 ff. GG.
- Kartenschema (JSON, pro Frage ein Objekt, Feld `id` = Fragennummer als String, z. B. `"q12"`):
```json
{
  "id": "q38", "kapitel": "verwaltungsrecht", "nr": 38,
  "typ": "abgrenzung",               // definition | abgrenzung | schema | fakt | fall
  "frage": "…",
  "kurzantwort": "max. 3 Sätze, lernbar",
  "langantwort": "Markdown, strukturiert",
  "schluesselbegriffe": ["…", "…"],   // 3–6, Basis für Chips und Bewertung
  "normen": ["§ 45 SGB X", "§ 47 SGB X"],
  "eselsbruecke": "…",
  "luecken": [{"text": "Rücknahme betrifft ___ Verwaltungsakte", "loesung": "rechtswidrige"}],
  "reihenfolge": {"titel": "…", "schritte": ["…"]},   // nur bei Schemata, sonst null
  "triage": [{"fall": "…", "set": "ruecknahme-widerruf", "richtig": "Widerruf", "grund": "…"}],
  "luegen": [{"aussagen": ["wahr","wahr","falsch"], "luege": 2, "erklaerung": "…"}],
  "fristen": [{"szenario": "…", "optionen": ["…","…","…"], "richtig": 0, "erklaerung": "…"}],
  "verifiziert": true
}
```
- Mindestmengen: jede Karte hat `kurzantwort`, `schluesselbegriffe`, `normen` (wo sinnvoll), `eselsbruecke`, mind. 1 Lücke. Insgesamt mind. 60 Triage-Fälle, 40 Lügen-Sets, 25 Fristen-Szenarien, sinnvoll verteilt auf die passenden Karten (Triage/Lüge vor allem Abgrenzungen und Definitionen, Fristen im Sozialprozessrecht).
- Fragen 25 und 57 sind Fallprüfungen: Antwort als kurzes **Gutachtenschema** (Obersatz, Voraussetzungen, Ergebnis) mit knapper Subsumtion.
- Daraus `data/cards.json` bauen, außerdem ein Validierungsskript (siehe 5).

## 5. Qualitätskontrolle (vollautomatisch, ohne den Nutzer)
1. **JSON-Validierung** per Skript: alle 58 Karten vorhanden, Pflichtfelder gefüllt, IDs eindeutig, Mengen aus Abschnitt 4 erreicht, jede `triage`/`luegen`/`fristen`-Referenz zeigt auf eine existierende Karte.
2. **Playwright (WebKit, Gerät „iPhone 14“ bzw. 390×844):** Jeden Screen aufrufen, Screenshots prüfen (kein Überlauf, nichts hinter Notch/Home-Indikator), Konsole fehlerfrei, je Spielmodus eine skriptgesteuerte Runde durchspielen, Fortschritt nach Reload noch da, Offline-Modus (Netz aus) funktioniert nach erstem Laden.
3. Inhaltlicher Stichproben-Check: 10 zufällige Karten gegen Gesetzestext gegenprüfen, Fehler korrigieren.
4. Lighthouse/PWA-Check, wenn verfügbar (installierbar, Offline, Manifest).

## 6. Deployment (ohne manuelle Schritte, so weit technisch möglich)
Reihenfolge, die erste funktionierende Option nehmen, nicht nachfragen:
1. `gh` authentifiziert → privates/öffentliches Repo anlegen, pushen, **GitHub Pages** aktivieren, URL abwarten und per HTTP-Abruf prüfen.
2. Sonst eingeloggtes CLI für Netlify, Vercel oder Cloudflare Pages (`netlify`, `vercel`, `wrangler`) → deployen.
3. Sonst lokal bauen, in `dist/` ablegen, lokalen Server starten, und im Abschlussbericht genau **eine** Zeile nennen, was der Nutzer einmalig tun muss (z. B. `gh auth login`), danach erneutes Deployment mit einem Befehl.
Die URL muss HTTPS sein (Voraussetzung für Service Worker). Pfade relativ halten (Pages-Unterpfad!).

## 7. Definition of Done
- [ ] 58 Karten, alle mit Antworten, Normen, Schlüsselbegriffen, Eselsbrücke
- [ ] Station, Visite, Leitner-Logik, XP/Streak, Oberarzt-Visite
- [ ] Lernkarte, Triage, Lüge, Fristen-Bombe (Tetris optional)
- [ ] Offline + installierbar auf iPhone, Fortschritt persistent, Backup-Code
- [ ] Alle Tests aus Abschnitt 5 grün
- [ ] Deployment-URL erreichbar
- [ ] `README.md` (kurz) und `DECISIONS.md`
- [ ] **Abschlussbericht an den Nutzer, max. 8 Zeilen, Deutsch:** URL, Installationsschritte auf dem iPhone („Safari → Teilen → Zum Home-Bildschirm“), welche Karten `verifiziert: false` sind, offene Punkte.

---

## ANHANG: Fragenkatalog (aus Screenshot übertragen)
Hinweise: Die Nummer 26 fehlt im Original, daher 58 Fragen. Der Wortlaut weniger Fragen (z. B. 33, 34) ist aus dem Screenshot übertragen und kann leicht abweichen, bitte sinngemäß behandeln. Mit `[...]` markierte Stellen sind im Original ausgelassene Sachverhalte.

### Kapitel „allgemein“: Allgemeines und Staatsstrukturprinzipien
1. Wie wird das Öffentliche Recht vom Privatrecht abgegrenzt?
2. Was ist eine Rechtsnorm und wie ist sie aufgebaut?
3. Was versteht man unter Auslegung einer Norm?
4. Was versteht man unter einer Analogie und welche Voraussetzungen hat sie?
5. Erörtern Sie die Methoden der Normauslegung.
6. Was bedeutet Vorrang des Gesetzes und wo gilt er?
7. Was bedeutet Vorbehalt des Gesetzes und wo gilt er?
8. Erörtern Sie die Vermittlung personeller demokratischer Legitimation für die Ausübung von Staatsgewalt.
9. Erörtern Sie, ob der Gemeinsame Bundesausschuss die erforderliche demokratische Legitimation besitzt.
10. Welche Aufgaben hat der Gemeinsame Bundesausschuss? Wie setzt er sich zusammen und welche Entscheidungen trifft er? (Nennen Sie dabei die einschlägigen Normen.)
11. Welche Rolle spielt im Rahmen des Sozialstaatsprinzips der Gesetzgeber?

### Kapitel „grundrechte“: Grundrechte
12. Welche Funktionen kann man bei den Grundrechten unterscheiden? Welche Funktion ist bis heute die bedeutendste?
13. Was versteht man unter einer grundrechtlichen Schutzpflicht? Geben Sie auch ein Beispiel.
14. Was versteht man unter einem derivativen Teilhaberecht? Geben Sie auch ein Beispiel.
15. Was ist der Schutzbereich eines Grundrechts?
16. Was wird unter dem modernen Eingriffsbegriff verstanden?
17. Beschreiben Sie die verschiedenen Schranken für Grundrechte. Nennen Sie zu jeder Schranke ein passendes Grundrecht.
18. Was wird unter „Schranken-Schranken“ verstanden?
19. Wofür ist bei der Berufsfreiheit die „berufsregelnde Tendenz“ von Bedeutung? Was versteht man unter subjektiver und objektiver berufsregelnder Tendenz? Nennen Sie für beide Formen auch ein Beispiel.
20. Auf welcher Stufe des Eingriffs (Drei-Stufen-Theorie) ist folgende Maßnahme zu verorten? [...] Begründen Sie Ihre Antwort.
21. Was ist die allgemeine Handlungsfreiheit und wo ist sie geschützt? Nennen Sie die grundrechtsdogmatische Funktion der allgemeinen Handlungsfreiheit.
22. Können Ungleichbehandlungen gerechtfertigt sein und falls ja, unter welchen Voraussetzungen?
23. Wo kommt der strengere Maßstab der „neuen Formel“ zur Anwendung?
24. Welche Postulate lassen sich aus den Grundrechten hinsichtlich der Gewährleistung des Existenzminimums ableiten? Welche Rolle spielt der Gesetzgeber?
25. Der gesetzlich versicherte A hat folgende Krankheit [...] und begehrt das nicht zum Leistungskatalog der GKV gehörende Arzneimittel [...]. Erörtern Sie, ob der A einen grundrechtlichen Leistungsanspruch gegenüber der Krankenkasse hat.

### Kapitel „verwaltungsrecht“: Verwaltungsrecht
27. Was versteht man im Öffentlichen Recht unter einer Körperschaft? Geben Sie auch ein Beispiel.
28. Was versteht man im Öffentlichen Recht unter einer Anstalt? Geben Sie auch ein Beispiel.
29. Was ist eine Rechtsverordnung?
30. Was versteht man im Verwaltungsrecht unter einer Satzung? Nennen Sie auch ein Beispiel.
31. Nach welcher allgemeinen Grundregel teilt das Grundgesetz die Kompetenzen von Bund und Bundesländern im Verwaltungsrecht zu? Welche speziellen Regelungen bestätigen die Grundregel für einzelne Kompetenzbereiche?
32. Sind für die Verwaltung vor allem die Bundesländer zuständig oder der Bund? Und warum ist das so?
33. Erörtern Sie, ob gesetzliche Krankenkassen zur Bundes- oder Landesverwaltung gehören. (Wortlaut sinngemäß)
34. Welche gesetzlichen Merkmale kennzeichnen einen Verwaltungsakt? Geben Sie zu jedem Merkmal eine Abgrenzung zu anderen Handlungsformen, zu denen das jeweilige Merkmal abgrenzt. (Wortlaut sinngemäß)
35. Wenn die Verwaltung einen Verwaltungsakt durchsetzen will: Muss sie dazu ein Gericht anrufen? Begründen Sie Ihre Antwort.
36. Welche Handlungsformen der Verwaltung gibt es neben dem Verwaltungsakt?
37. Mit welchen Mitteln kann die Verwaltung die Bestandskraft eines VA durchbrechen? Nennen Sie die einschlägigen Normen des SGB X.
38. Was ist der entscheidende Unterschied zwischen der Rücknahme und dem Widerruf von Verwaltungsakten?
39. Erläutern Sie, was mit der Heilung von Verfahrens- und Formfehlern im Sozialverwaltungsverfahren gemeint ist.
40. Wann ist die Anhörung des Betroffenen vor Erlass eines Verwaltungsakts grundsätzlich erforderlich? Und wo ist das normiert?
41. Sachbearbeiter S der Krankenkasse erlässt zu Gunsten des [...] einen Leistungsbescheid. Prüfen Sie, ob der Leistungsbescheid nichtig ist.
42. Was ist eine Ermächtigungsgrundlage und woraus folgt ihre Notwendigkeit?
43. Was gehört bei der folgenden verwaltungsrechtlichen Norm zum Tatbestand, was zur Rechtsfolge? [...]
44. Welche gesetzlich eingeräumten Handlungsspielräume der Verwaltung kennen Sie und wie sind diese beim Aufbau einer Norm zuzuordnen?
45. Folgt aus unbestimmten Rechtsbegriffen ein Handlungsspielraum der Verwaltung? Begründen Sie Ihre Antwort.
46. Erklären Sie den Unterschied zwischen Entschließungs- und Auswahlermessen.
47. Was versteht man unter einer gebundenen Entscheidung?
48. Was versteht man unter einer Sollvorschrift?
49. Prüfen die Verwaltungsgerichte das Vorliegen der Tatbestandsvoraussetzungen immer vollständig? Begründen Sie Ihre Antwort.
50. Was versteht man unter Ermessensnichtgebrauch? Geben Sie ein Beispiel.
51. Was versteht man unter Ermessensüberschreitung? Geben Sie ein Beispiel.
52. Was versteht man unter Ermessensfehlgebrauch? Geben Sie ein Beispiel.
53. Erläutern Sie, wie der Grundsatz der Verhältnismäßigkeit beim Ermessen berücksichtigt wird.

### Kapitel „sozialprozessrecht“: Sozialprozessrecht
54. Innerhalb welcher Frist ist grundsätzlich Widerspruch gegen einen Verwaltungsakt einzulegen?
55. Innerhalb welcher Frist ist grundsätzlich die Klage zu erheben?
56. Was passiert hinsichtlich der Klagefrist bei einer fehlerhaften oder unterlassenen Rechtsbehelfsbelehrung?
57. Das SGB V verbietet mit sofortiger Wirkung die Leistung von Arzneimitteln zur Raucherentwöhnung (§ 34 Abs. 1 Satz 8 SGB V). Kann der Raucher R gegen dieses Gesetz mit Widerspruch und/oder Anfechtungsklage vorgehen? Begründen Sie Ihre Antwort.
58. Welche Klageart ist zu wählen, wenn man den Erlass eines begünstigenden Verwaltungsakts begehrt? Begründen Sie Ihre Antwort.
59. Kann man gegen schlichtes Verwaltungshandeln mit einer Anfechtungsklage vorgehen? Begründen Sie Ihre Antwort.
