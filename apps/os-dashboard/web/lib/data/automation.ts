// lib/data/automation.ts — automations from idea to live.
import type { Automation } from "./types";

export const automations: Automation[] = [
  { id: "aut-weekly-report", title: "Weekly report assembly", status: "building", trigger: "Every Friday 09:00, per active client.", action: "Agent gathers metrics, drafts the report from the template, routes to the account manager for approval.", tools: ["Computer-use agent", "Report template", "Approval step"], value: "Saves ~3h/week per account manager; tied to the W23 experiment." },
  { id: "aut-lead-intake", title: "Lead intake & routing", status: "idea", trigger: "New form submission or inbound email.", action: "Parse the lead, score it against the fit checklist, create a CRM record and notify sales for hot/warm.", tools: ["Form", "CRM", "Scoring prompt"], value: "Faster first response; no lead falls through the cracks." },
  { id: "aut-onboarding-kit", title: "Onboarding kit generator", status: "idea", trigger: "Contract marked as signed.", action: "Create the client folder from template, send the welcome email and schedule the kickoff.", tools: ["Drive template", "Email", "Calendar"], value: "Cuts onboarding setup from hours to minutes; consistent every time." },
  { id: "aut-invoice-reminders", title: "Invoice reminders", status: "live", trigger: "Invoice unpaid on day 7 and day 14.", action: "Send the friendly reminder template; flag finance if still unpaid after day 14.", tools: ["Accounting tool", "Email template"], value: "Improves cash flow; removes manual chasing." },
];
