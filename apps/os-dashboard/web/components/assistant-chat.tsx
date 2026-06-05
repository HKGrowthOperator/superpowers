"use client";

import { useRef, useState } from "react";
import { saveItem } from "@/app/actions";

type Msg = { role: "user" | "assistant"; content: string };

const QUICK = [
  { label: "Kundenmail entwerfen", prompt: "Entwirf eine freundliche, professionelle E-Mail an einen Kunden. Nutze passende Vorlagen und Kundendaten. Anlass: " },
  { label: "Neue SOP schreiben", prompt: "Schreibe eine neue SOP mit klaren, nummerierten Schritten. Thema: " },
  { label: "AI-Updates → Maßnahmen", prompt: "Fasse die wichtigsten AI-Updates zu 3 konkreten, umsetzbaren Maßnahmen für uns zusammen." },
  { label: "Konzept entwickeln", prompt: "Entwickle ein kurzes Angebots-Konzept (Nutzen, Schritte, Preisidee). Thema: " },
];

export function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = data.reply ?? data.error ?? "Es ist ein Fehler aufgetreten.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Verbindung fehlgeschlagen. Bitte erneut versuchen." }]);
    } finally {
      setLoading(false);
    }
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function saveAs(kind: "sop" | "template", content: string) {
    const title = content.split("\n").map((s) => s.trim()).filter(Boolean)[0]?.slice(0, 80) || "Assistent-Entwurf";
    try {
      if (kind === "sop") {
        await saveItem({ module: "sops", path: "/sops", data: { title, area: "Assistent", summary: content, steps: [], tools: [], tags: ["assistent"] } });
        flash("Als SOP gespeichert ✓");
      } else {
        await saveItem({ module: "templates", path: "/kundenbedienung", data: { title, channel: "email", category: "Assistent", body: content } });
        flash("Als Vorlage gespeichert ✓");
      }
    } catch {
      flash("Speichern fehlgeschlagen");
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col">
      {/* Verlauf */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="text-muted-foreground mt-6 text-sm">
            <p className="mb-3">
              Frag mich etwas oder wähle einen Schnellstart. Ich kenne deine Kunden, SOPs, Vorlagen, Konzepte und AI-Updates.
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => {
                    setInput(q.prompt);
                    inputRef.current?.focus();
                  }}
                  className="border-border bg-card hover:bg-secondary rounded-full border px-3 py-1.5 text-xs font-semibold"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm whitespace-pre-wrap"
                    : "bg-card border-border max-w-[90%] rounded-2xl rounded-bl-sm border px-4 py-3 text-sm whitespace-pre-wrap shadow-sm"
                }
              >
                {m.content}
                {m.role === "assistant" && (
                  <div className="border-border mt-3 flex flex-wrap gap-2 border-t pt-2">
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(m.content); flash("Kopiert ✓"); }}
                      className="border-border hover:bg-secondary rounded-md border px-2.5 py-1 text-xs font-semibold">Kopieren</button>
                    <button type="button" onClick={() => saveAs("sop", m.content)}
                      className="border-border hover:bg-secondary rounded-md border px-2.5 py-1 text-xs font-semibold">Als SOP speichern</button>
                    <button type="button" onClick={() => saveAs("template", m.content)}
                      className="border-border hover:bg-secondary rounded-md border px-2.5 py-1 text-xs font-semibold">Als Vorlage speichern</button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && <div className="text-muted-foreground text-sm">Assistent denkt nach…</div>}
      </div>

      {/* Eingabe */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="border-border bg-card sticky bottom-0 flex items-end gap-2 rounded-xl border p-2 shadow-sm"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          rows={2}
          placeholder="Nachricht an den Assistenten… (Enter zum Senden, Shift+Enter für neue Zeile)"
          className="bg-background focus:ring-ring max-h-40 flex-1 resize-y rounded-md border-0 px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold hover:bg-[#3a4734] disabled:opacity-50"
        >
          Senden
        </button>
      </form>

      {toast && (
        <div className="bg-primary text-primary-foreground fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
