# PROMPT FÜR CLAUDE CODE (Luis pastet das in seine Session)

Du arbeitest an der "HK-App" (mit integriertem Lead-Radar). Das ist MEIN Projekt.
Wir machen genau da weiter, wo wir vor der Unterbrechung waren. Im Repo liegt ein
Ordner "handoff-kit" mit: lead-contract.schema.json, lead-example.json,
INTEGRATION.md. Lies die zuerst, dann arbeite normal an der App weiter.

## WORAN ICH ARBEITE (mein Stand vor der Pause)
- App: HK-App mit integriertem Radar, das qualifizierte Leads findet.
- Zuletzt gebaut: [HIER kurz reinschreiben, was zuletzt gemacht wurde].
- Tech-Stack: [HIER eintragen, falls nicht aus dem Repo ersichtlich].

## NEU DAZUGEKOMMEN (bitte einbauen)
Leads aus dem Radar sollen im festen Format aus `lead-contract.schema.json`
ausgegeben und an eine Adapter-Funktion `sendLead(lead)` übergeben werden.
Die Schritte (mapToLead → istQualifiziert → validateLead → sendLead) stehen
als Pseudocode in `INTEGRATION.md` — übersetze sie in unsere Sprache.

## WICHTIG — ENTKOPPLUNG (damit ich unabhängig weiterarbeiten kann)
1. SERVER/INFRA = NICHT mein Thema. `sendLead()` bleibt ein STUB (loggt +
   schreibt Datei). KEINE echte Server-Anbindung, Auth oder Deployment.
2. LEAD-EMPFÄNGER / anderes Radar = NICHT mein Thema. Ich liefere nur den
   Lead im Vertragsformat an `sendLead()`. Keine Annahmen über das Zielsystem.
3. Mein Fokus = HK-App + Radar: Leads finden, nach Kriterien filtern, ins
   Contract-Format bringen, an `sendLead()` geben. Alles lokal lauffähig/testbar.

## LEAD-KRITERIEN
[HIER eintragen, oder mit mir zusammen definieren.]
- Mindest-Score "qualifiziert": [z.B. 70]

## DEINE AUFGABE JETZT
1. Überblick über das bestehende Repo / meinen Code verschaffen.
2. mapToLead/istQualifiziert/validateLead/sendLead aus INTEGRATION.md umsetzen.
3. sendLead() als Stub (Log + Datei in z.B. leads_out/).
4. Mit dem Beispiel-Lead (lead-example.json) testen, dass die Pipeline läuft —
   OHNE Server, OHNE externes Radar.
5. Danach: normal an den offenen App-Punkten weiterarbeiten.

Frag nach, wenn dir für [Arbeitsstand] oder [Lead-Kriterien] Infos fehlen.
