# Angebot: AI Lead Qualification System

**Anbieter:** HK Growth Operator · **Stand:** Juni 2026
*Internes Verkaufsdokument — Textbausteine für Angebote, Landingpage und Verkaufsgespräche.*

---

## Zielgruppe

Kleine und mittelständische Unternehmen mit regelmäßigen Kundenanfragen (ab ca. 20 Anfragen/Monat), insbesondere: Handwerksbetriebe, Autohäuser & Werkstätten, Agenturen, lokale Dienstleister (Praxen, Kanzleien, Studios), Online-Shops mit B2B-Anteil.

**Idealer Kunde:** hat mehrere Eingangskanäle, mindestens eine Person im Vertrieb/Innendienst — und das Gefühl, dass "da Anfragen durchrutschen".

## Pain Points (so im Gespräch ansprechen)

| Pain | Gesprächseinstieg |
|------|-------------------|
| Verlorene Anfragen | "Wissen Sie sicher, dass letzte Woche jede Anfrage beantwortet wurde — auch die per WhatsApp?" |
| Langsame Rückmeldung | "Wer zuerst antwortet, bekommt den Auftrag. Wie schnell antworten Sie heute im Schnitt — und wie schnell Ihr schnellster Wettbewerber?" |
| Kein Überblick | "Wenn ich Sie jetzt frage: Wie viele offene Anfragen haben Sie gerade? Können Sie das in 30 Sekunden beantworten?" |
| Keine Priorisierung | "Der 20.000-Euro-Interessent und der Preisvergleicher bekommen bei den meisten dieselbe Antwort — nur leider beide zu spät." |
| Zu viel manuelle Kommunikation | "Wie viel Zeit kostet es Sie pro Woche, auf immer gleiche Anfragen immer wieder neu zu antworten?" |

---

## Paket 1 — Basic Lead System

**Beschreibung:** Der Einstieg: Alle Anfragen des wichtigsten Kanals landen strukturiert an einem Ort, nichts geht mehr verloren, jeder Lead hat einen Status.

**Enthaltene Leistungen**
- Anbindung von 1 Eingangskanal (Kontaktformular ODER E-Mail-Postfach) per Webhook
- Zentrale Lead-Übersicht in Airtable oder Notion (Datenmodell, Status-Pipeline, 3 Views: Neu / In Arbeit / Erledigt)
- Benachrichtigung bei jeder neuen Anfrage (E-Mail oder Slack)
- 3 Antwort-Textvorlagen für die häufigsten Anfragetypen
- 60 Minuten Einweisung + Kurzdoku

**Preisrahmen:** 1.500–2.500 € einmalig
**Lieferzeit:** 5 Werktage
**Ergebnis für den Kunden:** Keine verlorene Anfrage mehr, kompletter Überblick auf einen Blick, Antwortzeit halbiert.

**Verkaufsargumente**
- "Eine einzige gerettete Anfrage zahlt das System." (beim Handwerker: ein Auftrag ≈ 2.000–10.000 €)
- Kein Software-Abo, keine laufenden Kosten — das System gehört dem Kunden
- In einer Woche live, kein IT-Projekt
- Natürlicher Einstieg: Wer Paket 1 nutzt, sieht selbst, dass die Priorisierung fehlt → Upgrade-Pfad zu Paket 2

---

## Paket 2 — AI Lead Qualification System ⭐ (Kernprodukt)

**Beschreibung:** Das volle System aus diesem Repo: Jede Anfrage wird von KI analysiert, kategorisiert, mit 0–100 Punkten bewertet und in einen konkreten nächsten Schritt übersetzt — inklusive fertigem Antwortentwurf und Hot-Lead-Alarm.

**Enthaltene Leistungen**
- Alles aus Paket 1, plus:
- Anbindung von bis zu 3 Eingangskanälen (z. B. Formular + E-Mail + WhatsApp/DM)
- KI-Analyse jeder Anfrage: Anliegen, Kategorie, Budget, Dringlichkeit, fehlende Infos (auf Branche und Leistungen des Kunden trainierte Prompts)
- Lead-Scoring 0–100 mit nachvollziehbarer Begründung, Temperatur 🔥/🌤/❄️
- Hot-Lead-Alarm: Slack/SMS innerhalb 1 Minute mit Vertriebs-Kurzbriefing
- Persönlicher Antwortentwurf je Anfrage — in der Tonalität des Kunden, zur 1-Klick-Freigabe
- Abnahme-Test mit echten Anfragen des Kunden (Checkliste aus `tests/lead-tests.md`)
- 2 × 60 Minuten Team-Schulung + Dokumentation

**Preisrahmen:** 3.500–6.500 € einmalig (je nach Kanälen/Integrationstiefe) · optional Wartung 150–300 €/Monat (Prompt-Pflege, API-Kosten, kleine Anpassungen)
**Lieferzeit:** 2–3 Wochen
**Ergebnis für den Kunden:** Antwort auf jede Anfrage am selben Tag, heiße Leads in unter 2 Stunden am Telefon, Vertrieb arbeitet nur noch die richtige Reihenfolge ab.

**Verkaufsargumente**
- "Ihr bester Vertriebsmitarbeiter liest ab sofort JEDE Anfrage zuerst — für unter 5 € API-Kosten im Monat."
- Score ist begründet, nicht Blackbox: Jede Bewertung zeigt, WARUM ("Budget genannt, Deadline in 6 Wochen, Entscheider schreibt selbst")
- Antwortentwürfe klingen nach dem Kunden, nicht nach ChatGPT — und nichts geht ohne Freigabe raus (Kontrollargument!)
- Rechenbeispiel fürs Gespräch: 50 Anfragen/Monat, 10 % mehr Abschluss durch schnellere Reaktion = bei 3.000 € Auftragswert +15.000 €/Monat Pipeline
- Referenz-Demo in 10 Minuten zeigbar (`node src/run-demo.js` mit Branchendaten des Interessenten)

---

## Paket 3 — Sales Automation Retainer

**Beschreibung:** Laufende Partnerschaft: Das System wächst monatlich weiter — Follow-up-Automation, neue Kanäle, Reporting, Optimierung anhand echter Daten. Für Kunden, die Vertrieb als System begreifen.

**Enthaltene Leistungen**
- Betrieb, Monitoring und Pflege des kompletten Systems (inkl. API-Kosten)
- Follow-up-Engine: automatische Wiedervorlagen nach 2/5/10 Tagen mit vorbereiteten Nachfass-Entwürfen
- Monatliches Reporting: Leads pro Kanal, Conversion pro Temperatur, Antwortzeiten, verlorene Gründe
- 1 neue Automation pro Monat (z. B. Kalender-Anbindung, Angebots-Nachverfolgung, Bewertungs-Anfragen nach Abschluss, Reaktivierung alter Leads)
- Quartalsweise Prompt-Optimierung anhand der realen Anfragen
- Prioritäts-Support (Reaktion < 4 h werktags)

**Preisrahmen:** 750–1.500 €/Monat (Mindestlaufzeit 3 Monate) + einmalig 2.500 € Setup, falls Paket 2 noch nicht besteht
**Lieferzeit:** Start innerhalb 1 Woche nach Paket 2
**Ergebnis für den Kunden:** Vertriebsprozess, der jeden Monat messbar besser wird — ohne eigene IT, ohne eigenes Zutun.

**Verkaufsargumente**
- "Sie stellen keinen Vertriebsassistenten für 3.500 €/Monat ein — Sie buchen das System für die Hälfte."
- Reporting macht den Wert sichtbar: Der Kunde SIEHT jeden Monat, was das System gerettet hat (bestes Argument gegen Kündigung)
- Planbarer Agentur-Umsatz: 10 Retainer-Kunden = 7.500–15.000 € MRR
- Exit-Fairness als Abschlussargument: System gehört dem Kunden, auch bei Kündigung — kein Lock-in, das senkt die Einstiegshürde

---

## Einwand-Behandlung (Kurzform)

| Einwand | Antwort |
|---------|---------|
| "KI antwortet unpersönlich" | "Deshalb antwortet bei uns keine KI — sie schreibt nur den Entwurf vor. Senden tut immer ein Mensch, nach Freigabe." |
| "Datenschutz?" | "AV-Vertrag mit dem KI-Anbieter, keine Daten fürs Training, Datenminimierung — bekommen Sie schriftlich dokumentiert." |
| "Zu teuer" | Rechenbeispiel aus Paket 2 rechnen — dann kostet NICHT-Handeln mehr als das System. |
| "Wir haben schon ein CRM" | "Perfekt — wir bauen die Qualifizierung davor. Das CRM bekommt bessere Daten, Sie müssen nichts wechseln." |
