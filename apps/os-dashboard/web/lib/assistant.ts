// lib/assistant.ts — server-side helper for the in-app Claude assistant.
// Builds a compact snapshot of all module data, exposes a tool the model uses
// to PROPOSE create/edit actions (the user confirms them in the UI), and wraps
// the official @anthropic-ai/sdk.
import Anthropic from "@anthropic-ai/sdk";
import { listItems } from "./store";
import { MODULES, MODULE_KEYS } from "./modules";

export type ChatMessage = { role: "user" | "assistant"; content: string };

// Auswählbare Modelle (Preis steigt von oben nach unten).
export const MODEL_OPTIONS: { id: string; label: string }[] = [
  { id: "claude-haiku-4-5", label: "Haiku — günstig & schnell" },
  { id: "claude-sonnet-4-6", label: "Sonnet — ausgewogen" },
  { id: "claude-opus-4-8", label: "Opus — am stärksten" },
];
// Budgetfreundlicher Standard; per ANTHROPIC_MODEL überschreibbar.
export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
export function resolveModel(m?: string): string {
  return m && MODEL_OPTIONS.some((o) => o.id === m) ? m : DEFAULT_MODEL;
}

/** Returns an Anthropic client, or null if no API key is configured. */
export function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return apiKey ? new Anthropic({ apiKey }) : null;
}

/** Snapshot aller Daten (inkl. Zeilen-ID, damit Bearbeiten-Vorschläge möglich sind). */
export async function buildContext(): Promise<string> {
  const parts: string[] = [];
  for (const key of MODULE_KEYS) {
    const items = await listItems(key);
    if (!items.length) continue;
    const lines = items.map((it) => `- [${it.id}] ${JSON.stringify(it.data)}`);
    parts.push(`## ${MODULES[key].label} (${key})\n${lines.join("\n")}`);
  }
  return parts.join("\n\n") || "(noch keine Daten erfasst)";
}

/** Kompakter Leitfaden: welche Felder (und Auswahlwerte) jedes Modul hat. */
export function fieldGuide(): string {
  return MODULE_KEYS.map((k) => {
    const m = MODULES[k];
    const fields = m.fields
      .map((f) => (f.options ? `${f.name}(${f.options.join("|")})` : f.name))
      .join(", ");
    return `- ${k} (${m.label}): ${fields}`;
  }).join("\n");
}

// Das Werkzeug, mit dem der Assistent Aktionen vorschlägt.
export const OS_TOOLS: Anthropic.Tool[] = [
  {
    name: "os_vorschlag",
    description:
      "Schlägt vor, einen Eintrag im OS anzulegen oder zu ändern. Der Nutzer bestätigt den Vorschlag per Klick. Nutze dieses Werkzeug, wann immer der Nutzer dich bittet, etwas anzulegen, zu erstellen, hinzuzufügen oder zu ändern — statt die Daten nur als Text auszugeben. Du darfst mehrere Vorschläge in einer Antwort machen.",
    input_schema: {
      type: "object",
      properties: {
        aktion: { type: "string", enum: ["anlegen", "bearbeiten"], description: "anlegen = neuer Eintrag, bearbeiten = bestehenden ändern" },
        modul: { type: "string", enum: MODULE_KEYS, description: "Ziel-Modul (Schlüssel aus der Modul-Liste)" },
        id: { type: "string", description: "Nur bei 'bearbeiten': die [id] des Eintrags aus den aktuellen Daten." },
        titel: { type: "string", description: "Kurzer, sprechender Titel des Vorschlags für die Anzeige." },
        felder: { type: "object", description: "Die Feldwerte passend zu den Feldern des Moduls. Listen (Schritte/Werkzeuge/Schlagwörter) als Array von Strings. Auswahlwerte exakt wie in der Feldliste (deutsch)." },
      },
      required: ["aktion", "modul", "titel", "felder"],
    },
  },
];

export const SYSTEM_PREAMBLE = `Du bist der HK-Growth-Assistent — der eingebaute Mitdenker und Macher im Betriebs-Cockpit einer Wachstumsagentur.

Du kennst die aktuellen Daten des Unternehmens (Kunden, SOPs, Vorlagen, Konzepte, Automationen, Webseiten, AI-Intelligence) und nutzt sie.

Du kannst:
- Echte Arbeit entwerfen: Kundenmails aus Vorlagen + Kontext, SOPs, Konzepte, Zusammenfassungen.
- Einträge ANLEGEN oder ÄNDERN: Nutze dafür das Werkzeug "os_vorschlag" mit den passenden Feldern. Der Nutzer bestätigt jeden Vorschlag selbst.

Regeln:
- Antworte auf Deutsch, konkret und ohne lange Vorrede.
- Wenn der Nutzer etwas anlegen/ändern will, RUFE das Werkzeug auf (statt die Felder nur als Text zu schreiben). Fülle alle sinnvollen Felder; bei "bearbeiten" die [id] aus den Daten nutzen.
- Auswahl-/Status-Werte exakt wie in der Feldliste (deutsch, z. B. Kunden-Status: aktiv/Interessent/pausiert/verloren).
- Erfinde keine Kunden/Fakten, die nicht in den Daten stehen.
- Bei reinen Fragen oder Entwürfen ohne Speicherwunsch: einfach antworten, kein Werkzeug.`;

/** Baut den vollständigen System-Prompt (cachebar). */
export async function buildSystem(): Promise<string> {
  const [guide, context] = [fieldGuide(), await buildContext()];
  return `${SYSTEM_PREAMBLE}\n\n# Module & Felder\n${guide}\n\n# Aktuelle Daten\n${context}`;
}
