// schema.js — the single source of truth for data SHAPE.
// Enums here are the ONLY allowed values; never free-type these strings elsewhere.

/** Freeze a plain object so its values can't be mutated at runtime. */
const enumOf = (obj) => Object.freeze(obj);

export const Category = enumOf({
  MODELS: 'Models',
  AGENTS: 'Agents',
  TOOLING: 'Tooling',
  RESEARCH: 'Research',
  POLICY: 'Policy',
  FUNDING: 'Funding',
  PRODUCT: 'Product',
});

export const Company = enumOf({
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  GOOGLE: 'Google',
  META: 'Meta',
  MICROSOFT: 'Microsoft',
  MISTRAL: 'Mistral',
  XAI: 'xAI',
  OTHER: 'Other',
});

export const RiskLevel = enumOf({ LOW: 'low', MEDIUM: 'medium', HIGH: 'high' });

export const RiskType = enumOf({
  HYPE: 'hype',
  SECURITY: 'security',
  COMPLIANCE: 'compliance',
  PRIVACY: 'privacy',
  COST: 'cost',
  ACCURACY: 'accuracy',
  VENDOR_LOCKIN: 'vendor-lock-in',
});

// How grounded a claim is — the heart of the hype filter.
export const HypeLevel = enumOf({ GROUNDED: 'grounded', MIXED: 'mixed', HYPE: 'hype' });

export const ExperimentStatus = enumOf({
  PROPOSED: 'proposed',
  RUNNING: 'running',
  VALIDATED: 'validated',
  DROPPED: 'dropped',
});

export const Effort = enumOf({ LOW: 'low', MEDIUM: 'medium', HIGH: 'high' });

/** Id prefixes per entity type (see naming conventions). */
export const IdPrefix = enumOf({
  AIUpdate: 'upd-',
  WeeklyExperiment: 'exp-',
  BusinessOpportunity: 'opp-',
  LearningConcept: 'lrn-',
  RiskAssessment: 'risk-',
});

/** True when `value` is one of the allowed values of an enum object. */
export const isOneOf = (enumObj, value) => Object.values(enumObj).includes(value);

// ── Typedefs (JSDoc only; no runtime cost) ──────────────────────────────────

/**
 * @typedef {Object} AIUpdate
 * @property {string} id                kebab id, prefixed `upd-`
 * @property {string} title
 * @property {string} summary           plain-language what-happened
 * @property {string} company           one of Company
 * @property {string} category          one of Category
 * @property {string} date              ISO date (YYYY-MM-DD)
 * @property {string} sourceId          id of the Source it came from
 * @property {number} relevanceScore    0–100, how relevant for the agency
 * @property {string} businessImpact    what it changes for the business
 * @property {string} businessRelevance why it matters to us specifically
 * @property {string} recommendedAction the concrete "so what / do this"
 * @property {string} riskLevel         one of RiskLevel
 * @property {string[]} riskTypes       subset of RiskType
 * @property {string} hypeLevel         one of HypeLevel
 * @property {string[]} tags
 */

/**
 * @typedef {Object} WeeklyExperiment
 * @property {string} id                prefixed `exp-`
 * @property {string} title
 * @property {string} week              e.g. "2026-W23"
 * @property {string} value             the business value if it works
 * @property {string[]} tools
 * @property {string[]} steps
 * @property {string} validation        how we know it worked
 * @property {string} status            one of ExperimentStatus
 */

/**
 * @typedef {Object} BusinessOpportunity
 * @property {string} id                prefixed `opp-`
 * @property {string} title
 * @property {string} value             sellable value / pitch
 * @property {string} effort            one of Effort
 * @property {string[]} tools
 * @property {string[]} steps
 * @property {string} validate          how to validate demand
 */

/**
 * @typedef {Object} LearningConcept
 * @property {string} id                prefixed `lrn-`
 * @property {string} term
 * @property {string} definition
 * @property {string} whyItMatters
 * @property {string} example
 */

/**
 * @typedef {Object} RiskAssessment
 * @property {string} id                prefixed `risk-`
 * @property {string} title
 * @property {string} riskLevel         one of RiskLevel
 * @property {string[]} riskTypes       subset of RiskType
 * @property {string} description
 * @property {string} mitigation
 */

/**
 * @typedef {Object} Source
 * @property {string} id
 * @property {string} name
 * @property {() => Promise<object[]>} fetch  returns RAW items to normalize
 */
