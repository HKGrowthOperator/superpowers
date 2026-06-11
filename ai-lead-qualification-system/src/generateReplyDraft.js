/**
 * generateReplyDraft — Schritt 4 der Pipeline.
 *
 * MOCK-MODUS: Baut den Entwurf aus Textbausteinen. Damit ist die Pipeline
 * ohne API-Key durchspielbar — die Bausteine zeigen Struktur und Tonalität,
 * klingen aber naturgemäß generischer als die LLM-Variante.
 *
 * INTEGRATION: In Produktion durch einen LLM-Call ersetzen — System-Prompt
 * aus prompts/reply-generation-prompt.md (sprachstarkes Modell, z. B.
 * Claude Sonnet, Temperatur 0.5-0.7). Das Output-Format ist identisch.
 * Beispiel-Code: docs/03-integrationen.md, Abschnitt 1.
 *
 * WICHTIG: Der Entwurf ist IMMER zur Freigabe gedacht, nie für Auto-Versand.
 */

import { config } from "./config.js";

/**
 * @param {object} lead - vollständig qualifizierter Lead
 * @returns {{ subject: string|null, reply_text: string, internal_note: string }}
 */
export function generateReplyDraft(lead) {
  const salutation = lead.name ? `Hallo ${lead.name},` : "Guten Tag,";
  const informal = lead.source === "whatsapp" || lead.source === "social_dm";
  const closing = `\n\nViele Grüße\n${config.senderName}`;

  if (lead.category === "unclear") {
    return {
      subject: informal ? null : "Ihre Anfrage — kurze Rückfrage",
      reply_text:
        `${salutation}\n\ndanke für Ihre Nachricht! Damit ich Ihnen etwas wirklich Passendes schicken kann: ` +
        `Um welche Branche geht es bei Ihnen, und was ist der Anlass Ihrer Anfrage?` +
        closing,
      internal_note: "Unklare Anfrage — erst nach Antwort auf die Rückfragen Zeit investieren.",
    };
  }

  if (lead.category === "price_inquiry") {
    return {
      subject: informal ? null : "Ihre Preisanfrage — eine ehrliche Antwort",
      reply_text:
        `${salutation}\n\ngern eine ehrliche Antwort: Wenn es rein um den günstigsten Preis geht, sind wir ` +
        `vermutlich nicht die passende Wahl — unsere Projekte sind darauf gebaut, dass sie messbar Anfragen ` +
        `und Umsatz bringen, und das hat einen anderen Ansatz als eine reine Visitenkarten-Seite.\n\n` +
        `Wenn Sie wissen möchten, was dieser Unterschied konkret bedeutet, zeige ich es Ihnen gern an einem ` +
        `Beispiel aus Ihrer Branche.` +
        closing,
      internal_note: "Preisfokus — Wert argumentieren, keine Rabatte. Geringe Priorität.",
    };
  }

  // Standard-Entwurf: auf das Anliegen eingehen + genau EIN Call-to-Action.
  const topicLine = {
    website: "Ihr Website-Projekt klingt nach einem klaren Fall für uns",
    social_media: "Social Media für Ihr Geschäft ist genau unser Thema",
    recruiting: "Mitarbeitergewinnung über Social Media ist einer unserer Schwerpunkte",
    ecommerce: "Ihr Shop-Projekt passt sehr gut zu dem, was wir täglich bauen",
    local_service: "lokale Sichtbarkeit bei Google ist ein dankbares Thema — da ist meist schnell etwas zu holen",
    marketing_general: "bei Ihrem Marketing-Anliegen können wir gut unterstützen",
  }[lead.category] ?? "Ihre Anfrage passt gut zu unserem Leistungsspektrum";

  const cta =
    lead.lead_temperature === "hot"
      ? `Am schnellsten klären wir die Details in einem kurzen Gespräch — passt Ihnen morgen 10 Uhr oder übermorgen 14 Uhr für 20 Minuten?`
      : `Mögen Sie mir kurz schreiben: ${firstQuestions(lead)}? Dann kann ich Ihnen direkt etwas Konkretes vorschlagen.`;

  return {
    subject: informal ? null : `Ihre Anfrage: ${shortTopic(lead.category)}`,
    reply_text: `${salutation}\n\ndanke für Ihre Nachricht — ${topicLine}.\n\n${cta}${closing}`,
    internal_note:
      lead.lead_temperature === "hot"
        ? "Heißer Lead — Entwurf prüfen und SOFORT senden, Terminvorschläge ggf. an Kalender anpassen."
        : "Entwurf prüfen, persönliches Detail aus der Anfrage ergänzen, am selben Werktag senden.",
  };
}

function firstQuestions(lead) {
  const missing = (lead.missing_information ?? []).slice(0, 2);
  return missing.length ? missing.map((m) => m.toLowerCase()).join(" und ") : "Ihren Zeitrahmen und Ihre Budgetvorstellung";
}

function shortTopic(category) {
  return {
    website: "Website",
    social_media: "Social-Media-Betreuung",
    recruiting: "Mitarbeitergewinnung",
    ecommerce: "Online-Shop",
    local_service: "Lokale Sichtbarkeit",
    marketing_general: "Marketing",
  }[category] ?? "Ihr Projekt";
}
