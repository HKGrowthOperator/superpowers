# Vertriebsreport — {{period}}

## Trichter & Veränderungen
| Stufe | Wert | Δ zum Vormonat |
|---|---|---|
| Leads | {{funnel.leads.value}} | {{funnel.leads.change.pct}} |
| Termine | {{funnel.calls.value}} | {{funnel.calls.change.pct}} |
| Angebote | {{funnel.proposals.value}} | {{funnel.proposals.change.pct}} |
| Abschlüsse | {{funnel.wins.value}} | {{funnel.wins.change.pct}} |

## Wichtigste Kennzahlen
- Abschlussquote (Angebot → Auftrag): {{closeRate}}
- Pipeline-Wert: {{pipelineValue}} €
- Umsatz pro Abschluss: {{revenuePerWin}} €

## Handlungsempfehlungen
{{#recommendations}}
- {{action}}
{{/recommendations}}
