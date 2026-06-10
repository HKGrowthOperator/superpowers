"use client";

import { useState } from "react";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Offer, OfferSummary, OfferStats, OfferTask, OutboxEntry } from "@/lib/smart-offer";

type ListData = { stats: OfferStats; offers: OfferSummary[]; outbox: OutboxEntry[]; tasks: OfferTask[] };

const STATUS_LABELS: Record<string, string> = {
  entwurf: "Entwurf",
  geprueft: "Geprüft",
  versendet: "Versendet",
  gewonnen: "Gewonnen",
  verloren: "Verloren",
};
const STATUS_FLOW: Record<string, string[]> = {
  entwurf: ["geprueft", "verloren"],
  geprueft: ["versendet", "verloren"],
  versendet: ["gewonnen", "verloren"],
  gewonnen: [],
  verloren: [],
};

function statusTone(s: string): string {
  if (s === "gewonnen") return "bg-primary/10 text-primary";
  if (s === "verloren") return "bg-rust/12 text-rust";
  if (s === "versendet") return "bg-gold/15 text-gold-ink";
  if (s === "geprueft") return "bg-amber-500/20 text-amber-800";
  return "bg-secondary text-muted-foreground";
}

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function Pill({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", className)}>
      {text}
    </span>
  );
}

export function OfferView({ initial }: { initial: ListData }) {
  const [data, setData] = useState<ListData>(initial);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Offer | null>(null);
  const [lead, setLead] = useState({ firma: "", email: "", quelle: "Formular", beschreibung: "" });
  const [edit, setEdit] = useState({ leistung: "", einzelpreis: 0, email: "" });

  async function reload() {
    const res = await fetch("/api/angebote", { cache: "no-store" });
    if (res.ok) setData((await res.json()) as ListData);
  }

  async function post(payload: Record<string, unknown>): Promise<unknown | null> {
    setBusy(true);
    try {
      const res = await fetch("/api/angebote", {
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
      setBusy(false);
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!lead.beschreibung.trim()) return;
    const ok = await post({ action: "createLead", ...lead });
    if (ok) setLead({ firma: "", email: "", quelle: lead.quelle, beschreibung: "" });
  }

  async function openOffer(id: string) {
    const res = await fetch(`/api/angebote?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return;
    const offer = (await res.json()) as Offer;
    setSelected(offer);
    setEdit({
      leistung: offer.positionen[0]?.beschreibung ?? "",
      einzelpreis: offer.positionen[0]?.einzelpreis ?? 0,
      email: offer.kunde.email ?? "",
    });
  }

  async function saveReview(closeAfter: boolean) {
    if (!selected) return;
    const positionen = selected.positionen.map((p, i) =>
      i === 0 ? { ...p, beschreibung: edit.leistung, einzelpreis: Number(edit.einzelpreis) || 0 } : p,
    );
    await post({
      action: "updateOffer",
      id: selected.id,
      patch: { positionen, kunde: { ...selected.kunde, email: edit.email } },
    });
    if (closeAfter) {
      await post({ action: "changeStatus", id: selected.id, status: "geprueft" });
      setSelected(null);
    } else {
      await openOffer(selected.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Offen" value={String(data.stats.offen)} />
        <StatCard
          label="Abschlussquote"
          value={data.stats.abschlussquote == null ? "–" : `${data.stats.abschlussquote}%`}
          tone="good"
        />
        <StatCard label="Offenes Volumen" value={eur.format(data.stats.offenesVolumen)} />
        <StatCard label="Gewonnenes Volumen" value={eur.format(data.stats.gewonnenesVolumen)} tone="good" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => post({ action: "runFollowUps" })}
              disabled={busy}
              className="border-border rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            >
              Follow-ups prüfen
            </button>
          </div>

          {data.offers.length === 0 ? (
            <p className="text-muted-foreground text-sm">Noch keine Angebote. Rechts eine Anfrage einfügen.</p>
          ) : (
            data.offers.map((o) => (
              <Card key={o.id}>
                <CardContent className="space-y-2 pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill text={STATUS_LABELS[o.status] ?? o.status} className={statusTone(o.status)} />
                    <span className="font-mono text-xs text-muted-foreground">{o.nummer}</span>
                    {o.faelligeFollowUps > 0 ? (
                      <Pill text={`${o.faelligeFollowUps} Follow-up fällig`} className="bg-amber-500/20 text-amber-800" />
                    ) : null}
                    <span className="ml-auto text-sm font-semibold tabular-nums">{eur.format(o.summe)}</span>
                  </div>
                  <div className="text-sm font-semibold">
                    {o.kunde.firma || "(ohne Firma)"} ·{" "}
                    <span className="text-muted-foreground font-normal">{o.leistung}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => openOffer(o.id)}
                      className="border-border rounded-md border px-3 py-1 text-xs hover:bg-muted"
                    >
                      Prüfen / Bearbeiten
                    </button>
                    <a
                      href={`/api/angebote/pdf?id=${encodeURIComponent(o.id)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="border-border rounded-md border px-3 py-1 text-xs hover:bg-muted"
                    >
                      PDF
                    </a>
                    {(STATUS_FLOW[o.status] ?? []).map((next) => (
                      <button
                        key={next}
                        onClick={() => post({ action: "changeStatus", id: o.id, status: next })}
                        disabled={busy}
                        className="border-border rounded-md border px-3 py-1 text-xs hover:bg-muted disabled:opacity-50"
                      >
                        → {STATUS_LABELS[next]}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Neue Anfrage</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitLead} className="space-y-2">
                <input
                  value={lead.firma}
                  onChange={(e) => setLead({ ...lead, firma: e.target.value })}
                  placeholder="Firma"
                  className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
                />
                <input
                  value={lead.email}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  placeholder="E-Mail (optional)"
                  className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
                />
                <textarea
                  value={lead.beschreibung}
                  onChange={(e) => setLead({ ...lead, beschreibung: e.target.value })}
                  placeholder="Notizen / Anfrage als Freitext (z. B. „Website Relaunch, ca. 4.900 €, 50/50, 3 Wochen“)"
                  rows={5}
                  className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="bg-primary text-primary-foreground w-full rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50"
                >
                  Angebotsentwurf erzeugen
                </button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Vertriebsaufgaben &amp; Entwürfe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.tasks.length === 0 && data.outbox.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nichts offen.</p>
              ) : null}
              {data.tasks.map((t) => (
                <label key={t.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!t.erledigt}
                    disabled={busy}
                    onChange={() => post({ action: "completeTask", id: t.id })}
                    className="mt-1"
                  />
                  <span className={cn(t.erledigt && "text-muted-foreground line-through")}>{t.titel}</span>
                </label>
              ))}
              {data.outbox.map((o) => (
                <div key={o.id} className="text-muted-foreground text-xs">
                  ✉️ {o.betreff ?? "Entwurf"} {o.an ? `→ ${o.an}` : ""}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Prüf-/Bearbeiten-Dialog */}
      {selected ? (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card mt-10 w-full max-w-lg rounded-xl border p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <Pill text={STATUS_LABELS[selected.status] ?? selected.status} className={statusTone(selected.status)} />
              <span className="font-mono text-xs text-muted-foreground">{selected.nummer}</span>
              <button onClick={() => setSelected(null)} className="text-muted-foreground ml-auto text-sm">
                ✕
              </button>
            </div>
            <p className="text-muted-foreground mb-3 text-xs">{selected.extraktion.zusammenfassung}</p>
            <div className="space-y-2">
              <label className="block text-xs font-medium">Leistung</label>
              <input
                value={edit.leistung}
                onChange={(e) => setEdit({ ...edit, leistung: e.target.value })}
                className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
              />
              <label className="block text-xs font-medium">Preis (netto, €)</label>
              <input
                type="number"
                value={edit.einzelpreis}
                onChange={(e) => setEdit({ ...edit, einzelpreis: Number(e.target.value) })}
                className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
              />
              <label className="block text-xs font-medium">Kunden-E-Mail</label>
              <input
                value={edit.email}
                onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                className="border-border bg-card w-full rounded-md border px-2 py-1.5 text-sm"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => saveReview(false)}
                disabled={busy}
                className="border-border rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
              >
                Speichern
              </button>
              {selected.status === "entwurf" ? (
                <button
                  onClick={() => saveReview(true)}
                  disabled={busy}
                  className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50"
                >
                  Prüfung abschließen
                </button>
              ) : null}
              <a
                href={`/api/angebote/pdf?id=${encodeURIComponent(selected.id)}`}
                target="_blank"
                rel="noreferrer"
                className="border-border ml-auto rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              >
                PDF öffnen
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
