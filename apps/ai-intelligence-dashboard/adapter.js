// adapter.js — the Source interface boundary.
// ALL update data enters here. normalizeUpdate() validates against the schema
// and guarantees the business-intelligence layer before anything reaches the store.

import {
  Category, Company, RiskLevel, RiskType, HypeLevel, IdPrefix, isOneOf,
} from './schema.js';

/**
 * Wrap a raw definition into a Source. Keeps the contract explicit:
 * every source has id, name and an async fetch() returning RAW items.
 * @param {{id:string, name:string, fetch:() => Promise<object[]>}} def
 * @returns {import('./schema.js').Source}
 */
export function createSource(def) {
  if (!def || !def.id || typeof def.fetch !== 'function') {
    throw new Error('createSource: a source needs an id and an async fetch()');
  }
  return { id: def.id, name: def.name ?? def.id, fetch: def.fetch };
}

const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const fallbackEnum = (enumObj, value, fallback) =>
  isOneOf(enumObj, value) ? value : fallback;

/**
 * Validate + complete a single raw update. Untrusted input: we never trust
 * shape, we coerce into the schema and fill the BI layer with safe defaults.
 * @param {object} raw
 * @param {string} sourceId
 * @returns {import('./schema.js').AIUpdate}
 */
export function normalizeUpdate(raw, sourceId) {
  const title = String(raw.title ?? 'Untitled update').trim();
  const id = String(raw.id ?? `${IdPrefix.AIUpdate}${slug(title)}`);

  const riskTypes = asArray(raw.riskTypes)
    .filter((t) => isOneOf(RiskType, t));

  return {
    id,
    title,
    summary: String(raw.summary ?? '').trim(),
    company: fallbackEnum(Company, raw.company, Company.OTHER),
    category: fallbackEnum(Category, raw.category, Category.PRODUCT),
    date: normalizeDate(raw.date),
    sourceId: String(raw.sourceId ?? sourceId ?? 'unknown'),
    relevanceScore: clamp(Math.round(Number(raw.relevanceScore) || 0), 0, 100),
    businessImpact: String(raw.businessImpact ?? '').trim(),
    businessRelevance: String(raw.businessRelevance ?? '').trim(),
    recommendedAction: String(raw.recommendedAction ?? '').trim(),
    riskLevel: fallbackEnum(RiskLevel, raw.riskLevel, RiskLevel.LOW),
    riskTypes,
    hypeLevel: fallbackEnum(HypeLevel, raw.hypeLevel, HypeLevel.MIXED),
    tags: asArray(raw.tags).map((t) => String(t).trim()).filter(Boolean),
  };
}

/** True when an update carries the full "so what for the agency?" layer. */
export function isComplete(update) {
  return Boolean(
    update.businessImpact && update.businessRelevance && update.recommendedAction,
  );
}

function normalizeDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 10)
    : d.toISOString().slice(0, 10);
}

function slug(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48);
}
