import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getClient, buildContext, ASSISTANT_MODEL, SYSTEM_PREAMBLE, type ChatMessage } from "@/lib/assistant";

// Protected by the auth proxy/middleware like every non-login route.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  const client = getClient();
  if (!client) {
    return NextResponse.json({
      reply:
        "⚠️ Es ist noch kein Anthropic-API-Schlüssel hinterlegt. Trage `ANTHROPIC_API_KEY=sk-ant-…` in die Datei `.env` im Projektordner ein und starte mit `docker compose -f docker-compose.local.yml up -d` neu.",
    });
  }

  const body = (await req.json().catch(() => ({}))) as { messages?: ChatMessage[] };
  const messages = (body.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim(),
  );
  if (!messages.length) {
    return NextResponse.json({ error: "Keine Nachricht erhalten." }, { status: 400 });
  }

  try {
    const context = await buildContext();
    const response = await client.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 4000,
      system: `${SYSTEM_PREAMBLE}\n\n# Aktuelle Daten\n${context}`,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return NextResponse.json({ reply: reply || "(keine Antwort)" });
  } catch (err) {
    const msg =
      err instanceof Anthropic.AuthenticationError
        ? "Der API-Schlüssel wurde abgelehnt. Bitte ANTHROPIC_API_KEY prüfen."
        : err instanceof Anthropic.RateLimitError
          ? "Rate-Limit erreicht — bitte kurz warten und erneut versuchen."
          : err instanceof Anthropic.APIError
            ? `API-Fehler (${err.status}): ${err.message}`
            : "Unerwarteter Fehler beim Aufruf des Assistenten.";
    return NextResponse.json({ error: msg }, { status: 200 });
  }
}
