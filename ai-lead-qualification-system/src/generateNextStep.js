/**
 * generateNextStep — Schritt 3 der Pipeline.
 *
 * KEIN Mock: Reine Geschäftslogik (läuft so in Produktion).
 * Übersetzt Temperatur + Kategorie + Kontaktlage in eine konkrete Handlung
 * mit Zeitvorgabe. Die Regeln entsprechen docs/01-analyse-und-plan.md, 1.5.
 */

import { config } from "./config.js";

/**
 * @param {object} lead - Lead nach Klassifikation + Scoring
 * @returns {{ recommended_next_step: string, assigned_to: string, follow_up_in_days: number|null }}
 */
export function generateNextStep(lead) {
  // Sonderfälle vor der Temperatur-Logik: Kategorie schlägt Score.
  if (lead.category === "unclear") {
    return {
      recommended_next_step:
        "Kurze freundliche Rückfrage senden (max. 2 Fragen: Branche? Anliegen?). Keine Unterlagen-Schlacht. Wiedervorlage in 7 Tagen, danach schließen.",
      assigned_to: config.assigneeDefault,
      follow_up_in_days: 7,
    };
  }

  if (lead.category === "price_inquiry") {
    return {
      recommended_next_step:
        "Innerhalb von 2 Werktagen mit Wert-Argumentation antworten (Preisspanne + konkreter Nutzen-Unterschied). Nicht in Preisverhandlung einsteigen. Wiedervorlage in 5 Tagen, geringe Priorität.",
      assigned_to: config.assigneeDefault,
      follow_up_in_days: 5,
    };
  }

  switch (lead.lead_temperature) {
    case "hot":
      return lead.contact_phone
        ? {
            recommended_next_step: `Innerhalb von ${lead.urgency === "critical" ? "1 Stunde" : "2 Stunden"} anrufen, Erstgespräch anbieten. Bei Nichterreichen: sofort E-Mail mit 2 Terminvorschlägen.`,
            assigned_to: config.assigneeHot,
            follow_up_in_days: 1,
          }
        : {
            recommended_next_step:
              "Sofort per E-Mail antworten: 2 konkrete Terminvorschläge (Wochentag + Uhrzeit) für ein 20-Minuten-Erstgespräch, Telefonnummer erfragen.",
            assigned_to: config.assigneeHot,
            follow_up_in_days: 2,
          };

    case "warm":
      return {
        recommended_next_step: `Am selben Werktag persönlich antworten. Gezielt nachfragen: ${formatMissing(lead)}. Gespräch anbieten, ohne Druck.`,
        assigned_to: config.assigneeDefault,
        follow_up_in_days: 3,
      };

    default: // cold
      return {
        recommended_next_step:
          "Innerhalb von 2 Werktagen freundliche Standardantwort mit passendem Info-Material. Wiedervorlage in 7 Tagen.",
        assigned_to: config.assigneeDefault,
        follow_up_in_days: 7,
      };
  }
}

function formatMissing(lead) {
  const missing = (lead.missing_information ?? []).slice(0, 2);
  return missing.length ? missing.join(" und ") : "Zeitrahmen und Budget";
}
