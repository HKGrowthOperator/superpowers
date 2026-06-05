// modules/sops/data.js — standard operating procedures. Repeatable playbooks
// your team (and the agent) can follow. Edit or add here; UI additions are kept
// locally and can be exported back to the agent.

import { SopArea } from '../../core/schema.js';

export const sops = [
  {
    id: 'sop-client-onboarding', title: 'New client onboarding', area: SopArea.ONBOARDING,
    summary: 'From signed contract to a fully set-up, kicked-off client in 5 working days.',
    steps: [
      'Create the client folder and shared drive from the template.',
      'Send the welcome email + intake form (see Customer service → templates).',
      'Book the kickoff call and add all access requests to the agenda.',
      'Set up the project board and assign an account manager.',
      'Confirm scope, deadlines and the first deliverable in writing.',
    ],
    tools: ['Drive template', 'Intake form', 'Project board'], owner: 'Account management',
    updated: '2026-05-29', tags: ['onboarding', 'kickoff'],
  },
  {
    id: 'sop-weekly-reporting', title: 'Weekly client report', area: SopArea.REPORTING,
    summary: 'Produce and send a consistent weekly performance report per client.',
    steps: [
      'Pull metrics for the reporting period from each channel.',
      'Drop them into the report template and write the 3-line summary.',
      'Flag anything off-track with a proposed next step.',
      'Account manager reviews, then sends before Friday 16:00.',
    ],
    tools: ['Report template', 'Analytics', 'AI draft (computer-use)'], owner: 'Account management',
    updated: '2026-06-01', tags: ['reporting', 'weekly'],
  },
  {
    id: 'sop-lead-qualification', title: 'Lead qualification', area: SopArea.SALES,
    summary: 'Decide fast whether a new lead is a fit, and route it correctly.',
    steps: [
      'Check budget, timeline and decision-maker against the fit checklist.',
      'Score the lead (hot / warm / cold).',
      'Hot/warm: book a discovery call within 24h. Cold: nurture sequence.',
      'Log the outcome on the client record.',
    ],
    tools: ['Fit checklist', 'Calendar', 'CRM'], owner: 'Sales', updated: '2026-05-20', tags: ['sales', 'leads'],
  },
  {
    id: 'sop-support-response', title: 'Support request handling', area: SopArea.SUPPORT,
    summary: 'Acknowledge, triage and resolve inbound client requests on time.',
    steps: [
      'Acknowledge within 2 working hours using the right template.',
      'Triage: question, change request, or incident.',
      'Resolve or escalate with a clear owner and ETA.',
      'Close the loop and log the resolution.',
    ],
    tools: ['Inbox', 'Response templates', 'Escalation list'], owner: 'Support', updated: '2026-05-31', tags: ['support', 'sla'],
  },
  {
    id: 'sop-ai-delivery-checklist', title: 'AI feature delivery checklist', area: SopArea.DELIVERY,
    summary: 'Ship any AI feature to a client safely and compliantly.',
    steps: [
      'Add the AI-disclosure banner and enable usage logging (EU AI Act).',
      'Run the eval set; record the score and known limits.',
      'Apply the agent-hardening checklist for any tool access.',
      'Document the human-escalation path and hand over.',
    ],
    tools: ['Disclosure banner', 'Eval set', 'Hardening checklist'], owner: 'Delivery', updated: '2026-06-02', tags: ['ai', 'compliance', 'delivery'],
  },
  {
    id: 'sop-invoice-runbook', title: 'Monthly invoicing', area: SopArea.ADMIN,
    summary: 'Run accurate monthly invoicing with no missed billables.',
    steps: [
      'Reconcile tracked time and retainers against contracts.',
      'Generate invoices from the accounting template.',
      'Send by the 1st; set payment reminders for day 7 and 14.',
    ],
    tools: ['Accounting tool', 'Contracts'], owner: 'Admin', updated: '2026-05-28', tags: ['admin', 'finance'],
  },
];
