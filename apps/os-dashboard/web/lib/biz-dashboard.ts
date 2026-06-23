// lib/biz-dashboard.ts — Kennzahlen-Modul fürs Cockpit.
// Portierte, reine KPI-/Analyse-/Report-Logik des AI Business Dashboard Systems,
// Daten aus Postgres (Tabelle dashboard_metrics, beim ersten Start geseedet).
import { pool } from "./db";
import { getApiKey } from "./assistant";

export type MetricRow = {
  month: string;
  leads: number | null;
  calls: number | null;
  proposals: number | null;
  wins: number | null;
  impressions: number | null;
  website_visitors: number | null;
  content_count: number | null;
  revenue: number | null;
  open_invoices: number | null;
  average_project_value: number | null;
};

export const FIELDS: (keyof MetricRow)[] = [
  "leads", "calls", "proposals", "wins", "impressions", "website_visitors",
  "content_count", "revenue", "open_invoices", "average_project_value",
];

// ── reine Rechenlogik ───────────────────────────────────────────────────────
export function ratio(a: number | null, b: number | null): number | null {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

export function computeKpis(row: MetricRow) {
  return {
    lead_to_call: ratio(row.calls, row.leads),
    call_to_proposal: ratio(row.proposals, row.calls),
    proposal_to_win: ratio(row.wins, row.proposals),
    lead_to_win: ratio(row.wins, row.leads),
    visitor_to_lead: ratio(row.leads, row.website_visitors),
    revenue_per_win: ratio(row.revenue, row.wins),
    pipeline_value:
      row.proposals == null || row.average_project_value == null ? null : row.proposals * row.average_project_value,
    liquidity_pressure: ratio(row.open_invoices, row.revenue),
  };
}

export function change(curr: number | null, prev: number | null) {
  if (curr == null || prev == null) return { abs: null as number | null, pct: null as number | null };
  const abs = curr - prev;
  return { abs, pct: prev === 0 ? null : abs / prev };
}

export function findMissing(rows: MetricRow[]) {
  const missing: { month: string; field: string }[] = [];
  for (const row of rows) for (const f of FIELDS) if (row[f] == null) missing.push({ month: row.month, field: f });
  return missing;
}

export function trend(field: keyof MetricRow, rows: MetricRow[], n = 3): { direction: "up" | "down" | "flat"; pct: number | null } {
  const slice = rows.slice(-n).map((r) => r[field]).filter((v): v is number => v != null);
  if (slice.length < 2) return { direction: "flat", pct: null };
  const first = slice[0];
  const last = slice[slice.length - 1];
  const pct = first === 0 ? null : (last - first) / first;
  return { direction: last > first * 1.02 ? "up" : last < first * 0.98 ? "down" : "flat", pct };
}

export const BENCHMARKS: Record<string, number> = { lead_to_call: 0.6, call_to_proposal: 0.5, proposal_to_win: 0.35, visitor_to_lead: 0.03 };
const STAGE_LABELS: Record<string, string> = { lead_to_call: "Lead → Termin", call_to_proposal: "Termin → Angebot", proposal_to_win: "Angebot → Abschluss", visitor_to_lead: "Besucher → Lead" };

export type Finding = { type: string; severity: number; title: string; detail: string; metric: string; value: number };

export function detectBottlenecks(rows: MetricRow[]): Finding[] {
  const findings: Finding[] = [];
  const last = rows[rows.length - 1];
  if (!last) return findings;
  const kpis = computeKpis(last);

  const missing = findMissing([last]);
  if (missing.length) {
    findings.push({ type: "data_gap", severity: 2, title: "Fehlende Daten im aktuellen Monat",
      detail: `Felder fehlen in ${last.month}: ${missing.map((m) => m.field).join(", ")}.`, metric: "missing_fields", value: missing.length });
  }

  let worst: { stage: string; val: number; gap: number } | null = null;
  for (const stage of Object.keys(BENCHMARKS)) {
    const val = kpis[stage as keyof typeof kpis];
    if (val == null) continue;
    const gap = (BENCHMARKS[stage] - val) / BENCHMARKS[stage];
    if (gap > 0.15 && (!worst || gap > worst.gap)) worst = { stage, val, gap };
  }
  if (worst) {
    findings.push({ type: "funnel_bottleneck", severity: worst.gap > 0.3 ? 3 : 2, title: `Engpass: ${STAGE_LABELS[worst.stage]}`,
      detail: `${STAGE_LABELS[worst.stage]} liegt bei ${(worst.val * 100).toFixed(0)} %, ${(worst.gap * 100).toFixed(0)} % unter dem Richtwert (${(BENCHMARKS[worst.stage] * 100).toFixed(0)} %).`,
      metric: worst.stage, value: worst.val });
  }

  const lp = kpis.liquidity_pressure;
  if (lp != null && lp > 0.35 && trend("open_invoices", rows, 3).direction !== "down") {
    findings.push({ type: "liquidity", severity: lp > 0.45 ? 3 : 2, title: "Liquiditätsdruck steigt",
      detail: `Offene Rechnungen entsprechen ${(lp * 100).toFixed(0)} % des Monatsumsatzes und sinken nicht.`, metric: "liquidity_pressure", value: lp });
  }

  return findings.sort((a, b) => b.severity - a.severity);
}

export function statusLight(rows: MetricRow[]): "gruen" | "gelb" | "rot" {
  const max = detectBottlenecks(rows).reduce((m, f) => Math.max(m, f.severity), 0);
  return max >= 3 ? "rot" : max === 2 ? "gelb" : "gruen";
}

const RECS: Record<string, string> = {
  funnel_bottleneck: "Den schwächsten Trichterschritt gezielt verbessern, bevor mehr Leads zugekauft werden.",
  liquidity: "Mahnwesen automatisieren und Anzahlungen bzw. kürzere Zahlungsziele einführen.",
  data_gap: "Fehlende Datenquelle anbinden, damit die Auswertung vollständig ist.",
};
export function recommendations(rows: MetricRow[]) {
  return detectBottlenecks(rows).map((f) => ({ priority: f.severity, action: RECS[f.type] ?? f.title, basis: f.title }));
}

export function createCEOReport(rows: MetricRow[]) {
  const cur = rows[rows.length - 1];
  const revTrend = trend("revenue", rows, 6);
  const bottlenecks = detectBottlenecks(rows);
  const recs = recommendations(rows);
  return {
    period: cur.month,
    status: statusLight(rows),
    headline: `Umsatz ${revTrend.direction === "up" ? "wächst" : revTrend.direction === "down" ? "fällt" : "stabil"} über 6 Monate, aktuell ${Math.round(cur.revenue ?? 0).toLocaleString("de-DE")} €.`,
    biggestRisk: bottlenecks[0] ? { title: bottlenecks[0].title, detail: bottlenecks[0].detail } : null,
    decision: recs[0]?.action ?? "Kurs halten und skalieren.",
  };
}

export type DashboardData = ReturnType<typeof prepareDashboardData>;
export function prepareDashboardData(rows: MetricRow[]) {
  const cur = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const series = (field: keyof MetricRow) => rows.map((r) => ({ month: r.month.slice(2), value: r[field] }));
  const headline: (keyof MetricRow)[] = ["revenue", "wins", "leads", "open_invoices"];
  return {
    status: statusLight(rows),
    series: {
      revenue: series("revenue"), wins: series("wins"), leads: series("leads"),
      website_visitors: series("website_visitors"), open_invoices: series("open_invoices"),
    },
    tiles: headline.map((f) => ({ metric: f as string, value: cur[f], change: change(cur[f] as number | null, (prev?.[f] ?? null) as number | null) })),
    funnel: [
      { stage: "Leads", value: cur.leads }, { stage: "Termine", value: cur.calls },
      { stage: "Angebote", value: cur.proposals }, { stage: "Abschlüsse", value: cur.wins },
    ],
    kpis: computeKpis(cur),
    bottlenecks: detectBottlenecks(rows),
    recommendations: recommendations(rows),
    ceo: createCEOReport(rows),
    period: cur.month,
  };
}

// ── Persistenz (Postgres) ───────────────────────────────────────────────────
const SEED: MetricRow[] = [
  { month: "2025-01", leads: 60, calls: 42, proposals: 18, wins: 6, impressions: 42000, website_visitors: 2100, content_count: 8, revenue: 28000, open_invoices: 9000, average_project_value: 4600 },
  { month: "2025-02", leads: 68, calls: 47, proposals: 20, wins: 7, impressions: 47000, website_visitors: 2350, content_count: 9, revenue: 31000, open_invoices: 11000, average_project_value: 4700 },
  { month: "2025-03", leads: 75, calls: 50, proposals: 22, wins: 8, impressions: 52000, website_visitors: 2600, content_count: 10, revenue: 34000, open_invoices: 12000, average_project_value: 4750 },
  { month: "2025-04", leads: 81, calls: 53, proposals: 25, wins: 8, impressions: 58000, website_visitors: 2850, content_count: 10, revenue: 35000, open_invoices: 14000, average_project_value: 4800 },
  { month: "2025-05", leads: 88, calls: 55, proposals: 28, wins: 8, impressions: 63000, website_visitors: 3050, content_count: 11, revenue: 36000, open_invoices: 16000, average_project_value: 4850 },
  { month: "2025-06", leads: 92, calls: 57, proposals: 30, wins: 9, impressions: 67000, website_visitors: 3200, content_count: 11, revenue: 38000, open_invoices: 18000, average_project_value: 4900 },
  { month: "2025-07", leads: 85, calls: 49, proposals: 26, wins: 8, impressions: 64000, website_visitors: 2950, content_count: 7, revenue: 36000, open_invoices: 19000, average_project_value: 4900 },
  { month: "2025-08", leads: 90, calls: 52, proposals: 27, wins: 9, impressions: 66000, website_visitors: 3100, content_count: 8, revenue: 39000, open_invoices: 17000, average_project_value: 4950 },
  { month: "2025-09", leads: 102, calls: 64, proposals: 33, wins: 13, impressions: 72000, website_visitors: 3600, content_count: 12, revenue: 47000, open_invoices: 15000, average_project_value: 5000 },
  { month: "2025-10", leads: 110, calls: 70, proposals: 36, wins: 15, impressions: 78000, website_visitors: 3900, content_count: 13, revenue: 53000, open_invoices: 14000, average_project_value: 5050 },
  { month: "2025-11", leads: 118, calls: 74, proposals: 39, wins: 16, impressions: 83000, website_visitors: 4200, content_count: 13, revenue: 57000, open_invoices: 13500, average_project_value: 5100 },
  { month: "2025-12", leads: 96, calls: 60, proposals: 31, wins: 12, impressions: 70000, website_visitors: 3500, content_count: 9, revenue: 49000, open_invoices: 15000, average_project_value: 5150 },
  { month: "2026-01", leads: 124, calls: 80, proposals: 42, wins: 18, impressions: 88000, website_visitors: 4500, content_count: 14, revenue: 62000, open_invoices: 13000, average_project_value: 5200 },
  { month: "2026-02", leads: 130, calls: 84, proposals: 44, wins: 19, impressions: 92000, website_visitors: null, content_count: 14, revenue: 64000, open_invoices: 12500, average_project_value: 5250 },
];

let ready: Promise<void> | null = null;
async function ensureSchema(): Promise<void> {
  await pool.query(`CREATE TABLE IF NOT EXISTS dashboard_metrics (month text PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());`);
  const { rows } = await pool.query<{ n: string }>("SELECT count(*)::text AS n FROM dashboard_metrics");
  if (rows[0]?.n === "0") {
    for (const r of SEED) await pool.query("INSERT INTO dashboard_metrics (month, data) VALUES ($1,$2) ON CONFLICT (month) DO NOTHING", [r.month, JSON.stringify(r)]);
  }
}
function init(): Promise<void> {
  if (!ready) ready = ensureSchema();
  return ready;
}

export async function loadRows(): Promise<MetricRow[]> {
  await init();
  const { rows } = await pool.query<{ data: MetricRow }>("SELECT data FROM dashboard_metrics ORDER BY month ASC");
  return rows.map((r) => r.data);
}

export async function upsertMonth(row: MetricRow): Promise<void> {
  await init();
  await pool.query("INSERT INTO dashboard_metrics (month, data) VALUES ($1,$2) ON CONFLICT (month) DO UPDATE SET data=$2, updated_at=now()", [row.month, JSON.stringify(row)]);
}

/** AI-Auswertung: Claude wenn Schlüssel hinterlegt, sonst Regel-Auswertung. */
export async function interpret(rows: MetricRow[]): Promise<{ source: string; summary: string; recommendations: string[] }> {
  const bottlenecks = detectBottlenecks(rows);
  const recs = recommendations(rows);
  const fallback = {
    source: "rules",
    summary: bottlenecks.length === 0 ? "Keine akuten Engpässe. Die Kennzahlen sind stabil oder steigend." : `Wichtigster Engpass: ${bottlenecks[0].title}. ${bottlenecks[0].detail}`,
    recommendations: recs.map((r) => r.action),
  };
  const apiKey = await getApiKey();
  if (!apiKey) return fallback;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{ role: "user", content: `Du bist Business-Analyst für ein KMU. Fasse die Lage in 2 Sätzen zusammen und gib 3 konkrete Handlungsempfehlungen. Antworte als JSON {"summary":"...","recommendations":["..."]}. Daten:\n${JSON.stringify({ ceo: createCEOReport(rows), bottlenecks, kpis: computeKpis(rows[rows.length - 1]) })}` }],
      }),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return { source: "ai", summary: String(json.summary ?? fallback.summary), recommendations: Array.isArray(json.recommendations) ? json.recommendations : fallback.recommendations };
  } catch {
    return fallback;
  }
}
