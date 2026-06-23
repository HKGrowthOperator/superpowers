"use client";

import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/lib/biz-dashboard";

type Interpretation = { source: string; summary: string; recommendations: string[] };

const eur = (x: number | null) => (x == null ? "—" : `${Math.round(x).toLocaleString("de-DE")} €`);
const pct = (x: number | null) => (x == null ? "—" : `${x > 0 ? "+" : ""}${(x * 100).toFixed(0)} %`);
const STATUS: Record<string, { label: string; cls: string }> = {
  gruen: { label: "Grün", cls: "bg-primary/10 text-primary" },
  gelb: { label: "Gelb", cls: "bg-amber-500/20 text-amber-800" },
  rot: { label: "Rot", cls: "bg-rust/12 text-rust" },
};
const tileLabel: Record<string, string> = { revenue: "Umsatz", wins: "Abschlüsse", leads: "Leads", open_invoices: "Offene Rechnungen" };

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" } as const;

export function KennzahlenView({ dashboard, interpretation }: { dashboard: DashboardData; interpretation: Interpretation }) {
  const revData = dashboard.series.revenue.map((d) => ({ month: d.month, Umsatz: d.value }));
  const funnelLines = dashboard.series.leads.map((d, i) => ({
    month: d.month,
    Leads: d.value,
    Abschlüsse: dashboard.series.wins[i]?.value ?? null,
  }));
  const st = STATUS[dashboard.status] ?? STATUS.gelb;
  const maxFunnel = Math.max(...dashboard.funnel.map((f) => Number(f.value) || 0), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-sm">Periode {dashboard.period}</span>
        <span className={cn("ml-auto inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", st.cls)}>
          Status: {st.label}
        </span>
      </div>

      {/* KPI-Kacheln */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {dashboard.tiles.map((t) => {
          const isMoney = t.metric === "revenue" || t.metric === "open_invoices";
          return (
            <StatCard
              key={t.metric}
              label={tileLabel[t.metric] ?? t.metric}
              value={isMoney ? eur(t.value as number | null) : String(t.value ?? "—")}
              hint={`${pct(t.change.pct)} ggü. Vormonat`}
              tone={t.metric === "open_invoices" ? "warn" : "good"}
            />
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Umsatzentwicklung</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} width={48} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="Umsatz" stroke="var(--chart-1)" fill="url(#gRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Leads &amp; Abschlüsse</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={funnelLines} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Leads" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Abschlüsse" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        {/* Trichter */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Trichter — {dashboard.period}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dashboard.funnel.map((f) => (
              <div key={f.stage} className="text-sm">
                <div className="mb-1 flex justify-between"><span>{f.stage}</span><span className="tabular-nums">{f.value ?? "—"}</span></div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="bg-gold h-full" style={{ width: `${((Number(f.value) || 0) / maxFunnel) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI-Auswertung */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              KI-Auswertung {interpretation.source === "ai" ? "(Claude)" : "(Regeln)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{interpretation.summary}</p>
            <ul className="mt-3 space-y-1.5">
              {interpretation.recommendations.map((r, i) => (
                <li key={i} className="text-muted-foreground flex gap-2 text-sm"><span className="text-gold">→</span>{r}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Engpässe */}
      {dashboard.bottlenecks.length > 0 ? (
        <Card>
          <CardHeader><CardTitle className="text-sm">Erkannte Engpässe</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {dashboard.bottlenecks.map((b, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className={cn("mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                  b.severity >= 3 ? "bg-rust/12 text-rust" : "bg-amber-500/20 text-amber-800")}>
                  {b.severity >= 3 ? "kritisch" : "Achtung"}
                </span>
                <span><strong>{b.title}.</strong> <span className="text-muted-foreground">{b.detail}</span></span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* CEO-Karte */}
      <Card>
        <CardHeader><CardTitle className="text-sm">CEO-Zusammenfassung</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="serif text-base">{dashboard.ceo.headline}</p>
          {dashboard.ceo.biggestRisk ? (
            <p className="text-muted-foreground"><strong>Größtes Risiko:</strong> {dashboard.ceo.biggestRisk.title} — {dashboard.ceo.biggestRisk.detail}</p>
          ) : null}
          <p><strong>Empfohlene Entscheidung:</strong> {dashboard.ceo.decision}</p>
        </CardContent>
      </Card>
    </div>
  );
}
