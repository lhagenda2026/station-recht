# Entscheidungen (je eine Zeile)

- Skill `frontend-design` war nicht installiert → per `npx skills add anthropics/skills@frontend-design` geholt und angewendet; Skills für PWA/Playwright/Deployment gab es nicht, selbst gelöst.
- Fragenwortlaut stammt aus dem Anhang von BRIEF.md (vollständiger), Kurzantwort/Normen/Schlüsselbegriffe wörtlich aus ANTWORTEN.md (automatisch geparst, Validator prüft Gleichheit).
- `kurzantwort` = Text der Kurzantwort-Zeile (bei Listen-Antworten inkl. direkt folgender Liste); `langantwort` = alle weiteren Zeilen der Antwort, unverändert.
- ⚠-Zeilen aus ANTWORTEN.md werden als „Hinweis“ unter den Details gezeigt statt im Antworttext; diese Karten sind `verifiziert: false`.
- Fehlt in ANTWORTEN.md die Normen-Zeile, werden nur die im Antworttext selbst genannten Normen übernommen; q1, q2, q3, q5, q16, q20, q28, q38, q44, q48, q51 nennen keine Norm und bleiben ohne.
- q51 hat in ANTWORTEN.md nur 2 Schlüsselbegriffe (Brief verlangt 3–6) → unverändert übernommen.
- Normabweichung § 37 Abs. 2 SGB X: aktuelle Fassung fingiert Bekanntgabe am vierten Tag, ANTWORTEN.md (q54) sagt dritter Tag → Antwort unverändert, q54 als nicht verifiziert markiert + Hinweis in der App; Datumsaufgaben so gewählt, dass beide Regeln dasselbe Fristende ergeben.
- Normabweichung § 41 SGB X: Abs. 1 hat sechs Nummern (Nr. 6 Hinzuziehung eines Beteiligten), Zeitgrenze Abs. 2 gilt für Nr. 2–6 → Hinweis an q39, Antwort unverändert.
- Normabweichung § 2 Abs. 1a SGB V: auch „wertungsmäßig vergleichbare“ Erkrankungen; „auf Indizien gestützt“ stammt aus dem Nikolaus-Beschluss → Hinweis an q25.
- § 91 Abs. 6 SGB V nimmt Beschlüsse nach § 136d von der Verbindlichkeit aus → Hinweis an q10.
- q56 (⚠): § 84 Abs. 2 SGG verweist tatsächlich auf §§ 66, 67 SGG → Hinweis bestätigt; Karte bleibt wegen ⚠ als nicht verifiziert markiert.
- § 66 Abs. 1 SGG nennt „Form“ nicht ausdrücklich als Belehrungsinhalt (q56) → keine Spielfrage dazu.
- Inhaltlicher Stichproben-Check: 17 Normen auf gesetze-im-internet.de geprüft (Liste in `content/*.json` → `stichprobe`), Abweichungen siehe oben.
- „Wackelt“ = Box −2 (min. 0), „Weg“ = Box 0, „Sitzt“ = Box +1, aber höchstens ein Aufstieg pro Karte und Tag, damit Spielrunden die Boxen nicht hochjagen.
- Spielmodi werten richtig = „Sitzt“, falsch = „Weg“; Fristen-Bombe nach Fehlschnitt aber richtig = „Wackelt“.
- Visite: fällige Karten, dann schwache (Vital < 70 %), dann neue – so kommen auch bei vielen gesehenen Karten neue dazu.
- Vitalwert: Basis je Box (18/40/58/74/88/100 %) minus 30 Punkte pro überzogenem Intervall; ungesehene Karten sind „neu“ (5. Zustand neben kritisch/wackelt/stabil/entlassen).
- Zimmerwert auf der Station = Mittel aller Vitalwerte, neue Karten zählen 0 %.
- Zusätzliche Triage-Sets (Schranken, Drei-Stufen, Auslegung, VA ja/nein usw.) neben den im Brief genannten, damit alle Kapitel bespielbar sind.
- Modus D umgesetzt als „Schema-OP“: Schritte antippen statt fallender Blöcke (einfacher und auf dem iPhone besser bedienbar).
- Oberarzt-Visite nutzt die objektiv auswertbaren Aufgaben (Triage, Lüge, Bombe) des Kapitels.
- Systemschrift (SF Pro / SF Pro Rounded für Zahlen) statt eingebetteter Fonts – offline sicher, auf iOS ideal.
- Safe-Area kann Playwright nicht emulieren; abgesichert über `env(safe-area-inset-*)` im CSS, geprüft per Screenshot im 390×844-Format.
- Lighthouse nicht ausgeführt (braucht Chrome); PWA-Kriterien (Manifest, Icons, SW, Offline) per Playwright-Test geprüft.
- GitHub Pages braucht bei kostenlosen Konten ein öffentliches Repo → Repo `station-recht` öffentlich angelegt (die App-Inhalte sind über die URL ohnehin öffentlich).

# Version 2: „Bescheid, bitte!“ (je eine Zeile)

- V1 im Branch `v1-karteikarten` gesichert; V2 neu auf eigenem Branch `v2` gebaut (Git-Worktree `.v2`), weil parallel ein zweiter, abgebrochener Lauf in den Hauptordner schrieb; am Ende ersetzt `v2` den Branch `main` (Freigabe des Nutzers: „überschreibe einfach das Spiel aus den ersten Anläufen“).
- Meilensteine werden auf `v2` committet und gepusht; Live-Deployment (GitHub Pages aus `main`) einmal am Ende, damit der parallele Lauf nicht dazwischenfunkt.
- Fragenwortlaut jetzt aus den Überschriften von ANTWORTEN.md (BRIEF.md ist obsolet); 📝-Zeichen entfernt.
- Normen nur aus der Normen-Zeile von ANTWORTEN.md; fehlt sie, stehen die Normen im Kurzantwort-Text (keine eigene Extraktion mehr).
- Design: Amtsstube der 70er (Mintwand #b9c9b6, Linoleum-Tisch, gelbe Aktenmappe, Stempelfarben Blau/Rot/Petrol/Violett/Ocker), Akten in „American Typewriter“, Stempel in „Avenir Next Condensed“ – alles iOS-Systemschriften, offline sicher.
- „Tage“ im Leitner-System = Spieltage (nicht Kalendertage), damit man mehrere Tage am Stück spielen kann; Serie (Streak) zählt dagegen Kalendertage.
- Geduld: Stufe 0 ohne Zeitdruck, Stufe 1 = 30 s, Stufe 2 = 22 s, Stufe 3 = 18 s (+ Zuschlag für aufwendige Formate, +5 s Kaffeemaschine). Läuft die Geduld ab, gibt es höchstens 1 Stern, aber keine Beschwerde (Zeit ist kein Rechtsfehler).
- Sterne: ≥50 % Geduld übrig = 3, >15 % = 2, sonst 1; Regelbuch aufgeschlagen = höchstens 2 und Geduld sinkt 1,6-mal so schnell. Trinkgeld = 2 Münzen je Stern.
- Regelbuch ist auf allen Stufen verfügbar (mit Kosten), damit man nie festhängt; „Tipp“ (kostenlos) nur auf Stufe 1.
- Glossar-Fenster pausiert den Geduldsbalken, damit Nachschlagen von Wörtern nicht bestraft wird.
- Neue Regel bekommt am Einführungstag zwei Plätze; heute schon gespielte Fälle werden nicht wiederholt (sonst Fall der nächsthöheren Stufe).
- Fall-Feld `ergebnis` (ein Satz) ergänzt, damit das Feedback immer „✅/❌ + Ergebnis in einem Satz“ zeigen kann.
- `fallenBausteine` sind Objekte `{text, warumNicht}` statt reiner Texte, damit auch die Chefin-Stichprobe ein „Warum nicht?“ zeigen kann.
- Fachwörter werden im Text als `[[Wort]]` bzw. `[[Anzeige|glossar-id]]` ausgezeichnet; der Validator verlangt, dass jedes Glossarwort einer Leseeinheit mindestens einmal markiert ist.
- Fristfälle zu q54 so datiert, dass „dritter Tag“ (ANTWORTEN.md) und „vierter Tag“ (aktuelles § 37 II SGB X) dasselbe Ergebnis liefern; Fristenden nie am Wochenende.
- Stockwerke ohne Inhalte gelten bei der Freischaltung als durchlässig (nur für den Durchstich relevant).

## Selbstkritik nach Meilenstein 1 (zwei Tage gespielt, Screenshots WebKit 390×844)
- Nach 30 Sekunden klar, was zu tun ist? Ja: Frau Brandt erklärt in drei Sätzen, der Startknopf ist sofort sichtbar (nach ~0,3 s), die Stempel liegen in der Daumenzone.
- Zeitdruck spannend statt stressig? Stufe 0 ohne Druck, ab Stufe 1 läuft der Balken, die Schlange wächst sichtbar; Glossar pausiert. Ja.
- Feedback ein Belohnungsmoment? Stempelschlag, Gesicht reagiert, Münzen fliegen bzw. Beschwerdezettel; danach der Zettel mit Warum/Denkweg. Ja.
- Spiel oder Formular? Spiel: Schalter mit Kunden und Schlange, Akte auf dem Tisch, physische Stempel.
- Nachgeschärft: Akte vor die offene Regelkarte (Akte war unter dem Falz), kompakte Karte kleiner, Stempelleiste flacher, kein doppelter Fall am selben Tag, keine Linien quer durch die Schrift, keine Prüfung für leere Stockwerke.
- Inhalte mit 5 statt 4 Subagents erstellt: Stockwerk 3 (Fragen 27–53, 27 Regeln) in zwei Hälften (q27–q41, q42–q53) geteilt, damit kein Agent über 150 Fälle schreiben muss.
- Inhalte: Rohfassung der 58 Regeln/359 Fälle aus dem parallelen Lauf übernommen (gleicher Brief, fast gleiches Schema), automatisch ins V2-Schema überführt, Fachwörter maschinell markiert und von 5 Agenten gegen alle Qualitätstore nachgebessert – spart Kontingent, Ergebnis muss dieselben Prüfungen bestehen.
- F1-Fälle mit Antworten über 4 Wörter erscheinen als Antwortzettel statt Stempel (besser lesbar); Texte in Knöpfen (Stempel, Sortierkarten, antippbare Stellen) enthalten keine Glossar-Knöpfe, das Fachwort wird an anderer Stelle im Fall erklärt.
- F2 kann einen zweiten Schritt „Fehlerart wählen“ haben (Brief 2.5: „und wählst ggf. die Fehlerart“); richtig nur, wenn Stelle und Fehlerart stimmen.
- Agent-Hinweise zur Prüfung mit dem Skript: f019-5 (⚠ q19, Tätowierer-Hygieneregel als subjektiv berufsregelnd), f009-5 (⚠ q9, nur BSG bejaht), f003-5 (Tretroller als „Fahrzeug“ = eigene Deutung), f056-0/k056-1 (Jahresfrist beim Widerspruch beruht auf ⚠ q56).
- F4-Fälle f054-4 und f055-2 liegen bewusst 2 Tage vor Fristende (Kniff „ab Posttag gerechnet wäre es zu spät“); mit 3. und 4. Tag gleiches Ergebnis geprüft.
- Rechtstreue-Stichprobe (Agent, 20 Regeln/30 Fälle): 18/20 und 26/30 ohne Befund. Korrigiert: f053-2 (Kasse kann Pflichtmitgliedschaft nicht beenden → Leistungsstopp als Druckmittel; nur „nicht erforderlich“ richtig), q41/f041-4 („befangen“ → „ausgeschlossen“, § 40 III Nr. 2 SGB X), f019-5 und f050-3 präziser formuliert.
- Normstichprobe (10 Regeln, gesetze-im-internet.de): nur Abweichung q31 – Bundesoberbehörden stehen in Art. 87 III, nicht Art. 87 I GG → Hinweis an der Karte, Kurzantwort unverändert. q57: „§ 54“ steht so in ANTWORTEN.md (gemeint § 54 I SGG) → Hinweis, unverändert.
- Laien-Test Runde 1 ungültig: In allen 25 Fällen war die richtige Antwort A (Inhalte listen sie zuerst) → Antworten werden jetzt bei jeder Anzeige gemischt; Test wiederholt.
- Laien-Test Runde 2 (neuer Agent ohne Rechtswissen, 25 zufällige Stufe-0/1-Fälle, gemischte Antworten): 25/25 richtig (100 %). Gemeldete unklare Wörter (Erlass, Rechtsbehelf, Kur, Leistung, AöR, „Inhalt, Zweck und Ausmaß“, Geschäftsstelle) danach erklärt bzw. ersetzt; Runde 1 hatte bereits 25 weitere Wörter geliefert, die überarbeitet wurden.

## Selbstkritik nach Meilenstein 4 (zwei Tage mit echten Inhalten, Screenshots)
- Nach 30 Sekunden klar? Ja: Startknopf nach ~0,4 s, Tag 1 führt drei Regeln mit offener Karte ein.
- Zeitdruck spannend, nicht stressig? Ja: Einarbeitung ohne Balken, danach 30/22/18 s plus Formatzuschlag; Zeitdruck in den Einstellungen abschaltbar.
- Feedback ein Belohnungsmoment? Ja: Stempel, Münzen, Gesicht, Sterne; danach Warum, Denkweg, „Warum nicht“.
- Spiel oder Formular? Spiel. Nachgeschärft: Antworten gemischt (vorher stand die richtige immer oben), F3-Fächer ohne verschachtelte Knöpfe, F2-Fehlerart untereinander, Ole-Etikett vor der Frage.
- Ein Tag hat 9–10 Fälle; bei 15–25 s je Fall plus Morgen und Feierabend ergibt das 3–4 Minuten.
