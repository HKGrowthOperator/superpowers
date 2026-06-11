/**
 * run-demo — spielt die komplette Pipeline lokal durch (kein API-Key nötig).
 *
 *   node src/run-demo.js                 → alle 8 Beispiel-Leads aus data/
 *   node src/run-demo.js --message "..."  → eine eigene Anfrage testen
 *
 * Achtung: Klassifikation + Antwortentwurf laufen im Mock-Modus
 * (Keyword-Heuristik / Textbausteine). Die Scores der Beispiel-Leads in
 * data/example-leads.json sind dagegen mit dem ECHTEN Scoring berechnet.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyLead } from "./classifyLead.js";
import { scoreLead } from "./scoreLead.js";
import { generateNextStep } from "./generateNextStep.js";
import { generateReplyDraft } from "./generateReplyDraft.js";
import { formatLeadForCRM } from "./formatLeadForCRM.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function qualify(rawLead) {
  const classification = classifyLead(rawLead);
  const lead = { ...rawLead, ...classification };

  const scoring = scoreLead(lead);
  Object.assign(lead, {
    lead_score: scoring.lead_score,
    lead_temperature: scoring.lead_temperature,
  });

  const next = generateNextStep(lead);
  lead.recommended_next_step = next.recommended_next_step;
  lead.assigned_to = next.assigned_to;

  const draft = generateReplyDraft(lead);
  lead.suggested_reply = draft.reply_text;
  lead.status = lead.lead_temperature === "hot" ? "qualified" : "new";

  return { lead, scoring, next, draft };
}

function printResult({ lead, scoring, draft }) {
  const emoji = { hot: "🔥", warm: "🌤", cold: "❄️" }[lead.lead_temperature];
  console.log("─".repeat(72));
  console.log(`${emoji} ${lead.lead_score}/100 [${lead.lead_temperature.toUpperCase()}]  ${lead.company ?? lead.name ?? "Unbekannt"}  (${lead.source})`);
  console.log(`   Kategorie: ${lead.category} · Budget: ${lead.budget_range} · Dringlichkeit: ${lead.urgency} · Phase: ${lead.decision_stage}`);
  console.log(`   Intent:    ${lead.detected_intent}`);
  for (const [dim, d] of Object.entries(scoring.score_breakdown)) {
    console.log(`     ${String(d.points).padStart(2)}/${d.max}  ${dim}: ${d.reason}`);
  }
  if (lead.missing_information.length) console.log(`   Fehlt:     ${lead.missing_information.join(" · ")}`);
  console.log(`   ➡ Nächster Schritt (${lead.assigned_to}): ${lead.recommended_next_step}`);
  console.log(`   ✉ Entwurf: ${draft.reply_text.split("\n")[2] ?? draft.reply_text.slice(0, 100)}…`);
}

const args = process.argv.slice(2);
const msgIndex = args.indexOf("--message");

if (msgIndex !== -1) {
  const result = qualify({
    lead_id: `lq_demo_${Date.now().toString(36)}`,
    created_at: new Date().toISOString(),
    source: "other",
    name: null, company: null, contact_email: null, contact_phone: null,
    original_message: args[msgIndex + 1] ?? "",
  });
  printResult(result);
  console.log("\nCRM-Datensatz:");
  console.log(JSON.stringify(formatLeadForCRM(result.lead), null, 2));
} else {
  const examples = JSON.parse(readFileSync(join(__dirname, "..", "data", "example-leads.json"), "utf8"));
  console.log(`AI Lead Qualification — Demo über ${examples.length} Beispiel-Leads (Mock-Modus)\n`);
  // Beispiel-Leads frisch durch die Pipeline schicken: nur Roh-Felder verwenden
  for (const ex of examples) {
    const raw = {
      lead_id: ex.lead_id, created_at: ex.created_at, source: ex.source,
      name: ex.name, company: ex.company,
      contact_email: ex.contact_email, contact_phone: ex.contact_phone,
      original_message: ex.original_message,
    };
    printResult(qualify(raw));
  }
  console.log("─".repeat(72));
  console.log("\nHinweis: Mock-Klassifikation (Keywords) kann von den kuratierten Werten in");
  console.log("data/example-leads.json abweichen — die LLM-Variante (prompts/) ist präziser.");
}
