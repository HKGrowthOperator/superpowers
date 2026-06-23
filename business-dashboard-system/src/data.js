// Lädt den normalisierten Monatsdatensatz (Single Source of Truth).
// Bewusst über fs gelesen statt JSON-Import-Attribute, damit es ab Node 18 läuft.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(readFileSync(path.join(__dirname, "../data/metrics.json"), "utf8"));

export const meta = raw.meta;
export const months = raw.months;

/** Pflichtfelder eines Monatsdatensatzes (für Lückenerkennung & KPIs). */
export const FIELDS = [
  "leads", "calls", "proposals", "wins",
  "impressions", "website_visitors", "content_count",
  "revenue", "open_invoices", "average_project_value",
];
