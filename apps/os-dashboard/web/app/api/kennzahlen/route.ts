import { NextResponse } from "next/server";
import { loadRows, prepareDashboardData, interpret, upsertMonth, type MetricRow } from "@/lib/biz-dashboard";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const rows = await loadRows();
  const [interpretation] = [await interpret(rows)];
  return NextResponse.json({ dashboard: prepareDashboardData(rows), interpretation });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { action?: string; row?: MetricRow };
  if (body.action === "upsertMonth" && body.row?.month) {
    await upsertMonth(body.row);
    const rows = await loadRows();
    return NextResponse.json({ dashboard: prepareDashboardData(rows) });
  }
  return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
}
