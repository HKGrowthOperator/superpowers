// KPI-Engine: rohe Monatsfelder → abgeleitete Kennzahlen, Veränderungen,
// und Erkennung fehlender Daten. Quellen-agnostisch.
import { months as DEFAULT_ROWS, FIELDS } from "./data.js";

/** Division mit Schutz vor null/0 → gibt null zurück, wenn nicht berechenbar. */
export function ratio(a, b) {
  if (a == null || b == null || b === 0) return null;
  return a / b;
}

/** Findet fehlende/null Felder pro Monat (für Datenqualität & Tests). */
export function findMissing(rows = DEFAULT_ROWS) {
  const missing = [];
  for (const row of rows) {
    for (const field of FIELDS) {
      if (row[field] == null) missing.push({ month: row.month, field });
    }
  }
  return missing;
}

/**
 * Sammelt und normalisiert die Metriken (Phase 7: collectMetrics).
 * @returns {{months: object[], count: number, missing: {month:string,field:string}[]}}
 */
export function collectMetrics(rows = DEFAULT_ROWS) {
  return { months: rows, count: rows.length, missing: findMissing(rows) };
}

/** Abgeleitete KPIs eines Monats. Nicht berechenbare Werte werden null. */
export function computeKpis(row) {
  return {
    lead_to_call: ratio(row.calls, row.leads),
    call_to_proposal: ratio(row.proposals, row.calls),
    proposal_to_win: ratio(row.wins, row.proposals),
    lead_to_win: ratio(row.wins, row.leads),
    visitor_to_lead: ratio(row.leads, row.website_visitors),
    revenue_per_win: ratio(row.revenue, row.wins),
    pipeline_value:
      row.proposals == null || row.average_project_value == null
        ? null
        : row.proposals * row.average_project_value,
    liquidity_pressure: ratio(row.open_invoices, row.revenue),
  };
}

/** Veränderung zwischen zwei Werten: absolut und prozentual. */
export function change(curr, prev) {
  if (curr == null || prev == null) return { abs: null, pct: null };
  const abs = curr - prev;
  return { abs, pct: prev === 0 ? null : abs / prev };
}

export const latest = (rows = DEFAULT_ROWS) => rows[rows.length - 1];
export const previous = (rows = DEFAULT_ROWS) => rows[rows.length - 2];

/** Bequemer Vergleich eines Feldes: aktueller vs. vorheriger Monat. */
export function fieldChange(field, rows = DEFAULT_ROWS) {
  return change(latest(rows)?.[field], previous(rows)?.[field]);
}
