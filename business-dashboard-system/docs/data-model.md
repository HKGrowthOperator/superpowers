# Phase 4 — Datenmodell

Ein normalisierter **Monatsdatensatz**. Jede Datenquelle liefert in dieses Format,
danach arbeiten Engine, Analyse und Reports unverändert. Quelle der Wahrheit:
`data/metrics.json` (14 Monate Mock-Daten, eine bewusste Lücke zum Testen).

## Felder

| Bereich | Feld | Bedeutung |
|---|---|---|
| — | `month` | Periode im Format `YYYY-MM` |
| Vertrieb | `leads` | neue Interessenten |
| Vertrieb | `calls` | Termine / Gespräche |
| Vertrieb | `proposals` | versendete Angebote |
| Vertrieb | `wins` | gewonnene Aufträge |
| Marketing | `impressions` | Sichtkontakte (Ads/Social) |
| Marketing | `website_visitors` | Website-Besucher |
| Marketing | `content_count` | veröffentlichte Inhalte |
| Finanzen | `revenue` | Monatsumsatz (EUR) |
| Finanzen | `open_invoices` | offene Rechnungen (EUR) |
| Finanzen | `average_project_value` | durchschnittlicher Auftragswert (EUR) |

## Abgeleitete KPIs (in `src/metrics.js`)

| KPI | Formel |
|---|---|
| `lead_to_call` | calls / leads |
| `call_to_proposal` | proposals / calls |
| `proposal_to_win` | wins / proposals |
| `lead_to_win` | wins / leads |
| `visitor_to_lead` | leads / website_visitors |
| `revenue_per_win` | revenue / wins |
| `pipeline_value` | proposals × average_project_value |
| `liquidity_pressure` | open_invoices / revenue |

## Regeln

- Fehlende Werte sind `null` und werden von `findMissing()` gemeldet.
- KPIs mit nicht berechenbarer Basis (null oder Division durch 0) ergeben `null`.
- Beträge in EUR, Quoten als Anteil 0–1 (in Reports als Prozent dargestellt).
