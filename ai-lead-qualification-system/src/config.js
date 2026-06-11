/**
 * ZENTRALE KONFIGURATION — die einzige Datei in /src, die pro Kunde
 * angepasst wird. Logik-Dateien bleiben unverändert.
 */

export const config = {
  // Absender für Antwortentwürfe
  companyName: "HK Growth Operator",
  senderName: "Haris",
  assigneeDefault: "vertrieb",
  // Heiße Leads gehen direkt an den Inhaber statt an den Pool
  assigneeHot: "haris",

  // Kernleistungen der Agentur — Kategorien hierin bekommen vollen Service-Fit.
  // Pro Kunde austauschen (z. B. Autohaus: ["fahrzeugverkauf", "werkstatt", ...]).
  coreCategories: ["website", "social_media", "recruiting", "ecommerce"],
  // Randleistungen: machbar, aber nicht Kerngeschäft
  edgeCategories: ["local_service", "marketing_general"],

  // Score-Punkte pro Dimension. Summe der Maxima = 100.
  // Designentscheidung: budget "unknown" = 10 (neutral), NICHT 0 —
  // gute Leads ohne Budgetangabe dürfen nicht abrutschen.
  scoring: {
    budget: { over_25k: 25, "10k_25k": 22, "5k_10k": 18, "1k_5k": 13, under_1k: 4, unknown: 10 },
    urgency: { critical: 20, high: 16, medium: 10, low: 4 },
    serviceFit: { core: 20, edge: 12, price_inquiry: 6, fallback: 4 },
    decisionStage: { ready_to_buy: 15, comparing: 10, researching: 5, unknown: 4 },
    contactQuality: { both: 10, one: 5, none: 0 },
    clarity: { detailed: 10, some: 6, none: 2 }, // >=3 Anforderungen / 1-2 / 0
  },

  // Temperatur-Schwellen
  temperature: { hot: 70, warm: 40 }, // hot: >= 70, warm: >= 40, sonst cold
};
