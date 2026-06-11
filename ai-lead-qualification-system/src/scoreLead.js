/**
 * scoreLead — Schritt 2 der Pipeline.
 *
 * KEIN Mock: Dieses Scoring ist bewusst deterministische Logik und läuft
 * genauso in Produktion. Gleicher Input = gleicher Score, jede Dimension
 * einzeln begründet. Das schafft Vertrauen beim Kunden ("warum 72?") und
 * macht die Gewichte in config.js pro Kunde justierbar.
 *
 * Die LLM-Variante (für No-Code-Strecken ohne Code-Step) bildet exakt
 * dieselben Regeln ab: prompts/lead-scoring-prompt.md.
 */

import { config } from "./config.js";

/**
 * @param {object} lead - klassifizierter Lead inkl. contact_email / contact_phone
 * @returns {{ lead_score: number, lead_temperature: string, score_breakdown: object, summary_reason: string }}
 */
export function scoreLead(lead) {
  const s = config.scoring;

  const budget = {
    points: s.budget[lead.budget_range] ?? s.budget.unknown,
    max: 25,
    reason:
      lead.budget_range === "unknown"
        ? "Kein Budget genannt — neutraler Mittelwert, keine Bestrafung."
        : `Budget eingestuft als ${lead.budget_range}.`,
  };

  const urgency = {
    points: s.urgency[lead.urgency] ?? s.urgency.low,
    max: 20,
    reason: `Dringlichkeit: ${lead.urgency ?? "unbekannt"}.`,
  };

  let fitPoints = s.serviceFit.fallback;
  let fitReason = "Kategorie unklar oder außerhalb des Leistungsangebots.";
  if (config.coreCategories.includes(lead.category)) {
    fitPoints = s.serviceFit.core;
    fitReason = `"${lead.category}" ist Kernleistung.`;
  } else if (config.edgeCategories.includes(lead.category)) {
    fitPoints = s.serviceFit.edge;
    fitReason = `"${lead.category}" ist Randleistung.`;
  } else if (lead.category === "price_inquiry") {
    fitPoints = s.serviceFit.price_inquiry;
    fitReason = "Reine Preisabfrage — geringe Abschlusswahrscheinlichkeit zum Zielpreis.";
  }
  const serviceFit = { points: fitPoints, max: 20, reason: fitReason };

  const decisionStage = {
    points: s.decisionStage[lead.decision_stage] ?? s.decisionStage.unknown,
    max: 15,
    reason: `Entscheidungsphase: ${lead.decision_stage ?? "unbekannt"}.`,
  };

  const contactCount = [lead.contact_email, lead.contact_phone].filter(Boolean).length;
  const contactQuality = {
    points: contactCount === 2 ? s.contactQuality.both : contactCount === 1 ? s.contactQuality.one : s.contactQuality.none,
    max: 10,
    reason: contactCount === 2 ? "E-Mail und Telefon vorhanden." : contactCount === 1 ? "Nur ein Kontaktweg vorhanden." : "Keine direkten Kontaktdaten.",
  };

  const reqCount = (lead.extracted_requirements ?? []).length;
  const clarity = {
    points: reqCount >= 3 ? s.clarity.detailed : reqCount >= 1 ? s.clarity.some : s.clarity.none,
    max: 10,
    reason: reqCount > 0 ? `${reqCount} konkrete Anforderung(en) formuliert.` : "Keine konkreten Anforderungen erkennbar.",
  };

  const breakdown = { budget, urgency, service_fit: serviceFit, decision_stage: decisionStage, contact_quality: contactQuality, clarity };
  const lead_score = Object.values(breakdown).reduce((sum, d) => sum + d.points, 0);

  const lead_temperature =
    lead_score >= config.temperature.hot ? "hot" : lead_score >= config.temperature.warm ? "warm" : "cold";

  return {
    lead_score,
    lead_temperature,
    score_breakdown: breakdown,
    summary_reason: buildSummaryReason(lead, lead_score, lead_temperature, breakdown),
  };
}

function buildSummaryReason(lead, score, temperature, breakdown) {
  const top = Object.entries(breakdown)
    .sort((a, b) => b[1].points / b[1].max - a[1].points / a[1].max)
    .slice(0, 2)
    .map(([name]) => name.replace("_", " "));
  const labels = { hot: "Sofort handeln", warm: "Zeitnah antworten", cold: "Niedrige Priorität" };
  return `${labels[temperature]} (${score}/100) — stärkste Signale: ${top.join(", ")}.`;
}
