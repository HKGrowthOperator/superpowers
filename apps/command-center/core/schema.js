// core/schema.js — shared shape definitions for every module.
// Enums are the ONLY allowed values; modules import these, never free-type them.

const enumOf = (obj) => Object.freeze(obj);

// ── AI Intelligence module ──────────────────────────────────────────────────
export const Category = enumOf({
  MODELS: 'Models', AGENTS: 'Agents', TOOLING: 'Tooling', RESEARCH: 'Research',
  POLICY: 'Policy', FUNDING: 'Funding', PRODUCT: 'Product',
});
export const Company = enumOf({
  OPENAI: 'OpenAI', ANTHROPIC: 'Anthropic', GOOGLE: 'Google', META: 'Meta',
  MICROSOFT: 'Microsoft', MISTRAL: 'Mistral', XAI: 'xAI', OTHER: 'Other',
});
export const RiskLevel = enumOf({ LOW: 'low', MEDIUM: 'medium', HIGH: 'high' });
export const RiskType = enumOf({
  HYPE: 'hype', SECURITY: 'security', COMPLIANCE: 'compliance', PRIVACY: 'privacy',
  COST: 'cost', ACCURACY: 'accuracy', VENDOR_LOCKIN: 'vendor-lock-in',
});
export const HypeLevel = enumOf({ GROUNDED: 'grounded', MIXED: 'mixed', HYPE: 'hype' });
export const ExperimentStatus = enumOf({
  PROPOSED: 'proposed', RUNNING: 'running', VALIDATED: 'validated', DROPPED: 'dropped',
});
export const Effort = enumOf({ LOW: 'low', MEDIUM: 'medium', HIGH: 'high' });

// ── SOPs ────────────────────────────────────────────────────────────────────
export const SopArea = enumOf({
  ONBOARDING: 'Onboarding', DELIVERY: 'Delivery', SALES: 'Sales',
  SUPPORT: 'Support', REPORTING: 'Reporting', ADMIN: 'Admin',
});

// ── Customer service ─────────────────────────────────────────────────────────
export const ClientStatus = enumOf({
  LEAD: 'lead', ACTIVE: 'active', PAUSED: 'paused', CHURNED: 'churned',
});
export const Channel = enumOf({ EMAIL: 'email', CHAT: 'chat', PHONE: 'phone' });

// ── Concepts ─────────────────────────────────────────────────────────────────
export const ConceptType = enumOf({
  OFFER: 'offer', STRATEGY: 'strategy', CAMPAIGN: 'campaign', PROCESS: 'process',
});
export const ConceptStatus = enumOf({
  IDEA: 'idea', DRAFT: 'draft', READY: 'ready', LIVE: 'live',
});

// ── Automation ───────────────────────────────────────────────────────────────
export const AutomationStatus = enumOf({
  IDEA: 'idea', BUILDING: 'building', LIVE: 'live', PAUSED: 'paused',
});

// ── Websites ─────────────────────────────────────────────────────────────────
export const WebsiteStatus = enumOf({
  PLANNED: 'planned', BUILDING: 'building', LIVE: 'live', MAINTENANCE: 'maintenance',
});

/** Id prefixes per entity type. */
export const IdPrefix = enumOf({
  update: 'upd-', experiment: 'exp-', opportunity: 'opp-', learning: 'lrn-', risk: 'risk-',
  sop: 'sop-', client: 'cli-', template: 'tpl-', concept: 'con-',
  automation: 'aut-', website: 'web-',
});

export const isOneOf = (enumObj, value) => Object.values(enumObj).includes(value);

/** Make a stable-ish id from a title. */
export function makeId(prefix, title) {
  const base = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);
  return `${prefix}${base || Math.random().toString(36).slice(2, 8)}`;
}
