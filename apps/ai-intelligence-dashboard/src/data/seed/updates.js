// Illustrative SEED data for AIUpdate.
//
// IMPORTANT: These entries are realistic SAMPLE content used to build and
// demo the dashboard UI. They are NOT verified live news. Replace them by
// wiring a real source adapter (see src/data/sources/). Every field shape
// matches the AIUpdate typedef in ../schema.js.

/** @type {import('../schema.js').AIUpdate[]} */
export const seedUpdates = [
  {
    id: 'upd-001',
    title: 'New long-context coding agent mode',
    summary:
      'A coding-agent update emphasising larger context windows and better multi-file edits, aimed at end-to-end repository tasks rather than single-file completions.',
    sourceName: 'Vendor engineering blog',
    sourceUrl: '',
    company: 'Anthropic',
    category: 'Coding agent',
    tags: ['claude-code', 'coding-agent', 'context'],
    publishedAt: '2026-06-02',
    createdAt: '2026-06-03',
    relevanceScore: 92,
    businessImpact:
      'Directly improves our website-build and QA delivery speed; fewer manual handoffs between files.',
    businessRelevance: 'Coding / product development',
    recommendedAction:
      'Run a side-by-side QA pass on one live client site this week and measure time saved.',
    riskLevel: 'low',
    riskTypes: ['Hallucination', 'Cost explosion'],
    hypeLevel: 'Genuinely useful',
    status: 'new',
    saved: false,
    priority: 'high',
  },
  {
    id: 'upd-002',
    title: 'Real-time voice agent API improvements',
    summary:
      'Lower-latency speech-to-speech with interruption handling, making phone-style AI receptionists feel materially more natural.',
    sourceName: 'Vendor product update',
    sourceUrl: '',
    company: 'OpenAI',
    category: 'Voice AI',
    tags: ['voice', 'realtime', 'phone-agent'],
    publishedAt: '2026-05-30',
    createdAt: '2026-06-03',
    relevanceScore: 88,
    businessImpact:
      'Unlocks a sellable "AI phone assistant" offer for local service businesses with believable conversation quality.',
    businessRelevance: 'Sales systems',
    recommendedAction:
      'Prototype a booking-taker voice agent for one vertical (dental or salon) as a demo.',
    riskLevel: 'medium',
    riskTypes: ['Hallucination', 'Data privacy', 'Cost explosion'],
    hypeLevel: 'Worth testing',
    status: 'new',
    saved: true,
    priority: 'high',
  },
  {
    id: 'upd-003',
    title: 'Workflow platform adds native AI step',
    summary:
      'An automation platform ships a first-class AI action node, reducing the glue code needed to insert an LLM step into a multi-tool workflow.',
    sourceName: 'Platform changelog',
    sourceUrl: '',
    company: 'n8n',
    category: 'Automation',
    tags: ['n8n', 'workflow', 'no-code'],
    publishedAt: '2026-05-28',
    createdAt: '2026-06-03',
    relevanceScore: 80,
    businessImpact:
      'Cuts build time for client automation services; standardises how we add AI to lead-routing flows.',
    businessRelevance: 'Automation services',
    recommendedAction:
      'Rebuild our lead follow-up template using the native AI step and benchmark reliability.',
    riskLevel: 'low',
    riskTypes: ['Vendor lock-in'],
    hypeLevel: 'Genuinely useful',
    status: 'new',
    saved: false,
    priority: 'medium',
  },
  {
    id: 'upd-004',
    title: 'Short-form video generation quality jump',
    summary:
      'A video model release improves temporal consistency for short clips, narrowing the gap for usable social-media-ready content.',
    sourceName: 'Vendor research note',
    sourceUrl: '',
    company: 'Google',
    category: 'Video AI',
    tags: ['video', 'short-form', 'content'],
    publishedAt: '2026-05-27',
    createdAt: '2026-06-03',
    relevanceScore: 74,
    businessImpact:
      'Enables a content-repurposing service turning one client asset into many short clips.',
    businessRelevance: 'Content creation',
    recommendedAction:
      'Produce 5 short clips from one existing client testimonial and review with a marketer.',
    riskLevel: 'medium',
    riskTypes: ['Legal / compliance', 'Hallucination'],
    hypeLevel: 'Worth testing',
    status: 'new',
    saved: false,
    priority: 'medium',
  },
  {
    id: 'upd-005',
    title: 'Frontier model "agentic reasoning" claims',
    summary:
      'A model launch markets autonomous multi-step reasoning. Headline benchmarks look strong but real-world reliability for unattended runs is unproven.',
    sourceName: 'Press / launch coverage',
    sourceUrl: '',
    company: 'xAI',
    category: 'Model release',
    tags: ['reasoning', 'agents', 'benchmarks'],
    publishedAt: '2026-05-25',
    createdAt: '2026-06-03',
    relevanceScore: 55,
    businessImpact:
      'Possible future fit for complex client research tasks, but not safe for unattended client-facing work yet.',
    businessRelevance: 'Watch later',
    recommendedAction:
      'Add to strategic watch list; do not put in any client delivery path until independently verified.',
    riskLevel: 'high',
    riskTypes: ['Agent autonomy', 'Hallucination', 'Cost explosion'],
    hypeLevel: 'Mostly hype',
    status: 'new',
    saved: false,
    priority: 'low',
  },
  {
    id: 'upd-006',
    title: 'Code-assistant deeper IDE/PR integration',
    summary:
      'A coding assistant expands pull-request review and repo-wide change suggestions inside the IDE and git host.',
    sourceName: 'Vendor blog',
    sourceUrl: '',
    company: 'Microsoft',
    category: 'Coding agent',
    tags: ['copilot', 'code-review', 'github'],
    publishedAt: '2026-05-24',
    createdAt: '2026-06-03',
    relevanceScore: 78,
    businessImpact:
      'Improves our internal code quality and could become a "managed QA" line item for client products.',
    businessRelevance: 'Client delivery',
    recommendedAction:
      'Trial automated PR review on one internal repo for two weeks and track defects caught.',
    riskLevel: 'low',
    riskTypes: ['Security', 'Vendor lock-in'],
    hypeLevel: 'Genuinely useful',
    status: 'new',
    saved: false,
    priority: 'medium',
  },
  {
    id: 'upd-007',
    title: 'Answer-engine API for grounded search',
    summary:
      'A search/answer engine exposes a grounded-citation API, useful for building research assistants that show sources.',
    sourceName: 'Vendor API docs',
    sourceUrl: '',
    company: 'Perplexity',
    category: 'AI agents',
    tags: ['search', 'rag', 'citations'],
    publishedAt: '2026-05-22',
    createdAt: '2026-06-03',
    relevanceScore: 70,
    businessImpact:
      'Lets us build cited research deliverables for clients, reducing hallucination risk in reports.',
    businessRelevance: 'Client delivery',
    recommendedAction:
      'Build a small "market research brief" generator and check citation quality.',
    riskLevel: 'medium',
    riskTypes: ['Hallucination', 'Data privacy'],
    hypeLevel: 'Worth testing',
    status: 'new',
    saved: false,
    priority: 'medium',
  },
  {
    id: 'upd-008',
    title: 'CRM-side AI automation connectors',
    summary:
      'An automation platform adds tighter CRM connectors for AI-assisted lead scoring and follow-up drafting.',
    sourceName: 'Platform release notes',
    sourceUrl: '',
    company: 'Zapier',
    category: 'Sales automation',
    tags: ['crm', 'lead-scoring', 'sales'],
    publishedAt: '2026-05-20',
    createdAt: '2026-06-03',
    relevanceScore: 83,
    businessImpact:
      'Core to a productised "AI CRM workflow" offer for SMB sales teams.',
    businessRelevance: 'Lead generation',
    recommendedAction:
      'Design a lead-scoring + auto-draft follow-up flow and dry-run it on sample CRM data.',
    riskLevel: 'medium',
    riskTypes: ['Data privacy', 'Vendor lock-in'],
    hypeLevel: 'Genuinely useful',
    status: 'new',
    saved: true,
    priority: 'high',
  },
];
