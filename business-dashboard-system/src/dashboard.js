// Formt die Daten für ein Frontend / Looker Studio (Phase 7: prepareDashboardData).
import { months as DEFAULT_ROWS } from "./data.js";
import { computeKpis, change, latest, previous } from "./metrics.js";
import { statusLight, detectBottlenecks } from "./analysis.js";

const series = (rows, field) => rows.map((r) => ({ month: r.month, value: r[field] }));

export function prepareDashboardData(rows = DEFAULT_ROWS) {
  const cur = latest(rows);
  const prev = previous(rows);
  const kpis = computeKpis(cur);
  const headline = ["revenue", "wins", "leads", "open_invoices"];

  return {
    updatedAt: new Date().toISOString(),
    status: statusLight(rows),
    // Zeitreihen für Charts
    series: {
      revenue: series(rows, "revenue"),
      wins: series(rows, "wins"),
      leads: series(rows, "leads"),
      website_visitors: series(rows, "website_visitors"),
      impressions: series(rows, "impressions"),
      open_invoices: series(rows, "open_invoices"),
    },
    // Kennzahlen-Kacheln mit Veränderung zum Vormonat
    tiles: headline.map((f) => ({ metric: f, value: cur[f], change: change(cur[f], prev?.[f]) })),
    // Trichter für die aktuelle Periode
    funnel: [
      { stage: "Leads", value: cur.leads },
      { stage: "Termine", value: cur.calls },
      { stage: "Angebote", value: cur.proposals },
      { stage: "Abschlüsse", value: cur.wins },
    ],
    kpis,
    openBottlenecks: detectBottlenecks(rows).length,
  };
}
