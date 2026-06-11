# AI Lead Qualification System

> Wiederverwendbarer Agentur-Baustein von **HK Growth Operator**.
> Analysiert eingehende Anfragen, kategorisiert und bewertet sie und übersetzt jeden Lead in einen konkreten nächsten Schritt — inklusive Antwortentwurf und CRM-fertigem Datensatz.

---

## 1. Projektziel

Jede eingehende Kundenanfrage (Formular, E-Mail, WhatsApp, Social Media, Telefonnotiz) wird innerhalb von Sekunden:

1. **analysiert** — Was will die Person wirklich?
2. **kategorisiert** — Welche Leistung wird angefragt?
3. **bewertet** — Lead-Score 0–100 + Temperatur (hot / warm / cold)
4. **übersetzt** — konkreter nächster Schritt, Antwortentwurf, interne Vertriebszusammenfassung

Das System ist als **Template** gebaut: einmal verstanden, kann es pro Kunde kopiert und in 1–2 Tagen angepasst werden (Branche, Leistungen, Scoring-Gewichte, Tonalität).

## 2. Problem, das gelöst wird

Kleine und mittelständische Unternehmen verlieren Aufträge nicht, weil die Leistung schlecht ist — sondern weil Anfragen liegen bleiben:

- Anfragen landen verstreut in E-Mail, Formular, WhatsApp und Instagram
- Niemand antwortet innerhalb der ersten Stunde (in der die Kaufbereitschaft am höchsten ist)
- Heiße Leads werden nicht von Preisvergleichern unterschieden — alle bekommen dieselbe (späte) Antwort
- Es gibt keinen Überblick: Wer wurde kontaktiert? Wer wartet? Wer ist verloren?

## 3. Zielgruppe

- **Intern:** HK Growth Operator — Qualifizierung der eigenen Agentur-Anfragen
- **Als Service:** KMU mit regelmäßigen Kundenanfragen, z. B. Handwerksbetriebe, Autohäuser/Werkstätten, Marketing-Agenturen, lokale Dienstleister, Online-Shops

## 4. Kernfunktionen

| Funktion | Datei | Beschreibung |
|----------|-------|--------------|
| Klassifikation | `src/classifyLead.js` | Erkennt Absicht, Kategorie, Budget, Dringlichkeit, fehlende Infos |
| Scoring | `src/scoreLead.js` | Deterministischer Score 0–100 mit Begründung pro Dimension |
| Nächster Schritt | `src/generateNextStep.js` | Übersetzt Score + Kontext in eine konkrete Handlung |
| Antwortentwurf | `src/generateReplyDraft.js` | Natürlicher, menschlicher Antwortvorschlag (kein KI-Sprech) |
| CRM-Format | `src/formatLeadForCRM.js` | Flacher Datensatz für Airtable / Notion / HubSpot / Pipedrive |
| Prompt-Vorlagen | `prompts/` | Produktionsreife Prompts für Claude/OpenAI mit JSON-Output |
| Workflow-Doku | `workflows/` | End-to-End-Prozess + 5 Branchen-Varianten |
| Angebot | `offer/service-offer.md` | Verkaufsfertiges 3-Paket-Angebot |

## 5. Beispielprozess

```
Anfrage trifft ein (z. B. Kontaktformular)
        ↓
classifyLead()  →  Kategorie: "website", Budget: "5k_10k", Dringlichkeit: "high"
        ↓
scoreLead()     →  Score: 82 / hot — "Budget genannt (+25), Deadline (+18), ..."
        ↓
generateNextStep() → "Innerhalb von 2 Stunden anrufen, Erstgespräch anbieten"
        ↓
generateReplyDraft() → persönlicher Antwortentwurf zur Freigabe
        ↓
formatLeadForCRM() → Datensatz landet in Airtable, Aufgabe für Vertrieb erstellt
```

Konkret durchspielen: `node src/run-demo.js` verarbeitet alle 8 Beispiel-Leads aus `data/example-leads.json` und zeigt jede Stufe.

## 6. Setup-Anleitung

**Voraussetzungen:** Node.js 18+ — keine weiteren Dependencies.

```bash
# 1. Projekt kopieren
cp -r ai-lead-qualification-system mein-kunde-x

# 2. Demo laufen lassen (rein lokal, keine API-Keys nötig)
cd mein-kunde-x
node src/run-demo.js

# 3. Einzelnen Lead testen
node src/run-demo.js --message "Hallo, wir brauchen dringend eine neue Website, Budget ca. 8000 Euro"
```

**Echte KI anbinden (optional):** In `src/classifyLead.js` und `src/generateReplyDraft.js` sind die Stellen mit `// INTEGRATION:` markiert. Dort den Mock durch einen API-Call ersetzen (Prompt aus `prompts/` verwenden). Details in `docs/03-integrationen.md`.

## 7. Anpassung für Kunden

Pro Kunde sind genau **vier Stellen** anzupassen:

1. **`src/config.js`** — Leistungskategorien, Budget-Schwellen, Scoring-Gewichte, Firmenname, Tonalität
2. **`prompts/*.md`** — Branchenkontext im Abschnitt "Rolle" austauschen (1 Absatz pro Prompt)
3. **`data/example-leads.json`** — 3–5 echte (anonymisierte) Anfragen des Kunden als Testfälle ergänzen
4. **`workflows/lead-qualification-workflow.md`** — passende Branchen-Variante als Basis nehmen

Faustregel: Anpassung für einen Neukunden = 0,5–2 Tage, je nach Integrationstiefe.

## 8. Monetarisierungsmodell

Details in `offer/service-offer.md`. Kurzfassung:

| Paket | Einmalig | Laufend | Zielkunde |
|-------|----------|---------|-----------|
| Basic Lead System | 1.500–2.500 € | — | Einstieg, ein Kanal |
| AI Lead Qualification System | 3.500–6.500 € | optional Wartung 150–300 €/Monat | KMU mit mehreren Kanälen |
| Sales Automation Retainer | Setup 2.500 € | 750–1.500 €/Monat | Wachstumskunden |

## 9. Grenzen des Systems

Ehrlichkeit verkauft besser als Übertreibung — diese Grenzen gehören auch ins Kundengespräch:

- **Kein Ersatz für Vertrieb.** Das System priorisiert und entwirft — abschließen muss ein Mensch.
- **Antwortentwürfe brauchen Freigabe.** Automatischer Versand ohne Review wird bewusst nicht empfohlen (Reputationsrisiko).
- **Klassifikation ist probabilistisch.** Unklare Anfragen werden als `unclear` markiert, nicht geraten — das ist Absicht.
- **Mock-Modus ≠ Produktiv.** Die mitgelieferte Keyword-Logik ist ein nachvollziehbarer Platzhalter; echte Qualität kommt erst mit LLM-Anbindung.
- **DSGVO:** Personenbezogene Daten in Anfragen. Bei LLM-Anbindung Auftragsverarbeitung klären (Anthropic/OpenAI AV-Vertrag, EU-Region wo möglich, keine Daten ins Training).

## 10. Nächste Ausbaustufen

1. **Auto-Reply mit Freigabe-Loop** — Entwurf per Slack/E-Mail zur 1-Klick-Freigabe an den Vertrieb
2. **Follow-up-Engine** — automatische Wiedervorlage nach 2/5/10 Tagen ohne Antwort, mit eskalierender Tonalität
3. **Kanal-Anbindung** — Webhook-Eingang für Formulare (Make/Zapier), E-Mail-Parsing, WhatsApp Business API
4. **Anbindung HK-Radar** — Outbound-Leads aus `HK-App-Handoff/lead-contract.schema.json` durch dieselbe Scoring-Pipeline schicken (Felder-Mapping in `docs/02-datenmodell.md`)
5. **Reporting** — Wochenreport: Leads pro Kanal, Conversion pro Temperatur, Antwortzeiten

---

## Projektstruktur

```
ai-lead-qualification-system/
├── README.md                  ← diese Datei
├── docs/
│   ├── 01-analyse-und-plan.md ← Geschäftsprozess-Analyse + Umsetzungsplan
│   ├── 02-datenmodell.md      ← Felddefinitionen, Enums, Score-Aufbau
│   └── 03-integrationen.md    ← Claude/OpenAI, Make/Zapier, Airtable/Notion
├── prompts/
│   ├── lead-classification-prompt.md
│   ├── lead-scoring-prompt.md
│   ├── reply-generation-prompt.md
│   └── sales-summary-prompt.md
├── workflows/
│   └── lead-qualification-workflow.md
├── data/
│   ├── lead-schema.json       ← JSON-Schema des Datenmodells
│   └── example-leads.json     ← 8 realistische Beispiel-Leads
├── src/
│   ├── config.js              ← EINZIGE Datei für Kunden-Anpassung der Logik
│   ├── classifyLead.js
│   ├── scoreLead.js
│   ├── generateNextStep.js
│   ├── generateReplyDraft.js
│   ├── formatLeadForCRM.js
│   └── run-demo.js            ← Pipeline-Demo über alle Beispiel-Leads
├── tests/
│   └── lead-tests.md          ← Testfälle + Kontrollpunkte
└── offer/
    └── service-offer.md       ← verkaufsfertiges 3-Paket-Angebot
```
