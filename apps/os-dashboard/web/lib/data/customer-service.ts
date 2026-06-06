// lib/data/customer-service.ts — Kunden und wiederverwendbare Antwortvorlagen.
import type { Client, Template } from "./types";

export const clients: Client[] = [
  { id: "cli-nordwind", name: "Nordwind GmbH", contact: "a.berg@nordwind.de", status: "aktiv", since: "2025-11-03", notes: "Retainer: Reporting + Paid Social. Möchte einen KI-Telefonempfang-Piloten.", tags: ["retainer", "voice-pilot"] },
  { id: "cli-helios", name: "Helios Praxis", contact: "office@helios-praxis.de", status: "Interessent", since: "2026-05-18", notes: "Gesundheitssektor — braucht datenschutz-first / On-Prem. Erstgespräch gebucht.", tags: ["gesundheit", "on-prem"] },
  { id: "cli-brandt", name: "Brandt & Partner", contact: "kontakt@brandt-partner.de", status: "aktiv", since: "2025-08-12", notes: "Recht. Kandidat für die Compliance-fertige Assistenten-Stufe.", tags: ["recht", "compliance"] },
  { id: "cli-makelei", name: "Mäkelei Handwerk", contact: "info@maekelei.de", status: "pausiert", since: "2025-06-01", notes: "Über den Sommer pausiert; Automations-Retainer in Q3 wieder aufgreifen.", tags: ["handwerk", "automation"] },
  { id: "cli-sonnig", name: "Sonnig Reisen", contact: "service@sonnig-reisen.de", status: "verloren", since: "2025-02-20", notes: "Wegen Preis abgesprungen. Rückgewinnung mit leichterem Paket möglich.", tags: ["rückgewinnung"] },
];

export const templates: Template[] = [
  { id: "tpl-welcome", title: "Willkommen & Aufnahme", channel: "E-Mail", category: "Onboarding", body: "Hallo {{Name}},\n\nherzlich willkommen! Wir freuen uns auf die Zusammenarbeit. Damit wir optimal starten, füllen Sie bitte das kurze Aufnahmeformular aus: {{Link}}.\n\nUnseren Kickoff-Termin schlage ich für {{Datum}} vor.\n\nBeste Grüße\n{{AbsenderIn}}" },
  { id: "tpl-ack", title: "Eingangsbestätigung", channel: "E-Mail", category: "Support", body: "Hallo {{Name}},\n\nvielen Dank für Ihre Nachricht — wir haben sie erhalten und melden uns bis spätestens {{Frist}} mit einer Lösung oder den nächsten Schritten.\n\nBeste Grüße\n{{AbsenderIn}}" },
  { id: "tpl-followup", title: "Nachfass nach Erstgespräch", channel: "E-Mail", category: "Vertrieb", body: "Hallo {{Name}},\n\ndanke für das gute Gespräch! Wie besprochen sende ich Ihnen {{Anlage}}. Passt ein kurzer Folgetermin am {{Datum}}?\n\nBeste Grüße\n{{AbsenderIn}}" },
  { id: "tpl-ai-disclosure", title: "KI-Offenlegungshinweis", channel: "Chat", category: "Compliance", body: "Hinweis: Sie chatten mit einem KI-Assistenten. Auf Wunsch verbinde ich Sie jederzeit mit einem Menschen." },
  { id: "tpl-invoice-reminder", title: "Freundliche Zahlungserinnerung", channel: "E-Mail", category: "Verwaltung", body: "Hallo {{Name}},\n\neine freundliche Erinnerung an die offene Rechnung {{Nummer}} (fällig am {{Datum}}). Falls bereits überwiesen, betrachten Sie diese Nachricht als gegenstandslos.\n\nBeste Grüße\n{{AbsenderIn}}" },
];
