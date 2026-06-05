// modules/automation/data.js — automations: from idea to live, with trigger,
// action and the value they free up.

import { AutomationStatus } from '../../core/schema.js';

export const automations = [
  {
    id: 'aut-weekly-report', title: 'Weekly report assembly', status: AutomationStatus.BUILDING,
    trigger: 'Every Friday 09:00, per active client.',
    action: 'Agent gathers metrics, drafts the report from the template, routes to the account manager for approval.',
    tools: ['Computer-use agent', 'Report template', 'Approval step'],
    value: 'Saves ~3h/week per account manager; tied to the W23 experiment.',
  },
  {
    id: 'aut-lead-intake', title: 'Lead intake & routing', status: AutomationStatus.IDEA,
    trigger: 'New form submission or inbound email.',
    action: 'Parse the lead, score it against the fit checklist, create a CRM record and notify sales for hot/warm.',
    tools: ['Form', 'CRM', 'Scoring prompt'],
    value: 'Faster first response; no lead falls through the cracks.',
  },
  {
    id: 'aut-onboarding-kit', title: 'Onboarding kit generator', status: AutomationStatus.IDEA,
    trigger: 'Contract marked as signed.',
    action: 'Create the client folder from template, send the welcome email and schedule the kickoff.',
    tools: ['Drive template', 'Email', 'Calendar'],
    value: 'Cuts onboarding setup from hours to minutes; consistent every time.',
  },
  {
    id: 'aut-invoice-reminders', title: 'Invoice reminders', status: AutomationStatus.LIVE,
    trigger: 'Invoice unpaid on day 7 and day 14.',
    action: 'Send the friendly reminder template; flag finance if still unpaid after day 14.',
    tools: ['Accounting tool', 'Email template'],
    value: 'Improves cash flow; removes manual chasing.',
  },
];
