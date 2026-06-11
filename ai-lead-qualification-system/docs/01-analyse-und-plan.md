# Phase 1 — Analyse des Geschäftsprozesses & Umsetzungsplan

## 1. Geschäftsprozess-Analyse

### 1.1 Wo kommen Leads typischerweise her?

| Kanal | Typische Form | Besonderheit |
|-------|---------------|--------------|
| `website_form` | Kontaktformular | strukturiert, aber oft knapp |
| `email` | Freitext-Mail | unstrukturiert, oft mit Anhängen/Verlauf |
| `whatsapp` | Kurznachricht | informell, fragmentiert, schnelle Antwort erwartet |
| `social_dm` | Instagram/Facebook/LinkedIn DM | sehr knapp, oft nur Interessenssignal |
| `phone_note` | Telefonnotiz eines Mitarbeiters | lückenhaft, abhängig vom Notierenden |
| `referral` | Empfehlung / Weiterleitung | hohe Abschlusswahrscheinlichkeit, Kontext fehlt oft |
| `hk_radar` | HK-App Lead-Radar (Outbound) | bereits vorqualifiziert nach Lücken-Score (siehe `HK-App-Handoff/`) |
| `marketplace` | Portale (z. B. MyHammer, mobile.de-Anfragen) | Preisvergleichs-lastig |

**Konsequenz fürs Design:** Das System nimmt als kleinsten gemeinsamen Nenner `source` + `original_message` + optionale Kontaktdaten entgegen. Alles Weitere wird extrahiert — so funktioniert dieselbe Pipeline für alle Kanäle.

### 1.2 Welche Informationen müssen aus einer Anfrage extrahiert werden?

1. **Wer fragt an?** — Name, Firma, E-Mail, Telefon
2. **Was wird gewollt?** — `detected_intent` (Freitext) + `category` (Enum)
3. **Wie ernst ist es?** — `budget_range`, `urgency`, `decision_stage`
4. **Was genau wird gebraucht?** — `extracted_requirements` (Liste)
5. **Was fehlt?** — `missing_information` (Liste) → steuert die Rückfragen im Antwortentwurf

### 1.3 Welche Kategorien sind sinnvoll?

Kategorien müssen (a) zum Leistungsangebot passen und (b) eine Restklasse haben, damit nichts falsch einsortiert wird:

`website` · `social_media` · `recruiting` · `ecommerce` · `local_service` · `marketing_general` · `price_inquiry` · `unclear` · `other`

`price_inquiry` ist bewusst eine eigene Kategorie: Preisvergleicher brauchen eine andere Antwortstrategie (Wert kommunizieren, nicht rabattieren) und dürfen den Vertrieb nicht von heißen Leads ablenken.

Pro Kunde werden die Kategorien in `src/config.js` ausgetauscht — die Pipeline bleibt identisch.

### 1.4 Wie ist der Lead-Score aufgebaut?

Score = Summe aus 6 Dimensionen, max. 100 Punkte. Deterministisch und begründbar — der Kunde muss jedem Score vertrauen können:

| Dimension | Max. Punkte | Logik |
|-----------|-------------|-------|
| Budget | 25 | genanntes/hohes Budget = mehr Punkte; **kein genanntes Budget = neutraler Mittelwert (10), keine Bestrafung** |
| Dringlichkeit | 20 | Deadline/„dringend“ = hoch; „irgendwann“ = niedrig |
| Service-Fit | 20 | Kategorie = Kernleistung? `unclear`/`price_inquiry` = wenig |
| Entscheidungsphase | 15 | `ready_to_buy` > `comparing` > `researching` > `unknown` |
| Kontaktdaten | 10 | E-Mail + Telefon = 10; nur eines = 5; nichts = 0 |
| Klarheit | 10 | konkrete Anforderungen formuliert? |

**Temperatur:** `hot` ≥ 70 · `warm` 40–69 · `cold` < 40.

Wichtige Designentscheidung: **Fehlendes Budget senkt den Score nur moderat** (10 statt 0–25 Punkte). Viele exzellente Leads nennen kein Budget — sie dürfen nicht hinter Preisvergleicher mit Budgetangabe rutschen.

### 1.5 Welche nächsten Schritte schlägt das System vor?

| Situation | Empfohlener Schritt |
|-----------|---------------------|
| hot + Telefon vorhanden | **Anruf innerhalb von 2 Stunden**, Erstgespräch anbieten |
| hot ohne Telefon | sofortige E-Mail mit 2 konkreten Terminvorschlägen |
| warm | persönliche Antwort am selben Werktag + gezielte Rückfragen zu `missing_information` |
| cold, aber klare Anfrage | Standardantwort + Info-Material, Wiedervorlage in 7 Tagen |
| `price_inquiry` | Wert-Argumentation senden, nicht in Preisverhandlung einsteigen, Wiedervorlage 5 Tage |
| `unclear` | kurze freundliche Rückfrage mit max. 2 konkreten Fragen — keine Annahmen treffen |

---

## 2. Umsetzungsplan

### 2.1 Ordnerstruktur

Siehe README — `docs/`, `prompts/`, `workflows/`, `data/`, `src/`, `tests/`, `offer/`. Jeder Ordner ist eigenständig nutzbar: Prompts funktionieren ohne den Code, der Code ohne echte API.

### 2.2 Datenmodell

22 Felder, definiert in `docs/02-datenmodell.md` + maschinenlesbar in `data/lead-schema.json`. Enums für alles, was gefiltert/sortiert werden muss (`category`, `urgency`, `lead_temperature`, `status`, …), Freitext nur wo nötig.

### 2.3 Prompt-Architektur

Vier spezialisierte Prompts statt eines Mega-Prompts — jeder mit Rolle, Ziel, Input-/Output-Format (JSON), Regeln, Beispielen und Fehlerfällen:

```
original_message ──→ [1] Klassifikation ──→ strukturierter Lead
                              │
                              ▼
                     [2] Scoring (0–100 + Begründung)
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
     [3] Antwortentwurf            [4] Vertriebs-Summary
     (extern, kundengerichtet)     (intern, 30 Sekunden lesbar)
```

Trennung deshalb: Klassifikation und Scoring brauchen niedrige Temperatur und striktes JSON; der Antwortentwurf braucht Sprachgefühl. Getrennte Prompts = getrennt optimierbar, getrennt testbar.

### 2.4 Automationslogik

Pures Node.js ohne Dependencies (`src/`). Scoring und Next-Step sind **echte, deterministische Logik** (kein Mock — die läuft so in Produktion). Klassifikation und Antwortentwurf sind **Mocks mit Keyword-Heuristik**, deren Austauschstellen mit `// INTEGRATION:` markiert sind.

### 2.5 Mögliche Cloud-Integrationen

| Baustein | Werkzeug | Rolle |
|----------|----------|-------|
| KI-Analyse | Claude API (empfohlen) oder OpenAI | Klassifikation, Antwortentwurf, Summary |
| Eingang | Make / Zapier Webhook | Formular/E-Mail/WhatsApp → Pipeline |
| CRM | Airtable (Start) / Notion / HubSpot / Pipedrive | Lead-Datensatz + Status |
| Benachrichtigung | Slack / E-Mail | „Heißer Lead“-Alarm + Aufgabe für Vertrieb |
| Follow-up | Make Scheduler | Wiedervorlagen nach 2/5/10 Tagen |

Details und konkrete Felder-Mappings: `docs/03-integrationen.md`.

### 2.6 Umsetzungsreihenfolge (für Kundenprojekte)

1. Tag 1 vormittags: `config.js` + Kategorien + Beispiel-Leads des Kunden
2. Tag 1 nachmittags: Prompts auf Branche anpassen, gegen Beispiel-Leads testen (`tests/lead-tests.md`)
3. Tag 2: Eingangskanal (Webhook) + CRM-Anbindung + Slack-Alarm
4. Abnahme: alle Testfälle aus `tests/lead-tests.md` mit echten anonymisierten Anfragen durchspielen
