"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveItem } from "@/app/actions";

export type ClientAgent = {
  id: string; name: string; role: string; emoji: string; accent: string;
  blurb: string; focus?: boolean; tasks: string[]; placeholder: string;
};
type Stat = { today: number; total: number; running: number };

const MODELS = [
  { id: "claude-haiku-4-5", label: "Haiku · schnell" },
  { id: "claude-sonnet-4-6", label: "Sonnet · ausgewogen" },
  { id: "claude-opus-4-8", label: "Opus · stark" },
];

export function AgentTeam({
  agents, stats, aggregate,
}: {
  agents: ClientAgent[];
  stats: Record<string, Stat>;
  aggregate: { today: number; total: number; running: number };
}) {
  const router = useRouter();
  const [active, setActive] = useState<ClientAgent | null>(null);
  const [task, setTask] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState("");
  const [meta, setMeta] = useState<{ costEur: number; tokensOut: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 2500); }
  function statFor(a: ClientAgent): Stat { return stats[`${a.name} · ${a.role}`] ?? { today: 0, total: 0, running: 0 }; }

  function open(a: ClientAgent) {
    setActive(a); setTask(""); setOutput(""); setMeta(null);
    setTimeout(() => document.getElementById("agent-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function run() {
    if (!active || !task.trim()) return;
    setBusy(true); setOutput(""); setMeta(null);
    try {
      const res = await fetch("/api/agents/run", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: active.id, task, model }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.error) flash(data.error);
      else { setOutput(data.output ?? ""); setMeta({ costEur: data.costEur ?? 0, tokensOut: data.tokensOut ?? 0 }); router.refresh(); }
    } catch { flash("Ausführung fehlgeschlagen."); }
    finally { setBusy(false); }
  }

  async function saveAsTemplate() {
    if (!active || !output) return;
    const channel = active.id === "outreach" ? "E-Mail" : "Chat";
    try {
      await saveItem({
        module: "templates", path: "/kundenbedienung",
        data: { title: `${active.role}: ${task.slice(0, 60)}`, channel, category: active.role, body: output },
      });
      flash("Als Vorlage gespeichert ✓");
    } catch { flash("Speichern fehlgeschlagen."); }
  }

  return (
    <div className="space-y-6">
      {/* Kopf-Kennzahlen */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Aufträge heute" value={aggregate.today} />
        <StatTile label="Erledigt gesamt" value={aggregate.total} />
        <StatTile label="Gerade aktiv" value={aggregate.running} accent />
      </div>

      {/* Team-Karten */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => {
          const s = statFor(a);
          const isActive = active?.id === a.id;
          return (
            <button key={a.id} type="button" onClick={() => open(a)}
              className={`bg-card border-border hover:border-foreground/30 rounded-xl border p-4 text-left shadow-sm transition ${isActive ? "ring-primary ring-2" : ""}`}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{ backgroundColor: a.accent + "22" }}>{a.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <strong className="truncate">{a.name}</strong>
                    {a.focus && <span className="bg-gold/15 text-gold-ink rounded-full px-1.5 py-0.5 text-[10px] font-semibold">Schwerpunkt</span>}
                  </div>
                  <div className="text-muted-foreground text-xs" style={{ color: a.accent }}>{a.role}</div>
                </div>
              </div>
              <p className="text-muted-foreground mt-2 text-sm">{a.blurb}</p>
              <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
                <span>heute <strong className="text-foreground">{s.today}</strong></span>
                <span>gesamt <strong className="text-foreground">{s.total}</strong></span>
                {s.running > 0 && <span className="text-primary">● aktiv</span>}
                <span className="ml-auto font-semibold" style={{ color: a.accent }}>Beauftragen →</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Arbeits-Panel */}
      {active && (
        <section id="agent-panel" className="border-l-gold bg-card border-border space-y-3 rounded-xl border border-l-4 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg text-lg" style={{ backgroundColor: active.accent + "22" }}>{active.emoji}</span>
            <div>
              <h2 className="font-serif text-lg font-bold">{active.name}</h2>
              <div className="text-xs" style={{ color: active.accent }}>{active.role}</div>
            </div>
            <button type="button" onClick={() => setActive(null)} className="text-muted-foreground hover:text-foreground ml-auto text-sm">✕</button>
          </div>

          <div className="flex flex-wrap gap-2">
            {active.tasks.map((t) => (
              <button key={t} type="button" onClick={() => setTask(t)}
                className="border-border bg-background hover:bg-secondary rounded-full border px-3 py-1 text-xs">{t}</button>
            ))}
          </div>

          <textarea value={task} onChange={(e) => setTask(e.target.value)} rows={3} placeholder={active.placeholder}
            className="bg-background border-border focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none" />

          <div className="flex items-center gap-2">
            <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-background border-border rounded-md border px-2 py-1.5 text-xs">
              {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <button type="button" onClick={run} disabled={busy || !task.trim()}
              className="bg-primary text-primary-foreground rounded-md px-4 py-1.5 text-sm font-semibold hover:bg-[#3a4734] disabled:opacity-50">
              {busy ? "Arbeitet…" : "Ausführen"}
            </button>
          </div>

          {output && (
            <div className="space-y-2">
              <div className="bg-background border-border max-h-[480px] overflow-auto rounded-md border p-4 text-sm whitespace-pre-wrap">{output}</div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { navigator.clipboard?.writeText(output); flash("Kopiert ✓"); }}
                  className="border-border hover:bg-secondary rounded-md border px-3 py-1.5 text-xs font-semibold">Kopieren</button>
                <button type="button" onClick={saveAsTemplate}
                  className="border-border hover:bg-secondary rounded-md border px-3 py-1.5 text-xs font-semibold">Als Vorlage speichern</button>
                {meta && <span className="text-muted-foreground ml-auto text-xs">~{meta.costEur.toFixed(4)} € · {meta.tokensOut} Tokens</span>}
              </div>
            </div>
          )}
        </section>
      )}

      {toast && <div className="bg-primary text-primary-foreground fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg">{toast}</div>}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-card border-border rounded-xl border p-4 shadow-sm">
      <div className={`font-serif text-2xl font-bold ${accent ? "text-primary" : ""}`}>{value}</div>
      <div className="text-muted-foreground text-xs">{label}</div>
    </div>
  );
}
