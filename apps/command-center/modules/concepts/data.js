// modules/concepts/data.js — offers, strategies and campaigns in development.

import { ConceptType, ConceptStatus } from '../../core/schema.js';

export const concepts = [
  {
    id: 'con-compliance-tier', title: 'Compliance-ready assistant tier', type: ConceptType.OFFER, status: ConceptStatus.DRAFT,
    summary: 'A premium delivery tier for EU clients: AI disclosure, audit logging and a documented escalation path.',
    value: 'Higher margin + a clear answer to the #1 legal/compliance objection.',
    steps: ['Package the AI delivery checklist as a fixed deliverable.', 'Define pricing as an add-on tier.', 'Pitch to Brandt & Partner and Helios.'],
  },
  {
    id: 'con-automation-retainer', title: 'Back-office automation retainer', type: ConceptType.OFFER, status: ConceptStatus.IDEA,
    summary: 'Recurring retainer that automates a client’s repetitive ops behind human approval.',
    value: 'Predictable recurring revenue; deepens client lock-in via saved hours.',
    steps: ['Audit top 3 repetitive workflows.', 'Automate one as a paid pilot.', 'Convert pilot to retainer.'],
  },
  {
    id: 'con-voice-reception', title: 'AI phone reception service', type: ConceptType.OFFER, status: ConceptStatus.IDEA,
    summary: '24/7 inbound call qualification and routing for SMBs, with human escalation.',
    value: 'New service line; differentiates us from pure-marketing agencies.',
    steps: ['Validate latency + compliance in the W21 pilot.', 'Define the qualify-and-route script.', 'Launch with Nordwind.'],
  },
  {
    id: 'con-winback-campaign', title: 'Lighter-package win-back', type: ConceptType.CAMPAIGN, status: ConceptStatus.READY,
    summary: 'Targeted win-back for churned price-sensitive clients with a stripped-down package.',
    value: 'Recovers revenue from warm, already-educated prospects at low CAC.',
    steps: ['Define the lighter package and price.', 'Build a 3-touch sequence.', 'Start with Sonnig Reisen.'],
  },
];
