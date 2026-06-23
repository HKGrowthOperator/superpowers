// Trend- und Engpass-Analyse. Macht aus Zahlen Aussagen: wo klemmt es?
import { months as DEFAULT_ROWS } from "./data.js";
import { computeKpis, findMissing, ratio } from "./metrics.js";

/** Mittelwert über Zahlen (null wird ignoriert). */
function avg(nums) {
  const xs = nums.filter((n) => n != null);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

/**
 * Trendrichtung eines Feldes über die letzten n Monate.
 * @returns {{direction:"up"|"down"|"flat", pct:number|null}}
 */
export function trend(field, rows = DEFAULT_ROWS, n = 3) {
  const slice = rows.slice(-n).map((r) => r[field]).filter((v) => v != null);
  if (slice.length < 2) return { direction: "flat", pct: null };
  const first = slice[0];
  const last = slice[slice.length - 1];
  const pct = first === 0 ? null : (last - first) / first;
  const direction = last > first * 1.02 ? "up" : last < first * 0.98 ? "down" : "flat";
  return { direction, pct };
}

// Branchen-neutrale Richtwerte für die Trichterstufen (überschreibbar je Preset).
export const BENCHMARKS = {
  lead_to_call: 0.6,
  call_to_proposal: 0.5,
  proposal_to_win: 0.35,
  visitor_to_lead: 0.03,
};

const STAGE_LABELS = {
  lead_to_call: "Lead → Termin",
  call_to_proposal: "Termin → Angebot",
  proposal_to_win: "Angebot → Abschluss",
  visitor_to_lead: "Besucher → Lead",
};

/**
 * Engpass-Erkennung (Phase 7: detectBottlenecks).
 * Prüft Datenlücken, schwächste Trichterstufe, Liquidität, Marketing-Effizienz
 * und Content-Konsistenz. Liefert sortierte Findings (höchste Severity zuerst).
 */
export function detectBottlenecks(rows = DEFAULT_ROWS) {
  const findings = [];
  const last = rows[rows.length - 1];
  const kpis = computeKpis(last);

  // 1) Datenlücken
  const missing = findMissing([last]);
  if (missing.length) {
    findings.push({
      type: "data_gap",
      severity: 2,
      title: "Fehlende Daten im aktuellen Monat",
      detail: `Folgende Felder fehlen in ${last.month}: ${missing.map((m) => m.field).join(", ")}. Auswertung ist eingeschränkt.`,
      metric: "missing_fields",
      value: missing.length,
    });
  }

  // 2) Schwächste Trichterstufe relativ zum Richtwert
  let worst = null;
  for (const stage of Object.keys(BENCHMARKS)) {
    const val = kpis[stage];
    if (val == null) continue;
    const gap = (BENCHMARKS[stage] - val) / BENCHMARKS[stage]; // >0 = unter Richtwert
    if (gap > 0.15 && (!worst || gap > worst.gap)) worst = { stage, val, gap };
  }
  if (worst) {
    findings.push({
      type: "funnel_bottleneck",
      severity: worst.gap > 0.3 ? 3 : 2,
      title: `Engpass: ${STAGE_LABELS[worst.stage]}`,
      detail: `${STAGE_LABELS[worst.stage]} liegt bei ${(worst.val * 100).toFixed(0)} % und damit ${(worst.gap * 100).toFixed(0)} % unter dem Richtwert (${(BENCHMARKS[worst.stage] * 100).toFixed(0)} %). Hier geht das meiste Potenzial verloren.`,
      metric: worst.stage,
      value: worst.val,
    });
  }

  // 3) Liquiditätsdruck (offene Rechnungen vs. Umsatz), steigend
  const lp = kpis.liquidity_pressure;
  const lpTrend = trend("open_invoices", rows, 3);
  if (lp != null && lp > 0.35 && lpTrend.direction !== "down") {
    findings.push({
      type: "liquidity",
      severity: lp > 0.45 ? 3 : 2,
      title: "Liquiditätsdruck steigt",
      detail: `Offene Rechnungen entsprechen ${(lp * 100).toFixed(0)} % des Monatsumsatzes und sinken nicht. Mahnwesen / Zahlungsziele prüfen.`,
      metric: "liquidity_pressure",
      value: lp,
    });
  }

  // 4) Content-Konsistenz
  const contentAvg = avg(rows.slice(-4, -1).map((r) => r.content_count));
  if (last.content_count != null && contentAvg != null && last.content_count < contentAvg * 0.8) {
    findings.push({
      type: "content_drop",
      severity: 1,
      title: "Content-Output bricht ein",
      detail: `Content-Stückzahl liegt mit ${last.content_count} unter dem Schnitt der Vormonate (${contentAvg.toFixed(1)}). Reichweite folgt verzögert nach unten.`,
      metric: "content_count",
      value: last.content_count,
    });
  }

  return findings.sort((a, b) => b.severity - a.severity);
}

/** Gesamtampel: grün / gelb / rot anhand der höchsten Severity. */
export function statusLight(rows = DEFAULT_ROWS) {
  const max = detectBottlenecks(rows).reduce((m, f) => Math.max(m, f.severity), 0);
  return max >= 3 ? "rot" : max === 2 ? "gelb" : "gruen";
}

export { ratio };
