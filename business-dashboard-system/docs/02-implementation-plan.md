# Phase 1 — Umsetzungsplan

Vollständiger Plan, wie aus der Analyse ein verkaufbares Produkt und ein internes
Betriebssystem wird.

## Architektur in einem Satz

> Datenquellen → normalisierter Monatsdatensatz → KPI-Engine → AI-Interpretation
> → fertige Reports (Wochen-, Monats-, CEO-, Vertriebs-, Marketing-Report) → Dashboard.

## Bausteine

1. **Datenmodell** (`data/metrics.json`): ein einheitliches Monatsformat für
   Vertrieb, Marketing, Finanzen. Quellen liefern in dieses Format.
2. **KPI-Engine** (`src/metrics.js`): rohe Felder → abgeleitete Kennzahlen und
   Veränderungen. Erkennt fehlende Daten.
3. **Analyse** (`src/analysis.js`): Trends und Engpass-Erkennung
   (`detectBottlenecks`).
4. **Reports** (`src/reports.js`): Wochen-/Monats-/CEO-Report als strukturierte
   Objekte, die auf die Templates passen.
5. **Dashboard-Daten** (`src/dashboard.js`): `prepareDashboardData()` formt
   Serien + Kennzahlen für ein Frontend / Looker Studio.
6. **AI-Schicht** (`src/ai.js`): baut aus Prompts + Daten eine Anfrage; Stubs mit
   auskommentierten Integrationen (Claude, OpenAI, Notion, Airtable, Sheets,
   HubSpot, Looker).
7. **Prompts** (`prompts/`): Rolle, Ziel, Regeln, Beispiele, JSON-Ausgabe.
8. **Templates** (`templates/`): die Berichtsvorlagen mit Kennzahlen, Veränderungen,
   Handlungsempfehlungen.
9. **Tests** (`tests/`): Lückenerkennung, KPI-Mathematik, Trends, Vollständigkeit.
10. **Angebot** (`offer/service-offer.md`): drei Pakete als Kundenprodukt.

## Reihenfolge der Umsetzung

1. Datenmodell + Mock-Daten (Single Source of Truth).
2. KPI-Engine + Tests (Mathematik absichern).
3. Analyse/Engpässe + Tests.
4. Reports + Templates aufeinander abstimmen.
5. AI-Schicht mit Stubs (echte Keys später).
6. Dashboard-Daten.
7. Angebot + Verkaufsstrategie.

## Wiederverwendbarkeit / Verkauf

- Quellen-agnostisch: nur das Monatsformat zählt.
- Branchen-Presets (Agentur, Handwerk, Autohaus, Beratung, lokaler Dienstleister)
  über andere Benchmarks/Labels, gleiche Engine.
- Drei Preis-Pakete: einmalige Einrichtung + laufende Betreuung (wiederkehrender
  Umsatz).

## Grenzen

- Liefert Entscheidungsgrundlagen, keine Garantie für Ergebnisse.
- Qualität der Auswertung hängt an der Datenqualität der Quellen.
- AI interpretiert, der Mensch entscheidet (Mensch + Agent + Kontrolle).
