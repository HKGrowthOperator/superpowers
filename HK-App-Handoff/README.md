# HANDOFF-KIT — HK-App Lead-Pipeline (REAL, gegen den echten Code gebaut)
Stand 2026-06-09. Die HK-App ist Next.js/TS; das Radar liegt in web/lib/leads.ts.
Dieses Kit ist gegen die echten Typen der App verifiziert (kompiliert sauber).

## INHALT
- `lib/lead-export.ts`        — DROP-IN-Adapter → nach `web/lib/lead-export.ts`.
                                map → filter → sendLead (Stub/Webhook).
- `lead-contract.schema.json` — Das feste Lead-Format (entspricht dem echten Lead).
- `lead-example.json`         — Echter Beispiel-Lead.
- `INTEGRATION.md`            — Anleitung: wohin, wie auslösen, wie testen.
- `claude-code-prompt.md`     — Prompt für Luis' Claude Code.

## ABLAUF (3 Schritte, dann läuft die Pipeline)
1. `lib/lead-export.ts` → `web/lib/lead-export.ts` kopieren.
2. Export-Route `web/app/api/leads/export/route.ts` anlegen
   (Snippet in INTEGRATION.md, Option 1).
3. STUB-Test: OHNE Env-Var LEAD_SINK_URL starten, Export auslösen →
   Leads als "[lead-export] (stub) LEAD → {...}" im Server-Log. Fertig.

## SPÄTER (nicht Luis' Thema, ein Handgriff)
- Echte Übergabe an die Sales-App: nur `LEAD_SINK_URL=https://…` setzen
  (optional `LEAD_SINK_TOKEN`). Derselbe Lead geht dann real raus, statt ins Log.

## KRITERIEN ("perfekter Lead") — schon im Code
score=Anzahl Lücken (keine Website/Social/E-Mail) · hot=score>=2||keine Website
· priority A/B/C. exportLeads() gibt per Default A+B weiter.

So bleibt Luis' Teil eigenständig — unabhängig von Server und Sales-App.
