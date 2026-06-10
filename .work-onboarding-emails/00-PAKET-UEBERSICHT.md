# 📦 Lead-OS Paket — Übersicht (für V18-Update)

Alles, was wir bisher gebaut haben — gesammelt an einer Stelle.
Wenn du V18 das nächste Mal aktualisierst, nimmst du dir hier alles auf einmal.

> **Hinweis:** Diese Dateien liegen im Arbeits-Branch, NICHT automatisch in der V18-App.
> Sie kommen in V18, indem du sie ins V18-Projekt legst (PC) → `git push` → `./update.sh`,
> ODER indem du die `oswebv18.zip` hochlädst und ich sie fest einbaue.

## Inhalt

### 1. Onboarding-E-Mails (6 Stufen, B2B)
| Datei | Stufe |
|---|---|
| `01-vereinbarung.html` | Vereinbarung unterschreiben |
| `02-rechnung-zahlung.html` | Rechnung + Zahlung |
| `03-willkommen.html` | Willkommen |
| `04-portal-zugang.html` | Portal-Zugang |
| `05-kickoff.html` | Kickoff |
| `06-erstes-update.html` | Erstes Update (Momentum) |
| `README.md` | Trigger-Plan + Merge-Felder |

### 2. n8n Lead-OS Standardworkflow
| Datei | Zweck |
|---|---|
| `n8n/lead-os-standardworkflow.json` | Importierbarer Workflow: Lead → KI → CRM → E-Mail → Aufgabe → Reporting |
| `n8n/README-n8n.md` | Setup, Env-Variablen, Modell-Tausch |

## Noch offen (kommt mit der ZIP)
- [ ] Lead-Radar-Umbau (Status + Bereiche)
- [ ] Onboarding-Modul in der App
- [ ] API-Endpunkte `/api/leads`, `/api/tasks`, `/api/reporting` (für n8n)
- [ ] E-Mail-Vorlagen ans Branding anpassen (Farbe/Logo)

## Arbeitsweise
- Du sammelst Themen → ich baue Deliverables + pushe sie hierher + schicke sie dir.
- Wenn du V18 aktualisiert hast, sagst du Bescheid → dann integrieren wir fest.
