// lib/data/websites.ts — client websites and their build status.
import type { Website } from "./types";

export const websites: Website[] = [
  { id: "web-nordwind", name: "Nordwind — corporate site", client: "Nordwind GmbH", status: "live", url: "https://nordwind.example", stack: "Static + CMS", notes: "Quarterly content refresh due in July." },
  { id: "web-helios", name: "Helios Praxis — landing page", client: "Helios Praxis", status: "building", url: "", stack: "Static", notes: "Privacy-first; no third-party trackers. Awaiting copy." },
  { id: "web-brandt", name: "Brandt & Partner — relaunch", client: "Brandt & Partner", status: "planned", url: "", stack: "TBD", notes: "Scope workshop scheduled. Accessibility is a hard requirement." },
  { id: "web-maekelei", name: "Mäkelei — one-pager", client: "Mäkelei Handwerk", status: "maintenance", url: "https://maekelei.example", stack: "Static", notes: "Minimal upkeep while client is paused." },
];
