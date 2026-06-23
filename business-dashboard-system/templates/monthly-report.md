# Monatsreport — {{period}}

**Status:** {{status}}

## Wichtigste Kennzahlen & Veränderungen
| Kennzahl | Wert | Δ zum Vormonat |
|---|---|---|
| Umsatz | {{metrics.revenue.value}} € | {{metrics.revenue.change.pct}} |
| Abschlüsse | {{metrics.wins.value}} | {{metrics.wins.change.pct}} |
| Leads | {{metrics.leads.value}} | {{metrics.leads.change.pct}} |
| Angebote | {{metrics.proposals.value}} | {{metrics.proposals.change.pct}} |
| Website-Besucher | {{metrics.website_visitors.value}} | {{metrics.website_visitors.change.pct}} |
| Offene Rechnungen | {{metrics.open_invoices.value}} € | {{metrics.open_invoices.change.pct}} |

## Trichter
- Lead → Termin: {{funnel.lead_to_call.value}}
- Termin → Angebot: {{funnel.call_to_proposal.value}}
- Angebot → Abschluss: {{funnel.proposal_to_win.value}}

## Erkannte Engpässe
{{#bottlenecks}}
- **{{title}}** — {{detail}}
{{/bottlenecks}}

## Handlungsempfehlungen
{{#recommendations}}
1. {{action}}  *(Grund: {{basis}})*
{{/recommendations}}
