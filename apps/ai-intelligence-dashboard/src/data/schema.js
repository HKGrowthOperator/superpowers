// =====================================================================
// Data model for the AI-First Intelligence Dashboard.
//
// This is a zero-dependency app, so the "models" are JSDoc typedefs plus
// runtime enums/constants. They define the contract that every data
// source adapter (mock or live) must produce. When a database/ORM is
// added later, these typedefs map 1:1 onto tables/collections.
// =====================================================================

/** Companies / vendors we track. */
export const COMPANIES = [
  'OpenAI', 'Anthropic', 'Google', 'Meta', 'Microsoft', 'xAI', 'Perplexity',
  'Zapier', 'Make', 'n8n', 'Cursor', 'Lovable', 'Replit', 'Other',
];

/** Update categories (the "what kind of thing" axis). */
export const CATEGORIES = [
  'Model release', 'Coding agent', 'Voice AI', 'Video AI', 'Automation',
  'AI agents', 'Sales automation', 'Marketing automation', 'Research', 'Platform',
];

/** Business relevance buckets (Section 2 of the brief). */
export const BUSINESS_RELEVANCE = [
  'Agency positioning', 'Automation services', 'Website projects',
  'Sales systems', 'Lead generation', 'Content creation',
  'Coding / product development', 'Client delivery', 'Internal operations',
  'Watch later',
];

/** Hype filter classification (Section 4). */
export const HYPE_LEVELS = [
  'Genuinely useful', 'Worth testing', 'Strategic watch', 'Mostly hype',
  'Risky', 'Not relevant right now',
];

/** Risk dimensions tracked per update / assessment (Section 4). */
export const RISK_TYPES = [
  'Data privacy', 'Legal / compliance', 'Hallucination', 'Agent autonomy',
  'Cost explosion', 'Security', 'Vendor lock-in',
];

export const RISK_LEVELS = ['low', 'medium', 'high'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const DIFFICULTY = ['beginner', 'intermediate', 'advanced'];
export const STATUSES = ['new', 'reviewing', 'archived'];

/**
 * @typedef {Object} AIUpdate
 * @property {string}   id
 * @property {string}   title
 * @property {string}   summary
 * @property {string}   sourceName
 * @property {string=}  sourceUrl
 * @property {string}   company            One of COMPANIES.
 * @property {string}   category           One of CATEGORIES.
 * @property {string[]} tags
 * @property {string}   publishedAt        ISO date string.
 * @property {string}   createdAt          ISO date string (ingestion time).
 * @property {number}   relevanceScore     0-100.
 * @property {string}   businessImpact     Plain-language impact statement.
 * @property {string}   businessRelevance  One of BUSINESS_RELEVANCE.
 * @property {string}   recommendedAction  Concrete next action.
 * @property {string}   riskLevel          One of RISK_LEVELS.
 * @property {string[]} riskTypes          Subset of RISK_TYPES.
 * @property {string}   hypeLevel          One of HYPE_LEVELS.
 * @property {string}   status             One of STATUSES.
 * @property {boolean}  saved
 * @property {string}   priority           One of PRIORITIES.
 */

/**
 * @typedef {Object} WeeklyExperiment
 * @property {string}   id
 * @property {string}   name
 * @property {string}   objective
 * @property {string[]} toolsNeeded
 * @property {string}   difficulty         One of DIFFICULTY.
 * @property {string}   businessValue      Estimated value statement.
 * @property {string[]} steps
 * @property {string}   validation         How to validate success.
 * @property {boolean}  canBeClientOffer
 * @property {string[]} tags
 */

/**
 * @typedef {Object} BusinessOpportunity
 * @property {string}   id
 * @property {string}   offerName
 * @property {string}   targetCustomer
 * @property {string}   problemSolved
 * @property {string}   priceRange
 * @property {string[]} requiredTools
 * @property {string[]} deliverySteps
 * @property {string}   retainerPotential
 * @property {string}   proofOfConcept
 * @property {string}   riskLevel          One of RISK_LEVELS.
 * @property {string}   deliveryComplexity One of DIFFICULTY.
 * @property {string[]} tags
 */

/**
 * @typedef {Object} LearningConcept
 * @property {string}   id
 * @property {string}   concept
 * @property {string}   explanation
 * @property {string}   businessUseCase
 * @property {string}   practicalExample
 * @property {string}   agencyUse
 * @property {string}   mistakeToAvoid
 * @property {string}   exercise
 * @property {string[]} tags
 */

/**
 * @typedef {Object} RiskAssessment
 * @property {string} id
 * @property {string} subject            What is being assessed.
 * @property {string} riskType           One of RISK_TYPES.
 * @property {string} level              One of RISK_LEVELS.
 * @property {string} note
 * @property {string} mitigation
 */
