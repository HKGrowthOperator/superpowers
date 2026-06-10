// Zentraler Einstiegspunkt — alles, was deine App braucht, aus einer Datei:
//
//   import { createOfferSystem } from './smart-offer-system/src/index.mjs';

export { createOfferSystem } from './system.mjs';

// Einzelbausteine, falls du nur Teile brauchst:
export { extract, extractHeuristic } from './extract.mjs';
export { createOfferFromLead, setStatus, dashboardStats, calcSumme, nextOfferNumber } from './offer.mjs';
export { runFollowUps, dueFollowUps } from './followup.mjs';
export { renderOfferPdf, PdfBuilder, formatEUR } from './pdf.mjs';
export { JsonStore } from './store.mjs';
export { DEFAULT_SETTINGS, TEXTBAUSTEINE, LEISTUNGS_KEYWORDS, STATUS, STATUS_LABELS } from './templates.mjs';
