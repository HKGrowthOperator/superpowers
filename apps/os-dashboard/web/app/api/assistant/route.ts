import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getClient, buildSystem, resolveModel, OS_TOOLS, type ChatMessage } from "@/lib/assistant";

// Protected by the auth proxy/middleware like every non-login route.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export type Proposal = {
  key: string;
  aktion: "anlegen" | "bearbeiten";
  modul: string;
  id?: string;
  titel: string;
  felder: Record<string, unknown>;
};

export async function POST(req: Request) {
  const client = getClient();
  if (!client) {
    return NextResponse.json({
      reply:
        "⚠️ Es ist noch kein Anthropic-API-Schlüssel hinterlegt. Trage `ANTHROPIC_API_KEY=sk-ant-…` in die Datei `.env` im Projektordner ein und starte mit `docker compose -f docker-compose.local.yml up -d` neu.",
      proposals: [],
    });
  }

  const body = (await req.json().catch(() => ({}))) as { messages?: ChatMessage[]; model?: string };
  const messages = (body.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim(),
  );
  if (!messages.length) {
    return NextResponse.json({ error: "Keine Nachricht erhalten." }, { status: 400 });
  }

  try {
    const system = await buildSystem();
    const response = await client.messages.create({
      model: resolveModel(body.model),
      max_tokens: 4000,
      // Prompt-Caching: der große, stabile System-Teil wird wiederverwendet (~0,1× Kosten).
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

    const fallback = proposals.length ? "Ich habe folgende Vorschläge vorbereitet — bitte bestätigen:" : "(keine Antwort)";
    return NextResponse.json({ reply: reply || fallback, proposals });
  } catch (err) {
    const msg =
      err instanceof Anthropic.AuthenticationError
        ? "Der API-Schlüssel wurde abgelehnt. Bitte ANTHROPIC_API_KEY prüfen."
        : err instanceof Anthropic.RateLimitError
          ? "Rate-Limit oder Guthaben erreicht — bitte später erneut versuchen."
          : err instanceof Anthropic.APIError
            ? `API-Fehler (${err.status}): ${err.message}`
            : "Unerwarteter Fehler beim Aufruf des Assistenten.";
    return NextResponse.json({ error: msg, proposals: [] }, { status: 200 });
  }
}
