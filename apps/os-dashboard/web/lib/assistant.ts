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

export type Proposal = {
  key: string;
  aktion: "anlegen" | "bearbeiten";
  modul: string;
  id?: string;
  titel: string;
  felder: Record<string, unknown>;
};

/** Zentraler Assistenten-Aufruf: liefert Antworttext + Aktions-Vorschläge. */
export async function runAssistant(
  messages: ChatMessage[],
  model?: string,
): Promise<{ reply: string; proposals: Proposal[] }> {
  const client = getClient();
  if (!client) {
    return {
      reply:
        "⚠️ Es ist noch kein Anthropic-API-Schlüssel hinterlegt. Trage ANTHROPIC_API_KEY in die .env ein und starte den Web-Container neu.",
      proposals: [],
    };
  }
  const system = await buildSystem();
  const response = await client.messages.create({
    model: resolveModel(model),
    max_tokens: 4000,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    tools: OS_TOOLS,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const reply = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  const proposals: Proposal[] = response.content
    .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "os_vorschlag")
    .map((b): Proposal => {
      const inp = b.input as Partial<Proposal>;
      return {
        key: b.id,
        aktion: inp.aktion === "bearbeiten" ? "bearbeiten" : "anlegen",
        modul: String(inp.modul ?? ""),
        id: inp.id ? String(inp.id) : undefined,
        titel: String(inp.titel ?? "Vorschlag"),
        felder: (inp.felder as Record<string, unknown>) ?? {},
      };
    })
    .filter((p) => p.modul && p.felder && Object.keys(p.felder).length > 0);

  return { reply, proposals };
}

/** Wandelt beliebigen Text (z. B. aus Google Drive) in Eintrags-Vorschläge um. */
export async function proposeFromText(text: string, model?: string) {
  return runAssistant(
    [
      {
        role: "user",
        content:
          "Wandle den folgenden Inhalt aus Google Drive in passende OS-Einträge um. Nutze das Werkzeug os_vorschlag für jeden sinnvollen Eintrag (Anleitung/Prozess → SOP, Kundeninfos → Kunde, Angebot/Strategie/Kampagne → Konzept, Textbaustein/E-Mail → Vorlage, Projekt/Website → Webseite). Lege keine Dubletten zu bereits vorhandenen Einträgen an. Fasse dich im Antworttext kurz.\n\n--- INHALT ---\n" +
          text,
      },
    ],
    model,
  );
}
