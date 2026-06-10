# Onboarding-E-Mail-Sequenz (B2B) — 6 Stufen

Nachgebaut aus dem System in den Screenshots (mat_aleixo). Jede Stufe = eine HTML-E-Mail,
die durch einen Status-Wechsel ausgelöst wird. Alle Vorlagen sind E-Mail-sicher
(Tabellen-Layout, Inline-CSS, max. 600px) und funktionieren in Gmail, Outlook, Apple Mail.

## Die 6 E-Mails

| Datei | Stufe | Auslöser (Trigger) |
|---|---|---|
| `01-vereinbarung.html` | Vereinbarung unterschreiben | Lead-Status → **Gewonnen** |
| `02-rechnung-zahlung.html` | Rechnung + Zahlungslink | Vereinbarung unterschrieben |
| `03-willkommen.html` | Willkommen + nächste Schritte | Zahlung erhalten |
| `04-portal-zugang.html` | Portal-Zugang | Portal-Account erstellt |
| `05-kickoff.html` | Kickoff-Termin | Termin vereinbart *(Screenshot fehlte — Lücke logisch gefüllt)* |
| `06-erstes-update.html` | Erstes Update (Momentum) | 24–48 h nach Zahlung/Kickoff |

## Platzhalter (Merge-Felder)

Alle Vorlagen nutzen `{{FELD}}`-Platzhalter, die n8n / der App-Mailer beim Versand ersetzt:

- `{{FIRMA}}` · `{{ABSENDER_NAME}}` · `{{ANSPRECHPARTNER}}`
- `{{KUNDE_NAME}}` · `{{PROJEKT_NAME}}`
- `{{AGREEMENT_LINK}}` · `{{ZAHLUNGSLINK}}` · `{{PORTAL_LINK}}` · `{{KICKOFF_LINK}}`
- `{{BETRAG}}` · `{{IBAN}}` · `{{KONTOINHABER}}` · `{{VERWENDUNGSZWECK}}`
- `{{LOGIN_EMAIL}}` · `{{KICKOFF_DATUM}}` · `{{UPDATE_TEXT}}` · `{{NAECHSTER_SCHRITT}}`

## Farben anpassen

In jeder Datei zwei Werte suchen & ersetzen:
- Header-Dunkel: `#14151a`
- Akzent (Buttons): `#4f46e5`

## So wird daraus „automatisch E-Mails rausbringen"

1. **In der App:** Jeder Onboarding-Schritt hat einen Status. Wechselt er, feuert ein Event.
2. **n8n-Webhook** empfängt das Event (Kunde-ID, Schritt, Links).
3. n8n lädt die passende HTML-Vorlage, ersetzt die `{{Felder}}`, versendet per SMTP/Resend.
4. Status in der App wird auf „E-Mail versendet" gesetzt → erscheint im Portal-Timeline.

Diese Anschlusspunkte (Event + Webhook) baue ich in das Onboarding-Modul ein,
sobald die App-ZIP wieder da ist. Aktivieren kannst du den Auto-Versand dann mit n8n.
