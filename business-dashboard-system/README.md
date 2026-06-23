# AI Business Dashboard System

Unternehmensdaten automatisch sammeln, visualisieren und durch AI interpretieren.
Ein wiederverwendbares Produkt von **HK Growth Operator** — als Kundenleistung
verkaufbar und als internes Betriebssystem nutzbar.

## Problem

KMU ertrinken in Tools, aber nicht in Erkenntnissen. Daten liegen verstreut in
CRM, Buchhaltung, Website-Analytics und Social-Kanälen. Reporting passiert manuell,
kostet jede Woche Stunden und liefert Zahlen ohne Interpretation. Probleme wie ein
Abschluss-Engpass oder steigender Liquiditätsdruck werden zu spät sichtbar.

## Zielgruppe

Kleine und mittlere Unternehmen mit 1–50 Mitarbeitern: Agenturen, Handwerk,
Autohäuser, Beratungen und lokale Dienstleister. Überall dort, wo es Vertrieb,
Marketing und Finanzen gibt, aber kein Data-Team.

## Nutzen

- **Ein Blick statt zehn Tools:** alle Kennzahlen an einem Ort.
- **Automatische Reports:** Wochen-, Monats-, CEO-, Vertriebs- und Marketingreport.
- **AI-Interpretation:** nicht nur Zahlen, sondern „was bedeutet das, was ist zu tun".
- **Engpass-Erkennung:** das System zeigt, wo das meiste Potenzial verloren geht.
- **Datenlücken-Warnung:** fehlende Werte werden erkannt, bevor sie täuschen.

## Workflow

```
Datenquellen → Sammlung → Dashboard → AI-Auswertung → Management-Report
```

1. Quellen (CRM, Analytics, Buchhaltung) liefern in ein einheitliches Monatsformat.
2. Die KPI-Engine berechnet Kennzahlen und Veränderungen.
3. Die Analyse erkennt Trends und Engpässe.
4. Die AI-Schicht interpretiert und empfiehlt Maßnahmen.
5. Fertige Reports und Dashboard-Daten gehen an die Geschäftsführung.

## Schnellstart

```bash
node src/index.js   # Demo mit Mock-Daten
node --test "tests/*.test.js"   # Tests
```

Keine Abhängigkeiten, nur Node 18+. Echte AI- und Datenquellen werden über
Umgebungsvariablen aktiviert (siehe `src/ai.js`).

## Projektstruktur

```
business-dashboard-system/
├── README.md
├── docs/        Analyse, Plan, Datenmodell
├── prompts/     AI-Prompts (Rolle, Ziel, Regeln, Beispiele, JSON)
├── workflows/   Ablaufdiagramme + Branchen-Varianten
├── src/         Logik: Metriken, Analyse, Reports, Dashboard, AI
├── tests/       Tests: Lücken, KPIs, Trends, Vollständigkeit
├── templates/   Berichtsvorlagen
├── data/        Datenmodell + 14 Monate Mock-Daten
└── offer/       Verkaufsangebot mit drei Paketen
```

## Grenzen

- Liefert Entscheidungsgrundlagen, keine Ergebnis-Garantie.
- Die Auswertung ist nur so gut wie die Datenqualität der Quellen.
- AI interpretiert, der Mensch entscheidet (Mensch + Agent + Kontrolle).
- Aktuell monatliche Granularität; wöchentlich/täglich ist erweiterbar.

## Zukünftige Erweiterungen

- Live-Anbindung der Quellen (HubSpot, GA4, Lexoffice, Notion, Airtable, Sheets).
- Automatischer Versand der Reports per E-Mail und in Slack/WhatsApp.
- Ziel- und Forecast-Funktion (Soll/Ist, Hochrechnung).
- Branchen-Presets mit eigenen Richtwerten.
- Visualisierung in Looker Studio oder einem eigenen Web-Dashboard.
