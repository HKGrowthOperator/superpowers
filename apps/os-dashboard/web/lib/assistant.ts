// lib/assistant.ts — server-side helper for the in-app Claude assistant.
// Builds a compact snapshot of all module data and talks to the Anthropic API.
import Anthropic from "@anthropic-ai/sdk";
import { listItems } from "./store";
import { MODULES, MODULE_KEYS } from "./modules";

// Default to the most capable model; override with ANTHROPIC_MODEL (e.g. claude-sonnet-4-6).
export const ASSISTANT_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** Returns an Anthropic client, or null if no API key is configured. */
export function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

/** A readable snapshot of everything in the OS, fed to Claude as context. */
export async function buildContext(): Promise<string> {
  const parts: string[] = [];
  for (const key of MODULE_KEYS) {
    const items = await listItems(key);
    if (!items.length) continue;
    const lines = items.map((it) => `- ${JSON.stringify(it.data)}`);
    parts.push(`## ${MODULES[key].label} (${key})\n${lines.join("\n")}`);
  }
  return parts.join("\n\n") || "(noch keine Daten erfasst)";
}

export const SYSTEM_PREAMBLE = `Du bist der HK-Growth-Assistent — der eingebaute Mitdenker im Betriebs-Cockpit einer Wachstumsagentur.

Deine Aufgabe: dem Team echte Arbeit abnehmen. Du kennst die aktuellen Daten des Unternehmens (Kunden, SOPs, Vorlagen, Konzepte, Automationen, Webseiten, AI-Intelligence) und nutzt sie.

Du kannst z. B.:
- Kundenmails aus den vorhandenen Vorlagen + Kundenkontext entwerfen (Platzhalter sinnvoll füllen).
- Neue SOPs (klare, nummerierte Schritte) schreiben.
- Konzepte/Angebote ausarbeiten.
- AI-Updates zu konkreten, umsetzbaren Maßnahmen zusammenfassen.
- Fragen zu den Daten beantworten.

Regeln:
- Antworte auf Deutsch, konkret und umsetzbar. Keine langen Vorreden.
- Wenn dir Infos fehlen, triff sinnvolle Annahmen und kennzeichne sie kurz — oder stelle eine knappe Rückfrage.
- Liefere direkt das Ergebnis (z. B. den fertigen Mailtext), nicht nur Meta-Kommentar.
- Erfinde keine Kunden/Fakten, die nicht in den Daten stehen.`;
