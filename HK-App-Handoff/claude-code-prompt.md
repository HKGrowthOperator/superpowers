# PROMPT FÜR CLAUDE CODE (in Luis' HK-App-Session pasten)

Du arbeitest an der "HK-App" — Next.js/TypeScript, mit Lead-Radar in
`web/lib/leads.ts` (searchLeads() → Lead[], Quelle OpenStreetMap/Overpass).
Wir machen genau da weiter, wo wir vor der Pause waren. Im Repo liegt der Ordner
`HK-App-Handoff/` mit: lead-contract.schema.json, lead-example.json,
INTEGRATION.md und lib/lead-export.ts. Lies INTEGRATION.md zuerst.

## AUFGABE
Die Radar-Leads sollen an die (externe) Sales-App übergeben werden — entkoppelt,
ohne dass die HK-App vom Server oder der Sales-App abhängig wird.

1. Kopiere `HK-App-Handoff/lib/lead-export.ts` nach `web/lib/lead-export.ts`.
   (Importiert die echten Typen aus ./leads, ist getypt verifiziert.)
2. Lege die Export-Route an: `web/app/api/leads/export/route.ts`
   (fertiges Snippet in INTEGRATION.md, "Option 1").
3. Verifiziere mit `npx tsc --noEmit`, dass alles kompiliert.
4. Teste im STUB-Modus (KEINE Env-Var LEAD_SINK_URL setzen): Suche/Export
   auslösen → die Leads erscheinen als "[lead-export] (stub) LEAD → {...}"
   im Server-Log. Das beweist, dass die Pipeline lokal läuft.

## ENTKOPPLUNG — NICHT ANFASSEN
- Implementiere KEINE echte Server-Anbindung, kein Deployment, keine Sales-App.
  Die einzige Außen-Stelle ist sendLead() in lead-export.ts; die echte Übergabe
  wird später NUR über die Env-Var LEAD_SINK_URL angebunden.
- Lass das bestehende Radar/Such-Verhalten unverändert.

## KRITERIEN (stehen schon im Code)
score = Anzahl Lücken (keine Website/Social/E-Mail), hot = score>=2 || keine
Website, priority A/B/C. exportLeads(...) gibt per Default A+B weiter
(minPriority "B"). Anpassbar: "A" = nur heißeste, "C" = alle.

## DANACH
Normal an den offenen App-Punkten weiterarbeiten. Frag nach, wenn unklar ist,
WIE der Export ausgelöst werden soll (API-Route vs. Button im Radar).
