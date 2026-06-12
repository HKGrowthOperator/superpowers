"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Onboarding } from "@/lib/onboarding";

export function OnboardingView({ initial, smtpReady }: { initial: Onboarding[]; smtpReady: boolean }) {
  const [items, setItems] = useState<Onboarding[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({ firma: "", ansprechpartner: "", email: "", projekt: "" });

  async function reload() {
    const res = await fetch("/api/onboarding", { cache: "no-store" });
    if (res.ok) setItems(((await res.json()) as { items: Onboarding[] }).items);
  }

  async function post(payload: Record<string, unknown>, key: string) {
    setBusy(key);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((json as { error?: string }).error ?? "Aktion fehlgeschlagen");
        return null;
      }
      await reload();
      return json;
    } finally {
      setBusy(null);
    }
  }

  async function sendEmail(id: string, stepKey: string) {
    const json = (await post({ action: "sendStepEmail", id, stepKey }, `${id}:${stepKey}:send`)) as
      | { result?: { sent: boolean; reason?: string } }
      | null;
    if (json?.result && !json.result.sent) {
      alert(
        json.result.reason === "no-smtp"
          ? "E-Mail nicht gesendet: SMTP ist noch nicht eingerichtet (Schritt wurde nicht als gesendet markiert)."
          : json.result.reason === "no-recipient"
            ? "Keine Empfänger-E-Mail hinterlegt."
            : `E-Mail nicht gesendet: ${json.result.reason}`,
      );
    }
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firma.trim() && !form.projekt.trim()) return;
    const ok = await post({ action: "create", ...form }, "create");
    if (ok) setForm({ firma: "", ansprechpartner: "", email: "", projekt: "" });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Noch keine Onboardings. Sie entstehen automatisch, sobald ein Angebot auf „Gewonnen“ gesetzt wird –
            oder lege rechts manuell eins an.
          </p>
        ) : (
          items.map((o) => {
            const done = o.steps.filter((s) => s.status === "erledigt").length;
            return (
              <Card key={o.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{o.firma || o.projekt}</span>
                    <span className="text-muted-foreground text-xs">{o.projekt}</span>
                    {o.email ? <span className="text-muted-foreground text-xs">· {o.email}</span> : null}
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">{done}/6</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="bg-primary h-full" style={{ width: `${(done / 6) * 100}%` }} />
                  </div>
                  <div className="space-y-1.5">
                    {o.steps.map((s, i) => (
                      <div key={s.key} className="flex flex-wrap items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={s.status === "erledigt"}
                          disabled={busy !== null}
                          onChange={() => post({ action: "toggleStep", id: o.id, stepKey: s.key }, `${o.id}:${s.key}:t`)}
                        />
                        <span className={cn(s.status === "erledigt" && "text-muted-foreground line-through")}>
                          {i + 1}. {s.label}
                        </span>
                        {s.emailSentAt ? (
                          <span className="text-primary text-xs">✓ gesendet</span>
                        ) : s.lastResult ? (
                          <span className="text-rust text-xs">{s.lastResult}</span>
                        ) : null}
                        <button
                          onClick={() => sendEmail(o.id, s.key)}
                          disabled={busy !== null}
                          className="border-border ml-auto rounded-md border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50"
                          title={smtpReady ? "E-Mail jetzt senden" : "SMTP nicht eingerichtet"}
                        >
                          {busy === `${o.id}:${s.key}:send` ? "…" : "E-Mail senden"}
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Onboarding manuell anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitCreate} className="space-y-2">
              <input
                value={form.firma}
                onChange={(e) => setForm({ ...form, firma: e.target.value })}
                placeholder="Firma"
                className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
              />
              <input
                value={form.ansprechpartner}
                onChange={(e) => setForm({ ...form, ansprechpartner: e.target.value })}
                placeholder="Ansprechpartner"
                className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
              />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="E-Mail (für den Versand)"
                className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
              />
              <input
                value={form.projekt}
                onChange={(e) => setForm({ ...form, projekt: e.target.value })}
                placeholder="Projekt"
                className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
              />
              <button
                type="submit"
                disabled={busy !== null}
                className="bg-primary text-primary-foreground w-full rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Onboarding starten
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
