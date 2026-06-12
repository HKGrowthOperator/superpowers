import { NextResponse } from "next/server";
import { withOfferSystem } from "@/lib/smart-offer";
import { createFromOffer } from "@/lib/onboarding";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function errorResponse(err: unknown) {
  const e = err as { status?: number; message?: string };
  return NextResponse.json({ error: e.message ?? "Fehler" }, { status: e.status ?? 500 });
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  try {
    return await withOfferSystem((sos) => {
      if (id) return NextResponse.json(sos.getOffer(id));
      const s = sos.stats();
      return NextResponse.json({
        stats: s.stats,
        offeneAufgaben: s.offeneAufgaben,
        outboxEntwuerfe: s.outboxEntwuerfe,
        offers: sos.listOffers(),
        outbox: sos.listOutbox(),
        tasks: sos.listTasks(),
      });
    });
  } catch (err) {
    return errorResponse(err);
  }
}

type Body = {
  action?: string;
  id?: string;
  status?: string;
  patch?: Record<string, unknown>;
  firma?: string;
  ansprechpartner?: string;
  email?: string;
  telefon?: string;
  quelle?: string;
  beschreibung?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;
  try {
    switch (body.action) {
      case "createLead": {
        const offer = await withOfferSystem((sos) =>
          sos.createLead({
            firma: body.firma,
            ansprechpartner: body.ansprechpartner,
            email: body.email,
            telefon: body.telefon,
            quelle: body.quelle,
            beschreibung: body.beschreibung,
          }),
        );
        return NextResponse.json(offer, { status: 201 });
      }
      case "updateOffer": {
        const offer = await withOfferSystem((sos) => sos.updateOffer(String(body.id), body.patch ?? {}));
        return NextResponse.json(offer);
      }
      case "changeStatus": {
        const offer = await withOfferSystem((sos) => sos.changeStatus(String(body.id), String(body.status)));
        // Gewonnenes Angebot startet automatisch das Onboarding (idempotent).
        if (body.status === "gewonnen") {
          await createFromOffer(offer).catch(() => null);
        }
        return NextResponse.json(offer);
      }
      case "completeTask": {
        const task = await withOfferSystem((sos) => sos.completeTask(String(body.id)));
        return NextResponse.json(task);
      }
      case "runFollowUps": {
        const result = await withOfferSystem((sos) => sos.processFollowUps());
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
    }
  } catch (err) {
    return errorResponse(err);
  }
}
