# Phase 1 — Analyse

Grundlage für das AI Business Dashboard System. Ziel ist ein Produkt, das für
typische KMU (Agenturen, Handwerk, Autohäuser, Beratungen, lokale Dienstleister)
funktioniert und als Dienstleistung verkauft werden kann.

## 1. Welche Kennzahlen sind für KMU wichtig?

KMU brauchen nicht 200 Metriken, sondern die wenigen, die Umsatz und Liquidität
steuern. Drei Ebenen:

**Wachstum (kommt Geld rein?)**
- Umsatz pro Monat und Trend
- Neue Kunden / Gewonnene Aufträge (wins)
- Durchschnittlicher Auftragswert (average_project_value)
- Pipeline-Wert (offene Angebote × Auftragswert)

**Effizienz (wie gut wird aus Aufwand Umsatz?)**
- Lead-zu-Termin-Quote
- Termin-zu-Abschluss-Quote (die teuerste Stelle im Trichter)
- Lead-zu-Kunde-Quote insgesamt
- Besucher-zu-Lead-Quote (Marketing-Effizienz)

**Stabilität (bleibt das Geschäft gesund?)**
- Offene Rechnungen / Liquiditätsdruck
- Umsatzkonzentration und Schwankung
- Auslastung / Lieferfähigkeit

## 2. Typische Reporting-Probleme im KMU

- **Daten liegen verstreut** in CRM, Buchhaltung, Website-Analytics, Social-Tools.
- **Reporting ist manuell** und kostet jede Woche Stunden (Copy-Paste in Excel).
- **Zahlen ohne Interpretation**: Man sieht Werte, aber nicht, was zu tun ist.
- **Zu spät**: Probleme werden erst im Nachhinein sichtbar (z. B. Cashflow).
- **Keine Vergleichbarkeit**: Jeder Monat wird anders zusammengestellt.
- **Bauchgefühl statt Engpass-Analyse**: Man optimiert das Falsche
  (mehr Leads kaufen, obwohl der Abschluss klemmt).

## 3. Häufig verwendete Datenquellen

| Bereich | Quellen |
|---|---|
| Vertrieb / CRM | HubSpot, Pipedrive, Excel, eigenes CRM |
| Marketing | Google Analytics / GA4, Meta Ads, LinkedIn, YouTube, Instagram |
| Finanzen | DATEV, Lexoffice, sevDesk, Rechnungstool, Banking |
| Projekt / Betrieb | Asana, Trello, Notion, Airtable, Google Sheets |
| Visualisierung | Looker Studio, Power BI, eigenes Dashboard |

Das System ist quellen-agnostisch: es arbeitet auf einem normalisierten
Monatsdatensatz, egal woher die Zahlen kommen.

## 4. Sinnvolle KPIs nach Abteilung

**Vertrieb**
- Leads, Calls/Termine, Proposals, Wins
- Termin-zu-Abschluss-Quote (proposal_to_win)
- Pipeline-Wert, Umsatz pro Abschluss

**Marketing**
- Impressions, Website-Besucher, Content-Stückzahl
- Besucher-zu-Lead-Quote (visitor_to_lead)
- Content-Output vs. Reichweite

**Finanzen / Geschäftsführung**
- Umsatz und Trend, durchschnittlicher Auftragswert
- Offene Rechnungen / Liquiditätsdruck (open_invoices / revenue)
- Wachstum gegenüber Vormonat und Vorjahr

## 5. Welche Engpässe werden durch Daten sichtbar?

- **Abschluss-Engpass**: viele Proposals, wenige Wins → Vertrieb/Angebot klemmt.
- **Lead-Engpass**: zu wenig oben im Trichter → Marketing/Akquise zu schwach.
- **Liquiditäts-Engpass**: open_invoices steigen schneller als Umsatz.
- **Marketing-Effizienz-Engpass**: viele Besucher, wenige Leads → Website/Angebot.
- **Konsistenz-Engpass**: Content-Output bricht ein, Reichweite folgt verzögert.
- **Datenlücken**: fehlende Werte verfälschen jede Auswertung → müssen erkannt werden.

Genau diese Engpässe macht `detectBottlenecks()` automatisch sichtbar, statt sie
im Bauchgefühl zu lassen.
