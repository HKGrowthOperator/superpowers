// AI-Schicht: baut aus Prompt-Datei + Daten eine Anfrage und interpretiert
// Reports. Läuft offline mit einer Regel-Interpretation (Fallback). Echte
// Anbindungen sind als Integration auskommentiert dokumentiert.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { recommendations } from "./reports.js";
import { detectBottlenecks } from "./analysis.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Lädt eine Prompt-Datei aus /prompts und hängt die Daten als JSON an. */
export function buildPrompt(promptFile, payload) {
  const tpl = readFileSync(path.join(__dirname, "../prompts", promptFile), "utf8");
  return `${tpl}\n\n## Eingabedaten (JSON)\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\`\n`;
}

/**
 * Interpretiert einen Report. Standard: deterministische Regel-Auswertung,
 * damit das System ohne API-Key läuft. Mit Key wird Claude/OpenAI genutzt
 * (siehe auskommentierte Integration unten).
 */
export async function interpret(report, { rows, promptFile = "kpi-analysis-prompt.md" } = {}) {
  // ── ECHTE INTEGRATION: Claude API ───────────────────────────────────────
  // if (process.env.ANTHROPIC_API_KEY) {
  //   const prompt = buildPrompt(promptFile, report);
  //   const res = await fetch("https://api.anthropic.com/v1/messages", {
  //     method: "POST",
  //     headers: {
  //       "x-api-key": process.env.ANTHROPIC_API_KEY,
  //       "anthropic-version": "2023-06-01",
  //       "content-type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
  //       max_tokens: 1024,
  //       messages: [{ role: "user", content: prompt }],
  //     }),
  //   });
  //   const data = await res.json();
  //   return JSON.parse(data.content[0].text);
  // }
  //
  // ── ECHTE INTEGRATION: OpenAI ───────────────────────────────────────────
  // if (process.env.OPENAI_API_KEY) {
  //   const prompt = buildPrompt(promptFile, report);
  //   const res = await fetch("https://api.openai.com/v1/chat/completions", {
  //     method: "POST",
  //     headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
  //     body: JSON.stringify({ model: "gpt-4o", response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
  //   });
  //   const data = await res.json();
  //   return JSON.parse(data.choices[0].message.content);
  // }

  // ── FALLBACK: Regel-Interpretation (offline) ────────────────────────────
  const bottlenecks = detectBottlenecks(rows);
  const recs = recommendations(rows);
  return {
    source: "rules",
    summary:
      bottlenecks.length === 0
        ? "Keine akuten Engpässe. Die Kennzahlen sind stabil oder steigend."
        : `Wichtigster Engpass: ${bottlenecks[0].title}. ${bottlenecks[0].detail}`,
    findings: bottlenecks.map((b) => b.title),
    recommendations: recs.map((r) => r.action),
  };
}

// ── DATENQUELLEN-INTEGRATIONEN (später aktivieren) ─────────────────────────
//
// Notion:        GET https://api.notion.com/v1/databases/{id}/query  (Header: Authorization, Notion-Version)
// Airtable:      GET https://api.airtable.com/v0/{base}/{table}      (Header: Authorization: Bearer ...)
// Google Sheets: GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}  (OAuth)
// HubSpot:       GET https://api.hubapi.com/crm/v3/objects/deals     (Header: Authorization: Bearer ...)
// Looker Studio: Daten via Community Connector oder als BigQuery/Sheet-Quelle bereitstellen
//
// Jede Quelle liefert in das normalisierte Monatsformat (siehe data/metrics.json),
// dann arbeiten Engine, Analyse und Reports unverändert weiter.
export const INTEGRATIONS = ["Claude API", "OpenAI", "Notion", "Airtable", "Google Sheets", "HubSpot", "Looker Studio"];
