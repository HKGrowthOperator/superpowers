# Cloud-Integrationen

Das System läuft komplett lokal (Mock-Modus). Dieses Dokument beschreibt, wie die echten Werkzeuge angeschlossen werden — in der Reihenfolge, in der es sich für Kundenprojekte bewährt.

## 1. KI-Anbindung (Claude API — empfohlen)

Austauschstellen im Code sind mit `// INTEGRATION:` markiert (`src/classifyLead.js`, `src/generateReplyDraft.js`).

```js
// Beispiel: classifyLead mit Claude statt Mock
// npm install @anthropic-ai/sdk  +  ANTHROPIC_API_KEY als Env-Var
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";

const client = new Anthropic(); // liest ANTHROPIC_API_KEY

async function classifyWithClaude(message, source) {
  const prompt = readFileSync("prompts/lead-classification-prompt.md", "utf8");
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",   // Klassifikation: schnell + günstig reicht
    max_tokens: 1024,
    system: prompt,
    messages: [{ role: "user", content: JSON.stringify({ source, original_message: message }) }],
  });
  return JSON.parse(res.content[0].text); // Prompts erzwingen reines JSON
}
```

**Modellwahl:** Klassifikation/Scoring-Begründung → Haiku (Kosten ~0,001 €/Lead). Antwortentwurf → Sonnet (Sprachqualität). Bei 200 Leads/Monat liegen die API-Kosten unter 5 € — das gehört als Argument ins Verkaufsgespräch.

**DSGVO:** AV-Vertrag mit Anthropic abschließen, keine Trainingsnutzung (Standard bei API), Datenminimierung: nur `original_message` + Kontaktfelder senden, die wirklich gebraucht werden.

## 2. Eingangskanäle (Make / Zapier)

Ein Szenario pro Kanal, alle münden in denselben Webhook:

```
[Formular: Webhook-Modul]  ─┐
[E-Mail: Mailhook]          ├─→ [HTTP: POST an Pipeline] ─→ [Airtable: Create Record]
[WhatsApp Business: Watch]  ─┘                              └→ [Slack: Nachricht wenn hot]
```

- **Make (empfohlen für Kunden):** Webhook-Modul → HTTP-Modul ruft die Pipeline (z. B. als Cloud Function / Val Town / Render) → Router verteilt nach `lead_temperature`
- **Zapier:** identisch, "Webhooks by Zapier" → "Code by Zapier" kann die `src/`-Logik sogar direkt als JS-Step ausführen (Dateien sind dependency-frei genau deshalb)

## 3. CRM (Airtable als Start-Empfehlung)

`src/formatLeadForCRM.js` liefert einen flachen Datensatz, der 1:1 als Airtable-Record funktioniert.

**Airtable-Basis "Leads", eine Tabelle, Views:**
- 🔥 *Hot — heute kontaktieren* (Filter: Temperature = hot, Status = new/qualified)
- 📞 *Warm — diese Woche* · ❄️ *Cold — Wiedervorlage* · ✅ *Won* / ❌ *Lost*

Alternativen: **Notion** (Datenbank mit denselben Properties), **HubSpot/Pipedrive** (Mapping: `lead_score` → Custom Property, `lead_temperature` → Deal-Priorität, `recommended_next_step` → Task).

## 4. Benachrichtigung & Aufgaben

- **Slack:** Bei `hot` → Nachricht in #vertrieb mit Summary (aus `sales-summary-prompt.md`) + Antwortentwurf als Thread
- **E-Mail-Fallback:** Für Kunden ohne Slack — Mail an Vertriebsadresse mit Betreff `🔥 [82/100] Website-Anfrage — Müller GmbH`

## 5. Follow-up (Ausbaustufe)

Make-Scheduler prüft täglich: Status `contacted` + keine Antwort seit X Tagen → Wiedervorlage-Task + Follow-up-Entwurf. Eskalation 2 → 5 → 10 Tage, danach Status `on_hold`.

## Reihenfolge im Kundenprojekt

1. Airtable + manueller Test (Pipeline lokal, Ergebnis per Copy-Paste) — *sofort sichtbarer Wert*
2. Webhook-Eingang für den wichtigsten Kanal
3. Claude-Anbindung (Mock raus)
4. Slack-Alarm + Aufgaben
5. Follow-up-Engine (Retainer-Material)
