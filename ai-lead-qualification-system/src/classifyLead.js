/**
 * classifyLead — Schritt 1 der Pipeline.
 *
 * Analysiert die Originalnachricht und liefert: Absicht, Kategorie, Budget,
 * Dringlichkeit, Entscheidungsphase, Anforderungen und fehlende Infos.
 *
 * MOCK-MODUS: Die Funktion unten arbeitet mit einer Keyword-Heuristik, damit
 * das System ohne API-Key komplett lokal läuft und Tests deterministisch sind.
 *
 * INTEGRATION: In Produktion diesen Mock durch einen LLM-Call ersetzen —
 * System-Prompt aus prompts/lead-classification-prompt.md, Input als JSON,
 * Output ist garantiert dasselbe JSON-Format wie hier.
 * Beispiel-Code für Claude: docs/03-integrationen.md, Abschnitt 1.
 * Alternativ als Make/Zapier-Step: HTTP-Modul → Anthropic API → JSON-Parse.
 */

// Reihenfolge ist Priorität: Die erste Regel, die greift, bestimmt die Kategorie.
// "price_inquiry" steht vor allen Leistungs-Kategorien, weil eine reine
// Preisabfrage anders behandelt werden muss, egal welche Leistung genannt wird.
const CATEGORY_RULES = [
  { category: "price_inquiry", keywords: ["nur den preis", "was kostet", "günstigste", "billig", "preisliste", "mehrere angebote"], requireAll: false, minHits: 2 },
  { category: "recruiting", keywords: ["mitarbeiter", "fachkräfte", "recruiting", "stellenanzeige", "bewerbung", "personal", "einstellen", "vollzeitkräfte"] },
  { category: "ecommerce", keywords: ["shopify", "online-shop", "onlineshop", "webshop", "e-commerce", "etsy", "warenwirtschaft", "abo-modell"] },
  { category: "social_media", keywords: ["instagram", "social media", "tiktok", "facebook", "reels", "follower", "kanal"] },
  { category: "website", keywords: ["website", "webseite", "homepage", "relaunch", "landingpage", "internetseite"] },
  { category: "local_service", keywords: ["google", "gefunden werden", "lokal", "umkreis", "maps", "bewertungen", "sichtbarkeit"] },
  { category: "marketing_general", keywords: ["marketing", "werbung", "anzeigen", "kampagne", "mehr kunden"] },
];

const BUDGET_PATTERNS = [
  { range: "over_25k", regex: /\b(2[5-9]|[3-9]\d|\d{3,})[\s.]?(000|k)\b/i },
  { range: "10k_25k", regex: /\b(1\d|2[0-4])[\s.]?(000|k)\b/i },
  { range: "5k_10k", regex: /\b[5-9][\s.]?(000|k)\b/i },
  { range: "1k_5k", regex: /\b[1-4][\s.]?(000|k)\b/i },
  { range: "under_1k", regex: /\b[1-9]\d{2}\s?(euro|€)\b/i },
];

const URGENCY_RULES = [
  // critical nur bei harter Frist: konkrete Wochen-/Datums-Angabe
  { level: "critical", regex: /(in (genau )?\d+ (wochen|tagen)|bis zum \d|deadline|messe|zwingend bis)/i },
  { level: "high", regex: /(dringend|möglichst bald|so schnell wie möglich|asap|seit monaten.*(nichts|keine))/i },
  { level: "low", regex: /(nächstes jahr|irgendwann|erstmal informationen|frühzeitig|kein(e)? eile)/i },
];

const STAGE_RULES = [
  { stage: "ready_to_buy", regex: /(entscheidung (treffe|fällt)|budget.*(freigegeben|abgestimmt)|beauftragen|können wir starten)/i },
  { stage: "comparing", regex: /(vergleichen|mehrere angebote|verschiedene anbieter|zwei agenturen|anbieter an)/i },
  { stage: "researching", regex: /(erstmal|informationen sammeln|früh dran|was müsste man|wie funktioniert)/i },
];

function detectCategory(text) {
  for (const rule of CATEGORY_RULES) {
    const hits = rule.keywords.filter((k) => text.includes(k)).length;
    if (hits >= (rule.minHits ?? 1)) return rule.category;
  }
  return "unclear";
}

function detectBudget(text) {
  for (const { range, regex } of BUDGET_PATTERNS) {
    if (regex.test(text)) return range;
  }
  if (/nicht viel kosten|kleines budget|wenig geld/i.test(text)) return "under_1k";
  return "unknown";
}

function detectUrgency(text) {
  for (const { level, regex } of URGENCY_RULES) {
    if (regex.test(text)) return level;
  }
  return "medium";
}

function detectStage(text) {
  for (const { stage, regex } of STAGE_RULES) {
    if (regex.test(text)) return stage;
  }
  return "unknown";
}

// Anforderungen: Sätze mit Bedarfs-Signalwörtern. Bewusst grob — das echte
// Extrahieren übernimmt in Produktion das LLM (siehe INTEGRATION oben).
function extractRequirements(message) {
  const signals = /(brauchen|bräuchten|wollen|möchten|wichtig wären?|benötigen|wünschen|soll(te)?n?)/i;
  return message
    .split(/[.!?\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && signals.test(s))
    .slice(0, 5);
}

function collectMissingInformation(input, classification) {
  const missing = [];
  if (!input.contact_email && !input.contact_phone) missing.push("Kontaktdaten (E-Mail und Telefonnummer)");
  else if (!input.contact_phone) missing.push("Telefonnummer");
  else if (!input.contact_email) missing.push("E-Mail-Adresse");
  if (classification.category === "unclear") missing.push("Konkretes Anliegen / Projekt");
  if (classification.budget_range === "unknown") missing.push("Budgetvorstellung");
  if (classification.urgency === "medium" && classification.decision_stage === "unknown") missing.push("Zeitrahmen");
  return missing.slice(0, 5);
}

/**
 * @param {object} input - { source, name, company, contact_email, contact_phone, original_message }
 * @returns {object} Klassifikations-Ergebnis (Format: prompts/lead-classification-prompt.md)
 */
export function classifyLead(input) {
  const text = (input.original_message || "").toLowerCase();

  if (text.trim().length < 10) {
    // Fehlerfall "leer/nur Grußformel" — siehe Prompt, Abschnitt Fehlerfälle
    return {
      detected_intent: "Keine verwertbare Anfrage erkennbar.",
      category: "unclear",
      budget_range: "unknown",
      urgency: "low",
      decision_stage: "unknown",
      extracted_requirements: [],
      missing_information: ["Konkretes Anliegen"],
      confidence: 0.1,
    };
  }

  const category = detectCategory(text);
  const classification = {
    detected_intent: buildIntent(category, text),
    category,
    budget_range: detectBudget(text),
    urgency: detectUrgency(text),
    decision_stage: detectStage(text),
    extracted_requirements: extractRequirements(input.original_message),
    confidence: category === "unclear" ? 0.4 : 0.75,
  };
  classification.missing_information = collectMissingInformation(input, classification);
  return classification;
}

function buildIntent(category, text) {
  const labels = {
    website: "Anfrage zu Website / Relaunch / Landingpage",
    social_media: "Anfrage zu Social-Media-Betreuung",
    recruiting: "Anfrage zu Mitarbeitergewinnung / Social Recruiting",
    ecommerce: "Anfrage zu Online-Shop / E-Commerce",
    local_service: "Anfrage zu lokaler Online-Sichtbarkeit",
    marketing_general: "Allgemeine Marketing-Anfrage",
    price_inquiry: "Reine Preisabfrage, Entscheidung über den Preis",
    unclear: "Unspezifische Anfrage ohne erkennbares Projekt",
  };
  let intent = labels[category] ?? "Sonstige Anfrage";
  if (/dringend|deadline|in \d+ wochen/i.test(text)) intent += " mit Zeitdruck";
  return intent + ".";
}
