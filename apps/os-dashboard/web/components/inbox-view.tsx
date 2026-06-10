"use client";

import { useState } from "react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { InboxMessage, InboxTask, InboxStats } from "@/lib/smart-inbox";

type Data = { messages: InboxMessage[]; tasks: InboxTask[]; stats: InboxStats };

const CHANNELS = ["E-Mail", "WhatsApp", "Instagram", "Kontaktformular"];

function prioTone(p: string): string {
  if (p === "Hoch") return "bg-rust/12 text-rust";
  if (p === "Niedrig") return "bg-secondary text-muted-foreground";
  return "bg-amber-500/20 text-amber-800";
}

function Pill({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", className)}>
      {text}
    </span>
  );
}

export function InboxView({
  initial,
  statuses,
  kategorien,
}: {
  initial: Data;
  statuses: string[];
  kategorien: string[];
}) {
  const [data, setData] = useState<Data>(initial);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterKategorie, setFilterKategorie] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ channel: "E-Mail", from: "", subject: "", body: "" });

  async function reload() {
    const res = await fetch("/api/inbox", { cache: "no-store" });
    if (res.ok) setData((await res.json()) as Data);
  }

  async function post(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        alert(e.error ?? "Aktion fehlgeschlagen");
        return false;
      }
      await reload();
      return true;
    } finally {
      setBusy(false);
    }
  }

  async function submitIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!form.from.trim() || !(form.subject.trim() || form.body.trim())) return;
    const ok = await post({ action: "ingest", ...form });
    if (ok) setForm({ channel: form.channel, from: "", subject: "", body: "" });
  }

  const messages = data.messages.filter(
    (m) => (!filterStatus || m.status === filterStatus) && (!filterKategorie || m.kategorie === filterKategorie),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Gesamt" value={String(data.stats.gesamt)} />
        <StatCard label="Neu" value={String(data.stats.neu)} tone={data.stats.neu > 0 ? "warn" : "default"} />
        <StatCard label="Heute" value={String(data.stats.heuteEingegangen)} />
        <StatCard label="Offene Aufgaben" value={String(data.stats.offeneAufgaben)} tone={data.stats.offeneAufgaben > 0 ? "warn" : "good"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border-border bg-card rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="">Alle Status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filterKategorie}
              onChange={(e) => setFilterKategorie(e.target.value)}
              className="border-border bg-card rounded-md border px-2 py-1.5 text-sm"
            >
              <option value="">Alle Kategorien</option>
              {kategorien.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <span className="text-muted-foreground text-xs">{messages.length} angezeigt</span>
          </div>

          {messages.length === 0 ? (
            <p className="text-muted-foreground text-sm">Keine Anfragen.</p>
          ) : (
            messages.map((m) => (
              <Card key={m.id}>
                <CardContent className="space-y-2 pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill text={m.kategorie} className="bg-gold/15 text-gold-ink" />
                    <Pill text={m.prioritaet} className={prioTone(m.prioritaet)} />
                    <Pill text={m.channel} className="border-border text-muted-foreground border" />
                    <span className="text-muted-foreground ml-auto text-xs">
                      {new Date(m.eingang).toLocaleString("de-DE")}
                    </span>
                  </div>
                  <div className="text-sm font-semibold">
                    {m.subject || "(kein Betreff)"} · <span className="text-muted-foreground font-normal">{m.from}</span>
                  </div>
                  <p className="text-sm">{m.zusammenfassung}</p>
                  {m.naechsterSchritt ? (
                    <p className="text-muted-foreground text-xs">
                      <span className="font-medium">Nächster Schritt:</span> {m.naechsterSchritt}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-muted-foreground text-xs">Zuständig: {m.zustaendig}</span>
                    <select
                      value={m.status}
                      disabled={busy}
                      onChange={(e) => post({ action: "patchMessage", id: m.id, status: e.target.value })}
                      className="border-border bg-card ml-auto rounded-md border px-2 py-1 text-xs"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Seitenspalte: Anfrage erfassen + Aufgaben */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Anfrage erfassen</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitIngest} className="space-y-2">
                <select
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
                >
                  {CHANNELS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  placeholder="Absender (E-Mail / Nummer / @handle)"
                  className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
                />
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Betreff (optional)"
                  className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
                />
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Nachricht …"
                  rows={4}
                  className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-primary text-primary-foreground w-full rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Klassifizieren &amp; aufnehmen
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Aufgaben</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.tasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine Aufgaben.</p>
              ) : (
                data.tasks.map((t) => (
                  <label key={t.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={t.status === "erledigt"}
                      disabled={busy}
                      onChange={(e) =>
                        post({ action: "patchTask", id: t.id, status: e.target.checked ? "erledigt" : "offen" })
                      }
                      className="mt-1"
                    />
                    <span className={cn(t.status === "erledigt" && "text-muted-foreground line-through")}>
                      {t.titel}
                      <span className="text-muted-foreground block text-xs">{t.verantwortlich}</span>
                    </span>
                  </label>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
