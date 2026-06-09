// lib/lead-export.ts — Übergabe der Radar-Leads an die (externe) Sales-App.
//
// ENTKOPPLUNG (wichtig): Diese Datei kennt WEDER den Server NOCH die Sales-App
// direkt. Sie macht nur drei Dinge:
//   1) mapLeadToContract(): HK-Lead  ->  festes Contract-Format
//   2) sendLead():          gibt einen Contract-Lead an die "Senke" (Stub/Webhook)
//   3) exportLeads():       filtert ein Suchergebnis nach Kriterien und sendet
//
// Die ECHTE Übergabe steckt ausschließlich in sendLead(). Solange keine
// LEAD_SINK_URL gesetzt ist, läuft alles lokal (Log) — die HK-App bleibt also
// unabhängig vom Server und von der Sales-App lauffähig und testbar.

import type { Lead, LeadSearchResult, Service } from "./leads";

/** Festes Übergabe-Format ("Lead-Contract"), das die Sales-App konsumiert. */
export type LeadContract = {
  lead_id: string;
  timestamp: string; // ISO 8601
  source: "hk-app-radar";
  status: "neu" | "qualifiziert" | "uebergeben";
  area: string; // Suchort
  category: string; // Branche (Label)
  company: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
  };
  signale: {
    score: number; // 0–3 (Anzahl erkannter Lücken)
    priority: "A" | "B" | "C";
    hot: boolean;
    gaps: string[]; // erkannte Lücken (Belege)
    reason: string;
  };
  services: Service[]; // passende HK-Leistungen
  meta?: { raw?: unknown };
};

/** Stabile, wiederholbare ID aus Name + Adresse (kein Duplikat bei Re-Export). */
function leadId(lead: Lead): string {
  const base = `${lead.name}|${lead.address}`.toLowerCase().trim();
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) | 0;
  return "hk_" + (h >>> 0).toString(36);
}

/** HK-Lead -> Contract. Reine Abbildung, keine Seiteneffekte. */
export function mapLeadToContract(lead: Lead, ctx: { area: string; category: string }): LeadContract {
  return {
    lead_id: leadId(lead),
    timestamp: new Date().toISOString(),
    source: "hk-app-radar",
    status: lead.hot ? "qualifiziert" : "neu",
    area: ctx.area,
    category: ctx.category,
    company: {
      name: lead.name,
      address: lead.address,
      phone: lead.phone,
      email: lead.email,
      website: lead.website,
      instagram: lead.instagram,
      facebook: lead.facebook,
    },
    signale: {
      score: lead.score,
      priority: lead.priority,
      hot: lead.hot,
      gaps: lead.gaps,
      reason: lead.reason,
    },
    services: lead.services,
    meta: { raw: lead },
  };
}

/** Die EINZIGE Stelle mit "Außenwelt". Default = Stub (Log).
 *  Sobald LEAD_SINK_URL gesetzt ist, wird der Lead dorthin gePOSTet. */
export async function sendLead(contract: LeadContract): Promise<{ ok: boolean; via: string }> {
  const url = process.env.LEAD_SINK_URL;
  if (!url) {
    // Stub: kein Server, keine Sales-App nötig — nur sichtbar machen.
    console.log("[lead-export] (stub) LEAD →", JSON.stringify(contract));
    return { ok: true, via: "stub" };
  }
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.LEAD_SINK_TOKEN ? { Authorization: `Bearer ${process.env.LEAD_SINK_TOKEN}` } : {}),
    },
    body: JSON.stringify(contract),
  });
  if (!res.ok) throw new Error(`Lead-Sink HTTP ${res.status}`);
  return { ok: true, via: "webhook" };
}

/** Suchergebnis -> nur "perfekte" Leads filtern und übergeben.
 *  minPriority: "A" = nur heißeste, "B" = A+B, "C" = alle. */
export async function exportLeads(
  result: LeadSearchResult,
  ctx: { category: string },
  opts: { minPriority?: "A" | "B" | "C"; onlyHot?: boolean } = {},
): Promise<{ sent: number; skipped: number; ids: string[] }> {
  const rank = { A: 3, B: 2, C: 1 } as const;
  const min = rank[opts.minPriority ?? "B"]; // Standard: A + B
  const ids: string[] = [];
  let skipped = 0;
  for (const lead of result.leads) {
    const passesPriority = rank[lead.priority] >= min;
    const passesHot = opts.onlyHot ? lead.hot : true;
    if (!passesPriority || !passesHot) {
      skipped++;
      continue;
    }
    const contract = mapLeadToContract(lead, { area: result.area, category: ctx.category });
    await sendLead(contract);
    ids.push(contract.lead_id);
  }
  return { sent: ids.length, skipped, ids };
}
