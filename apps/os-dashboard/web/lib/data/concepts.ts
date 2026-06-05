// lib/data/concepts.ts — offers, strategies and campaigns in development.
import type { Concept } from "./types";

export const concepts: Concept[] = [
  { id: "con-compliance-tier", title: "Compliance-ready assistant tier", type: "offer", status: "draft", summary: "A premium delivery tier for EU clients: AI disclosure, audit logging and a documented escalation path.", value: "Higher margin + a clear answer to the #1 legal/compliance objection.", steps: ["Package the AI delivery checklist as a fixed deliverable.", "Define pricing as an add-on tier.", "Pitch to Brandt & Partner and Helios."] },
  { id: "con-automation-retainer", title: "Back-office automation retainer", type: "offer", status: "idea", summary: "Recurring retainer that automates a client's repetitive ops behind human approval.", value: "Predictable recurring revenue; deepens client lock-in via saved hours.", steps: ["Audit top 3 repetitive workflows.", "Automate one as a paid pilot.", "Convert pilot to retainer."] },
  { id: "con-voice-reception", title: "AI phone reception service", type: "offer", status: "idea", summary: "24/7 inbound call qualification and routing for SMBs, with human escalation.", value: "New service line; differentiates us from pure-marketing agencies.", steps: ["Validate latency + compliance in the W21 pilot.", "Define the qualify-and-route script.", "Launch with Nordwind."] },
  { id: "con-winback-campaign", title: "Lighter-package win-back", type: "campaign", status: "ready", summary: "Targeted win-back for churned price-sensitive clients with a stripped-down package.", value: "Recovers revenue from warm, already-educated prospects at low CAC.", steps: ["Define the lighter package and price.", "Build a 3-touch sequence.", "Start with Sonnig Reisen."] },
];
