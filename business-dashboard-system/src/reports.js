// Berichts-Generatoren. Liefern strukturierte Objekte, die exakt auf die
// Markdown-Templates in /templates passen und an die AI-Schicht gehen.
import { months as DEFAULT_ROWS } from "./data.js";
import { computeKpis, change, latest, previous } from "./metrics.js";
import { detectBottlenecks, trend, statusLight } from "./analysis.js";

const pct = (x) => (x == null ? "—" : `${(x * 100).toFixed(0)} %`);
const eur = (x) => (x == null ? "—" : `${Math.round(x).toLocaleString("de-DE")} €`);

/** Leitet aus den Engpässen konkrete Handlungsempfehlungen ab. */
export function recommendations(rows = DEFAULT_ROWS) {
  const map = {
    funnel_bottleneck: "Den schwächsten Trichterschritt gezielt verbessern (Skript, Angebot, Follow-up), bevor mehr Leads zugekauft werden.",
    liquidity: "Mahnwesen automatisieren und Anzahlungen/kürzere Zahlungsziele einführen.",
    content_drop: "Content-Frequenz wieder auf den Vormonatsschnitt bringen (Redaktionsplan).",
    data_gap: "Fehlende Datenquelle anbinden, damit die Auswertung vollständig ist.",
  };
  return detectBottlenecks(rows).map((f) => ({ priority: f.severity, action: map[f.type] ?? f.title, basis: f.title }));
}

/** Wochen-/Kurzreport für die letzte verfügbare Periode (Phase 7). */
export function generateWeeklySummary(rows = DEFAULT_ROWS) {
  const cur = latest(rows);
  const prev = previous(rows);
  const head = ["leads", "wins", "revenue"].map((f) => ({
    metric: f,
    value: cur[f],
    change: change(cur[f], prev?.[f]),
  }));
  const recs = recommendations(rows);
  return {
    type: "weekly_summary",
    period: cur.month,
    note: "Datengranularität ist monatlich; gezeigt wird die letzte verfügbare Periode.",
    status: statusLight(rows),
    headline: head,
    topRecommendation: recs[0]?.action ?? "Kurs halten, keine akuten Engpässe.",
    generatedAt: new Date().toISOString(),
  };
}

/** Vollständiger Monatsreport mit allen KPIs, Veränderungen, Engpässen. */
export function generateMonthlyReport(rows = DEFAULT_ROWS) {
  const cur = latest(rows);
  const prev = previous(rows);
  const kpis = computeKpis(cur);
  const kpisPrev = prev ? computeKpis(prev) : {};
  const fields = ["revenue", "wins", "leads", "proposals", "website_visitors", "open_invoices"];
  return {
    type: "monthly_report",
    period: cur.month,
    status: statusLight(rows),
    kpis,
    metrics: fields.map((f) => ({ metric: f, value: cur[f], change: change(cur[f], prev?.[f]) })),
    funnel: {
      lead_to_call: { value: kpis.lead_to_call, change: change(kpis.lead_to_call, kpisPrev.lead_to_call) },
      call_to_proposal: { value: kpis.call_to_proposal, change: change(kpis.call_to_proposal, kpisPrev.call_to_proposal) },
      proposal_to_win: { value: kpis.proposal_to_win, change: change(kpis.proposal_to_win, kpisPrev.proposal_to_win) },
    },
    bottlenecks: detectBottlenecks(rows),
    recommendations: recommendations(rows),
    generatedAt: new Date().toISOString(),
  };
}

/** CEO-Zusammenfassung: Lage, größtes Risiko, eine Entscheidung (Phase 7). */
export function createCEOReport(rows = DEFAULT_ROWS) {
  const cur = latest(rows);
  const revTrend = trend("revenue", rows, 6);
  const winTrend = trend("wins", rows, 6);
  const bottlenecks = detectBottlenecks(rows);
  const top = bottlenecks[0];
  const recs = recommendations(rows);
  return {
    type: "ceo_report",
    period: cur.month,
    status: statusLight(rows),
    headline: `Umsatz ${revTrend.direction === "up" ? "wächst" : revTrend.direction === "down" ? "fällt" : "stabil"} (${pct(revTrend.pct)} über 6 Monate), aktuell ${eur(cur.revenue)}.`,
    growth: { revenue: revTrend, wins: winTrend },
    biggestRisk: top ? { title: top.title, detail: top.detail } : null,
    decision: recs[0]?.action ?? "Kurs halten und skalieren.",
    generatedAt: new Date().toISOString(),
  };
}

/** Vertriebsreport: Trichter und Pipeline. */
export function salesReport(rows = DEFAULT_ROWS) {
  const cur = latest(rows);
  const prev = previous(rows);
  const kpis = computeKpis(cur);
  return {
    type: "sales_report",
    period: cur.month,
    funnel: ["leads", "calls", "proposals", "wins"].map((f) => ({ stage: f, value: cur[f], change: change(cur[f], prev?.[f]) })),
    closeRate: kpis.proposal_to_win,
    pipelineValue: kpis.pipeline_value,
    revenuePerWin: kpis.revenue_per_win,
    recommendations: recommendations(rows).filter((r) => r.basis.includes("Abschluss") || r.basis.includes("Termin")),
  };
}

/** Marketingreport: Reichweite, Besucher, Content, Effizienz. */
export function marketingReport(rows = DEFAULT_ROWS) {
  const cur = latest(rows);
  const prev = previous(rows);
  const kpis = computeKpis(cur);
  return {
    type: "marketing_report",
    period: cur.month,
    metrics: ["impressions", "website_visitors", "content_count"].map((f) => ({ metric: f, value: cur[f], change: change(cur[f], prev?.[f]) })),
    visitorToLead: kpis.visitor_to_lead,
    trends: {
      impressions: trend("impressions", rows, 3),
      website_visitors: trend("website_visitors", rows, 3),
    },
  };
}

export { pct, eur };
