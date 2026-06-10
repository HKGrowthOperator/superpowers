# Lead-OS Standardworkflow (n8n)

Der eine wiederverwendbare Workflow aus deinem Briefing:

```
Lead → KI → CRM → E-Mail → Aufgabe → Reporting
```

Einmal einrichten, dann **pro Kunde duplizieren** (in n8n: Workflow → „Duplicate").
Modell-agnostisch gebaut (Claude / GPT / Gemini austauschbar) → kein Vendor-Lock-in.

## Import
1. n8n öffnen → oben rechts **„⋯" → Import from File**
2. `lead-os-standardworkflow.json` wählen
3. Die 8 Nodes erscheinen verdrahtet. Status = **inaktiv** (erst nach Konfiguration aktivieren).

> Hinweis: Es ist ein **Skelett**. n8n importiert es sauber; die roten Hinweise an HTTP-Nodes
> verschwinden, sobald du die Umgebungsvariablen unten gesetzt hast.

## Die 8 Schritte

| Node | Was er tut | Was du einstellen musst |
|---|---|---|
| 1 · Webhook | Empfängt Lead (Formular / IG-DM / Zapier) | Webhook-URL kopieren, ins Formular eintragen |
| 2 · Normalisieren | Vereinheitlicht Felder (name, email, source …) | nichts — ggf. Feldnamen anpassen |
| 3 · KI | Zusammenfassung + Lead-Score (1–100) | LLM-Env-Variablen (siehe unten) |
| 4 · KI auslesen | Liest `summary`, `score`, `naechster_schritt` aus | nichts |
| 5 · CRM | Legt Lead in deiner App an (`/api/leads`) | App-URL + Token |
| 6 · E-Mail | Sendet Begrüßung (aus unseren HTML-Vorlagen) | SMTP-Zugang + HTML einfügen |
| 7 · Aufgabe | Erstellt Follow-up-Task (24 h) | App-URL + Token |
| 8 · Reporting | Schreibt Event fürs Dashboard | App-URL + Token |

## Umgebungsvariablen (in n8n → Settings → Variables, oder .env)

```
LLM_ENDPOINT   = https://api.anthropic.com/v1/messages
LLM_MODEL      = claude-sonnet-4-6
LLM_API_KEY    = sk-ant-...
APP_API_URL    = https://deine-app-domain
APP_API_TOKEN  = <Token aus deiner App>
MAIL_FROM      = info@hkgrowth-operator.de
```

> **Modell tauschen?** Nur `LLM_ENDPOINT` + `LLM_MODEL` + `LLM_API_KEY` ändern.
> Für OpenAI/Gemini zusätzlich die Header in Node 3 anpassen (dort steht `x-api-key` für Anthropic).

## Verbindung zu den E-Mail-Vorlagen

Node 6 hat ein leeres `html`-Feld. So füllst du es:
1. Inhalt aus `../03-willkommen.html` kopieren
2. Platzhalter ersetzen, z. B.
   `{{KUNDE_NAME}}` → `{{ $('2 · Lead normalisieren').item.json.name }}`
   `{{PORTAL_LINK}}` → deine Portal-URL
3. Für die weiteren Onboarding-Mails (Vereinbarung, Rechnung …) jeweils einen
   eigenen kleinen Workflow nach gleichem Muster — ausgelöst durch den Status-Wechsel
   in der App.

## Was noch fehlt (kommt mit der App-ZIP)

Die Endpunkte `/api/leads`, `/api/tasks`, `/api/reporting` müssen in deiner App existieren.
Genau die baue ich ein, sobald `oswebv18.zip` wieder da ist — dann passt der Workflow
ohne weitere Änderung.
