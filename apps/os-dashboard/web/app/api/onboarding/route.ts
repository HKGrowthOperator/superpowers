import { NextResponse } from "next/server";
import { listOnboarding, toggleStep, sendStepEmail, createOnboarding } from "@/lib/onboarding";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({ items: await listOnboarding() });
}

type Body = {
  action?: string;
  id?: string;
  stepKey?: string;
  firma?: string;
  email?: string;
  ansprechpartner?: string;
  projekt?: string;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Body;

  if (body.action === "create") {
    if (!body.firma && !body.projekt) {
      return NextResponse.json({ error: "Firma oder Projekt erforderlich" }, { status: 400 });
    }
    const o = await createOnboarding({
      firma: body.firma ?? "",
      email: body.email,
      ansprechpartner: body.ansprechpartner,
      projekt: body.projekt ?? body.firma ?? "Projekt",
    });
    return NextResponse.json(o, { status: 201 });
  }

  if (body.action === "toggleStep") {
    const o = await toggleStep(String(body.id), String(body.stepKey));
    if (!o) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json(o);
  }

  if (body.action === "sendStepEmail") {
    const res = await sendStepEmail(String(body.id), String(body.stepKey));
    if (!res) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    return NextResponse.json({ onboarding: res.onboarding, result: res.result });
  }

  return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
}
