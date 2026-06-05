// modules/customer-service/data.js — clients and reusable response templates.

import { ClientStatus, Channel } from '../../core/schema.js';

export const clients = [
  { id: 'cli-nordwind', name: 'Nordwind GmbH', contact: 'a.berg@nordwind.de', status: ClientStatus.ACTIVE, since: '2025-11-03', notes: 'Retainer: reporting + paid social. Wants an AI phone-reception pilot.', tags: ['retainer', 'voice-pilot'] },
  { id: 'cli-helios', name: 'Helios Praxis', contact: 'office@helios-praxis.de', status: ClientStatus.LEAD, since: '2026-05-18', notes: 'Health sector — needs privacy-first / on-prem. Discovery call booked.', tags: ['health', 'on-prem'] },
  { id: 'cli-brandt', name: 'Brandt & Partner', contact: 'kontakt@brandt-partner.de', status: ClientStatus.ACTIVE, since: '2025-08-12', notes: 'Legal. Compliance-ready assistant tier candidate.', tags: ['legal', 'compliance'] },
  { id: 'cli-makelei', name: 'Mäkelei Handwerk', contact: 'info@maekelei.de', status: ClientStatus.PAUSED, since: '2025-06-01', notes: 'Paused over summer; revisit automation retainer in Q3.', tags: ['trades', 'automation'] },
  { id: 'cli-sonnig', name: 'Sonnig Reisen', contact: 'service@sonnig-reisen.de', status: ClientStatus.CHURNED, since: '2025-02-20', notes: 'Churned on price. Possible win-back with a lighter package.', tags: ['win-back'] },
];

export const templates = [
  { id: 'tpl-welcome', title: 'Welcome & intake', channel: Channel.EMAIL, category: 'Onboarding',
    body: 'Hallo {{Name}},\n\nherzlich willkommen! Wir freuen uns auf die Zusammenarbeit. Damit wir optimal starten, füllen Sie bitte das kurze Intake-Formular aus: {{Link}}.\n\nUnseren Kickoff-Termin schlage ich für {{Datum}} vor.\n\nBeste Grüße\n{{AbsenderIn}}' },
  { id: 'tpl-ack', title: 'Request acknowledgement', channel: Channel.EMAIL, category: 'Support',
    body: 'Hallo {{Name}},\n\nvielen Dank für Ihre Nachricht — wir haben sie erhalten und melden uns bis spätestens {{Frist}} mit einer Lösung oder den nächsten Schritten.\n\nBeste Grüße\n{{AbsenderIn}}' },
  { id: 'tpl-followup', title: 'Discovery follow-up', channel: Channel.EMAIL, category: 'Sales',
    body: 'Hallo {{Name}},\n\ndanke für das gute Gespräch! Wie besprochen sende ich Ihnen {{Anlage}}. Passt ein kurzer Folgetermin am {{Datum}}?\n\nBeste Grüße\n{{AbsenderIn}}' },
  { id: 'tpl-ai-disclosure', title: 'AI disclosure note', channel: Channel.CHAT, category: 'Compliance',
    body: 'Hinweis: Sie chatten mit einem KI-Assistenten. Auf Wunsch verbinde ich Sie jederzeit mit einem Menschen.' },
  { id: 'tpl-invoice-reminder', title: 'Friendly invoice reminder', channel: Channel.EMAIL, category: 'Admin',
    body: 'Hallo {{Name}},\n\neine freundliche Erinnerung an die offene Rechnung {{Nummer}} (fällig am {{Datum}}). Falls bereits überwiesen, betrachten Sie diese Nachricht als gegenstandslos.\n\nBeste Grüße\n{{AbsenderIn}}' },
];
