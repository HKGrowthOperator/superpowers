// SEED data for standalone RiskAssessment entries (Risks & Hype Filter).
// Per-update risks live on each AIUpdate; these are cross-cutting assessments.

/** @type {import('../schema.js').RiskAssessment[]} */
export const seedRisks = [
  {
    id: 'risk-001',
    subject: 'Voice agents handling customer PII',
    riskType: 'Data privacy',
    level: 'high',
    note: 'Phone agents capture names, numbers, and appointment details.',
    mitigation: 'Minimise stored data, encrypt, get consent, document retention.',
  },
  {
    id: 'risk-002',
    subject: 'Unattended autonomous agents in client delivery',
    riskType: 'Agent autonomy',
    level: 'high',
    note: 'Letting an agent take irreversible actions without review.',
    mitigation: 'Human-in-the-loop on all irreversible or client-facing actions.',
  },
  {
    id: 'risk-003',
    subject: 'Token/usage costs on always-on automations',
    riskType: 'Cost explosion',
    level: 'medium',
    note: 'High-volume workflows can rack up unexpected API spend.',
    mitigation: 'Set budgets/alerts, cache, and cap retries per run.',
  },
  {
    id: 'risk-004',
    subject: 'Agents reading untrusted web/email content',
    riskType: 'Security',
    level: 'high',
    note: 'Prompt injection from external content can hijack behaviour.',
    mitigation: 'Least-privilege tools, treat external text as untrusted, sanitise.',
  },
  {
    id: 'risk-005',
    subject: 'Single-vendor dependency for core delivery',
    riskType: 'Vendor lock-in',
    level: 'medium',
    note: 'Building everything on one platform/model raises switching cost.',
    mitigation: 'Abstract behind adapters; keep prompts/data portable.',
  },
  {
    id: 'risk-006',
    subject: 'Generated reports presented as fact',
    riskType: 'Hallucination',
    level: 'medium',
    note: 'Models can produce confident, wrong, uncited claims.',
    mitigation: 'Require grounding/citations and human review before delivery.',
  },
  {
    id: 'risk-007',
    subject: 'AI-generated media and copyright/compliance',
    riskType: 'Legal / compliance',
    level: 'medium',
    note: 'Generated video/voice may raise rights and disclosure questions.',
    mitigation: 'Track provenance, disclose AI use, follow platform/legal rules.',
  },
];
