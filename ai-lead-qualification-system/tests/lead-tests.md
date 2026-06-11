# Testfälle & Kontrollpunkte

Alle Tests sind manuell mit `node src/run-demo.js` durchspielbar (Mock-Modus) und gelten unverändert für die LLM-Variante. Bei Kundenprojekten: vor Abnahme alle Fälle zusätzlich mit 5–10 echten (anonymisierten) Anfragen des Kunden durchspielen.

**Stand 2026-06-11: alle 7 Kerntests im Mock-Modus bestanden** (Ergebnisse unten dokumentiert).

---

## T1 — Heißer Lead wird korrekt erkannt

- **Input:** Lead `lq_20260611_h1z5` (Autohaus Vogt: Budget freigegeben, Deadline 6 Wochen, Entscheidung diese Woche, Telefon + E-Mail)
- **Erwartet:** Score ≥ 70, `lead_temperature: hot`, nächster Schritt = Anruf innerhalb 1 Stunde, zugewiesen an Inhaber (nicht Pool)
- **Ergebnis Mock:** ✅ 93/100, hot, "Innerhalb von 1 Stunde anrufen", assigned_to: haris
- **Kontrollpunkt:** Ein hot-Lead darf NIE im Standard-Antwortpfad landen.

## T2 — Unklare Anfrage wird als unklar markiert

- **Input:** Lead `lq_20260610_x4j7` ("Was machen Sie denn genau alles? Können Sie Unterlagen schicken?")
- **Erwartet:** `category: unclear`, Score < 40, nächster Schritt = max. 2 Rückfragen, KEINE Leistungsliste, KEINE erfundene Kategorie
- **Ergebnis Mock:** ✅ 35/100, cold, unclear, Rückfrage-Entwurf mit genau 2 Fragen
- **Kontrollpunkt:** Lieber `unclear` als geraten — falsche Kategorie = falsche Antwort = verbrannter Lead.

## T3 — Fehlende Telefonnummer wird erkannt

- **Input:** Lead `lq_20260608_k2m4` (Müller Maschinenbau: nur E-Mail)
- **Erwartet:** "Telefonnummer" in `missing_information`, Kontaktdaten-Dimension 5/10, Rückfrage nach Telefonnummer fließt in Antwort/Next-Step ein
- **Ergebnis Mock:** ✅ "Fehlt: Telefonnummer", contact_quality 5/10, Next-Step fragt gezielt nach
- **Kontrollpunkt:** `missing_information` steuert die Rückfragen — sie darf nichts auflisten, was in der Nachricht steht.

## T4 — Hohes Budget erhöht den Score

- **Input:** identische Anfrage einmal ohne Budget, einmal mit "15.000–20.000 Euro" (vgl. Lead `lq_20260609_t5n2`)
- **Erwartet:** Budget-Dimension steigt von 10 auf 22 Punkte, Gesamtscore +12
- **Ergebnis Mock:** ✅ Weber Naturkosmetik: budget 22/25 statt 10/25
- **Kontrollpunkt:** Budget wirkt nur über die Budget-Dimension — es darf keine versteckten Mehrfach-Effekte geben.

## T5 — Fehlendes Budget senkt den Score nicht zu stark

- **Input:** Lead `lq_20260609_w3r8` (Pflegedienst: dringender Recruiting-Bedarf, KEIN Budget genannt)
- **Erwartet:** trotz `budget_range: unknown` Score ≥ 70 (hot) — `unknown` gibt den neutralen Mittelwert 10/25, nicht 0
- **Ergebnis Mock:** ✅ 72/100, hot — Budget 10/25 ("neutraler Mittelwert, keine Bestrafung")
- **Kontrollpunkt:** Der wichtigste Fairness-Test des Scorings. Schlägt er fehl, rutschen exzellente Leads hinter Preisvergleicher.

## T6 — Dringende Anfrage wird priorisiert

- **Input:** Pflegedienst (`high`, "möglichst bald") vs. Weber Naturkosmetik (`low`, "nächstes Jahr") — fachlich beide stark
- **Erwartet:** Dringlichkeit 16/20 vs. 4/20; der dringende Lead landet trotz fehlendem Budget VOR dem budgetstarken ohne Eile; `critical` (harte Deadline) verkürzt die Anruf-Frist auf 1 Stunde
- **Ergebnis Mock:** ✅ Pflegedienst 72 (hot) > Weber 62 (warm); Autohaus (critical) → 1-Stunden-Frist
- **Kontrollpunkt:** "dringend" ohne Datum = high, NICHT critical — critical erfordert eine harte Frist.

## T7 — Antwort bleibt professionell und menschlich

- **Input:** alle 8 `suggested_reply`-Entwürfe aus `data/example-leads.json`
- **Erwartet:** Jeder Entwurf (a) greift ein konkretes Detail der Anfrage auf, (b) hat genau EINEN Call-to-Action, (c) enthält keine der verbotenen Floskeln aus `prompts/reply-generation-prompt.md` (Regel 4), (d) erfindet keine Fakten (Referenzen, Preise), (e) max. ein Ausrufezeichen
- **Prüfung:** Floskel-Check ist mechanisch (Strg+F auf die Verbotsliste), Rest per Lesen — Frage an sich selbst: "Würde ich das so abschicken?"
- **Ergebnis:** ✅ kuratierte Beispiel-Entwürfe bestehen; Mock-Bausteine bestehen den Floskel-Check, wirken aber generischer (dokumentierte Mock-Grenze — LLM-Variante übernimmt das in Produktion)
- **Kontrollpunkt:** Bei Preisvergleichern (T-Fall `lq_20260611_f6d9`): Antwort argumentiert Wert, bietet KEINEN Rabatt an und bleibt respektvoll.

---

## Weitere Kontrollpunkte (Regression bei jeder Anpassung)

| # | Prüfung | Warum |
|---|---------|-------|
| K1 | Summe der 6 Dimensionen = `lead_score`, Maxima ergeben 100 | Scoring-Integrität nach Gewichts-Änderungen in `config.js` |
| K2 | Temperatur-Schwellen exakt: 70 → hot, 69 → warm, 40 → warm, 39 → cold | Randwerte sind die häufigste Fehlerquelle |
| K3 | Leere Nachricht / nur "Hallo" → `unclear`, kein Crash | Robustheit am Eingang |
| K4 | Spam/Dienstleister-Akquise → kein Antwortentwurf, Score 0 (LLM-Variante) | Vertrieb nicht mit Müll fluten |
| K5 | Kein Feld im CRM-Datensatz ist `undefined`/`null` (immer "" oder Wert) | Make/Zapier-Mappings brechen sonst |
| K6 | `suggested_reply` wird NIE automatisch versendet | Wichtigste Sicherheitsregel des Systems |

## Abnahme-Checkliste für Kundenprojekte

- [ ] T1–T7 mit den Beispieldaten bestanden
- [ ] 5–10 echte anonymisierte Anfragen des Kunden korrekt klassifiziert (Kunde bestätigt: "ja, so hätte ich die auch eingeordnet")
- [ ] 3 Antwortentwürfe vom Kunden gegengelesen: "klingt nach uns"
- [ ] Hot-Alarm kommt innerhalb von 1 Minute nach Webhook-Eingang an
- [ ] CRM-Datensatz vollständig, Views (Hot/Warm/Cold) filtern korrekt
