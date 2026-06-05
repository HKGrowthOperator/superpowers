// sources/mockSource.js — a built-in Source providing curated AI updates.
// Live sources would fetch from an API; this returns RAW items the adapter
// normalizes. Content already carries the business-intelligence layer.

import { createSource } from '../adapter.js';
import {
  Category, Company, RiskLevel, RiskType, HypeLevel,
} from '../schema.js';

/** @type {object[]} raw updates (normalized on the way into the store) */
const RAW_UPDATES = [
  {
    id: 'upd-claude-computer-agents',
    title: 'Claude gains reliable computer-use for multi-step office tasks',
    summary:
      'A new agent mode can operate a browser and desktop apps to complete multi-step tasks (forms, data entry, research) with human checkpoints.',
    company: Company.ANTHROPIC,
    category: Category.AGENTS,
    date: '2026-06-03',
    relevanceScore: 92,
    businessImpact:
      'Automates the repetitive "click-and-copy" back-office work that currently eats junior hours.',
    businessRelevance:
      'Our agency bills a lot of manual ops time (reporting, onboarding). This directly compresses it.',
    recommendedAction:
      'Pilot one internal workflow (weekly client report assembly) behind a human approval step this week.',
    riskLevel: RiskLevel.MEDIUM,
    riskTypes: [RiskType.SECURITY, RiskType.ACCURACY],
    hypeLevel: HypeLevel.GROUNDED,
    tags: ['agents', 'automation', 'back-office'],
  },
  {
    id: 'upd-openai-realtime-voice',
    title: 'Real-time voice agents drop to near-phone latency',
    summary:
      'Streaming speech-to-speech latency is now low enough for natural live conversations, with barge-in and interruptions handled gracefully.',
    company: Company.OPENAI,
    category: Category.PRODUCT,
    date: '2026-06-02',
    relevanceScore: 78,
    businessImpact:
      'Makes AI phone receptionists and qualification calls viable for SMB clients.',
    businessRelevance:
      'Several of our clients want 24/7 inbound call handling; this clears the latency blocker.',
    recommendedAction:
      'Scope a paid pilot with one services client; define a strict escalation-to-human script.',
    riskLevel: RiskLevel.HIGH,
    riskTypes: [RiskType.COMPLIANCE, RiskType.ACCURACY, RiskType.PRIVACY],
    hypeLevel: HypeLevel.MIXED,
    tags: ['voice', 'support', 'sales'],
  },
  {
    id: 'upd-eu-ai-act-transparency',
    title: 'EU AI Act transparency duties take effect for deployed assistants',
    summary:
      'Customer-facing AI must disclose it is AI and keep usage logs. Guidance clarifies record-keeping expectations for small deployers.',
    company: Company.OTHER,
    category: Category.POLICY,
    date: '2026-05-30',
    relevanceScore: 85,
    businessImpact:
      'Every AI product we ship to EU clients needs disclosure + logging baked in, not bolted on.',
    businessRelevance:
      'We deliver to EU SMBs; non-compliance is a client and reputational liability for us.',
    recommendedAction:
      'Add a compliance checklist (disclosure banner + audit log) to our delivery template now.',
    riskLevel: RiskLevel.HIGH,
    riskTypes: [RiskType.COMPLIANCE, RiskType.PRIVACY],
    hypeLevel: HypeLevel.GROUNDED,
    tags: ['compliance', 'eu', 'legal'],
  },
  {
    id: 'upd-google-long-context',
    title: 'Cheaper long-context windows make "whole-account" assistants practical',
    summary:
      'Pricing on very large context dropped, so feeding an assistant a full client account history in one call is now affordable.',
    company: Company.GOOGLE,
    category: Category.MODELS,
    date: '2026-05-28',
    relevanceScore: 74,
    businessImpact:
      'Assistants can reason over an entire client knowledge base without brittle retrieval plumbing.',
    businessRelevance:
      'Cuts the engineering we spend on RAG setups for smaller knowledge bases.',
    recommendedAction:
      'Re-estimate two stalled proposals assuming long-context instead of custom retrieval.',
    riskLevel: RiskLevel.MEDIUM,
    riskTypes: [RiskType.COST, RiskType.VENDOR_LOCKIN],
    hypeLevel: HypeLevel.MIXED,
    tags: ['models', 'context', 'rag'],
  },
  {
    id: 'upd-agi-imminent-claim',
    title: 'Vendor claims "AGI within 18 months" at launch event',
    summary:
      'A keynote asserts imminent general intelligence. The demo shows narrow, scripted tasks; no benchmark or methodology was shared.',
    company: Company.OTHER,
    category: Category.RESEARCH,
    date: '2026-06-01',
    relevanceScore: 28,
    businessImpact:
      'Low concrete impact today; raises unrealistic client expectations we then have to manage.',
    businessRelevance:
      'Clients may demand "AGI" features. We need a grounded narrative to sell what actually ships.',
    recommendedAction:
      'Prepare a one-pager separating demoed reality from the claim; do not change roadmap.',
    riskLevel: RiskLevel.LOW,
    riskTypes: [RiskType.HYPE],
    hypeLevel: HypeLevel.HYPE,
    tags: ['hype', 'expectations'],
  },
  {
    id: 'upd-open-weights-on-prem',
    title: 'Strong open-weight model runs on a single workstation GPU',
    summary:
      'A capable open model now fits on commodity hardware, enabling fully on-prem deployments without per-token API costs.',
    company: Company.META,
    category: Category.MODELS,
    date: '2026-05-26',
    relevanceScore: 81,
    businessImpact:
      'Enables a privacy-first, fixed-cost offering for clients who cannot send data to a cloud API.',
    businessRelevance:
      'Differentiator for regulated clients (legal, health) who reject cloud LLMs.',
    recommendedAction:
      'Build a small on-prem demo box; benchmark quality vs. our default cloud model.',
    riskLevel: RiskLevel.MEDIUM,
    riskTypes: [RiskType.ACCURACY, RiskType.COST],
    hypeLevel: HypeLevel.GROUNDED,
    tags: ['open-weights', 'on-prem', 'privacy'],
  },
  {
    id: 'upd-eval-tooling-mature',
    title: 'Evaluation tooling makes regression-testing prompts routine',
    summary:
      'Open frameworks let teams snapshot prompt/agent quality and catch regressions in CI, the way unit tests catch code bugs.',
    company: Company.OTHER,
    category: Category.TOOLING,
    date: '2026-05-22',
    relevanceScore: 69,
    businessImpact:
      'Turns "it felt worse after the change" into measurable pass/fail, protecting delivered quality.',
    businessRelevance:
      'Reduces the firefighting when a model update silently degrades a client workflow.',
    recommendedAction:
      'Adopt a lightweight eval for our two most-used prompts before the next model bump.',
    riskLevel: RiskLevel.LOW,
    riskTypes: [RiskType.ACCURACY],
    hypeLevel: HypeLevel.GROUNDED,
    tags: ['evals', 'quality', 'tooling'],
  },
  {
    id: 'upd-ai-seed-funding-wave',
    title: 'Funding wave floods vertical AI assistants for SMB niches',
    summary:
      'A surge of seed rounds targets narrow vertical assistants (clinics, trades, agencies). Many overlap; consolidation is likely.',
    company: Company.OTHER,
    category: Category.FUNDING,
    date: '2026-05-20',
    relevanceScore: 47,
    businessImpact:
      'Signals demand in verticals we serve, but also more competitors and noisy procurement.',
    businessRelevance:
      'We can partner or position against these; ignoring the trend risks losing niche deals.',
    recommendedAction:
      'Pick one vertical we already serve and define our defensible angle vs. funded tools.',
    riskLevel: RiskLevel.LOW,
    riskTypes: [RiskType.HYPE, RiskType.VENDOR_LOCKIN],
    hypeLevel: HypeLevel.MIXED,
    tags: ['market', 'funding', 'competition'],
  },
  {
    id: 'upd-prompt-injection-defense',
    title: 'Practical prompt-injection defenses ship for tool-using agents',
    summary:
      'New patterns (content provenance, tool allow-lists, dual-LLM checking) measurably reduce prompt-injection success rates.',
    company: Company.ANTHROPIC,
    category: Category.RESEARCH,
    date: '2026-05-18',
    relevanceScore: 76,
    businessImpact:
      'Lowers the security risk of giving agents real tools (email, payments) for clients.',
    businessRelevance:
      'Security objections are our top blocker on agent deals; this gives us an answer.',
    recommendedAction:
      'Document a standard "agent hardening" checklist and put it in every agent proposal.',
    riskLevel: RiskLevel.MEDIUM,
    riskTypes: [RiskType.SECURITY],
    hypeLevel: HypeLevel.GROUNDED,
    tags: ['security', 'agents', 'prompt-injection'],
  },
];

/** The default in-app source. Add more sources and register them in main.js. */
export const mockSource = createSource({
  id: 'curated-mock',
  name: 'Curated (built-in)',
  // Async on purpose: mirrors a real fetch so views exercise loading/error states.
  fetch: async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return RAW_UPDATES;
  },
});
