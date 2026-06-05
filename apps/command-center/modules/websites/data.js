// modules/websites/data.js — client websites and their build status.

import { WebsiteStatus } from '../../core/schema.js';

export const websites = [
  { id: 'web-nordwind', name: 'Nordwind — corporate site', client: 'Nordwind GmbH', status: WebsiteStatus.LIVE, url: 'https://nordwind.example', stack: 'Static + CMS', notes: 'Quarterly content refresh due in July.' },
  { id: 'web-helios', name: 'Helios Praxis — landing page', client: 'Helios Praxis', status: WebsiteStatus.BUILDING, url: '', stack: 'Static', notes: 'Privacy-first; no third-party trackers. Awaiting copy.' },
  { id: 'web-brandt', name: 'Brandt & Partner — relaunch', client: 'Brandt & Partner', status: WebsiteStatus.PLANNED, url: '', stack: 'TBD', notes: 'Scope workshop scheduled. Accessibility is a hard requirement.' },
  { id: 'web-maekelei', name: 'Mäkelei — one-pager', client: 'Mäkelei Handwerk', status: WebsiteStatus.MAINTENANCE, url: 'https://maekelei.example', stack: 'Static', notes: 'Minimal upkeep while client is paused.' },
];
