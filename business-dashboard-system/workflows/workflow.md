# Phase 8 — Workflow

## Hauptablauf

```
┌──────────────┐   ┌───────────┐   ┌────────────┐   ┌───────────────┐   ┌────────────────────┐
│ Datenquellen │ → │ Sammlung  │ → │ Dashboard  │ → │ AI-Auswertung │ → │ Management-Report  │
│ CRM/GA4/...  │   │ collect   │   │ prepare... │   │ interpret()   │   │ Weekly/Monthly/CEO │
└──────────────┘   └───────────┘   └────────────┘   └───────────────┘   └────────────────────┘
```

1. **Datenquellen:** CRM (HubSpot/Pipedrive), Website-Analytics (GA4), Buchhaltung
   (Lexoffice/DATEV), Social-Tools. Jede liefert in das Monatsformat.
2. **Sammlung:** `collectMetrics()` normalisiert und erkennt Datenlücken.
3. **Dashboard:** `prepareDashboardData()` formt Serien, Kacheln und Trichter.
4. **AI-Auswertung:** `interpret()` plus Engpass-Erkennung liefern Bedeutung und
   Empfehlungen (Prompts in `/prompts`).
5. **Management-Report:** Wochen-, Monats-, CEO-, Vertriebs- und Marketingreport
   (Vorlagen in `/templates`), Versand per E-Mail/Slack/WhatsApp.

## Branchen-Varianten

Gleiche Engine, andere Labels und Richtwerte. So wird das Produkt pro Branche
verkaufbar, ohne den Code zu ändern.

### Agenturen
- Fokus: Pipeline, Auslastung, Abschlussquote, durchschnittlicher Projektwert.
- Typischer Engpass: Angebot → Abschluss und Liefer-Auslastung.

### Handwerk
- `leads` = Anfragen, `proposals` = Kostenvoranschläge, `wins` = Aufträge.
- Fokus: Anfragen aus der Region, Angebots-Geschwindigkeit, offene Rechnungen.
- Typischer Engpass: zu langsame Angebotserstellung, Liquidität.

### Autohäuser
- `leads` = Anfragen (Fahrzeug/Service), `calls` = Probefahrten/Termine,
  `wins` = Verkäufe/Serviceaufträge.
- Fokus: Termin-zu-Verkauf-Quote, Service-Auslastung, Bestandskontakte.

### Beratungen
- `proposals` = Angebote/Mandate, `average_project_value` hoch.
- Fokus: wenige, große Abschlüsse; Pipeline-Wert und Forecast wichtiger als Menge.

### Lokale Dienstleister
- `impressions`/`website_visitors` aus lokalem SEO/Maps, `leads` = Anrufe/Formulare.
- Fokus: Sichtbarkeit vor Ort → Anfragen → gebuchte Termine, Bewertungen.

## Automatisierungs-Andockpunkte

- Quellen ziehen: n8n/Make zieht monatlich aus den APIs in das Monatsformat.
- Reports verschicken: nach Erzeugung automatisch per E-Mail/Slack raus.
- Trigger: bei `status = rot` sofortige Benachrichtigung an die Geschäftsführung.
