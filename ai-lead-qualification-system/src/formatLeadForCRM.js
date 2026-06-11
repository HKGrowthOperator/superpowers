/**
 * formatLeadForCRM — Schritt 5 der Pipeline.
 *
 * KEIN Mock: Wandelt den qualifizierten Lead in einen flachen Datensatz,
 * der 1:1 als Airtable-Record / Notion-Page-Properties / HubSpot-Properties
 * funktioniert (nur Strings, Zahlen, Booleans — keine verschachtelten Objekte).
 *
 * INTEGRATION (Airtable, empfohlener Start):
 *   POST https://api.airtable.com/v0/<BASE_ID>/Leads
 *   Body: { "fields": formatLeadForCRM(lead) }
 *   In Make/Zapier: dieses Objekt direkt ins "Create Record"-Modul mappen.
 */

const TEMPERATURE_LABELS = { hot: "🔥 Hot", warm: "🌤 Warm", cold: "❄️ Cold" };

/**
 * @param {object} lead - vollständig qualifizierter Lead (data/lead-schema.json)
 * @returns {object} flacher CRM-Datensatz
 */
export function formatLeadForCRM(lead) {
  return {
    "Lead ID": lead.lead_id,
    "Eingegangen": lead.created_at,
    "Quelle": lead.source,
    "Name": lead.name ?? "",
    "Firma": lead.company ?? "",
    "E-Mail": lead.contact_email ?? "",
    "Telefon": lead.contact_phone ?? "",
    "Anliegen": lead.detected_intent ?? "",
    "Kategorie": lead.category ?? "unclear",
    "Budget": lead.budget_range ?? "unknown",
    "Dringlichkeit": lead.urgency ?? "medium",
    "Phase": lead.decision_stage ?? "unknown",
    "Score": lead.lead_score ?? 0,
    "Temperatur": TEMPERATURE_LABELS[lead.lead_temperature] ?? "❄️ Cold",
    // Listen als mehrzeiliger Text — funktioniert in jedem CRM-Textfeld
    "Anforderungen": (lead.extracted_requirements ?? []).join("\n"),
    "Fehlende Infos": (lead.missing_information ?? []).join("\n"),
    "Nächster Schritt": lead.recommended_next_step ?? "",
    "Antwortentwurf": lead.suggested_reply ?? "",
    "Zuständig": lead.assigned_to ?? "",
    "Status": lead.status ?? "new",
    "Originalnachricht": lead.original_message,
  };
}
