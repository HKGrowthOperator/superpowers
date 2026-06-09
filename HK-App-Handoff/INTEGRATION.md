# INTEGRATION — HK-App (Next.js/TS) → Sales-App

Die HK-App ist ein **Next.js / TypeScript**-Projekt. Das Radar lebt in
`web/lib/leads.ts` (`searchLeads()` → `Lead[]`, Quelle: OpenStreetMap/Overpass).
Diese Anbindung ist **getypt verifiziert** (kompiliert gegen die echten Typen).

## DER DROP-IN-ADAPTER
Datei: **`lib/lead-export.ts`** → kopieren nach **`web/lib/lead-export.ts`**.
Sie importiert die echten Typen aus `./leads` und macht NUR drei Dinge:

```
mapLeadToContract(lead, {area, category})  // HK-Lead -> festes Contract-Format
sendLead(contract)                         // EINZIGE Außen-Stelle: Stub ODER Webhook
exportLeads(result, {category}, opts)       // filtert "perfekte" Leads + sendet
```

## ENTKOPPLUNG (so bleibt Luis unabhängig)
- **Server/Infra = nicht Luis' Thema.** `sendLead()` ist Default ein **Stub**
  (loggt nur). Erst wenn die Env-Var `LEAD_SINK_URL` gesetzt ist, POSTet er den
  Lead dorthin (optional `LEAD_SINK_TOKEN` als Bearer). Ohne Env läuft alles lokal.
- **Sales-App / anderes Radar = nicht Luis' Thema.** Die HK-App kennt nur das
  Contract-Format, nicht das Zielsystem.

## KRITERIEN ("perfekter Lead") — SCHON IM CODE
Stehen bereits in `lib/leads.ts` und werden hier nur gefiltert:
- `score` = Anzahl Lücken (keine Website / kein Social / keine E-Mail), 0–3
- `hot`   = `score >= 2` ODER keine Website
- `priority`: A (score≥2) · B (score=1) · C (score=0)

`exportLeads(..., { minPriority: "B" })` (Default) gibt **A+B** weiter.
- nur die heißesten: `minPriority: "A"` oder `{ onlyHot: true }`
- alle: `minPriority: "C"`

## WIE AUSLÖSEN (eine Variante wählen)
**Option 1 — neue API-Route** (empfohlen, sauber getrennt):
`web/app/api/leads/export/route.ts`
```ts
import { NextResponse } from "next/server";
import { searchLeads, getCategory } from "@/lib/leads";
import { exportLeads } from "@/lib/lead-export";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { category?: string; place?: string; limit?: number; minPriority?: "A"|"B"|"C" };
  if (!b.category || !b.place?.trim()) return NextResponse.json({ error: "Branche und Ort nötig." }, { status: 400 });
  const result = await searchLeads(b.category, b.place.trim(), Math.min(b.limit ?? 40, 80));
  const out = await exportLeads(result, { category: getCategory(b.category)?.label ?? b.category }, { minPriority: b.minPriority ?? "B" });
  return NextResponse.json(out);
}
```

**Option 2 — bestehende Suche erweitern:** in `web/app/api/leads/search/route.ts`
nach `searchLeads(...)` zusätzlich `await exportLeads(result, { category: getCategory(body.category)?.label ?? body.category })` aufrufen.

**Option 3 — Button im Radar:** in `web/components/lead-radar.tsx` einen
"An Sales-App übergeben"-Button, der die Export-Route (Option 1) ruft.

## TEST (ohne Server, ohne Sales-App)
1. Adapter liegt in `web/lib/lead-export.ts`, Export-Route angelegt (Option 1).
2. `LEAD_SINK_URL` NICHT setzen → Stub-Modus.
3. App starten, Suche/Export auslösen → Leads erscheinen als
   `[lead-export] (stub) LEAD → {...}` im Server-Log. Pipeline läuft.
4. Später: `LEAD_SINK_URL=https://…` setzen → identischer Lead geht real raus.
